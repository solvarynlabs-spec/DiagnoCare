/**
 * Generative soundtrack for the promo film, synthesised with WebAudio (no audio file).
 * - "tension": minor pads, low filter, heartbeat pulse (lub-dub) — the problem.
 * - "hope": major pads, brighter filter, soft arpeggio — the solution.
 * Browsers only allow audio after a user gesture, so start() must be called from a click.
 */

type Mood = "tension" | "hope";

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz
// Chord progressions (MIDI notes)
const TENSION = [[57, 60, 64], [53, 57, 60], [55, 58, 62], [52, 56, 59]]; // Am, F, Gm, E
const HOPE = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]; // C, G, Am, F

export class FilmMusic {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private beat = 0;
  private mood: Mood = "tension";
  private voices: { osc: OscillatorNode[]; gain: GainNode }[] = [];
  readonly bpm = 72;

  get running() {
    return !!this.ctx && this.ctx.state === "running" && !!this.timer;
  }

  start() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 900;
      this.filter.Q.value = 0.7;
      this.filter.connect(this.master).connect(this.ctx.destination);
    }
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(now);
    this.master!.gain.setTargetAtTime(0.5, now, 0.8); // fade in
    if (!this.timer) {
      this.tick();
      this.timer = setInterval(() => this.tick(), (60 / this.bpm) * 500); // eighth notes
    }
  }

  stop(fade = 0.6) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0, now, fade / 3);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const ctx = this.ctx;
    setTimeout(() => {
      if (!this.timer) void ctx.suspend();
    }, fade * 1000 + 200);
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    this.mood = m;
    if (this.ctx && this.filter) this.filter.frequency.setTargetAtTime(m === "hope" ? 2600 : 900, this.ctx.currentTime, 1.2);
    this.beat = 0; // start the new progression on its first chord
  }

  dispose() {
    this.stop(0.1);
    setTimeout(() => void this.ctx?.close(), 400);
    this.ctx = null;
  }

  // ───────────────────────── Sequencer ─────────────────────────

  private tick() {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.05;
    const step = this.beat % 16; // 16 eighths = 1 bar of 8 beats... (2 bars of 4/4)
    const prog = this.mood === "hope" ? HOPE : TENSION;
    const chord = prog[Math.floor(this.beat / 16) % prog.length];

    if (step === 0) this.pad(chord, t, (60 / this.bpm) * 8);
    // Heartbeat on every beat: lub (strong) + dub (soft) — always in tension, lighter in hope.
    if (step % 2 === 0) {
      const strong = this.mood === "tension" ? 0.9 : 0.45;
      this.thump(t, strong);
      this.thump(t + 0.18, strong * 0.55);
    }
    // Arpeggio in the hopeful part.
    if (this.mood === "hope") {
      const notes = [chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[1] + 12];
      this.pluck(NOTE(notes[step % 4]), t, step % 4 === 0 ? 0.16 : 0.1);
    } else if (step === 8) {
      // A sparse, distant high note to keep the suspense.
      this.pluck(NOTE(chord[2] + 24), t, 0.05);
    }
    this.beat++;
  }

  private pad(chord: number[], t: number, dur: number) {
    const ctx = this.ctx!;
    // Release the previous pad smoothly.
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, 0.8);
      v.osc.forEach((o) => o.stop(t + 4));
    }
    this.voices = [];
    for (const n of [chord[0] - 12, ...chord]) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(n < chord[0] ? 0.09 : 0.05, t + 1.6);
      g.gain.setTargetAtTime(0.03, t + dur * 0.7, 1.5);
      const oscs = [-6, 6].map((detune) => {
        const o = ctx.createOscillator();
        o.type = this.mood === "hope" ? "triangle" : "sawtooth";
        o.frequency.value = NOTE(n);
        o.detune.value = detune;
        o.connect(g);
        o.start(t);
        return o;
      });
      g.connect(this.filter!);
      this.voices.push({ osc: oscs, gain: g });
    }
  }

  private thump(t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(vol * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g).connect(this.master!); // bypass the filter: keep the low end
    o.start(t);
    o.stop(t + 0.25);
  }

  private pluck(freq: number, t: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    o.connect(g).connect(this.filter!);
    o.start(t);
    o.stop(t + 1);
  }
}
