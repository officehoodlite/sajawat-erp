/** Labels A … Z for a manufacturing model's partCount. */
export function partLabels(partCount: number): string[] {
  const n = Math.max(1, Math.min(26, Math.floor(partCount)));
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
}

/** Stored values may still be "Part A"; display and compare as "A". */
export function normalizePart(part: string): string {
  const trimmed = part.trim();
  const prefixed = /^part\s+([A-Za-z])$/i.exec(trimmed);
  if (prefixed) return prefixed[1].toUpperCase();
  if (/^[A-Za-z]$/.test(trimmed)) return trimmed.toUpperCase();
  return trimmed;
}

export function normalizeParts(parts: string[]): string[] {
  return [...new Set(parts.map(normalizePart))];
}

export function formatPartsDisplay(parts: string[]): string {
  return parts.map(normalizePart).join(", ");
}
