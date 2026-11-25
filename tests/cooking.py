import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; Wd="game.scene.getScene('Wild')"; Ho="game.scene.getScene('House')"
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
        msgs = lambda n=2: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n})")
        # The hearth menu offers cooking.
        r = await pg.evaluate(f"(()=>{{ {Ho}.targets.find(t=>t.label.includes('hearth')).act(); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / '); }})()")
        print("hearth:", r[:200])
        await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('Cook')); o.emit('pointerdown'); }})()")
        await pg.evaluate("for (const [id,n] of [['Meat',4],['Thyme',3],['OliveOil',2],['Millet',3],['Mint',2],['Milk',3],['Honey',4],['SeaFennel',2],['Capers',2],['Mushrooms',2],['Plum',2]]) G.addItem(id,n)")
        await pg.evaluate(f"{U}.buildCook()"); await pg.wait_for_timeout(200)
        add = lambda id: pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith({ITEMS!r}) && o.input); }})()")
        async def pot(ids):
            await pg.evaluate(f"{U}.pot={ids!r}; {U}.buildCook()")
            return await pg.evaluate(f"{U}.craft.list.filter(o=>o.type==='Text').map(o=>o.text).find(t=>t.includes(':') && (t.includes('hours')||t.includes('Put')))")
        print("preview meat+thyme:", await pot(["Meat","Thyme"]))
        await pg.screenshot(path="/home/claude/test/cook_panel.png")
        await pg.evaluate(f"G.essence.Earth=99; {U}.cook()"); print("cooked:", await msgs(1))
        print("preview kykeon (unknown):", await pot(["Millet","Mint","Milk"]))
        await pg.evaluate(f"G.essence.Earth=99; {U}.cook()"); print("cooked:", await msgs(2))
        print("preview kykeon (known):", await pot(["Millet","Mint","Milk"]))
        print("preview rare kakavia:", await pot(["Meat","SeaFennel","Capers"]))
        await pg.evaluate(f"G.essence.Earth=99; {U}.cook()"); print("cooked:", await msgs(1))
        await pg.evaluate(f"G.essence.Earth=99; {U}.pot=['Honey','Mushrooms','Milk']; {U}.cook(); G.essence.Earth=99; {U}.pot=['Honey','Milk']; {U}.cook()")
        print("known dishes:", await pg.evaluate("G.data.dishes"))
        await pg.screenshot(path="/home/claude/test/cook_known.png")
        inv = await pg.evaluate("G.data.slots.filter(s=>s&&(s.id.startsWith('meal_')||s.id.startsWith('dish_'))).map(s=>s.id+':q'+(s.q||1))"); print("dishes carried:", inv)
        await pg.evaluate(f"{U}.closeCraft()")
        # Eat the thyme roast: Thymos up for a while, then it wears off.
        th0 = await pg.evaluate("G.data.aretai.Thymos")
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='meal_Thymos'); G.data.fatigue=40; {Ho}.useNow()")
        print("ate:", await msgs(1), "| Thymos", th0, "->", await pg.evaluate("G.data.aretai.Thymos"), "| fatigue", await pg.evaluate("G.data.fatigue"))
        # Eat kykeon: Demeter's boon rises.
        d0 = await pg.evaluate("G.boon('Demeter')")
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='dish_kykeon'); {Ho}.useNow()")
        print("kykeon:", await msgs(1), "| Demeter boon", d0, "->", await pg.evaluate("G.boon('Demeter')"))
        await pg.wait_for_timeout(600)
        await pg.screenshot(path="/home/claude/test/cook_fed.png")
        print("HUD:", await pg.evaluate(f"{U}.thread.text"))
        await pg.evaluate("G.data.clock += 25"); await pg.wait_for_timeout(1500)
        print("later:", await msgs(2), "| Thymos", await pg.evaluate("G.data.aretai.Thymos"), "| Demeter boon", await pg.evaluate("G.boon('Demeter')"))
        # Save/reload keeps the meal straight: eat, save, reload, let it lapse.
        # The campfire menu.
        await pg.evaluate(f"G.data.clock=3; {Ho}.goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"(()=>{{const f={F}; const p={{id:'Campfire',where:'farm',x:30,y:20}}; G.data.placed.push(p); f.spawnPlaced(p); f.targets.find(t=>t.label&&t.label.includes('campfire')).act(); }})()")
        print("campfire:", await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ')"))
        await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('Cook')); o.emit('pointerdown'); }})()")
        print("cook panel open:", await pg.evaluate(f"!!{U}.craft && {U}.cookAt"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        print("closed:", await pg.evaluate(f"!{U}.craft"))
        # A god's dish is an offering to that god; Hecate's supper at the herm is best.
        print("offer patron:", await pg.evaluate("[OFFER_PATRON_CHECK=1]") if False else "")
        await pg.evaluate("G.data.wx=1; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScene('Farm').goTo('Wild')"); await pg.wait_for_timeout(2500)
        h = await pg.evaluate(f"(()=>{{const w={Wd}; G.data.clock=G.daylight+1; G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='dish_hecate'); G.data.offered.hecateSupper=-1; const f0=G.favor('Hecate'); w.atHerm(); return [f0, G.favor('Hecate'), G.messages.slice(-2).map(m=>m.text)]; }})()")
        print("Hecate's supper at the herm:", h)
        print("ERRORS:", errs); await b.close()
ITEMS = ""
asyncio.run(main())
