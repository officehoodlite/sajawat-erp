import { prisma } from "@/lib/prisma";
import { canViewWorkerPrices } from "@/lib/permissions";
import { toNumber } from "@/lib/mappers";
import { groupBoardUsage, round2 } from "@/utils/board-calculations";
import { totalForModelQty } from "@/lib/model-consumption";
import type { LotDetailDto, LotListItemDto, ModelDto } from "@/types/dto";
import type { LotStatus, Unit } from "@/types/enums";

const lotInclude = {
  models: {
    orderBy: { createdAt: "asc" as const },
    include: {
      product: true,
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
      boardPresets: {
        include: { boardThickness: { include: { board: true } } },
        orderBy: { createdAt: "asc" as const },
      },
      paintPresets: {
        include: { paintProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      hardwarePresets: {
        include: { hardwareProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      packingPresets: {
        include: { packingProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      edgeBindingPresets: {
        include: { edgeBindingProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
      glassPresets: {
        include: { glassProduct: true },
        orderBy: { createdAt: "asc" as const },
      },
    },
  },
};

function materialLabel(name: string, brand: string | null) {
  return brand ? `${name} (${brand})` : name;
}

function mapBoardEntry(row: {
  id: string;
  modelId: string;
  boardInventoryId: string;
  length: unknown;
  width: unknown;
  quantity: number;
  sqftPerPiece: unknown;
  totalSqft: unknown;
  boardInventory: {
    boardThickness: {
      thickness: string;
      board: { materialName: string };
    };
  };
}) {
  return {
    id: row.id,
    modelId: row.modelId,
    boardInventoryId: row.boardInventoryId,
    materialName: row.boardInventory.boardThickness.board.materialName,
    thickness: row.boardInventory.boardThickness.thickness,
    length: toNumber(row.length),
    width: toNumber(row.width),
    quantity: row.quantity,
    sqftPerPiece: toNumber(row.sqftPerPiece),
    totalSqft: toNumber(row.totalSqft),
  };
}

function mapModel(row: {
  id: string;
  lotId: string;
  productId: string;
  catalogModelId: string;
  modelName: string;
  quantity: number;
  partCount: number;
  polishLaborPerQty: unknown;
  product: { name: string };
  boardEntries: Parameters<typeof mapBoardEntry>[0][];
  paintEntries: Array<{
    id: string;
    modelId: string;
    paintProductId: string;
    quantity: unknown;
    paintProduct: { name: string; unit: Unit };
  }>;
  hardwareEntries: Array<{
    id: string;
    modelId: string;
    hardwareProductId: string;
    quantity: unknown;
    hardwareProduct: { name: string; unit: Unit };
  }>;
  packingEntries: Array<{
    id: string;
    modelId: string;
    packingProductId: string;
    quantity: unknown;
    packingProduct: { name: string; unit: Unit };
  }>;
  edgeBindingEntries: Array<{
    id: string;
    modelId: string;
    edgeBindingProductId: string;
    quantity: unknown;
    edgeBindingProduct: { name: string; unit: Unit };
  }>;
  glassEntries: Array<{
    id: string;
    modelId: string;
    glassProductId: string;
    quantity: unknown;
    glassProduct: { name: string; unit: Unit };
  }>;
  boardPresets: Array<{
    boardThicknessId: string;
    length: unknown;
    width: unknown;
    quantity: number;
    boardThickness: { thickness: string; board: { materialName: string } };
  }>;
  paintPresets: Array<{
    paintProductId: string;
    quantity: unknown;
    paintProduct: { name: string; brand: string | null };
  }>;
  hardwarePresets: Array<{
    hardwareProductId: string;
    quantity: unknown;
    hardwareProduct: { name: string; brand: string | null };
  }>;
  packingPresets: Array<{
    packingProductId: string;
    quantity: unknown;
    packingProduct: { name: string; brand: string | null };
  }>;
  edgeBindingPresets: Array<{
    edgeBindingProductId: string;
    quantity: unknown;
    edgeBindingProduct: { name: string; brand: string | null };
  }>;
  glassPresets: Array<{
    glassProductId: string;
    quantity: unknown;
    glassProduct: { name: string; brand: string | null };
  }>;
}): ModelDto {
  return {
    id: row.id,
    lotId: row.lotId,
    productId: row.productId,
    productName: row.product.name,
    catalogModelId: row.catalogModelId,
    modelName: row.modelName,
    quantity: row.quantity,
    partCount: row.partCount,
    polishLaborPerQty:
      canViewWorkerPrices() && row.polishLaborPerQty != null
        ? toNumber(row.polishLaborPerQty)
        : null,
    boardEntries: row.boardEntries.map((e) => mapBoardEntry(e)),
    paintEntries: row.paintEntries.map((e) => ({
      id: e.id,
      modelId: e.modelId,
      paintProductId: e.paintProductId,
      paintName: e.paintProduct.name,
      quantity: toNumber(e.quantity),
      unit: e.paintProduct.unit,
    })),
    hardwareEntries: row.hardwareEntries.map((e) => ({
      id: e.id,
      modelId: e.modelId,
      hardwareProductId: e.hardwareProductId,
      hardwareName: e.hardwareProduct.name,
      quantity: toNumber(e.quantity),
      unit: e.hardwareProduct.unit,
    })),
    packingEntries: row.packingEntries.map((e) => ({
      id: e.id,
      modelId: e.modelId,
      packingProductId: e.packingProductId,
      packingName: e.packingProduct.name,
      quantity: toNumber(e.quantity),
      unit: e.packingProduct.unit,
    })),
    edgeBindingEntries: row.edgeBindingEntries.map((e) => ({
      id: e.id,
      modelId: e.modelId,
      edgeBindingProductId: e.edgeBindingProductId,
      edgeBindingName: e.edgeBindingProduct.name,
      quantity: toNumber(e.quantity),
      unit: e.edgeBindingProduct.unit,
    })),
    glassEntries: row.glassEntries.map((e) => ({
      id: e.id,
      modelId: e.modelId,
      glassProductId: e.glassProductId,
      glassName: e.glassProduct.name,
      quantity: toNumber(e.quantity),
      unit: e.glassProduct.unit,
    })),
    boardPresets: row.boardPresets.map((p) => ({
      boardThicknessId: p.boardThicknessId,
      materialName: p.boardThickness.board.materialName,
      thickness: p.boardThickness.thickness,
      label: `${p.boardThickness.board.materialName} ${p.boardThickness.thickness}`,
      length: toNumber(p.length),
      width: toNumber(p.width),
      quantity: p.quantity,
    })),
    paintPresets: row.paintPresets.map((p) => ({
      productId: p.paintProductId,
      label: materialLabel(p.paintProduct.name, p.paintProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    hardwarePresets: row.hardwarePresets.map((p) => ({
      productId: p.hardwareProductId,
      label: materialLabel(p.hardwareProduct.name, p.hardwareProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    packingPresets: row.packingPresets.map((p) => ({
      productId: p.packingProductId,
      label: materialLabel(p.packingProduct.name, p.packingProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    edgeBindingPresets: row.edgeBindingPresets.map((p) => ({
      productId: p.edgeBindingProductId,
      label: materialLabel(p.edgeBindingProduct.name, p.edgeBindingProduct.brand),
      quantity: toNumber(p.quantity),
    })),
    glassPresets: row.glassPresets.map((p) => ({
      productId: p.glassProductId,
      label: materialLabel(p.glassProduct.name, p.glassProduct.brand),
      quantity: toNumber(p.quantity),
    })),
  };
}

export function mapLotDetail(lot: {
  id: string;
  lotNumber: string;
  status: LotStatus;
  stockDeducted: boolean;
  createdAt: Date;
  remarks: string | null;
  models: Parameters<typeof mapModel>[0][];
}): LotDetailDto {
  const models = lot.models.map(mapModel);
  const boardUsageEntries = models.flatMap((m) =>
    m.boardEntries.map((e) => ({
      materialName: e.materialName,
      thickness: e.thickness,
      totalSqft: totalForModelQty(e.totalSqft, m.quantity),
    }))
  );
  const boardUsageSummary = groupBoardUsage(boardUsageEntries);
  const totalBoardSqft = round2(
    boardUsageSummary.reduce((sum, item) => sum + item.totalSqft, 0)
  );

  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    status: lot.status,
    stockDeducted: lot.stockDeducted,
    createdAt: lot.createdAt.toISOString(),
    remarks: lot.remarks,
    models,
    boardUsageSummary,
    totalBoardSqft,
  };
}

export class LotRepository {
  async findMany(params: { skip: number; limit: number; search?: string }) {
    const where = params.search
      ? {
          lotNumber: { contains: params.search, mode: "insensitive" as const },
        }
      : undefined;

    const [items, total, lotCount, totalModels] = await Promise.all([
      prisma.manufacturingLot.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { models: true } },
        },
      }),
      prisma.manufacturingLot.count({ where }),
      params.search
        ? prisma.manufacturingLot.count()
        : Promise.resolve(0),
      prisma.manufacturingModel.count(),
    ]);

    const mapped: LotListItemDto[] = items.map((lot) => ({
      id: lot.id,
      lotNumber: lot.lotNumber,
      status: lot.status,
      modelCount: lot._count.models,
      createdAt: lot.createdAt.toISOString(),
      remarks: lot.remarks,
    }));

    return {
      items: mapped,
      total,
      lotCount: params.search ? lotCount : total,
      totalModels,
    };
  }

  async findById(id: string) {
    const lot = await prisma.manufacturingLot.findUnique({
      where: { id },
      include: lotInclude,
    });
    return lot ? mapLotDetail(lot) : null;
  }

  async create(data: { lotNumber: string; remarks?: string }) {
    const lot = await prisma.manufacturingLot.create({
      data,
      include: lotInclude,
    });
    return mapLotDetail(lot);
  }

  async update(
    id: string,
    data: {
      lotNumber?: string;
      remarks?: string | null;
      status?: LotStatus;
    }
  ) {
    const lot = await prisma.manufacturingLot.update({
      where: { id },
      data,
      include: lotInclude,
    });
    return mapLotDetail(lot);
  }

  async delete(id: string) {
    return prisma.manufacturingLot.delete({ where: { id } });
  }

  async findRaw(id: string) {
    return prisma.manufacturingLot.findUnique({
      where: { id },
      include: { _count: { select: { models: true } } },
    });
  }
}

export const lotRepository = new LotRepository();
