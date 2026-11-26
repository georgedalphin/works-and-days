import asyncio, sys, json
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, U, Wd
from sites import grab, render, go
SHOT = "/home/claude/test/"
Lb = "game.scene.getScene('Labyrinth')"
async def opts(pg): return await pg.evaluate(f"{U}.talkOpts.map(o=>o.label).join(' / ')")
async def text(pg): return (await pg.evaluate(f"{U}.talkPanel ? {U}.talkPanel.list.filter(x=>x.text).map(x=>x.text).join(' ## ') : ''"))
async def choose(pg, prefix):
    await pg.evaluate(f"(()=>{{const o={U}.talkOpts.find(o=>o.label.startsWith({prefix!r})); if(!o) throw new Error('no option '+{prefix!r}); o.fn();}})()"); await pg.wait_for_timeout(250)
async def act(pg, prefix, scene=Wd):
    return await pg.evaluate(f"(()=>{{const s={scene}; const t=s.targets.find(t=>t.label && t.label.startsWith({prefix!r})); if(!t) return 'NO TARGET'; s.player.setPosition(t.x, t.y+14); t.act(); return t.label; }})()")
async def main():
    which = sys.argv[1:] or ["delphi", "knossos"]
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0); print("setup ok", flush=True)
        a = await pg.evaluate("G.data.anchors"); print("anchors:", a.get("delphi"), a.get("knossos"), flush=True)
        await pg.evaluate("G.data.silver=100; G.addItem('Pearl',1); G.addItem('Torch',3)")
        if "delphi" in which:
            x0, y0 = map(int, a["delphi"].split(","))
            grids = {}
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy); grids[(ix,iy)] = await grab(pg)
                    print(f"  delphi {ix},{iy}:", (await log(pg,1))[:160], "|", await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')"), flush=True)
            render(grids, 2, 2, SHOT+"sanct_delphi_map.png")
            # find the screen with the Pythia
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Consult the Pythia')"):
                        print("consult unwashed:", await act(pg, "Consult")); await choose(pg, "Ask where"); print("   ", (await text(pg))[:200]); await pg.evaluate(f"{U}.closeTalk()")
                        await pg.wait_for_timeout(500); await pg.screenshot(path=SHOT+"sanct_pythia.png")
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Wash in the Castalian spring')"):
                        await act(pg, "Wash"); print("washed:", await log(pg,1))
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Consult the Pythia')"):
                        await act(pg, "Consult"); await choose(pg, "Ask where"); print("oracle:", (await text(pg))[-420:]); await pg.evaluate(f"{U}.closeTalk()")
                        await act(pg, "Consult"); print("   again:", await opts(pg)); await pg.evaluate(f"{U}.closeTalk()")
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label && t.label.startsWith('Look into'))"):
                        await pg.evaluate("G.data.selected=G.data.slots.findIndex(s=>s&&s.id==='Pearl')")
                        await act(pg, "Look into"); print("treasury:", await opts(pg)); await choose(pg, "Dedicate"); print("   ", (await text(pg))[:250]); await pg.evaluate(f"{U}.closeTalk()")
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Lay your hand on the omphalos')"):
                        await act(pg, "Lay your hand"); print("omphalos:", await log(pg,1))
            await pg.evaluate(f"{U}.openJournal()"); print("journal:", (await text(pg))[-400:]); await pg.evaluate(f"{U}.closeTalk()")
        if "knossos" in which:
            x0, y0 = map(int, a["knossos"].split(","))
            grids = {}
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy); grids[(ix,iy)] = await grab(pg)
                    print(f"  knossos {ix},{iy}:", (await log(pg,1))[:140], "|", await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')")[:300] if False else (await pg.evaluate(f"{Wd}.targets.map(t=>t.label).filter(Boolean).join(' / ')"))[:300], flush=True)
            render(grids, 2, 2, SHOT+"sanct_knossos_map.png")
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Speak with Ariadne')"):
                        await act(pg, "Speak with Ariadne"); print("ariadne:", await opts(pg)); await choose(pg, "Say that"); print("   ", (await text(pg))[:300]); await pg.evaluate(f"{U}.closeTalk()")
                        await pg.wait_for_timeout(400); await pg.screenshot(path=SHOT+"sanct_ariadne.png")
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label && t.label.startsWith('Go down the stair'))"):
                        await act(pg, "Go down the stair"); await pg.wait_for_timeout(3000)
                        print("below:", await pg.evaluate("G.data.scene"), "|", await log(pg,1), "| mino", await pg.evaluate(f"{Lb}.mino?.state"), "torch", await pg.evaluate("G.data.torchLit"), flush=True)
                        await pg.screenshot(path=SHOT+"sanct_lab_door.png")
                        # walk a little to lay thread, then render the maze
                        maze = await pg.evaluate(f"{Lb}.grid")
                        from PIL import Image
                        im = Image.new("RGB", (len(maze[0])*3, len(maze)*3))
                        for y,row in enumerate(maze):
                            for x,v in enumerate(row):
                                for d in range(9): im.putpixel((x*3+d%3, y*3+d//3), (150,140,115) if v else (40,36,30))
                        im.save(SHOT+"sanct_lab_map.png")
                        # bring the Minotaur close
                        await pg.evaluate(f"(()=>{{const s={Lb}; const m=s.mino; s.player.setPosition(m.sprite.x+70, m.sprite.y); G.data.vitality=99; }})()")
                        await pg.wait_for_timeout(4000)
                        print("hunted:", await log(pg,3), "| vit", await pg.evaluate("G.data.vitality"), flush=True)
                        await pg.screenshot(path=SHOT+"sanct_minotaur.png")
                        await pg.evaluate(f"(()=>{{const s={Lb}; const m=s.mino; m.hp=1; s.kill(m); s.creatureEvent(m,'slain'); }})()"); await pg.wait_for_timeout(1200)
                        print("slain:", await log(pg,3), "| site", await pg.evaluate("G.data.sites.Knossos.minotaur"))
                        print("tribute:", await act(pg, "Search among", Lb), await log(pg,2))
                        await pg.evaluate(f"(()=>{{const s={Lb}; s.player.setPosition(s.door.x*16+16, s.door.y*16+40); }})()"); await pg.wait_for_timeout(300)
                        await act(pg, "Climb back up", Lb); await pg.wait_for_timeout(3000)
                        print("back up:", await pg.evaluate("[G.data.scene, G.data.wx, G.data.wy]"), await log(pg,1), flush=True)
            for iy in range(2):
                for ix in range(2):
                    await go(pg, x0+ix, y0+iy)
                    if await pg.evaluate(f"!!{Wd}.targets.find(t=>t.label==='Speak with Ariadne')"):
                        await act(pg, "Speak with Ariadne"); print("ariadne after:", await opts(pg)); await choose(pg, "Tell her"); print("   ", (await text(pg))[:300]); await pg.evaluate(f"{U}.closeTalk()")
        print("ERRORS:", errs)
        await b.close()
asyncio.run(main())
