import type { Unit } from "@/types/enums";
import { decimalToNumber } from "@/utils/format";

export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return decimalToNumber(value as { toNumber?: () => number } | number);
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return decimalToNumber(value as { toNumber?: () => number } | number);
}

export function mapBoardInventory(row: {
  id: string;
  boardThicknessId: string;
  purchaseSqft: unknown;
  remainingSqft: unknown;
  purchaseDate: Date;
  supplierId: string | null;
  rate: unknown;
  supplier?: { name: string } | null;
  boardThickness: {
    thickness: string;
    board: { materialName: string };
  };
}) {
  return {
    id: row.id,
    boardThicknessId: row.boardThicknessId,
    materialName: row.boardThickness.board.materialName,
    thickness: row.boardThickness.thickness,
    purchaseSqft: toNumber(row.purchaseSqft),
    remainingSqft: toNumber(row.remainingSqft),
    purchaseDate: row.purchaseDate.toISOString(),
    supplierId: row.supplierId,
    supplierName: row.supplier?.name ?? null,
    rate: toNullableNumber(row.rate),
  };
}

export function mapBoardOption(row: {
  id: string;
  remainingSqft: unknown;
  supplierId: string | null;
  supplier?: { name: string } | null;
  boardThickness: {
    id: string;
    thickness: string;
    board: { materialName: string };
  };
}) {
  const materialName = row.boardThickness.board.materialName;
  const thickness = row.boardThickness.thickness;
  const remainingSqft = toNumber(row.remainingSqft);
  const supplierLabel = row.supplier?.name ?? "No supplier";
  return {
    id: row.id,
    boardThicknessId: row.boardThickness.id,
    materialName,
    thickness,
    remainingSqft,
    supplierId: row.supplierId,
    supplierName: row.supplier?.name ?? null,
    label: `${materialName} ${thickness} — ${remainingSqft} sqft remaining (${supplierLabel})`,
  };
}

export function mapMaterialOption(row: {
  id: string;
  remaining: unknown;
  unit: Unit;
  [key: string]: unknown;
}, nameKey: string) {
  const name = row[nameKey] as string;
  const remaining = toNumber(row.remaining);
  return {
    id: row.id,
    label: `${name} — ${remaining} ${row.unit} remaining`,
    remaining,
    unit: row.unit,
  };
}
