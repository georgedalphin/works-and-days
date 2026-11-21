import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        await pg.evaluate("game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').modal=false; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        F="game.scene.getScene('Farm')"
        async def face(kind):
            return await pg.evaluate(f"""(()=>{{const s={F};for(let y=3;y<33;y++)for(let x=4;x<44;x++){{const t=s.objects.getTileAt(x,y),l=s.objects.getTileAt(x-1,y);if(t&&t.index==={kind}&&(!l||l.index===-1)){{s.player.setPosition((x-1)*16+8,y*16+3);s.facing=2;return [x,y];}}}}}})()""")
        print("tree", await face(7)); await pg.wait_for_timeout(700)
        await pg.keyboard.press("4")
        for i in range(3):
            await pg.evaluate("G.essence.Earth=G.essenceMax.Earth;G.essence.Fire=G.essenceMax.Fire")
            await pg.keyboard.press("Space"); await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(150); await pg.screenshot(path="/home/claude/test/90_fell.png")
        await pg.wait_for_timeout(300); await pg.screenshot(path="/home/claude/test/91_fell.png")
        print(await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        print("stone", await face(6)); await pg.wait_for_timeout(700)
        await pg.keyboard.press("5"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(90)
        await pg.screenshot(path="/home/claude/test/92_stone.png")
        print(await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        await pg.wait_for_timeout(800)
        print("leftover objects", await pg.evaluate(f"{F}.children.list.filter(o=>o.type==='Rectangle'&&o.depth>0&&o.width===2).length"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
