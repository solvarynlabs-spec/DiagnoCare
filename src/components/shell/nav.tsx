"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Building2, ClipboardList, Cpu, CreditCard, FileText, FolderHeart, GraduationCap, Inbox, Globe, LayoutDashboard, Library, LineChart, Menu, Scissors, ScrollText, Settings, Users, UsersRound, X,
} from "@/components/icons";
import { Logo } from "@/components/ui";
import { useT } from "@/lib/i18n/client";

const ICONS = { Activity, Building2, ClipboardList, Cpu, CreditCard, FileText, FolderHeart, GraduationCap, Inbox, LayoutDashboard, Library, LineChart, Scissors, ScrollText, Settings, Users, UsersRound };
const Icons = { ...ICONS, Menu, X, Globe };

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  section?: string;
}

function isActive(path: string, href: string) {
  if (["/app", "/teach", "/institution", "/admin"].includes(href)) return path === href;
  return path === href || path.startsWith(`${href}/`);
}

export function NavLinks({ items, onNavigate, dark }: { items: NavItem[]; onNavigate?: () => void; dark?: boolean }) {
  const path = usePathname();
  const t = useT();
  let lastSection: string | undefined;
  return (
    <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-3" aria-label={t("Navigation de l'application", "App navigation")}>
      {items.map((it) => {
        const Icon = ICONS[it.icon];
        const header = it.section && it.section !== lastSection ? it.section : null;
        lastSection = it.section ?? lastSection;
        const active = isActive(path, it.href);
        return (
          <div key={it.href + it.label}>
            {header && <p className={`px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-white/35" : "subtle"}`}>{header}</p>}
            <Link
              href={it.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${dark ? (active ? "bg-gradient-to-r from-brand-600/90 to-brand-500/40 text-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.9)]" : "text-white/60 hover:bg-white/[0.06] hover:text-white") : active ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200" : "muted hover:bg-[rgb(var(--panel-2))]"}`}
            >
              <Icon className={`h-4 w-4 ${dark && active ? "text-teal-200" : ""}`} />
              {it.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items, userName }: { items: NavItem[]; userName: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const path = usePathname();
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [path]);
  // Lock page scroll and allow Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Rendered in a portal: the header uses backdrop-blur, which would otherwise trap a
  // `position: fixed` drawer inside the header's own box.
  const drawer = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="absolute inset-y-0 left-0 flex w-[min(300px,85vw)] flex-col bg-[#071026] py-4 text-white shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between px-5">
              <Logo light />
              <button onClick={() => setOpen(false)} aria-label={t("Fermer le menu", "Close menu")} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 hover:bg-white/10">
                <Icons.X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks items={items} onNavigate={() => setOpen(false)} dark />
            <div className="mt-2 space-y-3 border-t border-white/10 px-5 pt-4 text-sm">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 text-white/70 hover:text-white">
                <Icons.Globe className="h-4 w-4" /> {t("Retour au site public", "Back to the public site")}
              </Link>
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2f86ff] to-[#0a4fcc] text-xs font-bold">{userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                <p className="min-w-0 flex-1 truncate font-semibold">{userName}</p>
                <form action="/api/auth/logout" method="post">
                  <button className="text-sm text-red-300 hover:text-red-200">{t("Déconnexion", "Sign out")}</button>
                </form>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button className="grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--line))] lg:hidden" onClick={() => setOpen(true)} aria-label={t("Ouvrir le menu", "Open menu")} aria-expanded={open}>
        <Icons.Menu className="h-4 w-4" />
      </button>
      {mounted && createPortal(drawer, document.body)}
    </>
  );
}
