"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowsClockwise, Check, Pause, PlayCircle, SpeakerHigh, SpeakerSlash, Stethoscope, Warning, X } from "./film-icons";
import { FilmMusic } from "./film-music";
import { Photo } from "@/components/motion";
import { LogoMark } from "@/components/ui";
import type { PhotoKey } from "@/lib/photos";
import { useT } from "@/lib/i18n/client";
import type { T } from "@/lib/i18n/shared";

/**
 * Promotional « film » rendered in HTML: a short story (Amina, externe en 4e année) that goes
 * from the problem — you can't practise on real patients at first — to the solution, with the
 * product's own UI animated inside the scenes. Plays when visible, pauses off-screen.
 */

type Kind = "intro" | "watch" | "never" | "night" | "question" | "brand" | "chat" | "exam" | "mistake" | "score" | "ready";
type Scene = { kind: Kind; ms: number; chapter: string; photo?: PhotoKey; mirror?: boolean; caption?: string };

const scenesFor = (t: T): Scene[] => [
  { kind: "intro", ms: 4200, chapter: "Amina", photo: "studentBooks", caption: t("Amina, 22 ans. Externe en 4e année à la faculté de médecine d'Alger.", "Amina, 22. A fourth-year medical student at the Algiers faculty of medicine.") },
  { kind: "watch", ms: 4600, chapter: t("Le stage", "The placement"), photo: "hallwayDoctors", caption: t("En stage, elle suit la visite. Elle observe, elle prend des notes…", "On placement, she follows the ward round. She watches, she takes notes…") },
  { kind: "never", ms: 5200, chapter: t("Le manque", "The gap"), photo: "bedside2", caption: t("…mais elle n'a jamais mené seule une consultation.", "…but she has never led a consultation on her own.") },
  { kind: "night", ms: 4600, chapter: t("La garde", "The night shift"), caption: t("Dans quelques mois, sa première garde. Elle sera seule face au patient.", "In a few months, her first night shift. She'll be alone with the patient.") },
  { kind: "question", ms: 3600, chapter: t("La question", "The question"), caption: t("Et si elle pouvait s'entraîner avant ?", "What if she could practise first?") },
  { kind: "brand", ms: 4000, chapter: "DiagnoCare" },
  { kind: "chat", ms: 6200, chapter: t("Interroger", "History"), caption: t("Elle interroge un patient virtuel, comme aux urgences.", "She interviews a virtual patient, just like in the ED.") },
  { kind: "exam", ms: 6000, chapter: t("Examiner", "Examine"), photo: "bedMan", mirror: true, caption: t("Elle l'examine, geste par geste.", "She examines him, step by step.") },
  { kind: "mistake", ms: 5600, chapter: t("Se tromper", "Mistakes"), caption: t("Elle se trompe… sans danger pour personne.", "She makes mistakes… with no danger to anyone.") },
  { kind: "score", ms: 5600, chapter: t("Comprendre", "Understand"), caption: t("Et elle comprend exactement ce qu'il fallait faire.", "And she understands exactly what she should have done.") },
  { kind: "ready", ms: 7000, chapter: t("Prête", "Ready"), photo: "doctorPortrait" },
];
const SCENE_MS = scenesFor((fr) => fr);

