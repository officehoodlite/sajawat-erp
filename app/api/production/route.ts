import { NextRequest } from "next/server";
import { LARGE_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { productionService } from "@/services/production/production.service";
import {
  createProductionEntrySchema,
  productionListQuerySchema,
} from "@/validators/production";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const sp = request.nextUrl.searchParams;
    const mode = sp.get("mode") ?? (sp.get("date") ? "date" : undefined);
    const parsed = productionListQuerySchema.safeParse({
      mode,
      date: sp.get("date") ?? undefined,
      lotId: sp.get("lotId") ?? undefined,
      catalogModelId: sp.get("catalogModelId") ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ??
          "Provide mode=date&date=, mode=lot&lotId=, or mode=model&catalogModelId=",
        400
      );
    }

    const entries = await productionService.list(parsed.data);
    return successResponse({ filter: parsed.data, entries });
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to list production", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, LARGE_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createProductionEntrySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message ?? "Invalid input", 400);
    }
    const entry = await productionService.create(parsed.data);
    return successResponse(entry, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create entry", 400);
  }
}
