import { roundDecimal } from "@/lib/decimal";

/** Per-unit entry × model qty (boards, edge binding, glass). Paint/hardware/packing use entered qty as-is. */
export function totalForModelQty(perUnit: number, modelQuantity: number): number {
  return roundDecimal(perUnit * modelQuantity);
}

export function materialEntryStockQty(
  type: "paint" | "hardware" | "packing" | "edgebinding" | "glass",
  entryQty: number,
  modelQuantity: number
): number {
  if (type === "edgebinding" || type === "glass") {
    return totalForModelQty(entryQty, modelQuantity);
  }
  return roundDecimal(entryQty);
}
