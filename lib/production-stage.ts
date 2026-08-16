/** Derived balances from stored progress quantities.
 * carpentryQty is stored as initial qty.
 * paintingReadyQty is remaining in paint R.
 * completedReadyQty is done R.
 */
export function progressDisplay(values: {
  carpentryQty: number;
  paintingReadyQty: number;
  paintingStatusQty: number;
  completedReadyQty: number;
  completedOutQty: number;
}) {
  const initialQty = Math.max(0, Math.floor(values.carpentryQty));
  const paintingReady = Math.max(0, Math.floor(values.paintingReadyQty));
  const paintingStatusQty = Math.max(0, Math.floor(values.paintingStatusQty));
  const completedReady = Math.max(0, Math.floor(values.completedReadyQty));
  const completedOutQty = Math.max(0, Math.floor(values.completedOutQty));
  const carpentryRemaining = Math.max(0, initialQty - paintingReady - completedReady);

  return {
    quantity: initialQty,
    carpentryQty: carpentryRemaining,
    paintingReady,
    paintingStatusQty,
    paintingBalance: Math.max(0, paintingReady - paintingStatusQty),
    completedReady,
    completedOutQty,
    completedBalance: Math.max(0, completedReady - completedOutQty),
  };
}

/** Parse YYYY-MM-DD as UTC midnight for consistent date filtering. */
export function parseWorkDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Invalid date (use YYYY-MM-DD)");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatWorkDateInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function workDateDayRange(dateStr: string): { gte: Date; lt: Date } {
  const gte = parseWorkDate(dateStr);
  const lt = new Date(gte);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte, lt };
}
