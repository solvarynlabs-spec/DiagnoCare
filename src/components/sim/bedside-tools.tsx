"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle as Warning, Check, Drop, Loader2, Wind } from "@/components/icons";
import { useT } from "@/lib/i18n/client";

/**
 * Interactive bedside instruments used in the consultation room and in the workshops:
 * an aneroid sphygmomanometer with Korotkoff sounds, a capillary glucose meter, and an
 * IV drip set. Sounds are synthesised with WebAudio (no files to download).
 */

// ───────────────────────── Audio ─────────────────────────

let ctx: AudioContext | null = null;
function tick(volume = 0.25) {
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 70;
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.1);
  } catch {}
}

// ───────────────────────── Aneroid gauge ─────────────────────────

export function Gauge({ value, size = 220 }: { value: number; size?: number }) {
  const angle = -225 + (Math.min(300, Math.max(0, value)) / 300) * 270; // 0 → -225°, 300 → +45°
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-label={`${Math.round(value)} mmHg`} role="img">
      <defs>
        <radialGradient id="gface" cx="50%" cy="40%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dfe6ef" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="#1c2b44" />
      <circle cx="100" cy="100" r="88" fill="url(#gface)" />
      {Array.from({ length: 31 }, (_, k) => {
        const a = ((-225 + k * 9) * Math.PI) / 180;
        const major = k % 5 === 0;
        const r1 = major ? 68 : 74;
        return <line key={k} x1={100 + Math.cos(a) * r1} y1={100 + Math.sin(a) * r1} x2={100 + Math.cos(a) * 82} y2={100 + Math.sin(a) * 82} stroke="#0b132b" strokeWidth={major ? 2.2 : 1} />;
      })}
      {Array.from({ length: 7 }, (_, k) => {
        const a = ((-225 + k * 45) * Math.PI) / 180;
        return <text key={k} x={100 + Math.cos(a) * 55} y={100 + Math.sin(a) * 55 + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0b132b">{k * 50}</text>;
      })}
      <text x="100" y="140" textAnchor="middle" fontSize="8" fill="#64748b">mmHg</text>
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform 120ms linear" }}>
        <line x1="100" y1="100" x2="178" y2="100" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="6" fill="#0b132b" />
    </svg>
  );
}

// ───────────────────────── Blood pressure ─────────────────────────

type BPPhase = "idle" | "inflating" | "deflating" | "done";

