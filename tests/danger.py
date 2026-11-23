import asyncio
from playwright.async_api import async_playwright
async def setup(b):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1800)
    if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("(()=>{const c=game.scene.getScene('Creation');for(const a of Object.keys(c.aretai))c.aretai[a]=3;c.finish();})()"); await pg.wait_for_timeout(1800)
    # jump to a forest screen
    await pg.evaluate("G.data.screens['1,0']={terrain:2,special:false,feature:'Old oak',cleared:[]}; G.data.wx=1;G.data.wy=0;G.data.entry='W';G.data.scene='Wild'; game.scene.getScene('UI').help.setVisible(false); game.scene.getScene('UI').modal=false; game.scene.getScene('House').goTo('Wild')")
    await pg.wait_for_timeout(2500)
    await pg.evaluate(f"(()=>{{const s=game.scene.getScene('Wild');s.player.setPosition(20*16+8,15*16+8);for(const a of s.animals){{a.sprite.destroy();}}s.animals=[];}})()")
    await pg.wait_for_timeout(300)
    return pg, errs
W="game.scene.getScene('Wild')"
msg = lambda pg: pg.evaluate("G.messages.map(m=>m.text).slice(-2).join(' | ')")
async def boar(pg, dx=40):
    return await pg.evaluate(f"""(()=>{{const s={W};const A=window.Animal;const a=new A(s,'boar',s.player.x+{dx},s.player.y,new Phaser.Geom.Rectangle(s.player.x,s.player.y-40,80,80));s.animals.push(a);a.rolled=true;a.rerollT=999;window._b=a;return s.animals.length;}})()""")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b)
        print("scene", await pg.evaluate("G.data.scene"), await pg.evaluate("G.locationLabel()"))
        # 1. a boar charges and strikes
        await boar(pg, 50)
        print("charged?", await pg.evaluate(f"{W}.aggressionRoll(window._b, 12)"), await msg(pg))
        await pg.wait_for_timeout(1200)
        print("fatigue after charge", await pg.evaluate("G.data.fatigue.toFixed(1)"), "|", await msg(pg))
        await pg.screenshot(path="/home/claude/test/a0_charge.png")
        print("prompt", await pg.evaluate("game.scene.getScene('UI').promptText.text"), "boar", await pg.evaluate("[window._b.state, window._b.sprite.active, !!window._b.sprite.body, G.data.scene, game.scene.getScene('Wild').animals.includes(window._b)]"))
        # 2. calm it with grain in hand
        await pg.evaluate("G.data.aretai.Kardia=12; const i=G.data.slots.findIndex(s=>s&&s.id==='seed_Millet'); G.addItem('Millet',2); G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Millet')")
        await pg.evaluate(f"{W}.player.setPosition(window._b.sprite.x-14, window._b.sprite.y-4); {W}.facing=2")
        await pg.wait_for_timeout(80)
        await pg.evaluate(f"(()=>{{const s={W};s.appease(window._b);}})()")
        print("appeased", await pg.evaluate("window._b.appeased"), "|", await msg(pg))
        # 3. melee kill a second boar
        await boar(pg, 14)
        await pg.evaluate(f"G.data.aretai.Thymos=12; {W}.facing=2; G.data.selected=3")  # axe
        for i in range(2):
            await pg.evaluate("G.essence.Fire=G.essenceMax.Fire")
            await pg.evaluate(f"(()=>{{const s={W};s.player.setPosition(window._b.sprite.x-14,window._b.sprite.y-4);s.facing=2;s.useItem();}})()"); await pg.wait_for_timeout(150)
            print("strike", i, await msg(pg))
        await pg.wait_for_timeout(1300)
        print("pickups", await pg.evaluate(f"{W}.pickups.map(p=>p.id).join(',')"))
        # 4. struck down
        await boar(pg, 40)
        await pg.evaluate("G.data.fatigue=95")
        await pg.evaluate(f"{W}.aggressionRoll(window._b, 12)")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path="/home/claude/test/a1_down.png")
        print("life thread", await pg.evaluate("G.data.lifeThread"), "scene", await pg.evaluate("G.data.scene"))
        print("ERRORS:", errs)
        await pg.close()
        # 5. death
        pg, errs = await setup(b)
        await pg.evaluate("G.data.lifeThread=1; G.data.fatigue=99")
        await boar(pg, 40); await pg.evaluate(f"{W}.aggressionRoll(window._b, 12)")
        await pg.wait_for_timeout(2000)
        await pg.screenshot(path="/home/claude/test/a2_death.png")
        print("save cleared", await pg.evaluate("localStorage.getItem('worksanddays.save.v1')===null"))
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
