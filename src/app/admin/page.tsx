import { Activity, CreditCard, FolderHeart, Users } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { aiMode } from "@/lib/sim/engines";
import { groqModel } from "@/lib/sim/engines/groq";
import { anthropicModel } from "@/lib/sim/engines/anthropic";
import { paymentProvider } from "@/lib/billing/providers";
import { formatDA } from "@/lib/billing/plans";
import { weeklyTrend } from "@/lib/analytics";
import { Badge, Card, CardTitle, Stat } from "@/components/ui";
import { WelcomeBanner } from "@/components/welcome-banner";
import { BarsChart, TrendChart } from "@/components/charts";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Vue d'ensemble de la plateforme", "Platform overview") };
}

export default async function AdminOverview() {
  await requireUser({ permission: "platform:analytics" });
  const lang = await getLang();
  const t = makeT(lang);
  const [users, byRole, subs, cases, sessions, completed, payments, contacts] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["roleKey"], _count: true }),
    prisma.subscription.groupBy({ by: ["plan"], _count: true, where: { status: "ACTIVE" } }),
    prisma.clinicalCase.groupBy({ by: ["status"], _count: true }),
    prisma.consultationSession.count(),
    prisma.assessmentResult.findMany({ select: { createdAt: true, totalScore: true } }),
    prisma.payment.aggregate({ where: { status: { in: ["SUCCEEDED", "DEMO"] } }, _sum: { amountCents: true } }),
    prisma.contactRequest.count({ where: { handled: false } }),
  ]);
  const mode = aiMode();
  const provider = paymentProvider();
  return (
    <>
      <WelcomeBanner photo="medicalTeam" eyebrow={t("Administration", "Administration")} title={t("Vue d'ensemble de la plateforme", "Platform overview")} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t("Utilisateurs", "Users")} value={users} hint={byRole.map((r) => `${r._count} ${(lang === "en" ? { STUDENT: "students", TEACHER: "teachers", UNIVERSITY_ADMIN: "faculty admin", PLATFORM_ADMIN: "admin" } : { STUDENT: "étudiants", TEACHER: "enseignants", UNIVERSITY_ADMIN: "admin faculté", PLATFORM_ADMIN: "admin" } as Record<string, string>)[r.roleKey as "STUDENT"] ?? r.roleKey}`).join(" · ")} icon={<Users className="h-5 w-5" />} />
        <Stat label="Consultations" value={sessions} hint={t(`${completed.length} évaluée(s)`, `${completed.length} scored`)} icon={<Activity className="h-5 w-5" />} tone="teal" />
        <Stat label={t("Cas cliniques", "Clinical cases")} value={cases.reduce((s, c) => s + c._count, 0)} hint={cases.map((c) => `${c._count} ${(lang === "en" ? { DRAFT: "draft(s)", IN_REVIEW: "in review", PUBLISHED: "published", ARCHIVED: "archived" } : { DRAFT: "brouillon(s)", IN_REVIEW: "en validation", PUBLISHED: "publié(s)", ARCHIVED: "archivé(s)" } as Record<string, string>)[c.status as "DRAFT"] ?? c.status}`).join(" · ")} icon={<FolderHeart className="h-5 w-5" />} tone="amber" />
        <Stat label={t("Chiffre d'affaires enregistré", "Recorded revenue")} value={formatDA((payments._sum.amountCents ?? 0) / 100, lang)} hint={provider.live ? t("Prestataire réel", "Live provider") : t("Paiements de démonstration", "Demo payments")} icon={<CreditCard className="h-5 w-5" />} tone="green" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle sub={t("Moyenne hebdomadaire, toute la plateforme", "Weekly average, whole platform")}>{t("Évolution des notes", "Score trend")}</CardTitle>
          <TrendChart data={weeklyTrend(completed.map((r) => ({ createdAt: r.createdAt, score: r.totalScore })), 10, lang)} />
        </Card>
        <Card>
          <CardTitle>{t("État du système", "System status")}</CardTitle>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="muted">{t("Moteur patient", "Patient engine")}</dt>
              <dd>{mode === "anthropic" ? <Badge tone="green">{t("IA en direct", "Live AI")} · {anthropicModel()}</Badge> : mode === "groq" ? <Badge tone="green">{t("IA en direct", "Live AI")} · Groq {groqModel()}</Badge> : <Badge tone="amber">{t("Démo (hors ligne)", "Demo (offline)")}</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">{t("Paiements", "Payments")}</dt>
              <dd><Badge tone={provider.live ? "green" : "amber"}>{provider.label}</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">{t("Voix", "Voice")}</dt>
              <dd><Badge tone="blue">{t("Web Speech du navigateur", "Browser Web Speech")}</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">{t("Avatar 3D", "3D avatar")}</dt>
              <dd><Badge tone="grey">{t("Rendu 2D · interface prête pour la 3D", "2D render · 3D-ready interface")}</Badge></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="muted">{t("Demandes de contact en attente", "Pending contact requests")}</dt>
              <dd className="font-semibold">{contacts}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle sub={t("Abonnements actifs par formule", "Active subscriptions by plan")}>{t("Abonnements", "Subscriptions")}</CardTitle>
        <BarsChart data={subs.map((s) => ({ label: (lang === "en" ? { FREE: "Free", STUDENT_PRO: "Student Pro", UNIVERSITY: "Faculty" } : { FREE: "Gratuit", STUDENT_PRO: "Étudiant Pro", UNIVERSITY: "Faculté" } as Record<string, string>)[s.plan as "FREE"] ?? s.plan, value: s._count }))} height={200} />
      </Card>
    </>
  );
}
