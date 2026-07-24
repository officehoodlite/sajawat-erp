import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { requireSession } from "@/lib/require-session";
import { inventoryService } from "@/services/inventory/inventory.service";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const options = await inventoryService.getBoardOptions();
    return successResponse(options);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch board options", 500);
  }
}
