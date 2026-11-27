"""Pharmakeia, the herb-Art: new herbs, crops and icons; the mortar panel; aspects, conditions and checks; each remedy
used; a spoiled brew; teaching; the new plants in the wild and the mandrake's scream.
Sections (args): farm, wild. Screenshots to /home/claude/test/pharm_*.png."""
import asyncio, base64, sys
from playwright.async_api import async_playwright
sys.path.insert(0, "/home/claude/works-and-days/tests")
from wayfarers import setup, log, Wd
U="game.scene.getScene('UI')"; F="game.scene.getScene('Farm')"
SHOT="/home/claude/test/"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")

async def sheet(pg, ids, path, tex="items"):
    """Draw texture frames side by side, scaled 3x, to a PNG."""
    url = await pg.evaluate(f"""(()=>{{const ids={ids!r}; const c=document.createElement('canvas'); c.width=ids.length*52; c.height=52; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.fillStyle='#3a2c22'; x.fillRect(0,0,c.width,c.height);
      ids.forEach((id,i)=>{{ const f=game.textures.getFrame('{tex}', id); if(!f) return; x.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, i*52+2, 2, f.cutWidth*3, f.cutHeight*3); }});
      return c.toDataURL(); }})()""")
    open(path, "wb").write(base64.b64decode(url.split(",")[1]))

async def brew(pg, herbs, slow=False, heart=False):
    """Put herbs in the mortar (by id), brew, and return the message and what was made."""
    return await pg.evaluate(f"""(()=>{{G.essence.Earth=99; G.essence.Water=99; G.essence.Fire=99; G.essence.Air=99; G.data.fatigue=0; const u={U}; u.mortar={[{"id":h,"q":1} for h in herbs]!r}; u.brewSlow={str(slow).lower()}; u.brewHeart={str(heart).lower()};
      const plan=u.constructor.brewPlan(u.mortar, u.brewAt, u.brewSlow, u.brewHeart);
      u.brew(); return {{aspect: plan.b.aspect, total: plan.b.total, base: plan.b.base, bonus: plan.bonus, conds: plan.conds.map(c=>c.label+' '+c.n).join('; '), crs: plan.checks.map(c=>c.aretai+' '+c.cr).join(', '),
        said: G.messages.map(m=>m.text).slice(-1)[0], got: G.data.slots.filter(s=>s&&s.id.startsWith('pharm_')).map(s=>s.id+':'+(s.q??1)+'x'+s.qty).join(' ')}}; }})()""")

async def use(pg, rid):
    await pg.evaluate(f"(()=>{{G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='{rid}'); {F}.useNow();}})()")
    return await msg(pg)

