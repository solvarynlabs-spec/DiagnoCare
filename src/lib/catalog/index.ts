import type { Localized } from "@/lib/sim/types";
import type { UiLang } from "@/lib/i18n/shared";
import { DIFFICULTY_EN, EXAM_CATEGORY_EN, EXAM_EN, INV_CATEGORY_EN, INV_EN, SPECIALTY_EN, TOPIC_GROUP_EN, TOPIC_LABEL_EN, TURNAROUND_EN } from "./en";

export const SPECIALTIES = [
  { key: "cardiology", name: "Cardiologie", blurb: "Douleur thoracique, troubles du rythme, insuffisance cardiaque et syndromes coronariens aigus.", icon: "HeartPulse" },
  { key: "neurology", name: "Neurologie", blurb: "AVC, crises convulsives, céphalées et déficits neurologiques focaux.", icon: "Brain" },
  { key: "pediatrics", name: "Pédiatrie", blurb: "Enfant fébrile, infections respiratoires, croissance et développement.", icon: "Baby" },
  { key: "emergency", name: "Médecine d'urgence", blurb: "Situations vitales nécessitant un triage et une stabilisation rapides.", icon: "Siren" },
  { key: "internal", name: "Médecine interne", blurb: "Pathologies endocriniennes, métaboliques et multisystémiques.", icon: "Stethoscope" },
  { key: "dermatology", name: "Dermatologie", blurb: "Éruptions, dermatoses chroniques et analyse des lésions.", icon: "ScanFace" },
  { key: "general", name: "Médecine générale", blurb: "Motifs fréquents de soins primaires et raisonnement de premier recours.", icon: "ClipboardPlus" },
  { key: "ophthalmology", name: "Ophtalmologie", blurb: "Œil rouge, baisse d'acuité visuelle et urgences ophtalmologiques.", icon: "Eye" },
  { key: "gynecology", name: "Gynécologie-obstétrique", blurb: "Douleurs pelviennes, grossesse débutante, métrorragies et urgences obstétricales.", icon: "Baby" },
  { key: "pulmonology", name: "Pneumologie", blurb: "Asthme, BPCO, tuberculose, pneumopathies et insuffisance respiratoire.", icon: "Wind" },
] as const;

export type SpecialtyKey = (typeof SPECIALTIES)[number]["key"];
export const specialtyName = (k: string, lang: UiLang = "fr") => (lang === "en" ? SPECIALTY_EN[k]?.name : undefined) ?? SPECIALTIES.find((s) => s.key === k)?.name ?? k;
export const specialtyBlurb = (k: string, lang: UiLang = "fr") => (lang === "en" ? SPECIALTY_EN[k]?.blurb : undefined) ?? SPECIALTIES.find((s) => s.key === k)?.blurb ?? "";

export const DIFFICULTIES = [
  { key: "EASY", label: "Fondamental" },
  { key: "MEDIUM", label: "Intermédiaire" },
  { key: "HARD", label: "Avancé" },
] as const;
export const difficultyLabel = (k: string, lang: UiLang = "fr") => (lang === "en" ? DIFFICULTY_EN[k] : undefined) ?? DIFFICULTIES.find((d) => d.key === k)?.label ?? k;

/**
 * Interview topics. Keywords are matched (accent-insensitive) against the student's
 * question in English, French and Arabic. Both the scripted engine and the scoring
 * use this taxonomy, so history-taking coverage is measured identically in all modes.
 */
export interface Topic {
  key: string;
  label: string;
  group: "Motif de consultation" | "Signes associés" | "Antécédents" | "Mode de vie" | "Vécu du patient";
  keywords: string[];
  fallback: Localized; // used when the case doesn't define this topic (a plausible "no")
}

