import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { visibleStudentIds } from "@/lib/access";
import { average, categoryAverages, effectiveScore } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { Badge, Card, CardTitle, Empty, PageHeader, ScoreRing, fmtDate, scoreTone } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Étudiants", "Students") };
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const user = await requireUser({ permission: "student:review" });
  const lang = await getLang();
  const t = makeT(lang);
  const { student } = await searchParams;
  const ids = await visibleStudentIds(user);
  const students = await prisma.user.findMany({
    where: { id: { in: ids } },
    include: { memberships: { include: { group: true } }, sessions: { where: { status: "COMPLETED" }, include: { result: true, case: true }, orderBy: { completedAt: "desc" } } },
    orderBy: { name: "asc" },
  });
  const selected = students.find((s) => s.id === student);

  return (
    <>
      <PageHeader eyebrow={t("Résultats des étudiants", "Student results")} title={t("Étudiants", "Students")} sub={t("Suivez la progression, repérez qui a besoin d'aide et ouvrez chaque consultation pour une relecture détaillée.", "Follow progress, spot who needs help and open each consultation for a detailed review.")} />
      {students.length === 0 ? (
        <Empty title={t("Aucun étudiant", "No students")} body={t("Créez un groupe et ajoutez-y des étudiants pour suivre leurs résultats.", "Create a group and add students to follow their results.")} action={<Link href="/teach/groups" className="btn-primary">{t("Gérer les groupes", "Manage groups")}</Link>} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="panel overflow-x-auto p-0">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">{t("Étudiant", "Student")}</th>
                  <th className="px-4 py-3">{t("Groupes", "Groups")}</th>
                  <th className="px-4 py-3">Simulations</th>
                  <th className="px-4 py-3">{t("Moyenne", "Average")}</th>
                  <th className="px-4 py-3">{t("Point le plus faible", "Weakest area")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--line))]">
                {students.map((s) => {
                  const rows = s.sessions.filter((x) => x.result).map((x) => ({ ...x.result!, session: { case: x.case } }));
                  const avg = average(rows.map(effectiveScore));
                  const weakest = [...categoryAverages(rows, lang)].sort((a, b) => a.value - b.value)[0];
                  return (
                    <tr key={s.id} className={`hover:bg-[rgb(var(--panel-2))] ${selected?.id === s.id ? "bg-brand-50/60 dark:bg-brand-500/10" : ""}`}>
                      <td className="px-4 py-3">
                        <Link href={`/teach/students?student=${s.id}`} className="font-semibold hover:text-brand-600">{s.name}</Link>
                        <p className="subtle text-xs">{s.email}</p>
                      </td>
                      <td className="muted px-4 py-3 text-xs">{s.memberships.map((m) => m.group.name).join(", ") || "—"}</td>
                      <td className="px-4 py-3">{rows.length}</td>
                      <td className="px-4 py-3">{rows.length ? <Badge tone={scoreTone(avg)}>{avg}</Badge> : "—"}</td>
                      <td className="muted px-4 py-3 text-xs">{rows.length ? `${weakest.label} (${weakest.value} %)` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Card>
            {selected ? (
              <>
                <CardTitle sub={`${selected.email} · ${selected.yearOfStudy ? t(`${selected.yearOfStudy}e année`, `Year ${selected.yearOfStudy}`) : "—"}`}>{selected.name}</CardTitle>
                <ul className="divide-y divide-[rgb(var(--line))]">
                  {selected.sessions.map((x) => (
                    <li key={x.id}>
                      <Link href={`/teach/review/${x.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-90">
                        {x.result && <ScoreRing value={effectiveScore(x.result)} size={38} />}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{localizeCaseMeta(x.case, lang).title}</p>
                          <p className="subtle text-xs">{specialtyName(x.case.specialty, lang)} · {fmtDate(x.completedAt, lang)}</p>
                        </div>
                        {x.result?.teacherComment ? <Badge tone="green">{t("relu", "reviewed")}</Badge> : <Badge tone="amber">{t("à relire", "to review")}</Badge>}
                      </Link>
                    </li>
                  ))}
                  {selected.sessions.length === 0 && <li className="subtle py-4 text-sm">{t("Aucune consultation terminée.", "No completed consultations.")}</li>}
                </ul>
              </>
            ) : (
              <Empty title={t("Sélectionnez un étudiant", "Select a student")} body={t("Cliquez sur un nom pour voir ses consultations.", "Click a name to see their consultations.")} />
            )}
          </Card>
        </div>
      )}
    </>
  );
}
