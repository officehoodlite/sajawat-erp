"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageToolbar } from "@/components/shared/page-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogProducts } from "@/features/catalog/hooks/use-catalog-products";
import type { CatalogProductDetailDto } from "@/types/dto";

export function ModelSummaryProductsClient() {
  const router = useRouter();
  const { data: products = [], isLoading } = useCatalogProducts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const columns: ColumnDef<CatalogProductDetailDto>[] = [
    { accessorKey: "name", header: "Product" },
    {
      id: "models",
      header: "Models",
      cell: ({ row }) => row.original.models.length,
    },
  ];

  return (
    <ErpPage>
      <PageHeader
        title="Model Summary"
        description="Browse products and review material usage across recent lots for each model."
      />
      <PageToolbar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search products...",
        }}
      />
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          onRowClick={(row) => router.push(`/model-summary/${row.id}`)}
        />
      )}
    </ErpPage>
  );
}
