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
import type { BoardWastageSummaryDto } from "@/types/dto";
import { formatNumber, formatSqft } from "@/utils/format";
import { cn } from "@/lib/utils";

interface BoardWastageTableProps {
  rows: BoardWastageSummaryDto[];
  totalCalculated: number;
  totalActual: number;
}

export function BoardWastageTable({
  rows,
  totalCalculated,
  totalActual,
}: BoardWastageTableProps) {
  const totalWastage = totalActual - totalCalculated;
  const totalWastagePercent =
    totalCalculated > 0 ? (totalWastage / totalCalculated) * 100 : null;

  if (rows.length === 0) {
    return (
      <ErpPageSection title="Board Wastage">
        <p className="text-sm text-muted-foreground">
          Add calculated and actual board usage to see wastage.
        </p>
      </ErpPageSection>
    );
  }

  return (
    <ErpPageSection title="Board Wastage">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-10 px-4 text-xs font-semibold uppercase text-muted-foreground">
                Material
              </TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase text-muted-foreground">
                Calculated
              </TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase text-muted-foreground">
                Actual
              </TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase text-muted-foreground">
                Wastage
              </TableHead>
              <TableHead className="h-10 px-4 text-right text-xs font-semibold uppercase text-muted-foreground">
                Wastage %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.materialLabel} className="hover:bg-accent/60">
                <TableCell className="px-4 py-3 font-medium">{row.materialLabel}</TableCell>
                <TableCell className="px-4 py-3 text-right">{formatSqft(row.calculatedSqft)}</TableCell>
                <TableCell className="px-4 py-3 text-right">{formatSqft(row.actualSqft)}</TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-right font-semibold",
                    row.wastageSqft > 0 && "text-destructive",
                    row.wastageSqft < 0 && "text-emerald-600"
                  )}
                >
                  {formatSqft(row.wastageSqft)}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  {row.wastagePercent !== null
                    ? `${formatNumber(row.wastagePercent)}%`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
              <TableCell className="px-4 py-3">Total</TableCell>
              <TableCell className="px-4 py-3 text-right">{formatSqft(totalCalculated)}</TableCell>
              <TableCell className="px-4 py-3 text-right">{formatSqft(totalActual)}</TableCell>
              <TableCell
                className={cn(
                  "px-4 py-3 text-right",
                  totalWastage > 0 && "text-destructive",
                  totalWastage < 0 && "text-emerald-600"
                )}
              >
                {formatSqft(totalWastage)}
              </TableCell>
              <TableCell className="px-4 py-3 text-right">
                {totalWastagePercent !== null
                  ? `${formatNumber(totalWastagePercent)}%`
                  : "—"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </ErpPageSection>
  );
}
