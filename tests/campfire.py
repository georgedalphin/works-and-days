import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"
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
        await pg.evaluate("""window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{ window._log.push(t); s0(t); }; 0""")
        await pg.evaluate("G.data.screens['1,0']={terrain:3,special:false,feature:'Stone outcrop',cleared:[]}; G.data.wx=1; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScene('House').goTo('Wild')"); await pg.wait_for_timeout(3000)
        # Set down a campfire: lit with two hours of fuel.
        await pg.evaluate(f"""(()=>{{const s={Wd}; G.addItem('Campfire',1); G.addItem('Fiber',8); G.data.selected=G.data.slots.findIndex(x=>x&&x.id==='Campfire');
          s.player.setPosition(20*16+8, 15*16+8); s.facingTile=()=>[21,15]; for (let y=14;y<=16;y++) for (let x=20;x<=22;x++) s.objects.putTileAt(-1,x,y); s.useNow(); delete s.facingTile; }})()""")
        fire = "G.data.placed.find(p=>p.id==='Campfire')"
        print("placed:", await pg.evaluate(f"Math.round(({fire}.fuel - G.absHour)*10)/10"), "hours of fuel | light:", await pg.evaluate(f"{Wd}.fireLights().length"))
        print("label:", await pg.evaluate(f"{Wd}.targets.find(t=>t.label&&t.label.startsWith('The campfire')).label"))
        await pg.evaluate(f"{Wd}.targets.find(t=>t.label&&t.label.startsWith('The campfire')).act()")
        print("menu lit:", await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).slice(3).join(' / ')"))
        await pg.evaluate(f"{U}.closeTalk()")
        # Two and a half hours pass: it goes out.
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(21*16, 17*16); G.data.clock += 2.5; }})()"); await pg.wait_for_timeout(1500)
        print("later:", [m for m in await pg.evaluate("window._log") if "goes out" in m], "| light:", await pg.evaluate(f"{Wd}.fireLights().length"), "| label:", await pg.evaluate(f"{Wd}.targets.find(t=>t.label&&t.label.startsWith('The campfire')).label"))
        await pg.screenshot(path="/home/claude/test/camp_cold.png")
        await pg.evaluate(f"{Wd}.targets.find(t=>t.label&&t.label.startsWith('The campfire')).act()")
        print("menu cold:", await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).slice(2).join(' / ')"))
        # Relight with 5 fiber: ten hours.
        await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.find(o=>o.type==='Text'&&o.text.includes('5 fiber')); o.emit('pointerdown'); }})()"); await pg.wait_for_timeout(1300)
        print("relit:", await pg.evaluate("window._log.slice(-1)"), "| fuel", await pg.evaluate(f"Math.round(({fire}.fuel - G.absHour)*10)/10"), "| light:", await pg.evaluate(f"{Wd}.fireLights().length"), "| fiber left", await pg.evaluate("G.count('Fiber')"))
        await pg.screenshot(path="/home/claude/test/camp_lit.png")
        # Feed one more: +2.
        await pg.evaluate(f"{Wd}.targets.find(t=>t.label&&t.label.startsWith('The campfire')).act()")
        await pg.evaluate(f"(()=>{{const o={U}.talkPanel.list.find(o=>o.type==='Text'&&/^1\\./.test(o.text)&&o.text.includes('handful')); o.emit('pointerdown'); }})()")
        print("fed:", await pg.evaluate(f"Math.round(({fire}.fuel - G.absHour)*10)/10"), "hours")
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
