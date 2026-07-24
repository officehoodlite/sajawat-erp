import { totalForModelQty } from "@/lib/model-consumption";
import { groupBoardUsage, round2 } from "@/utils/board-calculations";
import type { ModelDto } from "@/types/dto";

export type ModelStatus = "empty" | "in-progress" | "ready";

export { totalForModelQty } from "@/lib/model-consumption";

export function getModelBoardTotal(model: {
  quantity: number;
  boardEntries?: Array<{ totalSqft: number }>;
}): number {
  const perUnit = round2((model.boardEntries ?? []).reduce((sum, e) => sum + e.totalSqft, 0));
  return totalForModelQty(perUnit, model.quantity);
}

export function getModelBoardPerUnit(model: {
  boardEntries?: Array<{ totalSqft: number }>;
}): number {
  return round2((model.boardEntries ?? []).reduce((sum, e) => sum + e.totalSqft, 0));
}

export function getModelStatus(model: {
  boardEntries?: unknown[];
  paintEntries?: unknown[];
  hardwareEntries?: unknown[];
  packingEntries?: unknown[];
  totalBoardSqft?: number;
}): ModelStatus {
  const hasBoard =
    (model.boardEntries?.length ?? 0) > 0 || (model.totalBoardSqft ?? 0) > 0;
  const hasOther =
    (model.paintEntries?.length ?? 0) > 0 ||
    (model.hardwareEntries?.length ?? 0) > 0 ||
    (model.packingEntries?.length ?? 0) > 0;

  if (hasBoard) return "ready";
  if (hasOther) return "in-progress";
  return "empty";
}

export function getModelBoardSummary(model: ModelDto) {
  return groupBoardUsage(
    model.boardEntries.map((e) => ({
      materialName: e.materialName,
      thickness: e.thickness,
      totalSqft: totalForModelQty(e.totalSqft, model.quantity),
    }))
  );
}

export interface MaterialConsumptionRow {
  name: string;
  quantity: number;
  unit?: string;
}

function sumMaterialForModel(entries: Array<{ quantity: number }>): number {
  return round2(entries.reduce((sum, e) => sum + e.quantity, 0));
}

export function getModelPaintTotal(model: ModelDto): number {
  return sumMaterialForModel(model.paintEntries);
}

export function getModelHardwareTotal(model: ModelDto): number {
  const perUnit = sumMaterialForModel(model.hardwareEntries);
  return totalForModelQty(perUnit, model.quantity);
}

export function getModelPackingTotal(model: ModelDto): number {
  return sumMaterialForModel(model.packingEntries);
}

export function groupPaintConsumption(models: ModelDto[]): MaterialConsumptionRow[] {
  const grouped = new Map<string, { quantity: number; unit: string }>();

  for (const model of models) {
    for (const entry of model.paintEntries) {
      const key = entry.paintName;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity = round2(existing.quantity + entry.quantity);
      } else {
        grouped.set(key, { quantity: round2(entry.quantity), unit: entry.unit });
      }
    }
  }

  return Array.from(grouped.entries())
    .map(([name, { quantity, unit }]) => ({ name, quantity, unit }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupHardwareConsumption(models: ModelDto[]): MaterialConsumptionRow[] {
  const grouped = new Map<string, { quantity: number; unit: string }>();

  for (const model of models) {
    for (const entry of model.hardwareEntries) {
      const key = entry.hardwareName;
      const totalQty = totalForModelQty(entry.quantity, model.quantity);
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity = round2(existing.quantity + totalQty);
      } else {
        grouped.set(key, { quantity: totalQty, unit: entry.unit });
      }
    }
  }

  return Array.from(grouped.entries())
    .map(([name, { quantity, unit }]) => ({ name, quantity, unit }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function groupPackingConsumption(models: ModelDto[]): MaterialConsumptionRow[] {
  const grouped = new Map<string, { quantity: number; unit: string }>();

  for (const model of models) {
    for (const entry of model.packingEntries) {
      const key = entry.packingName;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity = round2(existing.quantity + entry.quantity);
      } else {
        grouped.set(key, { quantity: round2(entry.quantity), unit: entry.unit });
      }
    }
  }

  return Array.from(grouped.entries())
    .map(([name, { quantity, unit }]) => ({ name, quantity, unit }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getTotalPaintUsed(models: ModelDto[]): number {
  return round2(models.reduce((sum, m) => sum + getModelPaintTotal(m), 0));
}

export function getTotalHardwareUsed(models: ModelDto[]): number {
  return round2(models.reduce((sum, m) => sum + getModelHardwareTotal(m), 0));
}

export function getTotalPackingUsed(models: ModelDto[]): number {
  return round2(models.reduce((sum, m) => sum + getModelPackingTotal(m), 0));
}
