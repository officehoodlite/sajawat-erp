import { NextRequest } from "next/server";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { createLotWorkerEntrySchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const entries = await manufacturingService.getLotWorkerEntries(id);
    return successResponse(entries);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to fetch worker entries", error instanceof Error && error.message === "Lot not found" ? 404 : 500);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createLotWorkerEntrySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const summary = await manufacturingService.createLotWorkerEntry(id, parsed.data);
    return successResponse(summary, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create worker entry", 400);
  }
}
