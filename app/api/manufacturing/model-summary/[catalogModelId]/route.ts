import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import {
  HEAVY_READ_LIMIT,
  clientIpFromRequest,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { requireSession } from "@/lib/require-session";
import { findCatalogModelLotSummaries } from "@/repositories/manufacturing/model-summary.repository";

type Params = { params: Promise<{ catalogModelId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
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
      path: "/api/manufacturing/model-summary",
      correlationId,
    });
    if (!limited.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429, {
        retryAfterSec: limited.retryAfterSec,
      });
    }

    const { catalogModelId } = await params;
    const data = await findCatalogModelLotSummaries(catalogModelId);
    if (!data) return errorResponse("Catalog model not found", 404);
    return successResponse(data);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch model summary", 500);
  }
}
