"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function CreateGroupForm({ teachers }: { teachers: { id: string; name: string }[] }) {
  const router = useRouter();
  const tr = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        try {
          await api("/api/groups", "POST", { name: f.get("name"), year: f.get("year") ? Number(f.get("year")) : undefined, teacherId: f.get("teacherId") || undefined });
          setMsg({ ok: true, text: tr("Groupe créé.", "Group created.") });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <label className="block"><span className="label">{tr("Nom", "Name")}</span><input name="name" required minLength={2} className="field" placeholder={tr("ex. 3e année — Groupe A", "e.g. Year 3 — Group A")} /></label>
      <label className="block"><span className="label">{tr("Année", "Year")}</span><input name="year" type="number" min={1} max={10} className="field" /></label>
      {teachers.length > 0 && (
        <label className="block">
          <span className="label">{tr("Enseignant", "Teacher")}</span>
          <select name="teacherId" className="field" required>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        </label>
      )}
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full">{tr("Créer le groupe", "Create group")}</button>
    </form>
  );
}

export function AddMembersForm({ groupId }: { groupId: string }) {
  const router = useRouter();
  const tr = useT();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const emails = String(new FormData(form).get("emails")).split(/[\s,;]+/).filter(Boolean);
        try {
          const r = await api<{ added: number; notFound: string[] }>("/api/groups", "PUT", { groupId, emails });
          setMsg({ ok: r.notFound.length === 0, text: tr(`${r.added} ajouté(s).${r.notFound.length ? ` Introuvables (ou non étudiants) : ${r.notFound.join(", ")}` : ""}`, `${r.added} added.${r.notFound.length ? ` Not found (or not students): ${r.notFound.join(", ")}` : ""}`) });
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <label htmlFor={`emails-${groupId}`} className="sr-only">{tr("E-mails des étudiants", "Student emails")}</label>
      <input id={`emails-${groupId}`} name="emails" required className="field flex-1" placeholder={tr("Ajouter des étudiants par e-mail (séparés par des virgules)", "Add students by email (comma-separated)")} />
      <button className="btn-ghost">{tr("Ajouter", "Add")}</button>
      {msg && <p className={`w-full text-xs ${msg.ok ? "text-success" : "text-amber-600"}`}>{msg.text}</p>}
    </form>
  );
}
