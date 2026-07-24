import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Top-level module navigation — underline style */
export function ModuleTabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsList>) {
  return (
    <div className="w-full border-b border-border">
      <TabsList
        variant="line"
        className={cn(
          "flex h-auto w-full min-w-0 items-stretch justify-start gap-0 overflow-x-auto rounded-none bg-transparent p-0",
          "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          className
        )}
        {...props}
      >
        {children}
      </TabsList>
    </div>
  );
}

export function ModuleTabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsTrigger>) {
  return (
    <TabsTrigger
      className={cn(
        "relative inline-flex h-11 shrink-0 items-center justify-center border-0 bg-transparent px-5 shadow-none",
        "-mb-px rounded-none border-b-2 border-transparent",
        "text-[13px] font-medium text-muted-foreground",
        "transition-[color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "hover:text-primary",
        "data-active:border-primary data-active:text-primary data-active:font-semibold",
        "focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-40",
        "after:hidden",
        className
      )}
      {...props}
    >
      {children}
    </TabsTrigger>
  );
}
