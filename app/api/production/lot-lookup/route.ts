import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { productionService } from "@/services/production/production.service";

/** Resolve a lot number to id + models for the entry form. */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const lotNumber = request.nextUrl.searchParams.get("lotNumber")?.trim();
    if (!lotNumber) return errorResponse("lotNumber is required", 400);

    const lot = await productionService.findLotByNumber(lotNumber);
    if (!lot) return successResponse({ lot: null, models: [] });

    const models = await productionService.lotModels(lot.id);
    return successResponse({ lot, models });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to look up lot", 500);
  }
}
