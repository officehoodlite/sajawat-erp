import { AsyncLocalStorage } from "node:async_hooks";
import type { LotSummaryDto, LotWorkerSummaryDto } from "@/types/dto";
import { DEFAULT_WORKER_RATES } from "@/lib/worker-labor";

export type UserRole = "ADMIN" | "USER";

export interface UserPermissions {
  workerPrices: boolean;
}

export interface AuthPrincipal {
  userId: string | null;
  username: string;
  role: UserRole;
  permissions: UserPermissions;
}

export const FULL_PERMISSIONS: UserPermissions = { workerPrices: true };
export const DEFAULT_PERMISSIONS: UserPermissions = { workerPrices: false };

const authStore = new AsyncLocalStorage<AuthPrincipal>();

export function parsePermissions(value: unknown, role: UserRole): UserPermissions {
  if (role === "ADMIN") return { ...FULL_PERMISSIONS };
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    workerPrices: raw.workerPrices === true,
  };
}

export function enterAuth(principal: AuthPrincipal) {
  authStore.enterWith(principal);
}

export function getAuthPrincipal(): AuthPrincipal | undefined {
  return authStore.getStore();
}

export function canViewWorkerPrices(principal?: AuthPrincipal): boolean {
  const auth = principal ?? getAuthPrincipal();
  if (!auth) return true;
  return auth.role === "ADMIN" || auth.permissions.workerPrices;
}

function stripWorkerSummary(row: LotWorkerSummaryDto): LotWorkerSummaryDto {
  return {
    ...row,
    mfgTMistriAmount: 0,
    mfgHMistriAmount: 0,
    mfgTHelperAmount: 0,
    packTMistriAmount: 0,
    packHMistriAmount: 0,
    packTHelperAmount: 0,
    totalAmount: 0,
  };
}

export function sanitizeLotSummary(lot: LotSummaryDto): LotSummaryDto {
  if (canViewWorkerPrices()) return lot;
  return {
    ...lot,
    workerRates: { ...DEFAULT_WORKER_RATES },
    workerSummaries: lot.workerSummaries.map(stripWorkerSummary),
    models: lot.models.map((model) => ({ ...model, polishLaborPerQty: null })),
  };
}
