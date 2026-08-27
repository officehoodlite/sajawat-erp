import ExcelJS from "exceljs";

export const BOARD_PURCHASE_TEMPLATE_HEADERS = [
  "id (optional)",
  "material",
  "thickness",
  "purchaseSqft",
  "purchaseDate",
  "supplier (optional)",
  "rate (optional)",
] as const;

export const PAINT_PACKING_PURCHASE_TEMPLATE_HEADERS = [
  "id (optional)",
  "product",
  "quantity",
  "purchaseDate",
  "supplier (optional)",
  "invoice (optional)",
  "rate (optional)",
  "remarks (optional)",
] as const;

export const HARDWARE_PURCHASE_TEMPLATE_HEADERS = [
  "id (optional)",
  "product",
  "quantity",
  "purchaseDate",
  "supplier (optional)",
  "rate (optional)",
  "remarks (optional)",
] as const;

export async function downloadPurchaseTemplate(
  kind: "boards" | "paint" | "hardware" | "packing" | "edgebinding"
) {
  const headers =
    kind === "boards"
      ? [...BOARD_PURCHASE_TEMPLATE_HEADERS]
      : kind === "hardware" || kind === "edgebinding"
        ? [...HARDWARE_PURCHASE_TEMPLATE_HEADERS]
        : [...PAINT_PACKING_PURCHASE_TEMPLATE_HEADERS];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Purchases");
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((col) => {
    col.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as ArrayBuffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-purchases-template.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
