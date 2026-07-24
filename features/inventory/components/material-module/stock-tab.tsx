"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPurchaseDialog } from "@/features/inventory/components/material-module/add-purchase-dialog";
import {
  useActiveMaterialProducts,
  useCreateMaterialPurchase,
  useMaterialStock,
} from "@/features/inventory/hooks/use-material-module";
import { PAGE_SIZE, paginateClient } from "@/lib/pagination";
import type { MaterialModuleType } from "@/types/enums";
import { UNIT_LABELS } from "@/types/enums";
import type { MaterialStockDto } from "@/types/material-module";
import { formatNumber } from "@/utils/format";
import type { CreateMaterialPurchaseInput } from "@/validators/inventory";

interface StockTabProps {
  type: MaterialModuleType;
}

export function StockTab({ type }: StockTabProps) {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaterialStock(type);
  const { data: productsData } = useActiveMaterialProducts(type, purchaseOpen);
  const createPurchase = useCreateMaterialPurchase(type);

  const paginated = useMemo(
    () => paginateClient(data ?? [], page, PAGE_SIZE),
    [data, page]
  );

  const columns: ColumnDef<MaterialStockDto>[] = [
    { accessorKey: "name", header: "Product" },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => row.original.brand ?? "—",
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => UNIT_LABELS[row.original.unit],
    },
    {
      accessorKey: "remainingStock",
      header: "Remaining",
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {formatNumber(row.original.remainingStock)} {UNIT_LABELS[row.original.unit]}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (row.original.isActive ? "Active" : "Archived"),
    },
  ];

  const handlePurchase = async (values: CreateMaterialPurchaseInput) => {
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
        <AddPurchaseDialog
          type={type}
          open={purchaseOpen}
          onOpenChange={setPurchaseOpen}
          products={productsData?.items ?? []}
          onSubmit={handlePurchase}
          isPending={createPurchase.isPending}
        />
      )}
    </div>
  );
}
