"""The title screen: the dawn scene and the gate (/home/claude/test/title_gate.png), the menu after a click (title_menu.png, after 30 s of sunrise), Exit and the farewell (title_exit.png), back to the title, and New life on to creation."""
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--use-gl=swiftshader","--enable-unsafe-swiftshader","--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":960,"height":640}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file:///home/claude/works-and-days/dist/index.html"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path="/home/claude/test/title_gate.png")
        await pg.mouse.click(480,200); await pg.wait_for_timeout(2500)
        print("audio:", await pg.evaluate("(()=>{const s=game.scene.getScene('Title'); return 'menu '+!!s.menu+' gate '+!!s.gate})()"))
        await pg.wait_for_timeout(30000)
        await pg.screenshot(path="/home/claude/test/title_menu.png")
        await pg.keyboard.press("ArrowDown"); await pg.wait_for_timeout(300); await pg.screenshot(path="/home/claude/test/title_menu2.png")
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(1500)
        await pg.screenshot(path="/home/claude/test/title_exit.png")
        await pg.mouse.click(480,320); await pg.wait_for_timeout(1500)
        print("back:", await pg.evaluate("(()=>{const s=game.scene.getScene('Title'); return game.scene.isActive('Title')+' menu '+!!s.menu+' farewell '+!!s.farewell})()"))
        await pg.keyboard.press("Enter"); await pg.wait_for_timeout(2500)
        print("enter -> creation:", await pg.evaluate("game.scene.isActive('Creation')"))
        print("ERRORS", errs)
asyncio.run(main())
