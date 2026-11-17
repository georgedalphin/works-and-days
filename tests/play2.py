import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html")
        await pg.wait_for_timeout(1200)
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1000)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1600); await pg.keyboard.up("s")
        await pg.wait_for_timeout(700)
        await pg.screenshot(path="/home/claude/test/5_farm.png")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(1200); await pg.keyboard.up("d")
        await pg.keyboard.down("s"); await pg.wait_for_timeout(500); await pg.keyboard.up("s")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(700); await pg.keyboard.up("d")
        for i in range(6):
            await pg.keyboard.press("Space"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/6_work.png")
        # back to door and inside
        await pg.keyboard.down("a"); await pg.wait_for_timeout(1900); await pg.keyboard.up("a")
        await pg.keyboard.down("w"); await pg.wait_for_timeout(1500); await pg.keyboard.up("w")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path="/home/claude/test/7_back.png")
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
