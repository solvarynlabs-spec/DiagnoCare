import Link from "next/link";
import { Logo } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 text-5xl font-bold">404</h1>
        <p className="muted mt-2">{t("Cette page est introuvable.", "This page can't be found.")}</p>
        <Link href="/" className="btn-primary mt-6">{t("Retour à l'accueil", "Back to home")}</Link>
      </div>
    </div>
  );
}
