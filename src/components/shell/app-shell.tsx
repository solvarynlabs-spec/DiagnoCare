import Link from "next/link";
import { ArrowUpRight, Globe } from "@/components/icons";
import type { CurrentUser } from "@/lib/auth/session";
import { ROLE_META, type RoleKey } from "@/lib/rbac";
import { Badge, Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSwitch } from "@/components/lang-switch";
import { getT } from "@/lib/i18n/server";
import type { T } from "@/lib/i18n/shared";
import { NavLinks, MobileNav, type NavItem } from "./nav";
import { NotificationsBell } from "./notifications";

const STUDENT = (t: T): NavItem[] => [
  { href: "/app", label: t("Tableau de bord", "Dashboard"), icon: "LayoutDashboard" },
  { href: "/app/cases", label: t("Bibliothèque de cas", "Case library"), icon: "Library" },
  { href: "/app/workshops", label: t("Ateliers pratiques", "Practical workshops"), icon: "Scissors" },
  { href: "/app/reports", label: t("Mes rapports", "My reports"), icon: "FileText" },
  { href: "/app/billing", label: t("Formule et paiement", "Plan & billing"), icon: "CreditCard" },
  { href: "/app/settings", label: t("Paramètres", "Settings"), icon: "Settings" },
];
const TEACHER = (t: T): NavItem[] => [
  { href: "/teach", label: t("Tableau de bord", "Dashboard"), icon: "LayoutDashboard" },
  { href: "/teach/cases", label: t("Cas cliniques", "Clinical cases"), icon: "FolderHeart" },
  { href: "/teach/assignments", label: t("Devoirs", "Assignments"), icon: "ClipboardList" },
  { href: "/teach/students", label: t("Étudiants", "Students"), icon: "Users" },
  { href: "/teach/groups", label: t("Groupes", "Groups"), icon: "UsersRound" },
  { href: "/app/cases", label: t("S'entraîner", "Practice"), icon: "Library", section: t("Pratique", "Practice") },
  { href: "/app/workshops", label: t("Ateliers pratiques", "Practical workshops"), icon: "Scissors" },
  { href: "/app/settings", label: t("Paramètres", "Settings"), icon: "Settings", section: t("Compte", "Account") },
];
const UNI = (t: T): NavItem[] => [
  { href: "/institution", label: t("Vue d'ensemble", "Overview"), icon: "Building2" },
  { href: "/institution/people", label: t("Enseignants et étudiants", "Teachers & students"), icon: "Users" },
  { href: "/institution/programs", label: t("Programmes", "Programs"), icon: "GraduationCap" },
  { href: "/teach/groups", label: t("Groupes", "Groups"), icon: "UsersRound" },
  { href: "/teach/cases", label: t("Cas cliniques", "Clinical cases"), icon: "FolderHeart" },
  { href: "/teach/students", label: t("Résultats des étudiants", "Student results"), icon: "LineChart" },
  { href: "/institution/audit", label: t("Journal d'audit", "Audit log"), icon: "ScrollText" },
  { href: "/app/settings", label: t("Paramètres", "Settings"), icon: "Settings", section: t("Compte", "Account") },
];
const ADMIN = (t: T): NavItem[] => [
  { href: "/admin", label: t("Vue d'ensemble", "Overview"), icon: "Activity" },
  { href: "/admin/users", label: t("Utilisateurs", "Users"), icon: "Users" },
  { href: "/admin/subscriptions", label: t("Abonnements", "Subscriptions"), icon: "CreditCard" },
  { href: "/teach/cases", label: t("Contenus cliniques", "Clinical content"), icon: "FolderHeart" },
  { href: "/admin/settings", label: t("Réglages IA et plateforme", "AI & platform settings"), icon: "Cpu" },
  { href: "/admin/messages", label: t("Demandes de contact", "Contact requests"), icon: "Inbox" },
  { href: "/admin/audit", label: t("Journal d'audit", "Audit log"), icon: "ScrollText" },
  { href: "/app/settings", label: t("Paramètres", "Settings"), icon: "Settings", section: t("Compte", "Account") },
];

export function navFor(role: string, t: T): NavItem[] {
  return (role === "TEACHER" ? TEACHER : role === "UNIVERSITY_ADMIN" ? UNI : role === "PLATFORM_ADMIN" ? ADMIN : STUDENT)(t);
}

export async function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const t = await getT();
  const nav = navFor(user.roleKey, t);
  const meta = ROLE_META[user.roleKey as RoleKey];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="noise sticky top-0 hidden h-screen flex-col overflow-hidden bg-navy-950 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-600/30 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" aria-hidden />
        <div className="relative px-5 py-6">
          <Link href={meta.home}>
            <Logo light />
          </Link>
        </div>
        <NavLinks items={nav} dark />
        <div className="relative px-3 pb-2">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white">
            <Globe className="h-4 w-4" /> {t("Site public", "Public site")} <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="relative mt-auto border-t border-white/10 p-4">
          {user.roleKey === "STUDENT" && (
            <Link href="/app/billing" className="mb-3 block rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 p-3 text-white">
              <p className="text-xs uppercase tracking-wide text-white/70">{t("Formule actuelle", "Current plan")}</p>
              <p className="font-semibold">{t(user.plan.name, user.plan.nameEn)}</p>
              {user.plan.key === "FREE" && <p className="mt-0.5 text-xs text-white/85">{t("Passez à Pro pour toute la bibliothèque →", "Upgrade to Pro for the full library →")}</p>}
            </Link>
          )}
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-teal-500 text-sm font-bold text-white ring-2 ring-white/10">{user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/50">{t(meta.label, meta.labelEn)}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button className="rounded-lg px-2 py-1 text-xs text-white/50 hover:bg-white/10 hover:text-white" title={t("Se déconnecter", "Sign out")}>
                {t("Déconnexion", "Sign out")}
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[rgb(var(--line))] bg-[rgb(var(--bg))]/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav items={nav} userName={user.name} />
            <Link href={meta.home} className="lg:hidden">
              <Logo className="text-base" />
            </Link>
            {user.university && <Badge tone="navy" className="hidden md:inline-flex">{user.university.name}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="hidden items-center gap-1.5 rounded-xl border border-[rgb(var(--line))] px-3 py-2 text-sm font-medium hover:bg-[rgb(var(--panel-2))] sm:inline-flex" title={t("Aller sur le site public", "Go to the public site")}>
              <Globe className="h-4 w-4" /> {t("Site public", "Public site")}
            </Link>
            <NotificationsBell />
            <LangSwitch />
            <ThemeToggle />
          </div>
        </header>
        <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
