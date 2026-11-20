"use client";

/**
 * Generic engine for the guided, source-traceable workshops (data in lib/workshops/guided).
 * Steps across the top, a scenario panel, student actions, immediate explanatory feedback,
 * and a result screen with a transparent rubric, missed steps, debrief and references.
 * Keyboard and screen-reader friendly: real buttons, visible focus, live regions, and status
 * cues that are always written in words (never colour alone).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, Check, CheckCircle2, RotateCcw, X } from "@/components/icons";
import { useLang, useT } from "@/lib/i18n/client";
import { normalize } from "@/lib/catalog";
import { DOMAIN_LABEL, NOT_CERTIFYING, type Bi, type Domain } from "@/lib/pedagogy/types";
import type { ActionsStep, ChoiceStep, ComposeStep, GuidedStep, GuidedWorkshop, Scene, SequenceStep } from "@/lib/workshops/guided/types";
import { DraftBanner, ReferencePanel, ReviewPanel } from "@/components/pedagogy";

interface StepResult {
  got: number;
  max: number;
  /** Why points were awarded or missed, in the display language at the time. */
  notes: { ok: boolean; text: string }[];
}

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6fb1ff]";
const round1 = (n: number) => Math.round(n * 10) / 10;
/** Score display with the language's decimal separator. */
const num = (n: number, lang: string) => round1(n).toLocaleString(lang === "en" ? "en-GB" : "fr-FR");

