"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCatalogModelLotSummaries } from "@/features/manufacturing/hooks/use-model-summary";
import type { CatalogModelLotSummariesDto, ModelLotSummaryDto } from "@/types/dto";
import { formatNumber } from "@/utils/format";
import { cn } from "@/lib/utils";

interface ModelSummaryLotsClientProps {
  productId: string;
  modelId: string;
}

type MatrixRow = {
  key: string;
  category: string;
  label: string;
  unit: string;
  lotValues: Record<string, number>;
};

function buildMatrixRows(lots: ModelLotSummaryDto[]): MatrixRow[] {
  const rows = new Map<string, MatrixRow>();

  const upsert = (
    category: string,
    label: string,
    unit: string,
    lotId: string,
    total: number
  ) => {
    const key = `${category}::${label}`;
    let row = rows.get(key);
    if (!row) {
      row = { key, category, label, unit, lotValues: {} };
      rows.set(key, row);
    }
    row.lotValues[lotId] = (row.lotValues[lotId] ?? 0) + total;
  };

  for (const lot of lots) {
    for (const line of lot.boards) {
      upsert("Boards", line.label, line.unit, lot.lotId, line.perUnit);
    }
    for (const line of lot.paints) {
      upsert("Paint", line.label, line.unit, lot.lotId, line.perUnit);
    }
    for (const line of lot.hardware) {
      upsert("Hardware", line.label, line.unit, lot.lotId, line.perUnit);
    }
    for (const line of lot.packing) {
      upsert("Packing", line.label, line.unit, lot.lotId, line.perUnit);
    }
  }

  const categoryOrder = ["Boards", "Paint", "Hardware", "Packing"];
  return Array.from(rows.values()).sort((a, b) => {
    const ca = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    if (ca !== 0) return ca;
    return a.label.localeCompare(b.label);
  });
}

function csvCell(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function exportModelLotsCsv(data: CatalogModelLotSummariesDto) {
  const matrixRows = buildMatrixRows(data.lots);
  const rows: Array<Array<string | number>> = [
    ["Product", data.productName],
    ["Model", data.modelName],
    ["Lots included", data.lots.length],
    [],
    [
      "Category",
      "Material",
      "Unit",
      ...data.lots.map((lot) => `Lot ${lot.lotNumber} (per unit)`),
    ],
    [
      "Model",
      "Quantity",
      "PCS",
      ...data.lots.map((lot) => lot.quantity),
    ],
  ];

  for (const row of matrixRows) {
    rows.push([
      row.category,
      row.label,
      row.unit,
      ...data.lots.map((lot) => row.lotValues[lot.lotId] ?? 0),
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${data.productName}-${data.modelName}-last-${data.lots.length}-lots.csv`
    .replaceAll(/[^a-zA-Z0-9._-]+/g, "-")
    .replaceAll(/-+/g, "-");
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MaterialLotsMatrix({ data }: { data: CatalogModelLotSummariesDto }) {
  const lots = data.lots;
  const rows = useMemo(() => buildMatrixRows(lots), [lots]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No material usage recorded in the recent lots for this model.
      </p>
    );
  }

  return (
    <ErpPageSection
      title="Material usage by lot"
      description="Columns are the most recent lots (newest first). Each value is the lot material total divided by that model's quantity in the lot."
    >
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 h-10 min-w-[100px] bg-muted/80 px-4 text-xs font-semibold uppercase text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="sticky left-[100px] z-10 h-10 min-w-[180px] bg-muted/80 px-4 text-xs font-semibold uppercase text-muted-foreground">
                Material
              </TableHead>
              {lots.map((lot) => (
                <TableHead
                  key={lot.lotId}
                  className="h-10 min-w-[100px] px-3 text-right text-xs font-semibold uppercase text-muted-foreground"
                >
                  <Link
                    href={`/manufacturing/${lot.lotId}`}
                    className="hover:text-primary hover:underline"
                  >
                    Lot {lot.lotNumber}
                  </Link>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-accent/60">
              <TableCell
                colSpan={2}
                className="sticky left-0 z-10 bg-background px-4 py-3 font-medium"
              >
                Quantity
              </TableCell>
              {lots.map((lot) => (
                <TableCell key={lot.lotId} className="px-3 py-3 text-right font-medium">
                  {formatNumber(lot.quantity)}
                </TableCell>
              ))}
            </TableRow>
            {rows.map((row, index) => {
              const prevCategory = index > 0 ? rows[index - 1].category : null;
              const isFirstOfCategory = row.category !== prevCategory;
              const categorySpan = isFirstOfCategory
                ? rows.slice(index).findIndex((r) => r.category !== row.category)
                : 0;
              const rowSpan =
                isFirstOfCategory
                  ? categorySpan === -1
                    ? rows.length - index
                    : categorySpan
                  : 0;

              return (
                <TableRow key={row.key} className="hover:bg-accent/60">
                  {isFirstOfCategory && (
                    <TableCell
                      rowSpan={rowSpan}
                      className="sticky left-0 z-10 bg-background px-4 py-3 align-top font-medium text-muted-foreground"
                    >
                      {row.category}
                    </TableCell>
                  )}
                  <TableCell className="sticky left-[100px] z-10 bg-background px-4 py-3">
                    <span className="font-medium">{row.label}</span>
                    <span className="ml-1 text-xs text-muted-foreground">{row.unit}</span>
                  </TableCell>
                  {lots.map((lot) => {
                    const value = row.lotValues[lot.lotId] ?? 0;
                    return (
                      <TableCell key={lot.lotId} className="px-3 py-3 text-right">
                        {value > 0 ? formatNumber(value) : "—"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </ErpPageSection>
  );
}

export function ModelSummaryLotsClient({ productId, modelId }: ModelSummaryLotsClientProps) {
  const { data, isLoading } = useCatalogModelLotSummaries(modelId);

  if (isLoading) {
    return (
      <ErpPage>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </ErpPage>
    );
  }

  if (!data) {
    return (
      <ErpPage>
        <p className="text-muted-foreground">Model not found</p>
        <Link
          href={`/model-summary/${productId}`}
          className={cn(buttonVariants({ variant: "link" }), "mt-2")}
        >
          Back to models
        </Link>
      </ErpPage>
    );
  }

  return (
    <ErpPage>
      <div className="flex items-start gap-3">
        <Link
          href={`/model-summary/${productId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "mt-1 shrink-0")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={`${data.productName} — ${data.modelName}`}
          description={`Material usage across the last ${data.lots.length} lot(s).`}
          className="flex-1"
        >
          {data.lots.length > 0 ? (
            <Button type="button" variant="outline" onClick={() => exportModelLotsCsv(data)}>
              <Download className="h-4 w-4" />
              Export last {data.lots.length} lots
            </Button>
          ) : null}
        </PageHeader>
      </div>

      {data.lots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This model has not been used in any manufacturing lots yet.
        </p>
      ) : (
        <MaterialLotsMatrix data={data} />
      )}
    </ErpPage>
  );
}
