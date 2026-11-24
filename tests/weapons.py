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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4")
        print("spear in pack:", await pg.evaluate("G.count('spear')"), "| spearAt:", await pg.evaluate("G.data.spearAt"))
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"""(()=>{{const s={F}; for(let y=18;y<26;y++) for(let x=26;x<42;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }}
          s.player.setPosition(30*16+8, 21*16+8); s.player.setVelocity(0,0); s.mouseIn=false; s.facing=2;
          G.data.aretai.Thymos=12; G.essence.Fire=99; G.data.fatigue=0; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='spear'); }})()""")
        # a hare 36 px to the right: in the spear's reach, out of the sword's
        hare = f"(()=>{{const s={F}; const a=s.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); a.sprite.setPosition(s.player.x+36, s.player.y); a.sprite.setVelocity(0,0); a.state='idle'; a.timer=99; a.hp=-1; return !!a;}})()"
        print("hare:", await pg.evaluate(hare))
        await pg.evaluate("G.addItem('sword',1)")
        await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='sword'); s.useNow();}})()")
        print("sword at 36px:", await msg(pg))
        await pg.evaluate(hare)
        await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='spear'); s.useNow();}})()")
        print("spear thrust at 36px:", await msg(pg, 2))
        await pg.wait_for_timeout(1200)
        # Throw: hold the mouse ~90 px to the right, release.
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(30*16+8, 21*16+8); s.mouseUsed=true; s.mouseIn=true; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='spear'); }})()")
        await pg.wait_for_timeout(200)
        x,y = await pg.evaluate(f"(()=>{{const s={F},c=s.cameras.main; return [(s.player.x+90-c.worldView.x)*c.zoom, (s.player.y+4-c.worldView.y)*c.zoom];}})()")
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(450)
        print("aiming while held:", await pg.evaluate(f"{F}.aiming"), "| spearAiming:", await pg.evaluate(f"{F}.spearAiming"))
        await pg.screenshot(path="/home/claude/test/w_aim.png")
        await pg.mouse.up(); await pg.wait_for_timeout(150)
        await pg.screenshot(path="/home/claude/test/w_fly.png")
        await pg.wait_for_timeout(900)
        print("after throw:", await msg(pg), "| in pack:", await pg.evaluate("G.count('spear')"), "| spearAt:", await pg.evaluate("JSON.stringify(G.data.spearAt)"))
        await pg.screenshot(path="/home/claude/test/w_landed.png")
        # Leave and come back: the spear still lies there.
        await pg.evaluate("game.scene.getScene('Farm').goTo('House')"); await pg.wait_for_timeout(1500)
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2200)
        print("pickup restored:", await pg.evaluate(f"{F}.pickups.filter(p=>p.id==='spear').length"))
        await pg.evaluate(f"(()=>{{const s={F}; const p=s.pickups.find(p=>p.id==='spear'); s.player.setPosition(p.img.x, p.img.y-4); s.player.setVelocity(0,0); }})()")
        await pg.wait_for_timeout(400)
        print("fetched:", await msg(pg), "| in pack:", await pg.evaluate("G.count('spear')"), "| spearAt:", await pg.evaluate("G.data.spearAt"))
        # Quick tap with the spear: a thrust, not a throw
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='spear')")
        await pg.mouse.move(x,y); await pg.mouse.down(); await pg.wait_for_timeout(60); await pg.mouse.up(); await pg.wait_for_timeout(200)
        print("tap keeps spear:", await pg.evaluate("G.count('spear')"))
        # Space hold throws too
        await pg.keyboard.down("Space"); await pg.wait_for_timeout(400); await pg.keyboard.up("Space"); await pg.wait_for_timeout(1200)
        print("space throw -> in pack:", await pg.evaluate("G.count('spear')"), "| spearAt:", await pg.evaluate("!!G.data.spearAt"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
