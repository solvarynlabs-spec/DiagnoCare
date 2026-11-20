import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";

const Body = z.object({
  title: z.string().trim().min(3).max(160),
  instructions: z.string().trim().max(3000).default(""),
  caseId: z.string().min(1),
  groupId: z.string().min(1),
  dueAt: z.string().optional().transform((v) => (v ? new Date(v) : null)),
});

export const POST = handle(async (req: Request) => {
  const user = await requireApiUser("assignment:manage");
  const body = Body.parse(await req.json());
  const group = await prisma.studentGroup.findUnique({ where: { id: body.groupId }, include: { members: true } });
  if (!group) throw new HttpError(404, "Groupe introuvable");
  if (user.roleKey === "TEACHER" && group.teacherId !== user.id) throw new HttpError(403, "Vous ne pouvez assigner qu'à vos propres groupes");
  const c = await prisma.clinicalCase.findUnique({ where: { id: body.caseId } });
  if (!c || c.status !== "PUBLISHED") throw new HttpError(422, "Seuls les cas publiés (validés par un expert) peuvent être assignés");

  const a = await prisma.assignment.create({ data: { title: body.title, instructions: body.instructions, caseId: c.id, groupId: group.id, creatorId: user.id, dueAt: body.dueAt } });
  for (const m of group.members) await notify(m.userId, `Nouveau devoir : ${a.title}`, `${user.name} a assigné « ${c.title} » au groupe ${group.name}.`, "/app");
  await audit("assignment.create", { userId: user.id, entity: "Assignment", entityId: a.id });
  return NextResponse.json({ id: a.id });
});

export const DELETE = handle(async (req: Request) => {
  const user = await requireApiUser("assignment:manage");
  const id = new URL(req.url).searchParams.get("id");
  const a = id ? await prisma.assignment.findUnique({ where: { id } }) : null;
  if (!a) throw new HttpError(404, "Devoir introuvable");
  if (user.roleKey === "TEACHER" && a.creatorId !== user.id) throw new HttpError(403, "Ce devoir ne vous appartient pas");
  await prisma.consultationSession.updateMany({ where: { assignmentId: a.id }, data: { assignmentId: null } });
  await prisma.assignment.delete({ where: { id: a.id } });
  await audit("assignment.delete", { userId: user.id, entity: "Assignment", entityId: a.id });
  return NextResponse.json({ ok: true });
});
