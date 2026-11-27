import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, Wd
SHOT = "/home/claude/test/"

# Carve deep water (tile 20) in a vertical strip of tile columns x0..x1, leaving four rows of land at top and bottom, on the Wild objects layer.
def carve(x0, x1):
    return f"(()=>{{const s={Wd}; const o=s.objLayer(); for(let y=0;y<o.height;y++) for(let x=0;x<o.width;x++) {{ const t=o.getTileAt(x,y); if(t&&(t.index===20||t.index===42)) o.removeTileAt(x,y); }} for(let y=4;y<o.height-4;y++) for(let x={x0};x<={x1};x++) o.putTileAt(20,x,y); return o.width+'x'+o.height; }})()"

MAKE = """(kind,x,y)=>{const s=%s; const A=window._A; const a=new A(s,kind,x,y,new Phaser.Geom.Rectangle(x-20,y-20,40,40)); s.animals.push(a); return a;}""" % Wd

async def beast(pg, name, kind, x, y, extra=""):
    await pg.evaluate(f"(()=>{{const mk={MAKE}; for(const a of [...{Wd}.animals]) if(a!==window._keep) {{ a.sprite.destroy(); {Wd}.animals.splice({Wd}.animals.indexOf(a),1); }} window.{name}=mk('{kind}',{x},{y}); {extra} }})()")

async def pos(pg, name):
    return await pg.evaluate(f"(()=>{{const a=window.{name}; return [Math.round(a.sprite.x), Math.round(a.sprite.y), a.state, {Wd}.depthAt(a.sprite.x,a.sprite.y+5), Math.round(a.breath*10)/10]}})()")

async def main():
    which = sys.argv[1:] or ["water", "temper"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0)
        await pg.evaluate(f"G.essence.Air=99; {Wd}.player.setPosition(60, 60); window._A={Wd}.animals.find(a=>!a.def.flies && a.constructor.name!==window._x)?.constructor; 0")
        print("animal class:", await pg.evaluate("!!window._A"), flush=True)
        if "water" in which:
            # a narrow channel, one tile: a deer walking east swims across
            print("map", await pg.evaluate(carve(20, 20)), flush=True)
            await beast(pg, "_d", "deer", 18 * 16, 15 * 16, "window._d.appeased=true; window._d.state='walk'; window._d.tx=26*16; window._d.ty=15*16; window._d.timer=99;")
            seen = []
            for i in range(14):
                await pg.wait_for_timeout(1000); seen.append(await pos(pg, "_d"))
                if seen[-1][0] > 21 * 16 + 8: break
            print("narrow channel:", seen[-1], "| max breath", max(s[4] for s in seen), "| crossed:", seen[-1][0] > 21 * 16 + 8, flush=True)
            # a wide water, twelve tiles: it goes along the bank, never into the deep
            await pg.evaluate(carve(20, 31))
            await beast(pg, "_d", "deer", 18 * 16, 15 * 16, "window._d.appeased=true; window._d.state='walk'; window._d.tx=34*16; window._d.ty=15*16; window._d.timer=99;")
            deep = 0; last = None
            for i in range(6):
                await pg.wait_for_timeout(700); last = await pos(pg, "_d"); deep += last[3] == 2
            print("wide water, walking at it:", last, "| frames in deep:", deep, flush=True)
            # bolting toward the water from the player standing west of it
            await beast(pg, "_d", "deer", 19 * 16, 15 * 16)
            await pg.evaluate(f"{Wd}.player.setPosition(16*16, 15*16); window._d.bolt({{x:16*16,y:15*16}})")
            deep = 0
            for i in range(6):
                await pg.wait_for_timeout(300); last = await pos(pg, "_d"); deep += last[3] == 2
            print("bolting toward wide water:", last, "| frames in deep:", deep, flush=True)
            # caught out in the deep: it makes for the nearest bank
            await beast(pg, "_d", "deer", 22 * 16, 15 * 16, "window._d.appeased=true; window._d.state='walk'; window._d.tx=26*16; window._d.ty=15*16; window._d.timer=99; window._d.breath=1;")
            for i in range(10):
                await pg.wait_for_timeout(1000); last = await pos(pg, "_d")
                if last[3] < 2: break
            print("out of its depth, breath short (walking east, nearer bank is west):", last, flush=True)
            # a wolf hunting you while you swim in the wide water: it waits on the bank
            await pg.evaluate(f"G.data.favor.Poseidon=12; G.essence.Air=20; {Wd}.player.setPosition(24*16, 15*16); {Wd}.player.setVelocity(0,0)")
            await beast(pg, "_w", "wolf", 17 * 16, 15 * 16, "window._w.charge(30); window._tr=[]; const S=%s; const st=S.steer.bind(S); S.steer=(a,w,dt)=>{ if(a===window._w){ const b=[a.gBase.x|0,a.gBase.y|0]; st(a,w,dt); window._tr.push([a.sprite.x|0,a.sprite.y|0,w,b.join(','),(a.gBase.x|0)+','+(a.gBase.y|0),a.state].join(' ')); } else st(a,w,dt); };" % Wd)
            deep = 0
            for i in range(8):
                await pg.wait_for_timeout(500); last = await pos(pg, "_w"); deep += last[3] == 2
            print("wolf hunting a swimmer:", last, "| frames in deep:", deep, "| player at", await pg.evaluate(f"[{Wd}.player.x|0,{Wd}.player.y|0, {Wd}.paused, {Wd}.leaving]"), await log(pg, 2), flush=True)
            tr = await pg.evaluate("window._tr")
            first = next((i for i, t in enumerate(tr) if t.split()[2] == "2"), None)
            print("trace around first deep:", tr[max(0, (first or 0) - 12):(first or 0) + 4] if first is not None else "never deep", flush=True)
            await pg.screenshot(path=SHOT + "temper_bank.png")
            await pg.evaluate(carve(99, 98))
        if "temper" in which:
            # a boar: you stand your ground, it keeps at you
            await pg.evaluate(f"{Wd}.player.setPosition(15*16, 12*16); G.data.fatigue=0")
            await beast(pg, "_b", "boar", 15 * 16 + 60, 12 * 16, "window._b.charge(6);")
            await pg.wait_for_timeout(4000)
            print("boar, you stand still 4 s:", await pos(pg, "_b"), flush=True)
            # you back away: it breaks off
            await pg.keyboard.down("a"); await pg.wait_for_timeout(1600); await pg.keyboard.up("a")
            print("boar, you walk away:", await pos(pg, "_b"), "|", await log(pg, 1), flush=True)
            await pg.wait_for_timeout(1500)
            print("  and after:", await pos(pg, "_b"), "rolled", await pg.evaluate("window._b.rolled"), flush=True)
            # a wolf: you walk away, it keeps on
            await pg.evaluate(f"{Wd}.player.setPosition(22*16, 12*16); G.data.fatigue=0; {Wd}.invuln=99")
            await beast(pg, "_w", "wolf", 22 * 16 + 60, 12 * 16, "window._w.charge(5);")
            await pg.keyboard.down("a"); await pg.wait_for_timeout(2000); await pg.keyboard.up("a")
            await pg.wait_for_timeout(5000)
            print("wolf, after you walk away and 7 s (old rule gave up at 5 s):", await pos(pg, "_w"), flush=True)
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
