"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardConsumption } from "@/features/inventory/hooks/use-inventory";
import { PAGE_SIZE } from "@/lib/pagination";
import type { BoardConsumptionDto } from "@/types/dto";
import { formatDate, formatNumber } from "@/utils/format";

export function BoardConsumptionTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;

  const { data, isLoading } = useBoardConsumption(page, limit, debouncedSearch);

  const columns: ColumnDef<BoardConsumptionDto>[] = [
    {
      accessorKey: "consumedAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.consumedAt),
    },
    {
      header: "Product",
      cell: ({ row }) => `${row.original.materialName} ${row.original.thickness}`,
    },
    { accessorKey: "lotNumber", header: "Lot" },
    { accessorKey: "modelName", header: "Model" },
    {
      accessorKey: "quantity",
      header: "Qty (SqFt)",
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
  ];

  if (isLoading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <PageToolbar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search consumption...",
        }}
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />
    </div>
  );
}
