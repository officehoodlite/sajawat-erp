import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/mappers";
import {
  buildBoardWastageSummary,
  groupActualBoardUsage,
} from "@/repositories/manufacturing/lot-actual-board.repository";
import { groupBoardUsage, round2 } from "@/utils/board-calculations";
import { totalForModelQty } from "@/lib/model-consumption";
import { buildMaterialByModel } from "@/lib/material-by-model";
import {
  computeWorkerSummaries,
  mapWorkerEntry,
  mapWorkerRates,
} from "@/lib/worker-labor";
import {
  buildBoardActualConsumption,
  buildBoardCalculatedByModel,
} from "@/features/manufacturing/utils/board-actual-consumption";
import { sanitizeLotSummary, canViewWorkerPrices } from "@/lib/permissions";
import type {
  LotSummaryDto,
  MaterialConsumptionSummaryDto,
  ModelDetailResponseDto,
  ModelDto,
  ModelSummaryDto,
} from "@/types/dto";
import type { Unit } from "@/types/enums";

const modelInclude = {
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
  lot: true,
} as const;

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

function materialLabel(name: string, brand: string | null) {
  return brand ? `${name} (${brand})` : name;
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

function groupMaterialConsumption(
  entries: Array<{ name: string; quantity: number; unit: Unit }>
): MaterialConsumptionSummaryDto[] {
  const grouped = new Map<string, MaterialConsumptionSummaryDto>();

  for (const entry of entries) {
    const existing = grouped.get(entry.name);
    if (existing) {
      existing.quantity = round2(existing.quantity + entry.quantity);
    } else {
      grouped.set(entry.name, { name: entry.name, quantity: entry.quantity, unit: entry.unit });
    }
  }

  return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export class ModelRepository {
  async findById(modelId: string): Promise<ModelDetailResponseDto | null> {
    const row = await prisma.manufacturingModel.findUnique({
      where: { id: modelId },
      include: modelInclude,
    });

    if (!row) return null;

    return {
      model: mapModel(row),
      lot: {
        id: row.lot.id,
        lotNumber: row.lot.lotNumber,
        status: row.lot.status,
      },
    };
  }
}

export const modelRepository = new ModelRepository();

export function mapLotSummaryFromQuery(lot: {
  id: string;
  lotNumber: string;
  status: LotSummaryDto["status"];
  stockDeducted: boolean;
  createdAt: Date;
  remarks: string | null;
  actualBoardEntries?: Array<{
    id: string;
    lotId: string;
    boardThicknessId: string;
    length: unknown;
    width: unknown;
    quantity: number;
    sqftIn: unknown;
    sqftOut: unknown;
    totalSqft: unknown;
    boardThickness: {
      thickness: string;
      board: { materialName: string };
    };
  }>;
  workerRates?: {
    mfgMistriRate: unknown;
    mfgHalfMistriRate: unknown;
    mfgHelperRate: unknown;
    packingMistriRate: unknown;
    packingHalfMistriRate: unknown;
    packingHelperRate: unknown;
  } | null;
  workerEntries?: Array<{
    id: string;
    type: "MANUFACTURING" | "PACKING";
    workDate: Date;
    workerNames: string[];
    machinery: string | null;
    mistri: number;
    halfMistri: number;
    helper: number;
    hours: number;
    packQty: number | null;
  }>;
  models: Array<{
    id: string;
    lotId: string;
    productId: string;
    catalogModelId: string;
    modelName: string;
    quantity: number;
    partCount: number;
    polishLaborPerQty: unknown;
    product: { name: string };
    boardEntries: Array<{
      totalSqft: unknown;
      boardInventory: {
        boardThickness: {
          thickness: string;
          board: { materialName: string };
        };
      };
    }>;
    paintEntries: Array<{
      quantity: unknown;
      paintProduct: { name: string; unit: Unit };
    }>;
    hardwareEntries: Array<{
      quantity: unknown;
      hardwareProduct: { name: string; unit: Unit };
    }>;
    packingEntries: Array<{
      quantity: unknown;
      packingProduct: { name: string; unit: Unit };
    }>;
    edgeBindingEntries: Array<{
      quantity: unknown;
      edgeBindingProduct: { name: string; unit: Unit };
    }>;
    glassEntries: Array<{
      quantity: unknown;
      glassProduct: { name: string; unit: Unit };
    }>;
  }>;
}): LotSummaryDto {
  const models: ModelSummaryDto[] = lot.models.map((model) => ({
    id: model.id,
    lotId: model.lotId,
    productId: model.productId,
    productName: model.product.name,
    catalogModelId: model.catalogModelId,
    modelName: model.modelName,
    quantity: model.quantity,
    partCount: model.partCount,
    polishLaborPerQty:
      model.polishLaborPerQty == null ? null : toNumber(model.polishLaborPerQty),
    totalBoardSqft: totalForModelQty(
      round2(model.boardEntries.reduce((sum, e) => sum + toNumber(e.totalSqft), 0)),
      model.quantity
    ),
  }));

  const boardUsageEntries = lot.models.flatMap((m) =>
    m.boardEntries.map((e) => ({
      materialName: e.boardInventory.boardThickness.board.materialName,
      thickness: e.boardInventory.boardThickness.thickness,
      totalSqft: totalForModelQty(toNumber(e.totalSqft), m.quantity),
    }))
  );

  const boardUsageSummary = groupBoardUsage(boardUsageEntries);
  const totalBoardSqft = round2(
    boardUsageSummary.reduce((sum, item) => sum + item.totalSqft, 0)
  );

  const actualBoardEntries = (lot.actualBoardEntries ?? []).map((e) => ({
    id: e.id,
    lotId: e.lotId,
    boardThicknessId: e.boardThicknessId,
    materialName: e.boardThickness.board.materialName,
    thickness: e.boardThickness.thickness,
    length: toNumber(e.length),
    width: toNumber(e.width),
    quantity: e.quantity,
    sqftIn: toNumber(e.sqftIn),
    sqftOut: toNumber(e.sqftOut),
    totalSqft: toNumber(e.totalSqft),
  }));
  const actualBoardUsageSummary = groupActualBoardUsage(actualBoardEntries);
  const totalActualBoardSqft = round2(
    actualBoardUsageSummary.reduce((sum, item) => sum + item.totalSqft, 0)
  );
  const boardWastageSummary = buildBoardWastageSummary(
    boardUsageSummary,
    actualBoardUsageSummary
  );

  const modelBoardInputs = lot.models.map((model) => ({
    id: model.id,
    modelName: model.modelName,
    quantity: model.quantity,
    boardEntries: model.boardEntries.map((e) => ({
      totalSqft: toNumber(e.totalSqft),
      materialName: e.boardInventory.boardThickness.board.materialName,
      thickness: e.boardInventory.boardThickness.thickness,
    })),
  }));

  const boardCalculatedByModel = buildBoardCalculatedByModel(modelBoardInputs);
  const boardActualConsumption = buildBoardActualConsumption(
    modelBoardInputs,
    boardWastageSummary
  );

  const paintEntries = lot.models.flatMap((m) =>
    m.paintEntries.map((e) => ({
      name: e.paintProduct.name,
      quantity: round2(toNumber(e.quantity)),
      unit: e.paintProduct.unit,
    }))
  );
  const hardwareEntries = lot.models.flatMap((m) =>
    m.hardwareEntries.map((e) => ({
      name: e.hardwareProduct.name,
      quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
      unit: e.hardwareProduct.unit,
    }))
  );
  const packingEntries = lot.models.flatMap((m) =>
    m.packingEntries.map((e) => ({
      name: e.packingProduct.name,
      quantity: round2(toNumber(e.quantity)),
      unit: e.packingProduct.unit,
    }))
  );
  const edgeBindingEntries = lot.models.flatMap((m) =>
    m.edgeBindingEntries.map((e) => ({
      name: e.edgeBindingProduct.name,
      quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
      unit: e.edgeBindingProduct.unit,
    }))
  );
  const glassEntries = lot.models.flatMap((m) =>
    m.glassEntries.map((e) => ({
      name: e.glassProduct.name,
      quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
      unit: e.glassProduct.unit,
    }))
  );

  const paintByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.paintEntries.map((e) => ({
        modelId: m.id,
        name: e.paintProduct.name,
        quantity: round2(toNumber(e.quantity)),
        unit: e.paintProduct.unit,
      }))
    )
  );
  const hardwareByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.hardwareEntries.map((e) => ({
        modelId: m.id,
        name: e.hardwareProduct.name,
        quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
        unit: e.hardwareProduct.unit,
      }))
    )
  );
  const packingByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.packingEntries.map((e) => ({
        modelId: m.id,
        name: e.packingProduct.name,
        quantity: round2(toNumber(e.quantity)),
        unit: e.packingProduct.unit,
      }))
    )
  );
  const edgeBindingByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.edgeBindingEntries.map((e) => ({
        modelId: m.id,
        name: e.edgeBindingProduct.name,
        quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
        unit: e.edgeBindingProduct.unit,
      }))
    )
  );
  const glassByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.glassEntries.map((e) => ({
        modelId: m.id,
        name: e.glassProduct.name,
        quantity: totalForModelQty(toNumber(e.quantity), m.quantity),
        unit: e.glassProduct.unit,
      }))
    )
  );

  const workerRates = mapWorkerRates(lot.workerRates);
  const workerEntries = (lot.workerEntries ?? []).map(mapWorkerEntry);
  const workerSummaries = computeWorkerSummaries(workerEntries, workerRates);

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
    actualBoardEntries,
    actualBoardUsageSummary,
    totalActualBoardSqft,
    boardWastageSummary,
    boardCalculatedByModel,
    boardActualConsumption,
    paintConsumption: groupMaterialConsumption(paintEntries),
    hardwareConsumption: groupMaterialConsumption(hardwareEntries),
    packingConsumption: groupMaterialConsumption(packingEntries),
    edgeBindingConsumption: groupMaterialConsumption(edgeBindingEntries),
    glassConsumption: groupMaterialConsumption(glassEntries),
    paintByModel,
    hardwareByModel,
    packingByModel,
    edgeBindingByModel,
    glassByModel,
    workerRates,
    workerEntries,
    workerSummaries,
  };
}

