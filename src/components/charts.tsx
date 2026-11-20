"use client";

import { useT } from "@/lib/i18n/client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { fontSize: 11, fill: "rgb(var(--ink-3))" };
const tooltipStyle = { background: "rgb(var(--panel))", border: "1px solid rgb(var(--line))", borderRadius: 12, fontSize: 12, color: "rgb(var(--ink))" };

export function TrendChart({ data, height = 220 }: { data: { week: string; avg: number | null; count?: number }[]; height?: number }) {
  const t = useT();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
        <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}/100`, t("Note moyenne", "Average score")]} />
        <Line type="monotone" dataKey="avg" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: "#2563EB" }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SkillRadar({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  const t = useT();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="62%">
        <PolarGrid stroke="rgb(var(--line))" />
        <PolarAngleAxis dataKey="label" tick={AXIS} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} %`, t("Atteint", "Achieved")]} />
        <Radar dataKey="value" stroke="#00B8A9" fill="#00B8A9" fillOpacity={0.25} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({ data, height = 240, unit = "" }: { data: { label: string; value: number }[]; height?: number; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="rgb(var(--line))" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(37,99,235,0.06)" }} formatter={(v) => [`${v}${unit}`, ""]} />
        <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}
