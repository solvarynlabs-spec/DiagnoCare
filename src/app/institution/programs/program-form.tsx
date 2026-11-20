"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function ProgramForm({ cases }: { cases: { slug: string; title: string }[] }) {
  const router = useRouter();
  const t = useT();
  const [picked, setPicked] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        try {
          await api("/api/institution/programs", "POST", { name: f.get("name"), description: f.get("description"), caseSlugs: picked });
          setMsg({ ok: true, text: t("Programme créé.", "Program created.") });
          setPicked([]);
          form.reset();
          router.refresh();
        } catch (err) {
          setMsg({ ok: false, text: (err as Error).message });
        }
      }}
    >
      <label className="block"><span className="label">{t("Nom", "Name")}</span><input name="name" required minLength={3} className="field" /></label>
      <label className="block"><span className="label">{t("Description", "Description")}</span><textarea name="description" rows={2} className="field" /></label>
      <fieldset>
        <legend className="label">{t("Cas (dans l'ordre de sélection)", "Cases (in the order selected)")}</legend>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {cases.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-[rgb(var(--panel-2))]">
              <input type="checkbox" checked={picked.includes(c.slug)} onChange={(e) => setPicked(e.target.checked ? [...picked, c.slug] : picked.filter((x) => x !== c.slug))} />
              {c.title}
            </label>
          ))}
        </div>
      </fieldset>
      {msg && <p className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      <button className="btn-primary w-full" disabled={picked.length === 0}>{t("Créer le programme", "Create program")}</button>
    </form>
  );
}
