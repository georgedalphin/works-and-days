"""Clothing and armor: outfits drawn on the player, wearing and taking off, hit locations, Aiolos/Stealth, weather, robes, shops."""
import asyncio, base64
from playwright.async_api import async_playwright
U="game.scene.getScene('UI')"; Ho="game.scene.getScene('House')"; F="game.scene.getScene('Farm')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
OUTFITS = [
  {"body":"Chiton"},
  {"body":"Exomis","feet":"Sandals","head":"Petasos"},
  {"body":"Peplos","cloak":"Himation","feet":"Sandals"},
  {"body":"Robes"},
  {"body":"Chiton","armor":"LeatherShirt","head":"Kynee","shield":"Pelte","feet":"Sandals"},
  {"body":"Chiton","armor":"Linothorax","head":"TuskHelm","shield":"Pelte","feet":"Boots","cloak":"Cloak"},
  {"body":"Chiton","armor":"ScaleCuirass","head":"Corinthian","shield":"Aspis","legs":"Greaves","feet":"Sandals"},
  {"body":"Chiton","armor":"Cuirass","head":"Corinthian","shield":"Aspis","legs":"Greaves","feet":"Sandals"},
  {"body":"Exomis","cloak":"LionPelt","feet":"Boots"},
]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"):
            await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
        await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=4; G.data.weather='clear'"); await pg.wait_for_timeout(400)
        print("start worn:", await pg.evaluate("JSON.stringify(G.data.worn)"))
        # A lineup of outfits: front, side, back, scaled up.
        data = await pg.evaluate("""(outfits)=>{
          const P = 7, sc = 6, cv = document.createElement('canvas'); cv.width = outfits.length*3*16*sc + outfits.length*12; cv.height = 16*sc; const c = cv.getContext('2d'); c.imageSmoothingEnabled=false;
          c.fillStyle='#a7a34e'; c.fillRect(0,0,cv.width,cv.height);
          const save = JSON.stringify(G.data.worn);
          outfits.forEach((o,i)=>{ G.data.worn = o; dressPlayer(game.scene.getScene('House'));
            const src = game.textures.get('player').getSourceImage();
            [0, 2*P, 3*P].forEach((fr,k)=> c.drawImage(src, fr*16, 0, 16, 16, (i*3+k)*16*sc + i*12, 0, 16*sc, 16*sc)); });
          G.data.worn = JSON.parse(save); dressPlayer(game.scene.getScene('House'));
          return cv.toDataURL(); }""", OUTFITS)
        open("/home/claude/test/gear_lineup.png","wb").write(base64.b64decode(data.split(",")[1]))
        # Wear by Space, take off by the Belongings panel.
        await pg.evaluate("(()=>{ for (const k of ['Cuirass','Corinthian','Aspis','Greaves','Sandals','Cloak','Robes','Petasos','Flowers']) G.addItem(k, k==='Flowers'?4:1); })()")
        for k in ["Cuirass","Corinthian","Aspis","Greaves","Sandals"]:
            await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='{k}'); {Ho}.useNow()"); await pg.wait_for_timeout(80)
        print("wore:", await msg(pg))
        print("worn now:", await pg.evaluate("JSON.stringify(G.data.worn)"), "| chiton back in pack:", await pg.evaluate("G.count('Chiton')"))
        print("gear:", await pg.evaluate("JSON.stringify(G.gear)"), "| stealth", await pg.evaluate("G.data.stealth"), "->", await pg.evaluate("G.stealthNow(true)"))
        await pg.evaluate(f"{U}.toggleInventory()"); await pg.wait_for_timeout(400)
        await pg.screenshot(path="/home/claude/test/gear_inventory.png")
        print("stats:", await pg.evaluate(f"{U}.inv.stats.text"))
        await pg.evaluate(f"{U}.clickWorn('legs')"); await pg.wait_for_timeout(100)
        print("took off:", await msg(pg), "| greaves in pack:", await pg.evaluate("G.count('Greaves')"))
        # pick greaves in pack, click the legs slot: on again
        await pg.evaluate(f"(()=>{{const u={U}; u.clickSlot(G.data.slots.findIndex(q=>q&&q.id==='Greaves')); u.clickWorn('legs'); }})()"); await pg.wait_for_timeout(100)
        print("back on:", await pg.evaluate("G.data.worn.legs"))
        await pg.evaluate(f"{U}.toggleInventory()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path="/home/claude/test/gear_helm.png")
        # Blows: 24 boar hits in full bronze vs none.
        async def blows(n):
            return await pg.evaluate(f"""(()=>{{const s={Ho}; const out=[]; for(let i=0;i<{n};i++){{ s.invuln=0; G.data.vitality=G.vitalityMax; const v0=G.data.vitality; s.struck({{kind:'boar', sprite:{{x:s.player.x+10,y:s.player.y}}}}); out.push(v0-G.data.vitality); }} return out; }})()""")
        armored = await blows(24)
        print("armored dmg:", armored, "| a message:", await msg(pg, 2))
        await pg.evaluate("G.data.worn={body:'Chiton'}")
        bare = await blows(24)
        print("bare dmg:", bare, "avg", sum(armored)/24, "vs", sum(bare)/24)
        # Weather: rain on the farm, in a chiton, then in a cloak.
        await pg.evaluate(f"{U}.modal=false; G.data.vitality=24; {Ho}.goTo('Farm')"); await pg.wait_for_timeout(2500)
        await pg.evaluate("G.data.weather='rain'; G.data.fatigue=10"); await pg.wait_for_timeout(4000)
        f1 = await pg.evaluate("G.data.fatigue")
        print("rain, bare:", f1, await msg(pg))
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Cloak'); game.scene.getScene('Farm').useNow(); G.data.fatigue=10"); await pg.wait_for_timeout(4000)
        print("rain, cloaked:", await pg.evaluate("G.data.fatigue"))
        await pg.evaluate("G.data.weather='clear'")
        # Robes at the altar.
        await pg.evaluate("G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Robes'); game.scene.getScene('Farm').useNow()")
        await pg.evaluate(f"{U}.offer('home','Flowers','Athena', 3)"); await pg.wait_for_timeout(200)
        print("offer:", await pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ').slice(0,400) : ''"))
        await pg.evaluate(f"{U}.closeTalk()")
        # The weaver's wares (a made-up household, to test the shop).
        await pg.evaluate("G.data.silver=100")
        await pg.evaluate("(()=>{const V=game.scene.getScene('Village'); V.houseShop.call(Object.assign(Object.create(V), {scene: game.scene.getScene('Farm').scene}), 'Melitta', {trade:{id:'weaver',name:\"the weaver's household\"}}, {say:'test', wares:[['Exomis',9]]}); })()"); await pg.wait_for_timeout(200)
        await pg.keyboard.press("1"); await pg.wait_for_timeout(200)
        print("bought:", await pg.evaluate("G.count('Exomis')"), "silver", await pg.evaluate("G.data.silver"))
        print("errors:", errs)
        await b.close()
asyncio.run(main())
