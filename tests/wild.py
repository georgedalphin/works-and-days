import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html")
        await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1000)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1600); await pg.keyboard.up("s"); await pg.wait_for_timeout(800)
        F="game.scene.getScene('Farm')"
        # go to east opening
        await pg.evaluate(f"{F}.player.setPosition(45*16,16*16+8)")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(1200); await pg.keyboard.up("d"); await pg.wait_for_timeout(700)
        info = lambda: pg.evaluate("[G.data.scene,G.data.wx,G.data.wy,G.locationLabel()]")
        print(await info(), await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        await pg.screenshot(path="/home/claude/test/40_wild1.png")
        # keep walking east through center path: teleport to east gate
        Wd="game.scene.getScene('Wild')"
        for i in range(3):
            await pg.evaluate(f"{Wd}.player.setPosition(38*16,15*16+8)")
            await pg.keyboard.down("d"); await pg.wait_for_timeout(900); await pg.keyboard.up("d"); await pg.wait_for_timeout(700)
            print(await info(), await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
            await pg.screenshot(path=f"/home/claude/test/4{i+1}_wild.png")
        print("ERRS so far", errs)
        # chop something in the wild
        res = await pg.evaluate(f"""(()=>{{const s={Wd};for(let y=2;y<28;y++)for(let x=2;x<38;x++){{const t=s.objects.getTileAt(x,y),l=s.objects.getTileAt(x-1,y);if(t&&t.index===4&&l&&l.index===-1){{s.player.setPosition((x-1)*16+8,y*16+3);s.facing=2;return [x,y];}}}}}})()""")
        print("brush", res)
        await pg.wait_for_timeout(100)
        await pg.keyboard.press("3"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(200)
        print("cleared", await pg.evaluate("JSON.stringify(G.data.screens[G.data.wx+','+G.data.wy].cleared)"))
        # walk back west 3 times then into farm
        for i in range(4):
            await pg.evaluate(f"{Wd}.player.setPosition(2*16,15*16+8)")
            await pg.keyboard.down("a"); await pg.wait_for_timeout(700); await pg.keyboard.up("a"); await pg.wait_for_timeout(700)
            print(await info(), await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        # south road
        await pg.evaluate(f"{F}.player.setPosition(24*16+8,34*16)")
        await pg.keyboard.down("s"); await pg.wait_for_timeout(900); await pg.keyboard.up("s"); await pg.wait_for_timeout(700)
        print(await info())
        await pg.screenshot(path="/home/claude/test/45_road.png")
        print("screens", await pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(G.data.screens).map(([k,v])=>[k,v.terrain+' '+v.feature])))"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
