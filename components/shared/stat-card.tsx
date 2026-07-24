import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  highlight,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:shadow-modal",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-150 group-hover:bg-accent group-hover:text-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-[1.625rem] leading-none font-semibold tracking-tight text-foreground",
            highlight && "text-primary"
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="mt-2 text-[12px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
