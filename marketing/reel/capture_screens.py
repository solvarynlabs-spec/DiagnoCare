"""Real screenshots of Clinika (phone size) for the reel's product scenes."""
import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

BASE = "http://localhost:3000"
OUT = Path(__file__).parent / "build"
CONSULT = "cmwnl531c003a0usw042mrawe"  # asthma case (Rania)
REPORT = "/app/reports/cmwnbe48v001c0uswhqz30mf0"  # glaucoma case report
HIDE_DEV = "nextjs-portal{display:none!important}"


async def shot(page, name, extra_css=""):
    await page.add_style_tag(content=HIDE_DEV + extra_css)
    await page.wait_for_timeout(400)
    await page.screenshot(path=str(OUT / name))


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)
        ctx = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True, locale="fr-FR", color_scheme="dark")
        await ctx.add_init_script("try{localStorage.setItem('medsim-theme','dark')}catch(e){}")
        page = await ctx.new_page()
        await page.goto(f"{BASE}/login")
        await page.evaluate("""() => fetch('/api/auth/demo-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({account:'student'})})""")

        # A short, realistic exchange with the virtual patient (through the app's own API).
        for q in ["Bonjour, je suis l'étudiante. Qu'est-ce qui vous amène ?", "Depuis quand êtes-vous essoufflée ?", "Vous avez déjà eu des crises d'asthme ?"]:
            await page.evaluate("""async ([id, q]) => { await fetch(`/api/sessions/${id}/message`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text:q})}) }""", [CONSULT, q])

        # 1. Dialogue (the 3D tile is hidden so the conversation fills the phone)
        await page.goto(f"{BASE}/app/consult/{CONSULT}")
        await page.wait_for_timeout(6000)
        await page.add_style_tag(content="#patient-panel>div:first-child{display:none!important}")
        await page.evaluate("document.getElementById('patient-panel').scrollIntoView({block:'start'})")
        await page.wait_for_timeout(1200)
        await shot(page, "screen_chat.png")

        # 2. Bedside exam: patient photo with clickable zones
        await page.evaluate("document.querySelector('.dark.fixed').scrollTo(0,0)")
        await page.locator("nav[aria-label='Outils de consultation'] button", has_text="Ausculter").click()
        await page.wait_for_timeout(2500)
        await shot(page, "screen_exam.png")

        # 3. Detailed score (dark theme)
        await page.goto(f"{BASE}{REPORT}")
        await page.wait_for_timeout(5000)
        await shot(page, "screen_score.png")

        # 4. ECG workshop tracing
        await page.goto(f"{BASE}/app/workshops/ecg")
        await page.wait_for_timeout(4000)
        await page.evaluate("document.querySelector('svg[aria-label=\"Tracé ECG 12 dérivations\"]').scrollIntoView({block:'center'})")
        await shot(page, "screen_ecg.png")
        await browser.close()
    print("captures OK")


asyncio.run(main())
