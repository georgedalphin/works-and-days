import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; V="game.scene.getScene('Village')"; Wd="game.scene.getScene('Wild')"
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
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        texts = lambda: pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text) : []")
        click = lambda lab: pg.evaluate(f"(()=>{{const t={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes({lab!r})); if(!t) return 'NO '+{lab!r}+' in '+{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / '); t.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / '); }})()")
        talk = lambda: pg.evaluate(f"(()=>{{ {U}.closeTalk(); {F}.targets.find(t=>t.label&&(t.label.includes('Tiresias')||t.label.includes('old man'))).act(); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / '); }})()")
        # Walk up to him: he calls out.
        pos = await pg.evaluate(f"[{F}.tir.s.x, {F}.tir.s.y]"); print("he sits at", pos, "spot", await pg.evaluate("G.data.tir.spot"))
        await pg.evaluate(f"{F}.player.setPosition({pos[0]+20},{pos[1]+6}); {F}.tir.callAt=0"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/tir_call.png")
        print("first:", (await talk())[:300])
        await pg.screenshot(path="/home/claude/test/tir_intro.png")
        r = await click("Welcome him"); print("welcome:", r[:500])
        await pg.screenshot(path="/home/claude/test/tir_ask1.png")
        # 1: water
        print("not ready:", (await talk())[:200])
        await pg.evaluate("G.data.jarWater=3"); r = await talk(); print("ready opts:", r[-160:])
        print("done1:", (await click("Pour him a cup"))[:300], "| jar", await pg.evaluate("G.data.jarWater"))
        # 2: flowers (asked at once: the first three come straight away)
        print("ask2:", (await click("Ask if there's anything"))[:200])
        await pg.evaluate("G.addItem('Flowers',1)"); await talk(); print("done2:", (await click("Put the flowers"))[:200])
        # 3: till three, sow one (real code paths: setGround and plant)
        await click("Ask if there's anything")
        season = await pg.evaluate("G.month.season"); print("season", season)
        await pg.evaluate(f"(()=>{{const f={F}; for(const x of [28,29,30]) f.setGround(x,13,'tilled'); G.addItem('seed_Millet',2); G.addItem('seed_Mint',2); f.plant(28,13, G.month.season==='Summer'?'seed_Millet':'seed_Mint'); }})()")
        await pg.wait_for_timeout(300)
        print("journal line:", await pg.evaluate(f"(()=>{{ {U}.closeTalk(); {U}.openJournal(); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2].split('\\n')[1]; }})()"))
        await pg.screenshot(path="/home/claude/test/tir_journal.png")
        await talk(); print("done3:", (await click("Tell him"))[:300])
        print("can ask now?", await pg.evaluate(f"{U}.tirCanAsk()"), "| talk:", (await talk())[:200])
        # A night passes: he goes to the doorstep after dark; next day he asks again.
        await pg.evaluate(f"{U}.closeTalk(); G.data.clock=G.daylight+1"); await pg.wait_for_timeout(1500)
        print("night: goal/spot", await pg.evaluate(f"[{F}.tir.goal, G.data.tir.spot]"))
        await pg.evaluate("G.sleep(); G.data.clock=2; G.data.weather='clear'")
        print("next day can ask?", await pg.evaluate(f"{U}.tirCanAsk()"))
        # The rest, step by step: make each thing happen, and check he accepts it.
        evs = {3: "G.addItem('Milk',1)", 4: "G.note('study',2)", 5: "G.note('place:Workbench')", 6: "G.note('pray'); G.note('offer')", 7: None,
               8: "G.note('request')", 9: "G.note('foreign')", 10: "G.note('omen')", 11: "G.addItem('Meat',1)", 12: "G.note('rumor')", 13: "G.note('shrineKeeper')",
               14: "G.note('cave')", 15: "G.note('landmark')", 16: "G.note('boatmap')", 17: "G.note('host')", 18: "G.note('hecate')", 19: "G.note('graveOffer')"}
        pn0 = await pg.evaluate("G.data.aretai.Pneuma")
        for _ in range(17):
            await pg.evaluate("G.data.tir.doneDay=-1")
            i = await pg.evaluate("G.data.tir.step")
            await talk(); a = await click("Ask if there's anything")
            title = a.split(" / ")[2].split("\n")[0]
            if i == 7:
                # Carry the greeting to Myrrhine for real.
                await pg.evaluate(f"{U}.closeTalk(); {F}.goTo('Village')"); await pg.wait_for_timeout(2500)
                g = await pg.evaluate(f"(()=>{{const t={V}.targets.find(t=>t.label&&t.label.includes('Myrrhine')); t.act(); const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('greeting')); if(!o) return 'NO GREETING'; o.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2]; }})()")
                print("   Myrrhine:", g[:160])
                await pg.evaluate(f"{U}.closeTalk(); {V}.goTo('Farm')"); await pg.wait_for_timeout(2500)
            else:
                if i in (13, 14, 19): print("   ", [l for l in a.split("\n") if "of your farm" in l or "stretches" in l][:1])
                await pg.evaluate(evs[i])
            await talk()
            d = await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.filter(o=>o.type==='Text'); const opt=o.find(t=>/^1\\./.test(t.text)); const txt=opt?opt.text:''; if(!opt||txt.includes('About what')||txt.includes('Sit with')) return 'NOT READY: '+o.map(t=>t.text).join(' / ').slice(-300); opt.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2]; }})()")
            print(f"{i+1:2} {title[:34]:34} ->", d[-90:].replace("\n", " "))
        print("step:", await pg.evaluate("G.data.tir.step"), "| Pneuma", pn0, "->", await pg.evaluate("G.data.aretai.Pneuma"), "| anchors", await pg.evaluate("JSON.stringify(G.data.anchors)"))
        print("after:", (await talk())[:300])
        print("counsel:", (await click("tomorrow brings"))[:300])
        await pg.screenshot(path="/home/claude/test/tir_done.png")
        # The anchored shrine and graveyard really are there.
        for k in ("tirShrine", "tirGrave"):
            key = await pg.evaluate(f"G.data.anchors.{k}"); x, y = map(int, key.split(","))
            await pg.evaluate(f"{U}.closeTalk(); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.scene='Wild'; G.data.clock=3; game.scene.getScene(game.scene.getScenes(true).find(s=>s.scene.key!=='UI').scene.key).goTo('Wild')"); await pg.wait_for_timeout(2500)
            print(k, key, "->", await pg.evaluate(f"JSON.stringify({{shrine: G.data.screens['{key}'].shrine, grave: G.data.screens['{key}'].graveyard}})"))
        await pg.screenshot(path="/home/claude/test/tir_grave.png")
        # Wandering: by day he gets up and moves to another seat.
        await pg.evaluate(f"G.data.wx=0; G.data.wy=0; G.data.entry='E'; {Wd}.goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"G.data.clock=3; G.data.weather='clear'; {F}.player.setPosition(100,100); {F}.tir.moveIn=0"); await pg.wait_for_timeout(600)
        g0 = await pg.evaluate(f"[{F}.tir.goal, G.data.tir.spot]"); print("wander goal/spot:", g0)
        await pg.screenshot(path="/home/claude/test/tir_walk.png")
        # Save and reload: he is where he was, and remembers.
        await pg.evaluate("G.save()")
        print("saved tir:", await pg.evaluate("JSON.stringify(JSON.parse(localStorage.getItem('worksanddays.save.v1')).tir).slice(0,160)"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
