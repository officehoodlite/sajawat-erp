import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { requireSession } from "@/lib/require-session";
import { productionService } from "@/services/production/production.service";

export async function GET() {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const suggestions = await productionService.suggestions();
    return successResponse(suggestions);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch suggestions", 500);
  }
}
