"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function CreateUserForm() {
  const router = useRouter();
  const t = useT();
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [result, setResult] = useState<{ email: string; temp: string } | null>(null);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        setError("");
        setResult(null);
        try {
          const r = await api<{ temporaryPassword: string }>("/api/institution/users", "POST", { name: f.get("name"), email: f.get("email"), roleKey: role, yearOfStudy: role === "STUDENT" && f.get("year") ? Number(f.get("year")) : undefined });
          setResult({ email: String(f.get("email")), temp: r.temporaryPassword });
          form.reset();
          router.refresh();
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        {(["STUDENT", "TEACHER"] as const).map((r) => (
          <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-lg border py-2 text-sm font-semibold ${role === r ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200" : "border-[rgb(var(--line))]"}`}>
            {r === "STUDENT" ? t("Étudiant", "Student") : t("Enseignant", "Teacher")}
          </button>
        ))}
      </div>
      <label className="block"><span className="label">{t("Nom complet", "Full name")}</span><input name="name" required minLength={2} className="field" /></label>
      <label className="block"><span className="label">{t("E-mail", "Email")}</span><input name="email" type="email" required className="field" /></label>
      {role === "STUDENT" && <label className="block"><span className="label">{t("Année d'études", "Year of study")}</span><input name="year" type="number" min={1} max={10} className="field" /></label>}
      {error && <p className="text-sm text-danger">{error}</p>}
      {result && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100">
          {t("Compte créé pour", "Account created for")} <strong>{result.email}</strong>. {t("Mot de passe temporaire (affiché une seule fois — à transmettre de façon sécurisée) :", "Temporary password (shown once only — share it securely):")}
          <code className="mt-1 block select-all rounded bg-white/70 px-2 py-1 font-mono dark:bg-black/30">{result.temp}</code>
        </div>
      )}
      <button className="btn-primary w-full">{t("Créer le compte", "Create account")}</button>
    </form>
  );
}
