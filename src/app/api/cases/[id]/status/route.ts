import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { prisma } from "@/lib/db";
import { HttpError, requireApiUser } from "@/lib/auth/session";
import { can } from "@/lib/rbac";
import { audit } from "@/lib/audit";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("submit_review") }),
  z.object({
    action: z.literal("publish"),
    reviewer: z.string().trim().min(5, "Indiquez le nom et la qualité de l'expert").max(200),
    notes: z.string().trim().max(2000).default(""),
    attestations: z.object({ fictional: z.literal(true), factsConsistent: z.literal(true), rubricReviewed: z.literal(true), safetyChecked: z.literal(true) }),
  }),
  z.object({ action: z.literal("return_to_draft"), notes: z.string().trim().max(2000).default("") }),
  z.object({ action: z.literal("archive") }),
]);

/** Expert-review workflow: DRAFT → IN_REVIEW → PUBLISHED (with reviewer attestation) → ARCHIVED. */
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const user = await requireApiUser("case:write");
  const { id } = await ctx.params;
  const body = Body.parse(await req.json());
  const c = await prisma.clinicalCase.findUnique({ where: { id } });
  if (!c) throw new HttpError(404, "Cas introuvable");

  let data: Record<string, unknown>;
  switch (body.action) {
    case "submit_review":
      if (c.status !== "DRAFT") throw new HttpError(409, "Seuls les brouillons peuvent être soumis à validation");
      data = { status: "IN_REVIEW" };
      break;
    case "publish":
      if (!can(user.roleKey, "case:review")) throw new HttpError(403, "Droit de validation clinique requis");
      if (c.status !== "IN_REVIEW") throw new HttpError(409, "Soumettez d'abord le cas à validation");
      data = { status: "PUBLISHED", reviewedBy: body.reviewer, reviewNotes: body.notes, reviewedAt: new Date() };
      await prisma.evaluationRubric.update({ where: { caseId: id }, data: { reviewedBy: body.reviewer } }).catch(() => null);
      break;
    case "return_to_draft":
      data = { status: "DRAFT", reviewNotes: body.notes || c.reviewNotes };
      break;
    case "archive":
      data = { status: "ARCHIVED" };
      break;
  }
  const updated = await prisma.clinicalCase.update({ where: { id }, data });
  await audit(`case.${body.action}`, { userId: user.id, entity: "ClinicalCase", entityId: id });
  return NextResponse.json({ status: updated.status });
});
