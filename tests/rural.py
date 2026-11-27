"""The Rural Arts and Wreaths and Crowns. Sections (args): farm, house, wild.
farm: icons; the Arts menu (R); Crop Blessing, Dawn Renewal and Solar Witness performed; sprigs cut with the sickle;
a crown woven and worn (drawn on the head), a wreath hung, a crown that wilts, a weaving that falls apart.
house: the Hearth Blessing, and cooking at the blessed hearth. wild: Flock Thriving, Wild Panic, the hermit's and
shepherd's teaching, the new plants drawn. Screenshots to /home/claude/test/rural_*.png."""
import asyncio, base64, sys
from playwright.async_api import async_playwright
sys.path.insert(0, "/home/claude/works-and-days/tests")
from wayfarers import setup, Wd
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"; Ho="game.scene.getScene('House')"
SHOT="/home/claude/test/"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")

async def sheet(pg, ids, path, tex="items"):
    url = await pg.evaluate(f"""(()=>{{const ids={ids!r}; const c=document.createElement('canvas'); c.width=ids.length*52; c.height=52; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.fillStyle='#3a2c22'; x.fillRect(0,0,c.width,c.height);
      ids.forEach((id,i)=>{{ const f=game.textures.getFrame('{tex}', id); if(!f) return; x.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, i*52+2, 2, f.cutWidth*3, f.cutHeight*3); }});
      return c.toDataURL(); }})()""")
    open(path, "wb").write(base64.b64decode(url.split(",")[1]))

async def opts(pg): return await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')")
async def choose(pg, prefix):
    await pg.evaluate(f"(()=>{{const o={U}.talkOpts.find(o=>o.label.startsWith({prefix!r})); if(!o) throw new Error('no option '+{prefix!r}+' in '+{U}.talkOpts.map(o=>o.label).join('/')); o.fn();}})()"); await pg.wait_for_timeout(200)

async def perform(pg, name, shot=None):
    """Open the Arts menu, plan the named rite, show its plan, perform it (three Spaces), and return the outcome text."""
    await pg.evaluate(f"{U}.closeTalk(); {U}.openArts()"); await pg.wait_for_timeout(150)
    await choose(pg, name)
    plan = await pg.evaluate(f"{U}.talkLast.text")
    if shot: await pg.screenshot(path=SHOT+shot)
    o = await opts(pg)
    if "Perform the rite now" not in o: return "CAN'T: " + o + " || " + plan[:400]
    await choose(pg, "Perform the rite now")
    for _ in range(80): # press Space whenever a step waits for it, until the rite is done
        st = await pg.evaluate(f"{U}.ritual ? ({U}.ritual.results.length === {U}.ritual.step && {U}.ritual.t > 0.3 ? 'wait' : 'busy') : 'done'")
        if st == "done": break
        if st == "wait": await pg.keyboard.press("Space")
        await pg.wait_for_timeout(400)
    return await pg.evaluate(f"{U}.talkLast.title + ' :: ' + {U}.talkLast.text")

async def start(b, scene="Farm"):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
    if await pg.evaluate("game.scene.isActive('Creation')"):
        await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
    await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=0.5; G.data.weather='clear'; G.data.month=9; G.data.day=10")
    if scene == "Farm":
        await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
    await pg.evaluate("for (let i=10;i<G.data.slots.length;i++) G.data.slots[i]=null; for (let i=0;i<20;i++) G.data.slots.push(null)")
    await pg.evaluate("for (const a of ['Oikos','Pneuma','Phoenix','Kardia','Ourania','Logos','Thymos','Aiolos','Techne','Kratos']) G.data.aretai[a]=12; G.essence.Earth=99; G.essence.Water=99; G.essence.Fire=99; G.essence.Air=99")
    await pg.evaluate("window._log=[]; const s0=G.say.bind(G); G.say=(t)=>{window._log.push(t); s0(t)}; 0")
    return pg, errs

