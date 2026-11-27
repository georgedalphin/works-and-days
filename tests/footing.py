import asyncio, sys
from playwright.async_api import async_playwright
sys.path.insert(0, '/home/claude/works-and-days/tests')
from wayfarers import setup, log, Wd
SHOT = "/home/claude/test/"

FIND = f"""(()=>{{const s={Wd}; const o=s.objLayer(); const out={{}};
  for(let y=1;y<o.height-1;y++) for(let x=1;x<o.width-1;x++){{ const px=x*16+8, py=y*16+3; const w=s.depthAt(px,py+5);
    const all=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>s.depthAt(px+dx*16,py+5+dy*16)===w);
    if((all||w===1) && !out['w'+w]) out['w'+w]=[px,py]; }}
  return out; }})()"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader", "--enable-unsafe-swiftshader"])
        pg, errs = await setup(b, 10, 3, 2, 0)
        W = "0"*20 + "1"*10; E = "0"*15 + "1"*15
        await pg.evaluate(f"G.data.screens['6,0']={{terrain:7,special:false,feature:'Driftwood beach',cleared:[],shore:{{N:'0',S:'1',W:'{W}',E:'{E}'}}}}; G.data.wx=6;G.data.wy=0;G.data.entry='W'; {Wd}.scene.restart()")
        await pg.wait_for_timeout(1500)
        spots = await pg.evaluate(FIND); print("spots", spots, flush=True)
        # a deer walking across dry land, the shallows and deep water: its pace there
        res = {}
        for key in ["w0", "w1", "w2"]:
            x, y = spots[key]
            v = await pg.evaluate(f"""(()=>{{const s={Wd}; 
              const A=s.animals.find(a=>!a.def.flies)?.constructor ?? null; if(!A) return 'no animal class';
              if(window._d){{window._d.sprite.destroy(); s.animals.splice(s.animals.indexOf(window._d),1);}} const d=new A(s,'deer',{x},{y},new Phaser.Geom.Rectangle({x}-20,{y}-20,40,40)); s.animals.push(d); window._d=d;
              d.appeased=true; d.state='walk'; d.tx={x}+200; d.ty={y}; d.timer=99; return 'ok'; }})()""")
            await pg.wait_for_timeout(400)
            print(key, v, await pg.evaluate("[window._d.state, window._d.sprite.active, window._d.sprite.x|0, window._d.sprite.y|0]"), flush=True)
            res[key] = await pg.evaluate("(()=>{const v=window._d.sprite.body.velocity; return [Math.round(v.length()*10)/10, window._d.sprite.isCropped]})()")
        print("deer pace dry / shallows / deep:", res["w0"], res["w1"], res["w2"], "(walk 20: expect 20, 10, 5)", flush=True)
        # a bolt sets the pace once: it must not shrink frame after frame
        x, y = spots["w1"]
        await pg.evaluate(f"(()=>{{const d=window._d; d.sprite.setPosition({x},{y}); d.bolt({{x:{x}-30,y:{y}}}); }})()"); await pg.wait_for_timeout(250)
        a1 = await pg.evaluate("Math.round(window._d.sprite.body.velocity.length())"); await pg.wait_for_timeout(250)
        a2 = await pg.evaluate("Math.round(window._d.sprite.body.velocity.length())")
        print("bolting through the shallows (flee 110 → 55, or 0 if it was headed into the deep sea and stopped at the edge):", a1, a2, "| state", await pg.evaluate("window._d.state"), flush=True)
        # drowning: held out of its depth
        x, y = spots["w2"]
        await pg.evaluate(f"(()=>{{const d=window._d; d.sprite.setPosition({x},{y}); d.state='idle'; d.timer=99; d.home=new Phaser.Geom.Rectangle({x}-4,{y}-4,8,8); d.breath=7; {Wd}.player.setPosition({x},{y}-32); }})()")
        for i in range(30):
            await pg.wait_for_timeout(1000)
            st = await pg.evaluate("[window._d.state, window._d.hp, Math.round(window._d.breath)]")
            if st[0] == "dead": break
        print("deep water after", i + 1, "s:", st, "|", await pg.evaluate("window._log.filter(t=>t.includes('drown')).join(' | ')"), "| ground at dry spot", await pg.evaluate(f"{Wd}.groundFactorAt(24,19+4)"), flush=True)
        await pg.wait_for_timeout(1800)
        print("removed:", await pg.evaluate(f"!{Wd}.animals.includes(window._d)"))
        # a gull on the deep water is not slowed or drowned
        g = await pg.evaluate(f"""(()=>{{const s={Wd}; const A=window._d.constructor; const g=new A(s,'heron',{x},{y},new Phaser.Geom.Rectangle({x}-4,{y}-4,8,8)); s.animals.push(g); g.breath=20; window._g=g; return 1}})()""")
        await pg.wait_for_timeout(2500); print("heron on deep water:", await pg.evaluate("[window._g.state, window._g.hp]"))
        # a wayfarer wading
        x, y = spots["w1"]
        ok = await pg.evaluate(f"(()=>{{const s={Wd}; const d=s.wayDefs[0]; for(const g of [...s.ways]) s.dropWay(g); const g=s.spawnWay(d,false); if(!g) return 'none'; const w=g.people[0]; window._w=w; w.sprite.setPosition({x},{y}); return w.constructor.name; }})()")
        await pg.wait_for_timeout(100)
        await pg.evaluate(f"(()=>{{const w=window._w; w.hold=0; w.walk([[{x}+150,{y}]]); w.sprite.setPosition({x},{y}); w.step(0.016,false); }})()")
        print("wayfarer:", ok, "speed in shallows:", await pg.evaluate("[Math.round(window._w.sprite.body.velocity.length()*10)/10, window._w.speed, window._w.wet]"), flush=True)
        cs = await pg.evaluate(f"""(()=>{{const s={Wd}; const sp=s.add.sprite({x},{y},'deer',0); const a=s.companionStep(sp,20,0,0.1);
          // walk south from the shallows until the next step would be deep water
          let y={y}; while(s.depthAt({x},y+5+8)!==2 && y<{y}+200) y+=4; sp.setPosition({x},y); const b=s.companionStep(sp,0,80,0.3); const r=[a.map(Math.round), b.map(Math.round), s.depthAt(sp.x,sp.y+5)]; sp.destroy(); return r; }})()""")
        print("companion: wading", cs[0], "(expect [10,0]) | at the edge of deep water", cs[1], "(expect [0,0]) still at depth", cs[2], flush=True)
        await pg.evaluate(f"(()=>{{const s={Wd}; s.player.setPosition({x}-20,{y}); s.cameras.main.centerOn({x},{y}); }})()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=SHOT + "footing.png")
        print("ERRORS:", errs)
        await b.close()
if __name__ == "__main__": asyncio.run(main())
