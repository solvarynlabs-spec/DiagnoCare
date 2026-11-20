"use client";

import { useLang, useSetLang } from "@/lib/i18n/client";
import { UI_LANGS } from "@/lib/i18n/shared";

/** FR / EN switch: changes the language of the whole platform (interface, cases, patient). */
export function LangSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const setLang = useSetLang();
  return (
    <div role="radiogroup" aria-label={lang === "en" ? "Language" : "Langue"} className={`flex h-9 items-center rounded-xl border border-[rgb(var(--line))] p-0.5 text-xs font-semibold ${className}`}>
      {UI_LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          title={l.label}
          onClick={() => lang !== l.code && setLang(l.code)}
          className={`h-full rounded-[10px] px-2.5 transition ${lang === l.code ? "bg-[#1f6fe0] text-white" : "opacity-70 hover:opacity-100"}`}
        >
          {l.short}
        </button>
      ))}
    </div>
  );
}
