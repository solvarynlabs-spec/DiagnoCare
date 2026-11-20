"use client";

import type { Emotion } from "@/lib/sim/types";

export interface AvatarConfig {
  skin: string;
  hair: string;
  hairStyle: "short" | "long" | "bald" | "child";
  accessory?: "glasses" | "none";
}

/**
 * Avatar renderer contract. This 2D SVG renderer is the default. A 3D renderer
 * (e.g. three.js / react-three-fiber with a rigged glTF head and blendshapes for
 * each Emotion, lip-sync driven by `speaking`) can implement the same props and be
 * swapped in via `AVATAR_RENDERER` without touching the consultation room.
 */
export interface AvatarRendererProps {
  config: AvatarConfig;
  emotion: Emotion;
  speaking: boolean;
  age: number;
  sex: "F" | "M";
}

const BROWS: Record<Emotion, string> = {
  neutral: "M84 92 q12 -5 24 0 M132 92 q12 -5 24 0",
  anxious: "M84 90 q12 -9 24 -2 M132 88 q12 -7 24 2",
  pain: "M84 86 q14 8 24 4 M132 90 q10 4 24 -4",
  distressed: "M84 88 q12 -8 24 2 M132 90 q12 -10 24 -2",
  tired: "M84 94 q12 -2 24 2 M132 96 q12 -4 24 -2",
  relieved: "M84 90 q12 -7 24 -2 M132 88 q12 -5 24 2",
  irritated: "M84 86 q14 6 24 8 M132 94 q10 -4 24 -8",
};
const MOUTH: Record<Emotion, string> = {
  neutral: "M106 152 q14 4 28 0",
  anxious: "M106 154 q14 -4 28 0",
  pain: "M104 152 q16 -8 32 0 q-16 6 -32 0",
  distressed: "M106 156 q14 -8 28 0",
  tired: "M108 154 q12 1 24 0",
  relieved: "M104 150 q16 10 32 0",
  irritated: "M106 154 q14 -2 28 2",
};

export function PatientAvatar({ config, emotion, speaking, age, sex }: AvatarRendererProps) {
  const older = age >= 60;
  const child = config.hairStyle === "child" || age < 12;
  const eyeOpen = emotion === "tired" ? 2 : emotion === "pain" ? 1.6 : 4;
  const sweat = emotion === "pain" || emotion === "distressed";
  return (
    <svg viewBox="0 0 240 260" className="h-full w-full" role="img" aria-label={`Patient virtuel, semble ${emotion}`}>
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#00B8A9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="gown" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#7FB6E8" />
          <stop offset="100%" stopColor="#4F8FCF" />
        </linearGradient>
        <linearGradient id="skinShade" x1="0" x2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <rect width="240" height="260" fill="url(#bgGlow)" />
      <g className="origin-bottom animate-breathe" style={{ transformBox: "fill-box" }}>
        {/* shoulders / gown */}
        <path d={child ? "M60 260 q8 -52 60 -58 q52 6 60 58 z" : "M30 260 q10 -62 90 -70 q80 8 90 70 z"} fill="url(#gown)" />
        <path d={child ? "M104 204 l16 18 l16 -18" : "M100 192 l20 22 l20 -22"} fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
        {/* neck */}
        <rect x={child ? 108 : 104} y={child ? 168 : 160} width={child ? 24 : 32} height="34" rx="10" fill={config.skin} />
        {/* back hair */}
        {config.hairStyle === "long" && <path d="M70 100 q-6 70 18 92 h64 q24 -22 18 -92 z" fill={config.hair} />}
        {/* head */}
        <ellipse cx="120" cy="116" rx={child ? 46 : 50} ry={child ? 54 : 60} fill={config.skin} />
        <ellipse cx="120" cy="116" rx={child ? 46 : 50} ry={child ? 54 : 60} fill="url(#skinShade)" />
        {/* ears */}
        <ellipse cx={child ? 74 : 70} cy="122" rx="7" ry="11" fill={config.skin} />
        <ellipse cx={child ? 166 : 170} cy="122" rx="7" ry="11" fill={config.skin} />
        {/* hair */}
        {config.hairStyle === "short" && <path d="M70 108 q0 -60 50 -62 q52 2 50 62 q-6 -30 -22 -36 q-30 10 -62 2 q-12 10 -16 34 z" fill={config.hair} />}
        {config.hairStyle === "long" && <path d="M68 116 q-2 -70 52 -70 q54 0 52 70 q-10 -40 -52 -44 q-42 4 -52 44 z" fill={config.hair} />}
        {config.hairStyle === "child" && <path d="M76 104 q4 -52 44 -52 q40 0 44 52 q-14 -24 -44 -26 q-30 2 -44 26 z" fill={config.hair} />}
        {config.hairStyle === "bald" && <path d="M72 112 q2 -12 6 -18 M168 112 q-2 -12 -6 -18" stroke={config.hair} strokeWidth="6" strokeLinecap="round" />}
        {/* brows */}
        <path d={BROWS[emotion]} fill="none" stroke={config.hairStyle === "bald" ? "#555" : config.hair} strokeWidth="4" strokeLinecap="round" />
        {/* eyes */}
        <g className="[animation:blink_5s_infinite]">
          <ellipse cx="96" cy="108" rx="6" ry={eyeOpen} fill="#1b2433" />
          <ellipse cx="144" cy="108" rx="6" ry={eyeOpen} fill="#1b2433" />
        </g>
        {(emotion === "tired" || older) && (
          <path d="M88 118 q8 4 16 0 M136 118 q8 4 16 0" fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="2" />
        )}
        {older && <path d="M92 76 q28 -6 56 0 M96 84 q24 -4 48 0" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="2" />}
        {config.accessory === "glasses" && (
          <g fill="none" stroke="#2b3445" strokeWidth="2.5">
            <rect x="80" y="98" width="32" height="22" rx="8" />
            <rect x="128" y="98" width="32" height="22" rx="8" />
            <path d="M112 108 h16" />
          </g>
        )}
        {/* nose */}
        <path d="M120 112 q-6 18 0 22 q4 2 8 -1" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2.5" strokeLinecap="round" />
        {/* cheeks */}
        {(emotion === "distressed" || child) && <g fill="#ff6b6b" fillOpacity="0.18"><circle cx="90" cy="134" r="9" /><circle cx="150" cy="134" r="9" /></g>}
        {emotion === "pain" && <g fill="#ffffff" fillOpacity="0.0" />}
        {/* mouth */}
        <path d={speaking ? "M106 150 q14 14 28 0 q-14 4 -28 0" : MOUTH[emotion]} fill={speaking || emotion === "pain" ? "#7a2e2e" : "none"} stroke="#7a2e2e" strokeWidth="3" strokeLinecap="round" className={speaking ? "[animation:talk_.28s_ease-in-out_infinite_alternate]" : ""} style={{ transformOrigin: "120px 152px" }} />
        {sex === "M" && !child && age > 40 && <path d="M90 150 q30 34 60 0" fill="none" stroke="#000" strokeOpacity="0.05" strokeWidth="10" />}
        {/* sweat */}
        {sweat && (
          <g fill="#9fd3ff">
            <path d="M74 92 q4 8 0 12 q-4 -4 0 -12" />
            <path d="M162 84 q4 8 0 12 q-4 -4 0 -12" />
          </g>
        )}
      </g>
      <style>{`@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}} g[class*="blink"]{transform-origin:120px 108px} @keyframes talk{from{transform:scaleY(.5)}to{transform:scaleY(1.1)}}`}</style>
    </svg>
  );
}

export const AVATAR_RENDERER = PatientAvatar;
