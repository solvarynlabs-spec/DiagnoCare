"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, makeT, type UiLang } from "./shared";

const LangContext = createContext<UiLang>("fr");

export function LangProvider({ lang, children }: { lang: UiLang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useT() {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}

export function writeLangCookie(lang: UiLang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang === "en" ? "en" : "fr-DZ";
}

/** Switch the whole interface language and re-render server components. */
export function useSetLang() {
  const router = useRouter();
  return useCallback(
    (lang: UiLang) => {
      writeLangCookie(lang);
      router.refresh();
    },
    [router],
  );
}
