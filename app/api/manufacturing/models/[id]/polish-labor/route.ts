import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireWorkerPrices } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updatePolishLaborSchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireWorkerPrices();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = updatePolishLaborSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const summary = await manufacturingService.updatePolishLabor(id, parsed.data);
    return successResponse(summary);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to update polish labor", 400);
  }
}
