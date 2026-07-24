import type { BoardUsageSummaryDto, BoardWastageSummaryDto } from "@/types/dto";

export function computeBoardWastage(
  calculated: BoardUsageSummaryDto[],
  actual: BoardUsageSummaryDto[]
): BoardWastageSummaryDto[] {
  const map = new Map<string, { calculatedSqft: number; actualSqft: number }>();

  for (const item of calculated) {
    map.set(item.materialLabel, { calculatedSqft: item.totalSqft, actualSqft: 0 });
  }
  for (const item of actual) {
    const existing = map.get(item.materialLabel) ?? { calculatedSqft: 0, actualSqft: 0 };
    existing.actualSqft += item.totalSqft;
    map.set(item.materialLabel, existing);
  }

  return Array.from(map.entries())
    .map(([materialLabel, { calculatedSqft, actualSqft }]) => {
      const wastageSqft = actualSqft - calculatedSqft;
      const wastagePercent =
        calculatedSqft > 0 ? (wastageSqft / calculatedSqft) * 100 : null;
      return { materialLabel, calculatedSqft, actualSqft, wastageSqft, wastagePercent };
    })
    .sort((a, b) => a.materialLabel.localeCompare(b.materialLabel));
}
