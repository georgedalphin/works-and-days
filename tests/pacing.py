import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.fatigue=0")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        print("pools:", await pg.evaluate("JSON.stringify(G.essenceMax)"), "| hour god aretai:", await pg.evaluate("G.patron && G.patron.aretai"))
        for skill in [3, 12]:
            await pg.evaluate(f"""(()=>{{const s={F}; s.mouseIn=false; s.facing=2; G.data.aretai.Thymos={skill}; G.essence.Fire=G.essenceMax.Fire; G.data.fatigue=0;
              G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='spear'); for(const a of s.animals) a.sprite.setPosition(10,10); }})()""")
            n = await pg.evaluate(f"(()=>{{const s={F}; let n=0; for(let i=0;i<20;i++){{ const before=G.essence.Fire; s.useNow(); if (G.essence.Fire<before) n++; else break; }} return n; }})()")
            print(f"Thymos {skill}: quick swings before Fire runs dry:", n, "| last msg:", await msg(pg))
        await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/p_flash.png")
        await pg.evaluate("G.essence.Fire=0; G.data.fatigue=0")
        await pg.wait_for_timeout(3000)
        print("Fire after 3 s (of", await pg.evaluate("G.essenceMax.Fire"), "):", await pg.evaluate("G.essence.Fire.toFixed(2)"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
