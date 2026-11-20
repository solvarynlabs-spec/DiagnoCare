"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail } from "@/components/icons";
import { api } from "@/lib/client";
import { AuthCard, IconField } from "@/components/auth/auth-card";
import { useT } from "@/lib/i18n/client";

export function ForgotForm() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ email: string; demoLink?: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setBusy(true);
    setError("");
    try {
      const r = await api<{ demoLink?: string }>("/api/auth/reset", "POST", { email });
      setSent({ email, demoLink: r.demoLink });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard tabs={false}>
      {sent ? (
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" weight="fill" />
          <h1 className="mt-3 text-lg font-semibold text-slate-900">{t("Vérifiez votre boîte e-mail", "Check your inbox")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("Si un compte existe pour", "If an account exists for")} <strong className="text-slate-700">{sent.email}</strong>, {t("vous recevrez un lien valable 30 minutes.", "you'll receive a link valid for 30 minutes.")}</p>
          {sent.demoLink && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
              <p className="font-semibold">{t("Mode démo : aucun service d'e-mail configuré", "Demo mode: no email service configured")}</p>
              <p className="mt-1">{t("Voici le lien qui aurait été envoyé :", "Here is the link that would have been sent:")}</p>
              <Link href={sent.demoLink.replace(/^https?:\/\/[^/]+/, "")} className="mt-2 inline-flex items-center gap-1 font-semibold text-[#1f6fe0] hover:underline">
                {t("Choisir un nouveau mot de passe", "Choose a new password")} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{t("Mot de passe oublié", "Forgot password")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("Indiquez l'e-mail de votre compte : nous vous enverrons un lien pour en choisir un nouveau.", "Enter your account email: we'll send you a link to choose a new one.")}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">{t("Adresse e-mail", "Email address")}</label>
            <IconField icon={Mail}>
              <input id="email" name="email" type="email" required autoComplete="email" placeholder={t("prenom.nom@univ-alger.dz", "firstname.lastname@univ-alger.dz")} className="field py-3 pl-11" />
            </IconField>
          </div>
          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <button className="btn-primary w-full py-3.5 text-[15px] font-semibold" disabled={busy}>{busy ? t("Envoi…", "Sending…") : t("Envoyer le lien", "Send the link")}</button>
        </form>
      )}
      <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-[#1f6fe0] hover:underline">
        <ArrowLeft className="h-4 w-4" /> {t("Retour à la connexion", "Back to sign in")}
      </Link>
    </AuthCard>
  );
}
