import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/session";
import { loadOwnSession, STAGES } from "@/lib/sim/service";

const Body = z.object({
  stage: z.enum(STAGES).exclude(["COMPLETED"]).optional(),
  notes: z.string().max(20000).optional(),
  language: z.enum(["en", "fr"]).optional(),
});

export const PATCH = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("simulation:run");
  const { id } = await ctx.params;
  const s = await loadOwnSession(user, id);
  if (s.status !== "IN_PROGRESS") return NextResponse.json({ error: "Consultation clôturée" }, { status: 409 });
  const body = Body.parse(await req.json());
  await prisma.consultationSession.update({ where: { id }, data: body });
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("simulation:run");
  const { id } = await ctx.params;
  const s = await loadOwnSession(user, id);
  if (s.status === "IN_PROGRESS") await prisma.consultationSession.update({ where: { id }, data: { status: "ABANDONED" } });
  return NextResponse.json({ ok: true });
});
