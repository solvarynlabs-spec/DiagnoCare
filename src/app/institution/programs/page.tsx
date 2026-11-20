import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { Card, CardTitle, Empty, PageHeader, fmtDate } from "@/components/ui";
import { ProgramForm } from "./program-form";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Programmes de formation", "Training programs") };
}

export default async function ProgramsPage() {
  const user = await requireUser({ permission: "institution:manage" });
  const lang = await getLang();
  const t = makeT(lang);
  const [programs, cases] = await Promise.all([
    prisma.trainingProgram.findMany({ where: { universityId: user.universityId ?? "__none__" }, orderBy: { createdAt: "desc" } }),
    prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true, summary: true, specialty: true }, orderBy: { title: "asc" } }),
  ]);
  const titleOf = new Map(cases.map((c) => [c.slug, localizeCaseMeta(c, lang).title]));
  return (
    <>
      <PageHeader eyebrow={t("Cursus", "Curriculum")} title={t("Programmes de formation", "Training programs")} sub={t("Regroupez des cas publiés en programmes structurés (ex. « Stage d'urgences ») pour vos promotions.", "Group published cases into structured programs (e.g. \"Emergency placement\") for your classes.")} />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardTitle>{t("Nouveau programme", "New program")}</CardTitle>
          <ProgramForm cases={cases.map((c) => ({ slug: c.slug, title: titleOf.get(c.slug) ?? c.title }))} />
        </Card>
        <div className="space-y-4">
          {programs.length === 0 && <Empty title={t("Aucun programme", "No programs")} />}
          {programs.map((p) => (
            <Card key={p.id}>
              <CardTitle sub={`${t("Créé le", "Created")} ${fmtDate(p.createdAt, lang)}`}>{p.name}</CardTitle>
              {p.description && <p className="muted -mt-2 mb-3 text-sm">{p.description}</p>}
              <ol className="space-y-1 text-sm">
                {parseJson<string[]>(p.caseSlugs, []).map((s, i) => (
                  <li key={s}>
                    <span className="subtle font-mono text-xs">{i + 1}.</span> {titleOf.get(s) ?? s}
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
