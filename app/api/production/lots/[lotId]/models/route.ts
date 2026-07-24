import { NextRequest } from "next/server";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { productionService } from "@/services/production/production.service";

type Params = { params: Promise<{ lotId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { lotId } = await params;
    const models = await productionService.lotModels(lotId);
    return successResponse(models);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch models", 500);
  }
}
