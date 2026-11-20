"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight, Books, Quotes, Brain, ChartBar, ClipboardCheck, FlaskConical, LockSimple, MapPin, MessagesSquare, ShieldCheck, Stethoscope, UserCheck, ClockCounterClockwise,
} from "./home-icons";

const ease = [0.22, 1, 0.36, 1] as const;

// ───────────────────────── Case deck (« Des cas qui ressemblent à vos stages ») ─────────────────────────

export interface DeckCase {
  title: string;
  specialty: string;
  level: string;
  setting: string;
  patient: string;
  complaint: string;
}

export function CaseDeck({ cases }: { cases: DeckCase[] }) {
  const tr = useT();
  const reduce = !!useReducedMotion();
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  useEffect(() => {
    if (reduce || hover) return;
    const t = setInterval(() => setI((v) => (v + 1) % cases.length), 3800);
    return () => clearInterval(t);
  }, [cases.length, reduce, hover]);

  const order = [0, 1, 2].map((k) => cases[(i + k) % cases.length]);

  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="relative mx-auto h-[360px] max-w-md sm:h-[340px]">
        <AnimatePresence initial={false}>
          {order.map((c, k) => (
            <motion.article
              key={c.title}
              layout
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: k === 0 ? 1 : 0.7 - k * 0.2, y: k * 18, scale: 1 - k * 0.05, zIndex: 3 - k }}
              exit={{ opacity: 0, x: -120, rotate: -6, transition: { duration: 0.45 } }}
              transition={{ duration: 0.6, ease }}
              className="absolute inset-x-0 top-0 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f1f3d] to-[#091428] p-6 text-white shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]"
            >
              <div className={`transition-opacity duration-300 ${k === 0 ? "opacity-100" : "opacity-0"}`}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="rounded-full bg-[#2f86ff]/20 px-2.5 py-1 font-medium text-[#8cc0ff]">{c.specialty}</span>
                <span className="text-white/50">{c.level}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold leading-snug">{c.title}</h3>
              <p className="mt-1 text-sm text-white/60">{c.patient}</p>
              <blockquote className="mt-4 border-l-2 border-[#38e1ff] pl-3 text-[15px] italic leading-relaxed text-white/85">{tr("«", "“")} {c.complaint} {tr("»", "”")}</blockquote>
              <p className="mt-5 flex items-center gap-1.5 text-xs text-white/55">
                <MapPin className="h-4 w-4 text-[#38e1ff]" weight="fill" /> {c.setting}
              </p>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-6 flex justify-center gap-1.5" role="tablist" aria-label={tr("Cas", "Cases")}>
        {cases.map((c, k) => (
          <button key={c.title} role="tab" aria-selected={k === i} aria-label={c.title} onClick={() => setI(k)} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-[#38e1ff]" : "w-1.5 bg-white/25 hover:bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}

// ───────────────────────── Steps timeline ─────────────────────────

const STEP_ICONS = [Books, MessagesSquare, Stethoscope, FlaskConical, Brain, ClipboardCheck, ChartBar];

export function StepsTimeline({ steps }: { steps: [string, string][] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

  return (
    <ol ref={ref} className="relative mt-14">
      {/* Track + animated fill (left on mobile, centred on desktop) */}
      <span className="absolute bottom-0 left-6 top-0 w-px bg-white/10 lg:left-1/2" aria-hidden />
      <motion.span className="absolute left-6 top-0 w-px origin-top bg-gradient-to-b from-[#2f86ff] to-[#38e1ff] lg:left-1/2" style={{ scaleY: fill, height: "100%" }} aria-hidden />

      {steps.map(([t, d], k) => {
        const Icon = STEP_ICONS[k] ?? ChartBar;
        const right = k % 2 === 1;
        return (
          <li key={t} className="relative grid grid-cols-[48px_1fr] gap-5 pb-10 last:pb-0 lg:grid-cols-[1fr_64px_1fr] lg:gap-8">
            <Step reverse={right} icon={Icon} index={k} title={t} text={d} />
          </li>
        );
      })}
    </ol>
  );
}

function Step({ reverse, icon: Icon, index, title, text }: { reverse: boolean; icon: React.ComponentType<{ className?: string; weight?: "duotone" }>; index: number; title: string; text: string }) {
  const tr = useT();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-20% 0px" });
  const card = (
    <motion.div
      initial={{ opacity: 0, x: reverse ? 40 : -40 }}
      animate={seen ? { opacity: 1, x: 0 } : undefined}
      transition={{ duration: 0.7, ease }}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[#2f86ff]/50 hover:bg-white/[0.06]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6fb1ff]">{tr("Étape", "Step")} {index + 1}</p>
      <h3 className="mt-2 font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-1.5 text-[15px] leading-relaxed text-white/65">{text}</p>
    </motion.div>
  );
  return (
    <>
      <div className={`hidden lg:block ${reverse ? "" : "lg:order-1"}`}>{reverse ? null : card}</div>
      <div ref={ref} className="relative z-10 flex justify-center lg:order-2">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={seen ? { scale: 1, opacity: 1 } : undefined}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="grid h-12 w-12 place-items-center rounded-full border border-[#2f86ff]/60 bg-[#081427] text-[#6fb1ff] shadow-[0_0_30px_rgba(47,134,255,0.35)] lg:h-16 lg:w-16"
        >
          <Icon className="h-6 w-6 lg:h-7 lg:w-7" weight="duotone" />
        </motion.span>
      </div>
      <div className="lg:order-3">{reverse ? card : <div className="lg:hidden">{card}</div>}</div>
    </>
  );
}

// ───────────────────────── Reliability ─────────────────────────

const RUBRIC: [string, string, number, number][] = [
  ["Interrogatoire", "History", 18, 20],
  ["Examen clinique", "Examination", 14, 15],
  ["Examens complémentaires", "Investigations", 12, 15],
  ["Diagnostic", "Diagnosis", 20, 20],
  ["Prise en charge", "Management", 27, 30],
];

const GUARANTEES = [
  { icon: UserCheck, title: "Patients fictifs", titleEn: "Fictional patients", text: "Aucune donnée de vrai patient : noms, âges et histoires sont inventés.", textEn: "No real patient data: names, ages and stories are invented." },
  { icon: LockSimple, title: "Diagnostic protégé", titleEn: "Protected diagnosis", text: "Le patient virtuel ne reçoit jamais le diagnostic, la grille ni les résultats.", textEn: "The virtual patient never receives the diagnosis, the rubric or the results." },
  { icon: ClockCounterClockwise, title: "Cas versionnés", titleEn: "Versioned cases", text: "Chaque consultation reste liée à la version exacte du cas corrigé.", textEn: "Every consultation stays tied to the exact version of the case it was scored on." },
  { icon: ShieldCheck, title: "Relecture experte", titleEn: "Expert review", text: "Un cas n'est publié qu'après relecture nominative par un clinicien.", textEn: "A case is only published after a named clinician has reviewed it." },
];

export function ReliabilityPanel() {
  const tr = useT();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.4 });
  const total = RUBRIC.reduce((a, r) => a + r[2], 0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let v = 0;
    const t = setInterval(() => {
      v += 2;
      setN(Math.min(total, v));
      if (v >= total) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [seen, total]);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
      {/* Animated score sheet — the same breakdown a student gets after each case */}
      <div ref={ref} className="rounded-2xl border border-white/10 bg-[#081427] p-6 shadow-[0_40px_80px_-40px_rgba(10,91,224,0.6)] sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{tr("Compte rendu de correction", "Scoring report")}</p>
            <p className="mt-1 font-semibold text-white">{tr("Douleur thoracique", "Chest pain")} · Mourad B.</p>
          </div>
          <p className="font-display text-5xl font-bold text-white">
            {n}
            <span className="text-lg font-medium text-white/50">/100</span>
          </p>
        </div>
        <ul className="mt-5 space-y-4">
          {RUBRIC.map(([k, kEn, got, max], j) => (
            <li key={k}>
              <div className="flex justify-between text-sm">
                <span className="text-white/80">{tr(k, kEn)}</span>
                <span className="font-mono text-white/60">{got}/{max}</span>
              </div>
              <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/10">
                <motion.span className="block h-full rounded-full bg-gradient-to-r from-[#2f86ff] to-[#38e1ff]" initial={{ width: 0 }} animate={seen ? { width: `${(got / max) * 100}%` } : undefined} transition={{ delay: 0.2 + j * 0.15, duration: 1, ease }} />
              </span>
            </li>
          ))}
        </ul>
        <motion.p initial={{ opacity: 0 }} animate={seen ? { opacity: 1 } : undefined} transition={{ delay: 1.4 }} className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {tr("Critère manqué : « Demander un ECG dans les 10 minutes » (−3 points).", "Missed criterion: \"Order an ECG within 10 minutes\" (−3 points).")}
        </motion.p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUARANTEES.map((g, j) => (
          <motion.div key={g.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10% 0px" }} transition={{ delay: j * 0.1, duration: 0.6, ease }} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-[#2f86ff]/50">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#2f86ff]/15 text-[#6fb1ff] transition group-hover:bg-[#2f86ff]/25">
              <g.icon className="h-6 w-6" weight="duotone" />
            </span>
            <h3 className="mt-4 font-semibold text-white">{tr(g.title, g.titleEn)}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">{tr(g.text, g.textEn)}</p>
          </motion.div>
        ))}
        <Link href="/features" className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1f7bff] to-[#0a5be0] p-6 font-semibold text-white transition hover:brightness-110 sm:col-span-2">
          {tr("Comment la note est calculée", "How the score is calculated")} <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}

// ───────────────────────── Teachers' voices ─────────────────────────

const VOICES = [
  { q: "Nos externes ont besoin de bien plus d'entraînement à l'interrogatoire que ce que nos services peuvent offrir.", qEn: "Our students need far more history-taking practice than our wards can offer.", who: "Responsable des ECOS", whoEn: "OSCE lead", where: "Faculté de médecine", whereEn: "Faculty of medicine", initials: "RE", topic: "Interrogatoire", topicEn: "History taking" },
  { q: "Si la notation ne suit pas une grille que nous avons validée, nous ne pouvons pas l'utiliser pour l'évaluation formative.", qEn: "If scoring doesn't follow a rubric we have validated, we can't use it for formative assessment.", who: "Coordinatrice pédagogique", whoEn: "Teaching coordinator", where: "Département de médecine", whereEn: "Department of medicine", initials: "CP", topic: "Évaluation", topicEn: "Assessment" },
  { q: "Lire la transcription me permet de commenter la façon dont l'étudiant raisonne, pas seulement sa conclusion.", qEn: "Reading the transcript lets me comment on how the student reasons, not just their conclusion.", who: "Maître-assistant", whoEn: "Assistant professor", where: "Service des urgences", whereEn: "Emergency department", initials: "MA", topic: "Raisonnement", topicEn: "Reasoning" },
];

export function TeacherVoices() {
  const tr = useT();
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {VOICES.map((v, k) => (
        <motion.figure
          key={v.who}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ delay: k * 0.12, duration: 0.7, ease }}
          className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-7 transition duration-300 hover:-translate-y-1.5 hover:border-[#2f86ff]/60`}
        >
          <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[#2f86ff] to-[#38e1ff] transition-transform duration-500 group-hover:scale-x-100" />
          <div className="flex items-center justify-between">
            <Quotes className="h-10 w-10 text-[#2f86ff]/70" weight="fill" />
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/55">{tr(v.topic, v.topicEn)}</span>
          </div>
          <blockquote className="mt-5 flex-1 text-[17px] leading-relaxed text-white/90">{tr(v.q, v.qEn)}</blockquote>
          <figcaption className="mt-7 flex items-center gap-3 border-t border-white/10 pt-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2f86ff] to-[#0a4fcc] text-sm font-bold text-white">{v.initials}</span>
            <span>
              <span className="block text-sm font-semibold text-white">{tr(v.who, v.whoEn)}</span>
              <span className="block text-xs text-white/50">{tr(v.where, v.whereEn)}</span>
            </span>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  );
}
