"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { photoUrl } from "@/lib/photos";
import { Send } from "@/components/icons";
import type { Emotion } from "@/lib/sim/types";
import { useLang, useT } from "@/lib/i18n/client";
import { translateMessage } from "@/lib/i18n/messages";

const SUGGESTIONS = {
  fr: ["Depuis quand avez-vous mal ?", "Est-ce que la douleur irradie ?", "Vous fumez ?", "Vous avez des antécédents médicaux ?", "Il y a des maladies du cœur dans votre famille ?"],
  en: ["When did the pain start?", "Does the pain spread anywhere?", "Do you smoke?", "Do you have any medical conditions?", "Any heart disease in your family?"],
};
const OPENING = { fr: "Docteur, j'ai une douleur lourde dans la poitrine... ça ne passe pas, wallah.", en: "Doctor, I've got this heavy pain in my chest... it won't go away." };

export function LiveDemo() {
  const t = useT();
  const lang = useLang();
  const [msgs, setMsgs] = useState<{ role: "student" | "patient"; text: string }[]>([{ role: "patient", text: OPENING[lang] }]);
  // Restart the demo in the new language when the interface language changes.
  useEffect(() => setMsgs([{ role: "patient", text: OPENING[lang] }]), [lang]);
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState<Emotion>("pain");
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [err, setErr] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [hr, setHr] = useState(102);
  useEffect(() => {
    const t = setInterval(() => setHr(100 + Math.round(Math.random() * 5)), 1800);
    return () => clearInterval(t);
  }, []);

  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setErr("");
    setBusy(true);
    setMsgs((m) => [...m, { role: "student", text: q }]);
    setText("");
    try {
      const r = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: q, lang }) });
      const j = await r.json();
      if (!r.ok) throw new Error(translateMessage(j.error ?? "", lang) || t("Démo indisponible", "Demo unavailable"));
      setMsgs((m) => [...m, { role: "patient", text: j.reply }]);
      setEmotion(j.emotion);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), Math.min(8000, 900 + String(j.reply).length * 55));
    } catch (e) {
      setErr(e instanceof TypeError ? t("Connexion au serveur impossible. Réessayez dans un instant.", "Can't reach the server. Try again in a moment.") : (e as Error).message);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[rgb(var(--line))] bg-[rgb(var(--panel))]">
      <div className="grid md:grid-cols-[260px_1fr]">
        <div className="border-b border-[rgb(var(--line))] md:border-b-0 md:border-r">
          <PatientPortrait emotion={emotion} speaking={speaking} busy={busy} />
          <div className="space-y-3 p-4">
            <div>
              <p className="text-sm font-semibold">Mourad Benkhelifa, {t("58 ans", "58")}</p>
              <p className="subtle text-xs">{t("Urgences d'un CHU d'Alger · 02h10", "Algiers teaching-hospital ED · 02:10")}</p>
            </div>
            <dl className="grid grid-cols-4 gap-1 border-t border-[rgb(var(--line))] pt-3 text-center">
              {[["FC", String(hr), true], ["PA", "148/92", false], ["SpO₂", "95 %", false], ["FR", "20", false]].map(([k, v, alarm]) => (
                <div key={k as string}>
                  <dt className="subtle text-[10px] font-medium">{k}</dt>
                  <dd className={`font-mono text-[13px] font-semibold ${alarm ? "text-red-600" : ""}`}>
                    <motion.span key={v as string} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }} className="inline-block">{v}</motion.span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="flex min-h-[380px] flex-col">
          <div className="flex items-center justify-between border-b border-[rgb(var(--line))] px-4 py-3 text-xs">
            <span className="font-medium">{t("Interrogatoire", "History taking")}</span>
            <span className="subtle">{t("Démo gratuite · sans inscription", "Free demo · no sign-up")}</span>
          </div>
          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-4" style={{ maxHeight: 360 }} aria-live="polite">
            <AnimatePresence initial={false}>
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${m.role === "student" ? "rounded-br-md bg-[#1f6fe0] text-white" : "rounded-bl-md bg-[rgb(var(--panel-2))]"}`}>{m.text}</div>
                </motion.div>
              ))}
              {busy && (
                <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex w-fit gap-1 rounded-2xl bg-[rgb(var(--panel-2))] px-3.5 py-3" aria-label={t("Le patient répond", "The patient is answering")}>
                  {[0, 1, 2].map((k) => <span key={k} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[rgb(var(--ink-3))]" style={{ animationDelay: `${k * 120}ms` }} />)}
                </motion.div>
              )}
            </AnimatePresence>
            {err && <div className="text-xs text-danger">{err}</div>}
          </div>
          <div className="border-t border-[rgb(var(--line))] px-4 pt-3">
            <p className="subtle mb-2 text-xs">{t("Exemples de questions", "Example questions")}</p>
            <div className="flex flex-wrap gap-1.5 pb-3">
              {SUGGESTIONS[lang].map((s) => (
                <button key={s} onClick={() => ask(s)} className="rounded-full border border-[rgb(var(--line))] px-3 py-1 text-left text-[13px] transition hover:-translate-y-0.5 hover:border-[#2f86ff] hover:text-[#1f6fe0] disabled:opacity-50 dark:hover:text-[#6fb1ff]" disabled={busy}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <form
            className="flex gap-2 border-t border-[rgb(var(--line))] p-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
          >
            <label htmlFor="demo-q" className="sr-only">{t("Posez une question au patient", "Ask the patient a question")}</label>
            <input id="demo-q" className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Votre question… (ex. wach bik ?)", "Your question… (e.g. where does it hurt?)")} maxLength={300} />
            <button className="btn-primary px-3.5" disabled={busy || !text.trim()} aria-label={t("Envoyer", "Send")}>
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const EMOTION_FR: Record<string, string> = { neutral: "calme", anxious: "anxieux", pain: "douloureux", distressed: "en détresse", tired: "fatigué", relieved: "soulagé", irritated: "agacé" };
const EMOTION_EN: Record<string, string> = { neutral: "calm", anxious: "anxious", pain: "in pain", distressed: "distressed", tired: "tired", relieved: "relieved", irritated: "irritated" };

/** Real photograph of the patient (Unsplash, verified), framed on his face, with live speaking cues. */
function PatientPortrait({ emotion, speaking, busy }: { emotion: Emotion; speaking: boolean; busy: boolean }) {
  const t = useT();
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-[#0b132b] md:aspect-[3/4]">
      <motion.div className="absolute inset-0" animate={{ scale: [1, 1.025, 1] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
        <Image
          src={photoUrl("bedMan", 1600)}
          alt={t("Mourad, 58 ans, allongé dans son lit d'hôpital", "Mourad, 58, lying in his hospital bed")}
          fill
          sizes="(max-width:768px) 100vw, 260px"
          className="object-cover"
          style={{ objectPosition: "52% 12%", transform: "scale(2.3)", transformOrigin: "52% 16%" }}
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
      <AnimatePresence>
        {(speaking || busy) && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 ring-4 ring-inset ring-[#38e1ff]/60" />
        )}
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 pb-3 text-white">
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] backdrop-blur">{t("Semble", "Looks")} {t(EMOTION_FR[emotion] ?? emotion, EMOTION_EN[emotion] ?? emotion)}</span>
        <span className="flex h-5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3, 4].map((k) => (
            <motion.span key={k} className="w-[3px] rounded-full bg-[#38e1ff]" animate={speaking ? { height: [4, 16, 6, 18, 5] } : { height: 4 }} transition={{ duration: 0.8, repeat: speaking ? Infinity : 0, delay: k * 0.09 }} />
          ))}
        </span>
      </div>
    </div>
  );
}
