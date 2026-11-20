import type { Metadata } from "next";
import { Compass, Eye, ShieldAlert, Target } from "@/components/icons";
import { PageHero } from "@/components/site/page-hero";
import { Photo, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("À propos — mission, vision et objectifs pédagogiques", "About — mission, vision and learning objectives"),
    description: t("DiagnoCare veut offrir à chaque étudiant en médecine d'Algérie un entraînement sûr, répétable et de qualité sur des patients virtuels.", "DiagnoCare aims to give every medical student in Algeria safe, repeatable, high-quality practice on virtual patients."),
  };
}

export default async function AboutPage() {
  const t = await getT();
  const OBJECTIVES = [
    [t("Interrogatoire structuré", "Structured history taking"), t("Couvrir motif, signes associés, antécédents, traitements, allergies et vécu du patient — et voir précisément ce qui a été oublié.", "Cover the presenting complaint, associated symptoms, history, medications, allergies and the patient's perspective — and see exactly what was missed.")],
    [t("Examen clinique ciblé", "Targeted examination"), t("Choisir les gestes qui départagent les hypothèses, plutôt que de tout examiner.", "Choose the manoeuvres that separate the hypotheses, rather than examining everything.")],
    [t("Examens pertinents", "Relevant investigations"), t("Les examens essentiels rapportent des points ; les examens inutiles ou dangereux en coûtent. Les bonnes habitudes se prennent tôt.", "Essential tests earn points; unnecessary or dangerous ones cost points. Good habits start early.")],
    [t("Raisonnement clinique", "Clinical reasoning"), t("S'engager sur des diagnostics différentiels, un diagnostic retenu et des arguments — un raisonnement visible et évaluable.", "Commit to differentials, a final diagnosis and arguments — reasoning that is visible and assessable.")],
    [t("Prise en charge sûre", "Safe management"), t("Chaque plan est confronté à des actions essentielles, appropriées et contre-indiquées, toutes justifiées.", "Every plan is compared against essential, appropriate and contraindicated actions, all explained.")],
    [t("Apprentissage réflexif", "Reflective learning"), t("Feedback, points pédagogiques et commentaires de l'enseignant font de chaque simulation un cycle d'apprentissage.", "Feedback, teaching points and teacher comments turn every simulation into a learning cycle.")],
  ];
  return (
    <>
      <PageHero eyebrow={t("À propos", "About")} photo="algiersSunset" title={<>{t("S'entraîner en sécurité,", "Practise safely,")} <span className="text-gradient">{t("avant le premier vrai patient.", "before the first real patient.")}</span></>} sub={t("Nous construisons le service virtuel que nous aurions aimé avoir pendant notre externat : toujours ouvert, infiniment patient, et honnête sur votre prestation.", "We're building the virtual ward we wish we'd had as students: always open, endlessly patient, and honest about your performance.")} />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="grid grid-cols-2 gap-4">
              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl"><Photo photo="studentBooks" className="absolute inset-0" /></div>
              <div className="mt-12 space-y-4">
                <div className="group relative aspect-square overflow-hidden rounded-2xl"><Photo photo="maqam" className="absolute inset-0" /></div>
                <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl"><Photo photo="lab" className="absolute inset-0" /></div>
              </div>
            </div>
          </Reveal>
          <Stagger className="space-y-4">
            {[
              { icon: Target, t: t("Mission", "Mission"), d: t("Offrir à chaque étudiant en médecine — d'Alger à Tamanrasset — un entraînement illimité, sûr et de qualité à la consultation et au raisonnement clinique.", "Give every medical student — from Algiers to Tamanrasset — unlimited, safe, high-quality practice in consultation and clinical reasoning.") },
              { icon: Eye, t: t("Vision", "Vision"), d: t("Des médecins qui abordent leurs premiers vrais patients après avoir déjà répété des centaines de consultations, avec un feedback qui les a fait progresser.", "Doctors who meet their first real patients having already rehearsed hundreds of consultations, with feedback that helped them improve.") },
              { icon: Compass, t: t("Principes", "Principles"), d: t("Patients fictifs uniquement. Notation transparente. Contenus validés par des experts. Une IA au service des enseignants, pas à leur place.", "Fictional patients only. Transparent scoring. Expert-reviewed content. AI that serves teachers, not replaces them.") },
            ].map((x) => (
              <StaggerItem key={x.t}>
                <div className="panel flex gap-5 rounded-2xl p-6">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white"><x.icon className="h-6 w-6" /></span>
                  <div>
                    <h2 className="text-xl font-bold">{x.t}</h2>
                    <p className="muted mt-1 leading-relaxed">{x.d}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="noise relative overflow-hidden bg-navy-950 py-24 text-white">
        <div className="aurora absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="relative h-[360px] lg:h-auto">
            <Photo photo="lab" className="absolute inset-0 rounded-2xl" sizes="40vw" />
          </div>
          <div>
            <Reveal><span className="eyebrow">{t("Objectifs pédagogiques", "Learning objectives")}</span></Reveal>
            <Reveal delay={0.1}><h2 className="mt-4 text-4xl font-bold">{t("Six compétences, mesurées à chaque fois.", "Six skills, measured every time.")}</h2></Reveal>
            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2">
              {OBJECTIVES.map(([x, d], i) => (
                <StaggerItem key={x}>
                  <div className="glass h-full rounded-2xl p-5">
                    <p className="font-mono text-xs text-teal-300">0{i + 1}</p>
                    <h3 className="mt-1 font-semibold">{x}</h3>
                    <p className="mt-1 text-sm text-white/65">{d}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      <Reveal className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8 text-amber-950 sm:flex-row dark:border-amber-500/30 dark:from-amber-500/10 dark:to-orange-500/5 dark:text-amber-100">
          <ShieldAlert className="h-8 w-8 shrink-0 text-amber-500" />
          <div>
            <h2 className="text-xl font-bold">{t("Notre engagement de sécurité", "Our safety commitment")}</h2>
            <p className="mt-2 leading-relaxed">{t("DiagnoCare est strictement une simulation pédagogique. Elle ne traite jamais de données de vrais patients, ce n'est pas un service de diagnostic, et le feedback produit par IA n'est pas validé médicalement de façon indépendante. Chaque faculté reste responsable de la relecture par ses experts des cas et des grilles utilisés en formation.", "DiagnoCare is strictly an educational simulation. It never handles real patient data, it is not a diagnostic service, and AI-generated feedback is not independently medically validated. Each faculty remains responsible for having its experts review the cases and rubrics used in teaching.")}</p>
          </div>
        </div>
      </Reveal>
    </>
  );
}
