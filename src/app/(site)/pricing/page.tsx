import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "@/components/icons";
import { PLANS, formatDA } from "@/lib/billing/plans";
import { PageHero } from "@/components/site/page-hero";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Tarifs — formules Gratuit, Étudiant Pro et Faculté", "Pricing — Free, Student Pro and Faculty plans"),
    description: t("Commencez gratuitement avec 5 simulations par mois. Passez à Étudiant Pro pour toute la bibliothèque, le commentaire détaillé et les rapports PDF, ou équipez votre faculté.", "Start free with 5 simulations a month. Upgrade to Student Pro for the full library, detailed feedback and PDF reports, or equip your faculty."),
  };
}

export default async function PricingPage() {
  const lang = await getLang();
  const t = makeT(lang);
  return (
    <>
      <PageHero align="center" eyebrow={t("Tarifs", "Pricing")} photo="studentLaptop" title={<>{t("Des formules simples.", "Simple plans.")} <span className="text-gradient">{t("Un entraînement sérieux.", "Serious practice.")}</span></>} sub={t("Prix en dinars algériens (DA), TTC. Paiement par carte CIB ou Edahabia via SofizPay.", "Prices in Algerian dinars (DA), tax included. Payment by CIB or Edahabia card via SofizPay.")} />
      <div className="mx-auto -mt-12 max-w-7xl px-4 sm:px-6">
        <Stagger className="relative z-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => {
            const featured = p.key === "STUDENT_PRO";
            return (
              <StaggerItem key={p.key}>
                <TiltCard className="h-full rounded-2xl" intensity={5}>
                  <section id={p.key === "UNIVERSITY" ? "university" : p.key.toLowerCase()} className={`relative flex h-full flex-col overflow-hidden rounded-2xl p-8 ${featured ? "noise bg-navy-950 text-white shadow-[0_40px_80px_-30px_rgba(37,99,235,0.6)]" : "panel"}`}>
                    {featured && <div className="aurora absolute inset-0 opacity-90" aria-hidden />}
                    <div className="relative flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">{t(p.name, p.nameEn)}</h2>
                        {featured && <span className="chip bg-teal-500 text-white">{t("Le plus choisi", "Most popular")}</span>}
                      </div>
                      <p className={`mt-1 text-sm ${featured ? "text-white/70" : "subtle"}`}>{t(p.tagline, p.taglineEn)}</p>
                      <p className="mt-8">
                        {p.key === "UNIVERSITY" ? <span className="font-display text-5xl font-bold">{t("Sur devis", "On quote")}</span> : (
                          <>
                            <span className="font-display text-5xl font-bold">{p.priceMonthly === 0 ? "0 DA" : formatDA(p.priceMonthly, lang)}</span>
                            <span className={featured ? "text-white/60" : "subtle"}> / {t("mois", "month")}</span>
                          </>
                        )}
                      </p>
                      <p className={`mt-1 text-xs ${featured ? "text-teal-300" : "subtle"}`}>
                        {p.key === "STUDENT_PRO" ? t(`ou ${formatDA(p.priceYearly)} par an — 2 mois offerts`, `or ${formatDA(p.priceYearly, "en")} per year — 2 months free`) : p.key === "UNIVERSITY" ? t("Licence par faculté selon l'effectif des promotions", "Per-faculty licence based on class sizes") : t("Gratuit, pour toujours", "Free, forever")}
                      </p>
                      <ul className="mt-8 flex-1 space-y-3 text-sm">
                        {(lang === "en" ? p.featuresEn : p.features).map((f) => (
                          <li key={f} className="flex gap-2.5">
                            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${featured ? "bg-teal-400/20 text-teal-300" : "bg-teal-50 text-teal-600 dark:bg-teal-500/15"}`}><Check className="h-3 w-3" /></span>
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-10">
                        {p.key === "FREE" && <Link href="/register" className="btn-ghost w-full py-3">{t("Commencer gratuitement", "Start for free")}</Link>}
                        {p.key === "STUDENT_PRO" && <Link href="/register?plan=pro" className="btn-glow w-full justify-center">{t("Choisir Étudiant Pro", "Choose Student Pro")}</Link>}
                        {p.key === "UNIVERSITY" && <Link href="/contact?type=demo" className="btn-primary w-full py-3">{t("Nous contacter", "Contact us")}</Link>}
                      </div>
                    </div>
                  </section>
                </TiltCard>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal className="mt-20">
          <h2 className="text-center text-3xl font-bold">{t("Comparer les formules", "Compare plans")}</h2>
          <div className="panel mt-8 overflow-x-auto rounded-2xl p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--line))] text-left">
                  <th className="px-6 py-4 font-semibold">{t("Fonctionnalité", "Feature")}</th>
                  {PLANS.map((p) => <th key={p.key} className={`px-6 py-4 font-semibold ${p.key === "STUDENT_PRO" ? "text-brand-600" : ""}`}>{t(p.name, p.nameEn)}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--line))]">
                {(
                  [
                    [t("Simulations par mois", "Simulations per month"), (p) => p.limits.simulationsPerMonth ?? t("Illimitées", "Unlimited")],
                    [t("Bibliothèque complète", "Full library"), (p) => p.limits.fullLibrary],
                    [t("Commentaire détaillé après chaque cas", "Detailed feedback after every case"), (p) => p.limits.aiFeedback],
                    [t("Statistiques détaillées", "Detailed statistics"), (p) => p.limits.analytics],
                    [t("Rapports PDF", "PDF reports"), (p) => p.limits.pdfReports],
                    [t("Consultation vocale", "Voice consultation"), (p) => p.limits.voice],
                    [t("Tableau de bord et rédaction de cas", "Dashboard and case authoring"), (p) => p.limits.institution],
                  ] as [string, (p: (typeof PLANS)[number]) => string | number | boolean][]
                ).map(([label, fn]) => (
                  <tr key={label} className="transition hover:bg-[rgb(var(--panel-2))]">
                    <td className="muted px-6 py-4">{label}</td>
                    {PLANS.map((p) => {
                      const v = fn(p);
                      return (
                        <td key={p.key} className="px-6 py-4">
                          {typeof v === "boolean" ? (v ? <Check className="h-5 w-5 text-teal-500" aria-label={t("Inclus", "Included")} /> : <Minus className="h-5 w-5 text-[rgb(var(--ink-3))]" aria-label={t("Non inclus", "Not included")} />) : <span className="font-semibold">{v}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </>
  );
}