export const TOPICS: Topic[] = [
  { key: "greeting", label: "Présentation", group: "Vécu du patient", keywords: ["salam", "saha", "ahlan", "je m'appelle", "hello", "hi ", "good morning", "good evening", "my name is", "i am doctor", "i'm doctor", "bonjour", "bonsoir", "je suis", "مرحبا", "السلام", "صباح الخير", "مساء الخير", "انا الطبيب", "أنا الطبيب"], fallback: { en: "Hello, doctor.", fr: "Bonjour, docteur.", ar: "مرحبا يا دكتور." } },
  { key: "chief_complaint", label: "Motif de consultation", group: "Motif de consultation", keywords: ["wach bik", "wech bik", "wach kayen", "qu'est-ce que vous avez", "vous venez pour", "raison de votre", "motif", "what brings", "why are you here", "what's wrong", "what is wrong", "what happened", "how can i help", "the problem", "your problem", "qu'est-ce qui vous amene", "pourquoi etes-vous", "qu'est-ce qui ne va pas", "que se passe", "ما الذي", "ماذا حدث", "ما المشكلة", "سبب الزيارة", "بماذا تشعر"], fallback: { en: "I just don't feel right.", fr: "Je ne me sens pas bien.", ar: "لا أشعر أنني بخير." } },
  { key: "onset", label: "Début et chronologie", group: "Motif de consultation", keywords: ["ca fait combien", "depuis", "a commence", "apparu", "when did", "how long", "start", "began", "begin", "sudden", "gradual", "since when", "duration", "depuis quand", "depuis combien", "quand", "commence", "debut", "brutal", "متى", "منذ متى", "بدأ", "بدات", "فجأة", "المدة"], fallback: { en: "It started a little while ago, I'm not sure exactly when.", fr: "Ça a commencé il y a peu, je ne sais pas exactement quand." } },
  { key: "location", label: "Siège", group: "Motif de consultation", keywords: ["ou ca", "ou est-ce", "ou exactement", "montrez-moi", "win", "fayn", "where", "location", "point to", "which part", "ou avez-vous", "ou est", "localis", "endroit", "أين", "اين", "مكان"], fallback: { en: "It's hard to say exactly where.", fr: "C'est difficile à dire exactement où." } },
  { key: "character", label: "Type", group: "Motif de consultation", keywords: ["a quoi ressemble", "comme quoi", "quel genre", "ecrase", "serre", "pique", "coup de poignard", "describe", "what does it feel", "what kind", "sharp", "dull", "burning", "pressure", "squeez", "stabbing", "type of pain", "nature", "decrire", "decrivez", "comment est", "serrement", "brulure", "صف", "كيف تشعر", "نوع الألم", "نوع الالم", "ضغط", "حرقة"], fallback: { en: "It's difficult to describe.", fr: "C'est difficile à décrire." } },
  { key: "radiation", label: "Irradiation", group: "Motif de consultation", keywords: ["ca descend", "ca va vers", "se propage", "irradie", "epaule", "cou", "radiat", "spread", "go anywhere", "move anywhere", "arm", "jaw", "back", "irradi", "bras", "machoire", "dos", "ينتشر", "يمتد", "الذراع", "الفك"], fallback: { en: "No, it stays in one place.", fr: "Non, ça reste au même endroit." } },
  { key: "severity", label: "Intensité", group: "Motif de consultation", keywords: ["fort", "forte", "sur une echelle", "de 0 a 10", "de 1 a 10", "severe", "scale", "out of 10", "out of ten", "how bad", "intensity", "worst", "severite", "sur 10", "intensite", "a quel point", "شدة", "من 10", "من عشرة", "قوي"], fallback: { en: "It's moderate, I suppose.", fr: "Modéré, je suppose." } },
  { key: "modifiers", label: "Facteurs aggravants / soulageants", group: "Motif de consultation", keywords: ["ca calme", "ca empire", "pire", "mieux", "quand vous respirez", "en marchant", "better", "worse", "relieve", "aggravat", "trigger", "exercise", "exertion", "rest", "position", "breath in", "ameliore", "aggrave", "soulage", "effort", "repos", "يخفف", "يزيد", "أسوأ", "افضل", "أفضل", "الراحة", "المجهود"], fallback: { en: "Nothing really changes it.", fr: "Rien ne change vraiment." } },
  { key: "associated", label: "Signes associés", group: "Signes associés", keywords: ["d'autres signes", "rien d'autre", "en plus", "other symptom", "anything else", "associated", "along with", "also notice", "autres symptomes", "autre chose", "associe", "أعراض أخرى", "اعراض اخرى", "شيء آخر"], fallback: { en: "Not that I've noticed.", fr: "Pas que j'aie remarqué." } },
  { key: "dyspnea", label: "Dyspnée", group: "Signes associés", keywords: ["du mal a respirer", "manque d'air", "nefs", "breath", "breathing", "short of", "dyspn", "winded", "souffle", "essouffl", "respir", "ضيق", "تنفس", "نفس"], fallback: { en: "No, my breathing is fine.", fr: "Non, je respire bien.", ar: "لا، تنفسي طبيعي." } },
  { key: "nausea", label: "Nausées et vomissements", group: "Signes associés", keywords: ["nause", "vomit", "sick to", "throw up", "threw up", "vomi", "envie de vomir", "غثيان", "تقيؤ", "استفراغ"], fallback: { en: "No nausea or vomiting.", fr: "Pas de nausées ni de vomissements.", ar: "لا غثيان ولا تقيؤ." } },
  { key: "sweating", label: "Sueurs", group: "Signes associés", keywords: ["vous transpirez", "en sueur", "sweat", "clammy", "transpir", "sueur", "moite", "تعرق", "عرق"], fallback: { en: "No, I haven't been sweating.", fr: "Non, je ne transpire pas.", ar: "لا، لم أتعرق." } },
  { key: "fever", label: "Fièvre et frissons", group: "Signes associés", keywords: ["de la temperature", "s5ana", "skhana", "chaud", "fever", "temperature", "chill", "shiver", "hot", "fievre", "temperature", "frisson", "حرارة", "حمى", "سخونة", "قشعريرة"], fallback: { en: "No fever that I know of.", fr: "Pas de fièvre à ma connaissance.", ar: "لا حرارة على حد علمي." } },
  { key: "cough", label: "Toux et expectorations", group: "Signes associés", keywords: ["vous toussez", "il tousse", "crachats", "kehha", "cough", "sputum", "phlegm", "tousse", "toux", "crach", "سعال", "يسعل", "تسعل", "كحة", "يكح", "بلغم"], fallback: { en: "No cough.", fr: "Pas de toux.", ar: "لا سعال." } },
  { key: "palpitations", label: "Palpitations", group: "Signes associés", keywords: ["palpitation", "racing", "heart beat", "heartbeat", "pounding", "coeur qui bat", "battements", "خفقان", "نبض"], fallback: { en: "No palpitations.", fr: "Pas de palpitations.", ar: "لا خفقان." } },
  { key: "syncope", label: "Vertiges et malaise", group: "Signes associés", keywords: ["perte de connaissance", "tombe dans les pommes", "la tete qui tourne", "faint", "dizz", "light-headed", "lightheaded", "pass out", "passed out", "black out", "vertige", "malaise", "evanoui", "دوخة", "دايخ", "دوار", "إغماء", "اغماء"], fallback: { en: "No dizziness or fainting.", fr: "Pas de vertiges ni de malaise.", ar: "لا دوخة ولا إغماء." } },
  { key: "neuro", label: "Signes neurologiques", group: "Signes associés", keywords: ["paralys", "bouche de travers", "trouver ses mots", "les mots", "mal a la tete", "weak", "numb", "tingl", "speech", "vision", "see", "face", "headache", "confus", "faiblesse", "engourdi", "parole", "vue", "mal de tete", "cephal", "ضعف", "تنميل", "الكلام", "النظر", "صداع"], fallback: { en: "No weakness, numbness or headache.", fr: "Pas de faiblesse, d'engourdissement ni de mal de tête.", ar: "لا ضعف ولا تنميل ولا صداع." } },
  { key: "gi", label: "Signes digestifs", group: "Signes associés", keywords: ["transit", "aller a la selle", "kerch", "abdom", "stomach", "belly", "bowel", "stool", "diarrh", "constipat", "ventre", "abdomen", "selles", "diarrhee", "بطن", "معدة", "إسهال", "اسهال", "إمساك"], fallback: { en: "My stomach is fine.", fr: "Mon ventre va bien.", ar: "بطني بخير." } },
  { key: "vision", label: "Signes visuels", group: "Signes associés", keywords: ["vous voyez", "votre vue", "la vue", "vision", "voir", "flou", "halos", "baisse de vue", "oeil", "yeux", "eye", "see", "blurred", "sight", "chouf", "nchouf", "عين", "رؤية", "نظر", "اشوف"], fallback: { en: "My eyesight is fine.", fr: "Je vois bien, pas de problème de vue.", ar: "نظري جيد." } },
  { key: "urinary", label: "Signes urinaires", group: "Signes associés", keywords: ["brule quand", "brulures mictionnelles", "envie d'uriner", "urines", "urin", "pee", "wee", "bladder", "burning when", "pipi", "uriner", "brulure en", "تبول", "بول", "المثانة"], fallback: { en: "No problems passing urine.", fr: "Pas de problème pour uriner.", ar: "لا مشاكل في التبول." } },
  { key: "skin", label: "Signes cutanés", group: "Signes associés", keywords: ["rash", "itch", "skin", "spot", "lesion", "eruption", "demange", "peau", "bouton", "plaque", "طفح", "حكة", "جلد", "بقع"], fallback: { en: "No rashes or skin problems.", fr: "Pas d'éruption ni de problème de peau.", ar: "لا طفح ولا مشاكل جلدية." } },
  { key: "weight", label: "Poids, appétit et énergie", group: "Signes associés", keywords: ["maigri", "grossi", "pris du poids", "fatigue", "weight", "appetite", "tired", "fatigue", "energy", "eating", "poids", "appetit", "fatigu", "energie", "وزن", "شهية", "تعب", "إرهاق", "طاقة"], fallback: { en: "My weight and energy have been normal.", fr: "Mon poids et mon énergie sont normaux.", ar: "وزني وطاقتي طبيعيان." } },
  { key: "pmh", label: "Antécédents médicaux", group: "Antécédents", keywords: ["antecedents", "malade avant", "maladie chronique", "vos maladies", "vous avez des maladies", "probleme de sante", "diabete", "tension", "operes", "operee", "medical history", "past history", "your history", "medical problem", "medical condition", "chronic", "healthy", "illness", "condition", "diagnosed with", "health problem", "surgery", "operation", "hospital", "antecedent", "chirurg", "hospitalis", "أمراض", "تاريخ مرضي", "عملية", "جراحة", "مستشفى"], fallback: { en: "I've been generally healthy.", fr: "J'ai toujours été en bonne santé.", ar: "كنت بصحة جيدة عموما." } },
  { key: "medications", label: "Traitements", group: "Antécédents", keywords: ["vous prenez", "medicaments", "ordonnance", "dwa", "dwaya", "medication", "medicine", "pills", "tablets", "drug", "taking anything", "prescri", "medicament", "traitement", "comprime", "دواء", "أدوية", "ادوية", "حبوب"], fallback: { en: "I don't take any regular medication.", fr: "Je ne prends aucun traitement.", ar: "لا أتناول أي أدوية بانتظام." } },
  { key: "allergies", label: "Allergies", group: "Antécédents", keywords: ["allergique", "allerg", "reaction to", "حساسية"], fallback: { en: "No allergies that I know of.", fr: "Pas d'allergie connue.", ar: "لا حساسية على حد علمي." } },
  { key: "family", label: "Antécédents familiaux", group: "Antécédents", keywords: ["dans votre famille", "vos parents", "ta famille", "familia", "family", "parents", "mother", "father", "brother", "sister", "runs in", "famille", "pere", "mere", "frere", "soeur", "عائلة", "العائلة", "الأب", "الأم", "والد"], fallback: { en: "Nothing in the family that I know of.", fr: "Rien dans la famille à ma connaissance.", ar: "لا شيء في العائلة على حد علمي." } },
  { key: "smoking", label: "Tabac", group: "Mode de vie", keywords: ["vous fumez", "cigarettes", "chique", "chemma", "tdakhan", "dkhan", "smok", "cigarette", "tobacco", "vape", "fume", "tabac", "تدخين", "سجائر", "تدخن"], fallback: { en: "I've never smoked.", fr: "Je n'ai jamais fumé.", ar: "لم أدخن أبدا." } },
  { key: "alcohol", label: "Alcool et substances", group: "Mode de vie", keywords: ["vous buvez", "drogues", "cannabis", "alcohol", "drink", "beer", "wine", "drugs", "recreational", "alcool", "boisson", "boire", "drogue", "كحول", "مخدرات", "تشرب"], fallback: { en: "I don't drink or use drugs.", fr: "Je ne bois pas et je ne prends pas de drogues.", ar: "لا أشرب الكحول ولا أتعاطى المخدرات." } },
  { key: "occupation", label: "Profession et contexte social", group: "Mode de vie", keywords: ["vous travaillez", "votre metier", "vous vivez", "habitez", "khedma", "work", "job", "occupation", "live with", "home", "travel", "school", "nursery", "travail", "metier", "habitez", "voyage", "ecole", "عمل", "وظيفة", "تعيش", "سفر", "مدرسة"], fallback: { en: "Nothing unusual at home or work.", fr: "Rien d'inhabituel à la maison ou au travail.", ar: "لا شيء غير عادي في البيت أو العمل." } },
  { key: "gyn", label: "Gynéco-obstétrique", group: "Antécédents", keywords: ["dernieres regles", "enceinte", "contraception", "pilule", "period", "pregnan", "menstru", "contracep", "pill", "regles", "enceinte", "grossesse", "contracept", "الدورة", "حامل", "حمل", "منع الحمل"], fallback: { en: "Nothing relevant there.", fr: "Rien de particulier.", ar: "لا شيء يذكر." } },
  { key: "ice", label: "Idées, inquiétudes et attentes", group: "Vécu du patient", keywords: ["qu'est-ce qui vous inquiete", "vous pensez que", "qu'attendez-vous", "rak khayef", "khayfa", "worried", "concern", "think it is", "expect", "afraid", "scared", "inquiet", "peur", "pensez-vous", "attendez", "قلق", "خائف", "تتوقع", "ماذا تعتقد"], fallback: { en: "I just want to know what's going on.", fr: "Je veux juste savoir ce qui se passe.", ar: "أريد فقط أن أعرف ما الذي يحدث." } },
];

