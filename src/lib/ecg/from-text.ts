import { stemi, type EcgSpec, type Lead, type Wave } from "./model";

/**
 * Builds a tracing that matches a case's written ECG result (the case text stays the
 * reference). Recognised: rate, AF, flutter, complete block, territorial ST elevation,
 * microvoltage, S1Q3T3 and T-wave inversion in V1–V3.
 */
export function ecgSpecFromText(text: string): EcgSpec {
  const t = text.toLowerCase();
  const rate = Number(t.match(/(\d{2,3})\s*\/\s*min/)?.[1] ?? 75);
  const has = (re: RegExp) => re.test(t);
  const mods: Partial<Record<Lead, Partial<Wave>>> = {};

  let rhythm: EcgSpec["rhythm"] = "sinus";
  if (has(/fibrillation (auriculaire|atriale)|atrial fibrillation/)) rhythm = "af";
  else if (has(/flutter/)) rhythm = "flutter";
  else if (has(/(bav|bloc atrio-ventriculaire) (complet|3)|complete heart block|third-degree/)) rhythm = "chb";
  else if (has(/tachycardie ventriculaire|ventricular tachycardia/)) rhythm = "vt";

  if (has(/sus-d[ée]calage|st elevation/) && !has(/pas de (sus-d[ée]calage|modification)|no (acute )?st (elevation|changes)/)) {
    if (has(/dii, diii,? (et )?avf|\bii, iii,? (and )?avf/)) Object.assign(mods, stemi("inferior", Number(t.match(/(\d)\s*mm/)?.[1] ?? 2.5)));
    else if (has(/v1|v2|v3|ant[ée]rieur|anterior/)) Object.assign(mods, stemi("anterior"));
    else if (has(/lat[ée]ral|lateral|v5|v6|avl/)) Object.assign(mods, stemi("lateral"));
  }
  if (has(/s1q3t3/)) {
    Object.assign(mods, { I: { ...(mods.I ?? {}), s: -0.45 }, III: { ...(mods.III ?? {}), q: -0.28, t: -0.22 } });
  }
  if (has(/t n[ée]gatives? de v1 [àa] v3|t-wave inversion v1[–-]v3/)) {
    for (const L of ["V1", "V2", "V3"] as Lead[]) mods[L] = { ...(mods[L] ?? {}), t: L === "V1" ? -0.25 : -0.35 };
  }
  const peaked = has(/ondes? t (amples? et )?pointues?|tall peaked t/) && !has(/pas d.onde t|no tall peaked t/);

  return {
    rhythm,
    rate: rhythm === "flutter" ? 150 : rate,
    atrialRate: rhythm === "flutter" ? 300 : rhythm === "chb" ? 80 : undefined,
    qrs: rhythm === "chb" || rhythm === "vt" ? 0.15 : undefined,
    pr: has(/bav (du )?(1|premier)|first-degree/) ? 0.28 : undefined,
    voltage: has(/microvoltage|low voltage/) ? 0.45 : undefined,
    tSharp: peaked || undefined,
    mods,
    seed: rate,
  };
}
