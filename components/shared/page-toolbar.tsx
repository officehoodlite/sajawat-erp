import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PageToolbarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function PageToolbar({
  search,
  filters,
  actions,
  className,
  bordered = false,
}: PageToolbarProps) {
  const hasLeft = search || filters;

  if (!hasLeft && !actions) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        hasLeft ? "sm:justify-between" : "sm:justify-end",
        bordered && "rounded-2xl border border-border bg-card p-4 shadow-soft",
        className
      )}
    >
      {hasLeft && (
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {search && (
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder ?? "Search..."}
                className="h-9 pl-9"
              />
            </div>
          )}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        </div>
      )}
      {actions && <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>}
    </div>
  );
}
