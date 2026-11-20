"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/** White card with « Se connecter / Créer un compte » tabs, shared by the auth pages. */
export function AuthCard({ children, tabs = true }: { children: React.ReactNode; tabs?: boolean }) {
  const path = usePathname();
  const t = useT();
  return (
    <div className="light-scope mx-auto w-full max-w-[480px] rounded-2xl bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-9">
      <div className="text-center">
        <h2 className="font-display text-[26px] font-bold tracking-tight text-[#0b132b]">
          {t("Bienvenue sur", "Welcome to")} <span className="text-[#1f6fe0]">DiagnoCare</span>
        </h2>
        <p className="mt-1 text-[15px] text-slate-500">{t("La simulation au service de votre formation médicale.", "Simulation in the service of your medical training.")}</p>
      </div>
      {tabs && (
        <nav className="mt-6 grid grid-cols-2 border-b border-slate-200 text-center text-[15px] font-semibold" aria-label={t("Connexion ou inscription", "Sign in or sign up")}>
          {[["/login", t("Se connecter", "Sign in")], ["/register", t("Créer un compte", "Create an account")]].map(([href, label]) => {
            const on = path === href;
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`-mb-px border-b-2 pb-3 transition ${on ? "border-[#1f6fe0] text-[#1f6fe0]" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {label}
              </Link>
            );
          })}
        </nav>
      )}
      <div className="mt-6">{children}</div>
      <p className="mt-8 flex justify-center gap-3 border-t border-slate-100 pt-5 text-xs text-slate-400">
        <Link href="/legal" className="hover:text-slate-600">{t("Confidentialité", "Privacy")}</Link>|
        <Link href="/legal" className="hover:text-slate-600">{t("Conditions d'utilisation", "Terms of use")}</Link>|
        <Link href="/contact" className="hover:text-slate-600">{t("Aide", "Help")}</Link>
      </p>
    </div>
  );
}

/** Text input with a leading icon, as in the mockups. */
export function IconField({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
      {children}
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  const t = useT();
  label ??= t("ou", "or");
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
      <span className="h-px flex-1 bg-slate-200" /> {label} <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
