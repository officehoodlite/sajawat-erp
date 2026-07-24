"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  ProductionEntryDto,
  ProductionLotModelDto,
  ProductionSuggestionsDto,
} from "@/types/dto";
import type {
  CreateProductionEntryInput,
  ProductionListQuery,
  UpdateProductionEntryInput,
} from "@/validators/production";

type ListResponse = {
  filter: ProductionListQuery;
  entries: ProductionEntryDto[];
};

type LotLookupResponse = {
  lot: { id: string; lotNumber: string } | null;
  models: ProductionLotModelDto[];
};

function listUrl(filter: ProductionListQuery) {
  if (filter.mode === "date") {
    return `/api/production?mode=date&date=${encodeURIComponent(filter.date)}`;
  }
  if (filter.mode === "lot") {
    return `/api/production?mode=lot&lotId=${encodeURIComponent(filter.lotId)}`;
  }
  return `/api/production?mode=model&catalogModelId=${encodeURIComponent(filter.catalogModelId)}`;
}

function listQueryKey(filter: ProductionListQuery) {
  if (filter.mode === "date") return queryKeys.production.byDate(filter.date);
  if (filter.mode === "lot") return queryKeys.production.byLot(filter.lotId);
  return queryKeys.production.byModel(filter.catalogModelId);
}

export function useProductionList(filter: ProductionListQuery | null, enabled = true) {
  return useQuery({
    queryKey: filter ? listQueryKey(filter) : ["production", "idle"],
    queryFn: () => apiFetch<ListResponse>(listUrl(filter!)),
    enabled: enabled && !!filter,
  });
}

export function useProductionByDate(date: string, enabled = true) {
  return useProductionList(
    /^\d{4}-\d{2}-\d{2}$/.test(date) ? { mode: "date", date } : null,
    enabled
  );
}

export function useProductionLotLookup(lotNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.production.lotLookup(lotNumber),
    queryFn: () =>
      apiFetch<LotLookupResponse>(
        `/api/production/lot-lookup?lotNumber=${encodeURIComponent(lotNumber)}`
      ),
    enabled: enabled && lotNumber.trim().length > 0,
  });
}

export function useProductionSuggestions() {
  return useQuery({
    queryKey: queryKeys.production.suggestions,
    queryFn: () => apiFetch<ProductionSuggestionsDto>("/api/production/suggestions"),
    staleTime: 60_000,
  });
}

function invalidateProduction(
  queryClient: ReturnType<typeof useQueryClient>,
  entry?: ProductionEntryDto
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.production.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.production.suggestions });
  if (entry?.workDate) {
    queryClient.invalidateQueries({ queryKey: queryKeys.production.byDate(entry.workDate) });
  }
  if (entry?.lotId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.production.byLot(entry.lotId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.production.lotModels(entry.lotId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.production.lotLookup(entry.lotNumber),
    });
  }
  if (entry?.catalogModelId) {
    queryClient.invalidateQueries({
      queryKey: queryKeys.production.byModel(entry.catalogModelId),
    });
  }
}

export function useCreateProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductionEntryInput) =>
      apiFetch<ProductionEntryDto>("/api/production", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (entry) => {
      invalidateProduction(queryClient, entry);
      toast.success("Production entry created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateProductionEntryInput) =>
      apiFetch<ProductionEntryDto>(`/api/production/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (entry) => {
      invalidateProduction(queryClient, entry);
      toast.success("Production entry updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProductionEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: ProductionEntryDto) =>
      apiFetch<{ ok: boolean }>(`/api/production/${entry.id}`, {
        method: "DELETE",
      }).then(() => entry),
    onSuccess: (entry) => {
      invalidateProduction(queryClient, entry);
      toast.success("Production entry deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
