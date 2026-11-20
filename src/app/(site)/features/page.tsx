import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Box, CheckCircle2, FileText, Globe2, Lock, Mic, ShieldCheck, Stethoscope, Users } from "@/components/icons";
import { PageHero } from "@/components/site/page-hero";
import { Photo, Reveal, TiltCard } from "@/components/motion";
import { HeartScene } from "@/components/three";
import type { PhotoKey } from "@/lib/photos";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Fonctionnalités — patients virtuels, consultation simulée, examens et évaluation", "Features — virtual patients, simulated consultation, tests and assessment"),
    description: t("Comment DiagnoCare simule une consultation : patient virtuel verrouillé sur le cas, examen clinique, examens complémentaires, raisonnement et évaluation par grille.", "How DiagnoCare simulates a consultation: a virtual patient locked to the case, physical examination, investigations, reasoning and rubric-based assessment."),
  };
}

export default async function FeaturesPage() {
  const t = await getT();
  const SECTIONS: { id: string; icon: typeof Users; title: string; nav: string; body: string; points: string[]; photo?: PhotoKey; three?: boolean }[] = [
    { id: "patients", nav: t("Patients virtuels", "Virtual patients"), icon: Users, photo: "bedside2", title: t("Des patients virtuels avec une vraie personnalité", "Virtual patients with a real personality"), body: t("Chaque cas définit un patient fictif — âge, profession, caractère, état émotionnel — et sa réponse à chaque thème de l'interrogatoire. Le patient réagit (douleur, angoisse, agacement) et son avatar l'exprime en temps réel.", "Each case defines a fictional patient — age, occupation, character, emotional state — and their answer to every history topic. The patient reacts (pain, anxiety, irritation) and their avatar shows it in real time."), points: [t("Réponses guidées par le profil (stoïque, anxieux, accompagné d'un parent…)", "Answers shaped by the profile (stoical, anxious, accompanied by a parent…)"), t("Avatar qui change d'expression selon l'émotion", "Avatar whose expression changes with emotion"), t("Moniteur au lit du patient avec dégradation programmée", "Bedside monitor with programmed deterioration")] },
    { id: "consultation", nav: t("Consultation", "Consultation"), icon: BrainCircuit, photo: "consultation", title: t("Un patient qui ne trahit jamais le cas", "A patient who never gives the case away"), body: t("Le moteur de conversation ne reçoit que ce que le patient est censé savoir. Le diagnostic, la grille et les résultats ne lui sont jamais transmis. Si le service d'IA est indisponible, un moteur hors ligne répond mot pour mot à partir du dossier.", "The conversation engine only receives what the patient is supposed to know. The diagnosis, rubric and results are never passed to it. If the AI service is unavailable, an offline engine answers word for word from the record."), points: [t("Historique de consultation persistant et contextuel", "Persistent, contextual consultation history"), t("Résistant aux tentatives de faire sortir le patient de son rôle", "Resistant to attempts to break the patient out of character"), t("Mode démonstration clairement signalé sans clé d'IA", "Demo mode clearly labelled without an AI key")] },
    { id: "exams", nav: t("Examens", "Tests"), icon: Stethoscope, photo: "vitalsMonitor", title: t("Examen clinique et examens complémentaires", "Physical examination and investigations"), body: t("35 gestes d'examen et 34 examens complémentaires — biologie, ECG, imagerie, microbiologie, actes. Les résultats viennent du cas ; les systèmes non concernés renvoient des résultats normaux.", "35 examination manoeuvres and 34 investigations — labs, ECG, imaging, microbiology, procedures. Results come from the case; unaffected systems return normal results."), points: [t("Résultats anormaux signalés comme dans un vrai logiciel de résultats", "Abnormal results flagged as in real results software"), t("Examens inutiles comptabilisés et pénalisés", "Unnecessary tests counted and penalised"), t("Délais affichés pour apprendre le coût et le temps", "Turnaround times shown to learn cost and time")] },
    { id: "assessment", nav: t("Évaluation", "Assessment"), icon: FileText, photo: "bookStethoscope", title: t("Une évaluation clinique transparente", "Transparent clinical assessment"), body: t("La note est calculée de façon déterministe à partir d'une grille explicite : interrogatoire, examen, examens complémentaires, diagnostic, prise en charge. Le feedback narratif par IA (Pro et Faculté) explique la note — il ne la fixe jamais.", "The score is calculated deterministically from an explicit rubric: history, examination, investigations, diagnosis, management. The AI narrative feedback (Pro and Faculty) explains the score — it never sets it."), points: [t("Chaque point rattaché à un critère nommé", "Every point tied to a named criterion"), t("Choix dangereux pénalisés et expliqués", "Dangerous choices penalised and explained"), t("Rapports PDF, commentaires et ajustement de note par l'enseignant", "PDF reports, comments and score adjustment by the teacher")] },
    { id: "review", nav: t("Validation", "Review"), icon: ShieldCheck, photo: "medicalTeam", title: t("Circuit de validation par des experts", "Expert review workflow"), body: t("Un cas passe de Brouillon → En validation → Publié. La publication exige un expert nommé et l'attestation que le cas est fictif, cohérent, sûr et que sa grille a été relue. Toute modification ultérieure le renvoie en brouillon.", "A case moves from Draft → In review → Published. Publishing requires a named expert and confirmation that the case is fictional, consistent, safe and that its rubric was reviewed. Any later edit sends it back to draft."), points: [t("Cas et grilles versionnés", "Versioned cases and rubrics"), t("Journal d'audit de chaque publication et modification", "Audit log of every publication and edit"), t("Seuls les cas publiés peuvent être assignés", "Only published cases can be assigned")] },
    { id: "languages", nav: t("Langues", "Languages"), icon: Globe2, photo: "algiersSunset", title: t("Français et anglais", "French and English"), body: t("Toute la plateforme bascule entre le français et l'anglais d'un clic : interface, cas cliniques, résultats, rapports et patient. En mode IA, le patient parle comme un patient algérien et traduit fidèlement les faits du dossier.", "The whole platform switches between French and English in one click: interface, clinical cases, results, reports and the patient. In AI mode, the patient speaks like an Algerian patient and faithfully translates the facts in the record."), points: [t("Sélecteur FR / EN sur chaque page", "FR / EN switch on every page"), t("Le moteur hors ligne comprend aussi quelques mots de darija", "The offline engine also understands some darija words"), t("Langue enregistrée pour chaque consultation", "Language recorded for every consultation")] },
    { id: "voice", nav: t("Voix", "Voice"), icon: Mic, photo: "doctorPortrait", title: t("Consultation vocale", "Voice consultation"), body: t("Parlez au patient et écoutez ses réponses grâce à la reconnaissance et à la synthèse vocales du navigateur. La salle vous prévient si votre navigateur ne les prend pas en charge.", "Talk to the patient and hear their answers using your browser's speech recognition and synthesis. The room tells you if your browser doesn't support them."), points: [t("Micro en appuyer-pour-parler", "Push-to-talk microphone"), t("Lecture vocale des réponses du patient", "Patient answers read aloud"), t("Fournisseurs vocaux serveur intégrables plus tard", "Server voice providers can be plugged in later")] },
    { id: "3d", nav: "3D", icon: Box, three: true, title: t("Prêt pour la 3D", "Ready for 3D"), body: t("L'avatar passe par une interface de rendu interchangeable, pilotée par le flux d'émotions du moteur. Aujourd'hui : un patient illustré dans la salle et de l'anatomie 3D en temps réel sur la plateforme. Demain : des patients 3D animés.", "The avatar goes through a swappable rendering interface, driven by the engine's emotion stream. Today: an illustrated patient in the room and real-time 3D anatomy on the platform. Tomorrow: animated 3D patients."), points: [t("Interface de rendu documentée dans le code", "Rendering interface documented in the code"), t("Émotion et parole déjà transmises par le moteur", "Emotion and speech already sent by the engine")] },
  ];

  return (
    <>
      <PageHero eyebrow={t("Fonctionnalités", "Features")} photo="surgeonsLooking" title={<>{t("Tout ce qu'exige une consultation.", "Everything a consultation demands.")} <span className="text-gradient">{t("Sans aucun risque.", "Without any risk.")}</span></>} sub={t("DiagnoCare est une plateforme de simulation pédagogique. Ce n'est pas un dispositif médical et elle ne pose aucun diagnostic pour de vrais patients.", "DiagnoCare is an educational simulation platform. It is not a medical device and makes no diagnosis for real patients.")}>
        <nav className="mt-10 flex flex-wrap gap-2" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="glass rounded-full px-4 py-2 text-sm text-white/80 transition hover:bg-white/15 hover:text-white">{s.nav}</a>
          ))}
        </nav>
      </PageHero>

      <div className="mx-auto max-w-7xl space-y-24 px-4 py-20 sm:space-y-32 sm:px-6">
        {SECTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal className={i % 2 ? "lg:order-2" : ""}>
              <TiltCard className="rounded-2xl" intensity={6}>
                {s.three ? (
                  <div className="noise relative aspect-[4/3] overflow-hidden rounded-2xl bg-navy-950">
                    <div className="aurora absolute inset-0" />
                    <HeartScene className="absolute inset-0" />
                  </div>
                ) : (
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Photo photo={s.photo!} className="absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/70 via-transparent to-transparent" />
                    <span className="glass absolute bottom-5 left-5 grid h-12 w-12 place-items-center rounded-2xl text-white"><s.icon className="h-6 w-6" /></span>
                  </div>
                )}
              </TiltCard>
            </Reveal>
            <div className={i % 2 ? "lg:order-1" : ""}>
              <Reveal><p className="font-mono text-sm text-teal-600 dark:text-teal-400">0{i + 1} / 0{SECTIONS.length}</p></Reveal>
              <Reveal delay={0.08}><h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{s.title}</h2></Reveal>
              <Reveal delay={0.16}><p className="muted mt-4 text-lg leading-relaxed">{s.body}</p></Reveal>
              <Reveal delay={0.24}>
                <ul className="mt-6 space-y-3">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" /> {p}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </section>
        ))}

        <Reveal>
          <div className="ring-gradient panel flex flex-wrap items-center justify-between gap-6 rounded-2xl p-8">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/15"><Lock className="h-6 w-6" /></span>
              <p className="max-w-2xl text-[15px]"><strong>{t("Sécurité dès la conception :", "Secure by design:")}</strong> {t("contrôle d'accès par rôle, mots de passe chiffrés, sessions httpOnly, validation de chaque requête, journal d'audit et limitation du nombre de requêtes.", "role-based access control, hashed passwords, httpOnly sessions, validation of every request, audit log and rate limiting.")}</p>
            </div>
            <Link href="/register" className="btn-primary">{t("Essayer gratuitement", "Try it free")} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}
