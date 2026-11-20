/** Guided workshops E–H: chest radiograph reading, abdominal exam, hand hygiene, SBAR. Fictional, synthetic data. */
import { b, DRAFT_REVIEW, LOCAL_PROTOCOL } from "@/lib/cases/drafts/build";
import type { ChoiceStep, GuidedWorkshop } from "./types";

// ───────────────────────── E. Radiographie thoracique ─────────────────────────
export const cxr: GuidedWorkshop = {
  slug: "chest-xray",
  icon: "cxr",
  title: b("Radiographie thoracique : lecture systématique", "Chest X-ray: a systematic reading"),
  sub: b("Qualité de l'image, revue anatomique dans un ordre constant, puis description concise avec sa part d'incertitude — sur un schéma, pas sur une vraie radiographie.", "Image quality, an anatomical review in a consistent order, then a concise description including uncertainty — on a schematic, not a real radiograph."),
  minutes: 12,
  level: b("Externat", "Clinical years"),
  difficulty: "MEDIUM",
  tags: [b("Imagerie", "Imaging"), b("Lecture systématique", "Systematic reading"), b("Incertitude", "Uncertainty")],
  prerequisites: [b("Anatomie radiologique du thorax", "Radiological anatomy of the chest")],
  objectives: [
    b("Vérifier l'identité et la qualité technique avant de lire", "Check identity and technical quality before reading"),
    b("Parcourir l'image dans un ordre constant, y compris les zones « cachées »", "Survey the image in a consistent order, including 'hidden' areas"),
    b("Décrire les constatations de façon concise, en exprimant l'incertitude", "Describe findings concisely, expressing uncertainty"),
  ],
  intro: b("Femme de 62 ans, toux fébrile depuis 4 jours. Vous lisez sa radiographie thoracique. Ici, la radiographie est remplacée par un SCHÉMA pédagogique : aucune image réelle n'est utilisée tant que l'enseignant n'a pas fourni des radiographies sous licence adaptée.", "62-year-old woman, febrile cough for 4 days. You read her chest X-ray. Here the radiograph is replaced by a teaching SCHEMATIC: no real image is used until the educator supplies suitably licensed radiographs."),
  steps: [
    {
      id: "quality",
      kind: "sequence",
      domain: "gathering",
      points: 25,
      title: b("Avant de lire", "Before reading"),
      prompt: b("Remettez dans l'ordre les vérifications préalables.", "Put the preliminary checks in order."),
      scene: { diagram: "cxr" },
      items: [
        { id: "id", label: b("Identité du patient, date et heure de l'examen", "Patient identity, date and time of the image") },
        { id: "proj", label: b("Incidence (face postéro-antérieure ou antéro-postérieure, couché ou debout)", "Projection (PA or AP, supine or erect)") },
        { id: "rot", label: b("Rotation", "Rotation") },
        { id: "insp", label: b("Inspiration", "Inspiration") },
        { id: "exp", label: b("Exposition (pénétration)", "Exposure (penetration)") },
      ],
      explain: b("Il n'existe pas d'ordre universel, mais l'identité vient toujours en premier et la qualité technique avant l'interprétation : une mauvaise incidence ou une rotation peuvent simuler une anomalie.", "There is no universal order, but identity always comes first and technical quality before interpretation: a poor projection or rotation can mimic an abnormality."),
    },
    {
      id: "survey",
      kind: "actions",
      domain: "selection",
      points: 35,
      title: b("Revue anatomique", "Anatomical review"),
      prompt: b("Parcourez chaque zone du schéma. Chacune révèle une constatation fictive.", "Survey each area of the schematic. Each reveals a fictional finding."),
      scene: { diagram: "cxr" },
      actions: [
        { id: "trachea", region: "trachea", label: b("Trachée et médiastin", "Trachea and mediastinum"), finding: b("Trachée médiane, médiastin non élargi.", "Trachea central, mediastinum not widened."), required: true },
        { id: "lungs", region: "lungs", label: b("Champs pulmonaires (comparer les deux côtés, zone par zone)", "Lung fields (compare both sides, zone by zone)"), finding: b("Opacité de la base droite, à limites floues.", "Ill-defined opacity at the right base."), required: true },
        { id: "hila", region: "hila", label: b("Hiles", "Hila"), finding: b("Hiles de taille et position habituelles.", "Hila of usual size and position."), required: true },
        { id: "heart", region: "heart", label: b("Cœur et contours", "Heart and borders"), finding: b("Silhouette cardiaque normale, contours nets.", "Normal cardiac silhouette, clear borders."), required: true },
        { id: "diaph", region: "diaph", label: b("Coupoles et culs-de-sac costo-diaphragmatiques", "Diaphragms and costophrenic angles"), finding: b("Coupole droite partiellement effacée ; cul-de-sac droit émoussé ?", "Right hemidiaphragm partly obscured; right costophrenic angle blunted?"), required: true },
        { id: "bones", region: "bones", label: b("Os et parties molles", "Bones and soft tissues"), finding: b("Pas d'anomalie osseuse visible.", "No visible bone abnormality."), required: true },
        { id: "hidden", region: "hidden", label: b("Zones « cachées » (apex, derrière le cœur, sous les coupoles)", "'Hidden' areas (apices, behind the heart, below the diaphragms)"), finding: b("Rien de plus à signaler sur le schéma.", "Nothing further on the schematic."), required: true },
      ],
      explain: b("Un ordre constant évite les oublis ; les zones « cachées » sont les plus souvent manquées. Comparer les deux côtés aide à repérer une asymétrie.", "A consistent order avoids omissions; 'hidden' areas are the most often missed. Comparing both sides helps spot asymmetry."),
    },
    {
      id: "describe",
      kind: "compose",
      domain: "communication",
      points: 25,
      title: b("Décrire", "Describe"),
      prompt: b("Rédigez une description concise.", "Write a concise description."),
      fields: [
        { id: "where", label: b("Constatation principale et localisation", "Main finding and location"), hint: b("Quoi, où ?", "What, where?"), expect: [["opacite", "droit"], ["opacity", "right"], ["opacite", "base"], ["opacity", "base"]], model: b("Opacité mal limitée de la base droite, effaçant partiellement la coupole droite.", "Ill-defined right basal opacity, partly obscuring the right hemidiaphragm.") },
        { id: "unc", label: b("Incertitude et hypothèses", "Uncertainty and hypotheses"), hint: b("Qu'est-ce qui reste incertain ?", "What remains uncertain?"), expect: [["compatible"], ["evoque"], ["possible"], ["consistent"], ["suggest"], ["possible"]], model: b("Aspect compatible avec une pneumopathie de la base droite ; petit épanchement possible ; à confronter à la clinique.", "Appearance consistent with right basal pneumonia; possible small effusion; correlate clinically.") },
      ],
    },
    {
      id: "limits",
      kind: "choice",
      domain: "safety",
      points: 15,
      title: b("Limites de la lecture", "Limits of the reading"),
      prompt: b("Laquelle de ces conclusions est la plus juste ?", "Which conclusion is most accurate?"),
      options: [
        { id: "prudent", label: b("« Aspect compatible avec… », confronté à la clinique, avec relecture si doute", "'Appearance consistent with…', correlated clinically, with a second read if in doubt"), correct: true, feedback: b("Une radiographie décrit des images ; l'interprétation dépend du contexte et reste parfois incertaine.", "A radiograph shows images; interpretation depends on context and is sometimes uncertain.") },
        { id: "certain", label: b("« Pneumonie certaine »", "'Definite pneumonia'"), correct: false, feedback: b("Une image seule ne permet pas une telle certitude.", "An image alone does not allow such certainty.") },
        { id: "ai", label: b("S'en remettre à une image générée par IA pour comparer", "Rely on an AI-generated image for comparison"), correct: false, feedback: b("Une image générée n'est jamais une radiographie diagnostique réelle.", "A generated image is never a real diagnostic radiograph.") },
      ],
    },
  ],
  debrief: {
    keyPoints: [
      b("Identité et qualité technique d'abord, puis revue anatomique dans un ordre constant.", "Identity and technical quality first, then an anatomical review in a consistent order."),
      b("Les zones « cachées » sont les plus souvent manquées.", "'Hidden' areas are the most often missed."),
      b("Décrire avant d'interpréter, et dire ce qui reste incertain.", "Describe before interpreting, and say what remains uncertain."),
    ],
    reflection: [
      b("Avez-vous regardé les zones cachées sans y être invité ?", "Did you look at the hidden areas without being prompted?"),
      b("Votre description aurait-elle été comprise par un collègue sans voir l'image ?", "Would a colleague understand your description without seeing the image?"),
    ],
  },
  refs: [{ id: "radiopaedia-cxr", section: b("Approche systématique (principes généraux paraphrasés).", "Systematic approach (general principles paraphrased).") }],
  review: DRAFT_REVIEW(
    [
      b("Radiographies réelles sous licence adaptée (droit d'usage commercial) à fournir par l'enseignant ; aucune image n'est intégrée.", "Real radiographs under a suitable licence (commercial use) to be supplied by the educator; no image is embedded."),
      b("Critères chiffrés de qualité (rotation, inspiration) — non enseignés, selon la méthode de la faculté.", "Numeric quality criteria (rotation, inspiration) — not taught; per faculty method."),
      b("Choix d'une source d'enseignement de référence (licence Radiopaedia non compatible avec un usage payant).", "Choice of a reference teaching source (Radiopaedia licence not compatible with paid use)."),
    ],
  ),
};

