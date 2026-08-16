import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireAdmin } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { userService } from "@/services/users/user.service";
import { updateUserSchema } from "@/validators/users";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    if (!session.ok) return session.response;

    const { id } = await params;
    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = updateUserSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const user = await userService.update(id, parsed.data);
    return successResponse(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    const status = message === "User not found" ? 404 : message.includes("already exists") ? 409 : 400;
    return await caughtErrorResponse(error, "Failed to update user", status);
  }
}
