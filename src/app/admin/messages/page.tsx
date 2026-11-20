import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Badge, Card, Empty, PageHeader, fmtDate } from "@/components/ui";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Demandes de contact", "Contact requests") };
}

export default async function Messages() {
  await requireUser({ permission: "platform:users" });
  const lang = await getLang();
  const t = makeT(lang);
  const items = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader eyebrow={t("Messagerie", "Inbox")} title={t("Demandes de contact et de démo", "Contact and demo requests")} />
      {items.length === 0 ? (
        <Empty title={t("Aucun message", "No messages")} body={t("Les messages envoyés depuis la page Contact apparaissent ici.", "Messages sent from the Contact page appear here.")} />
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={m.kind === "DEMO" ? "teal" : "blue"}>{m.kind === "DEMO" ? t("Demande de démo", "Demo request") : t("Question", "Question")}</Badge>
                <span className="font-semibold">{m.name}</span>
                <span className="subtle text-sm">{m.email}</span>
                {m.organization && <span className="subtle text-sm">· {m.organization}{m.role ? ` (${m.role})` : ""}</span>}
                <span className="subtle ml-auto text-xs">{fmtDate(m.createdAt, lang)}</span>
              </div>
              <p className="muted mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
