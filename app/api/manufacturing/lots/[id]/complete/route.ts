import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import {
  COMPLETE_LOT_LIMIT,
  clientIpFromRequest,
  enforceRateLimit,
} from "@/lib/rate-limit";
import { acquireRequestLock, conflictLockedResponse } from "@/lib/request-lock";
import { requireSession } from "@/lib/require-session";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  let release: (() => Promise<void>) | undefined;
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const ip = clientIpFromRequest(request);
    let correlationId: string | undefined;
    try {
      correlationId = (await headers()).get("x-correlation-id") ?? undefined;
    } catch {
      /* ignore */
    }

    const limited = await enforceRateLimit({
      key: `complete-lot:${ip}`,
      ...COMPLETE_LOT_LIMIT,
      ip,
      path: `/api/manufacturing/lots/${id}/complete`,
      correlationId,
    });
    if (!limited.allowed) {
      return errorResponse("Too many requests. Please try again later.", 429, {
        retryAfterSec: limited.retryAfterSec,
      });
    }

    const lock = await acquireRequestLock(`complete-lot:${id}`, 120);
    if (!lock.acquired) {
      return conflictLockedResponse(
        "Lot completion is already in progress. Please wait and refresh."
      );
    }
    release = lock.release;

    const lot = await manufacturingService.completeLot(id);
    return successResponse(lot);
  } catch (error) {
    const err = error as Error & { statusCode?: number; details?: string[] };
    const status = err.statusCode ?? (err.message === "Lot not found" ? 404 : 400);
    return await caughtErrorResponse(error, "Request failed", status, err.details);
  } finally {
    if (release) await release().catch(() => undefined);
  }
}
