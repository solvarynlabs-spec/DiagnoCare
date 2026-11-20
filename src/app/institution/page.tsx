import Link from "next/link";
import { Activity, BookOpenCheck, GraduationCap, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { average, categoryAverages, effectiveScore, specialtyAverages, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { Card, CardTitle, Empty, Stat } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, SkillRadar, TrendChart } from "@/components/charts";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Vue d'ensemble de la faculté", "Faculty overview") };
}

export default async function InstitutionPage() {
  const user = await requireUser({ permission: "institution:analytics" });
  const lang = await getLang();
  const t = makeT(lang);
  const uniId = user.universityId ?? "__none__";
  const [students, teachers, groups, results] = await Promise.all([
    prisma.user.count({ where: { universityId: uniId, roleKey: "STUDENT" } }),
    prisma.user.count({ where: { universityId: uniId, roleKey: "TEACHER" } }),
    prisma.studentGroup.findMany({ where: { universityId: uniId }, include: { teacher: true, members: { select: { userId: true } } } }),
    prisma.assessmentResult.findMany({ where: { session: { user: { universityId: uniId } } }, include: { session: { include: { case: true } } } }),
  ]);
  const activeStudents = new Set(results.filter((r) => r.createdAt.getTime() > Date.now() - 30 * 864e5).map((r) => r.session.userId)).size;
  const groupStats = groups.map((g) => {
    const ids = new Set(g.members.map((m) => m.userId));
    const rs = results.filter((r) => ids.has(r.session.userId));
    return { g, avg: average(rs.map(effectiveScore)), n: rs.length };
  });

  return (
    <>
      <WelcomeBanner photo="maqam" eyebrow={user.university?.name ?? t("Faculté", "Faculty")} title={t("Vue d'ensemble de la faculté", "Faculty overview")} sub={t("Utilisation de la plateforme et compétences cliniques à l'échelle de la faculté.", "Platform usage and clinical skills across the faculty.")} actions={<Link href="/institution/people" className="btn-primary">{t("Gérer les comptes", "Manage accounts")}</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("Étudiants", "Students")} value={students} hint={t(`${activeStudents} actif(s) ces 30 derniers jours`, `${activeStudents} active in the last 30 days`)} icon={<GraduationCap className="h-5 w-5" />} />
        <Stat label={t("Enseignants", "Teachers")} value={teachers} icon={<BookOpenCheck className="h-5 w-5" />} tone="teal" />
        <Stat label={t("Groupes", "Groups")} value={groups.length} icon={<Users className="h-5 w-5" />} tone="amber" />
        <Stat label={t("Simulations terminées", "Simulations completed")} value={results.length} hint={`${t("Moyenne", "Average")} ${average(results.map(effectiveScore))}/100`} icon={<Activity className="h-5 w-5" />} tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub={t("Note moyenne hebdomadaire", "Weekly average score")}>{t("Évolution de la faculté", "Faculty progress")}</CardTitle>
          {results.length ? <TrendChart data={weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })), 10, lang)} /> : <Empty title={t("Pas de données", "No data")} />}
        </Card>
        <Card>
          <CardTitle sub={t("% des points de la grille", "% of rubric points")}>{t("Profil de compétences", "Skills profile")}</CardTitle>
          {results.length ? <SkillRadar data={categoryAverages(results, lang)} /> : <Empty title={t("Pas de données", "No data")} />}
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub={t("Note moyenne par spécialité", "Average score by specialty")}>{t("Résultats par spécialité", "Results by specialty")}</CardTitle>
          {results.length ? <BarsChart data={specialtyAverages(results).map((s) => ({ label: specialtyName(s.key, lang).split(" ")[0], value: s.value }))} /> : <Empty title={t("Pas de données", "No data")} />}
        </Card>
        <Card>
          <CardTitle>{t("Groupes", "Groups")}</CardTitle>
          <ul className="divide-y divide-[rgb(var(--line))]">
            {groupStats.map(({ g, avg, n }) => (
              <li key={g.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium">{g.name}</span>
                  <span className="subtle block text-xs">{g.teacher.name} · {g.members.length} {t("étudiant(s)", "student(s)")}</span>
                </span>
                <span className="text-right">
                  <span className="font-semibold">{n ? avg : "—"}</span>
                  <span className="subtle block text-xs">{n} simulation(s)</span>
                </span>
              </li>
            ))}
            {groups.length === 0 && <li className="subtle py-4 text-sm">{t("Aucun groupe.", "No groups.")}</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
