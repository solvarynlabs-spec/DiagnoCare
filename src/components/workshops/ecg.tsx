"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, Lightbulb, RotateCcw, X } from "@/components/icons";
import { EcgPaper } from "@/components/ecg/ecg-paper";
import { DIAGNOSES, ECG_EXERCISES, PR_OPTS, QRS_OPTS, REPOL_OPTS, RHYTHMS, type EcgExercise } from "@/lib/ecg/exercises";
import { EXERCISE_EN, OPTION_EN } from "@/lib/ecg/exercises-en";
import { useLang, useT } from "@/lib/i18n/client";
import type { T } from "@/lib/i18n/shared";

type Ans = { rhythm?: string; rate?: string; pr?: string; qrs?: string; repol?: string; dx?: string };
const STORE = "clinika-ecg-scores";

function grade(ex: EcgExercise, a: Ans, t: T, opt: (s?: string) => string | undefined) {
  const rate = Number(a.rate);
  const rateOk = Number.isFinite(rate) && Math.abs(rate - ex.answer.rate) <= Math.max(8, ex.answer.rate * 0.12);
  const rows = [
    { k: t("Rythme", "Rhythm"), got: opt(a.rhythm), want: opt(ex.answer.rhythm), ok: a.rhythm === ex.answer.rhythm, pts: 2 },
    { k: t("Fréquence", "Rate"), got: a.rate ? `${a.rate}/min` : undefined, want: `≈ ${ex.answer.rate}/min`, ok: rateOk, pts: 1 },
    { k: "PR", got: opt(a.pr), want: opt(ex.answer.pr), ok: a.pr === ex.answer.pr, pts: 1 },
    { k: "QRS", got: opt(a.qrs), want: opt(ex.answer.qrs), ok: a.qrs === ex.answer.qrs, pts: 1 },
    { k: t("Repolarisation", "Repolarisation"), got: opt(a.repol), want: opt(ex.answer.repol), ok: a.repol === ex.answer.repol, pts: 2 },
    { k: t("Conclusion", "Conclusion"), got: opt(a.dx), want: opt(ex.answer.dx), ok: a.dx === ex.answer.dx, pts: 3 },
  ];
  return { rows, score: rows.reduce((s, r) => s + (r.ok ? r.pts : 0), 0), max: 10 };
}

