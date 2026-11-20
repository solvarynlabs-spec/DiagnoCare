"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, CheckCircle2, RotateCcw, Send, ShieldCheck } from "@/components/icons";
import { api } from "@/lib/client";
import { useLang, useT } from "@/lib/i18n/client";
import { translateMessage } from "@/lib/i18n/messages";

const STEPS = ["DRAFT", "IN_REVIEW", "PUBLISHED"];
const ATTESTATIONS = [
  ["fictional", "Toutes les données patients sont fictives ou correctement anonymisées", "All patient data is fictional or properly anonymised"],
  ["factsConsistent", "Les faits, signes et résultats du cas sont cliniquement cohérents", "The case's facts, signs and results are clinically consistent"],
  ["rubricReviewed", "La grille, les termes acceptés et les justifications ont été relus", "The rubric, accepted terms and rationales have been reviewed"],
  ["safetyChecked", "Les options de prise en charge et les points pédagogiques sont sûrs et à jour", "Management options and teaching points are safe and up to date"],
] as const;

export function ReviewWorkflow(p: { id: string; status: string; canReview: boolean; canEdit: boolean; reviewedBy: string | null; reviewedAt: string | null; reviewNotes: string | null }) {
  const router = useRouter();
  const t = useT();
  const lang = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes] = useState("");
  const [att, setAtt] = useState<Record<string, boolean>>({});

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/cases/${p.id}/status`, "POST", body);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const allAttested = ATTESTATIONS.every(([k]) => att[k]);

  return (
    <div className="panel p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 text-teal-500" /> {t("Circuit de validation", "Review workflow")}
      </p>
      <ol className="mb-4 flex items-center gap-1 text-[11px] font-semibold">
        {STEPS.map((s, i) => {
          const idx = STEPS.indexOf(p.status);
          const done = idx >= i;
          return (
            <li key={s} className={`flex-1 rounded-md px-2 py-1 text-center ${done ? "bg-teal-500 text-white" : "bg-[rgb(var(--panel-2))] subtle"}`}>
              {(lang === "en" ? { DRAFT: "draft", IN_REVIEW: "review", PUBLISHED: "published" } : { DRAFT: "brouillon", IN_REVIEW: "validation", PUBLISHED: "publié" } as Record<string, string>)[s as "DRAFT"]}
            </li>
          );
        })}
      </ol>

      {p.status === "DRAFT" && p.canEdit && (
        <button className="btn-primary w-full" disabled={busy} onClick={() => act({ action: "submit_review" })}>
          <Send className="h-4 w-4" /> {t("Soumettre à la validation clinique", "Submit for clinical review")}
        </button>
      )}

      {p.status === "IN_REVIEW" &&
        (p.canReview ? (
          <div className="space-y-3">
            <label className="block">
              <span className="label">{t("Nom et qualité de l'expert", "Expert's name and title")}</span>
              <input className="field" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder={t("ex. Pr S. Benali — Professeur en cardiologie, CHU", "e.g. Prof. S. Benali — Professor of cardiology, teaching hospital")} />
            </label>
            <div className="space-y-1.5">
              {ATTESTATIONS.map(([k, label, labelEn]) => (
                <label key={k} className="flex items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5" checked={!!att[k]} onChange={(e) => setAtt({ ...att, [k]: e.target.checked })} /> {t(label, labelEn)}
                </label>
              ))}
            </div>
            <textarea className="field text-xs" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("Remarques de validation (facultatif)", "Review notes (optional)")} />
            <button className="btn-teal w-full" disabled={busy || !allAttested || reviewer.trim().length < 5} onClick={() => act({ action: "publish", reviewer, notes, attestations: att })}>
              <CheckCircle2 className="h-4 w-4" /> {t("Valider et publier", "Approve and publish")}
            </button>
            <button className="btn-ghost w-full" disabled={busy} onClick={() => act({ action: "return_to_draft", notes })}>
              <RotateCcw className="h-4 w-4" /> {t("Demander des modifications", "Request changes")}
            </button>
          </div>
        ) : (
          <p className="subtle text-sm">{t("En attente de validation par un expert clinique.", "Awaiting review by a clinical expert.")}</p>
        ))}

      {p.status === "PUBLISHED" && (
        <div className="space-y-3 text-sm">
          <p>
            <span className="subtle">{t("Validé par", "Approved by")}</span> <strong>{translateMessage(p.reviewedBy ?? "", lang)}</strong>
            {p.reviewedAt && <span className="subtle"> {t("le", "on")} {new Date(p.reviewedAt).toLocaleDateString(lang === "en" ? "en-GB" : "fr-DZ")}</span>}
          </p>
          {p.reviewNotes && <p className="subtle text-xs">{p.reviewNotes}</p>}
          <p className="subtle text-xs">{t("Toute modification enregistrée renvoie le cas en brouillon et exige une nouvelle validation.", "Any saved edit sends the case back to draft and requires a new review.")}</p>
          {p.canEdit && (
            <button className="btn-ghost w-full" disabled={busy} onClick={() => confirm(t("Archiver ce cas ? Les étudiants ne le verront plus.", "Archive this case? Students will no longer see it.")) && act({ action: "archive" })}>
              <Archive className="h-4 w-4" /> {t("Archiver", "Archive")}
            </button>
          )}
        </div>
      )}
      {p.status === "ARCHIVED" && p.canEdit && (
        <button className="btn-ghost w-full" disabled={busy} onClick={() => act({ action: "return_to_draft" })}>
          <RotateCcw className="h-4 w-4" /> {t("Restaurer en brouillon", "Restore to draft")}
        </button>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </div>
  );
}
