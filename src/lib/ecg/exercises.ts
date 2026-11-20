import { stemi, type EcgSpec } from "./model";

/** Structured reading grid used both for the questions and the correction. */
export const RHYTHMS = ["Sinusal", "Fibrillation atriale", "Flutter atrial", "Tachycardie ventriculaire", "Dissociation atrio-ventriculaire"] as const;
export const PR_OPTS = ["Normal (120–200 ms)", "Allongé (> 200 ms)", "Non mesurable"] as const;
export const QRS_OPTS = ["Fins (< 120 ms)", "Larges (≥ 120 ms)"] as const;
export const REPOL_OPTS = ["Normale", "Sus-décalage ST systématisé", "Sus-décalage ST diffus", "Ondes T amples et pointues", "Ondes T négatives"] as const;
export const DIAGNOSES = [
  "ECG normal",
  "Infarctus inférieur (STEMI)",
  "Infarctus antérieur étendu (STEMI)",
  "Péricardite aiguë",
  "Fibrillation atriale rapide",
  "Flutter atrial 2:1",
  "Bloc atrio-ventriculaire complet",
  "Tachycardie ventriculaire",
  "Hyperkaliémie",
  "BAV du 1er degré",
  "Embolie pulmonaire (aspect S1Q3T3)",
] as const;

export interface EcgExercise {
  id: string;
  title: string;
  context: string;
  level: "Fondamental" | "Intermédiaire" | "Avancé";
  spec: EcgSpec;
  answer: { rhythm: (typeof RHYTHMS)[number]; rate: number; pr: (typeof PR_OPTS)[number]; qrs: (typeof QRS_OPTS)[number]; repol: (typeof REPOL_OPTS)[number]; dx: (typeof DIAGNOSES)[number] };
  explain: string[];
  action: string;
}

