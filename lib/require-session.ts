import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, getSessionPrincipal } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { securityAudit } from "@/lib/security-audit";
import {
  canViewWorkerPrices,
  enterAuth,
  type AuthPrincipal,
} from "@/lib/permissions";

export type SessionOk = { ok: true; token: string; principal: AuthPrincipal };
export type SessionFail = { ok: false; response: NextResponse };

/**
 * Defense-in-depth session check for protected API handlers.
 * Middleware already gates routes; handlers should still call this.
 */
export async function requireSession(): Promise<SessionOk | SessionFail> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const principal = await getSessionPrincipal(token);

  if (!principal) {
    let correlationId: string | undefined;
    let path: string | undefined;
    try {
      const h = await headers();
      correlationId = h.get("x-correlation-id") ?? undefined;
      path = h.get("x-pathname") ?? undefined;
    } catch {
      /* headers unavailable outside request scope */
    }

    securityAudit({
      event: "auth_failed",
      correlationId,
      path,
      detail: "requireSession rejected request",
    });

    return {
      ok: false,
      response: errorResponse("Unauthorized", 401, undefined, correlationId),
    };
  }

  enterAuth(principal);
  return { ok: true, token: token!, principal };
}

export async function requireAdmin(): Promise<SessionOk | SessionFail> {
  const session = await requireSession();
  if (!session.ok) return session;
  if (session.principal.role !== "ADMIN") {
    return { ok: false, response: errorResponse("Forbidden", 403) };
  }
  return session;
}

export async function requireWorkerPrices(): Promise<SessionOk | SessionFail> {
  const session = await requireSession();
  if (!session.ok) return session;
  if (!canViewWorkerPrices(session.principal)) {
    return { ok: false, response: errorResponse("Forbidden", 403) };
  }
  return session;
}
