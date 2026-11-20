import type { CaseContent, Difficulty } from "@/lib/sim/types";

export function blankCase(): { meta: { slug: string; title: string; specialty: string; difficulty: Difficulty; summary: string; objectives: string[]; minutes: number; freeTier: boolean }; content: CaseContent } {
  return {
    meta: { slug: "", title: "", specialty: "general", difficulty: "EASY", summary: "", objectives: [""], minutes: 15, freeTier: false },
    content: {
      patient: { name: "", age: 40, sex: "F", occupation: "", personality: "", baselineEmotion: "neutral", avatar: { skin: "#E8B996", hair: "#3B2416", hairStyle: "short", accessory: "none" } },
      setting: "",
      chiefComplaint: { en: "" },
      vitals: { hr: 80, sbp: 125, dbp: 80, rr: 16, spo2: 98, temp: 36.8 },
      interview: {},
      history: { pastMedical: [], medications: [], allergies: [], family: [], social: [] },
      symptoms: [],
      exam: {},
      investigations: {},
      answer: { diagnosis: "", acceptedTerms: [], differentials: [], teachingPoints: [] },
      rubric: {
        keyTopics: [],
        essentialExams: [],
        essentialInvestigations: [],
        unnecessaryInvestigations: [],
        management: { options: [] },
        weights: { history: 25, exam: 20, investigations: 15, diagnosis: 20, management: 20 },
      },
    },
  };
}
