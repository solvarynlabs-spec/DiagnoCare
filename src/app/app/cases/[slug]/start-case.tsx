"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, PlayCircle } from "@/components/icons";
import { api } from "@/lib/client";
import { useLang, useT } from "@/lib/i18n/client";
import { LangSwitch } from "@/components/lang-switch";

/** The consultation runs in the interface language (FR / EN); the switch changes both. */
export function StartCase({ caseId, assignmentId }: { caseId: string; assignmentId?: string; aiMode: "anthropic" | "groq" | "demo" }) {
  const router = useRouter();
  const lang = useLang();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ url: string }>("/api/sessions", "POST", { caseId, language: lang, assignmentId });
      router.push(r.url);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("Langue de la consultation", "Consultation language")}</p>
        <LangSwitch className="border-white/15 text-white" />
      </div>
      <p className="mt-4 text-xs text-white/55">{t("Le patient ne répond qu'à partir des faits de son dossier.", "The patient only answers from the facts in their record.")}</p>
      {error && <p className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p>}
      <button onClick={start} disabled={busy} className="btn-primary mt-5 w-full py-3.5 text-[15px] font-semibold">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" weight="fill" />} {busy ? t("Préparation de la salle…", "Preparing the room…") : t("Entrer dans la salle de consultation", "Enter the consultation room")}
      </button>
    </div>
  );
}
