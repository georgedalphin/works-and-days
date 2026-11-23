import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        # the sprite sheet itself, big
        data = await pg.evaluate("(()=>{const t=game.textures.get('player').getSourceImage(); const c=document.createElement('canvas'); c.width=t.width*6; c.height=t.height*6; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.fillStyle='#7a8a4a'; x.fillRect(0,0,c.width,c.height); x.drawImage(t,0,0,c.width,c.height); return c.toDataURL();})()")
        import base64; open('/home/claude/test/player_sheet.png','wb').write(base64.b64decode(data.split(',')[1]))
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false;")
        await pg.wait_for_timeout(300)
        # walk out of the house to the farm
        scene = await pg.evaluate("G.data.scene"); print("scene", scene)
        if scene == "House":
            await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2200)
        # find an oak on the farm and stand facing it
        pos = await pg.evaluate(f"(()=>{{const s={F}; let t=null; s.objects.forEachTile(tl=>{{ if(!t && tl.index===7 && (s.objects.getTileAt(tl.x-1,tl.y)?.index ?? -1)===-1 ) t=tl; }}); return t?[t.x,t.y]:null; }})()")
        print("oak at", pos)
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(({pos[0]}-1)*16+8, {pos[1]}*16+3); s.facing=2; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='axe');}})()")
        await pg.wait_for_timeout(500)
        print("focus visible:", await pg.evaluate(f"{F}.focusGlow.visible"), "tag:", await pg.evaluate(f"{F}.focusTag.visible && {F}.focusTag.text"))
        await pg.screenshot(path="/home/claude/test/f1_oak.png")
        await pg.evaluate(f"{F}.gesture('look')"); await pg.wait_for_timeout(250); await pg.screenshot(path="/home/claude/test/f2_look.png")
        print("look frame:", await pg.evaluate(f"{F}.player.frame.name"))
        await pg.wait_for_timeout(1200)
        await pg.evaluate(f"{F}.gesture('act')"); await pg.wait_for_timeout(60); print("act frame:", await pg.evaluate(f"{F}.player.frame.name")); await pg.screenshot(path="/home/claude/test/f3_raise.png")
        await pg.wait_for_timeout(150); print("act frame 2:", await pg.evaluate(f"{F}.player.frame.name")); await pg.screenshot(path="/home/claude/test/f4_strike.png")
        # walking: hold D
        await pg.keyboard.down("s"); frames=[]
        for i in range(8):
            await pg.wait_for_timeout(70); frames.append(await pg.evaluate(f"{F}.player.frame.name"))
        await pg.keyboard.up("s"); print("walk frames:", frames)
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
