import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handle } from "@/lib/api";
import { clientIp, createSession, verifyPassword } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { ROLE_META, type RoleKey } from "@/lib/rbac";

const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12);

const Body = z.object({ email: z.string().email().max(200), password: z.string().min(1).max(200), remember: z.boolean().optional() });

export const POST = handle(async (req: Request) => {
  const ip = await clientIp();
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.ok) return NextResponse.json({ error: `Trop de tentatives. Réessayez dans ${rl.retryAfter} s.` }, { status: 429 });

  const { email, password, remember } = Body.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Constant-ish work regardless of user existence.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) {
    await audit("auth.login_failed", { meta: { email }, ip });
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect" }, { status: 401 });
  }
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user, { remember });
  await audit("auth.login", { userId: user.id, ip });
  return NextResponse.json({ redirect: ROLE_META[user.roleKey as RoleKey]?.home ?? "/app" });
});
