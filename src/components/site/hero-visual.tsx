"use client";

import { Activity, Brain, MessageCircle, ShieldCheck } from "@/components/icons";
import { HeartScene } from "@/components/three";
import { Floaty } from "@/components/motion";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[620px]">
      {/* orbit rings */}
      <div className="absolute inset-[6%] rounded-full border border-white/10" aria-hidden />
      <div className="absolute inset-[16%] rounded-full border border-dashed border-teal-300/20 [animation:orbit_60s_linear_infinite]" aria-hidden />
      <div className="absolute inset-[28%] rounded-full bg-[radial-gradient(circle,rgba(225,29,72,0.35),transparent_65%)] blur-2xl" aria-hidden />
      <HeartScene className="absolute inset-0" />

      <Floaty className="absolute left-0 top-[12%] w-[min(230px,48%)]" delay={0.4}>
        <div className="glass rounded-2xl p-3.5 text-white">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-emerald-400" /> DII</span>
            <span className="font-mono text-emerald-300">104 bpm</span>
          </div>
          <svg viewBox="0 0 220 50" className="mt-2 h-10 w-full" aria-hidden>
            <path d="M0 30 h30 l5 -4 l5 4 h8 l4 10 l6 -36 l6 34 l4 -8 h14 l6 -10 l6 10 h30 l5 -4 l5 4 h8 l4 10 l6 -36 l6 34 l4 -8 h14 l6 -10 l6 10 h22" fill="none" stroke="#34D399" strokeWidth="2" strokeLinejoin="round" strokeDasharray="1000" style={{ animation: "ecg 3.5s linear infinite" }} />
          </svg>
          <p className="mt-1 text-[11px] text-white/60">Sus-décalage ST · DII, DIII, aVF</p>
        </div>
      </Floaty>

      <Floaty className="absolute right-0 top-[6%] w-[min(210px,44%)]" delay={0.8} amp={14}>
        <div className="glass flex items-center gap-3 rounded-2xl p-3.5 text-white">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center">
            <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
              <circle cx="28" cy="28" r="23" fill="none" stroke="url(#sg)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 23 * 0.87} 999`} />
              <defs>
                <linearGradient id="sg"><stop offset="0" stopColor="#60A5FA" /><stop offset="1" stopColor="#00B8A9" /></linearGradient>
              </defs>
            </svg>
            <span className="font-display text-lg font-bold">87</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Note de la grille</p>
            <p className="text-sm font-semibold">Très bonne prestation</p>
            <p className="text-[11px] text-teal-300">+12 vs dernière tentative</p>
          </div>
        </div>
      </Floaty>

      <Floaty className="absolute bottom-[14%] left-[2%] w-[min(250px,52%)]" delay={1.2} amp={8}>
        <div className="glass rounded-2xl rounded-bl-md p-3.5 text-white">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60"><MessageCircle className="h-3 w-3" /> Mourad, 58 ans · patient</p>
          <p className="mt-1.5 text-sm leading-snug">« Comme si quelqu&apos;un était assis sur ma poitrine… et ça descend dans le bras gauche. »</p>
        </div>
      </Floaty>

      <Floaty className="absolute bottom-[8%] right-[2%] w-[min(200px,42%)]" delay={1.6} amp={12}>
        <div className="glass space-y-2 rounded-2xl p-3.5 text-white">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60"><Brain className="h-3 w-3 text-brand-300" /> Raisonnement</p>
          {[["SCA ST+ inférieur", 82], ["Dissection aortique", 9], ["Péricardite", 5]].map(([d, p]) => (
            <div key={d as string}>
              <div className="flex justify-between text-[11px]"><span>{d}</span><span className="text-white/60">{p} %</span></div>
              <div className="mt-0.5 h-1 rounded-full bg-white/10"><div className="h-1 rounded-full bg-gradient-to-r from-brand-400 to-teal-300" style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </div>
      </Floaty>

      <div className="absolute inset-x-0 top-[-2%] flex justify-center">
        <Floaty delay={2} amp={6}>
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-white">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-300" /> Réponses verrouillées sur le cas · patient fictif
          </span>
        </Floaty>
      </div>
    </div>
  );
}