const summaryInclude = {
  workerRates: true,
  workerEntries: {
    orderBy: [{ workDate: "desc" as const }, { createdAt: "desc" as const }],
  },
  actualBoardEntries: {
    orderBy: { createdAt: "asc" as const },
    include: {
      boardThickness: { include: { board: true } },
    },
  },
  models: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      lotId: true,
      productId: true,
      catalogModelId: true,
      modelName: true,
      quantity: true,
      partCount: true,
      polishLaborPerQty: true,
      product: { select: { name: true } },
      boardEntries: {
        select: {
          totalSqft: true,
          boardInventory: {
            select: {
              boardThickness: {
                select: {
                  thickness: true,
                  board: { select: { materialName: true } },
                },
              },
            },
          },
        },
      },
      paintEntries: {
        select: {
          quantity: true,
          paintProduct: { select: { name: true, unit: true } },
        },
      },
      hardwareEntries: {
        select: {
          quantity: true,
          hardwareProduct: { select: { name: true, unit: true } },
        },
      },
      packingEntries: {
        select: {
          quantity: true,
          packingProduct: { select: { name: true, unit: true } },
        },
      },
      edgeBindingEntries: {
        select: {
          quantity: true,
          edgeBindingProduct: { select: { name: true, unit: true } },
        },
      },
      glassEntries: {
        select: {
          quantity: true,
          glassProduct: { select: { name: true, unit: true } },
        },
      },
    },
  },
};

export async function findLotSummaryById(id: string): Promise<LotSummaryDto | null> {
  const lot = await prisma.manufacturingLot.findUnique({
    where: { id },
    include: summaryInclude,
  });
  return lot ? sanitizeLotSummary(mapLotSummaryFromQuery(lot)) : null;
}
