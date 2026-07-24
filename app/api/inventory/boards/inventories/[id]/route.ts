import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";
import { updateBoardInventorySchema } from "@/validators/inventory";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateBoardInventorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const inventory = await inventoryService.updateBoardInventory(id, parsed.data);
    return successResponse(inventory);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update inventory", 400);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    await inventoryService.deleteBoardInventory(id);
    return successResponse({ success: true });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete inventory", 400);
  }
}