export const topicByKey = (k: string) => TOPICS.find((t) => t.key === k);
export const topicLabel = (k: string, lang: UiLang = "fr") => (lang === "en" ? TOPIC_LABEL_EN[k] : undefined) ?? topicByKey(k)?.label ?? k;
export const topicGroupLabel = (g: string, lang: UiLang = "fr") => (lang === "en" ? TOPIC_GROUP_EN[g] : undefined) ?? g;

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ْ]/g, "") // Arabic diacritics
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const LATIN = /^[a-z0-9' -]+$/;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Latin keywords must start at a word boundary (so "where" doesn't match "anywhere",
 * but the stem "radiat" still matches "radiating"). Arabic keywords use substring
 * matching because of attached prefixes (ال، و، ب…).
 */
function keywordHit(q: string, k: string): boolean {
  if (!k) return false;
  if (!LATIN.test(k)) return q.includes(k);
  // Very short keywords ("hi", "arm", "hot") must match a whole word.
  const tail = k.length <= 3 ? "([^a-z0-9]|$)" : "";
  return new RegExp(`(^|[^a-z0-9])${escapeRe(k)}${tail}`).test(q);
}

export function detectTopics(question: string): string[] {
  const q = ` ${normalize(question)} `;
  const hits: string[] = [];
  for (const t of TOPICS) {
    if (t.keywords.some((k) => keywordHit(q, normalize(k)))) hits.push(t.key);
  }
  // A general "pain" question without a specific dimension → character.
  if (hits.length === 0 && /(pain|douleur|mal |ألم|الم|wja3|oudja3)/.test(q)) hits.push("character");
  return hits;
}