export function GuidedWorkshopView({ w }: { w: GuidedWorkshop }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  // -1 = scenario intro, steps.length = results
  const [idx, setIdx] = useState(-1);
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [run, setRun] = useState(0);
  const headRef = useRef<HTMLHeadingElement>(null);
  const done = idx >= w.steps.length;
  const step = idx >= 0 && !done ? w.steps[idx] : null;

  useEffect(() => {
    headRef.current?.focus();
  }, [idx]);

  const restart = () => {
    setResults({});
    setIdx(-1);
    setRun((r) => r + 1);
  };

  const labels = [t("Scénario", "Scenario"), ...w.steps.map((s) => L(s.title)), t("Bilan", "Results")];
  const pos = idx + 1;

  return (
    <div className="space-y-5">
      <DraftBanner lang={lang} approved={w.review.status === "approved"} />
      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081427]">
          <nav aria-label={t("Étapes de l'atelier", "Workshop steps")}>
            <ol className="flex overflow-x-auto border-b border-white/10 text-xs">
              {labels.map((label, k) => {
                const state = k < pos ? "done" : k === pos ? "current" : "todo";
                return (
                  <li key={label + k} aria-current={state === "current" ? "step" : undefined} className={`flex min-w-[7.5rem] flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-3 ${state === "current" ? "bg-[#2f86ff]/15 font-semibold text-white" : state === "done" ? "text-emerald-300" : "text-white/45"}`}>
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${state === "done" ? "bg-emerald-500/25" : state === "current" ? "bg-[#2f86ff]" : "bg-white/10"}`}>{state === "done" ? <Check className="h-3 w-3" aria-hidden /> : k + 1}</span>
                    <span className="truncate">{label}</span>
                    <span className="sr-only">{state === "done" ? t("(terminée)", "(done)") : state === "current" ? t("(en cours)", "(current)") : ""}</span>
                  </li>
                );
              })}
            </ol>
          </nav>
          <p className="sr-only" aria-live="polite">{t(`Étape ${pos + 1} sur ${labels.length}`, `Step ${pos + 1} of ${labels.length}`)}</p>
          <div className="p-5 sm:p-6">
            <SceneView scene={step?.scene ?? (idx === -1 ? undefined : w.steps[Math.min(idx, w.steps.length) - 1]?.scene)} intro={idx === -1 ? L(w.intro) : undefined} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
          {idx === -1 && (
            <div className="space-y-4">
              <h2 ref={headRef} tabIndex={-1} className="font-display text-xl font-bold outline-none">{t("Avant de commencer", "Before you start")}</h2>
              <div>
                <p className="text-sm font-semibold text-white/80">{t("Objectifs", "Objectives")}</p>
                <ol className="mt-2 space-y-1.5 text-sm text-white/70">{w.objectives.map((o, k) => <li key={o.fr}>{k + 1}. {L(o)}</li>)}</ol>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-white/50">{t("Niveau", "Level")}</dt><dd>{L(w.level)}</dd></div>
                <div><dt className="text-white/50">{t("Durée", "Duration")}</dt><dd>≈ {w.minutes} min</dd></div>
                <div className="col-span-2"><dt className="text-white/50">{t("Prérequis", "Prerequisites")}</dt><dd>{w.prerequisites.map(L).join(" · ")}</dd></div>
              </dl>
              {w.handsOn && <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">{L(NOT_CERTIFYING)}</p>}
              <button className={`btn-primary w-full ${FOCUS}`} onClick={() => setIdx(0)}>{t("Commencer", "Start")} <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}
          {step && (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6fb1ff]">{t("Étape", "Step")} {idx + 1} / {w.steps.length} · {L(DOMAIN_LABEL[step.domain])}</p>
              <h2 ref={headRef} tabIndex={-1} className="font-display text-xl font-bold leading-snug outline-none">{L(step.title)}</h2>
              <p className="text-sm text-white/75">{L(step.prompt)}</p>
              <StepView
                key={`${run}-${step.id}`}
                step={step}
                onDone={(r) => setResults((x) => ({ ...x, [step.id]: r }))}
                onNext={() => setIdx(idx + 1)}
                last={idx === w.steps.length - 1}
              />
            </div>
          )}
          {done && <Results w={w} results={results} headRef={headRef} onRestart={restart} />}
        </div>
      </div>
      {done && (
        <div className="grid gap-5 lg:grid-cols-2">
          <ReviewPanel review={w.review} lang={lang} />
          <ReferencePanel refs={w.refs} lang={lang} />
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Scenario panel ─────────────────────────

const ALERT: Record<NonNullable<Scene["alert"]>, { fr: string; en: string; cls: string }> = {
  stable: { fr: "État stable", en: "Stable", cls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-100" },
  better: { fr: "S'améliore", en: "Improving", cls: "border-emerald-400/50 bg-emerald-400/10 text-emerald-100" },
  worse: { fr: "Se dégrade", en: "Deteriorating", cls: "border-amber-400/60 bg-amber-400/10 text-amber-100" },
  critical: { fr: "Critique — appeler à l'aide", en: "Critical — call for help", cls: "border-red-400/60 bg-red-500/15 text-red-100" },
};

function SceneView({ scene, intro }: { scene?: Scene; intro?: string }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const v = scene?.vitals;
  const tiles: [string, string | undefined][] = v
    ? [
        [t("FC", "HR"), v.hr ? `${v.hr}/min` : undefined],
        [t("PA", "BP"), v.sbp ? `${v.sbp}/${v.dbp ?? "—"}` : undefined],
        [t("FR", "RR"), v.rr ? `${v.rr}/min` : undefined],
        ["SpO₂", v.spo2 ? `${v.spo2} %` : undefined],
        ["T°", v.temp ? `${v.temp.toString().replace(".", lang === "en" ? "." : ",")} °C` : undefined],
      ]
    : [];
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">{t("Scénario fictif — données synthétiques", "Fictional scenario — synthetic data")}</p>
      {intro && <p className="text-base leading-relaxed text-white/85">{intro}</p>}
      {scene?.alert && (
        <p role="status" className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${ALERT[scene.alert].cls}`}>
          {scene.alert === "critical" || scene.alert === "worse" ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
          {lang === "en" ? ALERT[scene.alert].en : ALERT[scene.alert].fr}
        </p>
      )}
      {scene?.text && <p className="leading-relaxed text-white/80">{L(scene.text)}</p>}
      {tiles.some(([, x]) => x) && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {tiles.filter(([, x]) => x).map(([k, x]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono">
              <dt className="text-[11px] text-white/50">{k}</dt>
              <dd className="text-lg font-semibold text-[#38e1ff]">{x}</dd>
            </div>
          ))}
          {v?.extra && <div className="col-span-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm sm:col-span-5"><span className="text-white/50">{t("Autres", "Other")} : </span>{L(v.extra)}</div>}
        </dl>
      )}
      {scene?.diagram === "abg" && scene.abg && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-sm">
          <p className="mb-2 font-sans text-xs text-white/50">{L(scene.abg.context)}</p>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div><dt className="text-white/50">pH</dt><dd className="text-lg">{scene.abg.ph}</dd></div>
            <div><dt className="text-white/50">PaCO₂</dt><dd className="text-lg">{scene.abg.paco2} mmHg</dd></div>
            <div><dt className="text-white/50">HCO₃⁻</dt><dd className="text-lg">{scene.abg.hco3} mmol/L</dd></div>
            {scene.abg.pao2 && <div><dt className="text-white/50">PaO₂</dt><dd className="text-lg">{scene.abg.pao2} mmHg</dd></div>}
          </dl>
          <p className="mt-3 font-sans text-xs text-white/55">{t("Intervalles indicatifs (StatPearls, MàJ 2024) : PaCO₂ 35–45 mmHg ; HCO₃⁻ 22–26 mmol/L ; pH 7,35–7,45 (à confirmer). Les intervalles du laboratoire local priment.", "Indicative intervals (StatPearls, updated 2024): PaCO₂ 35–45 mmHg; HCO₃⁻ 22–26 mmol/L; pH 7.35–7.45 (to confirm). Local laboratory intervals take precedence.")}</p>
        </div>
      )}
      {scene?.diagram === "cxr" && <CxrSchematic />}
    </div>
  );
}

