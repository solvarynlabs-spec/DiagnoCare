"use client";

import Link from "next/link";
import { Bell } from "@/components/icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLang, useT } from "@/lib/i18n/client";
import { translateMessage } from "@/lib/i18n/messages";

interface Item {
  id: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const t = useT();
  const lang = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      if (!r.ok) return;
      const j = await r.json();
      setItems(j.items);
      setUnread(j.unread);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => {
      clearInterval(t);
      document.removeEventListener("click", close);
    };
  }, [load]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      await fetch("/api/notifications", { method: "POST" }).catch(() => {}); // best effort; next poll resyncs
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative grid h-9 w-9 place-items-center rounded-xl border border-[rgb(var(--line))] hover:bg-[rgb(var(--panel-2))]" aria-label={`Notifications${unread ? `, ${unread} ${t("non lue(s)", "unread")}` : ""}`} aria-expanded={open}>
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="panel absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-0 shadow-lift">
          <p className="border-b border-[rgb(var(--line))] px-4 py-3 text-sm font-semibold">Notifications</p>
          <ul className="max-h-96 divide-y divide-[rgb(var(--line))] overflow-y-auto">
            {items.length === 0 && <li className="subtle px-4 py-6 text-center text-sm">{t("Aucune nouvelle notification.", "No new notifications.")}</li>}
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.href ?? "#"} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-[rgb(var(--panel-2))]">
                  <p className="text-sm font-medium">
                    {!n.read && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-600 align-middle" />}
                    {translateMessage(n.title, lang)}
                  </p>
                  <p className="subtle mt-0.5 text-xs">{translateMessage(n.body, lang)}</p>
                  <p className="subtle mt-1 text-[11px]">{new Date(n.createdAt).toLocaleString(lang === "en" ? "en-GB" : "fr-DZ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
