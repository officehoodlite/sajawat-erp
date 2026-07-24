import { round2 } from "@/utils/board-calculations";
import type { MaterialByModelRowDto } from "@/types/dto";
import type { Unit } from "@/types/enums";

type MaterialEntryInput = {
  modelId: string;
  name: string;
  quantity: number;
  unit: Unit;
};

export function buildMaterialByModel(
  entries: MaterialEntryInput[]
): MaterialByModelRowDto[] {
  const byMaterial = new Map<
    string,
    { unit: Unit; modelValues: Map<string, number> }
  >();

  for (const entry of entries) {
    let row = byMaterial.get(entry.name);
    if (!row) {
      row = { unit: entry.unit, modelValues: new Map() };
      byMaterial.set(entry.name, row);
    }
    row.modelValues.set(
      entry.modelId,
      round2((row.modelValues.get(entry.modelId) ?? 0) + entry.quantity)
    );
  }

  return Array.from(byMaterial.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([materialLabel, row]) => {
      const modelValues: Record<string, number> = {};
      let rowTotal = 0;
      for (const [modelId, qty] of row.modelValues) {
        modelValues[modelId] = qty;
        rowTotal = round2(rowTotal + qty);
      }
      return {
        materialLabel,
        unit: row.unit,
        modelValues,
        rowTotal,
      };
    });
}
