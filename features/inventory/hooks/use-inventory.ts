"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  BoardConsumptionResponse,
  BoardDto,
  BoardInventoryDto,
  BoardMaterialsResponse,
  BoardPurchasesResponse,
  BoardStockDto,
  BoardThicknessDto,
} from "@/types/dto";
import { toast } from "sonner";

function buildQuery(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function invalidateBoardMaterials(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["boards", "materials"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.boards.thicknessOptions });
}

function invalidateBoardPurchases(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.boards.stock });
  queryClient.invalidateQueries({ queryKey: ["boards", "purchases"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.boards.options });
}

export function useBoardMaterials(page: number, limit: number, search: string) {
  return useQuery({
    queryKey: queryKeys.boards.materials(page, limit, search),
    queryFn: () =>
      apiFetch<BoardMaterialsResponse>(
        `/api/inventory/boards${buildQuery({ page, limit, search })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useBoardStock() {
  return useQuery({
    queryKey: queryKeys.boards.stock,
    queryFn: () => apiFetch<BoardStockDto[]>("/api/inventory/boards/stock"),
    staleTime: 60 * 1000,
  });
}

export function useBoardPurchases(page: number, limit: number, search: string) {
  return useQuery({
    queryKey: queryKeys.boards.purchases(page, limit, search),
    queryFn: () =>
      apiFetch<BoardPurchasesResponse>(
        `/api/inventory/boards/purchases${buildQuery({ page, limit, search })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useBoardConsumption(page: number, limit: number, search: string) {
  return useQuery({
    queryKey: queryKeys.boards.consumption(page, limit, search),
    queryFn: () =>
      apiFetch<BoardConsumptionResponse>(
        `/api/inventory/boards/consumption${buildQuery({ page, limit, search })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useBoardThicknesses(boardId: string) {
  return useQuery({
    queryKey: ["boards", "thicknesses", boardId],
    queryFn: () => apiFetch<BoardThicknessDto[]>(`/api/inventory/boards/${boardId}`),
    enabled: !!boardId,
  });
}

export function useBoardInventories(thicknessId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.boards.inventories(thicknessId),
    queryFn: () =>
      apiFetch<BoardInventoryDto[]>(
        `/api/inventory/boards/inventories${thicknessId ? `?boardThicknessId=${thicknessId}` : ""}`
      ),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useThicknessOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.boards.thicknessOptions,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>("/api/inventory/thickness-options"),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useCreateBoardMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { materialName: string }) =>
      apiFetch<BoardDto>("/api/inventory/boards", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateBoardMaterials(queryClient);
      toast.success("Board material created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBoardMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, materialName }: { id: string; materialName: string }) =>
      apiFetch<BoardDto>(`/api/inventory/boards/${id}`, {
        method: "PUT",
        body: JSON.stringify({ materialName }),
      }),
    onSuccess: () => {
      invalidateBoardMaterials(queryClient);
      toast.success("Board material updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateBoardThickness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { boardId: string; thickness: string }) =>
      apiFetch("/api/inventory/boards/thicknesses", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, variables) => {
      invalidateBoardMaterials(queryClient);
      queryClient.invalidateQueries({ queryKey: ["boards", "thicknesses", variables.boardId] });
      toast.success("Thickness added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBoardThickness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      boardId,
      thickness,
    }: {
      id: string;
      boardId: string;
      thickness: string;
    }) =>
      apiFetch(`/api/inventory/boards/thicknesses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ thickness }),
      }),
    onSuccess: (_, variables) => {
      invalidateBoardMaterials(queryClient);
      queryClient.invalidateQueries({ queryKey: ["boards", "thicknesses", variables.boardId] });
      toast.success("Thickness updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateBoardInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch("/api/inventory/boards/purchases", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidateBoardPurchases(queryClient);
      toast.success("Purchase recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBoardPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, unknown>) =>
      apiFetch(`/api/inventory/boards/inventories/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateBoardPurchases(queryClient);
      toast.success("Purchase updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBoardPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/inventory/boards/inventories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidateBoardPurchases(queryClient);
      toast.success("Purchase deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
