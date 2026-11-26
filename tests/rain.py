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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=9; G.data.weather='clear'")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"(()=>{{const f={F}; for(const x of [28,29,30]) f.setGround(x,14,'tilled'); G.data.tir.spot=3; f.tir.s.setPosition(37*16+8,12*16+8); }})()")
        await pg.wait_for_timeout(1500)
        print("clear:", await pg.evaluate("['28,14','29,14','30,14'].map(k=>G.data.ground[k])"))
        await pg.evaluate("G.data.weather='rain'"); await pg.wait_for_timeout(1600)
        print("rain:", await pg.evaluate("['28,14','29,14','30,14'].map(k=>G.data.ground[k])"))
        await pg.evaluate(f"{F}.player.setPosition(37*16, 13*16)"); await pg.wait_for_timeout(9000)
        print("tir goal/spot:", await pg.evaluate(f"[{F}.tir.goal, G.data.tir.spot, Math.round({F}.tir.s.x/16), Math.round({F}.tir.s.y/16)]"))
        await pg.screenshot(path="/home/claude/test/rain_tir.png")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
