import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; V="game.scene.getScene('Village')"
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
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("""window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{ window._log.push(t==null ? 'NULL@'+new Error().stack.split('\\n').slice(2,4).join('|') : t); s0(t); }; 0""")
        msgs = lambda n=1: pg.evaluate(f"window._log.slice(-{n})")
        async def play(notes, mode=None):
            await pg.keyboard.down("v")
            if mode is not None: await pg.evaluate(f"(()=>{{ /* set harmonia */ }})()"); await pg.evaluate(f"{U}.singStart(); (()=>{{const S=Object.values(window).length; }})()")
            for n in notes: await pg.keyboard.press(str(n)); await pg.wait_for_timeout(160)
        # Hum the scale: the overlay shows, the hotbar doesn't change.
        sel0 = await pg.evaluate("G.data.selected")
        await pg.keyboard.down("v")
        for n in range(1, 9): await pg.keyboard.press(str(n)); await pg.wait_for_timeout(140)
        await pg.screenshot(path="/home/claude/test/music_hum.png")
        print("singing panel:", await pg.evaluate(f"{U}.singPanel.visible"), "| hotbar unchanged:", sel0 == await pg.evaluate("G.data.selected"))
        print("panel text:", (await pg.evaluate(f"{U}.singText.text")).replace("\n"," | ")[:220])
        # The wheel changes harmonia while singing.
        await pg.mouse.move(480, 300); await pg.mouse.wheel(0, 100); await pg.wait_for_timeout(200)
        print("after wheel:", (await pg.evaluate(f"{U}.singText.text")).split("\n")[0])
        await pg.keyboard.up("v"); await pg.wait_for_timeout(100)
        print("stopped:", not await pg.evaluate(f"{U}.singPanel.visible"))
        # Stumble on the lullaby by ear (Lydian = index 2).
        async def sing(mode, notes):
            await pg.keyboard.down("v")
            for _ in range(7):
                cur = await pg.evaluate(f"{U}.singText.text.split(' harmonia')[0].split('the ').pop()")
                if cur == ["Dorian","Phrygian","Lydian","Mixolydian","Hypodorian","Hypophrygian","Hypolydian"][mode]: break
                await pg.mouse.wheel(0, 100); await pg.wait_for_timeout(120)
            for n in notes: await pg.keyboard.press(str(n)); await pg.wait_for_timeout(150)
            await pg.keyboard.up("v"); await pg.wait_for_timeout(150)
        await sing(2, [5,4,3])
        print("hint:", await pg.evaluate("JSON.stringify(window._log.slice(-4))"))
        await sing(2, [5,4,3,2,1,2,1])
        print("by ear:", await msgs(), "| songs", await pg.evaluate("G.data.songs"))
        # Learn the work song from Lykos.
        await pg.evaluate(f"{F}.goTo('Village')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("G.npcRec('lykos').rel=1")
        r = await pg.evaluate(f"(()=>{{const t={V}.targets.find(t=>t.label&&t.label.includes('Lykos')); t.act(); const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('songs')); o.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2]; }})()")
        print("Lykos:", r[:260])
        await pg.evaluate(f"{U}.closeTalk(); {V}.goTo('Farm')"); await pg.wait_for_timeout(2500)
        # Perform it: Fatigue falls (a high Ourania so it succeeds).
        await pg.evaluate("G.data.aretai.Ourania=12; G.data.fatigue=50; G.essence.Air=99")
        await sing(0, [1,3,1,3,5,3])
        print("work song:", await msgs(), "| fatigue", await pg.evaluate("Math.round(G.data.fatigue)"))
        await sing(0, [1,3,1,3,5,3]); print("again today:", await msgs())
        # The lullaby calms a charging boar.
        await pg.evaluate(f"(()=>{{const f={F}; const A=f.animals[0].constructor; const a=new A(f,'boar',f.player.x+60,f.player.y,new Phaser.Geom.Rectangle(0,0,2000,2000)); f.animals.push(a); a.charge(20); window._boar=a; G.essence.Air=99; }})()")
        await sing(2, [5,4,3,2,1,2,1])
        print("lullaby:", await msgs(), "| boar state", await pg.evaluate("[window._boar.state, window._boar.appeased]"))
        # A nightingale at dusk: hear it, sing it back, learn it.
        await pg.evaluate(f"G.data.clock=G.daylight; const r0=Math.random; Math.random=()=>0.001; {F}.maybeHearSong(); Math.random=r0")
        await pg.wait_for_timeout(4000)
        print("heard:", await msgs())
        await pg.screenshot(path="/home/claude/test/music_heard.png")
        await sing(2, [8,7,8,5,6,5,3])
        print("sung back:", await msgs(), "| songs", await pg.evaluate("G.data.songs"))
        # Instruments: craft reed pipes, hold them; the panel says you're playing them.
        await pg.evaluate("G.addItem('Fiber',6); G.addItem('Wax',1)")
        await pg.evaluate(f"{U}.openCraft(); (()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Reed pipes')); t.emit('pointerdown'); }})(); {U}.closeCraft()")
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Syrinx')")
        await pg.keyboard.down("v"); await pg.keyboard.press("5"); await pg.wait_for_timeout(200)
        print("with pipes:", (await pg.evaluate(f"{U}.singText.text")).split("\n")[0])
        await pg.keyboard.up("v")
        # Tiresias teaches the bird-call.
        await pg.evaluate(f"G.data.tir.met=true; {U}.talkTiresias()")
        r = await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('teach you a song')); o.emit('pointerdown'); return {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text)[2]; }})()")
        print("Tiresias:", r[-160:])
        await pg.evaluate(f"{U}.closeTalk()")
        await pg.keyboard.down("v"); await pg.wait_for_timeout(200)
        await pg.screenshot(path="/home/claude/test/music_known.png")
        await pg.keyboard.up("v")
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
