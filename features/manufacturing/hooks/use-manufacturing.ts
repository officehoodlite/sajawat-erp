"use client";

import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { lotDetailToSummary } from "@/features/manufacturing/utils/lot-cache";
import type {
  LotDetailDto,
  LotListItemDto,
  LotSummaryDto,
  ModelDetailResponseDto,
  PaginatedResponse,
  ProductDto,
} from "@/types/dto";
import type {
  CreateLotInput,
  CreateModelInput,
  CreateBoardEntryInput,
  CreateLotActualBoardEntryInput,
  CreateLotWorkerEntryInput,
  UpdateLotWorkerEntryInput,
  UpdateLotWorkerRatesInput,
  UpdatePolishLaborInput,
} from "@/validators/manufacturing";
import { toast } from "sonner";

function syncLotCaches(queryClient: QueryClient, lot: LotDetailDto) {
  queryClient.setQueryData(queryKeys.lots.detail(lot.id), lot);
  queryClient.setQueryData(queryKeys.lots.summary(lot.id), lotDetailToSummary(lot));

  for (const model of lot.models) {
    queryClient.setQueryData<ModelDetailResponseDto>(queryKeys.models.detail(model.id), {
      model,
      lot: {
        id: lot.id,
        lotNumber: lot.lotNumber,
        status: lot.status,
      },
    });
  }

  void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.paint.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.hardware.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.packing.all });
}

async function postEntriesSequentially<T>(
  entries: T[],
  post: (entry: T) => Promise<LotDetailDto>
): Promise<{ lot: LotDetailDto; count: number }> {
  let lot: LotDetailDto | null = null;
  for (const entry of entries) {
    lot = await post(entry);
  }
  if (!lot) throw new Error("No entries to save");
  return { lot, count: entries.length };
}

function entryToast(label: string, count: number) {
  return count === 1 ? `${label} entry added` : `${count} ${label} entries added`;
}

function syncSummaryCache(queryClient: QueryClient, summary: LotSummaryDto) {
  queryClient.setQueryData(queryKeys.lots.summary(summary.id), summary);
}

export function useLots(page: number, limit: number, search: string) {
  return useQuery({
    queryKey: queryKeys.lots.list(page, limit, search),
    queryFn: () =>
      apiFetch<PaginatedResponse<LotListItemDto>>(
        `/api/manufacturing/lots?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      ),
    placeholderData: (previousData) => previousData,
  });
}

export function useLotSummary(id: string) {
  return useQuery({
    queryKey: queryKeys.lots.summary(id),
    queryFn: () => apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${id}?scope=summary`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useLot(id: string) {
  return useQuery({
    queryKey: queryKeys.lots.detail(id),
    queryFn: () => apiFetch<LotDetailDto>(`/api/manufacturing/lots/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useModel(modelId: string) {
  return useQuery({
    queryKey: queryKeys.models.detail(modelId),
    queryFn: () => apiFetch<ModelDetailResponseDto>(`/api/manufacturing/models/${modelId}`),
    enabled: !!modelId,
    staleTime: 15 * 1000,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => apiFetch<ProductDto[]>("/api/inventory/products"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLotInput) =>
      apiFetch<LotDetailDto>("/api/manufacturing/lots", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      toast.success("Lot created successfully");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateLotInput> & { status?: string; remarks?: string | null }) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/lots/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useStartLot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<LotDetailDto>(`/api/manufacturing/lots/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "IN_PRODUCTION" }),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      toast.success("Manufacturing started");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useStartLotFromList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lotId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/lots/${lotId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "IN_PRODUCTION" }),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      toast.success("Manufacturing started");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/manufacturing/lots/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      toast.success("Lot deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCompleteLot(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<LotDetailDto>(`/api/manufacturing/lots/${id}/complete`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      queryClient.invalidateQueries({ queryKey: queryKeys.lots.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      toast.success("Lot completed and stock deducted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateModel(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateModelInput) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/lots/${lotId}/models`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Model added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteModel(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/models/${modelId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Model deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateBoardEntry(lotId: string, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBoardEntryInput | CreateBoardEntryInput[]) => {
      const entries = Array.isArray(data) ? data : [data];
      return postEntriesSequentially(entries, (entry) =>
        apiFetch<LotDetailDto>(`/api/manufacturing/models/${modelId}/board-entries`, {
          method: "POST",
          body: JSON.stringify(entry),
        })
      );
    },
    onSuccess: ({ lot, count }) => {
      syncLotCaches(queryClient, lot);
      toast.success(entryToast("Board", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateBoardEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      data,
    }: {
      entryId: string;
      data: Partial<CreateBoardEntryInput>;
    }) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/board-entries/${entryId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Board entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteBoardEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/board-entries/${entryId}`, {
        method: "DELETE",
      }),
    onMutate: async (entryId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.models.all });
      const modelQueries = queryClient.getQueriesData<ModelDetailResponseDto>({
        queryKey: queryKeys.models.all,
      });
      const snapshots = modelQueries.map(([key, data]) => ({ key, data }));

      for (const [key, data] of modelQueries) {
        if (!data) continue;
        queryClient.setQueryData<ModelDetailResponseDto>(key, {
          ...data,
          model: {
            ...data.model,
            boardEntries: data.model.boardEntries.filter((e) => e.id !== entryId),
          },
        });
      }

      return { snapshots };
    },
    onError: (error: Error, _id, context) => {
      context?.snapshots.forEach(({ key, data }) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(error.message);
    },
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Board entry deleted");
    },
  });
}

