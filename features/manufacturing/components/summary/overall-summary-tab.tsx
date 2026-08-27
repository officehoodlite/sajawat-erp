"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BoardByModelTable,
  MaterialByModelTable,
} from "@/features/manufacturing/components/summary/material-by-model-table";
import { useCurrentUser } from "@/features/users/hooks/use-users";
import { downloadCsv } from "@/lib/csv-download";
import { roundDecimal } from "@/lib/decimal";
import { computeWorkerLotTotals } from "@/lib/worker-labor";
import type { LotSummaryDto } from "@/types/dto";
import { formatNumber } from "@/utils/format";

interface OverallSummaryTabProps {
  lot: LotSummaryDto;
}

function downloadOverallSummary(lot: LotSummaryDto, includeWorkerPrices: boolean) {
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
  appendMaterials("Edge Binding", lot.edgeBindingByModel);
  appendMaterials("Glass", lot.glassByModel);

  rows.push([]);
  rows.push(["Worker Summary"]);
  const totals = computeWorkerLotTotals(lot.workerEntries, lot.workerRates);
  if (includeWorkerPrices) {
    rows.push(["Labor Type", "Total Count", "Rate", "Total"]);
    for (const row of totals) {
      rows.push([row.category, row.count, row.rate, row.total]);
    }
    const grandTotal = roundDecimal(totals.reduce((sum, row) => sum + row.total, 0));
    rows.push(["Grand Total", "", "", grandTotal]);
  } else {
    rows.push(["Labor Type", "Total Count"]);
    for (const row of totals) {
      rows.push([row.category, row.count]);
    }
  }

  rows.push([]);
  rows.push(["Worker Entries"]);
  rows.push(["Type", "Date", "Workers", "Mistri", "Half mistri", "Helper", "Hours", "Pack qty"]);
  for (const entry of lot.workerEntries) {
    rows.push([
      entry.type,
      entry.workDate.slice(0, 10),
      entry.workerNames.join(", "),
      entry.mistri,
      entry.halfMistri,
      entry.helper,
      entry.hours,
      entry.packQty ?? "",
    ]);
  }

  downloadCsv(`lot-${lot.lotNumber}-overall-summary.csv`, rows);
}

export function OverallSummaryTab({ lot }: OverallSummaryTabProps) {
  const { data: me } = useCurrentUser();
  const includeWorkerPrices = me?.workerPrices === true;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadOverallSummary(lot, includeWorkerPrices)}
        >
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
      <MaterialByModelTable
        title="Edge Binding"
        description="Edge binding usage by model (scaled by model quantity)."
        rows={lot.edgeBindingByModel}
        models={lot.models}
        formatValue={(value, unit) => `${formatNumber(value)} ${unit}`}
      />
      <MaterialByModelTable
        title="Glass"
        description="Glass usage by model (scaled by model quantity)."
        rows={lot.glassByModel}
        models={lot.models}
        formatValue={(value, unit) => `${formatNumber(value)} ${unit}`}
      />
    </div>
  );
}
