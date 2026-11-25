import asyncio, json
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
CASES=[("Ruined watchtower",12),("Burial mound",10),("Bee tree",1),("Driftwood beach",7),("Oasis",8),("Acropolis ruins",12),("Animal den",2),("Olive grove",3),("Reed bed",5),("Fallen giant",2)]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.wait_for_timeout(800); await pg.evaluate(f"{U}.help && {U}.help.setVisible(false); {U}.modal=false; G.data.clock=3; G.data.weather='clear'")
        go = lambda x,y: pg.evaluate(f"(()=>{{const s=game.scene.getScenes(true).find(s=>s.scene.key!=='UI'); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.scene='Wild'; s.goTo('Wild');}})()")
        for i,(name,terr) in enumerate(CASES):
            x,y = 3+i, 0
            for _ in range(4):
                await pg.evaluate(f"G.data.fatigue=0; {U}.modal=false; {U}.talkPanel && {U}.closeTalk()")
                await go(x,y); await pg.wait_for_timeout(1500)
                if await pg.evaluate(f"!!G.data.screens['{x},{y}'] && game.scene.isActive('Wild') && G.data.wx==={x}"): break
                print("   retry:", await pg.evaluate("[game.scene.getScenes(true).map(s=>s.scene.key).join(','), G.data.wx, G.data.wy, G.data.scene, game.scene.getScene('Wild').leaving]"), await msg(pg,2))
            await pg.evaluate(f"(()=>{{const r=G.data.screens['{x},{y}']; r.feature='{name}'; r.terrain={terr}; r.cleared=[]; r.hut=null; r.shrine=null; r.graveyard=null; r.lmSeen=false; r.lmTook={{}}; r.lmCache=undefined;}})()")
            await go(x,y); await pg.wait_for_timeout(1600)
            info = await pg.evaluate(f"(()=>{{const s={Wd}; const l=s.lm; return l?{{x:l.x,y:l.y,r:l.def.r,finds:s.pickups.filter(p=>p.lm!==undefined).length, targets:s.targets.map(t=>t.label).filter(t=>t&&(t.includes('Search')||t.includes('Look out')||t.includes('offering')||t.includes('Dig')||t.includes('Take')||t.includes('Reach')||t.includes('Work')||t.includes('Crawl')))}}:null;}})()")
            await pg.evaluate(f"(()=>{{const s={Wd},l=s.lm; s.player.setPosition(l.x*16+8, (l.y+l.def.r-1)*16+8); s.player.setVelocity(0,0);}})()")
            await pg.wait_for_timeout(700)
            print(name, json.dumps(info), "|", (await msg(pg,2))[:200])
            await pg.screenshot(path=f"/home/claude/test/lm_{i}.png")
            if info and info["targets"]:
                lab = info["targets"][0]
                await pg.evaluate(f"(()=>{{G.essence.Earth=G.essenceMax.Earth; const t={Wd}.targets.find(t=>t.label==={json.dumps(lab)}); t.act();}})()"); await pg.wait_for_timeout(300)
                print("   ->", (await msg(pg,3))[:300])
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
