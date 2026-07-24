import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatSqft } from "@/utils/format";

interface BoardSummaryItem {
  materialLabel: string;
  totalSqft: number;
}

interface BoardSummaryCardProps {
  items: BoardSummaryItem[];
  totalSqft: number;
  modelQuantity?: number;
}

export function BoardSummaryCard({ items, totalSqft, modelQuantity }: BoardSummaryCardProps) {
  if (items.length === 0) return null;

  return (
    <Card className="rounded-2xl shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Board Summary</CardTitle>
        {modelQuantity != null && modelQuantity > 1 && (
          <p className="text-xs text-muted-foreground">
            Totals for {modelQuantity} units (per-unit entry × model quantity)
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.materialLabel}
            className="flex items-center justify-between rounded-lg border px-4 py-2.5"
          >
            <span className="text-sm font-medium">{item.materialLabel}</span>
            <span className="text-sm text-primary">{formatSqft(item.totalSqft)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between px-1 py-1">
          <span className="font-semibold">Total Board Used</span>
          <span className="text-lg font-semibold text-primary">{formatSqft(totalSqft)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
