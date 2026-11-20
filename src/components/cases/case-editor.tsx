"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Plus, Save, Trash2 } from "@/components/icons";
import { DIFFICULTIES, INVESTIGATIONS, PHYSICAL_EXAMS, SPECIALTIES, TOPICS, difficultyLabel, localizeExam, localizeInvestigation, specialtyName, topicGroupLabel, topicLabel } from "@/lib/catalog";
import { useLang, useT } from "@/lib/i18n/client";
import { api } from "@/lib/client";
import type { CaseContent, Difficulty, Emotion } from "@/lib/sim/types";
import { PatientAvatar } from "@/components/sim/patient-avatar";

export interface EditorValue {
  meta: { slug: string; title: string; specialty: string; difficulty: Difficulty; summary: string; objectives: string[]; minutes: number; freeTier: boolean };
  content: CaseContent;
}

const TABS = [
  ["Général", "General"],
  ["Patient", "Patient"],
  ["Interrogatoire", "History"],
  ["Examen clinique", "Examination"],
  ["Examens compl.", "Investigations"],
  ["Diagnostic", "Diagnosis"],
  ["Prise en charge et grille", "Management & rubric"],
] as const;
type TabKey = (typeof TABS)[number][0];
const EMOTIONS: Emotion[] = ["neutral", "anxious", "pain", "distressed", "tired", "relieved", "irritated"];
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function CaseEditor({ initial, id, readOnly }: { initial: EditorValue; id?: string; readOnly?: boolean }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [v, setV] = useState<EditorValue>(initial);
  const [tab, setTab] = useState<TabKey>("Général");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const upd = (fn: (d: EditorValue) => void) =>
    setV((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  const c = v.content;
  const r = c.rubric;
  const weightSum = Object.values(r.weights).reduce((a, b) => a + Number(b || 0), 0);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const payload = { id, meta: { ...v.meta, objectives: v.meta.objectives.filter(Boolean) }, content: v.content };
      const res = await api<{ id: string; status: string; version: number }>("/api/cases", "POST", payload);
      setMsg({ ok: true, text: t(`Enregistré en v${res.version} (${res.status === "DRAFT" ? "brouillon" : res.status.toLowerCase()}).`, `Saved as v${res.version} (${res.status.toLowerCase().replace("_", " ")}).`) });
      if (!id) router.push(`/teach/cases/${res.id}`);
      else router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel sticky top-16 z-10 flex flex-wrap items-center gap-2 p-2">
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {TABS.map(([k, en]) => (
            <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${tab === k ? "bg-brand-600 text-white" : "muted hover:bg-[rgb(var(--panel-2))]"}`}>
              {t(k, en)}
            </button>
          ))}
        </div>
        {!readOnly && (
          <button className="btn-primary" disabled={busy} onClick={save}>
            <Save className="h-4 w-4" /> {busy ? t("Enregistrement…", "Saving…") : t("Enregistrer le brouillon", "Save draft")}
          </button>
        )}
      </div>
      {msg && <p className={`rounded-xl px-4 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" : "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-200"}`}>{msg.text}</p>}

      <fieldset disabled={readOnly} className="panel space-y-5 p-6">
        {tab === "Général" && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <F label={t("Titre", "Title")}>
                <input className="field" value={v.meta.title} onChange={(e) => upd((d) => { d.meta.title = e.target.value; if (!id && !initial.meta.slug) d.meta.slug = slugify(e.target.value); })} />
              </F>
              <F label={t("Identifiant (URL)", "Identifier (URL)")}>
                <input className="field font-mono" value={v.meta.slug} onChange={(e) => upd((d) => void (d.meta.slug = slugify(e.target.value)))} />
              </F>
              <F label={t("Spécialité", "Specialty")}>
                <select className="field" value={v.meta.specialty} onChange={(e) => upd((d) => void (d.meta.specialty = e.target.value))}>
                  {SPECIALTIES.map((s) => <option key={s.key} value={s.key}>{specialtyName(s.key, lang)}</option>)}
                </select>
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label={t("Niveau", "Level")}>
                  <select className="field" value={v.meta.difficulty} onChange={(e) => upd((d) => void (d.meta.difficulty = e.target.value as Difficulty))}>
                    {DIFFICULTIES.map((x) => <option key={x.key} value={x.key}>{difficultyLabel(x.key, lang)}</option>)}
                  </select>
                </F>
                <F label="Minutes">
                  <input type="number" min={5} max={120} className="field" value={v.meta.minutes} onChange={(e) => upd((d) => void (d.meta.minutes = Number(e.target.value)))} />
                </F>
              </div>
            </div>
            <F label={t("Résumé affiché à l'étudiant (sans le diagnostic !)", "Summary shown to the student (no diagnosis!)")}>
              <textarea className="field" rows={2} value={v.meta.summary} onChange={(e) => upd((d) => void (d.meta.summary = e.target.value))} />
            </F>
            <F label={t("Objectifs pédagogiques (un par ligne)", "Learning objectives (one per line)")}>
              <textarea className="field" rows={4} value={v.meta.objectives.join("\n")} onChange={(e) => upd((d) => void (d.meta.objectives = e.target.value.split("\n")))} />
            </F>
            <div className="grid gap-4 md:grid-cols-2">
              <F label={t("Symptômes pour la recherche (séparés par des virgules)", "Symptoms for search (comma-separated)")}>
                <input className="field" value={c.symptoms.join(", ")} onChange={(e) => upd((d) => void (d.content.symptoms = csv(e.target.value)))} />
              </F>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" checked={v.meta.freeTier} onChange={(e) => upd((d) => void (d.meta.freeTier = e.target.checked))} /> {t("Disponible dans la formule Gratuit", "Available on the Free plan")}
              </label>
            </div>
          </>
        )}

        {tab === "Patient" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <F label={t("Nom fictif", "Fictional name")}><input className="field" value={c.patient.name} onChange={(e) => upd((d) => void (d.content.patient.name = e.target.value))} /></F>
                <F label={t("Âge", "Age")}><input type="number" className="field" value={c.patient.age} onChange={(e) => upd((d) => void (d.content.patient.age = Number(e.target.value)))} /></F>
                <F label={t("Sexe", "Sex")}>
                  <select className="field" value={c.patient.sex} onChange={(e) => upd((d) => void (d.content.patient.sex = e.target.value as "F" | "M"))}>
                    <option value="F">{t("Femme", "Female")}</option>
                    <option value="M">{t("Homme", "Male")}</option>
                  </select>
                </F>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <F label={t("Profession", "Occupation")}><input className="field" value={c.patient.occupation} onChange={(e) => upd((d) => void (d.content.patient.occupation = e.target.value))} /></F>
                <F label={t("Lieu", "Setting")}><input className="field" value={c.setting} onChange={(e) => upd((d) => void (d.content.setting = e.target.value))} placeholder={t("ex. Urgences d'un CHU d'Oran — 02h10", "e.g. Oran teaching-hospital ED — 02:10")} /></F>
              </div>
              <F label={t("Caractère et façon de parler (guide le personnage IA)", "Character and way of speaking (guides the AI persona)")}>
                <textarea className="field" rows={3} value={c.patient.personality} onChange={(e) => upd((d) => void (d.content.patient.personality = e.target.value))} />
              </F>
              <div className="grid gap-4 md:grid-cols-4">
                <F label={t("Émotion de base", "Baseline emotion")}>
                  <select className="field" value={c.patient.baselineEmotion} onChange={(e) => upd((d) => void (d.content.patient.baselineEmotion = e.target.value as Emotion))}>
                    {EMOTIONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </F>
                <F label={t("Teint", "Skin tone")}><input type="color" className="field h-10 p-1" value={c.patient.avatar.skin} onChange={(e) => upd((d) => void (d.content.patient.avatar.skin = e.target.value))} /></F>
                <F label={t("Couleur des cheveux", "Hair colour")}><input type="color" className="field h-10 p-1" value={c.patient.avatar.hair} onChange={(e) => upd((d) => void (d.content.patient.avatar.hair = e.target.value))} /></F>
                <F label={t("Coiffure", "Hairstyle")}>
                  <select className="field" value={c.patient.avatar.hairStyle} onChange={(e) => upd((d) => void (d.content.patient.avatar.hairStyle = e.target.value as "short"))}>
                    {["short", "long", "bald", "child"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </F>
              </div>
              <F label={t("Première phrase (motif, tel que dit par le patient)", "Opening line (presenting complaint, in the patient's words)")}>
                <input className="field" value={c.chiefComplaint.fr ?? c.chiefComplaint.en} onChange={(e) => upd((d) => void (d.content.chiefComplaint = { ...d.content.chiefComplaint, fr: e.target.value, en: d.content.chiefComplaint.en || e.target.value }))} />
              </F>
              <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                {(["hr", "sbp", "dbp", "rr", "spo2", "temp"] as const).map((k) => (
                  <F key={k} label={k.toUpperCase()}>
                    <input type="number" step={k === "temp" ? 0.1 : 1} className="field" value={c.vitals[k]} onChange={(e) => upd((d) => void (d.content.vitals[k] = Number(e.target.value)))} />
                  </F>
                ))}
              </div>
              {(["pastMedical", "medications", "allergies", "family", "social"] as const).map((k) => (
                <F key={k} label={t(`Antécédents · ${({ pastMedical: "médicaux", medications: "traitements", allergies: "allergies", family: "familiaux", social: "mode de vie" } as Record<string, string>)[k]} (un par ligne)`, `History · ${({ pastMedical: "medical", medications: "medications", allergies: "allergies", family: "family", social: "social" } as Record<string, string>)[k]} (one per line)`)}>
                  <textarea className="field" rows={2} value={c.history[k].join("\n")} onChange={(e) => upd((d) => void (d.content.history[k] = lines(e.target.value)))} />
                </F>
              ))}
            </div>
            <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 to-white dark:from-navy-800 dark:to-navy-900">
              <PatientAvatar config={c.patient.avatar} emotion={c.patient.baselineEmotion} speaking={false} age={c.patient.age} sex={c.patient.sex} />
            </div>
          </div>
        )}

        {tab === "Interrogatoire" && (
          <>
            <p className="subtle text-sm">{t("Rédigez la réponse du patient pour chaque thème, en anglais (obligatoire) et en français. Laissez vide pour une réponse négative plausible. Le moteur IA traduit automatiquement.", "Write the patient's answer for each topic, in English (required) and French. Leave blank for a plausible negative answer. The AI engine translates automatically.")}</p>
            {TOPICS.map((tp) => {
              const val = c.interview[tp.key];
              return (
                <div key={tp.key} className="rounded-xl border border-[rgb(var(--line))] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{topicLabel(tp.key, lang)} <span className="subtle text-xs font-normal">· {topicGroupLabel(tp.group, lang)}</span></p>
                    <select className="field w-auto py-1 text-xs" value={c.topicEmotions?.[tp.key] ?? ""} onChange={(e) => upd((d) => { d.content.topicEmotions ??= {}; if (e.target.value) d.content.topicEmotions[tp.key] = e.target.value as Emotion; else delete d.content.topicEmotions[tp.key]; })} aria-label={`${t("Émotion pour le thème", "Emotion for topic")} ${topicLabel(tp.key, lang)}`}>
                      <option value="">{t("émotion : de base", "emotion: baseline")}</option>
                      {EMOTIONS.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(["en", "fr"] as const).map((l) => (
                      <textarea
                        key={l}
                        className="field text-xs"
                        rows={2}
                        placeholder={l === "en" ? `EN — ${tp.fallback.en}` : `FR — ${tp.fallback.fr ?? ""}`}
                        value={val?.[l] ?? ""}
                        onChange={(e) =>
                          upd((d) => {
                            const cur = d.content.interview[tp.key] ?? { en: "" };
                            cur[l] = e.target.value;
                            if (!cur.en && !cur.fr) delete d.content.interview[tp.key];
                            else d.content.interview[tp.key] = cur;
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "Examen clinique" && (
          <FindingsEditor
            catalog={PHYSICAL_EXAMS.map((x) => localizeExam(x, lang))}
            values={Object.fromEntries(Object.entries(c.exam).map(([k, x]) => [k, { text: x.finding, abnormal: x.abnormal }]))}
            essential={r.essentialExams}
            onChange={(code, val) => upd((d) => { if (val) d.content.exam[code] = { finding: val.text, abnormal: val.abnormal }; else delete d.content.exam[code]; })}
            onEssential={(code, on) => upd((d) => void (d.content.rubric.essentialExams = on ? [...new Set([...d.content.rubric.essentialExams, code])] : d.content.rubric.essentialExams.filter((x) => x !== code)))}
          />
        )}

        {tab === "Examens compl." && (
          <FindingsEditor
            catalog={INVESTIGATIONS.map((x) => localizeInvestigation(x, lang))}
            values={Object.fromEntries(Object.entries(c.investigations).map(([k, x]) => [k, { text: x.result, abnormal: x.abnormal }]))}
            essential={r.essentialInvestigations}
            unnecessary={r.unnecessaryInvestigations}
            onChange={(code, val) => upd((d) => { if (val) d.content.investigations[code] = { result: val.text, abnormal: val.abnormal }; else delete d.content.investigations[code]; })}
            onEssential={(code, on) => upd((d) => { d.content.rubric.essentialInvestigations = on ? [...new Set([...d.content.rubric.essentialInvestigations, code])] : d.content.rubric.essentialInvestigations.filter((x) => x !== code); if (on) d.content.rubric.unnecessaryInvestigations = d.content.rubric.unnecessaryInvestigations.filter((x) => x !== code); })}
            onUnnecessary={(code, on) => upd((d) => { d.content.rubric.unnecessaryInvestigations = on ? [...new Set([...d.content.rubric.unnecessaryInvestigations, code])] : d.content.rubric.unnecessaryInvestigations.filter((x) => x !== code); if (on) d.content.rubric.essentialInvestigations = d.content.rubric.essentialInvestigations.filter((x) => x !== code); })}
          />
        )}

        {tab === "Diagnostic" && (
          <>
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {t("Cette section n'est jamais transmise au moteur du patient. Elle sert uniquement à la notation et au feedback après soumission.", "This section is never sent to the patient engine. It is only used for scoring and feedback after submission.")}
            </div>
            <F label={t("Diagnostic attendu", "Expected diagnosis")}><input className="field" value={c.answer.diagnosis} onChange={(e) => upd((d) => void (d.content.answer.diagnosis = e.target.value))} /></F>
            <F label={t("Termes et synonymes acceptés (séparés par des virgules, toutes langues)", "Accepted terms and synonyms (comma-separated, any language)")}><input className="field" value={c.answer.acceptedTerms.join(", ")} onChange={(e) => upd((d) => void (d.content.answer.acceptedTerms = csv(e.target.value)))} /></F>
            <div>
              <p className="label">{t("Diagnostics différentiels à évoquer", "Differentials to consider")}</p>
              {c.answer.differentials.map((dd, i) => (
                <div key={i} className="mb-2 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                  <input className="field" placeholder={t("Nom", "Name")} value={dd.name} onChange={(e) => upd((d) => void (d.content.answer.differentials[i].name = e.target.value))} />
                  <input className="field" placeholder={t("Termes acceptés, séparés par des virgules", "Accepted terms, comma-separated")} value={dd.terms.join(", ")} onChange={(e) => upd((d) => void (d.content.answer.differentials[i].terms = csv(e.target.value)))} />
                  <button type="button" className="btn-ghost px-3" onClick={() => upd((d) => void d.content.answer.differentials.splice(i, 1))} aria-label={t("Retirer le différentiel", "Remove differential")}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => upd((d) => void d.content.answer.differentials.push({ name: "", terms: [] }))}><Plus className="h-3.5 w-3.5" /> {t("Ajouter un différentiel", "Add a differential")}</button>
            </div>
            <F label={t("Points pédagogiques (un par ligne)", "Teaching points (one per line)")}><textarea className="field" rows={5} value={c.answer.teachingPoints.join("\n")} onChange={(e) => upd((d) => void (d.content.answer.teachingPoints = lines(e.target.value)))} /></F>
          </>
        )}

        {tab === "Prise en charge et grille" && (
          <>
            <div>
              <p className="label">{t("Options de prise en charge proposées à l'étudiant", "Management options offered to the student")}</p>
              {r.management.options.map((o, i) => (
                <div key={i} className="mb-2 grid gap-2 rounded-xl border border-[rgb(var(--line))] p-2 md:grid-cols-[140px_2fr_150px_2fr_auto]">
                  <input className="field font-mono text-xs" placeholder="code" value={o.code} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].code = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_")))} />
                  <input className="field" placeholder={t("Libellé", "Label")} value={o.label} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].label = e.target.value))} />
                  <select className="field" value={o.kind} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].kind = e.target.value as "essential"))}>
                    {([["essential", t("essentielle", "essential")], ["appropriate", t("appropriée", "appropriate")], ["neutral", t("neutre", "neutral")], ["contraindicated", t("contre-indiquée", "contraindicated")]] as const).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <input className="field" placeholder={t("Justification (affichée dans le feedback)", "Rationale (shown in feedback)")} value={o.rationale} onChange={(e) => upd((d) => void (d.content.rubric.management.options[i].rationale = e.target.value))} />
                  <button type="button" className="btn-ghost px-3" onClick={() => upd((d) => void d.content.rubric.management.options.splice(i, 1))} aria-label={t("Retirer l'option", "Remove option")}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" className="btn-ghost text-xs" onClick={() => upd((d) => void d.content.rubric.management.options.push({ code: `option_${d.content.rubric.management.options.length + 1}`, label: "", kind: "appropriate", rationale: "" }))}><Plus className="h-3.5 w-3.5" /> {t("Ajouter une option", "Add an option")}</button>
            </div>
            <div>
              <p className="label">{t("Thèmes clés de l'interrogatoire et pondérations", "Key history topics and weights")}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {TOPICS.filter((tp) => tp.key !== "greeting").map((tp) => {
                  const kt = r.keyTopics.find((x) => x.topic === tp.key);
                  return (
                    <label key={tp.key} className="flex items-center gap-2 rounded-lg border border-[rgb(var(--line))] px-3 py-1.5 text-sm">
                      <input type="checkbox" checked={!!kt} onChange={(e) => upd((d) => void (d.content.rubric.keyTopics = e.target.checked ? [...d.content.rubric.keyTopics, { topic: tp.key, weight: 1 }] : d.content.rubric.keyTopics.filter((x) => x.topic !== tp.key)))} />
                      <span className="flex-1">{topicLabel(tp.key, lang)}</span>
                      {kt && <input type="number" min={1} max={10} className="field w-16 px-2 py-1 text-xs" value={kt.weight} onChange={(e) => upd((d) => void (d.content.rubric.keyTopics.find((x) => x.topic === tp.key)!.weight = Number(e.target.value)))} aria-label={`${t("Pondération pour", "Weight for")} ${topicLabel(tp.key, lang)}`} />}
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="label">{t("Pondération des catégories (total 100 — actuellement", "Category weights (total 100 — currently")} <span className={weightSum === 100 ? "text-success" : "text-danger"}>{weightSum}</span>)</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {(Object.keys(r.weights) as (keyof typeof r.weights)[]).map((k) => (
                  <F key={k} label={(lang === "en" ? { history: "history", exam: "examination", investigations: "investigations", diagnosis: "diagnosis", management: "management" } : { history: "interrogatoire", exam: "examen", investigations: "examens compl.", diagnosis: "diagnostic", management: "prise en charge" } as Record<string, string>)[k]}>
                    <input type="number" min={0} max={100} className="field" value={r.weights[k]} onChange={(e) => upd((d) => void (d.content.rubric.weights[k] = Number(e.target.value)))} />
                  </F>
                ))}
              </div>
            </div>
          </>
        )}
      </fieldset>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

function FindingsEditor({
  catalog, values, essential, unnecessary, onChange, onEssential, onUnnecessary,
}: {
  catalog: { code: string; name: string; category: string; categoryLabel?: string; normal: string }[];
  values: Record<string, { text: string; abnormal: boolean }>;
  essential: string[];
  unnecessary?: string[];
  onChange: (code: string, v: { text: string; abnormal: boolean } | null) => void;
  onEssential: (code: string, on: boolean) => void;
  onUnnecessary?: (code: string, on: boolean) => void;
}) {
  const t = useT();
  return (
    <>
      <p className="subtle text-sm">{t("Les éléments sans résultat personnalisé renvoient le résultat normal du catalogue. Marquez les éléments essentiels (récompensés)", "Items without a custom result return the catalogue's normal result. Mark essential items (rewarded)")}{onUnnecessary ? t(" ou inutiles (pénalisés)", " or unnecessary (penalised)") : ""}.</p>
      <div className="space-y-2">
        {catalog.map((it) => {
          const v = values[it.code];
          return (
            <div key={it.code} className="rounded-xl border border-[rgb(var(--line))] p-3">
              <div className="flex flex-wrap items-center gap-3">
                <p className="flex-1 text-sm font-semibold">
                  {it.name} <span className="subtle text-xs font-normal">· {it.categoryLabel ?? it.category}</span>
                </p>
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={essential.includes(it.code)} onChange={(e) => onEssential(it.code, e.target.checked)} /> {t("Essentiel", "Essential")}</label>
                {onUnnecessary && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!unnecessary?.includes(it.code)} onChange={(e) => onUnnecessary(it.code, e.target.checked)} /> {t("Inutile", "Unnecessary")}</label>}
                <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!v?.abnormal} disabled={!v} onChange={(e) => onChange(it.code, { text: v!.text, abnormal: e.target.checked })} /> {t("Anormal", "Abnormal")}</label>
              </div>
              <textarea className="field mt-2 text-xs" rows={v ? 2 : 1} placeholder={`${t("Par défaut", "Default")} : ${it.normal}`} value={v?.text ?? ""} onChange={(e) => onChange(it.code, e.target.value ? { text: e.target.value, abnormal: v?.abnormal ?? true } : null)} />
            </div>
          );
        })}
      </div>
    </>
  );
}
