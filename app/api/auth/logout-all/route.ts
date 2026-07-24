import { cookies, headers } from "next/headers";
import { caughtErrorResponse, successResponse } from "@/lib/api-response";
import {
  AUTH_COOKIE,
  cleanupExpiredSessions,
  revokeAllSessions,
} from "@/lib/auth";
import { clientIpFromRequest } from "@/lib/rate-limit";
import { requireSession } from "@/lib/require-session";
import { securityAudit } from "@/lib/security-audit";

/**
 * Logout all devices — revokes every active session including the caller's.
 * No UI yet; available for operational containment.
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const revoked = await revokeAllSessions();
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE);

    void cleanupExpiredSessions().catch(() => undefined);

    let correlationId: string | undefined;
    try {
      correlationId = (await headers()).get("x-correlation-id") ?? undefined;
    } catch {
      /* ignore */
    }

    securityAudit({
      event: "revoke_all_sessions",
      correlationId,
      ip: clientIpFromRequest(request),
      path: "/api/auth/logout-all",
      method: "POST",
      detail: `revoked=${revoked}`,
    });

    return successResponse({ ok: true, revoked });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to revoke sessions", 500);
  }
}
