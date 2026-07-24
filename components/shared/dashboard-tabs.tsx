import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Secondary navigation — pill style (detail pages, sub-sections) */
export function SecondaryTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <TabsList
      variant="dashboard"
      className={cn(
        "flex h-auto w-full min-w-0 items-center justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 sm:gap-2",
        "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      {children}
    </TabsList>
  );
}

export function SecondaryTabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "inline-flex h-9 shrink-0 items-center justify-center rounded-lg px-3.5 sm:px-4",
        "border-0 bg-transparent text-[13px] font-medium text-muted-foreground shadow-none",
        "transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:bg-muted hover:text-foreground",
        "data-active:bg-primary data-active:text-primary-foreground data-active:font-medium",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
        "after:hidden",
        "pressable",
        className
      )}
      {...props}
    >
      {children}
    </TabsTrigger>
  );
}

/** @deprecated Use SecondaryTabsList */
export const DashboardTabsList = SecondaryTabsList;

/** @deprecated Use SecondaryTabsTrigger */
export const DashboardTabsTrigger = SecondaryTabsTrigger;

/** @deprecated Use SecondaryTabsList */
export const ProminentTabsList = SecondaryTabsList;

/** @deprecated Use SecondaryTabsTrigger */
export const ProminentTabsTrigger = SecondaryTabsTrigger;
