import { NextRequest } from "next/server";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { productionService } from "@/services/production/production.service";
import { updateProductionEntrySchema } from "@/validators/production";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateProductionEntrySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const entry = await productionService.update(id, parsed.data);
    return successResponse(entry);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update entry", 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    await productionService.delete(id);
    return successResponse({ ok: true });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete entry", 400);
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const entry = await productionService.getById(id);
    if (!entry) return errorResponse("Not found", 404);
    return successResponse(entry);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch entry", 500);
  }
}
