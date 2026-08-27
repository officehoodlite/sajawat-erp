import { prisma } from "@/lib/prisma";
import { roundDecimal } from "@/lib/decimal";
import { toNumber } from "@/lib/mappers";
import { totalForModelQty } from "@/lib/model-consumption";
import { round2 } from "@/utils/board-calculations";
import type {
  CatalogModelLotSummariesDto,
  ModelLotMaterialLineDto,
  ModelLotSummaryDto,
} from "@/types/dto";

function groupLines(
  items: Array<{ label: string; unit: string; total: number }>,
  quantity: number
): ModelLotMaterialLineDto[] {
  const map = new Map<string, ModelLotMaterialLineDto>();
  for (const item of items) {
    const existing = map.get(item.label);
    if (existing) {
      existing.total = round2(existing.total + item.total);
    } else {
      map.set(item.label, {
        label: item.label,
        unit: item.unit,
        total: item.total,
        perUnit: 0,
      });
    }
  }

  return Array.from(map.values())
    .map((line) => ({
      ...line,
      perUnit: quantity > 0 ? roundDecimal(line.total / quantity) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function findCatalogModelLotSummaries(
  catalogModelId: string
): Promise<CatalogModelLotSummariesDto | null> {
  const catalogModel = await prisma.productModel.findUnique({
    where: { id: catalogModelId },
    include: { product: true },
  });
  if (!catalogModel) return null;

  // Match recent lots by product + model name (catalog identity is name-only).
  const manufacturingModels = await prisma.manufacturingModel.findMany({
    where: {
      productId: catalogModel.productId,
      modelName: catalogModel.modelName,
    },
    include: {
      lot: true,
      boardEntries: {
        include: {
          boardInventory: {
            include: {
              boardThickness: { include: { board: true } },
            },
          },
        },
      },
      paintEntries: { include: { paintProduct: true } },
      hardwareEntries: { include: { hardwareProduct: true } },
      packingEntries: { include: { packingProduct: true } },
      edgeBindingEntries: { include: { edgeBindingProduct: true } },
      glassEntries: { include: { glassProduct: true } },
    },
    orderBy: { lot: { createdAt: "desc" } },
    take: 25,
  });

  const seenLots = new Set<string>();
  const lots: ModelLotSummaryDto[] = [];

  for (const model of manufacturingModels) {
    if (seenLots.has(model.lotId)) continue;
    seenLots.add(model.lotId);
    if (lots.length >= 5) break;

    const qty = model.quantity;

    const boards = groupLines(
      model.boardEntries.map((e) => ({
        label: `${e.boardInventory.boardThickness.board.materialName} ${e.boardInventory.boardThickness.thickness}`,
        unit: "SQFT",
        total: totalForModelQty(toNumber(e.totalSqft), qty),
      })),
      qty
    );

    const paints = groupLines(
      model.paintEntries.map((e) => ({
        label: e.paintProduct.name,
        unit: e.paintProduct.unit,
        total: round2(toNumber(e.quantity)),
      })),
      qty
    );

    const hardware = groupLines(
      model.hardwareEntries.map((e) => ({
        label: e.hardwareProduct.name,
        unit: e.hardwareProduct.unit,
        total: totalForModelQty(toNumber(e.quantity), qty),
      })),
      qty
    );

    const packing = groupLines(
      model.packingEntries.map((e) => ({
        label: e.packingProduct.name,
        unit: e.packingProduct.unit,
        total: round2(toNumber(e.quantity)),
      })),
      qty
    );

    const edgeBinding = groupLines(
      model.edgeBindingEntries.map((e) => ({
        label: e.edgeBindingProduct.name,
        unit: e.edgeBindingProduct.unit,
        total: totalForModelQty(toNumber(e.quantity), qty),
      })),
      qty
    );

    const glass = groupLines(
      model.glassEntries.map((e) => ({
        label: e.glassProduct.name,
        unit: e.glassProduct.unit,
        total: totalForModelQty(toNumber(e.quantity), qty),
      })),
      qty
    );

    lots.push({
      lotId: model.lot.id,
      lotNumber: model.lot.lotNumber,
      status: model.lot.status,
      createdAt: model.lot.createdAt.toISOString(),
      quantity: qty,
      boards,
      paints,
      hardware,
      packing,
      edgeBinding,
      glass,
    });
  }

  return {
    catalogModelId: catalogModel.id,
    productId: catalogModel.productId,
    productName: catalogModel.product.name,
    modelName: catalogModel.modelName,
    lots,
  };
}
