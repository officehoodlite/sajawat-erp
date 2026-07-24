import { createHash, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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

export async function isValidCredentials(
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

export async function createSession(): Promise<string> {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SEC * 1000);

  await prisma.authSession.create({
    data: { tokenHash, expiresAt },
  });

  return rawToken;
}

export async function revokeSession(rawToken: string | undefined): Promise<number> {
  if (!rawToken) return 0;
  const tokenHash = hashSessionToken(rawToken);

  const result = await prisma.authSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/** Revoke every active session (logout-all / credential containment). */
export async function revokeAllSessions(): Promise<number> {
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
  if (!rawToken || rawToken.length < 32) return false;

  const tokenHash = hashSessionToken(rawToken);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    select: { expiresAt: true, revokedAt: true },
  });

  return (
    !!session && !session.revokedAt && session.expiresAt.getTime() > Date.now()
  );
}
