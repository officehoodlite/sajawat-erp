"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ModelStatusBadge } from "@/features/manufacturing/components/model/model-status-badge";
import {
  getModelStatus,
} from "@/features/manufacturing/utils/consumption";
import type { ModelSummaryDto } from "@/types/dto";
import { PAGE_SIZE } from "@/lib/pagination";
import { formatSqft } from "@/utils/format";

interface ModelTableProps {
  lotId: string;
  models: ModelSummaryDto[];
  readOnly?: boolean;
  canAdd?: boolean;
  onAddModel?: () => void;
}

interface ModelRow {
  id: string;
  productName: string;
  modelName: string;
  quantity: number;
  boardUsed: number;
  status: ReturnType<typeof getModelStatus>;
}

export function ModelTable({
  lotId,
  models,
  readOnly,
  canAdd,
  onAddModel,
}: ModelTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([{ id: "modelName", desc: false }]);
  const limit = PAGE_SIZE;

  const rows: ModelRow[] = useMemo(
    () =>
      models.map((model) => ({
        id: model.id,
        productName: model.productName,
        modelName: model.modelName,
        quantity: model.quantity,
        boardUsed: model.totalBoardSqft,
        status: getModelStatus(model),
      })),
    [models]
  );

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.modelName.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
    );
  }, [rows, debouncedSearch]);

  const sorted = useMemo(() => {
    if (!sorting.length) return filtered;
    const { id, desc } = sorting[0];
    return [...filtered].sort((a, b) => {
      const av = a[id as keyof ModelRow];
      const bv = b[id as keyof ModelRow];
      if (typeof av === "number" && typeof bv === "number") {
        return desc ? bv - av : av - bv;
      }
      return desc
        ? String(bv).localeCompare(String(av))
        : String(av).localeCompare(String(bv));
    });
  }, [filtered, sorting]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / limit));
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  const toggleSort = (columnId: string) => {
    setSorting((prev) => {
      const current = prev[0];
      if (current?.id === columnId) {
        return [{ id: columnId, desc: !current.desc }];
      }
      return [{ id: columnId, desc: false }];
    });
    setPage(1);
  };

  const SortHeader = ({ label, columnId }: { label: string; columnId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 font-medium"
      onClick={(e) => {
        e.stopPropagation();
        toggleSort(columnId);
      }}
    >
      {label}
      <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
    </Button>
  );

  const columns: ColumnDef<ModelRow>[] = [
    {
      accessorKey: "productName",
      header: () => <SortHeader label="Product" columnId="productName" />,
    },
    {
      accessorKey: "modelName",
      header: () => <SortHeader label="Model" columnId="modelName" />,
      cell: ({ row }) => <span className="font-medium">{row.original.modelName}</span>,
    },
    {
      accessorKey: "quantity",
      header: () => <SortHeader label="Qty" columnId="quantity" />,
    },
    {
      accessorKey: "boardUsed",
      header: () => <SortHeader label="Board Used" columnId="boardUsed" />,
      cell: ({ row }) => (
        <span className="text-primary">{formatSqft(row.original.boardUsed)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <SortHeader label="Status" columnId="status" />,
      cell: ({ row }) => <ModelStatusBadge status={row.original.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageToolbar
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(1);
          },
          placeholder: "Search models...",
        }}
        actions={
          !readOnly && canAdd && onAddModel ? (
            <Button onClick={onAddModel}>
              <Plus className="mr-2 h-4 w-4" />
              Add Model
            </Button>
          ) : undefined
        }
      />

      {models.length === 0 ? (
        <EmptyState
          title="No models added yet"
          description="Add a model to begin recording material consumption for this lot."
          action={
            !readOnly && canAdd && onAddModel ? (
              <Button onClick={onAddModel}>
                <Plus className="mr-2 h-4 w-4" />
                Add Model
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={paginated}
          emptyTitle="No models match your search"
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/manufacturing/${lotId}/models/${row.id}`)}
          onRowHover={(row) => {
            router.prefetch(`/manufacturing/${lotId}/models/${row.id}`);
          }}
        />
      )}
    </div>
  );
}
