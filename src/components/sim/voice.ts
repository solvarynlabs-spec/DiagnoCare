"use client";

import type { Lang } from "@/lib/sim/types";

/**
 * Browser-native voice layer (Web Speech API). Kept behind a tiny interface so a
 * server-side STT/TTS provider (streaming ASR, neural voices) can replace it later.
 */
export interface VoiceProvider {
  supported: { stt: boolean; tts: boolean };
  listen(lang: Lang, onResult: (text: string, final: boolean) => void, onEnd: () => void): () => void;
  speak(text: string, lang: Lang, opts?: { pitch?: number; rate?: number }): void;
  stopSpeaking(): void;
}

const LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-FR" };

type SR = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
};

export function browserVoice(): VoiceProvider {
  const w = typeof window !== "undefined" ? (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }) : {};
  const Rec = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  const tts = typeof window !== "undefined" && "speechSynthesis" in window;
  return {
    supported: { stt: !!Rec, tts },
    listen(lang, onResult, onEnd) {
      if (!Rec) return () => {};
      const r = new Rec();
      r.lang = LOCALE[lang];
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (e) => {
        let text = "";
        let final = false;
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          final = final || e.results[i].isFinal;
        }
        onResult(text, final);
      };
      r.onend = onEnd;
      r.onerror = onEnd;
      r.start();
      return () => r.stop();
    },
    speak(text, lang, opts) {
      if (!tts) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/^\((Mother|Husband|La mère|Le mari|الأم)\)\s*/i, ""));
      u.lang = LOCALE[lang];
      u.pitch = opts?.pitch ?? 1;
      u.rate = opts?.rate ?? 0.98;
      const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith(LOCALE[lang].slice(0, 2)));
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    },
    stopSpeaking() {
      if (tts) window.speechSynthesis.cancel();
    },
  };
}
