"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ProductSummaryDto } from "@/types/dto";

export function useProductSummary(productId: string, lotIds: string[]) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (lotIds.length > 0) params.set("lotIds", lotIds.join(","));

  return useQuery({
    queryKey: ["product-summary", productId, [...lotIds].sort().join(",")] as const,
    queryFn: () => apiFetch<ProductSummaryDto>(`/api/manufacturing/product-summary?${params}`),
    enabled: !!productId,
  });
}
