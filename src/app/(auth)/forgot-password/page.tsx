import type { Metadata } from "next";
import { ForgotForm } from "./forgot-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mot de passe oublié", "Forgot password"), robots: { index: false } };
}

export default function ForgotPasswordPage() {
  return <ForgotForm />;
}