export const ECG_EXERCISES: EcgExercise[] = [
  {
    id: "normal",
    title: "Bilan préopératoire",
    context: "Homme de 32 ans, asymptomatique, avant une chirurgie du genou.",
    level: "Fondamental",
    spec: { rhythm: "sinus", rate: 72, seed: 3 },
    answer: { rhythm: "Sinusal", rate: 72, pr: "Normal (120–200 ms)", qrs: "Fins (< 120 ms)", repol: "Normale", dx: "ECG normal" },
    explain: ["Une onde P positive en DII devant chaque QRS : rythme sinusal.", "RR ≈ 4 grands carreaux : 300 ÷ 4 ≈ 75/min.", "PR 160 ms, QRS fins, ST isoélectrique, T positives sauf en aVR."],
    action: "Rien à signaler : l'intervention peut avoir lieu.",
  },
  {
    id: "stemi-inf",
    title: "Douleur thoracique à 2 h du matin",
    context: "Chauffeur de 58 ans, douleur rétrosternale constrictive depuis 40 minutes, sueurs.",
    level: "Intermédiaire",
    spec: { rhythm: "sinus", rate: 98, mods: stemi("inferior", 2.8), seed: 11 },
    answer: { rhythm: "Sinusal", rate: 98, pr: "Normal (120–200 ms)", qrs: "Fins (< 120 ms)", repol: "Sus-décalage ST systématisé", dx: "Infarctus inférieur (STEMI)" },
    explain: ["Sus-décalage du ST convexe en DII, DIII et aVF (territoire inférieur), plus marqué en DIII.", "Image en miroir : sous-décalage en DI et aVL — argument fort pour une lésion aiguë.", "Rechercher une extension au ventricule droit (V3R, V4R) avant toute trinitrine."],
    action: "Urgence : alerte de reperfusion (angioplastie primaire < 120 min, sinon fibrinolyse), aspirine, monitorage.",
  },
  {
    id: "stemi-ant",
    title: "Malaise au travail",
    context: "Femme de 61 ans, diabétique, oppression thoracique et nausées depuis 1 heure.",
    level: "Intermédiaire",
    spec: { rhythm: "sinus", rate: 88, mods: stemi("anterior", 3), seed: 19 },
    answer: { rhythm: "Sinusal", rate: 88, pr: "Normal (120–200 ms)", qrs: "Fins (< 120 ms)", repol: "Sus-décalage ST systématisé", dx: "Infarctus antérieur étendu (STEMI)" },
    explain: ["Sus-décalage du ST de V1 à V5, maximal en V2–V3, avec extension latérale haute (DI, aVL).", "Miroir en DIII et aVF.", "Territoire de l'interventriculaire antérieure : risque de choc et de troubles du rythme."],
    action: "Urgence : stratégie de reperfusion immédiate, double antiagrégation, anticoagulation, scope et défibrillateur à proximité.",
  },
  {
    id: "pericarditis",
    title: "Douleur aggravée en position couchée",
    context: "Étudiant de 24 ans, syndrome grippal il y a 10 jours, douleur thoracique soulagée en se penchant en avant.",
    level: "Intermédiaire",
    spec: {
      rhythm: "sinus",
      rate: 96,
      mods: {
        I: { st: 0.15, pr: -0.05 }, II: { st: 0.18, pr: -0.07 }, III: { st: 0.08 }, aVF: { st: 0.13, pr: -0.05 }, aVL: { st: 0.06 },
        aVR: { st: -0.14, pr: 0.07 }, V2: { st: 0.16 }, V3: { st: 0.18, pr: -0.05 }, V4: { st: 0.18, pr: -0.05 }, V5: { st: 0.16, pr: -0.05 }, V6: { st: 0.14, pr: -0.04 },
      },
      seed: 23,
    },
    answer: { rhythm: "Sinusal", rate: 96, pr: "Normal (120–200 ms)", qrs: "Fins (< 120 ms)", repol: "Sus-décalage ST diffus", dx: "Péricardite aiguë" },
    explain: ["Sus-décalage du ST concave, diffus, sans territoire systématisé et sans miroir (sauf aVR).", "Sous-décalage du segment PQ (PR), et sus-décalage de PQ en aVR : très évocateur.", "Le contexte (virose, douleur posturale) va dans le même sens."],
    action: "Échocardiographie (épanchement ?), anti-inflammatoires + colchicine, éliminer un infarctus si doute.",
  },
  {
    id: "af",
    title: "Palpitations depuis ce matin",
    context: "Femme de 70 ans, hypertendue, palpitations et dyspnée d'effort.",
    level: "Fondamental",
    spec: { rhythm: "af", rate: 128, seed: 31 },
    answer: { rhythm: "Fibrillation atriale", rate: 128, pr: "Non mesurable", qrs: "Fins (< 120 ms)", repol: "Normale", dx: "Fibrillation atriale rapide" },
    explain: ["Intervalles RR totalement irréguliers (« irrégulièrement irréguliers »).", "Pas d'onde P individualisable : trémulation de la ligne de base.", "Fréquence ventriculaire moyenne ≈ 130/min : compter les QRS sur 10 s × 6."],
    action: "Contrôle de la fréquence, évaluation du risque embolique (CHA₂DS₂-VASc) et de l'anticoagulation.",
  },
  {
    id: "flutter",
    title: "Tachycardie régulière à 150",
    context: "Homme de 66 ans, BPCO, palpitations régulières depuis 2 jours.",
    level: "Avancé",
    spec: { rhythm: "flutter", rate: 150, atrialRate: 300, mods: { II: { f: -0.22 }, III: { f: -0.2 }, aVF: { f: -0.22 }, V1: { f: 0.12 } }, seed: 37 },
    answer: { rhythm: "Flutter atrial", rate: 150, pr: "Non mesurable", qrs: "Fins (< 120 ms)", repol: "Normale", dx: "Flutter atrial 2:1" },
    explain: ["Tachycardie régulière à 150/min : penser au flutter 2:1 jusqu'à preuve du contraire.", "Ondes F en « dents de scie » à 300/min, négatives en DII, DIII, aVF (flutter commun).", "Une onde F sur deux est cachée dans le QRS ou l'onde T."],
    action: "Ralentir la fréquence, anticoaguler selon le risque, discuter réduction (cardioversion, ablation).",
  },
  {
    id: "chb",
    title: "Syncope chez une patiente âgée",
    context: "Femme de 79 ans, deux syncopes brutales sans prodromes, fatigue.",
    level: "Avancé",
    spec: { rhythm: "chb", rate: 38, atrialRate: 84, qrs: 0.14, scale: { V1: { r: 0.6, s: 1.3 }, V6: { r: 1.2 } }, seed: 41 },
    answer: { rhythm: "Dissociation atrio-ventriculaire", rate: 38, pr: "Non mesurable", qrs: "Larges (≥ 120 ms)", repol: "Normale", dx: "Bloc atrio-ventriculaire complet" },
    explain: ["Ondes P régulières à ≈ 85/min et QRS réguliers à ≈ 38/min, sans relation entre eux : dissociation AV.", "PR variable d'un battement à l'autre : aucune P n'est conduite.", "QRS larges : échappement ventriculaire, plus instable."],
    action: "Urgence : scope, isoprénaline ou entraînement électrosystolique, puis pacemaker.",
  },
  {
    id: "vt",
    title: "Palpitations et malaise après infarctus",
    context: "Homme de 63 ans aux antécédents d'infarctus, palpitations, PA 95/60.",
    level: "Avancé",
    spec: {
      rhythm: "vt",
      rate: 180,
      qrs: 0.16,
      mods: { I: { r: -0.7, s: -0.2, t: 0.4, p: 0 }, II: { r: 1.4, t: -0.5, p: 0 }, III: { r: 1.2, t: -0.45, p: 0 }, aVF: { r: 1.3, t: -0.5, p: 0 }, aVR: { r: -0.4, s: -0.2, t: 0.2, p: 0 }, aVL: { r: -0.9, t: 0.35, p: 0 }, V1: { r: 1.1, s: -0.1, t: -0.4, p: 0 }, V2: { r: 1.4, s: -0.2, t: -0.5, p: 0 }, V3: { r: 1.3, t: -0.45, p: 0 }, V4: { r: 1.2, t: -0.4, p: 0 }, V5: { r: 1.0, t: -0.35, p: 0 }, V6: { r: 0.8, t: -0.3, p: 0 } },
      seed: 43,
    },
    answer: { rhythm: "Tachycardie ventriculaire", rate: 180, pr: "Non mesurable", qrs: "Larges (≥ 120 ms)", repol: "Normale", dx: "Tachycardie ventriculaire" },
    explain: ["Tachycardie régulière à QRS larges (≈ 160 ms) à 180/min.", "Concordance positive des précordiales et axe aberrant : origine ventriculaire.", "Chez un coronarien, toute tachycardie à QRS larges est une TV jusqu'à preuve du contraire."],
    action: "Urgence vitale : si instable, choc électrique externe ; sinon amiodarone IV et avis cardiologique.",
  },
  {
    id: "hyperk",
    title: "Insuffisant rénal fatigué",
    context: "Homme de 55 ans en hémodialyse, séance manquée, faiblesse musculaire.",
    level: "Intermédiaire",
    spec: { rhythm: "sinus", rate: 64, qrs: 0.11, tSharp: true, scale: { I: { t: 2.2, p: 0.4 }, II: { t: 2.6, p: 0.4 }, III: { t: 2, p: 0.4 }, aVF: { t: 2.5, p: 0.4 }, aVL: { t: 1.8, p: 0.4 }, aVR: { t: 2.2, p: 0.4 }, V1: { t: 3, p: 0.4 }, V2: { t: 2.6, p: 0.4 }, V3: { t: 2.6, p: 0.4 }, V4: { t: 2.6, p: 0.4 }, V5: { t: 2.4, p: 0.4 }, V6: { t: 2.2, p: 0.4 } }, seed: 47 },
    answer: { rhythm: "Sinusal", rate: 64, pr: "Normal (120–200 ms)", qrs: "Fins (< 120 ms)", repol: "Ondes T amples et pointues", dx: "Hyperkaliémie" },
    explain: ["Ondes T amples, pointues et symétriques (« en tente »), surtout en précordiales.", "Ondes P aplaties, QRS à la limite de l'élargissement : hyperkaliémie déjà significative.", "Le contexte (dialyse manquée) est typique."],
    action: "Urgence : gluconate de calcium IV, insuline-glucose, kaliémie en urgence, dialyse.",
  },
  {
    id: "bav1",
    title: "Découverte en consultation",
    context: "Homme de 74 ans sous bêtabloquant, asymptomatique.",
    level: "Fondamental",
    spec: { rhythm: "sinus", rate: 62, pr: 0.29, seed: 53 },
    answer: { rhythm: "Sinusal", rate: 62, pr: "Allongé (> 200 ms)", qrs: "Fins (< 120 ms)", repol: "Normale", dx: "BAV du 1er degré" },
    explain: ["Chaque onde P est suivie d'un QRS : conduction 1:1.", "PR constant mais long (≈ 280 ms, plus d'un grand carreau).", "Souvent bénin, favorisé par les bêtabloquants ou les inhibiteurs calciques."],
    action: "Surveillance ; revoir les traitements bradycardisants si le PR s'allonge ou en cas de symptômes.",
  },
];