// ───────────── Physical examination catalog ─────────────

export interface ExamItem { code: string; name: string; category: string; normal: string }

export const PHYSICAL_EXAMS: ExamItem[] = [
  { code: "general", name: "État général", category: "Général", normal: "Conscient, confortable au repos, bien perfusé, pas de détresse." },
  { code: "vitals_manual", name: "Constantes manuelles", category: "Général", normal: "Constantes concordantes avec le moniteur." },
  { code: "hydration", name: "État d'hydratation", category: "Général", normal: "Muqueuses humides, temps de recoloration < 2 s, pas de pli cutané." },
  { code: "cv_ausc", name: "Auscultation cardiaque", category: "Cardiovasculaire", normal: "B1 B2 bien frappés, pas de bruit surajouté ni de souffle." },
  { code: "jvp", name: "Turgescence jugulaire", category: "Cardiovasculaire", normal: "Pas de turgescence jugulaire." },
  { code: "pulses", name: "Pouls périphériques", category: "Cardiovasculaire", normal: "Pouls périphériques présents et symétriques." },
  { code: "edema", name: "Œdèmes / mollets", category: "Cardiovasculaire", normal: "Pas d'œdème des membres inférieurs. Mollets souples et indolores." },
  { code: "resp_insp", name: "Inspection respiratoire", category: "Respiratoire", normal: "Respiration non laborieuse, pas de tirage, ampliation symétrique." },
  { code: "resp_ausc", name: "Auscultation pulmonaire", category: "Respiratoire", normal: "Murmure vésiculaire bilatéral, pas de crépitants ni de sibilants." },
  { code: "resp_percussion", name: "Percussion thoracique", category: "Respiratoire", normal: "Sonorité normale partout." },
  { code: "abdo_palp", name: "Palpation abdominale", category: "Abdominal", normal: "Abdomen souple, indolore, pas d'organomégalie, pas de défense." },
  { code: "abdo_ausc", name: "Bruits hydro-aériques", category: "Abdominal", normal: "Bruits hydro-aériques normaux." },
  { code: "renal_angle", name: "Fosses lombaires", category: "Abdominal", normal: "Fosses lombaires libres et indolores." },
  { code: "neuro_gcs", name: "Conscience (score de Glasgow)", category: "Neurologique", normal: "Glasgow 15/15, orienté dans le temps et l'espace." },
  { code: "neuro_cn", name: "Paires crâniennes", category: "Neurologique", normal: "Paires crâniennes II à XII normales. Pas d'asymétrie faciale." },
  { code: "neuro_motor", name: "Motricité et réflexes", category: "Neurologique", normal: "Tonus normal, force 5/5 aux quatre membres, réflexes symétriques, réflexe cutané plantaire en flexion." },
  { code: "neuro_sensory", name: "Sensibilité", category: "Neurologique", normal: "Sensibilité superficielle et douloureuse conservée." },
  { code: "neuro_speech", name: "Parole et langage", category: "Neurologique", normal: "Langage fluent, compréhension et répétition conservées." },
  { code: "neuro_coord", name: "Coordination et marche", category: "Neurologique", normal: "Épreuves doigt-nez et talon-genou normales. Marche normale." },
  { code: "meningism", name: "Syndrome méningé", category: "Neurologique", normal: "Pas de raideur de nuque. Kernig et Brudzinski négatifs." },
  { code: "ent", name: "Gorge et oreilles (ORL)", category: "ORL", normal: "Pharynx normal, tympans normaux." },
  { code: "lymph", name: "Aires ganglionnaires", category: "Général", normal: "Pas d'adénopathie palpable." },
  { code: "thyroid", name: "Examen de la thyroïde", category: "Endocrinien", normal: "Pas de goitre ni de nodule. Pas de souffle thyroïdien." },
  { code: "skin_insp", name: "Examen cutané", category: "Dermatologie", normal: "Pas d'éruption, de lésion ni de modification de coloration." },
  { code: "nails_scalp", name: "Ongles et cuir chevelu", category: "Dermatologie", normal: "Ongles et cuir chevelu normaux." },
  { code: "joints", name: "Examen articulaire", category: "Ostéo-articulaire", normal: "Pas de gonflement, de douleur ni de déformation articulaire." },
  { code: "bp_manual", name: "Tension artérielle au brassard", category: "Mesures", normal: "Pression artérielle dans les normes." },
  { code: "eye_acuity", name: "Acuité visuelle (échelle de Monoyer)", category: "Ophtalmologique", normal: "Acuité visuelle 10/10 aux deux yeux." },
  { code: "eye_pupils", name: "Réflexes pupillaires", category: "Ophtalmologique", normal: "Pupilles rondes, égales et réactives à la lumière." },
  { code: "eye_slitlamp", name: "Examen à la lampe à fente", category: "Ophtalmologique", normal: "Cornée claire, chambre antérieure calme et profonde." },
  { code: "eye_iop", name: "Tonus oculaire (tonométrie)", category: "Ophtalmologique", normal: "Pression intra-oculaire 15 mmHg aux deux yeux." },
  { code: "eye_fundus", name: "Fond d'œil", category: "Ophtalmologique", normal: "Papilles normales, rétine à plat, macula normale." },
  { code: "gyn_speculum", name: "Examen au spéculum", category: "Gynécologique", normal: "Col sain, pas de saignement ni de leucorrhées anormales." },
  { code: "gyn_tv", name: "Toucher vaginal", category: "Gynécologique", normal: "Utérus de taille normale, culs-de-sac libres et indolores." },
  { code: "obs_exam", name: "Examen obstétrical (hauteur utérine, BCF)", category: "Gynécologique", normal: "Examen obstétrical sans particularité." },
];

