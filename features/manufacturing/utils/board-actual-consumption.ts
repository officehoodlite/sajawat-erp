import { totalForModelQty } from "@/lib/model-consumption";
import { roundDecimal } from "@/lib/decimal";
import { round2 } from "@/utils/board-calculations";
import type {
  BoardActualConsumptionRowDto,
  BoardModelMaterialUsageDto,
  BoardWastageSummaryDto,
} from "@/types/dto";

type ModelBoardInput = {
  id: string;
  modelName: string;
  quantity: number;
  boardEntries: Array<{
    totalSqft: number;
    materialName: string;
    thickness: string;
  }>;
};

function materialLabel(materialName: string, thickness: string): string {
  return `${materialName} ${thickness}`;
}

export function buildBoardCalculatedByModel(models: ModelBoardInput[]): BoardModelMaterialUsageDto[] {
  const rows: BoardModelMaterialUsageDto[] = [];

  for (const model of models) {
    const byMaterial = new Map<string, number>();

    for (const entry of model.boardEntries) {
      const label = materialLabel(entry.materialName, entry.thickness);
      const sqft = totalForModelQty(entry.totalSqft, model.quantity);
      byMaterial.set(label, round2((byMaterial.get(label) ?? 0) + sqft));
    }

    for (const [label, calculatedSqft] of byMaterial) {
      rows.push({
        modelId: model.id,
        modelName: model.modelName,
        materialLabel: label,
        calculatedSqft,
      });
    }
  }

  return rows.sort(
    (a, b) =>
      a.materialLabel.localeCompare(b.materialLabel) || a.modelName.localeCompare(b.modelName)
  );
}

export function buildBoardActualConsumption(
  models: ModelBoardInput[],
  wastageSummary: BoardWastageSummaryDto[]
): BoardActualConsumptionRowDto[] {
  const calculatedByModel = buildBoardCalculatedByModel(models);
  const carpenterByMaterialModel = new Map<string, Map<string, number>>();

  for (const row of calculatedByModel) {
    let modelMap = carpenterByMaterialModel.get(row.materialLabel);
    if (!modelMap) {
      modelMap = new Map();
      carpenterByMaterialModel.set(row.materialLabel, modelMap);
    }
    modelMap.set(row.modelId, row.calculatedSqft);
  }

  const materialLabels = new Set<string>();
  for (const row of wastageSummary) materialLabels.add(row.materialLabel);
  for (const label of carpenterByMaterialModel.keys()) materialLabels.add(label);

  return Array.from(materialLabels)
    .sort((a, b) => a.localeCompare(b))
    .map((label) => {
      const wastage = wastageSummary.find((w) => w.materialLabel === label);
      const wastagePercent = wastage?.wastagePercent ?? null;
      const actualSqft = round2(wastage?.actualSqft ?? 0);
      const modelMap = carpenterByMaterialModel.get(label) ?? new Map<string, number>();

      const modelValues: Record<string, number> = {};
      let rowTotal = 0;

      for (const model of models) {
        const carpenter = modelMap.get(model.id) ?? 0;
        let adjusted = 0;

        if (carpenter > 0 && wastagePercent !== null) {
          adjusted = roundDecimal(carpenter * (1 + wastagePercent / 100));
        } else if (carpenter > 0 && actualSqft === 0) {
          adjusted = carpenter;
        }

        modelValues[model.id] = adjusted;
        rowTotal = round2(rowTotal + adjusted);
      }

      const variance = round2(rowTotal - actualSqft);

      return {
        materialLabel: label,
        wastagePercent,
        actualSqft,
        modelValues,
        rowTotal,
        variance,
      };
    });
}
