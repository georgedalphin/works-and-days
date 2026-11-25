import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3")
        # craft a campfire
        await pg.evaluate("G.addItem('Fiber',12); G.addItem('Stone',4)")
        await pg.evaluate(f"{U}.openCraft()"); await pg.evaluate(f"(()=>{{const t={U}.craft.list.find(o=>o.type==='Text'&&o.text.startsWith('Campfire')); t.emit('pointerdown');}})()")
        print("craft:", await msg(pg)); await pg.evaluate(f"{U}.closeCraft()")
        # into the wild, set it down
        await pg.evaluate("(()=>{const s=game.scene.getScenes(true).find(s=>s.scene.key!=='UI'); G.data.wx=2; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; s.goTo('Wild');})()"); await pg.wait_for_timeout(2000)
        await pg.evaluate(f"""(()=>{{const s={Wd}; for(let y=12;y<19;y++) for(let x=16;x<24;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }} s.player.setPosition(20*16+8, 15*16+8); s.mouseIn=false;
           G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Campfire'); s.facingTile=()=>[21,15]; s.useNow(); delete s.facingTile; }})()""")
        await pg.wait_for_timeout(300); print("place:", await msg(pg))
        await pg.evaluate("G.data.clock=G.daylight+1; G.data.fatigue=60"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/camp.png")
        await pg.evaluate(f"(()=>{{const s={Wd}; const o=s.placedObjs.find(o=>o.p.id==='Campfire'); o.t.act(); const b={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('Sleep here')); b.emit('pointerdown');}})()"); await pg.wait_for_timeout(200)
        print("ask:", await pg.evaluate(f"{U}.dialog ? {U}.dialog.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ').slice(0,250) : 'none'"))
        await pg.keyboard.press("y"); await pg.wait_for_timeout(1800)
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(2500)
        print("woke:", await pg.evaluate("[G.data.scene, game.scene.isActive('Wild'), Math.round(G.data.fatigue), G.data.wx, G.dateLabel()]"), "| campfire still:", await pg.evaluate(f"{Wd}.placedObjs.some(o=>o.p.id==='Campfire')"))
        # pause: Esc -> save and quit -> title -> continue resumes here
        await pg.evaluate(f"{Wd}.player.setPosition(100, 120)"); await pg.wait_for_timeout(200)
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        print("pause:", await pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ') : 'none'"))
        await pg.screenshot(path="/home/claude/test/pause.png")
        await pg.evaluate(f"(()=>{{const t={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('Save and quit')); t.emit('pointerdown');}})()"); await pg.wait_for_timeout(1500)
        print("title:", await pg.evaluate("game.scene.isActive('Title')"), "| active:", await pg.evaluate("game.scene.getScenes(true).map(s=>s.scene.key).join(',')"))
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(2500)
        print("resumed:", await pg.evaluate("[game.scene.getScenes(true).map(s=>s.scene.key).join(','), G.data.wx, Math.round(game.scene.getScene('Wild').player.x), Math.round(game.scene.getScene('Wild').player.y)]"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
