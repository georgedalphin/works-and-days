import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3")
        # Walk a loop of screens and check every shared edge lines up, and every gap is open on both sides.
        async def visit(wx, wy, entry="W", at=None):
            await pg.evaluate(f"G.data.wx={wx}; G.data.wy={wy}; G.data.entry='{entry}'; G.data.entryAt={'null' if at is None else at}; G.data.scene='Wild'; game.scene.getScene(game.scene.getScenes(true).find(s=>s.scene.key!=='UI').scene.key).goTo('Wild')")
            await pg.wait_for_timeout(1300)
            return await pg.evaluate(f"""(()=>{{const s={Wd}; const o=s.objects; const open={{}};
              for (const sd of ['N','S','E','W']) open[sd]=s.gates[sd].map(g=>{{const [x,y]= sd==='N'?[g,0]:sd==='S'?[g,29]:sd==='W'?[0,g]:[39,g]; return (o.getTileAt(x,y)?.index??-1)===-1;}});
              return {{gates:s.gates, open, p:[Math.floor(s.player.x/16), Math.floor(s.player.y/16)]}};}})()""")
        A = await visit(2,1); B = await visit(3,1); C = await visit(2,2)
        print("(2,1) gates", A["gates"], "open", A["open"])
        print("(3,1) W gates", B["gates"]["W"], "== (2,1) E", A["gates"]["E"], B["gates"]["W"]==A["gates"]["E"])
        print("(2,2) N gates", C["gates"]["N"], "== (2,1) S", A["gates"]["S"], C["gates"]["N"]==A["gates"]["S"])
        allopen = all(all(v) for g in (A,B,C) for v in g["open"].values())
        print("every gap open:", allopen)
        # Walk out of (2,1) through a specific east gap: arrive at the same y on (3,1)
        g = A["gates"]["E"][-1]
        await visit(2,1)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(39*16+12, {g}*16+8); }})()"); await pg.wait_for_timeout(1500)
        res = await pg.evaluate(f"[G.data.wx, G.data.wy, Math.floor({Wd}.player.y/16)]")
        print("walked east through gap y", g, "-> arrived", res)
        await pg.screenshot(path="/home/claude/test/g_arrive.png")
        # Count how many gates per side across many screens
        dist = await pg.evaluate("""(()=>{ const c={1:0,2:0,3:0}; const s=game.scene.getScene('Wild'); return c; })()""")
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
