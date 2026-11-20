import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { DEMO_LOGIN_ENABLED } from "@/lib/demo";
import { googleEnabled } from "@/lib/auth/google";
import { GOOGLE_ERRORS } from "@/lib/auth/google-errors";
import { getLang, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Connexion", "Sign in"), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; denied?: string; error?: string; registered?: string }> }) {
  const sp = await searchParams;
  const lang = await getLang();
  const next = sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const initialError = sp.denied ? (lang === "en" ? "Your account doesn't have access to this area." : "Votre compte n'a pas accès à cet espace.") : sp.error ? GOOGLE_ERRORS[sp.error]?.[lang === "en" ? 1 : 0] ?? "" : "";
  return <LoginForm next={next} initialError={initialError} registered={sp.registered === "1"} demo={DEMO_LOGIN_ENABLED()} google={googleEnabled()} />;
}
