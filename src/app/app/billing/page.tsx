import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PLANS, formatDA } from "@/lib/billing/plans";
import { paymentProvider } from "@/lib/billing/providers";
import { monthlyUsage } from "@/lib/sim/service";
import { fmtDate } from "@/components/ui";
import { FileText, ShieldCheck } from "@/components/icons";
import { PlanActions } from "./plan-actions";
import { UsageRing } from "./usage-ring";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Formule et paiement", "Plan & billing") };
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string; payment?: string }> }) {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const FAQ = [
    [t("Puis-je résilier à tout moment ?", "Can I cancel at any time?"), t("Oui. Vous repassez en formule Gratuit quand vous voulez et gardez tous vos rapports.", "Yes. Switch back to the Free plan whenever you like and keep all your reports.")],
    [t("Quels moyens de paiement ?", "Which payment methods?"), t("Carte CIB et carte Edahabia, via la page de paiement sécurisée SofizPay (SATIM). Le paiement est en dinars.", "CIB and Edahabia cards, through SofizPay's secure payment page (SATIM). Payment is in dinars.")],
    [t("Ma faculté a une licence ?", "Does my faculty have a licence?"), t("Rattachez votre compte à votre faculté : toutes les fonctions sont alors incluses.", "Link your account to your faculty: every feature is then included.")],
  ];
  const { upgrade, payment } = await searchParams;
  const [payments, used] = await Promise.all([prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }), monthlyUsage(user.id)]);
  const provider = paymentProvider();
  const sub = user.subscription;
  const institutional = sub?.plan === "UNIVERSITY";
  const limit = user.plan.limits.simulationsPerMonth;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-10 text-white sm:-mx-6 sm:-my-8 sm:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="pointer-events-none absolute -top-20 right-0 h-[360px] w-[520px] rounded-full bg-[#2f86ff]/15 blur-[120px]" />

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Abonnement", "Subscription")}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{t("Formule et paiement", "Plan & billing")}</h1>
        <p className="mt-3 max-w-2xl text-white/60">{t("Gérez votre formule, payez en dinars avec votre carte algérienne et retrouvez vos reçus.", "Manage your plan, pay in dinars with your Algerian card and find your receipts.")}</p>
        {payment === "succeeded" && <p className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-4 font-medium text-emerald-100">{t("Paiement confirmé par SofizPay — votre formule est active. Merci !", "Payment confirmed by SofizPay — your plan is active. Thank you!")}</p>}
        {payment === "failed" && <p className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-4 font-medium text-red-100">{t("Le paiement a été refusé ou annulé. Aucun abonnement n'a été activé ; vous pouvez réessayer.", "The payment was declined or cancelled. No subscription was activated; you can try again.")}</p>}
        {payment === "pending" && <p className="mt-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-5 py-4 font-medium text-amber-100">{t("Paiement en cours de confirmation. Votre formule sera activée dès que SofizPay nous l'aura confirmé.", "Payment awaiting confirmation. Your plan will be activated as soon as SofizPay confirms it.")}</p>}


        {/* Current plan */}
        <section className="relative mt-8 grid gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f2350] via-[#0a1830] to-[#081427] p-7 sm:grid-cols-[1fr_auto] sm:items-center sm:p-9">
          <span className="pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full bg-[#38e1ff]/10 blur-3xl" />
          <div className="relative">
            <p className="text-sm text-white/55">{t("Votre formule actuelle", "Your current plan")}</p>
            <p className="mt-1 font-display text-4xl font-bold">{t(user.plan.name, user.plan.nameEn)}</p>
            <p className="mt-1 text-white/60">{t(user.plan.tagline, user.plan.taglineEn)}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><dt className="text-white/45">{t("Statut", "Status")}</dt><dd className="mt-0.5 flex items-center gap-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-emerald-400" /> {sub?.status === "ACTIVE" || !sub ? t("Active", "Active") : sub.status.toLowerCase()}</dd></div>
              <div><dt className="text-white/45">{t("Facturation", "Billing")}</dt><dd className="mt-0.5 font-medium">{institutional ? t("Par la faculté", "By the faculty") : sub?.plan === "STUDENT_PRO" ? (sub.interval === "YEAR" ? t("Annuelle", "Yearly") : t("Mensuelle", "Monthly")) : t("Gratuite", "Free")}</dd></div>
              <div><dt className="text-white/45">{t("Renouvellement", "Renewal")}</dt><dd className="mt-0.5 font-medium">{sub?.currentPeriodEnd && sub.plan === "STUDENT_PRO" ? fmtDate(sub.currentPeriodEnd, lang) : "—"}</dd></div>
            </dl>
          </div>
          <UsageRing used={used} limit={limit} />
        </section>

        {/* Plans + checkout */}
        <section className="mt-12">
          <PlanActions current={sub?.plan ?? "FREE"} institutional={institutional} plans={PLANS.filter((p) => p.key !== "UNIVERSITY")} highlight={!!upgrade} live={provider.live} needsPhone={!!provider.needsPhone} />
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Receipts */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="font-semibold">{t("Historique des paiements", "Payment history")}</h2>
            {payments.length === 0 ? (
              <div className="mt-6 grid place-items-center py-8 text-center text-white/50">
                <FileText className="h-10 w-10 text-white/25" />
                <p className="mt-2 text-sm">{t("Aucun paiement pour l'instant.", "No payments yet.")}</p>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 py-3.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#2f86ff]/15 text-[#6fb1ff]"><FileText className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.description}</p>
                      <p className="text-xs text-white/45">{fmtDate(p.createdAt, lang)}</p>
                    </div>
                    <span className="font-mono text-sm">{formatDA(p.amountCents / 100, lang)}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${p.status === "SUCCEEDED" ? "bg-emerald-500/15 text-emerald-200" : p.status === "DEMO" || p.status === "PENDING" ? "bg-amber-500/15 text-amber-200" : "bg-red-500/15 text-red-200"}`}>
                      {p.status === "DEMO" ? t("Démo", "Demo") : p.status === "SUCCEEDED" ? t("Payé", "Paid") : p.status === "PENDING" ? t("En attente", "Pending") : p.status === "FAILED" ? t("Échoué", "Failed") : p.status.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* FAQ */}
          <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-[#6fb1ff]" /> {t("Questions fréquentes", "FAQ")}</h2>
            <div className="mt-4 divide-y divide-white/10">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                    {q}
                    <span className="text-lg leading-none text-white/40 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-white/60">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
