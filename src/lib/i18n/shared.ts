/**
 * Interface language (FR / EN). The choice is stored in a cookie so server components,
 * route handlers and client components all render in the same language.
 *
 * Strings are written inline as pairs: t("Texte français", "English text").
 */
export type UiLang = "fr" | "en";

export const LANG_COOKIE = "dc-lang";
export const UI_LANGS: { code: UiLang; label: string; short: string }[] = [
  { code: "fr", label: "Français", short: "FR" },
  { code: "en", label: "English", short: "EN" },
];

export const normalizeLang = (v: string | null | undefined): UiLang => (v === "en" ? "en" : "fr");

export type T = <X>(fr: X, en: X) => X;
export const makeT = (lang: UiLang): T => (fr, en) => (lang === "en" ? en : fr);

/** Intl locale for dates and numbers. */
export const intlLocale = (lang: UiLang) => (lang === "en" ? "en-GB" : "fr-FR");
