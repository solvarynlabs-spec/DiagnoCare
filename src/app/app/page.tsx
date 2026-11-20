import Link from "next/link";
import { ArrowRight, Award, CalendarClock, CheckCircle2, ClipboardList, Gauge, Lock, PlayCircle, Target, TrendingUp } from "@/components/icons";
import { prisma, parseJson } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { achievements, average, categoryAverages, effectiveScore, weeklyTrend } from "@/lib/analytics";
import { specialtyName } from "@/lib/catalog";
import { monthlyUsage } from "@/lib/sim/service";
import { Badge, Card, CardTitle, DifficultyBadge, Empty, PageHeader, ScoreRing, Stat, fmtDate, scoreTone } from "@/components/ui";
import { SkillRadar, TrendChart } from "@/components/charts";
import { WelcomeBanner } from "@/components/welcome-banner";
import type { ScoreBreakdown } from "@/lib/sim/types";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Tableau de bord", "Dashboard") };
}

export default async function StudentDashboard() {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const title = (c: { slug: string; title: string; summary: string }) => localizeCaseMeta(c, lang).title;
  const [results, inProgress, memberships, used] = await Promise.all([
    prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, include: { session: { include: { case: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.consultationSession.findMany({ where: { userId: user.id, status: "IN_PROGRESS" }, include: { case: true }, orderBy: { startedAt: "desc" }, take: 3 }),
    prisma.groupMembership.findMany({ where: { userId: user.id }, include: { group: { include: { assignments: { include: { case: true, sessions: { where: { userId: user.id, status: "COMPLETED" } } }, orderBy: { dueAt: "asc" } } } } } }),
    monthlyUsage(user.id),
  ]);

  const scores = results.map(effectiveScore);
  const cats = categoryAverages(results, lang);
  const sorted = [...cats].filter((c) => c.value > 0).sort((a, b) => b.value - a.value);
  const trend = weeklyTrend(results.map((r) => ({ createdAt: r.createdAt, score: effectiveScore(r) })), 10, lang);
  const badges = achievements(results, lang);
  const totalMinutes = results.reduce((s, r) => s + parseJson<ScoreBreakdown>(r.breakdown, { durationMinutes: 0 } as ScoreBreakdown).durationMinutes, 0);
  const assignments = memberships.flatMap((m) => m.group.assignments.map((a) => ({ ...a, groupName: m.group.name })));
  const pending = assignments.filter((a) => a.sessions.length === 0);

  // Recommendations: cases not yet completed, prioritising the weakest specialty.
  const doneCaseIds = new Set(results.map((r) => r.session.caseId));
  const specAvg = new Map<string, number[]>();
  results.forEach((r) => specAvg.set(r.session.case.specialty, [...(specAvg.get(r.session.case.specialty) ?? []), effectiveScore(r)]));
  const published = await prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, orderBy: { difficulty: "asc" } });
  const recommended = published
    .filter((c) => !doneCaseIds.has(c.id))
    .map((c) => ({ c, priority: specAvg.has(c.specialty) ? average(specAvg.get(c.specialty)!) : 60, locked: !c.freeTier && !user.plan.limits.fullLibrary }))
    .sort((a, b) => Number(a.locked) - Number(b.locked) || a.priority - b.priority)
    .slice(0, 3);
  const limit = user.plan.limits.simulationsPerMonth;

  return (
    <>
      <WelcomeBanner
        photo="studentLaptop"
        eyebrow={`${user.yearOfStudy ? t(`${user.yearOfStudy}e année`, `Year ${user.yearOfStudy}`) : "—"} · ${t(user.plan.name, user.plan.nameEn)}`}
        title={<>{t("Bienvenue", "Welcome")}, <span className="text-gradient">{user.name.split(" ")[0]}</span></>}
        sub={t("Reprenez où vous en étiez, terminez vos devoirs ou relevez le défi d'un nouveau patient.", "Pick up where you left off, finish your assignments or take on a new patient.")}
        actions={
          <Link href="/app/cases" className="btn-glow">
            <PlayCircle className="h-4 w-4" /> {t("Lancer une simulation", "Start a simulation")}
          </Link>
        }
        stat={results.length ? { label: t("Note moyenne", "Average score"), value: average(scores) } : undefined}
      />

      {limit !== null && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
          <span>
            {t("Il vous reste", "You have")} <strong>{Math.max(0, limit - used)}</strong> {t(`simulation(s) gratuite(s) sur ${limit} ce mois-ci.`, `of ${limit} free simulation(s) left this month.`)}
          </span>
          <Link href="/app/billing" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
            {t("Passer à Étudiant Pro →", "Upgrade to Student Pro →")}
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("Simulations terminées", "Simulations completed")} value={results.length} hint={t(`${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min d'entraînement`, `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min of practice`)} icon={<CheckCircle2 className="h-5 w-5" />} tone="blue" />
        <Stat label={t("Note moyenne", "Average score")} value={results.length ? `${average(scores)}` : "—"} hint={t("Selon la grille, sur 100", "Rubric-based, out of 100")} icon={<Gauge className="h-5 w-5" />} tone="teal" />
        <Stat label={t("Meilleure note", "Best score")} value={results.length ? Math.max(...scores) : "—"} hint={results[0] ? t(`Dernière : ${effectiveScore(results[0])} le ${fmtDate(results[0].createdAt)}`, `Latest: ${effectiveScore(results[0])} on ${fmtDate(results[0].createdAt, "en")}`) : t("Aucune tentative", "No attempts yet")} icon={<TrendingUp className="h-5 w-5" />} tone="green" />
        <Stat label={t("Devoirs à rendre", "Assignments due")} value={pending.length} hint={pending[0]?.dueAt ? t(`Prochaine échéance : ${fmtDate(pending[0].dueAt)}`, `Next due: ${fmtDate(pending[0].dueAt, "en")}`) : t("Rien à rendre", "Nothing due")} icon={<ClipboardList className="h-5 w-5" />} tone="amber" />
      </div>

      {inProgress.length > 0 && (
        <Card className="mt-6 border-brand-200 dark:border-brand-500/30">
          <CardTitle sub={t("Votre consultation est enregistrée automatiquement.", "Your consultation is saved automatically.")}>{t("Reprendre une consultation", "Resume a consultation")}</CardTitle>
          <div className="grid gap-3 md:grid-cols-3">
            {inProgress.map((s) => (
              <Link key={s.id} href={`/app/consult/${s.id}`} className="flex items-center justify-between rounded-xl border border-[rgb(var(--line))] p-3 hover:border-brand-400">
                <span>
                  <span className="block text-sm font-semibold">{title(s.case)}</span>
                  <span className="subtle text-xs">{t("Commencée le", "Started")} {fmtDate(s.startedAt, lang)}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-brand-600" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub={t("Note moyenne par semaine", "Average score per week")}>{t("Progression", "Progress")}</CardTitle>
          {results.length ? <TrendChart data={trend} /> : <Empty title={t("Pas encore de données", "No data yet")} body={t("Terminez une simulation pour suivre votre progression.", "Complete a simulation to track your progress.")} />}
        </Card>
        <Card>
          <CardTitle sub={t("% des points de la grille obtenus", "% of rubric points earned")}>{t("Profil de compétences", "Skills profile")}</CardTitle>
          {results.length ? (
            user.plan.limits.analytics || results.length < 3 ? (
              <SkillRadar data={cats} />
            ) : (
              <LockedPanel text={t("Les statistiques détaillées font partie d'Étudiant Pro.", "Detailed statistics are part of Student Pro.")} cta={t("Passer à Pro", "Upgrade to Pro")} />
            )
          ) : (
            <Empty title={t("Pas encore de données", "No data yet")} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>{t("Points forts et points faibles", "Strengths and weaknesses")}</CardTitle>
          {sorted.length ? (
            <div className="space-y-3">
              {sorted.map((c, i) => (
                <div key={c.key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">
                      {c.label} {i === 0 && <Badge tone="green">{t("point fort", "strength")}</Badge>} {i === sorted.length - 1 && sorted.length > 1 && <Badge tone="red">{t("à travailler", "to work on")}</Badge>}
                    </span>
                    <span className="subtle">{c.value} %</span>
                  </div>
                  <div className="h-2 rounded-full bg-[rgb(var(--panel-2))]">
                    <div className={`h-2 rounded-full ${c.value >= 75 ? "bg-success" : c.value >= 50 ? "bg-brand-600" : "bg-danger"}`} style={{ width: `${c.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title={t("Terminez un cas pour voir votre profil", "Complete a case to see your profile")} />
          )}
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/app/reports" className="text-sm font-semibold text-brand-600 hover:underline">{t("Tous les rapports", "All reports")}</Link>}>{t("Consultations récentes", "Recent consultations")}</CardTitle>
          {results.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {results.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link href={`/app/reports/${r.sessionId}`} className="flex items-center gap-4 py-3 hover:opacity-90">
                    <ScoreRing value={effectiveScore(r)} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{title(r.session.case)}</p>
                      <p className="subtle text-xs">
                        {specialtyName(r.session.case.specialty, lang)} · {fmtDate(r.createdAt, lang)} {r.teacherComment && t("· commentaire de l'enseignant", "· teacher comment")}
                      </p>
                    </div>
                    <Badge tone={scoreTone(effectiveScore(r))}>{effectiveScore(r) >= 75 ? t("Très bien", "Very good") : effectiveScore(r) >= 50 ? t("En progrès", "Improving") : t("À revoir", "Needs review")}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={t("Aucune consultation", "No consultations")} action={<Link href="/app/cases" className="btn-primary">{t("Parcourir les cas", "Browse cases")}</Link>} />
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub={t("De vos groupes", "From your groups")}>{t("Devoirs", "Assignments")}</CardTitle>
          {assignments.length ? (
            <ul className="divide-y divide-[rgb(var(--line))]">
              {assignments.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <CalendarClock className="h-5 w-5 text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="subtle text-xs">
                      {title(a.case)} · {a.groupName} · {t("à rendre le", "due")} {fmtDate(a.dueAt, lang)}
                    </p>
                  </div>
                  {a.sessions.length ? (
                    <Badge tone="green">{t("Rendu", "Submitted")}</Badge>
                  ) : (
                    <Link href={`/app/cases/${a.case.slug}?assignment=${a.id}`} className="btn-primary px-3 py-1.5 text-xs">
                      {t("Commencer", "Start")}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Empty title={t("Aucun devoir", "No assignments")} body={t("Les cas assignés par vos enseignants apparaîtront ici.", "Cases assigned by your teachers will appear here.")} />
          )}
        </Card>
        <Card>
          <CardTitle sub={t("Selon vos points faibles", "Based on your weak spots")}>{t("Recommandés pour vous", "Recommended for you")}</CardTitle>
          <div className="space-y-3">
            {recommended.map(({ c, locked }) => (
              <Link key={c.id} href={locked ? "/app/billing" : `/app/cases/${c.slug}`} className="block rounded-xl border border-[rgb(var(--line))] p-3 hover:border-brand-400">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{title(c)}</p>
                  {locked ? <Lock className="h-4 w-4 text-[rgb(var(--ink-3))]" /> : <Target className="h-4 w-4 text-teal-500" />}
                </div>
                <p className="subtle mt-1 flex items-center gap-2 text-xs">
                  {specialtyName(c.specialty, lang)} <DifficultyBadge d={c.difficulty} />
                </p>
              </Link>
            ))}
            {recommended.length === 0 && <Empty title={t("Vous avez terminé tous les cas !", "You've completed every case!")} />}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle sub={t(`${badges.filter((b) => b.earned).length} sur ${badges.length} obtenus`, `${badges.filter((b) => b.earned).length} of ${badges.length} earned`)}>Badges</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {badges.map((b) => (
            <div key={b.key} className={`rounded-xl border p-3 text-center ${b.earned ? "border-teal-300 bg-teal-50 dark:border-teal-500/40 dark:bg-teal-500/10" : "border-[rgb(var(--line))] opacity-55"}`} title={b.description}>
              <Award className={`mx-auto h-6 w-6 ${b.earned ? "text-teal-600" : "text-[rgb(var(--ink-3))]"}`} />
              <p className="mt-2 text-xs font-semibold">{b.title}</p>
              <p className="subtle mt-0.5 text-[11px] leading-tight">{b.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function LockedPanel({ text, cta }: { text: string; cta: string }) {
  return (
    <div className="grid h-[240px] place-items-center rounded-xl bg-[rgb(var(--panel-2))] text-center">
      <div>
        <Lock className="mx-auto h-6 w-6 text-brand-600" />
        <p className="mt-2 text-sm">{text}</p>
        <Link href="/app/billing" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          {cta}
        </Link>
      </div>
    </div>
  );
}
