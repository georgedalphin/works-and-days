"""Weapons and tools from the Core Rules: new blades, cestus, sling, javelins, fire arrows vs the dead, silver dagger,
healer's kit, waterskin, mirror vs empousa, map, pack, tent, scale, knife, tackle, loadstone, icons."""
import asyncio, base64
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
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
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'")
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("(()=>{ for (const [k,n] of [['Kopis',1],['Club',1],['SilverDagger',1],['Cestus',1],['Sling',1],['Javelin',3],['FireArrow',3],['Stone',6],['HealerKit',1],['Waterskin',1],['Mirror',1],['Map',1],['Pack',1],['Tent',1],['Scale',1],['Knife',1],['Labrys',1]]) G.addItem(k,n); })()")
        await pg.evaluate(f"""(()=>{{const s={F}; for(let y=16;y<28;y++) for(let x=26;x<42;x++){{ s.objects.putTileAt(-1,x,y); s.removeTrunk(x,y); }}
          s.player.setPosition(30*16+8, 21*16+8); s.player.setVelocity(0,0); s.mouseIn=false; s.cursorMode=false; s.facing=2;
          G.data.aretai.Thymos=12; G.essence.Fire=99; G.essence.Water=99; G.essence.Earth=99; G.data.fatigue=0; }})()""")
        print("pack used:", await pg.evaluate(f"(()=>{{G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Pack'); {F}.useNow(); return G.data.slots.length; }})()"), await msg(pg))
        # A creature to hit: a hare placed just in front.
        hare = f"(()=>{{const s={F}; let a=s.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); if(!a) return false; a.sprite.setPosition(s.player.x+18, s.player.y); a.sprite.setVelocity(0,0); a.state='idle'; a.timer=99; a.hp=9; return true;}})()"
        for w in ["Kopis","Club","Labrys","SilverDagger","Cestus"]:
            ok = await pg.evaluate(hare)
            hp = await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='{w}'); s.useNow(); const a=s.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); return a? a.hp : 'dead'; }})()")
            print(f"{w}: hare there {ok}, hp 9 ->", hp, "|", await msg(pg))
        # Fire arrow vs a shade, plain arrow vs a shade, silver dagger vs a shade.
        await pg.evaluate(f"{F}.summon('eidolon')"); await pg.wait_for_timeout(300)
        shade = f"(()=>{{const s={F}; const a=s.animals.find(a=>a.kind==='eidolon'&&a.state!=='dead'); if(!a) return null; a.sprite.setPosition(s.player.x+18, s.player.y); a.sprite.setVelocity(0,0); a.hp=6; a.state='idle'; a.timer=99; return [a.sprite.x, a.sprite.y]; }})()"
        xy = await pg.evaluate(shade); print("shade:", xy)
        if xy:
            await pg.evaluate(f"{F}.land({xy[0]},{xy[1]-3},'Arrow')"); print("arrow vs shade:", await msg(pg), await pg.evaluate(f"{F}.animals.find(a=>a.kind==='eidolon').hp"))
            await pg.evaluate(shade); await pg.evaluate(f"{F}.land({xy[0]},{xy[1]-3},'FireArrow')"); print("fire arrow vs shade:", await msg(pg), await pg.evaluate(f"{F}.animals.find(a=>a.kind==='eidolon').hp"))
            await pg.evaluate(shade); await pg.evaluate(f"(()=>{{const s={F}; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='SilverDagger'); s.useNow(); }})()")
            print("silver vs shade:", await msg(pg), await pg.evaluate(f"(()=>{{const a={F}.animals.find(a=>a.kind==='eidolon'); return a ? a.hp : 'gone'}})()"))
        # Sling: hold, aim at a spot, loose; a stone leaves the pack.
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(30*16+8, 21*16+8); G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Sling'); s.mouseUsed=true; s.mouseIn=true; }})()")
        st0 = await pg.evaluate("G.count('Stone')")
        x,y = await pg.evaluate(f"(()=>{{const s={F},c=s.cameras.main; return [(s.player.x+80-c.worldView.x)*c.zoom, (s.player.y-c.worldView.y)*c.zoom];}})()")
        await pg.mouse.move(x,y); await pg.keyboard.down("Space"); await pg.wait_for_timeout(300)
        print("sling aiming:", await pg.evaluate(f"{F}.aiming"))
        await pg.mouse.down(); await pg.wait_for_timeout(60); await pg.mouse.up(); await pg.keyboard.up("Space"); await pg.wait_for_timeout(1200)
        print("stones", st0, "->", await pg.evaluate("G.count('Stone')"), "| stone pickups:", await pg.evaluate(f"{F}.pickups.filter(p=>p.id==='Stone').length"))
        # Javelin: hold Space to aim and throw.
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(30*16+8, 21*16+8); G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Javelin'); }})()")
        await pg.keyboard.down("Space"); await pg.wait_for_timeout(400); await pg.keyboard.up("Space"); await pg.wait_for_timeout(1400)
        print("javelin thrown:", await pg.evaluate("G.count('Javelin')"), "| on ground:", await pg.evaluate(f"{F}.pickups.filter(p=>p.id==='Javelin').length"), "|", await msg(pg))
        # Tools.
        await pg.evaluate(f"{F}.mouseIn=false; {F}.cursorMode=false; G.data.vitality = 3")
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='HealerKit'); {F}.useNow()"); print("kit:", await msg(pg), "| vitality", await pg.evaluate("G.data.vitality"))
        await pg.evaluate(f"{F}.useNow()"); print("kit again:", await msg(pg))
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(30*16+8, 9*16+16+14); s.facing=3; s.mouseIn=false; s.cursorMode=false; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Waterskin'); s.useNow(); }})()")
        print("skin at well:", await msg(pg), await pg.evaluate("G.data.skin"))
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(36*16+8, 22*16+8); G.data.fatigue=20; s.useNow(); }})()")
        print("drink:", await msg(pg), "| fatigue", await pg.evaluate("G.data.fatigue.toFixed(1)"))
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Mirror'); {F}.useNow()"); print("mirror:", await msg(pg))
        # Tent: pitch it on the farm, check the sleep target.
        await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(33*16+8, 24*16+8); s.facing=2; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Tent'); s.useNow(); }})()")
        print("tent:", await msg(pg), "| target:", await pg.evaluate(f"{F}.targets.some(t=>t.label==='Sleep in the tent')"))
        print("tent sleep credit:", await pg.evaluate("(()=>{ const f0=G.data.fatigue=60; const before=JSON.stringify(G.data.worn); const r=G.sleep(false,'tent'); return [r.recovered.toFixed(1), r.hoursSlept.toFixed(1)]; })()"))
        # Market with the scale.
        await pg.evaluate("G.addItem('Honey',1)")
        await pg.evaluate(f"{U}.openMarket('mill')"); await pg.wait_for_timeout(300)
        print("mill honey line:", await pg.evaluate(f"{U}.market.list.filter(o=>o.type==='Text'&&o.text.startsWith('Honey')).map(o=>o.text).join('')"))
        await pg.evaluate(f"{U}.closeMarket()")
        # Map.
        await pg.evaluate("for (let i=1;i<5;i++) G.data.screens[i+',0']={terrain:[2,1,4,7][i-1],special:false,feature:'x',cleared:[]}; G.data.screens['2,1']={terrain:5,special:false,feature:'x',cleared:[]}")
        await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Map'); {F}.useNow()"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/equip_map.png")
        await pg.keyboard.press("x"); await pg.wait_for_timeout(300)
        print("map closed:", await pg.evaluate(f"!{U}.mapPanel && !{U}.modal"))
        # Inventory with the pack.
        await pg.evaluate(f"{U}.toggleInventory()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/equip_inv.png")
        await pg.evaluate(f"{U}.toggleInventory()")
        # Knife: extra hide from a boar.
        print("errors:", errs)
        await b.close()
asyncio.run(main())
