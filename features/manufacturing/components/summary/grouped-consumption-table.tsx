import { ErpPageSection } from "@/components/shared/erp-page";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSqft } from "@/utils/format";

export interface ConsumptionRow {
  name: string;
  value: number;
  unit?: string;
}

interface GroupedConsumptionTableProps {
  title: string;
  nameHeader: string;
  valueHeader: string;
  rows: ConsumptionRow[];
  formatAsSqft?: boolean;
  emptyMessage?: string;
}

export function GroupedConsumptionTable({
  title,
  nameHeader,
  valueHeader,
  rows,
  formatAsSqft = false,
  emptyMessage = "No consumption recorded.",
}: GroupedConsumptionTableProps) {
  const formatValue = (row: ConsumptionRow) => {
    if (formatAsSqft) return formatSqft(row.value);
    if (row.unit) return `${row.value} ${row.unit}`;
    return String(row.value);
  };

  return (
    <ErpPageSection title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 px-4 text-xs font-semibold text-muted-foreground uppercase">
                  {nameHeader}
                </TableHead>
                <TableHead className="h-10 px-4 text-right text-xs font-semibold text-muted-foreground uppercase">
                  {valueHeader}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.name} className="hover:bg-accent/60">
                  <TableCell className="px-4 py-3 font-medium">{row.name}</TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold text-primary">
                    {formatValue(row)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </ErpPageSection>
  );
}
