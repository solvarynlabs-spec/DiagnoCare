import { NextResponse } from "next/server";
import { GOOGLE_COOKIE, beginGoogle, googleEnabled } from "@/lib/auth/google";

/** Starts « Continuer avec Google ». ?role=STUDENT|TEACHER (sign-up) &next=/path */
export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!googleEnabled()) return NextResponse.redirect(new URL("/login?error=google_config", url.origin));
  const role = url.searchParams.get("role") === "TEACHER" ? "TEACHER" : "STUDENT";
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : undefined;
  const { url: authUrl, cookie } = await beginGoogle(url.origin, { role, next });
  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_COOKIE, cookie, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/auth/google", maxAge: 600 });
  return res;
}
