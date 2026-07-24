import { cacheDel, redisEval, redisSetNxEx } from "@/lib/redis";
import { errorResponse } from "@/lib/api-response";
import type { NextResponse } from "next/server";

const memoryLocks = new Map<string, number>();

/**
 * Best-effort distributed lock (Redis SET NX EX) with in-memory fallback.
 * Prevents concurrent duplicate execution of expensive mutations.
 */
export async function acquireRequestLock(
  key: string,
  ttlSeconds: number
): Promise<{ acquired: true; release: () => Promise<void> } | { acquired: false }> {
  const redisKey = `lock:${key}`;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const redisOk = await redisSetNxEx(redisKey, token, ttlSeconds);
  if (redisOk === true) {
    return {
      acquired: true,
      release: async () => {
        await redisEval(
          `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
          [redisKey],
          [token]
        );
      },
    };
  }

  if (redisOk === false) {
    return { acquired: false };
  }

  // Redis unavailable — process-local fallback
  const now = Date.now();
  const expires = memoryLocks.get(key);
  if (expires !== undefined && expires > now) {
    return { acquired: false };
  }
  memoryLocks.set(key, now + ttlSeconds * 1000);
  return {
    acquired: true,
    release: async () => {
      memoryLocks.delete(key);
      await cacheDel(redisKey);
    },
  };
}

export function conflictLockedResponse(message = "Another request is already processing this resource"): NextResponse {
  return errorResponse(message, 409);
}
