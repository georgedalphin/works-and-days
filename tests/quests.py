import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; V="game.scene.getScene('Village')"; Wd="game.scene.getScene('Wild')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3")
        await pg.evaluate("game.scene.getScene('House').goTo('Village')"); await pg.wait_for_timeout(2500)
        talk = lambda name: pg.evaluate(f"(()=>{{const t={V}.targets.find(t=>t.label&&t.label.includes('{name}')); t.act(); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text); }})()")
        opts = lambda: pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)")
        click = lambda lab: pg.evaluate(f"(()=>{{const t={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes({lab!r})); if(!t) return 'NO '+{lab!r}; t.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ').slice(0,400); }})()")
        print("Theron options:", [o for o in await talk("Theron") if len(o) < 60])
        # Ask for work until one is offered (25% 'not today' => reset the asked day)
        for i in range(8):
            await pg.evaluate("G.data.askedReq={}")
            await talk("Theron"); r = await click("Ask if they need anything")
            if "I'll do it" in r: break
        print("offer:", r[:300])
        print("accept:", (await click("I'll do it"))[:200])
        print("requests:", await pg.evaluate("JSON.stringify(G.data.requests)"))
        q = await pg.evaluate("G.data.requests[0]")
        if q["kind"] == "bring":
            await pg.evaluate(f"G.addItem('{q['item']}', {q['qty']}, {q.get('minQ') or 1})")
            await talk("Theron"); print("complete:", (await click("asked for"))[:250])
        else:
            to = q["to"]; name = {"theron":"Theron","lykos":"Lykos","myrrhine":"Myrrhine","eudora":"Eudora"}[to]
            await talk(name); print("deliver:", (await click("Hand over the parcel"))[:250])
        print("requests after:", await pg.evaluate("G.data.requests.length"), "| silver:", await pg.evaluate("G.data.silver"))
        # Rumor
        await pg.evaluate(f"{U}.closeTalk()")
        await talk("Lykos"); print("rumor:", (await click("Heard any rumors?"))[:300])
        rum = await pg.evaluate("G.data.rumors[0]"); print("rumor rec:", rum)
        await pg.evaluate(f"{U}.closeTalk(); {U}.openJournal()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path="/home/claude/test/q_journal.png")
        print("journal:", (await opts())[2][:300])
        # Go there: it must be the rumored terrain
        x,y = map(int, rum["key"].split(","))
        await pg.evaluate(f"{U}.closeTalk(); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.lastTerrain=3; G.data.scene='Wild'; {V}.goTo('Wild')"); await pg.wait_for_timeout(2500)
        print("arrived terrain:", await pg.evaluate(f"G.data.screens['{rum['key']}'].terrain"), "wanted", rum["terrain"], "| msg:", await pg.evaluate("G.messages.map(m=>m.text).slice(-3).join(' | ')"))
        await pg.screenshot(path="/home/claude/test/q_rumorland.png")
        await pg.evaluate(f"G.data.wx=0; G.data.wy=2; G.data.entry='N'; {Wd}.goTo('Village')"); await pg.wait_for_timeout(2500)
        await talk("Lykos"); print("tell:", (await click("Tell Lykos"))[:200])
        # Lapse: a request past due at dawn
        await pg.evaluate("G.data.requests.push({id:99,from:'eudora',kind:'bring',item:'Meat',qty:3,why:'x',silver:10,posted:G.dayNumber,due:G.dayNumber-1})")
        notes = await pg.evaluate("G.sleep().notes"); print("lapse:", [n for n in notes if 'lapsed' in n])
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
