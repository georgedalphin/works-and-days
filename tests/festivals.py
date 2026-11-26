import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; V="game.scene.getScene('Village')"; Ho="game.scene.getScene('House')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3; G.data.weather='clear'")
        await pg.evaluate("""window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{ window._log.push(t); s0(t); }; 0""")
        texts = lambda: pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text) : []")
        click = lambda lab: pg.evaluate(f"(()=>{{const t={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes({lab!r})); if(!t) return 'NO '+{lab!r}; t.emit('pointerdown'); return {U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2] : 'closed'; }})()")
        # The journal lists what's coming.
        await pg.evaluate(f"{U}.openJournal()")
        print("journal:", (await texts())[2].split("REQUESTS")[0].replace("\n"," | "))
        await pg.evaluate(f"{U}.closeTalk()")
        # The night before the Kronia: the dawn notice.
        await pg.evaluate("G.data.day=11; G.data.clock=G.daylight+2")
        await pg.evaluate(f"{U}.sleep({Ho}, false)"); await pg.wait_for_timeout(1500)
        print("dawn:", [l for l in (await pg.evaluate(f"{U}.children.list.filter(o=>o.type==='Text'&&o.depth===31).map(o=>o.text).join('\\n')")).split("\n") if "village keeps" in l])
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(2500)
        # The Kronia in the village.
        await pg.evaluate(f"G.data.clock=3; {Ho}.goTo('Village')"); await pg.wait_for_timeout(3000)
        await pg.evaluate(f"(()=>{{const v={V}; const t=v.targets.find(t=>t.label&&t.label.includes('join the festival')); v.player.setPosition(t.x, t.y+30); }})()")
        await pg.wait_for_timeout(4000)
        await pg.screenshot(path="/home/claude/test/fest_village.png")
        print("arrival:", [m for m in await pg.evaluate("window._log") if "keeps" in m])
        await pg.evaluate(f"{V}.targets.find(t=>t.label&&t.label.includes('join the festival')).act()")
        print("menu:", " / ".join(await texts())[:600])
        await pg.screenshot(path="/home/claude/test/fest_menu.png")
        print("rite:", (await click("Join the rite"))[-140:])
        await pg.evaluate("G.addItem('Millet',3); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Millet')")
        await pg.evaluate(f"{U}.festivalMenu(game.scene.getScene('UI').constructor && {V}.targets.find(t=>t.label&&t.label.includes('join the festival')) && (()=>null)() || null)") if False else None
        await pg.evaluate(f"{V}.targets.find(t=>t.label&&t.label.includes('join the festival')).act()")
        print("feast:", (await click("to the feast"))[:220], "| rel theron", await pg.evaluate("G.npcRec('theron').rel"))
        # The agon: the rhythm game opens; finish it with a good score.
        await pg.evaluate(f"{V}.targets.find(t=>t.label&&t.label.includes('join the festival')).act()")
        r = await click("Enter the harvest wrestling"); print("agon open:", await pg.evaluate(f"!!{U}.ritual"))
        for _ in range(6): await pg.keyboard.press("Space"); await pg.wait_for_timeout(450)
        await pg.wait_for_timeout(1500)
        print("agon:", (await texts())[2][:400].replace("\n"," | "))
        # A doubled offering to Demeter at the altar.
        f0 = await pg.evaluate("G.favor('Demeter')")
        await pg.evaluate(f"{U}.closeTalk(); G.addItem('Chickpeas',1); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Chickpeas'); G.data.offered.Demeter=-1; {U}.openAltar('shrine')")
        print("offer:", (await click("Offer your"))[:260], "| Demeter", f0, "->", await pg.evaluate("G.favor('Demeter')"))
        # The Anthesteria: on its night the dead come into the village.
        await pg.evaluate(f"{U}.closeTalk(); G.data.month=7; G.data.day=12; G.data.clock=G.daylight+1; {V}.noumRolled=false; const r0=Math.random; Math.random=()=>0.1; {V}.noumeniaVisit([[10,10]],0.7,2,'x'); Math.random=r0")
        print("Anthesteria night:", await pg.evaluate(f"{V}.animals.filter(a=>a.kind==='eidolon').length"), [m for m in await pg.evaluate("window._log") if "Anthesteria" in m][-1:])
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
