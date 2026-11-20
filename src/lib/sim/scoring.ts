import { examName, investigationName, normalize, topicLabel } from "@/lib/catalog";
import type { CaseContent, ScoreBreakdown, ScoreCategory, ScoreItem } from "./types";

/**
 * Transparent, deterministic rubric scoring. Every point is traceable to an explicit
 * rubric item authored (and expert-reviewed) with the case. The LLM never sets scores.
 */

export interface SessionEvidence {
  topicsCovered: string[];
  exams: string[];
  investigations: string[];
  differentials: string[];
  finalDiagnosis: string;
  justification: string;
  managementActions: string[];
  durationMinutes: number;
  questionsAsked: number;
}

export function termMatches(text: string, terms: string[]): boolean {
  const t = ` ${normalize(text).replace(/[^\p{L}\p{N}' ]+/gu, " ")} `;
  return terms.some((term) => {
    const n = normalize(term).replace(/[^\p{L}\p{N}' ]+/gu, " ").trim();
    if (!n) return false;
    return t.includes(` ${n} `) || (n.length >= 6 && t.includes(n));
  });
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function scoreSession(c: CaseContent, ev: SessionEvidence, lang: "fr" | "en" = "fr"): ScoreBreakdown {
  const t = (fr: string, en: string) => (lang === "en" ? en : fr);
  const { rubric } = c;
  const W = rubric.weights;
  const categories: ScoreCategory[] = [];

  // History taking
  {
    const total = rubric.keyTopics.reduce((s, k) => s + k.weight, 0) || 1;
    const items: ScoreItem[] = rubric.keyTopics.map((k) => {
      const achieved = ev.topicsCovered.includes(k.topic);
      const max = round1((k.weight / total) * W.history);
      return { label: `${t("A exploré", "Explored")} : ${topicLabel(k.topic, lang).toLowerCase()}`, achieved, points: achieved ? max : 0, max };
    });
    categories.push(cat("history", t("Interrogatoire", "History taking"), items, W.history));
  }

  // Physical examination
  {
    const n = rubric.essentialExams.length || 1;
    const items: ScoreItem[] = rubric.essentialExams.map((code) => {
      const achieved = ev.exams.includes(code);
      const max = round1(W.exam / n);
      return { label: examName(code, lang), achieved, points: achieved ? max : 0, max };
    });
    if (rubric.essentialExams.length === 0) items.push({ label: t("Examen clinique réalisé", "Physical examination performed"), achieved: ev.exams.length > 0, points: ev.exams.length > 0 ? W.exam : 0, max: W.exam });
    categories.push(cat("exam", t("Examen clinique", "Physical examination"), items, W.exam));
  }

  // Investigations
  {
    const items: ScoreItem[] = [];
    const ess = rubric.essentialInvestigations;
    if (ess.length) {
      for (const code of ess) {
        const achieved = ev.investigations.includes(code);
        const max = round1(W.investigations / ess.length);
        items.push({ label: `${t("A demandé", "Ordered")} : ${investigationName(code, lang)}`, achieved, points: achieved ? max : 0, max });
      }
    } else {
      items.push({ label: t("Pas d'examen inutile pour un diagnostic clinique", "No unnecessary tests for a clinical diagnosis"), achieved: true, points: W.investigations, max: W.investigations, note: t("Aucun examen complémentaire n'est indispensable dans ce cas.", "No investigation is essential in this case.") });
    }
    for (const code of rubric.unnecessaryInvestigations.filter((x) => ev.investigations.includes(x))) {
      items.push({ label: `${t("Examen non pertinent", "Unnecessary test")} : ${investigationName(code, lang)}`, achieved: false, points: -round1(W.investigations * 0.15), max: 0, note: t("Non indiqué ici — coût, délai ou risque inutiles.", "Not indicated here — needless cost, delay or risk.") });
    }
    categories.push(cat("investigations", t("Examens complémentaires", "Investigations"), items, W.investigations));
  }

  // Diagnosis & reasoning
  {
    const finalOk = termMatches(ev.finalDiagnosis, c.answer.acceptedTerms);
    const ddxText = ev.differentials.join(" | ");
    const items: ScoreItem[] = [
      { label: t("Diagnostic final correct", "Correct final diagnosis"), achieved: finalOk, points: finalOk ? round1(W.diagnosis * 0.6) : 0, max: round1(W.diagnosis * 0.6) },
    ];
    const dn = c.answer.differentials.length || 1;
    for (const d of c.answer.differentials) {
      const ok = termMatches(ddxText, d.terms);
      const max = round1((W.diagnosis * 0.3) / dn);
      items.push({ label: `${t("A évoqué", "Considered")} : ${d.name}`, achieved: ok, points: ok ? max : 0, max });
    }
    const justified = ev.justification.trim().length >= 40;
    items.push({ label: t("Argumentation documentée", "Reasoning documented"), achieved: justified, points: justified ? round1(W.diagnosis * 0.1) : 0, max: round1(W.diagnosis * 0.1) });
    categories.push(cat("diagnosis", t("Raisonnement et diagnostic", "Reasoning and diagnosis"), items, W.diagnosis));
  }

  // Management
  {
    const opts = rubric.management.options;
    const essential = opts.filter((o) => o.kind === "essential");
    const appropriate = opts.filter((o) => o.kind === "appropriate");
    const items: ScoreItem[] = [];
    for (const o of essential) {
      const ok = ev.managementActions.includes(o.code);
      const max = round1((W.management * 0.8) / (essential.length || 1));
      items.push({ label: o.label, achieved: ok, points: ok ? max : 0, max, note: o.rationale });
    }
    for (const o of appropriate) {
      const ok = ev.managementActions.includes(o.code);
      const max = round1((W.management * 0.2) / (appropriate.length || 1));
      items.push({ label: o.label, achieved: ok, points: ok ? max : 0, max, note: o.rationale });
    }
    for (const o of opts.filter((x) => x.kind === "contraindicated" && ev.managementActions.includes(x.code))) {
      items.push({ label: `${t("Dangereux", "Dangerous")} : ${o.label}`, achieved: false, points: -round1(W.management * 0.25), max: 0, note: o.rationale });
    }
    categories.push(cat("management", t("Prise en charge", "Management"), items, W.management));
  }

  const total = Math.round(categories.reduce((s, c2) => s + c2.score, 0));
  return { total: clamp(total, 0, 100), categories, durationMinutes: ev.durationMinutes, questionsAsked: ev.questionsAsked };
}

function cat(key: ScoreCategory["key"], label: string, items: ScoreItem[], max: number): ScoreCategory {
  const raw = items.reduce((s, i) => s + i.points, 0);
  return { key, label, items, max, score: round1(clamp(raw, 0, max)) };
}
