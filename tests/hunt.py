import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
        await pg.evaluate("game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').modal=false; game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        F="game.scene.getScene('Farm')"
        msg = lambda: pg.evaluate("G.messages.map(m=>m.text).slice(-3).join(' | ')")
        print("scene", await pg.evaluate("G.data.scene"), "bow", await pg.evaluate("G.data.slots.findIndex(s=>s&&s.id==='bow')"), "arrows", await pg.evaluate("G.count('Arrow')"))
        # freeze a hare and stand 60px from it
        hx, hy = await pg.evaluate(f"(()=>{{const s={F};const h=s.animals.find(a=>a.kind==='hare');h.def.scare=0;h.def.walk=0;h.sprite.setVelocity(0,0);h.state='idle';h.timer=999;s.player.setPosition(h.sprite.x-60,h.sprite.y-4);return [h.sprite.x,h.sprite.y];}})()")
        await pg.keyboard.press("0"); await pg.wait_for_timeout(800)
        # screen coords of hare: camera worldView
        async def screen(wx, wy):
            return await pg.evaluate(f"(()=>{{const c={F}.cameras.main;return [({wx}-c.worldView.x)*c.zoom,({wy}+3-c.worldView.y)*c.zoom];}})()")
        sx, sy = await screen(hx, hy)
        await pg.mouse.move(sx, sy)
        await pg.keyboard.down("Space"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/80_aim.png")
        print("aiming", await pg.evaluate(f"{F}.aiming"), "spread@60", await pg.evaluate(f"{F}.spread(60).toFixed(1)"))
        # master archer for a sure hit
        await pg.evaluate("G.data.archeryXp=200")
        print("aimPoint", await pg.evaluate(f"{F}.aimPoint().map(v=>v.toFixed(1))"), "hare", hx, hy)
        await pg.evaluate(f"(()=>{{const s={F};const o=s.land.bind(s);s.land=(x,y)=>{{window._land=[x,y];o(x,y);}};}})()")
        await pg.mouse.down(); await pg.mouse.up(); await pg.wait_for_timeout(100)
        await pg.screenshot(path="/home/claude/test/81_flight.png")
        await pg.wait_for_timeout(1500)
        await pg.keyboard.up("Space")
        print(await msg(), "landed", await pg.evaluate("window._land"))
        print("pickups", await pg.evaluate(f"{F}.pickups.map(p=>p.id+':'+p.qty).join(',')"))
        await pg.screenshot(path="/home/claude/test/82_drops.png")
        # walk over the drops
        await pg.evaluate(f"(()=>{{const s={F};for(const p of s.pickups){{}} const p=s.pickups[0]; s.player.setPosition(p.img.x,p.img.y-4);}})()"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"(()=>{{const s={F};const p=s.pickups[0]; if(p) s.player.setPosition(p.img.x,p.img.y-4);}})()"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"(()=>{{const s={F};const p=s.pickups[0]; if(p) s.player.setPosition(p.img.x,p.img.y-4);}})()"); await pg.wait_for_timeout(200)
        print("after pickup", await pg.evaluate("['Meat','Hide','Arrow'].map(i=>i+':'+G.count(i)).join(' ')"), "pickups left", await pg.evaluate(f"{F}.pickups.length"), "archery", await pg.evaluate("G.archery"))
        # crafting
        await pg.evaluate("G.addItem('Wood',2); G.addItem('Stone',2)")
        await pg.keyboard.press("c"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/83_craft.png")
        await pg.evaluate("(()=>{const u=game.scene.getScene('UI');u.craft.list.find(o=>o.input&&o.text&&o.text.startsWith('Arrows')).emit('pointerdown');})()"); await pg.wait_for_timeout(200)
        print(await msg(), "arrows", await pg.evaluate("G.count('Arrow')"))
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(100)
        print("modal", await pg.evaluate("game.scene.getScene('UI').modal"))
        # beginner miss rate check: simulate spreads
        await pg.evaluate("G.data.archeryXp=0")
        print("beginner spread@60/@150", await pg.evaluate(f"[{F}.spread(60).toFixed(1),{F}.spread(150).toFixed(1)]"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
