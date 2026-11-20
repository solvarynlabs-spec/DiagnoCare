import type { AuditLog, User } from "@prisma/client";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function AuditTable({ logs }: { logs: (AuditLog & { user: Pick<User, "name" | "email"> | null })[] }) {
  const lang = await getLang();
  const t = makeT(lang);
  return (
    <div className="panel overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="subtle border-b border-[rgb(var(--line))] text-left text-xs uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">{t("Utilisateur", "User")}</th>
            <th className="px-4 py-3">{t("Objet", "Object")}</th>
            <th className="px-4 py-3">{t("Détails", "Details")}</th>
            <th className="px-4 py-3">IP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgb(var(--line))]">
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="muted whitespace-nowrap px-4 py-2 text-xs">{l.createdAt.toLocaleString(lang === "en" ? "en-GB" : "fr-DZ")}</td>
              <td className="px-4 py-2 font-mono text-xs text-brand-600">{l.action}</td>
              <td className="px-4 py-2 text-xs">{l.user?.name ?? <span className="subtle">{t("anonyme", "anonymous")}</span>}</td>
              <td className="muted px-4 py-2 text-xs">{l.entity ? `${l.entity} ${l.entityId?.slice(-6) ?? ""}` : "—"}</td>
              <td className="muted max-w-xs truncate px-4 py-2 font-mono text-[11px]" title={l.meta ?? ""}>{l.meta ?? ""}</td>
              <td className="muted px-4 py-2 text-xs">{l.ip ?? ""}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="subtle px-4 py-6 text-center">{t("Aucun événement.", "No events.")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
