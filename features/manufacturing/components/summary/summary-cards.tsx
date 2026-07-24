import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SummaryCardItem {
  label: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
  icon?: LucideIcon;
}

interface SummaryCardsProps {
  items: SummaryCardItem[];
  className?: string;
}

export function SummaryCards({ items, className }: SummaryCardsProps) {
  return (
    <StatCardGrid className={cn(className)}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          highlight={item.highlight}
        />
      ))}
    </StatCardGrid>
  );
}
