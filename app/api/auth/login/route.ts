import { NextRequest } from "next/server";
import { cookies, headers } from "next/headers";
import {
  caughtErrorResponse,
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import {
  AUTH_COOKIE,
  cleanupExpiredSessions,
  createSession,
  getSessionCookieOptions,
  isValidCredentials,
} from "@/lib/auth";
import {
  LOGIN_IP_LIMIT,
  LOGIN_USER_LIMIT,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";
import { LOGIN_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { securityAudit } from "@/lib/security-audit";

export async function POST(request: NextRequest) {
  const ip = clientIpFromRequest(request);
  let correlationId: string | undefined;
  try {
    correlationId = (await headers()).get("x-correlation-id") ?? undefined;
  } catch {
    /* ignore */
  }

  try {
    const parsedBody = await parseJsonBody<{
      username?: unknown;
      password?: unknown;
    }>(request, LOGIN_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;

    const username = String(parsedBody.data.username ?? "").trim().slice(0, 128);
    const password = String(parsedBody.data.password ?? "").slice(0, 256);

    const ipLimit = await rateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT);
    const userLimit = await rateLimit(
      `login:user:${username.toLowerCase() || "unknown"}`,
      LOGIN_USER_LIMIT
    );

    if (!ipLimit.allowed || !userLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSec, userLimit.retryAfterSec);
      securityAudit({
        event: "rate_limit_exceeded",
        correlationId,
        ip,
        username: username || undefined,
        path: "/api/auth/login",
        method: "POST",
        retryAfterSec: retryAfter,
      });
      return errorResponse("Too many login attempts. Please try again later.", 429, {
        retryAfterSec: retryAfter,
      });
    }

    if (!(await isValidCredentials(username, password))) {
      securityAudit({
        event: "login_failure",
        correlationId,
        ip,
        username: username || undefined,
        path: "/api/auth/login",
        method: "POST",
      });
      return errorResponse("Invalid username or password", 401);
    }

    // Opportunistic cleanup — does not affect login result
    void cleanupExpiredSessions().catch(() => undefined);

    const sessionToken = await createSession();
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, sessionToken, getSessionCookieOptions());

    securityAudit({
      event: "login_success",
      correlationId,
      ip,
      username,
      path: "/api/auth/login",
      method: "POST",
    });

    return successResponse({ ok: true });
  } catch (error) {
    return await caughtErrorResponse(error, "Login failed", 500);
  }
}
