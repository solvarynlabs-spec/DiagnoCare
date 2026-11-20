import { AlertTriangle, BookOpen, Prescription, CheckCircle2, Circle, GraduationCap, Lightbulb, MessageSquareQuote, MinusCircle, Target } from "@/components/icons";
import type { AssessmentResult, ClinicalCase, ConversationMessage, ConsultationSession, DiagnosisSubmission, MedicalExamination, User } from "@prisma/client";
import { parseJson } from "@/lib/db";
import { specialtyName } from "@/lib/catalog";
import type { CaseContent } from "@/lib/sim/types";
import { Badge, Card, CardTitle, DifficultyBadge, ScoreRing, fmtDate, scoreTone } from "@/components/ui";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";
import { reportInLang } from "@/lib/sim/report-i18n";
import { localizeExamRows } from "@/lib/sim/exam-text";
import { CaseDebrief, DraftBanner, ReferencePanel, ReviewPanel } from "@/components/pedagogy";

export type FullSession = ConsultationSession & {
  case: ClinicalCase;
  user: User;
  result: AssessmentResult | null;
  diagnosis: DiagnosisSubmission | null;
  messages: ConversationMessage[];
  examinations: MedicalExamination[];
};

export async function ReportView({ s, content: rawContent, actions }: { s: FullSession; content: CaseContent; actions?: React.ReactNode }) {
  const lang = await getLang();
  const t = makeT(lang);
  const r = s.result!;
  const { score, feedback: fb, content } = reportInLang({ ...s, slug: s.case.slug, result: r }, rawContent, lang);
  const examinations = localizeExamRows(s.examinations, rawContent, s.case.slug, lang);
  const title = localizeCaseMeta(s.case, lang).title;
  const ddx = parseJson<string[]>(s.diagnosis?.differentials, []);
  const mgmt = parseJson<string[]>(s.diagnosis?.managementActions, []);
  const rx = parseJson<{ name: string; dose: string; route: string; frequency: string; duration: string; notes: string }[]>(s.diagnosis?.prescription, []);
  const finalScore = r.teacherScoreOverride ?? r.totalScore;
  const optLabel = (code: string) => content.rubric.management.options.find((o) => o.code === code);

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center gap-6 p-6">
        <ScoreRing value={finalScore} size={104} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="blue">{specialtyName(s.case.specialty, lang)}</Badge>
            <DifficultyBadge d={s.case.difficulty} />
            <Badge tone={scoreTone(finalScore)}>{finalScore >= 75 ? t("Très bonne prestation", "Very good performance") : finalScore >= 50 ? t("En progrès", "Improving") : t("À retravailler", "Needs more work")}</Badge>
            {r.teacherScoreOverride != null && <Badge tone="amber">{t("Ajustée par l'enseignant", "Adjusted by the teacher")} ({t("grille", "rubric")} : {r.totalScore})</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
          <p className="subtle mt-1 text-sm">
            {s.user.name} · {fmtDate(s.completedAt, lang)} · {score.durationMinutes} min · {score.questionsAsked} questions · {s.language === "en" ? "EN" : "FR"} · {t("grille", "rubric")} v{r.rubricVersion}
          </p>
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardTitle sub={t("Chaque point est rattaché à un critère explicite de la grille", "Every point is tied to an explicit rubric criterion")}>{t("Détail de la note", "Score breakdown")}</CardTitle>
          <div className="space-y-5">
            {score.categories.map((c) => (
              <details key={c.key} className="group" open={c.score < c.max * 0.75}>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{c.label}</span>
                    <span className="font-mono">
                      {c.score} / {c.max}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-[rgb(var(--panel-2))]">
                    <div className={`h-2 rounded-full ${c.score >= c.max * 0.75 ? "bg-success" : c.score >= c.max * 0.5 ? "bg-brand-600" : "bg-danger"}`} style={{ width: `${c.max ? (Math.max(0, c.score) / c.max) * 100 : 0}%` }} />
                  </div>
                </summary>
                <ul className="mt-3 space-y-1.5 border-l-2 border-[rgb(var(--line))] pl-4">
                  {c.items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {it.points < 0 ? <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" /> : it.achieved ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--ink-3))]" />}
                      <span className="flex-1">
                        <span className={it.points < 0 ? "text-danger" : it.achieved ? "" : "muted"}>{it.label}</span>
                        {it.note && (it.points < 0 || !it.achieved) && <span className="subtle block text-xs">{it.note}</span>}
                      </span>
                      <span className={`font-mono text-xs ${it.points < 0 ? "text-danger" : "subtle"}`}>
                        {it.points > 0 ? "+" : ""}
                        {it.points}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-teal-500" /> {t("Diagnostic", "Diagnosis")}
              </span>
            </CardTitle>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">{t("Votre diagnostic", "Your diagnosis")}</dt>
                <dd className="mt-0.5 font-medium">{s.diagnosis?.finalDiagnosis}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">{t("Diagnostic du cas", "Case diagnosis")}</dt>
                <dd className="mt-0.5 font-semibold text-teal-700 dark:text-teal-300">{content.answer.diagnosis}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">{t("Vos différentiels", "Your differentials")}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{ddx.length ? ddx.map((d) => <span key={d} className="chip bg-[rgb(var(--panel-2))]">{d}</span>) : <span className="subtle">{t("Aucun", "None")}</span>}</dd>
              </div>
              <div>
                <dt className="subtle text-xs font-semibold uppercase tracking-wide">{t("Différentiels à évoquer", "Differentials to consider")}</dt>
                <dd className="mt-1 flex flex-wrap gap-1">{content.answer.differentials.map((d) => <span key={d.name} className="chip bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">{d.name}</span>)}</dd>
              </div>
            </dl>
            {fb.reasoningComment && <p className="muted mt-4 rounded-xl bg-[rgb(var(--panel-2))] p-3 text-sm leading-relaxed">{fb.reasoningComment}</p>}
          </Card>

          {r.teacherComment && (
            <Card className="border-amber-300 dark:border-amber-500/40">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <MessageSquareQuote className="h-4 w-4 text-amber-500" /> {t("Commentaire de l'enseignant", "Teacher's comment")}
                </span>
              </CardTitle>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.teacherComment}</p>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardTitle sub={r.feedbackSource.startsWith("rubric+") ? t("Analyse par grille et commentaire détaillé", "Rubric analysis and detailed comment") : t("Feedback issu de la grille", "Rubric-based feedback")}>
          <span className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-600" /> {t("Feedback pédagogique", "Educational feedback")}
          </span>
        </CardTitle>
        <p className="text-[15px] leading-relaxed">{fb.summary}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" /> {t("Points forts", "Strengths")}
            </p>
            <ul className="space-y-1.5 text-sm">{fb.strengths?.map((x, i) => <li key={i}>• {x}</li>)}</ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-danger">
              <AlertTriangle className="h-4 w-4" /> {t("Axes d'amélioration", "Areas to improve")}
            </p>
            <ul className="space-y-1.5 text-sm">{fb.improvements?.length ? fb.improvements.map((x, i) => <li key={i}>• {x}</li>) : <li className="subtle">{t("Rien de majeur — bravo.", "Nothing major — well done.")}</li>}</ul>
          </div>
        </div>
        {fb.missedFindings?.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold">{t("Éléments clés non recherchés", "Key findings not sought")}</p>
            <ul className="grid gap-2 md:grid-cols-2">
              {fb.missedFindings.map((x, i) => (
                <li key={i} className="rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2 text-xs">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 rounded-xl bg-teal-50 p-4 dark:bg-teal-500/10">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-teal-800 dark:text-teal-200">
            <Lightbulb className="h-4 w-4" /> {t("Points pédagogiques", "Teaching points")}
          </p>
          <ul className="space-y-1.5 text-sm">{content.answer.teachingPoints.map((x, i) => <li key={i}>• {x}</li>)}</ul>
        </div>
        <p className="subtle mt-4 text-xs">{fb.disclaimer}</p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>{t("Examens réalisés", "Tests performed")}</CardTitle>
          <ul className="space-y-2 text-sm">
            {examinations.length === 0 && <li className="subtle">{t("Aucun examen.", "No tests.")}</li>}
            {examinations.map((e) => (
              <li key={e.id} className={`rounded-lg border-l-4 bg-[rgb(var(--panel-2))] px-3 py-2 ${e.abnormal ? "border-danger" : "border-success"}`}>
                <p className="text-xs font-semibold">
                  {e.kind === "PHYSICAL" ? t("Examen", "Exam") : t("Analyse", "Test")} · {e.name}
                </p>
                <p className="text-xs">{e.result}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>{t("Prise en charge", "Management")}</CardTitle>
          <ul className="space-y-1.5 text-sm">
            {mgmt.length === 0 && <li className="subtle">{t("Aucune action choisie.", "No action chosen.")}</li>}
            {mgmt.map((code) => {
              const o = optLabel(code);
              return (
                <li key={code} className="flex items-start gap-2">
                  {o?.kind === "contraindicated" ? <MinusCircle className="mt-0.5 h-4 w-4 text-danger" /> : o?.kind === "neutral" ? <Circle className="mt-0.5 h-4 w-4 text-amber-500" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />}
                  <span>
                    {o?.label ?? code}
                    {o && <span className="subtle block text-xs">{o.rationale}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {s.diagnosis?.managementNotes && <p className="muted mt-4 whitespace-pre-wrap rounded-lg bg-[rgb(var(--panel-2))] p-3 text-sm">{s.diagnosis.managementNotes}</p>}
        </Card>
      </div>

      {/* Optional, ungraded prescription exercise — shown as written by the student. */}
      <Card>
        <CardTitle sub={t("Étape facultative, non notée : saisie libre de l'étudiant, affichée telle quelle.", "Optional, unscored step: the student's free-text entries, shown as written.")}>
          <span className="flex items-center gap-2">
            <Prescription className="h-4 w-4 text-brand-600" /> {t("Ordonnance de l'étudiant", "Student's prescription")}
          </span>
        </CardTitle>
        <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" role="note">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Simulation pédagogique — ne constitue pas une ordonnance réelle.
            {lang === "en" && <span className="block font-normal">Educational simulation — not a real prescription.</span>}
          </span>
        </p>
        {rx.length === 0 ? (
          <p className="subtle text-sm">{t("Aucune ordonnance rédigée (étape facultative).", "No prescription written (optional step).")}</p>
        ) : (
          <ol className="space-y-1.5 text-sm">
            {rx.map((e, i) => (
              <li key={i} className="rounded-lg bg-[rgb(var(--panel-2))] px-3 py-2">
                <span className="subtle mr-1.5 font-mono text-xs">{i + 1}.</span>
                <span className="font-semibold">{e.name}</span>
                {[e.dose, e.route, e.frequency, e.duration].some((x) => x) && <span className="muted"> — {[e.dose, e.route, e.frequency, e.duration].filter(Boolean).join(" · ")}</span>}
                {e.notes && <span className="subtle mt-0.5 block text-xs">{e.notes}</span>}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {rawContent.pedagogy && (
        <Card>
          <CardTitle sub={t("Raisonnement attendu, points à ne pas manquer, réflexion et sources", "Expected reasoning, must-not-miss points, reflection and sources")}>{t("Débriefing", "Debrief")}</CardTitle>
          {s.case.status !== "PUBLISHED" && <DraftBanner lang={lang} className="mb-5 !text-amber-700 dark:!text-amber-100" />}
          <CaseDebrief p={rawContent.pedagogy} lang={lang} />
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ReviewPanel tone="theme" review={rawContent.pedagogy.review} lang={lang} live={{ status: s.case.status, version: s.case.version, reviewedBy: s.case.reviewedBy, reviewedAt: s.case.reviewedAt }} />
            <ReferencePanel tone="theme" refs={rawContent.pedagogy.refs} lang={lang} />
          </div>
        </Card>
      )}

      <Card>
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-4 w-4 text-brand-600" /> {t("Transcription de la consultation", "Consultation transcript")} ({s.messages.length} messages)
            </span>
            <span className="subtle text-xs">{t("Afficher / masquer", "Show / hide")}</span>
          </summary>
          <div className="mt-4 space-y-2" dir="auto">
            {s.messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                <div dir="auto" className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "student" ? "bg-brand-600 text-white" : "bg-[rgb(var(--panel-2))]"}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          {s.diagnosis?.justification && (
            <div className="mt-4">
              <p className="text-sm font-semibold">{t("Argumentation de l'étudiant", "Student's reasoning")}</p>
              <p className="muted mt-1 whitespace-pre-wrap text-sm">{s.diagnosis.justification}</p>
            </div>
          )}
          {s.notes && (
            <div className="mt-4">
              <p className="text-sm font-semibold">{t("Notes cliniques", "Clinical notes")}</p>
              <pre className="muted mt-1 whitespace-pre-wrap rounded-lg bg-[rgb(var(--panel-2))] p-3 font-mono text-xs">{s.notes}</pre>
            </div>
          )}
        </details>
      </Card>
    </div>
  );
}
