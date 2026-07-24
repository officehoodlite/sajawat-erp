import { roundDecimal } from "@/lib/decimal";
import type { LotWorkerEntryDto, LotWorkerRatesDto, LotWorkerSummaryDto, LotWorkerCategoryTotalDto } from "@/types/dto";

export type WorkerEntryType = "MANUFACTURING" | "PACKING";

export interface WorkerEntryInput {
  type: WorkerEntryType;
  mistri: number;
  halfMistri: number;
  helper: number;
  hours: number;
  workerNames: string[];
}

export const DEFAULT_WORKER_RATES: LotWorkerRatesDto = {
  mfgMistriRate: 0,
  mfgHalfMistriRate: 0,
  mfgHelperRate: 0,
  packingMistriRate: 0,
  packingHalfMistriRate: 0,
  packingHelperRate: 0,
};

export function computeLaborUnits(mistri: number, halfMistri: number, helper: number, hours: number) {
  const h = hours;
  return {
    tMistri: mistri * h,
    hMistri: halfMistri * h,
    tHelper: helper * h,
  };
}

export function mapWorkerRates(row: {
  mfgMistriRate: unknown;
  mfgHalfMistriRate: unknown;
  mfgHelperRate: unknown;
  packingMistriRate: unknown;
  packingHalfMistriRate: unknown;
  packingHelperRate: unknown;
} | null | undefined): LotWorkerRatesDto {
  if (!row) return { ...DEFAULT_WORKER_RATES };
  return {
    mfgMistriRate: roundDecimal(Number(row.mfgMistriRate)),
    mfgHalfMistriRate: roundDecimal(Number(row.mfgHalfMistriRate)),
    mfgHelperRate: roundDecimal(Number(row.mfgHelperRate)),
    packingMistriRate: roundDecimal(Number(row.packingMistriRate)),
    packingHalfMistriRate: roundDecimal(Number(row.packingHalfMistriRate)),
    packingHelperRate: roundDecimal(Number(row.packingHelperRate)),
  };
}

export function mapWorkerEntry(row: {
  id: string;
  type: WorkerEntryType;
  workDate: Date;
  workerNames: string[];
  machinery: string | null;
  mistri: number;
  halfMistri: number;
  helper: number;
  hours: number;
  packQty: number | null;
}): LotWorkerEntryDto {
  const units = computeLaborUnits(row.mistri, row.halfMistri, row.helper, row.hours);
  return {
    id: row.id,
    type: row.type,
    workDate: row.workDate.toISOString(),
    workerNames: row.workerNames,
    machinery: row.machinery,
    mistri: row.mistri,
    halfMistri: row.halfMistri,
    helper: row.helper,
    hours: row.hours,
    packQty: row.packQty,
    ...units,
  };
}

interface WorkerAccumulator {
  workerName: string;
  mfgTMistri: number;
  mfgHMistri: number;
  mfgTHelper: number;
  packTMistri: number;
  packHMistri: number;
  packTHelper: number;
}

function emptyAccumulator(workerName: string): WorkerAccumulator {
  return {
    workerName,
    mfgTMistri: 0,
    mfgHMistri: 0,
    mfgTHelper: 0,
    packTMistri: 0,
    packHMistri: 0,
    packTHelper: 0,
  };
}

export function computeWorkerLotTotals(
  entries: LotWorkerEntryDto[],
  rates: LotWorkerRatesDto
): LotWorkerCategoryTotalDto[] {
  let mfgMistri = 0;
  let mfgHalfMistri = 0;
  let mfgHelper = 0;
  let packMistri = 0;
  let packHalfMistri = 0;
  let packHelper = 0;

  for (const entry of entries) {
    if (entry.type === "MANUFACTURING") {
      mfgMistri += entry.mistri;
      mfgHalfMistri += entry.halfMistri;
      mfgHelper += entry.helper;
    } else {
      packMistri += entry.mistri;
      packHalfMistri += entry.halfMistri;
      packHelper += entry.helper;
    }
  }

  const rows: Array<{ category: string; count: number; rate: number }> = [
    { category: "Manufacturing Mistri", count: mfgMistri, rate: rates.mfgMistriRate },
    { category: "Manufacturing Half Mistri", count: mfgHalfMistri, rate: rates.mfgHalfMistriRate },
    { category: "Manufacturing Helper", count: mfgHelper, rate: rates.mfgHelperRate },
    { category: "Packing Mistri", count: packMistri, rate: rates.packingMistriRate },
    { category: "Packing Half Mistri", count: packHalfMistri, rate: rates.packingHalfMistriRate },
    { category: "Packing Helper", count: packHelper, rate: rates.packingHelperRate },
  ];

  return rows.map((row) => ({
    ...row,
    total: roundDecimal(row.count * row.rate),
  }));
}