// ───────────── Investigations catalog ─────────────

export interface InvestigationItem { code: string; name: string; category: "Biologie" | "Cardiologie" | "Imagerie" | "Microbiologie" | "Actes" | "Explorations fonctionnelles"; normal: string; turnaround: string }

export const INVESTIGATIONS: InvestigationItem[] = [
  { code: "cbc", name: "Formule numération sanguine (FNS)", category: "Biologie", normal: "Hb 14,1 g/dL, GB 7 200/mm³, plaquettes 260 000/mm³.", turnaround: "30 min" },
  { code: "bmp", name: "Urée, créatinine, ionogramme", category: "Biologie", normal: "Na 139, K 4,2 mmol/L, urée 0,31 g/L, créatinine 8,8 mg/L.", turnaround: "45 min" },
  { code: "glucose", name: "Glycémie capillaire", category: "Biologie", normal: "1,01 g/L (5,6 mmol/L).", turnaround: "1 min" },
  { code: "crp", name: "Protéine C réactive (CRP)", category: "Biologie", normal: "CRP 3 mg/L.", turnaround: "45 min" },
  { code: "troponin", name: "Troponine ultrasensible", category: "Biologie", normal: "Troponine T hs 6 ng/L (N < 14).", turnaround: "60 min" },
  { code: "ddimer", name: "D-dimères", category: "Biologie", normal: "D-dimères 0,3 mg/L FEU (N < 0,5).", turnaround: "45 min" },
  { code: "lft", name: "Bilan hépatique", category: "Biologie", normal: "ALAT 22 UI/L, PAL 70 UI/L, bilirubine 9 µmol/L, albumine 42 g/L.", turnaround: "45 min" },
  { code: "coag", name: "Bilan d'hémostase (TP, TCA)", category: "Biologie", normal: "TP 100 %, INR 1,0, TCA 30 s.", turnaround: "45 min" },
  { code: "lipids", name: "Bilan lipidique", category: "Biologie", normal: "Cholestérol total 1,78 g/L, LDL 1,00 g/L, HDL 0,54 g/L, TG 1,06 g/L.", turnaround: "Le jour même" },
  { code: "hba1c", name: "HbA1c", category: "Biologie", normal: "HbA1c 5,3 %.", turnaround: "Le jour même" },
  { code: "tsh", name: "TSH et T4 libre", category: "Biologie", normal: "TSH 1,8 mUI/L, T4L 15 pmol/L.", turnaround: "Le jour même" },
  { code: "blood_gas", name: "Gaz du sang (veineux/artériel)", category: "Biologie", normal: "pH 7,40, PaCO₂ 40 mmHg, HCO₃⁻ 24 mmol/L, lactates 1,0 mmol/L.", turnaround: "5 min" },
  { code: "ketones", name: "Cétonémie capillaire", category: "Biologie", normal: "β-hydroxybutyrate 0,2 mmol/L.", turnaround: "2 min" },
  { code: "urinalysis", name: "Bandelette urinaire", category: "Biologie", normal: "Leucocytes, nitrites, sang, protéines, glucose et corps cétoniques négatifs.", turnaround: "2 min" },
  { code: "pregnancy", name: "Test de grossesse (β-hCG)", category: "Biologie", normal: "Négatif.", turnaround: "10 min" },
  { code: "urine_culture", name: "ECBU", category: "Microbiologie", normal: "Pas de bactériurie significative.", turnaround: "48 h" },
  { code: "blood_culture", name: "Hémocultures", category: "Microbiologie", normal: "Stériles à 48 heures.", turnaround: "48 h" },
  { code: "ecg", name: "ECG 12 dérivations", category: "Cardiologie", normal: "Rythme sinusal à 72/min, axe normal, pas de trouble de la repolarisation.", turnaround: "5 min" },
  { code: "echo", name: "Échocardiographie", category: "Cardiologie", normal: "Cavités de taille normale, FEVG 60 %, pas de valvulopathie.", turnaround: "Le jour même" },
  { code: "cxr", name: "Radiographie thoracique", category: "Imagerie", normal: "Champs pulmonaires clairs, silhouette cardiaque normale, pas d'épanchement ni de pneumothorax.", turnaround: "30 min" },
  { code: "ct_head", name: "TDM cérébrale sans injection", category: "Imagerie", normal: "Pas d'hémorragie, de masse ni d'infarctus constitué.", turnaround: "30 min" },
  { code: "ct_angio_head", name: "Angio-TDM des troncs supra-aortiques et intracrânienne", category: "Imagerie", normal: "Vaisseaux cervicaux et intracrâniens perméables.", turnaround: "40 min" },
  { code: "ctpa", name: "Angio-TDM thoracique", category: "Imagerie", normal: "Pas d'embolie pulmonaire.", turnaround: "60 min" },
  { code: "abdo_us", name: "Échographie abdominale", category: "Imagerie", normal: "Foie, vésicule, reins et rate normaux.", turnaround: "Le jour même" },
  { code: "lp", name: "Ponction lombaire", category: "Actes", normal: "LCR clair, < 5 éléments/mm³, protéinorachie 0,3 g/L, glycorachie 0,63 g/L.", turnaround: "2 h" },
  { code: "skin_biopsy", name: "Biopsie cutanée", category: "Actes", normal: "Architecture cutanée normale.", turnaround: "7 jours" },
  { code: "skin_scraping", name: "Prélèvement mycologique (KOH)", category: "Microbiologie", normal: "Pas d'élément fongique.", turnaround: "1 jour" },
  { code: "throat_swab", name: "Prélèvement de gorge / PCR virale", category: "Microbiologie", normal: "Aucun pathogène détecté.", turnaround: "24 h" },
  { code: "hcg_quant", name: "β-hCG plasmatique quantitative", category: "Biologie", normal: "β-hCG < 5 UI/L.", turnaround: "1 h" },
  { code: "blood_group", name: "Groupe sanguin, rhésus, RAI", category: "Biologie", normal: "Groupe O Rh+, RAI négative.", turnaround: "1 h" },
  { code: "pelvic_us", name: "Échographie pelvienne endovaginale", category: "Imagerie", normal: "Utérus et ovaires normaux, pas d'épanchement.", turnaround: "30 min" },
  { code: "sputum_tb", name: "Recherche de BK dans les crachats (GeneXpert)", category: "Microbiologie", normal: "GeneXpert MTB négatif.", turnaround: "24 h" },
  { code: "peak_flow", name: "Débit expiratoire de pointe (DEP)", category: "Explorations fonctionnelles", normal: "DEP 480 L/min (100 % de la théorique).", turnaround: "2 min" },
  { code: "spirometry", name: "Spirométrie avec test de réversibilité", category: "Explorations fonctionnelles", normal: "VEMS 98 %, VEMS/CVF 0,82, pas de réversibilité.", turnaround: "Le jour même" },
];

