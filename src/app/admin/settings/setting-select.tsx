"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function SettingSelect({ k, label, value, options, hint }: { k: string; label: string; value: string; options: string[]; hint: string }) {
  const t = useT();
  const [v, setV] = useState(value);
  const [state, setState] = useState("");
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        className="field"
        value={v}
        onChange={async (e) => {
          const next = e.target.value;
          setV(next);
          setState(t("Enregistrement…", "Saving…"));
          try {
            await api("/api/admin/settings", "PUT", { key: k, value: next });
            setState(t("Enregistré", "Saved"));
          } catch (err) {
            setState((err as Error).message);
          }
        }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="subtle mt-1 block text-xs">{hint} {state && <strong>· {state}</strong>}</span>
    </label>
  );
}
