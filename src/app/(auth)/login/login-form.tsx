"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "@/components/icons";
import { api } from "@/lib/client";
import { GoogleButton } from "@/components/auth/google-button";
import { AuthCard, Divider, IconField } from "@/components/auth/auth-card";
import { useT } from "@/lib/i18n/client";

const DEMOS = [
  { account: "student", label: "Étudiante (Pro)", en: "Student (Pro)" },
  { account: "free", label: "Étudiant (Gratuit)", en: "Student (Free)" },
  { account: "teacher", label: "Enseignante", en: "Teacher" },
  { account: "uniadmin", label: "Admin faculté", en: "Faculty admin" },
  { account: "admin", label: "Admin plateforme", en: "Platform admin" },
];

export function LoginForm({ next, initialError, registered = false, demo, google }: { next?: string; initialError: string; registered?: boolean; demo: boolean; google: boolean }) {
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  // After sign-up, prefill the e-mail (kept out of the URL on purpose).
  useEffect(() => {
    if (!registered) return;
    try {
      const saved = sessionStorage.getItem("clinika-new-email");
      if (saved) setEmail(saved);
    } catch {}
  }, [registered]);

  async function go(promise: Promise<{ redirect: string }>) {
    setBusy(true);
    setError("");
    try {
      const r = await promise;
      try {
        sessionStorage.removeItem("clinika-new-email");
      } catch {}
      router.push(next ?? r.redirect);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <AuthCard>
      {registered && !error && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800" role="status">
          {t("Compte créé avec succès. Connectez-vous pour accéder à votre espace.", "Account created. Sign in to access your space.")}
        </p>
      )}
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          go(api("/api/auth/login", "POST", { email: f.get("email"), password: f.get("password"), remember }));
        }}
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">{t("Adresse e-mail", "Email address")}</label>
          <IconField icon={Mail}>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder={t("prenom.nom@univ-alger.dz", "firstname.lastname@univ-alger.dz")} className="field py-3 pl-11" value={email} onChange={(e) => setEmail(e.target.value)} />
          </IconField>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">{t("Mot de passe", "Password")}</label>
          <IconField icon={Lock}>
            <input id="password" name="password" type={show ? "text" : "password"} required autoComplete="current-password" placeholder={t("Votre mot de passe", "Your password")} className="field py-3 pl-11 pr-11" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={show ? t("Masquer le mot de passe", "Hide password") : t("Afficher le mot de passe", "Show password")}>
              {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </IconField>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-[#1f6fe0]" /> {t("Se souvenir de moi", "Remember me")}
          </label>
          <Link href="/forgot-password" className="font-medium text-[#1f6fe0] hover:underline">{t("Mot de passe oublié ?", "Forgot password?")}</Link>
        </div>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <button className="btn-primary w-full py-3.5 text-[15px] font-semibold" disabled={busy}>
          {busy ? t("Connexion…", "Signing in…") : <>{t("Se connecter", "Sign in")} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <Divider />
      <GoogleButton enabled={google} href={`/api/auth/google${next ? `?next=${encodeURIComponent(next)}` : ""}`} />

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("Pas encore de compte ?", "No account yet?")} <Link href="/register" className="font-semibold text-[#1f6fe0] hover:underline">{t("Créer un compte", "Create an account")}</Link>
      </p>

      {demo && (
        <div className="mt-6 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-600">{t("Comptes de démonstration", "Demo accounts")} <span className="font-normal text-slate-400">{t("— développement uniquement", "— development only")}</span></p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {DEMOS.map((d) => (
              <button key={d.account} type="button" disabled={busy} onClick={() => go(api("/api/auth/demo-login", "POST", { account: d.account }))} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[#2f86ff] hover:text-[#1f6fe0]">
                {t(d.label, d.en)}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthCard>
  );
}
