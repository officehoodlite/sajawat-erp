import ExcelJS from "exceljs";

export const WORKER_ENTRY_TEMPLATE_HEADERS = [
  "type",
  "workDate",
  "workerNames",
  "machinery (optional)",
  "mistri",
  "halfMistri",
  "helper",
  "hours",
] as const;

export async function downloadWorkerEntriesTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Worker entries");
  sheet.addRow([...WORKER_ENTRY_TEMPLATE_HEADERS]);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow([
    "MANUFACTURING",
    "2026-09-12",
    "Ramesh, Suresh",
    "CNC",
    2,
    0,
    1,
    8,
  ]);
  sheet.addRow([
    "PACKING",
    "2026-09-12",
    "Amit",
    "",
    1,
    0,
    2,
    8,
  ]);
  sheet.columns.forEach((col) => {
    col.width = 22;
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
  link.download = "worker-entries-template.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
