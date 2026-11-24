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
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false;")
        async def go(scene, setup, wait=2600, src=None):
            await pg.evaluate(f"(()=>{{ {setup}; G.data.scene='{scene}'; const cur=game.scene.getScenes(true).find(x=>x.goTo); cur.goTo('{scene}'); }})()")
            await pg.wait_for_timeout(wait)
        shots = [
          ("farm_summer", "Farm", "G.data.month=0; G.data.clock=4; G.data.weather='clear'; G.data.entry='S'"),
          ("wild_valley_spring", "Wild", "G.data.month=10; G.data.clock=4; G.data.weather='clear'; G.data.screens['2,0']={terrain:1,special:false,feature:'Flower meadow',cleared:[]}; G.data.wx=2;G.data.wy=0;G.data.entry='W'"),
          ("wild_forest_autumn", "Wild", "G.data.month=4; G.data.clock=4; G.data.weather='cloudy'; G.data.screens['3,0']={terrain:2,special:false,feature:'Old oak',cleared:[]}; G.data.wx=3;G.data.wy=0;G.data.entry='W'"),
          ("wild_forest_dusk", "Wild", "G.data.month=0; G.data.clock=G.daylight-0.5; G.data.weather='clear'; G.data.screens['3,0']={terrain:2,special:false,feature:'Old oak',cleared:[]}; G.data.wx=3;G.data.wy=0;G.data.entry='W'"),
          ("wild_marsh_mist", "Wild", "G.data.month=7; G.data.clock=1; G.data.weather='mist'; G.data.screens['4,0']={terrain:5,special:false,feature:'Still pool',cleared:[]}; G.data.wx=4;G.data.wy=0;G.data.entry='W'"),
          ("village_rain", "Village", "G.data.month=6; G.data.clock=4; G.data.weather='rain'; G.data.entry='N'"),
          ("wild_plains_wind", "Wild", "G.data.month=1; G.data.clock=4; G.data.weather='wind'; G.data.screens['5,0']={terrain:10,special:false,feature:'Lone oak',cleared:[]}; G.data.wx=5;G.data.wy=0;G.data.entry='W'"),
        ]
        for name, scene, setup in shots:
            await go(scene, setup)
            # move to the middle of the map so the scene is in view
            await pg.evaluate("(()=>{const s=game.scene.getScenes(true).find(x=>x.player); s.player.setPosition(20*16+8, 14*16+8); G.messages.length=0;})()")
            await pg.wait_for_timeout(3500)
            n = await pg.evaluate("(()=>{const s=game.scene.getScenes(true).find(x=>x.player); const a=s.ambience; if(!a) return 'none'; const c={}; a.motes.forEach(m=>c[m.kind]=(c[m.kind]||0)+1); return JSON.stringify({motes:c, mist:a.mist.length, shadows:a.shadows.length, flowers:a.flowers.length, trees:a.trees.length});})()")
            print(name, n)
            await pg.screenshot(path=f"/home/claude/test/l_{name}.png")
        # rain waters the fields at dawn
        await pg.evaluate("G.data.ground['10,10']='tilled'; G.data.ground['11,10']='tilled';")
        import random
        await pg.evaluate("(()=>{ const r=Math.random; let n=0; Math.random=()=>{ n++; return n===1?0.0:r(); }; G.data.month=6; G.sleep(8); Math.random=r; })()")
        print("weather after sleep:", await pg.evaluate("G.data.weather"), "| ground:", await pg.evaluate("JSON.stringify([G.data.ground['10,10'],G.data.ground['11,10']])"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
