import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{window._log.push(t); s0(t)}; 0")
        print("sec/hour", await pg.evaluate("G.secondsPerClockHour"))
        await pg.evaluate(f"G.data.fatigue=50; {F}.player.setPosition(30*16+8, 15*16+8)")
        await pg.wait_for_timeout(1500); f1 = await pg.evaluate("G.data.fatigue")
        await pg.wait_for_timeout(8000); f2 = await pg.evaluate("G.data.fatigue")
        print(f"still: after 1.5s {f1:.2f}, after 9.5s {f2:.2f}  stillT", await pg.evaluate(f"{F}.stillT.toFixed(1)"))
        await pg.keyboard.down("d"); await pg.wait_for_timeout(3000); await pg.keyboard.up("d")
        print("walking reset stillT:", await pg.evaluate(f"{F}.stillT.toFixed(2)"))
        # shallows: lay a shallow tile underfoot
        await pg.evaluate(f"(()=>{{const f={F}; const o=f.objLayer(); const t=o.worldToTileXY(f.player.x,f.player.y+5); o.putTileAt(42,t.x,t.y); }})()")
        f3 = await pg.evaluate("G.data.fatigue"); await pg.wait_for_timeout(500); f4 = await pg.evaluate("G.data.fatigue")
        print(f"shallows: {f3:.2f} -> {f4:.2f}")
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/home/claude/test/rest.png")
        print("log:", [m for m in await pg.evaluate("window._log") if m])
        print("errors:", errs)
        await b.close()
asyncio.run(main())
