import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, parsePagination, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createBoardInventorySchema } from "@/validators/inventory";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { page, limit, search } = parsePagination(request.nextUrl.searchParams);
    const purchases = await inventoryService.getBoardPurchases(page, limit, search);
    return successResponse(purchases);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch purchases", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createBoardInventorySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const inventory = await inventoryService.createBoardInventory(parsed.data);
    return successResponse(inventory, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create purchase", 500);
  }
}
