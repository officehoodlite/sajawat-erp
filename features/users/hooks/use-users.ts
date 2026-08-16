"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { UserDto } from "@/services/users/user.service";
import type { CreateUserInput, UpdateUserInput } from "@/validators/users";
import { toast } from "sonner";

export interface CurrentUserDto {
  userId: string | null;
  username: string;
  role: "ADMIN" | "USER";
  workerPrices: boolean;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => apiFetch<CurrentUserDto>("/api/auth/me"),
    staleTime: 60 * 1000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => apiFetch<UserDto[]>("/api/users"),
    staleTime: 30 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserInput) =>
      apiFetch<UserDto>("/api/users", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User created");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateUserInput & { id: string }) =>
      apiFetch<UserDto>(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success("User updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
