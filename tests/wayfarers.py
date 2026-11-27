import asyncio, sys
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
SHOT="/home/claude/test/"
async def setup(b, terrain, clock, wx=3, wy=0, feature="Stone outcrop"):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
    if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
    k=f"{wx},{wy}"
    await pg.evaluate(f"G.data.screens['{k}']={{terrain:{terrain},special:false,feature:'{feature}',cleared:[]}}; G.data.wx={wx};G.data.wy={wy};G.data.entry='W';G.data.scene='Wild'; G.data.clock={clock}; {U}.help.setVisible(false); {U}.modal=false; game.scene.getScene('House').goTo('Wild')")
    await pg.wait_for_timeout(2500)
    await pg.evaluate("window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{window._log.push(t); s0(t)}; 0")
    return pg, errs
log = lambda pg, n=3: pg.evaluate(f"window._log.slice(-{n}).join(' | ')")
async def spawn(pg, wid, arriving=False):
    return await pg.evaluate(f"(()=>{{const s={Wd}; for(const g of [...s.ways]) s.dropWay(g); const d=s.wayDefs.find(w=>w.id==='{wid}'); const g=s.spawnWay(d,{str(arriving).lower()}); return !!g; }})()")
G0=f"{Wd}.ways[0]"
async def opts(pg): return await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')")
async def talk(pg):
    await pg.evaluate(f"{Wd}.talkWay({G0}, {G0}.people[0])"); await pg.wait_for_timeout(200)
    return await pg.evaluate(f"{U}.talkPanel ? 'open' : 'closed'"), await opts(pg)
async def choose(pg, prefix):
    await pg.evaluate(f"(()=>{{const o={U}.talkOpts.find(o=>o.label.startsWith({prefix!r})); if(!o) throw new Error('no option '+{prefix!r}); o.fn();}})()"); await pg.wait_for_timeout(250)

