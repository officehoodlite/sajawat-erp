"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Factory, Layers, Plus, Trash2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { ErpPage, ErpPageSection } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { StatCard, StatCardGrid } from "@/components/shared/stat-card";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { CreateLotDialog } from "@/features/manufacturing/components/create-lot-dialog";
import { useDeleteLot, useLots } from "@/features/manufacturing/hooks/use-manufacturing";
import { PAGE_SIZE } from "@/lib/pagination";
import type { LotListItemDto } from "@/types/dto";
import { formatDate } from "@/utils/format";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ManufacturingPageClient() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useLots(page, PAGE_SIZE, debouncedSearch);
  const { data: statsData } = useLots(1, 100, "");
  const deleteLot = useDeleteLot();

  const stats = useMemo(() => {
    const items = statsData?.items ?? [];
    return {
      total: statsData?.total ?? 0,
      totalModels: items.reduce((sum, l) => sum + l.modelCount, 0),
    };
  }, [statsData]);

  const columns: ColumnDef<LotListItemDto>[] = [
    {
      accessorKey: "lotNumber",
      header: "Lot No",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.lotNumber}</span>
      ),
    },
    { accessorKey: "modelCount", header: "Models" },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.modelCount === 0 ? (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <ErpPage>
      <PageHeader
        title="Manufacturing"
        description="Manage production lots and track material consumption across models."
      />

      <StatCardGrid>
        <StatCard
          label="Total Lots"
          value={stats.total}
          subtitle="All production lots"
          icon={Factory}
          highlight
        />
        <StatCard
          label="Total Models"
          value={stats.totalModels}
          subtitle="Across recent lots"
          icon={Layers}
        />
      </StatCardGrid>

      <ErpPageSection title="Production Lots" description="Search and manage lots">
        <PageToolbar
          search={{
            value: search,
            onChange: (value) => {
              setSearch(value);
              setPage(1);
            },
            placeholder: "Search lots by number...",
          }}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Lot
            </Button>
          }
        />

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            isLoading={isLoading}
            emptyTitle="No manufacturing lots"
            emptyDescription="Create your first lot to start tracking production and material usage."
            emptyAction={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Lot
              </Button>
            }
            page={page}
            totalPages={data?.totalPages ?? 1}
            onPageChange={setPage}
            onRowClick={(row) => router.push(`/manufacturing/${row.id}`)}
            onRowHover={(row) => router.prefetch(`/manufacturing/${row.id}`)}
          />
        </div>
      </ErpPageSection>

      {createOpen && <CreateLotDialog open={createOpen} onOpenChange={setCreateOpen} />}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lot?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only lots without models can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) {
                  await deleteLot.mutateAsync(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErpPage>
  );
}
