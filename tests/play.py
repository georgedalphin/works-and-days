import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console:"+m.text) if m.type=="error" else None)
        await pg.goto("file:///home/claude/works-and-days/dist/index.html")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/home/claude/test/1_title.png")
        await pg.keyboard.press("Enter")   # new life
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path="/home/claude/test/2_house_help.png")
        await pg.keyboard.press("Escape")
        await pg.wait_for_timeout(300)
        # walk down out of the hut
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1500); await pg.keyboard.up("s")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path="/home/claude/test/3_farm.png")
        # walk around and try working
        await pg.keyboard.down("d"); await pg.wait_for_timeout(1800); await pg.keyboard.up("d")
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1500); await pg.keyboard.up("s")
        for i in range(4):
            await pg.keyboard.press("Space"); await pg.wait_for_timeout(250)
        await pg.screenshot(path="/home/claude/test/4_work.png")
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
