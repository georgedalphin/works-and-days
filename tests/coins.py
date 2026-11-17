import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        await pg.evaluate("G.addItem('Melon',2,3); G.data.outbox.push({id:'Melon',qty:1,q:3})")
        print(await pg.evaluate("G.sleep(false).notes[0]"), "|", await pg.evaluate("G.data.silver"))
        await pg.evaluate("game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').openMarket()"); await pg.wait_for_timeout(300)
        await pg.evaluate("""(()=>{const u=game.scene.getScene('UI');u.market.list.find(o=>o.input&&o.text&&o.text.startsWith('Melon seed')).emit('pointerdown');})()""")
        await pg.wait_for_timeout(200)
        print("purse", await pg.evaluate("G.data.silver"))
        await pg.screenshot(path="/home/claude/test/60_coins.png")
        print(errs); await b.close()
asyncio.run(main())
