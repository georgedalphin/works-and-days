import asyncio, json
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
        # find a river column near home by asking the game
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2000)
        # choose the seed until a river column crosses screens (1..4, 1..3)
        found = None
        for s in range(60):
            await pg.evaluate(f"G.data.seed = {1000+s}")
            r = await pg.evaluate("""(()=>{ const W=window; const f=W.__river; return null;})()""")
            break
        go = lambda x,y: pg.evaluate(f"(()=>{{const s=game.scene.getScenes(true).find(s=>s.scene.key!=='UI'); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.scene='Wild'; s.goTo('Wild');}})()")
        hits=[]
        for seed in range(1000, 1040):
            await pg.evaluate(f"G.data.seed={seed}; G.data.screens={{}}")
            for (x,y) in [(1,2),(2,2),(1,3),(2,3),(3,2)]:
                await go(x,y); await pg.wait_for_timeout(700)
                rec = await pg.evaluate(f"(()=>{{const r={Wd}.rec; return [r.river, r.ford];}})()")
                if rec[0]:
                    hits.append((seed,x,y,rec)); break
            if hits: break
        print("river found:", hits)
        seed,x,y,rec = hits[0]
        info = await pg.evaluate(f"(()=>{{const s={Wd}, o=s.objects; let sh=0,dp=0; o.forEachTile(t=>{{ if(t.index===42) sh++; if(t.index===20) dp++; }}); return {{sh,dp,gates:s.gates}};}})()")
        print("tiles:", info)
        print(await pg.evaluate(f"(()=>{{const o={Wd}.objects; let rows=[]; for(let y=0;y<30;y++){{ let r=''; for(let x=0;x<40;x++){{ const t=o.getTileAt(x,y)?.index??-1; r+= t===20?'~':t===42?'-':t===-1?'.':'#'; }} rows.push(r);}} return rows.join('\\n');}})()"))
        await pg.evaluate(f"(()=>{{const s={Wd}; const f=s.rec.ford; if(f) s.player.setPosition(f[0]*16+8, f[1]*16+8);}})()"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/river.png")
        # match across an edge: find the river's sides and check the neighbour agrees
        sides = await pg.evaluate(f"(()=>{{const s={Wd}; const out=[]; const o=s.objects; for(const [sd,x0,y0,dx,dy] of [['N',0,0,1,0],['S',0,29,1,0],['W',0,0,0,1],['E',39,0,0,1]]) {{ let n=0; for(let i=0;i<40;i++){{ const x=x0+dx*i, y=y0+dy*i; const t=o.getTileAt(x,y); if(t && (t.index===20||t.index===42)) n++; }} if(n) out.push([sd,n]); }} return out; }})()")
        print("water on edges:", sides)
        # row the boat across the edge
        sd = sides[0][0]
        await pg.evaluate(f"""(()=>{{const s={Wd}, o=s.objects; let spot=null; o.forEachTile(t=>{{ if(spot) return; const edgeRow = '{sd}'==='S'? t.y===27 : '{sd}'==='N'? t.y===2 : '{sd}'==='E'? t.x===37 : t.x===2; if(edgeRow && (t.index===20||t.index===42)) spot=[t.x,t.y]; }});
            G.data.placed.push({{id:'Boat', where:s.placeKey(), x:spot[0], y:spot[1]}}); s.spawnPlaced(G.data.placed[G.data.placed.length-1]); const ob=s.placedObjs[s.placedObjs.length-1]; s.boardBoat(ob); window._dir='{sd}'; }})()""")
        key = {"N":"w","S":"s","E":"d","W":"a"}[sd]
        before = await pg.evaluate("[G.data.wx,G.data.wy]")
        await pg.keyboard.down(key); await pg.wait_for_timeout(2500); await pg.keyboard.up(key); await pg.wait_for_timeout(1500)
        after = await pg.evaluate(f"[G.data.wx,G.data.wy, !!{Wd}.boat, {Wd}.underfoot()]")
        print("rowed", sd, "from", before, "to", after[:2], "| still in boat:", after[2], "| water:", after[3], "|", await msg(pg,2))
        await pg.screenshot(path="/home/claude/test/river2.png")
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
