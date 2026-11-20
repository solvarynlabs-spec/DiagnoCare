"""Films reel.html frame by frame with headless Chrome and encodes the MP4 (H.264 + AAC).

Usage: python render.py [--preview SECONDS]   (preview renders a few stills instead of the video)
"""
import asyncio
import base64
import json
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
from playwright.async_api import async_playwright

HERE = Path(__file__).parent
BUILD = HERE / "build"
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def build_html():
    tl = json.loads((BUILD / "timeline.json").read_text(encoding="utf-8"))
    shots = []
    for name in ["screen_chat.png", "screen_exam.png", "screen_ecg.png", "screen_score.png", "screen_dash.png"]:
        shots.append("data:image/png;base64," + base64.b64encode((BUILD / name).read_bytes()).decode())
    html = (HERE / "reel.template.html").read_text(encoding="utf-8")
    html = html.replace("/*__TIMELINE__*/", json.dumps(tl, ensure_ascii=False)).replace("/*__SCREENS__*/", json.dumps(shots))
    out = BUILD / "reel.html"
    out.write_text(html, encoding="utf-8")
    return out, tl


async def main():
    page_file, tl = build_html()
    preview = "--preview" in sys.argv
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)
        page = await browser.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        await page.goto(page_file.as_uri())
        await page.evaluate("ready()")
        await page.wait_for_timeout(500)

        if preview:
            for t in [float(x) for x in sys.argv[2:]] or [1.5, 12, 18, 21.2, 25, 31, 36, 41, 45.5, 50, 55, 62]:
                await page.evaluate(f"render({t})")
                await page.screenshot(path=str(BUILD / f"preview_{t:05.1f}.jpg"), type="jpeg", quality=80)
            print("aperçus OK")
            await browser.close()
            return

        fps, total = tl["fps"], tl["total"]
        n = int(total * fps)
        final = HERE / "clinika-reel.mp4"
        out = BUILD / "render-tmp.mp4"
        enc = subprocess.Popen(
            [FFMPEG, "-v", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
             "-i", str(BUILD / "audio.m4a"), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
             "-af", "apad", "-c:a", "aac", "-b:a", "192k", "-t", f"{n / fps:.3f}", "-movflags", "+faststart", str(out)],
            stdin=subprocess.PIPE,
        )
        for i in range(n):
            await page.evaluate(f"render({i / fps})")
            enc.stdin.write(await page.screenshot(type="jpeg", quality=92))
            if i % 150 == 0:
                print(f"  image {i}/{n}", flush=True)
        enc.stdin.close()
        enc.wait()
        await browser.close()
        if enc.returncode != 0:
            raise SystemExit("encodage échoué")
        out.replace(final)  # only replace the delivered file once the new one is complete
        print(f"OK — {final.name} ({n} images, {total} s)")


asyncio.run(main())
