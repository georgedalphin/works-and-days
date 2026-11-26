import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; V="game.scene.getScene('Village')"; Gy="game.scene.getScene('Gym')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate("""window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{ window._log.push(t); s0(t); }; 0""")
        log = lambda n=1: pg.evaluate(f"window._log.slice(-{n})")
        # Help: two pages, arrows turn them.
        vis = lambda: pg.evaluate(f"{U}.help.list[1].list.filter(o=>o.type==='Text' && o.visible).map(o=>o.text.slice(0,24))")
        print("help p1:", await vis()); await pg.screenshot(path="/home/claude/test/help1.png")
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(200)
        print("help p2:", await vis()); await pg.screenshot(path="/home/claude/test/help2.png")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        print("help closed:", not await pg.evaluate(f"{U}.help.visible"))
        await pg.evaluate("G.data.clock=3; G.data.weather='clear'; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        # Dash: walk east for 1.2 s, then again tapping Shift fast.
        async def run(taps):
            await pg.evaluate(f"{F}.player.setPosition(25*16, 18*16); G.essence.Air=G.essenceMax.Air")
            x0 = await pg.evaluate(f"{F}.player.x")
            await pg.keyboard.down("d")
            for i in range(12):
                if taps: await pg.keyboard.press("Shift")
                await pg.wait_for_timeout(100)
            await pg.keyboard.up("d")
            return round(await pg.evaluate(f"{F}.player.x") - x0), round(await pg.evaluate("G.essence.Air"), 1)
        print("walk 1.2s:", await run(False), "| dash 1.2s:", await run(True), "| Air max", await pg.evaluate("G.essenceMax.Air"))
        # A punch with an empty hand.
        r = await pg.evaluate(f"""(()=>{{const f={F}; const A=f.animals[0].constructor; G.data.selected=G.data.slots.findIndex(s=>!s);
          const a=new A(f,'fox',f.player.x+12,f.player.y+4,new Phaser.Geom.Rectangle(0,0,2000,2000)); f.animals.push(a); f.facing=2; f.cursorMode=false; f.creatureAhead=()=>a;
          G.data.aretai.Thymos=12; G.essence.Fire=99; f.useNow(); const out=[a.hp, a.state]; delete f.creatureAhead; return out; }})()""")
        print("punch:", r, await log())
        # To the gymnasion: through the village's east gap.
        await pg.evaluate(f"{F}.goTo('Village')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"{V}.player.setPosition(40*16-3, 15*16+8)"); await pg.wait_for_timeout(1500)
        print("scene:", await pg.evaluate("G.data.scene"), "|", await pg.evaluate("G.locationLabel()"))
        await pg.wait_for_timeout(1500); await pg.screenshot(path="/home/claude/test/gym.png")
        # A wager race: sprint smartly.
        await pg.evaluate("G.data.silver=50")
        await pg.evaluate(f"{Gy}.targets.find(t=>t.label&&t.label.includes('Race')).act()"); await pg.wait_for_timeout(200)
        await pg.keyboard.press("y"); await pg.wait_for_timeout(3300)
        await pg.screenshot(path="/home/claude/test/gym_start.png")
        await pg.keyboard.down("d")
        for i in range(80):
            if i % 3 == 0: await pg.keyboard.press("Shift")
            await pg.wait_for_timeout(100)
            if not await pg.evaluate(f"!!{Gy}.race"): break
            if i == 20: await pg.screenshot(path="/home/claude/test/gym_race.png")
        await pg.keyboard.up("d"); await pg.wait_for_timeout(1200)
        print("race:", await log(), "| silver", await pg.evaluate("G.data.silver"))
        # A festival race: the Athenaia footrace, run here; walking only, so we lose.
        await pg.evaluate(f"G.data.raceFor='athenaia'; G.data.entry='W'; {Gy}.goTo('Gym')"); await pg.wait_for_timeout(5000)
        await pg.keyboard.down("d"); await pg.wait_for_timeout(13000); await pg.keyboard.up("d"); await pg.wait_for_timeout(1500)
        print("festival race:", (await pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2] : 'none'"))[:300])
        # Back to the village.
        await pg.evaluate(f"{U}.closeTalk(); {Gy}.player.setPosition(4, 15*16+8)"); await pg.wait_for_timeout(2500)
        print("back:", await pg.evaluate("G.data.scene"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
