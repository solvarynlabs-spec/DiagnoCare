import type { ReactNode } from "react";
import { CountUp, Photo, Reveal } from "@/components/motion";
import type { PhotoKey } from "@/lib/photos";

/** Cinematic banner at the top of role dashboards. */
export function WelcomeBanner({ photo, eyebrow, title, sub, actions, stat }: { photo: PhotoKey; eyebrow: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode; stat?: { label: string; value: number } }) {
  return (
    <Reveal className="mb-6">
      <div className="noise relative isolate overflow-hidden rounded-[2rem] bg-navy-950 text-white shadow-lift">
        <Photo photo={photo} className="absolute inset-0 -z-20 opacity-55" priority sizes="(max-width:1024px) 100vw, 1100px" w={1800} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/20" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-teal-500/30 blur-3xl" aria-hidden />
        <div className="hero-grid absolute inset-0 -z-10 opacity-60" aria-hidden />
        <div className="flex flex-wrap items-end justify-between gap-6 p-7 sm:p-10">
          <div className="max-w-xl">
            <span className="eyebrow">{eyebrow}</span>
            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
            {sub && <p className="mt-2 text-white/70">{sub}</p>}
            {actions && <div className="mt-6 flex flex-wrap gap-3">{actions}</div>}
          </div>
          {stat && (
            <div className="glass rounded-2xl px-6 py-4 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">{stat.label}</p>
              <p className="font-display text-5xl font-bold"><CountUp to={stat.value} /></p>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  );
}
