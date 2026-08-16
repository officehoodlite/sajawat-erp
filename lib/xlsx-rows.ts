import ExcelJS from "exceljs";

export type SheetRow = Record<string, string>;

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/\(optional\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 20000 && value < 80000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      const date = new Date(excelEpoch + Math.round(value) * 86400000);
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
    return String(value);
  }
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

export async function parseFirstSheetRows(buffer: Buffer): Promise<SheetRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("The spreadsheet has no sheets");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = normalizeHeader(cellToString(cell.value));
  });

  const rows: SheetRow[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: SheetRow = {};
    let empty = true;
    headers.forEach((header, col) => {
      if (!header) return;
      const text = cellToString(row.getCell(col).value);
      record[header] = text;
      if (text) empty = false;
    });
    if (!empty) rows.push(record);
  });
  return rows;
}
