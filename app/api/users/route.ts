import { NextRequest } from "next/server";
import { DEFAULT_BODY_LIMIT, parseJsonBody } from "@/lib/request-body";
import { requireAdmin } from "@/lib/require-session";
import { caughtErrorResponse, errorResponse, successResponse } from "@/lib/api-response";
import { userService } from "@/services/users/user.service";
import { createUserSchema } from "@/validators/users";

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session.ok) return session.response;
    const users = await userService.list();
    return successResponse(users);
  } catch (error) {
    return await caughtErrorResponse(error, "Failed to list users", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session.ok) return session.response;

    const parsedBody = await parseJsonBody(request, DEFAULT_BODY_LIMIT);
    if (!parsedBody.ok) return parsedBody.response;

    const parsed = createUserSchema.safeParse(parsedBody.data);
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten());
    }

    const user = await userService.create(parsed.data);
    return successResponse(user, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    const status = message.includes("already exists") ? 409 : 400;
    return await caughtErrorResponse(error, "Failed to create user", status);
  }
}
