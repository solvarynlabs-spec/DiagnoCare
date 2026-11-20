import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { WORKSHOPS } from "@/lib/workshops";
import { SutureWorkshop } from "@/components/workshops/suture";
import { BloodPressureWorkshop, DripWorkshop } from "@/components/workshops/drills";
import { EcgWorkshop } from "@/components/workshops/ecg";
import { getLang, getT } from "@/lib/i18n/server";
import { guidedBySlug } from "@/lib/workshops/guided";
import { GuidedWorkshopView } from "@/components/workshops/guided";
import { draftsOpenToStudents } from "@/lib/sim/service";
import { can } from "@/lib/rbac";
import { Lock } from "@/components/icons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getT();
  const w = WORKSHOPS.find((x) => x.slug === slug);
  const g = guidedBySlug(slug);
  return { title: w ? t(w.title, w.titleEn) : g ? t(g.title.fr, g.title.en) : t("Atelier", "Workshop") };
}

export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const t = await getT();
  const { slug } = await params;
  const w = WORKSHOPS.find((x) => x.slug === slug);
  const g = guidedBySlug(slug);
  if (!w && !g) notFound();
  if (g) {
    const lang = await getLang();
    const open = g.review.status === "approved" || can(user.roleKey, "case:write") || (await draftsOpenToStudents());
    return (
      <div className="dark -mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-8 text-white sm:-mx-6 sm:-my-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/app/workshops" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t("Ateliers pratiques", "Practical workshops")}</Link>
          <h1 className="mt-3 font-display text-2xl font-bold sm:text-4xl">{lang === "en" ? g.title.en : g.title.fr}</h1>
          <p className="mt-2 max-w-3xl text-white/60">{lang === "en" ? g.sub.en : g.sub.fr}</p>
          <div className="mt-8">
            {open ? (
              <GuidedWorkshopView w={g} />
            ) : (
              <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#081427] p-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-200"><Lock className="h-6 w-6" /></span>
                <p className="mt-3 text-lg font-semibold">{t("En relecture clinique", "Under clinical review")}</p>
                <p className="mt-1 text-sm text-white/60">{t("Cet atelier sera ouvert aux étudiants après validation par un enseignant clinicien.", "This workshop will open to students once a clinical educator has approved it.")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  if (!w) notFound();
  return (
    <div className="dark -mx-4 -my-6 min-h-[calc(100vh-4rem)] bg-[#050c1a] px-4 py-8 text-white sm:-mx-6 sm:-my-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/app/workshops" className="inline-flex items-center gap-1.5 text-sm text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> {t("Ateliers pratiques", "Practical workshops")}</Link>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-4xl">{t(w.title, w.titleEn)}</h1>
        <p className="mt-2 max-w-3xl text-white/60">{t(w.sub, w.subEn)}</p>
        <div className="mt-8">
          {w.slug === "ecg" && <EcgWorkshop />}
          {w.slug === "suture" && <SutureWorkshop />}
          {w.slug === "tension" && <BloodPressureWorkshop />}
          {w.slug === "perfusion" && <DripWorkshop />}
        </div>
      </div>
    </div>
  );
}
