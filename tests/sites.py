import asyncio, sys, json
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, U, Wd
SHOT = "/home/claude/test/"
COL = {-1: None, 9: (40,70,30), 43: (150,140,115), 45: (156,58,42), 20: (60,110,190), 42: (110,170,210), 6: (130,125,115), 8: (110,105,95), 4: (90,120,60), 7: (40,110,40), 13: (110,140,80), 30: (30,80,50), 12: (220,190,90), 23: (60,150,120), 5: (80,140,60), 32: (120,100,60), 31: (140,160,90)}
GCOL = {3: (190,160,110), 44: (205,191,156), 2: (140,110,80), 29: (207,198,170), 24: (220,196,142), 17: (120,170,90), 0: (110,160,80), 1: (100,150,70), 18: (70,110,60), 19: (150,145,130), 27: (184,114,74), 26: (194,178,99), 28: (142,154,106)}
async def grab(pg):
    return await pg.evaluate(f"(()=>{{const s={Wd}; const o=[],g=[]; for(let y=0;y<30;y++){{o.push([]);g.push([]); for(let x=0;x<40;x++){{o[y].push(s.objects.getTileAt(x,y)?.index??-1); g[y].push(s.groundData[y][x]);}}}} return [o,g]; }})()")
async def go(pg, x, y, extra=""):
    await pg.evaluate(f"G.data.wx={x};G.data.wy={y};G.data.entry='W';{extra} {Wd}.scene.restart()"); await pg.wait_for_timeout(900)
def render(grids, w, h, path):
    im = Image.new("RGB", (w*40*3, h*30*3))
    for (ix, iy), (o, g) in grids.items():
        for y in range(30):
            for x in range(40):
                c = COL.get(o[y][x], (200,0,200)) if o[y][x] != -1 else None
                if c is None: c = GCOL.get(g[y][x], (180,180,180))
                for dy in range(3):
                    for dx in range(3): im.putpixel(((ix*40+x)*3+dx, (iy*30+y)*3+dy), c)
    im.save(path)
