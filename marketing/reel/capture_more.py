"""Extra phone-size screenshots: case catalogue and dashboard."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OUT = Path(__file__).parent / "build"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome", headless=True)
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="fr-FR", color_scheme="dark")
        await ctx.add_init_script("try{localStorage.setItem('medsim-theme','dark')}catch(e){}")
        page = await ctx.new_page()
        await page.goto(f"{BASE}/login")
        await page.evaluate("""() => fetch('/api/auth/demo-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account:'student'})})""")
        for path, name in [("/app/cases", "screen_cases.png"), ("/app", "screen_dash.png")]:
            await page.goto(BASE + path)
            await page.wait_for_timeout(5000)
            await page.add_style_tag(content="nextjs-portal{display:none!important}")
            await page.wait_for_timeout(400)
            await page.screenshot(path=str(OUT / name), full_page=True)
        await b.close()
    print("ok")

asyncio.run(main())
