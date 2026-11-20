import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { clientIp, createSession } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { ROLE_META, type RoleKey } from "@/lib/rbac";

import { DEMO_LOGIN_ENABLED } from "@/lib/demo";

const ACCOUNTS: Record<string, string> = {
  student: "student@medsim.demo",
  free: "free@medsim.demo",
  teacher: "teacher@medsim.demo",
  uniadmin: "uniadmin@medsim.demo",
  admin: "admin@medsim.demo",
};

/** One-click sign-in to seeded demo accounts. Disabled in production unless explicitly enabled. */
export const POST = handle(async (req: Request) => {
  if (!DEMO_LOGIN_ENABLED()) return NextResponse.json({ error: "La connexion de démonstration est désactivée" }, { status: 404 });
  const { account } = z.object({ account: z.enum(Object.keys(ACCOUNTS) as [string, ...string[]]) }).parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email: ACCOUNTS[account] } });
  if (!user) return NextResponse.json({ error: "Données de démonstration absentes. Lancez npm run db:seed." }, { status: 404 });
  await createSession(user);
  await audit("auth.demo_login", { userId: user.id, ip: await clientIp() });
  return NextResponse.json({ redirect: ROLE_META[user.roleKey as RoleKey].home });
});
