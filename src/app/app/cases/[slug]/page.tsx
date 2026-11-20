import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain, ClipboardCheck, Clock, FlaskConical, Lock, MapPin, MessagesSquare, Stethoscope, Target, UserRound } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { caseContent } from "@/lib/cases/repo";
import { difficultyLabel, specialtyName } from "@/lib/catalog";
import { canAccessCase, monthlyUsage } from "@/lib/sim/service";
import { aiMode } from "@/lib/sim/engines";
import { Photo } from "@/components/motion";
import type { PhotoKey } from "@/lib/photos";
import { StartCase } from "./start-case";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseContent, localizeCaseMeta } from "@/lib/cases/i18n";
import { translateMessage } from "@/lib/i18n/messages";


/** Real bedside photograph matching the patient (see lib/photos.ts). */
const bedPhoto = (age: number, sex: "F" | "M"): PhotoKey => (age < 12 ? "bedChild" : sex === "F" ? "bedWoman" : "bedMan");

export default async function CaseBrief({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ assignment?: string }> }) {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const STEPS = [
    { icon: MessagesSquare, t: t("Interrogatoire", "History taking"), d: t("Questions libres, à l'écrit ou à la voix", "Free questions, typed or spoken") },
    { icon: Stethoscope, t: t("Examen clinique", "Physical examination"), d: t("35 gestes, tensiomètre, glucomètre", "35 manoeuvres, BP cuff, glucometer") },
    { icon: FlaskConical, t: t("Examens", "Investigations"), d: t("Biologie, ECG, imagerie", "Labs, ECG, imaging") },
    { icon: Brain, t: t("Diagnostic", "Diagnosis"), d: t("Différentiels et argumentation", "Differentials and reasoning") },
    { icon: ClipboardCheck, t: t("Conduite à tenir", "Management"), d: t("Traitement, soins, orientation", "Treatment, care, disposition") },
  ];
  const { slug } = await params;
  const { assignment } = await searchParams;
  const c = await prisma.clinicalCase.findUnique({ where: { slug } });
  if (!c) notFound();
  const content = localizeCaseContent(caseContent(c), c.slug, lang);
  const meta = localizeCaseMeta(c, lang, parseJson<string[]>(c.learningObjectives, []));
  const assigned = assignment ? await prisma.assignment.findFirst({ where: { id: assignment, caseId: c.id, group: { members: { some: { userId: user.id } } } } }) : null;
  const allowed = !!assigned || canAccessCase(user, c);
  if (!allowed && c.status !== "PUBLISHED") notFound();
  const limit = user.plan.limits.simulationsPerMonth;
  const used = await monthlyUsage(user.id);
  const overLimit = !assigned && limit !== null && used >= limit;
  const objectives = meta.objectivesLocalized;
  const mode = aiMode();
  const p = content.patient;
  const [place, time] = content.setting.split(" — ");
  const complaint = lang === "en" ? content.chiefComplaint.en : content.chiefComplaint.fr ?? content.chiefComplaint.en;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] text-white sm:-mx-6 sm:-my-8">
      {/* ── Hero with the patient's photo ── */}
      <section className="relative overflow-hidden">
        <Photo photo={bedPhoto(p.age, p.sex)} className={`absolute inset-0 opacity-60 ${p.sex === "M" && p.age >= 12 ? "-scale-x-100" : ""}`} priority sizes="100vw" w={1800} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050c1a] via-[#050c1a]/90 to-[#050c1a]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050c1a] via-transparent to-[#050c1a]/40" />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-8 sm:px-8 lg:grid-cols-[1.35fr_1fr] lg:items-end lg:pb-16">
          <div>
            <Link href="/app/cases" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> {t("Bibliothèque de cas", "Case library")}
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="rounded-full bg-[#2f86ff]/20 px-3 py-1 text-[#9ccaff]">{specialtyName(c.specialty, lang)}</span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-white/75">{difficultyLabel(c.difficulty, lang)}</span>
              {c.status !== "PUBLISHED" && <span className="rounded-full border border-white/15 px-3 py-1 text-white/75">{c.status === "DRAFT" ? t("Brouillon", "Draft") : t("En relecture", "In review")}</span>}
              {assigned && <span className="rounded-full bg-white/10 px-3 py-1">{t("Devoir", "Assignment")} : {assigned.title}</span>}
            </div>
            <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">{meta.title}</h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{meta.summary}</p>
            {complaint && (
              <blockquote className="mt-6 max-w-xl border-l-2 border-[#38e1ff] pl-4 text-lg italic text-white/90">{t("«", "“")} {complaint} {t("»", "”")}</blockquote>
            )}
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <Fact icon={UserRound} label={t("Patient", "Patient")} value={`${p.name.split(" (")[0]}, ${p.age} ${t("ans", "y/o")}`} />
              <Fact icon={MapPin} label={t("Lieu", "Setting")} value={place} />
              {time && <Fact icon={Clock} label={t("Heure", "Time")} value={time} />}
              <Fact icon={Clock} label={t("Durée", "Duration")} value={`≈ ${c.estimatedMinutes} min`} />
            </dl>
          </div>

          {/* Start panel */}
          <div className="rounded-3xl border border-white/10 bg-[#081427]/85 p-6 shadow-2xl backdrop-blur-xl">
            {allowed && !overLimit ? (
              <StartCase caseId={c.id} assignmentId={assigned?.id} aiMode={mode} />
            ) : (
              <div className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#2f86ff]/15 text-[#6fb1ff]"><Lock className="h-6 w-6" /></span>
                <p className="mt-3 text-lg font-semibold">{overLimit ? t("Limite mensuelle atteinte", "Monthly limit reached") : t("Cas réservé à Étudiant Pro", "Student Pro case")}</p>
                <p className="mt-1 text-sm text-white/60">{overLimit ? t(`La formule Gratuit inclut ${limit} simulations par mois.`, `The Free plan includes ${limit} simulations per month.`) : t("Passez à Pro pour débloquer toute la bibliothèque.", "Upgrade to Pro to unlock the full library.")}</p>
                <Link href="/app/billing" className="btn-primary mt-5 w-full py-3">{t("Voir les formules", "See plans")}</Link>
              </div>
            )}
            {limit !== null && !assigned && (
              <p className="mt-4 text-center text-xs text-white/45">{Math.min(used, limit)}/{limit} {t("simulations utilisées ce mois-ci", "simulations used this month")}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Details ── */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-14 sm:px-8 lg:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="flex items-center gap-2 font-semibold"><Target className="h-5 w-5 text-[#6fb1ff]" /> {t("Objectifs pédagogiques", "Learning objectives")}</h2>
          <ol className="mt-4 space-y-3">
            {objectives.map((o, k) => (
              <li key={o} className="flex gap-3 text-sm leading-relaxed text-white/80">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2f86ff]/20 text-xs font-bold text-[#9ccaff]">{k + 1}</span>
                {o}
              </li>
            ))}
          </ol>
          {assigned?.instructions && (
            <div className="mt-6 rounded-xl border border-[#2f86ff]/30 bg-[#2f86ff]/10 p-4 text-sm">
              <p className="font-semibold">{t("Consignes de l'enseignant", "Teacher's instructions")}</p>
              <p className="mt-1 text-white/75">{assigned.instructions}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold">{t("Déroulé de la consultation", "How the consultation works")}</h2>
          <ol className="relative mt-4 space-y-4 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-white/10">
            {STEPS.map((s) => (
              <li key={s.t} className="relative flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#2f86ff]/50 bg-[#081427] text-[#6fb1ff]"><s.icon className="h-4 w-4" /></span>
                <span><span className="block text-sm font-medium">{s.t}</span><span className="block text-xs text-white/50">{s.d}</span></span>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-xs text-white/35 lg:col-span-2">
          {t("Cas fictif à visée pédagogique", "Fictional teaching case")} · version {c.version} · {c.reviewedBy ? t(`relu par ${c.reviewedBy}`, `reviewed by ${translateMessage(c.reviewedBy, "en")}`) : t("relecture experte en attente", "expert review pending")}
        </p>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-white/45"><Icon className="h-3.5 w-3.5" /> {label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
