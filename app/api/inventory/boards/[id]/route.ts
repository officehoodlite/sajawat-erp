import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";
import { updateBoardSchema } from "@/validators/inventory";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    await inventoryService.deleteBoardMaterial(id);
    return successResponse({ success: true });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to delete board", 500);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = updateBoardSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const board = await inventoryService.updateBoardMaterial(id, parsed.data);
    return successResponse(board);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update board", 500);
  }
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const thicknesses = await inventoryService.getThicknesses(id);
    return successResponse(thicknesses);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch thicknesses", 500);
  }
}
