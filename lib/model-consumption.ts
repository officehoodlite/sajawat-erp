import { roundDecimal } from "@/lib/decimal";

/** Per-unit entry × model qty (board carpenter, hardware). Paint/packing use total qty. */
export function totalForModelQty(perUnit: number, modelQuantity: number): number {
  return roundDecimal(perUnit * modelQuantity);
}

export function materialEntryStockQty(
  type: "paint" | "hardware" | "packing" | "edgebinding",
  entryQty: number,
  modelQuantity: number
): number {
  if (type === "hardware" || type === "edgebinding") {
    return totalForModelQty(entryQty, modelQuantity);
  }
  return roundDecimal(entryQty);
}