// ───────────────────────── F. Examen abdominal ─────────────────────────
export const abdoExam: GuidedWorkshop = {
  slug: "abdominal-exam",
  icon: "abdo",
  title: b("Examen abdominal", "Abdominal examination"),
  sub: b("Consentement, confort, séquence d'examen et palpation des neuf régions sur un schéma interactif.", "Consent, comfort, examination sequence and palpation of the nine regions on an interactive diagram."),
  minutes: 10,
  level: b("Externat (débutant)", "Early clinical years"),
  difficulty: "EASY",
  tags: [b("Examen clinique", "Clinical examination"), b("Consentement", "Consent"), b("Abdomen", "Abdomen")],
  prerequisites: [b("Anatomie de surface de l'abdomen", "Abdominal surface anatomy")],
  objectives: [
    b("Préparer l'examen : présentation, consentement, chaperon, installation, pudeur", "Prepare the exam: introduction, consent, chaperone, positioning, dignity"),
    b("Palper les neuf régions en commençant à distance de la douleur", "Palpate the nine regions starting away from the pain"),
    b("Surveiller le confort du patient pendant l'examen", "Watch the patient's comfort during the exam"),
  ],
  intro: b("M. Belkacem, 22 ans, douleur de la fosse iliaque droite (voir le cas « Douleur abdominale qui migre »). Vous allez l'examiner.", "Mr Belkacem, 22, right iliac fossa pain (see the 'Abdominal pain that moves' case). You are going to examine him."),
  handsOn: true,
  steps: [
    {
      id: "prep",
      kind: "sequence",
      domain: "communication",
      points: 25,
      title: b("Préparation", "Preparation"),
      prompt: b("Remettez dans l'ordre la préparation de l'examen.", "Put the exam preparation in order."),
      items: [
        { id: "intro", label: b("Se présenter et vérifier l'identité du patient", "Introduce yourself and confirm the patient's identity") },
        { id: "consent", label: b("Expliquer l'examen et obtenir le consentement", "Explain the exam and obtain consent") },
        { id: "chap", label: b("Proposer un chaperon selon l'usage de l'établissement", "Offer a chaperone per local practice") },
        { id: "hands", label: b("Hygiène des mains", "Hand hygiene") },
        { id: "pos", label: b("Installer à plat, exposer l'abdomen en respectant la pudeur", "Lie the patient flat and expose the abdomen while preserving dignity") },
        { id: "pain", label: b("Demander où se situe la douleur", "Ask where the pain is") },
      ],
      explain: b("Le consentement et le confort font partie de l'examen. L'ordre précis (par exemple le moment du chaperon) suit l'usage local, validé par l'enseignant.", "Consent and comfort are part of the exam. The precise order (e.g. when to offer a chaperone) follows local practice approved by the educator."),
    },
    {
      id: "first",
      kind: "choice",
      domain: "safety",
      points: 15,
      title: b("Par où commencer ?", "Where to start?"),
      prompt: b("La douleur est en fosse iliaque droite. Par où commence la palpation ?", "The pain is in the right iliac fossa. Where does palpation start?"),
      options: [
        { id: "far", label: b("Loin de la zone douloureuse (par exemple la fosse iliaque gauche)", "Away from the painful area (e.g. the left iliac fossa)"), correct: true, feedback: b("Commencer à distance évite une défense réflexe et respecte le confort.", "Starting away avoids reflex guarding and respects comfort.") },
        { id: "pain", label: b("Directement sur la zone douloureuse", "Directly over the painful area"), correct: false, feedback: b("La douleur provoquée d'emblée gêne la suite de l'examen.", "Causing pain at the outset hinders the rest of the exam.") },
      ],
    },
    {
      id: "palpate",
      kind: "actions",
      domain: "gathering",
      points: 40,
      title: b("Palpation des neuf régions", "Palpating the nine regions"),
      prompt: b("Palpez chaque région sur le schéma, en terminant par la zone douloureuse.", "Palpate each region on the diagram, ending with the painful area."),
      urgentBy: 99,
      actions: [
        { id: "lif", region: "lif", label: b("Fosse iliaque gauche", "Left iliac fossa"), finding: b("Souple, indolore. (Douleur ressentie à droite : signe de Rovsing ?)", "Soft, non-tender. (Pain felt on the right: Rovsing's sign?)"), required: true },
        { id: "hyp", region: "hyp", label: b("Hypogastre", "Suprapubic region"), finding: b("Souple, sensibilité légère.", "Soft, mild tenderness."), required: true },
        { id: "lfl", region: "lfl", label: b("Flanc gauche", "Left flank"), finding: b("Souple, indolore.", "Soft, non-tender."), required: true },
        { id: "lhc", region: "lhc", label: b("Hypocondre gauche", "Left upper quadrant"), finding: b("Souple, pas de rate palpable.", "Soft, no palpable spleen."), required: true },
        { id: "epi", region: "epi", label: b("Épigastre", "Epigastrium"), finding: b("Souple, indolore.", "Soft, non-tender."), required: true },
        { id: "rhc", region: "rhc", label: b("Hypocondre droit", "Right upper quadrant"), finding: b("Souple, foie non palpable, Murphy négatif.", "Soft, liver not palpable, Murphy's negative."), required: true },
        { id: "umb", region: "umb", label: b("Région ombilicale", "Umbilical region"), finding: b("Souple, sensibilité légère.", "Soft, mild tenderness."), required: true },
        { id: "rfl", region: "rfl", label: b("Flanc droit", "Right flank"), finding: b("Sensibilité modérée.", "Moderate tenderness."), required: true },
        { id: "rif", region: "rif", label: b("Fosse iliaque droite", "Right iliac fossa"), finding: b("Douleur nette, défense localisée. Le patient grimace : vous regardez son visage pendant la palpation.", "Clear tenderness, localised guarding. The patient winces: you watch his face while palpating."), required: true },
      ],
      ordered: false,
      explain: b("Palper les neuf régions, superficiellement puis plus profondément, en finissant par la zone douloureuse et en regardant le visage du patient. Ces constatations sont fictives.", "Palpate all nine regions, lightly then more deeply, ending with the painful area and watching the patient's face. These findings are fictional."),
    },
    {
      id: "close",
      kind: "choice",
      domain: "communication",
      points: 20,
      multi: true,
      title: b("Fin de l'examen", "Ending the exam"),
      prompt: b("Que faites-vous à la fin ?", "What do you do at the end?"),
      options: [
        { id: "cover", label: b("Recouvrir le patient et le remercier", "Cover the patient and thank him"), correct: true, feedback: b("Respect et confort.", "Respect and comfort.") },
        { id: "hh", label: b("Hygiène des mains", "Hand hygiene"), correct: true, feedback: b("Après le contact avec le patient.", "After patient contact.") },
        { id: "explain", label: b("Expliquer ce que vous avez trouvé et la suite", "Explain what you found and next steps"), correct: true, feedback: b("Communication et décision partagée.", "Communication and shared decision-making.") },
        { id: "leave", label: b("Partir sans rien dire pour rédiger le dossier", "Leave without a word to write the notes"), correct: false, feedback: b("Le patient doit savoir ce qui se passe.", "The patient needs to know what is happening.") },
      ],
    },
  ],
  debrief: {
    keyPoints: [
      b("Consentement, chaperon proposé, pudeur et confort sont des éléments évalués de l'examen.", "Consent, offering a chaperone, dignity and comfort are assessed parts of the exam."),
      b("Commencer loin de la douleur, finir par elle, en regardant le visage.", "Start away from the pain, end with it, watching the face."),
      b("Cet exercice sur écran ne remplace pas l'apprentissage supervisé au lit du patient.", "This screen exercise does not replace supervised bedside learning."),
    ],
    reflection: [
      b("Comment formuleriez-vous la demande de consentement en arabe dialectal ou en français avec un patient gêné ?", "How would you phrase the consent request in Algerian Arabic or French with an embarrassed patient?"),
      b("Qu'avez-vous observé sur le visage du patient pendant la palpation ?", "What did you notice on the patient's face during palpation?"),
    ],
  },
  refs: [{ id: "educator-checklist", section: b("Grille d'examen abdominal (brouillon, à remplacer par la grille validée).", "Abdominal examination checklist (draft, to replace with the approved checklist).") }],
  review: DRAFT_REVIEW(
    [
      b("Séquence d'examen enseignée localement (place de l'auscultation avant ou après la palpation).", "Locally taught examination sequence (auscultation before or after palpation)."),
      b("Usage du chaperon et formulation du consentement selon la faculté et le contexte culturel.", "Chaperone practice and consent wording per faculty and cultural context."),
    ],
    LOCAL_PROTOCOL(b("la grille d'examen abdominal et l'usage du chaperon", "the abdominal examination checklist and chaperone practice")),
  ),
};

