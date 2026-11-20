import { examByCode, investigationByCode, localizeExam, localizeInvestigation } from "@/lib/catalog";
import { localizeCaseContent } from "@/lib/cases/i18n";
import type { UiLang } from "@/lib/i18n/shared";
import type { CaseContent } from "./types";

/**
 * Name and result of one examination / investigation for a case, in a given language.
 * The DB keeps the French text (canonical); screens re-derive it by code so a session
 * reads correctly whichever language the interface is in.
 */
export function examText(content: CaseContent, slug: string, kind: "PHYSICAL" | "INVESTIGATION", code: string, lang: UiLang): { name: string; result: string; abnormal: boolean } | null {
  const c = localizeCaseContent(content, slug, lang);
  if (kind === "PHYSICAL") {
    const raw = examByCode(code);
    if (!raw) return null;
    const item = localizeExam(raw, lang);
    const f = c.exam[code];
    if (code === "bp_manual" && !f) {
      // Manual cuff reading: taken from the case's own vitals so it matches the monitor.
      const { sbp, dbp } = c.vitals;
      return {
        name: item.name,
        result: lang === "en" ? `BP ${sbp}/${dbp} mmHg by cuff, both arms, no asymmetry.` : `PA ${sbp}/${dbp} mmHg au brassard, aux deux bras, sans asymétrie.`,
        abnormal: sbp >= 140 || dbp >= 90 || sbp < 90,
      };
    }
    return { name: item.name, result: f?.finding ?? item.normal, abnormal: f?.abnormal ?? false };
  }
  const raw = investigationByCode(code);
  if (!raw) return null;
  const item = localizeInvestigation(raw, lang);
  const r = c.investigations[code];
  return { name: item.name, result: r?.result ?? item.normal, abnormal: r?.abnormal ?? false };
}

/** Re-localize stored exam rows for display. */
export function localizeExamRows<R extends { code: string; kind: string; name: string; result: string }>(rows: R[], content: CaseContent, slug: string, lang: UiLang): R[] {
  if (lang === "fr") return rows;
  return rows.map((r) => {
    const x = examText(content, slug, r.kind === "INVESTIGATION" ? "INVESTIGATION" : "PHYSICAL", r.code, lang);
    return x ? { ...r, name: x.name, result: x.result } : r;
  });
}
