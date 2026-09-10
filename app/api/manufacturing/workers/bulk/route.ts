import { NextRequest } from "next/server";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { createBulkLotWorkerEntriesSchema } from "@/validators/manufacturing";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const parsed = createBulkLotWorkerEntriesSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const result = await manufacturingService.createLotWorkerEntriesForLots(parsed.data);
    return successResponse(result, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create worker entries", 400);
  }
}
