import { cn } from "@/lib/utils";

export function ErpPage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-8", className)}>{children}</div>;
}

export function ErpPageSection({
  title,
  description,
  actions,
  children,
  className,
  noPadding,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-soft",
        !noPadding && "p-6 sm:p-7",
        className
      )}
    >
      {(title || description || actions) && (
        <div
          className={cn(
            "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
            actions && !title && !description && "mb-4"
          )}
        >
          {(title || description) && (
            <div className="min-w-0">
              {title && (
                <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
