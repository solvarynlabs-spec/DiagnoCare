import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, CardTitle, PageHeader, fmtDate } from "@/components/ui";
import { formatDA } from "@/lib/billing/plans";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Abonnements", "Subscriptions") };
}

export default async function AdminSubscriptions() {
  await requireUser({ permission: "platform:subscriptions" });
  const lang = await getLang();
  const t = makeT(lang);
  const [subs, payments] = await Promise.all([
    prisma.subscription.findMany({ include: { user: true }, orderBy: { updatedAt: "desc" } }),
    prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return (
    <>
      <PageHeader eyebrow={t("Facturation", "Billing")} title={t("Abonnements et paiements", "Subscriptions and payments")} sub={t("Paiements par carte CIB / Edahabia via SofizPay (src/lib/billing/sofizpay.ts).", "CIB / Edahabia card payments via SofizPay (src/lib/billing/sofizpay.ts).")} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-x-auto">
          <CardTitle>{t("Abonnements", "Subscriptions")} ({subs.length})</CardTitle>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="subtle text-left text-xs uppercase tracking-wide"><tr><th className="py-2">{t("Utilisateur", "User")}</th><th>{t("Formule", "Plan")}</th><th>{t("Statut", "Status")}</th><th>{t("Prestataire", "Provider")}</th><th>{t("Renouvellement", "Renewal")}</th></tr></thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {subs.map((s) => (
                <tr key={s.id}>
                  <td className="py-2">{s.user.name}</td>
                  <td><Badge tone={s.plan === "FREE" ? "grey" : s.plan === "STUDENT_PRO" ? "blue" : "teal"}>{(lang === "en" ? { FREE: "Free", STUDENT_PRO: "Student Pro", UNIVERSITY: "Faculty" } : { FREE: "Gratuit", STUDENT_PRO: "Étudiant Pro", UNIVERSITY: "Faculté" } as Record<string, string>)[s.plan as "FREE"] ?? s.plan}</Badge></td>
                  <td className="muted text-xs">{s.status.toLowerCase()}</td>
                  <td className="muted text-xs">{s.provider}</td>
                  <td className="muted text-xs">{fmtDate(s.currentPeriodEnd, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="overflow-x-auto">
          <CardTitle>{t("Paiements récents", "Recent payments")}</CardTitle>
          <table className="w-full min-w-[520px] text-sm">
            <thead className="subtle text-left text-xs uppercase tracking-wide"><tr><th className="py-2">Date</th><th>{t("Utilisateur", "User")}</th><th>{t("Montant", "Amount")}</th><th>{t("Statut", "Status")}</th></tr></thead>
            <tbody className="divide-y divide-[rgb(var(--line))]">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="muted py-2 text-xs">{fmtDate(p.createdAt, lang)}</td>
                  <td>{p.user.name}</td>
                  <td className="font-mono">{formatDA(p.amountCents / 100, lang)}</td>
                  <td><Badge tone={p.status === "SUCCEEDED" ? "green" : "amber"}>{p.status === "DEMO" ? t("démo", "demo") : p.status === "SUCCEEDED" ? t("payé", "paid") : p.status === "PENDING" ? t("en attente", "pending") : p.status === "FAILED" ? t("échoué", "failed") : p.status.toLowerCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
