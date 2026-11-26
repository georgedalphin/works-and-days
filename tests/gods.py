import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
        U="game.scene.getScene('UI')"
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false")
        text = lambda: pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).slice(0,3).join(' || ') : ''")
        opts = lambda: pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')")
        pick = lambda prefix: pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith({prefix!r})).fn()")
        # 1. pray to Demeter four days
        for d in range(4):
            await pg.evaluate(f"{U}.openAltar('home')"); await pick("Pray"); await pg.evaluate(f"{U}.talkOpts[2].fn()")
            await pg.evaluate("G.sleep(false)")
        print("pray:", (await text())[:200]); print("favor Demeter", await pg.evaluate("G.favor('Demeter')"))
        # 2. offerings at home up to cap
        await pg.evaluate("G.addItem('Millet',5); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Millet')")
        for d in range(3):
            await pg.evaluate(f"{U}.openAltar('home')"); await pick("Offer"); await pg.evaluate("G.sleep(false)")
        print("home offers:", (await text())[:160], "| favor", await pg.evaluate("G.favor('Demeter')"))
        await pg.evaluate(f"{U}.openAltar('shrine')"); await pick("Offer"); print("shrine:", (await text())[:200], "| favor", await pg.evaluate("G.favor('Demeter')"), "Ambrosia", await pg.evaluate("G.data.currencies.Ambrosia"))
        # 3. mint by day and night
        await pg.evaluate("G.addItem('Mint',2); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Mint')")
        await pg.evaluate(f"{U}.openAltar('home')"); await pick("Offer"); print("mint day:", (await text())[:160])
        await pg.evaluate("G.data.clock=G.daylight+1"); await pg.evaluate(f"{U}.openAltar('home')"); await pick("Offer"); print("mint night:", (await text())[:200], "Hades", await pg.evaluate("G.favor('Hades')"))
        await pg.evaluate(f"{U}.closeTalk(); G.sleep(false)")
        # 4. gods sheet
        await pg.keyboard.press("f"); await pg.wait_for_timeout(300); await pg.screenshot(path="/home/claude/test/e0_gods.png")
        await pg.keyboard.press("f"); await pg.wait_for_timeout(100)
        # 5. self sheet: raise Gnosis
        await pg.evaluate("G.data.currencies.Ambrosia=5")
        await pg.keyboard.press("p"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"{U}.sheetPanel.list.find(o=>o.input&&o.text&&o.text.startsWith('+1:')&&o.y>{U}.sheetPanel.list.find(t=>t.text&&t.text.startsWith('Gnosis')).y-5&&o.y<{U}.sheetPanel.list.find(t=>t.text&&t.text.startsWith('Gnosis')).y+5).emit('pointerdown')")
        await pg.wait_for_timeout(100); await pg.screenshot(path="/home/claude/test/e1_self.png")
        print("Gnosis", await pg.evaluate("G.data.aretai.Gnosis"), "Water max", await pg.evaluate("G.essenceMax.Water"), "Ambrosia", await pg.evaluate("G.data.currencies.Ambrosia"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        # 6. learn the Art
        await pg.evaluate("G.npcRec('myrrhine').rel=3")
        await pg.evaluate(f"{U}.talkTo(Object.values(window.VILL||{{}})[0]||null)") if False else None
        await pg.evaluate(f"(()=>{{const u={U};const V=window.__V;}})()")
        await pg.evaluate("window.__learn = () => { G.data.arts.push('hospitality'); }")
        # use the real path via the Village scene? simpler: call talkTo with Myrrhine data from a villager list exposed by hearth? Learn directly:
        await pg.evaluate("window.__learn()")
        # 7. plan and perform at the hearth
        await pg.evaluate("G.addItem('Honey',1); G.addItem('Milk',1); G.addItem('Flowers',1); G.addItem('Grapes',1)")
        await pg.evaluate(f"{U}.hearthMenu(()=>{{}})"); await pick("Plan"); await pg.wait_for_timeout(200)
        print("plan:", (await text())[:900])
        await pg.screenshot(path="/home/claude/test/e2_plan.png")
        await pick("Perform")
        for step in range(3):
            # wait until the marker is near centre, then press space
            for i in range(200):
                near = await pg.evaluate(f"(()=>{{const r={U}.ritual; if(!r||!r.marker) return false; const p=r.panel.list[4]; return Math.abs(r.marker.x-(p.x+12))<6;}})()")
                if near: break
                await pg.wait_for_timeout(10)
            await pg.keyboard.press("Space"); await pg.wait_for_timeout(1700)
        await pg.screenshot(path="/home/claude/test/e3_rite.png")
        print("rite:", (await text())[:300], "| blessing", await pg.evaluate("JSON.stringify(G.data.blessing)"), "Kleos", await pg.evaluate("G.data.currencies.Kleos"))
        await pg.evaluate(f"{U}.closeTalk()")
        # 8. deer debt
        await pg.evaluate("G.data.deerDebt=1"); n = await pg.evaluate("G.sleep(false).notes"); print("deer:", n, "Artemis", await pg.evaluate("G.favor('Artemis')"), "Hubris", await pg.evaluate("G.data.currencies.Hubris"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
