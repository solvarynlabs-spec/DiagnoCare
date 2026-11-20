import type { Metadata } from "next";
import { RegisterForm } from "./register-form";
import { googleEnabled } from "@/lib/auth/google";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Créer un compte", "Create an account"), description: t("Créez un compte DiagnoCare gratuit, avec votre e-mail ou votre compte Google.", "Create a free DiagnoCare account with your email or Google account.") };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan } = await searchParams;
  return <RegisterForm wantsPro={plan === "pro"} google={googleEnabled()} />;
}
