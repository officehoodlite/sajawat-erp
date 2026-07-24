import { errorResponse } from "@/lib/api-response";
import type { NextResponse } from "next/server";

/** Default JSON body size for ERP mutations (64 KiB). */
export const DEFAULT_BODY_LIMIT = 64 * 1024;

/** Login credentials — keep small. */
export const LOGIN_BODY_LIMIT = 4 * 1024;

/** Manufacturing / production payloads with name arrays. */
export const LARGE_BODY_LIMIT = 256 * 1024;

type ParseOk<T> = { ok: true; data: T };
type ParseFail = { ok: false; response: NextResponse };

/**
 * Read and parse JSON with a hard byte limit (Content-Length + body length).
 * Returns 413 when oversized.
 */
export async function parseJsonBody<T = unknown>(
  request: Request,
  maxBytes: number = DEFAULT_BODY_LIMIT
): Promise<ParseOk<T> | ParseFail> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      return {
        ok: false,
        response: errorResponse("Request body too large", 413, {
          maxBytes,
        }),
      };
    }
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: errorResponse("Failed to read request body", 400),
    };
  }

  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: errorResponse("Request body too large", 413, {
        maxBytes,
      }),
    };
  }

  if (!raw.trim()) {
    return {
      ok: false,
      response: errorResponse("Request body is required", 400),
    };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return {
      ok: false,
      response: errorResponse("Invalid JSON body", 400),
    };
  }
}
