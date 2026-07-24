"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CatalogModelLotSummariesDto } from "@/types/dto";

export function useCatalogModelLotSummaries(catalogModelId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.models.summary(catalogModelId),
    queryFn: () =>
      apiFetch<CatalogModelLotSummariesDto>(
        `/api/manufacturing/model-summary/${catalogModelId}`
      ),
    enabled: enabled && !!catalogModelId,
  });
}
