"""Divine graces: taming (deer over three days; a wolf that fights; a horse to ride), warnings, and a sample of the rest."""
import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"; Ho="game.scene.getScene('House')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def go(pg, src, wx, wy, terr):
    await pg.evaluate(f"G.data.screens['{wx},{wy}']={{terrain:{terr},special:false,feature:'Old oak',cleared:[]}}; G.data.wx={wx}; G.data.wy={wy}; G.data.entry='W'; G.data.scene='Wild'; {src}.goTo('Wild')")
    await pg.wait_for_timeout(4500)
async def creature(pg, kind):
    return await pg.evaluate(f"""(()=>{{const s={Wd}; s.summon('{kind}'); const a=s.animals[s.animals.length-1]; a.state='idle'; a.chaseT=0; a.rolled=true; a.timer=99;
      a.sprite.setPosition(s.player.x+60, s.player.y); a.sprite.setVelocity(0,0); return s.animals.length-1; }})()""")
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
        await pg.evaluate("G.addFavor('Artemis', 4); G.addFavor('Athena', 4)")
        print("grace msgs:", await msg(pg, 3))
        await pg.evaluate("(()=>{ for (const [k,n] of [['Millet',10],['Meat',6],['Oats',4]]) G.addItem(k,n); })()")
        await go(pg, Ho, 1, 0, 2)
        await pg.evaluate(f"(()=>{{const s={Wd}; for(let y=10;y<20;y++) for(let x=14;x<28;x++){{ s.objects.putTileAt(-1,x,y); }} s.player.setPosition(18*16+8, 14*16+8); s.player.setVelocity(0,0); s.animals.forEach(a=>{{ if(a.kind!=='goat'){{ a.sprite.setPosition(30*16, 25*16); a.state='idle'; a.timer=99; }} }}); }})()")
        i = await creature(pg, "deer")
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Millet')"); await pg.wait_for_timeout(2500)
        print("deer came:", await pg.evaluate(f"Math.round(Math.hypot({Wd}.animals[{i}].sprite.x-{Wd}.player.x, {Wd}.animals[{i}].sprite.y-{Wd}.player.y))"), "| prompt:", await pg.evaluate(f"{Wd}.current && {Wd}.current.label"))
        for day in range(3):
            await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.animals[{i}] && s.animals[{i}].kind==='deer' ? s.animals[{i}] : s.animals.find(a=>a.kind==='deer'); a.sprite.setPosition(s.player.x+14, s.player.y); s.feedWild(a); }})()")
            print(f" feed {day+1}:", await msg(pg))
            await pg.evaluate(f"(()=>{{const s={Wd}; s.feedWild(s.animals.find(a=>a.kind==='deer') || s.animals[0]); }})()") if day == 0 else None
            if day == 0: print("  same day again:", await msg(pg))
            await pg.evaluate("G.data.tame.deer.day = -5")
        print("companion:", await pg.evaluate("JSON.stringify(G.data.companion)"), "| pet sprite:", await pg.evaluate(f"!!{Wd}.pet"))
        # It follows: walk east and change screens.
        await pg.keyboard.down("d"); await pg.wait_for_timeout(1500); await pg.keyboard.up("d"); await pg.wait_for_timeout(600)
        print("pet near after walk:", await pg.evaluate(f"Math.round(Math.hypot({Wd}.pet.sprite.x-{Wd}.player.x, {Wd}.pet.sprite.y-{Wd}.player.y))"))
        await pg.screenshot(path="/home/claude/test/grace_deer.png")
        await go(pg, Wd, 2, 0, 1); await pg.wait_for_timeout(500)
        print("pet on new screen:", await pg.evaluate(f"!!{Wd}.pet"))
        # The watcher warns: a wolf appears.
        await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('wolf'); const a=s.animals[s.animals.length-1]; a.state='idle'; a.chaseT=0; a.sprite.setPosition(s.player.x+150, s.player.y-20); }})()"); await pg.wait_for_timeout(1200)
        print("warning:", await msg(pg, 3))
        # Release the deer, tame a wolf (Artemis 7: two days), and let a boar charge.
        await pg.evaluate(f"{Wd}.releasePet(); G.addFavor('Artemis', 3)")
        await pg.evaluate(f"(()=>{{const s={Wd}; s.animals.forEach(a=>{{ if(a.kind!=='goat') a.sprite.setPosition(-200,-200); }}); }})()")
        i = await creature(pg, "wolf")
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Meat')")
        for day in range(2):
            await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.animals.find(a=>a.kind==='wolf'&&a.state!=='dead'); a.state='idle'; a.sprite.setPosition(s.player.x+14, s.player.y); s.feedWild(a); }})()")
            print(f" wolf feed {day+1}:", await msg(pg)); await pg.evaluate("G.data.tame.wolf.day = -5")
        j = await creature(pg, "boar")
        await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.animals[{j}]; a.sprite.setPosition(s.player.x+70, s.player.y); a.charge(8); G.data.vitality=G.vitalityMax; }})()")
        await pg.wait_for_timeout(4000)
        print("guard fight:", await msg(pg, 5))
        # A horse: Poseidon 4 tames it in a day; ride it.
        await pg.evaluate(f"{Wd}.releasePet(); G.addFavor('Poseidon', 4)")
        i = await creature(pg, "horse")
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Oats')")
        await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.animals.find(a=>a.kind==='horse'); a.state='idle'; a.sprite.setPosition(s.player.x+14, s.player.y); s.feedWild(a); }})()")
        print("horse:", await msg(pg))
        await pg.evaluate(f"{Wd}.mount()")
        await pg.evaluate("G.data.selected=0")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(600)
        print("riding speed:", await pg.evaluate(f"Math.round({Wd}.player.body.velocity.x)"), "| riding:", await pg.evaluate(f"{Wd}.pet.riding"))
        await pg.keyboard.up("d"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/grace_ride.png")
        await pg.evaluate(f"{Wd}.dismount()")
        await pg.keyboard.down("d"); await pg.wait_for_timeout(500)
        print("walking speed:", await pg.evaluate(f"Math.round({Wd}.player.body.velocity.x)")); await pg.keyboard.up("d")
        # Apollo's dream; Aphrodite's chat; Demeter's seed; the gods sheet.
        await pg.evaluate("G.addFavor('Apollo', 4); G.addFavor('Aphrodite', 7); G.addFavor('Demeter', 4); G.addFavor('Zeus', 4); G.addFavor('Hephaestus', 7)")
        print("dream:", await pg.evaluate("G.sleep(false,false).notes.filter(n=>/dreamed/.test(n)).join(' ')"))
        await pg.evaluate(f"{U}.openSheet('gods')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/home/claude/test/grace_sheet.png")
        await pg.evaluate(f"{U}.closeSheet()")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
