"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBoardPurchaseDialog } from "@/features/inventory/components/board-module/add-board-purchase-dialog";
import {
  useBoardStock,
  useCreateBoardInventory,
  useThicknessOptions,
} from "@/features/inventory/hooks/use-inventory";
import { PAGE_SIZE, paginateClient } from "@/lib/pagination";
import type { BoardStockDto } from "@/types/dto";
import type { CreateBoardInventoryInput } from "@/validators/inventory";
import { formatNumber } from "@/utils/format";

export function BoardStockTab() {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBoardStock();
  const { data: thicknessOptions } = useThicknessOptions(purchaseOpen);
  const createPurchase = useCreateBoardInventory();

  const paginated = useMemo(
    () => paginateClient(data ?? [], page, PAGE_SIZE),
    [data, page]
  );

  const columns: ColumnDef<BoardStockDto>[] = [
    { accessorKey: "materialName", header: "Material" },
    { accessorKey: "thickness", header: "Thickness" },
    {
      accessorKey: "remainingSqft",
      header: "Remaining (SqFt)",
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {formatNumber(row.original.remainingSqft)}
        </span>
      ),
    },
  ];

  const handlePurchase = async (values: CreateBoardInventoryInput) => {
    await createPurchase.mutateAsync(values);
  };

  if (isLoading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <PageToolbar
        actions={
          <Button onClick={() => setPurchaseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Purchase
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={paginated.items}
        page={paginated.page}
        totalPages={paginated.totalPages}
        onPageChange={setPage}
      />

      {purchaseOpen && (
        <AddBoardPurchaseDialog
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          thicknessOptions={thicknessOptions ?? []}
          onSubmit={handlePurchase}
          isPending={createPurchase.isPending}
        />
      )}
    </div>
  );
}
