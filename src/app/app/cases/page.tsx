import Link from "next/link";
import { Clock, Lock, Search, UserRound } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { listPublishedCases, type LibraryFilters } from "@/lib/cases/repo";
import { parseJson, prisma } from "@/lib/db";
import { DIFFICULTIES, SPECIALTIES, difficultyLabel, specialtyName } from "@/lib/catalog";
import { Badge, DifficultyBadge, Empty, PageHeader } from "@/components/ui";
import { Photo } from "@/components/motion";
import { SPECIALTY_PHOTO } from "@/lib/photos";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta, symptomName } from "@/lib/cases/i18n";
import { DRAFT_SLUGS } from "@/lib/cases/drafts";
import { draftsOpenToStudents } from "@/lib/sim/service";
import { can } from "@/lib/rbac";
import { DraftPill } from "@/components/pedagogy";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Bibliothèque de cas", "Case library") };
}

export default async function CaseLibrary({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  const sp = await searchParams;
  const filters: LibraryFilters = {
    q: sp.q?.trim() || undefined,
    specialty: sp.specialty || undefined,
    difficulty: sp.difficulty || undefined,
    age: (["child", "adult", "older"] as const).find((a) => a === sp.age),
    maxMinutes: sp.maxMinutes ? Number(sp.maxMinutes) : undefined,
    symptom: sp.symptom || undefined,
  };
  const [drafts, draftsOpen] = await Promise.all([
    prisma.clinicalCase.findMany({ where: { status: "IN_REVIEW", slug: { in: [...DRAFT_SLUGS] } }, orderBy: [{ specialty: "asc" }, { difficulty: "asc" }] }),
    draftsOpenToStudents(),
  ]);
  const draftsPlayable = draftsOpen || can(user.roleKey, "case:write");
  const [cases, symptoms, mine] = await Promise.all([
    listPublishedCases(filters),
    prisma.caseSymptom.findMany({ distinct: ["name"], where: { case: { status: "PUBLISHED" } }, orderBy: { name: "asc" }, select: { name: true } }),
    prisma.assessmentResult.findMany({ where: { session: { userId: user.id } }, select: { totalScore: true, session: { select: { caseId: true } } } }),
  ]);
  const best = new Map<string, number>();
  mine.forEach((r) => best.set(r.session.caseId, Math.max(best.get(r.session.caseId) ?? 0, r.totalScore)));
  const active = Object.values(filters).some(Boolean);
  const symptomOptions = symptoms.map((s) => [s.name, symptomName(s.name, lang)] as [string, string]).sort((a, b) => a[1].localeCompare(b[1]));

  return (
    <>
      <PageHeader
        eyebrow={t("Bibliothèque de cas cliniques", "Clinical case library")}
        title={t("Choisissez votre prochain patient", "Choose your next patient")}
        sub={t("Tous les cas sont fictifs et ont passé le circuit de validation. Filtrez par spécialité, niveau, âge, symptôme ou durée.", "All cases are fictional and have passed the review workflow. Filter by specialty, level, age, symptom or duration.")}
      />
      <form className="panel mb-6 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-[2fr_repeat(5,1fr)_auto]" role="search">
        <div className="relative">
          <Search className="subtle pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <label htmlFor="q" className="sr-only">{t("Rechercher", "Search")}</label>
          <input id="q" name="q" defaultValue={filters.q} placeholder={t("Titre, objectifs, symptômes…", "Title, objectives, symptoms…")} className="field pl-9" />
        </div>
        <Select name="specialty" value={filters.specialty} label={t("Spécialité", "Specialty")} all={t("tous", "all")} options={SPECIALTIES.map((s) => [s.key, specialtyName(s.key, lang)])} />
        <Select name="difficulty" value={filters.difficulty} label={t("Niveau", "Level")} all={t("tous", "all")} options={DIFFICULTIES.map((d) => [d.key, difficultyLabel(d.key, lang)])} />
        <Select name="age" value={filters.age} label={t("Âge", "Age")} all={t("tous", "all")} options={[["child", t("Enfant (< 18 ans)", "Child (< 18)")], ["adult", t("Adulte (18–64 ans)", "Adult (18–64)")], ["older", t("Âgé (65 ans et +)", "Older (65+)")]]} />
        <Select name="symptom" value={filters.symptom} label={t("Symptôme", "Symptom")} all={t("tous", "all")} options={symptomOptions} />
        <Select name="maxMinutes" value={sp.maxMinutes} label={t("Durée", "Duration")} all={t("tous", "all")} options={[["10", "≤ 10 min"], ["15", "≤ 15 min"], ["20", "≤ 20 min"], ["30", "≤ 30 min"]]} />
        <div className="flex gap-2">
          <button className="btn-primary flex-1">{t("Filtrer", "Filter")}</button>
          {active && (
            <Link href="/app/cases" className="btn-ghost">
              {t("Réinitialiser", "Reset")}
            </Link>
          )}
        </div>
      </form>

      <p className="subtle mb-3 text-sm">{cases.length} {t("cas", cases.length === 1 ? "case" : "cases")}</p>
      {cases.length === 0 ? (
        <Empty title={t("Aucun cas ne correspond à ces filtres", "No case matches these filters")} action={<Link href="/app/cases" className="btn-ghost">{t("Effacer les filtres", "Clear filters")}</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((row) => {
            const c = localizeCaseMeta(row, lang, parseJson<string[]>(row.learningObjectives, []));
            const locked = !c.freeTier && !user.plan.limits.fullLibrary && user.roleKey === "STUDENT";
            const objectives = c.objectivesLocalized;
            const b = best.get(c.id);
            return (
              <Link key={c.id} href={`/app/cases/${c.slug}`} className="panel card-hover group flex flex-col overflow-hidden rounded-3xl p-0">
                <div className="relative h-40">
                  <Photo photo={SPECIALTY_PHOTO[c.specialty] ?? "consultation"} className="absolute inset-0" sizes="(max-width:768px) 100vw, 33vw" w={800} />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
                  <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
                    <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">{specialtyName(c.specialty, lang)}</span>
                    <div className="flex items-center gap-1.5">
                      {b !== undefined && <Badge tone="green">{t("Meilleure", "Best")} : {b}</Badge>}
                      {locked ? <span className="glass inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"><Lock className="h-3 w-3" /> Pro</span> : c.freeTier && <Badge tone="teal">{t("Gratuit", "Free")}</Badge>}
                    </div>
                  </div>
                  <h2 className="absolute inset-x-4 bottom-3 text-lg font-bold leading-tight text-white">{c.title}</h2>
                </div>
                <div className="flex flex-1 flex-col p-5">
                <p className="muted line-clamp-2 text-sm">{c.summary}</p>
                <ul className="subtle mt-3 space-y-1 text-xs">
                  {objectives.slice(0, 2).map((o) => (
                    <li key={o}>• {o}</li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs">
                  <DifficultyBadge d={c.difficulty} />
                  <span className="subtle flex items-center gap-1"><UserRound className="h-3.5 w-3.5" /> {c.patientAge} {t("ans", "y/o")} · {c.patientSex === "F" ? "F" : t("H", "M")}</span>
                  <span className="subtle flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.estimatedMinutes} min</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.symptoms.slice(0, 4).map((s) => (
                    <span key={s.id} className="chip bg-[rgb(var(--panel-2))] text-[11px]">{symptomName(s.name, lang)}</span>
                  ))}
                </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {drafts.length > 0 && !active && <DraftSection rows={drafts} lang={lang} playable={draftsPlayable} />}
    </>
  );
}

function DraftSection({ rows, lang, playable }: { rows: Awaited<ReturnType<typeof prisma.clinicalCase.findMany>>; lang: "fr" | "en"; playable: boolean }) {
  const t = makeT(lang);
  return (
    <section aria-labelledby="drafts-h" className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="drafts-h" className="text-xl font-bold">{t("Nouveaux cas sourcés — en relecture clinique", "New source-traceable cases — under clinical review")}</h2>
          <p className="subtle mt-1 max-w-3xl text-sm">{t("Brouillons rédigés à partir de recommandations vérifiées, avec références et métadonnées de relecture. Ils ne sont pas validés cliniquement : ", "Drafts written from verified guidelines, with references and review metadata. They are not clinically approved: ")}{playable ? t("accessibles pour relecture et test.", "available for review and testing.") : t("ils seront ouverts aux étudiants après validation par un enseignant clinicien.", "they will open to students once a clinical educator approves them.")}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => {
          const c = localizeCaseMeta(row, lang);
          return (
            <Link key={c.id} href={`/app/cases/${c.slug}`} className="panel card-hover flex flex-col gap-2 rounded-2xl p-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full bg-[rgb(var(--panel-2))] px-2.5 py-0.5 text-[11px] font-semibold">{specialtyName(c.specialty, lang)}</span>
                <DraftPill lang={lang} />
              </div>
              <h3 className="font-semibold leading-snug">{c.title}</h3>
              <p className="muted line-clamp-3 text-sm">{c.summary}</p>
              <div className="subtle mt-auto flex flex-wrap items-center gap-3 pt-2 text-xs">
                <DifficultyBadge d={c.difficulty} />
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {c.estimatedMinutes} min</span>
                {!playable && <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> {t("après validation", "after approval")}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Select({ name, value, label, all, options }: { name: string; value?: string; label: string; all: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="sr-only">{label}</label>
      <select id={name} name={name} defaultValue={value ?? ""} className="field">
        <option value="">{label} : {all}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
