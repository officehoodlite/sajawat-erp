"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddBoardPurchaseDialog } from "@/features/inventory/components/board-module/add-board-purchase-dialog";
import { ImportPurchasesActions } from "@/features/inventory/components/shared/import-purchases-menu";
import { downloadCsv } from "@/lib/csv-download";
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

  const handleExport = () => {
    downloadCsv("board-stock.csv", [
      ["Material", "Thickness", "Remaining (SqFt)"],
      ...(data ?? []).map((row) => [row.materialName, row.thickness, row.remainingSqft]),
    ]);
  };

  if (isLoading && !data) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <PageToolbar
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <ImportPurchasesActions kind="boards" onAdd={() => setPurchaseOpen(true)} />
          </div>
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
