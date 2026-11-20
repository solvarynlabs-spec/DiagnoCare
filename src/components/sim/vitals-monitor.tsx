"use client";

import { useEffect, useMemo, useState } from "react";
import type { Vitals } from "@/lib/sim/types";
import { useT } from "@/lib/i18n/client";

/**
 * Simulated bedside monitor. Values come from the case's baseline vitals plus its
 * per-minute trend (e.g. deterioration while untreated) and small physiological jitter.
 */
export function VitalsMonitor({ vitals, startedAt, compact }: { vitals: Vitals; startedAt: string; compact?: boolean }) {
  const t = useT();
  // null until mounted, so server and client render identical baseline values.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(t);
  }, []);

  const v = useMemo(() => {
    const mins = now === null ? 0 : Math.max(0, Math.min(60, (now - new Date(startedAt).getTime()) / 60000));
    const j = (amp: number, seed: number) => (now === null ? 0 : Math.sin(now / 1700 + seed) * amp);
    const tr = vitals.trend ?? {};
    return {
      hr: Math.round(vitals.hr + (tr.hr ?? 0) * mins + j(2, 1)),
      sbp: Math.round(vitals.sbp + (tr.sbp ?? 0) * mins + j(2, 2)),
      dbp: Math.round(vitals.dbp + ((tr.sbp ?? 0) * mins) / 2 + j(1, 3)),
      rr: Math.round(vitals.rr + (tr.rr ?? 0) * mins + j(1, 4)),
      spo2: Math.min(100, Math.round(vitals.spo2 + (tr.spo2 ?? 0) * mins + j(0.6, 5))),
      temp: (vitals.temp + (tr.temp ?? 0) * mins).toFixed(1),
    };
  }, [now, vitals, startedAt]);

  const abn = {
    hr: v.hr > 100 || v.hr < 50,
    bp: v.sbp > 160 || v.sbp < 95,
    rr: v.rr > 22 || v.rr < 10,
    spo2: v.spo2 < 94,
    temp: Number(v.temp) >= 38 || Number(v.temp) < 35.5,
  };
  const beat = Math.max(0.35, 60 / Math.max(30, v.hr));

  const Cell = ({ label, value, unit, color, alarm }: { label: string; value: React.ReactNode; unit: string; color: string; alarm?: boolean }) => (
    <div className={`rounded-lg px-2.5 py-1.5 ${alarm ? "bg-red-500/15 ring-1 ring-red-500/50" : "bg-white/[0.03]"}`}>
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
        <span>{label}</span>
        {alarm && <span className="text-red-400">!</span>}
      </div>
      <div className="font-mono text-xl font-bold leading-tight" style={{ color }}>
        {value}
        <span className="ml-1 text-[10px] font-medium opacity-70">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-navy-700 bg-navy-950 p-3 text-white shadow-lift">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> {t("Moniteur · simulé", "Monitor · simulated")}
        </span>
        <span className="font-mono">{now === null ? "--:--" : new Date(now).toLocaleTimeString("fr-DZ", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      {!compact && (
        <svg viewBox="0 0 300 50" className="mb-2 h-10 w-full" aria-hidden>
          <path
            d="M0 25 h40 l6 -4 l6 4 h10 l4 10 l6 -34 l6 32 l4 -8 h20 l8 -6 l8 6 h40 l6 -4 l6 4 h10 l4 10 l6 -34 l6 32 l4 -8 h20 l8 -6 l8 6 h56"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="600"
            style={{ animation: `pulseline ${beat * 2.2}s linear infinite` }}
          />
        </svg>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        <Cell label={t("FC", "HR")} value={v.hr} unit="bpm" color="#34D399" alarm={abn.hr} />
        <Cell label={t("PNI", "NIBP")} value={`${v.sbp}/${v.dbp}`} unit="mmHg" color="#F87171" alarm={abn.bp} />
        <Cell label="SpO₂" value={v.spo2} unit="%" color="#38BDF8" alarm={abn.spo2} />
        <Cell label={t("FR", "RR")} value={v.rr} unit="/min" color="#FBBF24" alarm={abn.rr} />
        <Cell label="Temp" value={v.temp} unit="°C" color="#E5E7EB" alarm={abn.temp} />
        <Cell label={t("EVA", "Pain")} value={"—"} unit={t("à demander", "ask")} color="#C4B5FD" />
      </div>
    </div>
  );
}