async def farm(b):
    pg, errs = await start(b)
    await sheet(pg, ["OliveSprig","OakLeaves","PineBoughs","Myrtle","Ivy","Poplar","Parsley","Celery","Barley","Wheat","seed_Barley","seed_Wheat"], SHOT+"rural_items.png")
    await sheet(pg, [f"{c}_{st}" for c in ["Barley","Wheat"] for st in range(4)], SHOT+"rural_crops.png", "crops")
    await pg.evaluate("G.data.arts.push('crop','dawn','solar')")
    await pg.keyboard.press("r"); await pg.wait_for_timeout(300)
    print("R menu:", await opts(pg))
    await pg.screenshot(path=SHOT+"rural_menu.png")
    await pg.evaluate(f"{U}.closeTalk()")
    # Crop Blessing at dawn in spring, with a sprouted planting.
    await pg.evaluate("G.addItem('Millet',3); G.addItem('Wine',2); G.addItem('Milk',1); G.data.crops['40,30']={id:'Millet',growth:1,picks:0,dryNights:0,dryStreak:0,withered:false}")
    print("CROP:", (await perform(pg, "Crop Blessing", "rural_plan_crop.png"))[:500])
    print("   blessed crop:", await pg.evaluate("G.blessed('crop')"), "| left: millet", await pg.evaluate("G.count('Millet')"), "wine", await pg.evaluate("G.count('Wine')"))
    # Dawn Renewal (still dawn): water from the jar, a little grain.
    await pg.evaluate("G.data.jarWater=3; G.data.fatigue=40; G.data.clock=0.6")
    print("DAWN:", (await perform(pg, "Dawn Renewal"))[:400], "| fatigue", await pg.evaluate("G.data.fatigue.toFixed(1)"), "| blessed", await pg.evaluate("G.blessed('dawn')"))
    # Solar Witness at noon, clear: gold, water, incense, blood. Give an omen to read and a satyr theft to undo.
    await pg.evaluate("G.addItem('GoldDust',1); G.addItem('Thyme',2); G.data.clock=G.daylight/2; G.data.omen={day:G.dayNumber, god:'Hermes', good:false, noticed:true}; G.data.myth.satyrs={days:0,last:-1,name:'Skirtos',stolen:'Honey'}")
    print("SOLAR:", (await perform(pg, "Solar Witness"))[:700], "| vitality", await pg.evaluate("G.data.vitality"), "| honey", await pg.evaluate("G.count('Honey')"), "| kleos", await pg.evaluate("G.data.currencies.Kleos"))
    print("   not here (dawn rite at noon):", (await perform(pg, "Dawn Renewal"))[:160])
    await pg.evaluate(f"{U}.closeTalk()")
    # Sprigs with the sickle: find an olive, an oak and a pine on the farm.
    for tile, name in [("OLIVE","olive"),("TREE","oak"),("PINE","pine")]:
        r = await pg.evaluate(
          f"""(()=>{{const s={F}; const o=s.objects; const want={{OLIVE:'OliveSprig',TREE:'OakLeaves',PINE:'PineBoughs'}}['{tile}']; let tried=0;
          for(let y=2;y<44;y++) for(let x=2;x<62;x++){{ const t=o.getTileAt(x,y); if(!t||t.index<0) continue; const before=G.count(want);
            s.player.setPosition(x*16+8, (y+1)*16+8); s.facing=3; s.mouseIn=false; s.cursorMode=false; G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='sickle');
            const ft=s.facingTile(); if(ft[0]!==x||ft[1]!==y) continue; const l0=window._log.length; s.useNow(); tried++; if(G.count(want)>before) return 'cut at '+x+','+y+': '+window._log.slice(-1)[0]+' | fresh '+G.isFresh(want); if(tried>400) return 'gave up'; }}
          return 'none found'; }})()""")
        print(f"sickle on {name}:", r)
    # Weave a crown of laurel and olive: fresh laurel, the olive just cut.
    await pg.evaluate("G.addItem('Laurel',2); G.markFresh('Laurel'); if(!G.count('OliveSprig')) {G.addItem('OliveSprig',2); G.markFresh('OliveSprig');} G.data.clock=0.5")
    await pg.evaluate(f"{U}.openWeave({F}.weaveCtx())"); await pg.wait_for_timeout(200)
    await pg.evaluate(f"{U}.weaveSel=['laurel','olive']; {U}.buildWeave()"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=SHOT+"rural_weave.png")
    ar0 = await pg.evaluate("[G.data.aretai.Pneuma, G.data.aretai.Logos, G.boon('Apollo')].join(',')")
    await pg.evaluate(f"G.essence.Earth=99; G.essence.Water=99; G.essence.Fire=99; G.essence.Air=99; G.data.fatigue=0; {U}.weave()"); await pg.wait_for_timeout(300)
    print("CROWN:", await msg(pg))
    print("   Pneuma, Logos, Apollo boon:", ar0, "->", await pg.evaluate("[G.data.aretai.Pneuma, G.data.aretai.Logos, G.boon('Apollo')].join(',')"), "| crown", await pg.evaluate("JSON.stringify(G.data.crown)"), "| laurel?", await pg.evaluate("G.crownHas('laurel')"))
    # Look at the player with the crown on.
    await pg.evaluate(f"(()=>{{const s={F}; s.player.setPosition(30*16+8, 21*16+8); s.facing=0; s.cameras.main.setZoom(6); s.cameras.main.centerOn(s.player.x, s.player.y-4);}})()"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=SHOT+"rural_crowned.png", clip={"x":380,"y":220,"width":200,"height":200})
    await pg.evaluate(f"{F}.cameras.main.setZoom(2)")
    # A wreath at home: barley and wheat, fresh from the field.
    c0 = await pg.evaluate("G.homeComfort")
    await pg.evaluate("G.addItem('Barley',1); G.addItem('Wheat',1); G.markFresh('Barley'); G.markFresh('Wheat')")
    await pg.evaluate(f"{U}.openWeave({F}.weaveCtx()); {U}.weaveKind='wreath'; {U}.weaveSel=['barley','wheat']; {U}.buildWeave()"); await pg.wait_for_timeout(150)
    await pg.evaluate(f"G.essence.Earth=99; G.data.fatigue=0; {U}.weave()"); await pg.wait_for_timeout(200)
    print("WREATH:", await msg(pg), "| comfort", c0, "->", await pg.evaluate("G.homeComfort"), "| wheat?", await pg.evaluate("G.wreathHas('wheat')"))
    # Wilted material: laurel gathered yesterday can't be chosen.
    await pg.evaluate("G.data.fresh.Laurel = G.dayNumber-1")
    await pg.evaluate(f"{U}.openWeave({F}.weaveCtx())"); await pg.wait_for_timeout(150)
    print("laurel line:", await pg.evaluate(f"{U}.craft.list.filter(o=>o.text && o.text.includes('Laurel'))[0]?.text"))
    await pg.evaluate(f"{U}.closeCraft()")
    # The crown wilts: its Aretai go.
    await pg.evaluate("if (G.data.crown) G.data.crown.until = G.absHour - 0.1"); notes = await pg.evaluate("G.mealTick()")
    print("wilt:", notes, "| Pneuma, Logos", await pg.evaluate("[G.data.aretai.Pneuma, G.data.aretai.Logos].join(',')"), "| crown", await pg.evaluate("JSON.stringify(G.data.crown)"))
    # A weaving that falls apart.
    await pg.evaluate("G.addItem('Laurel',1); G.markFresh('Laurel'); G.data.aretai.Pneuma=-30; G.essence.Earth=99; G.data.fatigue=0")
    await pg.evaluate(f"{U}.openWeave({F}.weaveCtx()); {U}.weaveKind='crown'; {U}.weaveSel=['laurel']; {U}.weave()"); await pg.wait_for_timeout(200)
    print("FAIL:", await msg(pg)); await pg.evaluate("G.data.aretai.Pneuma=12")
    print("ERRORS:", errs); await pg.close()

