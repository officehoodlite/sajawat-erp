/** Application-wide decimal precision for storage, comparisons, and display. */
export const DECIMAL_PRECISION = 6;

const FACTOR = 10 ** DECIMAL_PRECISION;

/** Round to {@link DECIMAL_PRECISION} decimal places for storage and comparisons. */
export function roundDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * FACTOR) / FACTOR;
}

/** Format a number for display with up to {@link DECIMAL_PRECISION} decimal places. */
export function formatDecimal(value: number): string {
  const rounded = roundDecimal(value);
  if (rounded === 0) return "0";
  return rounded.toFixed(DECIMAL_PRECISION).replace(/\.?0+$/, "");
}

/** HTML input step for decimal fields. */
export const DECIMAL_INPUT_STEP = "0.000001";
