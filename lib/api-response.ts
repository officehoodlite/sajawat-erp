import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { PAGE_SIZE } from "@/lib/pagination";

const GENERIC_ERROR = "An unexpected error occurred. Please try again.";

const UNSAFE_MESSAGE =
  /prisma|invocation|econnrefused|enoent|econnreset|etimedout|sql|postgres|redis|database_url|missing required environment|unique constraint|foreign key|invalid `prisma|at\s+\S+\s+\(|\\|\/[a-z]:\\|syscall/i;

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown,
  correlationId?: string
) {
  const id = correlationId ?? crypto.randomUUID();
  return NextResponse.json(
    {
      error: true,
      message,
      ...(details !== undefined ? { details } : {}),
      correlationId: id,
    },
    {
      status,
      headers: { "x-correlation-id": id },
    }
  );
}

function isUnsafeClientMessage(message: string): boolean {
  return UNSAFE_MESSAGE.test(message) || message.length > 200;
}

async function resolveCorrelationId(): Promise<string> {
  try {
    const h = await headers();
    return h.get("x-correlation-id") ?? crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Log the full error server-side; return a client-safe body.
 * 5xx and internal/Prisma-style messages are always sanitized.
 * Intentional 4xx business messages (stock, not found, etc.) pass through.
 */
export async function caughtErrorResponse(
  error: unknown,
  fallbackMessage: string,
  status = 500,
  details?: unknown
) {
  const correlationId = await resolveCorrelationId();
  console.error(`[api-error] ${correlationId}`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return errorResponse("A record with this name already exists.", 409, undefined, correlationId);
    }
    if (error.code === "P2028") {
      return errorResponse(
        "Saving took too long. Try again, or save fewer materials at once.",
        504,
        undefined,
        correlationId
      );
    }
    if (error.code === "P2021" || error.code === "P2022") {
      return errorResponse(
        "Database is missing required tables or columns. Run prisma migrate deploy, then retry.",
        503,
        undefined,
        correlationId
      );
    }
  }

  const err = error as Error & { statusCode?: number; details?: unknown };
  const resolvedStatus = typeof err.statusCode === "number" ? err.statusCode : status;
  const originalMessage =
    error instanceof Error && error.message.trim()
      ? error.message.trim()
      : fallbackMessage;

  let message = originalMessage;
  let safeDetails = details ?? err.details;

  if (/unique constraint/i.test(originalMessage) && resolvedStatus === 409) {
    message = "A record with this value already exists.";
    safeDetails = undefined;
  } else if (resolvedStatus >= 500) {
    message = GENERIC_ERROR;
    safeDetails = undefined;
  } else if (isUnsafeClientMessage(originalMessage)) {
    message =
      fallbackMessage && !isUnsafeClientMessage(fallbackMessage)
        ? fallbackMessage
        : GENERIC_ERROR;
    safeDetails = undefined;
  }

  return errorResponse(message, resolvedStatus, safeDetails, correlationId);
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(PAGE_SIZE), 10) || PAGE_SIZE)
  );
  const rawSearch = searchParams.get("search")?.trim() ?? "";
  const search = rawSearch.slice(0, 200);
  return { page, limit, search, skip: (page - 1) * limit };
}

/**
 * Optional pagination: when `page` or `limit` is absent, returns null
 * so callers keep the existing unpaginated (array) response shape for the UI.
 */
export function parseOptionalPagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  search: string;
  skip: number;
} | null {
  if (!searchParams.has("page") && !searchParams.has("limit")) {
    return null;
  }
  return parsePagination(searchParams);
}
