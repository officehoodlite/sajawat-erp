import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createCatalogProductModelSchema } from "@/validators/inventory";

export async function POST(
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
    const parsed = createCatalogProductModelSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const model = await inventoryService.createCatalogProductModel(id, parsed.data);
    return successResponse(model, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create model", 500);
  }
}
