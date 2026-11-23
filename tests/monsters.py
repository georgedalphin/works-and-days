import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
async def setup(b, terrain, clock, wx=4, wy=0):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
    if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
    k=f"{wx},{wy}"
    await pg.evaluate(f"G.data.screens['{k}']={{terrain:{terrain},special:false,feature:'Stone outcrop',cleared:[]}}; G.data.wx={wx};G.data.wy={wy};G.data.entry='W';G.data.scene='Wild'; G.data.clock={clock}; {U}.help.setVisible(false); {U}.modal=false; game.scene.getScene('House').goTo('Wild')")
    await pg.wait_for_timeout(2500)
    return pg, errs
msg = lambda pg, n=2: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        # ---- centaur: talk, then a fight with arrows
        pg, errs = await setup(b, 2, 3)
        print("depth", await pg.evaluate(f"{Wd}.depth"), "target", await pg.evaluate(f"{Wd}.monster ? {Wd}.monster.kind : 'none'"))
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.filter(a=>a!==s.monster).forEach(a=>{{a.sprite.destroy();}}); s.animals=s.animals.filter(a=>a.sprite.active); s.spawnMonster('centaur'); }})()")
        print("centaur:", await msg(pg,1))
        await pg.evaluate("G.addItem('Wine',2); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Wine')")
        await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; a.sprite.setPosition(s.player.x+30, s.player.y);}})()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/home/claude/test/m0_centaur.png")
        await pg.evaluate(f"{Wd}.talkCentaur({Wd}.monster)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/m1_centaur_talk.png")
        print("opts:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
        await pg.evaluate(f"{U}.talkOpts[0].fn()"); print("wine:", await msg(pg,1), "| xp", await pg.evaluate("G.data.archeryXp"), "Poseidon", await pg.evaluate("G.favor('Poseidon')"))
        # a hostile one, shooting
        await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.monster; a.appeased=false; a.sprite.setPosition(s.player.x+150, s.player.y); a.charge(12); s.shootT=0.2; G.data.fatigue=0; }})()")
        await pg.wait_for_timeout(4000)
        print("fight:", await msg(pg,4), "| fatigue", await pg.evaluate("Math.round(G.data.fatigue)"))
        await pg.screenshot(path="/home/claude/test/m2_centaur_fight.png")
        print("ERRORS:", errs); await pg.close()

        # ---- skeleton at night in the hills
        pg, errs = await setup(b, 4, 15)
        await pg.evaluate(f"{Wd}.spawnMonster('skeleton')"); await pg.wait_for_timeout(500)
        print("skeleton:", await msg(pg,1), "| barrow", await pg.evaluate(f"JSON.stringify(G.data.screens['4,0'].barrow)"))
        await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; s.player.setPosition(a.sprite.x-16, a.sprite.y); s.facing=2; a.state='idle'; a.rolled=true; a.timer=99; G.data.aretai.Thymos=12; G.data.fatigue=0;}})()")
        await pg.wait_for_timeout(300); await pg.screenshot(path="/home/claude/test/m3_skeleton.png")
        await pg.evaluate("G.addItem('mattock'===null?'':'Wine',1)")
        tools = await pg.evaluate("G.data.slots.map((s,i)=>s?i+':'+s.id:'').filter(Boolean).join(',')"); print("slots", tools)
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='arrow'||s&&s.id==='Arrow')")
        # arrow test: land directly on it
        await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; s.land(a.sprite.x, a.sprite.y+3);}})()"); print("arrow:", await msg(pg,1))
        await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; a.state='idle'; a.sprite.setVelocity(0,0); a.sprite.setPosition(s.player.x+16, s.player.y); a.timer=99;}})()")
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='sickle')"); await pg.evaluate(f"{Wd}.tryStrike('sickle')"); print("sickle:", await msg(pg,1))
        for i in range(3):
            await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; if(a.state==='dead')return; a.state='idle'; a.sprite.setVelocity(0,0); a.sprite.setPosition(s.player.x+16, s.player.y); s.facing=2; G.data.fatigue=0; G.essence.Fire=99;}})()")
            await pg.evaluate(f"{Wd}.tryStrike('mattock')"); await pg.wait_for_timeout(300)
        print("mattock:", await msg(pg,2), "| state", await pg.evaluate(f"{Wd}.monster.state"))
        await pg.screenshot(path="/home/claude/test/m4_bones.png")
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(s.bones.x-14, s.bones.y-4); s.facing=2; G.data.aretai.Pneuma=12; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Wine'); G.essence.Water=99; }})()")
        await pg.wait_for_timeout(200)
        print("prompt target:", await pg.evaluate(f"{Wd}.current && {Wd}.current.label"))
        await pg.evaluate(f"{Wd}.rite()"); print("rite:", await msg(pg,1), "| laid", await pg.evaluate("G.data.screens['4,0'].laid"), "Hades", await pg.evaluate("G.favor('Hades')"))
        print("ERRORS:", errs); await pg.close()

        # ---- empousa at dusk in the valleys
        pg, errs = await setup(b, 1, 10.5, 0, 5)
        await pg.evaluate("G.data.clock=G.daylight-0.5")
        await pg.evaluate(f"{Wd}.spawnMonster('empousa')"); print("empousa:", await msg(pg,1))
        await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; a.sprite.setPosition(s.player.x+22, s.player.y); G.data.aretai.Gnosis=12; G.data.aretai.Logos=12;}})()")
        await pg.evaluate(f"{Wd}.meetEmpousa({Wd}.monster)"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/m5_empousa.png")
        print("opts:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Laugh')).fn()"); print("mock:", await msg(pg,2))
        # decline path with Goodbye (aggressive)
        await pg.evaluate(f"{Wd}.spawnMonster('empousa')"); await pg.evaluate(f"(()=>{{const s={Wd}, a=s.monster; a.sprite.setPosition(s.player.x+22, s.player.y); G.data.aretai.Gnosis=1; G.data.favor.Hecate=-12;}})()")
        await pg.evaluate(f"{Wd}.meetEmpousa({Wd}.monster)"); await pg.evaluate(f"{U}.closeTalk()"); await pg.wait_for_timeout(600)
        print("decline:", await msg(pg,1), "| state", await pg.evaluate(f"{Wd}.monster.state"))
        await pg.wait_for_timeout(600); await pg.screenshot(path="/home/claude/test/m6_empousa_true.png")
        print("ERRORS:", errs); await pg.close()

        # ---- rarity: how often does maybeMonster fire at depth 4?
        pg, errs = await setup(b, 2, 3)
        n = await pg.evaluate(f"(()=>{{const s={Wd}; let n=0; for(let i=0;i<1200;i++){{ s.monster=undefined; const before=s.animals.length; s.maybeMonster(); if(s.monster){{n++; s.monster.sprite.destroy(); s.animals.pop();}} }} return n; }})()")
        print("centaurs in 1200 deep arrivals:", n)
        await pg.evaluate("G.data.wx=1"); n2 = await pg.evaluate(f"(()=>{{const s={Wd}; let n=0; for(let i=0;i<300;i++){{ s.monster=undefined; s.maybeMonster(); if(s.monster){{n++;}} }} return n; }})()")
        print("near home:", n2)
        print("ERRORS:", errs); await pg.close()
        await b.close()
asyncio.run(main())
