import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { LiveDemo } from "@/components/site/live-demo";
import { Hero } from "@/components/site/hero";
import { PromoFilm } from "@/components/site/promo-film";
import { CaseDeck, ReliabilityPanel, StepsTimeline, TeacherVoices, type DeckCase } from "@/components/site/home-sections";
import { DEMO_CASES } from "@/lib/cases/demo-cases";
import { difficultyLabel, specialtyBlurb, specialtyName } from "@/lib/catalog";
import { CountUp, ParallaxPhoto, Photo, Reveal } from "@/components/motion";
import { SPECIALTIES } from "@/lib/catalog";
import { SPECIALTY_PHOTO } from "@/lib/photos";
import { getLang } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";
import { localizeCaseContent, localizeCaseMeta } from "@/lib/cases/i18n";

export default async function Home() {
  const lang = await getLang();
  const t = makeT(lang);

  const DECK: DeckCase[] = DEMO_CASES.map((c) => {
    const content = localizeCaseContent(c.content, c.slug, lang);
    return {
      title: localizeCaseMeta(c, lang).title,
      specialty: specialtyName(c.specialty, lang),
      level: difficultyLabel(c.difficulty, lang),
      setting: content.setting.replace(/ — .*$/, ""),
      patient: `${content.patient.name}, ${c.content.patient.age} ${t("ans", "y/o")}`,
      complaint: lang === "en" ? c.content.chiefComplaint.en : c.content.chiefComplaint.fr ?? c.content.chiefComplaint.en,
    };
  });

  const STEPS: [string, string][] = [
    [t("Choisir un patient", "Choose a patient"), t("Spécialité, niveau et cas, dans une bibliothèque relue par des experts.", "Specialty, level and case, from an expert-reviewed library.")],
    [t("Interroger", "Take the history"), t("À l'écrit ou à la voix, en français ou en anglais.", "Typed or spoken, in French or English.")],
    [t("Examiner", "Examine"), t("35 gestes d'examen, tensiomètre et glucomètre, résultats tirés du dossier.", "35 examination manoeuvres, BP cuff and glucometer, results drawn from the record.")],
    [t("Demander des examens", "Order tests"), t("Biologie, ECG, imagerie — les examens inutiles coûtent des points.", "Labs, ECG, imaging — unnecessary tests cost points.")],
    [t("Raisonner", "Reason"), t("Diagnostics différentiels, diagnostic retenu, arguments.", "Differential diagnoses, final diagnosis, reasoning.")],
    [t("Prendre en charge", "Manage"), t("Traitement, surveillance, orientation ; gestes dangereux signalés.", "Treatment, monitoring, disposition; dangerous actions flagged.")],
    [t("Recevoir sa note", "Get your score"), t("Détail point par point selon la grille, avec points pédagogiques.", "Point-by-point breakdown against the rubric, with teaching points.")],
  ];

  return (
    <>
      <Hero />

      {/* ───────────── CHIFFRES ───────────── */}
      <section className="border-b border-[rgb(var(--line))] pt-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-[rgb(var(--line))] px-4 sm:px-6 md:grid-cols-4 md:divide-x">
          {[[10, "", t("spécialités couvertes", "specialties covered")], [35, "", t("gestes d'examen clinique", "clinical examination manoeuvres")], [34, "", t("examens complémentaires", "investigations")], [2, "", t("langues de consultation", "consultation languages")]].map(([n, s, l], i) => (
            <Reveal key={l as string} delay={i * 0.1} className="py-8 md:px-8 first:md:pl-0">
              <p className="font-display text-5xl font-bold text-[#1f6fe0] dark:text-[#6fb1ff]"><CountUp to={n as number} suffix={s as string} /></p>
              <p className="muted mt-1 text-sm">{l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────── FILM ───────────── */}
      <section className="relative overflow-hidden bg-[#050c1a] py-24 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-[#0a5be0]/20 blur-[140px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Le film · 1 minute", "The film · 1 minute")}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{t("Au début, on ne peut pas s'entraîner sur un vrai patient.", "At first, you can't practise on a real patient.")}</h2>
            <p className="mt-4 text-lg text-white/65">{t("Voici comment DiagnoCare comble ce vide entre les cours et le lit du malade.", "Here's how DiagnoCare bridges the gap between lectures and the bedside.")}</p>
          </Reveal>
          <Reveal className="mt-12">
            <PromoFilm />
          </Reveal>
        </div>
      </section>

      {/* ───────────── DÉMO ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal><p className="eyebrow-light">{t("Démo", "Demo")}</p></Reveal>
            <Reveal><h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{t("Posez vos questions à Mourad.", "Ask Mourad your questions.")}</h2></Reveal>
            <Reveal>
              <p className="muted mt-4 text-lg leading-relaxed">{t("58 ans, routier, réveillé par une douleur dans la poitrine. Il ne répond qu'à ce que vous lui demandez. Essayez en français, en anglais ou même en darija : « wach bik ? ».", "58, truck driver, woken by chest pain. He only answers what you ask him. Try in English or French.")}</p>
            </Reveal>
            <Reveal>
              <ul className="mt-6 divide-y divide-[rgb(var(--line))] border-y border-[rgb(var(--line))] text-sm">
                {[t("Le patient ne connaît pas son diagnostic : il ne peut pas le révéler.", "The patient doesn't know his diagnosis: he can't give it away."), t("Ses réponses viennent du dossier du cas, jamais inventées.", "His answers come from the case record, never invented."), t("La démo publique est gratuite et sans inscription.", "The public demo is free, no sign-up needed.")].map((x) => (
                  <li key={x} className="flex gap-3 py-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1f6fe0]" /> {x}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal>
            <div id="demo" className="scroll-mt-28 rounded-2xl border border-[rgb(var(--line))] bg-[rgb(var(--panel-2))] p-2">
              <LiveDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── ALGÉRIE ───────────── */}
      <section className="relative overflow-hidden bg-[#071026] py-24 text-white">
        <div className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#38e1ff]/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Reveal><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Pensé pour l'Algérie", "Built for Algeria")}</p></Reveal>
            <Reveal><h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{t("Des cas qui ressemblent à vos stages.", "Cases that look like your placements.")}</h2></Reveal>
            <Reveal>
              <p className="mt-5 text-lg leading-relaxed text-white/65">{t("Urgences d'un CHU d'Alger à 2 h du matin, consultation de pédiatrie dans un EPSP d'Oran, polyclinique de Blida… Les situations aussi sont familières : jeûne du Ramadan chez un diabétique, chemma, allergie au Bactrim, thrombolyse quand la salle de cathétérisme est trop loin.", "An Algiers teaching-hospital ED at 2 a.m., a paediatric clinic in Oran, a polyclinic in Blida… The situations are familiar too: Ramadan fasting in a diabetic, chemma, a Bactrim allergy, thrombolysis when the cath lab is too far away.")}</p>
            </Reveal>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                [t("Cursus", "Curriculum"), t("Cas fondamentaux, intermédiaires et avancés, de l'externat au résidanat.", "Foundation, intermediate and advanced cases, from clinical years to residency.")],
                [t("Langues", "Languages"), t("Interface et consultation en français ou en anglais, au choix.", "Interface and consultation in French or English, your choice.")],
                [t("Validation", "Review"), t("Chaque faculté fait relire ses cas par ses propres experts avant de les assigner.", "Each faculty has its own experts review cases before assigning them.")],
                [t("Tarifs", "Pricing"), t("Formule gratuite, Étudiant Pro à 1 200 DA par mois, licence faculté sur devis.", "Free plan, Student Pro at 1,200 DA per month, faculty licence on quote.")],
              ].map(([x, d]) => (
                <Reveal key={x}>
                  <dt className="font-semibold text-white">{x}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-white/60">{d}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
          <Reveal>
            <CaseDeck cases={DECK} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── DÉROULÉ ───────────── */}
      <section className="bg-[#050c1a] py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Déroulé d'une simulation", "How a simulation runs")}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{t("Le même enchaînement qu'en consultation réelle.", "The same flow as a real consultation.")}</h2>
            <p className="mt-4 text-lg text-white/60">{t("Sept étapes, environ 15 à 25 minutes par cas.", "Seven steps, about 15 to 25 minutes per case.")}</p>
          </Reveal>
          <StepsTimeline steps={STEPS} />
          <Reveal className="mt-14 text-center">
            <Link href="/features" className="btn-primary px-6 py-3.5 text-[15px] font-semibold">{t("Voir toutes les fonctionnalités", "See all features")} <ArrowRight className="h-4 w-4" /></Link>
          </Reveal>
        </div>
      </section>

      {/* ───────────── PHOTO ───────────── */}
      <section className="relative">
        <ParallaxPhoto photo="hallwayDoctors" className="h-[460px]" strength={30} />
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6">
            <p className="max-w-2xl font-display text-3xl font-semibold leading-snug text-white sm:text-4xl">{t("« Chaque grand clinicien a d'abord été un externe stressé face à son premier patient. »", "“Every great clinician was once a nervous student facing their first patient.”")}</p>
          </div>
        </div>
      </section>

      {/* ───────────── SPÉCIALITÉS ───────────── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Reveal><p className="eyebrow-light">{t("Spécialités", "Specialties")}</p></Reveal>
            <Reveal><h2 className="mt-4 text-3xl font-bold sm:text-4xl">{t("Dix spécialités, un seul outil.", "Ten specialties, one tool.")}</h2></Reveal>
          </div>
          <Link href="/specialties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline">{t("Toutes les spécialités", "All specialties")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALTIES.map((s) => (
            <Link key={s.key} href={`/specialties#${s.key}`} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Photo photo={SPECIALTY_PHOTO[s.key]} className="absolute inset-0" sizes="(max-width:640px) 100vw, 25vw" w={800} />
              </div>
              <h3 className="mt-3 font-semibold group-hover:text-brand-600">{specialtyName(s.key, lang)}</h3>
              <p className="muted mt-0.5 text-sm">{specialtyBlurb(s.key, lang)}</p>
            </Link>
          ))}
          <Link href="/register" className="flex flex-col justify-center rounded-xl border border-dashed border-[rgb(var(--line))] p-6 hover:border-brand-500">
            <p className="font-semibold">{t("Votre faculté a ses propres cas ?", "Does your faculty have its own cases?")}</p>
            <p className="muted mt-1 text-sm">{t("Les enseignants peuvent rédiger, faire valider et publier leurs scénarios.", "Teachers can write, get reviewed and publish their own scenarios.")}</p>
          </Link>
        </div>
      </section>

      {/* ───────────── FIABILITÉ ───────────── */}
      <section className="relative overflow-hidden bg-[#071026] py-24 text-white">
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-full bg-[#0a5be0]/20 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Fiabilité", "Reliability")}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{t("La note vient d'une grille, pas d'une impression.", "The score comes from a rubric, not an impression.")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">{t("Chaque point gagné ou perdu correspond à un critère écrit par un enseignant. Le commentaire automatique explique la note ; il ne la décide jamais.", "Every point won or lost maps to a criterion written by a teacher. The automatic comment explains the score; it never decides it.")}</p>
          </Reveal>
          <div className="mt-12">
            <ReliabilityPanel />
          </div>
        </div>
      </section>

      {/* ───────────── ENSEIGNANTS ───────────── */}
      <section className="relative overflow-hidden bg-[#050c1a] pb-32 pt-24 text-white">
        <div className="pointer-events-none absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-[#2f86ff]/15 blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Ce que demandent les enseignants", "What teachers ask for")}</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-5xl">{t("Conçu avec les attentes des facultés en tête.", "Designed around what faculties need.")}</h2>
            <p className="mt-4 text-white/60">{t("Trois besoins que nous entendons le plus souvent chez les enseignants.", "Three needs we hear most often from teachers.")}</p>
          </Reveal>
          <div className="mt-14">
            <TeacherVoices />
          </div>
          <p className="mt-16 text-center text-xs text-white/35">{t("Propos illustratifs, à remplacer par des témoignages vérifiés de facultés pilotes avant le lancement.", "Illustrative quotes, to be replaced with verified testimonials from pilot faculties before launch.")}</p>
        </div>
      </section>

    </>
  );
}
