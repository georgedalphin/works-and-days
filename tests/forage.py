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
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]")
        await pg.evaluate("game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').modal=false; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        F="game.scene.getScene('Farm')"
        print("farm spots", await pg.evaluate(f"{F}.spots.map(s=>s.def.id+'@'+s.k).join(' ')"))
        # Mineral Hills screen
        await pg.evaluate("G.data.screens['1,0']={terrain:4,special:false,feature:'Stone outcrop',cleared:[]}; G.data.wx=1;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; game.scene.getScene('Farm').goTo('Wild')")
        await pg.wait_for_timeout(2500)
        Wd="game.scene.getScene('Wild')"
        print("wild spots", await pg.evaluate(f"{Wd}.spots.map(s=>s.def.id+'@'+s.k).join(' ')"))
        # stand left of the first spot, facing it
        sid = await pg.evaluate(f"(()=>{{const s={Wd};const p=s.spots[0];for(const a of s.animals)a.sprite.destroy();s.animals=[];s.player.setPosition((p.tx-1)*16+8,p.ty*16+3);s.facing=2;return p.def.id;}})()")
        await pg.wait_for_timeout(700)
        await pg.evaluate("G.data.selected=5")  # millet seeds? use an empty-ish selection: seeds. gather ignores non-tools
        await pg.evaluate(f"{Wd}.useItem()"); await pg.wait_for_timeout(100); print("unknown:", await msg())
        print("fruit visible before", await pg.evaluate(f"{Wd}.spots[0].fruit.visible"))
        await pg.screenshot(path="/home/claude/test/b0_unknown.png")
        await pg.evaluate("G.data.aretai.Gnosis=12"); await pg.keyboard.press("q"); await pg.wait_for_timeout(300); print("study:", await msg())
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
        print("fruit visible after", await pg.evaluate(f"{Wd}.spots[0].fruit.visible"), "lore", await pg.evaluate(f"G.lore('{sid}')"))
        await pg.screenshot(path="/home/claude/test/b1_known.png")
        await pg.evaluate(f"{Wd}.useItem()"); await pg.wait_for_timeout(100); print("gather:", await msg())
        await pg.evaluate(f"{Wd}.useItem()"); await pg.wait_for_timeout(100); print("again:", await msg())
        print("fruit after gather", await pg.evaluate(f"{Wd}.spots[0].fruit.visible"), "picked", await pg.evaluate(f"JSON.stringify({Wd}.rec.picked)"))
        # manger with oats
        await pg.evaluate("G.addItem('Oats',3); G.data.manger=0; G.removeItem('Fiber',99)")
        await pg.evaluate("game.scene.getScene('Wild').goTo('Farm'); G.data.entry='E'; G.data.scene='Farm'"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"{F}.fillManger()"); print("manger:", await msg(), await pg.evaluate("G.data.manger"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
