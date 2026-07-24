import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { updateCatalogProductSchema } from "@/validators/inventory";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const product = await inventoryService.getCatalogProduct(id);
    return successResponse(product);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch product", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateCatalogProductSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const product = await inventoryService.updateCatalogProduct(id, parsed.data);
    return successResponse(product);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update product", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    await inventoryService.deleteCatalogProduct(id);
    return successResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    const status = /cannot delete|used in manufacturing/i.test(message) ? 409 : 500;
    return await caughtErrorResponse(error, "Failed to delete product", status);
  }
}
