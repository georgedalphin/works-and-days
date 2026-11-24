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
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.month=3; G.data.clock=4; G.data.weather='clear'; G.data.aretai.Gnosis=12; G.data.aretai.Pneuma=12;")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        # --- a sign: cranes
        await pg.evaluate(f"{F}.showSign({{...{F}.constructor && window.__S || null}})") if False else None
        await pg.evaluate(f"(()=>{{ const s={F}; G.messages.length=0; s.maybeSign(999); }})()")
        print("sign:", await msg(pg))
        await pg.wait_for_timeout(2500); await pg.screenshot(path="/home/claude/test/o_cranes.png")
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(20*16+8, 20*16+8); s.facing=0;}})()")
        await pg.evaluate(f"{F}.investigate()"); await pg.wait_for_timeout(400)
        print("study:", await pg.evaluate("G.data.lore.tier.cranes"), "| sow active:", await pg.evaluate("G.signActive('sow')"))
        await pg.evaluate(f"{U}.closeLore && {U}.closeLore(); {U}.modal=false")
        # plant with the sow sign
        await pg.evaluate("G.data.ground['22,22']='wet'; G.addItem('seed_Mint',3); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='seed_Mint')")
        await pg.evaluate(f"{F}.plant(22,22,'seed_Mint')")
        print("planted:", await pg.evaluate("JSON.stringify(G.data.crops['22,22'])"), "|", await msg(pg,1))
        # --- omens: notice and read right, then misread
        await pg.evaluate("G.data.omen=undefined; G.messages.length=0")
        await pg.evaluate(f"(()=>{{const r=Math.random; Math.random=()=>0.01; {F}.fireOmen({{id:'eagle',god:'Zeus',when:'day',visual:'eagle',bird:'an eagle',plain:'An eagle sweeps across the sky.',good:'An eagle sweeps across the sky on your right.',bad:'An eagle sweeps across the sky on your left.'}}); Math.random=r;}})()")
        await pg.wait_for_timeout(900); await pg.screenshot(path="/home/claude/test/o_eagle.png")
        print("omen (read right):", await msg(pg), "| omen:", await pg.evaluate("JSON.stringify(G.data.omen)"))
        fav = await pg.evaluate("G.favor('Zeus')"); print("Zeus favor", fav, "boon today", await pg.evaluate("G.boon('Zeus')"))
        await pg.evaluate("G.data.omen=undefined; G.data.aretai.Gnosis=-20; G.messages.length=0")
        await pg.evaluate(f"(()=>{{const r=Math.random; let n=0; Math.random=()=> (n++===0 ? 0.01 : 0.01); {F}.fireOmen({{id:'raven',god:'Apollo',when:'day',visual:'raven',bird:'a raven',plain:'A raven croaks.',good:'A raven croaks and flies off to your right.',bad:'A raven croaks and flies off to your left.'}}); Math.random=r;}})()")
        print("omen (misread):", await msg(pg), "| omen:", await pg.evaluate("JSON.stringify(G.data.omen)"))
        # Pneuma too low: not noticed
        await pg.evaluate("G.data.omen=undefined; G.data.aretai.Pneuma=-20; G.messages.length=0")
        await pg.evaluate(f"{F}.fireOmen({{id:'hawk',god:'Apollo',when:'day',visual:'hawk',bird:'a hawk',plain:'A hawk stoops on something in the grass.',good:'g',bad:'b'}})")
        print("omen (unnoticed):", await msg(pg), "| omen:", await pg.evaluate("JSON.stringify(G.data.omen)"))
        await pg.evaluate("G.data.aretai.Gnosis=12; G.data.aretai.Pneuma=12")
        # --- finds
        for t in ["hoe","stone","tree","shore"]:
            await pg.evaluate(f"(()=>{{ const r=Math.random; let n=0; Math.random=()=> n++===0?0:r(); }})()")
        res = await pg.evaluate("(()=>{ const out=[]; const r=Math.random; for(const t of ['hoe','stone','tree','shore','glint']){ G.messages.length=0; Math.random=()=>0.0001; } Math.random=r; return out; })()")
        # call rollFind via a crafted path: break a stone with chance forced
        await pg.evaluate(f"(()=>{{const s={F}; s.objects.putTileAt(6,21,20); s.player.setPosition(20*16+8,20*16+3); s.facing=2; G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='mattock'); G.essence.Earth=99; G.essence.Fire=99; const r=Math.random; Math.random=()=>0.001; s.useItem(); Math.random=r; }})()")
        print("stone find:", await msg(pg,1))
        print("finds in lore:", await pg.evaluate("Object.keys(G.data.lore.tier).filter(k=>['fibula','figurine','arrowhead','oldcoin','nest','fossil','obsidian','amber','owlfeather','thunderstone','heliadtear'].includes(k))"))
        # magic find
        await pg.evaluate("G.addItem('Thunderstone',1,3)"); print("Zeus boon with a thunderstone:", await pg.evaluate("G.boon('Zeus')"))
        # sneeze
        sneezed = await pg.evaluate(f"(()=>{{ for(let i=0;i<80;i++){{ {U}.chooseGod(); {U}.talkOpts[0].fn(); const t={U}.talkPanel ? {U}.talkPanel.list.map(o=>o.text||'').join(' ') : ''; if(t.includes('sneeze')) return i; }} return -1; }})()")
        print("prayers until a sneeze:", sneezed, "| Zeus devotion:", await pg.evaluate("G.data.devotion.Zeus"))
        await pg.evaluate(f"{U}.closeTalk()")
        # --- glint in the wild (shore)
        await pg.evaluate(f"G.data.screens['7,0']={{terrain:7,special:false,feature:'Tide pools',cleared:[]}}; G.data.wx=7;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; {F}.goTo('Wild')"); await pg.wait_for_timeout(2600)
        g = await pg.evaluate(f"{Wd}.targets.filter(t=>t.label==='Something glints here').length")
        if not g:
            await pg.evaluate(f"(()=>{{ const s={Wd}; s.rec.glint=undefined; const r=Math.random; for(let d=0; d<40 && !s.targets.some(t=>t.label==='Something glints here'); d++){{ const dn=G.data.day; G.data.day = (dn % 28)+1; s.setupGlint(); }} }})()")
        t = await pg.evaluate(f"(()=>{{ const s={Wd}; const t=s.targets.find(t=>t.label==='Something glints here'); if(!t) return null; s.player.setPosition(t.x-12,t.y-4); s.facing=2; return [t.x,t.y]; }})()")
        print("glint at", t)
        if t:
            await pg.wait_for_timeout(400); await pg.screenshot(path="/home/claude/test/o_glint.png")
            await pg.evaluate(f"{Wd}.targets.find(t=>t.label==='Something glints here').act()"); print("glint:", await msg(pg,1))
        # --- dreams and kledon over several nights
        dreams=set()
        for i in range(25):
            notes = await pg.evaluate("(()=>{ const n=G.sleep(); return n.notes.join(' | '); })()")
            for k in ["dream","Dream"]:
                if k in notes: dreams.add(notes[notes.find('You dream'):][:90])
        print("dreams:", list(dreams)[:4])
        print("weather next:", await pg.evaluate("[G.data.weather, G.data.nextWeather]"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
