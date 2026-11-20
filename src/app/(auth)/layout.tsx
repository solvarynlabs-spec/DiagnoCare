import Link from "next/link";
import { ArrowLeft, ChartBar, GraduationCap, HandPointing, UserRound } from "@/components/icons";
import { Logo } from "@/components/ui";
import { Photo } from "@/components/motion";
import { LangSwitch } from "@/components/lang-switch";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  const FEATURES = [
    { icon: UserRound, title: t("Patient 3D réaliste", "Realistic 3D patient"), text: t("Des cas cliniques algériens authentiques et variés", "Authentic, varied Algerian clinical cases") },
    { icon: HandPointing, title: t("Examen interactif", "Interactive examination"), text: t("Interrogez, examinez, demandez vos examens", "Interview, examine, order your tests") },
    { icon: ChartBar, title: t("Suivi pédagogique", "Learning follow-up"), text: t("Une correction détaillée après chaque cas", "Detailed feedback after every case") },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#06101f] text-white">
      {/* Real photograph (Unsplash), darkened so the text and card stay legible. */}
      <Photo photo="bedside" className="absolute inset-0 opacity-70" priority sizes="100vw" w={2000} />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06101f] via-[#06101f]/80 to-[#06101f]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#06101f] via-transparent to-[#06101f]/40" />

      <div className="relative mx-auto grid min-h-screen max-w-[1400px] gap-10 px-5 py-6 sm:px-10 lg:grid-cols-[1fr_480px] lg:items-center lg:py-10">
        <div className="flex flex-col lg:h-full lg:justify-between lg:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label={t("Accueil DiagnoCare", "DiagnoCare home")} className="flex flex-col items-start gap-2">
              <Logo light className="text-2xl" />
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f86ff]/50 bg-[#0a5be0]/15 px-3 py-1 text-xs font-medium text-[#8cc0ff]">
                <GraduationCap className="h-3.5 w-3.5" weight="fill" /> {t("Simulation pédagogique", "Educational simulation")}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <LangSwitch className="border-white/20 text-white" />
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white lg:hidden">
                <ArrowLeft className="h-4 w-4" /> Site
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <h1 className="max-w-xl font-display text-6xl font-bold leading-[1.02] tracking-tight">
              {t("Votre prochain patient", "Your next patient")} <span className="text-[#3d9bff]">{t("vous attend.", "is waiting.")}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg font-light leading-relaxed text-white/75">
              {t("Une consultation immersive et interactive pour développer vos compétences cliniques, en toute sécurité.", "An immersive, interactive consultation to build your clinical skills, safely.")}
            </p>
            <ul className="mt-12 grid max-w-2xl grid-cols-3 divide-x divide-white/15">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex gap-3 px-5 first:pl-0">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#2f86ff]/70 text-[#5aaaff]">
                    <f.icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{f.title}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-white/60">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/" className="hidden w-fit items-center gap-1.5 text-sm text-white/60 hover:text-white lg:inline-flex">
            <ArrowLeft className="h-4 w-4" /> {t("Retour au site", "Back to site")}
          </Link>
        </div>

        <div className="pb-6 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}
