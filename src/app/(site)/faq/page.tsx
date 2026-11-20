import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/page-hero";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("FAQ — questions fréquentes", "FAQ — frequently asked questions"),
    description: t("Réponses sur les patients virtuels DiagnoCare, le comportement de l'IA, la notation, les langues, la protection des données et l'offre pour les facultés.", "Answers about DiagnoCare's virtual patients, AI behaviour, scoring, languages, data protection and the faculty offer."),
  };
}

export default async function FaqPage() {
  const lang = await getLang();
  const t = makeT(lang);
  const FAQ = [
    [t("DiagnoCare est-il un outil de diagnostic ?", "Is DiagnoCare a diagnostic tool?"), t("Non. DiagnoCare est une plateforme de simulation pédagogique. Tous les patients sont fictifs et rien de ce qu'elle produit n'est un avis médical applicable à de vrais patients.", "No. DiagnoCare is an educational simulation platform. All patients are fictional and nothing it produces is medical advice applicable to real patients.")],
    [t("Comment le patient virtuel répond-il à mes questions ?", "How does the virtual patient answer my questions?"), t("En mode IA, un modèle de langage joue le rôle du patient à partir des seules informations qu'il est censé connaître. En mode démonstration (sans clé d'IA configurée), un moteur hors ligne répond mot pour mot à partir du dossier. La salle indique toujours le mode actif.", "In AI mode, a language model plays the patient using only what the patient is supposed to know. In demo mode (no AI key configured), an offline engine answers word for word from the record. The room always shows which mode is active.")],
    [t("L'IA peut-elle révéler le diagnostic ou modifier le cas ?", "Can the AI reveal the diagnosis or change the case?"), t("Non. Le diagnostic, la grille et les résultats d'examens ne sont jamais transmis au moteur de conversation. Le cas est la seule source de vérité et il est figé pour chaque consultation.", "No. The diagnosis, rubric and test results are never sent to the conversation engine. The case is the single source of truth and is frozen for each consultation.")],
    [t("Comment ma note est-elle calculée ?", "How is my score calculated?"), t("De façon déterministe, à partir de la grille propre à chaque cas : thèmes d'interrogatoire abordés, gestes et examens essentiels, diagnostic et différentiels, choix de prise en charge (avec pénalités pour les gestes dangereux ou inutiles). Chaque point apparaît dans votre rapport.", "Deterministically, from each case's own rubric: history topics covered, essential examinations and tests, diagnosis and differentials, management choices (with penalties for dangerous or unnecessary actions). Every point appears in your report.")],
    [t("Le feedback de l'IA est-il validé par des médecins ?", "Is the AI feedback validated by doctors?"), t("Les cas et les grilles sont relus par des cliniciens avant publication. Le commentaire narratif qui explique votre note est produit automatiquement et n'est pas validé médicalement de façon indépendante : utilisez-le comme aide à l'apprentissage et discutez-en avec vos enseignants.", "Cases and rubrics are reviewed by clinicians before publication. The narrative comment explaining your score is generated automatically and is not independently medically validated: use it as a learning aid and discuss it with your teachers.")],
    [t("Les cas sont-ils adaptés au contexte algérien ?", "Are the cases adapted to the Algerian context?"), t("Oui. Les patients, les villes, les structures (CHU, EPSP, polycliniques), les habitudes (chemma, jeûne du Ramadan) et les stratégies de prise en charge tiennent compte de la pratique en Algérie. Chaque faculté peut aussi rédiger ses propres cas.", "Yes. Patients, cities, facilities (teaching hospitals, public health centres, polyclinics), habits (chemma, Ramadan fasting) and management strategies reflect practice in Algeria. Each faculty can also write its own cases.")],
    [t("Quelles langues sont disponibles ?", "Which languages are available?"), t("Le français et l'anglais. Le sélecteur FR / EN bascule toute la plateforme : interface, cas cliniques, résultats, rapports et réponses du patient. En mode IA, le patient s'exprime comme un patient algérien ; le moteur hors ligne comprend aussi quelques expressions de darija.", "French and English. The FR / EN switch changes the whole platform: interface, clinical cases, results, reports and the patient's answers. In AI mode, the patient speaks like an Algerian patient; the offline engine also understands some darija expressions.")],
    [t("La voix fonctionne-t-elle ?", "Does voice work?"), t("La voix utilise la reconnaissance et la synthèse vocales de votre navigateur (de préférence Chrome ou Edge). Elle est disponible avec les formules Étudiant Pro et Faculté.", "Voice uses your browser's speech recognition and synthesis (preferably Chrome or Edge). It is available with the Student Pro and Faculty plans.")],
    [t("Qui peut voir mes consultations ?", "Who can see my consultations?"), t("Vous, les enseignants de vos groupes, les administrateurs de votre faculté et les administrateurs de la plateforme. Chaque action d'administration est inscrite au journal d'audit.", "You, the teachers of your groups, your faculty's administrators and the platform administrators. Every administrative action is recorded in the audit log.")],
    [t("Comment se fait le paiement ?", "How does payment work?"), t("Par carte CIB ou Edahabia, via la page de paiement sécurisée SofizPay (SATIM), en dinars. DiagnoCare ne voit ni ne stocke jamais votre numéro de carte.", "By CIB or Edahabia card, through SofizPay's secure payment page (SATIM), in dinars. DiagnoCare never sees or stores your card number.")],
  ];
  return (
    <>
      <PageHero align="center" eyebrow="FAQ" photo="bookStethoscope" title={<>{t("Des questions ?", "Questions?")} <span className="text-gradient">{t("Des réponses.", "Answers.")}</span></>} sub={t("Tout sur les patients virtuels, l'IA, la notation, les langues et la protection des données.", "Everything about virtual patients, AI, scoring, languages and data protection.")} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="panel group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {q}
                <span className="text-brand-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="muted mt-3 text-sm leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
        <p className="muted mt-8 text-sm">
          {t("Une autre question ?", "Another question?")} <Link className="font-semibold text-brand-600 hover:underline" href="/contact">{t("Contactez-nous", "Contact us")}</Link>.
        </p>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: lang === "en" ? "en" : "fr-DZ", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }),
          }}
        />
      </div>
    </>
  );
}
