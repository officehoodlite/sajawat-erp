import { cookies } from "next/headers";
import { AUTH_COOKIE, getSessionPrincipal } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const principal = await getSessionPrincipal(token);
  if (!principal) {
    return errorResponse("Unauthorized", 401);
  }

  return successResponse({
    userId: principal.userId,
    username: principal.username,
    role: principal.role,
    workerPrices: principal.role === "ADMIN" || principal.permissions.workerPrices,
  });
}
