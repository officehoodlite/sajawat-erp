import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, parsePagination, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createBoardSchema } from "@/validators/inventory";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { page, limit, search } = parsePagination(request.nextUrl.searchParams);
    const materials = await inventoryService.getBoardMaterialsPaginated(page, limit, search);
    return successResponse(materials);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch boards", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createBoardSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const materials = await inventoryService.createBoardMaterial(parsed.data);
    return successResponse(materials, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create board", 500);
  }
}
