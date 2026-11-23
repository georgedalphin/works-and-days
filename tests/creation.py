import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.wait_for_timeout(200)
        for k in ["ArrowDown","Enter"]:
            if await pg.evaluate("game.scene.isActive('Creation')"): break
            await pg.keyboard.press(k); await pg.wait_for_timeout(600)
        print("creation active:", await pg.evaluate("game.scene.isActive('Creation')"))
        C="game.scene.getScene('Creation')"
        await pg.screenshot(path="/home/claude/test/cr0_wheel.png")
        # click a wheel segment (Aretai = step 6, index 5, roughly at bottom-right)
        for i in [1,5,8,9]:
            await pg.evaluate(f"{C}.sel={i}; {C}.draw()"); await pg.screenshot(path=f"/home/claude/test/cr_step{i}.png")
        await pg.evaluate(f"{C}.naming=true; {C}.draw()"); await pg.screenshot(path="/home/claude/test/cr_name.png")
        await pg.evaluate(f"{C}.naming=false")
        # choose four, then try a fifth
        for s,i in [(0,5),(1,2),(3,0),(4,1),(10,6)]: await pg.evaluate(f"{C}.choose({s},{i})")
        print("chosen:", await pg.evaluate(f"[...{C}.chosen]"), "note:", await pg.evaluate(f"{C}.note"))
        # make Kardia high
        await pg.evaluate(f"(()=>{{const c={C}; c.aretai.Kardia=7; c.aretai.Gnosis=1; c.aretai.Thymos=1; c.aretai.Sophia=Math.max(1,c.aretai.Sophia - (c.pointsLeft()<0? -c.pointsLeft():0)); }})()")
        print("points left:", await pg.evaluate(f"{C}.pointsLeft()"))
        await pg.evaluate(f"(()=>{{const c={C}; const l=c.pointsLeft(); for(const a of Object.keys(c.aretai)){{ if(c.pointsLeft()===0)break; const d=c.pointsLeft(); if(d>0&&c.aretai[a]<7){{const t=Math.min(d,7-c.aretai[a]);c.aretai[a]+=t;}} if(d<0&&c.aretai[a]>1){{const t=Math.min(-d,c.aretai[a]-1);c.aretai[a]-=t;}} }} c.name='Kallias'; c.res={{Wealth:6,Health:4,Stealth:2}}; }})()")
        print("points left:", await pg.evaluate(f"{C}.pointsLeft()"), await pg.evaluate(f"{C}.resLeft()"))
        await pg.evaluate(f"{C}.finish()"); await pg.wait_for_timeout(2500)
        print("scene:", await pg.evaluate("G.data.scene"), "| name", await pg.evaluate("G.data.name"), "| silver", await pg.evaluate("G.data.silver"), "| health/stealth", await pg.evaluate("[G.data.health,G.data.stealth]"))
        print("birth:", await pg.evaluate("JSON.stringify(G.data.birth)"))
        print("aretai:", await pg.evaluate("JSON.stringify(G.data.aretai)"), "favor:", await pg.evaluate("JSON.stringify(G.data.favor)"))
        print("rel myrrhine:", await pg.evaluate("G.npcRec('myrrhine').rel"), "msg:", await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        await pg.evaluate("game.scene.getScene('UI').help && game.scene.getScene('UI').help.setVisible(false)")
        await pg.screenshot(path="/home/claude/test/cr_ingame.png")
        await pg.keyboard.press("p"); await pg.wait_for_timeout(500); await pg.screenshot(path="/home/claude/test/cr_sheet.png")
        # reload: look persists
        await pg.evaluate("G.save && G.save()")
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
