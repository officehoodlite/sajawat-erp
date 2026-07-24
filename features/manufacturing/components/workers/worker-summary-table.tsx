"use client";

import { useMemo } from "react";
import { ErpPageSection } from "@/components/shared/erp-page";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeWorkerLotTotals } from "@/lib/worker-labor";
import { roundDecimal } from "@/lib/decimal";
import type { LotWorkerEntryDto, LotWorkerRatesDto } from "@/types/dto";
import { formatNumber } from "@/utils/format";

interface WorkerSummaryTableProps {
  entries: LotWorkerEntryDto[];
  rates: LotWorkerRatesDto;
}

export function WorkerSummaryTable({ entries, rates }: WorkerSummaryTableProps) {
  const rows = useMemo(() => computeWorkerLotTotals(entries, rates), [entries, rates]);
  const grandTotal = useMemo(
    () => roundDecimal(rows.reduce((sum, row) => sum + row.total, 0)),
    [rows]
  );

  return (
    <ErpPageSection title="Worker Totals">
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No worker entries yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Labor Type</TableHead>
                <TableHead className="text-right">Total Count</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="font-medium">{row.category}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.count)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(row.rate)}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-primary">
                    {formatNumber(row.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-semibold">
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums text-primary">
                  {formatNumber(grandTotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </ErpPageSection>
  );
}
