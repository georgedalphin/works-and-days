"""The house: its look by day and night, furniture set down inside, sitting, comfort."""
import asyncio, sys
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Ho="game.scene.getScene('House')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def place(pg, id, x, y, facing):
    # stand below/left of the anchor and face it
    dx, dy = {0:(0,-1),1:(1,0),2:(-1,0),3:(0,1)}[facing]
    await pg.evaluate(f"""(()=>{{const s={Ho}; s.player.setPosition({(x+dx)*16+8},{(y+dy)*16+8}); s.player.setVelocity(0,0); s.mouseIn=false; s.cursorMode=false; s.facing={facing};
      G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='{id}'); }})()""")
    await pg.wait_for_timeout(120)
    await pg.evaluate(f"{Ho}.useNow()"); await pg.wait_for_timeout(120)
    return await msg(pg)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'"); await pg.wait_for_timeout(600)
        await pg.evaluate(f"{Ho}.player.setPosition(9*16+8, 8*16+8)"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/home_day.png")
        await pg.evaluate("G.data.clock=G.daylight+3"); await pg.wait_for_timeout(600)
        await pg.screenshot(path="/home/claude/test/home_night.png")
        await pg.evaluate("G.data.clock=4"); await pg.wait_for_timeout(300)
        await pg.evaluate("(()=>{ for(const k of ['Table','Stool','Chair','Couch','Rug','Pelt','LampStand','Basket','Vase','Tapestry','Chest','Loom','Kiln']) G.addItem(k,1); G.data.fatigue=40; })()")
        print("rug:", await place(pg, "Rug", 9, 8, 0))
        print("table:", await place(pg, "Table", 9, 8, 0))
        print("stool:", await place(pg, "Stool", 7, 8, 0))
        print("chair:", await place(pg, "Chair", 11, 8, 0))
        print("couch:", await place(pg, "Couch", 14, 7, 0))
        print("pelt:", await place(pg, "Pelt", 4, 7, 0))
        print("lamp:", await place(pg, "LampStand", 16, 6, 0))
        print("basket:", await place(pg, "Basket", 6, 6, 0))
        print("vase:", await place(pg, "Vase", 12, 3, 3))
        print("tapestry:", await place(pg, "Tapestry", 5, 2, 0))
        print("tapestry busy:", await pg.evaluate(f"{Ho}.placeProblem('Tapestry', 9, 2)"))
        print("kiln indoors:", await place(pg, "Kiln", 3, 9, 0))
        print("loom:", await place(pg, "Loom", 16, 9, 0))
        print("on bed:", await pg.evaluate(f"{Ho}.placeProblem('Stool', 1, 4)"), "| door:", await pg.evaluate(f"{Ho}.placeProblem('Stool', 9, 10)"), "| over table:", await pg.evaluate(f"{Ho}.placeProblem('Stool', 10, 8)"), "| rug under table ok:", await pg.evaluate(f"{Ho}.placeProblem('Pelt', 12, 9)"))
        print("placed:", await pg.evaluate("G.data.placed.filter(p=>p.where==='house').map(p=>p.id+'@'+p.x+','+p.y).join(' ')"))
        print("comfort:", await pg.evaluate("G.homeComfort"))
        await pg.evaluate(f"{Ho}.player.setPosition(9*16+8, 10*16+8); G.data.selected=-1"); await pg.wait_for_timeout(500)
        await pg.evaluate("G.messages.length=0"); await pg.wait_for_timeout(200); await pg.screenshot(path="/home/claude/test/home_furnished.png")
        await pg.evaluate("G.data.clock=G.daylight+3"); await pg.wait_for_timeout(600)
        await pg.evaluate("G.messages.length=0"); await pg.wait_for_timeout(200); await pg.screenshot(path="/home/claude/test/home_furnished_night.png")
        await pg.evaluate("G.data.clock=4"); await pg.wait_for_timeout(200)
        # Sit in the chair, rest, stand up.
        f0 = await pg.evaluate("G.data.fatigue")
        await pg.evaluate(f"(()=>{{const s={Ho}; const o=s.placedObjs.find(o=>o.p.id==='Chair'); s.sit(o); }})()"); await pg.wait_for_timeout(2500)
        print("sitting:", await pg.evaluate(f"!!{Ho}.seat"), await msg(pg), "| fatigue", f0, "->", await pg.evaluate("G.data.fatigue"))
        await pg.screenshot(path="/home/claude/test/home_sit.png")
        await pg.keyboard.down("s"); await pg.wait_for_timeout(500); await pg.keyboard.up("s"); await pg.wait_for_timeout(500)
        print("stood:", await pg.evaluate(f"!{Ho}.seat"), "| body back:", await pg.evaluate(f"{Ho}.placedObjs.find(o=>o.p.id==='Chair').body.body.enable"))
        # Pick up the stool with the axe.
        await pg.evaluate(f"(()=>{{const s={Ho}; s.player.setPosition(7*16+8, 9*16+8); s.facing=3; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='axe'); }})()"); await pg.wait_for_timeout(150)
        await pg.evaluate(f"{Ho}.useNow()"); await pg.wait_for_timeout(150)
        print("pick up:", await msg(pg), "| stools:", await pg.evaluate("G.count('Stool')"))
        # Sleep: the comfort note.
        await pg.evaluate(f"{U}.sleep({Ho}, false)"); await pg.wait_for_timeout(1600)
        print("sleep text:", await pg.evaluate(f"{U}.children.list.filter(o=>o.type==='Text'&&o.text.includes('Dawn')).map(o=>o.text.replace(/\\n/g,' / ')).join('')"))
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(1800)
        print("woke at:", await pg.evaluate(f"[{Ho}.player.x,{Ho}.player.y, G.data.scene]"))
        # Out the door, and back in.
        await pg.evaluate(f"{Ho}.player.setPosition(9*16+8, 10*16+12)"); await pg.keyboard.down("s"); await pg.wait_for_timeout(900); await pg.keyboard.up("s"); await pg.wait_for_timeout(1800)
        print("out:", await pg.evaluate("G.data.scene"))
        print("errors:", errs)
        await b.close()
asyncio.run(main())