export const examByCode = (c: string) => PHYSICAL_EXAMS.find((e) => e.code === c);
export const investigationByCode = (c: string) => INVESTIGATIONS.find((e) => e.code === c);

/** Display copy of an exam in the interface language (the code and French category stay the keys). */
export function localizeExam(e: ExamItem, lang: UiLang): ExamItem & { categoryLabel: string } {
  if (lang !== "en") return { ...e, categoryLabel: e.category };
  const en = EXAM_EN[e.code];
  return { ...e, name: en?.name ?? e.name, normal: en?.normal ?? e.normal, categoryLabel: EXAM_CATEGORY_EN[e.category] ?? e.category };
}
export function localizeInvestigation(i: InvestigationItem, lang: UiLang): InvestigationItem & { categoryLabel: string } {
  if (lang !== "en") return { ...i, categoryLabel: i.category };
  const en = INV_EN[i.code];
  return { ...i, name: en?.name ?? i.name, normal: en?.normal ?? i.normal, turnaround: TURNAROUND_EN[i.turnaround] ?? i.turnaround, categoryLabel: INV_CATEGORY_EN[i.category] ?? i.category };
}
export const examName = (c: string, lang: UiLang = "fr") => { const e = examByCode(c); return e ? localizeExam(e, lang).name : c; };
export const investigationName = (c: string, lang: UiLang = "fr") => { const i = investigationByCode(c); return i ? localizeInvestigation(i, lang).name : c; };
