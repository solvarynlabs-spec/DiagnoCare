import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { GOOGLE_COOKIE, finishGoogle, googleEnabled, readState } from "@/lib/auth/google";
import { clientIp, createSession, hashPassword } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";
import { ROLE_META, type RoleKey } from "@/lib/rbac";

/** Google redirects here. Links an existing account by verified e-mail, or creates a new one. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const fail = (code: string) => {
    const res = NextResponse.redirect(new URL(`/login?error=${code}`, url.origin));
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  };
  if (!googleEnabled()) return fail("google_config");
  if (url.searchParams.get("error")) return fail("google_cancelled");

  const cookieHeader = req.headers.get("cookie") ?? "";
  const raw = cookieHeader.split(/;\s*/).find((c) => c.startsWith(`${GOOGLE_COOKIE}=`))?.slice(GOOGLE_COOKIE.length + 1);
  const st = await readState(raw);
  const code = url.searchParams.get("code");
  if (!st || !code || url.searchParams.get("state") !== st.state) return fail("google_state");

  try {
    const id = await finishGoogle(url.origin, code, st);
    let user = await prisma.user.findUnique({ where: { googleId: id.sub } });
    let created = false;
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: id.email } });
      if (byEmail) {
        // Google has verified ownership of this address: link it to the existing account.
        user = await prisma.user.update({ where: { id: byEmail.id }, data: { googleId: id.sub, avatarUrl: byEmail.avatarUrl ?? id.picture, emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date() } });
      } else {
        user = await prisma.user.create({
          data: {
            email: id.email,
            name: id.name,
            googleId: id.sub,
            avatarUrl: id.picture,
            emailVerifiedAt: new Date(),
            roleKey: st.role,
            locale: "fr",
            // Unusable random password: this account signs in with Google (a password can be set later).
            passwordHash: await hashPassword(randomBytes(32).toString("hex")),
            subscription: { create: { plan: "FREE", status: "ACTIVE", provider: "demo" } },
          },
        });
        created = true;
      }
    }
    if (!user.active) return fail("account_disabled");
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user);
    await audit(created ? "auth.register_google" : "auth.login_google", { userId: user.id, ip: await clientIp() });
    if (created) await notify(user.id, "Bienvenue sur DiagnoCare", "Votre compte Google est relié. Commencez par un cas « Fondamental ».", "/app/cases");
    const res = NextResponse.redirect(new URL(st.next ?? ROLE_META[user.roleKey as RoleKey]?.home ?? "/app", url.origin));
    res.cookies.delete({ name: GOOGLE_COOKIE, path: "/api/auth/google" });
    return res;
  } catch (e) {
    console.error("[google-oauth]", e);
    return fail("google_failed");
  }
}
