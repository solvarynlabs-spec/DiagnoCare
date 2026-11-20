/**
 * Synthetic 12-lead ECG model (educational, deterministic).
 * Each beat is a sum of Gaussian waves (P, Q, R, S, T) plus a smooth ST plateau, per lead.
 * A rhythm sequencer places atrial and ventricular events (sinus, AF, flutter, complete
 * heart block, VT). Output: millivolts as a function of time for any lead.
 */

export const LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"] as const;
export type Lead = (typeof LEADS)[number];

export interface Wave {
  p: number; // mV
  q: number;
  r: number;
  s: number;
  t: number;
  st: number; // ST segment offset (mV)
  pr: number; // PR segment offset (mV), e.g. pericarditis
  f: number; // flutter wave amplitude (mV)
}

const N = (p: number, q: number, r: number, s: number, t: number): Wave => ({ p, q, r, s, t, st: 0, pr: 0, f: 0 });

/** Normal adult morphology, axis ≈ +60°. */
export const NORMAL: Record<Lead, Wave> = {
  I: N(0.1, -0.05, 0.75, -0.12, 0.25),
  II: N(0.15, -0.05, 1.2, -0.15, 0.32),
  III: N(0.05, -0.06, 0.5, -0.1, 0.1),
  aVR: N(-0.12, 0.05, -0.08, -0.85, -0.25),
  aVL: N(0.04, -0.05, 0.35, -0.12, 0.12),
  aVF: N(0.1, -0.05, 0.85, -0.12, 0.22),
  V1: N(0.07, 0, 0.22, -1.0, 0.08),
  V2: N(0.08, 0, 0.45, -1.35, 0.42),
  V3: N(0.08, -0.03, 0.8, -0.85, 0.45),
  V4: N(0.08, -0.06, 1.25, -0.45, 0.42),
  V5: N(0.08, -0.08, 1.3, -0.22, 0.35),
  V6: N(0.08, -0.08, 1.0, -0.12, 0.3),
};

export type Rhythm = "sinus" | "af" | "flutter" | "chb" | "vt";

export interface EcgSpec {
  rhythm: Rhythm;
  rate: number; // ventricular rate (bpm)
  atrialRate?: number; // CHB: P rate; flutter: 300
  pr?: number; // s
  qrs?: number; // s (≈0.09 normal)
  qtScale?: number;
  tSharp?: boolean; // hyperkalaemia
  voltage?: number; // global amplitude multiplier (microvoltage < 1)
  mods?: Partial<Record<Lead, Partial<Wave>>>;
  /** Multiply amplitudes instead of replacing them. */
  scale?: Partial<Record<Lead, Partial<Wave>>>;
  seed?: number;
}

const g = (x: number, mu: number, sd: number) => Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
const sig = (x: number) => 1 / (1 + Math.exp(-x));

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export interface Beat {
  t: number; // R peak time
  p: number | null; // P wave centre (null = no conducted P)
}

export interface Built {
  waves: Record<Lead, Wave>;
  beats: Beat[];
  pOnly: number[]; // non-conducted P waves (CHB)
  spec: EcgSpec;
  rand: () => number;
  afPhase: number[];
}

export function build(spec: EcgSpec, duration = 10.5): Built {
  const rand = rng(spec.seed ?? 7);
  const waves = {} as Record<Lead, Wave>;
  for (const L of LEADS) {
    const w = { ...NORMAL[L] };
    const sc = spec.scale?.[L];
    if (sc) for (const k of Object.keys(sc) as (keyof Wave)[]) w[k] *= sc[k]!;
    Object.assign(w, spec.mods?.[L] ?? {});
    waves[L] = w;
  }
  const beats: Beat[] = [];
  const pOnly: number[] = [];
  const rr = 60 / spec.rate;
  const pr = spec.pr ?? 0.16;

  if (spec.rhythm === "sinus" || spec.rhythm === "flutter") {
    for (let t = 0.35 + rand() * 0.2; t < duration; t += rr * (1 + (rand() - 0.5) * 0.03)) beats.push({ t, p: spec.rhythm === "sinus" ? t - pr + 0.03 : null });
  } else if (spec.rhythm === "af") {
    for (let t = 0.3; t < duration; t += rr * (0.62 + rand() * 0.76)) beats.push({ t, p: null });
  } else if (spec.rhythm === "vt") {
    for (let t = 0.3; t < duration; t += rr) beats.push({ t, p: null });
  } else if (spec.rhythm === "chb") {
    for (let t = 0.6; t < duration; t += rr) beats.push({ t, p: null });
    const pp = 60 / (spec.atrialRate ?? 80);
    for (let t = 0.15; t < duration; t += pp) pOnly.push(t);
  }
  const afPhase = Array.from({ length: 4 }, () => rand() * Math.PI * 2);
  return { waves, beats, pOnly, spec, rand, afPhase };
}

