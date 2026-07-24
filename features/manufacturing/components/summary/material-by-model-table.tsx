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
import type { MaterialByModelRowDto, ModelSummaryDto } from "@/types/dto";
import { formatNumber, formatSqft } from "@/utils/format";

interface MaterialByModelTableProps {
  title: string;
  description?: string;
  rows: MaterialByModelRowDto[];
  models: ModelSummaryDto[];
  formatValue?: (value: number, unit: string) => string;
}

export function MaterialByModelTable({
  title,
  description,
  rows,
  models,
  formatValue = (value, unit) => `${formatNumber(value)} ${unit}`,
}: MaterialByModelTableProps) {
  if (rows.length === 0) {
    return (
      <ErpPageSection title={title}>
        <p className="text-sm text-muted-foreground">No usage recorded.</p>
      </ErpPageSection>
    );
  }

  return (
    <ErpPageSection title={title} description={description}>
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
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.materialLabel} className="hover:bg-accent/60">
                <TableCell className="sticky left-0 z-10 bg-background px-4 py-3 font-medium">
                  {row.materialLabel}
                </TableCell>
                {models.map((model) => {
                  const value = row.modelValues[model.id] ?? 0;
                  return (
                    <TableCell key={model.id} className="px-3 py-3 text-right">
                      {value > 0 ? formatValue(value, row.unit) : "—"}
                    </TableCell>
                  );
                })}
                <TableCell className="px-3 py-3 text-right font-medium">
                  {formatValue(row.rowTotal, row.unit)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ErpPageSection>
  );
}

interface BoardByModelTableProps {
  rows: Array<{
    materialLabel: string;
    modelValues: Record<string, number>;
    rowTotal: number;
  }>;
  models: ModelSummaryDto[];
}

export function BoardByModelTable({ rows, models }: BoardByModelTableProps) {
  if (rows.length === 0) {
    return (
      <ErpPageSection title="Boards">
        <p className="text-sm text-muted-foreground">No board usage recorded.</p>
      </ErpPageSection>
    );
  }

  return (
    <ErpPageSection title="Boards" description="Actual board consumption by model (sqft).">
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
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
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
                <TableCell className="px-3 py-3 text-right font-medium">
                  {formatSqft(row.rowTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ErpPageSection>
  );
}
