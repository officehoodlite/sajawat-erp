"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { SupplierDto } from "@/types/dto";
import type { CreateSupplierInput, UpdateSupplierInput } from "@/validators/inventory";
import { toast } from "sonner";

export function useSuppliers() {
  return useQuery({
    queryKey: queryKeys.suppliers.all,
    queryFn: () => apiFetch<SupplierDto[]>("/api/suppliers"),
    staleTime: 60 * 1000,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSupplierInput) =>
      apiFetch<SupplierDto>("/api/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateSupplierInput & { id: string }) =>
      apiFetch<SupplierDto>(`/api/suppliers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/suppliers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success("Supplier deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
