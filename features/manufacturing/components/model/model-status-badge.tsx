import { Badge } from "@/components/ui/badge";
import type { ModelStatus } from "@/features/manufacturing/utils/consumption";

const labels: Record<ModelStatus, string> = {
  empty: "Empty",
  "in-progress": "In Progress",
  ready: "Ready",
};

const variants: Record<ModelStatus, "secondary" | "outline" | "default"> = {
  empty: "secondary",
  "in-progress": "outline",
  ready: "default",
};

export function ModelStatusBadge({ status }: { status: ModelStatus }) {
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}