export function useCreatePaintEntry(lotId: string, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data:
        | { paintProductId: string; quantity: number }
        | Array<{ paintProductId: string; quantity: number }>
    ) => {
      const entries = Array.isArray(data) ? data : [data];
      return postEntriesSequentially(entries, (entry) =>
        apiFetch<LotDetailDto>(`/api/manufacturing/models/${modelId}/paint-entries`, {
          method: "POST",
          body: JSON.stringify(entry),
        })
      );
    },
    onSuccess: ({ lot, count }) => {
      syncLotCaches(queryClient, lot);
      toast.success(entryToast("Paint", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeletePaintEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/paint-entries/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Paint entry deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePaintEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entryId: string; paintProductId: string; quantity: number }) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/paint-entries/${data.entryId}`, {
        method: "PUT",
        body: JSON.stringify({
          paintProductId: data.paintProductId,
          quantity: data.quantity,
        }),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Paint entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateHardwareEntry(lotId: string, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data:
        | { hardwareProductId: string; quantity: number }
        | Array<{ hardwareProductId: string; quantity: number }>
    ) => {
      const entries = Array.isArray(data) ? data : [data];
      return postEntriesSequentially(entries, (entry) =>
        apiFetch<LotDetailDto>(`/api/manufacturing/models/${modelId}/hardware-entries`, {
          method: "POST",
          body: JSON.stringify(entry),
        })
      );
    },
    onSuccess: ({ lot, count }) => {
      syncLotCaches(queryClient, lot);
      toast.success(entryToast("Hardware", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteHardwareEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/hardware-entries/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Hardware entry deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateHardwareEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entryId: string; hardwareProductId: string; quantity: number }) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/hardware-entries/${data.entryId}`, {
        method: "PUT",
        body: JSON.stringify({
          hardwareProductId: data.hardwareProductId,
          quantity: data.quantity,
        }),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Hardware entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreatePackingEntry(lotId: string, modelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      data:
        | { packingProductId: string; quantity: number }
        | Array<{ packingProductId: string; quantity: number }>
    ) => {
      const entries = Array.isArray(data) ? data : [data];
      return postEntriesSequentially(entries, (entry) =>
        apiFetch<LotDetailDto>(`/api/manufacturing/models/${modelId}/packing-entries`, {
          method: "POST",
          body: JSON.stringify(entry),
        })
      );
    },
    onSuccess: ({ lot, count }) => {
      syncLotCaches(queryClient, lot);
      toast.success(entryToast("Packing", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeletePackingEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/packing-entries/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Packing entry deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePackingEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entryId: string; packingProductId: string; quantity: number }) =>
      apiFetch<LotDetailDto>(`/api/manufacturing/packing-entries/${data.entryId}`, {
        method: "PUT",
        body: JSON.stringify({
          packingProductId: data.packingProductId,
          quantity: data.quantity,
        }),
      }),
    onSuccess: (data) => {
      syncLotCaches(queryClient, data);
      toast.success("Packing entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useBoardOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.boards.options,
    queryFn: () =>
      apiFetch<
        Array<{
          id: string;
          label: string;
          remainingSqft: number;
          boardThicknessId: string;
          materialName: string;
          thickness: string;
        }>
      >("/api/inventory/board-options"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function usePaintOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.paint.options,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>("/api/inventory/paint-options"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useHardwareOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.hardware.options,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>("/api/inventory/hardware-options"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function usePackingOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.packing.options,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>("/api/inventory/packing-options"),
    staleTime: 10 * 60 * 1000,
    enabled,
  });
}

export function useCreateLotActualBoardEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: CreateLotActualBoardEntryInput | CreateLotActualBoardEntryInput[]
    ) => {
      const entries = Array.isArray(data) ? data : [data];
      let summary: LotSummaryDto | null = null;
      for (const entry of entries) {
        summary = await apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/actual-board`, {
          method: "POST",
          body: JSON.stringify(entry),
        });
      }
      if (!summary) throw new Error("No entries to save");
      return { summary, count: entries.length };
    },
    onSuccess: ({ summary, count }) => {
      syncSummaryCache(queryClient, summary);
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards.all });
      toast.success(entryToast("Actual board", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLotActualBoardEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, ...data }: CreateLotActualBoardEntryInput & { entryId: string }) =>
      apiFetch<LotSummaryDto>(
        `/api/manufacturing/lots/${lotId}/actual-board/${entryId}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      toast.success("Actual board entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLotActualBoardEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/actual-board/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      toast.success("Actual board entry deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLotWorkerRates(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateLotWorkerRatesInput) =>
      apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/worker-rates`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      toast.success("Worker rates saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdatePolishLabor(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{ modelId: string } & UpdatePolishLaborInput>) => {
      let summary: LotSummaryDto | null = null;
      for (const item of items) {
        summary = await apiFetch<LotSummaryDto>(
          `/api/manufacturing/models/${item.modelId}/polish-labor`,
          {
            method: "PATCH",
            body: JSON.stringify({ polishLaborPerQty: item.polishLaborPerQty }),
          }
        );
      }
      if (!summary) throw new Error("No models to update");
      return summary;
    },
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      void queryClient.invalidateQueries({ queryKey: queryKeys.lots.detail(lotId) });
      toast.success("Polish labor saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateLotWorkerEntries(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: CreateLotWorkerEntryInput[]) => {
      let summary: LotSummaryDto | null = null;
      for (const entry of entries) {
        summary = await apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/workers`, {
          method: "POST",
          body: JSON.stringify(entry),
        });
      }
      if (!summary) throw new Error("No entries to save");
      return { summary, count: entries.length };
    },
    onSuccess: ({ summary, count }) => {
      syncSummaryCache(queryClient, summary);
      toast.success(entryToast("Worker", count));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLotWorkerEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, ...data }: UpdateLotWorkerEntryInput & { entryId: string }) =>
      apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/workers/${entryId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      toast.success("Worker entry updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteLotWorkerEntry(lotId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) =>
      apiFetch<LotSummaryDto>(`/api/manufacturing/lots/${lotId}/workers/${entryId}`, {
        method: "DELETE",
      }),
    onSuccess: (summary) => {
      syncSummaryCache(queryClient, summary);
      toast.success("Worker entry deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
