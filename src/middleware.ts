import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

const AREAS: { prefix: string; roles: string[] }[] = [
  { prefix: "/app", roles: ["STUDENT", "TEACHER", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"] },
  { prefix: "/teach", roles: ["TEACHER", "UNIVERSITY_ADMIN", "PLATFORM_ADMIN"] },
  { prefix: "/institution", roles: ["UNIVERSITY_ADMIN", "PLATFORM_ADMIN"] },
  { prefix: "/admin", roles: ["PLATFORM_ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const area = AREAS.find((a) => req.nextUrl.pathname === a.prefix || req.nextUrl.pathname.startsWith(`${a.prefix}/`));
  if (!area) return NextResponse.next();
  const claims = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!claims) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (!area.roles.includes(claims.role)) return NextResponse.redirect(new URL("/login?denied=1", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/teach/:path*", "/institution/:path*", "/admin/:path*"] };