async def house(b):
    pg, errs = await start(b, "House")
    await pg.evaluate("G.data.arts.push('hearth'); G.addItem('dish_kykeon',1); G.addItem('Thyme',2); G.data.jarWater=3; G.data.tendedHearthDay=G.dateKey; G.data.hostedDay=G.dayNumber-2")
    c0 = await pg.evaluate("G.homeComfort")
    print("HEARTH:", (await perform(pg, "Hearth Blessing", "rural_plan_hearth.png"))[:600])
    print("   blessed", await pg.evaluate("G.blessed('hearth')"), "| comfort", c0, "->", await pg.evaluate("G.homeComfort"), "| pathos", await pg.evaluate("G.data.currencies.Pathos"))
    print("   hearth menu:", (await pg.evaluate(f"(()=>{{ {Ho}.constructor; {U}.closeTalk(); {U}.hearthMenu(()=>{{}}); return {U}.talkOpts.map(o=>o.label).join(' / '); }})()")))
    await pg.evaluate(f"{U}.closeTalk(); G.addItem('Millet',3)")
    await pg.evaluate(f"{U}.openCook('hearth'); {U}.pot=['Millet']; {U}.cook()"); await pg.wait_for_timeout(200)
    print("   cook:", await msg(pg))
    print("ERRORS:", errs); await pg.close()

