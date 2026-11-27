"""Working animals: buying a hound, donkey, ox and ard from Theron; the ox ploughing; the donkey's panniers;
the hound's scent, catch and bay; buying and riding a horse; the manger at night."""
import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, opts, choose, U, Wd
Fa = "game.scene.getScene('Farm')"; Vi = "game.scene.getScene('Village')"; Ho = "game.scene.getScene('House')"
SHOT = "/home/claude/test/"
HERD = lambda sc: f"[...{sc}.herd.values()].map(h=>h.b.name+':'+h.b.kind+'@'+(h.sprite.x|0)+','+(h.sprite.y|0)).join(' ')"

async def main():
    which = sys.argv[1:] or ["buy", "farm", "wild", "horse"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0)
        await pg.evaluate("G.data.silver = 600; G.data.fatigue = 0")
        if "buy" in which or "farm" in which or "wild" in which:
            await pg.evaluate(f"G.data.entry='N'; G.data.scene='Village'; {Wd}.goTo('Village')"); await pg.wait_for_timeout(4000)
            await pg.evaluate(f"{U}.livestock({{id:'theron', name:'Theron'}})"); await pg.wait_for_timeout(200)
            print("livestock:", await opts(pg), flush=True)
            for what in ["Buy a hunting hound", "Buy a pack donkey", "Buy a plough ox", "Buy an ard"]:
                await choose(pg, what)
            print(" bought:", await pg.evaluate("G.data.beasts.map(b=>b.name+' the '+b.kind+(b.follow?' (with you)':'')).join(', ')"), "| ard", await pg.evaluate("G.count('Ard')"), "| silver", await pg.evaluate("G.data.silver"), flush=True)
            await choose(pg, "Ask about horses"); print(" horses:", (await pg.evaluate(f"{U}.talkLast.text"))[:160], flush=True)
            await pg.evaluate(f"{U}.closeTalk()"); await pg.wait_for_timeout(1200)
            print(" in the village:", await pg.evaluate(HERD(Vi)), flush=True)
            await pg.screenshot(path=SHOT + "herd_village.png")
        if "farm" in which:
            await pg.evaluate(f"G.data.entry='W'; G.data.scene='Farm'; {Vi}.goTo('Farm')"); await pg.wait_for_timeout(4500)
            await pg.evaluate(f"{U}.closeTalk(); {Fa}.player.setPosition(30*16, 24*16)"); await pg.wait_for_timeout(1500)
            print("farm:", await pg.evaluate(HERD(Fa)), flush=True)
            ox = await pg.evaluate("G.data.beasts.find(b=>b.kind==='ox').id")
            await pg.evaluate(f"{Fa}.beastMenu(G.data.beasts.find(b=>b.kind==='ox'))"); await pg.wait_for_timeout(200)
            print(" ox menu:", await opts(pg), flush=True)
            await choose(pg, "Yoke"); await pg.wait_for_timeout(300)
            t0 = await pg.evaluate("Object.values(G.data.ground).filter(v=>v==='tilled').length")
            # clear a field and walk the plough across it, back and forth
            await pg.evaluate(f"(()=>{{const f={Fa}; for(let y=22;y<29;y++) for(let x=26;x<40;x++){{ const t=f.objects.getTileAt(x,y); if(t&&t.index!==-1) f.objects.removeTileAt(x,y); }} f.player.setPosition(27*16, 23*16); }})()")
            for key, ms in [("d", 1800), ("s", 300), ("a", 1800), ("s", 300), ("d", 1800)]:
                await pg.keyboard.down(key); await pg.wait_for_timeout(ms); await pg.keyboard.up(key)
            t1 = await pg.evaluate("Object.values(G.data.ground).filter(v=>v==='tilled').length")
            print(" ploughed:", t1 - t0, "furrows | ox work", await pg.evaluate("JSON.stringify(G.data.beasts.find(b=>b.kind==='ox').work)"), "| yoked", await pg.evaluate(f"{Fa}.yoked===\"{ox}\""), "| energy", await pg.evaluate("100-Math.round(G.data.fatigue)"), flush=True)
            await pg.screenshot(path=SHOT + "herd_plough.png")
            await pg.evaluate(f"{Fa}.beastMenu(G.data.beasts.find(b=>b.kind==='ox'))"); await pg.wait_for_timeout(200)
            print(" unyoked:", await pg.evaluate(f"{Fa}.yoked"), "|", await log(pg, 1), flush=True)
            # the donkey's panniers take what the pack can't
            await pg.evaluate("(()=>{ for(let i=0;i<G.data.slots.length;i++) if(!G.data.slots[i]) G.data.slots[i]={id:'Stone',qty:99}; })()")
            left = await pg.evaluate("G.addItem('Wood', 5)"); await pg.wait_for_timeout(400)
            print(" pack full, +5 wood: left over", left, "| panniers", await pg.evaluate("JSON.stringify(G.data.beasts.find(b=>b.kind==='donkey').pack.filter(Boolean))"), "|", await log(pg, 1), flush=True)
            await pg.evaluate(f"{Fa}.beastMenu(G.data.beasts.find(b=>b.kind==='donkey'))"); await pg.wait_for_timeout(200)
            print(" donkey menu:", await opts(pg), flush=True)
            await choose(pg, "Open the panniers"); await pg.wait_for_timeout(300)
            await pg.screenshot(path=SHOT + "herd_panniers.png")
            await pg.evaluate(f"{U}.closeChest(); G.data.slots = G.data.slots.map(s=>s&&s.id==='Stone'?null:s)")
            # leave the donkey at home; it wanders in the pen
            await pg.evaluate(f"{Fa}.beastMenu(G.data.beasts.find(b=>b.kind==='donkey'))"); await pg.wait_for_timeout(200)
            await choose(pg, "Leave"); await pg.wait_for_timeout(3000)
            print(" donkey at home:", await pg.evaluate("G.data.beasts.find(b=>b.kind==='donkey').follow"), await pg.evaluate(HERD(Fa)), flush=True)
            # night: the manger feeds them, then runs out
            await pg.evaluate("G.data.manger = 2")
            notes = await pg.evaluate("G.sleep(false,false).notes.filter(n=>/hungry|manger/.test(n)).join(' | ')")
            print(" night, manger 2 (3 goats, ox, donkey):", notes, "| manger", await pg.evaluate("G.data.manger"), "| hungry:", await pg.evaluate("G.data.beasts.filter(b=>b.hungry===G.dayNumber).map(b=>b.name).join(',')"), flush=True)
        if "wild" in which:
            await pg.evaluate(f"G.data.beasts.forEach(b=>b.follow = b.kind==='hound'); G.data.screens['3,0']={{terrain:10,special:false,feature:'Old oak',cleared:[]}}; G.data.wx=3; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; game.scene.getScenes(true).find(s=>s.goTo).goTo('Wild')")
            await pg.wait_for_timeout(5000)
            print("wild:", await pg.evaluate(HERD(Wd)), "|", await pg.evaluate("window._log.filter(t=>/nose|scent/.test(t)).join(' | ')"), flush=True)
            await pg.evaluate(f"(()=>{{const s={Wd}; for(let y=8;y<22;y++) for(let x=10;x<30;x++) s.objects.putTileAt(-1,x,y); s.player.setPosition(20*16, 15*16); s.player.setVelocity(0,0); for(const a of [...s.animals]) {{ a.sprite.destroy(); s.animals.splice(s.animals.indexOf(a),1); }} }})()")
            await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('hare'); const a=s.animals[s.animals.length-1]; a.sprite.setPosition(s.player.x+70, s.player.y+20); a.appeased=true; a.state='idle'; a.timer=99; a.rolled=true; [...s.herd.values()][0].huntT=0; }})()")
            await pg.wait_for_timeout(3000)
            print(" hare:", await pg.evaluate("window._log.filter(t=>/runs down/.test(t)).join(' | ')"), flush=True)
            await pg.evaluate(f"(()=>{{const s={Wd}; s.summon('deer'); const a=s.animals[s.animals.length-1]; window._deer=a; a.sprite.setPosition(s.player.x-90, s.player.y-30); a.state='idle'; a.timer=99; a.rolled=true; const h=[...s.herd.values()][0]; h.goal=undefined; h.huntT=0; }})()")
            for i in range(8):
                await pg.wait_for_timeout(500)
                if await pg.evaluate("window._deer.held > 0"): break
            print(" deer:", await pg.evaluate("[window._deer.held.toFixed(1), window._deer.state]"), "|", await pg.evaluate("window._log.filter(t=>/bay/.test(t)).join(' | ')"), flush=True)
            await pg.screenshot(path=SHOT + "herd_bay.png")
        if "horse" in which:
            await pg.evaluate(f"G.data.silver = 450; window._hk = {{id:'horsebreeder', title:'A horse-breeder', patron:'Poseidon'}}")
            sc = Wd if await pg.evaluate("game.scene.isActive('Wild')") else Ho
            if sc == Ho:
                await pg.evaluate(f"G.data.screens['3,0']={{terrain:10,special:false,feature:'Old oak',cleared:[]}}; G.data.wx=3; G.data.wy=0; G.data.entry='W'; G.data.scene='Wild'; {Ho}.goTo('Wild')"); await pg.wait_for_timeout(5000)
            await pg.evaluate(f"{Wd}.hutSpecial(window._hk, 'Kleon and his sons', ()=>{{}})"); await pg.wait_for_timeout(200)
            print("horse-breeder:", (await pg.evaluate(f"{U}.talkLast.text"))[:150], "|", await opts(pg), flush=True)
            await choose(pg, "Buy the bay mare"); await pg.wait_for_timeout(1200)
            print(" bought:", (await pg.evaluate(f"{U}.talkLast.text"))[:120], "| silver", await pg.evaluate("G.data.silver"), flush=True)
            await pg.evaluate(f"{U}.closeTalk(); (()=>{{const s={Wd}; for(let y=8;y<22;y++) for(let x=6;x<34;x++) s.objects.putTileAt(-1,x,y); s.player.setPosition(10*16, 15*16); }})()"); await pg.wait_for_timeout(800)
            await pg.keyboard.down("d"); await pg.wait_for_timeout(500); v0 = await pg.evaluate(f"Math.round({Wd}.player.body.velocity.x)"); await pg.keyboard.up("d")
            await pg.evaluate(f"{Wd}.beastMenu(G.data.beasts.find(b=>b.kind==='steed'))"); await pg.wait_for_timeout(200)
            print(" horse menu:", await opts(pg), flush=True)
            await choose(pg, "Ride"); await pg.wait_for_timeout(300)
            await pg.keyboard.down("d"); await pg.wait_for_timeout(500); v1 = await pg.evaluate(f"Math.round({Wd}.player.body.velocity.x)"); await pg.keyboard.up("d")
            print(" walking", v0, "px/s, riding", v1, "px/s | riding:", await pg.evaluate(f"{Wd}.riding!==''"), flush=True)
            await pg.screenshot(path=SHOT + "herd_ride.png")
            # a boar charges: the riding horse may rear (try a few)
            thrown = 0
            for i in range(6):
                await pg.evaluate(f"(()=>{{const s={Wd}; if(!s.riding) s.mountBeast(G.data.beasts.find(b=>b.kind==='steed'), true); s.summon('boar'); const a=s.animals[s.animals.length-1]; a.sprite.setPosition(s.player.x+60, s.player.y); a.charge(2); }})()")
                await pg.wait_for_timeout(400)
                if not await pg.evaluate(f"!!{Wd}.riding"): thrown += 1
            print(" charged 6 times, thrown", thrown, "|", await pg.evaluate("window._log.filter(t=>/rears/.test(t)).slice(-1).join('')"), flush=True)
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
