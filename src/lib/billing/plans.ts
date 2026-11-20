export type PlanKey = "FREE" | "STUDENT_PRO" | "UNIVERSITY";

/** Prix en dinars algériens (DA / DZD). */
export const CURRENCY = "DZD";
export const formatDA = (amount: number, lang: "fr" | "en" = "fr") => `${new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-DZ").format(amount)} DA`;

export interface PlanDef {
  key: PlanKey;
  name: string;
  nameEn: string;
  priceMonthly: number; // DA
  priceYearly: number; // DA
  tagline: string;
  taglineEn: string;
  features: string[];
  featuresEn: string[];
  limits: {
    simulationsPerMonth: number | null; // null = illimité
    fullLibrary: boolean;
    aiFeedback: boolean;
    analytics: boolean;
    pdfReports: boolean;
    voice: boolean;
    institution: boolean;
  };
}

export const PLANS: PlanDef[] = [
  {
    key: "FREE",
    name: "Gratuit",
    nameEn: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Commencez à entraîner votre raisonnement clinique dès aujourd'hui.",
    taglineEn: "Start training your clinical reasoning today.",
    features: ["5 simulations par mois", "Bibliothèque de cas fondamentaux", "Notation par grille d'évaluation", "Tableau de bord étudiant"],
    featuresEn: ["5 simulations per month", "Foundation case library", "Rubric-based scoring", "Student dashboard"],
    limits: { simulationsPerMonth: 5, fullLibrary: false, aiFeedback: false, analytics: false, pdfReports: false, voice: false, institution: false },
  },
  {
    key: "STUDENT_PRO",
    name: "Étudiant Pro",
    nameEn: "Student Pro",
    priceMonthly: 1200,
    priceYearly: 11000,
    tagline: "Le service hospitalier virtuel complet pour l'externat et l'internat.",
    taglineEn: "The complete virtual hospital ward for clinical rotations and internship.",
    features: ["Simulations illimitées", "Toute la bibliothèque, toutes spécialités", "Commentaire détaillé après chaque cas", "Statistiques détaillées et radar de compétences", "Rapports PDF téléchargeables", "Consultation vocale (navigateur)"],
    featuresEn: ["Unlimited simulations", "Full library, every specialty", "Detailed feedback after every case", "Detailed statistics and skills radar", "Downloadable PDF reports", "Voice consultation (browser)"],
    limits: { simulationsPerMonth: null, fullLibrary: true, aiFeedback: true, analytics: true, pdfReports: true, voice: true, institution: false },
  },
  {
    key: "UNIVERSITY",
    name: "Faculté",
    nameEn: "Faculty",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Simulation et évaluation à l'échelle de la faculté ou du CHU.",
    taglineEn: "Simulation and assessment across a whole faculty or teaching hospital.",
    features: ["Comptes enseignants et étudiants illimités", "Tableau de bord de l'établissement", "Cas cliniques personnalisés", "Gestion des devoirs et des évaluations", "Circuit de validation par des experts", "Rapports avancés et journal d'audit"],
    featuresEn: ["Unlimited teacher and student accounts", "Institution dashboard", "Custom clinical cases", "Assignment and assessment management", "Expert review workflow", "Advanced reports and audit log"],
    limits: { simulationsPerMonth: null, fullLibrary: true, aiFeedback: true, analytics: true, pdfReports: true, voice: true, institution: true },
  },
];

export const planByKey = (k: string | null | undefined): PlanDef => PLANS.find((p) => p.key === k) ?? PLANS[0];
