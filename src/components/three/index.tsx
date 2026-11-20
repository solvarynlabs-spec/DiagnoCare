"use client";

import dynamic from "next/dynamic";

const Glow = () => (
  <div className="absolute inset-0 grid place-items-center" aria-hidden>
    <div className="h-48 w-48 animate-pulse rounded-full bg-gradient-to-br from-rose-500/30 via-brand-500/20 to-teal-500/30 blur-3xl" />
  </div>
);

/** 3D scenes are client-only and lazy-loaded so they never block first paint. */
export const HeartScene = dynamic(() => import("./heart-scene"), { ssr: false, loading: Glow });
export const DnaScene = dynamic(() => import("./dna-scene"), { ssr: false, loading: Glow });
