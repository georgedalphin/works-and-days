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
        await pg.evaluate("G.data.screens['1,0']={terrain:3,special:false,feature:'Stone outcrop',cleared:[]}; G.data.wx=1; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScene('House').goTo('Wild')"); await pg.wait_for_timeout(3000)
        # Stand by a campfire at night; a ghost comes for you.
        await pg.evaluate(f"""(()=>{{const w={Wd}; w.animals.forEach(a=>a.sprite.destroy()); w.animals=[]; G.data.clock=G.daylight+1;
          w.player.setPosition(20*16+8, 15*16+8); const p={{id:'Campfire',where:w.placeKey(),x:21,y:15,fuel:G.absHour+10}}; G.data.placed.push(p); w.spawnPlaced(p);
          const A=window._A; }})()""")
        await pg.evaluate(f"""(()=>{{const w={Wd}; const f=game.scene.getScene('Farm'); }})()""")
        # Make a ghost (borrow the Animal class from any scene's goats/birds via summon).
        await pg.evaluate(f"{Wd}.summon('eidolon', 1)"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"(()=>{{const g={Wd}.animals.find(a=>a.kind==='eidolon'); g.sprite.setPosition({Wd}.player.x+120, {Wd}.player.y); g.charge(30); g.sprite.setAlpha(0.85); window._g=g; }})()")
        fire = await pg.evaluate(f"(()=>{{const o={Wd}.placedObjs.find(o=>o.p.id==='Campfire'); return [o.img.x, o.img.y-6]; }})()")
        for t in range(6):
            await pg.wait_for_timeout(700)
            d = await pg.evaluate(f"Math.round(Math.hypot(window._g.sprite.x-{fire[0]}, window._g.sprite.y-{fire[1]}))")
            print(f"t={0.7*(t+1):.1f}s ghost to fire: {d}px, state {await pg.evaluate('window._g.state')}, vitality {await pg.evaluate('G.data.vitality')}")
        await pg.screenshot(path="/home/claude/test/ghost_fire.png")
        # Away from the fire with a torch in hand.
        await pg.evaluate(f"""(()=>{{const w={Wd}; w.player.setPosition(8*16, 25*16); G.addItem('Torch',1); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Torch'); window._g.sprite.setPosition(w.player.x+100, w.player.y); window._g.charge(30); }})()""")
        for t in range(4):
            await pg.wait_for_timeout(800)
            print(f"torch t={0.8*(t+1):.1f}s ghost to you: {await pg.evaluate(f'Math.round(Math.hypot(window._g.sprite.x-{Wd}.player.x, window._g.sprite.y-{Wd}.player.y))')}px, vitality {await pg.evaluate('G.data.vitality')}")
        # No light: it reaches you, slowly, and its touch is light.
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(s=>!s); window._g.sprite.setPosition({Wd}.player.x+90, {Wd}.player.y); window._g.charge(30); G.data.vitality=G.vitalityMax")
        await pg.wait_for_timeout(4000)
        print("no light, after 4s: vitality", await pg.evaluate("G.data.vitality"), "/", await pg.evaluate("G.vitalityMax"), "|", await pg.evaluate("G.messages.map(m=>m.text).filter(t=>t.includes('Vitality')).slice(-1)"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
