import { buildMaterialByModel } from "@/lib/material-by-model";
import {
  computeWorkerSummaries,
  DEFAULT_WORKER_RATES,
} from "@/lib/worker-labor";
import { round2 } from "@/utils/board-calculations";
import { totalForModelQty } from "@/lib/model-consumption";
import {
  buildBoardActualConsumption,
  buildBoardCalculatedByModel,
} from "@/features/manufacturing/utils/board-actual-consumption";
import type {
  LotDetailDto,
  LotSummaryDto,
  MaterialConsumptionSummaryDto,
  ModelSummaryDto,
} from "@/types/dto";
import type { Unit } from "@/types/enums";

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

export function lotDetailToSummary(lot: LotDetailDto): LotSummaryDto {
  const models: ModelSummaryDto[] = lot.models.map((model) => ({
    id: model.id,
    lotId: model.lotId,
    productId: model.productId,
    productName: model.productName,
    catalogModelId: model.catalogModelId,
    modelName: model.modelName,
    quantity: model.quantity,
    partCount: model.partCount,
    polishLaborPerQty: model.polishLaborPerQty,
    totalBoardSqft: totalForModelQty(
      round2(model.boardEntries.reduce((sum, e) => sum + e.totalSqft, 0)),
      model.quantity
    ),
  }));

  const paintEntries = lot.models.flatMap((m) =>
    m.paintEntries.map((e) => ({
      name: e.paintName,
      quantity: round2(e.quantity),
      unit: e.unit,
    }))
  );
  const hardwareEntries = lot.models.flatMap((m) =>
    m.hardwareEntries.map((e) => ({
      name: e.hardwareName,
      quantity: totalForModelQty(e.quantity, m.quantity),
      unit: e.unit,
    }))
  );
  const packingEntries = lot.models.flatMap((m) =>
    m.packingEntries.map((e) => ({
      name: e.packingName,
      quantity: round2(e.quantity),
      unit: e.unit,
    }))
  );
  const edgeBindingEntries = lot.models.flatMap((m) =>
    m.edgeBindingEntries.map((e) => ({
      name: e.edgeBindingName,
      quantity: totalForModelQty(e.quantity, m.quantity),
      unit: e.unit,
    }))
  );

  const paintByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.paintEntries.map((e) => ({
        modelId: m.id,
        name: e.paintName,
        quantity: round2(e.quantity),
        unit: e.unit,
      }))
    )
  );
  const hardwareByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.hardwareEntries.map((e) => ({
        modelId: m.id,
        name: e.hardwareName,
        quantity: totalForModelQty(e.quantity, m.quantity),
        unit: e.unit,
      }))
    )
  );
  const packingByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.packingEntries.map((e) => ({
        modelId: m.id,
        name: e.packingName,
        quantity: round2(e.quantity),
        unit: e.unit,
      }))
    )
  );
  const edgeBindingByModel = buildMaterialByModel(
    lot.models.flatMap((m) =>
      m.edgeBindingEntries.map((e) => ({
        modelId: m.id,
        name: e.edgeBindingName,
        quantity: totalForModelQty(e.quantity, m.quantity),
        unit: e.unit,
      }))
    )
  );

  const modelBoardInputs = lot.models.map((model) => ({
    id: model.id,
    modelName: model.modelName,
    quantity: model.quantity,
    boardEntries: model.boardEntries.map((e) => ({
      totalSqft: e.totalSqft,
      materialName: e.materialName,
      thickness: e.thickness,
    })),
  }));

  const boardCalculatedByModel = buildBoardCalculatedByModel(modelBoardInputs);
  const boardActualConsumption = buildBoardActualConsumption(modelBoardInputs, []);

  return {
    id: lot.id,
    lotNumber: lot.lotNumber,
    status: lot.status,
    stockDeducted: lot.stockDeducted,
    createdAt: lot.createdAt,
    remarks: lot.remarks,
    models,
    boardUsageSummary: lot.boardUsageSummary,
    totalBoardSqft: lot.totalBoardSqft,
    actualBoardEntries: [],
    actualBoardUsageSummary: [],
    totalActualBoardSqft: 0,
    boardWastageSummary: [],
    boardCalculatedByModel,
    boardActualConsumption,
    paintConsumption: groupMaterialConsumption(paintEntries),
    hardwareConsumption: groupMaterialConsumption(hardwareEntries),
    packingConsumption: groupMaterialConsumption(packingEntries),
    edgeBindingConsumption: groupMaterialConsumption(edgeBindingEntries),
    paintByModel,
    hardwareByModel,
    packingByModel,
    edgeBindingByModel,
    workerRates: { ...DEFAULT_WORKER_RATES },
    workerEntries: [],
    workerSummaries: computeWorkerSummaries([], DEFAULT_WORKER_RATES),
  };
}
