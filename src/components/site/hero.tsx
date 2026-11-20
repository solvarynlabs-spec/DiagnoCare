"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ChartBar, Check, HandPointing, PlayCircle, Stethoscope, UserRound } from "@/components/icons";
import { Photo } from "@/components/motion";
import { useLang, useT } from "@/lib/i18n/client";

/**
 * Homepage hero: a real bedside photograph (Unsplash, verified) with the product's own UI
 * layered on top and animated — exam hotspots, live monitor, a looping patient dialogue.
 * Everything shown mirrors a real screen of the consultation room.
 */

// Body points on the (horizontally mirrored) bedMan photo, in % of the 4:3 frame.
const SPOTS = {
  fr: [
    { x: 63, y: 40, label: "Auscultation cardiaque", result: "Tachycardie régulière, pas de souffle.", abnormal: true },
    { x: 50, y: 62, label: "Prise de tension", result: "146/91 mmHg aux deux bras, sans asymétrie.", abnormal: true },
    { x: 84, y: 57, label: "Palpation abdominale", result: "Abdomen souple, indolore.", abnormal: false },
  ],
  en: [
    { x: 63, y: 40, label: "Heart auscultation", result: "Regular tachycardia, no murmur.", abnormal: true },
    { x: 50, y: 62, label: "Blood pressure", result: "146/91 mmHg in both arms, no asymmetry.", abnormal: true },
    { x: 84, y: 57, label: "Abdominal palpation", result: "Soft, non-tender abdomen.", abnormal: false },
  ],
};

const DIALOGUE = {
  fr: [
    ["Où avez-vous mal exactement ?", "Là, au milieu de la poitrine… comme un poids, docteur."],
    ["Est-ce que la douleur irradie ?", "Oui, ça descend dans le bras gauche, et un peu dans la mâchoire."],
    ["Vous fumez ?", "Un paquet par jour depuis trente ans… wallah je vais arrêter."],
  ],
  en: [
    ["Where exactly does it hurt?", "Here, in the middle of my chest… like a weight, doctor."],
    ["Does the pain spread anywhere?", "Yes, down my left arm, and a bit into my jaw."],
    ["Do you smoke?", "A pack a day for thirty years… I swear I'll stop."],
  ],
};

const HEADLINE = { fr: ["Votre", "prochain", "patient"], en: ["Your", "next", "patient"] };
const ACCENT = { fr: ["vous", "attend."], en: ["is", "waiting."] };

const FEATURES = [
  { icon: UserRound, title: "Patient réaliste", titleEn: "Realistic patient", text: "14 cas cliniques algériens", textEn: "14 Algerian clinical cases" },
  { icon: HandPointing, title: "Examen interactif", titleEn: "Interactive exam", text: "35 gestes, 34 examens", textEn: "35 manoeuvres, 34 tests" },
  { icon: ChartBar, title: "Note détaillée", titleEn: "Detailed score", text: "Grille validée par des enseignants", textEn: "Teacher-validated rubric" },
];

function useTicker(ms: number, n: number, enabled = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), ms);
    return () => clearInterval(t);
  }, [ms, n, enabled]);
  return i;
}

