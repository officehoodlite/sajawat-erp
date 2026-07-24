import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updatePaintEntrySchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updatePaintEntrySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const lot = await manufacturingService.updatePaintEntry(
      id,
      parsed.data.paintProductId,
      parsed.data.quantity
    );
    return successResponse(lot);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update paint entry", 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const lot = await manufacturingService.deletePaintEntry(id);
    return successResponse(lot);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete paint entry", 400);
  }
}
