export const AUTH_COOKIE = "sajawat_session";

/** 8-hour sessions — short enough for revoke window, usable for ERP shifts */
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

/**
 * Allow only same-app relative paths for post-login redirects.
 * Rejects protocol-relative (//), schemes, traversal, and /login itself.
 */
export function safeRedirectPath(from: string | null | undefined): string {
  const fallback = "/manufacturing";
  if (!from) return fallback;

  let path = from.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.includes("://") || path.includes("\\") || path.includes("..")) return fallback;
  if (/[\0\r\n]/.test(path)) return fallback;
  if (path === "/login" || path.startsWith("/login?") || path.startsWith("/login/")) {
    return fallback;
  }

  return path;
}
