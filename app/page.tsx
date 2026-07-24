import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE, isSessionValid } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const authed = await isSessionValid(cookieStore.get(AUTH_COOKIE)?.value);
  redirect(authed ? "/manufacturing" : "/login");
}
