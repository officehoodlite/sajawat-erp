"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaterialConsumption } from "@/features/inventory/hooks/use-material-module";
import { PAGE_SIZE } from "@/lib/pagination";
import type { MaterialModuleType } from "@/types/enums";
import { UNIT_LABELS } from "@/types/enums";
import type { MaterialConsumptionDto } from "@/types/material-module";
import { formatDate, formatNumber } from "@/utils/format";

interface ConsumptionTabProps {
  type: MaterialModuleType;
}

export function ConsumptionTab({ type }: ConsumptionTabProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;

  const { data, isLoading } = useMaterialConsumption(type, page, limit, debouncedSearch);

  const columns: ColumnDef<MaterialConsumptionDto>[] = [
    {
      accessorKey: "consumedAt",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.consumedAt),
    },
    { accessorKey: "productName", header: "Product" },
    { accessorKey: "lotNumber", header: "Lot" },
    { accessorKey: "modelName", header: "Model" },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) =>
        `${formatNumber(row.original.quantity)} ${UNIT_LABELS[row.original.unit]}`,
    },
    {
      accessorKey: "remainingAfter",
      header: "Remaining After",
      cell: ({ row }) =>
        `${formatNumber(row.original.remainingAfter)} ${UNIT_LABELS[row.original.unit]}`,
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
