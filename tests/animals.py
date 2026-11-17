import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html")
        await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1000)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        await pg.keyboard.down("s"); await pg.wait_for_timeout(1600); await pg.keyboard.up("s"); await pg.wait_for_timeout(800)
        print("scene", await pg.evaluate("G.data.scene"))
        F="game.scene.getScene('Farm')"
        async def tp(tx,ty,facing):
            await pg.evaluate(f"(()=>{{const s={F};s.player.setPosition({tx}*16+8,{ty}*16+3);s.facing={facing};}})()")
            await pg.wait_for_timeout(150)
        prompt = lambda: pg.evaluate("game.scene.getScene('UI').promptText.text")
        msgs = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-2).join(' | ')")
        print("animals", await pg.evaluate(f"{F}.animals.map(a=>a.kind).join(',')"))
        # walk to a goat
        await pg.evaluate(f"(()=>{{const s={F};const g=s.goats[0].a.sprite;s.player.setPosition(g.x-12,g.y-4);s.facing=2;}})()")
        await pg.wait_for_timeout(100)
        print("goat prompt", await prompt())
        await pg.keyboard.press("e"); await pg.wait_for_timeout(150); print(await msgs())
        await pg.evaluate(f"(()=>{{const s={F};const g=s.goats[0].a.sprite;s.player.setPosition(g.x-12,g.y-4);s.facing=2;}})()")
        await pg.wait_for_timeout(100)
        print("goat prompt2", await prompt())
        await pg.keyboard.press("e"); await pg.wait_for_timeout(150); print(await msgs(), "milk", await pg.evaluate("G.count('Milk')"))
        await pg.screenshot(path="/home/claude/test/30_pen.png")
        # manger: stand below it at (15,17) facing up
        await tp(15,17,3); print("manger prompt", await prompt())
        await pg.evaluate("G.addItem('Fiber',5)")
        await pg.keyboard.press("e"); await pg.wait_for_timeout(100); print(await msgs(), G:=await pg.evaluate("G.data.manger"))
        await tp(19,17,3); print("trough prompt", await prompt())
        await pg.keyboard.press("e"); await pg.wait_for_timeout(100); print(await msgs(), await pg.evaluate("[G.data.trough,G.data.jarWater]"))
        # hive
        await pg.evaluate("G.data.hiveDay=-10")
        await tp(36,11,3); print("hive prompt", await prompt())
        await pg.keyboard.press("e"); await pg.wait_for_timeout(100); print(await msgs(), await pg.evaluate("[G.count('Honey'),G.count('Wax')]"))
        await pg.screenshot(path="/home/claude/test/31_hive.png")
        # birds: run at a flock
        bx = await pg.evaluate(f"(()=>{{const b={F}.animals.find(a=>a.kind==='bird');return [b.sprite.x,b.sprite.y];}})()")
        await pg.evaluate(f"{F}.player.setPosition({bx[0]-30},{bx[1]})")
        await pg.wait_for_timeout(400)
        print("bird states", await pg.evaluate(f"{F}.animals.filter(a=>a.kind==='bird').map(a=>a.state).join(',')"))
        await pg.screenshot(path="/home/claude/test/32_birds.png")
        # fox at dusk
        await pg.evaluate("G.data.clock=G.daylight-0.5"); await pg.wait_for_timeout(300)
        print("fox", await pg.evaluate(f"!!{F}.fox"), await msgs())
        fx = await pg.evaluate(f"[{F}.fox.sprite.x,{F}.fox.sprite.y]")
        await pg.evaluate(f"{F}.player.setPosition({fx[0]-50},{fx[1]})"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/33_fox.png")
        print("fox state", await pg.evaluate(f"{F}.fox.state"))
        # sleep with empty manger
        await pg.evaluate("G.data.manger=1;G.data.trough=5;")
        await pg.evaluate("game.scene.getScene('UI').sleep(game.scene.getScene('Farm'), false)")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/home/claude/test/34_sleep.png")
        print("goats", await pg.evaluate("JSON.stringify(G.data.goats.map(g=>[g.fed,g.affection]))"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
