"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "@/components/icons";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSwitch } from "@/components/lang-switch";
import { useT } from "@/lib/i18n/client";

const NAV = [
  { href: "/features", label: "Fonctionnalités", en: "Features" },
  { href: "/specialties", label: "Spécialités", en: "Specialties" },
  { href: "/pricing", label: "Tarifs", en: "Pricing" },
  { href: "/about", label: "À propos", en: "About" },
  { href: "/faq", label: "FAQ", en: "FAQ" },
  { href: "/contact", label: "Contact", en: "Contact" },
];

/** Every public page opens on a dark hero, so the header starts transparent/white and turns solid on scroll. */
export function SiteHeader({ signedIn, home }: { signedIn: boolean; home: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const solid = scrolled || open;

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${solid ? "border-b border-[rgb(var(--line))]/60 bg-[rgb(var(--bg))]/75 shadow-[0_10px_30px_-20px_rgba(11,19,43,0.4)] backdrop-blur-2xl" : "bg-transparent"}`}>
        <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-500 sm:px-6 ${solid ? "h-16" : "h-20"}`}>
          <Link href="/" aria-label={t("Accueil DiagnoCare", "DiagnoCare home")}>
            <Logo light={!solid} />
          </Link>
          <nav className={`hidden items-center gap-1 rounded-2xl p-1 lg:flex `} aria-label={t("Navigation principale", "Main navigation")}>
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link key={n.href} href={n.href} className={`relative rounded-xl px-3.5 py-2 text-sm font-medium transition ${solid ? (active ? "text-brand-600 dark:text-brand-300" : "muted hover:text-[rgb(var(--ink))]") : active ? "text-white" : "text-white/70 hover:text-white"}`}>
                  {active && <motion.span layoutId="nav-pill" className={`absolute inset-0 -z-10 rounded-xl ${solid ? "bg-brand-50 dark:bg-brand-500/15" : "bg-white/10"}`} transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  {t(n.label, n.en)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitch className={solid ? "" : "border-white/20 text-white"} />
            <ThemeToggle className={solid ? "" : "border-white/20 text-white hover:bg-white/10"} />
            {signedIn ? (
              <Link href={home} className="btn-primary hidden sm:inline-flex">
                {t("Tableau de bord", "Dashboard")} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className={`btn hidden sm:inline-flex ${solid ? "muted hover:text-[rgb(var(--ink))]" : "text-white/80 hover:text-white"}`}>
                  {t("Connexion", "Sign in")}
                </Link>
                <Link href="/register" className="btn-primary hidden sm:inline-flex">
                  {t("Essai gratuit", "Free trial")} <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
            <button className={`grid h-9 w-9 place-items-center rounded-xl border lg:hidden ${solid ? "border-[rgb(var(--line))]" : "border-white/20 text-white"}`} onClick={() => setOpen(!open)} aria-label={t("Ouvrir ou fermer le menu", "Toggle menu")} aria-expanded={open}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[rgb(var(--line))] lg:hidden">
              <nav className="grid gap-1 px-4 py-3" aria-label="Mobile">
                {NAV.map((n, i) => (
                  <motion.div key={n.href} initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.04 }}>
                    <Link href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-[rgb(var(--panel-2))]">
                      {t(n.label, n.en)}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {signedIn ? (
                    <Link href={home} className="btn-primary col-span-2">{t("Ouvrir le tableau de bord", "Open dashboard")}</Link>
                  ) : (
                    <>
                      <Link href="/login" className="btn-ghost">{t("Connexion", "Sign in")}</Link>
                      <Link href="/register" className="btn-primary">{t("Essai gratuit", "Free trial")}</Link>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
