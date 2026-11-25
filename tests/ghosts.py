import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; V="game.scene.getScene('Village')"; Wd="game.scene.getScene('Wild')"
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
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        # 1. A fox bite when nearly spent no longer fells you at once.
        r = await pg.evaluate(f"""(()=>{{const f={F}; window._A=f.animals[0].constructor; const fox=new window._A(f,'fox',f.player.x+10,f.player.y,new Phaser.Geom.Rectangle(0,0,999,999)); f.animals.push(fox);
          G.data.vitality=G.vitalityMax; const lt0=G.data.lifeThread; const out=[];
          for(let i=0;i<30;i++){{ f.invuln=0; f.leaving=false; f.struck(fox); out.push(G.data.vitality); if (G.data.lifeThread<lt0) break; }}
          return {{lt0, out, msgs: G.messages.map(m=>m.text).slice(-4)}}; }})()""")
        print("fox bites:", r["out"], "| thread was", r["lt0"]); print("   ", r["msgs"])
        await pg.wait_for_timeout(2500); await pg.keyboard.press("Space"); await pg.wait_for_timeout(1500)
        # 2. Aretai calm: ghosts against Pneuma 3 vs 8; foxes against Oikos 3 vs 8 (at night).
        await pg.evaluate("G.data.fatigue=0; G.data.clock=3; G.data.wx=1; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScenes(true).find(s=>s.scene.key!=='UI').goTo('Wild')"); await pg.wait_for_timeout(2500)
        rate = lambda kind, ar, v: pg.evaluate(f"""(()=>{{const w={Wd}; G.data.clock=G.daylight+1; G.data.aretai['{ar}']={v}; const A=w.player.constructor; let n=0;
          const a=new window._A(w,'{kind}',w.player.x+200,w.player.y,new Phaser.Geom.Rectangle(0,0,1,1));
          for(let i=0;i<600;i++){{ a.state='idle'; if (w.aggressionRoll(a)) n++; }} a.sprite.destroy(); G.data.aretai['{ar}']=3; return n/600; }})()""")
        print("eidolon attacks: Pneuma 3", await rate("eidolon","Pneuma",3), "| Pneuma 6", await rate("eidolon","Pneuma",6), "| Pneuma 8", await rate("eidolon","Pneuma",8))
        print("wolf attacks:    Thymos 3", await rate("wolf","Thymos",3), "| Thymos 8", await rate("wolf","Thymos",8))
        print("fox attacks:     Oikos 3", await rate("fox","Oikos",3), "| Oikos 7", await rate("fox","Oikos",7))
        # 3. Ghosts at a crossroads: ordinary nights 0-2, never a ring; Noumenia, a ring of 3-5.
        counts = await pg.evaluate(f"""(()=>{{const w={Wd}; w.rec.crossroads=true; w.rec.graveyard=null; w.rec.hut=null; G.data.clock=G.daylight+1; G.data.day=8; const out=[];
          for(let i=0;i<60;i++){{ w.rollGhosts(); const g=w.animals.filter(a=>a.kind==='eidolon'); out.push(g.length + (g.some(a=>a.orbit)?'r':'')); for(const a of g){{a.sprite.destroy(); w.animals.splice(w.animals.indexOf(a),1);}} }}
          return out.join(''); }})()""")
        print("ordinary nights at a crossroads (60 rolls):", {c: counts.count(c) for c in "012345r"})
        marsh = await pg.evaluate(f"""(()=>{{const w={Wd}; w.rec.crossroads=false; let n=0, mx=0; for(const t of [5,3]){{ w.rec.terrain=t; let c=0; for(let i=0;i<400;i++){{ w.rollGhosts(); const g=w.animals.filter(a=>a.kind==='eidolon'); c+=g.length; mx=Math.max(mx,g.length); for(const a of g){{a.sprite.destroy(); w.animals.splice(w.animals.indexOf(a),1);}} }} n+=0; w['_c'+t]=c; }}
          return [w._c5/400, w._c3/400, mx, (w.rec.roads||[]).length]; }})()""")
        print("ghosts per night: marsh", marsh[0], "| elsewhere", marsh[1], "(roads here:", marsh[3], ") | most at once", marsh[2])
        ring = await pg.evaluate(f"""(()=>{{const w={Wd}; w.rec.crossroads=true; w.rec.terrain=3; G.data.day=1; w.rollGhosts(); const g=w.animals.filter(a=>a.kind==='eidolon'); return [g.length, g.filter(a=>a.orbit).length, G.messages.slice(-1)[0].text]; }})()""")
        print("Noumenia ring:", ring)
        await pg.evaluate(f"{Wd}.player.setPosition(20*16+8, 15*16+70); {Wd}.animals.filter(a=>a.kind==='eidolon').forEach(a=>{{a.rolled=true; a.rerollT=99}})"); await pg.wait_for_timeout(2500)
        pos1 = await pg.evaluate(f"{Wd}.animals.filter(a=>a.orbit).map(a=>[Math.round(a.sprite.x),Math.round(a.sprite.y)])")
        await pg.screenshot(path="/home/claude/test/ghost_ring.png")
        await pg.wait_for_timeout(1500)
        pos2 = await pg.evaluate(f"{Wd}.animals.filter(a=>a.orbit).map(a=>[Math.round(a.sprite.x),Math.round(a.sprite.y)])")
        print("circling:", pos1[:3], "->", pos2[:3])
        sup = await pg.evaluate(f"(()=>{{const w={Wd}; G.addItem('Honey',1); const i=G.data.slots.findIndex(s=>s&&s.id==='Honey'); G.data.selected=i; G.data.offered.hecateSupper=-1; w.atHerm(); return [G.messages.slice(-2).map(m=>m.text), w.animals.filter(a=>a.orbit&&a.appeased).length]; }})()")
        print("Hecate's supper:", sup)
        # 4. Noumenia in the village: the dead at the doors.
        await pg.evaluate(f"G.data.day=1; G.data.clock=3; G.data.wx=0; G.data.wy=2; G.data.entry='N'; {Wd}.goTo('Village')"); await pg.wait_for_timeout(2500)
        vis = []
        for i in range(8):
            v = await pg.evaluate(f"(()=>{{const v={V}; for(const a of v.animals.filter(a=>a.kind==='eidolon')){{a.sprite.destroy(); v.animals.splice(v.animals.indexOf(a),1);}} v.noumRolled=false; G.data.clock=G.daylight+1; v.noumeniaVisit([[5,5],[9,9]],0.7,2,'x'); return v.animals.filter(a=>a.kind==='eidolon').length; }})()")
            vis.append(v)
        none = await pg.evaluate(f"(()=>{{const v={V}; v.noumRolled=false; G.data.day=9; v.noumeniaVisit([[5,5]],1,2,'x'); return v.animals.filter(a=>a.kind==='eidolon').length; }})()")
        print("village on Noumenia night:", vis, "| ordinary night adds none:", none)
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
