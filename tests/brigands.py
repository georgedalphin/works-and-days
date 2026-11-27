import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, spawn, opts, choose, U, Wd
SHOT = "/home/claude/test/"
G0 = f"{Wd}.ways.find(g=>g.def.id==='brigands')"
TALK = f"(()=>{{const t={U}.talkLast; return t ? (t.title+' | '+t.sub+' | '+t.text).slice(0,260) : ''}})()"

async def band(pg, cut, x=None, y=None):
    ok = await spawn(pg, "brigands")
    await pg.evaluate(f"(()=>{{const g={G0}; g.cutthroat={str(cut).lower()}; const p={Wd}.player; g.foes.forEach((a,i)=>a.sprite.setPosition(p.x-40-i*10, p.y+(i%2)*10)); }})()")
    return ok

async def main():
    which = sys.argv[1:] or ["robbers", "cutthroats", "leave"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 4, 0)
        await pg.evaluate(f"G.data.silver=40; {Wd}.player.setPosition(12*16, 15*16); G.data.fatigue=0")
        print("cutthroat chance here (4 out, day):", await pg.evaluate(f"{Wd}.cutthroatChance"), flush=True)
        if "robbers" in which:
            print("robbers:", await band(pg, False), flush=True)
            await pg.evaluate(f"{U}.closeTalk(); {Wd}.brigandsAttack({G0}, 'Test.'); {Wd}.invuln=99")
            await pg.wait_for_timeout(600)
            # hurt: they offer quarter
            await pg.evaluate("G.data.vitality = Math.floor(G.vitalityMax*0.3)"); await pg.wait_for_timeout(600)
            print(" phase:", await pg.evaluate(f"{G0}.phase"), "| talk:", await pg.evaluate(TALK), flush=True)
            print(" options:", await opts(pg), flush=True)
            await choose(pg, "Throw them your purse"); await pg.wait_for_timeout(400)
            print(" paid:", await pg.evaluate(f"[{G0}?.phase, G.data.silver]"), "|", await log(pg, 1), flush=True)
            # a new band: you run, they let you go
            await pg.evaluate("G.data.vitality = G.vitalityMax; G.data.silver=40")
            await band(pg, False)
            await pg.evaluate(f"{U}.closeTalk(); {Wd}.brigandsAttack({G0}, 'Test.'); {Wd}.invuln=99"); await pg.wait_for_timeout(500)
            print(" before running:", await pg.evaluate(f"[{G0}.phase, {Wd}.ways.length, {Wd}.player.x|0, G.data.vitality, G.vitalityMax]"), flush=True)
            await pg.evaluate(f"{Wd}.player.setPosition({Wd}.player.x+200, {Wd}.player.y)"); await pg.wait_for_timeout(600)
            print(" ran:", await pg.evaluate(f"{G0}.phase"), "|", await log(pg, 1), flush=True)
            # quarter with an empty purse: they take the best thing in your pack
            await pg.evaluate(f"G.data.silver=0; G.addItem('Amber', 2); {Wd}.player.setPosition(12*16, 15*16)")
            await band(pg, False)
            await pg.evaluate(f"{U}.closeTalk(); {Wd}.brigandsAttack({G0}, 'Test.'); {Wd}.invuln=99"); await pg.wait_for_timeout(400)
            print(" phase after attack:", await pg.evaluate(f"[{Wd}.ways.map(g=>g.def.id+':'+g.phase).join(','), {U}.talkLast?.sub]"), flush=True)
            await pg.evaluate("G.data.vitality = 2"); await pg.wait_for_timeout(600)
            print(" phase after hurt:", await pg.evaluate(f"[{Wd}.ways.map(g=>g.def.id+':'+g.phase).join(','), {U}.talkLast?.sub]"), flush=True)
            print(" empty purse options:", await opts(pg), flush=True)
            await choose(pg, "Let them take"); await pg.wait_for_timeout(300)
            print(" took:", await log(pg, 1), "| amber left", await pg.evaluate("G.count('Amber')"), flush=True)
        if "cutthroats" in which:
            await pg.evaluate(f"G.data.vitality = G.vitalityMax; G.data.silver=40; {Wd}.player.setPosition(12*16, 15*16)")
            await band(pg, True)
            await pg.evaluate(f"{Wd}.parley({G0})"); await pg.wait_for_timeout(300)
            print("cutthroat parley:", await pg.evaluate(TALK), flush=True)
            print(" options:", await opts(pg), flush=True)
            await choose(pg, "Fight them"); await pg.wait_for_timeout(300)
            await pg.evaluate(f"{Wd}.invuln=99; G.data.vitality = Math.floor(G.vitalityMax*0.3)"); await pg.wait_for_timeout(800)
            print(" hurt, no quarter:", await pg.evaluate(f"{G0}.phase"), await pg.evaluate(f"{U}.talkPanel ? 'talk open' : 'no talk'"), flush=True)
            await pg.evaluate(f"{Wd}.player.setPosition({Wd}.player.x+200, {Wd}.player.y)"); await pg.wait_for_timeout(1200)
            print(" ran 200 px:", await pg.evaluate(f"[{G0}.phase, ...{G0}.foes.map(a=>a.state)]"), flush=True)
            lt = await pg.evaluate("G.data.lifeThread")
            await pg.evaluate(f"G.addItem('Amber', 3); {Wd}.struckDown({G0}.foes[0])"); await pg.wait_for_timeout(500)
            print(" struck down:", await pg.evaluate("window._log.filter(t=>t.includes('dead in the road')).join(' | ')"), "| silver", await pg.evaluate("G.data.silver"), "| thread", lt, "->", await pg.evaluate("G.data.lifeThread"), flush=True)
        if "leave" in which:
            await pg.evaluate(f"G.data.scene='Wild'; {Wd}.scene.restart()"); await pg.wait_for_timeout(2500)
            n0 = await pg.evaluate(f"{Wd}.animals.filter(a=>!a.def.flies).length")
            print("creatures:", n0, await pg.evaluate(f"{Wd}.fauna.map(f=>f.join(':')).join(' ')"), flush=True)
            # one walks off the west edge
            await pg.evaluate(f"(()=>{{const a={Wd}.animals.find(a=>!a.def.flies); window._gone=a; a.sprite.setPosition(-20, 200); }})()"); await pg.wait_for_timeout(300)
            print(" off the edge, removed:", await pg.evaluate(f"!{Wd}.animals.includes(window._gone)"), "| arrivals due:", await pg.evaluate(f"{Wd}.arrivals.map(t=>Math.round(t))"), flush=True)
            # hurry the newcomer
            await pg.evaluate(f"{Wd}.arrivals=[0.2]; window._before={Wd}.animals.slice()"); await pg.wait_for_timeout(1200)
            nw = await pg.evaluate(f"(()=>{{const s={Wd}; const a=s.animals.find(a=>!window._before.includes(a)); if(!a) return null; const v=s.cameras.main.worldView; return [a.kind, a.sprite.x|0, a.sprite.y|0, Phaser.Geom.Rectangle.Contains(v,a.sprite.x,a.sprite.y), Math.round(Math.hypot(a.sprite.x-s.player.x,a.sprite.y-s.player.y))]; }})()")
            print(" wandered in: [kind, x, y, in view?, distance]", nw, "| paused", await pg.evaluate(f"[{Wd}.paused, {Wd}.arrivals]"), flush=True)
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