const ease = [0.22, 1, 0.36, 1] as const;
const fmt = (ms: number) => `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
const START = SCENE_MS.map((_, k) => SCENE_MS.slice(0, k).reduce((a, s) => a + s.ms, 0));
const TOTAL = SCENE_MS.reduce((a, s) => a + s.ms, 0);

export function PromoFilm() {
  const t = useT();
  const SCENES = scenesFor(t);
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [started, setStarted] = useState(false);
  const scene = SCENES[i];
  const ended = i === SCENES.length - 1;
  const running = started && playing && inView && !ended;

  // Soundtrack: off until the viewer turns it on (browsers block audio before a click).
  const music = useRef<FilmMusic | null>(null);
  const [sound, setSound] = useState(false);
  const [soundAllowed, setSoundAllowed] = useState(true);
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("clinika-prefs") ?? "{}");
      if (p.sounds === false) setSoundAllowed(false);
    } catch {}
    return () => music.current?.dispose();
  }, []);
  const enableSound = (on: boolean) => {
    setSound(on);
    if (on) {
      music.current ??= new FilmMusic();
      music.current.start(); // called inside the click handler: counts as a user gesture
    } else music.current?.stop();
  };
  useEffect(() => {
    const m = music.current;
    if (!m || !sound) return;
    m.setMood(i >= 5 ? "hope" : "tension");
    // Keep playing through the final call-to-action scene, pause when the film pauses or leaves the screen.
    if (started && playing && inView) m.start();
    else m.stop();
  }, [sound, i, started, playing, inView]);

  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setI((v) => v + 1), scene.ms);
    return () => clearTimeout(t);
  }, [i, running, scene.ms]);

  return (
    <div ref={ref} className="relative overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_60px_140px_-40px_rgba(10,91,224,0.6)]">
      <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video">
        <AnimatePresence mode="sync">
          <motion.div
            key={i}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, clipPath: "inset(0 0 0 100%)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, clipPath: "inset(0 0 0 0%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease }}
          >
            {scene.photo ? (
              <motion.div className="absolute inset-0" initial={{ scale: 1.18, x: "2%" }} animate={{ scale: reduce ? 1.18 : 1.03, x: "0%" }} transition={{ duration: scene.ms / 1000 + 1, ease: "linear" }}>
                <Photo photo={scene.photo} className={`absolute inset-0 ${scene.mirror ? "-scale-x-100" : ""}`} sizes="(max-width:1024px) 100vw, 1100px" w={1600} />
              </motion.div>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#10306a,#040a17_70%)]" />
            )}
            {scene.photo && <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />}
            <SceneBody scene={scene} />
          </motion.div>
        </AnimatePresence>

        {/* Cinema dressing: letterbox, light leak, vignette, HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[6%] bg-black" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[6%] bg-black" />
        <motion.div className="pointer-events-none absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-[#38e1ff]/10 to-transparent mix-blend-screen" animate={reduce ? undefined : { x: ["-20%", "260%"] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_160px_rgba(0,0,0,0.85)]" />
        <div className="pointer-events-none absolute left-4 top-[8%] flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/70 sm:left-8 sm:text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> {String(i + 1).padStart(2, "0")} · {scene.chapter}
        </div>
        <div className="pointer-events-none absolute right-4 top-[8%] font-mono text-[10px] text-white/50 sm:right-8 sm:text-xs">
          {fmt(START[i])} / {fmt(TOTAL)}
        </div>

        {/* Subtitles */}
        <AnimatePresence mode="wait">
          {scene.caption && (
            <motion.p key={`c${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="pointer-events-none absolute inset-x-4 bottom-[9%] mx-auto w-fit max-w-[92%] rounded-md bg-black/65 px-3 py-1.5 text-center text-[13px] font-medium text-white backdrop-blur-sm sm:text-lg">
              {scene.caption}
            </motion.p>
          )}
        </AnimatePresence>

        {(!started || !playing) && !ended && (
          <button onClick={() => { setStarted(true); setPlaying(true); if (soundAllowed && !sound) enableSound(true); }} className="absolute inset-0 z-20 grid place-items-center bg-black/35" aria-label={t("Lire le film", "Play the film")}>
            <span className="grid h-20 w-20 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur-md transition hover:scale-105 hover:bg-white/25">
              <PlayCircle className="h-12 w-12 text-white" weight="fill" />
            </span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {started && playing && !sound && soundAllowed && (
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => enableSound(true)}
            className="absolute left-1/2 top-[14%] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#0b132b] shadow-xl hover:bg-white"
          >
            <SpeakerHigh className="h-4 w-4" weight="fill" /> {t("Activer le son", "Turn sound on")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center gap-3 bg-[#050c1a] px-4 py-3">
        <button
          onClick={() => {
            if (ended) {
              setI(0);
              setPlaying(true);
            } else setPlaying(!playing);
            setStarted(true);
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label={ended ? t("Revoir", "Replay") : playing ? "Pause" : t("Lecture", "Play")}
        >
          {ended ? <ArrowsClockwise className="h-4 w-4" /> : playing && started ? <Pause className="h-4 w-4" weight="fill" /> : <PlayCircle className="h-5 w-5" weight="fill" />}
        </button>
        <button onClick={() => enableSound(!sound)} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${sound ? "bg-[#2f86ff]/30 text-white" : "bg-white/10 text-white/70"} hover:bg-white/20`} aria-label={sound ? t("Couper le son", "Mute") : t("Activer le son", "Turn sound on")} aria-pressed={sound} title={sound ? t("Couper le son", "Mute") : t("Activer le son", "Turn sound on")}>
          {sound ? <SpeakerHigh className="h-4 w-4" weight="fill" /> : <SpeakerSlash className="h-4 w-4" />}
        </button>
        <div className="flex flex-1 gap-1" role="tablist" aria-label={t("Chapitres", "Chapters")}>
          {SCENES.map((s, k) => (
            <button key={k} role="tab" aria-selected={k === i} aria-label={s.chapter} title={s.chapter} onClick={() => { setI(k); setStarted(true); setPlaying(true); }} className="group h-6 py-2.5" style={{ flex: s.ms }}>
              <span className="block h-1 overflow-hidden rounded-full bg-white/15 group-hover:bg-white/30">
                <span
                  key={`${k}-${i}`}
                  className="block h-full rounded-full bg-[#38e1ff]"
                  style={k === i ? { width: 0, animation: `filmgrow ${s.ms}ms linear forwards`, animationPlayState: running ? "running" : "paused" } : { width: k < i ? "100%" : "0%" }}
                />
              </span>
            </button>
          ))}
        </div>
        <span className="hidden w-24 shrink-0 text-right text-xs text-white/55 sm:block">{scene.chapter}</span>
      </div>
    </div>
  );
}

// ───────────────────────── Scenes ─────────────────────────

function Title({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-display font-bold leading-[1.05] tracking-tight text-white ${className}`}>{children}</p>;
}

function Words({ text, delay = 0.2, step = 0.09, className = "" }: { text: string; delay?: number; step?: number; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, k) => (
        <span key={k} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span className="inline-block" initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ delay: delay + k * step, duration: 0.6, ease }}>
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function SceneBody({ scene }: { scene: Scene }) {
  const t = useT();
  switch (scene.kind) {
    case "intro":
      return (
        <div className="absolute inset-0 flex items-end p-6 pb-[18%] sm:p-14 sm:pb-[14%]">
          <div>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur sm:text-sm">{t("06 h 45 · CHU Mustapha, Alger", "06:45 · Mustapha teaching hospital, Algiers")}</motion.p>
            <Title className="text-4xl sm:text-7xl"><Words text={t("Des années de cours.", "Years of lectures.")} delay={0.4} /></Title>
            <Title className="text-4xl text-[#7fd8ff] sm:text-7xl"><Words text={t("Zéro patient.", "Zero patients.")} delay={1.2} /></Title>
          </div>
        </div>
      );
    case "watch":
      return (
        <div className="absolute inset-0 p-6 sm:p-14">
          {[t("Observer", "Watch"), t("Écouter", "Listen"), t("Noter", "Take notes")].map((w, k) => (
            <motion.span key={w} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5 + k * 0.6, type: "spring", stiffness: 160, damping: 16 }} className="absolute rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md sm:text-lg" style={{ left: `${12 + k * 26}%`, top: `${28 + (k % 2) * 16}%` }}>
              <Check className="mr-1.5 inline h-4 w-4 text-emerald-300" /> {w}
            </motion.span>
          ))}
        </div>
      );
    case "never":
      return (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {[t("Interroger seule", "Interview alone"), t("Examiner seule", "Examine alone"), t("Décider seule", "Decide alone")].map((w, k) => (
              <motion.div key={w} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + k * 0.35, duration: 0.6, ease }} className="relative rounded-2xl border border-white/15 bg-black/50 px-6 py-4 text-center backdrop-blur-md">
                <p className="text-base font-semibold text-white sm:text-xl">{w}</p>
                <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.6 + k * 0.3, duration: 0.4 }} className="absolute left-4 right-4 top-1/2 h-[3px] origin-left rounded bg-red-500" />
                <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.9 + k * 0.3 }} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-500 text-white">
                  <X className="h-3.5 w-3.5" weight="bold" />
                </motion.span>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "night":
      return (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <div>
            <motion.p initial={{ opacity: 0, scale: 1.3, filter: "blur(8px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} transition={{ duration: 1, ease }} className="font-mono text-6xl font-bold text-red-400 drop-shadow-[0_0_30px_rgba(248,113,113,0.6)] sm:text-8xl">02:10</motion.p>
            <svg viewBox="0 0 600 80" className="mx-auto mt-4 h-14 w-[min(560px,90vw)]" aria-hidden>
              <motion.path d="M0 40 H120 l12 -8 l10 8 h20 l8 22 l12 -60 l12 56 l8 -18 H330 l12 -8 l10 8 h20 l8 22 l12 -60 l12 56 l8 -18 H600" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: "linear" }} />
            </svg>
            <Title className="mt-4 text-2xl sm:text-5xl"><Words text={t("Première garde. Seule.", "First night shift. Alone.")} delay={0.9} /></Title>
          </div>
        </div>
      );
    case "question":
      return (
        <div className="absolute inset-0 grid place-items-center p-6 text-center">
          <Title className="text-4xl sm:text-7xl">
            <Words text={t("Et si elle pouvait", "What if she could")} delay={0.2} />
            <br />
            <Words text={t("s'entraîner avant ?", "practise first?")} delay={0.7} className="text-[#7fd8ff]" />
          </Title>
        </div>
      );
    case "brand":
      return (
        <div className="absolute inset-0 grid place-items-center text-center">
          {[0, 1, 2].map((k) => (
            <motion.span key={k} className="absolute h-40 w-40 rounded-full border border-[#38e1ff]/50" initial={{ scale: 0.3, opacity: 0.8 }} animate={{ scale: 4, opacity: 0 }} transition={{ delay: 0.2 + k * 0.35, duration: 2.2, ease: "easeOut" }} />
          ))}
          <div>
            <motion.div initial={{ scale: 0.3, opacity: 0, rotate: -25 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 120, damping: 11 }} className="mx-auto w-fit">
              <LogoMark className="h-20 w-20 drop-shadow-[0_0_50px_rgba(47,134,255,0.9)] sm:h-28 sm:w-28" />
            </motion.div>
            <motion.p initial={{ opacity: 0, letterSpacing: "0.5em" }} animate={{ opacity: 1, letterSpacing: "-0.02em" }} transition={{ delay: 0.4, duration: 1.2, ease }} className="mt-5 font-display text-6xl font-bold text-white sm:text-8xl">DiagnoCare</motion.p>
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="mt-3 text-base text-white/75 sm:text-2xl">{t("Le patient virtuel qui vous attend, 24 h/24.", "The virtual patient waiting for you, 24/7.")}</motion.p>
          </div>
        </div>
      );
    case "chat":
      return <ChatScene />;
    case "exam":
      return <ExamScene />;
    case "mistake":
      return <MistakeScene />;
    case "score":
      return <ScoreScene />;
    case "ready":
      return (
        <div className="absolute inset-0 grid items-center p-6 sm:p-14">
          <div className="max-w-xl">
            <motion.p initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#7fd8ff]">{t("Six mois plus tard", "Six months later")}</motion.p>
            <Title className="text-4xl sm:text-7xl"><Words text={t("Le jour J,", "On the day,")} delay={0.4} /><br /><Words text={t("elle est prête.", "she's ready.")} delay={0.9} className="text-[#7fd8ff]" /></Title>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }} className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/register" className="btn-primary px-6 py-3.5 text-[15px] font-semibold">{t("Commencer gratuitement", "Start for free")} <ArrowRight className="h-4 w-4" /></Link>
              <span className="text-sm text-white/70">{t("5 simulations offertes chaque mois", "5 free simulations every month")}</span>
            </motion.div>
          </div>
        </div>
      );
  }
}

