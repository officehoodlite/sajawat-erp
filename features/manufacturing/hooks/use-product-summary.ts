"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ProductSummaryDto } from "@/types/dto";

export type ProductSummarySelectionMode = "lot" | "model";

export function useProductSummary(
  productId: string,
  selectionMode: ProductSummarySelectionMode,
  lotIds: string[],
  catalogModelIds: string[]
) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (selectionMode === "lot" && lotIds.length > 0) {
    params.set("lotIds", lotIds.join(","));
  }
  if (selectionMode === "model" && catalogModelIds.length > 0) {
    params.set("catalogModelIds", catalogModelIds.join(","));
  }

  return useQuery({
    queryKey: [
      "product-summary",
      productId,
      selectionMode,
      [...lotIds].sort().join(","),
      [...catalogModelIds].sort().join(","),
    ] as const,
    queryFn: () => apiFetch<ProductSummaryDto>(`/api/manufacturing/product-summary?${params}`),
    enabled: !!productId,
  });
}