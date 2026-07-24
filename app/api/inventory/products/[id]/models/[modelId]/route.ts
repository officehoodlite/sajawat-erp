import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { updateCatalogProductModelSchema } from "@/validators/inventory";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id, modelId } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateCatalogProductModelSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const model = await inventoryService.updateCatalogProductModel(id, modelId, parsed.data);
    return successResponse(model);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update model";
    const status = /cannot edit|used in manufacturing/i.test(message) ? 409 : 500;
    return await caughtErrorResponse(error, "Failed to update model", status);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id, modelId } = await params;
    await inventoryService.deleteCatalogProductModel(id, modelId);
    return successResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete model";
    const status = /cannot delete|used in manufacturing|not found/i.test(message)
      ? message.toLowerCase().includes("not found")
        ? 404
        : 409
      : 500;
    return await caughtErrorResponse(error, "Failed to delete model", status);
  }
}
