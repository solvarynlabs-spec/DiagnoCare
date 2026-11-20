import { requireUser } from "@/lib/auth/session";
import { prisma, parseJson } from "@/lib/db";
import { caseContent } from "@/lib/cases/repo";
import { blankCase } from "@/lib/cases/template";
import { PageHeader } from "@/components/ui";
import { CaseEditor, type EditorValue } from "@/components/cases/case-editor";
import type { Difficulty } from "@/lib/sim/types";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Nouveau cas", "New case") };
}

export default async function NewCasePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  await requireUser({ permission: "case:write" });
  const t = await getT();
  const { from } = await searchParams;
  let initial: EditorValue = blankCase();
  if (from) {
    const src = await prisma.clinicalCase.findUnique({ where: { id: from } });
    if (src) {
      initial = {
        meta: { slug: `${src.slug}-copy`, title: `${src.title} (copie)`, specialty: src.specialty, difficulty: src.difficulty as Difficulty, summary: src.summary, objectives: parseJson<string[]>(src.learningObjectives, []), minutes: src.estimatedMinutes, freeTier: false },
        content: caseContent(src),
      };
    }
  }
  return (
    <>
      <PageHeader eyebrow={t("Rédaction de cas", "Case authoring")} title={from ? t("Dupliquer un cas", "Duplicate a case") : t("Nouveau cas clinique", "New clinical case")} sub={t("Utilisez uniquement des données fictives. Le cas est la seule source de vérité pour le patient virtuel, les résultats et la notation.", "Use fictional data only. The case is the single source of truth for the virtual patient, results and scoring.")} />
      <CaseEditor initial={initial} />
    </>
  );
}
