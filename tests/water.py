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
        go = lambda x,y: pg.evaluate(f"(()=>{{const s=game.scene.getScenes(true).find(s=>s.scene.key!=='UI'); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.scene='Wild'; s.goTo('Wild');}})()")
        # make a coastal screen
        await go(3,0); await pg.wait_for_timeout(1500)
        await pg.evaluate("(()=>{const r=G.data.screens['3,0']; r.terrain=7; r.feature='Tide pools'; r.cleared=[]; r.boatRolled=true;})()")
        await go(3,0); await pg.wait_for_timeout(1800)
        counts = await pg.evaluate(f"(()=>{{const o={Wd}.objects; let s=0,d=0; o.forEachTile(t=>{{ if(t.index===42) s++; if(t.index===20) d++; }}); return [s,d];}})()")
        print("shallow/deep tiles:", counts)
        # dig a little lake in the middle for a sure test: deep in the middle, shallows around
        await pg.evaluate(f"""(()=>{{const s={Wd}, o=s.objects; for(let y=10;y<21;y++) for(let x=12;x<29;x++){{ const e=(y===10||y===20||x===12||x===28); o.putTileAt(e?42:20,x,y); s.removeTrunk(x,y);}} for(let x=10;x<31;x++){{o.putTileAt(-1,x,21);o.putTileAt(-1,x,22); s.removeTrunk(x,21); s.removeTrunk(x,22);}} }})()""")
        # find a shallow tile next to land, and a deep tile
        spots = await pg.evaluate(f"""(()=>{{const s={Wd}, o=s.objects; let sh=null, dp=null;
           o.forEachTile(t=>{{ const inner=t.x>=12&&t.y>=10&&t.x<=28&&t.y<=20; if(inner && !sh && t.index===42 && t.y===20 && t.x===20) sh=[t.x,t.y]; if(inner && !dp && t.index===20 && t.y===15 && t.x===20) dp=[t.x,t.y]; }}); return [sh,dp];}})()""")
        print("spots:", spots)
        sh, dp = spots
        # wade: speed in shallows
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition({sh[0]}*16+8, {sh[1]}*16+3); }})()"); await pg.wait_for_timeout(200)
        print("underfoot shallows:", await pg.evaluate(f"{Wd}.underfoot()"), "speed factor:", await pg.evaluate(f"{Wd}.groundSpeed()"), "| subject:", await pg.evaluate(f"(()=>{{const s={Wd}; s.mouseIn=false; s.facingTile=()=>[{sh[0]},{sh[1]}]; const r=s.subjectAt(); delete s.facingTile; return r;}})()"))
        # swim: Air drains, then drowning
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition({dp[0]}*16+8, {dp[1]}*16+3); G.data.fatigue=0; }})()")
        await pg.wait_for_timeout(1500)
        print("swimming:", await pg.evaluate(f"{Wd}.swimming"), "Air:", await pg.evaluate("G.essence.Air.toFixed(1)"), "|", await msg(pg))
        await pg.screenshot(path="/home/claude/test/w_swim.png")
        await pg.wait_for_timeout(6000)
        print("after 7s: Air", await pg.evaluate("G.essence.Air.toFixed(1)"), "fatigue", await pg.evaluate("Math.round(G.data.fatigue)"), "|", await msg(pg))
        # boat: craft, place at the shore, board, row, disembark
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition({sh[0]}*16+8, {sh[1]}*16+3); G.data.fatigue=0; G.essence.Air=G.essenceMax.Air; G.addItem('Boat',1); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Boat'); s.mouseIn=false; s.facingTile=()=>[{sh[0]}+1,{sh[1]}]; s.useNow(); delete s.facingTile; }})()")
        await pg.wait_for_timeout(300); print("place:", await msg(pg))
        await pg.evaluate(f"(()=>{{const s={Wd}; const o=s.placedObjs.find(o=>o.p.id==='Boat'); s.boardBoat(o);}})()"); await pg.wait_for_timeout(200)
        print("in boat:", await pg.evaluate(f"!!{Wd}.boat"))
        x0 = await pg.evaluate(f"[{Wd}.player.x,{Wd}.player.y]")
        # row toward the deep tile
        dirx = "d" if dp[0]*16 > x0[0] else "a"
        await pg.keyboard.down(dirx); await pg.wait_for_timeout(1600); await pg.keyboard.up(dirx)
        x1 = await pg.evaluate(f"[{Wd}.player.x,{Wd}.player.y, {Wd}.underfoot()]")
        print("rowed from", [round(v) for v in x0], "to", [round(v) for v in x1[:2]], "water", x1[2], "| Air", await pg.evaluate("G.essence.Air.toFixed(1)"))
        await pg.screenshot(path="/home/claude/test/w_boat.png")
        await pg.evaluate(f"{Wd}.interactNow()"); print("E in open water:", await msg(pg))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
