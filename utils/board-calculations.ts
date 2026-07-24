import { roundDecimal } from "@/lib/decimal";

/** Divisor for board sqft: length × width / (625 × 144). */
export const BOARD_SQFT_DIVISOR = 625 * 144;

export function round2(value: number): number {
  return roundDecimal(value);
}

export function calcSqftPerPiece(length: number, width: number): number {
  return roundDecimal((length * width) / BOARD_SQFT_DIVISOR);
}

export function calcBoardEntrySqft(length: number, width: number, quantity: number) {
  const sqftPerPiece = calcSqftPerPiece(length, width);
  const totalSqft = roundDecimal(sqftPerPiece * quantity);
  return { sqftPerPiece, totalSqft };
}

/** Admin actual usage net sqft: (L × W × Qty) + in − out (all in sqft, no board divisor). */
export function calcActualBoardTotalSqft(
  length: number,
  width: number,
  quantity: number,
  sqftIn: number,
  sqftOut: number
): number {
  const pieceSqft = roundDecimal(length * width * quantity);
  return roundDecimal(pieceSqft + sqftIn - sqftOut);
}

export function groupBoardUsage<
  T extends { materialName: string; thickness: string; totalSqft: number },
>(entries: T[]) {
  const map = new Map<string, { materialLabel: string; totalSqft: number }>();

  for (const entry of entries) {
    const key = `${entry.materialName}::${entry.thickness}`;
    const materialLabel = `${entry.materialName} ${entry.thickness}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalSqft = roundDecimal(existing.totalSqft + entry.totalSqft);
    } else {
      map.set(key, {
        materialLabel,
        totalSqft: roundDecimal(entry.totalSqft),
      });
    }
  }

  return Array.from(map.values());
}
