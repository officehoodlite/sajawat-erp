import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { updateSupplierSchema } from "@/validators/inventory";

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
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const supplier = await inventoryService.updateSupplier(id, parsed.data);
    return successResponse(supplier);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update supplier", 500);
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
    await inventoryService.deleteSupplier(id);
    return successResponse({ ok: true });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete supplier", 500);
  }
}
