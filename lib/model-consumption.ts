import { roundDecimal } from "@/lib/decimal";

/** Per-unit entry × model qty (boards only). Materials use entered qty as-is. */
export function totalForModelQty(perUnit: number, modelQuantity: number): number {
  return roundDecimal(perUnit * modelQuantity);
}

export function materialEntryStockQty(
  type: "paint" | "hardware" | "packing" | "edgebinding" | "glass",
  entryQty: number,
  _modelQuantity: number
): number {
  void type;
  void _modelQuantity;
  return roundDecimal(entryQty);
}
