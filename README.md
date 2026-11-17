# Works & Days

A cozy farming and roguelike-wilderness game set in the Greek Heroic Age, built on the AEGIS tabletop RPG. This repository holds the vertical slice: the first two months of a Young Adult's life on a new homestead.

Built with [Phaser 3](https://phaser.io) and TypeScript, bundled with esbuild into a single HTML page.

## Build

```sh
npm install
npx tsc -p .      # type-check
node build.mjs    # writes dist/index.html
```

Open `dist/index.html` in a browser to play.

## Layout

- `src/main.ts` — scenes: title, homestead, hut, wilderness, and the HUD (hotbar, inventory, dialogs, sleep)
- `src/state.ts` — the saved game: calendar and clock, Fatigue and Essence, inventory, animals, explored screens
- `src/data.ts` — game data: the Cosmic Wheel, months, items, goats, terrains and the terrain roll
- `src/animals.ts` — creature behaviour (wandering, fleeing, flocks)
- `src/textures.ts` — placeholder pixel art drawn in code
- `tests/` — headless Playwright checks

## Controls

WASD or arrows to move, Shift to run, 1–0 to choose a hotbar slot, Space to use it, E to interact, I or Tab for belongings, H for help.
