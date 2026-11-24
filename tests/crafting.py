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
        await pg.evaluate("""(()=>{ for(const [k,n] of [['Wood',40],['Stone',12],['Clay',20],['Fiber',12],['Copper',2],['Wax',2],['Ochre',2],['Hide',2],['Flowers',4]]) G.addItem(k,n);
          G.essence.Earth=99; G.essence.Fire=99; G.data.fatigue=0; })()""")
        # Handwork: the panel lists only hand recipes; make a workbench.
        await pg.evaluate(f"{U}.openCraft()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/cr_hand.png")
        await pg.evaluate(f"(()=>{{const u={U}; const r=RECIPES_OUT('Workbench'); }})" if False else "0")
        await pg.evaluate(f"(()=>{{const u={U}; u.makeRecipe(u.craft && window.RECIPES ? null : null); }})" if False else "0")
        print("panel:", await pg.evaluate(f"{U}.craft.list.filter(o=>o.type==='Text').map(o=>o.text).slice(0,3).join(' / ')"))
        # click the Workbench line
        await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Workbench')); t.emit('pointerdown'); }})()")
        print("made:", await msg(pg), "| count:", await pg.evaluate("G.count('Workbench')"))
        await pg.evaluate(f"{U}.closeCraft()")
        # Place it two tiles to the left of the hut door area on open ground.
        await pg.evaluate(f"""(()=>{{const s={F}; for(let y=18;y<25;y++) for(let x=27;x<36;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }}
          s.player.setPosition(31*16+8, 21*16+8); s.player.setVelocity(0,0); s.mouseIn=false; s.facing=2;
          G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Workbench'); }})()""")
        await pg.wait_for_timeout(300)
        print("ghost:", await pg.evaluate(f"{F}.ghost && {F}.ghost.visible"), await pg.evaluate(f"{F}.facingTile()"))
        await pg.screenshot(path="/home/claude/test/cr_ghost.png")
        await pg.evaluate(f"{F}.useNow()"); await pg.wait_for_timeout(200)
        print("place:", await msg(pg), "| placed:", await pg.evaluate("JSON.stringify(G.data.placed)"))
        # Blocked: path / pen
        print("blocked path:", await pg.evaluate(f"{F}.placeBlocked(24,20)"), "| pen:", await pg.evaluate(f"{F}.placeBlocked(16,17)"))
        # E at the workbench opens its recipes
        await pg.evaluate(f"(()=>{{const s={F}; s.facing=2; }})()"); await pg.wait_for_timeout(200)
        print("target:", await pg.evaluate(f"{F}.current && {F}.current.label"))
        await pg.evaluate(f"{F}.interactNow()"); await pg.wait_for_timeout(300)
        print("station:", await pg.evaluate(f"{U}.craftAt"), "|", await pg.evaluate(f"{U}.craft.list.filter(o=>o.type==='Text').map(o=>o.text).slice(0,2).join(' / ')"))
        await pg.screenshot(path="/home/claude/test/cr_bench.png")
        for name in ["Chest","Kiln","Loom","Fence"]:
            await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('{name}')); t && t.emit('pointerdown'); }})()")
            print(" ", name, "->", await msg(pg))
        await pg.evaluate(f"{U}.closeCraft()")
        # Place the kiln and chest and a fence.
        async def place(item, tx, ty):
            await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='{item}'); s.facingTile=()=>[{tx},{ty}]; s.useNow(); delete s.facingTile; }})()")
            return await msg(pg)
        print("kiln:", await place("Kiln", 29, 19)); print("chest:", await place("Chest", 33, 22)); print("fence:", await place("Fence", 28, 22))
        print("fence tile:", await pg.evaluate(f"{F}.objects.getTileAt(28,22).index"), "solid:", await pg.evaluate(f"{F}.objects.getTileAt(28,22).collides"))
        # Kiln: quality rolls
        await pg.evaluate(f"{U}.openCraft('kiln')")
        for i in range(3):
            await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Amphora')); t && t.emit('pointerdown'); }})()")
            print("  amphora:", await msg(pg))
        await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Clay lamp')); t && t.emit('pointerdown'); }})()"); print("  lamp:", await msg(pg))
        await pg.screenshot(path="/home/claude/test/cr_kiln.png")
        await pg.evaluate(f"{U}.closeCraft()")
        dist = await pg.evaluate(f"(()=>{{const c=[0,0,0,0]; for(let i=0;i<3000;i++) c[{U}.constructor.craftQuality().q]++; return c.slice(1);}})()")
        print("quality dist at Techne 3 (plain/good/fine):", dist)
        # Chest storage
        await pg.evaluate(f"(()=>{{const p=G.data.placed.find(p=>p.id==='Chest'); {U}.openChest(p); }})()"); await pg.wait_for_timeout(200)
        i = await pg.evaluate("G.data.slots.findIndex(s=>s&&s.id==='Stone')")
        await pg.evaluate(f"{U}.constructor.moveStack(G.data.slots,{i},G.data.placed.find(p=>p.id==='Chest').store); {U}.buildChest()")
        await pg.screenshot(path="/home/claude/test/cr_chest.png")
        print("chest has:", await pg.evaluate("JSON.stringify(G.data.placed.find(p=>p.id==='Chest').store.filter(Boolean))"), "| pack stone:", await pg.evaluate("G.count('Stone')"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        print("chest closed:", await pg.evaluate(f"!{U}.chestPanel"), "| modal:", await pg.evaluate(f"{U}.modal"))
        # axe can't lift a full chest; can lift the kiln
        await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='axe'); s.facingTile=()=>[33,22]; s.useNow(); s.facingTile=()=>[29,19]; s.useNow(); delete s.facingTile; }})()")
        print("axe:", await msg(pg,2), "| kiln back:", await pg.evaluate("G.count('Kiln')"))
        # Snare: set, sleep, check
        await pg.evaluate("G.addItem('Snare',1)")
        print("snare:", await place("Snare", 31, 23))
        await pg.evaluate("(()=>{const p=G.data.placed.find(p=>p.id==='Snare'); p.set=G.dayNumber-1; G.data.aretai.Oikos=12; })()")
        await pg.evaluate("G.save && G.save()")
        await pg.evaluate("game.scene.getScene('Farm').goTo('House')"); await pg.wait_for_timeout(1500)
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2000)
        print("after re-entry: placed", await pg.evaluate("G.data.placed.map(p=>p.id+(p.caught?':'+p.caught:'')).join(',')"), "| fence tile:", await pg.evaluate(f"{F}.objects.getTileAt(28,22).index"))
        await pg.evaluate(f"(()=>{{const s={F}; const o=s.placedObjs.find(o=>o.p.id==='Snare'); s.player.setPosition(o.t.x-20,o.t.y); s.checkSnare(o); }})()")
        print("check snare:", await msg(pg))
        await pg.screenshot(path="/home/claude/test/cr_farm.png")
        # Cloak armor + lamp light
        await pg.evaluate("G.addItem('Cloak',1)")
        print("cloak in pack:", await pg.evaluate("G.count('Cloak')"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
