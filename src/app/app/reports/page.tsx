import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import { effectiveScore } from "@/lib/analytics";
import { Badge, DifficultyBadge, Empty, PageHeader, ScoreRing, fmtDate } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Mes rapports", "My reports") };
}

export default async function ReportsPage() {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const results = await prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, include: { session: { include: { case: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader eyebrow={t("Rapports d'évaluation", "Evaluation reports")} title={t("Mes rapports de consultation", "My consultation reports")} sub={t("Retrouvez vos notes, feedbacks, transcriptions et commentaires d'enseignants.", "Find your scores, feedback, transcripts and teacher comments.")} />
      {results.length === 0 ? (
        <Empty title={t("Aucun rapport", "No reports")} body={t("Terminez une simulation pour recevoir votre première évaluation.", "Complete a simulation to get your first evaluation.")} action={<Link href="/app/cases" className="btn-primary">{t("Parcourir les cas", "Browse cases")}</Link>} />
      ) : (
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-[rgb(var(--line))] text-left">
              <tr className="subtle text-xs uppercase tracking-wide">
                <th className="px-5 py-3">{t("Cas", "Case")}</th>
                <th className="px-5 py-3">{t("Spécialité", "Specialty")}</th>
                <th className="px-5 py-3">{t("Niveau", "Level")}</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">{t("Note", "Score")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-[rgb(var(--panel-2))]">
                  <td className="px-5 py-3 font-medium">
                    {localizeCaseMeta(r.session.case, lang).title} {r.teacherComment && <Badge tone="amber">{t("commentaire", "comment")}</Badge>}
                  </td>
                  <td className="muted px-5 py-3">{specialtyName(r.session.case.specialty, lang)}</td>
                  <td className="px-5 py-3"><DifficultyBadge d={r.session.case.difficulty} /></td>
                  <td className="muted px-5 py-3">{fmtDate(r.createdAt, lang)}</td>
                  <td className="px-5 py-3"><ScoreRing value={effectiveScore(r)} size={38} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/app/reports/${r.sessionId}`} className="font-semibold text-brand-600 hover:underline">{t("Voir", "View")}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
