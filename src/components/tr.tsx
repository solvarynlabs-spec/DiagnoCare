"use client";

import type { ReactNode } from "react";
import { useLang } from "@/lib/i18n/client";

/** Inline bilingual text, usable from server and client components alike. */
export function Tr({ fr, en }: { fr: ReactNode; en: ReactNode }) {
  return <>{useLang() === "en" ? en : fr}</>;
}
