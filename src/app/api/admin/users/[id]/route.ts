import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const Body = z.object({
  roleKey: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
  plan: z.enum(["FREE", "STUDENT_PRO", "UNIVERSITY"]).optional(),
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const admin = await requireApiUser("platform:users");
  const { id } = await ctx.params;
  const body = Body.parse(await req.json());
  if (id === admin.id && (body.active === false || (body.roleKey && body.roleKey !== admin.roleKey))) throw new HttpError(409, "Vous ne pouvez pas désactiver ou rétrograder votre propre compte");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new HttpError(404, "Utilisateur introuvable");

  if (body.roleKey !== undefined || body.active !== undefined) {
    await prisma.user.update({ where: { id }, data: { ...(body.roleKey ? { roleKey: body.roleKey } : {}), ...(body.active !== undefined ? { active: body.active } : {}) } });
  }
  if (body.plan) {
    await prisma.subscription.upsert({ where: { userId: id }, create: { userId: id, plan: body.plan, status: "ACTIVE", provider: "admin" }, update: { plan: body.plan, status: "ACTIVE", provider: "admin" } });
  }
  await audit("admin.user_update", { userId: admin.id, entity: "User", entityId: id, meta: body });
  return NextResponse.json({ ok: true });
});
