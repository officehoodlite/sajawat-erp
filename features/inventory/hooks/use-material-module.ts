"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type {
  MaterialConsumptionResponse,
  MaterialProductDto,
  MaterialProductsResponse,
  MaterialPurchasesResponse,
  MaterialStockDto,
} from "@/types/material-module";
import type { MaterialModuleType } from "@/types/enums";
import type { CreateMaterialProductInput, CreateMaterialPurchaseInput, UpdateMaterialPurchaseInput } from "@/validators/inventory";
import { toast } from "sonner";

function moduleKeys(type: MaterialModuleType) {
  return queryKeys[type];
}

function basePath(type: MaterialModuleType) {
  return `/api/inventory/${type}`;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function invalidateProducts(queryClient: ReturnType<typeof useQueryClient>, type: MaterialModuleType) {
  queryClient.invalidateQueries({ queryKey: [type, "products"] });
  queryClient.invalidateQueries({ queryKey: moduleKeys(type).options });
}

function invalidatePurchases(queryClient: ReturnType<typeof useQueryClient>, type: MaterialModuleType) {
  queryClient.invalidateQueries({ queryKey: moduleKeys(type).stock });
  queryClient.invalidateQueries({ queryKey: [type, "purchases"] });
  queryClient.invalidateQueries({ queryKey: moduleKeys(type).options });
}

export function useMaterialProducts(
  type: MaterialModuleType,
  page: number,
  limit: number,
  search: string
) {
  return useQuery({
    queryKey: moduleKeys(type).products(page, limit, search),
    queryFn: () =>
      apiFetch<MaterialProductsResponse>(
        `${basePath(type)}/products${buildQuery({ page, limit, search })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useMaterialStock(type: MaterialModuleType) {
  return useQuery({
    queryKey: moduleKeys(type).stock,
    queryFn: () => apiFetch<MaterialStockDto[]>(`${basePath(type)}/stock`),
    staleTime: 30 * 1000,
  });
}

export function useMaterialPurchases(
  type: MaterialModuleType,
  page: number,
  limit: number,
  search: string,
  productId?: string
) {
  return useQuery({
    queryKey: moduleKeys(type).purchases(page, limit, search, productId),
    queryFn: () =>
      apiFetch<MaterialPurchasesResponse>(
        `${basePath(type)}/purchases${buildQuery({ page, limit, search, productId })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useMaterialConsumption(
  type: MaterialModuleType,
  page: number,
  limit: number,
  search: string,
  productId?: string
) {
  return useQuery({
    queryKey: moduleKeys(type).consumption(page, limit, search, productId),
    queryFn: () =>
      apiFetch<MaterialConsumptionResponse>(
        `${basePath(type)}/consumption${buildQuery({ page, limit, search, productId })}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useActiveMaterialProducts(type: MaterialModuleType, enabled = true) {
  return useQuery({
    queryKey: [...moduleKeys(type).products(1, 100, ""), "active"],
    queryFn: () =>
      apiFetch<MaterialProductsResponse>(
        `${basePath(type)}/products${buildQuery({ page: 1, limit: 100, activeOnly: "true" })}`
      ),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useCreateMaterialProduct(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialProductInput) =>
      apiFetch<MaterialProductDto>(`${basePath(type)}/products`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateProducts(queryClient, type);
      toast.success("Product created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMaterialProduct(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateMaterialProductInput>) =>
      apiFetch<MaterialProductDto>(`${basePath(type)}/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidateProducts(queryClient, type);
      toast.success("Product updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useArchiveMaterialProduct(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<MaterialProductDto>(`${basePath(type)}/products/${id}`, { method: "PATCH" }),
    onSuccess: () => {
      invalidateProducts(queryClient, type);
      toast.success("Product archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateMaterialPurchase(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMaterialPurchaseInput) =>
      apiFetch(`${basePath(type)}/purchases`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidatePurchases(queryClient, type);
      toast.success("Purchase recorded");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateMaterialPurchase(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateMaterialPurchaseInput) =>
      apiFetch(`${basePath(type)}/purchases/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidatePurchases(queryClient, type);
      toast.success("Purchase updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMaterialPurchase(type: MaterialModuleType) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`${basePath(type)}/purchases/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidatePurchases(queryClient, type);
      toast.success("Purchase deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
