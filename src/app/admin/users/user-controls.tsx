"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function UserControls({ id, self, role, plan, active }: { id: string; self: boolean; role: string; plan: string; active: boolean }) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await api(`/api/admin/users/${id}`, "PATCH", body);
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="field w-auto py-1 text-xs" value={role} disabled={busy || self} onChange={(e) => patch({ roleKey: e.target.value })} aria-label={t("Rôle", "Role")}>
        {([["STUDENT", t("Étudiant", "Student")], ["TEACHER", t("Enseignant", "Teacher")], ["UNIVERSITY_ADMIN", t("Admin faculté", "Faculty admin")], ["PLATFORM_ADMIN", t("Admin plateforme", "Platform admin")]] as const).map(([r, l]) => <option key={r} value={r}>{l}</option>)}
      </select>
      <select className="field w-auto py-1 text-xs" value={plan} disabled={busy} onChange={(e) => patch({ plan: e.target.value })} aria-label={t("Formule", "Plan")}>
        {([["FREE", t("Gratuit", "Free")], ["STUDENT_PRO", t("Étudiant Pro", "Student Pro")], ["UNIVERSITY", t("Faculté", "Faculty")]] as const).map(([p, l]) => <option key={p} value={p}>{l}</option>)}
      </select>
      <button className={`chip ${active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"}`} disabled={busy || self} onClick={() => confirm(active ? t("Désactiver ce compte ? L'utilisateur sera déconnecté.", "Deactivate this account? The user will be signed out.") : t("Réactiver ce compte ?", "Reactivate this account?")) && patch({ active: !active })}>
        {active ? t("actif", "active") : t("désactivé", "deactivated")}
      </button>
    </div>
  );
}
