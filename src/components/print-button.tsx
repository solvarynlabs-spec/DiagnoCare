"use client";

import { Printer } from "@/components/icons";
import { useT } from "@/lib/i18n/client";

export function PrintButton() {
  const t = useT();
  return (
    <button type="button" onClick={() => window.print()} className="btn-ghost">
      <Printer className="h-4 w-4" /> {t("Imprimer", "Print")}
    </button>
  );
}
