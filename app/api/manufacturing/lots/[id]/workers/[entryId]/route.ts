import { NextRequest } from "next/server";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { securityAudit } from "@/lib/security-audit";
import { manufacturingService } from "@/services/manufacturing/manufacturing.service";
import { updateLotWorkerEntrySchema } from "@/validators/manufacturing";

type Params = { params: Promise<{ id: string; entryId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id, entryId } = await params;
    const body = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!body.ok) return body.response;

    const parsed = updateLotWorkerEntrySchema.safeParse(body.data);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const summary = await manufacturingService.updateLotWorkerEntry(
      id,
      entryId,
      parsed.data
    );
    return successResponse(summary);
  } catch (error) {
    const notFound = error instanceof Error && error.message === "Entry not found";
    if (notFound) {
      securityAudit({
        event: "authorization_failure",
        path: "/api/manufacturing/lots/.../workers/...",
        method: "PUT",
        detail: "worker entry/lot mismatch or missing",
      });
    }
    return await caughtErrorResponse(
      error,
      "Failed to update worker entry",
      notFound ? 404 : 400
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const { id, entryId } = await params;
    const summary = await manufacturingService.deleteLotWorkerEntry(id, entryId);
    return successResponse(summary);
  } catch (error) {
    const notFound = error instanceof Error && error.message === "Entry not found";
    if (notFound) {
      securityAudit({
        event: "authorization_failure",
        path: "/api/manufacturing/lots/.../workers/...",
        method: "DELETE",
        detail: "worker entry/lot mismatch or missing",
      });
    }
    return await caughtErrorResponse(
      error,
      "Failed to delete worker entry",
      notFound ? 404 : 400
    );
  }
}
