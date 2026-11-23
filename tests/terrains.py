import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3")
        feats = {5:"Still pool",7:"Tide pools",8:"Oasis",9:"Mountain spring",10:"Lone oak",11:"Thorn thicket",12:"Acropolis ruins"}
        first = True
        for t,f in feats.items():
            k=f"{t+10},0"
            src = "game.scene.getScene('House')" if first else Wd
            await pg.evaluate(f"G.data.screens['{k}']={{terrain:{t},special:false,feature:'{f}',cleared:[]}}; G.data.wx={t+10};G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {src}.goTo('Wild')")
            first = False
            await pg.wait_for_timeout(2600)
            info = await pg.evaluate(f"(()=>{{const s={Wd}; const ids={{}}; s.objects.forEachTile(tl=>{{ if(tl.index>=0) ids[tl.index]=(ids[tl.index]||0)+1; }}); return JSON.stringify({{label:G.locationLabel(), water:s.water.length, forage:s.spots.map(x=>x.def.id), animals:s.animals.map(a=>a.kind), objs:ids}}); }})()")
            print(t, info)
            # stand still in the middle and zoom the camera out for a full-map look
            await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(20*16+8, 15*16+8); G.messages.length=0;}})()")
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=f"/home/claude/test/t{t}.png")
        # mud slows: on terrain 5, the ground speed
        await pg.evaluate(f"G.data.screens['15,0']={{terrain:5,special:false,feature:'Reed bed',cleared:[]}}; G.data.wx=15;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {Wd}.goTo('Wild')"); await pg.wait_for_timeout(2600)
        print("marsh ground speed:", await pg.evaluate(f"{Wd}.groundSpeed()"))
        # desert heat: away from water, by day
        await pg.evaluate(f"G.data.screens['18,0']={{terrain:8,special:false,feature:'Dry wadi',cleared:[]}}; G.data.wx=18;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; G.data.clock=3; {Wd}.goTo('Wild')"); await pg.wait_for_timeout(2600)
        f0 = await pg.evaluate("G.data.fatigue"); await pg.wait_for_timeout(6000); f1 = await pg.evaluate("G.data.fatigue")
        print("desert heat: fatigue", round(f0,2), "->", round(f1,2), "|", await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        # cut reeds, thorn, fell a pine
        await pg.evaluate("G.data.aretai.Kratos=12; G.essence.Earth=99; G.essence.Fire=99")
        for tile, tool in [(31,"sickle"),(32,"axe"),(30,"axe"),(30,"axe"),(30,"axe")]:
            await pg.evaluate(f"(()=>{{const s={Wd}; let hit=null; s.objects.forEachTile(tl=>{{ if(!hit && tl.index===-1) hit=tl; }}); const tl=s.objects.getTileAt(20,14); s.objects.putTileAt({tile},20,14); s.player.setPosition(19*16+8, 14*16+4); s.facing=2; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='{tool}'); G.essence.Earth=99; G.essence.Fire=99; G.data.fatigue=0; }})()")
            if tile==30 and tool=="axe": pass
            await pg.evaluate(f"{Wd}.useItem()"); await pg.wait_for_timeout(200)
            print(tile, tool, ":", await pg.evaluate("G.messages.map(m=>m.text).slice(-1)[0]"))
        # how often each terrain comes up from the forest
        dist = await pg.evaluate("(()=>{const c={}; let s=1; const r=()=>{s=(s*16807)%2147483647; return s/2147483647;}; for(let i=0;i<5000;i++){ const t=window.rollTerrainForTest? 0:0; } return 0;})()")
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