async def main():
    which = sys.argv[1:] or ["cross","talk","herd","hunt","brigand","rate"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        if "cross" in which:
            pg, errs = await setup(b, 10, 3)
            ok = await pg.evaluate(f"(()=>{{ const s={Wd}; return [s.wayGates().length, s.wayGates().filter(g=>g.road).length]; }})()")
            print("gates", ok)
            for wid in ["traveler", "caravan", "procession"]:
                print(wid, "spawned", await spawn(pg, wid))
                p0 = await pg.evaluate(f"{G0} ? {G0}.people.map(w=>[Math.round(w.sprite.x),Math.round(w.sprite.y)]) : null")
                await pg.wait_for_timeout(2500)
                p1 = await pg.evaluate(f"{G0} ? {G0}.people.map(w=>[Math.round(w.sprite.x),Math.round(w.sprite.y), w.path.length]) : null")
                print("  moved", p0, "->", p1)
                await pg.evaluate(f"(()=>{{const s={Wd}, w={G0}.people[0]; s.player.setPosition(w.sprite.x-30, w.sprite.y); }})()"); await pg.wait_for_timeout(500)
                await pg.screenshot(path=SHOT+f"w_{wid}.png")
            # arrivals mid-stay
            await pg.evaluate(f"(()=>{{const s={Wd}; for(const g of [...s.ways]) s.dropWay(g); s.wayT=0; }})()"); await pg.wait_for_timeout(400)
            print("arrival:", await pg.evaluate(f"{Wd}.ways.map(g=>g.def.id).join(',')"), await log(pg,1))
            # fast forward a traveler to see it leave
            print(await spawn(pg, "runner"))
            for i in range(12):
                await pg.wait_for_timeout(1000)
                if not await pg.evaluate(f"{Wd}.ways.length"): break
            print("runner gone after ~", i+1, "s:", await pg.evaluate(f"{Wd}.ways.length===0"))
            print("ERRORS:", errs); await pg.close()

        if "talk" in which:
            for terr, ids in [(10, ["traveler","peddler","pilgrim","rhapsode","runner","pilgrims","couple","caravan","procession","soldiers","camp"]), (3, ["quarrel"]), (2, ["woodcutter","herbwoman","wounded"]), (7, ["fisher"]), (8, ["parched"])]:
                pg, errs = await setup(b, terr, 3)
                await pg.evaluate("G.data.silver=200; G.addItem('Millet',3); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Millet')")
                for wid in ids:
                    ok = await spawn(pg, wid)
                    if not ok: print(wid, "NOT SPAWNED"); continue
                    st, o = await talk(pg)
                    txt = await pg.evaluate(f"{U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ').slice(0,260)")
                    print(f"[{wid}] {o}\n     {txt}")
                    if wid in ("traveler","camp"): await pg.evaluate("G.data.askedRumor.road=0"); st, o = await talk(pg); await choose(pg, "Ask about the road"); print("   news:", (await pg.evaluate(f"{U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ')"))[0:200])
                    if wid == "camp": await choose(pg, "Sit by"); await choose(pg, "Share"); print("   camp:", await pg.evaluate("G.favor('Zeus')"))
                    if wid == "rhapsode": await choose(pg, "Give him"); print("   song:", await pg.evaluate("G.data.songs.join(',')"))
                    if wid == "quarrel": await pg.evaluate("G.data.aretai.Logos=12"); await choose(pg, "Hear them"); print("   judged:", await log(pg,2))
                    if wid == "wounded": await choose(pg, "Give h"); print("   helped:", await log(pg,2)); await pg.wait_for_timeout(3500); print("   standing & leaving:", await pg.evaluate(f"{G0} ? [{G0}.people[0].lying, !!{G0}.leaving] : 'gone'"))
                    if wid == "parched": await choose(pg, "Give h"); print("   water:", await log(pg,1), await pg.evaluate("G.data.jarWater"))
                    if wid == "pilgrim": print("   journal ok:", await pg.evaluate(f"(()=>{{ {U}.closeTalk(); {U}.openJournal(); return {U}.talkPanel ? 'yes':'no'; }})()"))
                    if wid in ("woodcutter","fisher","camp","quarrel","herbwoman","wounded"):
                        await pg.evaluate(f"{U}.closeTalk()"); await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}; if(!g) return; const w=g.people[0]; s.player.setPosition(w.sprite.x-36, w.sprite.y+10); }})()"); await pg.wait_for_timeout(900)
                        await pg.screenshot(path=SHOT+f"w_{wid}.png")
                    await pg.evaluate(f"{U}.closeTalk()")
                print("ERRORS:", errs); await pg.close()
            # camp at night: the fire keeps the dead off
            pg, errs = await setup(b, 10, 15)
            print("night camp", await spawn(pg, "camp"))
            print("lights:", await pg.evaluate(f"{Wd}.fireLights().length"))
            await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}; s.player.setPosition(g.anchor[0]-40, g.anchor[1]+20); }})()"); await pg.wait_for_timeout(900)
            await pg.screenshot(path=SHOT+"w_camp_night.png")
            print("ERRORS:", errs); await pg.close()

        if "herd" in which:
            pg, errs = await setup(b, 10, 3)
            for tries in range(8):
                await spawn(pg, "herder")
                if await pg.evaluate(f"!!{G0}.stray"): break
            print("goats", await pg.evaluate(f"{G0}.goats.length"), "stray", await pg.evaluate(f"!!{G0}.stray"))
            st, o = await talk(pg); print("herder:", o); print("  ", (await pg.evaluate(f"{U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ')"))[0:300])
            await pg.evaluate(f"{U}.closeTalk()")
            await pg.wait_for_timeout(3000)
            sp = await pg.evaluate(f"(()=>{{const g={G0}, w=g.people[0]; return g.goats.map(a=>Math.round(Math.hypot(a.sprite.x-w.sprite.x,a.sprite.y-w.sprite.y))); }})()")
            print("goat distances from herder", sp)
            await pg.evaluate(f"(()=>{{const s={Wd}, w={G0}.people[0]; s.player.setPosition(w.sprite.x-40, w.sprite.y+20); }})()"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=SHOT+"w_herd.png")
            # lead the stray home
            if await pg.evaluate(f"!!{G0}.stray"):
                await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}; s.player.setPosition(g.stray.sprite.x+10, g.stray.sprite.y); g.leading=true; }})()")
                await pg.wait_for_timeout(300)
                for i in range(80):
                    await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}, w=g.people[0]; if(!g.stray) return; if(Math.hypot(g.stray.sprite.x-s.player.x,g.stray.sprite.y-s.player.y)>30) return; const dx=w.sprite.x-s.player.x, dy=w.sprite.y-s.player.y, d=Math.hypot(dx,dy); if(d>20) s.player.setPosition(s.player.x+dx/d*6, s.player.y+dy/d*6); }})()")
                    await pg.wait_for_timeout(150)
                    if not await pg.evaluate(f"!!{G0}.stray"): break
                print("stray returned:", await log(pg,1), "| still stray:", await pg.evaluate(f"!!{G0}.stray"))
            # wolves
            await pg.evaluate(f"{G0}.raidT=0.05"); await pg.wait_for_timeout(500)
            print("raid:", await log(pg,2), "| wolves", await pg.evaluate(f"{Wd}.animals.filter(a=>a.kind==='wolf').length"))
            await pg.wait_for_timeout(3000)
            print("after 3s:", await log(pg,3), "| chasing", await pg.evaluate(f"{Wd}.chase.size"), "raiders", await pg.evaluate(f"{G0}.raiders.length"))
            await pg.screenshot(path=SHOT+"w_raid.png")
            # you kill the wolves
            await pg.evaluate(f"(()=>{{const s={Wd}; for(const a of s.animals.filter(a=>a.kind==='wolf'&&a.state!=='dead')) {{ s.kill(a); s.creatureEvent(a,'slain'); }} }})()")
            await pg.wait_for_timeout(1500)
            print("saved:", await log(pg,4), "| silver", await pg.evaluate("G.data.silver"))
            print("ERRORS:", errs); await pg.close()

        if "hunt" in which:
            pg, errs = await setup(b, 2, 3)
            await spawn(pg, "hunter")
            # a deer, then a boar, near him
            await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.filter(a=>a.kind!=='goat').forEach(a=>{{a.sprite.destroy();}}); s.animals=s.animals.filter(a=>a.sprite.active); }})()")
            await pg.evaluate(f"(()=>{{const s={Wd}, w={G0}.people[0]; s.player.setPosition(w.sprite.x-60, w.sprite.y+60); s.summon('deer',1); const a=s.animals[s.animals.length-1]; a.state='idle'; a.chaseT=0; a.rolled=true; a.sprite.setPosition(w.sprite.x+130, w.sprite.y); a.home.setTo(a.sprite.x-20,a.sprite.y-20,40,40); }})()")
            for i in range(20):
                await pg.wait_for_timeout(1000)
                ph = await pg.evaluate(f"{G0} ? {G0}.phase+':'+{G0}.kills : 'gone'")
                if i % 3 == 0: print("  t", i, ph, await log(pg,1))
                if ph.endswith(":1"): break
            await pg.screenshot(path=SHOT+"w_hunt.png")
            # the boar turns on him
            await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}, w=g.people[0]; s.summon('boar',1); const a=s.animals[s.animals.length-1]; a.state='idle'; a.chaseT=0; a.home.setTo(a.sprite.x-15,a.sprite.y-15,30,30); a.sprite.setPosition(w.sprite.x+60, w.sprite.y); a.rolled=true; a.hp=3; g.phase='seek'; g.t2=0; g.life=999; }})()")
            for i in range(20):
                await pg.wait_for_timeout(1000)
                ph = await pg.evaluate(f"{G0} ? {G0}.phase : 'gone'")
                if ph == "hurt": break
            print("boar:", ph, await log(pg,3))
            await pg.screenshot(path=SHOT+"w_gored.png")
            if ph == "hurt":
                await pg.evaluate("G.addItem('Meat',1); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Meat')")
                st, o = await talk(pg); print("hurt hunter:", o)
                await choose(pg, "Give him"); print("  ", await log(pg,3))
            print("ERRORS:", errs); await pg.close()

        if "brigand" in which:
            pg, errs = await setup(b, 10, 3, 4, 0)
            await pg.evaluate("G.data.silver=50")
            await spawn(pg, "brigands")
            print("foes", await pg.evaluate(f"{G0}.foes.map(a=>a.folk.name+':'+a.folk.extras.pole).join(',')"))
            await pg.evaluate(f"(()=>{{const s={Wd}, a={G0}.foes[0]; s.player.setPosition(a.sprite.x-100, a.sprite.y); }})()")
            for i in range(10):
                await pg.wait_for_timeout(500)
                if await pg.evaluate(f"{G0}.phase") == "parley": break
            print("phase", await pg.evaluate(f"{G0}.phase"), "|", await log(pg,1)); print("  opts:", await opts(pg))
            await pg.screenshot(path=SHOT+"w_brigands.png")
            await choose(pg, "Hand over"); print("paid:", await log(pg,1), "silver", await pg.evaluate("G.data.silver"))
            await pg.wait_for_timeout(5000); print("left:", await pg.evaluate(f"{Wd}.ways.length"), await pg.evaluate(f"{Wd}.animals.filter(a=>a.kind==='brigand' && a.sprite.active).length"))
            # fight
            await spawn(pg, "brigands")
            await pg.evaluate(f"(()=>{{const s={Wd}, a={G0}.foes[0]; s.player.setPosition(a.sprite.x-30, a.sprite.y); }})()")
            for i in range(10):
                await pg.wait_for_timeout(400)
                if await pg.evaluate(f"{G0}.phase") == "parley": break
            await pg.evaluate(f"{U}.closeTalk()"); await pg.wait_for_timeout(400)
            print("walked away:", await pg.evaluate(f"{G0}.phase"), await log(pg,1))
            await pg.evaluate("G.addItem('sword',1); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='sword'); G.data.aretai.Thymos=12; G.data.vitality=999")
            await pg.wait_for_timeout(1200)
            await pg.screenshot(path=SHOT+"w_brigand_fight.png")
            for i in range(14):
                r = await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}; if(!g) return 'done'; const a=g.foes.find(a=>a.sprite.active&&a.state!=='dead'&&!a.routed); if(!a) return 'none'; a.sprite.setPosition(s.player.x+14, s.player.y); s.facing=2; G.essence.Fire=99; G.data.fatigue=0; G.data.vitality=99; s.tryStrike('sword'); return a.hp+' '+a.state; }})()")
                await pg.wait_for_timeout(500)
                if r in ("done","none"): break
            await pg.wait_for_timeout(4000)
            print("fight:", await log(pg,6), "| silver", await pg.evaluate("G.data.silver"), "ways", await pg.evaluate(f"{Wd}.ways.length"))
            # struck down by them
            await spawn(pg, "brigands")
            await pg.evaluate(f"(()=>{{const s={Wd}, g={G0}; G.data.vitality=1; G.data.silver=40; s.brigandsAttack(g,'test'); const a=g.foes[0]; a.sprite.setPosition(s.player.x+8, s.player.y); }})()")
            await pg.wait_for_timeout(2500)
            print("robbed:", await log(pg,3), "| silver", await pg.evaluate("G.data.silver"))
            print("ERRORS:", errs); await pg.close()

        if "rate" in which:
            pg, errs = await setup(b, 10, 3)
            for road in ["true", "false"]:
                r = await pg.evaluate(f"(()=>{{const s={Wd}; const n={{}}; let k=0; for(let i=0;i<600;i++){{ for(const g of [...s.ways]) s.dropWay(g); s.monster=undefined; s.rec.roads={ '[\"N\"]' if road=='true' else '[]'}; s.setupWayfarers(); for(const g of s.ways){{n[g.def.id]=(n[g.def.id]||0)+1;k++;}} }} for(const g of [...s.ways]) s.dropWay(g); return k+' '+JSON.stringify(n); }})()")
                print("road" if road=="true" else "no road", "600 arrivals ->", r)
            for wx in [1, 2, 3, 4, 6]:
                for roads in ['["N"]', '["N","S"]', '[]']:
                    r = await pg.evaluate(f"(()=>{{const s={Wd}; G.data.wx={wx}; G.data.wy=0; let k=0, all=0; for(let i=0;i<600;i++){{ for(const g of [...s.ways]) s.dropWay(g); s.monster=undefined; s.rec.roads={roads}; s.setupWayfarers(); for(const g of s.ways){{all++; if(g.def.id==='brigands') k++;}} }} for(const g of [...s.ways]) s.dropWay(g); return (k/6).toFixed(1)+'% brigands, '+(all/6).toFixed(1)+'% anyone'; }})()")
                    print(f"  {wx} out, roads {roads}:", r)
            print("ERRORS:", errs); await pg.close()
        await b.close()

if __name__ == "__main__": asyncio.run(main())