export function computeLaborPerQty(
  entries: LotWorkerEntryDto[],
  rates: LotWorkerRatesDto,
  totalQty: number
): { carpentryPerQty: number; packingPerQty: number } {
  const totals = computeWorkerLotTotals(entries, rates);
  const carpentryTotal = roundDecimal(
    totals
      .filter((row) => row.category.startsWith("Manufacturing"))
      .reduce((sum, row) => sum + row.total, 0)
  );
  const packingTotal = roundDecimal(
    totals
      .filter((row) => row.category.startsWith("Packing"))
      .reduce((sum, row) => sum + row.total, 0)
  );

  if (totalQty <= 0) {
    return { carpentryPerQty: 0, packingPerQty: 0 };
  }

  return {
    carpentryPerQty: roundDecimal(carpentryTotal / totalQty),
    packingPerQty: roundDecimal(packingTotal / totalQty),
  };
}

export function computeWorkerSummaries(
  entries: LotWorkerEntryDto[],
  rates: LotWorkerRatesDto
): LotWorkerSummaryDto[] {
  const byWorker = new Map<string, WorkerAccumulator>();

  for (const entry of entries) {
    const names = entry.workerNames.map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) continue;

    const share = 1 / names.length;
    for (const name of names) {
      const acc = byWorker.get(name) ?? emptyAccumulator(name);
      if (entry.type === "MANUFACTURING") {
        acc.mfgTMistri += entry.tMistri * share;
        acc.mfgHMistri += entry.hMistri * share;
        acc.mfgTHelper += entry.tHelper * share;
      } else {
        acc.packTMistri += entry.tMistri * share;
        acc.packHMistri += entry.hMistri * share;
        acc.packTHelper += entry.tHelper * share;
      }
      byWorker.set(name, acc);
    }
  }

  return Array.from(byWorker.values())
    .map((acc) => {
      const mfgTMistriAmount = roundDecimal(acc.mfgTMistri * rates.mfgMistriRate);
      const mfgHMistriAmount = roundDecimal(acc.mfgHMistri * rates.mfgHalfMistriRate);
      const mfgTHelperAmount = roundDecimal(acc.mfgTHelper * rates.mfgHelperRate);
      const packTMistriAmount = roundDecimal(acc.packTMistri * rates.packingMistriRate);
      const packHMistriAmount = roundDecimal(acc.packHMistri * rates.packingHalfMistriRate);
      const packTHelperAmount = roundDecimal(acc.packTHelper * rates.packingHelperRate);
      const totalAmount = roundDecimal(
        mfgTMistriAmount +
          mfgHMistriAmount +
          mfgTHelperAmount +
          packTMistriAmount +
          packHMistriAmount +
          packTHelperAmount
      );

      return {
        workerName: acc.workerName,
        mfgTMistri: acc.mfgTMistri,
        mfgHMistri: acc.mfgHMistri,
        mfgTHelper: acc.mfgTHelper,
        packTMistri: acc.packTMistri,
        packHMistri: acc.packHMistri,
        packTHelper: acc.packTHelper,
        mfgTMistriAmount,
        mfgHMistriAmount,
        mfgTHelperAmount,
        packTMistriAmount,
        packHMistriAmount,
        packTHelperAmount,
        totalAmount,
      };
    })
    .sort((a, b) => a.workerName.localeCompare(b.workerName));
}