async def main():
    which = sys.argv[1:] or ["fort", "isle", "sea"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0); print("setup ok", flush=True)
        if "fort" in which:
            f = await pg.evaluate(f"(()=>{{const s={Wd}; for(let r=3;r<40;r++) for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++){{ const f=s.siteFns.fortressAt(G.data.seed,x,y); if(f) return f; }} return null; }})()")
            print("fortress:", f["id"], f["gate"], f["fate"], f["beast"])
            # walk in at one corner: the whole site is known at once
            await go(pg, f["x0"]+2, f["y0"])
            print("found:", await log(pg, 1))
            print("recs:", await pg.evaluate(f"Object.entries(G.data.screens).filter(([k,v])=>v.site==='{f['id']}').length"), json.dumps(await pg.evaluate("Object.values(G.data.sites).map(s=>[s.name,s.fate,s.terrain])")))
            grids = {}
            for iy in range(3):
                for ix in range(3):
                    await go(pg, f["x0"]+ix, f["y0"]+iy)
                    grids[(ix,iy)] = await grab(pg)
                    if errs: print("ERRS", errs[-2:], flush=True); errs.clear()
                    if (ix,iy)==(1,1):
                        print("heart:", await log(pg,2), "| monster", await pg.evaluate(f"{Wd}.monster?.kind"), "ways", await pg.evaluate(f"{Wd}.ways.map(g=>g.def.id)"))
                        print("targets:", await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')"))
                        await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label.startsWith('Search the king')); s.player.setPosition(t.x, t.y+14); }})()"); await pg.wait_for_timeout(600)
                        await pg.screenshot(path=SHOT+"site_heart.png")
                        await pg.evaluate(f"(()=>{{const s={Wd}; s.targets.find(t=>t.label.startsWith('Search the king')).act(); const j=s.targets.find(t=>t.label==='Search the storage jar'); if(j) j.act(); }})()")
                        print("loot:", await log(pg,3))
                    gates = await pg.evaluate(f"JSON.stringify(Object.fromEntries(Object.entries({Wd}.gates).map(([k,v])=>[k,v.length])))")
                    print(f"  screen {ix},{iy}: gates {gates} {await log(pg,1)}")
            render(grids, 3, 3, SHOT+"site_fort_map.png")
            # tholos
            for iy in range(3):
                for ix in range(3):
                    await go(pg, f["x0"]+ix, f["y0"]+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Search the beehive tomb')"):
                        await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label==='Search the beehive tomb'); s.player.setPosition(t.x+20,t.y); }})()"); await pg.wait_for_timeout(500)
                        await pg.screenshot(path=SHOT+"site_tholos.png")
                        await pg.evaluate(f"{Wd}.targets.find(t=>t.label==='Search the beehive tomb').act()"); print("tholos:", await log(pg,1))
            await pg.evaluate(f"{U}.openJournal()"); await pg.wait_for_timeout(300)
            print("journal:", (await pg.evaluate(f"{U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ')"))[-300:])
            await pg.evaluate(f"{U}.closeTalk()")
        if "isle" in which:
            for want in ["nymph", "sirens", "goats", "sacred", "forge", "reef"]:
                f = await pg.evaluate(f"(()=>{{const s={Wd}; for(let r=2;r<60;r++) for(let y=-r;y<=r;y++) for(let x=-r;x<=r;x++){{ const f=s.siteFns.isleAt(G.data.seed,x,y); if(f && f.isle==='{want}' && f.x0===x && f.y0===y && !G.data.screens[x+','+y] && !G.data.screens[(x-1)+','+y] && s.isleFits(f)) return f; }} return null; }})()")
                if not f: print(want, "none found"); continue
                await go(pg, f["x0"], f["y0"], f"G.data.screens['{f['x0']-1},{f['y0']}']={{terrain:6,special:false,feature:'Open sea',cleared:[]}}; G.data.boatCarry=true;")
                print(want, f["w"], "x", f["h"], ":", await log(pg,1))
                grids = {}
                for iy in range(f["h"]):
                    for ix in range(f["w"]):
                        await go(pg, f["x0"]+ix, f["y0"]+iy, "G.data.boatCarry=true;")
                        grids[(ix,iy)] = await grab(pg)
                        t = await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')")
                        if t:
                            print("   targets:", t, "| monster", await pg.evaluate(f"{Wd}.monster?.kind"), "| animals", await pg.evaluate(f"{Wd}.animals.map(a=>a.kind).join(',')"))
                            tx = await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label && !t.label.startsWith('Get in')); if(s.boat) {{ s.boat=undefined; s.player.setCrop(); }} s.player.setPosition(t.x, t.y+20); return t.label; }})()")
                            await pg.wait_for_timeout(700); await pg.screenshot(path=SHOT+f"site_isle_{want}.png")
                            await pg.evaluate(f"(()=>{{const s={Wd}; const t=s.targets.find(t=>t.label===\"{tx}\"); t.act(); }})()")
                            await pg.wait_for_timeout(300)
                            if await pg.evaluate(f"!!{U}.talkPanel"):
                                print("   talk:", await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')"))
                                await pg.evaluate(f"{U}.talkOpts[1]?.fn()"); await pg.wait_for_timeout(200)
                                print("   ->", (await pg.evaluate(f"{U}.talkPanel?.list.filter(x=>x.text).map(x=>x.text).join(' ## ')"))[:300])
                                await pg.evaluate(f"{U}.closeTalk()")
                            else: print("   ->", await log(pg,1))
                render(grids, f["w"], f["h"], SHOT+f"site_isle_{want}_map.png")
        if "sea" in which:
            # open sea: row in from a coast; can't walk off without a boat
            k = await pg.evaluate(f"(()=>{{for(let x=8;x<40;x++){{ const s={Wd}; if(!s.siteFns.isleAt(G.data.seed,x,9) && !s.siteFns.fortressAt(G.data.seed,x,9) && !G.data.screens[x+',9']) return x; }} }})()")
            await go(pg, k, 9, f"G.data.screens['{k-1},9']={{terrain:6,special:false,feature:'Open sea',cleared:[]}}; G.data.boatCarry=true;")
            print("sea:", await log(pg,1), "| terrain", await pg.evaluate(f"{Wd}.rec.terrain"), "boat", await pg.evaluate(f"!!{Wd}.boat"), "gates", await pg.evaluate(f"{Wd}.gates.N.length"))
            await pg.screenshot(path=SHOT+"site_sea.png")
            await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition(4, 200); }})()"); await pg.wait_for_timeout(600)
            print("rowed west:", await pg.evaluate("[G.data.wx, G.data.wy]"), await pg.evaluate(f"{Wd}.rec.terrain"), await log(pg,1))
            # swim off without the boat
            await pg.evaluate(f"(()=>{{const s={Wd}; if(s.boat) s.boat=undefined; s.player.setCrop(); s.player.setPosition(4, 200); }})()"); await pg.wait_for_timeout(600)
            print("swim off:", await pg.evaluate("[G.data.wx, G.data.wy]"), await log(pg,1))
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
