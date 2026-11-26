import asyncio, sys, json
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, U, Wd
from sites import grab, render
SHOT = "/home/claude/test/"
Lb = "game.scene.getScene('Labyrinth')"
async def go(pg, x, y, extra="", entry="W"):
    await pg.evaluate(f"G.data.wx={x};G.data.wy={y};G.data.entry='{entry}';{extra} {Wd}.scene.restart()"); await pg.wait_for_timeout(900)
async def main():
    which = sys.argv[1:] or ["shore", "crete"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0); print("setup ok", flush=True)
        if "shore" in which:
            # a coast: land to the north, open sea to the south, the shore running in from west and east
            W = "0"*20 + "1"*10; E = "0"*15 + "1"*15
            await pg.evaluate(f"G.data.screens['6,0']={{terrain:7,special:false,feature:'Driftwood beach',cleared:[],shore:{{N:'0',S:'1',W:'{W}',E:'{E}'}}}}")
            grids = {}
            for (x, y, ent) in [(6,0,"W"), (7,0,"W"), (5,0,"E"), (6,1,"N"), (6,-1,"S"), (7,1,"N"), (5,1,"N"), (7,-1,"S"), (5,-1,"S")]:
                await go(pg, x, y, "G.data.boatCarry=true;" if y == 1 else "", ent)
                rec = await pg.evaluate(f"G.data.screens['{x},{y}']")
                print(f"  {x},{y}: terrain {rec['terrain']} shore {json.dumps(rec.get('shore'))[:150]}", flush=True)
                grids[(x-5, y+1)] = await grab(pg)
            render(grids, 3, 3, SHOT+"coast_map.png")
            sc = await pg.evaluate("[G.data.screens['6,0'].shore, G.data.screens['7,0'].shore, G.data.screens['5,0'].shore]")
            print("E side of 6,0 == W side of 7,0:", sc[0]["E"] == sc[1]["W"], "| W of 6,0 == E of 5,0:", sc[0]["W"] == sc[2]["E"])
            print("south of the coast is ocean:", await pg.evaluate("G.data.screens['6,1'].terrain === 6"), "| north is land:", await pg.evaluate("![6,7].includes(G.data.screens['6,-1'].terrain)"))
            # walking off the all-sea side without a boat
            await go(pg, 6, 0)
            await pg.evaluate(f"(()=>{{const s={Wd}; if(s.boat){{s.boat=undefined; s.player.setCrop();}} s.player.setPosition(300, 30*16-6); }})()"); await pg.wait_for_timeout(700)
            print("walk into the sea:", await pg.evaluate("[G.data.wx,G.data.wy]"), await log(pg,1))
        if "crete" in which:
            a = await pg.evaluate("[G.data.anchors.crete, G.data.anchors.knossosAt, G.data.anchors.delphi]"); print("crete", a, flush=True)
            x0, y0 = map(int, a[0].split(",")); kx, ky = map(int, a[1].split(","))
            # what the neighbours of Crete must be, before it is found: the sea all round
            await go(pg, x0 - 1, y0 + 1, "", "E")
            print("west of Crete:", await pg.evaluate(f"G.data.screens['{x0-1},{y0+1}']"), flush=True)
            await go(pg, x0, y0 + 1, "G.data.boatCarry=true;")
            print("found:", (await log(pg, 1))[:200], "| recs", await pg.evaluate(f"Object.values(G.data.screens).filter(r=>r.site==='Crete').length"), flush=True)
            grids = {}
            for iy in range(3):
                for ix in range(6):
                    await go(pg, x0+ix, y0+iy, "G.data.boatCarry=true;")
                    grids[(ix, iy)] = await grab(pg)
                    if (x0+ix, y0+iy) == (kx, ky):
                        print("knossos screen:", await log(pg, 2), "|", await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')"), flush=True)
            render(grids, 6, 3, SHOT+"crete_map.png")
            await go(pg, kx, ky, "G.data.boatCarry=false;")
            await pg.evaluate(f"(()=>{{const s={Wd}; if(s.boat){{s.boat=undefined; s.player.setCrop();}} const t=s.targets.find(t=>t.label.startsWith('Go down')); s.player.setPosition(t.x,t.y+14); }})()"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=SHOT+"crete_knossos.png")
            await pg.evaluate(f"{Wd}.targets.find(t=>t.label.startsWith('Go down')).act()"); await pg.wait_for_timeout(3000)
            print("below:", await pg.evaluate("G.data.scene"), await log(pg,1)[:80] if False else (await log(pg,1))[:120], "| mino", await pg.evaluate(f"{Lb}.mino?.state"))
            await pg.evaluate(f"(()=>{{const s={Lb}; const t=s.targets.find(t=>t.label.startsWith('Climb')); s.player.setPosition(t.x,t.y+10); t.act(); }})()"); await pg.wait_for_timeout(3000)
            print("back up:", await pg.evaluate("[G.data.scene, G.data.wx, G.data.wy]"), "expected", [kx, ky])
            await pg.evaluate(f"{U}.openJournal()"); await pg.wait_for_timeout(300)
            print("journal:", (await pg.evaluate(f"{U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ')"))[-260:])
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