async def farm(b):
    pg = await b.new_page(viewport={"width":960,"height":640})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1200)
    await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
    if await pg.evaluate("game.scene.isActive('Creation')"):
        await pg.evaluate("(()=>{const c=game.scene.getScene('Creation'); for(const a of Object.keys(c.aretai))c.aretai[a]=3; c.finish();})()"); await pg.wait_for_timeout(1800)
    await pg.evaluate(f"{U}.help.setVisible(false); {U}.modal=false; G.data.clock=0.5; G.data.weather='clear'")
    await pg.evaluate("game.scene.getScene('House').goTo('Farm')"); await pg.wait_for_timeout(2500)
    # Icons and plants.
    herbs = ["Sage","Yarrow","WillowBark","Dittany","Wormwood","Squill","Laurel","Asphodel","Cyclamen","WildRose","SeaHolly","Mandrake","Hellebore","Henbane","Hemlock","Poppy","Garlic","seed_Poppy","seed_Garlic","Mortar"]
    rem = ["pharm_healing","pharm_cleansing","pharm_sleep","pharm_sight","pharm_warding","pharm_love","pharm_courage","pharm_venom"]
    await sheet(pg, herbs, SHOT+"pharm_herbs.png"); await sheet(pg, rem, SHOT+"pharm_remedies.png")
    await sheet(pg, [f"{c}_{st}" for c in ["Poppy","Garlic"] for st in range(4)], SHOT+"pharm_crops.png", "crops")
    print("frames missing:", await pg.evaluate(f"{[*herbs,*rem]!r}.filter(id=>!game.textures.get('items').has(id))"))
    await pg.evaluate("for (let i=10;i<G.data.slots.length;i++) G.data.slots[i]=null; for (let i=0;i<20;i++) G.data.slots.push(null)")
    for (k,n) in [("Mortar",1),("Yarrow",3),("Honey",3),("Sage",2),("Poppy",3),("Milk",2),("Garlic",2),("Tusk",2),("Amber",1),("Hemlock",9),("Henbane",2),("Laurel",3),("WildRose",3),("Wine",2),("Fennel",2),("Ivy",2),("Thyme",2),("Wormwood",2),("Saltbush",2),("Mushrooms",9)]:
        await pg.evaluate(f"G.addItem('{k}',{n})")
    await pg.evaluate(f"""(()=>{{const s={F}; s.player.setPosition(30*16+8, 21*16+8); s.player.setVelocity(0,0); s.mouseIn=false; s.cursorMode=false; s.facing=2;
      G.essence.Fire=99; G.essence.Water=99; G.essence.Earth=99; G.essence.Air=99; G.data.fatigue=0; }})()""")
    # Open the mortar by holding it and pressing Space.
    await pg.evaluate(f"(()=>{{G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Mortar'); {F}.useNow();}})()"); await pg.wait_for_timeout(300)
    print("panel open:", await pg.evaluate(f"!!{U}.craft && !!{U}.brewAt"), "| ctx:", await pg.evaluate(f"JSON.stringify({U}.brewAt)"))
    print("untaught, yarrow known?", await pg.evaluate(f"{U}.constructor.herbKnown('Yarrow')"), "honey known?", await pg.evaluate(f"{U}.constructor.herbKnown('Honey')"))
    await pg.evaluate(f"(()=>{{const u={U}; u.mortar=[{{id:'Yarrow',q:1}},{{id:'Honey',q:1}},{{id:'Sage',q:1}}]; u.buildBrew();}})()"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=SHOT+"pharm_panel_untaught.png")
    await pg.evaluate("G.pharm.taught=true"); await pg.evaluate(f"{U}.buildBrew()"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=SHOT+"pharm_panel.png")
    # A sure hand for the remedies themselves.
    await pg.evaluate("for (const a of ['Gnosis','Techne','Kardia','Pneuma','Metis','Ourania','Phoenix','Thymos']) G.data.aretai[a]=12")
    r = await brew(pg, ["Yarrow","Honey","Sage"]); print("HEALING:", r)
    await pg.evaluate(f"{U}.closeCraft()")
    await pg.evaluate("G.data.vitality=3"); print("salve:", await use(pg, "pharm_healing"), "| vitality", await pg.evaluate("G.data.vitality+'/'+G.vitalityMax"))
    await pg.evaluate(f"{U}.openBrew({F}.brewCtx())")
    r = await brew(pg, ["Poppy","Poppy","Milk"], slow=True); print("SLEEP (slow):", r, "| clock", await pg.evaluate("G.data.clock.toFixed(2)"))
    r = await brew(pg, ["Garlic","Tusk","Amber"]); print("WARDING:", r)
    r = await brew(pg, ["Hemlock","Henbane"]); print("VENOM:", r, "| hubris", await pg.evaluate("G.data.currencies.Hubris"))
    r = await brew(pg, ["Laurel","Laurel","Mushrooms"]); print("SIGHT:", r)
    r = await brew(pg, ["WildRose","WildRose","Wine"], heart=True); print("LOVE (heart):", r, "| pathos", await pg.evaluate("G.data.currencies.Pathos"))
    r = await brew(pg, ["Wine","Fennel","Ivy","Thyme"]); print("COURAGE:", r)
    r = await brew(pg, ["Wormwood","Wormwood","Saltbush"]); print("CLEANSING:", r)
    r = await brew(pg, ["Poppy","Thyme","Wine"]); print("opposed (sleep vs courage):", r["aspect"], r["total"])
    print("made:", await pg.evaluate("G.pharm.made.join(', ')"), "| tried:", await pg.evaluate("G.pharm.tried.length"))
    await pg.evaluate(f"{U}.buildBrew()"); await pg.wait_for_timeout(150); await pg.screenshot(path=SHOT+"pharm_panel_after.png")
    await pg.evaluate(f"{U}.closeCraft()")
    # Each remedy in use.
    print("sight:", await use(pg, "pharm_sight"), "| buff", await pg.evaluate("G.songOn('sight') && G.songOn('augury')"))
    print("love:", await use(pg, "pharm_love"), "| charm", await pg.evaluate("G.songOn('charm')"), "| warmth", await pg.evaluate(f"{F}.warmth()"))
    print("courage:", await use(pg, "pharm_courage"), "| Thymos", await pg.evaluate("G.data.aretai.Thymos"))
    print("cleansing:", await use(pg, "pharm_cleansing"), "| pure", await pg.evaluate("G.songOn('pure')"))
    print("warding:", await use(pg, "pharm_warding"), "| ward", await pg.evaluate("G.songOn('ward')"))
    await pg.evaluate(f"(()=>{{const s={F}; G.data.divine.troubles=['Demeter']; s.divineT=0; s.divineTick(0.1);}})()")
    print("trouble turned:", await msg(pg), "| ward now", await pg.evaluate("G.songOn('ward')"))
    print("venom:", await use(pg, "pharm_venom"), "|", await pg.evaluate("JSON.stringify(G.data.venom)"))
    hare = f"(()=>{{const s={F}; let a=s.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); if(!a) {{ s.summon('hare'); a=s.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); }} if(!a) return null; a.sprite.setPosition(s.player.x+60, s.player.y); a.sprite.setVelocity(0,0); a.state='idle'; a.timer=99; a.hp=9; return [a.sprite.x,a.sprite.y];}})()"
    xy = await pg.evaluate(hare)
    if xy:
        await pg.evaluate(f"{F}.land({xy[0]},{xy[1]-3},'Arrow')"); h1 = await pg.evaluate(f"(()=>{{const a={F}.animals.find(a=>a.kind==='hare'&&a.state!=='dead'); return a?a.hp:'dead'}})()")
        await pg.wait_for_timeout(2000); h2 = await pg.evaluate(f"(()=>{{const a={F}.animals.find(a=>a.kind==='hare'&&a.hp<9); return a?a.hp:'dead'}})()")
        print("poisoned arrow: hare hp 9 ->", h1, "-> after poison", h2, "|", await msg(pg, 2), "| shots left", await pg.evaluate("JSON.stringify(G.data.venom)"))
    # Sleeping dust at a wolf, then the draught at bedtime.
    await pg.evaluate(f"{F}.summon('wolf')"); await pg.wait_for_timeout(300)
    await pg.evaluate(f"(()=>{{const s={F}; const a=s.animals.find(a=>a.kind==='wolf'&&a.state!=='dead'); a.sprite.setPosition(s.player.x+20, s.player.y); a.sprite.setVelocity(0,0); a.charge(8); }})()")
    print("dust at wolf:", await use(pg, "pharm_sleep"), "| wolf", await pg.evaluate(f"(()=>{{const a={F}.animals.find(a=>a.kind==='wolf'); return a.state+' appeased '+a.appeased}})()"))
    await pg.wait_for_timeout(400); await pg.screenshot(path=SHOT+"pharm_wolf_asleep.png")
    await pg.evaluate("G.addItem('pharm_sleep',1,2)")
    await pg.evaluate(f"(()=>{{const s={F}; for(const a of s.animals) if(a.kind==='wolf') {{ a.sprite.setPosition(10,10); }} }})()")
    print("drink sleep:", await use(pg, "pharm_sleep"), "| hypnos", await pg.evaluate("G.songOn('hypnos')"))
    await pg.evaluate("G.data.fatigue=80; G.data.clock=G.daylight+3"); notes = await pg.evaluate("G.sleep(false,true).notes")
    print("slept rough on the draught: fatigue", await pg.evaluate("G.data.fatigue.toFixed(1)"), "|", [n for n in notes if "poppy" in n])
    # A spoiled brew: no skill, nothing helping; a toxic herb.
    await pg.evaluate("for (const a of ['Gnosis','Techne','Kardia','Metis']) G.data.aretai[a]=0; G.data.clock=G.daylight/2+3")
    await pg.evaluate(f"{U}.openBrew({F}.brewCtx())")
    said = await pg.evaluate(f"""(()=>{{G.essence.Earth=99; G.data.fatigue=0; const u={U}; u.mortar=[{{id:'Hemlock',q:1}},{{id:'Mushrooms',q:1}}]; for (const a of ['Gnosis','Techne','Metis']) G.data.aretai[a]=-30; let n=0; do {{ u.mortar=[{{id:'Hemlock',q:1}},{{id:'Mushrooms',q:1}}]; G.essence.Earth=99; u.brew(); n++; }} while (G.data.fatigue < 15 && n < 8 && G.count('Hemlock')>0 && G.count('Mushrooms')>0); return G.messages.map(m=>m.text).slice(-1)[0]+' | fatigue '+G.data.fatigue; }})()""")
    print("SPOILED:", said)
    await pg.evaluate(f"{U}.closeCraft()")
    print("ERRORS:", errs); await pg.close()

