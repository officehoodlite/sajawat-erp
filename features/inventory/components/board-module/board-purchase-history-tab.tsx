"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { EditBoardPurchaseDialog } from "@/features/inventory/components/board-module/edit-board-purchase-dialog";
import {
  useBoardPurchases,
  useDeleteBoardPurchase,
  useUpdateBoardPurchase,
} from "@/features/inventory/hooks/use-inventory";
import { validateDelete } from "@/lib/purchase-validation";
import { PAGE_SIZE } from "@/lib/pagination";
import type { BoardPurchaseDto } from "@/types/dto";
import { formatDate, formatNumber } from "@/utils/format";
import { toast } from "sonner";

export function BoardPurchaseHistoryTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;
  const [editPurchase, setEditPurchase] = useState<BoardPurchaseDto | null>(null);
  const [deletePurchase, setDeletePurchase] = useState<BoardPurchaseDto | null>(null);

  const { data, isLoading } = useBoardPurchases(page, limit, debouncedSearch);
  const updateMutation = useUpdateBoardPurchase();
  const deleteMutation = useDeleteBoardPurchase();

  const columns: ColumnDef<BoardPurchaseDto>[] = [
    {
      accessorKey: "purchaseDate",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.purchaseDate),
    },
    {
      header: "Product",
      cell: ({ row }) => `${row.original.materialName} ${row.original.thickness}`,
    },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ row }) => row.original.supplierName ?? "—",
    },
    {
      accessorKey: "quantity",
      header: "Qty (SqFt)",
      cell: ({ row }) => formatNumber(row.original.quantity),
    },
    {
      accessorKey: "remainingQuantity",
      header: "Remaining",
      cell: ({ row }) => formatNumber(row.original.remainingQuantity),
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) =>
        row.original.rate != null ? formatNumber(row.original.rate) : "—",
    },
    {
      accessorKey: "totalCost",
      header: "Total",
      cell: ({ row }) =>
        row.original.totalCost != null ? formatNumber(row.original.totalCost) : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditPurchase(row.original)}
            aria-label="Edit purchase"
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeletePurchase(row.original)}
            aria-label="Delete purchase"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDeleteConfirm = async () => {
    if (!deletePurchase) return;
    const error = validateDelete(deletePurchase.consumedQuantity);
    if (error) {
      toast.error(error);
      setDeletePurchase(null);
      return;
    }
    await deleteMutation.mutateAsync(deletePurchase.id);
    setDeletePurchase(null);
  };

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
          placeholder: "Search purchases...",
        }}
      />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      <EditBoardPurchaseDialog
        purchase={editPurchase}
        open={!!editPurchase}
        onOpenChange={(open) => {
          if (!open) setEditPurchase(null);
        }}
        isPending={updateMutation.isPending}
        onSubmit={async (formData) => {
          if (!editPurchase) return;
          await updateMutation.mutateAsync({ id: editPurchase.id, ...formData });
        }}
      />

      <AlertDialog open={!!deletePurchase} onOpenChange={() => setDeletePurchase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete purchase?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this purchase record if no stock has been consumed from
              it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
