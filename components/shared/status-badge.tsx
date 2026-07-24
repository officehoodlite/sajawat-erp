import type { LotStatus } from "@/types/enums";
import { LOT_STATUS_LABELS } from "@/types/enums";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<LotStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300",
  IN_PRODUCTION: "bg-primary/10 text-primary border-primary/25",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
};

export function StatusBadge({ status }: { status: LotStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
      {LOT_STATUS_LABELS[status]}
    </Badge>
  );
}
