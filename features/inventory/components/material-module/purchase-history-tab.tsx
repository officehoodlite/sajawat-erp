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
import { EditPurchaseDialog } from "@/features/inventory/components/material-module/edit-purchase-dialog";
import {
  useDeleteMaterialPurchase,
  useMaterialPurchases,
  useUpdateMaterialPurchase,
} from "@/features/inventory/hooks/use-material-module";
import { validateDelete } from "@/lib/purchase-validation";
import { PAGE_SIZE } from "@/lib/pagination";
import type { MaterialModuleType } from "@/types/enums";
import type { MaterialPurchaseDto } from "@/types/material-module";
import { formatDate, formatNumber } from "@/utils/format";
import { toast } from "sonner";

interface PurchaseHistoryTabProps {
  type: MaterialModuleType;
}

export function PurchaseHistoryTab({ type }: PurchaseHistoryTabProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;
  const [editPurchase, setEditPurchase] = useState<MaterialPurchaseDto | null>(null);
  const [deletePurchase, setDeletePurchase] = useState<MaterialPurchaseDto | null>(null);

  const { data, isLoading } = useMaterialPurchases(type, page, limit, debouncedSearch);
  const updateMutation = useUpdateMaterialPurchase(type);
  const deleteMutation = useDeleteMaterialPurchase(type);

  const columns: ColumnDef<MaterialPurchaseDto>[] = [
    {
      accessorKey: "purchaseDate",
      header: "Date",
      cell: ({ row }) => formatDate(row.original.purchaseDate),
    },
    { accessorKey: "productName", header: "Product" },
    {
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ row }) => row.original.supplierName ?? "—",
    },
    ...(type === "paint"
      ? []
      : [
          {
            accessorKey: "invoiceNumber",
            header: "Invoice",
            cell: ({ row }: { row: { original: MaterialPurchaseDto } }) =>
              row.original.invoiceNumber ?? "—",
          } as ColumnDef<MaterialPurchaseDto>,
        ]),
    {
      accessorKey: "quantity",
      header: "Qty",
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

      <EditPurchaseDialog
        type={type}
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
              This will permanently remove this purchase record and adjust stock if it has not been
              consumed.
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
