"use client";

import { useState } from "react";
import { CheckCircle2 } from "@/components/icons";
import { api } from "@/lib/client";
import { useT } from "@/lib/i18n/client";

export function ContactForm({ initialKind }: { initialKind: "CONTACT" | "DEMO" }) {
  const t = useT();
  const [kind, setKind] = useState(initialKind);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/contact", "POST", {
        kind,
        name: f.get("name"),
        email: f.get("email"),
        organization: f.get("organization") || undefined,
        role: f.get("role") || undefined,
        message: f.get("message"),
        website: f.get("website") || undefined,
      });
      setState("sent");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }

  if (state === "sent")
    return (
      <div className="panel grid place-items-center p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-success" />
        <h2 className="mt-3 text-xl font-bold">{t("Merci — message bien reçu", "Thank you — message received")}</h2>
        <p className="muted mt-1 text-sm">{t("Nous revenons vers vous rapidement.", "We'll get back to you soon.")}</p>
      </div>
    );

  return (
    <form onSubmit={submit} className="panel space-y-4 p-6 sm:p-8">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[rgb(var(--panel-2))] p-1" role="radiogroup" aria-label={t("Type de demande", "Request type")}>
        {(["CONTACT", "DEMO"] as const).map((k) => (
          <button type="button" role="radio" aria-checked={kind === k} key={k} onClick={() => setKind(k)} className={`rounded-lg py-2 text-sm font-semibold transition ${kind === k ? "bg-[rgb(var(--panel))] shadow-card" : "subtle"}`}>
            {k === "CONTACT" ? t("Question générale", "General question") : t("Demander une démo", "Request a demo")}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t("Nom complet", "Full name")}</label>
          <input id="name" name="name" required minLength={2} className="field" autoComplete="name" />
        </div>
        <div>
          <label className="label" htmlFor="email">{t("E-mail", "Email")}</label>
          <input id="email" name="email" type="email" required className="field" autoComplete="email" />
        </div>
      </div>
      {kind === "DEMO" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="organization">{t("Faculté / établissement", "Faculty / institution")}</label>
            <input id="organization" name="organization" required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="role">{t("Votre fonction", "Your role")}</label>
            <input id="role" name="role" className="field" placeholder={t("ex. Responsable du centre de simulation", "e.g. Simulation centre lead")} />
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="message">{t("Message", "Message")}</label>
        <textarea id="message" name="message" required minLength={10} rows={5} className="field" placeholder={kind === "DEMO" ? t("Effectif des promotions, spécialités visées, calendrier…", "Class sizes, target specialties, timeline…") : t("Comment pouvons-nous vous aider ?", "How can we help?")} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button className="btn-primary w-full" disabled={state === "sending"}>
        {state === "sending" ? t("Envoi…", "Sending…") : kind === "DEMO" ? t("Demander la démo", "Request the demo") : t("Envoyer le message", "Send message")}
      </button>
      <p className="subtle text-xs">{t("N'indiquez aucune information sur de vrais patients.", "Don't include any information about real patients.")}</p>
    </form>
  );
}
