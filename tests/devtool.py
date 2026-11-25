import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false")
        print("hotbar:", await pg.evaluate("G.data.slots.slice(0,10).map(s=>s&&s.id).join(',')"))
        print("pack:", await pg.evaluate("G.data.slots.slice(10).filter(Boolean).map(s=>s.id+'x'+s.qty).join(',')"))
        # An older save with the spear in the pack gets it moved to the hotbar
        await pg.evaluate("(()=>{const d=JSON.parse(JSON.stringify(G.data)); const i=d.slots.findIndex(s=>s&&s.id==='spear'); const m=d.slots.findIndex(s=>s&&s.id==='seed_Melon'); [d.slots[i],d.slots[m]]=[d.slots[m],d.slots[i]]; delete d.spearHotbar; window._old=d; })()")
        print("old save before:", await pg.evaluate("_old.slots.findIndex(s=>s&&s.id==='spear')"), "after migrate:", await pg.evaluate("(()=>{const C=G.constructor; const d=C.migrate(_old); return d.slots.findIndex(s=>s&&s.id==='spear');})()"))
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.keyboard.press("Backquote"); await pg.wait_for_timeout(300)
        print("panel open:", await pg.evaluate(f"!!{U}.devPanel"))
        await pg.screenshot(path="/home/claude/test/dev_panel.png")
        # jump to Pyanepsion (month 3) -> autumn
        await pg.evaluate(f"(()=>{{const t={U}.devPanel.list.find(o=>o.type==='Text'&&o.text.startsWith('{ 'Pyanepsion' }')); t.emit('pointerdown');}})()")
        await pg.wait_for_timeout(2000)
        print("date:", await pg.evaluate("G.dateLabel()"), "| season:", await pg.evaluate("G.month.season"), "| scene:", await pg.evaluate("game.scene.isActive('Farm')"), "| olives ready:", await pg.evaluate(f"{F}.olivesReady('18,9')"))
        await pg.screenshot(path="/home/claude/test/dev_autumn.png")
        await pg.keyboard.press("Backquote"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"(()=>{{const t={U}.devPanel.list.find(o=>o.type==='Text'&&o.text.startsWith('Show this month')); t.emit('pointerdown');}})()")
        await pg.wait_for_timeout(800)
        print("sign:", await pg.evaluate("G.messages.map(m=>m.text).slice(-2).join(' | ')"), "| signs seen:", await pg.evaluate("JSON.stringify(G.data.signs)"))
        await pg.screenshot(path="/home/claude/test/dev_sign.png")
        await pg.keyboard.press("Backquote"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"(()=>{{const t={U}.devPanel.list.find(o=>o.type==='Text'&&o.text==='+7 days'); t.emit('pointerdown');}})()"); await pg.wait_for_timeout(1500)
        print("+7:", await pg.evaluate("G.dateLabel()"))
        # backwards month jumps forward a year
        await pg.keyboard.press("Backquote"); await pg.wait_for_timeout(300)
        await pg.evaluate(f"(()=>{{const t={U}.devPanel.list.find(o=>o.type==='Text'&&o.text.startsWith('Hekatombaion')); t.emit('pointerdown');}})()"); await pg.wait_for_timeout(1500)
        print("to Hekatombaion:", await pg.evaluate("G.dateLabel()"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
