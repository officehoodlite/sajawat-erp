"use client";

import {
  computeLaborPerQty,
  computeWorkerLotTotals,
} from "@/lib/worker-labor";
import type { LotSummaryDto } from "@/types/dto";
import type ExcelJS from "exceljs";

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  header: string[],
  rows: Array<Array<string | number | null>>
) {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(row);
  }
  sheet.columns.forEach((col) => {
    col.width = 18;
  });
}

function materialRows(
  lot: LotSummaryDto,
  category: string,
  rows: LotSummaryDto["paintByModel"]
) {
  return rows.map((row) => [
    category,
    row.materialLabel,
    row.unit,
    ...lot.models.map((model) => row.modelValues[model.id] ?? 0),
    row.rowTotal,
  ]);
}

export async function downloadLotExcel(lot: LotSummaryDto, includeWorkerPrices: boolean) {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const modelHeaders = lot.models.map((model) => `${model.modelName} (qty ${model.quantity})`);

  addSheet(
    workbook,
    "Models",
    ["Product", "Model", "Qty", "Parts", "Board sqft"],
    lot.models.map((model) => [
      model.productName,
      model.modelName,
      model.quantity,
      model.partCount,
      model.totalBoardSqft,
    ])
  );

  addSheet(
    workbook,
    "Board",
    ["Material", "Calculated sqft", "Actual sqft", "Wastage sqft", "Wastage %"],
    lot.boardWastageSummary.map((row) => [
      row.materialLabel,
      row.calculatedSqft,
      row.actualSqft,
      row.wastageSqft,
      row.wastagePercent,
    ])
  );

  addSheet(
    workbook,
    "Paint",
    ["Material", "Unit", "Quantity"],
    lot.paintConsumption.map((row) => [row.name, row.unit, row.quantity])
  );
  addSheet(
    workbook,
    "Hardware",
    ["Material", "Unit", "Quantity"],
    lot.hardwareConsumption.map((row) => [row.name, row.unit, row.quantity])
  );
  addSheet(
    workbook,
    "Packing",
    ["Material", "Unit", "Quantity"],
    lot.packingConsumption.map((row) => [row.name, row.unit, row.quantity])
  );
  addSheet(
    workbook,
    "Edge Binding",
    ["Material", "Unit", "Quantity"],
    lot.edgeBindingConsumption.map((row) => [row.name, row.unit, row.quantity])
  );

  addSheet(
    workbook,
    "Worker entries",
    ["Type", "Date", "Workers", "Mistri", "Half mistri", "Helper", "Hours", "Pack qty"],
    lot.workerEntries.map((entry) => [
      entry.type,
      entry.workDate.slice(0, 10),
      entry.workerNames.join(", "),
      entry.mistri,
      entry.halfMistri,
      entry.helper,
      entry.hours,
      entry.packQty,
    ])
  );

  if (includeWorkerPrices) {
    const totals = computeWorkerLotTotals(lot.workerEntries, lot.workerRates);
    addSheet(
      workbook,
      "Labor rates",
      ["Rate", "Value"],
      [
        ["Manufacturing mistri", lot.workerRates.mfgMistriRate],
        ["Manufacturing half mistri", lot.workerRates.mfgHalfMistriRate],
        ["Manufacturing helper", lot.workerRates.mfgHelperRate],
        ["Packing mistri", lot.workerRates.packingMistriRate],
        ["Packing half mistri", lot.workerRates.packingHalfMistriRate],
        ["Packing helper", lot.workerRates.packingHelperRate],
      ]
    );
    addSheet(
      workbook,
      "Worker totals",
      ["Labor type", "Count", "Rate", "Total"],
      totals.map((row) => [row.category, row.count, row.rate, row.total])
    );

    const totalQty = lot.models.reduce((sum, model) => sum + model.quantity, 0);
    const perQty = computeLaborPerQty(lot.workerEntries, lot.workerRates, totalQty);
    addSheet(
      workbook,
      "Labor per qty",
      ["Labor", ...modelHeaders],
      [
        ["Carpentry Labor", ...lot.models.map(() => perQty.carpentryPerQty)],
        ["Packing Labor", ...lot.models.map(() => perQty.packingPerQty)],
        [
          "Polish Labor",
          ...lot.models.map((model) => model.polishLaborPerQty),
        ],
      ]
    );
  }

  addSheet(
    workbook,
    "Overall",
    ["Category", "Material", "Unit", ...modelHeaders, "Total"],
    [
      [
        "Models",
        "Quantity",
        "PCS",
        ...lot.models.map((model) => model.quantity),
        lot.models.reduce((sum, model) => sum + model.quantity, 0),
      ],
      ...lot.boardActualConsumption.map((row) => [
        "Boards",
        row.materialLabel,
        "SQFT",
        ...lot.models.map((model) => row.modelValues[model.id] ?? 0),
        row.rowTotal,
      ]),
      ...materialRows(lot, "Paint", lot.paintByModel),
      ...materialRows(lot, "Hardware", lot.hardwareByModel),
      ...materialRows(lot, "Packing", lot.packingByModel),
      ...materialRows(lot, "Edge Binding", lot.edgeBindingByModel),
    ]
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as ArrayBuffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lot-${lot.lotNumber}.xlsx`
    .replaceAll(/[^a-zA-Z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
