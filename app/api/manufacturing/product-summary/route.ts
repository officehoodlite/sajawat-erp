import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import {
  HEAVY_READ_LIMIT,
  clientIpFromRequest,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { requireSession } from "@/lib/require-session";
import { findProductSummary } from "@/repositories/manufacturing/product-summary.repository";

const querySchema = z.object({
  productId: z.string().min(1).max(64),
  lotIds: z.array(z.string().min(1).max(64)).max(100),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const ip = clientIpFromRequest(request);
    let correlationId: string | undefined;
    try {
      correlationId = (await headers()).get("x-correlation-id") ?? undefined;
    } catch {
      /* ignore */
    }
    const limited = await enforceRateLimit({
      key: `heavy-read:${ip}`,
      ...HEAVY_READ_LIMIT,
      ip,
      path: "/api/manufacturing/product-summary",
      correlationId,
    });
    if (!limited.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429, {
        retryAfterSec: limited.retryAfterSec,
      });
    }

    const lotIds = (request.nextUrl.searchParams.get("lotIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const parsed = querySchema.safeParse({
      productId: request.nextUrl.searchParams.get("productId") ?? "",
      lotIds,
    });
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Select a product", 400);
    }

    const data = await findProductSummary(parsed.data.productId, parsed.data.lotIds);
    if (!data) return errorResponse("Product not found", 404);
    return successResponse(data);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch product summary", 500);
  }
}
