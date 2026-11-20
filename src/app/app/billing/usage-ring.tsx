"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/client";

/** Animated ring: simulations used this month vs the plan's limit (∞ when unlimited). */
export function UsageRing({ used, limit }: { used: number; limit: number | null }) {
  const t = useT();
  const C = 2 * Math.PI * 52;
  const ratio = limit ? Math.min(1, used / limit) : 1;
  const warn = limit !== null && used >= limit;
  return (
    <div className="relative mx-auto grid h-44 w-44 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={warn ? "#f59e0b" : "url(#ring)"}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - ratio) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#38e1ff" />
            <stop offset="1" stopColor="#2f86ff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="font-display text-4xl font-bold">
          {used}
          <span className="text-lg text-white/45">/{limit ?? "∞"}</span>
        </p>
        <p className="text-xs text-white/55">{t("simulations ce mois", "simulations this month")}</p>
      </div>
    </div>
  );
}
