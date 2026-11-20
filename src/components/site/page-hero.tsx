import type { ReactNode } from "react";
import { ParallaxPhoto, Reveal } from "@/components/motion";
import type { PhotoKey } from "@/lib/photos";

/** Dark cinematic hero used by every inner public page (keeps the transparent header readable). */
export function PageHero({ eyebrow, title, sub, photo, children, align = "left" }: { eyebrow: ReactNode; title: ReactNode; sub?: ReactNode; photo?: PhotoKey; children?: ReactNode; align?: "left" | "center" }) {
  return (
    <section className="noise relative isolate overflow-hidden bg-navy-950 pb-20 pt-36 text-white sm:pb-28 sm:pt-44">
      {photo && (
        <>
          <ParallaxPhoto photo={photo} className="absolute inset-0 -z-20 opacity-60" overlay={false} priority strength={50} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950 via-navy-950/85 to-navy-950/30" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-transparent to-navy-950/60" />
        </>
      )}
      {!photo && <div className="aurora absolute inset-0 -z-20" />}
      <div className="hero-grid absolute inset-0 -z-10" aria-hidden />
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 ${align === "center" ? "text-center" : ""}`}>
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h1 className={`mt-5 text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl ${align === "center" ? "mx-auto max-w-4xl" : "max-w-4xl"}`}>{title}</h1>
        </Reveal>
        {sub && (
          <Reveal delay={0.2}>
            <p className={`mt-6 text-lg leading-relaxed text-white/70 ${align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>{sub}</p>
          </Reveal>
        )}
        {children && <Reveal delay={0.3}>{children}</Reveal>}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[rgb(var(--bg))]" aria-hidden />
    </section>
  );
}
