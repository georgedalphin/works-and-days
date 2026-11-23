import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
        text = lambda: pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).slice(0,3).join(' || ') : ''")
        opts = lambda: pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')")
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]")
        # spring screen
        await pg.evaluate(f"G.data.anchors.spring='1,0'; G.data.screens['1,0']={{terrain:2,special:false,feature:'Old oak',cleared:[]}}; G.data.wx=1;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {U}.help.setVisible(false); {U}.modal=false; game.scene.getScene('House').goTo('Wild')")
        await pg.wait_for_timeout(2500)
        print("spring?", await pg.evaluate(f"[{Wd}.hasSpring, !!{Wd}.naiad, {Wd}.naiad && {Wd}.naiad.visible]"), await msg())
        await pg.evaluate(f"(()=>{{const s={Wd};for(const a of s.animals)a.sprite.destroy();s.animals=[];s.player.setPosition(s.naiad.x,s.naiad.y+16);s.facing=3;}})()"); await pg.wait_for_timeout(900)
        await pg.screenshot(path="/home/claude/test/f0_spring.png")
        print("prompt", await pg.evaluate(f"{U}.promptText.text"))
        await pg.keyboard.press("e"); await pg.wait_for_timeout(200); print("naiad:", await text()); print("opts:", await opts())
        await pg.evaluate("G.addItem('Honey',3); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Honey')"); await pg.evaluate(f"{U}.closeTalk()")
        await pg.keyboard.press("e"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Offer')).fn()"); print("offered:", await text())
        await pg.evaluate(f"{U}.closeTalk()")
        # fill jar at the spring: face the water
        await pg.evaluate(f"(()=>{{const s={Wd};s.player.setPosition(28*16+8,11*16+3);s.facing=3;G.data.selected=1;s.useItem();}})()"); await pg.wait_for_timeout(100); print("jar:", await msg(), await pg.evaluate("G.data.jarSpring"))
        # climb rungs fast
        for d in range(9):
            await pg.evaluate("G.sleep(false); G.data.clock=2")
            await pg.evaluate(f"{U}.talkToMyth('naiad')"); await pg.evaluate(f"G.data.aretai.Pneuma=12; {U}.talkOpts.find(o=>o.label.startsWith('Sit'))?.fn()")
        print("after 10 days:", (await text())[:400]); print("opts:", await opts(), "| Artemis", await pg.evaluate("G.favor('Artemis')"), "Kleos", await pg.evaluate("G.data.currencies.Kleos"))
        await pg.evaluate(f"{U}.closeTalk()")
        # satyrs screen
        await pg.evaluate(f"G.data.anchors.satyrs='2,0'; G.data.screens['2,0']={{terrain:1,special:false,feature:'Herb patch',cleared:[]}}; G.addItem('Plum',2); G.data.myth.satyrs && delete G.data.myth.satyrs; {Wd}.leaveFor(1,0,'W')")
        await pg.wait_for_timeout(2500)
        print("revel?", await pg.evaluate(f"[{Wd}.key, {Wd}.hasRevel, {Wd}.satyrs.length]"))
        await pg.evaluate("Math._r=Math.random; Math.random=()=>0.01")
        await pg.evaluate(f"(()=>{{const s={Wd};for(const a of s.animals)a.sprite.destroy();s.animals=[];s.player.setPosition(12*16+8,17*16+4);s.facing=0;}})()"); await pg.wait_for_timeout(400)
        await pg.evaluate("Math.random=Math._r")
        print("mischief:", await msg(), "| stolen", await pg.evaluate("G.data.myth.satyrs.stolen"))
        await pg.screenshot(path="/home/claude/test/f1_satyrs.png")
        await pg.evaluate("G.addItem('Grapes',2); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Grapes')")
        await pg.evaluate(f"{U}.talkToMyth('satyrs')"); print("satyrs opts:", await opts())
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Offer')).fn()"); print("satyrs:", await text())
        # shoot near a satyr
        await pg.evaluate(f"{U}.closeTalk()"); await pg.evaluate(f"(()=>{{const s={Wd};const t=s.satyrs[0];s.land(t.x,t.y+3);}})()"); print("arrow:", await msg(), "Dionysus", await pg.evaluate("G.favor('Dionysus')"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
