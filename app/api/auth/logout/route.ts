import { cookies, headers } from "next/headers";
import { successResponse } from "@/lib/api-response";
import { AUTH_COOKIE, revokeSession } from "@/lib/auth";
import { clientIpFromRequest } from "@/lib/rate-limit";
import { securityAudit } from "@/lib/security-audit";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const count = await revokeSession(token);
  cookieStore.delete(AUTH_COOKIE);

  let correlationId: string | undefined;
  try {
    correlationId = (await headers()).get("x-correlation-id") ?? undefined;
  } catch {
    /* ignore */
  }

  securityAudit({
    event: "logout",
    correlationId,
    ip: clientIpFromRequest(request),
    path: "/api/auth/logout",
    method: "POST",
    detail: count > 0 ? "session revoked" : "no active session",
  });

  if (count > 0) {
    securityAudit({
      event: "revoke_session",
      correlationId,
      ip: clientIpFromRequest(request),
      path: "/api/auth/logout",
      method: "POST",
    });
  }

  return successResponse({ ok: true });
}
