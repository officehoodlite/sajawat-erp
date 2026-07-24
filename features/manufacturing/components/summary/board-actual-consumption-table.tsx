"use client";

import { ErpPageSection } from "@/components/shared/erp-page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BoardActualConsumptionRowDto, ModelSummaryDto } from "@/types/dto";
import { formatSqft } from "@/utils/format";
import { cn } from "@/lib/utils";

interface BoardActualConsumptionTableProps {
  rows: BoardActualConsumptionRowDto[];
  models: ModelSummaryDto[];
}

const VARIANCE_TOLERANCE = 0.000001;

export function BoardActualConsumptionTable({ rows, models }: BoardActualConsumptionTableProps) {
  if (rows.length === 0) {
    return (
      <ErpPageSection title="Actual Consumption">
        <p className="text-sm text-muted-foreground">
          Add calculated and actual board usage to see consumption by model.
        </p>
      </ErpPageSection>
    );
  }

  return (
    <ErpPageSection
      title="Actual Consumption"
      description="Carpenter usage adjusted by material wastage %, allocated per model."
    >
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="sticky left-0 z-10 h-10 min-w-[140px] bg-muted/80 px-4 text-xs font-semibold uppercase text-muted-foreground">
                Material
              </TableHead>
              {models.map((model) => (
                <TableHead
                  key={model.id}
                  className="h-10 min-w-[88px] px-3 text-right text-xs font-semibold uppercase text-muted-foreground"
                >
                  {model.modelName}
                </TableHead>
              ))}
              <TableHead className="h-10 min-w-[96px] px-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                Row Total
              </TableHead>
              <TableHead className="h-10 min-w-[96px] px-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                Actual
              </TableHead>
              <TableHead className="h-10 min-w-[88px] px-3 text-right text-xs font-semibold uppercase text-muted-foreground">
                Variance
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const hasVariance = Math.abs(row.variance) > VARIANCE_TOLERANCE;
              return (
                <TableRow key={row.materialLabel} className="hover:bg-accent/60">
                  <TableCell className="sticky left-0 z-10 bg-background px-4 py-3 font-medium">
                    {row.materialLabel}
                  </TableCell>
                  {models.map((model) => {
                    const value = row.modelValues[model.id] ?? 0;
                    return (
                      <TableCell key={model.id} className="px-3 py-3 text-right">
                        {value > 0 ? formatSqft(value) : "—"}
                      </TableCell>
                    );
                  })}
                  <TableCell className="px-3 py-3 text-right font-semibold text-primary">
                    {formatSqft(row.rowTotal)}
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">{formatSqft(row.actualSqft)}</TableCell>
                  <TableCell
                    className={cn(
                      "px-3 py-3 text-right font-medium",
                      hasVariance && "text-destructive"
                    )}
                  >
                    {formatSqft(row.variance)}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
              <TableCell className="sticky left-0 z-10 bg-muted/30 px-4 py-3">Total</TableCell>
              {models.map((model) => {
                const total = rows.reduce(
                  (sum, row) => roundRowValue(sum + (row.modelValues[model.id] ?? 0)),
                  0
                );
                return (
                  <TableCell key={model.id} className="px-3 py-3 text-right">
                    {total > 0 ? formatSqft(total) : "—"}
                  </TableCell>
                );
              })}
              <TableCell className="px-3 py-3 text-right text-primary">
                {formatSqft(rows.reduce((sum, row) => roundRowValue(sum + row.rowTotal), 0))}
              </TableCell>
              <TableCell className="px-3 py-3 text-right">
                {formatSqft(rows.reduce((sum, row) => roundRowValue(sum + row.actualSqft), 0))}
              </TableCell>
              <TableCell className="px-3 py-3 text-right">
                {formatSqft(rows.reduce((sum, row) => roundRowValue(sum + row.variance), 0))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {rows.some((r) => r.wastagePercent !== null) && (
        <p className="mt-2 text-xs text-muted-foreground">
          Cell value = carpenter usage × (1 + wastage % ÷ 100). Row total should match actual
          admin usage.
        </p>
      )}
    </ErpPageSection>
  );
}

function roundRowValue(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
