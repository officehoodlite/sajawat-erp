import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { lotRepository } from "@/repositories/manufacturing/lot.repository";
import { findLotSummaryById } from "@/repositories/manufacturing/model.repository";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updateLotSchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const scope = request.nextUrl.searchParams.get("scope");

    if (scope === "summary") {
      const lot = await findLotSummaryById(id);
      if (!lot) return errorResponse("Lot not found", 404);
      return successResponse(lot);
    }

    const lot = await lotRepository.findById(id);
    if (!lot) return errorResponse("Lot not found", 404);
    return successResponse(lot);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch lot", 500);
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
    const parsed = updateLotSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const lot = await manufacturingService.updateLot(id, parsed.data);
    return successResponse(lot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lot";
    return await caughtErrorResponse(error, "Failed to update lot", message === "Lot not found" ? 404 : 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    await manufacturingService.deleteLot(id);
    return successResponse({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete lot";
    return await caughtErrorResponse(error, "Failed to delete lot", message === "Lot not found" ? 404 : 400);
  }
}
