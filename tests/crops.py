import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html")
        await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1600); await pg.keyboard.up("s"); await pg.wait_for_timeout(800)
        F="game.scene.getScene('Farm')"
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]")
        print("scene", await pg.evaluate("[G.data.scene, game.scene.getScene('House').player.x, game.scene.getScene('House').player.y, game.scene.getScene('UI').modal]"), errs)
        print("slots", await pg.evaluate("G.data.slots.filter(Boolean).map(s=>s.id+':'+s.qty).join(' ')"))
        async def tp(tx,ty,f):
            await pg.evaluate(f"(()=>{{const s={F};s.player.setPosition({tx}*16+8,{ty}*16+3);s.facing={f};}})()"); await pg.wait_for_timeout(120)
        async def sel(i): await pg.keyboard.press(str(i)); await pg.wait_for_timeout(60)
        # till 3 tiles in a row at y=13 x=28..30, standing at y=12 facing down
        for x in (28,29,30):
            await tp(x,12,0); await sel(1); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80)
        print(await msg())
        # find slot index of millet seed and put it in hotbar slot 6
        idx = await pg.evaluate("G.data.slots.findIndex(s=>s&&s.id==='seed_Millet')")
        print("millet seed idx", idx)
        await pg.evaluate(f"G.swapSlots({idx},5)")
        mint = await pg.evaluate("G.data.slots.findIndex(s=>s&&s.id==='seed_Mint')"); await pg.evaluate(f"G.swapSlots({mint},6)")
        await tp(28,12,0); await sel(6); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80); print(await msg())
        await tp(29,12,0); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80)
        await tp(30,12,0); await sel(7); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80); print(await msg())
        # water 28 only
        await tp(28,12,0); await sel(2); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80)
        print("crops", await pg.evaluate("JSON.stringify(G.data.crops)"))
        await pg.screenshot(path="/home/claude/test/50_sown.png")
        # simulate 6 nights; water 28,13 and 30,13 each night, leave 29 dry
        for n in range(6):
            await pg.evaluate("G.data.ground['28,13']='wet'; G.data.ground['30,13']='wet'; G.sleep(false)")
        print("crops after", await pg.evaluate("JSON.stringify(G.data.crops)"))
        # restart farm scene to redraw
        await pg.evaluate(f"{F}.scene.restart()"); await pg.wait_for_timeout(600)
        await pg.screenshot(path="/home/claude/test/51_grown.png")
        await tp(28,12,0); await sel(3); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80); print(await msg())
        await tp(30,12,0); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80); print(await msg())
        await tp(29,12,0); await pg.keyboard.press("Space"); await pg.wait_for_timeout(80); print(await msg())
        # market
        await pg.evaluate("game.scene.getScene('UI').openMarket()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/52_market.png")
        # sell first goods row and order millet via direct state changes through UI rows? simulate clicks on text objects
        await pg.evaluate("""(()=>{const u=game.scene.getScene('UI');const t=u.market.list.filter(o=>o.text&&o.input);const m=t.find(o=>o.text.startsWith('excellent Millet')||o.text.startsWith('fine Millet')||o.text.startsWith('Millet'));m.emit('pointerdown');})()""")
        await pg.evaluate("""(()=>{const u=game.scene.getScene('UI');const t=u.market.list.filter(o=>o.text&&o.input);t.find(o=>o.text.startsWith('Melon seed')).emit('pointerdown');})()""")
        await pg.wait_for_timeout(200)
        await pg.screenshot(path="/home/claude/test/53_market2.png")
        print("outbox", await pg.evaluate("JSON.stringify(G.data.outbox)"), "orders", await pg.evaluate("JSON.stringify(G.data.orders)"), "tally", await pg.evaluate("G.data.tally"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        print("modal", await pg.evaluate("game.scene.getScene('UI').modal"))
        r = await pg.evaluate("G.sleep(false).notes")
        print("notes", r, "tally", await pg.evaluate("G.data.tally"), "melon seeds", await pg.evaluate("G.count('seed_Melon')"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