export function Hero() {
  const t = useT();
  const lang = useLang();
  const reduce = !!useReducedMotion();
  const spot = useTicker(4200, SPOTS.fr.length, !reduce);
  const line = useTicker(4800, DIALOGUE.fr.length, !reduce);
  const [hr, setHr] = useState(104);
  const [phase, setPhase] = useState<"ask" | "typing" | "answer">("answer");

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setHr(101 + Math.round(Math.random() * 6)), 1600);
    return () => clearInterval(t);
  }, [reduce]);

  // Dialogue rhythm: question → patient typing → answer.
  useEffect(() => {
    if (reduce) return;
    setPhase("ask");
    const a = setTimeout(() => setPhase("typing"), 900);
    const b = setTimeout(() => setPhase("answer"), 2100);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [line, reduce]);

  // Pointer parallax for the floating UI.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });
  const near = { x: useTransform(sx, (v) => v * 14), y: useTransform(sy, (v) => v * 10) };
  const far = { x: useTransform(sx, (v) => v * -8), y: useTransform(sy, (v) => v * -6) };
  const bg = { x: useTransform(sx, (v) => v * -10), y: useTransform(sy, (v) => v * -6) };

  const s = SPOTS[lang][spot];
  const [q, a] = DIALOGUE[lang][line];
  const word = (i: number) => ({ initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.15 + i * 0.09, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } });

  return (
    <section
      className="relative isolate overflow-hidden bg-[#050c1a] text-white"
      onPointerMove={(e) => {
        if (reduce) return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
    >
      {/* ── Photo stage ── */}
      <motion.div className="absolute inset-y-0 right-0 -z-10 hidden aspect-[4/3] h-full lg:block" style={bg}>
        <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1.02 }} transition={{ duration: reduce ? 0 : 14, ease: "easeOut" }}>
          <Photo photo="bedMan" className="absolute inset-0 -scale-x-100" priority sizes="80vw" w={2000} />
        </motion.div>

        {/* Exam hotspot cycling over the body */}
        <AnimatePresence mode="wait">
          <motion.div key={spot} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.45 }}>
            <span className="absolute -left-12 -top-12 h-24 w-24 rounded-full border-2 border-[#38e1ff]/60 motion-safe:animate-ping" />
            <span className="absolute -left-8 -top-8 h-16 w-16 rounded-full border-2 border-[#38e1ff] bg-[#38e1ff]/15 shadow-[0_0_40px_rgba(56,225,255,0.65)]" />
            <span className="absolute -left-1.5 -top-1.5 h-3 w-3 rounded-full bg-white" />
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className={`absolute top-[-18px] w-[250px] ${s.x > 70 ? "right-12" : "left-12"} rounded-xl border border-white/10 bg-[#081427]/90 p-3 shadow-2xl backdrop-blur-md`}>
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <Stethoscope className="h-4 w-4 text-[#6fb1ff]" /> {s.label}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] ${s.abnormal ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>{s.abnormal ? t("Anormal", "Abnormal") : "Normal"}</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{s.result}</p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Mobile: photo as a dimmed backdrop */}
      <Photo photo="bedMan" className="absolute inset-0 -z-10 -scale-x-100 opacity-35 lg:hidden" priority sizes="100vw" w={1200} />

      {/* Legibility gradients + glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#050c1a] via-[#050c1a]/90 via-45% to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#050c1a] via-transparent to-[#050c1a]/70" />
      <motion.div className="pointer-events-none absolute -left-40 top-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-[#0a5be0]/25 blur-[120px]" animate={reduce ? undefined : { opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />

      <div className="mx-auto grid min-h-[100svh] max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 lg:min-h-[860px] lg:grid-cols-[minmax(0,620px)_1fr]">
        <div>

          <h1 className="font-display text-[3rem] font-bold leading-[1.0] tracking-[-0.03em] sm:text-[4.2rem] lg:text-[5rem]">
            <span className="sr-only">{t("Votre prochain patient vous attend.", "Your next patient is waiting.")}</span>
            <span aria-hidden>
              {HEADLINE[lang].map((w, i) => (
                <span key={w} className="inline-block overflow-hidden pb-2 align-bottom">
                  <motion.span className="inline-block" {...word(i)}>{w}&nbsp;</motion.span>
                </span>
              ))}
              <br className="hidden sm:block" />
              {ACCENT[lang].map((w, i) => (
                <span key={w} className="relative inline-block overflow-hidden pb-2 align-bottom">
                  <motion.span className="inline-block bg-gradient-to-r from-[#3d9bff] to-[#38e1ff] bg-clip-text text-transparent" {...word(HEADLINE[lang].length + i)}>{w}&nbsp;</motion.span>
                </span>
              ))}
            </span>
          </h1>
          <motion.svg viewBox="0 0 320 24" className="-mt-1 h-6 w-[260px] sm:w-[340px]" aria-hidden>
            <motion.path d="M2 14 H90 l10 -10 l12 18 l10 -14 l8 6 H318" fill="none" stroke="#38e1ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.9, duration: 1.4, ease: "easeInOut" }} />
          </motion.svg>

          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.7 }} className="mt-5 max-w-xl text-lg font-light leading-relaxed text-white/75">
            {t("Interrogez un patient virtuel, examinez-le, demandez les bons examens et posez votre diagnostic. Vous recevez ensuite une note détaillée, critère par critère.", "Interview a virtual patient, examine them, order the right tests and make your diagnosis. Then get a detailed score, criterion by criterion.")}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }} className="mt-9 flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary group relative overflow-hidden px-6 py-3.5 text-[15px] font-semibold">
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent motion-safe:animate-[shimmer_3.2s_ease-in-out_infinite]" />
              {t("Créer un compte gratuit", "Create a free account")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#demo" className="btn-glass group">
              <PlayCircle className="h-5 w-5 text-[#6fb1ff] transition-transform group-hover:scale-110" weight="fill" /> {t("Essayer la démo", "Try the demo")}
            </Link>
          </motion.div>

          <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 1.15 } } }} className="mt-12 grid max-w-2xl gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
            {FEATURES.map((f) => (
              <motion.li key={f.title} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-3 sm:px-5 sm:first:pl-0">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#2f86ff]/60 text-[#5aaaff]">
                  <f.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{t(f.title, f.titleEn)}</span>
                  <span className="block text-xs text-white/55">{t(f.text, f.textEn)}</span>
                </span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }} className="mt-8 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-white/50">
            {[t("5 simulations gratuites / mois", "5 free simulations / month"), t("Sans carte bancaire", "No credit card"), t("Externat, internat, ECOS", "Clinical years, internship, OSCE")].map((x) => (
              <li key={x} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> {x}</li>
            ))}
          </motion.ul>
        </div>

        {/* ── Floating product UI ── */}
        <div className="relative hidden h-full lg:block">
          {/* Monitor */}
          <motion.div style={far} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="absolute right-0 top-[8%] w-[270px] rounded-2xl border border-white/10 bg-[#050c1a]/85 p-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/45">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> {t("Moniteur · simulé", "Monitor · simulated")}</span>
              <span className="font-mono">02:10</span>
            </div>
            <svg viewBox="0 0 300 50" className="my-2 h-10 w-full" aria-hidden>
              <path d="M0 25 h40 l6 -4 l6 4 h10 l4 10 l6 -34 l6 32 l4 -8 h20 l8 -6 l8 6 h40 l6 -4 l6 4 h10 l4 10 l6 -34 l6 32 l4 -8 h20 l8 -6 l8 6 h56" fill="none" stroke="#34D399" strokeWidth="2" strokeDasharray="600" style={{ animation: reduce ? undefined : "pulseline 1.3s linear infinite" }} />
            </svg>
            <div className="grid grid-cols-3 gap-1.5 text-center">
              {[[t("FC", "HR"), hr, "#34D399", true], [t("PA", "BP"), "146/91", "#F87171", false], ["SpO₂", "95", "#38BDF8", false]].map(([k, v, c, alarm]) => (
                <div key={k as string} className={`rounded-lg py-1.5 ${alarm ? "bg-red-500/15 ring-1 ring-red-500/40" : "bg-white/[0.04]"}`}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: c as string }}>{k}</p>
                  <motion.p key={String(v)} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="font-mono text-lg font-bold leading-tight" style={{ color: c as string }}>{v}</motion.p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dialogue */}
          <motion.div style={near} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.8 }} className="absolute bottom-[6%] right-0 w-[350px] rounded-2xl border border-white/10 bg-white p-4 text-[#0b132b] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#1f6fe0]/10 text-[#1f6fe0]"><UserRound className="h-5 w-5" weight="fill" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Mourad B., {t("58 ans", "58")}</p>
                <p className="text-xs text-slate-500">{t("Urgences · douleur thoracique", "Emergency · chest pain")}</p>
              </div>
              <span className="flex h-5 items-end gap-[2px]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span key={i} className="w-[3px] rounded-full bg-[#1f6fe0]" animate={phase === "answer" && !reduce ? { height: [4, 14, 6, 18, 4] } : { height: 4 }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.1 }} />
                ))}
              </span>
            </div>
            <div className="min-h-[118px] space-y-2 pt-3 text-[13px]">
              <AnimatePresence mode="popLayout">
                <motion.p key={`q${line}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-[#1f6fe0] px-3 py-1.5 text-white">
                  {q}
                </motion.p>
                {phase === "typing" && (
                  <motion.span key={`t${line}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-fit gap-1 rounded-2xl bg-slate-100 px-3 py-2.5">
                    {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 120}ms` }} />)}
                  </motion.span>
                )}
                {phase === "answer" && (
                  <motion.p key={`a${line}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-1.5">
                    {a}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.a href="#demo" aria-label={t("Voir la démo", "See the demo")} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 lg:block">
        <span className="flex h-9 w-6 justify-center rounded-full border border-white/30 pt-1.5">
          <motion.span className="h-2 w-1 rounded-full bg-white/70" animate={reduce ? undefined : { y: [0, 10, 0], opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }} />
        </span>
      </motion.a>
    </section>
  );
}
