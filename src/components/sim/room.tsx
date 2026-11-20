"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle, ArrowLeft, ArrowRight, Brain, Check, CheckCircle2, ClipboardCheck, Clock, Baby, Drop, EyeIcon, Eyeglasses, FlaskConical, Flashlight, Gauge, GenderFemale, HandPalm, Hammer, Info, MagnifyingGlassPlus, Prescription, Syringe, Wind, Loader2, MessagesSquare, Mic, MicOff, NotebookPen, Plus, Activity, Send, SignOut, Stethoscope, Trash2, Volume2, VolumeX, X, Pause, Play
} from "@/components/icons";
import { INVESTIGATIONS, PHYSICAL_EXAMS, TOPICS, localizeExam, localizeInvestigation, topicGroupLabel, topicLabel } from "@/lib/catalog";
import { useLang, useT } from "@/lib/i18n/client";
import { LangSwitch } from "@/components/lang-switch";
import { translateMessage } from "@/lib/i18n/messages";
import { PrescriptionPanel, RxDisclaimer, RxSummary, blankRx, rxDirty as isRxDirty, type RxEntry } from "./prescription";
import { api } from "@/lib/client";
import { type Emotion, type Lang, type Vitals } from "@/lib/sim/types";
import { type AvatarConfig } from "./patient-avatar";
import dynamic from "next/dynamic";

