import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, parsePagination, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { page, limit, search } = parsePagination(request.nextUrl.searchParams);
    const consumption = await inventoryService.getBoardConsumption(page, limit, search);
    return successResponse(consumption);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch consumption", 500);
  }
}
