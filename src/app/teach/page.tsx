import Link from "next/link";
import { ClipboardList, FolderHeart, Gauge, Plus, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { visibleStudentIds } from "@/lib/access";
import { average, categoryAverages, effectiveScore, specialtyAverages, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { Badge, Card, CardTitle, Empty, ScoreRing, Stat, StatusBadge, fmtDate } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, SkillRadar, TrendChart } from "@/components/charts";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Tableau de bord enseignant", "Teacher dashboard") };
}

export default async function TeacherDashboard() {
  const user = await requireUser({ permission: "student:review" });
  const lang = await getLang();
  const t = makeT(lang);
  const title = (c: { slug: string; title: string; summary: string }) => localizeCaseMeta(c, lang).title;
  const studentIds = await visibleStudentIds(user);
  const [results, groups, assignments, reviewQueue] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { session: { userId: { in: studentIds } } }, include: { session: { include: { case: true, user: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.studentGroup.findMany({ where: user.roleKey === "TEACHER" ? { teacherId: user.id } : { universityId: user.universityId ?? undefined }, include: { _count: { select: { members: true } } } }),
    prisma.assignment.findMany({ where: user.roleKey === "TEACHER" ? { creatorId: user.id } : {}, include: { case: true, group: { include: { _count: { select: { members: true } } } }, sessions: { where: { status: "COMPLETED" }, select: { userId: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.clinicalCase.findMany({ where: { status: { in: ["DRAFT", "IN_REVIEW"] }, ...(user.roleKey === "TEACHER" ? { authorId: user.id } : {}) }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);
  const recent30 = results.filter((r) => r.createdAt.getTime() > Date.now() - 30 * 864e5);
  const awaitingFeedback = results.filter((r) => !r.teacherComment).slice(0, 6);

  return (
    <>
      <WelcomeBanner photo="lectureCrowd"
        eyebrow={t("Enseignement", "Teaching")}
        title={`${t("Bienvenue", "Welcome")}, ${user.name}`}
        sub={t("Suivez les résultats de vos promotions, relisez les consultations et gérez vos cas cliniques.", "Follow your classes' results, review consultations and manage your clinical cases.")}
        actions={
          <>
            <Link href="/teach/assignments" className="btn-ghost">
              <ClipboardList className="h-4 w-4" /> {t("Nouveau devoir", "New assignment")}
            </Link>
            <Link href="/teach/cases/new" className="btn-primary">
              <Plus className="h-4 w-4" /> {t("Nouveau cas", "New case")}
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("Étudiants", "Students")} value={studentIds.length} hint={t(`${groups.length} groupe(s)`, `${groups.length} group(s)`)} icon={<Users className="h-5 w-5" />} />
        <Stat label={t("Simulations (30 jours)", "Simulations (30 days)")} value={recent30.length} hint={t(`${results.length} au total`, `${results.length} in total`)} icon={<ClipboardList className="h-5 w-5" />} tone="teal" />
        <Stat label={t("Moyenne de la promo", "Class average")} value={results.length ? average(results.map(effectiveScore)) : "—"} hint={t("Sur 100", "Out of 100")} icon={<Gauge className="h-5 w-5" />} tone="green" />
        <Stat label={t("Cas en préparation", "Cases in progress")} value={reviewQueue.length} hint={t("Brouillons ou en validation", "Drafts or in review")} icon={<FolderHeart className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub={t("Note moyenne hebdomadaire de vos étudiants", "Your students' weekly average score")}>{t("Évolution de la promotion", "Class progress")}</CardTitle>
          {results.length ? <TrendChart data={weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })), 10, lang)} /> : <Empty title={t("Aucune simulation", "No simulations")} />}
        </Card>
        <Card>
          <CardTitle sub={t("% des points de la grille, toute la promo", "% of rubric points, whole class")}>{t("Profil de compétences", "Skills profile")}</CardTitle>
          {results.length ? <SkillRadar data={categoryAverages(results, lang)} /> : <Empty title={t("Pas de données", "No data")} />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub={t("Note moyenne par spécialité", "Average score by specialty")}>{t("Statistiques de la promo", "Class statistics")}</CardTitle>
          {results.length ? <BarsChart data={specialtyAverages(results).map((s) => ({ label: specialtyName(s.key, lang).split(" ")[0], value: s.value }))} /> : <Empty title={t("Pas de données", "No data")} />}
        </Card>
        <Card>
          <CardTitle action={<Link href="/teach/students" className="text-sm font-semibold text-brand-600 hover:underline">{t("Tous les étudiants", "All students")}</Link>} sub={t("Consultations terminées sans commentaire", "Completed consultations without a comment")}>
            {t("À relire", "To review")}
          </CardTitle>
          {awaitingFeedback.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {awaitingFeedback.map((r) => (
                <li key={r.id}>
                  <Link href={`/teach/review/${r.sessionId}`} className="flex items-center gap-3 py-2.5 hover:opacity-90">
                    <ScoreRing value={effectiveScore(r)} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.session.user.name}</p>
                      <p className="subtle truncate text-xs">{title(r.session.case)} · {fmtDate(r.createdAt, lang)}</p>
                    </div>
                    <span className="text-xs font-semibold text-brand-600">{t("Relire →", "Review →")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={t("Tout est à jour", "All caught up")} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle action={<Link href="/teach/assignments" className="text-sm font-semibold text-brand-600 hover:underline">{t("Gérer", "Manage")}</Link>}>{t("Devoirs", "Assignments")}</CardTitle>
          {assignments.length ? (
            <ul className="space-y-3">
              {assignments.map((a) => {
                const done = new Set(a.sessions.map((s) => s.userId)).size;
                const total = a.group._count.members || 1;
                return (
                  <li key={a.id}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{a.title}</span>
                      <span className="subtle">{done}/{a.group._count.members} · {t("échéance", "due")} {fmtDate(a.dueAt, lang)}</span>
                    </div>
                    <p className="subtle text-xs">{title(a.case)} · {a.group.name}</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-[rgb(var(--panel-2))]">
                      <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${(done / total) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title={t("Aucun devoir", "No assignments")} action={<Link href="/teach/assignments" className="btn-primary">{t("En créer un", "Create one")}</Link>} />
          )}
        </Card>
        <Card>
          <CardTitle action={<Link href="/teach/cases" className="text-sm font-semibold text-brand-600 hover:underline">{t("Tous les cas", "All cases")}</Link>}>{t("Cas en préparation", "Cases in progress")}</CardTitle>
          {reviewQueue.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {reviewQueue.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/teach/cases/${c.id}`} className="text-sm font-medium hover:text-brand-600">{title(c)}</Link>
                  <StatusBadge s={c.status} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={t("Aucun brouillon en cours", "No drafts in progress")} body={t("Créez un cas pour enrichir votre bibliothèque.", "Create a case to grow your library.")} />
          )}
          <p className="subtle mt-4 text-xs">
            <Badge tone="amber">{t("Validation", "Review")}</Badge> {t("Un cas doit être relu et attesté par un expert clinique avant de pouvoir être assigné.", "A case must be reviewed and signed off by a clinical expert before it can be assigned.")}
          </p>
        </Card>
      </div>
    </>
  );
}
