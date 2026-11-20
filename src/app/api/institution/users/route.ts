import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, hashPassword, requireApiUser } from "@/lib/auth/session";
import { audit, notify } from "@/lib/audit";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  roleKey: z.enum(["STUDENT", "TEACHER"]),
  yearOfStudy: z.number().int().min(1).max(10).optional(),
});

/** Institution admins provision teacher/student accounts. A one-time temporary password is returned once. */
export const POST = handle(async (req: Request) => {
  const admin = await requireApiUser("institution:manage");
  if (!admin.universityId && admin.roleKey !== "PLATFORM_ADMIN") throw new HttpError(409, "Votre compte n'est rattaché à aucune faculté");
  const body = Body.parse(await req.json());
  if (await prisma.user.findUnique({ where: { email: body.email } })) throw new HttpError(409, "Un utilisateur avec cet e-mail existe déjà");
  const temp = randomBytes(9).toString("base64url");
  const u = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      roleKey: body.roleKey,
      yearOfStudy: body.yearOfStudy ?? null,
      universityId: admin.universityId,
      passwordHash: await hashPassword(temp),
      subscription: { create: { plan: "UNIVERSITY", status: "ACTIVE", provider: "institution" } },
    },
  });
  await notify(u.id, "Bienvenue sur DiagnoCare", `Votre compte a été créé par ${admin.name}. Changez votre mot de passe temporaire.`, "/app/settings");
  await audit("institution.user_create", { userId: admin.id, entity: "User", entityId: u.id, meta: { role: body.roleKey } });
  return NextResponse.json({ id: u.id, temporaryPassword: temp });
});