const PatientAvatar3D = dynamic(() => import("./patient-avatar-3d").then((m) => m.PatientAvatar3D), { ssr: false, loading: () => <div className="grid h-full w-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div> });
import { Photo } from "@/components/motion";
import type { PhotoKey } from "@/lib/photos";
import { VitalsMonitor } from "./vitals-monitor";
import { BloodPressureTool, DripBag, GlucoseTool, PeakFlowTool, dropsPerMin } from "./bedside-tools";
import { ecgSpecFromText } from "@/lib/ecg/from-text";

const EcgPaper = dynamic(() => import("@/components/ecg/ecg-paper").then((m) => m.EcgPaper), { ssr: false });
import { browserVoice, type VoiceProvider } from "./voice";

export interface RoomProps {
  session: { id: string; stage: string; language: Lang; aiMode: "anthropic" | "groq" | "demo"; startedAt: string; notes: string; topicsCovered: string[] };
  caseInfo: { title: string; slug: string; setting: string; minutes: number; specialty: string; pregnant?: boolean };
  patient: { name: string; age: number; sex: "F" | "M"; occupation: string; avatar: AvatarConfig; baselineEmotion: Emotion };
  vitals: Vitals;
  history: { pastMedical: string[]; medications: string[]; allergies: string[]; family: string[]; social: string[] };
  messages: { id: string; role: "student" | "patient"; content: string; emotion: string | null }[];
  exams: { code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; at: string }[];
  managementOptions: { code: string; label: string }[];
  voiceAllowed: boolean;
  /** Draft activity awaiting clinical educator review. */
  draft?: boolean;
  /** Sensitive-content notice: enables pause / exit and a reminder banner. */
  contentNotice?: string;
}

const EMOTION_FR: Record<string, string> = { neutral: "calme", anxious: "anxieux", pain: "douloureux", distressed: "en détresse", tired: "fatigué", relieved: "soulagé", irritated: "agacé" };
const EMOTION_EN: Record<string, string> = { neutral: "calm", anxious: "anxious", pain: "in pain", distressed: "distressed", tired: "tired", relieved: "relieved", irritated: "irritated" };

/** Stages persisted on the session (unchanged server contract). */
const STAGES = [
  { key: "INTERVIEW", label: "Interrogatoire", en: "History" },
  { key: "EXAM", label: "Examen clinique", en: "Examination" },
  { key: "INVESTIGATIONS", label: "Examens compl.", en: "Investigations" },
  { key: "REASONING", label: "Raisonnement", en: "Reasoning" },
  { key: "MANAGEMENT", label: "Prise en charge", en: "Management" },
] as const;
type StageKey = (typeof STAGES)[number]["key"];

type IconT = React.ComponentType<{ className?: string; weight?: "regular" | "fill" | "duotone" }>;
/** Left tool rail. A tool maps to a stage and, for the bedside exam, to catalogue categories and/or exam codes. */
type ToolKey =
  | "talk" | "observe" | "palpate" | "auscultate" | "neuro" | "vitals" | "bp" | "glucose" | "care"
  | "acuity" | "slitlamp" | "ophthalmoscope" | "tonometer" | "obstetric" | "speculum" | "tv" | "percuss" | "peakflow"
  | "labs" | "dx" | "plan" | "rx";
type Tool = { key: ToolKey; label: string; en: string; icon: IconT; stage: StageKey; categories?: string[]; codes?: string[] };

const ALL_TOOLS: Record<ToolKey, Tool> = {
  talk: { key: "talk", label: "Dialogue", en: "Talk", icon: MessagesSquare, stage: "INTERVIEW" },
  observe: { key: "observe", label: "Observer", en: "Observe", icon: EyeIcon, stage: "EXAM", categories: ["Général", "Dermatologie", "ORL", "Endocrinien", "Ophtalmologique"] },
  palpate: { key: "palpate", label: "Palper", en: "Palpate", icon: HandPalm, stage: "EXAM", categories: ["Abdominal", "Gynécologique", "Ostéo-articulaire"] },
  auscultate: { key: "auscultate", label: "Ausculter", en: "Auscultate", icon: Stethoscope, stage: "EXAM", categories: ["Cardiovasculaire", "Respiratoire"] },
  neuro: { key: "neuro", label: "Neuro", en: "Neuro", icon: Hammer, stage: "EXAM", categories: ["Neurologique"] },
  vitals: { key: "vitals", label: "Constantes", en: "Vitals", icon: Activity, stage: "EXAM" },
  bp: { key: "bp", label: "Tension", en: "BP", icon: Gauge, stage: "EXAM" },
  glucose: { key: "glucose", label: "Glycémie", en: "Glucose", icon: Drop, stage: "EXAM" },
  care: { key: "care", label: "Soins", en: "Care", icon: Syringe, stage: "MANAGEMENT" },
  // Ophtalmologie
  acuity: { key: "acuity", label: "Monoyer", en: "Acuity", icon: Eyeglasses, stage: "EXAM", codes: ["eye_acuity"] },
  slitlamp: { key: "slitlamp", label: "Lampe à fente", en: "Slit lamp", icon: MagnifyingGlassPlus, stage: "EXAM", codes: ["eye_slitlamp"] },
  ophthalmoscope: { key: "ophthalmoscope", label: "Ophtalmo­scope", en: "Ophthalmo­scope", icon: Flashlight, stage: "EXAM", codes: ["eye_pupils", "eye_fundus"] },
  tonometer: { key: "tonometer", label: "Tonomètre", en: "Tonometer", icon: Gauge, stage: "EXAM", codes: ["eye_iop"] },
  // Gynécologie-obstétrique
  obstetric: { key: "obstetric", label: "Obstétrique", en: "Obstetric", icon: Baby, stage: "EXAM", codes: ["obs_exam"] },
  speculum: { key: "speculum", label: "Spéculum", en: "Speculum", icon: GenderFemale, stage: "EXAM", codes: ["gyn_speculum"] },
  tv: { key: "tv", label: "Toucher vaginal", en: "Vaginal exam", icon: HandPalm, stage: "EXAM", codes: ["gyn_tv"] },
  // Pneumologie
  percuss: { key: "percuss", label: "Percuter", en: "Percuss", icon: Hammer, stage: "EXAM", codes: ["resp_percussion"] },
  peakflow: { key: "peakflow", label: "Débitmètre", en: "Peak flow", icon: Wind, stage: "EXAM" },
  labs: { key: "labs", label: "Examens", en: "Tests", icon: FlaskConical, stage: "INVESTIGATIONS" },
  dx: { key: "dx", label: "Diagnostic", en: "Diagnosis", icon: Brain, stage: "REASONING" },
  plan: { key: "plan", label: "Conduite", en: "Plan", icon: ClipboardCheck, stage: "MANAGEMENT" },
  // Optional, ungraded prescription-writing exercise (see ./prescription).
  rx: { key: "rx", label: "Ordonnance", en: "Prescription", icon: Prescription, stage: "MANAGEMENT" },
};

type KitItem = ToolKey | (Partial<Tool> & { key: ToolKey });
const END: ToolKey[] = ["labs", "dx", "plan", "rx"];
/** Each specialty gets the instruments a clinician would actually pick up for that patient. */
const KITS: Record<string, KitItem[]> = {
  default: ["talk", "observe", "palpate", "auscultate", "neuro", "vitals", "bp", "glucose", "care", ...END],
  ophthalmology: ["talk", "acuity", "slitlamp", "ophthalmoscope", "tonometer", { key: "observe", label: "Inspection", en: "Inspect", categories: ["Général", "ORL"] }, "neuro", "vitals", { key: "care", label: "Traitements", en: "Treatments" }, ...END],
  gynecology: ["talk", { key: "observe", label: "Inspection", en: "Inspect", categories: ["Général"] }, "bp", { key: "palpate", label: "Abdomen", en: "Abdomen", categories: ["Abdominal"] }, "obstetric", "speculum", "tv", { key: "neuro", label: "Réflexes", en: "Reflexes" }, "vitals", "care", ...END],
  pulmonology: ["talk", { key: "observe", label: "Inspection", en: "Inspect", categories: ["Général"], codes: ["resp_insp"] }, { key: "auscultate", categories: ["Cardiovasculaire"], codes: ["resp_ausc"] }, "percuss", "peakflow", { key: "vitals", label: "Oxymétrie", en: "Oximetry" }, { key: "care", label: "Traitements", en: "Treatments" }, ...END],
  dermatology: ["talk", { key: "observe", label: "Dermatoscope", en: "Dermatoscope", icon: MagnifyingGlassPlus, categories: ["Dermatologie", "Général"] }, "palpate", "vitals", "care", ...END],
};
const toolsFor = (specialty: string): Tool[] => (KITS[specialty] ?? KITS.default).map((k) => (typeof k === "string" ? ALL_TOOLS[k] : { ...ALL_TOOLS[k.key], ...k }));
const toolMatches = (t: { codes?: string[]; categories?: string[] }, code: string) => !!t.codes?.includes(code) || !!t.categories?.includes(PHYSICAL_EXAMS.find((x) => x.code === code)?.category ?? "");
const BEDSIDE_STAGES: StageKey[] = ["INTERVIEW", "EXAM"];
const INSTRUMENTS: ToolKey[] = ["bp", "glucose", "care", "peakflow"];

const QUICK: Record<Lang, string[]> = {
  en: ["Hello, I'm the medical student. What brings you in today?", "When did it start?", "Can you describe the pain?", "Does it spread anywhere?", "Any other symptoms?", "Do you have any medical conditions?", "Do you take any medications?", "Any allergies?", "Do you smoke or drink alcohol?", "Any illnesses in your family?", "What are you most worried about?"],
  fr: ["Bonjour, je suis l'étudiant(e) en médecine. Qu'est-ce qui vous amène ?", "Depuis quand ?", "Pouvez-vous décrire la douleur ?", "Est-ce que ça irradie ?", "Avez-vous d'autres symptômes ?", "Avez-vous des antécédents médicaux ?", "Prenez-vous des médicaments ?", "Avez-vous des allergies ?", "Vous fumez ? La chemma ?", "Des maladies dans la famille ?", "Qu'est-ce qui vous inquiète ?"],
};

export function ConsultationRoom(props: RoomProps) {
  const router = useRouter();
  const t = useT();
  const tt = t;
  const lang = useLang();
  const { session, patient } = props;
  const initialStage = (STAGES.find((s) => s.key === session.stage)?.key ?? "INTERVIEW") as StageKey;
  const TOOLS = useMemo(() => toolsFor(props.caseInfo.specialty), [props.caseInfo.specialty]);
  const [tool, setTool] = useState<ToolKey>(TOOLS.find((t) => t.stage === initialStage)?.key ?? "talk");
  const [messages, setMessages] = useState(props.messages);
  const [exams, setExams] = useState(props.exams);
  const [covered, setCovered] = useState<string[]>(session.topicsCovered);
  const baseEmotion = (props.messages.filter((m) => m.role === "patient").at(-1)?.emotion as Emotion) ?? patient.baselineEmotion;
  const [emotion, setEmotion] = useState<Emotion>(baseEmotion);
  const [error, setError] = useState("");
  const [engineNote, setEngineNote] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [paused, setPaused] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(!!props.contentNotice);
  const [side, setSide] = useState<"chat" | "file" | "notes">("chat");
  const [speaking, setSpeaking] = useState(false);
  const [lastResult, setLastResult] = useState<RoomProps["exams"][number] | null>(null);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reasoning & management drafts (kept locally until submission).
  const draftKey = `medsim-draft-${session.id}`;
  const [ddx, setDdx] = useState<string[]>([]);
  const [finalDx, setFinalDx] = useState("");
  const [justification, setJustification] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [mgmtNotes, setMgmtNotes] = useState("");
  const [careLog, setCareLog] = useState<string[]>([]);
  const [rx, setRx] = useState<RxEntry[]>([]);
  const [rxSavedAt, setRxSavedAt] = useState<string | null>(null);
  const [rxRows, setRxRows] = useState<RxEntry[]>(() => [blankRx()]);
  const rxDirty = isRxDirty(rxRows, rx);
  const logCare = (line: string) => {
    const at = new Date().toLocaleTimeString(lang === "en" ? "en-GB" : "fr-DZ", { hour: "2-digit", minute: "2-digit" });
    setCareLog((l) => [...l, `${at} — ${line}`]);
    setMgmtNotes((n) => `${n ? `${n}\n` : ""}• ${t("Soin", "Care")} (${at}) : ${line}`);
  };
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (d) {
        setDdx(d.ddx ?? []);
        setFinalDx(d.finalDx ?? "");
        setJustification(d.justification ?? "");
        setActions(d.actions ?? []);
        setMgmtNotes(d.mgmtNotes ?? "");
        setRx(Array.isArray(d.rx) ? d.rx : []);
        if (Array.isArray(d.rx) && d.rx.length) setRxRows(d.rx);
        setRxSavedAt(d.rxSavedAt ?? null);
      }
    } catch {}
  }, [draftKey]);
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ddx, finalDx, justification, actions, mgmtNotes, rx, rxSavedAt }));
    } catch {}
  }, [draftKey, ddx, finalDx, justification, actions, mgmtNotes, rx, rxSavedAt]);
  const saveRx = useCallback((entries: RxEntry[]) => {
    setRx(entries);
    setRxSavedAt(new Date().toISOString());
  }, []);

  const current = TOOLS.find((t) => t.key === tool) ?? TOOLS[0];
  const stage = current.stage;
  const lastStage = useRef<StageKey>(initialStage);
  const pickTool = useCallback(
    (k: ToolKey) => {
      const t = TOOLS.find((x) => x.key === k);
      if (!t) return; // not part of this case's kit
      setTool(k);
      const s = t.stage;
      if (s !== lastStage.current) {
        lastStage.current = s;
        api(`/api/sessions/${session.id}`, "PATCH", { stage: s }).catch(() => {});
      }
      if (k === "talk") {
        setSide("chat");
        // On phones the dialogue sits below the patient: bring it into view.
        if (typeof window !== "undefined" && window.innerWidth < 1024) setTimeout(() => document.getElementById("patient-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    },
    [session.id, TOOLS],
  );
  // The consultation follows the interface language: switching it re-renders the case and the patient answers in it.
  const sessionLang = useRef<Lang>(session.language);
  useEffect(() => {
    if (sessionLang.current === lang) return;
    sessionLang.current = lang;
    api(`/api/sessions/${session.id}`, "PATCH", { language: lang }).catch(() => {});
  }, [lang, session.id]);

  const physical = exams.filter((e) => e.kind === "PHYSICAL");
  const investigations = exams.filter((e) => e.kind === "INVESTIGATION");
  const questions = messages.filter((m) => m.role === "student").length;
  const lastPatient = messages.filter((m) => m.role === "patient").at(-1);
  const toolIdx = TOOLS.findIndex((t) => t.key === tool);

  function onExamDone(e: RoomProps["exams"][number]) {
    setExams((x) => [...x, e]);
    setLastResult(e);
    // The patient reacts to an examination that finds something (e.g. a tender abdomen).
    if (e.abnormal && e.kind === "PHYSICAL") {
      setEmotion("pain");
      if (reactTimer.current) clearTimeout(reactTimer.current);
      reactTimer.current = setTimeout(() => setEmotion((cur) => (cur === "pain" ? baseEmotion : cur)), 3500);
    }
  }

  async function submit() {
    setError("");
    try {
      const r = await api<{ url: string }>(`/api/sessions/${session.id}/submit`, "POST", { differentials: ddx, finalDiagnosis: finalDx, justification, managementActions: actions, managementNotes: mgmtNotes, prescription: rx.map(({ name, dose, route, frequency, duration, notes }) => ({ name, dose, route, frequency, duration, notes })) });
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.push(r.url);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setShowSubmit(false);
    }
  }

  async function abandon() {
    if (!confirm(t("Quitter cette consultation ? Elle sera marquée comme abandonnée et ne sera pas notée.", "Leave this consultation? It will be marked as abandoned and won't be scored."))) return;
    await api(`/api/sessions/${session.id}`, "DELETE").catch(() => {});
    router.push(`/app/cases/${props.caseInfo.slug}`);
  }

  const bedside = BEDSIDE_STAGES.includes(current.stage) || INSTRUMENTS.includes(current.key);

  return (
    <div className="dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-[#050c1a] text-[rgb(var(--ink))] lg:overflow-hidden">
      {/* ── Top bar ── */}
      <header className="flex shrink-0 items-center gap-x-2 border-b border-white/10 bg-[#081427] px-3 py-2.5 sm:flex-wrap sm:gap-x-4 sm:gap-y-2 sm:px-5">
        <button onClick={abandon} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white" title={t("Quitter la consultation (non notée)", "Leave the consultation (not scored)")}>
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">{t("Quitter", "Leave")}</span>
        </button>
        <div className="hidden h-6 w-px bg-white/10 sm:block" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold text-white">{props.caseInfo.title}</p>
          <p className="truncate text-xs text-white/50">{props.caseInfo.setting}</p>
        </div>
        {props.draft && <span className="hidden shrink-0 rounded-full border border-amber-400/60 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-100 md:inline">{t("Brouillon · relecture requise", "Draft · review required")}</span>}
        {props.contentNotice && (
          <button onClick={() => setPaused(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-white/80 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6fb1ff]">
            <Pause className="h-4 w-4" /> <span className="hidden sm:inline">{t("Pause", "Pause")}</span>
          </button>
        )}
        <Timer startedAt={session.startedAt} minutes={props.caseInfo.minutes} />
        <LangSwitch className="border-white/10 text-white" />
        <button onClick={() => setShowSubmit(true)} aria-label={t("Terminer la consultation", "End the consultation")} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-500/70 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10">
          <SignOut className="h-4 w-4" /> <span className="hidden sm:inline">{t("Terminer", "Finish")}</span>
        </button>
      </header>

      <div className="grid gap-3 p-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[84px_minmax(0,1fr)_380px]">
        {/* ── Tool rail ── */}
        <nav className="sticky top-0 z-30 flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0a1830] p-1.5 shadow-lg [scrollbar-width:none] lg:static lg:flex-col lg:overflow-y-auto lg:bg-[#0a1830]/90 lg:shadow-none" aria-label={t("Outils de consultation", "Consultation tools")}>
          {TOOLS.map((t, i) => {
            const tr = tt;
            const on = t.key === tool;
            const done =
              t.key === "dx" ? finalDx.trim().length > 1
              : t.key === "plan" ? actions.length > 0
              : t.key === "rx" ? rx.length > 0
              : t.key === "labs" ? investigations.length > 0
              : t.key === "talk" ? questions > 0
              : t.key === "bp" ? physical.some((x) => x.code === "bp_manual")
              : t.key === "glucose" ? investigations.some((x) => x.code === "glucose")
              : t.key === "care" ? careLog.length > 0
              : t.key === "peakflow" ? investigations.some((x) => x.code === "peak_flow")
              : t.codes || t.categories ? physical.some((p) => toolMatches(t, p.code))
              : false;
            return (
              <div key={t.key} className="contents">
                {t.key === "labs" && i > 0 && <div className="mx-2 my-1 hidden h-px shrink-0 bg-white/10 lg:block" />}
                <button onClick={() => pickTool(t.key)} aria-current={on ? "true" : undefined} className={`relative flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-[11px] font-medium transition ${on ? "bg-[#0a5be0]/25 text-white ring-1 ring-[#2f86ff]" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                  <t.icon className={`h-6 w-6 ${on ? "text-[#6fb1ff]" : ""}`} weight={on ? "duotone" : "regular"} />
                  {tr(t.label, t.en)}
                  {done && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-label={tr("fait", "done")} />}
                </button>
              </div>
            );
          })}
        </nav>

        {/* ── Centre ── */}
        <section className="relative flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830] sm:min-h-[520px]">
          {error && (
            <div className="absolute inset-x-3 top-3 z-30 flex items-start gap-2 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200 ring-1 ring-red-500/40 backdrop-blur" role="alert">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span className="flex-1">{error}</span>
              <button onClick={() => setError("")} aria-label={t("Fermer", "Close")}><X className="h-4 w-4" /></button>
            </div>
          )}
          {bedside ? (
            <BedsideStage
              {...props}
              emotion={emotion}
              speaking={speaking}
              bubble={tool === "talk" || speaking ? lastPatient?.content : undefined}
              tool={current}
              kit={TOOLS}
              onPickTool={pickTool}
              care={<CarePanel options={props.managementOptions} actions={actions} setActions={setActions} log={careLog} onLog={logCare} />}
              doneCodes={new Set(physical.map((p) => p.code))}
              onExamDone={onExamDone}
              lastResult={lastResult}
              clearResult={() => setLastResult(null)}
              setError={setError}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {stage === "INVESTIGATIONS" && <ExamPanel sessionId={session.id} kind="INVESTIGATION" done={investigations} onDone={onExamDone} setError={setError} />}
              {stage === "REASONING" && <ReasoningPanel ddx={ddx} setDdx={setDdx} finalDx={finalDx} setFinalDx={setFinalDx} justification={justification} setJustification={setJustification} />}
              {stage === "MANAGEMENT" && tool !== "rx" && <ManagementPanel options={props.managementOptions} actions={actions} setActions={setActions} notes={mgmtNotes} setNotes={setMgmtNotes} />}
              {tool === "rx" && <PrescriptionPanel rows={rxRows} setRows={setRxRows} saved={rx} savedAt={rxSavedAt} onSave={saveRx} onBack={() => pickTool("talk")} />}
            </div>
          )}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#081427] px-3 py-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-30" disabled={toolIdx === 0} onClick={() => pickTool(TOOLS[toolIdx - 1].key)}>
              <ArrowLeft className="h-3.5 w-3.5" /> {toolIdx > 0 ? t(TOOLS[toolIdx - 1].label, TOOLS[toolIdx - 1].en) : t("Précédent", "Previous")}
            </button>
            <ol className="hidden items-center gap-1.5 sm:flex" aria-label={t("Étapes", "Steps")}>
              {STAGES.map((s) => (
                <li key={s.key} title={t(s.label, s.en)} className={`h-1.5 rounded-full transition-all ${s.key === stage ? "w-6 bg-[#2f86ff]" : "w-1.5 bg-white/20"}`} />
              ))}
            </ol>
            {toolIdx < TOOLS.length - 1 ? (
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => pickTool(TOOLS[toolIdx + 1].key)}>
                {t(TOOLS[toolIdx + 1].label, TOOLS[toolIdx + 1].en)} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => setShowSubmit(true)}>
                {t("Terminer et évaluer", "Finish and score")} <CheckCircle2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>

        {/* ── Patient side panel ── */}
        <aside id="patient-panel" className="flex h-[78vh] min-h-[520px] scroll-mt-20 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1830]/95 lg:h-auto lg:min-h-0">
          <PatientTile patient={patient} emotion={emotion} speaking={speaking} />
          <div className="grid grid-cols-3 border-b border-white/10 text-sm" role="tablist">
            {([["chat", t("Dialogue", "Dialogue")], ["file", t("Dossier", "Record")], ["notes", t("Notes", "Notes")]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={side === k} onClick={() => setSide(k)} className={`-mb-px border-b-2 py-2.5 font-medium transition ${side === k ? "border-[#2f86ff] text-white" : "border-transparent text-white/50 hover:text-white/80"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {side === "chat" && (
              <ChatPanel
                sessionId={session.id}
                lang={lang}
                messages={messages}
                setMessages={setMessages}
                onPatient={(e, topics, note, reply) => {
                  if (reply) {
                    setSpeaking(true);
                    if (speakTimer.current) clearTimeout(speakTimer.current);
                    speakTimer.current = setTimeout(() => setSpeaking(false), Math.min(9000, 900 + reply.length * 55));
                  }
                  setEmotion(e);
                  setCovered(topics);
                  setEngineNote(note ?? "");
                }}
                engineNote={engineNote}
                voiceAllowed={props.voiceAllowed}
                setError={setError}
              />
            )}
            {side === "file" && (
              <div className="h-full space-y-4 overflow-y-auto p-4">
                <PatientFile {...props} covered={covered} />
                <FindingsPanel exams={exams} />
              </div>
            )}
            {side === "notes" && (
              <div className="h-full overflow-y-auto p-4">
                <NotesPanel sessionId={session.id} initial={session.notes} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {props.contentNotice && noticeOpen && !paused && (
        <div role="note" className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-xl rounded-xl border border-teal-400/40 bg-[#0b2230] p-4 text-sm text-teal-50 shadow-2xl">
          <p className="font-semibold">{t("Avertissement de contenu", "Content notice")}</p>
          <p className="mt-1 text-teal-50/85">{props.contentNotice}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-primary text-sm" onClick={() => setNoticeOpen(false)}>{t("J'ai compris, continuer", "I understand, continue")}</button>
            <button className="btn-ghost text-sm" onClick={() => setPaused(true)}><Pause className="h-4 w-4" /> {t("Pause", "Pause")}</button>
          </div>
        </div>
      )}
      {paused && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-[#050c1a]/95 p-4" role="dialog" aria-modal="true" aria-labelledby="pause-title">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#081427] p-6 text-white">
            <h2 id="pause-title" className="font-display text-xl font-bold">{t("Consultation en pause", "Consultation paused")}</h2>
            <p className="mt-2 text-sm text-white/70">{t("Prenez le temps qu'il vous faut. Rien n'est perdu : vous pouvez reprendre, ou quitter sans être noté. Si ce thème vous touche, parlez-en à une personne de confiance ou au service de santé de votre faculté.", "Take the time you need. Nothing is lost: you can resume, or leave without being scored. If this topic affects you, talk to someone you trust or your faculty's student health service.")}</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button autoFocus className="btn-primary" onClick={() => { setPaused(false); setNoticeOpen(false); }}><Play className="h-4 w-4" /> {t("Reprendre", "Resume")}</button>
              <button className="btn-ghost" onClick={abandon}><ArrowLeft className="h-4 w-4" /> {t("Quitter (non noté)", "Leave (not scored)")}</button>
            </div>
          </div>
        </div>
      )}

      {showSubmit && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="submit-title">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSubmit(false)} />
          <div className="panel relative w-full max-w-lg p-6">
            <h2 id="submit-title" className="text-xl font-bold">{t("Terminer la consultation ?", "Finish the consultation?")}</h2>
            <p className="muted mt-1 text-sm">{t("Vos réponses seront notées selon la grille du cas. Vous ne pourrez plus les modifier.", "Your answers will be scored against the case rubric. You won't be able to change them.")}</p>
            <ul className="mt-4 space-y-2 text-sm">
              <Check2 ok={questions >= 5} label={t(`${questions} question(s) posée(s)`, `${questions} question(s) asked`)} />
              <Check2 ok={physical.length > 0} label={t(`${physical.length} geste(s) d'examen réalisé(s)`, `${physical.length} examination step(s) performed`)} />
              <Check2 ok={investigations.length > 0} label={t(`${investigations.length} examen(s) complémentaire(s) demandé(s)`, `${investigations.length} investigation(s) ordered`)} warn />
              <Check2 ok={ddx.length > 0} label={t(`${ddx.length} diagnostic(s) différentiel(s)`, `${ddx.length} differential diagnosis(es)`)} />
              <Check2 ok={finalDx.trim().length >= 2} label={finalDx ? `${t("Diagnostic retenu", "Final diagnosis")} : ${finalDx}` : t("Diagnostic retenu manquant (obligatoire)", "Final diagnosis missing (required)")} />
              <Check2 ok={actions.length > 0} label={t(`${actions.length} action(s) de prise en charge`, `${actions.length} management action(s)`)} />
            </ul>
            <div className="mt-4 rounded-xl border border-white/10 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{t("Ordonnance (facultative, non notée)", "Prescription (optional, not scored)")}</p>
                <button className="text-xs font-medium text-[#6fb1ff] hover:underline" onClick={() => { setShowSubmit(false); pickTool("rx"); }}>
                  {rx.length ? t("Modifier", "Edit") : t("Rédiger", "Write")}
                </button>
              </div>
              <RxDisclaimer className="mb-2" />
              {rxDirty && <p className="mb-2 text-xs text-amber-300">{t("Des modifications de l'ordonnance ne sont pas enregistrées.", "Some prescription changes are not saved.")}</p>}
              <RxSummary entries={rx} savedAt={rxSavedAt} />
            </div>
            {finalDx.trim().length < 2 && (
              <button className="mt-3 text-sm font-medium text-[#6fb1ff] hover:underline" onClick={() => { setShowSubmit(false); pickTool("dx"); }}>
                {t("Saisir mon diagnostic →", "Enter my diagnosis →")}
              </button>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowSubmit(false)}>{t("Continuer", "Keep going")}</button>
              <SubmitButton disabled={finalDx.trim().length < 2} onClick={submit} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Bedside stage ─────────────────────────

type Zone = { key: string; label: string; en: string; tool: ToolKey; categories?: string[]; codes?: string[]; at: [number, number] };
type Scene = { photo: PhotoKey; ratio: number; zones: Zone[]; bubbleAt: [number, number]; kind: "body" | "eye" | "pregnancy" };

/** Body zones on a bedside photo; positions measured on each image, in %. */
const body = (pos: Record<"head" | "heart" | "lungs" | "abdomen" | "limbs", [number, number]>): Zone[] => [
  { key: "head", label: "Tête et cou", en: "Head and neck", tool: "observe", categories: ["Général", "ORL", "Ophtalmologique", "Dermatologie", "Endocrinien"], at: pos.head },
  { key: "heart", label: "Cœur", en: "Heart", tool: "auscultate", categories: ["Cardiovasculaire"], at: pos.heart },
  { key: "lungs", label: "Poumons", en: "Lungs", tool: "auscultate", categories: ["Respiratoire"], at: pos.lungs },
  { key: "abdomen", label: "Abdomen et pelvis", en: "Abdomen and pelvis", tool: "palpate", categories: ["Abdominal", "Gynécologique"], at: pos.abdomen },
  { key: "limbs", label: "Membres · neuro", en: "Limbs · neuro", tool: "neuro", categories: ["Neurologique", "Ostéo-articulaire"], at: pos.limbs },
];

/** Real photographs (see lib/photos.ts). */
const SCENES: Record<"man" | "woman" | "child" | "eye" | "pregnancy", Scene> = {
  man: { kind: "body", photo: "bedMan", ratio: 4 / 3, bubbleAt: [52, 13], zones: body({ head: [52, 13], heart: [37, 40], lungs: [26, 33], abdomen: [15, 58], limbs: [50, 64] }) },
  woman: { kind: "body", photo: "bedWoman", ratio: 3 / 2, bubbleAt: [47, 38], zones: body({ head: [47, 38], heart: [55, 64], lungs: [40, 64], abdomen: [50, 80], limbs: [72, 86] }) },
  child: { kind: "body", photo: "bedChild", ratio: 3 / 2, bubbleAt: [34, 45], zones: body({ head: [34, 45], heart: [50, 54], lungs: [43, 50], abdomen: [62, 64], limbs: [80, 58] }) },
  // Ophthalmology: close-up of the eye, each zone opens the matching gesture.
  eye: {
    kind: "eye",
    photo: "eyeClose",
    ratio: 3 / 2,
    bubbleAt: [8, 6],
    zones: [
      { key: "acuity", label: "Acuité visuelle", en: "Visual acuity", tool: "acuity", codes: ["eye_acuity"], at: [72, 84] },
      { key: "pupil", label: "Pupille · fond d'œil", en: "Pupil · fundus", tool: "ophthalmoscope", codes: ["eye_pupils", "eye_fundus"], at: [51, 48] },
      { key: "cornea", label: "Cornée · chambre antérieure", en: "Cornea · anterior chamber", tool: "slitlamp", codes: ["eye_slitlamp"], at: [67, 35] },
      { key: "conj", label: "Conjonctive", en: "Conjunctiva", tool: "slitlamp", codes: ["eye_slitlamp"], at: [18, 56] },
      { key: "globe", label: "Globe · tonus oculaire", en: "Globe · eye pressure", tool: "tonometer", codes: ["eye_iop"], at: [86, 52] },
    ],
  },
  // Obstetrics: pregnant abdomen in profile.
  pregnancy: {
    kind: "pregnancy",
    photo: "pregnantBelly",
    ratio: 3 / 2,
    bubbleAt: [64, 8],
    zones: [
      { key: "fundus", label: "Hauteur utérine", en: "Fundal height", tool: "obstetric", codes: ["obs_exam"], at: [37, 16] },
      { key: "fhr", label: "Bruits du cœur fœtal", en: "Fetal heart sounds", tool: "obstetric", codes: ["obs_exam"], at: [44, 58] },
      { key: "abdomen", label: "Palpation abdominale", en: "Abdominal palpation", tool: "palpate", codes: ["abdo_palp"], at: [22, 40] },
      { key: "pelvis", label: "Examen au spéculum", en: "Speculum exam", tool: "speculum", codes: ["gyn_speculum"], at: [33, 86] },
      { key: "tv", label: "Toucher vaginal", en: "Vaginal exam", tool: "tv", codes: ["gyn_tv"], at: [46, 84] },
    ],
  },
};
const bodyScene = (age: number, sex: "F" | "M") => SCENES[age < 12 ? "child" : sex === "F" ? "woman" : "man"];

function BedsideStage(p: RoomProps & {
  emotion: Emotion; speaking: boolean; bubble?: string; tool: Tool; kit: Tool[]; doneCodes: Set<string>; onPickTool: (k: ToolKey) => void; care: React.ReactNode;
  onExamDone: (e: RoomProps["exams"][number]) => void; lastResult: RoomProps["exams"][number] | null; clearResult: () => void; setError: (s: string) => void;
}) {
  const t = useT();
  const lang = useLang();
  const [pending, setPending] = useState<string | null>(null);
  const [zoneKey, setZone] = useState<string | null>(null);
  // The case decides the scene: an eye close-up, a pregnant belly, or the patient in bed.
  const special: "eye" | "pregnancy" | null = p.caseInfo.specialty === "ophthalmology" ? "eye" : p.caseInfo.pregnant ? "pregnancy" : null;
  const [view, setView] = useState<"special" | "body">(special ? "special" : "body");
  const base = view === "special" && special ? SCENES[special] : bodyScene(p.patient.age, p.patient.sex);
  // Only zones whose instrument belongs to this case's kit are shown.
  const kitKeys = new Set(p.kit.map((t) => t.key));
  const scene = { ...base, zones: base.zones.filter((z) => kitKeys.has(z.tool)) };
  // A zone narrows the dock only while its tool is the active one.
  const zone = scene.zones.find((z) => z.key === zoneKey && z.tool === p.tool.key) ?? null;
  const sel = zone ?? p.tool;
  const items = sel.codes || sel.categories ? PHYSICAL_EXAMS.filter((x) => toolMatches(sel, x.code)).map((x) => localizeExam(x, lang)) : [];

  async function perform(code: string) {
    setPending(code);
    p.setError("");
    try {
      const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "PHYSICAL", code });
      p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
    } catch (e) {
      p.setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  const res = p.lastResult && p.lastResult.kind === "PHYSICAL" && items.some((i) => i.code === p.lastResult!.code) ? p.lastResult : null;
  const head = scene.bubbleAt;

  return (
    <div className="relative flex-1 overflow-hidden bg-black">
      {/* Same photo, blurred, fills the letterbox around the framed scene. */}
      <Photo photo={scene.photo} className="absolute inset-0 scale-110 opacity-40 blur-2xl" sizes="40vw" w={600} />

      <div className="absolute inset-x-0 bottom-[96px] top-0 grid place-items-center [container-type:size]">
        <div className="relative overflow-hidden rounded-xl shadow-2xl" style={{ aspectRatio: String(scene.ratio), width: `min(100cqw, ${100 * scene.ratio}cqh)` }}>
          <Photo photo={scene.photo} className="absolute inset-0" sizes="(min-width:1024px) 60vw, 100vw" w={1600} priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

          {/* Clickable body zones */}
          {scene.zones.map((z) => {
            const [x, y] = z.at;
            const k = z.key;
            const relevant = p.tool.key === z.tool;
            const on = zone?.key === k;
            return (
              <button
                key={k}
                onClick={() => {
                  setZone(k);
                  if (p.tool.key !== z.tool) p.onPickTool(z.tool);
                }}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                aria-label={`${t("Examiner", "Examine")} : ${t(z.label, z.en)}`}
              >
                <span className={`relative grid place-items-center rounded-full transition-all ${on ? "h-14 w-14" : relevant ? "h-10 w-10" : "h-6 w-6"}`}>
                  {(on || relevant) && <span className="absolute inset-0 animate-ping rounded-full bg-[#38e1ff]/30" />}
                  <span className={`absolute inset-0 rounded-full border-2 ${on ? "border-[#38e1ff] bg-[#38e1ff]/20 shadow-[0_0_24px_rgba(56,225,255,0.7)]" : relevant ? "border-[#38e1ff]/80 bg-[#0a5be0]/25" : "border-white/70 bg-white/20"}`} />
                  <span className={`relative rounded-full bg-white ${on ? "h-2.5 w-2.5" : "h-1.5 w-1.5"}`} />
                </span>
                <span className={`pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#081427]/90 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur transition ${on || relevant ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  {t(z.label, z.en)}
                </span>
              </button>
            );
          })}

          <AnimatePresence>
            {p.bubble && (
              <motion.div
                key={p.bubble}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute max-w-[min(300px,45%)] rounded-2xl rounded-bl-md bg-white/95 px-4 py-2.5 text-sm leading-relaxed text-[#0b132b] shadow-xl"
                style={head[1] < 30 ? { left: `${Math.min(head[0] + 7, 55)}%`, top: `${Math.max(head[1] - 8, 3)}%` } : { left: `${Math.min(head[0] + 6, 55)}%`, bottom: `${100 - head[1] + 6}%` }}
                dir="auto"
              >
                {p.bubble.length > 180 ? `${p.bubble.slice(0, 180)}…` : p.bubble}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tool hint, like « Palpation superficielle » in the mockups */}
          {special && (
            <div className="absolute right-3 top-3 flex rounded-lg bg-[#081427]/85 p-0.5 text-xs font-medium text-white backdrop-blur">
              {([["special", special === "eye" ? t("Œil", "Eye") : t("Grossesse", "Pregnancy")], ["body", t("Patient", "Patient")]] as const).map(([k, l]) => (
                <button key={k} onClick={() => { setView(k); setZone(null); }} className={`rounded-md px-2.5 py-1 ${view === k ? "bg-[#1f6fe0]" : "text-white/70 hover:text-white"}`}>{l}</button>
              ))}
            </div>
          )}
          {zone && (
            <span className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-lg bg-[#081427]/85 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur">
              <p.tool.icon className="h-4 w-4 text-[#6fb1ff]" /> {t(p.tool.label, p.tool.en)} · {t(zone.label, zone.en)}
              <button onClick={() => setZone(null)} className="ml-1 text-white/50 hover:text-white" aria-label={t("Tous les gestes", "All manoeuvres")}><X className="h-3.5 w-3.5" /></button>
            </span>
          )}
        </div>
      </div>

      {/* Monitor */}
      <div className={`absolute left-3 top-3 max-w-[calc(100%-1.5rem)] ${p.tool.key === "vitals" ? "w-[460px]" : "hidden w-[250px] xl:block"}`}>
        <VitalsMonitor vitals={p.vitals} startedAt={p.session.startedAt} compact={p.tool.key !== "vitals"} />
      </div>

      {/* Bedside instruments */}
      <AnimatePresence mode="wait">
        {INSTRUMENTS.includes(p.tool.key) && (
          <motion.div key={p.tool.key} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.35 }} className="absolute bottom-[100px] right-3 top-3 z-20 w-[min(560px,calc(100%-1.5rem))] overflow-y-auto rounded-2xl border border-white/10 bg-[#081427]/[0.97] p-5 text-white shadow-2xl backdrop-blur-md">
            <p className="mb-4 flex items-center gap-2 font-semibold">
              <p.tool.icon className="h-5 w-5 text-[#6fb1ff]" weight="duotone" />
              {p.tool.key === "bp" ? t("Tensiomètre manuel", "Manual sphygmomanometer") : p.tool.key === "glucose" ? t("Glycémie capillaire (glucomètre)", "Capillary glucose (glucometer)") : p.tool.key === "peakflow" ? t("Débitmètre de pointe (peak-flow)", "Peak flow meter") : t("Soins : voie veineuse, perfusion, injections", "Care: IV line, infusion, injections")}
            </p>
            {p.tool.key === "bp" && (
              <BloodPressureTool
                sbp={p.vitals.sbp}
                dbp={p.vitals.dbp}
                hr={p.vitals.hr}
                onDone={(r) => {
                  if (r.sys !== null && r.dia !== null && !p.doneCodes.has("bp_manual")) perform("bp_manual");
                }}
              />
            )}
            {p.tool.key === "glucose" && (
              <GlucoseTool
                measure={async () => {
                  const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "INVESTIGATION", code: "glucose" });
                  p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
                  return r.result;
                }}
              />
            )}
            {p.tool.key === "peakflow" && (
              <PeakFlowTool
                sex={p.patient.sex}
                measure={async () => {
                  const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${p.session.id}/exam`, "POST", { kind: "INVESTIGATION", code: "peak_flow" });
                  p.onExamDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
                  return r.result;
                }}
              />
            )}
            {p.tool.key === "care" && p.care}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exam result */}
      <AnimatePresence>
        {res && (
          <motion.div key={res.code} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute inset-x-3 bottom-[108px] z-10 mx-auto max-w-xl rounded-xl border bg-[#081427]/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur ${res.abnormal ? "border-red-400/50" : "border-emerald-400/40"}`}>
            <div className="flex items-center gap-2">
              <p className="flex-1 font-semibold">{res.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${res.abnormal ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-200"}`}>{res.abnormal ? t("Anormal", "Abnormal") : t("Normal", "Normal")}</span>
              <button onClick={p.clearResult} className="text-white/40 hover:text-white" aria-label={t("Fermer", "Close")}><X className="h-4 w-4" /></button>
            </div>
            <p className="mt-1 text-white/80">{res.result}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="absolute inset-x-3 bottom-2 flex h-[88px] items-end">
        {["talk", "vitals", ...INSTRUMENTS].includes(p.tool.key) ? (
          <p className="mx-auto mb-2 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-[#081427]/90 px-4 py-2 text-xs text-white/75 backdrop-blur">
            <Info className="h-4 w-4 shrink-0 text-[#6fb1ff]" />
            {p.tool.key === "talk"
              ? t("Interrogez le patient à droite, puis touchez une zone du corps pour l'examiner.", "Talk to the patient on the right, then tap a body area to examine it.")
              : p.tool.key === "vitals"
                ? t("Données simulées : le moniteur évolue si le patient n'est pas traité.", "Simulated data: the monitor changes if the patient isn't treated.")
                : p.tool.key === "bp"
                  ? t("Activez le son : les bruits de Korotkoff sont synthétisés dans votre navigateur.", "Turn the sound on: Korotkoff sounds are synthesised in your browser.")
                  : p.tool.key === "glucose"
                    ? t("Le résultat vient du dossier du cas et s'ajoute à vos examens.", "The result comes from the case record and is added to your tests.")
                    : p.tool.key === "peakflow"
                    ? t("Trois essais, on retient la meilleure valeur : comparez-la à la valeur théorique.", "Three attempts, keep the best: compare it with the predicted value.")
                    : t("Les soins s'ajoutent à votre prise en charge et sont notés.", "Care steps are added to your management and scored.")}
          </p>
        ) : (
          <div className="mx-auto w-fit max-w-full rounded-2xl border border-white/10 bg-[#081427]/95 p-1.5 backdrop-blur">
            <div className="flex gap-1 overflow-x-auto">
              {items.map((it) => {
                const done = p.doneCodes.has(it.code);
                return (
                  <button key={it.code} onClick={() => !done && perform(it.code)} disabled={pending !== null || done} className={`flex min-w-[100px] max-w-[140px] shrink-0 flex-col items-center gap-1 rounded-xl px-2.5 py-2 text-center text-[11px] font-medium leading-tight transition ${done ? "bg-emerald-500/10 text-emerald-200" : "text-white/80 hover:bg-[#0a5be0]/25 hover:text-white hover:ring-1 hover:ring-[#2f86ff]"}`} title={done ? t("Déjà réalisé", "Already done") : `${t("Réaliser", "Perform")} : ${it.name}`}>
                    {pending === it.code ? <Loader2 className="h-5 w-5 animate-spin" /> : done ? <Check className="h-5 w-5" /> : <p.tool.icon className="h-5 w-5 text-[#6fb1ff]" />}
                    {it.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Live 3D face of the patient, shown like a video tile in the dialogue panel. */
function PatientTile({ patient, emotion, speaking }: { patient: RoomProps["patient"]; emotion: Emotion; speaking: boolean }) {
  const t = useT();
  return (
    <div className="relative h-44 overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#1a2c4d] to-[#0a1830]">
      <PatientAvatar3D config={patient.avatar} emotion={emotion} speaking={speaking} age={patient.age} sex={patient.sex} />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#0a1830] to-transparent px-4 pb-2.5 pt-8">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{patient.name}</p>
          <p className="truncate text-xs text-white/60">{patient.age} {t("ans", "y/o")} · {patient.sex === "F" ? t("Femme", "Woman") : t("Homme", "Man")} · {t(EMOTION_FR[emotion] ?? emotion, EMOTION_EN[emotion] ?? emotion)}</p>
        </div>
        {speaking ? (
          <span className="flex h-6 shrink-0 items-center gap-[3px]" aria-label={t("Le patient parle", "The patient is speaking")}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i} className="w-[3px] animate-pulse rounded-full bg-[#38e1ff]" style={{ height: `${8 + ((i * 7) % 5) * 4}px`, animationDelay: `${i * 90}ms`, animationDuration: "600ms" }} />
            ))}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-white/40">{t("Patient 3D", "3D patient")}</span>
        )}
      </div>
    </div>
  );
}

function SubmitButton({ disabled, onClick }: { disabled: boolean; onClick: () => Promise<void> }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-primary"
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        await onClick();
        setBusy(false);
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {busy ? t("Évaluation…", "Scoring…") : t("Soumettre pour évaluation", "Submit for scoring")}
    </button>
  );
}

function Check2({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${warn ? "text-amber-500" : "text-danger"}`} />}
      <span className={ok ? "" : "muted"}>{label}</span>
    </li>
  );
}

function Timer({ startedAt, minutes }: { startedAt: string; minutes: number }) {
  const tr = useT();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = now === null ? 0 : Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const over = secs > minutes * 60;
  const fmt = `${String(Math.floor(secs / 3600))}:${String(Math.floor((secs % 3600) / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-sm ${over ? "text-amber-300" : "text-white/85"}`} title={tr(`Objectif : ${minutes} minutes`, `Target: ${minutes} minutes`)} aria-label={`${tr("Temps écoulé", "Time elapsed")} ${fmt}`}>
      <Clock className="h-4 w-4" /> {fmt}
    </span>
  );
}

// ───────────────────────── Patient file ─────────────────────────

function PatientFile(props: RoomProps & { covered: string[] }) {
  const t = useT();
  const lang = useLang();
  const { history, covered } = props;
  const revealed: [string, string, string[]][] = [
    ["pmh", t("Antécédents médicaux", "Past medical history"), history.pastMedical],
    ["medications", t("Traitements", "Medications"), history.medications],
    ["allergies", t("Allergies", "Allergies"), history.allergies],
    ["family", t("Antécédents familiaux", "Family history"), history.family],
    ["smoking", t("Mode de vie", "Lifestyle"), history.social],
  ];
  const groups = [...new Set(TOPICS.map((t) => t.group))];
  return (
    <>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-1 text-sm font-semibold">{t("Dossier du patient", "Patient record")}</p>
        <p className="subtle mb-3 text-xs">{t("Se complète au fil de l'interrogatoire.", "Fills in as you take the history.")}</p>
        <dl className="space-y-2.5 text-xs">
          {revealed.map(([topic, label, items]) => (
            <div key={label}>
              <dt className="subtle font-semibold">{label}</dt>
              <dd className="mt-0.5">{covered.includes(topic) ? items.join(" · ") || t("Aucun", "None") : <span className="subtle italic">{t("Pas encore demandé", "Not asked yet")}</span>}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-2 text-sm font-semibold">{t("Couverture de l'interrogatoire", "History coverage")}</p>
        {groups.map((g) => (
          <div key={g} className="mb-2">
            <p className="subtle mb-1 text-[11px] font-semibold">{topicGroupLabel(g, lang)}</p>
            <div className="flex flex-wrap gap-1">
              {TOPICS.filter((tp) => tp.group === g && tp.key !== "greeting").map((tp) => (
                <span key={tp.key} className={`chip text-[11px] ${covered.includes(tp.key) ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-white/45"}`}>
                  {covered.includes(tp.key) && <Check className="h-3 w-3" />} {topicLabel(tp.key, lang)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ───────────────────────── Chat ─────────────────────────


function ChatPanel({
  sessionId, lang, messages, setMessages, onPatient, engineNote, voiceAllowed, setError,
}: {
  sessionId: string;
  lang: Lang;
  messages: RoomProps["messages"];
  setMessages: React.Dispatch<React.SetStateAction<RoomProps["messages"]>>;
  onPatient: (e: Emotion, topics: string[], note?: string, reply?: string) => void;
  engineNote: string;
  voiceAllowed: boolean;
  setError: (s: string) => void;
}) {
  const tr = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef<() => void>(() => {});
  // Detected after mount so server and client render the same markup.
  const [voice, setVoice] = useState<VoiceProvider | null>(null);
  useEffect(() => setVoice(browserVoice()), []);
  const dir = "ltr";

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setError("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "student", content: question, emotion: null }]);
    setText("");
    try {
      const r = await api<{ patient: { id: string; content: string; emotion: string }; topicsCovered: string[]; note?: string }>(`/api/sessions/${sessionId}/message`, "POST", { text: question });
      setMessages((m) => [...m, { id: r.patient.id, role: "patient", content: r.patient.content, emotion: r.patient.emotion }]);
      onPatient(r.patient.emotion as Emotion, r.topicsCovered, r.note, r.patient.content);
      if (speakReplies && voice?.supported.tts) voice.speak(r.patient.content, lang);
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== tempId));
      setText(question);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (!voice?.supported.stt) return;
    if (listening) {
      stopRef.current();
      setListening(false);
      return;
    }
    setListening(true);
    stopRef.current = voice.listen(
      lang,
      (t, final) => {
        setText(t);
        if (final) {
          setListening(false);
          send(t);
        }
      },
      () => setListening(false),
    );
  }

  return (
    <div className="flex h-full min-h-[460px] flex-col">
      <div className="flex items-center justify-between px-4 pt-2.5">
        <p className="subtle text-xs">{messages.filter((m) => m.role === "student").length} question(s)</p>
        <div className="flex items-center gap-2">
          {voiceAllowed ? (
            voice?.supported.tts ? (
              <button onClick={() => { setSpeakReplies(!speakReplies); voice.stopSpeaking(); }} className="btn-ghost px-2.5 py-1.5 text-xs" aria-pressed={speakReplies} title={tr("Lire à voix haute les réponses du patient", "Read the patient's answers aloud")}>
                {speakReplies ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} {tr("Réponses vocales", "Spoken replies")}
              </button>
            ) : null
          ) : (
            <Link href="/app/billing" className="subtle text-xs hover:text-brand-600" title={tr("La consultation vocale est incluse dans Étudiant Pro", "Voice consultation is included in Student Pro")}>
              {tr("Voix (Pro)", "Voice (Pro)")}
            </Link>
          )}
        </div>
      </div>
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" dir={dir}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
            <div dir="auto" className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "student" ? "rounded-ee-md bg-[#0a5be0] text-white" : "rounded-es-md bg-white/[0.07] text-white/90"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-[rgb(var(--panel-2))] px-4 py-3" aria-label={tr("Le patient répond", "The patient is answering")}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--ink-3))]" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
      {engineNote && (
        <p className="mx-4 mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {translateMessage(engineNote, lang)}
        </p>
      )}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2" dir={dir}>
        {QUICK[lang].map((q) => (
          <button key={q} onClick={() => send(q)} disabled={busy} className="chip shrink-0 border border-white/10 bg-white/[0.03] py-1 text-white/75 hover:border-[#2f86ff] hover:text-white">
            {q}
          </button>
        ))}
      </div>
      <form
        className="m-3 mt-1 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 focus-within:border-[#2f86ff]"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        {voiceAllowed && voice?.supported.stt && (
          <button type="button" onClick={toggleMic} className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${listening ? "bg-danger text-white" : "bg-white/10 text-white/80 hover:bg-white/15"}`} aria-pressed={listening} aria-label={listening ? tr("Arrêter l'écoute", "Stop listening") : tr("Poser la question à voix haute", "Ask the question aloud")}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <label htmlFor="ask" className="sr-only">{tr("Votre question au patient", "Your question to the patient")}</label>
        <input id="ask" dir="auto" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" value={text} onChange={(e) => setText(e.target.value)} placeholder={listening ? tr("Écoute…", "Listening…") : tr("Parlez à votre patient…", "Talk to your patient…")} maxLength={1000} autoComplete="off" />
        <button className="btn-primary h-9 w-9 shrink-0 rounded-lg p-0" disabled={busy || !text.trim()} aria-label={tr("Envoyer la question", "Send the question")}>
          <Send className="h-4 w-4" />
        </button>
      </form>
      {voiceAllowed && voice && !voice.supported.stt && <p className="subtle px-4 pb-2 text-[11px]">{tr("La saisie vocale n'est pas prise en charge par ce navigateur (essayez Chrome ou Edge).", "Voice input isn't supported in this browser (try Chrome or Edge).")}</p>}
    </div>
  );
}

// ───────────────────────── Exams & investigations ─────────────────────────

function ExamPanel({ sessionId, kind, done, onDone, setError }: { sessionId: string; kind: "PHYSICAL" | "INVESTIGATION"; done: RoomProps["exams"]; onDone: (e: RoomProps["exams"][number]) => void; setError: (s: string) => void }) {
  const t = useT();
  const lang = useLang();
  const catalog = (kind === "PHYSICAL" ? PHYSICAL_EXAMS.map((e) => localizeExam(e, lang)) : INVESTIGATIONS.map((i) => localizeInvestigation(i, lang))) as (ReturnType<typeof localizeExam> & { turnaround?: string })[];
  const categories = [...new Set(catalog.map((c) => c.category))];
  const [pending, setPending] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const doneCodes = new Set(done.map((d) => d.code));

  async function perform(code: string) {
    setPending(code);
    setError("");
    try {
      const r = await api<{ code: string; kind: "PHYSICAL" | "INVESTIGATION"; name: string; result: string; abnormal: boolean; createdAt: string }>(`/api/sessions/${sessionId}/exam`, "POST", { kind, code });
      onDone({ code: r.code, kind: r.kind, name: r.name, result: r.result, abnormal: r.abnormal, at: r.createdAt });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">{kind === "PHYSICAL" ? t("Examen clinique", "Physical examination") : t("Examens complémentaires", "Investigations")}</h2>
            <p className="subtle text-xs">
              {kind === "PHYSICAL" ? t("Choisissez les gestes que vous réaliseriez. Soyez ciblé : que pourrait confirmer ou éliminer chacun d'eux ?", "Choose the manoeuvres you would perform. Be targeted: what could each one confirm or rule out?") : t("Demandez des examens. Les examens essentiels rapportent des points ; ceux qui ajoutent coût, délai ou risque sans intérêt sont pénalisés.", "Order tests. Essential tests earn points; those adding cost, delay or risk without benefit are penalised.")}
            </p>
          </div>
          <input className="field w-48 py-1.5 text-sm" placeholder={t("Filtrer…", "Filter…")} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t("Filtrer la liste", "Filter the list")} />
        </div>
        <div className="space-y-4">
          {categories.map((cat) => {
            const items = catalog.filter((c) => c.category === cat && c.name.toLowerCase().includes(filter.toLowerCase()));
            if (!items.length) return null;
            return (
              <div key={cat}>
                <p className="subtle mb-2 text-[11px] font-semibold uppercase tracking-wider">{items[0].categoryLabel}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((it) => {
                    const isDone = doneCodes.has(it.code);
                    return (
                      <button key={it.code} onClick={() => !isDone && perform(it.code)} disabled={isDone || pending !== null} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${isDone ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-200" : "border-[rgb(var(--line))] hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/10"}`}>
                        <span>
                          {it.name}
                          {it.turnaround && <span className="subtle block text-[11px]">⏱ {it.turnaround}</span>}
                        </span>
                        {pending === it.code ? <Loader2 className="h-4 w-4 animate-spin" /> : isDone ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-brand-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel p-5">
        <h3 className="mb-3 font-semibold">{kind === "PHYSICAL" ? t("Résultats de l'examen", "Examination findings") : t("Résultats", "Results")}</h3>
        {done.length === 0 ? (
          <p className="subtle text-sm">{t("Rien pour l'instant.", "Nothing yet.")}</p>
        ) : (
          <ul className="space-y-2">
            {[...done].reverse().map((d) => (
              <li key={d.code} className={`rounded-xl border-l-4 bg-[rgb(var(--panel-2))] px-4 py-3 ${d.abnormal ? "border-danger" : "border-success"}`}>
                <p className="flex items-center justify-between text-sm font-semibold">
                  {d.name}
                  <span className={`chip ${d.abnormal ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"}`}>{d.abnormal ? t("Anormal", "Abnormal") : t("Normal", "Normal")}</span>
                </p>
                <p className="mt-1 text-sm">{d.result}</p>
                {d.code === "ecg" && <EcgResult text={d.result} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ───────────────────────── Reasoning & management ─────────────────────────

function ReasoningPanel(p: { ddx: string[]; setDdx: (v: string[]) => void; finalDx: string; setFinalDx: (v: string) => void; justification: string; setJustification: (v: string) => void }) {
  const t = useT();
  const [item, setItem] = useState("");
  const add = () => {
    const v = item.trim();
    if (v && !p.ddx.includes(v) && p.ddx.length < 10) p.setDdx([...p.ddx, v]);
    setItem("");
  };
  return (
    <div className="panel space-y-6 p-6">
      <div>
        <h2 className="font-semibold">{t("Diagnostics différentiels", "Differential diagnoses")}</h2>
        <p className="subtle text-xs">{t("Listez les hypothèses envisagées, de la plus probable à la moins probable. N'oubliez pas les diagnostics graves à éliminer.", "List the hypotheses you are considering, most to least likely. Don't forget serious diagnoses to rule out.")}</p>
        <div className="mt-3 flex gap-2">
          <input className="field" value={item} onChange={(e) => setItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} placeholder={t("ex. Dissection aortique", "e.g. Aortic dissection")} maxLength={200} aria-label={t("Ajouter un diagnostic différentiel", "Add a differential diagnosis")} />
          <button className="btn-ghost" onClick={add} type="button">
            <Plus className="h-4 w-4" /> {t("Ajouter", "Add")}
          </button>
        </div>
        <ol className="mt-3 space-y-1.5">
          {p.ddx.map((d, i) => (
            <li key={d} className="flex items-center gap-2 rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2 text-sm">
              <span className="subtle font-mono text-xs">{i + 1}</span>
              <span className="flex-1">{d}</span>
              <button onClick={() => p.setDdx(p.ddx.filter((x) => x !== d))} aria-label={`${t("Retirer", "Remove")} ${d}`} className="subtle hover:text-danger">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <label className="font-semibold" htmlFor="final-dx">{t("Diagnostic retenu", "Final diagnosis")}</label>
        <input id="final-dx" className="field mt-2" value={p.finalDx} onChange={(e) => p.setFinalDx(e.target.value)} placeholder={t("Votre diagnostic le plus probable", "Your most likely diagnosis")} maxLength={300} />
      </div>
      <div>
        <label className="font-semibold" htmlFor="justif">{t("Argumentation", "Reasoning")}</label>
        <p className="subtle text-xs">{t("Quels éléments de l'interrogatoire, de l'examen et des examens complémentaires soutiennent votre diagnostic, et pourquoi avez-vous écarté les autres ?", "Which findings from the history, examination and investigations support your diagnosis, and why did you rule out the others?")}</p>
        <textarea id="justif" className="field mt-2" rows={6} value={p.justification} onChange={(e) => p.setJustification(e.target.value)} maxLength={5000} />
        <p className="subtle mt-1 text-right text-[11px]">{p.justification.length}/5000</p>
      </div>
    </div>
  );
}

function ManagementPanel({ options, actions, setActions, notes, setNotes }: { options: { code: string; label: string }[]; actions: string[]; setActions: (v: string[]) => void; notes: string; setNotes: (v: string) => void }) {
  const t = useT();
  const toggle = (c: string) => setActions(actions.includes(c) ? actions.filter((x) => x !== c) : [...actions, c]);
  return (
    <div className="panel space-y-6 p-6">
      <div>
        <h2 className="font-semibold">{t("Prise en charge", "Management")}</h2>
        <p className="subtle text-xs">{t("Cochez toutes les actions que vous entreprendriez maintenant. Certaines options sont inadaptées voire dangereuses pour ce patient : choisissez avec soin.", "Tick every action you would take now. Some options are inappropriate or even dangerous for this patient: choose carefully.")}</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {options.map((o) => {
            const on = actions.includes(o.code);
            return (
              <label key={o.code} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${on ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10" : "border-[rgb(var(--line))] hover:border-brand-300"}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(o.code)} className="mt-0.5 h-4 w-4 accent-brand-600" />
                {o.label}
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <label className="font-semibold" htmlFor="mgmt-notes">{t("Surveillance, suivi et consignes", "Monitoring, follow-up and advice")}</label>
        <textarea id="mgmt-notes" className="field mt-2" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Orientation, surveillance, suivi, ce que vous diriez au patient…", "Disposition, monitoring, follow-up, what you would tell the patient…")} maxLength={5000} />
      </div>
    </div>
  );
}

// ───────────────────────── Notes & findings ─────────────────────────

function NotesPanel({ sessionId, initial }: { sessionId: string; initial: string }) {
  const t = useT();
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState<"saved" | "saving" | "dirty">("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function change(v: string) {
    setNotes(v);
    setSaved("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSaved("saving");
      await api(`/api/sessions/${sessionId}`, "PATCH", { notes: v }).catch(() => {});
      setSaved("saved");
    }, 800);
  }
  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <NotebookPen className="h-4 w-4 text-brand-600" /> {t("Notes cliniques", "Clinical notes")}
        </p>
        <span className="subtle text-[11px]">{saved === "saved" ? t("Enregistré", "Saved") : saved === "saving" ? t("Enregistrement…", "Saving…") : t("Modification", "Editing")}</span>
      </div>
      <textarea className="field min-h-[220px] font-mono text-xs leading-relaxed" value={notes} onChange={(e) => change(e.target.value)} placeholder={t("Motif :\nHistoire de la maladie :\nATCD :\nTraitements / allergies :\nMode de vie / ATCD familiaux :\nExamen :\nConclusion :", "Presenting complaint:\nHistory of presenting illness:\nPMH:\nMedications / allergies:\nSocial / family history:\nExamination:\nImpression:")} maxLength={20000} aria-label={t("Notes cliniques", "Clinical notes")} />
    </div>
  );
}

function FindingsPanel({ exams }: { exams: RoomProps["exams"] }) {
  const t = useT();
  const abnormal = exams.filter((e) => e.abnormal);
  return (
    <div className="panel p-4">
      <p className="mb-2 text-sm font-semibold">{t("Éléments clés recueillis", "Key findings so far")}</p>
      {abnormal.length === 0 ? (
        <p className="subtle text-xs">{t("Les résultats d'examen et d'analyses anormaux s'afficheront ici.", "Abnormal examination and test results will appear here.")}</p>
      ) : (
        <ul className="space-y-2">
          {abnormal.map((e) => (
            <li key={e.code} className="rounded-lg bg-red-50/70 px-3 py-2 text-xs dark:bg-red-500/10">
              <p className="font-semibold text-red-700 dark:text-red-300">{e.name}</p>
              <p className="mt-0.5">{e.result}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="subtle mt-3 text-[11px]">{exams.length} {t("examen(s) réalisé(s)", "test(s) done")}</p>
    </div>
  );
}

// ───────────────────────── Care: IV line, infusions, injections ─────────────────────────

const SERUMS = [
  { key: "nacl", label: "Sérum salé 0,9 %", en: "0.9% saline", match: /sal[ée]|saline|nacl|0[,.]9/i },
  { key: "g5", label: "Sérum glucosé 5 %", en: "5% dextrose", match: /gluco|dextrose/i },
  { key: "rl", label: "Ringer lactate", en: "Ringer's lactate", match: /ringer/i },
];
const INJECTABLE = /n[ée]bulis|a[ée]rosol|\bIV\b|injection|insuline?|h[ée]parine?|HNF|UFH|[ée]noxaparine?|morphine|t[ée]nect[ée]plase|alt[ée]plase|thrombolys[ei]s|fibrinolys[ei]s|bolus|antalgie|analgesia|potass|bicarbonate/i;
const FLUID = /s[ée]rum|saline|remplissage|resuscitation|perfusion|infusion/i;

function CarePanel({ options, actions, setActions, log, onLog }: { options: { code: string; label: string }[]; actions: string[]; setActions: (v: string[]) => void; log: string[]; onLog: (l: string) => void }) {
  const t = useT();
  const [line, setLine] = useState(log.some((l) => l.includes("Voie veineuse") || l.includes("IV line")));
  const [serum, setSerum] = useState(SERUMS[0].key);
  const [ml, setMl] = useState(500);
  const [hours, setHours] = useState(1);
  const [running, setRunning] = useState(false);
  const [shot, setShot] = useState<string | null>(null);
  const injectables = options.filter((o) => INJECTABLE.test(o.label) && !FLUID.test(o.label));
  const fluids = options.filter((o) => FLUID.test(o.label));
  const rate = dropsPerMin(ml, hours);
  const S = SERUMS.find((x) => x.key === serum)!;

  const toggle = (code: string, on: boolean) => setActions(on ? [...new Set([...actions, code])] : actions.filter((a) => a !== code));

  return (
    <div className="space-y-5 text-sm">
      {/* 1. IV line */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">1. {t("Voie veineuse périphérique", "Peripheral IV line")}</p>
            <p className="text-xs text-white/55">{t("Garrot, antisepsie, cathéter 18G au pli du coude, fixation.", "Tourniquet, skin prep, 18G cannula in the antecubital fossa, secure.")}</p>
          </div>
          {line ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-200"><Check className="h-3.5 w-3.5" /> {t("Posée", "In place")}</span>
          ) : (
            <button className="btn-primary shrink-0 px-3 py-1.5 text-xs" onClick={() => { setLine(true); onLog(t("Voie veineuse périphérique posée (cathéter 18G, pli du coude).", "Peripheral IV line inserted (18G cannula, antecubital fossa).")); }}>{t("Poser la voie", "Insert the line")}</button>
          )}
        </div>
      </section>

      {/* 2. Infusion */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="font-semibold">2. {t("Perfusion", "Infusion")}</p>
        <div className="mt-3 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2.5">
            <div className="flex flex-wrap gap-1.5">
              {SERUMS.map((x) => (
                <button key={x.key} onClick={() => setSerum(x.key)} className={`rounded-full border px-2.5 py-1 text-xs ${serum === x.key ? "border-[#2f86ff] bg-[#2f86ff]/20 text-white" : "border-white/15 text-white/70 hover:border-white/40"}`}>{t(x.label, x.en)}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-white/60">{t("Volume", "Volume")}
                <select value={ml} onChange={(e) => setMl(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1830] px-2 py-1.5 text-white">
                  {[250, 500, 1000].map((v) => <option key={v} value={v}>{v} mL</option>)}
                </select>
              </label>
              <label className="text-xs text-white/60">{t("Durée", "Duration")}
                <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-[#0a1830] px-2 py-1.5 text-white">
                  {[0.5, 1, 2, 4, 8, 12].map((v) => <option key={v} value={v}>{v < 1 ? "30 min" : `${v} h`}</option>)}
                </select>
              </label>
            </div>
            <p className="rounded-lg bg-white/5 px-3 py-2 font-mono text-xs text-white/80">
              {t("Débit", "Rate")} : {Math.round(ml / hours)} mL/h · <b className="text-[#7fe7ff]">{rate} {t("gouttes/min", "drops/min")}</b> <span className="text-white/45">({t("perfuseur 20 gouttes = 1 mL", "giving set 20 drops = 1 mL")})</span>
            </p>
            <button
              className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40"
              disabled={!line || running}
              title={line ? undefined : t("Posez d'abord une voie veineuse", "Insert an IV line first")}
              onClick={() => {
                setRunning(true);
                const opt = fluids.find((o) => S.match.test(o.label));
                if (opt) toggle(opt.code, true);
                onLog(t(`Perfusion de ${S.label}, ${ml} mL en ${hours < 1 ? "30 min" : `${hours} h`} (${rate} gouttes/min).`, `Infusion of ${S.en}, ${ml} mL over ${hours < 1 ? "30 min" : `${hours} h`} (${rate} drops/min).`));
              }}
            >
              {running ? t("Perfusion en cours", "Infusion running") : line ? t("Démarrer la perfusion", "Start the infusion") : t("Voie veineuse requise", "IV line required")}
            </button>
          </div>
          <DripBag label={t(S.label, S.en)} rate={rate} running={running} />
        </div>
      </section>

      {/* 3. Injections */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="font-semibold">3. {t("Injections et traitements parentéraux", "Injections and parenteral treatment")}</p>
        {injectables.length === 0 ? (
          <p className="mt-2 text-xs text-white/55">{t("Aucun traitement injectable n'est proposé dans ce cas : réfléchissez à la conduite à tenir dans l'onglet « Conduite ».", "No injectable treatment is offered in this case: think about management in the \"Plan\" tab.")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {injectables.map((o) => {
              const on = actions.includes(o.code);
              const needsLine = /\bIV\b|perfusion|infusion|pousse-seringue|t[ée]nect|alt[ée]p|thrombolys|fibrinolys/i.test(o.label);
              return (
                <li key={o.code} className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${on ? "border-[#2f86ff]/60 bg-[#2f86ff]/10" : "border-white/10"}`}>
                  <span className="text-[13px]">{o.label}</span>
                  <button
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${on ? "bg-white/10 text-white/80 hover:bg-white/15" : "bg-[#1f6fe0] text-white hover:bg-[#2f86ff]"} disabled:opacity-40`}
                    disabled={!on && needsLine && !line}
                    title={!on && needsLine && !line ? t("Voie veineuse requise", "IV line required") : undefined}
                    onClick={() => {
                      toggle(o.code, !on);
                      if (!on) {
                        setShot(o.code);
                        setTimeout(() => setShot(null), 1400);
                        onLog(`${t("Administré", "Given")} : ${o.label}.`);
                      }
                    }}
                  >
                    {on ? t("Annuler", "Undo") : needsLine && !line ? t("VVP requise", "IV needed") : t("Administrer", "Give")}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <AnimatePresence>
          {shot && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-3 text-xs text-[#7fe7ff]">
              <motion.span animate={{ x: [0, -14, 0] }} transition={{ duration: 0.9 }}><Syringe className="h-7 w-7" weight="duotone" /></motion.span>
              {t("Injection réalisée, notée dans votre prise en charge.", "Injection given, recorded in your management.")}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {log.length > 0 && (
        <section>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/45">{t("Feuille de soins", "Care record")}</p>
          <ul className="space-y-1 font-mono text-[11px] text-white/70">{log.map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

/** ECG investigation: the written result plus a matching 12-lead tracing to read. */
function EcgResult({ text }: { text: string }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  const spec = useMemo(() => ecgSpecFromText(text), [text]);
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="text-xs font-semibold text-[#6fb1ff] hover:underline">{open ? t("Masquer le tracé", "Hide the tracing") : t("Voir le tracé ECG", "Show the ECG tracing")}</button>
      {open && <EcgPaper spec={spec} className="mt-2" />}
    </div>
  );
}
