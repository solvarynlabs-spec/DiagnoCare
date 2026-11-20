import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

const Body = z.object({
  name: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).default(""),
  caseSlugs: z.array(z.string()).min(1).max(50),
});

export const POST = handle(async (req: Request) => {
  const admin = await requireApiUser("institution:manage");
  if (!admin.universityId) throw new HttpError(409, "Votre compte n'est rattaché à aucune faculté");
  const body = Body.parse(await req.json());
  const valid = await prisma.clinicalCase.findMany({ where: { slug: { in: body.caseSlugs }, status: "PUBLISHED" }, select: { slug: true } });
  const p = await prisma.trainingProgram.create({
    data: { name: body.name, description: body.description, universityId: admin.universityId, caseSlugs: JSON.stringify(valid.map((v) => v.slug)) },
  });
  await audit("institution.program_create", { userId: admin.id, entity: "TrainingProgram", entityId: p.id });
  return NextResponse.json({ id: p.id });
});
