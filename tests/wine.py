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
        U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]")
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.month=1; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        vat = lambda: pg.evaluate(f"{F}.targets.find(t=>t.x==={F}.vat.x).label")
        print("vat:", await vat())
        await pg.evaluate(f"{F}.useVat()"); print(await msg())
        await pg.evaluate("G.addItem('Stone',6); G.addItem('Wood',4)"); await pg.evaluate(f"{F}.useVat()"); print(await msg(), "|", await vat())
        # pick the old vine in Dionysus's hour
        await pg.evaluate("G.data.clock = 8.3*G.daylight/12"); print("hour patron", await pg.evaluate("G.patron && G.patron.god"))
        await pg.evaluate(f"{F}.tendVine()"); print(await msg())
        print("vat:", await vat())
        # tread: press space near centre each beat
        await pg.evaluate(f"(()=>{{const s={F};s.player.setPosition(s.vat.x, s.vat.y+10);s.facing=3;}})()")
        await pg.evaluate(f"{F}.useVat()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path="/home/claude/test/g0_tread.png")
        for beat in range(5):
            for i in range(300):
                ok = await pg.evaluate(f"(()=>{{const r={U}.children.list.filter(o=>o.type==='Container').pop(); if(!r) return false; const m=r.list[5]; const gold=r.list[4]; return Math.abs(m.x-(gold.x+12))<5;}})()")
                if ok: break
                await pg.wait_for_timeout(8)
            await pg.keyboard.press("Space"); await pg.wait_for_timeout(320)
        await pg.wait_for_timeout(1200)
        print("tread:", await msg(), "| vat", await pg.evaluate("JSON.stringify(G.data.vat)"))
        await pg.screenshot(path="/home/claude/test/g1_working.png")
        for d in range(6): await pg.evaluate("G.sleep(false)")
        await pg.evaluate("G.data.clock=2"); print("vat:", await vat())
        await pg.evaluate(f"{F}.useVat()"); print(await msg(), "| wine", await pg.evaluate("JSON.stringify(G.data.slots.find(s=>s&&s.id==='Wine'))"))
        # libation to Zeus at home
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Wine')")
        await pg.evaluate(f"{U}.openAltar('home')"); print("altar opts:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Pour')).fn()"); await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Zeus')).fn()")
        print("libation:", await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2]"), "Zeus", await pg.evaluate("G.favor('Zeus')"))
        await pg.evaluate(f"{U}.closeTalk()")
        # satyrs with wine
        await pg.evaluate(f"{U}.talkToMyth('satyrs')"); await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Offer'))?.fn()")
        print("satyrs:", await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).slice(1,3).join(' || ')"))
        await pg.evaluate(f"{U}.closeTalk()")
        # cutting: plant on tilled soil and wait for vintage
        await pg.evaluate("G.addItem('Cutting',1); G.data.ground['28,13']='tilled'")
        await pg.evaluate(f"(()=>{{const s={F};s.player.setPosition(28*16+8,12*16+3);s.facing=0;G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Cutting');s.useItem();}})()"); print("plant:", await msg())
        await pg.evaluate(f"(()=>{{const s={F};G.data.selected=2;s.useItem();}})()"); print("young:", await msg())
        await pg.evaluate("G.data.vines['28,13'].planted -= 25"); await pg.evaluate(f"(()=>{{const s={F};G.data.selected=2;s.useItem();}})()"); print("vintage:", await msg())
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
