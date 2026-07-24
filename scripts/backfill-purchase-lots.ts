/**
 * Reconciles per-lot remaining quantities using FIFO consumption allocation.
 *
 * Run after migration: npx tsx scripts/backfill-purchase-lots.ts
 */
import { prisma } from "../lib/prisma";
import { roundDecimal } from "../lib/decimal";
import { toNumber } from "../lib/mappers";

function allocateFifoRemaining(
  lots: Array<{ id: string; quantity: number }>,
  totalRemaining: number
): Map<string, number> {
  const result = new Map<string, number>();
  let remainingLeft = roundDecimal(totalRemaining);

  for (const lot of lots) {
    if (remainingLeft <= 0) {
      result.set(lot.id, 0);
      continue;
    }
    const lotRemaining = roundDecimal(Math.min(remainingLeft, lot.quantity));
    result.set(lot.id, lotRemaining);
    remainingLeft = roundDecimal(remainingLeft - lotRemaining);
  }

  return result;
}

async function backfillPaintPurchases() {
  const products = await prisma.paintProduct.findMany({
    include: { purchases: { orderBy: { purchaseDate: "asc" } } },
  });

  for (const product of products) {
    if (product.purchases.length === 0) continue;
    const lots = product.purchases.map((p) => ({ id: p.id, quantity: toNumber(p.quantity) }));
    const productRemaining = roundDecimal(toNumber(product.remainingStock));
    const allocations = allocateFifoRemaining(lots, productRemaining);

    await prisma.$transaction(async (tx) => {
      for (const purchase of product.purchases) {
        await tx.paintPurchase.update({
          where: { id: purchase.id },
          data: { remainingQuantity: allocations.get(purchase.id) ?? 0 },
        });
      }
    });
  }
}

async function backfillHardwarePurchases() {
  const products = await prisma.hardwareProduct.findMany({
    include: { purchases: { orderBy: { purchaseDate: "asc" } } },
  });

  for (const product of products) {
    if (product.purchases.length === 0) continue;
    const lots = product.purchases.map((p) => ({ id: p.id, quantity: toNumber(p.quantity) }));
    const productRemaining = roundDecimal(toNumber(product.remainingStock));
    const allocations = allocateFifoRemaining(lots, productRemaining);

    await prisma.$transaction(async (tx) => {
      for (const purchase of product.purchases) {
        await tx.hardwarePurchase.update({
          where: { id: purchase.id },
          data: { remainingQuantity: allocations.get(purchase.id) ?? 0 },
        });
      }
    });
  }
}

async function backfillPackingPurchases() {
  const products = await prisma.packingProduct.findMany({
    include: { purchases: { orderBy: { purchaseDate: "asc" } } },
  });

  for (const product of products) {
    if (product.purchases.length === 0) continue;
    const lots = product.purchases.map((p) => ({ id: p.id, quantity: toNumber(p.quantity) }));
    const productRemaining = roundDecimal(toNumber(product.remainingStock));
    const allocations = allocateFifoRemaining(lots, productRemaining);

    await prisma.$transaction(async (tx) => {
      for (const purchase of product.purchases) {
        await tx.packingPurchase.update({
          where: { id: purchase.id },
          data: { remainingQuantity: allocations.get(purchase.id) ?? 0 },
        });
      }
    });
  }
}

async function backfillBoardInventory() {
  const thicknesses = await prisma.boardThickness.findMany({
    include: {
      inventories: { orderBy: { purchaseDate: "asc" } },
    },
  });

  for (const thickness of thicknesses) {
    if (thickness.inventories.length === 0) continue;

    const lots = thickness.inventories.map((inv) => ({
      id: inv.id,
      quantity: toNumber(inv.purchaseSqft),
    }));

    const totalRemaining = roundDecimal(
      thickness.inventories.reduce((sum, inv) => sum + toNumber(inv.remainingSqft), 0)
    );
    const allocations = allocateFifoRemaining(lots, totalRemaining);

    await prisma.$transaction(async (tx) => {
      for (const inv of thickness.inventories) {
        await tx.boardInventory.update({
          where: { id: inv.id },
          data: {
            purchaseSqft: toNumber(inv.purchaseSqft),
            remainingSqft: allocations.get(inv.id) ?? 0,
          },
        });
      }
    });
  }
}

async function main() {
  console.log("Backfilling material purchase lots (FIFO)...\n");
  await backfillPaintPurchases();
  await backfillHardwarePurchases();
  await backfillPackingPurchases();

  console.log("\nBackfilling board inventory lots (FIFO)...\n");
  await backfillBoardInventory();

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
