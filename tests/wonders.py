"""Thaumatapoiia: learning from Lykos, the panel, Keen Edge and Returning on the spear (and what they do),
Warding on a helmet, a three-day Monster-Slayer that settles overnight, Hephaestus' Flame Weapon, a failure."""
import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, opts, choose, U, Wd
Vi = "game.scene.getScene('Village')"
SHOT = "/home/claude/test/"
ON = lambda item: f"JSON.stringify(G.data.wonders.on['{item}'] ?? [])"

async def work(pg, item, wid, choice=""):
    await pg.evaluate(f"(()=>{{G.essence = {{...G.essenceMax}}; G.data.fatigue = 0; const u={U}; u.wSel='{item}'; u.wWid='{wid}'; u.wChoice='{choice}'; u.buildWonders(); u.beginWonder(); }})()")
    await pg.wait_for_timeout(300)
    return await log(pg, 1)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0)
        await pg.evaluate("G.data.silver = 300; G.data.fatigue = 0; Object.assign(G.data.currencies, {Kleos: 10, Pathos: 10, Ambrosia: 2}); for (const k of ['Techne','Pneuma','Gnosis','Phoenix','Ourania']) G.data.aretai[k] = 12")
        await pg.evaluate("for (const [k,n] of [['Copper',8],['OliveOil',3],['Loadstone',1],['Hide',2],['Tusk',1],['Wood',4],['GoldDust',1],['Wine',1],['Kynee',1]]) G.addItem(k,n)")
        await pg.evaluate(f"G.data.entry='N'; G.data.scene='Village'; {Wd}.goTo('Village')"); await pg.wait_for_timeout(4000)
        lyk = f"{Vi}.targets.find(t=>t.label==='Talk to Lykos').act()"
        await pg.evaluate(f"G.data.clock=3; {lyk}"); await pg.wait_for_timeout(200)
        print("Lykos:", await opts(pg), flush=True)
        await choose(pg, "Ask Lykos about the wonder-craft"); print(" at friendship 0:", (await pg.evaluate(f"{U}.talkLast.text"))[:110], flush=True)
        await pg.evaluate(f"G.npcRec('lykos').rel = 4; {lyk}"); await pg.wait_for_timeout(200)
        await choose(pg, "Ask Lykos about the wonder-craft"); print(" at 4:", (await pg.evaluate(f"{U}.talkLast.text"))[-260:], flush=True)
        print(" known:", await pg.evaluate("G.data.wonders.known.join(',')"), flush=True)
        await pg.evaluate(lyk); await pg.wait_for_timeout(200)
        await choose(pg, "Work a wonder at Lykos"); await pg.wait_for_timeout(300)
        print(" panel:", await pg.evaluate(f"!!{U}.craft"), "| things:", await pg.evaluate(f"game.scene.getScene('UI').constructor.wonderItems().join(',')"), "| silver", await pg.evaluate("G.data.silver"), flush=True)
        await pg.evaluate(f"(()=>{{const u={U}; u.wSel='spear'; u.wWid='keen'; u.buildWonders(); }})()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=SHOT + "wonders_panel.png")
        print(" keen edge:", await work(pg, "spear", "keen"), flush=True)
        await pg.evaluate(lyk); await pg.wait_for_timeout(150); await choose(pg, "Work a wonder at Lykos")
        print(" returning:", await work(pg, "spear", "returning"), flush=True)
        print(" on the spear:", await pg.evaluate(ON("spear")), "| hubris", await pg.evaluate("G.data.currencies.Hubris"), flush=True)
        await pg.evaluate(lyk); await pg.wait_for_timeout(150); await choose(pg, "Work a wonder at Lykos")
        print(" warding (beasts) on the cap:", await work(pg, "Kynee", "warding", "beast"), flush=True)
        # learn the deep workings, and the bane: three days
        await pg.evaluate(f"G.npcRec('lykos').rel = 8; G.data.lore.tier.boar = 2; G.note('kill:boar'); {lyk}"); await pg.wait_for_timeout(150)
        await choose(pg, "Ask Lykos what more"); print(" at 8:", (await pg.evaluate(f"{U}.talkLast.text"))[-120:], flush=True)
        await pg.evaluate(lyk); await pg.wait_for_timeout(150); await choose(pg, "Work a wonder at Lykos")
        print(" bane begun:", await work(pg, "spear", "bane", "boar"), "| work", await pg.evaluate("JSON.stringify(G.data.wonders.work)"), flush=True)
        await pg.evaluate(f"{U}.continueWonder()"); print(" same day again:", await pg.evaluate("G.data.wonders.work.done"), flush=True)
        for d in range(2):
            await pg.evaluate("G.data.wonders.work.last = G.dayNumber - 1; G.data.fatigue = 0; G.data.clock = 2; G.essence = {...G.essenceMax}")
            await pg.evaluate(f"{U}.continueWonder()"); await pg.wait_for_timeout(200)
        print(" bane finished:", await log(pg, 1), flush=True)
        notes = await pg.evaluate("G.sleep(false,false).notes.filter(n=>/settle|drift/.test(n)).join(' | ')")
        print(" night:", notes, "| on spear:", await pg.evaluate(ON("spear")), flush=True)
        # Hephaestus' own: the flame
        await pg.evaluate(f"G.data.favor.Hephaestus = 4; G.data.fatigue = 0; G.data.clock = 5; {lyk}"); await pg.wait_for_timeout(150); await choose(pg, "Work a wonder at Lykos")
        await pg.evaluate(f"(()=>{{const u={U}; u.wSel='sword'; u.wWid=''; u.buildWonders(); }})()")
        print(" flame on the axe:", await work(pg, "axe", "flame"), flush=True)
        # a failure: poor odds
        await pg.evaluate(f"for (const k of ['Techne','Pneuma']) G.data.aretai[k] = -30; G.data.fatigue = 0; {lyk}"); await pg.wait_for_timeout(150); await choose(pg, "Work a wonder at Lykos")
        print(" masterwork, hopeless:", await work(pg, "hoe", "masterwork"), "| gold dust left", await pg.evaluate("G.count('GoldDust')"), flush=True)
        await pg.evaluate("for (const k of ['Techne','Pneuma']) G.data.aretai[k] = 12")
        # what they do, in the wild
        await pg.evaluate(f"G.data.screens['3,0']={{terrain:10,special:false,feature:'Old oak',cleared:[]}}; G.data.wx=3; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; {Vi}.goTo('Wild')"); await pg.wait_for_timeout(5000)
        await pg.evaluate(f"(()=>{{const s={Wd}; for(let y=8;y<22;y++) for(let x=10;x<30;x++) s.objects.putTileAt(-1,x,y); s.player.setPosition(20*16, 15*16); for(const a of [...s.animals]) {{ a.sprite.destroy(); s.animals.splice(s.animals.indexOf(a),1); }} }})()")
        await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('boar'); const a=s.animals[s.animals.length-1]; window._b=a; a.state='idle'; a.timer=99; a.rolled=true; a.sprite.setPosition(s.player.x+60, s.player.y); a.hp = 10; G.removeItem('spear', 1); s.landSpear(a.sprite.x, a.sprite.y + 3, 'spear'); }})()")
        await pg.wait_for_timeout(300)
        print("spear at a boar (hp 10; 3 x3 + keen, bane):", await log(pg, 3), "| boar hp", await pg.evaluate("window._b.hp"), "| spear in pack:", await pg.evaluate("G.count('spear')"), flush=True)
        await pg.evaluate(f"(()=>{{const s={Wd}; G.removeItem('spear', 1); s.landSpear(s.player.x + 80, s.player.y - 40, 'spear'); }})()"); await pg.wait_for_timeout(200)
        print(" thrown at nothing:", await log(pg, 1), "| in pack:", await pg.evaluate("G.count('spear')"), flush=True)
        # warding: wear the cap, a wolf bites
        await pg.evaluate("G.wear ? G.wear('Kynee') : 0"); await pg.wait_for_timeout(100)
        print(" worn:", await pg.evaluate("JSON.stringify(G.data.worn)"), flush=True)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('wolf'); const a=s.animals[s.animals.length-1]; a.state='idle'; s.invuln=0; G.data.vitality=G.vitalityMax; s.struck(a); }})()"); await pg.wait_for_timeout(200)
        print(" a wolf's bite:", await pg.evaluate("window._log.filter(t=>/wolf|grey/.test(t)).slice(-1).join('')"), flush=True)
        print(" item label:", await pg.evaluate(f"G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='axe'); 0"), flush=True)
        await pg.wait_for_timeout(300); print("  ", await pg.evaluate(f"{U}.itemName.text"), flush=True)
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
