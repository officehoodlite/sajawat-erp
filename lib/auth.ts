import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  FULL_PERMISSIONS,
  parsePermissions,
  type AuthPrincipal,
  type UserRole,
} from "@/lib/permissions";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE_SEC,
  getSessionCookieOptions,
  safeRedirectPath,
} from "@/lib/auth-constants";

export {
  AUTH_COOKIE,
  SESSION_MAX_AGE_SEC,
  getSessionCookieOptions,
  safeRedirectPath,
};

/** bcrypt hash of a fixed dummy string — always exercised on failed username match */
const DUMMY_BCRYPT_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAuthUsername() {
  return requireEnv("AUTH_USERNAME");
}

function getAuthPassword() {
  return requireEnv("AUTH_PASSWORD");
}

/** Pepper for hashing session cookies at rest (formerly the static cookie value). */
function getSessionSecret() {
  return requireEnv("AUTH_SESSION_TOKEN");
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$\d{2}\$/.test(value);
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    const pad = Buffer.alloc(bufA.length);
    timingSafeEqual(bufA, pad);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

export async function authenticate(
  username: string,
  password: string
): Promise<AuthPrincipal | null> {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    const user = await prisma.user.findUnique({ where: { username } });
    const hashToCompare = user?.passwordHash ?? DUMMY_BCRYPT_HASH;
    const passwordOk = await bcrypt.compare(password, hashToCompare);
    if (!user || !user.isActive || !passwordOk) return null;
    const role = user.role as UserRole;
    return {
      userId: user.id,
      username: user.username,
      role,
      permissions: parsePermissions(user.permissions, role),
    };
  }

  if (!(await isValidEnvCredentials(username, password))) return null;
  return {
    userId: null,
    username,
    role: "ADMIN",
    permissions: { ...FULL_PERMISSIONS },
  };
}

export async function isValidCredentials(
  username: string,
  password: string
): Promise<boolean> {
  return (await authenticate(username, password)) != null;
}

async function isValidEnvCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const expectedUser = getAuthUsername();
  const storedPassword = getAuthPassword();
  const usernameOk = safeEqualString(username, expectedUser);

  let passwordOk = false;
  if (isBcryptHash(storedPassword)) {
    const hashToCompare = usernameOk ? storedPassword : DUMMY_BCRYPT_HASH;
    passwordOk = await bcrypt.compare(password, hashToCompare);
  } else {
    passwordOk = safeEqualString(password, storedPassword);
  }

  return usernameOk && passwordOk;
}

function hashSessionToken(rawToken: string): string {
  return createHash("sha256")
    .update(`${getSessionSecret()}:${rawToken}`)
    .digest("hex");
}

export async function createSession(userId?: string | null): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await prisma.authSession.create({
    data: { tokenHash, expiresAt, userId: userId ?? null },
  });

  return rawToken;
}

export async function revokeSession(rawToken: string | undefined): Promise<number> {
  if (!rawToken) return 0;
  const tokenHash = hashSessionToken(rawToken);
  clearSessionPrincipalCache(tokenHash);

  const result = await prisma.authSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/** Revoke every active session (logout-all / credential containment). */
export async function revokeAllSessions(): Promise<number> {
  clearSessionPrincipalCache();
  const result = await prisma.authSession.updateMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/**
 * Delete expired sessions and revoked sessions older than `retainRevokedMs`.
 * Safe to call opportunistically (login / logout-all).
 */
export async function cleanupExpiredSessions(
  retainRevokedMs = 7 * 24 * 60 * 60 * 1000
): Promise<number> {
  const now = new Date();
  const revokedCutoff = new Date(now.getTime() - retainRevokedMs);

  const result = await prisma.authSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { revokedAt: { not: null, lt: revokedCutoff } },
      ],
    },
  });
  return result.count;
}

export async function isSessionValid(
  rawToken: string | undefined
): Promise<boolean> {
  return (await getSessionPrincipal(rawToken)) != null;
}

const SESSION_PRINCIPAL_CACHE_MS = 5_000;
const sessionPrincipalCache = new Map<
  string,
  { expiresAt: number; principal: AuthPrincipal | null }
>();

function clearSessionPrincipalCache(tokenHash?: string) {
  if (tokenHash) sessionPrincipalCache.delete(tokenHash);
  else sessionPrincipalCache.clear();
}

export async function getSessionPrincipal(
  rawToken: string | undefined
): Promise<AuthPrincipal | null> {
  if (!rawToken || rawToken.length < 32) return null;

  const tokenHash = hashSessionToken(rawToken);
  const cached = sessionPrincipalCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.principal;
  }

  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      revokedAt: true,
      userId: true,
      user: {
        select: {
          username: true,
          role: true,
          permissions: true,
          isActive: true,
        },
      },
    },
  });

  const cacheExpiresAt = Date.now() + SESSION_PRINCIPAL_CACHE_MS;
  const remember = (principal: AuthPrincipal | null) => {
    if (sessionPrincipalCache.size > 200) sessionPrincipalCache.clear();
    sessionPrincipalCache.set(tokenHash, { expiresAt: cacheExpiresAt, principal });
    return principal;
  };

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return remember(null);
  }

  if (session.userId) {
    if (!session.user || !session.user.isActive) return remember(null);
    const role = session.user.role as UserRole;
    return remember({
      userId: session.userId,
      username: session.user.username,
      role,
      permissions: parsePermissions(session.user.permissions, role),
    });
  }

  return remember({
    userId: null,
    username: getAuthUsername(),
    role: "ADMIN",
    permissions: { ...FULL_PERMISSIONS },
  });
}
