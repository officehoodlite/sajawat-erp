import { NextRequest } from "next/server";
import {
  caughtErrorResponse,
  errorResponse,
  parseOptionalPagination,
  successResponse,
} from "@/lib/api-response";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createBoardInventorySchema } from "@/validators/inventory";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const thicknessId = request.nextUrl.searchParams.get("boardThicknessId") ?? undefined;
    const inventories = await inventoryService.getBoardInventories(thicknessId);
    const pagination = parseOptionalPagination(request.nextUrl.searchParams);
    if (!pagination) {
      return successResponse(inventories);
    }

    const { page, limit, skip } = pagination;
    const total = inventories.length;
    const items = inventories.slice(skip, skip + limit);
    return successResponse({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch inventories", 500);
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
    return await caughtErrorResponse(error, "Failed to create inventory", 500);
  }
}
