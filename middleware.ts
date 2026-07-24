import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token || token.length < 32) return false;

  try {
    const verifyUrl = new URL("/api/auth/session", request.nextUrl.origin);
    const res = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        cookie: `${AUTH_COOKIE}=${token}`,
      },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
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

  if (pathname.startsWith("/api/")) {
    if (isPublicPath(pathname)) return nextWithCorrelation(request);

    const authed = await isAuthenticated(request);
    if (!authed) {
      const correlationId =
        request.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized",
          correlationId,
        },
        {
          status: 401,
          headers: { "x-correlation-id": correlationId },
        }
      );
    }
    return nextWithCorrelation(request);
  }

  const authed = await isAuthenticated(request);

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
