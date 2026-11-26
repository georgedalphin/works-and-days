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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3; G.data.weather='clear'")
        await pg.evaluate("""window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{ window._log.push(t); s0(t); }; 0""")
        log = lambda n=1: pg.evaluate(f"window._log.slice(-{n})")
        # Craft a rod by hand.
        await pg.evaluate("G.addItem('Wood',2); G.addItem('Fiber',3)")
        await pg.evaluate(f"{U}.openCraft(); (()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Fishing rod')); t.emit('pointerdown'); }})(); {U}.closeCraft()")
        print("rod:", await pg.evaluate("G.count('rod')"))
        # A coastal screen.
        await pg.evaluate("G.data.screens['5,0']={terrain:7,special:false,feature:'Sea cliffs',cleared:[]}; G.data.wx=5; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScene('House').goTo('Wild')")
        await pg.wait_for_timeout(3000)
        # Stand on dry land next to water, facing it.
        spot = await pg.evaluate(f"""(()=>{{const o={Wd}.objects; const wet=(x,y)=>[20,42].includes(o.getTileAt(x,y)?.index ?? -1);
          const D=[[0,1,0],[-1,0,1],[1,0,2],[0,-1,3]];
          for (let y=3;y<27;y++) for (let x=3;x<37;x++) if ((o.getTileAt(x,y)?.index ?? -1)===-1) for (const [dx,dy,f] of D) if (wet(x+dx,y+dy) && wet(x+2*dx,y+2*dy)) return [x,y,f];
          return null; }})()""")
        print("shore spot:", spot)
        await pg.evaluate(f"(()=>{{const w={Wd}; w.player.setPosition({spot[0]}*16+8, {spot[1]}*16+4); w.facing={spot[2]}; w.cursorMode=false; G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='rod'); G.essence.Water=99; }})()")
        await pg.wait_for_timeout(300)
        await pg.evaluate(f"{Wd}.useNow()"); await pg.wait_for_timeout(300)
        print("cast:", await log(), "| fish state", await pg.evaluate(f"{Wd}.fish && [{Wd}.fish.state, {Wd}.fish.sea, {Wd}.fish.deep]"))
        await pg.screenshot(path="/home/claude/test/fish_cast.png")
        # A bite: strike.
        await pg.evaluate(f"{Wd}.fish.biteAt = {Wd}.time.now"); await pg.wait_for_timeout(300)
        print("bite:", await pg.evaluate(f"{Wd}.fish.state"))
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(300)
        print("reeling:", await pg.evaluate(f"!!{U}.reel && {U}.reel.fish.id"))
        await pg.screenshot(path="/home/claude/test/fish_reel.png")
        # Land it: press when the mark is in the green.
        for _ in range(8):
            if not await pg.evaluate(f"!!{U}.reel"): break
            await pg.evaluate(f"{U}.reel.pos = {U}.reel.zone"); await pg.keyboard.press("Space"); await pg.wait_for_timeout(120)
        await pg.wait_for_timeout(600)
        print("landed:", await log(), "| fishing over:", await pg.evaluate(f"!{Wd}.fish"))
        print("caught:", await pg.evaluate("G.data.slots.filter(s=>s&&['Sardine','Bream','RedMullet','Octopus','Tuna','Cuttlefish','Mullet'].includes(s.id)).map(s=>s.id+':q'+(s.q||1))"))
        # A miss: let it slip.
        await pg.evaluate(f"{Wd}.useNow()"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"{Wd}.fish.biteAt = {Wd}.time.now"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"{Wd}.fishNow()"); await pg.wait_for_timeout(200)
        for _ in range(6):
            if not await pg.evaluate(f"!!{U}.reel"): break
            await pg.evaluate(f"{U}.reel.pos = ({U}.reel.zone + 0.5) % 1"); await pg.evaluate(f"{U}.reelPress()"); await pg.wait_for_timeout(80)
        await pg.wait_for_timeout(300)
        print("slipped:", await log())
        await pg.wait_for_timeout(600)
        # A missed bite three times strips the hook.
        await pg.evaluate(f"{Wd}.useNow()"); await pg.wait_for_timeout(600)
        for _ in range(3):
            await pg.evaluate(f"{Wd}.fish && ({Wd}.fish.biteAt = {Wd}.time.now)"); await pg.wait_for_timeout(2500)
        print("stripped:", await log(), "| fishing:", await pg.evaluate(f"!!{Wd}.fish"))
        # Cook kakavia with a fish.
        await pg.evaluate("G.addItem('Sardine',1); G.addItem('SeaFennel',1); G.addItem('Capers',1)")
        await pg.evaluate(f"{U}.openCook('campfire'); {U}.pot=['Sardine','SeaFennel','Capers']; G.essence.Earth=99; {U}.cook(); {U}.closeCraft()")
        print("kakavia:", await pg.evaluate("G.data.dishes"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