function ChatScene() {
  const t = useT();
  const lines: [string, string][] = [
    [t("Depuis quand avez-vous mal ?", "When did the pain start?"), t("Depuis 1 h du matin, ça m'a réveillé.", "Since 1 a.m., it woke me up.")],
    [t("Est-ce que la douleur irradie ?", "Does the pain spread anywhere?"), t("Oui… dans le bras gauche et la mâchoire.", "Yes… down my left arm and into my jaw.")],
  ];
  return (
    <div className="absolute inset-0 grid items-center gap-6 p-6 sm:grid-cols-[1fr_1.1fr] sm:p-14">
      <Title className="hidden text-5xl sm:block"><Words text={t("Interroger.", "Interview.")} delay={0.2} /><br /><span className="text-2xl font-medium text-white/60"><Words text={t("En français ou en anglais.", "In French or English.")} delay={0.6} step={0.06} /></span></Title>
      <motion.div initial={{ opacity: 0, y: 30, rotateX: 18 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 0.8, ease }} className="rounded-2xl bg-white p-4 text-[13px] text-[#0b132b] shadow-2xl sm:p-5 sm:text-sm" style={{ transformPerspective: 900 }}>
        <p className="border-b border-slate-100 pb-2 text-xs text-slate-500">{t("Mourad B., 58 ans · Urgences · douleur thoracique", "Mourad B., 58 · Emergency · chest pain")}</p>
        <div className="space-y-2 pt-3">
          {lines.map(([q, a], k) => (
            <div key={q} className="space-y-2">
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + k * 2.3 }} className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#1f6fe0] px-3 py-1.5 text-white">{q}</motion.p>
              <div className="relative min-h-[30px]">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ delay: 1.1 + k * 2.3, duration: 0.9, times: [0, 0.1, 0.85, 1] }} className="absolute left-0 top-0 flex w-fit gap-1 rounded-2xl bg-slate-100 px-3 py-2.5">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 120}ms` }} />)}
                </motion.span>
                <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 + k * 2.3 }} className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-slate-100 px-3 py-1.5">{a}</motion.p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ExamScene() {
  const tr = useT();
  const spots = [
    { x: 63, y: 40, t: tr("Auscultation cardiaque", "Heart auscultation"), r: tr("Tachycardie régulière, 104/min", "Regular tachycardia, 104/min"), bad: true, d: 0.5 },
    { x: 50, y: 62, t: tr("Tension aux deux bras", "BP in both arms"), r: tr("146/91 mmHg, symétrique", "146/91 mmHg, symmetrical"), bad: true, d: 2.2 },
    { x: 84, y: 57, t: tr("Palpation abdominale", "Abdominal palpation"), r: tr("Souple, indolore", "Soft, non-tender"), bad: false, d: 3.9 },
  ];
  return (
    <div className="absolute inset-0">
      {spots.map((s) => (
        <motion.div key={s.t} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: s.d, type: "spring", stiffness: 200, damping: 14 }}>
          <span className="absolute -left-10 -top-10 h-20 w-20 animate-ping rounded-full border-2 border-[#38e1ff]/60" />
          <span className="absolute -left-6 -top-6 h-12 w-12 rounded-full border-2 border-[#38e1ff] bg-[#38e1ff]/20 shadow-[0_0_30px_rgba(56,225,255,0.7)]" />
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: s.d + 0.5 }} className={`absolute top-8 w-[190px] rounded-lg border bg-[#081427]/90 p-2.5 text-white backdrop-blur sm:w-[230px] ${s.x > 70 ? "right-0" : "-left-6"} ${s.bad ? "border-red-400/50" : "border-emerald-400/40"}`}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold sm:text-xs"><Stethoscope className="h-3.5 w-3.5 text-[#6fb1ff]" /> {s.t}</p>
            <p className="mt-0.5 text-[11px] text-white/75 sm:text-xs">{s.r}</p>
          </motion.div>
        </motion.div>
      ))}
      <div className="absolute left-6 top-[18%] sm:left-14">
        <Title className="text-4xl sm:text-6xl"><Words text={tr("Examiner.", "Examine.")} delay={0.2} /></Title>
      </div>
    </div>
  );
}

