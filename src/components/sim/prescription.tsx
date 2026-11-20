"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, Check, Plus, Save, Trash2 } from "@/components/icons";
import { useLang, useT } from "@/lib/i18n/client";

/**
 * Optional « Ordonnance / Prescription » exercise at the end of a consultation.
 *
 * Educational only: the student types free-text entries, nothing is suggested, completed or
 * generated, and nothing is graded (cases have no educator-approved prescription rubric).
 * There is deliberately no patient name, signature, prescriber identity or print layout.
 * The saved entries live in the consultation's local draft, like the other end-of-case steps.
 */

export interface RxEntry {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  notes: string;
}

export const RX_DISCLAIMER_FR = "Simulation pédagogique — ne constitue pas une ordonnance réelle.";
export const RX_DISCLAIMER_EN = "Educational simulation — not a real prescription.";

const FIELDS = [
  ["name", "Médicament", "Medication"],
  ["dose", "Dose", "Dose"],
  ["route", "Voie", "Route"],
  ["frequency", "Fréquence", "Frequency"],
  ["duration", "Durée", "Duration"],
] as const;

export const blankRx = (): RxEntry => ({ id: `rx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name: "", dose: "", route: "", frequency: "", duration: "", notes: "" });
export const isEmptyRx = (e: RxEntry) => !e.name.trim() && !e.dose.trim() && !e.route.trim() && !e.frequency.trim() && !e.duration.trim() && !e.notes.trim();
/** True when the working copy differs from what was last saved. */
export const rxDirty = (rows: RxEntry[], saved: RxEntry[]) => !same(rows.filter((r) => !isEmptyRx(r)), saved);
const same = (a: RxEntry[], b: RxEntry[]) => JSON.stringify(a.map(({ id: _, ...r }) => r)) === JSON.stringify(b.map(({ id: _, ...r }) => r));

/** The mandatory label, in French always, plus English when the interface is in English. */
export function RxDisclaimer({ className = "" }: { className?: string }) {
  const lang = useLang();
  return (
    <p className={`flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100 ${className}`} role="note">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <span>
        {RX_DISCLAIMER_FR}
        {lang === "en" && <span className="block font-normal text-amber-100/80">{RX_DISCLAIMER_EN}</span>}
      </span>
    </p>
  );
}

/** Read-only list of saved entries (used in the panel and the Finish dialog). */
export function RxSummary({ entries, savedAt }: { entries: RxEntry[]; savedAt: string | null }) {
  const t = useT();
  const lang = useLang();
  if (!entries.length) return <p className="subtle text-xs">{t("Aucune ligne enregistrée — étape facultative.", "No entries saved — optional step.")}</p>;
  return (
    <div className="space-y-2">
      <ol className="space-y-1.5 text-sm">
        {entries.map((e, i) => (
          <li key={e.id} className="rounded-lg bg-white/[0.04] px-3 py-2">
            <span className="subtle mr-1.5 font-mono text-xs">{i + 1}.</span>
            <span className="font-semibold">{e.name}</span>
            {[e.dose, e.route, e.frequency, e.duration].filter((x) => x.trim()).length > 0 && <span className="muted"> — {[e.dose, e.route, e.frequency, e.duration].filter((x) => x.trim()).join(" · ")}</span>}
            {e.notes.trim() && <span className="subtle mt-0.5 block text-xs">{e.notes}</span>}
          </li>
        ))}
      </ol>
      {savedAt && <p className="subtle text-[11px]">{t("Enregistré le", "Saved")} {new Date(savedAt).toLocaleString(lang === "en" ? "en-GB" : "fr-DZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>}
    </div>
  );
}

/**
 * The working copy (`rows`) is held by the room so unsaved edits survive switching tools;
 * only Save writes it to the consultation draft.
 */
export function PrescriptionPanel({ rows, setRows, saved, savedAt, onSave, onBack }: { rows: RxEntry[]; setRows: React.Dispatch<React.SetStateAction<RxEntry[]>>; saved: RxEntry[]; savedAt: string | null; onSave: (entries: RxEntry[]) => void; onBack: () => void }) {
  const t = useT();
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const dirty = rxDirty(rows, saved);

  const update = (id: string, key: keyof RxEntry, value: string) => {
    setJustSaved(false);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [key]: value } : x)));
  };
  const remove = (id: string) => {
    setJustSaved(false);
    setRows((r) => (r.length > 1 ? r.filter((x) => x.id !== id) : [blankRx()]));
  };

  function save() {
    const kept = rows.filter((r) => !isEmptyRx(r));
    if (kept.some((r) => !r.name.trim())) {
      setError(t("Chaque ligne remplie doit comporter un nom de médicament (ou supprimez la ligne).", "Every filled-in entry needs a medication name (or remove the entry)."));
      return;
    }
    setError("");
    const clean = kept.map((r) => ({ ...r, name: r.name.trim(), dose: r.dose.trim(), route: r.route.trim(), frequency: r.frequency.trim(), duration: r.duration.trim(), notes: r.notes.trim() }));
    onSave(clean);
    setRows(clean.length ? clean : [blankRx()]);
    setJustSaved(true);
  }

  return (
    <div className="panel space-y-5 p-6">
      <div>
        <h2 className="font-semibold">{t("Ordonnance", "Prescription")}</h2>
        <p className="subtle mt-0.5 text-xs">{t("Étape facultative. Rédigez les médicaments que vous prescririez, avec vos propres mots. Rien n'est proposé ni corrigé : cette étape n'est pas notée.", "Optional step. Write the medications you would prescribe, in your own words. Nothing is suggested or corrected: this step is not scored.")}</p>
      </div>
      <RxDisclaimer />

      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{t("Ligne", "Entry")} {i + 1}</p>
              <button type="button" onClick={() => remove(r.id)} className="subtle inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:text-danger" aria-label={`${t("Supprimer la ligne", "Remove entry")} ${i + 1}`}>
                <Trash2 className="h-3.5 w-3.5" /> {t("Supprimer", "Remove")}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {FIELDS.map(([key, fr, en]) => (
                <label key={key} className={`block ${key === "name" ? "sm:col-span-2 lg:col-span-1" : ""}`}>
                  <span className="mb-1 block text-[11px] font-medium text-white/60">{t(fr, en)}{key === "name" && " *"}</span>
                  <input className="field py-2 text-sm" value={r[key]} onChange={(e) => update(r.id, key, e.target.value)} autoComplete="off" spellCheck={false} maxLength={key === "name" ? 120 : 80} />
                </label>
              ))}
            </div>
            <label className="mt-2 block">
              <span className="mb-1 block text-[11px] font-medium text-white/60">{t("Remarques (facultatif)", "Notes (optional)")}</span>
              <input className="field py-2 text-sm" value={r.notes} onChange={(e) => update(r.id, "notes", e.target.value)} autoComplete="off" maxLength={300} />
            </label>
          </li>
        ))}
      </ol>

      <button type="button" className="btn-ghost text-sm" onClick={() => { setJustSaved(false); setRows((x) => [...x, blankRx()]); }} disabled={rows.length >= 15}>
        <Plus className="h-4 w-4" /> {t("Ajouter un médicament", "Add a medication")}
      </button>

      {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <button type="button" className="btn-ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> {t("Retour à la consultation", "Back to the consultation")}
        </button>
        <span className="ml-auto text-xs" aria-live="polite">
          {dirty ? <span className="text-amber-300">{t("Modifications non enregistrées", "Unsaved changes")}</span> : justSaved ? <span className="inline-flex items-center gap-1 text-emerald-300"><Check className="h-3.5 w-3.5" /> {t("Enregistré", "Saved")}</span> : null}
        </span>
        <button type="button" className="btn-primary" onClick={save} disabled={!dirty}>
          <Save className="h-4 w-4" /> {t("Enregistrer l'ordonnance", "Save prescription")}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{t("Ordonnance enregistrée", "Saved prescription")}</p>
        <RxSummary entries={saved} savedAt={savedAt} />
      </div>
    </div>
  );
}
