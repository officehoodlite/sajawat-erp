import { parseFirstSheetRows } from "@/lib/xlsx-rows";
import { lotWorkerRepository } from "@/repositories/manufacturing/lot-worker.repository";
import {
  createLotWorkerEntrySchema,
  type CreateLotWorkerEntryInput,
} from "@/validators/manufacturing";

const MAX_ROWS = 200;
const MAX_LOTS = 100;

export type WorkerImportResult = {
  lotCount: number;
  entryCount: number;
  errors: Array<{ row: number; message: string }>;
};

function excelRowNumber(index: number) {
  return index + 2;
}

function getField(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && value !== "") return value;
  }
  return "";
}

function parseWorkerRow(row: Record<string, string>, rowNumber: number): CreateLotWorkerEntryInput {
  const typeRaw = getField(row, "type").trim().toUpperCase();
  const type =
    typeRaw === "PACKING" || typeRaw === "P"
      ? "PACKING"
      : typeRaw === "MANUFACTURING" || typeRaw === "M" || typeRaw === "MFG"
        ? "MANUFACTURING"
        : null;
  if (!type) {
    throw new Error(`Row ${rowNumber}: type must be MANUFACTURING or PACKING`);
  }

  const workDate = getField(row, "workdate", "work date", "date");
  const workerNamesRaw = getField(row, "workernames", "worker names", "workers");
  const workerNames = workerNamesRaw
    .split(/[,;|]/)
    .map((name) => name.trim())
    .filter(Boolean);

  const packQtyRaw = getField(row, "packqty", "pack qty", "packqty (optional)");
  const payload = {
    type,
    workDate,
    workerNames,
    machinery: getField(row, "machinery", "machinery (optional)") || undefined,
    mistri: getField(row, "mistri"),
    halfMistri: getField(row, "halfmistri", "half mistri"),
    helper: getField(row, "helper"),
    hours: getField(row, "hours"),
    ...(packQtyRaw ? { packQty: packQtyRaw } : {}),
  };

  const parsed = createLotWorkerEntrySchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new Error(`Row ${rowNumber}: ${message || "Invalid row"}`);
  }
  return parsed.data;
}

export async function importWorkerEntriesForLots(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  lotIds: string[]
): Promise<WorkerImportResult> {
  const uniqueLotIds = [...new Set(lotIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueLotIds.length === 0) {
    throw new Error("Select at least one lot before importing");
  }
  if (uniqueLotIds.length > MAX_LOTS) {
    throw new Error(`Too many lots selected (max ${MAX_LOTS})`);
  }

  const sheetRows = await parseFirstSheetRows(buffer);
  if (sheetRows.length === 0) throw new Error("The spreadsheet has no data rows");
  if (sheetRows.length > MAX_ROWS) {
    throw new Error(`Too many rows (max ${MAX_ROWS})`);
  }

  const entries: CreateLotWorkerEntryInput[] = [];
  const errors: WorkerImportResult["errors"] = [];

  for (let i = 0; i < sheetRows.length; i++) {
    const rowNumber = excelRowNumber(i);
    try {
      entries.push(parseWorkerRow(sheetRows[i], rowNumber));
    } catch (error) {
      errors.push({
        row: rowNumber,
        message: error instanceof Error ? error.message.replace(/^Row \d+:\s*/, "") : "Invalid row",
      });
    }
  }

  if (entries.length === 0) {
    throw new Error(
      errors.length > 0
        ? `No valid rows to import. ${errors[0]?.message ?? ""}`
        : "No valid rows to import"
    );
  }

  const result = await lotWorkerRepository.createEntriesForLots(uniqueLotIds, entries);

  return {
    lotCount: result.lotCount,
    entryCount: result.entryCount,
    errors,
  };
}
