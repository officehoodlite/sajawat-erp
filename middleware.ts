import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  return !!token && token.length >= 32;
}

function withCorrelation(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

function nextWithCorrelation(request: NextRequest): NextResponse {
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-correlation-id", correlationId);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APIs are gated by requireSession in the handler. Skipping the nested
  // /api/auth/session fetch here removes an extra HTTP + DB hop per request.
  if (pathname.startsWith("/api/")) {
    return nextWithCorrelation(request);
  }

  const authed = isAuthenticated(request);

  if (pathname === "/") {
    return withCorrelation(
      request,
      NextResponse.redirect(
        new URL(authed ? "/manufacturing" : "/login", request.url)
      )
    );
  }

  if (!authed && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return withCorrelation(request, NextResponse.redirect(loginUrl));
  }

  if (authed && pathname === "/login") {
    return withCorrelation(
      request,
      NextResponse.redirect(new URL("/manufacturing", request.url))
    );
  }

  return nextWithCorrelation(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
