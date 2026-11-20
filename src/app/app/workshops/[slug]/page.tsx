import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { WORKSHOPS } from "@/lib/workshops";
import { SutureWorkshop } from "@/components/workshops/suture";
import { BloodPressureWorkshop, DripWorkshop } from "@/components/workshops/drills";
import { EcgWorkshop } from "@/components/workshops/ecg";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getT();
  const w = WORKSHOPS.find((x) => x.slug === slug);
  return { title: w ? t(w.title, w.titleEn) : t("Atelier", "Workshop") };
}

export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireUser();
  const t = await getT();
  const { slug } = await params;
  const w = WORKSHOPS.find((x) => x.slug === slug);
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
