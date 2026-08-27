import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
  redisUnavailableUntil: number | undefined;
  redisConnectFailed: boolean | undefined;
};

const CIRCUIT_BREAKER_MS = 60_000;
const CONNECT_TIMEOUT_MS = 300;

function isRedisCircuitOpen(): boolean {
  const until = globalForRedis.redisUnavailableUntil;
  return until !== undefined && Date.now() < until;
}

function openRedisCircuit(): void {
  globalForRedis.redisUnavailableUntil = Date.now() + CIRCUIT_BREAKER_MS;
  globalForRedis.redisConnectFailed = true;
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 0,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: CONNECT_TIMEOUT_MS,
      commandTimeout: CONNECT_TIMEOUT_MS,
      retryStrategy: () => null,
      family: 4,
    });
    client.on("error", () => {
      openRedisCircuit();
    });
    return client;
  } catch {
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

const DEFAULT_TTL = 300;

let connectPromise: Promise<boolean> | null = null;

async function ensureRedisReady(): Promise<boolean> {
  if (!redis || isRedisCircuitOpen() || globalForRedis.redisConnectFailed) {
    return false;
  }

  if (redis.status === "ready") return true;

  if (redis.status === "connecting" && connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      await Promise.race([
        redis!.connect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Redis connect timeout")), CONNECT_TIMEOUT_MS)
        ),
      ]);
      return redis!.status === "ready";
    } catch {
      openRedisCircuit();
      return false;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!(await ensureRedisReady())) return null;
  try {
    const value = await redis!.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    openRedisCircuit();
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds = DEFAULT_TTL
): Promise<void> {
  if (!(await ensureRedisReady())) return;
  try {
    await redis!.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    openRedisCircuit();
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0 || !(await ensureRedisReady())) return;
  try {
    await redis!.del(...keys);
  } catch {
    openRedisCircuit();
  }
}

/** INCR + PEXPIRE on first hit. Returns count, or null if Redis unavailable. */
export async function redisIncrWithExpiry(
  key: string,
  windowMs: number
): Promise<number | null> {
  if (!(await ensureRedisReady())) return null;
  try {
    const count = await redis!.incr(key);
    if (count === 1) {
      await redis!.pexpire(key, windowMs);
    }
    return count;
  } catch {
    openRedisCircuit();
    return null;
  }
}

/** SET key value NX EX ttlSeconds. true=acquired, false=held, null=redis down. */
export async function redisSetNxEx(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean | null> {
  if (!(await ensureRedisReady())) return null;
  try {
    const result = await redis!.set(key, value, "EX", ttlSeconds, "NX");
    return result === "OK";
  } catch {
    openRedisCircuit();
    return null;
  }
}

export async function redisEval(
  script: string,
  keys: string[],
  args: string[]
): Promise<unknown> {
  if (!(await ensureRedisReady())) return null;
  try {
    return await redis!.eval(script, keys.length, ...keys, ...args);
  } catch {
    openRedisCircuit();
    return null;
  }
}

export const CACHE_KEYS = {
  boardOptions: "board:options",
  products: "products:list",
  paintOptions: "paint:options",
  hardwareOptions: "hardware:options",
  packingOptions: "packing:options",
  edgebindingOptions: "edgebinding:options",
  glassOptions: "glass:options",
  suppliers: "suppliers:list",
} as const;