async def wild(b):
    pg, errs = await setup(b, 9, 7, wx=4, wy=0, feature="High meadow")
    await pg.evaluate("for (let i=10;i<G.data.slots.length;i++) G.data.slots[i]=null; for (let i=0;i<20;i++) G.data.slots.push(null)")
    await pg.evaluate("for (const a of ['Oikos','Pneuma','Phoenix','Kardia','Thymos','Aiolos']) G.data.aretai[a]=12; G.data.month=9; G.data.clock=G.daylight/2; G.data.weather='clear'; G.essence.Earth=99; G.essence.Fire=99")
    # The hermit and the shepherd teach.
    for kind in ["hermit","shepherd"]:
        r = await pg.evaluate(f"(()=>{{const s={Wd}; s.hutSpecial({{id:'{kind}', title:'A {kind}'}}, 'X', ()=>{{}}); return {U}.talkLast.text.slice(0,140); }})()")
        print(f"{kind} teaches:", r, "| arts", await pg.evaluate("G.data.arts.join(',')"))
    await pg.evaluate(f"{U}.closeTalk(); G.addItem('Syrinx',1); G.addItem('Wine',1); G.addItem('Meat',1); G.addItem('Flowers',2); G.addItem('Thistle',2)")
    print("FLOCK:", (await perform(pg, "Flock Thriving", "rural_plan_flock.png"))[:500], "| blessed", await pg.evaluate("G.blessed('flock')"), "| pipes kept", await pg.evaluate("G.count('Syrinx')"))
    # Wild Panic with a wolf charging.
    await pg.evaluate("G.data.arts.push('panic')")
    await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('wolf'); s.summon('deer');}})()"); await pg.wait_for_timeout(300)
    await pg.evaluate(f"(()=>{{const s={Wd}; for (const a of s.animals) if(a.kind==='wolf') {{ a.sprite.setPosition(s.player.x+60, s.player.y); a.charge(8); }} }})()")
    h0 = await pg.evaluate("G.data.currencies.Hubris")
    print("PANIC:", (await perform(pg, "Wild Panic"))[:400], "| hubris", h0, "->", await pg.evaluate("G.data.currencies.Hubris"), "| wolves", await pg.evaluate(f"{Wd}.animals.filter(a=>a.kind==='wolf').map(a=>a.state+(a.appeased?' calm':'')).join(',')"))
    # The new plants, drawn.
    await pg.evaluate(f"""(()=>{{const s={Wd}; const ids=['myrtle','ivy','poplar','parsley','celery'];
      ids.forEach((id,i)=>{{ const x=s.player.x-60+i*30, y=s.player.y-30; s.add.image(x,y,'forage',id).setDepth(y+2); s.add.image(x,y,'forage',id+'_fruit').setDepth(y+3); }}); for (const a of s.animals) a.sprite.setVisible(false); {U}.closeTalk(); }})()""")
    await pg.wait_for_timeout(300); await pg.screenshot(path=SHOT+"rural_plants.png", clip={"x":330,"y":220,"width":300,"height":160})
    print("ERRORS:", errs); await pg.close()

async def main():
    which = sys.argv[1:] or ["farm","house","wild"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        for w in which: await globals()[w](b)
        await b.close()

if __name__ == "__main__": asyncio.run(main())
