"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, RotateCcw, X } from "@/components/icons";
import { useT } from "@/lib/i18n/client";
import type { T } from "@/lib/i18n/shared";

/**
 * Atelier « suture d'une plaie simple » : préparation, antisepsie, anesthésie locale, choix du
 * fil, pose de points simples mesurés en millimètres (distance aux berges, perpendicularité,
 * espacement, couverture de la plaie), nœuds, pansement — puis une note expliquée.
 */

const MM = 5; // px per millimetre in the SVG
const W = 640;
const H = 360;
const X0 = 170; // wound start
const X1 = 470; // wound end (60 mm)
const CY = 180;
const GAP = 4; // half-gap between wound edges (px)

type Stitch = { a: { x: number; y: number }; b: { x: number; y: number } };
type Step = "prep" | "antisepsis" | "anesthesia" | "suture" | "knots" | "dressing" | "result";
const STEPS: { key: Step; label: string; en: string }[] = [
  { key: "prep", label: "Matériel", en: "Kit" },
  { key: "antisepsis", label: "Antisepsie", en: "Antisepsis" },
  { key: "anesthesia", label: "Anesthésie", en: "Anaesthesia" },
  { key: "suture", label: "Points", en: "Stitches" },
  { key: "knots", label: "Nœuds", en: "Knots" },
  { key: "dressing", label: "Pansement", en: "Dressing" },
  { key: "result", label: "Bilan", en: "Results" },
];

const quizFor = (t: T) => ({
  prep: {
    q: t("Plaie nette de 6 cm à l'avant-bras, vue à H+2. Quel fil choisissez-vous ?", "Clean 6 cm forearm laceration, seen at 2 hours. Which suture do you choose?"),
    options: [
      { t: t("Fil résorbable 2/0", "Absorbable 2/0"), ok: false, why: t("Trop gros pour la peau, réservé aux plans profonds ou aux zones de forte tension.", "Too thick for skin; for deep layers or high-tension areas.") },
      { t: t("Fil non résorbable monobrin 4/0", "Non-absorbable monofilament 4/0"), ok: true, why: t("Standard pour la peau des membres : solide, peu réactif.", "Standard for limb skin: strong, low reactivity.") },
      { t: t("Fil non résorbable 6/0", "Non-absorbable 6/0"), ok: false, why: t("Réservé au visage : trop fin pour l'avant-bras.", "For the face: too fine for the forearm.") },
    ],
  },
  anesthesia: {
    q: t("Quelle anesthésie locale ?", "Which local anaesthetic?"),
    options: [
      { t: t("Lidocaïne 1 % en infiltration sous-cutanée des berges, après aspiration", "1% lidocaine infiltrated subcutaneously through the wound edges, after aspirating"), ok: true, why: t("Infiltrer lentement par les berges de la plaie, en aspirant avant d'injecter.", "Infiltrate slowly through the wound edges, aspirating before injecting.") },
      { t: t("Lidocaïne adrénalinée en bague à la racine du doigt", "Lidocaine with adrenaline as a ring block at the base of the finger"), ok: false, why: t("Hors sujet ici, et l'adrénaline est classiquement évitée aux extrémités.", "Not relevant here, and adrenaline is classically avoided in the extremities.") },
      { t: t("Pas d'anesthésie, la plaie est petite", "No anaesthetic, the wound is small"), ok: false, why: t("Une suture de 6 cm sans anesthésie est douloureuse et non éthique.", "Suturing 6 cm without anaesthetic is painful and unethical.") },
    ],
  },
});

function stitchChecks(s: Stitch) {
  const depthA = Math.abs(s.a.y - CY) - GAP;
  const depthB = Math.abs(s.b.y - CY) - GAP;
  const bite = (depthA + depthB) / 2 / MM; // mm from edge
  const skew = Math.abs(s.a.x - s.b.x) / MM;
  const symmetric = Math.abs(depthA - depthB) / MM;
  return { bite, skew, symmetric, okBite: bite >= 2.5 && bite <= 6, okSkew: skew <= 2, okSym: symmetric <= 2 };
}

