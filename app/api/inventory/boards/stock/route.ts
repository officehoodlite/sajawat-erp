import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  caughtErrorResponse,
  errorResponse,
  parseOptionalPagination,
  successResponse,
} from "@/lib/api-response";
import {
  HEAVY_READ_LIMIT,
  clientIpFromRequest,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";

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
      path: "/api/inventory/boards/stock",
      correlationId,
    });
    if (!limited.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429, {
        retryAfterSec: limited.retryAfterSec,
      });
    }

    const stock = await inventoryService.getBoardStock();
    const pagination = parseOptionalPagination(request.nextUrl.searchParams);
    if (!pagination) {
      return successResponse(stock);
    }

    const { page, limit, skip } = pagination;
    const total = stock.length;
    const items = stock.slice(skip, skip + limit);
    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch board stock", 500);
  }
}