/** Voltage (mV) of one lead at time t. */
export function voltage(b: Built, lead: Lead, t: number): number {
  const w = b.waves[lead];
  const s = b.spec;
  const qw = (s.qrs ?? 0.09) / 0.09;
  const wide = qw > 1.25;
  let v = 0;

  for (const beat of b.beats) {
    const dt = t - beat.t;
    if (dt < -0.45 || dt > 0.75) continue;
    const rr = 60 / s.rate;
    const qt = Math.min(0.42, 0.36 * Math.sqrt(Math.max(0.3, rr))) * (s.qtScale ?? 1);
    if (beat.p !== null) {
      v += w.p * g(t, beat.p, 0.022);
      // PR segment offset (between P end and QRS onset)
      if (w.pr) v += w.pr * sig((t - (beat.p + 0.04)) / 0.008) * sig((beat.t - 0.03 * qw - t) / 0.006);
    }
    // QRS
    if (wide) {
      // Broad, monophasic-looking complexes (bundle branch / ventricular origin)
      v += w.q * g(dt, -0.04 * qw, 0.012 * qw) + w.r * g(dt, -0.005 * qw, 0.022 * qw) + w.s * g(dt, 0.035 * qw, 0.02 * qw);
    } else {
      v += w.q * g(dt, -0.028, 0.008) + w.r * g(dt, 0, 0.0105 * qw) + w.s * g(dt, 0.026 * qw, 0.0095 * qw);
    }
    // ST plateau, then T
    const jEnd = 0.045 * qw;
    const tC = qt - 0.08;
    if (w.st) v += w.st * sig((dt - jEnd) / 0.006) * (1 - sig((dt - (tC + 0.02)) / 0.03));
    v += w.t * (s.tSharp ? g(dt, tC - 0.02, 0.028) : g(dt, tC, 0.048));
  }
  for (const p of b.pOnly) v += w.p * g(t, p, 0.022);

  if (s.rhythm === "af") {
    const amp = Math.abs(w.p) * 0.45 + 0.02;
    v += amp * (Math.sin(2 * Math.PI * 6.3 * t + b.afPhase[0]) * 0.6 + Math.sin(2 * Math.PI * 8.1 * t + b.afPhase[1]) * 0.4);
  }
  if (s.rhythm === "flutter") {
    const fr = (s.atrialRate ?? 300) / 60;
    const ph = (t * fr) % 1;
    const saw = ph < 0.8 ? -(ph / 0.8) : -1 + (ph - 0.8) / 0.2; // slow descent, fast return
    v += (w.f || w.p * 1.4) * (saw + 0.5);
  }
  // Baseline wander + tiny noise
  v += 0.025 * Math.sin(2 * Math.PI * 0.27 * t + (LEADS.indexOf(lead) * 0.7));
  return v * (s.voltage ?? 1);
}

/** Mirror helper: ST elevation in a territory with reciprocal depression. */
export function stemi(territory: "inferior" | "anterior" | "lateral", mm = 2.5): Partial<Record<Lead, Partial<Wave>>> {
  const e = mm / 10;
  if (territory === "inferior")
    return { II: { st: e, t: 0.45 }, III: { st: e * 1.2, t: 0.4, q: -0.25 }, aVF: { st: e * 1.1, t: 0.42, q: -0.2 }, I: { st: -e * 0.5, t: 0.05 }, aVL: { st: -e * 0.8, t: -0.05 }, V2: { st: -e * 0.3 } };
  if (territory === "anterior")
    return { V1: { st: e * 0.8, t: 0.4 }, V2: { st: e * 1.3, t: 0.7, r: 0.15 }, V3: { st: e * 1.4, t: 0.75, r: 0.3 }, V4: { st: e * 1.1, t: 0.6 }, V5: { st: e * 0.6 }, I: { st: e * 0.35 }, aVL: { st: e * 0.45 }, III: { st: -e * 0.5 }, aVF: { st: -e * 0.35 } };
  return { I: { st: e * 0.9 }, aVL: { st: e }, V5: { st: e * 0.8 }, V6: { st: e * 0.8 }, III: { st: -e * 0.6 }, aVF: { st: -e * 0.4 } };
}
