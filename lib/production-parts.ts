/** Labels Part A … Part Z for a manufacturing model's partCount. */
export function partLabels(partCount: number): string[] {
  const n = Math.max(1, Math.min(26, Math.floor(partCount)));
  return Array.from({ length: n }, (_, i) => `Part ${String.fromCharCode(65 + i)}`);
}
