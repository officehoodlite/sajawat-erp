import { prisma } from "@/lib/prisma";
import { roundDecimal } from "@/lib/decimal";
import { toNumber } from "@/lib/mappers";
import { totalForModelQty } from "@/lib/model-consumption";
import { parseCatalogModelName } from "@/lib/model-name";
import { round2 } from "@/utils/board-calculations";
import type {
  ModelLotMaterialLineDto,
  ProductSummaryDto,
  ProductSummaryLotOptionDto,
  ProductSummaryRowDto,
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

export async function findProductSummary(
  productId: string,
  lotIds: string[]
): Promise<ProductSummaryDto | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true },
  });
  if (!product) return null;

  const manufacturingModels = await prisma.manufacturingModel.findMany({
    where: { productId },
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
    orderBy: [{ lot: { createdAt: "desc" } }, { modelName: "asc" }],
  });

  const lotOptions = new Map<string, ProductSummaryLotOptionDto>();
  for (const model of manufacturingModels) {
    if (lotOptions.has(model.lot.id)) continue;
    lotOptions.set(model.lot.id, {
      lotId: model.lot.id,
      lotNumber: model.lot.lotNumber,
    });
  }

  const selected = new Set(lotIds);
  const rows: ProductSummaryRowDto[] = [];

  for (const model of manufacturingModels) {
    if (selected.size === 0 || !selected.has(model.lot.id)) continue;

    const qty = model.quantity;
    const parsed = parseCatalogModelName(model.modelName);
    rows.push({
      productName: product.name,
      modelNumber: parsed.modelNumber,
      size: parsed.size,
      modelName: model.modelName,
      lotId: model.lot.id,
      lotNumber: model.lot.lotNumber,
      quantity: qty,
      boards: groupLines(
        model.boardEntries.map((entry) => ({
          label: `${entry.boardInventory.boardThickness.board.materialName} ${entry.boardInventory.boardThickness.thickness}`,
          unit: "SQFT",
          total: totalForModelQty(toNumber(entry.totalSqft), qty),
        })),
        qty
      ),
      paints: groupLines(
        model.paintEntries.map((entry) => ({
          label: entry.paintProduct.name,
          unit: entry.paintProduct.unit,
          total: round2(toNumber(entry.quantity)),
        })),
        qty
      ),
      hardware: groupLines(
        model.hardwareEntries.map((entry) => ({
          label: entry.hardwareProduct.name,
          unit: entry.hardwareProduct.unit,
          total: round2(toNumber(entry.quantity)),
        })),
        qty
      ),
      packing: groupLines(
        model.packingEntries.map((entry) => ({
          label: entry.packingProduct.name,
          unit: entry.packingProduct.unit,
          total: round2(toNumber(entry.quantity)),
        })),
        qty
      ),
      edgeBinding: groupLines(
        model.edgeBindingEntries.map((entry) => ({
          label: entry.edgeBindingProduct.name,
          unit: entry.edgeBindingProduct.unit,
          total: round2(toNumber(entry.quantity)),
        })),
        qty
      ),
      glass: groupLines(
        model.glassEntries.map((entry) => ({
          label: entry.glassProduct.name,
          unit: entry.glassProduct.unit,
          total: round2(toNumber(entry.quantity)),
        })),
        qty
      ),
    });
  }

  rows.sort((a, b) => {
    const model = a.modelNumber.localeCompare(b.modelNumber);
    if (model !== 0) return model;
    return a.lotNumber.localeCompare(b.lotNumber);
  });

  return {
    productId: product.id,
    productName: product.name,
    lots: Array.from(lotOptions.values()).sort((a, b) =>
      a.lotNumber.localeCompare(b.lotNumber, undefined, { numeric: true })
    ),
    rows,
  };
}
