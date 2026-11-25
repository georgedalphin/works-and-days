import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; Wd="game.scene.getScene('Wild')"
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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=3; G.data.favor={{}}; G.data.divine.chosen={{}}")
        # Tiers and boons
        print("boons:", await pg.evaluate("[0,1,3,4,7,8,9,10,12,-1,-4,-8,-10,-12].map(f=>{G.data.favor.Ares=f; return f+':'+G.boon('Ares')}).join(' ')"))
        # Chosen: +10 raises Thymos, falling back restores it
        await pg.evaluate("G.data.favor.Ares=0; G.data.aretai.Thymos=3")
        await pg.evaluate("G.addFavor('Ares', 10)"); t1 = await pg.evaluate("G.data.aretai.Thymos")
        await pg.evaluate("G.addFavor('Ares', -1)"); t2 = await pg.evaluate("G.data.aretai.Thymos")
        await pg.evaluate("G.data.favor.Ares=-9; G.addFavor('Ares', -1)"); t3 = await pg.evaluate("G.data.aretai.Thymos")
        await pg.evaluate("G.addFavor('Ares', 5)"); t4 = await pg.evaluate("G.data.aretai.Thymos")
        print("Thymos chosen/after/accursed/after:", t1, t2, t3, t4)
        # Drift toward zero
        await pg.evaluate("G.data.favor={Zeus:6,Hera:-6}")
        await pg.evaluate("for(let i=0;i<40;i++) G.divineDawn()")
        print("after 40 dawns of drift:", await pg.evaluate("JSON.stringify(G.data.favor)"))
        # Gifts: Demeter +8 -> gift laid on the farm
        await pg.evaluate("G.data.favor={Demeter:8}; G.data.divine.gifts=[{god:'Demeter',item:'Honey',qty:2,q:2}]")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(3500)
        print("gift:", await msg(pg), "| pickups:", await pg.evaluate(f"{F}.pickups.filter(p=>p.from).map(p=>p.id+'x'+p.qty).join(',')"))
        await pg.evaluate(f"(()=>{{const s={F}; const p=s.pickups.find(p=>p.from); s.player.setPosition(p.img.x, p.img.y-4);}})()"); await pg.wait_for_timeout(400)
        print("picked:", await msg(pg))
        # Power: Demeter ripening on the farm
        await pg.evaluate("G.data.crops['30,20']={id:'Millet',growth:0,dryNights:0,dryStreak:0,hourBonus:false,withered:false,picks:0}")
        await pg.evaluate(f"{F}.invokePower('Demeter')"); print("power:", await msg(pg), "| growth:", await pg.evaluate("G.data.crops['30,20'].growth"))
        await pg.evaluate(f"{F}.invokePower('Demeter')"); print("again:", await msg(pg))
        # Gods sheet
        await pg.evaluate("G.data.favor.Zeus=12; G.data.favor.Hades=-5; G.data.favor.Ares=-12; G.data.favor.Hermes=9")
        await pg.keyboard.press("f"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/home/claude/test/d_gods.png")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
        # Wrath: Demeter -8 blight
        await pg.evaluate("G.data.favor={Demeter:-8}; for(let i=0;i<6;i++) G.data.crops['3'+i+',22']={id:'Millet',growth:1,dryNights:0,dryStreak:0,hourBonus:false,withered:false,picks:0}")
        await pg.evaluate(f"{F}.wrath('Demeter')"); print("wrath:", await msg(pg))
        # Trouble: Hephaestus -4 spoils next craft
        await pg.evaluate(f"{F}.trouble('Hephaestus')"); print("trouble:", await msg(pg), "| botch:", await pg.evaluate("G.data.divine.charges.botch"))
        # Wards: Artemis +12 no aggression; Ares +12 halves blows
        await pg.evaluate("G.data.favor={Artemis:12,Hades:12}")
        print("Artemis ward, wolf aggression:", await pg.evaluate(f"(()=>{{const s={F}; s.summon('wolf'); const w=s.animals[s.animals.length-1]; w.state='idle'; return s.aggressionRoll(w, 12);}})()"))
        await pg.evaluate("G.data.fatigue=99"); 
        await pg.evaluate(f"{F}.harm(10,'test','test')"); print("Hades ward:", await msg(pg), "| thread:", await pg.evaluate("G.data.lifeThread"), "| fatigue:", await pg.evaluate("G.data.fatigue"))
        # Danger: Zeus -12 lightning in the storm
        await pg.evaluate("G.data.favor={Zeus:-12}; G.data.weather='rain'; G.data.fatigue=0")
        await pg.evaluate(f"{F}.danger('Zeus')"); print("danger:", await msg(pg))
        # Wild: crossroads, herm, shrine and graveyard
        await pg.evaluate("G.data.favor={}")
        found = await pg.evaluate("""(()=>{ const out=[]; const gate=(k,x,y)=>0; return out; })()""")
        # search screens for a crossroads by generating records
        for (x,y) in [(3,0),(3,1),(4,0),(4,1),(4,2),(5,0),(5,1),(5,2),(2,3),(3,3),(4,3),(5,3),(6,1),(6,2),(6,0)]:
            await pg.evaluate(f"(()=>{{const s=game.scene.getScenes(true).find(s=>s.scene.key!=='UI'); G.data.wx={x}; G.data.wy={y}; G.data.entry='W'; G.data.scene='Wild'; s.goTo('Wild');}})()")
            await pg.wait_for_timeout(1400)
            rec = await pg.evaluate(f"(()=>{{const r={Wd}.rec; return {{roads:r.roads, cross:r.crossroads, shrine:!!r.shrine, graves:!!r.graveyard}};}})()")
            if rec['cross']:
                print("crossroads at", x, y, rec); await pg.screenshot(path="/home/claude/test/d_cross.png")
                await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label&&t.label.includes('herm')); t.act();}})()"); print("herm:", await msg(pg))
                break
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
