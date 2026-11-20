import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { canViewSession } from "@/lib/access";
import { audit, notify } from "@/lib/audit";

const Body = z.object({ comment: z.string().trim().min(1).max(5000), scoreOverride: z.number().int().min(0).max(100).nullable().optional() });

/** Teacher feedback on a completed consultation (id = session id). */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("student:review");
  const { id } = await ctx.params;
  const s = await prisma.consultationSession.findUnique({ where: { id }, include: { result: true, case: true } });
  if (!s || !s.result || !(await canViewSession(user, s))) throw new HttpError(404, "Consultation introuvable");
  const body = Body.parse(await req.json());
  await prisma.assessmentResult.update({ where: { id: s.result.id }, data: { teacherComment: body.comment, teacherScoreOverride: body.scoreOverride ?? null, teacherId: user.id } });
  await notify(s.userId, "Nouveau retour de votre enseignant", `${user.name} a commenté votre consultation « ${s.case.title} ».`, `/app/reports/${id}`);
  await audit("result.feedback", { userId: user.id, entity: "AssessmentResult", entityId: s.result.id, meta: { override: body.scoreOverride ?? null } });
  return NextResponse.json({ ok: true });
});
