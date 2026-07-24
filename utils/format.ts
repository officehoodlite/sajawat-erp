import { format } from "date-fns";

import { formatDecimal, roundDecimal } from "@/lib/decimal";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

/** Display a number with up to 6 decimal precision. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return formatDecimal(value);
}

export function formatSqft(value: number): string {
  return `${formatNumber(value)} SqFt`;
}

export function decimalToNumber(value: { toNumber?: () => number } | number): number {
  if (typeof value === "number") return roundDecimal(value);
  if (value && typeof value.toNumber === "function") return roundDecimal(value.toNumber());
  return roundDecimal(Number(value));
}
