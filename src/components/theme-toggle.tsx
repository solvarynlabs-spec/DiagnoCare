"use client";

import { Moon, Sun } from "@/components/icons";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useT();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("medsim-theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <button type="button" onClick={toggle} className={`grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--line))] hover:bg-[rgb(var(--panel-2))] ${className}`} aria-label={dark ? t("Passer en mode clair", "Switch to light mode") : t("Passer en mode sombre", "Switch to dark mode")}>
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
