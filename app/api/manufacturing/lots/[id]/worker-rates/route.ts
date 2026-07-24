import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updateLotWorkerRatesSchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const rates = await manufacturingService.getLotWorkerRates(id);
    return successResponse(rates);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch worker rates", error instanceof Error && error.message === "Lot not found" ? 404 : 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateLotWorkerRatesSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const summary = await manufacturingService.updateLotWorkerRates(id, parsed.data);
    return successResponse(summary);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update worker rates", 400);
  }
}
