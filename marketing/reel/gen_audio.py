"""Voice-over + timeline + soundtrack for the Clinika reel.

1. Synthesises each line with edge-tts (neural voices).
2. Measures each clip's duration and loudness per video frame (lip-sync data).
3. Lays the lines out on a timeline (timeline.json) and mixes voices + a soft music bed (audio.m4a).
"""
import asyncio
import json
import struct
import subprocess
from pathlib import Path

import edge_tts
import imageio_ffmpeg

import music

HERE = Path(__file__).parent
OUT = HERE / "build"
OUT.mkdir(exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SR = 16000

script = json.loads((HERE / "script.json").read_text(encoding="utf-8"))


async def synth(line):
    v = script["voices"][line["who"]]
    path = OUT / f"{line['id']}.mp3"
    await edge_tts.Communicate(line["text"], v["voice"], rate=v["rate"], pitch=v["pitch"]).save(str(path))
    return path


def envelope(path):
    """Mono 16 kHz PCM → RMS per video frame, normalised 0..1, plus duration."""
    raw = subprocess.run([FFMPEG, "-v", "quiet", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    n = len(raw) // 2
    samples = struct.unpack(f"<{n}h", raw[: n * 2])
    per = SR // FPS
    env = []
    for i in range(0, n, per):
        chunk = samples[i : i + per]
        if not chunk:
            break
        env.append((sum(s * s for s in chunk) / len(chunk)) ** 0.5)
    peak = max(env) or 1
    return n / SR, [round(min(1.0, e / (peak * 0.6)), 3) for e in env]


async def main():
    paths = await asyncio.gather(*(synth(l) for l in script["lines"]))
    t = 0.6
    timeline = []
    for line, path in zip(script["lines"], paths):
        dur, env = envelope(path)
        # Scene transitions get a little more breathing room than lines within a scene.
        if timeline and timeline[-1]["scene"] != line["scene"]:
            t += 0.45
        timeline.append({**line, "start": round(t, 3), "dur": round(dur, 3), "env": env, "file": path.name})
        t += dur + 0.3
    total = round(t + 2.2, 2)  # hold on the call-to-action
    (OUT / "timeline.json").write_text(json.dumps({"fps": FPS, "total": total, "lines": timeline}, ensure_ascii=False), encoding="utf-8")

    # Original soundtrack (music.py), ducked under the voices with a side-chain compressor.
    info = music.build(timeline, total, OUT / "music.wav")
    tl = json.loads((OUT / "timeline.json").read_text(encoding="utf-8"))
    tl.update(info)
    (OUT / "timeline.json").write_text(json.dumps(tl, ensure_ascii=False), encoding="utf-8")
    inputs = ["-i", str(OUT / "music.wav")]
    filters = [f"[0:a]aresample=44100,asplit[ml][mr];[mr]adelay=12[mr2];[ml][mr2]join=inputs=2:channel_layout=stereo,afade=t=out:st={total - 1:.2f}:d=1,volume=0.62[m]"]
    labels = []
    for i, l in enumerate(timeline, start=1):
        inputs += ["-i", str(OUT / l["file"])]
        ms = int(l["start"] * 1000)
        filters.append(f"[{i}:a]aresample=44100,highpass=f=70,equalizer=f=3000:t=q:w=1.2:g=2,aecho=0.85:0.6:28:0.10,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms},volume=1.35[v{i}]")
        labels.append(f"[v{i}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,asplit[vk][vo]")
    filters.append("[m][vk]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=400[md]")
    filters.append("[md][vo]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100,alimiter=limit=0.9[out]")
    subprocess.run([FFMPEG, "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]", "-t", str(total), "-ac", "2", "-c:a", "aac", "-b:a", "192k", str(OUT / "audio.m4a")], check=True)
    print(f"OK — {len(timeline)} répliques, durée totale {total} s")
    for l in timeline:
        print(f"  {l['start']:6.2f}s  {l['who']:9s} {l['dur']:.2f}s  {l['caption']}")


asyncio.run(main())
