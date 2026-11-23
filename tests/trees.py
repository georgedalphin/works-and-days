import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
async def setup(b):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
    if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
    await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.screens['3,0']={{terrain:3,special:false,feature:'Abandoned field',cleared:[]}}; G.data.wx=3;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; game.scene.getScene('House').goTo('Wild')")
    await pg.wait_for_timeout(2600)
    return pg, errs
# clear a 10x10 area around (20,15), place trees, rebuild trunks, walk
async def trial(pg, trees, start, keys, ms, label):
    await pg.evaluate(f"""(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[];
      for(let y=10;y<21;y++) for(let x=15;x<26;x++) s.objects.putTileAt(-1,x,y);
      for(const [x,y,t] of {trees}) s.objects.putTileAt(t,x,y);
      if(s.trunks) s.trunks.clear(true,true); s.trunks=undefined; s.trunkAt.clear(); s.buildTrunks();
      s.player.setPosition({start[0]},{start[1]}); s.player.setVelocity(0,0); G.data.fatigue=0;}})()""")
    await pg.wait_for_timeout(150)
    for k in keys: await pg.keyboard.down(k)
    await pg.wait_for_timeout(ms)
    for k in keys: await pg.keyboard.up(k)
    end = await pg.evaluate(f"[Math.round({Wd}.player.x), Math.round({Wd}.player.y)]")
    print(label, "start", start, "end", end); return end
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b)
        # Two trees corner to corner at (20,15) and (21,16); walk from the upper right (tile 21,15) down-left to (20,16).
        await trial(pg, "[[20,15,7],[21,16,7]]", (21*16+8, 15*16+2), ["a","s"], 900, "diagonal pair, walk diagonally through:")
        # Two trees side by side at (20,15),(21,15): walk straight down between them from above.
        await trial(pg, "[[20,15,7],[21,15,7]]", (21*16, 13*16), ["s"], 1000, "side-by-side pair, walk down between:")
        # Stacked pair (20,15),(20,16): walk right between them.
        await trial(pg, "[[20,15,7],[20,16,7]]", (18*16, 16*16), ["d"], 1000, "stacked pair, walk right between:")
        # A single tree: walk past it closely
        await trial(pg, "[[20,15,7]]", (17*16, 15*16+10), ["d"], 1000, "single tree, walk right along its row:")
        # Bush: speed
        await pg.evaluate(f"(()=>{{const s={Wd}; for(let x=15;x<26;x++) s.objects.putTileAt(4,x,15);}})()")
        sp = []
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(16*16, 15*16+3);}})()"); await pg.wait_for_timeout(100)
        await pg.keyboard.down("d"); await pg.wait_for_timeout(500)
        sp.append(await pg.evaluate(f"Math.round({Wd}.player.body.velocity.x)")); sp.append(await pg.evaluate(f"{Wd}.player.isCropped"))
        await pg.screenshot(path="/home/claude/test/bush_wade.png")
        await pg.keyboard.up("d")
        print("in bush: velocity, cropped =", sp)
        print("trunks on a fresh farmland screen:", await pg.evaluate(f"{Wd}.trunkAt.size"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