function MistakeScene() {
  const t = useT();
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <div className="mx-auto w-full max-w-4xl space-y-3 [&>div]:mx-auto [&>div]:max-w-xl">
        <Title className="mb-6 text-center text-3xl sm:text-6xl"><Words text={t("Se tromper ici,", "Make mistakes here,")} delay={0.1} /><br /><Words text={t("pas au lit du malade.", "not at the bedside.")} delay={0.5} className="text-[#7fd8ff]" /></Title>
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.5, ease }} className="flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3.5 text-amber-50 backdrop-blur">
          <Warning className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" weight="fill" />
          <p className="text-sm sm:text-base"><b>{t("Scanner thoracique demandé d'emblée", "Chest CT ordered straight away")}</b> : {t("examen non prioritaire, l'ECG d'abord.", "not a priority test, ECG first.")} <span className="font-mono text-amber-300">−2 pts</span></p>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8, duration: 0.5, ease }} className="flex items-start gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3.5 text-emerald-50 backdrop-blur">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" weight="bold" />
          <p className="text-sm sm:text-base"><b>{t("Point pédagogique", "Teaching point")}</b> : {t("ECG 12 dérivations dans les 10 minutes devant toute douleur thoracique.", "12-lead ECG within 10 minutes for any chest pain.")}</p>
        </motion.div>
      </div>
    </div>
  );
}

