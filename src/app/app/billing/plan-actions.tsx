"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, X } from "@/components/icons";
import { api } from "@/lib/client";
import { formatDA, type PlanDef } from "@/lib/billing/plans";
import { useLang, useT } from "@/lib/i18n/client";

/**
 * Plan picker + checkout. Card details are never typed here: in live mode the provider's
 * hosted, secured page collects them (redirect); in demo mode the payment is simulated.
 */

const METHODS = [
  { key: "cib", label: "Carte CIB", en: "CIB card", sub: "Banques algériennes (SATIM)", subEn: "Algerian banks (SATIM)", from: "#0b5ed7", to: "#073b8a" },
  { key: "edahabia", label: "Carte Edahabia", en: "Edahabia card", sub: "Algérie Poste", subEn: "Algérie Poste", from: "#d4a017", to: "#8a6508" },
  { key: "baridimob", label: "BaridiMob", en: "BaridiMob", sub: "Paiement mobile", subEn: "Mobile payment", from: "#0f9d74", to: "#0a5e46" },
] as const;

export function PlanActions({ current, institutional, plans, highlight, live, needsPhone = false }: { current: string; institutional: boolean; plans: PlanDef[]; highlight: boolean; live: boolean; needsPhone?: boolean }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const fda = (n: number) => formatDA(n, lang);
  const [interval, setInterval] = useState<"MONTH" | "YEAR">("MONTH");
  const [checkout, setCheckout] = useState<PlanDef | null>(highlight && current === "FREE" ? plans.find((p) => p.key === "STUDENT_PRO") ?? null : null);
  const [method, setMethod] = useState<(typeof METHODS)[number]["key"]>("cib");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const pro = plans.find((p) => p.key === "STUDENT_PRO");
  const saving = pro ? Math.round((1 - pro.priceYearly / (pro.priceMonthly * 12)) * 100) : 0;

  async function pay(plan: PlanDef) {
    if (plan.key === "FREE" && !confirm(t("Repasser à la formule Gratuit ? Vous gardez vos rapports mais perdez immédiatement les fonctions Pro.", "Switch back to the Free plan? You keep your reports but lose Pro features immediately."))) return;
    setBusy(true);
    setError("");
    try {
      if (plan.key !== "FREE" && needsPhone && !/^(\+213|00213|0)[5-7]\d{8}$/.test(phone.replace(/[\s.\-()]/g, ""))) {
        throw new Error(t("Entrez un numéro de mobile algérien valide (ex. 0550 12 34 56).", "Enter a valid Algerian mobile number (e.g. 0550 12 34 56)."));
      }
      const r = await api<{ redirect?: string }>("/api/billing/plan", "POST", { plan: plan.key, interval, ...(needsPhone && plan.key !== "FREE" ? { phone } : {}) });
      if (r.redirect) {
        window.location.href = r.redirect;
        return;
      }
      setCheckout(null);
      setSuccess(plan.key === "FREE" ? t("Vous êtes maintenant en formule Gratuit.", "You are now on the Free plan.") : t("Paiement validé — bienvenue dans Étudiant Pro !", "Payment confirmed — welcome to Student Pro!"));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (institutional)
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-white">
        <ShieldCheck className="h-10 w-10 text-[#6fb1ff]" weight="duotone" />
        <p className="mt-4 text-lg font-semibold">{t("Votre accès est fourni par votre faculté.", "Your access is provided by your faculty.")}</p>
        <p className="mt-1 text-sm text-white/60">{t("Toutes les fonctions sont incluses. Contactez l'administrateur de votre faculté pour toute modification.", "All features are included. Contact your faculty administrator for any change.")}</p>
      </div>
    );

  const price = (p: PlanDef) => (interval === "YEAR" ? p.priceYearly : p.priceMonthly);
  const methods = needsPhone ? METHODS.filter((m) => m.key !== "baridimob") : METHODS;
  const M = methods.find((m) => m.key === method) ?? methods[0];

  return (
    <div className="text-white">
      {/* Interval toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{t("Choisissez votre formule", "Choose your plan")}</h2>
        <div className="relative flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold" role="radiogroup" aria-label={t("Périodicité", "Billing period")}>
          {(["MONTH", "YEAR"] as const).map((i) => (
            <button key={i} role="radio" aria-checked={interval === i} onClick={() => setInterval(i)} className="relative z-10 flex items-center gap-2 rounded-full px-4 py-2">
              {interval === i && <motion.span layoutId="interval-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-[#1f7bff] to-[#0a5be0]" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              {i === "MONTH" ? t("Mensuel", "Monthly") : t("Annuel", "Yearly")}
              {i === "YEAR" && saving > 0 && <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-200">−{saving} %</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {plans.map((p, k) => {
          const isCurrent = p.key === current;
          const isPro = p.key === "STUDENT_PRO";
          return (
            <motion.div key={p.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: k * 0.1 }} className={`relative rounded-2xl p-[1.5px] ${isPro ? "bg-gradient-to-br from-[#38e1ff] via-[#2f86ff] to-[#0a4fcc]" : "bg-white/10"}`}>
              {isPro && <span className="absolute -inset-1 -z-10 rounded-3xl bg-[#2f86ff]/30 blur-xl" />}
              <div className="flex h-full flex-col rounded-2xl bg-[#081427] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold">{t(p.name, p.nameEn)}</p>
                  {isPro && <span className="rounded-full bg-[#2f86ff]/20 px-2.5 py-1 text-[11px] font-semibold text-[#9ccaff]">{t("Le plus choisi", "Most popular")}</span>}
                  {isCurrent && !isPro && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">{t("Actuelle", "Current")}</span>}
                </div>
                <p className="mt-1 text-sm text-white/55">{t(p.tagline, p.taglineEn)}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <AnimatePresence mode="popLayout">
                    <motion.span key={`${p.key}${interval}`} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="font-display text-4xl font-bold">
                      {price(p) === 0 ? "0 DA" : fda(price(p))}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm text-white/50">/ {interval === "YEAR" ? t("an", "year") : t("mois", "month")}</span>
                </div>
                {isPro && interval === "YEAR" && <p className="mt-1 text-xs text-emerald-300">{t("soit", "i.e.")} {fda(Math.round(p.priceYearly / 12))} {t("par mois", "per month")}</p>}
                <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                  {(lang === "en" ? p.featuresEn : p.features).map((f, j) => (
                    <motion.li key={f} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + j * 0.05 }} className="flex gap-2.5 text-white/80">
                      <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ${isPro ? "bg-[#2f86ff]" : "bg-white/15"}`}><Check className="h-2.5 w-2.5 text-white" weight="bold" /></span> {f}
                    </motion.li>
                  ))}
                </ul>
                <button
                  className={`mt-6 w-full ${isCurrent ? "btn-ghost border-white/15 bg-transparent text-white/60" : isPro ? "btn-primary py-3 text-[15px] font-semibold" : "btn-ghost border-white/15 bg-transparent text-white"}`}
                  disabled={isCurrent || busy}
                  onClick={() => (p.key === "FREE" ? pay(p) : setCheckout(p))}
                >
                  {isCurrent ? t("Votre formule actuelle", "Your current plan") : p.key === "FREE" ? t("Repasser en Gratuit", "Switch back to Free") : <>{t("Passer à", "Upgrade to")} {t(p.name, p.nameEn)} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</p>}

      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="mt-6 flex items-center gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-5">
            <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 12 }}>
              <CheckCircle2 className="h-10 w-10 text-emerald-300" weight="fill" />
            </motion.span>
            <p className="font-semibold">{success}</p>
            <button className="ml-auto text-white/50 hover:text-white" onClick={() => setSuccess(null)} aria-label={t("Fermer", "Close")}><X className="h-4 w-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout sheet */}
      <AnimatePresence>
        {checkout && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={t("Paiement", "Payment")}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && setCheckout(null)} />
            <motion.div initial={{ y: 40, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="relative grid w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#081427] text-white shadow-2xl md:grid-cols-[1.1fr_1fr]">
              <button className="absolute right-4 top-4 z-10 text-white/50 hover:text-white" onClick={() => setCheckout(null)} aria-label={t("Fermer", "Close")}><X className="h-5 w-5" /></button>
              {/* Left: method */}
              <div className="p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Paiement sécurisé", "Secure payment")}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{t("Moyen de paiement", "Payment method")}</h3>
                <motion.div key={method} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} transition={{ duration: 0.45 }} className="relative mt-5 aspect-[1.6] w-full max-w-[320px] overflow-hidden rounded-2xl p-5 shadow-2xl" style={{ background: `linear-gradient(135deg, ${M.from}, ${M.to})`, transformPerspective: 800 }}>
                  <span className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10" />
                  <span className="absolute -bottom-16 -left-6 h-40 w-40 rounded-full bg-black/10" />
                  <p className="relative text-sm font-semibold">{t(M.label, M.en)}</p>
                  <span className="relative mt-5 block h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" />
                  <p className="relative mt-4 font-mono text-sm tracking-[0.2em] text-white/80">•••• •••• •••• ••••</p>
                  <p className="relative mt-2 text-[11px] text-white/70">{t(M.sub, M.subEn)}</p>
                </motion.div>
                <div className="mt-5 space-y-2">
                  {methods.map((m) => (
                    <button key={m.key} onClick={() => setMethod(m.key)} className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${method === m.key ? "border-[#2f86ff] bg-[#2f86ff]/10" : "border-white/10 hover:border-white/30"}`}>
                      <span className="grid h-8 w-11 place-items-center rounded-md" style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to})` }}><CreditCard className="h-4 w-4" /></span>
                      <span className="flex-1"><span className="block font-medium">{t(m.label, m.en)}</span><span className="block text-xs text-white/50">{t(m.sub, m.subEn)}</span></span>
                      <span className={`h-4 w-4 rounded-full border-2 ${method === m.key ? "border-[#2f86ff] bg-[#2f86ff] shadow-[inset_0_0_0_3px_#081427]" : "border-white/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
              {/* Right: summary */}
              <div className="flex flex-col border-t border-white/10 bg-white/[0.03] p-7 md:border-l md:border-t-0">
                <h3 className="font-semibold">{t("Récapitulatif", "Summary")}</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-white/60">{t("Formule", "Plan")}</dt><dd>{t(checkout.name, checkout.nameEn)}</dd></div>
                  <div className="flex justify-between"><dt className="text-white/60">{t("Période", "Period")}</dt><dd>{interval === "YEAR" ? t("12 mois", "12 months") : t("1 mois", "1 month")}</dd></div>
                  {interval === "YEAR" && <div className="flex justify-between text-emerald-300"><dt>{t("Économie", "You save")}</dt><dd>−{fda(checkout.priceMonthly * 12 - checkout.priceYearly)}</dd></div>}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold"><dt>{t("Total TTC", "Total incl. tax")}</dt><dd className="font-display text-2xl">{fda(price(checkout))}</dd></div>
                </dl>
                <p className="mt-4 text-xs leading-relaxed text-white/50">
                  {live
                    ? needsPhone
                      ? t("Vous serez redirigé vers la page de paiement sécurisée SofizPay (SATIM) pour payer par carte CIB ou Edahabia. DiagnoCare ne voit ni ne stocke jamais votre numéro de carte.", "You will be redirected to SofizPay's secure payment page (SATIM) to pay by CIB or Edahabia card. DiagnoCare never sees or stores your card number.")
                      : t("Vous serez redirigé vers la page sécurisée de votre banque pour saisir vos informations de carte. DiagnoCare ne voit ni ne stocke jamais votre numéro de carte.", "You will be redirected to your bank's secure page to enter your card details. DiagnoCare never sees or stores your card number.")
                    : t("Mode démonstration : aucun prestataire de paiement n'est connecté. Le paiement est simulé, aucun montant n'est débité et aucune donnée de carte n'est demandée.", "Demo mode: no payment provider is connected. The payment is simulated, nothing is charged and no card details are requested.")}
                </p>
                {needsPhone && (
                  <label className="mt-5 block text-sm">
                    <span className="text-white/70">{t("Téléphone mobile (exigé par SofizPay)", "Mobile phone (required by SofizPay)")}</span>
                    <input type="tel" inputMode="tel" autoComplete="tel" placeholder="0550 12 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-white placeholder:text-white/30 focus:border-[#2f86ff] focus:outline-none" />
                  </label>
                )}
                {error && <p className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200">{error}</p>}
                <div className="mt-auto pt-6">
                  <button className="btn-primary w-full py-3.5 text-[15px] font-semibold" disabled={busy} onClick={() => pay(checkout)}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} {busy ? t("Traitement…", "Processing…") : `${t("Payer", "Pay")} ${fda(price(checkout))}${live ? "" : t(" (démo)", " (demo)")}`}
                  </button>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-white/45"><ShieldCheck className="h-3.5 w-3.5" /> {t("Sans engagement · résiliable à tout moment", "No commitment · cancel any time")}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