export function BloodPressureTool({ sbp, dbp, hr, onDone, compact }: { sbp: number; dbp: number; hr: number; onDone?: (read: { sys: number | null; dia: number | null }) => void; compact?: boolean }) {
  const t = useT();
  const [p, setP] = useState(0);
  const [phase, setPhase] = useState<BPPhase>("idle");
  const [sys, setSys] = useState<number | null>(null);
  const [dia, setDia] = useState<number | null>(null);
  const [beat, setBeat] = useState(false);
  const [sound, setSound] = useState(true);
  const pRef = useRef(0);
  pRef.current = p;

  // Pump up to 200 mmHg, then deflate at ~3 mmHg per heartbeat-ish tick.
  useEffect(() => {
    if (phase === "inflating") {
      const t = setInterval(() => setP((v) => (v >= 200 ? (setPhase("deflating"), 200) : v + 8)), 40);
      return () => clearInterval(t);
    }
    if (phase === "deflating") {
      const t = setInterval(() => {
        setP((v) => {
          const n = v - 0.9;
          if (n <= Math.max(0, dbp - 25)) {
            setPhase("done");
            return n;
          }
          return n;
        });
      }, 50);
      return () => clearInterval(t);
    }
  }, [phase, dbp]);

  // Korotkoff sounds: one per heartbeat while cuff pressure is between diastolic and systolic.
  useEffect(() => {
    if (phase !== "deflating") return;
    const period = 60000 / Math.max(40, hr);
    const t = setInterval(() => {
      const cur = pRef.current;
      if (cur <= sbp && cur >= dbp) {
        if (sound) tick(cur > dbp + 8 ? 0.3 : 0.12);
        setBeat(true);
        setTimeout(() => setBeat(false), 120);
      }
    }, period);
    return () => clearInterval(t);
  }, [phase, sbp, dbp, hr, sound]);

  useEffect(() => {
    if (phase === "done") onDone?.({ sys, dia });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const reset = () => {
    setP(0);
    setSys(null);
    setDia(null);
    setPhase("inflating");
  };
  const errS = sys !== null ? Math.abs(sys - sbp) : null;
  const errD = dia !== null ? Math.abs(dia - dbp) : null;

  return (
    <div className={`grid items-center gap-5 ${compact ? "" : "sm:grid-cols-[auto_1fr]"}`}>
      <div className="relative mx-auto">
        <Gauge value={p} size={compact ? 180 : 220} />
        <AnimatePresence>{beat && <motion.span initial={{ opacity: 0.9, scale: 0.8 }} animate={{ opacity: 0, scale: 1.6 }} exit={{ opacity: 0 }} className="absolute inset-0 rounded-full border-4 border-[#38e1ff]" />}</AnimatePresence>
      </div>
      <div className="space-y-3 text-sm">
        <p className="text-white/70">
          {phase === "idle" && t("Placez le brassard 2 cm au-dessus du pli du coude, le stéthoscope sur l'artère humérale, puis gonflez.", "Place the cuff 2 cm above the elbow crease and the stethoscope over the brachial artery, then inflate.")}
          {phase === "inflating" && t("Gonflage… au-delà de la disparition du pouls radial.", "Inflating… past the point where the radial pulse disappears.")}
          {phase === "deflating" && t("Dégonflez lentement : écoutez les bruits de Korotkoff.", "Deflate slowly: listen for the Korotkoff sounds.")}
          {phase === "done" && t("Mesure terminée.", "Measurement complete.")}
        </p>
        <div className="flex flex-wrap gap-2">
          {phase === "idle" || phase === "done" ? (
            <button className="btn-primary px-4 py-2 text-sm" onClick={reset}>{phase === "done" ? t("Nouvelle mesure", "New measurement") : t("Gonfler le brassard", "Inflate the cuff")}</button>
          ) : (
            <>
              <button className="btn-primary px-4 py-2 text-sm disabled:opacity-40" disabled={phase !== "deflating" || sys !== null} onClick={() => setSys(Math.round(p))}>{t("1ᵉʳ bruit (systolique)", "First sound (systolic)")}</button>
              <button className="btn-primary px-4 py-2 text-sm disabled:opacity-40" disabled={phase !== "deflating" || sys === null || dia !== null} onClick={() => setDia(Math.round(p))}>{t("Dernier bruit (diastolique)", "Last sound (diastolic)")}</button>
            </>
          )}
          <label className="flex items-center gap-1.5 text-xs text-white/60">
            <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="accent-[#1f6fe0]" /> Son
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-white/45">{t("Systolique lue", "Systolic read")}</p><p className="text-lg font-bold text-white">{sys ?? "—"}</p></div>
          <div className="rounded-lg bg-white/5 px-3 py-2"><p className="text-[10px] uppercase text-white/45">{t("Diastolique lue", "Diastolic read")}</p><p className="text-lg font-bold text-white">{dia ?? "—"}</p></div>
        </div>
        {phase === "done" && (
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex items-start gap-2 rounded-lg px-3 py-2 ${errS !== null && errD !== null && errS <= 4 && errD <= 4 ? "bg-emerald-500/15 text-emerald-100" : "bg-amber-500/15 text-amber-100"}`}>
            {errS !== null && errD !== null && errS <= 4 && errD <= 4 ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : <Warning className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {t("Référence", "Reference")} : <b>{sbp}/{dbp} mmHg</b>.{" "}
              {errS === null || errD === null ? t("Il manque une lecture : appuyez au premier puis au dernier bruit.", "A reading is missing: press at the first then the last sound.") : `${t("Écart", "Difference")} : ${errS} / ${errD} mmHg${errS <= 4 && errD <= 4 ? t(" — mesure fiable.", " — reliable measurement.") : t(" — visez moins de 4 mmHg d'écart.", " — aim for less than 4 mmHg difference.")}`}
            </span>
          </motion.p>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Glucose meter ─────────────────────────

type GlucoStep = 0 | 1 | 2 | 3 | 4;
const GSTEPS: [string, string][] = [["Lavage des mains, gants", "Wash hands, gloves on"], ["Désinfecter et laisser sécher", "Disinfect and let dry"], ["Piquer sur le côté du doigt", "Prick the side of the finger"], ["Déposer la goutte sur la bandelette", "Apply the drop to the strip"]];

export function GlucoseTool({ measure }: { measure: () => Promise<string> }) {
  const t = useT();
  const [step, setStep] = useState<GlucoStep>(0);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function deposit() {
    setStep(4);
    setErr("");
    const pending = measure().catch((e: Error) => {
      setErr(e.message);
      return null;
    });
    for (let k = 5; k > 0; k--) {
      setCount(k);
      await new Promise((r) => setTimeout(r, 650));
    }
    setCount(0);
    setResult(await pending);
  }
  const value = result?.match(/\d+[.,]\d+\s*g\/L|\d+[.,]?\d*\s*mmol\/L/)?.[0] ?? null;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      {/* Meter */}
      <div className="relative mx-auto h-[220px] w-[140px]">
        <div className="absolute inset-x-0 top-0 h-[190px] rounded-[28px] bg-gradient-to-b from-[#e7edf5] to-[#b9c6d8] shadow-xl">
          <div className="absolute inset-x-4 top-5 grid h-[86px] place-items-center rounded-lg bg-[#9fbf9a] font-mono text-[#16301b] shadow-inner">
            {step < 4 && <span className="text-xs">{t("PRÊT", "READY")}</span>}
            {step === 4 && count > 0 && <span className="text-3xl font-bold">{count}</span>}
            {step === 4 && count === 0 && !result && !err && <Loader2 className="h-6 w-6 animate-spin" />}
            {result && <span className="px-1 text-center text-lg font-bold leading-tight">{value ?? "OK"}</span>}
            {err && <span className="text-[10px]">{t("ERREUR", "ERROR")}</span>}
          </div>
          <div className="absolute left-1/2 top-[118px] h-9 w-9 -translate-x-1/2 rounded-full bg-[#1f6fe0] shadow" />
        </div>
        <motion.div className="absolute bottom-0 left-1/2 h-12 w-5 -translate-x-1/2 rounded-b-sm bg-white shadow" animate={{ y: step >= 3 ? 0 : 18, opacity: step >= 1 ? 1 : 0.4 }}>
          <AnimatePresence>{step >= 3 && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-600" />}</AnimatePresence>
        </motion.div>
      </div>
      <div className="space-y-2 text-sm">
        <ol className="space-y-1.5">
          {GSTEPS.map(([fr, en], k) => (
            <li key={fr} className={`flex items-center gap-2 ${step > k ? "text-emerald-300" : step === k ? "text-white" : "text-white/40"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${step > k ? "bg-emerald-500/25" : "bg-white/10"}`}>{step > k ? <Check className="h-3 w-3" /> : k + 1}</span> {t(fr, en)}
            </li>
          ))}
        </ol>
        {step < 3 && (
          <button className="btn-primary mt-2 px-4 py-2 text-sm" onClick={() => setStep((s) => (s + 1) as GlucoStep)}>
            {step === 0 ? t("Fait", "Done") : step === 1 ? t("Désinfecté", "Disinfected") : t("Piquer", "Prick")} {step === 2 && <Drop className="h-4 w-4" weight="fill" />}
          </button>
        )}
        {step === 3 && <button className="btn-primary mt-2 px-4 py-2 text-sm" onClick={deposit}>{t("Déposer la goutte", "Apply the drop")}</button>}
        {result && <p className="rounded-lg bg-white/5 px-3 py-2 text-white/85">{result}</p>}
        {err && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-red-200">{err}</p>}
        {(result || err) && <button className="text-xs text-[#6fb1ff] hover:underline" onClick={() => { setStep(0); setResult(null); setErr(""); }}>{t("Recommencer", "Start again")}</button>}
      </div>
    </div>
  );
}

// ───────────────────────── IV drip ─────────────────────────

/** Drops per minute with a standard 20-drop/mL giving set. */
export const dropsPerMin = (ml: number, hours: number) => Math.round((ml * 20) / (hours * 60));

export function DripBag({ label, rate, running }: { label: string; rate: number; running: boolean }) {
  const period = rate > 0 ? Math.max(0.25, 60 / rate) : 0;
  return (
    <div className="relative mx-auto h-[230px] w-[120px]">
      <div className="absolute left-1/2 top-0 h-3 w-1 -translate-x-1/2 bg-slate-400" />
      <div className="absolute inset-x-2 top-3 h-[120px] rounded-b-[32px] rounded-t-lg border-2 border-white/70 bg-white/10 backdrop-blur">
        <div className="absolute inset-x-0 bottom-0 h-[72%] rounded-b-[30px] bg-sky-200/40" />
        <p className="absolute inset-x-1 top-4 text-center text-[10px] font-bold leading-tight text-white">{label}</p>
      </div>
      <div className="absolute left-1/2 top-[130px] h-10 w-6 -translate-x-1/2 rounded-md border-2 border-white/60 bg-white/5">
        {running && period > 0 && (
          <motion.span className="absolute left-1/2 top-0.5 h-2 w-1.5 -translate-x-1/2 rounded-full bg-sky-200" animate={{ y: [0, 24], opacity: [1, 0.2] }} transition={{ duration: Math.min(period, 1.2), repeat: Infinity, repeatDelay: Math.max(0, period - 1.2), ease: "easeIn" }} />
        )}
      </div>
      <div className="absolute left-1/2 top-[170px] h-[60px] w-[3px] -translate-x-1/2 bg-white/50" />
    </div>
  );
}

// ───────────────────────── Peak flow meter ─────────────────────────

/**
 * Peak expiratory flow: three blows, the best one counts. The reference value comes from the
 * case (first blow records the investigation); each blow varies by a few percent like in real life.
 */
export function PeakFlowTool({ measure, sex }: { measure: () => Promise<string>; sex: "F" | "M" }) {
  const t = useT();
  const [tries, setTries] = useState<number[]>([]);
  const [ref, setRef] = useState<{ value: number; text: string } | null>(null);
  const [anim, setAnim] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const MAX = 800;
  const predicted = sex === "F" ? 450 : 580;

  async function blow() {
    setBusy(true);
    setErr("");
    try {
      let r = ref;
      if (!r) {
        const text = await measure();
        const value = Number(text.match(/(\d{2,3})\s*L\s*\/\s*min/i)?.[1] ?? predicted);
        r = { value, text };
        setRef(r);
      }
      const v = Math.round(r.value * (0.92 + Math.random() * 0.08));
      setAnim(0);
      await new Promise((res) => setTimeout(res, 60));
      setAnim(v);
      setTries((t) => [...t, v]);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setTimeout(() => setBusy(false), 900);
    }
  }
  const best = tries.length ? Math.max(...tries) : null;
  const pct = best && ref ? Math.round((best / predicted) * 100) : null;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      {/* Device */}
      <div className="relative mx-auto h-[240px] w-[90px]">
        <div className="absolute inset-x-3 top-0 h-[200px] rounded-2xl border-2 border-white/40 bg-white/10 backdrop-blur">
          {[0, 200, 400, 600, 800].map((m) => (
            <span key={m} className="absolute right-1 text-[9px] text-white/60" style={{ bottom: `${(m / MAX) * 92 + 2}%` }}>{m}</span>
          ))}
          <motion.span className="absolute left-1.5 h-1.5 w-8 rounded bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" animate={{ bottom: `${(anim / MAX) * 92 + 2}%` }} transition={{ type: "spring", stiffness: 120, damping: 12 }} />
        </div>
        <div className="absolute bottom-0 left-1/2 h-10 w-8 -translate-x-1/2 rounded-b-xl bg-white/30" />
      </div>
      <div className="space-y-3 text-sm">
        <ol className="space-y-1 text-white/70">
          <li>1. {t("Debout, curseur remis à zéro.", "Standing, pointer reset to zero.")}</li>
          <li>2. {t("Inspiration maximale, lèvres serrées autour de l'embout.", "Deep breath in, lips sealed around the mouthpiece.")}</li>
          <li>3. {t("Souffler le plus fort et le plus vite possible.", "Blow as hard and fast as possible.")}</li>
        </ol>
        <button className="btn-primary px-4 py-2 text-sm disabled:opacity-40" disabled={busy || tries.length >= 3} onClick={blow}>
          <Wind className="h-4 w-4" /> {tries.length >= 3 ? t("Trois essais réalisés", "Three attempts done") : t(`Souffler (essai ${tries.length + 1}/3)`, `Blow (attempt ${tries.length + 1}/3)`)}
        </button>
        {tries.length > 0 && (
          <div className="grid grid-cols-3 gap-2 font-mono">
            {[0, 1, 2].map((k) => (
              <div key={k} className={`rounded-lg px-3 py-2 ${tries[k] === best ? "bg-[#2f86ff]/20 ring-1 ring-[#2f86ff]" : "bg-white/5"}`}>
                <p className="text-[10px] uppercase text-white/45">{t("Essai", "Attempt")} {k + 1}</p>
                <p className="text-lg font-bold">{tries[k] ?? "—"}</p>
              </div>
            ))}
          </div>
        )}
        {best !== null && pct !== null && (
          <p className={`rounded-lg px-3 py-2 ${pct < 50 ? "bg-red-500/15 text-red-100" : pct < 80 ? "bg-amber-500/15 text-amber-100" : "bg-emerald-500/15 text-emerald-100"}`}>
            {t("Meilleur DEP", "Best PEF")} : <b>{best} L/min</b>, {t("soit ≈", "≈")} {pct} % {t("de la valeur théorique", "of predicted")} ({predicted} L/min).{" "}
            {pct < 50 ? t("Crise sévère.", "Severe attack.") : pct < 80 ? t("Obstruction modérée.", "Moderate obstruction.") : t("Dans les normes.", "Within normal limits.")}
          </p>
        )}
        {err && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-red-200">{err}</p>}
      </div>
    </div>
  );
}
