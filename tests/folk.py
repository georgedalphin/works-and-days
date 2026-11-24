import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; V="game.scene.getScene('Village')"; Wd="game.scene.getScene('Wild')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'; G.data.entry='N'; G.data.scene='Village'; game.scene.getScene('House').goTo('Village')")
        await pg.wait_for_timeout(3000)
        info = await pg.evaluate(f"JSON.stringify({V}.households.map(h=>[h.trade.id, h.members.map(m=>m.name+'('+m.age+')').join(',')]))")
        print("households:", info)
        # let the day run so people move and talk
        await pg.evaluate(f"{V}.player.setPosition(20*16+8, 15*16)")
        await pg.wait_for_timeout(9000)
        st = await pg.evaluate(f"JSON.stringify({V}.walkers.map(({{w}})=>w.doing))")
        print("doing after 9s:", st)
        await pg.screenshot(path="/home/claude/test/v_day.png")
        await pg.wait_for_timeout(6000); await pg.screenshot(path="/home/claude/test/v_day2.png")
        # talk to an adult
        await pg.evaluate(f"(()=>{{const s={V}; const t=s.walkers.find(x=>x.w.folk.age!=='child'); s.talkToFolk(t.w,t.h);}})()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/v_talk.png")
        print("talk opts:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
        await pg.evaluate(f"{U}.talkOpts[0].fn()"); await pg.wait_for_timeout(200); await pg.evaluate(f"{U}.closeTalk()")
        # dusk: everyone goes home
        await pg.evaluate("G.data.clock=G.daylight-0.2"); await pg.wait_for_timeout(12000)
        print("visible at dusk+12s:", await pg.evaluate(f"{V}.walkers.filter(x=>x.w.sprite.visible).length"), "of", await pg.evaluate(f"{V}.walkers.length"))
        # --- a wilderness hut
        await pg.evaluate("G.data.clock=4")
        await pg.evaluate(f"G.data.screens['0,3']={{terrain:10,special:false,feature:'Lone oak',cleared:[], hut:{{tx:18,ty:8,kind:'shepherd',seed:12345,god:'Hermes'}}}}; G.data.wx=0;G.data.wy=3;G.data.entry='W';G.data.scene='Wild'; {V}.goTo('Wild')")
        await pg.wait_for_timeout(3000)
        print("hut message:", await msg(pg,2))
        print("hut folk:", await pg.evaluate(f"{Wd}.hutFolk.map(w=>w.folk.name+'('+w.folk.age+')').join(', ')"))
        await pg.evaluate(f"{Wd}.player.setPosition(19*16+8, 12*16+6)"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path="/home/claude/test/h_hut.png")
        await pg.evaluate("G.data.fatigue=50; G.addItem('Milk',2); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Milk'); G.data.aretai.Pneuma=12")
        await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label==='Call at the hut'); t.act();}})()"); await pg.wait_for_timeout(300)
        print("hut opts:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
        await pg.screenshot(path="/home/claude/test/h_talk.png")
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Look closely')).fn()"); print("look:", (await pg.evaluate(f"{U}.talkPanel.list.map(o=>o.text||'').join(' ')"))[:200])
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label==='Back').fn()")
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Accept')).fn()"); print("fatigue after hosting:", await pg.evaluate("Math.round(G.data.fatigue)"))
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label==='Back').fn()")
        hf0 = await pg.evaluate("G.favor('Hermes')")
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Leave them')).fn()"); await pg.wait_for_timeout(200)
        print("gift:", (await pg.evaluate(f"{U}.talkPanel.list.map(o=>o.text||'').join(' ')"))[:220], "| Hermes", hf0, "->", await pg.evaluate("G.favor('Hermes')"))
        await pg.evaluate(f"{U}.closeTalk()")
        # hermit reading
        await pg.evaluate(f"G.data.screens['0,4']={{terrain:11,special:false,feature:'Gully',cleared:[], hut:{{tx:18,ty:8,kind:'hermit',seed:999,god:''}}}}; G.data.wx=0;G.data.wy=4;G.data.entry='N';G.data.scene='Wild'; {Wd}.goTo('Wild')"); await pg.wait_for_timeout(3000)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.targets.find(t=>t.label==='Call at the hut').act();}})()"); await pg.wait_for_timeout(200)
        await pg.evaluate(f"{U}.talkOpts.find(o=>o.label.startsWith('Ask what')).fn()"); await pg.wait_for_timeout(200)
        print("hermit:", (await pg.evaluate(f"{U}.talkPanel.list.map(o=>o.text||'').join(' ')"))[:300])
        await pg.evaluate(f"{U}.closeTalk()")
        # rate of huts on fresh deep screens
        n = await pg.evaluate(f"(()=>{{ let n=0; const s={Wd}; for(let i=0;i<600;i++){{ s.rec = {{terrain:10,special:false,feature:'',cleared:[]}}; s.setupHutRollOnly ? 0 : 0; const k = HUT_KINDS_TEST = null; }} return n; }})()") if False else None
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
