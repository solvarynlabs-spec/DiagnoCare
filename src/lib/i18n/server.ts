import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, makeT, normalizeLang, type UiLang } from "./shared";

export async function getLang(): Promise<UiLang> {
  try {
    return normalizeLang((await cookies()).get(LANG_COOKIE)?.value);
  } catch {
    return "fr";
  }
}

export async function getT() {
  return makeT(await getLang());
}
