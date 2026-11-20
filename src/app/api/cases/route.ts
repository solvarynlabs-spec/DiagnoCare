import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { CaseUpsertSchema } from "@/lib/cases/schema";
import { upsertCase } from "@/lib/cases/repo";
import { audit } from "@/lib/audit";
import type { CaseContent, Difficulty } from "@/lib/sim/types";

const Body = CaseUpsertSchema.extend({ id: z.string().optional() });

/** Create or update a case. Any content change on a published case sends it back to DRAFT for re-review. */
export const POST = handle(async (req: Request) => {
  const user = await requireApiUser("case:write");
  const { id, meta, content } = Body.parse(await req.json());

  if (id) {
    const existing = await prisma.clinicalCase.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Cas introuvable");
    if (existing.authorId !== user.id && user.roleKey === "TEACHER") throw new HttpError(403, "Seul l'auteur ou un administrateur peut modifier ce cas");
    const clash = await prisma.clinicalCase.findFirst({ where: { slug: meta.slug, NOT: { id } } });
    if (clash) throw new HttpError(409, "Un autre cas utilise déjà cet identifiant");
  } else if (await prisma.clinicalCase.findUnique({ where: { slug: meta.slug } })) {
    throw new HttpError(409, "Un autre cas utilise déjà cet identifiant");
  }

  const row = await prisma.$transaction(async (tx) => {
    const r = await upsertCase(tx, { ...meta, difficulty: meta.difficulty as Difficulty }, content as CaseContent, { id, authorId: user.id });
    if (id && r.status !== "DRAFT") {
      return tx.clinicalCase.update({ where: { id: r.id }, data: { status: "DRAFT", reviewedBy: null, reviewedAt: null } });
    }
    return r;
  });
  await audit(id ? "case.update" : "case.create", { userId: user.id, entity: "ClinicalCase", entityId: row.id, meta: { version: row.version } });
  return NextResponse.json({ id: row.id, status: row.status, version: row.version });
});
