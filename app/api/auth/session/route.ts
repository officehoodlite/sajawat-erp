import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE, isSessionValid } from "@/lib/auth";

/**
 * Internal session probe used by Edge middleware (revocation-aware).
 * Public under /api/auth/* — answers only whether the presented cookie is valid.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const valid = await isSessionValid(token);

  if (!valid) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
