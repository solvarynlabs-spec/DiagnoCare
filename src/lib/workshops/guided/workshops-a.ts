/** Guided workshops A–D: ABCDE, basic life support + AED, focused neuro exam, blood gases. Fictional, synthetic data. */
import { b, DRAFT_REVIEW, LOCAL_PROTOCOL } from "@/lib/cases/drafts/build";
import type { ChoiceStep, GuidedWorkshop } from "./types";

// ───────────────────────── A. ABCDE ─────────────────────────
export const abcde: GuidedWorkshop = {
  slug: "abcde",
  icon: "abcde",
  title: b("Évaluation initiale ABCDE", "ABCDE initial assessment"),
  sub: b("Un patient qui se dégrade : évaluez dans l'ordre, traitez ce que vous trouvez, réévaluez et appelez à l'aide.", "A deteriorating patient: assess in order, treat what you find, reassess and call for help."),
  minutes: 12,
  level: b("Externat", "Clinical years"),
  difficulty: "EASY",
  tags: [b("ABCDE", "ABCDE"), b("Détérioration", "Deterioration"), b("Escalade", "Escalation")],
  prerequisites: [b("Constantes normales de l'adulte", "Normal adult vital signs")],
  objectives: [
    b("Réaliser l'évaluation dans l'ordre A, B, C, D, E", "Carry out the assessment in the order A, B, C, D, E"),
    b("Reconnaître une anomalie qui menace la vie et agir avant de passer à la lettre suivante", "Recognise a life-threatening problem and act on it before moving to the next letter"),
    b("Réévaluer après chaque intervention et escalader sans délai", "Reassess after each intervention and escalate without delay"),
  ],
  intro: b("Service de médecine, 3 h du matin. L'infirmier vous appelle : M. Larbi, 54 ans, hospitalisé pour une pneumopathie, « respire mal depuis une heure ». Vous arrivez au lit.", "Medical ward, 3 am. The nurse calls you: Mr Larbi, 54, admitted with pneumonia, has been 'breathing badly for an hour'. You arrive at the bedside."),
  steps: [
    {
      id: "approach",
      kind: "choice",
      domain: "safety",
      points: 10,
      title: b("Arrivée au lit", "Arriving at the bedside"),
      prompt: b("Que faites-vous en premier ?", "What do you do first?"),
      scene: { text: b("Le patient est assis, il respire vite. L'infirmier est à côté.", "The patient is sitting up, breathing fast. The nurse is beside him."), alert: "worse" },
      options: [
        { id: "safe", label: b("Vérifier la sécurité, se présenter et lui parler pour juger sa réponse", "Check safety, introduce yourself and speak to him to gauge his response"), correct: true, feedback: b("La démarche commence par la sécurité et une première impression : un patient qui répond parle et a des voies aériennes perméables pour l'instant.", "The approach starts with safety and a first impression: a patient who answers is talking and has a patent airway for now.") },
        { id: "history", label: b("Relire tout le dossier avant d'examiner", "Read the full notes before examining"), correct: false, feedback: b("Le dossier attendra : un patient qui se dégrade s'évalue d'abord.", "The notes can wait: a deteriorating patient is assessed first.") },
        { id: "xray", label: b("Demander une radiographie thoracique", "Order a chest X-ray"), correct: false, feedback: b("Un examen complémentaire ne remplace pas l'évaluation au lit et ne doit pas la retarder.", "A test does not replace bedside assessment and must not delay it.") },
      ],
    },
    {
      id: "primary",
      kind: "actions",
      domain: "gathering",
      points: 30,
      ordered: true,
      urgentBy: 3,
      title: b("Évaluation A → E", "Assessment A → E"),
      prompt: b("Réalisez l'évaluation. Chaque geste révèle un résultat. L'ordre compte.", "Carry out the assessment. Each step reveals a finding. Order matters."),
      scene: { vitals: { hr: 118, sbp: 104, dbp: 62, rr: 30, spo2: 88, temp: 38.4 }, alert: "worse" },
      actions: [
        { id: "a", label: b("A — Voies aériennes : parle-t-il ? bruits ? obstacle ?", "A — Airway: talking? noises? obstruction?"), finding: b("Parle par phrases courtes, pas de bruit inspiratoire, pas d'obstacle.", "Speaks in short sentences, no stridor, no obstruction."), required: true },
        { id: "b", label: b("B — Respiration : fréquence, SpO₂, travail respiratoire, auscultation", "B — Breathing: rate, SpO₂, work of breathing, auscultation"), finding: b("FR 30/min, SpO₂ 88 % en air ambiant, tirage, crépitants à droite. ⚠ Anomalie qui menace la vie.", "RR 30/min, SpO₂ 88% on room air, recession, crackles on the right. ⚠ Life-threatening problem."), required: true, urgent: true },
        { id: "c", label: b("C — Circulation : pouls, pression, temps de recoloration", "C — Circulation: pulse, blood pressure, capillary refill"), finding: b("FC 118/min, PA 104/62, temps de recoloration 3 s.", "HR 118/min, BP 104/62, capillary refill 3 s."), required: true },
        { id: "d", label: b("D — Neurologique : AVPU, pupilles, glycémie", "D — Disability: AVPU, pupils, glucose"), finding: b("Alerte (A sur AVPU), pupilles normales, glycémie 6,2 mmol/L.", "Alert ('A' on AVPU), normal pupils, glucose 6.2 mmol/L."), required: true },
        { id: "e", label: b("E — Exposition : température, peau, mollets, perfusion", "E — Exposure: temperature, skin, calves, drip"), finding: b("38,4 °C, pas d'éruption, mollets souples.", "38.4 °C, no rash, soft calves."), required: true },
        { id: "hx", label: b("Interroger en détail sur ses antécédents", "Take a detailed past history"), finding: b("Le patient est trop essoufflé pour répondre longuement.", "The patient is too breathless to answer at length."), required: false, note: b("Utile plus tard ; l'évaluation ABCDE passe d'abord.", "Useful later; the ABCDE assessment comes first.") },
      ],
      explain: b("L'ordre A→E traite d'abord ce qui tue le plus vite. Ici, l'hypoxie (B) devait être repérée tôt : chaque minute de retard aggrave la situation.", "The A→E order deals first with what kills fastest. Here hypoxia (B) had to be spotted early: every minute of delay worsens things."),
    },
    {
      id: "act",
      kind: "choice",
      domain: "safety",
      points: 25,
      multi: true,
      title: b("Agir sur B", "Act on B"),
      prompt: b("SpO₂ 88 % avec tirage. Quelles actions immédiates ?", "SpO₂ 88% with recession. Which immediate actions?"),
      scene: { vitals: { hr: 120, sbp: 102, dbp: 60, rr: 32, spo2: 87 }, alert: "critical" },
      options: [
        { id: "help", label: b("Appeler à l'aide / alerter le senior maintenant", "Call for help / alert the senior now"), correct: true, feedback: b("Un problème qui menace la vie justifie une aide immédiate.", "A life-threatening problem warrants immediate help.") },
        { id: "o2", label: b("Débuter l'oxygène selon le protocole du service et surveiller la SpO₂", "Start oxygen per the ward protocol and monitor SpO₂"), correct: true, feedback: b("On traite le problème trouvé avant de continuer ; débit et cible relèvent du protocole local.", "Treat the problem found before moving on; flow and target follow the local protocol.") },
        { id: "sit", label: b("Installer en position assise confortable", "Sit him up comfortably"), correct: true, feedback: b("Mesure simple qui aide la respiration.", "A simple measure that helps breathing.") },
        { id: "later", label: b("Noter le résultat et finir l'examen avant d'agir", "Note the result and finish the exam before acting"), correct: false, feedback: b("En ABCDE, on corrige chaque problème au moment où on le trouve.", "In ABCDE, each problem is corrected when it is found.") },
      ],
    },
    {
      id: "reassess",
      kind: "choice",
      domain: "recognition",
      points: 20,
      title: b("Réévaluation", "Reassessment"),
      prompt: b("Dix minutes plus tard, sous oxygène, la SpO₂ remonte mais la PA baisse. Que faites-vous ?", "Ten minutes later, on oxygen, SpO₂ improves but BP is falling. What do you do?"),
      scene: { vitals: { hr: 126, sbp: 88, dbp: 50, rr: 26, spo2: 93 }, alert: "worse", text: b("Le patient est plus pâle. Le senior est en route.", "The patient is paler. The senior is on the way.") },
      options: [
        { id: "restart", label: b("Recommencer l'évaluation depuis A et signaler l'évolution au senior", "Restart the assessment from A and report the change to the senior"), correct: true, feedback: b("Toute aggravation impose de reprendre ABCDE depuis le début et de transmettre la tendance.", "Any deterioration means going back to A and handing over the trend.") },
        { id: "focus_c", label: b("Ne s'occuper que de la pression artérielle", "Deal only with the blood pressure"), correct: false, feedback: b("Le risque est de manquer une nouvelle anomalie en A ou B.", "You risk missing a new problem in A or B.") },
        { id: "wait", label: b("Attendre le senior sans rien faire", "Wait for the senior without doing anything"), correct: false, feedback: b("On continue d'évaluer et de surveiller en attendant.", "Keep assessing and monitoring while waiting.") },
      ],
    },
    {
      id: "order",
      kind: "sequence",
      domain: "reasoning",
      points: 15,
      title: b("Synthèse", "Summary"),
      prompt: b("Remettez dans l'ordre la boucle de prise en charge.", "Put the care loop in order."),
      items: [
        { id: "1", label: b("Évaluer (A, B, C, D, E)", "Assess (A, B, C, D, E)") },
        { id: "2", label: b("Traiter le problème trouvé", "Treat the problem found") },
        { id: "3", label: b("Réévaluer", "Reassess") },
        { id: "4", label: b("Appeler à l'aide / transmettre (SBAR)", "Call for help / hand over (SBAR)") },
      ],
      explain: b("La boucle « évaluer – traiter – réévaluer » se répète ; l'appel à l'aide se fait dès qu'un problème grave est identifié, et la transmission structurée accompagne l'arrivée du senior.", "The 'assess – treat – reassess' loop repeats; call for help as soon as a serious problem is found, and give a structured handover when the senior arrives."),
    },
  ],
  debrief: {
    keyPoints: [
      b("A, B, C, D, E : on évalue dans cet ordre parce que les problèmes des voies aériennes et de la respiration tuent le plus vite.", "A, B, C, D, E: assess in this order because airway and breathing problems kill fastest."),
      b("On traite chaque problème au moment où on le trouve, puis on réévalue.", "Treat each problem when you find it, then reassess."),
      b("Une observation manquée ou retardée (ici la SpO₂) retarde le traitement et l'appel à l'aide.", "A missed or delayed observation (here SpO₂) delays treatment and the call for help."),
    ],
    reflection: [
      b("À quel rang avez-vous mesuré la SpO₂ ? Qu'est-ce qui vous aurait aidé à le faire plus tôt ?", "At what point did you measure SpO₂? What would have helped you do it earlier?"),
      b("À quel moment auriez-vous appelé à l'aide dans un vrai service ?", "When would you have called for help on a real ward?"),
    ],
  },
  refs: [{ id: "who-bec", section: b("Module 1 : approche ABCDE et réévaluation.", "Module 1: ABCDE approach and reassessment.") }],
  review: DRAFT_REVIEW(
    [b("Débit et cible d'oxygène — volontairement non chiffrés (protocole local).", "Oxygen flow and target — deliberately not stated (local protocol)."), b("Seuils de constantes déclenchant l'appel (score d'alerte local).", "Vital-sign thresholds that trigger a call (local early-warning score).")],
    LOCAL_PROTOCOL(b("le système d'appel d'urgence du service et le score d'alerte précoce", "the ward's emergency call system and early-warning score")),
  ),
};

