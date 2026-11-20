"use client";

import { useMemo, useRef, useState } from "react";
import { build, LEADS, voltage, type EcgSpec, type Lead } from "@/lib/ecg/model";
import { useT } from "@/lib/i18n/client";

/**
 * 12-lead ECG on standard paper: 25 mm/s, 10 mm/mV, 3×4 layout (2.5 s per lead, simultaneous)
 * plus a 10 s DII rhythm strip. Optional calipers: click two points to measure an interval.
 */

const MM = 4; // px per mm
const SPEED = 25; // mm/s
const GAIN = 10; // mm/mV
const ROW_H = 30; // mm
const CAL_W = 6; // mm reserved for the calibration pulse
const LAYOUT: Lead[][] = [
  ["I", "aVR", "V1", "V4"],
  ["II", "aVL", "V2", "V5"],
  ["III", "aVF", "V3", "V6"],
];

function path(spec: ReturnType<typeof build>, lead: Lead, t0: number, t1: number, x0: number, y0: number) {
  const step = 0.002;
  let d = "";
  for (let t = t0; t <= t1 + 1e-9; t += step) {
    const x = x0 + (t - t0) * SPEED * MM;
    const y = y0 - voltage(spec, lead, t) * GAIN * MM;
    d += `${d ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const calib = (x: number, y: number) => `M${x} ${y} h${MM} v${-GAIN * MM} h${MM * 2.5} v${GAIN * MM} h${MM}`;

export function EcgPaper({ spec, calipers = true, rhythmStrip = true, className = "" }: { spec: EcgSpec; calipers?: boolean; rhythmStrip?: boolean; className?: string }) {
  const t = useT();
  const built = useMemo(() => build(spec), [spec]);
  const rows = rhythmStrip ? 4 : 3;
  const W = (CAL_W + 10 * SPEED) * MM;
  const H = rows * ROW_H * MM + 8;
  const traces = useMemo(() => {
    const out: { d: string; label: string; lx: number; ly: number }[] = [];
    LAYOUT.forEach((row, r) => {
      const y0 = (r * ROW_H + ROW_H * 0.6) * MM;
      row.forEach((lead, c) => {
        const t0 = c * 2.5;
        const x0 = (CAL_W + c * 2.5 * SPEED) * MM;
        out.push({ d: path(built, lead, t0 + 0.0, t0 + 2.5, x0, y0), label: lead, lx: x0 + 6, ly: (r * ROW_H + 5) * MM });
      });
    });
    if (rhythmStrip) {
      const y0 = (3 * ROW_H + ROW_H * 0.6) * MM;
      out.push({ d: path(built, "II", 0, 10, CAL_W * MM, y0), label: "II", lx: CAL_W * MM + 6, ly: (3 * ROW_H + 5) * MM });
    }
    return out;
  }, [built, rhythmStrip]);

  const ref = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState<number[]>([]);
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!calipers) return;
    const r = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    setPts((p) => (p.length >= 2 ? [x] : [...p, x]));
  };
  const dtMs = pts.length === 2 ? (Math.abs(pts[1] - pts[0]) / MM / SPEED) * 1000 : null;

  return (
    <div className={className}>
      <div className="overflow-x-auto rounded-xl border border-black/10 bg-[#fff7f5] shadow-inner">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={`block w-full min-w-[720px] ${calipers ? "cursor-crosshair" : ""}`} onClick={onClick} role="img" aria-label={t("Tracé ECG 12 dérivations", "12-lead ECG tracing")}>
          <defs>
            <pattern id="ecg-small" width={MM} height={MM} patternUnits="userSpaceOnUse">
              <path d={`M ${MM} 0 L 0 0 0 ${MM}`} fill="none" stroke="#f3c2bd" strokeWidth="0.5" />
            </pattern>
            <pattern id="ecg-big" width={MM * 5} height={MM * 5} patternUnits="userSpaceOnUse">
              <rect width={MM * 5} height={MM * 5} fill="url(#ecg-small)" />
              <path d={`M ${MM * 5} 0 L 0 0 0 ${MM * 5}`} fill="none" stroke="#e48f86" strokeWidth="0.9" />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#ecg-big)" />
          {Array.from({ length: rows }, (_, r) => (
            <path key={r} d={calib(2, (r * ROW_H + ROW_H * 0.6) * MM)} fill="none" stroke="#111" strokeWidth="1.3" />
          ))}
          {/* lead separators */}
          {[1, 2, 3].map((c) => (
            <line key={c} x1={(CAL_W + c * 2.5 * SPEED) * MM} x2={(CAL_W + c * 2.5 * SPEED) * MM} y1={0} y2={3 * ROW_H * MM} stroke="#111" strokeWidth="1" opacity="0.5" />
          ))}
          {traces.map((tr, k) => (
            <g key={k}>
              <path d={tr.d} fill="none" stroke="#141414" strokeWidth="1.25" strokeLinejoin="round" />
              <text x={tr.lx} y={tr.ly} fontSize="13" fontWeight="700" fill="#141414">{tr.label}</text>
            </g>
          ))}
          <text x={W - 6} y={H - 6} textAnchor="end" fontSize="10" fill="#7a4a44">25 mm/s · 10 mm/mV</text>
          {/* calipers */}
          {pts.map((x, k) => (
            <line key={k} x1={x} x2={x} y1={0} y2={H} stroke="#1f6fe0" strokeWidth="1.5" strokeDasharray="5 4" />
          ))}
          {pts.length === 2 && dtMs !== null && (
            <g>
              <line x1={Math.min(...pts)} x2={Math.max(...pts)} y1={14} y2={14} stroke="#1f6fe0" strokeWidth="2" />
              <rect x={(pts[0] + pts[1]) / 2 - 78} y={20} width={156} height={24} rx={6} fill="#1f6fe0" />
              <text x={(pts[0] + pts[1]) / 2} y={36} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                {Math.round(dtMs)} ms · {Math.round(60000 / dtMs)} /min
              </text>
            </g>
          )}
        </svg>
      </div>
      {calipers && (
        <p className="mt-2 text-xs text-white/55">
          {t("Compas : cliquez deux points du tracé pour mesurer un intervalle (1 petit carreau = 40 ms, 1 grand = 200 ms).", "Calipers: click two points on the tracing to measure an interval (1 small square = 40 ms, 1 large = 200 ms).")}{" "}
          {pts.length > 0 && <button className="text-[#6fb1ff] hover:underline" onClick={() => setPts([])}>{t("Effacer", "Clear")}</button>}
        </p>
      )}
    </div>
  );
}
