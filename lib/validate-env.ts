/**
 * Fail fast when critical environment variables are missing or unsafe for production.
 * Called from instrumentation.ts before the server handles traffic.
 */

const CRITICAL = [
  "DATABASE_URL",
  "AUTH_USERNAME",
  "AUTH_PASSWORD",
  "AUTH_SESSION_TOKEN",
] as const;

const MIN_SESSION_SECRET_LEN = 32;

function hasPostgresSsl(databaseUrl: string): boolean {
  const lower = databaseUrl.toLowerCase();
  return (
    lower.includes("sslmode=require") ||
    lower.includes("sslmode=verify-full") ||
    lower.includes("sslmode=verify-ca") ||
    lower.includes("ssl=true")
  );
}

function isBcryptHash(value: string): boolean {
  return /^\$2[aby]?\$\d{2}\$/.test(value);
}

export function validateEnv(): void {
  for (const key of CRITICAL) {
    if (!process.env[key]?.trim()) {
      console.error(`[FATAL] Missing required environment variable: ${key}`);
      process.exit(1);
    }
  }

  const sessionSecret = process.env.AUTH_SESSION_TOKEN!.trim();
  if (sessionSecret.length < MIN_SESSION_SECRET_LEN) {
    console.error(
      `[FATAL] AUTH_SESSION_TOKEN must be at least ${MIN_SESSION_SECRET_LEN} characters (session pepper).`
    );
    process.exit(1);
  }

  if (process.env.NODE_ENV === "production") {
    const databaseUrl = process.env.DATABASE_URL!.trim();
    if (!hasPostgresSsl(databaseUrl)) {
      console.error(
        "[FATAL] DATABASE_URL must use TLS in production (e.g. ?sslmode=require)."
      );
      process.exit(1);
    }

    const password = process.env.AUTH_PASSWORD!.trim();
    if (!isBcryptHash(password) && password.length < 12) {
      console.error(
        "[FATAL] AUTH_PASSWORD must be a bcrypt hash ($2…) or at least 12 characters in production."
      );
      process.exit(1);
    }

    if (/^admin$/i.test(process.env.AUTH_USERNAME!.trim()) && password === "admin") {
      console.error(
        "[FATAL] Default credentials admin/admin are not allowed in production."
      );
      process.exit(1);
    }
  }
}