/** Schematic chest outline — explicitly NOT a radiograph. */
function CxrSchematic() {
  const t = useT();
  return (
    <figure className="rounded-xl border border-white/10 bg-black/40 p-3">
      <svg viewBox="0 0 320 260" className="mx-auto block w-full max-w-sm" role="img" aria-label={t("Schéma pédagogique du thorax, non diagnostique", "Teaching schematic of the chest, not diagnostic")}>
        <rect x="10" y="10" width="300" height="240" rx="14" fill="#0b1220" stroke="#334155" />
        <path d="M60 40 Q160 10 260 40 L280 220 Q160 240 40 220 Z" fill="none" stroke="#64748b" strokeWidth="2" />
        <path d="M155 30 L155 95" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="105" cy="130" rx="55" ry="80" fill="#1e293b" stroke="#475569" />
        <ellipse cx="215" cy="130" rx="55" ry="80" fill="#1e293b" stroke="#475569" />
        <path d="M150 115 Q205 120 210 170 Q180 205 135 195 Q120 160 150 115 Z" fill="#334155" stroke="#64748b" />
        <path d="M58 205 Q105 180 150 205" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <path d="M168 205 Q215 182 262 205" fill="none" stroke="#94a3b8" strokeWidth="2" />
        <path d="M60 175 Q90 168 140 180 L148 205 Q100 200 58 205 Z" fill="#e2e8f0" opacity="0.35" />
        <text x="160" y="248" textAnchor="middle" fontSize="10" fill="#94a3b8">{t("SCHÉMA — PAS UNE RADIOGRAPHIE", "SCHEMATIC — NOT A RADIOGRAPH")}</text>
      </svg>
      <figcaption className="mt-2 text-xs text-white/55">{t("Schéma simplifié dessiné pour l'exercice : il ne remplace pas une vraie radiographie. L'enseignant doit fournir des radiographies sous licence adaptée.", "Simplified schematic drawn for the exercise: it does not replace a real radiograph. The educator must supply suitably licensed radiographs.")}</figcaption>
    </figure>
  );
}

// ───────────────────────── Steps ─────────────────────────

