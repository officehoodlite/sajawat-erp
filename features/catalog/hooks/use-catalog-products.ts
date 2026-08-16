"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { CatalogProductDetailDto, CatalogProductModelDto, ProductDto } from "@/types/dto";
import type {
  CreateCatalogProductInput,
  CreateCatalogProductModelInput,
  UpdateCatalogProductInput,
  UpdateCatalogProductModelInput,
} from "@/validators/inventory";
import { toast } from "sonner";

export function useCatalogThicknessOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.boards.thicknessOptions,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>("/api/inventory/thickness-options"),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useCatalogMaterialOptions(
  type: "paint" | "hardware" | "packing",
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys[type].options, "catalog"] as const,
    queryFn: () =>
      apiFetch<Array<{ id: string; label: string }>>(
        `/api/inventory/${type}-options?forCatalog=true`
      ),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => apiFetch<ProductDto[]>("/api/inventory/products"),
    staleTime: 60 * 1000,
  });
}

export function useCatalogProducts() {
  return useQuery({
    queryKey: queryKeys.products.catalog,
    queryFn: () =>
      apiFetch<CatalogProductDetailDto[]>("/api/inventory/products?detail=true"),
    staleTime: 60 * 1000,
  });
}

export function useCatalogProductPicker(enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.catalogPicker,
    queryFn: () =>
      apiFetch<CatalogProductDetailDto[]>("/api/inventory/products?detail=models"),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useCatalogProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => apiFetch<CatalogProductDetailDto>(`/api/inventory/products/${id}`),
    enabled: !!id,
  });
}

export function useCreateCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCatalogProductInput) =>
      apiFetch<CatalogProductDetailDto>("/api/inventory/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      toast.success("Product added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCatalogProductInput & { id: string }) =>
      apiFetch<CatalogProductDetailDto>(`/api/inventory/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(vars.id) });
      toast.success("Product updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/inventory/products/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      toast.success("Product deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateCatalogProductModel(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCatalogProductModelInput) =>
      apiFetch<CatalogProductModelDto>(`/api/inventory/products/${productId}/models`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast.success("Model added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateCatalogProductModel(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, ...data }: UpdateCatalogProductModelInput & { modelId: string }) =>
      apiFetch<CatalogProductModelDto>(
        `/api/inventory/products/${productId}/models/${modelId}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast.success("Model updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteCatalogProductModel(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) =>
      apiFetch<{ ok: boolean }>(`/api/inventory/products/${productId}/models/${modelId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.catalogPicker });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(productId) });
      toast.success("Model deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
