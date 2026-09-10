"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { SkeletonTable } from "@/components/shared/skeleton-table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: TData) => void;
  onRowHover?: (row: TData) => void;
  className?: string;
  /** Tighter cell padding for wide tables (e.g. In-Production). */
  dense?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  emptyTitle = "No results",
  emptyDescription,
  emptyAction,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  onRowHover,
  className,
  dense = false,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <SkeletonTable cols={columns.length} />;

  if (!data.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="max-h-[calc(100vh-20rem)] overflow-auto">
          <Table className={dense ? "text-[12px]" : undefined}>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm [&_tr]:border-b [&_tr]:border-border">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "text-[11px] font-semibold text-muted-foreground uppercase",
                        dense
                          ? "h-9 px-1.5 tracking-[0.04em] whitespace-normal"
                          : "h-11 px-4 tracking-[0.08em]"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onMouseEnter={onRowHover ? () => onRowHover(row.original) : undefined}
                  className={cn(
                    "border-border transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        dense
                          ? "px-1.5 py-1.5 text-[12px] whitespace-normal"
                          : "px-4 py-3 text-[13px]"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {page !== undefined && totalPages !== undefined && onPageChange && (
        <div className="flex items-center justify-between px-1">
          <p className="text-[13px] text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
