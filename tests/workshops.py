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
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("for(const [k,n] of [['Wood',40],['Stone',30],['Clay',10],['Hide',2],['Copper',6],['Olives',8],['Grapes',5]]) G.addItem(k,n)")
        async def make(station, name):
            await pg.evaluate(f"G.essence.Earth=G.essenceMax.Earth; {U}.openCraft('{station}')")
            r = await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('{name}')); if(!t) return 'MISSING'; t.emit('pointerdown'); return 'ok';}})()")
            out = await msg(pg); await pg.evaluate(f"{U}.closeCraft()"); return r + " -> " + out
        print("press:", await make("workbench", "Press")); print("forge:", await make("workbench", "Forge"))
        print("oil:", await make("press", "Olive oil")); print("must:", await make("press", "Must"))
        print("arrows:", await make("forge", "Arrows")); print("axe:", await make("forge", "Fine bronze axe"))
        print("axe level:", await pg.evaluate("G.toolLevel('axe')"), "| axe recipe still listed:", await pg.evaluate(f"(()=>{{{U}.openCraft('forge'); const r={U}.craft.list.some(o=>o.type==='Text'&&o.text.startsWith('Fine bronze axe')); {U}.closeCraft(); return r;}})()"))
        # place the forge and use it with E
        await pg.evaluate(f"""(()=>{{const s={F}; for(let y=18;y<25;y++) for(let x=27;x<36;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }}
          s.player.setPosition(31*16+8, 21*16+8); s.mouseIn=false; s.facing=2; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Forge'); s.facingTile=()=>[32,21]; s.useNow(); delete s.facingTile; }})()""")
        await pg.wait_for_timeout(300); print("placed:", await msg(pg), "| target:", await pg.evaluate(f"{F}.current && {F}.current.label"))
        await pg.screenshot(path="/home/claude/test/ws_forge.png")
        # olives: autumn only
        print("olives in summer:", await pg.evaluate(f"{F}.olivesReady('18,9')"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
