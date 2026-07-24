import { Suspense } from "react";
import { ProductsPageClient } from "@/features/catalog/components/products-page-client";

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageClient />
    </Suspense>
  );
}
