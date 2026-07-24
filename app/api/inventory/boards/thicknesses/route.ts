import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireSession } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { inventoryService } from "@/services/inventory/inventory.service";
import { createBoardThicknessSchema } from "@/validators/inventory";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;
    const body = parsedBody.data;
    const parsed = createBoardThicknessSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }
    const thicknesses = await inventoryService.createThickness(parsed.data);
    return successResponse(thicknesses, 201);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to create thickness", 500);
  }
}
