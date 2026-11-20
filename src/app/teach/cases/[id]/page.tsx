import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { can } from "@/lib/rbac";
import { caseContent } from "@/lib/cases/repo";
import { CaseEditor } from "@/components/cases/case-editor";
import { PageHeader, StatusBadge, fmtDate } from "@/components/ui";
import { ReviewWorkflow } from "./review-workflow";
import type { Difficulty } from "@/lib/sim/types";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser({ permission: "case:write" });
  const lang = await getLang();
  const t = makeT(lang);
  const { id } = await params;
  const c = await prisma.clinicalCase.findUnique({ where: { id }, include: { author: true, _count: { select: { sessions: true } } } });
  if (!c) notFound();
  const editable = user.roleKey !== "TEACHER" || c.authorId === user.id;
  const logs = await prisma.auditLog.findMany({ where: { entity: "ClinicalCase", entityId: id }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 8 });

  return (
    <>
      <Link href="/teach/cases" className="subtle mb-4 inline-flex items-center gap-1 text-sm hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> {t("Tous les cas", "All cases")}
      </Link>
      <PageHeader
        eyebrow={<span className="flex items-center gap-2">{t("Cas", "Case")} v{c.version} <StatusBadge s={c.status} /></span>}
        title={c.title}
        sub={t(`Auteur : ${c.author?.name ?? "—"} · ${c._count.sessions} consultation(s) · modifié le ${fmtDate(c.updatedAt)}`, `Author: ${c.author?.name ?? "—"} · ${c._count.sessions} consultation(s) · updated ${fmtDate(c.updatedAt, "en")}`)}
        actions={
          <Link href={`/app/cases/${c.slug}`} className="btn-ghost">
            <Eye className="h-4 w-4" /> {t("Aperçu étudiant", "Student preview")}
          </Link>
        }
      />
      <div className="grid gap-6 2xl:grid-cols-[1fr_340px]">
        <CaseEditor
          id={c.id}
          readOnly={!editable}
          initial={{
            meta: { slug: c.slug, title: c.title, specialty: c.specialty, difficulty: c.difficulty as Difficulty, summary: c.summary, objectives: parseJson<string[]>(c.learningObjectives, []), minutes: c.estimatedMinutes, freeTier: c.freeTier },
            content: caseContent(c),
          }}
        />
        <div className="space-y-4">
          <ReviewWorkflow id={c.id} status={c.status} canReview={can(user.roleKey, "case:review")} canEdit={editable} reviewedBy={c.reviewedBy} reviewedAt={c.reviewedAt?.toISOString() ?? null} reviewNotes={c.reviewNotes} />
          <div className="panel p-4">
            <p className="mb-2 text-sm font-semibold">{t("Historique", "History")}</p>
            <ul className="space-y-2 text-xs">
              {logs.map((l) => (
                <li key={l.id}>
                  <span className="font-mono text-brand-600">{l.action}</span> · {l.user?.name ?? t("système", "system")} <span className="subtle">· {l.createdAt.toLocaleString(lang === "en" ? "en-GB" : "fr-DZ")}</span>
                </li>
              ))}
              {logs.length === 0 && <li className="subtle">{t("Aucune modification enregistrée.", "No changes recorded.")}</li>}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
