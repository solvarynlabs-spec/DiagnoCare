"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "@/components/icons";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function AssignmentForm({ groups, cases }: { groups: { id: string; name: string }[]; cases: { id: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        setBusy(true);
        setMsg(null);
        try {
          await api("/api/assignments", "POST", { title: f.get("title"), instructions: f.get("instructions"), caseId: f.get("caseId"), groupId: f.get("groupId"), dueAt: f.get("dueAt") || undefined });
          setMsg({ ok: true, text: t("Devoir créé et étudiants notifiés.", "Assignment created and students notified.") });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="block"><span className="label">{t("Titre", "Title")}</span><input name="title" required minLength={3} className="field" /></label>
      <label className="block">
        <span className="label">{t("Cas", "Case")}</span>
        <select name="caseId" required className="field">{cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      </label>
      <label className="block">
        <span className="label">{t("Groupe", "Group")}</span>
        <select name="groupId" required className="field">{groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
      </label>
      <label className="block"><span className="label">{t("Échéance", "Due date")}</span><input name="dueAt" type="datetime-local" className="field" /></label>
      <label className="block"><span className="label">{t("Consignes", "Instructions")}</span><textarea name="instructions" rows={3} className="field" /></label>
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? t("Création…", "Creating…") : t("Assigner le cas", "Assign the case")}</button>
    </form>
  );
}

export function DeleteAssignment({ id }: { id: string }) {
  const router = useRouter();
  const t = useT();
  return (
    <button
      className="subtle hover:text-danger"
      aria-label={t("Supprimer le devoir", "Delete assignment")}
      onClick={async () => {
        if (!confirm(t("Supprimer ce devoir ? Les rapports déjà rendus sont conservés.", "Delete this assignment? Reports already submitted are kept."))) return;
        await api(`/api/assignments?id=${id}`, "DELETE").catch((e) => alert((e as Error).message));
        router.refresh();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