// ───────────────────────── B. RCP de base + DAE ─────────────────────────
export const bls: GuidedWorkshop = {
  slug: "bls-aed",
  icon: "bls",
  title: b("Réanimation de base et défibrillateur", "Basic life support and AED"),
  sub: b("Reconnaître l'arrêt cardiaque, appeler, masser et utiliser un défibrillateur automatisé externe (recommandations ERC 2025).", "Recognise cardiac arrest, call, compress and use an automated external defibrillator (ERC 2025 guidelines)."),
  minutes: 10,
  level: b("Tous niveaux", "All levels"),
  difficulty: "EASY",
  tags: [b("RCP", "CPR"), b("DAE", "AED"), b("Urgence vitale", "Life-threatening emergency")],
  prerequisites: [b("Aucun", "None")],
  objectives: [
    b("Ordonner les étapes de la chaîne de survie de l'adulte selon l'ERC 2025", "Order the adult basic life support steps per ERC 2025"),
    b("Identifier les critères d'une compression thoracique de qualité", "Identify the criteria of high-quality chest compressions"),
    b("Utiliser un DAE en sécurité et reprendre les compressions sans délai", "Use an AED safely and resume compressions without delay"),
  ],
  intro: b("Dans le hall de la faculté, un homme d'une cinquantaine d'années s'effondre. Vous êtes le premier sur place. (Recommandations enseignées : ERC 2025, réanimation de base de l'adulte.)", "In the faculty hall, a man in his fifties collapses. You are first on the scene. (Guidance taught: ERC 2025 adult basic life support.)"),
  handsOn: true,
  steps: [
    {
      id: "chain",
      kind: "sequence",
      domain: "recognition",
      points: 30,
      title: b("Les premières étapes", "The first steps"),
      prompt: b("Remettez les étapes dans l'ordre.", "Put the steps in order."),
      scene: { text: b("La victime est au sol, ne bouge pas.", "The victim is on the floor, not moving."), alert: "critical" },
      items: [
        { id: "safe", label: b("Vérifier la sécurité des lieux", "Check the scene is safe") },
        { id: "resp", label: b("Vérifier s'il répond (le stimuler, lui parler fort)", "Check for a response (shake gently, speak loudly)") },
        { id: "call", label: b("S'il ne répond pas : appeler les secours (haut-parleur) et faire chercher un DAE", "If unresponsive: call emergency services (speakerphone) and send for an AED") },
        { id: "breath", label: b("Ouvrir les voies aériennes et vérifier la respiration (pas plus de 10 secondes)", "Open the airway and check breathing (no more than 10 seconds)") },
        { id: "cpr", label: b("Respiration absente ou anormale : débuter les compressions", "Absent or abnormal breathing: start compressions") },
      ],
      explain: b("Changement 2025 : on appelle les secours pour toute personne qui ne répond pas, sans attendre de confirmer une respiration anormale. Les respirations agoniques (« gasps ») ne sont pas une respiration normale.", "2025 change: call emergency services for anyone who is unresponsive, without first confirming abnormal breathing. Agonal gasps are not normal breathing."),
    },
    {
      id: "quality",
      kind: "choice",
      domain: "selection",
      points: 25,
      multi: true,
      title: b("Compressions de qualité", "High-quality compressions"),
      prompt: b("Quels critères décrivent des compressions de qualité chez l'adulte ?", "Which criteria describe high-quality compressions in an adult?"),
      options: [
        { id: "site", label: b("Talon de la main au centre du thorax", "Heel of the hand in the centre of the chest"), correct: true, feedback: b("Position recommandée.", "Recommended position.") },
        { id: "depth", label: b("Profondeur de 5 à 6 cm", "Depth of 5–6 cm"), correct: true, feedback: b("ERC 2025 : au moins 5 cm, pas plus de 6 cm.", "ERC 2025: at least 5 cm, no more than 6 cm.") },
        { id: "rate", label: b("Fréquence de 100 à 120 par minute", "Rate of 100–120 per minute"), correct: true, feedback: b("Fréquence recommandée.", "Recommended rate.") },
        { id: "recoil", label: b("Relâchement complet entre deux compressions, sans s'appuyer", "Full recoil between compressions, without leaning"), correct: true, feedback: b("Permet le remplissage du cœur.", "Allows the heart to refill.") },
        { id: "pause", label: b("Pause pour reprendre le pouls toutes les 30 secondes", "Pause to check the pulse every 30 seconds"), correct: false, feedback: b("Les interruptions doivent être minimales.", "Interruptions must be kept to a minimum.") },
      ],
    },
    {
      id: "breaths",
      kind: "choice",
      domain: "reasoning",
      points: 15,
      title: b("Insufflations", "Rescue breaths"),
      prompt: b("Vous êtes formé aux insufflations. Quel rapport compressions/insufflations ?", "You are trained in rescue breaths. Which compression-to-ventilation ratio?"),
      options: [
        { id: "302", label: b("30 compressions pour 2 insufflations", "30 compressions to 2 breaths"), correct: true, feedback: b("Rapport du sauveteur formé ; sans formation, compressions seules. (Point à confirmer dans le texte ERC 2025.)", "Ratio for trained rescuers; untrained rescuers do compression-only CPR. (To confirm in the ERC 2025 text.)") },
        { id: "152", label: b("15 pour 2", "15 to 2"), correct: false, feedback: b("Ce n'est pas le rapport de la RCP de base de l'adulte.", "This is not the adult basic life support ratio.") },
        { id: "51", label: b("5 pour 1", "5 to 1"), correct: false, feedback: b("Rapport obsolète.", "An outdated ratio.") },
      ],
    },
    {
      id: "aed",
      kind: "sequence",
      domain: "safety",
      points: 20,
      title: b("Le DAE arrive", "The AED arrives"),
      prompt: b("Remettez dans l'ordre l'utilisation du DAE.", "Put AED use in order."),
      scene: { text: b("Un collègue apporte le DAE pendant que vous massez.", "A colleague brings the AED while you do compressions."), alert: "critical" },
      items: [
        { id: "on", label: b("Allumer le DAE et suivre ses instructions vocales", "Switch on the AED and follow its voice prompts") },
        { id: "pads", label: b("Coller les électrodes sur le thorax nu, en continuant le massage si possible", "Apply the pads to the bare chest, continuing compressions if possible") },
        { id: "clear", label: b("S'écarter : personne ne touche la victime pendant l'analyse", "Stand clear: nobody touches the victim during analysis") },
        { id: "shock", label: b("Choc si indiqué, en vérifiant que personne ne touche", "Shock if advised, making sure nobody is touching") },
        { id: "resume", label: b("Reprendre immédiatement les compressions", "Resume compressions immediately") },
      ],
      explain: b("Le DAE guide le sauveteur ; la sécurité au moment de l'analyse et du choc est essentielle, et les compressions reprennent tout de suite après.", "The AED guides the rescuer; safety during analysis and shock is essential, and compressions resume immediately afterwards."),
    },
    {
      id: "noshock",
      kind: "choice",
      domain: "safety",
      points: 10,
      title: b("« Choc non indiqué »", "'No shock advised'"),
      prompt: b("Le DAE annonce « choc non indiqué ». Que faites-vous ?", "The AED says 'no shock advised'. What do you do?"),
      options: [
        { id: "resume", label: b("Reprendre immédiatement les compressions et suivre le DAE", "Resume compressions immediately and follow the AED"), correct: true, feedback: b("L'absence de choc ne veut pas dire que le cœur est reparti.", "No shock does not mean the heart has restarted.") },
        { id: "stop", label: b("Arrêter la RCP : le cœur est reparti", "Stop CPR: the heart has restarted"), correct: false, feedback: b("Erreur dangereuse : on continue tant que la victime ne montre pas de signe de vie ou que les secours ne prennent pas le relais.", "A dangerous error: continue until the victim shows signs of life or help takes over.") },
        { id: "remove", label: b("Retirer les électrodes", "Remove the pads") , correct: false, feedback: b("Les électrodes restent en place ; le DAE réanalysera.", "The pads stay on; the AED will reanalyse.") },
      ],
    },
  ],
  debrief: {
    keyPoints: [
      b("Toute personne qui ne répond pas → appel des secours sans attendre (ERC 2025).", "Anyone unresponsive → call emergency services without delay (ERC 2025)."),
      b("Compressions de qualité : centre du thorax, 5–6 cm, 100–120/min, relâchement complet, interruptions minimales.", "High-quality compressions: centre of the chest, 5–6 cm, 100–120/min, full recoil, minimal interruptions."),
      b("Le DAE s'utilise dès son arrivée ; reprendre les compressions juste après chaque analyse ou choc.", "Use the AED as soon as it arrives; resume compressions straight after each analysis or shock."),
    ],
    reflection: [
      b("Qui appelleriez-vous, et comment, dans le hall de votre faculté ? Où est le DAE le plus proche ?", "Who would you call, and how, in your faculty hall? Where is the nearest AED?"),
      b("Qu'est-ce qui pourrait vous faire hésiter à commencer le massage ?", "What might make you hesitate to start compressions?"),
    ],
  },
  refs: [{ id: "erc-2025-bls", section: b("Réanimation de base de l'adulte : reconnaissance, alerte, compressions, DAE.", "Adult basic life support: recognition, alerting, compressions, AED.") }],
  review: DRAFT_REVIEW(
    [b("Rapport 30:2 et RCP « compressions seules » : à confirmer dans le texte ERC 2025.", "30:2 ratio and compression-only CPR: to confirm in the ERC 2025 text."), b("Numéro d'urgence algérien à afficher (Protection civile / SAMU) — à confirmer par l'enseignant.", "Algerian emergency number to display (Civil Protection / SAMU) — to confirm by the educator.")],
    LOCAL_PROTOCOL(b("la chaîne d'alerte de l'établissement et l'emplacement des DAE", "the institution's alert chain and AED locations")),
  ),
};

