import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="border-b border-border bg-muted/50 px-4 py-3.5">
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-8 flex-1 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
