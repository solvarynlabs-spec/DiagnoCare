"""Original soundtrack for the Clinika reel, synthesised from scratch (no samples, no third-party music).

Structure follows the story (all times come from timeline.json):
  intro (problem)  → dark minor pads, soft plucks, heartbeat
  prof             → build-up: brighter chords, snare roll, riser
  drop (product)   → full beat at 120 BPM: kick, clap, hats, pumping bass and pads, arpeggio
  happy            → breakdown: pads + arpeggio only, then a roll back in
  cta              → full beat, final chord hit and tail
Writes build/music.wav (mono, 22.05 kHz; the mix stage widens and resamples it).
"""
import math
import random
import struct
import wave
from pathlib import Path

SR = 22050
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
random.seed(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def lowpass(x, cutoff):
    a = 1 - math.exp(-2 * math.pi * cutoff / SR)
    y, out = 0.0, []
    for v in x:
        y += a * (v - y)
        out.append(y)
    return out


def saw(f, n, phase=0.0):
    inc = f / SR
    p, out = phase, []
    for _ in range(n):
        out.append(2 * p - 1)
        p += inc
        if p >= 1:
            p -= 1
    return out


# ───────────── instruments (one-shots, cached) ─────────────
_cache = {}


def pad(notes, dur, cutoff):
    key = ("pad", notes, dur, cutoff)
    if key not in _cache:
        n = int(dur * SR)
        acc = [0.0] * n
        for m in notes:
            for det in (-0.12, 0.12):
                s = saw(midi(m + det), n, random.random())
                for i in range(n):
                    acc[i] += s[i]
        acc = lowpass(acc, cutoff)
        att, rel = int(0.25 * SR), int(0.35 * SR)
        for i in range(n):
            e = min(1.0, i / att, (n - i) / rel)
            acc[i] *= e * 0.09
        _cache[key] = acc
    return _cache[key]


def pluck(m, dur=0.35, bright=2600):
    key = ("pluck", m, dur, bright)
    if key not in _cache:
        n = int(dur * SR)
        f = midi(m)
        s = saw(f, n)
        s = lowpass([s[i] * 0.6 + 0.4 * math.sin(2 * math.pi * f * i / SR) for i in range(n)], bright)
        _cache[key] = [s[i] * math.exp(-i / SR * 9) * 0.32 for i in range(n)]
    return _cache[key]


def bass(m, dur):
    key = ("bass", m, dur)
    if key not in _cache:
        n = int(dur * SR)
        f = midi(m)
        s = saw(f, n)
        s = lowpass([0.5 * s[i] + 0.8 * math.sin(2 * math.pi * f * i / SR) for i in range(n)], 420)
        _cache[key] = [s[i] * min(1.0, i / 60, (n - i) / 400) * 0.5 for i in range(n)]
    return _cache[key]


def kick(gain=1.0):
    key = ("kick", gain)
    if key not in _cache:
        n = int(0.4 * SR)
        ph, out = 0.0, []
        for i in range(n):
            t = i / SR
            f = 45 + 110 * math.exp(-t * 28)
            ph += 2 * math.pi * f / SR
            out.append(math.sin(ph) * math.exp(-t * 7) * 0.95 * gain)
        _cache[key] = out
    return _cache[key]


def clap():
    if "clap" not in _cache:
        n = int(0.22 * SR)
        noise = [random.uniform(-1, 1) for _ in range(n)]
        hp = [noise[i] - noise[i - 1] if i else 0 for i in range(n)]
        bp = lowpass(hp, 3200)
        env = lambda t: (math.exp(-t * 26) + 0.5 * math.exp(-max(0, t - 0.012) * 30) * (t > 0.012) + 0.4 * math.exp(-max(0, t - 0.024) * 18) * (t > 0.024))
        _cache["clap"] = [bp[i] * env(i / SR) * 1.6 for i in range(n)]
    return _cache["clap"]


def hat(open_=False):
    key = ("hat", open_)
    if key not in _cache:
        n = int((0.18 if open_ else 0.05) * SR)
        noise = [random.uniform(-1, 1) for _ in range(n + 1)]
        _cache[key] = [(noise[i + 1] - noise[i]) * math.exp(-i / SR * (14 if open_ else 70)) * 0.13 for i in range(n)]
    return _cache[key]


def noise_sweep(dur, up=True, gain=0.25):
    n = int(dur * SR)
    out, y = [], 0.0
    for i in range(n):
        p = i / n
        c = 300 + 6000 * (p if up else 1 - p) ** 2
        a = 1 - math.exp(-2 * math.pi * c / SR)
        y += a * (random.uniform(-1, 1) - y)
        env = p ** 2 if up else (1 - p) ** 1.5
        out.append(y * env * gain)
    return out


def whoosh():
    if "whoosh" not in _cache:
        n = int(0.6 * SR)
        out, y = [], 0.0
        for i in range(n):
            p = i / n
            c = 400 + 5000 * math.sin(math.pi * p)
            a = 1 - math.exp(-2 * math.pi * c / SR)
            y += a * (random.uniform(-1, 1) - y)
            out.append(y * math.sin(math.pi * p) ** 2 * 0.22)
        _cache["whoosh"] = out
    return _cache["whoosh"]


def build(timeline, total, out_path):
    lines = timeline
    scene_start = {}
    for l in lines:
        scene_start.setdefault(l["scene"], l["start"] - 0.45)
    t_prof = scene_start["prof"]
    t_drop = scene_start["cases"]
    t_happy = scene_start["happy"]
    t_cta = scene_start["cta"]
    N = int((total + 0.5) * SR)
    bus = {k: [0.0] * N for k in ("drums", "bass", "pad", "arp", "fx")}

    def put(name, sig, t, g=1.0):
        i0 = int(t * SR)
        b = bus[name]
        for j, v in enumerate(sig):
            k = i0 + j
            if 0 <= k < N:
                b[k] += v * g

    # Chords — intro (A minor, tense), build (F→G), drop (C G Am F, uplifting)
    AM, F, DM, E, C, G = (57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59), (48, 52, 55), (55, 59, 62)
    intro_prog = [AM, F, DM, E]
    drop_prog = [(C, 36), (G, 43), (AM, 45), (F, 41)]

    # Bar grid aligned so a downbeat lands exactly on the drop.
    k = -math.ceil(t_drop / BAR)
    while True:
        bt = t_drop + k * BAR
        if bt >= total:
            break
        sec = "intro" if bt < t_prof - 0.01 else "build" if bt < t_drop - 0.01 else "happy" if t_happy <= bt < t_cta - BAR + 0.01 else "full"
        if sec == "intro":
            ch = intro_prog[k % 4]
            put("pad", pad(ch, BAR, 900), bt)
            for i, m in enumerate([ch[0] + 12, ch[2] + 12, ch[1] + 12, ch[2] + 12]):
                put("arp", pluck(m, 0.6, 1400), bt + i * BEAT, 0.55)
            # Heartbeat (lub-dub)
            for b in range(2):
                put("drums", kick(0.45), bt + b * 2 * BEAT)
                put("drums", kick(0.3), bt + b * 2 * BEAT + 0.22)
        elif sec == "build":
            ch = G if k == -1 else (F if k % 2 == 0 else G)
            put("pad", pad(ch, BAR, 1500), bt)
            for i in range(8):
                put("arp", pluck(ch[i % 3] + 12, 0.3, 2200), bt + i * BEAT / 2, 0.6)
            put("drums", kick(0.6), bt)
            put("drums", kick(0.6), bt + 2 * BEAT)
        else:
            ch, root = drop_prog[k % 4]
            if sec == "full":
                put("pad", pad(ch, BAR, 2600), bt)
                for b in range(4):
                    put("drums", kick(), bt + b * BEAT)
                    put("drums", hat(b % 2 == 1), bt + b * BEAT + BEAT / 2)
                    put("drums", hat(), bt + b * BEAT + BEAT / 4, 0.6)
                    put("drums", hat(), bt + b * BEAT + 3 * BEAT / 4, 0.6)
                    if b % 2 == 1:
                        put("drums", clap(), bt + b * BEAT)
                    put("bass", bass(root, BEAT / 2 * 0.9), bt + b * BEAT + BEAT / 2)
                    put("bass", bass(root + 12, BEAT / 4 * 0.9), bt + b * BEAT + 3 * BEAT / 4, 0.5)
                arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12]
                for i in range(16):
                    put("arp", pluck(arp[i % 8], 0.25, 3200), bt + i * BEAT / 4, 0.42)
            else:  # happy breakdown: warm and open
                put("pad", pad(ch, BAR, 1800), bt, 1.2)
                for i in range(8):
                    put("arp", pluck([ch[0] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12][i % 4], 0.5, 2000), bt + i * BEAT / 2, 0.5)
                put("bass", bass(root, BAR * 0.95), bt, 0.6)
        k += 1

    # Build-up FX: riser + accelerating snare roll into the drop; same, shorter, before the CTA comes back in.
    put("fx", noise_sweep(min(3.5, t_drop - t_prof)), t_drop - min(3.5, t_drop - t_prof), 1.0)
    roll_t = t_drop - BAR
    for i in range(16):
        put("drums", clap(), roll_t + i * (BAR / 16), 0.25 + 0.6 * i / 16)
    put("drums", kick(1.2), t_drop)
    put("fx", noise_sweep(1.6, up=False, gain=0.35), t_drop)
    back = t_cta - BAR
    put("fx", noise_sweep(BAR * 0.9), back, 0.7)
    for i in range(8):
        put("drums", clap(), back + BAR / 2 + i * BAR / 16, 0.2 + 0.5 * i / 8)

    # Whoosh on every scene change.
    for name, st in scene_start.items():
        if name not in ("hook", "cases"):
            put("fx", whoosh(), st - 0.25, 0.9)

    # Ending: big final chord + kick, long tail.
    end_t = total - 3.2
    put("pad", pad(C, 3.2, 3000), end_t, 1.4)
    put("drums", kick(1.1), end_t)
    put("fx", noise_sweep(1.8, up=False, gain=0.3), end_t)

    # Side-chain pump on pads and bass whenever the four-on-the-floor kick is playing.
    for i in range(N):
        t = i / SR
        if t >= t_drop and not (t_happy <= t < t_cta - BAR) and t < end_t:
            ph = ((t - t_drop) % BEAT) / BEAT
            g = 0.45 + 0.55 * min(1.0, ph / 0.35)
            bus["pad"][i] *= g
            bus["bass"][i] *= g

    gains = {"drums": 0.85, "bass": 0.9, "pad": 1.0, "arp": 0.8, "fx": 0.9}
    mix = [sum(bus[b][i] * gains[b] for b in bus) for i in range(N)]
    peak = max(abs(v) for v in mix) or 1
    mix = [v / peak * 0.89 for v in mix]
    with wave.open(str(out_path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(v * 32767)) for v in mix))
    return {"drop": round(t_drop, 3), "bpm": BPM}


if __name__ == "__main__":
    import json
    tl = json.loads((Path(__file__).parent / "build" / "timeline.json").read_text(encoding="utf-8"))
    print(build(tl["lines"], tl["total"], Path(__file__).parent / "build" / "music.wav"))