// ───────────────────────── C. Examen neurologique ciblé ─────────────────────────
export const neuroExam: GuidedWorkshop = {
  slug: "neuro-exam",
  icon: "neuro",
  title: b("Examen neurologique ciblé", "Focused neurological examination"),
  sub: b("Choisissez les gestes utiles devant un déficit aigu, puis résumez vos constatations en une phrase claire.", "Choose the useful steps for an acute deficit, then summarise your findings in one clear sentence."),
  minutes: 10,
  level: b("Externat", "Clinical years"),
  difficulty: "MEDIUM",
  tags: [b("Neurologie", "Neurology"), b("Examen clinique", "Clinical examination"), b("Communication", "Communication")],
  prerequisites: [b("Anatomie fonctionnelle du système nerveux", "Functional neuroanatomy")],
  objectives: [
    b("Sélectionner les éléments d'examen pertinents devant un déficit aigu", "Select the relevant examination elements for an acute deficit"),
    b("Rapporter les constatations de façon structurée", "Report findings in a structured way"),
    b("Reconnaître un simulateur à éliminer avant de conclure", "Recognise a mimic to exclude before concluding"),
  ],
  intro: b("Un homme de 66 ans arrive pour une faiblesse de la main gauche apparue il y a une heure. Vous disposez de quelques minutes avant d'appeler le neurologue de garde.", "A 66-year-old man arrives with left-hand weakness that began an hour ago. You have a few minutes before calling the on-call neurologist."),
  steps: [
    {
      id: "select",
      kind: "actions",
      domain: "selection",
      points: 40,
      title: b("Gestes ciblés", "Focused steps"),
      prompt: b("Choisissez les gestes d'examen. Chacun révèle une constatation fictive.", "Choose examination steps. Each reveals a fictional finding."),
      scene: { vitals: { hr: 80, sbp: 168, dbp: 92, rr: 16, spo2: 97 }, alert: "worse" },
      actions: [
        { id: "speech", label: b("Parole et langage", "Speech and language"), finding: b("Dysarthrie légère, langage fluent, compréhension normale.", "Mild dysarthria, fluent language, normal comprehension."), required: true },
        { id: "face", label: b("Visage (sourire, fermeture des yeux)", "Face (smile, eye closure)"), finding: b("Effacement du sillon nasogénien gauche ; fermeture des yeux normale.", "Flattened left nasolabial fold; normal eye closure."), required: true },
        { id: "pupils", label: b("Pupilles et oculomotricité", "Pupils and eye movements"), finding: b("Pupilles égales et réactives, oculomotricité normale.", "Equal, reactive pupils, normal eye movements."), required: true },
        { id: "arms", label: b("Force des membres supérieurs (épreuve des bras tendus)", "Arm power (arm-drift test)"), finding: b("Chute du bras gauche ; force 3/5 à gauche, 5/5 à droite.", "Left arm drifts; power 3/5 on the left, 5/5 on the right."), required: true },
        { id: "legs", label: b("Force des membres inférieurs", "Leg power"), finding: b("4/5 à gauche, 5/5 à droite.", "4/5 on the left, 5/5 on the right."), required: true },
        { id: "sens", label: b("Sensibilité", "Sensation"), finding: b("Hypoesthésie de l'hémicorps gauche.", "Reduced sensation on the left side of the body."), required: true },
        { id: "fields", label: b("Champ visuel", "Visual fields"), finding: b("Pas d'amputation du champ visuel au doigt.", "No visual field loss on confrontation."), required: false },
        { id: "fundus", label: b("Fond d'œil détaillé", "Detailed fundoscopy"), finding: b("Non réalisé faute de dilatation.", "Not done without dilation."), required: false, note: b("Peu utile à ce stade et prend du temps.", "Of little use at this stage and time-consuming.") },
        { id: "gait", label: b("Faire marcher le patient", "Make the patient walk"), finding: b("Le patient vacille au premier pas.", "The patient sways at the first step."), required: false, note: b("Risque de chute avec un déficit moteur : à éviter à ce stade.", "Fall risk with a motor deficit: avoid at this stage.") },
      ],
      explain: b("Devant un déficit aigu, l'examen ciblé (parole, visage, force, sensibilité, pupilles) suffit à décrire le tableau et à alerter ; un examen exhaustif ne doit pas retarder l'alerte.", "With an acute deficit, a focused exam (speech, face, power, sensation, pupils) is enough to describe the picture and raise the alert; an exhaustive exam must not delay it."),
    },
    {
      id: "summary",
      kind: "compose",
      domain: "communication",
      points: 30,
      title: b("Résumer", "Summarise"),
      prompt: b("Résumez pour le neurologue au téléphone.", "Summarise for the neurologist on the phone."),
      fields: [
        { id: "side", label: b("Côté et territoire", "Side and distribution"), hint: b("Quel côté ? Quels segments ?", "Which side? Which body parts?"), expect: [["gauche"], ["left"]], model: b("Déficit moteur et sensitif de l'hémicorps gauche, prédominant au membre supérieur, avec atteinte faciale gauche.", "Left-sided motor and sensory deficit, worse in the arm, with left facial weakness.") },
        { id: "severity", label: b("Intensité", "Severity"), hint: b("Chiffrez la force.", "Grade the power."), expect: [["3/5"], ["3 / 5"]], model: b("Force 3/5 au membre supérieur gauche, 4/5 au membre inférieur gauche.", "Power 3/5 in the left arm, 4/5 in the left leg.") },
        { id: "time", label: b("Heure de début", "Onset time"), hint: b("Quand ?", "When?"), expect: [["heure"], ["hour"], ["1 h"], ["1h"], ["minutes"]], model: b("Début il y a environ une heure (heure exacte à préciser).", "Onset about an hour ago (exact time to confirm).") },
      ],
    },
    {
      id: "mimic",
      kind: "choice",
      domain: "safety",
      points: 30,
      title: b("Avant de conclure", "Before concluding"),
      prompt: b("Quel examen simple et rapide doit être fait pour éliminer un simulateur fréquent ?", "Which simple, quick test must be done to exclude a common mimic?"),
      options: [
        { id: "glu", label: b("Glycémie capillaire", "Capillary glucose"), correct: true, feedback: b("L'hypoglycémie peut donner un déficit focal et se corrige facilement.", "Hypoglycaemia can cause a focal deficit and is easily corrected.") },
        { id: "eeg", label: b("EEG", "EEG"), correct: false, feedback: b("Non disponible en urgence et n'est pas le premier examen.", "Not available urgently and not the first test.") },
        { id: "lp", label: b("Ponction lombaire", "Lumbar puncture"), correct: false, feedback: b("Non indiquée ici.", "Not indicated here.") },
      ],
    },
  ],
  debrief: {
    keyPoints: [
      b("L'examen neurologique ciblé décrit le côté, le territoire et l'intensité du déficit.", "The focused neurological exam describes side, distribution and severity of the deficit."),
      b("Une phrase de synthèse claire vaut mieux qu'une longue liste.", "A clear summary sentence is better than a long list."),
      b("Toujours éliminer une hypoglycémie.", "Always exclude hypoglycaemia."),
    ],
    reflection: [
      b("Quels gestes avez-vous faits par habitude plutôt que par utilité ?", "Which steps did you do out of habit rather than usefulness?"),
      b("Votre résumé tenait-il en une phrase ?", "Did your summary fit in one sentence?"),
    ],
  },
  refs: [
    { id: "educator-checklist", section: b("Grille d'examen neurologique ciblé (brouillon, à remplacer).", "Focused neurological examination checklist (draft, to replace).") },
    { id: "aha-stroke-2026", section: b("Évaluation neurologique initiale (contexte uniquement).", "Initial neurological evaluation (context only).") },
  ],
  review: DRAFT_REVIEW(
    [b("Grille d'examen neurologique validée par la faculté — à fournir.", "Faculty-approved neurological examination checklist — to supply."), b("Usage éventuel d'une échelle standardisée (NIHSS ou autre) selon la formation locale.", "Possible use of a standardised scale (NIHSS or other) per local training.")],
    LOCAL_PROTOCOL(b("la grille d'examen enseignée localement", "the locally taught examination checklist")),
  ),
};