async def wild(b):
    pg, errs = await setup(b, 2, 10, wx=4, wy=0, feature="Old oaks")
    spots = await pg.evaluate(f"{Wd}.spots.map(s=>s.def.id).join(',')")
    print("forest forage:", spots)
    # Dig a mandrake by day, if there is one here.
    await pg.evaluate(f"""(()=>{{const s={Wd}; const b=s.spots[0]; s.spots.push({{k:'99,99', tx:99, ty:99, def:{{...b.def, id:'mandrake', item:'Mandrake', qty:1, regrow:20, months:[0,1,2,3,4,5,6,7,8,9,10,11]}}, base:b.base, fruit:b.fruit}}); G.data.clock=3; }})()""")
    r = await pg.evaluate(f"""(()=>{{const s={Wd}; const d=s.spots.find(x=>x.def.id==='mandrake') ?? s.spots[0]; if(!d) return 'no spots';
      const m = Object.values(s.spots).length; G.data.lore.tier.mandrake=1; G.data.month=4; G.data.fatigue=0;
      const def = d.def.id==='mandrake' ? d.def : null; if(!def) return 'no mandrake here ('+d.def.id+')';
      s.gather(d.tx, d.ty); const day = G.data.fatigue+' | '+window._log.slice(-2).join(' | ');
      s.picked()[d.k]=undefined; delete s.picked()[d.k]; G.data.clock=G.daylight+2; G.data.fatigue=0; s.gather(d.tx, d.ty);
      return day + '  ||  by night: ' + G.data.fatigue + ' | ' + window._log.slice(-2).join(' | ') + ' | fresh ' + G.isFresh('Mandrake');}})()""")
    print("mandrake:", r); await pg.evaluate("G.data.clock=3")
    await pg.evaluate("G.addItem('Mortar',1); G.addItem('Laurel',2); G.pharm.taught=true")
    await pg.evaluate(f"{U}.openBrew({Wd}.brewCtx())"); await pg.wait_for_timeout(200)
    await pg.evaluate(f"(()=>{{const u={U}; u.mortar=[{{id:'Laurel',q:1}},{{id:'Laurel',q:1}}]; u.buildBrew();}})()"); await pg.wait_for_timeout(200)
    await pg.screenshot(path=SHOT+"pharm_wild_panel.png")
    print("ctx:", await pg.evaluate(f"JSON.stringify({U}.brewAt)"), "| conds:", await pg.evaluate(f"{U}.constructor.brewPlan({U}.mortar,{U}.brewAt,false,false).conds.map(c=>c.label+' '+c.n).join('; ')"))
    await pg.evaluate(f"{U}.closeCraft()")
    # Show every new plant bearing on this map (sight), for a look.
    await pg.evaluate(f"""(()=>{{const s={Wd}; const ids=['sage','yarrow','willow','dittany','wormwood','squill','laurel','asphodel','cyclamen','wildrose','seaholly','mandrake','hellebore','henbane','hemlock'];
      for (const sp of s.spots) {{ sp.base.destroy(); sp.fruit.destroy(); }} s.spots=[];
      ids.forEach((id,i)=>{{ const x=s.player.x-112+(i%8)*32, y=s.player.y-24+Math.floor(i/8)*36; s.spots.push({{k:'t'+i, tx:0, ty:0, def:{{id, months:[0,1,2,3,4,5,6,7,8,9,10,11], regrow:1}}, base:s.add.image(x,y,'forage',id).setDepth(y+2), fruit:s.add.image(x,y,'forage',id+'_fruit').setDepth(y+3)}}); }});
      for (const a of s.animals) a.sprite.setVisible(false); }})()""")
    await pg.wait_for_timeout(300); await pg.screenshot(path=SHOT+"pharm_plants.png")
    print("ERRORS:", errs); await pg.close()

async def main():
    which = sys.argv[1:] or ["farm","wild"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        if "farm" in which: await farm(b)
        if "wild" in which: await wild(b)
        await b.close()

if __name__ == "__main__": asyncio.run(main())
