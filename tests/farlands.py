import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'")
        first=True
        async def go(t, wx, feat="Lone oak", clock=4):
            nonlocal first
            src = "game.scene.getScene('House')" if first else Wd; first=False
            await pg.evaluate(f"G.data.clock={clock}; G.data.screens['{wx},0']={{terrain:{t},special:false,feature:'{feat}',cleared:[],hut:null}}; G.data.wx={wx};G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {src}.goTo('Wild')")
            await pg.wait_for_timeout(2600)
            await pg.evaluate(f"{Wd}.player.setPosition(20*16+8,15*16+8)")
        for t in [5,7,8,9,10,11,12]:
            await go(t, 20+t)
            print(t, await pg.evaluate(f"{Wd}.animals.map(a=>a.kind).join(',')"))
        await pg.screenshot(path="/home/claude/test/fl_heights.png")
        # --- Siren on the shore
        await go(7, 40)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[]; s.spawnMonster('siren'); s.monster.sprite.setPosition(s.player.x+90, s.player.y); G.data.fatigue=0; G.data.selected=-1; }})()")
        p0 = await pg.evaluate(f"[{Wd}.player.x, {Wd}.player.y]"); await pg.wait_for_timeout(2500); p1 = await pg.evaluate(f"[{Wd}.player.x, {Wd}.player.y]")
        print("siren pull: x", round(p0[0]), "->", round(p1[0]), "|", await msg(pg,1))
        await pg.screenshot(path="/home/claude/test/fl_siren.png")
        await pg.evaluate(f"(()=>{{const s={Wd}; s.sungSaid=false; s.player.setPosition(s.monster.sprite.x-90, s.monster.sprite.y); G.addItem('Wax',1); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Wax');}})()")
        p0 = await pg.evaluate(f"{Wd}.player.x"); await pg.wait_for_timeout(1500); p1 = await pg.evaluate(f"{Wd}.player.x")
        print("with wax: x", round(p0), "->", round(p1), "|", await msg(pg,1))
        # --- Sphinx
        await go(8, 41)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[]; s.spawnMonster('sphinx'); s.monster.sprite.setPosition(s.player.x+30, s.player.y); G.data.aretai.Gnosis=12; s.meetSphinx(s.monster);}})()")
        await pg.wait_for_timeout(300); await pg.screenshot(path="/home/claude/test/fl_sphinx.png")
        opts = await pg.evaluate(f"{U}.talkOpts.map(o=>o.label)"); print("riddle options:", opts)
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.includes('✦')).fn()"); await pg.wait_for_timeout(1200)
        print("answered:", await msg(pg,2), "| Kleos", await pg.evaluate("G.data.currencies.Kleos"))
        await pg.evaluate(f"(()=>{{const s={Wd}; s.spawnMonster('sphinx'); s.monster.sprite.setPosition(s.player.x+30, s.player.y); G.data.aretai.Gnosis=-20; s.meetSphinx(s.monster);}})()"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label==='A horse' || o.label==='Earth and sea').fn()"); await pg.wait_for_timeout(300)
        print("wrong:", await msg(pg,1), "| state", await pg.evaluate(f"{Wd}.monster.state"))
        # --- Stymphalian flock
        await go(5, 42)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[]; s.spawnMonster('stymphalian'); s.animals.forEach((a,i)=>{{ a.sprite.setPosition(s.player.x+120, s.player.y+i*10); a.charge(20); }}); G.data.fatigue=0;}})()")
        await pg.wait_for_timeout(5000)
        print("flock:", await pg.evaluate(f"{Wd}.animals.filter(a=>a.kind==='stymphalian').length"), "| arrows flying/landed msgs:", await msg(pg,3))
        await pg.screenshot(path="/home/claude/test/fl_stym.png")
        # --- Strix at night on farmland with a torch
        await go(3, 43, "Boundary stones", 15)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[]; s.spawnMonster('strix'); s.monster.sprite.setPosition(s.player.x+60, s.player.y); G.addItem('Torch',1); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Torch');}})()")
        await pg.wait_for_timeout(800); print("strix:", await msg(pg,1), "| state", await pg.evaluate(f"{Wd}.monster.state"))
        # --- Lion
        await go(11, 44)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>a.sprite.destroy()); s.animals=[]; s.spawnMonster('lion'); s.monster.sprite.setPosition(s.player.x+60, s.player.y); s.aggressionRoll(s.monster, 20);}})()")
        await pg.wait_for_timeout(400); print("lion:", await msg(pg,1)); await pg.screenshot(path="/home/claude/test/fl_lion.png")
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
