import { detectTopics, normalize, topicByKey } from "@/lib/catalog";
import { pickLocalized, type Localized } from "../types";
import type { PatientEngine, PatientTurnInput, PatientTurnOutput } from "./types";

const UNCLEAR: Localized = {
  en: "Sorry doctor, I'm not sure what you mean. Could you ask me another way?",
  fr: "Pardon docteur, je ne comprends pas bien. Vous pouvez reformuler ?",
  ar: "عذرا يا دكتور، لم أفهم جيدا. هل يمكنك أن تسأل بطريقة أخرى؟",
};
const DIAGNOSIS_ASK: Localized = {
  en: "I was hoping you could tell me, doctor. That's why I'm here.",
  fr: "J'espérais que vous pourriez me le dire, docteur. C'est pour ça que je suis là.",
  ar: "كنت آمل أن تخبرني أنت يا دكتور. لهذا أنا هنا.",
};
const EXAM_ASK: Localized = {
  en: "Of course, go ahead and examine me. (Use the Examination step to perform examinations.)",
  fr: "Bien sûr, vous pouvez m'examiner. (Utilisez l'étape Examen.)",
  ar: "بالطبع، تفضل بفحصي. (استخدم خطوة الفحص.)",
};

const DIAGNOSIS_RE = /(diagnos|what do i have|what is wrong with me|what's wrong with me|qu'est-ce que j'ai|ما هو مرضي|ما تشخيص)/;
const EXAM_RE = /(examine|exam you|listen to your|ausculter|examiner|افحص)/;

/**
 * Deterministic, offline patient engine. Answers come verbatim from the case's
 * authored facts, so it can never contradict them. Used in demo mode and as a
 * fallback when the LLM is unavailable.
 */
export const scriptedEngine: PatientEngine = {
  id: "demo",
  async respond({ content, question, lang }: PatientTurnInput): Promise<PatientTurnOutput> {
    const q = normalize(question);
    const say = (l: Localized) => pickLocalized(l, lang);

    if (DIAGNOSIS_RE.test(q)) {
      return { reply: say(DIAGNOSIS_ASK).text, emotion: content.patient.baselineEmotion, topics: [], engine: "demo" };
    }
    if (EXAM_RE.test(q)) {
      return { reply: say(EXAM_ASK).text, emotion: "neutral", topics: [], engine: "demo" };
    }

    const topics = detectTopics(question).slice(0, 3);
    if (topics.length === 0) {
      return { reply: say(UNCLEAR).text, emotion: content.patient.baselineEmotion, topics: [], engine: "demo" };
    }

    let untranslated = false;
    const parts = topics.map((key) => {
      const authored = content.interview[key];
      const r = say(authored ?? topicByKey(key)!.fallback);
      if (!r.translated) untranslated = true;
      return r.text;
    });
    const unique = [...new Set(parts)];
    const emotion = topics.map((t) => content.topicEmotions?.[t]).find(Boolean) ?? content.patient.baselineEmotion;
    return {
      reply: unique.join(" "),
      emotion,
      topics,
      engine: "demo",
      note: untranslated ? "Certaines réponses de ce cas de démonstration n'existent qu'en anglais. Le mode IA traduit toutes les réponses." : undefined,
    };
  },
};
