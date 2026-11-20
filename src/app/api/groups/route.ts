import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";

const Create = z.object({
  name: z.string().trim().min(2).max(120),
  year: z.number().int().min(1).max(10).optional(),
  teacherId: z.string().optional(),
});
const AddMembers = z.object({ groupId: z.string().min(1), emails: z.array(z.string().trim().toLowerCase().email()).min(1).max(200) });

export const POST = handle(async (req: Request) => {
  const user = await requireApiUser("group:manage");
  const body = Create.parse(await req.json());
  let teacherId = user.id;
  if (body.teacherId && body.teacherId !== user.id) {
    if (user.roleKey === "TEACHER") throw new HttpError(403, "Un enseignant ne peut créer que ses propres groupes");
    const t = await prisma.user.findFirst({ where: { id: body.teacherId, roleKey: "TEACHER", ...(user.roleKey === "UNIVERSITY_ADMIN" ? { universityId: user.universityId } : {}) } });
    if (!t) throw new HttpError(422, "Enseignant introuvable dans votre faculté");
    teacherId = t.id;
  }
  const g = await prisma.studentGroup.create({ data: { name: body.name, year: body.year ?? null, teacherId, universityId: user.universityId } });
  await audit("group.create", { userId: user.id, entity: "StudentGroup", entityId: g.id });
  return NextResponse.json({ id: g.id });
});

/** Add students (by email) to a group. Unknown emails are reported back, not created. */
export const PUT = handle(async (req: Request) => {
  const user = await requireApiUser("group:manage");
  const { groupId, emails } = AddMembers.parse(await req.json());
  const g = await prisma.studentGroup.findUnique({ where: { id: groupId } });
  if (!g) throw new HttpError(404, "Groupe introuvable");
  if (user.roleKey === "TEACHER" && g.teacherId !== user.id) throw new HttpError(403, "Ce groupe ne vous appartient pas");
  const students = await prisma.user.findMany({ where: { email: { in: emails }, roleKey: "STUDENT" } });
  for (const s of students) {
    await prisma.groupMembership.upsert({ where: { groupId_userId: { groupId, userId: s.id } }, create: { groupId, userId: s.id }, update: {} });
    await notify(s.id, `Ajouté(e) au groupe ${g.name}`, `${user.name} vous a ajouté(e) à un groupe.`, "/app");
  }
  const found = new Set(students.map((s) => s.email));
  await audit("group.add_members", { userId: user.id, entity: "StudentGroup", entityId: groupId, meta: { added: students.length } });
  return NextResponse.json({ added: students.length, notFound: emails.filter((e) => !found.has(e)) });
});