// ───────────────────────── G. Hygiène des mains ─────────────────────────
const HH_OPTIONS = (correct: "rub" | "wash" | "none", why: { rub: [string, string]; wash: [string, string]; none: [string, string] }): ChoiceStep["options"] => [
  { id: "rub", label: b("Friction hydro-alcoolique", "Alcohol-based hand rub"), correct: correct === "rub", feedback: b(...why.rub) },
  { id: "wash", label: b("Lavage à l'eau et au savon", "Washing with soap and water"), correct: correct === "wash", feedback: b(...why.wash) },
  { id: "none", label: b("Pas d'hygiène des mains nécessaire", "No hand hygiene needed"), correct: correct === "none", feedback: b(...why.none) },
];

const moment = (id: string, title: [string, string], scene: [string, string], correct: "rub" | "wash" | "none", why: Parameters<typeof HH_OPTIONS>[1]): ChoiceStep => ({
  id,
  kind: "choice",
  domain: "safety",
  points: 15,
  title: b(...title),
  prompt: b("Faut-il une hygiène des mains maintenant ? Laquelle ?", "Is hand hygiene needed now? Which kind?"),
  scene: { text: b(...scene) },
  options: HH_OPTIONS(correct, why),
});

export const handHygiene: GuidedWorkshop = {
  slug: "hand-hygiene",
  icon: "hands",
  title: b("Hygiène des mains et gestes aseptiques", "Hand hygiene and aseptic technique"),
  sub: b("Une séquence de soins : repérez les moments où l'hygiène des mains est nécessaire et choisissez la bonne action (« cinq moments » de l'OMS pour les soins).", "A sequence of care: spot when hand hygiene is needed and choose the right action (WHO 'five moments' for health care)."),
  minutes: 8,
  level: b("Tous niveaux", "All levels"),
  difficulty: "EASY",
  tags: [b("Prévention des infections", "Infection prevention"), b("Sécurité des patients", "Patient safety")],
  prerequisites: [b("Aucun", "None")],
  objectives: [
    b("Identifier les moments de soins qui exigent une hygiène des mains", "Identify the moments in care that require hand hygiene"),
    b("Choisir entre friction hydro-alcoolique et lavage", "Choose between alcohol rub and washing"),
    b("Ordonner un geste aseptique simple", "Order a simple aseptic procedure"),
  ],
  intro: b("Vous êtes en stage. Il s'agit des recommandations OMS pour les SOINS DE SANTÉ (cinq moments), différentes des conseils de lavage des mains destinés au grand public. Vous allez voir Mme Hadj, 70 ans, qui a une perfusion.", "You are on placement. These are WHO recommendations for HEALTH CARE (five moments), different from handwashing advice for the general public. You are going to see Mrs Hadj, 70, who has a drip."),
  steps: [
    moment("m1", ["Avant de toucher la patiente", "Before touching the patient"], ["Vous entrez dans la chambre pour prendre son pouls.", "You enter the room to take her pulse."], "rub", {
      rub: ["Avant le contact avec le patient (moment 1) : la friction est la méthode de référence si les mains ne sont pas visiblement sales.", "Before patient contact (moment 1): rubbing is the standard method if hands are not visibly soiled."],
      wash: ["Possible mais pas nécessaire si les mains ne sont pas sales ; la friction est plus rapide.", "Possible but not required if hands are not soiled; rubbing is quicker."],
      none: ["Les mains transmettent des germes à la patiente.", "Hands carry germs to the patient."],
    }),
    moment("m2", ["Avant un geste aseptique", "Before an aseptic procedure"], ["Vous allez rincer le cathéter veineux.", "You are about to flush the IV cannula."], "rub", {
      rub: ["Avant un geste propre ou aseptique (moment 2), même si vous mettez des gants ensuite.", "Before a clean or aseptic procedure (moment 2), even if you then put on gloves."],
      wash: ["Pas nécessaire si les mains ne sont pas sales.", "Not required if hands are not soiled."],
      none: ["Les gants ne remplacent pas l'hygiène des mains.", "Gloves do not replace hand hygiene."],
    }),
    moment("m3", ["Après un risque d'exposition", "After a risk of exposure"], ["Vous retirez vos gants après avoir été au contact de sang.", "You remove your gloves after contact with blood."], "rub", {
      rub: ["Après un risque d'exposition à un liquide biologique (moment 3), juste après avoir retiré les gants. Si les mains sont visiblement souillées, lavage.", "After a risk of body-fluid exposure (moment 3), right after removing gloves. If hands are visibly soiled, wash."],
      wash: ["Indiqué si les mains sont visiblement souillées ; sinon la friction suffit.", "Indicated if hands are visibly soiled; otherwise rubbing is enough."],
      none: ["Les gants peuvent être perméables ou se contaminer au retrait.", "Gloves can leak or be contaminated on removal."],
    }),
    moment("soiled", ["Mains visiblement souillées", "Visibly soiled hands"], ["Vos mains sont visiblement tachées après avoir aidé la patiente.", "Your hands are visibly stained after helping the patient."], "wash", {
      rub: ["La friction n'élimine pas une souillure visible.", "Rubbing does not remove visible soiling."],
      wash: ["Mains visiblement sales : lavage à l'eau et au savon.", "Visibly soiled hands: wash with soap and water."],
      none: ["Les mains souillées doivent être lavées.", "Soiled hands must be washed."],
    }),
    moment("m5", ["Après l'environnement", "After the surroundings"], ["Vous avez réglé la pompe et touché la barrière du lit, sans toucher la patiente. Vous sortez.", "You adjusted the pump and touched the bed rail, without touching the patient. You leave."], "rub", {
      rub: ["Après contact avec l'environnement du patient (moment 5), même sans contact avec le patient.", "After touching the patient's surroundings (moment 5), even without touching the patient."],
      wash: ["Pas nécessaire si les mains ne sont pas sales.", "Not required if hands are not soiled."],
      none: ["L'environnement proche du patient est contaminé par ses germes.", "The patient's surroundings carry their germs."],
    }),
    {
      id: "aseptic",
      kind: "sequence",
      domain: "selection",
      points: 25,
      title: b("Geste aseptique", "Aseptic procedure"),
      prompt: b("Remettez dans l'ordre un geste aseptique simple (prélèvement sur cathéter).", "Put a simple aseptic procedure in order (sampling from a cannula)."),
      items: [
        { id: "hh1", label: b("Hygiène des mains", "Hand hygiene") },
        { id: "prep", label: b("Préparer le matériel sans toucher les parties stériles", "Prepare equipment without touching sterile parts") },
        { id: "gloves", label: b("Mettre les gants", "Put on gloves") },
        { id: "anti", label: b("Désinfecter le site et laisser sécher", "Disinfect the site and let it dry") },
        { id: "act", label: b("Réaliser le geste sans retoucher le site", "Perform the procedure without touching the site again") },
        { id: "hh2", label: b("Retirer les gants, puis hygiène des mains", "Remove gloves, then hand hygiene") },
      ],
      explain: b("L'hygiène des mains encadre le geste ; le produit antiseptique et la technique exacte suivent le protocole local.", "Hand hygiene frames the procedure; the antiseptic product and exact technique follow local protocol."),
    },
  ],
  debrief: {
    keyPoints: [
      b("Les cinq moments : avant le contact patient, avant un geste aseptique, après un risque d'exposition, après le contact patient, après l'environnement du patient.", "The five moments: before patient contact, before an aseptic procedure, after body-fluid exposure risk, after patient contact, after touching the patient's surroundings."),
      b("Friction hydro-alcoolique en général ; lavage si les mains sont visiblement souillées.", "Alcohol rub in general; wash if hands are visibly soiled."),
      b("Les gants ne remplacent jamais l'hygiène des mains.", "Gloves never replace hand hygiene."),
    ],
    reflection: [b("Quel moment oubliez-vous le plus souvent en stage ?", "Which moment do you most often forget on placement?"), b("Où sont les distributeurs de solution hydro-alcoolique dans votre service ?", "Where are the alcohol-rub dispensers on your ward?")],
  },
  handsOn: true,
  refs: [{ id: "who-hand-hygiene", section: b("Les cinq moments de l'hygiène des mains (soins de santé) ; choix friction / lavage.", "The five moments for hand hygiene (health care); rub vs wash.") }],
  review: DRAFT_REVIEW(
    [
      b("Le moment 4 (après contact patient) n'a pas de question dédiée : à ajouter si l'enseignant le souhaite.", "Moment 4 (after patient contact) has no dedicated question: add one if the educator wishes."),
      b("Poster « My 5 Moments » © OMS : non reproduit ; autorisation requise pour l'intégrer.", "'My 5 Moments' poster © WHO: not reproduced; permission required to include it."),
      b("Produits antiseptiques et technique de prélèvement selon le protocole local.", "Antiseptic products and sampling technique per local protocol."),
    ],
    LOCAL_PROTOCOL(b("le protocole d'hygiène et d'asepsie du CHU", "the hospital's hygiene and asepsis protocol")),
  ),
};

