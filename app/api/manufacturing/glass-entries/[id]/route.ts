import { NextRequest } from "next/server";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updateGlassEntrySchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateGlassEntrySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const lot = await manufacturingService.updateGlassEntry(
      id,
      parsed.data.glassProductId,
      parsed.data.quantity
    );
    return successResponse(lot);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update glass entry", 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const lot = await manufacturingService.deleteGlassEntry(id);
    return successResponse(lot);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete glass entry", 400);
  }
}
