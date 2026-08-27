import ExcelJS from "exceljs";
import { parseFirstSheetRows } from "@/lib/xlsx-rows";

export type CatalogPresetImportKind =
  | "boards"
  | "paint"
  | "hardware"
  | "packing"
  | "edgebinding"
  | "glass";

export type CatalogImportOption = { id: string; label: string };

export type CatalogImportedBoard = {
  boardThicknessId: string;
  label: string;
  length: number;
  width: number;
  quantity: number;
};

export type CatalogImportedQty = {
  productId: string;
  label: string;
  quantity: number;
};

const BOARD_HEADERS = ["material", "thickness", "length", "width", "quantity"] as const;
const QTY_HEADERS = ["product", "quantity"] as const;

function normalizeLabel(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function findOption(options: CatalogImportOption[], ...parts: string[]) {
  const needle = normalizeLabel(parts.filter(Boolean).join(" "));
  if (!needle) return undefined;
  return (
    options.find((o) => normalizeLabel(o.label) === needle) ??
    options.find((o) => normalizeLabel(o.label).includes(needle))
  );
}

function parseNumber(value: string | undefined, field: string, row: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Row ${row}: ${field} must be a number`);
  }
  return n;
}

export async function downloadCatalogPresetTemplate(kind: CatalogPresetImportKind) {
  const headers = kind === "boards" ? [...BOARD_HEADERS] : [...QTY_HEADERS];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Defaults");
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((col) => {
    col.width = 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes =
    buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as ArrayBuffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-default-materials-template.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function parseCatalogPresetImport(
  kind: CatalogPresetImportKind,
  file: File,
  options: CatalogImportOption[]
): Promise<{ boards: CatalogImportedBoard[]; qty: CatalogImportedQty[]; errors: string[] }> {
  const rows = await parseFirstSheetRows(await file.arrayBuffer());
  const boards: CatalogImportedBoard[] = [];
  const qty: CatalogImportedQty[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const n = index + 2;
    try {
      if (kind === "boards") {
        const material = row.material?.trim() ?? "";
        const thickness = row.thickness?.trim() ?? "";
        if (!material || !thickness) {
          throw new Error(`Row ${n}: material and thickness are required`);
        }
        const option = findOption(options, material, thickness);
        if (!option) {
          throw new Error(`Row ${n}: unknown board "${material} ${thickness}"`);
        }
        boards.push({
          boardThicknessId: option.id,
          label: option.label,
          length: parseNumber(row.length, "length", n),
          width: parseNumber(row.width, "width", n),
          quantity: parseNumber(row.quantity, "quantity", n),
        });
        return;
      }

      const product = row.product?.trim() ?? "";
      if (!product) throw new Error(`Row ${n}: product is required`);
      const option = findOption(options, product);
      if (!option) throw new Error(`Row ${n}: unknown product "${product}"`);
      qty.push({
        productId: option.id,
        label: option.label,
        quantity: parseNumber(row.quantity, "quantity", n),
      });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Row ${n}: import failed`);
    }
  });

  return { boards, qty, errors };
}