// ───────────────────────── D. Gaz du sang ─────────────────────────
type AbgOption = { id: string; fr: string; en: string; ok: boolean; why: [string, string] };
const abgSteps = (id: string, ph: string, paco2: string, hco3: string, context: [string, string], options: AbgOption[]): ChoiceStep => ({
  id,
  kind: "choice",
  domain: "reasoning",
  points: 20,
  title: b(`Exemple ${id.slice(-1)}`, `Example ${id.slice(-1)}`),
  prompt: b("Quelle interprétation, dans ce contexte ?", "Which interpretation, in this context?"),
  scene: { diagram: "abg", abg: { ph, paco2, hco3, context: b(context[0], context[1]) } },
  options: options.map((o) => ({ id: o.id, label: b(o.fr, o.en), correct: o.ok, feedback: b(o.why[0], o.why[1]) })),
});

export const abg: GuidedWorkshop = {
  slug: "blood-gas",
  icon: "abg",
  title: b("Gaz du sang : lecture méthodique", "Blood gases: a methodical reading"),
  sub: b("pH, PaCO₂, HCO₃⁻, compensation et contexte clinique, toujours dans le même ordre, sur des exemples synthétiques.", "pH, PaCO₂, HCO₃⁻, compensation and clinical context, always in the same order, on synthetic examples."),
  minutes: 12,
  level: b("Externat", "Clinical years"),
  difficulty: "MEDIUM",
  tags: [b("Gaz du sang", "Blood gases"), b("Acide-base", "Acid–base"), b("Interprétation", "Interpretation")],
  prerequisites: [b("Physiologie acide-base", "Acid–base physiology")],
  objectives: [
    b("Appliquer une méthode de lecture constante", "Apply a consistent reading method"),
    b("Identifier un trouble respiratoire ou métabolique primitif", "Identify a primary respiratory or metabolic disorder"),
    b("Relier l'interprétation au contexte clinique", "Link the interpretation to the clinical context"),
  ],
  intro: b("Trois gaz du sang artériels synthétiques, validés pour l'exercice. Intervalles indicatifs : StatPearls (2024) ; en pratique, utilisez ceux de votre laboratoire.", "Three synthetic arterial blood gases, checked for the exercise. Indicative intervals: StatPearls (2024); in practice, use your laboratory's."),
  steps: [
    {
      id: "method",
      kind: "sequence",
      domain: "reasoning",
      points: 25,
      title: b("La méthode", "The method"),
      prompt: b("Remettez les étapes de lecture dans l'ordre.", "Put the reading steps in order."),
      items: [
        { id: "ctx", label: b("Contexte clinique (qui, pourquoi, sous oxygène ?)", "Clinical context (who, why, on oxygen?)") },
        { id: "ph", label: b("pH : acidémie ou alcalémie ?", "pH: acidaemia or alkalaemia?") },
        { id: "co2", label: b("PaCO₂ : explique-t-elle le pH (cause respiratoire) ?", "PaCO₂: does it explain the pH (respiratory cause)?") },
        { id: "hco3", label: b("HCO₃⁻ : explique-t-il le pH (cause métabolique) ?", "HCO₃⁻: does it explain the pH (metabolic cause)?") },
        { id: "comp", label: b("Compensation : l'autre paramètre va-t-il dans le sens attendu ?", "Compensation: does the other value move in the expected direction?") },
        { id: "concl", label: b("Conclusion reliée au contexte", "Conclusion linked to the context") },
      ],
      explain: b("Toujours le même ordre : on évite ainsi de conclure sur une seule valeur. L'oxygénation (PaO₂) s'interprète aussi, avec la FiO₂.", "Always the same order: it avoids concluding from a single value. Oxygenation (PaO₂) is also interpreted, together with FiO₂."),
    },
    abgSteps("ex1", "7,28", "60", "27", ["Homme de 70 ans, somnolent après une dose de morphinique.", "70-year-old man, drowsy after an opioid dose."], [
      { id: "racid", fr: "Acidose respiratoire aiguë (peu compensée)", en: "Acute respiratory acidosis (little compensation)", ok: true, why: ["pH bas, PaCO₂ élevée qui l'explique, HCO₃⁻ à peine augmenté : compensation encore faible.", "Low pH, raised PaCO₂ that explains it, HCO₃⁻ barely raised: little compensation yet."] },
      { id: "macid", fr: "Acidose métabolique", en: "Metabolic acidosis", ok: false, why: ["Le HCO₃⁻ n'est pas bas.", "HCO₃⁻ is not low."] },
      { id: "ralk", fr: "Alcalose respiratoire", en: "Respiratory alkalosis", ok: false, why: ["Le pH est bas, pas haut.", "The pH is low, not high."] },
    ]),
    abgSteps("ex2", "7,30", "30", "14", ["Femme de 25 ans, diabétique, vomissements et respiration ample.", "25-year-old woman with diabetes, vomiting and deep breathing."], [
      { id: "macidc", fr: "Acidose métabolique avec compensation respiratoire", en: "Metabolic acidosis with respiratory compensation", ok: true, why: ["pH bas, HCO₃⁻ bas qui l'explique ; PaCO₂ basse = compensation respiratoire.", "Low pH, low HCO₃⁻ that explains it; low PaCO₂ = respiratory compensation."] },
      { id: "ralk2", fr: "Alcalose respiratoire primitive", en: "Primary respiratory alkalosis", ok: false, why: ["Le pH est bas : l'hypocapnie est une compensation.", "The pH is low: the low PaCO₂ is compensation."] },
      { id: "mixed", fr: "Gaz du sang normal", en: "Normal blood gas", ok: false, why: ["pH et HCO₃⁻ sont anormaux.", "pH and HCO₃⁻ are abnormal."] },
    ]),
    abgSteps("ex3", "7,49", "30", "23", ["Étudiant de 20 ans, crise d'angoisse avant un examen, fourmillements des mains.", "20-year-old student, panic attack before an exam, tingling hands."], [
      { id: "ralk3", fr: "Alcalose respiratoire aiguë", en: "Acute respiratory alkalosis", ok: true, why: ["pH élevé, PaCO₂ basse qui l'explique, HCO₃⁻ normal : trouble aigu. Le contexte oriente, mais d'autres causes d'hyperventilation restent à exclure.", "High pH, low PaCO₂ that explains it, normal HCO₃⁻: acute disorder. The context points the way, but other causes of hyperventilation still need excluding."] },
      { id: "malk", fr: "Alcalose métabolique", en: "Metabolic alkalosis", ok: false, why: ["Le HCO₃⁻ n'est pas élevé.", "HCO₃⁻ is not raised."] },
      { id: "racid3", fr: "Acidose respiratoire", en: "Respiratory acidosis", ok: false, why: ["pH élevé et PaCO₂ basse : c'est l'inverse.", "High pH and low PaCO₂: the opposite."] },
    ]),
    {
      id: "context",
      kind: "choice",
      domain: "safety",
      points: 15,
      title: b("Limites", "Limits"),
      prompt: b("Laquelle de ces affirmations est juste ?", "Which statement is correct?"),
      options: [
        { id: "ctx", label: b("Un gaz du sang s'interprète toujours avec le patient et son contexte", "A blood gas is always interpreted with the patient and the context"), correct: true, feedback: b("Le même résultat peut avoir des causes très différentes.", "The same result can have very different causes.") },
        { id: "alone", label: b("Le gaz du sang suffit à poser le diagnostic étiologique", "The blood gas alone establishes the underlying cause"), correct: false, feedback: b("Il décrit un trouble, il n'en donne pas la cause.", "It describes a disorder, not its cause.") },
        { id: "ranges", label: b("Les intervalles de référence sont identiques dans tous les laboratoires", "Reference intervals are identical in every laboratory"), correct: false, feedback: b("Ils varient : utilisez ceux du laboratoire local.", "They vary: use the local laboratory's.") },
      ],
    },
  ],
  debrief: {
    keyPoints: [
      b("Méthode constante : contexte → pH → PaCO₂ → HCO₃⁻ → compensation → conclusion.", "Consistent method: context → pH → PaCO₂ → HCO₃⁻ → compensation → conclusion."),
      b("Le paramètre qui « explique » le pH désigne le trouble primitif ; l'autre indique la compensation.", "The value that 'explains' the pH identifies the primary disorder; the other shows compensation."),
      b("Les intervalles de référence et les formules de compensation doivent venir de sources validées localement.", "Reference intervals and compensation formulas must come from locally approved sources."),
    ],
    reflection: [
      b("Avez-vous commencé par le contexte ou par les chiffres ?", "Did you start with the context or with the numbers?"),
      b("Quel exemple vous a demandé le plus de réflexion, et pourquoi ?", "Which example made you think hardest, and why?"),
    ],
  },
  refs: [{ id: "statpearls-abg", section: b("Interprétation et intervalles de référence (PaCO₂, HCO₃⁻).", "Interpretation and reference intervals (PaCO₂, HCO₃⁻).") }],
  review: DRAFT_REVIEW(
    [
      b("Intervalle de référence du pH (7,35–7,45) : à confirmer dans la source et auprès du laboratoire local.", "pH reference interval (7.35–7.45): to confirm in the source and with the local laboratory."),
      b("Valeurs synthétiques des trois exemples : à relire par un enseignant.", "Synthetic values of the three examples: for educator review."),
      b("Formules de compensation attendue et trou anionique — non enseignés ici.", "Expected-compensation formulas and anion gap — not taught here."),
      b("Choix d'une source d'enseignement de référence (licence de StatPearls non confirmée).", "Choice of a reference teaching source (StatPearls licence not confirmed)."),
    ],
    LOCAL_PROTOCOL(b("les intervalles de référence du laboratoire", "the laboratory's reference intervals")),
  ),
};

export const GUIDED_A = [abcde, bls, neuroExam, abg];
