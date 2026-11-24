import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":960,"height":640})
        errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(1500)
        # Render offline: 0-10 s calm lyre over wind and birds, 10-20 s danger music, 20-26 s rain, 26-32 s summer cicadas.
        stats = await pg.evaluate("""(async()=>{
          const SR=22050, T=32, off=new OfflineAudioContext(1, SR*T, SR);
          const S=new window.SOUND.constructor(); S.start(off);
          const L=S.layers, set=(n,v,t)=>L[n].gain.setValueAtTime(v,t);
          set('wind',0.07,0); set('wind',0,20); set('rain',0.07,20); set('rain',0,26); set('cicada',0.05,26);
          S.calmPhrase(0.3,{day:true,scene:'Farm'}); S.calmPhrase(5.2,{day:true,scene:'Farm'});
          for(let i=0;i<14;i++){ const t=0.5+i*0.7; S.chirp(t,2800,3600,0.08,0.035); }
          S.danger.gain.setValueAtTime(0,0); S.danger.gain.linearRampToValueAtTime(1,11); S.danger.gain.setValueAtTime(1,19); S.danger.gain.linearRampToValueAtTime(0,20);
          S.nextBeat=10; for(let t=10;t<20;t+=0.2) S.scheduleDanger(t);
          S.calmPhrase(27,{day:true,scene:'Farm'});
          const buf=await off.startRendering(), d=buf.getChannelData(0);
          const out=[]; for(let s=0;s<T;s+=2){ let pk=0, sum=0; for(let i=s*SR;i<(s+2)*SR;i++){ const v=Math.abs(d[i]); if(v>pk)pk=v; sum+=d[i]*d[i]; } out.push([s, +pk.toFixed(3), +(Math.sqrt(sum/(2*SR))).toFixed(4)]); }
          return out; })()""")
        print("seconds  peak   rms")
        for s,pk,rms in stats: print(f"{s:>3}-{s+2:<3}  {pk:<6} {rms}   {'#'*int(rms*400)}")
        # Live: start the real context and run the game a little to make sure nothing throws
        await pg.mouse.click(480,320); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        if await pg.evaluate("game.scene.isActive('Creation')"): await pg.evaluate("game.scene.getScene('Creation').finish()"); await pg.wait_for_timeout(2000)
        await pg.wait_for_timeout(3000)
        print("live ctx:", await pg.evaluate("SOUND.ctx && SOUND.ctx.state"))
        await pg.keyboard.press("m"); await pg.wait_for_timeout(200); print("mute:", await pg.evaluate("SOUND.muted"))
        await pg.keyboard.press("n"); await pg.wait_for_timeout(200); print("music on:", await pg.evaluate("SOUND.musicOn"))
        print("ERRORS:", errs); await b.close()
asyncio.run(main())