function StepView({ step, onDone, onNext, last }: { step: GuidedStep; onDone: (r: StepResult) => void; onNext: () => void; last: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const t = useT();
  const finish = (r: StepResult) => {
    onDone(r);
    setSubmitted(true);
  };
  return (
    <>
      {step.kind === "choice" && <ChoiceView step={step} onSubmit={finish} />}
      {step.kind === "sequence" && <SequenceView step={step} onSubmit={finish} />}
      {step.kind === "actions" && <ActionsView step={step} onSubmit={finish} />}
      {step.kind === "compose" && <ComposeView step={step} onSubmit={finish} />}
      {submitted && (
        <button className={`btn-primary w-full ${FOCUS}`} onClick={onNext}>
          {last ? t("Voir le bilan", "See the results") : t("Étape suivante", "Next step")} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

function Verdict({ ok, partial, children }: { ok: boolean; partial?: boolean; children: React.ReactNode }) {
  const t = useT();
  return (
    <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-lg px-4 py-3 text-sm ${ok ? "bg-emerald-500/15 text-emerald-50" : partial ? "bg-amber-500/15 text-amber-50" : "bg-red-500/15 text-red-50"}`}>
      <p className="flex items-center gap-2 font-semibold">{ok ? <Check className="h-4 w-4" aria-hidden /> : partial ? <AlertTriangle className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />} {ok ? t("Correct", "Correct") : partial ? t("Partiellement correct", "Partly correct") : t("À revoir", "Needs review")}</p>
      <div className="mt-1.5 space-y-1 opacity-90">{children}</div>
    </motion.div>
  );
}

function ChoiceView({ step, onSubmit }: { step: ChoiceStep; onSubmit: (r: StepResult) => void }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const [picked, setPicked] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const nCorrect = step.options.filter((o) => o.correct).length || 1;
  const goodPicked = step.options.filter((o) => o.correct && picked.includes(o.id)).length;
  const badPicked = step.options.filter((o) => !o.correct && picked.includes(o.id)).length;
  const frac = step.multi ? Math.max(0, (goodPicked - badPicked) / nCorrect) : goodPicked === 1 && badPicked === 0 ? 1 : 0;

  const toggle = (id: string) => {
    if (checked) return;
    setPicked((p) => (step.multi ? (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]) : [id]));
  };
  const check = () => {
    setChecked(true);
    const notes = step.options
      .filter((o) => o.correct || picked.includes(o.id))
      .map((o) => ({ ok: o.correct === picked.includes(o.id), text: `${o.correct ? (picked.includes(o.id) ? "✓" : t("Oublié :", "Missed:")) : t("✗ Choix erroné :", "✗ Wrong choice:")} ${L(o.label)} — ${L(o.feedback)}` }));
    onSubmit({ got: round1(step.points * frac), max: step.points, notes });
  };

  return (
    <div className="space-y-3">
      {step.multi && <p className="text-xs text-white/55">{t("Plusieurs réponses possibles.", "Several answers may be correct.")}</p>}
      <div role={step.multi ? "group" : "radiogroup"} aria-label={L(step.prompt)} className="space-y-2">
        {step.options.map((o) => {
          const mine = picked.includes(o.id);
          const show = checked && (o.correct || mine);
          return (
            <button
              key={o.id}
              role={step.multi ? "checkbox" : "radio"}
              aria-checked={mine}
              aria-label={checked ? undefined : L(o.label)}
              disabled={checked}
              onClick={() => toggle(o.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${FOCUS} ${checked ? (o.correct ? "border-emerald-400/60 bg-emerald-400/10" : mine ? "border-red-400/60 bg-red-400/10" : "border-white/10 opacity-60") : mine ? "border-[#2f86ff] bg-[#2f86ff]/15" : "border-white/15 hover:border-[#2f86ff] hover:bg-[#2f86ff]/10"}`}
            >
              <span className="flex items-start gap-2">
                <span aria-hidden className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center border ${step.multi ? "rounded" : "rounded-full"} ${mine ? "border-[#6fb1ff] bg-[#2f86ff]" : "border-white/40"}`}>{mine && <Check className="h-3 w-3" />}</span>
                <span>
                  {L(o.label)}
                  {show && <span className="mt-1 block text-xs text-white/70"><strong>{o.correct ? t("Bonne réponse. ", "Correct answer. ") : t("Réponse incorrecte. ", "Incorrect answer. ")}</strong>{L(o.feedback)}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!checked ? (
        <button className={`btn-primary w-full ${FOCUS}`} disabled={!picked.length} onClick={check}>{t("Vérifier", "Check")}</button>
      ) : (
        <Verdict ok={frac === 1} partial={frac > 0 && frac < 1}>
          <p>{t("Points", "Points")} : {num(step.points * frac, lang)} / {step.points}</p>
        </Verdict>
      )}
    </div>
  );
}

/** Deterministic "shuffle" that never returns the original order (for n ≥ 2). */
function scramble<T>(items: T[]): T[] {
  if (items.length < 2) return items;
  const out = [...items].reverse();
  if (items.length > 3) [out[0], out[1]] = [out[1], out[0]];
  return out;
}

function SequenceView({ step, onSubmit }: { step: SequenceStep; onSubmit: (r: StepResult) => void }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const [order, setOrder] = useState(() => scramble(step.items));
  const [checked, setChecked] = useState(false);
  const [live, setLive] = useState("");
  const correctAt = (k: number) => order[k].id === step.items[k].id;
  const nRight = order.filter((_, k) => correctAt(k)).length;
  const frac = nRight / step.items.length;

  const move = (k: number, d: -1 | 1) => {
    const j = k + d;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[k], next[j]] = [next[j], next[k]];
    setOrder(next);
    setLive(t(`${L(next[j].label)} : position ${j + 1}`, `${L(next[j].label)}: position ${j + 1}`));
  };
  const check = () => {
    setChecked(true);
    const notes = step.items.map((it, k) => ({ ok: order[k].id === it.id, text: `${k + 1}. ${L(it.label)}${order[k].id === it.id ? " ✓" : t(` — vous aviez : ${L(order[k].label)}`, ` — you had: ${L(order[k].label)}`)}` }));
    onSubmit({ got: round1(step.points * frac), max: step.points, notes: [...notes, { ok: true, text: L(step.explain) }] });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/55">{t("Utilisez les flèches pour remettre les étapes dans l'ordre.", "Use the arrows to put the steps in order.")}</p>
      <p className="sr-only" aria-live="polite">{live}</p>
      <ol className="space-y-2">
        {order.map((it, k) => (
          <li key={it.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${checked ? (correctAt(k) ? "border-emerald-400/60 bg-emerald-400/10" : "border-red-400/60 bg-red-400/10") : "border-white/15"}`}>
            <span className="w-5 shrink-0 font-mono text-white/50">{k + 1}.</span>
            <span className="flex-1">{L(it.label)}{checked && <span className="sr-only">{correctAt(k) ? t(" — bien placé", " — correct position") : t(" — mal placé", " — wrong position")}</span>}</span>
            {checked ? (
              correctAt(k) ? <Check className="h-4 w-4 text-emerald-300" aria-hidden /> : <X className="h-4 w-4 text-red-300" aria-hidden />
            ) : (
              <span className="flex gap-1">
                <button className={`rounded-md border border-white/15 p-1.5 hover:bg-white/10 disabled:opacity-30 ${FOCUS}`} disabled={k === 0} onClick={() => move(k, -1)} aria-label={t(`Monter « ${L(it.label)} »`, `Move "${L(it.label)}" up`)}><ArrowUp className="h-3.5 w-3.5" /></button>
                <button className={`rounded-md border border-white/15 p-1.5 hover:bg-white/10 disabled:opacity-30 ${FOCUS}`} disabled={k === order.length - 1} onClick={() => move(k, 1)} aria-label={t(`Descendre « ${L(it.label)} »`, `Move "${L(it.label)}" down`)}><ArrowDown className="h-3.5 w-3.5" /></button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {!checked ? (
        <button className={`btn-primary w-full ${FOCUS}`} onClick={check}>{t("Vérifier l'ordre", "Check the order")}</button>
      ) : (
        <Verdict ok={frac === 1} partial={frac > 0 && frac < 1}>
          <p>{t(`${nRight} étape(s) bien placée(s) sur ${step.items.length}.`, `${nRight} of ${step.items.length} steps in the right place.`)}</p>
          <p className="font-semibold">{t("Ordre attendu", "Expected order")} :</p>
          <ol className="list-decimal pl-5">{step.items.map((it) => <li key={it.id}>{L(it.label)}</li>)}</ol>
          <p>{L(step.explain)}</p>
        </Verdict>
      )}
    </div>
  );
}

/** Longest increasing subsequence length (order quality of required actions). */
function lis(xs: number[]) {
  const tails: number[] = [];
  for (const x of xs) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (tails[m] < x) lo = m + 1;
      else hi = m;
    }
    tails[lo] = x;
  }
  return tails.length;
}

const ABDO_REGIONS: { id: string; fr: string; en: string }[] = [
  { id: "rhc", fr: "Hypocondre droit", en: "Right upper quadrant (hypochondrium)" },
  { id: "epi", fr: "Épigastre", en: "Epigastrium" },
  { id: "lhc", fr: "Hypocondre gauche", en: "Left upper quadrant (hypochondrium)" },
  { id: "rfl", fr: "Flanc droit", en: "Right flank" },
  { id: "umb", fr: "Région ombilicale", en: "Umbilical region" },
  { id: "lfl", fr: "Flanc gauche", en: "Left flank" },
  { id: "rif", fr: "Fosse iliaque droite", en: "Right iliac fossa" },
  { id: "hyp", fr: "Hypogastre", en: "Suprapubic region" },
  { id: "lif", fr: "Fosse iliaque gauche", en: "Left iliac fossa" },
];

function ActionsView({ step, onSubmit }: { step: ActionsStep; onSubmit: (r: StepResult) => void }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const [log, setLog] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [res, setRes] = useState<{ frac: number; delayed: string[]; orderOk: boolean } | null>(null);
  const byId = useMemo(() => new Map(step.actions.map((a) => [a.id, a])), [step.actions]);
  const required = step.actions.filter((a) => a.required);
  const regionActions = step.actions.filter((a) => a.region);
  const listActions = step.actions.filter((a) => !a.region);
  const isAbdo = regionActions.length > 0 && regionActions.every((a) => ABDO_REGIONS.some((r) => r.id === a.region));

  const doAction = (id: string) => {
    if (checked || log.includes(id)) return;
    setLog((l) => [...l, id]);
  };

  const check = () => {
    setChecked(true);
    const doneReq = required.filter((a) => log.includes(a.id));
    const coverage = required.length ? doneReq.length / required.length : 1;
    const reqOrder = log.filter((id) => byId.get(id)?.required).map((id) => required.findIndex((a) => a.id === id));
    const orderFrac = step.ordered && reqOrder.length ? lis(reqOrder) / reqOrder.length : 1;
    const delayed = step.actions.filter((a) => a.urgent && (log.indexOf(a.id) === -1 || log.indexOf(a.id) >= (step.urgentBy ?? 99)));
    let frac = step.ordered ? 0.5 * coverage + 0.5 * coverage * orderFrac : coverage;
    frac = Math.max(0, frac - 0.15 * delayed.length);
    setRes({ frac, delayed: delayed.map((a) => L(a.label)), orderOk: orderFrac === 1 });
    const notes: StepResult["notes"] = [
      ...required.map((a) => ({ ok: log.includes(a.id), text: log.includes(a.id) ? `✓ ${L(a.label)}` : t(`Non réalisé : ${L(a.label)} — ${L(a.finding)}`, `Not done: ${L(a.label)} — ${L(a.finding)}`) })),
      ...delayed.map((a) => ({ ok: false, text: t(`Retard : « ${L(a.label)} » aurait dû venir plus tôt.`, `Delay: "${L(a.label)}" should have come earlier.`) })),
      ...(step.ordered && orderFrac < 1 ? [{ ok: false, text: t("Ordre de l'évaluation non respecté.", "Assessment order not followed.") }] : []),
      ...log.map((id) => byId.get(id)).filter((a) => a && !a.required && a.note).map((a) => ({ ok: false, text: `${L(a!.label)} — ${L(a!.note!)}` })),
      { ok: true, text: L(step.explain) },
    ];
    onSubmit({ got: round1(step.points * frac), max: step.points, notes });
  };

  const button = (a: ActionsStep["actions"][number], label: string) => {
    const did = log.includes(a.id);
    return (
      <button key={a.id} onClick={() => doAction(a.id)} disabled={checked} aria-pressed={did} className={`rounded-xl border px-3 py-2 text-left text-sm transition ${FOCUS} ${did ? "border-[#38e1ff]/60 bg-[#38e1ff]/10" : "border-white/15 hover:border-[#2f86ff] hover:bg-[#2f86ff]/10"}`}>
        {did && <Check className="mr-1 inline h-3.5 w-3.5" aria-hidden />}{label}{did && <span className="sr-only">{t(" (fait)", " (done)")}</span>}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {isAbdo && (
        <div>
          <p className="mb-2 text-xs text-white/55">{t("Schéma de l'abdomen (9 régions, vue de face, patient allongé) : choisissez une région à palper.", "Abdomen diagram (9 regions, front view, patient lying down): choose a region to palpate.")}</p>
          <div className="mx-auto grid max-w-xs grid-cols-3 gap-1 rounded-[2rem] border border-white/15 bg-[#e9b896]/10 p-2" role="group" aria-label={t("Régions de l'abdomen", "Abdominal regions")}>
            {ABDO_REGIONS.map((r) => {
              const a = regionActions.find((x) => x.region === r.id);
              if (!a) return <span key={r.id} />;
              const did = log.includes(a.id);
              return (
                <button key={r.id} onClick={() => doAction(a.id)} disabled={checked} aria-pressed={did} className={`aspect-square rounded-xl border p-1 text-[10px] leading-tight transition ${FOCUS} ${did ? "border-[#38e1ff]/70 bg-[#38e1ff]/15" : "border-white/15 hover:bg-[#2f86ff]/15"}`}>
                  {lang === "en" ? r.en : r.fr}{did && <span className="sr-only">{t(" (palpée)", " (palpated)")}</span>}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-center text-[10px] text-white/40">{t("Droite du patient à gauche de l'écran", "Patient's right is on the left of the screen")}</p>
        </div>
      )}
      {!isAbdo && regionActions.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{regionActions.map((a) => button(a, L(a.label)))}</div>}
      {listActions.length > 0 && <div className="grid gap-2">{listActions.map((a) => button(a, L(a.label)))}</div>}
      {log.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs font-semibold text-white/60">{t("Constatations", "Findings")}</p>
          <ol className="mt-1.5 space-y-1.5 text-sm" aria-live="polite">
            {log.map((id, k) => {
              const a = byId.get(id)!;
              return <li key={id}><span className="font-mono text-white/45">{k + 1}.</span> <span className="font-medium">{L(a.label)}</span> — <span className="text-white/80">{L(a.finding)}</span>{a.note && !a.required && <span className="block text-xs text-amber-200">{L(a.note)}</span>}</li>;
            })}
          </ol>
        </div>
      )}
      {!checked ? (
        <button className={`btn-primary w-full ${FOCUS}`} disabled={!log.length} onClick={check}>{t("Terminer cette étape", "Finish this step")}</button>
      ) : (
        <Verdict ok={(res?.frac ?? 0) >= 0.999} partial={(res?.frac ?? 0) > 0}>
          <p>{t("Points", "Points")} : {num(step.points * (res?.frac ?? 0), lang)} / {step.points}</p>
          {required.filter((a) => !log.includes(a.id)).map((a) => <p key={a.id}>{t("Non réalisé", "Not done")} : {L(a.label)}</p>)}
          {res?.delayed.map((d) => <p key={d}>{t("Retard", "Delay")} : {d}</p>)}
          {step.ordered && res && !res.orderOk && <p>{t("L'ordre de l'évaluation n'a pas été respecté.", "The assessment order was not followed.")}</p>}
          <p>{L(step.explain)}</p>
        </Verdict>
      )}
    </div>
  );
}

function ComposeView({ step, onSubmit }: { step: ComposeStep; onSubmit: (r: StepResult) => void }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const [text, setText] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const hit = (id: string) => {
    const f = step.fields.find((x) => x.id === id)!;
    const s = ` ${normalize(text[id] ?? "")} `;
    return f.expect.some((group) => group.every((k) => s.includes(normalize(k))));
  };
  const check = () => {
    setChecked(true);
    const per = step.points / step.fields.length;
    const notes = step.fields.map((f) => ({ ok: hit(f.id), text: `${hit(f.id) ? "✓" : t("À compléter :", "To complete:")} ${L(f.label)} — ${t("modèle", "model")} : ${L(f.model)}` }));
    onSubmit({ got: round1(per * step.fields.filter((f) => hit(f.id)).length), max: step.points, notes });
  };
  return (
    <div className="space-y-3">
      {step.fields.map((f) => (
        <div key={f.id}>
          <label htmlFor={`f-${step.id}-${f.id}`} className="text-sm font-semibold">{L(f.label)}</label>
          <p id={`h-${step.id}-${f.id}`} className="text-xs text-white/50">{L(f.hint)}</p>
          <textarea
            id={`f-${step.id}-${f.id}`}
            aria-describedby={`h-${step.id}-${f.id}`}
            value={text[f.id] ?? ""}
            onChange={(e) => setText((x) => ({ ...x, [f.id]: e.target.value }))}
            disabled={checked}
            rows={2}
            className={`mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#2f86ff] focus:outline-none ${FOCUS}`}
          />
          {checked && (
            <p className={`mt-1 text-xs ${hit(f.id) ? "text-emerald-200" : "text-amber-200"}`}>
              {hit(f.id) ? <><Check className="mr-1 inline h-3 w-3" aria-hidden />{t("Élément attendu présent.", "Expected element present.")}</> : <><AlertTriangle className="mr-1 inline h-3 w-3" aria-hidden />{t("Élément attendu non retrouvé.", "Expected element not found.")}</>} {t("Exemple", "Example")} : {L(f.model)}
            </p>
          )}
        </div>
      ))}
      {!checked ? (
        <button className={`btn-primary w-full ${FOCUS}`} disabled={!Object.values(text).some((v) => v.trim())} onClick={check}>{t("Vérifier", "Check")}</button>
      ) : (
        <Verdict ok={step.fields.every((f) => hit(f.id))} partial={step.fields.some((f) => hit(f.id))}>
          <p>{t("La correction repère des mots-clés : relisez le modèle pour juger votre formulation. Une bonne réponse peut être formulée autrement.", "Marking looks for keywords: compare with the model to judge your wording. A good answer can be phrased differently.")}</p>
        </Verdict>
      )}
    </div>
  );
}

// ───────────────────────── Results ─────────────────────────

function Results({ w, results, headRef, onRestart }: { w: GuidedWorkshop; results: Record<string, StepResult>; headRef: React.RefObject<HTMLHeadingElement | null>; onRestart: () => void }) {
  const t = useT();
  const lang = useLang();
  const L = (b: Bi) => (lang === "en" ? b.en : b.fr);
  const total = w.steps.reduce((s, st) => s + (results[st.id]?.got ?? 0), 0);
  const max = w.steps.reduce((s, st) => s + st.points, 0);
  const pct = max ? Math.round((total / max) * 100) : 0;
  const domains = [...new Set(w.steps.map((s) => s.domain))] as Domain[];
  const missed = w.steps.filter((s) => (results[s.id]?.got ?? 0) < s.points);
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <h2 ref={headRef} tabIndex={-1} className="font-display text-xl font-bold outline-none">{t("Bilan de l'atelier", "Workshop results")}</h2>
        <p className="font-display text-4xl font-bold">{pct}<span className="text-base text-white/50">/100</span></p>
      </div>
      <p className="text-xs text-white/55">{t(`${num(total, lang)} points sur ${max}. Chaque point est rattaché à une étape et expliqué ci-dessous.`, `${num(total, lang)} of ${max} points. Every point is tied to a step and explained below.`)}</p>
      <div>
        <p className="text-sm font-semibold">{t("Grille par domaine", "Rubric by domain")}</p>
        <ul className="mt-2 space-y-2.5">
          {domains.map((d) => {
            const st = w.steps.filter((s) => s.domain === d);
            const got = st.reduce((s, x) => s + (results[x.id]?.got ?? 0), 0);
            const m = st.reduce((s, x) => s + x.points, 0);
            return (
              <li key={d} className="text-sm">
                <div className="flex justify-between gap-2"><span className="text-white/85">{L(DOMAIN_LABEL[d])}</span><span className="font-mono text-white/60">{num(got, lang)}/{m}</span></div>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden><span className={`block h-full rounded-full ${got >= m ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${(got / (m || 1)) * 100}%` }} /></span>
              </li>
            );
          })}
        </ul>
      </div>
      {missed.length > 0 && (
        <div>
          <p className="text-sm font-semibold">{t("Points manqués", "Missed points")}</p>
          <ul className="mt-1.5 space-y-1 text-sm text-amber-100/90">{missed.map((s) => <li key={s.id}>• {L(s.title)} ({num(results[s.id]?.got ?? 0, lang)}/{s.points})</li>)}</ul>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold">{t("Revoir chaque étape", "Review each step")}</p>
        <div className="mt-2 space-y-2">
          {w.steps.map((s, k) => (
            <details key={s.id} className="rounded-lg border border-white/10 px-3 py-2 text-sm">
              <summary className={`cursor-pointer ${FOCUS}`}>{k + 1}. {L(s.title)} — {num(results[s.id]?.got ?? 0, lang)}/{s.points}</summary>
              <ul className="mt-2 space-y-1 text-white/75">{(results[s.id]?.notes ?? []).map((n, j) => <li key={j} className={n.ok ? "" : "text-amber-100/90"}>{n.text}</li>)}</ul>
            </details>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold">{t("Débriefing", "Debrief")}</p>
        <ul className="mt-1.5 space-y-1.5 text-sm text-white/75">{w.debrief.keyPoints.map((p) => <li key={p.fr}>• {L(p)}</li>)}</ul>
      </div>
      <div>
        <p className="text-sm font-semibold">{t("Pour réfléchir", "Reflection")}</p>
        <ul className="mt-1.5 space-y-1.5 text-sm text-white/75">{w.debrief.reflection.map((p) => <li key={p.fr}>• {L(p)}</li>)}</ul>
      </div>
      {w.handsOn && <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">{L(NOT_CERTIFYING)}</p>}
      <button className={`btn-ghost w-full ${FOCUS}`} onClick={onRestart}><RotateCcw className="h-4 w-4" /> {t("Recommencer", "Start again")}</button>
    </div>
  );
}
