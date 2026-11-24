import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        # clear a patch, put a stone 2 tiles right of the player and another 3 tiles right
        await pg.evaluate(f"""(()=>{{const s={F}; for(let y=12;y<19;y++) for(let x=14;x<26;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }}
          s.objects.putTileAt(6,22,15); s.objects.putTileAt(6,24,14); s.player.setPosition(20*16+8, 15*16+3); s.player.setVelocity(0,0); s.facing=1;
          G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='mattock'); G.data.aretai.Kratos=12; G.essence.Earth=99; G.essence.Fire=99; }})()""")
        await pg.wait_for_timeout(300)
        # world -> screen: use the camera
        def scr(tx, ty): return f"(()=>{{const c={F}.cameras.main; return [({tx}*16+8 - c.worldView.x)*c.zoom, ({ty}*16+8 - c.worldView.y)*c.zoom];}})()"
        x,y = await pg.evaluate(scr(22,15)); await pg.mouse.move(x,y); await pg.wait_for_timeout(300)
        print("cursor mode:", await pg.evaluate(f"{F}.cursorMode"), "| aim tile:", await pg.evaluate(f"{F}.facingTile()"), "| glow:", await pg.evaluate(f"{F}.focusGlow.visible"))
        await pg.screenshot(path="/home/claude/test/c_reach.png")
        await pg.mouse.click(x,y); await pg.wait_for_timeout(400)
        print("left click (2 tiles):", await msg(pg), "| stone gone:", await pg.evaluate(f"({F}.objects.getTileAt(22,15)?.index ?? -1) === -1"), "| facing:", await pg.evaluate(f"{F}.facing"))
        x,y = await pg.evaluate(scr(24,14)); await pg.mouse.move(x,y); await pg.wait_for_timeout(300)
        print("3 tiles away -> aim tile:", await pg.evaluate(f"{F}.facingTile()"), "| glow:", await pg.evaluate(f"{F}.focusGlow.visible"))
        await pg.screenshot(path="/home/claude/test/c_far.png")
        await pg.mouse.click(x,y); await pg.wait_for_timeout(300); print("left click (3 tiles):", await msg(pg))
        # right click a target within reach: the well
        wt = await pg.evaluate(f"(()=>{{const s={F}; const t=s.targets.find(t=>/well/i.test(t.label)); s.player.setPosition(t.x-20, t.y+6); return [t.x,t.y];}})()")
        await pg.wait_for_timeout(300)
        x,y = await pg.evaluate(f"(()=>{{const c={F}.cameras.main; return [({wt[0]} - c.worldView.x)*c.zoom, ({wt[1]} - c.worldView.y)*c.zoom];}})()")
        await pg.mouse.move(x,y); await pg.wait_for_timeout(300)
        print("target under cursor:", await pg.evaluate(f"{F}.current && {F}.current.label"))
        await pg.mouse.click(x,y, button="right"); await pg.wait_for_timeout(300); print("right click:", await msg(pg))
        # keyboard fallback: mouse leaves the game
        await pg.evaluate(f"{F}.mouseIn=false; {F}.facing=2")
        print("mouse out -> cursor mode:", await pg.evaluate(f"{F}.cursorMode"), "| aim tile:", await pg.evaluate(f"{F}.facingTile()"), "| player tile:", await pg.evaluate(f"{F}.playerTile()"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
