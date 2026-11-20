"use client";

import Image from "next/image";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PHOTOS, PHOTO_ALT_EN, photoUrl, type PhotoKey } from "@/lib/photos";
import { useLang } from "@/lib/i18n/client";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Default to `relative` unless the caller positions the element itself (avoids class conflicts). */
const pos = (c: string) => (/\b(absolute|fixed|sticky)\b/.test(c) ? "" : "relative");

export function Reveal({ children, delay = 0, y = 14, className = "", as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "section" | "li" }) {
  const reduce = useReducedMotion();
  const M = motion[as];
  return (
    <M className={className} initial={reduce ? false : { opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.5, delay: Math.min(delay, 0.2), ease: EASE }}>
      {children}
    </M>
  );
}

export function Stagger({ children, className = "", gap = 0.08 }: { children: ReactNode; className?: string; gap?: number }) {
  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } }}>
      {children}
    </motion.div>
  );
}

export function CountUp({ to, suffix = "", decimals = 0, className = "" }: { to: number; suffix?: string; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 2, ease: EASE, onUpdate: setV });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Plain container (the former 3D tilt effect was removed for a more sober design). */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string; intensity?: number }) {
  return <div className={className}>{children}</div>;
}

export function WordRotator({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className={`relative inline-grid ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={words[i]} className="col-start-1 row-start-1" initial={{ y: "40%", opacity: 0, filter: "blur(8px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: "-40%", opacity: 0, filter: "blur(8px)" }} transition={{ duration: 0.4, ease: EASE }}>
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Marquee({ children, reverse = false, speed = 40 }: { children: ReactNode; reverse?: boolean; speed?: number }) {
  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      {[0, 1].map((k) => (
        <div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center gap-10 pr-10 group-hover:[animation-play-state:paused]" style={{ animation: `marquee ${speed}s linear infinite ${reverse ? "reverse" : ""}` }}>
          {children}
        </div>
      ))}
    </div>
  );
}

/** Photo with subtle scroll parallax and optional overlay. */
export function ParallaxPhoto({ photo, className = "", sizes = "100vw", priority, overlay = true, strength = 60 }: { photo: PhotoKey; className?: string; sizes?: string; priority?: boolean; overlay?: boolean; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  return (
    <div ref={ref} className={`${pos(className)} overflow-hidden ${className}`}>
      <motion.div className="absolute -inset-y-[80px] inset-x-0" style={{ y }}>
        <Image src={photoUrl(photo, 2000)} alt={useLang() === "en" ? PHOTO_ALT_EN[photo] : PHOTOS[photo].alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </motion.div>
      {overlay && <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent" />}
    </div>
  );
}

export function Photo({ photo, className = "", sizes = "(max-width: 768px) 100vw, 50vw", priority, w = 1200 }: { photo: PhotoKey; className?: string; sizes?: string; priority?: boolean; w?: number }) {
  return (
    <div className={`${pos(className)} overflow-hidden ${className}`}>
      <Image src={photoUrl(photo, w)} alt={useLang() === "en" ? PHOTO_ALT_EN[photo] : PHOTOS[photo].alt} fill sizes={sizes} priority={priority} className="object-cover transition duration-[1.2s] ease-out group-hover:scale-110" />
    </div>
  );
}

/** Floating element with gentle bob; used for glass UI cards around 3D scenes. */
export function Floaty({ children, className = "", delay = 0, amp = 10 }: { children: ReactNode; className?: string; delay?: number; amp?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={reduce ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, scale: 1, y: [0, -amp, 0] }} transition={reduce ? { duration: 0.6 } : { opacity: { duration: 0.8, delay }, scale: { duration: 0.8, delay }, y: { duration: 5 + delay, repeat: Infinity, ease: "easeInOut", delay } }}>
      {children}
    </motion.div>
  );
}

/** Thin progress bar showing page scroll position. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-500 via-teal-400 to-rose-400" style={{ scaleX }} />;
}

/** Section wrapper with a soft spotlight that follows the cursor. */
export function SpotlightSection({ children, className = "", color = "0,184,169" }: { children: ReactNode; className?: string; color?: string }) {
  const x = useMotionValue(-800);
  const y = useMotionValue(-800);
  const bg = useTransform([x, y], ([a, b]) => `radial-gradient(650px circle at ${a}px ${b}px, rgba(${color},0.14), transparent 45%)`);
  return (
    <section
      className={`relative ${className}`}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
    >
      <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ background: bg }} />
      {children}
    </section>
  );
}
