"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BoardByModelTable,
  MaterialByModelTable,
} from "@/features/manufacturing/components/summary/material-by-model-table";
import type { LotSummaryDto } from "@/types/dto";
import { formatNumber } from "@/utils/format";

interface OverallSummaryTabProps {
  lot: LotSummaryDto;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function downloadOverallSummary(lot: LotSummaryDto) {
  const modelHeaders = lot.models.map((model) => model.modelName);
  const rows: Array<Array<string | number>> = [
    ["Lot", lot.lotNumber],
    [],
    ["Category", "Material", "Unit", ...modelHeaders, "Total"],
    [
      "Models",
      "Quantity",
      "PCS",
      ...lot.models.map((model) => model.quantity),
      lot.models.reduce((sum, model) => sum + model.quantity, 0),
    ],
  ];

  for (const row of lot.boardActualConsumption) {
    rows.push([
      "Boards",
      row.materialLabel,
      "SQFT",
      ...lot.models.map((model) => row.modelValues[model.id] ?? 0),
      row.rowTotal,
    ]);
  }

  const appendMaterials = (
    category: string,
    materialRows: LotSummaryDto["paintByModel"]
  ) => {
    for (const row of materialRows) {
      rows.push([
        category,
        row.materialLabel,
        row.unit,
        ...lot.models.map((model) => row.modelValues[model.id] ?? 0),
        row.rowTotal,
      ]);
    }
  };

  appendMaterials("Paint", lot.paintByModel);
  appendMaterials("Hardware", lot.hardwareByModel);
  appendMaterials("Packing", lot.packingByModel);

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lot-${lot.lotNumber}-overall-summary.csv`
    .replaceAll(/[^a-zA-Z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function OverallSummaryTab({ lot }: OverallSummaryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => downloadOverallSummary(lot)}>
          <Download className="h-4 w-4" />
          Export overall summary
        </Button>
      </div>
      <BoardByModelTable rows={lot.boardActualConsumption} models={lot.models} />
      <MaterialByModelTable
        title="Paint"
        description="Paint usage by model."
        rows={lot.paintByModel}
        models={lot.models}
        formatValue={(value, unit) => `${formatNumber(value)} ${unit}`}
      />
      <MaterialByModelTable
        title="Hardware"
        description="Hardware usage by model (scaled by model quantity)."
        rows={lot.hardwareByModel}
        models={lot.models}
        formatValue={(value, unit) => `${formatNumber(value)} ${unit}`}
      />
      <MaterialByModelTable
        title="Packing"
        description="Packing usage by model."
        rows={lot.packingByModel}
        models={lot.models}
        formatValue={(value, unit) => `${formatNumber(value)} ${unit}`}
      />
    </div>
  );
}
