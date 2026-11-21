import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.evaluate("game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').modal=false; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        F="game.scene.getScene('Farm')"
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]")
        print("scene", await pg.evaluate("G.data.scene"), errs)
        # investigate a hare: freeze it next to the player
        await pg.evaluate(f"(()=>{{const s={F};const h=s.animals.find(a=>a.kind==='hare');h.def.scare=0;s.player.setPosition(h.sprite.x-12,h.sprite.y-4);s.facing=2;h.sprite.setVelocity(0,0);h.state='idle';h.timer=99;}})()")
        await pg.wait_for_timeout(100)
        await pg.evaluate("window._r=Math.random; Math.random=()=>0.99")  # roll 12: fail
        await pg.keyboard.press("q"); await pg.wait_for_timeout(150); await pg.evaluate("Math.random=window._r"); print(await msg())
        await pg.keyboard.press("q"); await pg.wait_for_timeout(150); print(await msg())
        await pg.evaluate("G.data.lore.studied={}; G.data.aretai.Gnosis=12")  # next day, a sure success
        await pg.keyboard.press("q"); await pg.wait_for_timeout(300); print(await msg())
        print("modal", await pg.evaluate("game.scene.getScene('UI').modal"), "tiers", await pg.evaluate("JSON.stringify(G.data.lore.tier)"))
        await pg.screenshot(path="/home/claude/test/70_lore.png")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        # investigate the land
        await pg.evaluate(f"(()=>{{const s={F};s.player.setPosition(26*16+8,20*16+3);s.facing=0;}})()"); await pg.wait_for_timeout(150)
        await pg.keyboard.press("q"); await pg.wait_for_timeout(300); print(await msg())
        await pg.screenshot(path="/home/claude/test/72_land.png")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        # full mastery perk: give oak full and fell a tree
        await pg.evaluate("G.data.lore.tier.oak=3")
        await pg.keyboard.press("k"); await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{const u=game.scene.getScene('UI');u.loreSel='oak';u.buildLore();})()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path="/home/claude/test/71_book.png")
        await pg.keyboard.press("k"); await pg.wait_for_timeout(200)
        print("modal after K", await pg.evaluate("game.scene.getScene('UI').modal"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
