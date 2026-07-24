"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductFormDialog } from "@/features/inventory/components/material-module/product-form-dialog";
import {
  useCreateMaterialProduct,
  useMaterialProducts,
  useUpdateMaterialProduct,
} from "@/features/inventory/hooks/use-material-module";
import { PAGE_SIZE } from "@/lib/pagination";
import type { MaterialModuleType } from "@/types/enums";
import { UNIT_LABELS } from "@/types/enums";
import type { MaterialProductDto } from "@/types/material-module";
import type { CreateMaterialProductInput } from "@/validators/inventory";

interface ProductsTabProps {
  type: MaterialModuleType;
}

export function ProductsTab({ type }: ProductsTabProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const limit = PAGE_SIZE;

  const { data, isLoading } = useMaterialProducts(type, page, limit, debouncedSearch);
  const createProduct = useCreateMaterialProduct(type);
  const updateProduct = useUpdateMaterialProduct(type);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialProductDto | null>(null);

  const columns: ColumnDef<MaterialProductDto>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => UNIT_LABELS[row.original.unit],
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (values: CreateMaterialProductInput) => {
    if (editing) {
      await updateProduct.mutateAsync({ id: editing.id, ...values });
    } else {
      await createProduct.mutateAsync(values);
    }
    setEditing(null);
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
          placeholder: "Search products...",
        }}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
      />

      {formOpen && (
        <ProductFormDialog
          type={type}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          product={editing}
          onSubmit={handleSubmit}
          isPending={createProduct.isPending || updateProduct.isPending}
        />
      )}
    </div>
  );
}
