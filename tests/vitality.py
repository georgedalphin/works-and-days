import asyncio
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
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
        print("start: health", await pg.evaluate("G.data.health"), "| vitality", await pg.evaluate("[G.data.vitality, G.vitalityMax]"))
        # Blows to fall, from full, for each beast (no cloak).
        res = await pg.evaluate(f"""(()=>{{const f={F}; const A=f.animals[0].constructor; const out={{}};
          for (const k of ['fox','jackal','wolf','eidolon','deer','boar','bear','lion']) {{
            const a=new A(f,k,f.player.x+10,f.player.y,new Phaser.Geom.Rectangle(0,0,999,999)); G.data.vitality=G.vitalityMax; let n=0;
            while (G.data.vitality>0 && n<50) {{ f.invuln=0; f.leaving=true; G.heal(-0); const v=G.data.vitality; f.leaving=false;
              const lt=G.data.lifeThread; f.struckDown=()=>{{}}; f.struck(a); n++; }}
            out[k]=n; a.sprite.destroy(); }}
          delete f.struckDown; return out; }})()""")
        print("blows to fall from full Vitality:", res)
        # Struck down for real: the Life Thread frays, and you wake at home partly healed.
        await pg.evaluate(f"(()=>{{const f={F}; const A=f.animals[0].constructor; const a=new A(f,'boar',f.player.x+10,f.player.y,new Phaser.Geom.Rectangle(0,0,999,999)); G.data.vitality=3; f.invuln=0; f.leaving=false; f.struck(a); }})()")
        await pg.wait_for_timeout(1200)
        print("felled:", await pg.evaluate("[G.data.vitality, G.data.lifeThread]"))
        await pg.screenshot(path="/home/claude/test/vit_sleep.png")
        await pg.keyboard.press("Space"); await pg.wait_for_timeout(2500)
        print("woke:", await pg.evaluate("[Math.round(G.data.vitality), G.vitalityMax, G.data.scene]"))
        # Lightning is a wound to the body; fever only wears you down.
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate(f"G.data.vitality=24; G.data.fatigue=10; {F}.harm(18, 'Lightning strikes you!', 'lightning', true); {F}.harm(10, 'Fever.', 'fever')")
        print("hazards:", await pg.evaluate("[G.data.vitality, Math.round(G.data.fatigue), G.messages.slice(-2).map(m=>m.text)]"))
        # Food heals; time heals slowly.
        await pg.evaluate("G.data.vitality=8; G.addItem('meal_Kratos',1,2); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='meal_Kratos')")
        await pg.evaluate(f"{F}.useNow()")
        print("ate:", await pg.evaluate("[G.data.vitality, G.messages.slice(-1)[0].text]"))
        await pg.evaluate("G.data.vitality=4"); v0 = 4
        for _ in range(4): await pg.evaluate("G.data.clock += 1"); await pg.wait_for_timeout(1200)
        print("4 hours later:", v0, "->", await pg.evaluate("Math.round(G.data.vitality*10)/10"))
        await pg.evaluate("G.data.vitality=5"); await pg.wait_for_timeout(500)
        await pg.screenshot(path="/home/claude/test/vit_hud.png")
        print("HUD text:", await pg.evaluate(f"{U}.vitText.text"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
