"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { ErpPage } from "@/components/shared/erp-page";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogProduct } from "@/features/catalog/hooks/use-catalog-products";
import type { CatalogProductModelDto } from "@/types/dto";
import { cn } from "@/lib/utils";

interface ModelSummaryModelsClientProps {
  productId: string;
}

export function ModelSummaryModelsClient({ productId }: ModelSummaryModelsClientProps) {
  const router = useRouter();
  const { data: product, isLoading } = useCatalogProduct(productId);

  const columns: ColumnDef<CatalogProductModelDto>[] = [
    { accessorKey: "modelName", header: "Model" },
  ];

  if (isLoading) {
    return (
      <ErpPage>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </ErpPage>
    );
  }

  if (!product) {
    return (
      <ErpPage>
        <p className="text-muted-foreground">Product not found</p>
        <Link href="/model-summary" className={cn(buttonVariants({ variant: "link" }), "mt-2")}>
          Back to products
        </Link>
      </ErpPage>
    );
  }

  return (
    <ErpPage>
      <div className="flex items-start gap-3">
        <Link
          href="/model-summary"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "mt-1 shrink-0")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={product.name}
          description="Select a model to see material usage from the last 5 lots."
        />
      </div>
      {product.models.length === 0 ? (
        <p className="text-sm text-muted-foreground">No models for this product.</p>
      ) : (
        <DataTable
          columns={columns}
          data={product.models}
          onRowClick={(row) => router.push(`/model-summary/${productId}/${row.id}`)}
        />
      )}
    </ErpPage>
  );
}
