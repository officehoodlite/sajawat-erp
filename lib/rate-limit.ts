import { redisIncrWithExpiry } from "@/lib/redis";
import { securityAudit } from "@/lib/security-audit";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter.
 * Prefers Redis when available; falls back to in-memory per process.
 */
export async function rateLimit(
  key: string,
  options: { windowMs: number; max: number }
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const redisCount = await redisIncrWithExpiry(`rl:${key}`, options.windowMs);
  if (redisCount !== null) {
    if (redisCount > options.max) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil(options.windowMs / 1000)),
      };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  return memoryRateLimit(key, options);
}

function memoryRateLimit(
  key: string,
  options: { windowMs: number; max: number }
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > options.max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSec: 0 };
}

/**
 * Resolve client IP without trusting arbitrary client X-Forwarded-For.
 *
 * Prefer platform / proxy-controlled headers:
 * 1. cf-connecting-ip (Cloudflare)
 * 2. x-real-ip (nginx/caddy)
 * 3. Last hop of x-forwarded-for (immediate proxy appends at the end)
 * 4. NextRequest.ip when present
 *
 * Deployments must overwrite or strip client-supplied forwarding headers.
 */
export function clientIpFromRequest(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf.slice(0, 128);

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      // Immediate reverse proxy appends the connecting client as the last hop.
      return hops[hops.length - 1]!.slice(0, 128);
    }
  }

  const nextIp = (request as Request & { ip?: string }).ip?.trim();
  if (nextIp) return nextIp.slice(0, 128);

  return "unknown";
}

export async function enforceRateLimit(options: {
  key: string;
  windowMs: number;
  max: number;
  ip?: string;
  path?: string;
  correlationId?: string;
}): Promise<{ allowed: true } | { allowed: false; retryAfterSec: number }> {
  const result = await rateLimit(options.key, {
    windowMs: options.windowMs,
    max: options.max,
  });

  if (!result.allowed) {
    securityAudit({
      event: "rate_limit_exceeded",
      correlationId: options.correlationId,
      ip: options.ip,
      path: options.path,
      retryAfterSec: result.retryAfterSec,
      detail: options.key,
    });
    return { allowed: false, retryAfterSec: result.retryAfterSec };
  }

  return { allowed: true };
}

/** Login: 5/min per IP, 10/min per username (unchanged). */
export const LOGIN_IP_LIMIT = { windowMs: 60_000, max: 5 } as const;
export const LOGIN_USER_LIMIT = { windowMs: 60_000, max: 10 } as const;

/** Expensive ops — generous enough for normal ERP use. */
export const COMPLETE_LOT_LIMIT = { windowMs: 60_000, max: 10 } as const;
export const HEAVY_READ_LIMIT = { windowMs: 60_000, max: 120 } as const;