// ───────────────────────── H. SBAR ─────────────────────────
export const sbar: GuidedWorkshop = {
  slug: "sbar-handover",
  icon: "sbar",
  title: b("Transmission SBAR", "SBAR handover"),
  sub: b("À partir du cas « Fièvre et confusion », préparez une transmission structurée au senior : Situation, Contexte, Évaluation, Recommandation, puis vérification.", "From the 'Fever and confusion' case, prepare a structured handover to the senior: Situation, Background, Assessment, Recommendation, then read-back."),
  minutes: 10,
  level: b("Externat", "Clinical years"),
  difficulty: "EASY",
  tags: [b("Communication", "Communication"), b("Sécurité des patients", "Patient safety"), b("Transmission", "Handover")],
  prerequisites: [b("Approche ABCDE", "ABCDE approach")],
  objectives: [
    b("Structurer une transmission urgente selon SBAR", "Structure an urgent handover using SBAR"),
    b("Formuler une demande claire et vérifiée", "Make a clear, confirmed request"),
    b("Utiliser la répétition (read-back) pour confirmer le plan", "Use read-back to confirm the plan"),
  ],
  intro: b("Vous avez évalué M. Bensaïd, 68 ans : fièvre depuis 2 jours, confusion depuis ce matin, brûlures mictionnelles. FC 118, PA 94/56 en baisse, FR 26, SpO₂ 94 %, T 38,9 °C, Glasgow 14, lactates 3,6 mmol/L (données synthétiques). Vous appelez le senior.", "You have assessed Mr Bensaïd, 68: fever for 2 days, confusion since this morning, burning on urination. HR 118, BP 94/56 and falling, RR 26, SpO₂ 94%, T 38.9 °C, GCS 14, lactate 3.6 mmol/L (synthetic data). You call the senior."),
  steps: [
    {
      id: "compose",
      kind: "compose",
      domain: "communication",
      points: 60,
      title: b("Préparer la transmission", "Prepare the handover"),
      prompt: b("Rédigez chaque partie en une ou deux phrases.", "Write each part in one or two sentences."),
      scene: { vitals: { hr: 118, sbp: 94, dbp: 56, rr: 26, spo2: 94, temp: 38.9, extra: b("Glasgow 14, lactates 3,6 mmol/L", "GCS 14, lactate 3.6 mmol/L") }, alert: "worse" },
      fields: [
        { id: "s", label: b("S — Situation", "S — Situation"), hint: b("Qui êtes-vous, qui est le patient, quel est le problème maintenant ?", "Who are you, who is the patient, what is the problem now?"), expect: [["confus"], ["sepsis"], ["hypotension"], ["tension"], ["pression"], ["confusion"], ["blood pressure"]], model: b("Je suis l'externe des urgences. J'appelle pour M. Bensaïd, 68 ans : sepsis suspecté avec confusion et pression qui baisse.", "I'm the student in the ED. I'm calling about Mr Bensaïd, 68: suspected sepsis with confusion and falling blood pressure.") },
        { id: "b", label: b("B — Contexte (Background)", "B — Background"), hint: b("Antécédents, histoire, traitements, allergies.", "History, course, medicines, allergies."), expect: [["diabet"], ["urin"], ["allerg"]], model: b("Diabétique, hypertendu, vit seul. Fièvre depuis 2 jours, brûlures urinaires, confusion depuis ce matin. Allergie à un antibiotique non identifié.", "Diabetic, hypertensive, lives alone. Fever for 2 days, burning on urination, confusion since this morning. Allergy to an unidentified antibiotic.") },
        { id: "a", label: b("A — Évaluation (Assessment)", "A — Assessment"), hint: b("Constantes, tendance, ce que vous pensez.", "Vital signs, trend, what you think."), expect: [["118"], ["94"], ["lactate"], ["baisse"], ["falling"]], model: b("FC 118, PA 94/56 en baisse, FR 26, SpO₂ 94 %, Glasgow 14, lactates 3,6. Je pense à un sepsis d'origine urinaire, mais ce n'est pas certain ; il se dégrade.", "HR 118, BP 94/56 and falling, RR 26, SpO₂ 94%, GCS 14, lactate 3.6. I think urinary sepsis, though it isn't certain; he's deteriorating.") },
        { id: "r", label: b("R — Recommandation / demande", "R — Recommendation / request"), hint: b("Que demandez-vous, et dans quel délai ?", "What are you asking for, and how soon?"), expect: [["maintenant"], ["immediat"], ["venir"], ["now"], ["come"], ["immediately"]], model: b("Pouvez-vous venir le voir maintenant ? En attendant, je le réévalue toutes les 15 minutes et je prépare le bilan selon le protocole sepsis.", "Can you come and see him now? Meanwhile, I'll reassess him every 15 minutes and prepare tests per the sepsis pathway.") },
      ],
    },
    {
      id: "readback",
      kind: "choice",
      domain: "safety",
      points: 25,
      title: b("Confirmer", "Confirm"),
      prompt: b("Le senior répond : « J'arrive dans 5 minutes, débutez le protocole sepsis. » Que faites-vous ?", "The senior replies: 'I'll be there in 5 minutes; start the sepsis pathway.' What do you do?"),
      options: [
        { id: "rb", label: b("Répéter le plan (« Vous arrivez dans 5 minutes, je débute le protocole sepsis ») et demander confirmation", "Read back the plan ('You'll be here in 5 minutes, I'm starting the sepsis pathway') and ask for confirmation"), correct: true, feedback: b("La répétition confirme la compréhension et réduit les erreurs.", "Read-back confirms understanding and reduces errors.") },
        { id: "ok", label: b("Dire « d'accord » et raccrocher", "Say 'OK' and hang up"), correct: false, feedback: b("Sans répétition, un malentendu peut passer inaperçu.", "Without read-back, a misunderstanding can go unnoticed.") },
        { id: "wait", label: b("Attendre le senior sans rien faire", "Wait for the senior without doing anything"), correct: false, feedback: b("Le plan convenu commence maintenant, avec réévaluation.", "The agreed plan starts now, with reassessment.") },
      ],
    },
    {
      id: "order",
      kind: "sequence",
      domain: "reasoning",
      points: 15,
      title: b("Ordre SBAR", "SBAR order"),
      prompt: b("Remettez les éléments de la transmission dans l'ordre.", "Put the handover elements in order."),
      items: [
        { id: "s", label: b("Situation", "Situation") },
        { id: "b", label: b("Contexte", "Background") },
        { id: "a", label: b("Évaluation", "Assessment") },
        { id: "r", label: b("Recommandation", "Recommendation") },
        { id: "rb", label: b("Répétition / confirmation", "Read-back / confirmation") },
      ],
      explain: b("La structure fixe permet au destinataire de savoir où trouver chaque information.", "The fixed structure lets the receiver know where to find each piece of information."),
    },
  ],
  debrief: {
    keyPoints: [
      b("Situation d'abord : le destinataire doit comprendre l'urgence dès la première phrase.", "Situation first: the receiver must grasp the urgency from the first sentence."),
      b("L'évaluation donne les chiffres ET la tendance, et dit ce qui est incertain.", "The assessment gives the numbers AND the trend, and says what is uncertain."),
      b("Une demande claire avec un délai, puis la répétition du plan.", "A clear request with a timeframe, then read-back of the plan."),
    ],
    reflection: [b("Votre « S » tenait-il en une phrase ?", "Did your 'S' fit in one sentence?"), b("Qu'auriez-vous dit si le senior ne pouvait pas venir ?", "What would you have said if the senior couldn't come?")],
  },
  refs: [
    { id: "who-sbar", section: b("Structure SBAR et contenu attendu d'une transmission.", "SBAR structure and expected handover content.") },
    { id: "who-bec", section: b("Module transfert / transmission.", "Transfer / handover module.") },
  ],
  review: DRAFT_REVIEW(
    [b("Contenu exact de l'outil SBAR de l'OMS (PDF non relu) et variante ISBAR éventuellement utilisée localement.", "Exact content of the WHO SBAR tool (PDF not read) and any ISBAR variant used locally."), b("Mots-clés de correction automatique : à ajuster par l'enseignant.", "Auto-marking keywords: to be adjusted by the educator.")],
    LOCAL_PROTOCOL(b("le format de transmission de l'établissement", "the institution's handover format")),
  ),
};

export const GUIDED_B = [cxr, abdoExam, handHygiene, sbar];
