"""Friends who join you: a village friend's big quest, a follower who fights, a housemate's chores, a wedding, a wanderer joining."""
import asyncio, sys
sys.path.insert(0, "tests")
from playwright.async_api import async_playwright
from wayfarers import setup, spawn, talk, choose, opts, log, G0
U="game.scene.getScene('UI')"; Wd="game.scene.getScene('Wild')"; V="game.scene.getScene('Village')"; F="game.scene.getScene('Farm')"; Ho="game.scene.getScene('House')"
msg = lambda pg, n=1: pg.evaluate(f"G.messages.map(m=>m.text).slice(-{n}).join(' | ')")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 4)
        await pg.evaluate("G.data.aretai.Phoenix = 6; G.data.silver = 200")
        print("cap:", await pg.evaluate("G.friendCap"))
        # --- A wanderer: a traveler; ask where bound, share food, ask to join, give a cloak.
        print("spawned:", await spawn(pg, "traveler"))
        await pg.evaluate("G.addItem('Millet', 3); G.addItem('Cloak', 1); G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Millet')")
        print(" talk:", await talk(pg))
        nm = await pg.evaluate(f"{G0}.people[0].folk.name")
        await choose(pg, "Ask " + nm + " where"); await choose(pg, "Share"); print(" after:", await opts(pg))
        await choose(pg, "Ask " + nm + " to come"); print(" ask:", await opts(pg))
        await choose(pg, "Give"); print(" join:", await opts(pg))
        await choose(pg, "Travel with me"); await pg.wait_for_timeout(600)
        print(" joined:", await log(pg, 2), "| friends:", await pg.evaluate("G.data.friends.map(f=>f.name+':'+f.role+':'+f.trade).join(',')"), "| mates:", await pg.evaluate(f"{Wd}.mates.length"))
        # The follower fights a charging boar.
        await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('boar'); const a=s.animals[s.animals.length-1]; a.sprite.setPosition(s.player.x+70, s.player.y); a.charge(8); G.data.vitality=G.vitalityMax; }})()")
        await pg.wait_for_timeout(5000)
        print(" fight:", await msg(pg, 4))
        await pg.screenshot(path="/home/claude/test/friends_wild.png")
        # --- The village: get close to someone, take their trouble on, finish it, and they come to live with you.
        await pg.evaluate(f"G.data.entry='N'; G.data.scene='Village'; {Wd}.goTo('Village')"); await pg.wait_for_timeout(4000)
        info = await pg.evaluate(f"(()=>{{const s={V}; const w=s.walkers.find(x=>x.w.folk.age==='adult'); return [w.w.folk.id, w.w.folk.name, w.h.trade.id]; }})()")
        print("village friend:", info)
        fid = info[0]
        await pg.evaluate(f"G.npcRec('{fid}').rel = 8")
        talkF = f"(()=>{{const s={V}; const x=s.walkers.find(x=>x.w.folk.id==='{fid}'); s.talkToFolk(x.w, x.h); }})()"
        await pg.evaluate(talkF); await pg.wait_for_timeout(200); print(" opts:", await opts(pg))
        await choose(pg, "Is something"); print(" quest:", (await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ')"))[:300])
        await choose(pg, "I'll do it")
        # satisfy it
        await pg.evaluate(f"""(()=>{{const q={{potter:[['Ochre',2],['Clay',8],['Figurine',1]],weaver:[['Pearl',2]],carpenter:[['Wood',25],['Amber',1]],basketmaker:[['Fiber',20],['Ivy',3]],midwife:[['Moly',1]],baker:[['Millet',12],['Chickpeas',4],['Honey',2]],charcoal:[['Copper',6]]}}['{info[2]}'];
          if (q) for (const [i,n] of q) G.addItem(i,n); else {{ const note={{goatherd:'kill:wolf',beekeeper:'kill:bear',oldsoldier:'kill:brigand'}}['{info[2]}']; G.note(note, 3); }} }})()""")
        await pg.evaluate(talkF); await pg.wait_for_timeout(200); print(" opts now:", await opts(pg))
        await choose(pg, "Give them" if await pg.evaluate(f"{U}.talkOpts.some(o=>o.label.startsWith('Give them'))") else "Tell them")
        print(" done:", (await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ')"))[:260])
        await choose(pg, "Ask " + info[1]); print(" join opts:", await opts(pg))
        await choose(pg, "Come and live"); await choose(pg, "Water the fields")
        print(" friends:", await pg.evaluate("G.data.friends.map(f=>f.name+':'+f.role+':'+(f.chore||'')).join(', ')"))
        print(" journal:", (await pg.evaluate(f"(()=>{{ {U}.openJournal(); const t={U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' '); {U}.closeTalk(); return t.slice(t.indexOf('COMPANIONS')); }})()"))[:400])
        # --- Sleep: the housemate waters the fields.
        await pg.evaluate("G.data.ground['30,18']='tilled'")
        print("chores:", await pg.evaluate("G.sleep(false,false).notes.filter(n=>G.data.friends.some(f=>n.includes(f.name))).join(' | ')"))
        # --- Marry the traveler: beloved, and a garland.
        tr = await pg.evaluate("G.data.friends.find(f=>f.from==='road').id")
        await pg.evaluate(f"G.npcRec('{tr}').rel = 12; G.addItem('Garland',1); G.data.selected=G.data.slots.findIndex(q=>q&&q.id==='Garland')")
        await pg.evaluate(f"(()=>{{const s={V}; s.talkToFriend(G.data.friends.find(f=>f.id==='{tr}')); }})()"); await pg.wait_for_timeout(200)
        print("friend opts:", await opts(pg))
        await choose(pg, "Ask " + nm + " to marry"); print(" wedding:", (await pg.evaluate(f"{U}.talkPanel.list.filter(o=>o.type==='Text').map(o=>o.text).join(' / ')"))[:300])
        await pg.evaluate(f"{U}.closeTalk()")
        print(" spouse:", await pg.evaluate("G.spouse && G.spouse.name"), "| comfort:", await pg.evaluate("G.homeComfort"))
        # Home: the spouse in the house, the housemate on the farm by day.
        await pg.evaluate(f"G.data.entry='S'; G.data.scene='Farm'; {V}.goTo('Farm')"); await pg.wait_for_timeout(3500)
        print("farm mates:", await pg.evaluate(f"{F}.mates.map(m=>m.f.name+':'+m.mode).join(',')"))
        await pg.evaluate(f"{F}.enterHouse()"); await pg.wait_for_timeout(2500)
        print("house mates:", await pg.evaluate(f"{Ho}.mates.map(m=>m.f.name+':'+m.f.role).join(',')"))
        await pg.screenshot(path="/home/claude/test/friends_house.png")
        print("errors:", errs)
        await b.close()
asyncio.run(main())
