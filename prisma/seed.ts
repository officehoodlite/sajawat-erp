import { PrismaClient, Unit } from "@prisma/client";

const prisma = new PrismaClient();

const boards = [
  { materialName: "MDF", thicknesses: ["17 MM", "11 MM", "8 MM"] },
  { materialName: "Texture Ply", thicknesses: ["2.5 MM"] },
];

const paintProducts: { name: string; unit: Unit }[] = [
  { name: "BASE BROWN", unit: Unit.LTR },
  { name: "WALLNUT", unit: Unit.LTR },
  { name: "BLACK PAINT", unit: Unit.LTR },
  { name: "PU - WHITE GLOSSY", unit: Unit.LTR },
  { name: "PS - WHITE SURFACER", unit: Unit.LTR },
  { name: "MATT & GLOSSY", unit: Unit.LTR },
  { name: "M - THINNER", unit: Unit.LTR },
  { name: "P - THINNER", unit: Unit.LTR },
  { name: "SANDING SEALER", unit: Unit.LTR },
  { name: "SANDER - 120", unit: Unit.PCS },
  { name: "SANDER - 220", unit: Unit.PCS },
  { name: "SANDER - 320", unit: Unit.PCS },
];

const hardwareProducts: { name: string; unit: Unit }[] = [
  { name: "BAREL", unit: Unit.PCS },
  { name: "BOLT - 40 - mm", unit: Unit.PCS },
  { name: "L - N - KEY", unit: Unit.PCS },
  { name: "HINGES - 3\"", unit: Unit.PCS },
  { name: "HINGES - 2.5\"", unit: Unit.PCS },
  { name: "MAGNET", unit: Unit.PCS },
  { name: "SCREW - 13x4", unit: Unit.PCS },
  { name: "SCREW - 25x6", unit: Unit.PCS },
  { name: "T - NUT", unit: Unit.PCS },
  { name: "WASHER", unit: Unit.PCS },
];

const packingProducts: { name: string; unit: Unit }[] = [
  { name: "CTNS - 78x60 - BED - BOX", unit: Unit.BOX },
  { name: "FOAM", unit: Unit.SHEET },
  { name: "THURAMCOL - 17", unit: Unit.PCS },
  { name: "THURAMCOL - 12", unit: Unit.PCS },
  { name: "THURAMCOL - 8", unit: Unit.PCS },
];

const edgeBindingProducts: { name: string; unit: Unit }[] = [
  { name: "PVC EDGE - 22 MM", unit: Unit.MTR },
  { name: "PVC EDGE - 1 MM", unit: Unit.MTR },
  { name: "PVC EDGE - 0.8 MM", unit: Unit.MTR },
];

async function clearCatalogData() {
  await prisma.productionEntry.deleteMany();
  await prisma.lotWorkerEntry.deleteMany();
  await prisma.lotWorkerRates.deleteMany();
  await prisma.manufacturingBoardEntry.deleteMany();
  await prisma.lotActualBoardEntry.deleteMany();
  await prisma.manufacturingPaintEntry.deleteMany();
  await prisma.manufacturingHardwareEntry.deleteMany();
  await prisma.manufacturingPackingEntry.deleteMany();
  await prisma.manufacturingEdgeBindingEntry.deleteMany();
  await prisma.manufacturingModelEdgeBindingPreset.deleteMany();
  await prisma.productModelEdgeBindingPreset.deleteMany();
  await prisma.paintConsumptionLog.deleteMany();
  await prisma.hardwareConsumptionLog.deleteMany();
  await prisma.packingConsumptionLog.deleteMany();
  await prisma.edgeBindingConsumptionLog.deleteMany();
  await prisma.manufacturingModel.deleteMany();
  await prisma.manufacturingLot.deleteMany();
  await prisma.productModel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.boardInventory.deleteMany();
  await prisma.boardThickness.deleteMany();
  await prisma.board.deleteMany();
  await prisma.paintPurchase.deleteMany();
  await prisma.paintProduct.deleteMany();
  await prisma.hardwarePurchase.deleteMany();
  await prisma.hardwareProduct.deleteMany();
  await prisma.packingPurchase.deleteMany();
  await prisma.packingProduct.deleteMany();
  await prisma.edgeBindingPurchase.deleteMany();
  await prisma.edgeBindingProduct.deleteMany();
  await prisma.supplier.deleteMany();
}

async function seedBoards() {
  for (const board of boards) {
    const created = await prisma.board.create({
      data: { materialName: board.materialName },
    });

    for (const thickness of board.thicknesses) {
      await prisma.boardThickness.create({
        data: { boardId: created.id, thickness },
      });
    }
  }
}

async function seedProducts(
  products: { name: string; unit: Unit }[],
  model: "paint" | "hardware" | "packing" | "edgebinding"
) {
  const openingQty = model === "paint" ? 100 : model === "hardware" ? 500 : 100;
  const purchaseDate = new Date();

  const supplier = await prisma.supplier.upsert({
    where: { name: "Opening Stock" },
    create: { name: "Opening Stock" },
    update: {},
  });

  for (const [index, item] of products.entries()) {
    const data = { name: item.name, unit: item.unit, remainingStock: openingQty };
    const invoice = `SEED-${model.toUpperCase()}-${String(index + 1).padStart(3, "0")}`;

    if (model === "paint") {
      const product = await prisma.paintProduct.create({ data });
      await prisma.paintPurchase.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          invoiceNumber: invoice,
          quantity: openingQty,
          remainingQuantity: openingQty,
          rate: 1,
          purchaseDate,
        },
      });
    } else if (model === "hardware") {
      const product = await prisma.hardwareProduct.create({ data });
      await prisma.hardwarePurchase.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          invoiceNumber: invoice,
          quantity: openingQty,
          remainingQuantity: openingQty,
          rate: 1,
          purchaseDate,
        },
      });
    } else if (model === "edgebinding") {
      const product = await prisma.edgeBindingProduct.create({ data });
      await prisma.edgeBindingPurchase.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          quantity: openingQty,
          remainingQuantity: openingQty,
          rate: 1,
          purchaseDate,
        },
      });
    } else {
      const product = await prisma.packingProduct.create({ data });
      await prisma.packingPurchase.create({
        data: {
          productId: product.id,
          supplierId: supplier.id,
          invoiceNumber: invoice,
          quantity: openingQty,
          remainingQuantity: openingQty,
          rate: 1,
          purchaseDate,
        },
      });
    }
  }
}

async function main() {
  console.log("Seeding database...");

  await clearCatalogData();
  await seedBoards();
  await seedProducts(paintProducts, "paint");
  await seedProducts(hardwareProducts, "hardware");
  await seedProducts(packingProducts, "packing");
  await seedProducts(edgeBindingProducts, "edgebinding");

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
