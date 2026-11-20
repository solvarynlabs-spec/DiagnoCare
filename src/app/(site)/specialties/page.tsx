import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Baby, Brain, ClipboardPlus, Clock, Eye, HeartPulse, ScanFace, Siren, Stethoscope, Wind } from "@/components/icons";
import { prisma } from "@/lib/db";
import { SPECIALTIES, specialtyBlurb, specialtyName } from "@/lib/catalog";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseMeta } from "@/lib/cases/i18n";
import { SPECIALTY_PHOTO } from "@/lib/photos";
import { DifficultyBadge } from "@/components/ui";
import { PageHero } from "@/components/site/page-hero";
import { Photo, Reveal, Stagger, StaggerItem } from "@/components/motion";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Spécialités — cardiologie, neurologie, pédiatrie, urgences et plus", "Specialties — cardiology, neurology, paediatrics, emergency and more"),
    description: t("Cas de patients virtuels en cardiologie, neurologie, pédiatrie, médecine d'urgence, médecine interne, dermatologie et médecine générale.", "Virtual patient cases in cardiology, neurology, paediatrics, emergency medicine, internal medicine, dermatology and general practice."),
  };
}
export const dynamic = "force-dynamic";

const ICONS = { HeartPulse, Brain, Baby, Siren, Stethoscope, ScanFace, ClipboardPlus, Eye, Wind } as const;

export default async function SpecialtiesPage() {
  const lang = await getLang();
  const t = makeT(lang);
  const cases = (await prisma.clinicalCase.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, title: true, summary: true, specialty: true, difficulty: true, patientAge: true, patientSex: true, estimatedMinutes: true } })).map((c) => localizeCaseMeta(c, lang));
  return (
    <>
      <PageHero eyebrow={t("Spécialités médicales", "Medical specialties")} photo="mri" title={<>{t("Tous vos stages.", "All your placements.")} <span className="text-gradient">{t("Un seul service virtuel.", "One virtual ward.")}</span></>} sub={t("Chaque spécialité propose des cas de niveau Fondamental, Intermédiaire et Avancé. Les facultés peuvent rédiger autant de cas qu'elles le souhaitent.", "Each specialty offers Foundation, Intermediate and Advanced cases. Faculties can write as many cases as they like.")} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-16 sm:px-6">
        {SPECIALTIES.map((s, i) => {
          const Icon = ICONS[s.icon as keyof typeof ICONS];
          const list = cases.filter((c) => c.specialty === s.key);
          return (
            <Reveal key={s.key}>
              <section id={s.key} className="panel group grid scroll-mt-28 overflow-hidden rounded-2xl p-0 md:grid-cols-[1.1fr_1fr]">
                <div className={`relative min-h-[280px] ${i % 2 ? "md:order-2" : ""}`}>
                  <Photo photo={SPECIALTY_PHOTO[s.key]} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/20 to-transparent" />
                  <div className="absolute bottom-0 p-7 text-white">
                    <span className="glass grid h-12 w-12 place-items-center rounded-2xl"><Icon className="h-6 w-6" /></span>
                    <h2 className="mt-3 text-3xl font-bold">{specialtyName(s.key, lang)}</h2>
                  </div>
                  <span className="absolute right-6 top-5 font-display text-7xl font-bold text-white/15">0{i + 1}</span>
                </div>
                <div className="p-7 sm:p-9">
                  <p className="muted text-lg">{specialtyBlurb(s.key, lang)}</p>
                  <Stagger className="mt-6 space-y-2">
                    {list.length === 0 && <p className="subtle text-sm">{t("Nouveaux cas bientôt disponibles.", "New cases coming soon.")}</p>}
                    {list.map((c) => (
                      <StaggerItem key={c.title}>
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line))] px-4 py-3 transition hover:border-brand-400">
                          <div>
                            <p className="font-semibold">{c.title}</p>
                            <p className="subtle flex items-center gap-2 text-xs"><span>{c.patientAge} {t("ans", "y/o")} · {c.patientSex === "F" ? "F" : t("H", "M")}</span><Clock className="h-3 w-3" /> {c.estimatedMinutes} min</p>
                          </div>
                          <DifficultyBadge d={c.difficulty} />
                        </div>
                      </StaggerItem>
                    ))}
                  </Stagger>
                  <Link href="/register" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">{t("S'entraîner en", "Practise")} {specialtyName(s.key, lang).toLowerCase()} <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </section>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}