function ScoreScene() {
  const t = useT();
  const rows: [string, number, number][] = [[t("Interrogatoire", "History"), 18, 20], [t("Examen clinique", "Examination"), 14, 15], [t("Examens complémentaires", "Investigations"), 12, 15], [t("Diagnostic", "Diagnosis"), 20, 20], [t("Prise en charge", "Management"), 27, 30]];
  const [score, setScore] = useState(0);
  useEffect(() => {
    let v = 0;
    const timer = setInterval(() => {
      v += 3;
      setScore(Math.min(91, v));
      if (v >= 91) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, []);
  const C = 2 * Math.PI * 52;
  return (
    <div className="absolute inset-0 grid items-center gap-6 p-6 sm:grid-cols-[auto_1fr] sm:gap-14 sm:p-14">
      <div className="relative mx-auto grid h-36 w-36 place-items-center sm:h-56 sm:w-56">
        <motion.span className="absolute inset-0 rounded-full bg-[#38e1ff]/20 blur-2xl" animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#38e1ff" strokeWidth="9" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
        </svg>
        <p className="relative text-center font-display text-5xl font-bold text-white sm:text-7xl">{score}<span className="block text-xs font-medium text-white/60 sm:text-sm">/ 100</span></p>
      </div>
      <div>
        <Title className="text-2xl sm:text-5xl"><Words text={t("Une note, critère par critère.", "A score, criterion by criterion.")} delay={0.1} step={0.07} /></Title>
        <div className="mt-5 hidden space-y-2.5 sm:block">
          {rows.map(([k, g, m], n) => (
            <div key={k} className="grid grid-cols-[200px_1fr_48px] items-center gap-3 text-sm">
              <span className="text-white/75">{k}</span>
              <span className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.span className="block h-full rounded-full bg-gradient-to-r from-[#2f86ff] to-[#38e1ff]" initial={{ width: 0 }} animate={{ width: `${(g / m) * 100}%` }} transition={{ delay: 0.5 + n * 0.15, duration: 0.9, ease }} />
              </span>
              <span className="text-right font-mono text-white/60">{g}/{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