export function EcgWorkshop() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState<Ans>({});
  const [checked, setChecked] = useState(false);
  const [tips, setTips] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});
  const t = useT();
  const lang = useLang();
  const opt = (s?: string) => (s && lang === "en" ? OPTION_EN[s] ?? s : s);
  const exT = (e: EcgExercise) => (lang === "en" ? { ...e, ...EXERCISE_EN[e.id] } : e);
  const ex = exT(ECG_EXERCISES[idx]);
  const result = grade(ex, ans, t, opt);

  useEffect(() => {
    try {
      setBest(JSON.parse(localStorage.getItem(STORE) ?? "{}"));
    } catch {}
  }, []);

  function go(k: number) {
    setIdx(k);
    setAns({});
    setChecked(false);
  }
  function check() {
    setChecked(true);
    const nb = { ...best, [ex.id]: Math.max(best[ex.id] ?? 0, result.score) };
    setBest(nb);
    try {
      localStorage.setItem(STORE, JSON.stringify(nb));
    } catch {}
  }
  const complete = ans.rhythm && ans.rate && ans.pr && ans.qrs && ans.repol && ans.dx;
  const doneCount = Object.keys(best).length;
  const avg = doneCount ? Math.round((Object.values(best).reduce((a, b) => a + b, 0) / doneCount) * 10) : null;

  return (
    <div className="space-y-6">
      {/* Exercise picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ECG_EXERCISES.map((e, k) => (
            <button key={e.id} onClick={() => go(k)} title={exT(e).title} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${k === idx ? "border-[#2f86ff] bg-[#2f86ff]/20 text-white" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"}`}>
              {best[e.id] !== undefined && <span className={`h-1.5 w-1.5 rounded-full ${best[e.id] >= 8 ? "bg-emerald-400" : "bg-amber-400"}`} />}
              ECG {k + 1}
            </button>
          ))}
        </div>
        <p className="text-sm text-white/55">{doneCount}/{ECG_EXERCISES.length} {t("faits", "done")}{avg !== null && ` · ${t("moyenne", "average")} ${avg} %`}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#081427] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6fb1ff]">ECG {idx + 1} · {opt(ex.level)}</p>
            <h2 className="mt-1 font-display text-xl font-bold">{ex.title}</h2>
            <p className="mt-1 text-sm text-white/65">{ex.context}</p>
          </div>
          <button onClick={() => setTips(!tips)} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:border-white/40">
            <Lightbulb className="h-4 w-4" /> {t("Lecture systématique", "Systematic reading")}
          </button>
        </div>
        <AnimatePresence>
          {tips && (
            <motion.ol initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 grid gap-1.5 overflow-hidden rounded-xl bg-white/[0.04] p-4 text-xs text-white/75 sm:grid-cols-2">
              <li>1. {t("Rythme : une P avant chaque QRS ? RR réguliers ?", "Rhythm: a P before every QRS? Regular RR?")}</li>
              <li>2. {t("Fréquence : 300 ÷ nombre de grands carreaux entre deux R.", "Rate: 300 ÷ number of large squares between two R waves.")}</li>
              <li>3. {t("PR : 120–200 ms (3 à 5 petits carreaux).", "PR: 120–200 ms (3 to 5 small squares).")}</li>
              <li>4. {t("QRS : fins si < 120 ms (3 petits carreaux).", "QRS: narrow if < 120 ms (3 small squares).")}</li>
              <li>5. {t("ST et T : sus/sous-décalage, territoire, miroir.", "ST and T: elevation/depression, territory, reciprocal change.")}</li>
              <li>6. {t("Conclusion, puis conduite à tenir.", "Conclusion, then management.")}</li>
            </motion.ol>
          )}
        </AnimatePresence>
        <EcgPaper key={ex.id} spec={ex.spec} />
      </div>

      {/* Reading grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <Choice label={t("Rythme", "Rhythm")} show={opt} opts={RHYTHMS} value={ans.rhythm} onPick={(v) => setAns((a) => ({ ...a, rhythm: v }))} disabled={checked} want={checked ? ex.answer.rhythm : undefined} />
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Fréquence ventriculaire", "Ventricular rate")}</p>
            <div className="flex items-center gap-2">
              <input inputMode="numeric" value={ans.rate ?? ""} onChange={(e) => setAns((a) => ({ ...a, rate: e.target.value.replace(/\D/g, "").slice(0, 3) }))} disabled={checked} placeholder={t("ex. 75", "e.g. 75")} className="w-28 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-white placeholder:text-white/30 focus:border-[#2f86ff] focus:outline-none" aria-label={t("Fréquence en battements par minute", "Rate in beats per minute")} />
              <span className="text-sm text-white/55">/min</span>
            </div>
          </div>
          <Choice label={t("Intervalle PR", "PR interval")} show={opt} opts={PR_OPTS} value={ans.pr} onPick={(v) => setAns((a) => ({ ...a, pr: v }))} disabled={checked} want={checked ? ex.answer.pr : undefined} />
          <Choice label={t("Complexes QRS", "QRS complexes")} show={opt} opts={QRS_OPTS} value={ans.qrs} onPick={(v) => setAns((a) => ({ ...a, qrs: v }))} disabled={checked} want={checked ? ex.answer.qrs : undefined} />
          <Choice label={t("Repolarisation (ST, T)", "Repolarisation (ST, T)")} show={opt} opts={REPOL_OPTS} value={ans.repol} onPick={(v) => setAns((a) => ({ ...a, repol: v }))} disabled={checked} want={checked ? ex.answer.repol : undefined} />
          <div>
            <p className="mb-2 text-sm font-semibold">{t("Conclusion", "Conclusion")}</p>
            <select value={ans.dx ?? ""} onChange={(e) => setAns((a) => ({ ...a, dx: e.target.value }))} disabled={checked} className="w-full rounded-xl border border-white/10 bg-[#0a1830] px-3 py-2.5 text-sm text-white focus:border-[#2f86ff] focus:outline-none">
              <option value="">{t("Choisir…", "Choose…")}</option>
              {DIAGNOSES.map((d) => <option key={d} value={d}>{opt(d)}</option>)}
            </select>
          </div>
          {!checked ? (
            <button className="btn-primary w-full py-3" disabled={!complete} onClick={check}>{t("Valider mon interprétation", "Submit my interpretation")}</button>
          ) : (
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 border-white/15 bg-transparent text-white" onClick={() => { setAns({}); setChecked(false); }}><RotateCcw className="h-4 w-4" /> {t("Refaire", "Redo")}</button>
              {idx < ECG_EXERCISES.length - 1 && <button className="btn-primary flex-1" onClick={() => go(idx + 1)}>{t("ECG suivant", "Next ECG")} <ArrowRight className="h-4 w-4" /></button>}
            </div>
          )}
        </div>

        {/* Correction */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {!checked ? (
            <div className="grid h-full place-items-center text-center text-sm text-white/50">
              <p>{t("Remplissez la grille puis validez : la correction détaillée s'affiche ici.", "Fill in the grid then submit: the detailed correction appears here.")}<br />{t("Astuce : utilisez le compas sur le tracé pour mesurer RR, PR et QRS.", "Tip: use the calipers on the tracing to measure RR, PR and QRS.")}</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-end justify-between">
                <h3 className="font-display text-lg font-bold">{t("Correction", "Correction")}</h3>
                <p className="font-display text-4xl font-bold">{result.score}<span className="text-base text-white/50">/{result.max}</span></p>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {result.rows.map((r) => (
                  <li key={r.k} className="flex items-start gap-2">
                    {r.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />}
                    <span><b>{r.k}</b> : {r.ok ? r.want : <>{t("attendu", "expected")} <span className="text-white">{r.want}</span>{r.got && <span className="text-white/45"> ({t("vous", "you")} : {r.got})</span>}</>}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-white/75">
                {ex.explain.map((e) => <p key={e}>• {e}</p>)}
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-[#2f86ff]/30 bg-[#2f86ff]/10 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#6fb1ff]" /> <span><b>{t("Conduite à tenir", "Management")} :</b> {ex.action}</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
      <p className="text-xs text-white/35">{t("Tracés générés par un modèle pédagogique à partir des critères ECG classiques : ils reproduisent les signes à reconnaître, pas un enregistrement réel de patient.", "Tracings generated by a teaching model from classic ECG criteria: they reproduce the signs to recognise, not a real patient recording.")}</p>
    </div>
  );
}

function Choice({ label, opts, value, onPick, disabled, want, show }: { label: string; opts: readonly string[]; value?: string; onPick: (v: string) => void; disabled: boolean; want?: string; show: (s?: string) => string | undefined }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const mine = value === o;
          const right = want === o;
          return (
            <button key={o} type="button" disabled={disabled} onClick={() => onPick(o)} className={`rounded-full border px-3 py-1.5 text-xs transition ${want !== undefined ? (right ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-100" : mine ? "border-red-400/70 bg-red-400/15 text-red-100" : "border-white/10 text-white/40") : mine ? "border-[#2f86ff] bg-[#2f86ff]/20 text-white" : "border-white/15 text-white/70 hover:border-white/40"}`}>
              {show(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
