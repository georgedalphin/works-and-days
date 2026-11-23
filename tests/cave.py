import asyncio, sys
from playwright.async_api import async_playwright
async def run(b, ctype):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
    U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"; C="game.scene.getScene('Cave')"
    msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-2).join(' | ')")
    await pg.evaluate(f"G.data.anchors.cave='1,0'; G.data.screens['1,0']={{terrain:4,special:false,feature:'Stone outcrop',cleared:[]}}; G.data.wx=1;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {U}.help.setVisible(false); {U}.modal=false; game.scene.getScene('House').goTo('Wild')")
    await pg.wait_for_timeout(2500)
    print(ctype, "cave here?", await pg.evaluate(f"{Wd}.hasCave"), await msg())
    if ctype: await pg.evaluate(f"G.data.caves['1,0']={{type:'{ctype}',boss:'alive',hoard:false,mined:{{}}}}")
    await pg.evaluate("G.addItem('Torch',2)")
    await pg.evaluate(f"{Wd}.enterCave()"); await pg.wait_for_timeout(2500)
    print("in:", await pg.evaluate("[G.data.scene, G.locationLabel()]"), await msg())
    await pg.screenshot(path=f"/home/claude/test/h0_cave_{ctype}.png")
    # ore?
    ore = await pg.evaluate(f"(()=>{{const s={C};for(let y=2;y<28;y++)for(let x=2;x<38;x++){{const t=s.objects.getTileAt(x,y);const l=s.objects.getTileAt(x-1,y);if(t&&t.index===23&&(!l||l.index===-1)){{s.player.setPosition((x-1)*16+8,y*16+3);s.facing=2;return [x,y];}}}}}})()")
    if ore:
        await pg.evaluate("G.data.selected=4"); await pg.evaluate(f"{C}.useItem()"); print("ore:", await msg())
    # go deeper
    await pg.evaluate(f"{C}.climb(1)"); await pg.wait_for_timeout(2500)
    print("deeper:", await pg.evaluate("G.locationLabel()"), "| boss", await pg.evaluate(f"{C}.boss && {C}.boss.kind"))
    await pg.evaluate(f"(()=>{{const s={C};s.player.setPosition(20*16+8,21*16);s.facing=0;}})()"); await pg.wait_for_timeout(900)
    await pg.screenshot(path=f"/home/claude/test/h1_keeper_{ctype}.png")
    print("hoard locked:", await pg.evaluate(f"{C}.searchHoard()") , await msg())
    # appease with the right offering at high Kardia
    food = {"common":"Honey","sacred":"Milk","chthonic":"Wine"}[ctype]
    await pg.evaluate(f"G.addItem('{food}',1); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='{food}'); G.data.aretai.Kardia=12; G.data.fatigue=0")
    await pg.evaluate(f"{C}.appease({C}.boss)"); print("appease:", await msg(), "| rec", await pg.evaluate("JSON.stringify(G.data.caves['1,0'].boss)"))
    await pg.evaluate(f"{C}.searchHoard()"); print("hoard:", await msg())
    # climb all the way out
    await pg.evaluate(f"{C}.climb(-1)"); await pg.wait_for_timeout(2500)
    await pg.evaluate(f"{C}.climb(-1)"); await pg.wait_for_timeout(2500)
    print("out:", await pg.evaluate("[G.data.scene, G.data.torchLit]"))
    print("ERRORS:", errs)
    await pg.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        for t in ["common","sacred","chthonic"]: await run(b, t)
        await b.close()
asyncio.run(main())