export function SutureWorkshop() {
  const t = useT();
  const QUIZ = useMemo(() => quizFor(t), [t]);
  const [step, setStep] = useState<Step>("prep");
  const [answers, setAnswers] = useState<{ prep?: number; anesthesia?: number }>({});
  const [painted, setPainted] = useState(false);
  const [stitches, setStitches] = useState<Stitch[]>([]);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const idx = STEPS.findIndex((s) => s.key === step);

  const sorted = useMemo(() => [...stitches].sort((p, q) => (p.a.x + p.b.x) / 2 - (q.a.x + q.b.x) / 2), [stitches]);
  const spacings = sorted.slice(1).map((s, k) => ((s.a.x + s.b.x) / 2 - (sorted[k].a.x + sorted[k].b.x) / 2) / MM);

  function point(e: React.MouseEvent<SVGSVGElement>) {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }

  function onClick(e: React.MouseEvent<SVGSVGElement>) {
    if (step !== "suture") return;
    const pt = point(e);
    if (Math.abs(pt.y - CY) <= GAP) return setHint(t("Ne piquez pas dans la plaie : entrez par la peau, à quelques millimètres de la berge.", "Don't pierce the wound itself: enter through the skin, a few millimetres from the edge."));
    if (pt.x < X0 - 25 || pt.x > X1 + 25) return setHint(t("Restez sur la longueur de la plaie.", "Stay along the length of the wound."));
    if (!pending) {
      setPending(pt);
      setHint(t("Point d'entrée posé. Ressortez maintenant de l'autre côté, en face.", "Entry point placed. Now come out on the opposite edge."));
      return;
    }
    if (Math.sign(pt.y - CY) === Math.sign(pending.y - CY)) return setHint(t("La sortie doit être sur l'autre berge.", "The exit must be on the other edge."));
    const s = { a: pending, b: pt };
    setStitches((v) => [...v, s]);
    setPending(null);
    const c = stitchChecks(s);
    setHint(
      !c.okBite ? t(`Point à ${c.bite.toFixed(1)} mm des berges : visez 3 à 5 mm.`, `Stitch ${c.bite.toFixed(1)} mm from the edges: aim for 3–5 mm.`) : !c.okSkew ? t(`Point oblique (${c.skew.toFixed(1)} mm de décalage) : piquez perpendiculairement à la plaie.`, `Oblique stitch (${c.skew.toFixed(1)} mm offset): go perpendicular to the wound.`) : !c.okSym ? t("Berges asymétriques : prenez la même quantité de peau des deux côtés.", "Asymmetric bites: take the same amount of skin on both sides.") : t("Bon point : perpendiculaire, symétrique, 3–5 mm des berges.", "Good stitch: perpendicular, symmetric, 3–5 mm from the edges."),
    );
  }

  const score = useMemo(() => {
    const items: { label: string; got: number; max: number; tip?: string }[] = [];
    const prep = answers.prep !== undefined && QUIZ.prep.options[answers.prep].ok;
    const anest = answers.anesthesia !== undefined && QUIZ.anesthesia.options[answers.anesthesia].ok;
    items.push({ label: t("Choix du fil", "Suture choice"), got: prep ? 10 : 0, max: 10, tip: prep ? undefined : t("Peau des membres : monobrin non résorbable 4/0.", "Limb skin: non-absorbable monofilament 4/0.") });
    items.push({ label: t("Antisepsie avant anesthésie", "Antisepsis before anaesthesia"), got: painted ? 10 : 0, max: 10 });
    items.push({ label: t("Anesthésie locale", "Local anaesthesia"), got: anest ? 10 : 0, max: 10, tip: anest ? undefined : t("Lidocaïne 1 % par les berges, en aspirant avant d'injecter.", "1% lidocaine through the edges, aspirating before injecting.") });
    const checks = stitches.map(stitchChecks);
    const quality = checks.length ? checks.filter((c) => c.okBite && c.okSkew && c.okSym).length / checks.length : 0;
    items.push({ label: t("Qualité des points (distance, perpendicularité, symétrie)", "Stitch quality (distance, perpendicularity, symmetry)"), got: Math.round(quality * 35), max: 35, tip: quality < 1 ? t("Chaque point : 3–5 mm des berges, perpendiculaire, symétrique.", "Each stitch: 3–5 mm from the edges, perpendicular, symmetric.") : undefined });
    const goodSpacing = spacings.length ? spacings.filter((d) => d >= 5 && d <= 10).length / spacings.length : 0;
    items.push({ label: t("Espacement régulier (5 à 10 mm)", "Even spacing (5–10 mm)"), got: Math.round(goodSpacing * 15), max: 15, tip: goodSpacing < 1 ? t("Espacez les points d'environ 1 cm (5 à 10 mm).", "Space stitches about 1 cm apart (5–10 mm).") : undefined });
    const first = sorted[0];
    const last = sorted.at(-1);
    const covered = !!first && !!last && (first.a.x + first.b.x) / 2 - X0 <= 7 * MM && X1 - (last.a.x + last.b.x) / 2 <= 7 * MM && stitches.length >= 5;
    items.push({ label: t("Plaie entièrement fermée", "Wound fully closed"), got: covered ? 10 : 0, max: 10, tip: covered ? undefined : t("Il faut environ 6 à 8 points pour 6 cm, du premier au dernier millimètre.", "You need about 6–8 stitches for 6 cm, from the first to the last millimetre.") });
    items.push({ label: t("Pansement sec", "Dry dressing"), got: step === "result" ? 10 : 0, max: 10 });
    return { items, total: items.reduce((a, i) => a + i.got, 0) };
  }, [answers, painted, stitches, spacings, sorted, step, t, QUIZ]);

  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)].key);
  const restart = () => {
    setStep("prep");
    setAnswers({});
    setPainted(false);
    setStitches([]);
    setPending(null);
    setHint("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#081427]">
        {/* Stepper */}
        <ol className="flex overflow-x-auto border-b border-white/10 text-xs">
          {STEPS.map((s, k) => (
            <li key={s.key} className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-3 ${k === idx ? "bg-[#2f86ff]/15 font-semibold text-white" : k < idx ? "text-emerald-300" : "text-white/40"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${k < idx ? "bg-emerald-500/25" : k === idx ? "bg-[#2f86ff]" : "bg-white/10"}`}>{k < idx ? <Check className="h-3 w-3" /> : k + 1}</span>
              {t(s.label, s.en)}
            </li>
          ))}
        </ol>

        {/* Skin pad */}
        <div className="relative bg-[radial-gradient(ellipse_at_center,#1a2c4d,#081427)] p-4">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={`mx-auto block w-full max-w-[720px] select-none rounded-xl ${step === "suture" ? "cursor-crosshair" : ""}`} onClick={onClick} role="img" aria-label={t("Plaie à suturer", "Wound to suture")}>
            <defs>
              <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e9b896" />
                <stop offset="1" stopColor="#d49a76" />
              </linearGradient>
              <radialGradient id="iodine" cx="50%" cy="50%" r="50%">
                <stop offset="0" stopColor="#8a4b12" stopOpacity="0.55" />
                <stop offset="1" stopColor="#8a4b12" stopOpacity="0" />
              </radialGradient>
              <pattern id="pores" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="4" r="0.7" fill="#b07a5a" opacity="0.35" />
                <circle cx="10" cy="10" r="0.5" fill="#b07a5a" opacity="0.3" />
              </pattern>
            </defs>
            <rect x="20" y="30" width={W - 40} height={H - 60} rx="36" fill="url(#skin)" />
            <rect x="20" y="30" width={W - 40} height={H - 60} rx="36" fill="url(#pores)" />
            {painted && <motion.ellipse cx={(X0 + X1) / 2} cy={CY} initial={{ rx: 0, ry: 0 }} animate={{ rx: 250, ry: 120 }} transition={{ duration: 1.2 }} fill="url(#iodine)" />}
            {/* Ruler */}
            <g opacity="0.7">
              {Array.from({ length: 13 }, (_, k) => (
                <g key={k}>
                  <line x1={X0 + k * 5 * MM} y1={300} x2={X0 + k * 5 * MM} y2={k % 2 === 0 ? 312 : 306} stroke="#5b3a26" strokeWidth="1" />
                  {k % 2 === 0 && <text x={X0 + k * 5 * MM} y={324} textAnchor="middle" fontSize="9" fill="#5b3a26">{k / 2} cm</text>}
                </g>
              ))}
            </g>
            {/* Wound */}
            <path d={`M${X0} ${CY} Q ${(X0 + X1) / 2} ${CY - 3} ${X1} ${CY}`} stroke="#7a1f1f" strokeWidth={GAP * 2 + (stitches.length && step !== "suture" ? -4 : 0)} strokeLinecap="round" fill="none" />
            <path d={`M${X0 + 6} ${CY} L ${X1 - 6} ${CY}`} stroke="#b3262f" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            {/* Bite guide (3–5 mm) while suturing */}
            {step === "suture" && (
              <g opacity="0.35">
                {[-1, 1].map((d) => (
                  <rect key={d} x={X0} y={d < 0 ? CY - GAP - 5 * MM : CY + GAP + 3 * MM} width={X1 - X0} height={2 * MM} fill="#ffffff" />
                ))}
              </g>
            )}
            {/* Stitches */}
            {stitches.map((s, k) => {
              const c = stitchChecks(s);
              const good = c.okBite && c.okSkew && c.okSym;
              const knotted = step !== "suture";
              return (
                <g key={k}>
                  <motion.line x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={knotted ? "#0b1d3a" : good ? "#1f6fe0" : "#f59e0b"} strokeWidth="2.6" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35 }} />
                  <circle cx={s.a.x} cy={s.a.y} r="2.6" fill="#0b1d3a" />
                  <circle cx={s.b.x} cy={s.b.y} r="2.6" fill="#0b1d3a" />
                  {knotted && (
                    <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: k * 0.08 }} style={{ transformOrigin: `${s.a.x}px ${s.a.y}px` }}>
                      <circle cx={s.a.x + 6} cy={s.a.y} r="3.5" fill="#0b1d3a" />
                      <path d={`M${s.a.x + 8} ${s.a.y} l 10 -6 M${s.a.x + 8} ${s.a.y} l 11 3`} stroke="#0b1d3a" strokeWidth="1.6" strokeLinecap="round" />
                    </motion.g>
                  )}
                </g>
              );
            })}
            {pending && <circle cx={pending.x} cy={pending.y} r="5" fill="none" stroke="#1f6fe0" strokeWidth="2"><animate attributeName="r" values="4;8;4" dur="1s" repeatCount="indefinite" /></circle>}
            {/* Dressing */}
            {(step === "result" || step === "dressing") && step === "result" && (
              <motion.rect x={X0 - 30} y={CY - 45} width={X1 - X0 + 60} height={90} rx="14" fill="#f8fafc" stroke="#e2e8f0" initial={{ opacity: 0, scaleY: 0.3 }} animate={{ opacity: 0.93, scaleY: 1 }} style={{ transformOrigin: `0 ${CY}px` }} />
            )}
          </svg>
          {step === "suture" && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
              <span>{t("Cliquez un point d'entrée sur une berge, puis la sortie en face. Bande claire = zone idéale (3–5 mm).", "Click an entry point on one edge, then the exit opposite. Light band = ideal zone (3–5 mm).")}</span>
              <span className="font-mono">{stitches.length} {t("point(s)", "stitch(es)")}</span>
            </div>
          )}
          <AnimatePresence mode="wait">
            {hint && step === "suture" && (
              <motion.p key={hint} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/85">{hint}</motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Side panel: the current step */}
      <div className="rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
        {(step === "prep" || step === "anesthesia") && (
          <Quiz
            key={step}
            quiz={QUIZ[step]}
            picked={answers[step]}
            onPick={(k) => setAnswers((a) => ({ ...a, [step]: k }))}
            onNext={next}
          />
        )}
        {step === "antisepsis" && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">{t("Antisepsie", "Antisepsis")}</h3>
            <p className="text-sm text-white/65">{t("Lavage de la plaie au sérum physiologique, puis antiseptique (povidone iodée ou chlorhexidine) du centre vers la périphérie, en laissant sécher.", "Irrigate the wound with saline, then apply antiseptic (povidone-iodine or chlorhexidine) from the centre outwards, and let it dry.")}</p>
            {!painted ? <button className="btn-primary" onClick={() => setPainted(true)}>{t("Badigeonner la peau", "Paint the skin")}</button> : <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-5 w-5" /> {t("Peau préparée, champ stérile en place.", "Skin prepped, sterile drape in place.")}</p>}
            <button className="btn-ghost w-full" disabled={!painted} onClick={next}>{t("Continuer", "Continue")} <ArrowRight className="h-4 w-4" /></button>
          </div>
        )}
        {step === "suture" && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">{t("Points simples", "Simple interrupted stitches")}</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>• {t("Entrée et sortie à 3–5 mm des berges", "Entry and exit 3–5 mm from the edges")}</li>
              <li>• {t("Aiguille perpendiculaire à la peau et à la plaie", "Needle perpendicular to the skin and the wound")}</li>
              <li>• {t("Même quantité de tissu des deux côtés", "Same amount of tissue on both sides")}</li>
              <li>• {t("Un point tous les 5 à 10 mm, d'un bout à l'autre", "One stitch every 5–10 mm, end to end")}</li>
            </ul>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost text-xs" disabled={!stitches.length && !pending} onClick={() => { if (pending) setPending(null); else setStitches((v) => v.slice(0, -1)); setHint(""); }}><RotateCcw className="h-4 w-4" /> {t("Annuler", "Undo")}</button>
              <button className="btn-primary text-xs" disabled={stitches.length < 3} onClick={next}>{t("Faire les nœuds", "Tie the knots")}</button>
            </div>
          </div>
        )}
        {step === "knots" && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">{t("Nœuds", "Knots")}</h3>
            <p className="text-sm text-white/65">{t("Nœuds chirurgicaux à la pince (un double puis deux simples en sens alterné), placés sur le côté de la plaie, sans serrer : les berges doivent juste s'affronter, légèrement éversées.", "Instrument-tied surgical knots (one double then two single throws in alternating directions), placed to the side of the wound, not too tight: the edges should just meet, slightly everted.")}</p>
            <button className="btn-primary w-full" onClick={next}>{t("Nœuds faits", "Knots done")} <ArrowRight className="h-4 w-4" /></button>
          </div>
        )}
        {step === "dressing" && (
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold">{t("Pansement et consignes", "Dressing and advice")}</h3>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>• {t("Pansement sec, à refaire si souillé", "Dry dressing, change if soiled")}</li>
              <li>• {t("Vérifier la vaccination antitétanique", "Check tetanus vaccination")}</li>
              <li>• {t("Ablation des fils à J10–J14 (membre) ; J5 au visage", "Remove sutures at day 10–14 (limb); day 5 on the face")}</li>
              <li>• {t("Consulter si rougeur, chaleur, écoulement ou fièvre", "Return if redness, warmth, discharge or fever")}</li>
            </ul>
            <button className="btn-primary w-full" onClick={next}>{t("Poser le pansement et voir le bilan", "Apply the dressing and see the results")}</button>
          </div>
        )}
        {step === "result" && (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <h3 className="font-display text-xl font-bold">{t("Bilan de l'atelier", "Workshop results")}</h3>
              <p className="font-display text-4xl font-bold">{score.total}<span className="text-base text-white/50">/100</span></p>
            </div>
            <ul className="space-y-2.5">
              {score.items.map((i) => (
                <li key={i.label} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-white/80">{i.label}</span>
                    <span className="font-mono text-white/60">{i.got}/{i.max}</span>
                  </div>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.span className={`block h-full rounded-full ${i.got === i.max ? "bg-emerald-400" : "bg-amber-400"}`} initial={{ width: 0 }} animate={{ width: `${(i.got / i.max) * 100}%` }} transition={{ duration: 0.8 }} />
                  </span>
                  {i.tip && <p className="mt-1 text-xs text-amber-200/90">{i.tip}</p>}
                </li>
              ))}
            </ul>
            <button className="btn-ghost w-full" onClick={restart}><RotateCcw className="h-4 w-4" /> {t("Recommencer", "Start again")}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Quiz({ quiz, picked, onPick, onNext }: { quiz: { q: string; options: { t: string; ok: boolean; why: string }[] }; picked?: number; onPick: (k: number) => void; onNext: () => void }) {
  const t = useT();
  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold leading-snug">{quiz.q}</h3>
      <div className="space-y-2">
        {quiz.options.map((o, k) => {
          const shown = picked !== undefined;
          const mine = picked === k;
          return (
            <button key={o.t} disabled={shown} onClick={() => onPick(k)} className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${shown ? (o.ok ? "border-emerald-400/60 bg-emerald-400/10" : mine ? "border-red-400/60 bg-red-400/10" : "border-white/10 opacity-60") : "border-white/15 hover:border-[#2f86ff] hover:bg-[#2f86ff]/10"}`}>
              <span className="flex items-start gap-2">
                {shown && (o.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : mine ? <X className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /> : <span className="w-4" />)}
                <span>
                  {o.t}
                  {shown && (o.ok || mine) && <span className="mt-1 block text-xs text-white/60">{o.why}</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {picked !== undefined && !quiz.options[picked].ok && <p className="flex items-center gap-1.5 text-xs text-amber-200"><AlertTriangle className="h-4 w-4" /> {t("Réponse comptée comme fausse dans le bilan.", "Answer counted as wrong in the results.")}</p>}
      <button className="btn-primary w-full" disabled={picked === undefined} onClick={onNext}>{t("Continuer", "Continue")} <ArrowRight className="h-4 w-4" /></button>
    </div>
  );
}
