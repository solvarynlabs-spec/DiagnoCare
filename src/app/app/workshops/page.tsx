import Link from "next/link";
import { Activity, ArrowRight, Clock, Drop, Gauge, Scissors } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { WORKSHOPS } from "@/lib/workshops";
import { getLang, getT } from "@/lib/i18n/server";
import { makeT } from "@/lib/i18n/shared";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("Ateliers pratiques", "Practical workshops") };
}

const ICON = { ecg: Activity, suture: Scissors, tension: Gauge, perfusion: Drop } as const;

export default async function WorkshopsPage() {
  await requireUser();
  const lang = await getLang();
  const t = makeT(lang);
  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-10 text-white sm:-mx-6 sm:-my-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6fb1ff]">{t("Ateliers pratiques", "Practical workshops")}</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-5xl">{t("Les gestes, avant le vrai patient.", "The skills, before the real patient.")}</h1>
        <p className="mt-3 max-w-2xl text-white/60">{t("Des exercices interactifs et notés pour s'entraîner aux gestes de base. Recommencez autant de fois que nécessaire : ici, l'erreur ne coûte rien.", "Interactive, scored exercises to practise core clinical skills. Repeat as often as you like: here, mistakes cost nothing.")}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {WORKSHOPS.map((w) => {
            const Icon = ICON[w.slug];
            return (
              <Link key={w.slug} href={`/app/workshops/${w.slug}`} className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#2f86ff]/60">
                <span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#2f86ff]/10 blur-2xl transition group-hover:bg-[#2f86ff]/25" />
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#2f86ff] to-[#0a4fcc] shadow-[0_10px_30px_-10px_rgba(47,134,255,0.8)]">
                  <Icon className="h-7 w-7 text-white" weight="duotone" />
                </span>
                <h2 className="mt-5 font-display text-xl font-bold">{t(w.title, w.titleEn)}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{t(w.sub, w.subEn)}</p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(lang === "en" ? w.skillsEn : w.skills).map((s) => <span key={s} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/60">{s}</span>)}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                  <span className="flex items-center gap-1.5 text-white/50"><Clock className="h-4 w-4" /> {w.minutes} min · {t(w.level, w.levelEn)}</span>
                  <span className="flex items-center gap-1 font-semibold text-[#6fb1ff]">{t("Commencer", "Start")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
