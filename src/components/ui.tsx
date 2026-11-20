import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Tr } from "./tr";

/**
 * DiagnoCare mark: a speech-bubble "D" holding a patient profile and a diagnostic target.
 * Raster crop of the brand logo (public/brand/diagnocare-logo.webp) on its navy tile.
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/diagnocare-mark.png" alt="" aria-hidden width={512} height={512} className={clsx("shrink-0 rounded-[22%] bg-[#020a2c] object-cover", className)} />
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5 font-display text-[1.35rem] font-bold tracking-[-0.03em]", className)}>
      <LogoMark />
      <span className={light ? "text-white" : ""}>
        Diagno<span className={light ? "text-[#22e5f2]" : "text-[#0bb8d6]"}>Care</span>
      </span>
    </span>
  );
}

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("panel p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action, sub }: { children: ReactNode; action?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold">{children}</h3>
        {sub && <p className="subtle mt-0.5 text-sm">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  blue: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  red: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  grey: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  navy: "bg-navy text-white",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "grey", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx("chip", tones[tone], className)}>{children}</span>;
}

export function Stat({ label, value, hint, icon, tone = "blue" }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone }) {
  return (
    <Card className="flex items-start gap-4">
      {icon && <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="subtle text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold">{value}</p>
        {hint && <p className="subtle mt-0.5 text-xs">{hint}</p>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {sub && <p className="muted mt-1 max-w-2xl text-sm">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgb(var(--line))] p-8 text-center">
      <p className="font-semibold">{title}</p>
      {body && <p className="subtle mx-auto mt-1 max-w-md text-sm">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ScoreRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#10B981" : value >= 50 ? "#2563EB" : "#EF4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label={`${value} / 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="fill-[rgb(var(--ink))] font-display font-bold" fontSize={size / 3.6}>
        {value}
      </text>
    </svg>
  );
}

export function scoreTone(v: number): Tone {
  return v >= 75 ? "green" : v >= 50 ? "blue" : "red";
}

export function DifficultyBadge({ d }: { d: string }) {
  const map: Record<string, [Tone, string, string]> = { EASY: ["green", "Fondamental", "Foundation"], MEDIUM: ["amber", "Intermédiaire", "Intermediate"], HARD: ["red", "Avancé", "Advanced"] };
  const [tone, fr, en] = map[d] ?? ["grey", d, d];
  return <Badge tone={tone}><Tr fr={fr} en={en} /></Badge>;
}

const STATUS_FR: Record<string, string> = { DRAFT: "brouillon", IN_REVIEW: "en validation", PUBLISHED: "publié", ARCHIVED: "archivé", COMPLETED: "terminée", IN_PROGRESS: "en cours", ABANDONED: "abandonnée" };
const STATUS_EN: Record<string, string> = { DRAFT: "draft", IN_REVIEW: "in review", PUBLISHED: "published", ARCHIVED: "archived", COMPLETED: "completed", IN_PROGRESS: "in progress", ABANDONED: "abandoned" };

export function StatusBadge({ s }: { s: string }) {
  const map: Record<string, Tone> = { DRAFT: "grey", IN_REVIEW: "amber", PUBLISHED: "green", ARCHIVED: "grey", COMPLETED: "green", IN_PROGRESS: "blue", ABANDONED: "grey" };
  return <Badge tone={map[s] ?? "grey"}><Tr fr={STATUS_FR[s] ?? s.toLowerCase()} en={STATUS_EN[s] ?? s.toLowerCase()} /></Badge>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
      {children}
    </Link>
  );
}

export function DisclaimerBar({ compact }: { compact?: boolean }) {
  return (
    <div className={clsx("flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200", compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm")}>
      <span aria-hidden>⚕</span>
      <span>
        <Tr
          fr={<><strong>Simulation pédagogique uniquement.</strong> Tous les patients sont fictifs. DiagnoCare n&apos;est pas un outil de diagnostic et ses retours ne sont pas des avis médicaux.</>}
          en={<><strong>Educational simulation only.</strong> All patients are fictional. DiagnoCare is not a diagnostic tool and its feedback is not medical advice.</>}
        />
      </span>
    </div>
  );
}

export function fmtDate(d: Date | string | null | undefined, lang: "fr" | "en" = "fr") {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(lang === "en" ? "en-GB" : "fr-DZ", { day: "numeric", month: "short", year: "numeric" });
}
