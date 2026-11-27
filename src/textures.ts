import Phaser from "phaser";
import { CROPS, seedId, WHEEL } from "./data";
import { DISH_IDS, NAMED } from "./cooking";
import { FORAGE } from "./forage";
import { ASPECTS, PHARM_ICON_IDS, type Aspect } from "./pharmakeia";
import { CIRCLET_ICON_IDS } from "./circlets";
import { VILLAGERS } from "./village";
import { drawFurnIcon, makeHomeTextures } from "./home";
import { WEAR, type Worn } from "./gear";

// Placeholder pixel art, drawn in code. Warm Mediterranean palette.
export const T = {
  GRASS: 0, GRASS2: 1, DIRT: 2, PATH: 3,
  BRUSH: 4, SAPLING: 5, STONE: 6, TREE: 7, BOULDER: 8, EDGE: 9,
  FLOOR: 10, WALL: 11, FLOWERS: 12, OLIVE: 13, TILLED: 14, WET: 15, FENCE: 16,
  MEADOW: 17, FOREST: 18, ROCKY: 19, WATER: 20, CAVEWALL: 21, CAVEFLOOR: 22, ORE: 23,
  // The rest of the wheel's lands: grounds, then their plants (Flora & Fauna: black pine, reed, thorn scrub).
  SAND: 24, MUD: 25, DRYGRASS: 26, REDROCK: 27, ALPINE: 28, LIMESTONE: 29, PINE: 30, REEDS: 31, THORN: 32,
  // Ground details: no effect on play, only on the eye.
  PEBBLES: 33, LEAVES: 34, TUFT: 35, MUSHRING: 36, TWIGS: 37, SKULL: 38, SHELLS: 39, CRACKS: 40, BLOOMS: 41,
  // Water you can wade (half speed); WATER itself is deep (swim, briefly, at a quarter).
  SHALLOW: 42,
  // Citadels: Cyclopean masonry, paving, a palace column.
  CYCLO: 43, FLAGS: 44, COLUMN: 45,
};
export const TILE = 16;
const COUNT = 46;

type Ctx = CanvasRenderingContext2D;

function px(c: Ctx, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(x, y, w, h); }

function speckle(c: Ctx, ox: number, base: string, dots: string[], n: number, seed: number) {
  px(c, ox, 0, TILE, TILE, base);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const x = s % 16; s = (s * 9301 + 49297) % 233280; const y = s % 16;
    px(c, ox + x, y, 1, 1, dots[i % dots.length]);
  }
}

function drawTile(c: Ctx, i: number) {
  const o = i * TILE;
  const grass = "#a7a34e";
  switch (i) {
    case T.GRASS: speckle(c, o, grass, ["#bdb760", "#8e8a3e"], 14, 7); break;
    case T.GRASS2: speckle(c, o, "#9f9b48", ["#c3bd66", "#86823a", "#d9c27a"], 18, 31); break;
    case T.DIRT: speckle(c, o, "#b98a55", ["#a87a48", "#c99a62"], 16, 11); break;
    case T.PATH: speckle(c, o, "#d2b07a", ["#c39f69", "#e0c08c"], 14, 5); break;
    case T.BRUSH:
      px(c, o + 3, 6, 10, 7, "#6d7a2f"); px(c, o + 5, 4, 6, 4, "#7d8a38"); px(c, o + 4, 8, 3, 2, "#56621f");
      px(c, o + 10, 9, 2, 2, "#56621f"); break;
    case T.SAPLING:
      px(c, o + 7, 8, 2, 6, "#6b4a2b"); px(c, o + 4, 3, 8, 6, "#5e7f34"); px(c, o + 6, 2, 4, 2, "#71953f"); break;
    case T.STONE:
      px(c, o + 4, 7, 8, 6, "#9c968a"); px(c, o + 5, 6, 6, 2, "#b5afa2"); px(c, o + 5, 11, 7, 2, "#7f7a70"); break;
    case T.TREE:
      px(c, o + 7, 10, 3, 6, "#5a3d22"); px(c, o + 1, 1, 14, 10, "#4f6b2c"); px(c, o + 3, 0, 10, 2, "#5f7f35");
      px(c, o + 2, 3, 3, 3, "#67883b"); px(c, o + 9, 5, 3, 3, "#3f5823"); break;
    case T.BOULDER:
      px(c, o + 1, 4, 14, 11, "#8d877b"); px(c, o + 2, 2, 11, 3, "#a49e91"); px(c, o + 3, 5, 4, 3, "#bab3a5"); px(c, o + 1, 13, 14, 2, "#6c675e"); break;
    case T.EDGE:
      px(c, o, 0, TILE, TILE, "#3c5422"); px(c, o + 2, 2, 6, 6, "#4a6629"); px(c, o + 9, 7, 6, 6, "#33491d"); px(c, o + 4, 10, 5, 5, "#476227"); break;
    case T.FLOOR: speckle(c, o, "#c7a678", ["#b8966a", "#d4b487"], 12, 23); px(c, o, 15, 16, 1, "#b08f63"); break;
    case T.WALL: px(c, o, 0, TILE, TILE, "#e8dcc2"); px(c, o, 12, 16, 4, "#c9b48f"); px(c, o + 3, 4, 2, 2, "#d8c9a8"); break;
    case T.FLOWERS:
      px(c, o + 3, 4, 2, 2, "#e85f7a"); px(c, o + 10, 6, 2, 2, "#f2c14e"); px(c, o + 6, 11, 2, 2, "#e8e2f0"); px(c, o + 12, 12, 2, 2, "#e85f7a"); break;
    case T.OLIVE:
      px(c, o + 7, 9, 2, 7, "#6b5a45"); px(c, o + 1, 2, 14, 8, "#8a9a6a"); px(c, o + 3, 1, 9, 2, "#9aab78"); px(c, o + 4, 4, 2, 2, "#5a6a45"); break;
    case T.TILLED:
      px(c, o, 0, TILE, TILE, "#9c6e40");
      for (let y = 1; y < 16; y += 4) { px(c, o, y, 16, 1, "#7f5733"); px(c, o, y + 1, 16, 1, "#b0804f"); }
      break;
    case T.WET:
      px(c, o, 0, TILE, TILE, "#6a4528");
      for (let y = 1; y < 16; y += 4) { px(c, o, y, 16, 1, "#4e321c"); px(c, o, y + 1, 16, 1, "#7d5432"); }
      break;
    case T.MEADOW: speckle(c, o, "#adb04f", ["#c6c25e", "#e2c86a", "#d98aa0", "#8f9a40"], 20, 43); break;
    case T.FOREST: speckle(c, o, "#6f7d3a", ["#5d6a2f", "#86914a", "#7a5a33"], 18, 47); break;
    case T.ROCKY: speckle(c, o, "#b3a27c", ["#9c8c68", "#c8b88f", "#8d877b"], 20, 53); break;
    case T.WATER:
      px(c, o, 0, 16, 16, "#3f7fa0"); px(c, o, 0, 16, 2, "#5a9ab8");
      for (const [x, y] of [[2, 4], [9, 7], [4, 11], [11, 13]]) { px(c, o + x, y, 4, 1, "#8fc4dc"); px(c, o + x + 1, y + 1, 2, 1, "#6aa8c8"); }
      break;
    case T.SHALLOW:
      px(c, o, 0, 16, 16, "#6aa8b0"); px(c, o, 0, 16, 1, "#8cc4c4");
      for (const [x, y] of [[3, 3], [10, 5], [6, 10], [12, 12], [1, 13]]) px(c, o + x, y, 2, 1, "#a89870");
      for (const [x, y] of [[2, 6], [9, 9], [5, 14]]) px(c, o + x, y, 4, 1, "#b4dce0");
      break;
    case T.CYCLO: { // great rough blocks, fitted without mortar
      px(c, o, 0, TILE, TILE, "#9a907a");
      const blocks: [number, number, number, number][] = [[0, 0, 9, 6], [9, 0, 7, 7], [0, 6, 6, 5], [6, 7, 10, 5], [0, 11, 8, 5], [8, 12, 8, 4]];
      const shades = ["#b9ae94", "#aca288", "#c4ba9f", "#b3a98e", "#a69c82", "#bdb399"];
      blocks.forEach(([x, y, w, h], i) => { px(c, o + x + 1, y + 1, w - 1, h - 1, shades[i]); px(c, o + x + 1, y + 1, w - 2, 1, "#d2c9b0"); px(c, o + x + 1, y + h - 1, w - 1, 1, "#7e7562"); });
      break;
    }
    case T.FLAGS: speckle(c, o, "#cdbf9c", ["#d8cca9", "#bfb18f"], 10, 113); for (const y of [0, 8]) px(c, o, y, 16, 1, "#a89a7a"); px(c, o + 5, 0, 1, 8, "#a89a7a"); px(c, o + 12, 8, 1, 8, "#a89a7a"); break;
    case T.COLUMN: // a palace column, red, on a stone base, its dark cushion capital
      px(c, o + 3, 13, 10, 3, "#8e846e"); px(c, o + 5, 3, 6, 10, "#9c3a2a"); px(c, o + 5, 3, 2, 10, "#b8523e"); px(c, o + 10, 3, 1, 10, "#6e2a1e");
      px(c, o + 3, 0, 10, 3, "#2e2a24"); px(c, o + 4, 0, 8, 1, "#4a443a"); break;
    case T.CAVEWALL: speckle(c, o, "#3a332c", ["#4a4238", "#2a241e", "#524a40"], 26, 61); px(c, o, 13, 16, 3, "#2a241e"); break;
    case T.CAVEFLOOR: speckle(c, o, "#5a5046", ["#4a4238", "#6a6054", "#544a40"], 16, 67); break;
    case T.ORE:
      px(c, o + 2, 5, 12, 9, "#6c675e"); px(c, o + 3, 4, 10, 2, "#8d877b"); px(c, o + 2, 13, 12, 2, "rgba(0,0,0,0.3)");
      for (const [x, y] of [[4, 7], [9, 6], [7, 10], [11, 11]]) { px(c, o + x, y, 2, 2, "#3a9a7a"); px(c, o + x, y, 1, 1, "#7ad0a8"); }
      break;
    case T.SAND: speckle(c, o, "#dcc48e", ["#e8d4a2", "#c8ae78", "#d0b884"], 16, 71); break;
    case T.MUD: speckle(c, o, "#6e6a3c", ["#5a5530", "#4e4a2c", "#7d7a48", "#3f5a5a"], 22, 73); break;
    case T.DRYGRASS: speckle(c, o, "#c2b263", ["#d4c478", "#a89850", "#b8a858", "#9a8a48"], 20, 79); break;
    case T.REDROCK: speckle(c, o, "#b8724a", ["#a0603c", "#c88a5e", "#8a5034"], 20, 83); break;
    case T.ALPINE: speckle(c, o, "#8e9a6a", ["#a8b080", "#7a8658", "#c8c8c0", "#e8e8e0"], 20, 89); break;
    case T.LIMESTONE: speckle(c, o, "#cfc6aa", ["#ddd6bc", "#bdb498", "#a8a088", "#9aa060"], 18, 97); break;
    case T.PINE: // black pine: tall, dark, layered
      px(c, o + 7, 12, 2, 4, "#5a3d22");
      px(c, o + 6, 0, 4, 3, "#2f4a2a"); px(c, o + 4, 3, 8, 3, "#355230"); px(c, o + 3, 6, 10, 3, "#2f4a2a"); px(c, o + 2, 9, 12, 3, "#294226");
      px(c, o + 5, 4, 2, 1, "#4a6a3a"); px(c, o + 4, 7, 2, 1, "#4a6a3a"); px(c, o + 3, 10, 2, 1, "#4a6a3a"); break;
    case T.REEDS:
      for (const [x, h] of [[2, 11], [5, 13], [8, 10], [11, 14], [13, 9]] as [number, number][]) { px(c, o + x, 16 - h, 1, h, "#8a9a4a"); px(c, o + x, 15 - h, 1, 3, "#7a5a33"); }
      px(c, o + 1, 13, 14, 3, "#4a6a5a"); break;
    case T.THORN:
      px(c, o + 2, 8, 12, 6, "#7a6a3a"); px(c, o + 4, 6, 8, 3, "#8a7a44");
      for (const [x, y] of [[2, 7], [5, 5], [9, 6], [13, 8], [3, 12], [12, 12], [7, 9]]) px(c, o + x, y, 1, 1, "#e0d8b8");
      px(c, o + 6, 10, 2, 2, "#5a4a28"); break;
    case T.PEBBLES: for (const [x, y, col] of [[3, 11, "#a8a294"], [6, 12, "#8e897c"], [11, 9, "#b4ae9e"], [9, 13, "#9a958a"], [13, 12, "#8e897c"]] as [number, number, string][]) { px(c, o + x, y, 2, 1, col); px(c, o + x, y + 1, 2, 1, "rgba(0,0,0,0.18)"); } break;
    case T.LEAVES: for (const [x, y, col] of [[2, 10, "#a8742e"], [6, 12, "#8a5a2a"], [10, 9, "#c08a3a"], [12, 13, "#9a6a30"], [5, 7, "#b0803a"]] as [number, number, string][]) px(c, o + x, y, 2, 1, col); break;
    case T.TUFT: for (const [x, h] of [[5, 3], [6, 4], [7, 3], [9, 4], [10, 2]] as [number, number][]) px(c, o + x, 13 - h, 1, h, "#5f7f30"); px(c, o + 6, 10, 1, 1, "#7a9a40"); break;
    case T.MUSHRING: for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2, x = 8 + Math.round(Math.cos(a) * 5), y = 9 + Math.round(Math.sin(a) * 4); px(c, o + x - 1, y, 2, 1, "#e8e2d0"); px(c, o + x - 1, y + 1, 1, 1, "#c8c0a8"); } break;
    case T.TWIGS: px(c, o + 3, 11, 6, 1, "#7a5a33"); px(c, o + 7, 10, 1, 1, "#7a5a33"); px(c, o + 9, 13, 5, 1, "#6b4a2b"); px(c, o + 11, 12, 1, 1, "#6b4a2b"); break;
    case T.SKULL: px(c, o + 6, 9, 4, 3, "#e4dcc4"); px(c, o + 7, 10, 1, 1, "#3a2e24"); px(c, o + 9, 10, 1, 1, "#3a2e24"); px(c, o + 4, 8, 2, 1, "#d8d0b8"); px(c, o + 10, 8, 2, 1, "#d8d0b8"); px(c, o + 7, 12, 2, 1, "#c8c0a8"); break;
    case T.SHELLS: for (const [x, y, col] of [[3, 10, "#f0e0d0"], [8, 12, "#e8c8b0"], [12, 9, "#f4ece0"]] as [number, number, string][]) { px(c, o + x, y, 2, 2, col); px(c, o + x, y + 1, 2, 1, "#c8a890"); } break;
    case T.CRACKS: px(c, o + 2, 8, 4, 1, "rgba(60,30,10,0.35)"); px(c, o + 5, 9, 3, 1, "rgba(60,30,10,0.35)"); px(c, o + 8, 10, 4, 1, "rgba(60,30,10,0.35)"); px(c, o + 7, 11, 1, 3, "rgba(60,30,10,0.3)"); px(c, o + 11, 6, 1, 4, "rgba(60,30,10,0.3)"); break;
    case T.BLOOMS: for (const [x, y, col] of [[4, 10, "#f2f0e8"], [9, 12, "#e8d040"], [12, 9, "#c890e0"]] as [number, number, string][]) { px(c, o + x, y, 1, 1, col); px(c, o + x, y + 1, 1, 2, "#5e7f34"); } break;
    case T.FENCE:
      px(c, o, 5, 16, 2, "#8a5f35"); px(c, o, 10, 16, 2, "#8a5f35"); px(c, o, 7, 16, 1, "#5a3d22");
      px(c, o + 2, 2, 3, 13, "#6b4a2b"); px(c, o + 11, 2, 3, 13, "#6b4a2b"); px(c, o + 2, 2, 3, 1, "#a87443"); px(c, o + 11, 2, 3, 1, "#a87443");
      break;
  }
}

function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  const tex = scene.textures.createCanvas(key, w, h)!;
  const c = tex.getContext();
  c.imageSmoothingEnabled = false;
  draw(c);
  tex.refresh();
  return tex;
}

/**
 * Soft edges for ground patches. For every tile, 64 frames in a row of the "tilesSoft" sheet:
 *  0–31: the tile eroded along the sides in a 4-bit mask (N 1, E 2, S 4, W 8), two variants of 16;
 * 32–63: a ragged fringe of the tile that spills a little way over the sides in the mask, two variants.
 * Laid over the ground, a patch's square edges become wobbly and blend into what surrounds it.
 */
export const SOFT_COLS = 64;
function makeSoftTiles(scene: Phaser.Scene, src: HTMLCanvasElement) {
  const sx = src.getContext("2d")!.getImageData(0, 0, src.width, src.height);
  // A smooth ragged depth for each side, position and variant: 1–4 px in, 0–3 px out.
  const wob = (v: number, side: number, i: number, lo: number, amp: number) =>
    lo + Math.round(amp * (0.5 + 0.32 * Math.sin(i * 0.85 + side * 2.1 + v * 4.3) + 0.18 * Math.sin(i * 2.3 + side * 5.7 + v)));
  canvasTex(scene, "tilesSoft", SOFT_COLS * TILE, COUNT * TILE, (c) => {
    const out = c.createImageData(SOFT_COLS * TILE, COUNT * TILE);
    for (let t = 0; t < COUNT; t++) for (let f = 0; f < SOFT_COLS; f++) {
      const fringe = f >= 32, v = (f >> 4) & 1, m = f & 15;
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
        let keep: boolean;
        if (!fringe) {
          keep = !((m & 1 && y < wob(v, 0, x, 1, 3)) || (m & 4 && y > 15 - wob(v, 2, x, 1, 3)) || (m & 8 && x < wob(v, 3, y, 1, 3)) || (m & 2 && x > 15 - wob(v, 1, y, 1, 3)));
          // Round the corners where two eroded sides meet.
          if (keep && m & 1 && m & 8 && x + y < 6) keep = false;
          if (keep && m & 1 && m & 2 && 15 - x + y < 6) keep = false;
          if (keep && m & 4 && m & 8 && x + 15 - y < 6) keep = false;
          if (keep && m & 4 && m & 2 && 30 - x - y < 6) keep = false;
        } else {
          keep = !!((m & 1 && y < wob(v, 0, x, 0, 5)) || (m & 4 && y > 15 - wob(v, 2, x, 0, 5)) || (m & 8 && x < wob(v, 3, y, 0, 5)) || (m & 2 && x > 15 - wob(v, 1, y, 0, 5)));
        }
        if (!keep) continue;
        const si = (y * src.width + t * TILE + x) * 4, di = ((t * TILE + y) * SOFT_COLS * TILE + f * TILE + x) * 4;
        out.data[di] = sx.data[si]; out.data[di + 1] = sx.data[si + 1]; out.data[di + 2] = sx.data[si + 2]; out.data[di + 3] = sx.data[si + 3];
      }
    }
    c.putImageData(out, 0, 0);
  });
}

export function makeTextures(scene: Phaser.Scene) {
  const tiles = canvasTex(scene, "tiles", TILE * COUNT, TILE, (c) => { for (let i = 0; i < COUNT; i++) drawTile(c, i); });
  for (let i = 0; i < COUNT; i++) tiles.add(`t${i}`, 0, i * TILE, 0, TILE, TILE); // single tiles, for break effects
  makeSoftTiles(scene, tiles.getSourceImage() as HTMLCanvasElement);

  // Player: four facings in one strip (down, left, right, up), 16x16 each.
  makePlayerTexture(scene, { tunic: "#e9e1cf", hair: "#4a3324", skin: "#c98e62" });
  makeGlowTexture(scene);
  makeAmbientTextures(scene);
  makeOmenTextures(scene);
  makeTiresiasTextures(scene);
  makeFenceTextures(scene);
  makeHomeTextures(scene);

  // The one-room hut: limestone walls, reed thatch, a door.
  canvasTex(scene, "hut", 64, 56, (c) => {
    px(c, 4, 22, 56, 32, "#e8dcc2"); px(c, 4, 48, 56, 6, "#c9b48f");
    px(c, 0, 8, 64, 18, "#c9a35a"); px(c, 4, 2, 56, 8, "#d8b468"); px(c, 0, 24, 64, 3, "#a9853f");
    for (let x = 2; x < 64; x += 5) px(c, x, 10, 1, 14, "#b38f48");
    px(c, 26, 32, 12, 22, "#6b4a2b"); px(c, 28, 34, 8, 18, "#5a3d22"); px(c, 34, 43, 1, 2, "#e6c74a");
    px(c, 10, 32, 8, 7, "#5a4632"); px(c, 46, 32, 8, 7, "#5a4632");
  });

  // Village cottages, three ways: thatch, weathered thatch, and a flat clay roof.
  const cottage = (key: string, roof: string, roofD: string, wall: string, flat: boolean) => canvasTex(scene, key, 48, 44, (c) => {
    px(c, 3, 16, 42, 26, wall); px(c, 3, 38, 42, 4, "#b8a682");
    if (flat) { px(c, 1, 10, 46, 8, roof); px(c, 1, 16, 46, 2, roofD); px(c, 5, 8, 38, 2, roofD); }
    else { px(c, 0, 6, 48, 13, roof); px(c, 4, 1, 40, 6, roof); px(c, 0, 17, 48, 2, roofD); for (let x = 2; x < 48; x += 4) px(c, x, 8, 1, 9, roofD); }
    px(c, 19, 25, 10, 17, "#6b4a2b"); px(c, 21, 27, 6, 14, "#5a3d22");
    px(c, 7, 24, 7, 6, "#5a4632"); px(c, 35, 24, 6, 6, "#5a4632");
  });
  cottage("cottage0", "#c9a35a", "#a9853f", "#e8dcc2", false);
  cottage("cottage1", "#a89060", "#7a6a48", "#ddd0b4", false);
  cottage("cottage2", "#b8805a", "#8a5a3a", "#eee4cc", true);
  // A hut in the wild: fieldstone below, wattle above, brushwood on the roof.
  canvasTex(scene, "wildhut", 40, 36, (c) => {
    px(c, 3, 14, 34, 20, "#a89a7a"); for (const [x, y] of [[4, 28], [10, 30], [17, 28], [24, 30], [31, 28], [7, 24], [27, 24]]) px(c, x, y, 5, 3, "#8a7e62");
    px(c, 0, 4, 40, 12, "#7a6a3a"); px(c, 3, 0, 34, 6, "#8a7a44"); for (let x = 1; x < 40; x += 3) px(c, x, 6, 1, 8, "#5e5030");
    px(c, 15, 20, 9, 14, "#4a3420"); px(c, 6, 19, 5, 4, "#3a2e24");
  });

  canvasTex(scene, "altar", 16, 20, (c) => {
    px(c, 2, 8, 12, 12, "#d9d0bd"); px(c, 1, 7, 14, 2, "#ece4d2"); px(c, 2, 18, 12, 2, "#b7ac95");
    px(c, 6, 2, 4, 5, "#e8862e"); px(c, 7, 0, 2, 3, "#f2c14e");
  });

  canvasTex(scene, "sign", 16, 16, (c) => {
    px(c, 7, 6, 2, 10, "#6b4a2b"); px(c, 1, 2, 14, 6, "#b08a55"); px(c, 2, 4, 12, 1, "#7a5a33");
  });

  canvasTex(scene, "hearth", 32, 24, (c) => {
    px(c, 0, 8, 32, 16, "#8d877b"); px(c, 2, 10, 28, 12, "#5a4f45");
    px(c, 8, 12, 16, 8, "#e8862e"); px(c, 11, 8, 10, 6, "#f2c14e"); px(c, 14, 5, 4, 4, "#fbe39a");
  });

  canvasTex(scene, "bed", 16, 28, (c) => {
    px(c, 0, 0, 16, 28, "#6b4a2b"); px(c, 1, 1, 14, 26, "#c9b48f"); px(c, 2, 2, 12, 6, "#e9e1cf"); px(c, 1, 10, 14, 17, "#b0412f");
  });

  canvasTex(scene, "niche", 16, 16, (c) => {
    px(c, 0, 0, 16, 16, "#d8c9a8"); px(c, 3, 3, 10, 10, "#a99878"); px(c, 6, 6, 4, 6, "#e6c74a"); px(c, 7, 4, 2, 2, "#e8862e");
  });

  canvasTex(scene, "well", 20, 22, (c) => {
    px(c, 2, 8, 16, 12, "#a49e91"); px(c, 1, 7, 18, 3, "#c4bdae"); px(c, 4, 9, 12, 4, "#2f4a5c");
    px(c, 2, 18, 16, 2, "#7f7a70"); px(c, 3, 0, 2, 9, "#6b4a2b"); px(c, 15, 0, 2, 9, "#6b4a2b"); px(c, 3, 0, 14, 2, "#7a5a33");
    px(c, 9, 2, 2, 6, "#c9b48f");
  });

  // Things you make and set down on the ground.
  canvasTex(scene, "pl_Workbench", 24, 18, (c) => {
    px(c, 2, 16, 20, 2, "rgba(0,0,0,0.22)");
    px(c, 3, 9, 2, 8, "#5e4026"); px(c, 19, 9, 2, 8, "#5e4026"); px(c, 4, 13, 16, 1, "#6b4a2b");
    px(c, 1, 6, 22, 4, "#9c7445"); px(c, 1, 6, 22, 1, "#b88d58"); px(c, 1, 9, 22, 1, "#6b4a2b");
    px(c, 5, 4, 6, 2, "#8a8780"); px(c, 9, 3, 1, 3, "#6b4a2b"); // an adze
    px(c, 14, 5, 5, 1, "#d9b25e"); px(c, 15, 4, 3, 1, "#c9a24e"); // shavings
  });
  canvasTex(scene, "pl_Kiln", 20, 24, (c) => {
    px(c, 1, 22, 18, 2, "rgba(0,0,0,0.25)");
    px(c, 3, 8, 14, 14, "#b0703f"); px(c, 5, 4, 10, 4, "#b0703f"); px(c, 7, 2, 6, 2, "#a8653a"); px(c, 8, 0, 4, 2, "#6b5a4e");
    px(c, 2, 18, 16, 4, "#8a8780"); px(c, 3, 18, 2, 2, "#a49e91"); px(c, 9, 19, 3, 2, "#a49e91"); px(c, 14, 18, 2, 2, "#a49e91");
    px(c, 7, 14, 6, 5, "#2a1d14"); px(c, 8, 16, 4, 3, "#c4703f"); px(c, 9, 17, 2, 2, "#f2c14e");
    px(c, 4, 10, 2, 1, "#c98a55"); px(c, 13, 7, 2, 1, "#c98a55");
  });
  canvasTex(scene, "pl_Loom", 20, 26, (c) => {
    px(c, 1, 24, 18, 2, "rgba(0,0,0,0.22)");
    px(c, 2, 1, 2, 24, "#6b4a2b"); px(c, 16, 1, 2, 24, "#6b4a2b"); px(c, 1, 1, 18, 2, "#8a5f35");
    for (let x = 5; x <= 15; x += 2) px(c, x, 3, 1, 15, "#e9e1cf");
    px(c, 4, 3, 12, 7, "#d8c8a4"); for (let y = 4; y < 10; y += 2) px(c, 4, y, 12, 1, "#c4703f");
    px(c, 3, 12, 14, 1, "#8a5f35");
    for (let x = 5; x <= 15; x += 2) px(c, x - 1, 18, 2, 3, "#a8653a");
  });
  canvasTex(scene, "pl_Press", 28, 22, (c) => {
    px(c, 1, 20, 26, 2, "rgba(0,0,0,0.22)");
    px(c, 3, 13, 22, 7, "#a49e91"); px(c, 3, 13, 22, 1, "#c4bdae"); px(c, 6, 15, 16, 3, "#7f7a70"); px(c, 24, 17, 3, 2, "#7f7a70");
    px(c, 4, 2, 3, 12, "#6b4a2b"); px(c, 1, 5, 26, 3, "#8a5f35"); px(c, 1, 5, 26, 1, "#a87a48"); px(c, 22, 7, 2, 8, "#5e4026");
    px(c, 10, 9, 8, 5, "#5e4026"); px(c, 11, 10, 6, 3, "#2a1d14"); px(c, 25, 8, 2, 6, "#a49e91");
  });
  canvasTex(scene, "pl_Forge", 22, 22, (c) => {
    px(c, 1, 20, 20, 2, "rgba(0,0,0,0.25)");
    px(c, 2, 9, 14, 11, "#a8653a"); px(c, 2, 9, 14, 2, "#c4703f"); px(c, 4, 11, 10, 4, "#2a1d14"); px(c, 5, 12, 8, 3, "#d9732e"); px(c, 7, 12, 4, 2, "#f2c14e");
    px(c, 7, 1, 4, 8, "#8a8780"); px(c, 6, 0, 6, 2, "#6b6a64");
    px(c, 15, 13, 6, 5, "#8a5f35"); px(c, 16, 14, 4, 3, "#a47a52"); px(c, 14, 15, 2, 1, "#6b4a2b");
    px(c, 3, 17, 4, 3, "#5e5a54"); px(c, 2, 16, 6, 1, "#7f7a70");
  });
  // A herm: a square pillar with a bearded head, at a crossroads; stones heaped at its foot.
  canvasTex(scene, "herm", 12, 26, (c) => {
    px(c, 1, 23, 10, 3, "rgba(0,0,0,0.25)");
    px(c, 3, 8, 6, 16, "#d8d0bc"); px(c, 3, 8, 1, 16, "#ece6d6"); px(c, 8, 8, 1, 16, "#b8b0a0"); px(c, 2, 8, 8, 2, "#c4bcaa");
    px(c, 3, 1, 6, 7, "#d8d0bc"); px(c, 4, 2, 4, 1, "#8a7a60"); px(c, 4, 4, 1, 1, "#5e5040"); px(c, 7, 4, 1, 1, "#5e5040"); px(c, 4, 5, 4, 3, "#a8987a");
    px(c, 1, 21, 4, 3, "#9a948a"); px(c, 7, 22, 4, 2, "#8a8780"); px(c, 4, 22, 3, 2, "#a49e91");
  });
  // A country shrine: a little altar under a roof on two columns, and a god's banner.
  canvasTex(scene, "wshrine", 34, 30, (c) => {
    px(c, 1, 27, 32, 3, "rgba(0,0,0,0.22)");
    px(c, 2, 24, 30, 4, "#bdb5a2"); px(c, 2, 24, 30, 1, "#d8d0bc");
    px(c, 5, 9, 3, 15, "#e6dfcd"); px(c, 26, 9, 3, 15, "#e6dfcd"); px(c, 5, 9, 1, 15, "#f4efe2"); px(c, 26, 9, 1, 15, "#f4efe2");
    px(c, 2, 6, 30, 3, "#d8d0bc"); px(c, 4, 3, 26, 3, "#c4703f"); px(c, 8, 1, 18, 2, "#a8653a"); px(c, 14, 0, 6, 1, "#a8653a");
    px(c, 12, 16, 10, 8, "#a49e91"); px(c, 12, 16, 10, 1, "#c4bcaa"); px(c, 15, 13, 4, 3, "#f2c14e"); px(c, 16, 11, 2, 2, "#fff3c0");
  });
  // A graveyard: grave stelai, a mound, and a little low wall.
  canvasTex(scene, "graves", 48, 30, (c) => {
    px(c, 0, 26, 48, 4, "rgba(0,0,0,0.2)");
    px(c, 26, 14, 20, 12, "#7a6a4e"); px(c, 28, 12, 16, 4, "#86765a"); px(c, 31, 10, 10, 3, "#8e7e62");
    for (const [x, h] of [[3, 14], [11, 11], [19, 15]] as [number, number][]) { px(c, x, 26 - h, 5, h, "#c4bcaa"); px(c, x, 26 - h, 5, 1, "#e0d8c6"); px(c, x + 1, 26 - h - 2, 3, 2, "#c4bcaa"); px(c, x + 1, 26 - h + 4, 3, 1, "#8a8270"); }
    px(c, 0, 26, 48, 2, "#8a8780"); for (let x = 0; x < 48; x += 6) px(c, x, 25, 4, 1, "#a49e91");
  });
  // ---- landmarks
  const sh = (c: Ctx, x: number, y: number, w: number) => px(c, x, y, w, 3, "rgba(0,0,0,0.22)");
  canvasTex(scene, "bigoak", 48, 56, (c) => {
    sh(c, 8, 52, 32); px(c, 20, 30, 9, 24, "#5e4026"); px(c, 20, 30, 2, 24, "#7a5a33"); px(c, 16, 50, 6, 4, "#5e4026"); px(c, 27, 50, 7, 4, "#5e4026");
    for (const [x, y, r, col] of [[24, 18, 17, "#3f6b34"], [12, 24, 11, "#3f6b34"], [36, 24, 11, "#3f6b34"], [22, 12, 11, "#4f7f40"], [32, 16, 8, "#4f7f40"], [16, 20, 7, "#5a8a48"]] as [number, number, number, string][]) {
      c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    px(c, 18, 34, 2, 6, "#e9e1cf"); px(c, 29, 32, 2, 5, "#c94c4c"); // ribbons
  });
  canvasTex(scene, "beetree", 28, 40, (c) => {
    sh(c, 4, 37, 20); px(c, 9, 14, 10, 24, "#6b4a2b"); px(c, 9, 14, 2, 24, "#8a6038"); px(c, 12, 22, 4, 6, "#1f1408");
    c.fillStyle = "#4f7f40"; c.beginPath(); c.arc(14, 10, 12, 0, Math.PI * 2); c.fill(); c.fillStyle = "#5a8a48"; c.beginPath(); c.arc(10, 8, 6, 0, Math.PI * 2); c.fill();
    for (const [x, y] of [[17, 24], [19, 21], [16, 29], [21, 27]]) px(c, x, y, 1, 1, "#f2c14e");
  });
  canvasTex(scene, "den", 28, 18, (c) => {
    sh(c, 2, 15, 24); px(c, 2, 4, 24, 12, "#8a8780"); px(c, 4, 2, 18, 4, "#a49e91"); px(c, 2, 4, 3, 3, "#a49e91");
    c.fillStyle = "#140c06"; c.beginPath(); c.ellipse(14, 13, 7, 5, 0, Math.PI, 0); c.fill(); px(c, 7, 13, 14, 3, "#140c06");
  });
  canvasTex(scene, "lmbones", 22, 12, (c) => {
    for (let i = 0; i < 5; i++) { px(c, 4 + i * 3, 3, 1, 7, "#e9e1cf"); } px(c, 3, 6, 15, 1, "#d8d0bc");
    px(c, 17, 6, 4, 4, "#e9e1cf"); px(c, 18, 7, 1, 1, "#1f1408"); px(c, 20, 7, 1, 1, "#1f1408"); px(c, 0, 9, 4, 1, "#d8d0bc");
  });
  canvasTex(scene, "log", 64, 22, (c) => {
    sh(c, 4, 19, 56); px(c, 6, 6, 50, 12, "#6b4a2b"); px(c, 6, 6, 50, 2, "#8a6038"); px(c, 6, 16, 50, 2, "#4a3220");
    c.fillStyle = "#8a6038"; c.beginPath(); c.ellipse(57, 12, 5, 7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#c9a26a"; c.beginPath(); c.ellipse(57, 12, 3, 5, 0, 0, Math.PI * 2); c.fill();
    for (const x of [2, 0, 4]) px(c, x, 3 + x * 2, 6, 2, "#5e4026"); px(c, 20, 4, 6, 3, "#5e7a3a"); px(c, 38, 15, 5, 3, "#c4a070"); px(c, 30, 5, 3, 2, "#d8c890");
  });
  canvasTex(scene, "stele", 8, 18, (c) => { sh(c, 0, 15, 8); px(c, 1, 2, 6, 14, "#c4bcaa"); px(c, 2, 0, 4, 2, "#c4bcaa"); px(c, 1, 2, 1, 14, "#e0d8c6"); for (let y = 5; y < 13; y += 2) px(c, 2, y, 4, 1, "#8a8270"); });
  canvasTex(scene, "pressruin", 40, 28, (c) => {
    sh(c, 2, 25, 36); px(c, 2, 12, 36, 14, "#a49e91"); px(c, 2, 12, 36, 2, "#c4bcaa"); px(c, 12, 14, 14, 12, "#5e5a54");
    px(c, 4, 4, 3, 9, "#a49e91"); px(c, 30, 6, 3, 7, "#a49e91"); px(c, 6, 18, 6, 6, "#c4bcaa"); px(c, 28, 20, 8, 4, "#8a8780");
    c.fillStyle = "#bdb5a2"; c.beginPath(); c.arc(19, 21, 5, 0, Math.PI * 2); c.fill(); px(c, 18, 20, 2, 2, "#5e5a54");
  });
  canvasTex(scene, "boat", 36, 14, (c) => { sh(c, 2, 11, 32); px(c, 4, 4, 28, 7, "#6b4a2b"); px(c, 2, 3, 32, 2, "#8a6038"); px(c, 6, 5, 24, 3, "#3a2a1a"); px(c, 14, 0, 1, 5, "#8a6038"); px(c, 20, 9, 12, 2, "rgba(60,90,110,0.6)"); });
  canvasTex(scene, "wreck", 56, 30, (c) => {
    sh(c, 2, 27, 52); px(c, 6, 14, 44, 12, "#5e4026"); px(c, 6, 14, 44, 2, "#7a5a33");
    for (let i = 0; i < 6; i++) px(c, 8 + i * 7, 4 + (i % 2) * 3, 3, 12, "#6b4a2b"); px(c, 28, 0, 2, 16, "#7a5a33"); px(c, 20, 18, 8, 6, "#2a1d14"); px(c, 40, 20, 6, 5, "#c4703f");
  });
  canvasTex(scene, "nest", 18, 10, (c) => { px(c, 1, 4, 16, 5, "#7a5a33"); for (let x = 0; x < 18; x += 3) px(c, x, 3 + (x % 2), 4, 1, "#9c7445"); px(c, 6, 3, 3, 2, "#e9e1cf"); px(c, 10, 3, 3, 2, "#d8d0bc"); });
  canvasTex(scene, "palm", 24, 40, (c) => {
    sh(c, 6, 37, 12); for (let y = 12; y < 38; y++) px(c, 11 + Math.round(Math.sin(y / 8) * 2), y, 3, 1, y % 3 ? "#8a6038" : "#6b4a2b");
    for (const [dx, dy] of [[-10, 4], [10, 4], [-8, -3], [8, -3], [0, -6]] as [number, number][]) { c.strokeStyle = "#4f7f40"; c.lineWidth = 3; c.beginPath(); c.moveTo(12, 12); c.quadraticCurveTo(12 + dx / 2, 6 + dy, 12 + dx, 12 + dy); c.stroke(); }
    px(c, 10, 12, 5, 3, "#8a5a2c");
  });
  canvasTex(scene, "cairn", 22, 24, (c) => {
    sh(c, 1, 21, 20); for (const [x, y, w] of [[2, 16, 18], [4, 11, 14], [6, 7, 10], [8, 3, 6]] as [number, number, number][]) { px(c, x, y, w, 5, "#a49e91"); px(c, x, y, w, 1, "#c4bcaa"); }
    px(c, 9, 0, 4, 3, "#8a8780"); px(c, 14, 18, 3, 2, "#c94c4c"); px(c, 4, 19, 3, 2, "#f2c14e");
  });
  canvasTex(scene, "mound", 64, 30, (c) => {
    sh(c, 4, 26, 56); c.fillStyle = "#5e7a3a"; c.beginPath(); c.ellipse(32, 26, 30, 20, 0, Math.PI, 0); c.fill();
    c.fillStyle = "#6f8a4a"; c.beginPath(); c.ellipse(28, 24, 20, 13, 0, Math.PI, 0); c.fill();
    px(c, 28, 16, 8, 10, "#8a8780"); px(c, 29, 18, 6, 8, "#2a1d14");
  });
  canvasTex(scene, "spears", 18, 22, (c) => {
    for (const [x, lean] of [[3, 2], [9, -1], [14, 1]] as [number, number][]) { for (let y = 2; y < 20; y++) px(c, x + Math.round((lean * (20 - y)) / 20), y, 1, 1, "#7a5a33"); px(c, x + lean - 1, 0, 3, 3, "#8a7058"); }
    px(c, 4, 18, 8, 3, "#8a8780"); px(c, 6, 17, 4, 2, "#a49e91");
  });
  canvasTex(scene, "tower", 40, 64, (c) => {
    sh(c, 2, 61, 36); px(c, 6, 14, 28, 48, "#a49e91"); px(c, 6, 14, 3, 48, "#c4bcaa"); px(c, 31, 14, 3, 48, "#8a8780");
    for (let y = 18; y < 62; y += 6) for (let x = 6 + ((y / 6) % 2) * 4; x < 34; x += 8) px(c, x, y, 1, 4, "#8a8780");
    for (let y = 16; y < 62; y += 6) px(c, 6, y, 28, 1, "#8a8780");
    px(c, 6, 8, 6, 6, "#a49e91"); px(c, 16, 10, 6, 4, "#a49e91"); px(c, 28, 6, 6, 8, "#a49e91"); // broken crown
    px(c, 16, 48, 8, 14, "#2a1d14"); px(c, 16, 26, 4, 6, "#2a1d14"); px(c, 36, 56, 4, 4, "#a49e91"); px(c, 0, 58, 5, 4, "#a49e91");
  });
  canvasTex(scene, "columns", 26, 46, (c) => {
    sh(c, 1, 43, 24); for (const [x, h] of [[2, 40], [15, 30]] as [number, number][]) { px(c, x, 44 - h, 8, h, "#e6dfcd"); px(c, x, 44 - h, 2, h, "#f4efe2"); px(c, x + 3, 44 - h, 1, h, "#c4bcaa"); px(c, x - 1, 44 - h - 2, 10, 3, "#d8d0bc"); }
    px(c, 12, 41, 12, 4, "#d8d0bc");
  });
  canvasTex(scene, "statue", 18, 40, (c) => {
    sh(c, 1, 37, 16); px(c, 2, 30, 14, 8, "#c4bcaa"); px(c, 2, 30, 14, 1, "#e0d8c6");
    px(c, 6, 6, 6, 24, "#e6dfcd"); px(c, 7, 1, 4, 5, "#e6dfcd"); px(c, 4, 10, 2, 12, "#e6dfcd"); px(c, 12, 8, 2, 10, "#e6dfcd"); px(c, 13, 4, 1, 6, "#e6dfcd");
    px(c, 7, 22, 2, 8, "#c4bcaa"); px(c, 10, 22, 2, 8, "#c4bcaa"); px(c, 8, 2, 1, 1, "#8a8270"); px(c, 10, 2, 1, 1, "#8a8270");
  });
  canvasTex(scene, "pl_Campfire", 18, 16, (c) => {
    px(c, 1, 13, 16, 3, "rgba(0,0,0,0.25)");
    for (const [x, y] of [[1, 11], [4, 13], [9, 14], [13, 12], [15, 9], [2, 8]] as [number, number][]) { px(c, x, y, 3, 2, "#8a8780"); px(c, x, y, 3, 1, "#a49e91"); }
    px(c, 5, 10, 8, 2, "#6b4a2b"); px(c, 6, 9, 6, 1, "#5e4026");
    px(c, 6, 4, 6, 6, "#e0702a"); px(c, 7, 2, 4, 5, "#f2a03a"); px(c, 8, 1, 2, 4, "#f2d06a"); px(c, 8, 6, 2, 3, "#fff3c0");
  });
  canvasTex(scene, "pl_Boat", 30, 14, (c) => {
    px(c, 3, 3, 24, 8, "#7a5a33"); px(c, 1, 2, 28, 2, "#9c7445"); px(c, 1, 2, 28, 1, "#b88d58"); px(c, 5, 4, 20, 5, "#4a3220");
    px(c, 2, 10, 26, 2, "#5e4026"); px(c, 13, 4, 4, 5, "#7a5a33"); px(c, 0, 8, 6, 1, "#c4a070"); px(c, 24, 8, 6, 1, "#c4a070");
  });
  canvasTex(scene, "slingStone", 4, 4, (c) => { px(c, 1, 0, 2, 4, "#8d877b"); px(c, 0, 1, 4, 2, "#8d877b"); px(c, 1, 1, 1, 1, "#b5afa2"); });
  canvasTex(scene, "pl_Tent", 24, 18, (c) => {
    px(c, 1, 16, 22, 2, "rgba(0,0,0,0.25)");
    for (let y = 0; y < 16; y++) { const half = 1 + Math.round(y * 0.68); px(c, 12 - half, y + 1, half * 2, 1, y % 4 === 0 ? "#a08458" : "#b89a6a"); px(c, 12 - half, y + 1, 1, 1, "#8a6c48"); }
    px(c, 11, 0, 2, 2, "#6b4a2b"); px(c, 10, 8, 4, 9, "#3a2a1a"); px(c, 9, 10, 1, 7, "#d8c8a8"); px(c, 14, 10, 1, 7, "#d8c8a8"); // the flap tied back
    px(c, 0, 16, 2, 1, "#6b4a2b"); px(c, 22, 16, 2, 1, "#6b4a2b");
  });
  canvasTex(scene, "pl_Chest", 16, 14, (c) => {
    px(c, 1, 12, 14, 2, "rgba(0,0,0,0.22)");
    px(c, 1, 3, 14, 10, "#7a5a33"); px(c, 1, 2, 14, 3, "#9c7445"); px(c, 1, 2, 14, 1, "#b88d58");
    px(c, 1, 5, 14, 1, "#5e4026"); px(c, 3, 3, 1, 10, "#5e4026"); px(c, 12, 3, 1, 10, "#5e4026");
    px(c, 7, 4, 2, 3, "#c98a55"); px(c, 7, 6, 2, 1, "#8a5a2c");
  });
  const snare = canvasTex(scene, "pl_Snare", 32, 16, (c) => { for (const full of [false, true]) { const o = full ? 16 : 0;
    px(c, o + 3, 4, 1, 10, "#6b4a2b"); px(c, o + 3, 3, 8, 1, "#7a5a33"); px(c, o + 10, 3, 1, 3, "#c9b48f");
    px(c, o + 8, 6, 5, 1, "#c9b48f"); px(c, o + 8, 6, 1, 4, "#c9b48f"); px(c, o + 12, 6, 1, 4, "#c9b48f"); px(c, o + 8, 10, 5, 1, "#c9b48f");
    px(c, o + 2, 13, 3, 1, "#5a3d22");
    if (full) { px(c, o + 6, 9, 8, 4, "#a08a6a"); px(c, o + 12, 7, 2, 3, "#a08a6a"); px(c, o + 13, 6, 1, 2, "#8a7558"); px(c, o + 6, 12, 1, 1, "#e9e1cf"); px(c, o + 12, 8, 1, 1, "#1a1008"); }
  } });
  snare.add(0, 0, 0, 0, 16, 16); snare.add(1, 0, 16, 0, 16, 16);

  // Item icons, one 16x16 frame each, in the order of ITEM_ICON_ORDER.
  const icons = canvasTex(scene, "items", 16 * ITEM_ICON_ORDER.length, 16, (c) => {
    ITEM_ICON_ORDER.forEach((id, i) => drawIcon(c, i * 16, id));
  });
  ITEM_ICON_ORDER.forEach((id, i) => icons.add(id, 0, i * 16, 0, 16, 16));

  // Animals: two 16x16 frames each, facing right (flipped to face left).
  const strip = (key: string, draw: (c: Ctx, o: number, f: number) => void) => {
    const t = canvasTex(scene, key, 32, 16, (c) => { draw(c, 0, 0); draw(c, 16, 1); });
    t.add(0, 0, 0, 0, 16, 16); t.add(1, 0, 16, 0, 16, 16);
  };
  strip("goat", (c, o, f) => {
    px(c, o + 3, 14, 10, 2, "rgba(0,0,0,0.22)");
    const L = "#6b5a45";
    if (f === 0) { px(c, o + 4, 11, 1, 3, L); px(c, o + 6, 11, 1, 3, L); px(c, o + 9, 11, 1, 3, L); px(c, o + 11, 11, 1, 3, L); }
    else { px(c, o + 3, 11, 1, 3, L); px(c, o + 7, 11, 1, 3, L); px(c, o + 8, 11, 1, 3, L); px(c, o + 12, 11, 1, 3, L); }
    px(c, o + 3, 6, 9, 6, "#efe7d6"); px(c, o + 3, 10, 9, 1, "#d6ccb6"); px(c, o + 2, 5, 2, 2, "#efe7d6");
    px(c, o + 11, 3, 4, 5, "#efe7d6"); px(c, o + 14, 6, 1, 2, "#d6ccb6");
    px(c, o + 11, 1, 1, 3, "#5a4632"); px(c, o + 12, 0, 2, 1, "#5a4632"); px(c, o + 10, 4, 2, 1, "#d6ccb6");
    px(c, o + 13, 4, 1, 1, "#2a1d14"); px(c, o + 13, 8, 1, 2, "#d6ccb6");
  });
  strip("hare", (c, o, f) => {
    px(c, o + 4, 14, 8, 2, "rgba(0,0,0,0.22)");
    const y = f === 0 ? 0 : -2, B = "#a48461", D = "#86684a";
    px(c, o + 4, 9 + y, 8, 5, B); px(c, o + 5, 13 + y, 6, 1, D); px(c, o + 3, 9 + y, 2, 2, "#f2ece0");
    px(c, o + 10, 7 + y, 4, 4, B); px(c, o + 12, 8 + y, 1, 1, "#2a1d14");
    px(c, o + 10, 2 + y, 1, 5, B); px(c, o + 12, 3 + y, 1, 4, D);
    if (f === 1) px(c, o + 3, 13 + y, 3, 2, D);
  });
  strip("fox", (c, o, f) => {
    px(c, o + 2, 14, 12, 2, "rgba(0,0,0,0.22)");
    const R = "#c8642a", D = "#3a2c22";
    if (f === 0) { px(c, o + 4, 11, 1, 3, D); px(c, o + 10, 11, 1, 3, D); } else { px(c, o + 5, 11, 1, 3, D); px(c, o + 9, 11, 1, 3, D); }
    px(c, o + 3, 8, 9, 4, R); px(c, o + 0, 6, 4, 3, R); px(c, o + 0, 6, 1, 2, "#f2ece0");
    px(c, o + 11, 6, 4, 4, R); px(c, o + 15, 8, 1, 1, D); px(c, o + 11, 4, 1, 2, R); px(c, o + 14, 4, 1, 2, R);
    px(c, o + 11, 9, 3, 2, "#f2ece0"); px(c, o + 13, 7, 1, 1, D);
  });
  strip("deer", (c, o, f) => {
    px(c, o + 2, 14, 12, 2, "rgba(0,0,0,0.22)");
    const B = "#9a6a3e", D = "#5a3d22";
    if (f === 0) { px(c, o + 3, 10, 1, 4, D); px(c, o + 5, 10, 1, 4, D); px(c, o + 10, 10, 1, 4, D); px(c, o + 12, 10, 1, 4, D); }
    else { px(c, o + 2, 10, 1, 4, D); px(c, o + 6, 10, 1, 4, D); px(c, o + 9, 10, 1, 4, D); px(c, o + 13, 10, 1, 4, D); }
    px(c, o + 2, 6, 11, 5, B); px(c, o + 4, 7, 2, 1, "#e8dcc2"); px(c, o + 8, 8, 2, 1, "#e8dcc2"); px(c, o + 1, 6, 2, 2, "#f2ece0");
    px(c, o + 11, 3, 2, 4, B); px(c, o + 12, 2, 4, 3, B); px(c, o + 14, 3, 1, 1, D);
    px(c, o + 11, 0, 1, 2, "#c9b48f"); px(c, o + 13, 0, 1, 2, "#c9b48f"); px(c, o + 10, 0, 1, 1, "#c9b48f"); px(c, o + 14, 0, 1, 1, "#c9b48f");
  });
  strip("boar", (c, o, f) => {
    px(c, o + 2, 14, 12, 2, "rgba(0,0,0,0.25)");
    const B = "#4a3a2c", D = "#2a1d14";
    if (f === 0) { px(c, o + 4, 11, 2, 3, D); px(c, o + 10, 11, 2, 3, D); } else { px(c, o + 3, 11, 2, 3, D); px(c, o + 11, 11, 2, 3, D); }
    px(c, o + 2, 6, 11, 6, B); px(c, o + 3, 5, 8, 1, "#3a2c22"); for (let i = 0; i < 4; i++) px(c, o + 4 + i * 2, 4, 1, 2, D);
    px(c, o + 12, 7, 4, 4, B); px(c, o + 15, 9, 1, 2, "#7a5a50"); px(c, o + 13, 10, 1, 2, "#f2ece0"); px(c, o + 13, 8, 1, 1, "#c4703f");
  });
  strip("wolf", (c, o, f) => {
    px(c, o + 2, 14, 12, 2, "rgba(0,0,0,0.22)");
    const G1 = "#7a7468", D = "#3a3630", L = "#a8a294";
    if (f === 0) { px(c, o + 4, 10, 1, 4, D); px(c, o + 6, 10, 1, 4, D); px(c, o + 10, 10, 1, 4, D); px(c, o + 12, 10, 1, 4, D); }
    else { px(c, o + 3, 10, 1, 4, D); px(c, o + 7, 10, 1, 4, D); px(c, o + 9, 10, 1, 4, D); px(c, o + 13, 10, 1, 4, D); }
    px(c, o + 3, 6, 10, 5, G1); px(c, o + 4, 6, 7, 1, D); px(c, o + 5, 10, 6, 1, L);
    px(c, o + 0, 6, 4, 2, G1); px(c, o + 0, 7, 1, 2, D);
    px(c, o + 11, 4, 4, 4, G1); px(c, o + 15, 6, 1, 2, D); px(c, o + 11, 2, 1, 2, G1); px(c, o + 14, 2, 1, 2, G1); px(c, o + 13, 5, 1, 1, "#e8c86a"); px(c, o + 12, 7, 3, 1, L);
  });
  // ---- the far lands' animals (frame 0 standing, frame 1 moving or in flight) ----
  const flyer = (key: string, body: string, wing: string, head: string, beak: string, size = 1) => strip(key, (c, o, f) => {
    const w = 4 + size, h = 3 + size;
    if (f === 0) { px(c, o + 5, 14, w + 1, 1, "rgba(0,0,0,0.2)"); px(c, o + 5, 13 - h, w, h, body); px(c, o + 5, 13 - h, w - 1, 1, wing); px(c, o + 4 + w, 12 - h, 2, 2, head); px(c, o + 6 + w, 13 - h, 1, 1, beak); px(c, o + 6, 13, 1, 1, beak); px(c, o + 8, 13, 1, 1, beak); }
    else { px(c, o + 5, 7, w, 2, body); px(c, o + 2, 4, 4, 2, wing); px(c, o + 5 + w, 4, 4, 2, wing); px(c, o + 4 + w, 6, 2, 2, head); px(c, o + 6 + w, 7, 1, 1, beak); }
  });
  flyer("duck", "#8a6a4a", "#3a6a4a", "#2a5a3a", "#d8a030");
  flyer("gull", "#e8e8e0", "#a8b0b8", "#f0f0e8", "#e0b030");
  flyer("pigeon", "#8a8e98", "#6a6e78", "#5a7a6a", "#d08080");
  strip("heron", (c, o, f) => {
    if (f === 0) { px(c, o + 6, 15, 5, 1, "rgba(0,0,0,0.2)"); px(c, o + 7, 10, 1, 5, "#6b6050"); px(c, o + 9, 10, 1, 5, "#6b6050"); px(c, o + 5, 5, 6, 5, "#a8b0b8"); px(c, o + 10, 1, 1, 5, "#c8ccd0"); px(c, o + 10, 0, 3, 2, "#d8dce0"); px(c, o + 13, 1, 3, 1, "#d8a030"); px(c, o + 11, 0, 1, 1, "#1a1a1a"); }
    else { px(c, o + 4, 7, 7, 2, "#a8b0b8"); px(c, o + 0, 4, 6, 2, "#8a929a"); px(c, o + 10, 4, 6, 2, "#8a929a"); px(c, o + 11, 6, 3, 1, "#c8ccd0"); px(c, o + 14, 6, 2, 1, "#d8a030"); }
  });
  strip("crab", (c, o, f) => {
    px(c, o + 3, 14, 10, 1, "rgba(0,0,0,0.2)"); const R = "#c8583a", D = "#8a3422";
    px(c, o + 4, 10, 8, 4, R); px(c, o + 5, 9, 6, 1, R); px(c, o + 6, 8, 1, 1, "#1a1a1a"); px(c, o + 9, 8, 1, 1, "#1a1a1a");
    px(c, o + 1, 9 - f, 3, 2, D); px(c, o + 12, 9 - f, 3, 2, D);
    for (const x of [3, 5, 10, 12]) px(c, o + x + (f ? 1 : 0), 14, 1, 1, D);
  });
  strip("jackal", (c, o, f) => {
    px(c, o + 2, 14, 12, 2, "rgba(0,0,0,0.22)"); const B = "#b8905a", D = "#3a2c22";
    if (f === 0) { px(c, o + 4, 11, 1, 3, D); px(c, o + 10, 11, 1, 3, D); } else { px(c, o + 5, 11, 1, 3, D); px(c, o + 9, 11, 1, 3, D); }
    px(c, o + 3, 8, 9, 4, B); px(c, o + 1, 7, 3, 2, "#5a4632"); px(c, o + 11, 5, 4, 4, B); px(c, o + 15, 7, 1, 1, D);
    px(c, o + 11, 2, 1, 3, B); px(c, o + 14, 2, 1, 3, B); px(c, o + 13, 6, 1, 1, D); px(c, o + 4, 8, 6, 1, "#7a5a3a");
  });
  strip("scorpion", (c, o, f) => {
    px(c, o + 3, 14, 10, 1, "rgba(0,0,0,0.2)"); const S = "#3a2e22", L = "#5a4a34";
    px(c, o + 6, 11, 6, 3, S); px(c, o + 12, 10, 2, 2, L); px(c, o + 13, 9 - f, 2, 2, L);
    px(c, o + 5, 10, 1, 2, S); px(c, o + 4, 7, 1, 3, S); px(c, o + 4, 5 + f, 2, 2, S); px(c, o + 6, 5 + f, 1, 1, "#c8a040");
    for (const x of [7, 9, 11]) px(c, o + x, 14, 1, 1, L);
  });
  strip("ibex", (c, o, f) => {
    px(c, o + 3, 14, 10, 2, "rgba(0,0,0,0.22)"); const B = "#8a6a48", L = "#5a4632";
    if (f === 0) { px(c, o + 4, 11, 1, 3, L); px(c, o + 6, 11, 1, 3, L); px(c, o + 9, 11, 1, 3, L); px(c, o + 11, 11, 1, 3, L); }
    else { px(c, o + 3, 11, 1, 3, L); px(c, o + 7, 11, 1, 3, L); px(c, o + 8, 11, 1, 3, L); px(c, o + 12, 11, 1, 3, L); }
    px(c, o + 3, 6, 9, 6, B); px(c, o + 3, 10, 9, 1, "#6a5038"); px(c, o + 11, 4, 4, 4, B); px(c, o + 13, 5, 1, 1, "#1a1210");
    px(c, o + 10, 1, 1, 4, "#4a3a2a"); px(c, o + 9, 0, 2, 1, "#4a3a2a"); px(c, o + 8, 1, 1, 2, "#4a3a2a"); px(c, o + 14, 8, 1, 2, "#6a5038");
  });
  strip("bear", (c, o, f) => {
    px(c, o + 1, 14, 14, 2, "rgba(0,0,0,0.25)"); const B = "#5a3e28", D = "#3a2818";
    if (f === 0) { px(c, o + 2, 11, 2, 3, D); px(c, o + 10, 11, 2, 3, D); } else { px(c, o + 3, 11, 2, 3, D); px(c, o + 9, 11, 2, 3, D); }
    px(c, o + 1, 5, 12, 7, B); px(c, o + 3, 4, 7, 2, B); px(c, o + 11, 4, 5, 5, B); px(c, o + 15, 6, 1, 2, "#2a1a10");
    px(c, o + 11, 3, 2, 2, B); px(c, o + 14, 3, 1, 1, B); px(c, o + 13, 5, 1, 1, "#1a1008"); px(c, o + 2, 6, 6, 1, "#6a4a32");
  });
  strip("horse", (c, o, f) => {
    px(c, o + 1, 14, 14, 2, "rgba(0,0,0,0.22)"); const B = "#8a5a32", D = "#3a2618";
    if (f === 0) { px(c, o + 3, 10, 1, 4, D); px(c, o + 5, 10, 1, 4, D); px(c, o + 10, 10, 1, 4, D); px(c, o + 12, 10, 1, 4, D); }
    else { px(c, o + 2, 10, 1, 4, D); px(c, o + 6, 10, 1, 4, D); px(c, o + 9, 10, 1, 4, D); px(c, o + 13, 10, 1, 4, D); }
    px(c, o + 2, 6, 11, 5, B); px(c, o + 12, 2, 2, 6, B); px(c, o + 13, 1, 3, 3, B); px(c, o + 15, 3, 1, 1, "#2a1a10");
    px(c, o + 11, 1, 2, 6, D); px(c, o + 0, 6, 2, 5, D); px(c, o + 14, 2, 1, 1, "#1a1008");
  });
  strip("bustard", (c, o, f) => {
    px(c, o + 4, 14, 8, 1, "rgba(0,0,0,0.2)"); const B = "#b89a6a";
    px(c, o + (f ? 6 : 7), 11, 1, 3, "#8a7a5a"); px(c, o + (f ? 9 : 8), 11, 1, 3, "#8a7a5a");
    px(c, o + 4, 6, 8, 5, B); px(c, o + 4, 7, 7, 1, "#6a5a3a"); px(c, o + 11, 3, 2, 4, "#c8c0b0"); px(c, o + 12, 2, 2, 2, "#a8a090"); px(c, o + 14, 3, 1, 1, "#d8a030");
  });
  // ---- monsters of the far lands (AEGIS Terata) ----
  strip("siren", (c, o, f) => {
    px(c, o + 4, 14, 8, 1, "rgba(0,0,0,0.2)");
    px(c, o + 5, 8, 6, 5, "#8a6a8a"); px(c, o + (f ? 1 : 2), 6 - f, 4, 3, "#a888a8"); px(c, o + (f ? 11 : 10), 6 - f, 4, 3, "#a888a8");
    px(c, o + 6, 13, 1, 2, "#d8a040"); px(c, o + 9, 13, 1, 2, "#d8a040");
    px(c, o + 6, 2, 4, 5, "#e0b08a"); px(c, o + 5, 1, 6, 2, "#c88a3a"); px(c, o + 5, 3, 1, 4, "#c88a3a"); px(c, o + 7, 4, 1, 1, "#2a1d14"); px(c, o + 8, 6, 1, 1, "#b0404a");
  });
  const sph = canvasTex(scene, "sphinx", 48, 24, (c) => {
    for (const o of [0, 24]) { const f = o ? 1 : 0, B = "#c8a060", D = "#8a6a3a";
      px(c, o + 2, 21, 20, 3, "rgba(0,0,0,0.25)");
      px(c, o + 3, 13, 15, 6, B); px(c, o + 1, 14, 2, 3, D); px(c, o + 0, 13, 2, 1, D);
      for (const [x, k] of [[4, f], [7, -f], [14, -f], [17, f]] as [number, number][]) px(c, o + x + k, 19, 2, 3, D);
      px(c, o + 4, 6 - f * 2, 10, 6, "#d8c8a0"); px(c, o + 5, 4 - f * 2, 8, 3, "#e8dcc0"); // wings
      px(c, o + 16, 6, 6, 8, B); px(c, o + 17, 3, 5, 6, "#e0b08a"); px(c, o + 16, 2, 6, 2, "#3a2a1a"); px(c, o + 16, 4, 1, 6, "#3a2a1a");
      px(c, o + 20, 5, 1, 1, "#1a1210"); px(c, o + 19, 7, 2, 1, "#a04040");
    }
  });
  sph.add(0, 0, 0, 0, 24, 24); sph.add(1, 0, 24, 0, 24, 24);
  strip("lion", (c, o, f) => {
    px(c, o + 1, 14, 14, 2, "rgba(0,0,0,0.25)"); const B = "#c8964a", D = "#7a4a22";
    if (f === 0) { px(c, o + 3, 11, 2, 3, B); px(c, o + 10, 11, 2, 3, B); } else { px(c, o + 4, 11, 2, 3, B); px(c, o + 9, 11, 2, 3, B); }
    px(c, o + 2, 7, 11, 5, B); px(c, o + 0, 6, 2, 1, D); px(c, o + 0, 5, 1, 2, D);
    px(c, o + 10, 3, 6, 7, D); px(c, o + 12, 5, 4, 4, B); px(c, o + 14, 6, 1, 1, "#1a1008"); px(c, o + 15, 8, 1, 1, "#3a2010");
  });
  flyer("stymphalian", "#a87a3a", "#d8a850", "#8a5a2a", "#e8d070", 2);
  flyer("strix", "#4a3a3a", "#2a2026", "#6a5048", "#e8d040", 1);

  strip("bird", (c, o, f) => {
    if (f === 0) {
      px(c, o + 6, 14, 5, 1, "rgba(0,0,0,0.2)");
      px(c, o + 6, 10, 4, 3, "#8a6a4a"); px(c, o + 9, 9, 2, 2, "#6b4a2b"); px(c, o + 11, 10, 1, 1, "#e0b04a");
      px(c, o + 5, 10, 1, 2, "#5a4632"); px(c, o + 7, 12, 2, 1, "#c9b48f");
    } else {
      px(c, o + 6, 7, 4, 3, "#8a6a4a"); px(c, o + 9, 6, 2, 2, "#6b4a2b"); px(c, o + 11, 7, 1, 1, "#e0b04a");
      px(c, o + 3, 5, 4, 1, "#6b4a2b"); px(c, o + 9, 5, 4, 1, "#6b4a2b"); px(c, o + 2, 4, 2, 1, "#5a4632"); px(c, o + 12, 4, 2, 1, "#5a4632");
    }
  });

  // A straw skep hive, the goats' manger and water trough (empty, then full).
  canvasTex(scene, "hive", 16, 20, (c) => {
    px(c, 2, 18, 12, 2, "rgba(0,0,0,0.22)"); px(c, 1, 16, 14, 3, "#8a5f35");
    px(c, 2, 6, 12, 10, "#d9b25e"); px(c, 4, 3, 8, 3, "#d9b25e"); px(c, 6, 1, 4, 2, "#d9b25e");
    for (const y of [4, 7, 10, 13]) px(c, 2, y, 12, 1, "#b38f48");
    px(c, 7, 13, 3, 3, "#3a2c22");
  });
  const two = (key: string, w: number, h: number, draw: (c: Ctx, o: number, full: boolean) => void) => {
    const t = canvasTex(scene, key, w * 2, h, (c) => { draw(c, 0, false); draw(c, w, true); });
    t.add(0, 0, 0, 0, w, h); t.add(1, 0, w, 0, w, h);
  };
  two("manger", 16, 12, (c, o, full) => {
    px(c, o + 1, 4, 14, 7, "#8a5f35"); px(c, o + 2, 5, 12, 4, "#5a3d22"); px(c, o + 1, 10, 2, 2, "#6b4a2b"); px(c, o + 13, 10, 2, 2, "#6b4a2b");
    if (full) { px(c, o + 2, 3, 12, 4, "#c4a35a"); px(c, o + 4, 2, 3, 1, "#d9c27a"); px(c, o + 9, 2, 4, 1, "#9aa04a"); }
  });
  two("trough", 16, 10, (c, o, full) => {
    px(c, o + 1, 3, 14, 6, "#a49e91"); px(c, o + 1, 2, 14, 2, "#c4bdae"); px(c, o + 2, 4, 12, 3, full ? "#3f7fa0" : "#6c675e");
    if (full) px(c, o + 4, 4, 3, 1, "#8fc4dc");
  });

  // Crops: four growth stages each, plus a shared withered frame.
  const cropIds = Object.keys(CROPS);
  const crops = canvasTex(scene, "crops", 16 * (cropIds.length * 4 + 1), 16, (c) => {
    cropIds.forEach((id, i) => { for (let st = 0; st < 4; st++) drawCrop(c, (i * 4 + st) * 16, id, st); });
    const o = cropIds.length * 4 * 16;
    px(c, o + 7, 8, 1, 6, "#8a6a3a"); px(c, o + 4, 9, 3, 1, "#8a6a3a"); px(c, o + 8, 7, 4, 1, "#7a5a33"); px(c, o + 5, 12, 6, 1, "#6b4a2b");
  });
  cropIds.forEach((id, i) => { for (let st = 0; st < 4; st++) crops.add(`${id}_${st}`, 0, (i * 4 + st) * 16, 0, 16, 16); });
  crops.add("withered", 0, cropIds.length * 64, 0, 16, 16);

  // The old grapevine on its frame: bare, then hung with grapes.
  const vine = canvasTex(scene, "vine", 32, 24, (c) => {
    for (const o of [0, 16]) {
      px(c, o + 1, 4, 2, 20, "#6b4a2b"); px(c, o + 13, 4, 2, 20, "#6b4a2b"); px(c, o, 3, 16, 2, "#8a5f35");
      px(c, o + 7, 8, 2, 16, "#5a3d22");
      px(c, o + 1, 0, 14, 6, "#5e7f34"); px(c, o + 3, 5, 10, 4, "#4f6b2c"); px(c, o + 2, 1, 3, 2, "#71953f"); px(c, o + 10, 2, 3, 2, "#71953f");
      if (o) { for (const [x, y] of [[3, 6], [10, 7], [6, 9]]) { px(c, o + x, y, 3, 3, "#5a2d5e"); px(c, o + x + 1, y + 3, 1, 1, "#5a2d5e"); px(c, o + x, y, 1, 1, "#8a5a8e"); } }
    }
  });
  vine.add(0, 0, 0, 0, 16, 24); vine.add(1, 0, 16, 0, 16, 24);

  // Forage: each plant or deposit, and the overlay of what it bears (drawn only once you know the plant).
  const fids = Object.keys(FORAGE);
  const fr = canvasTex(scene, "forage", 32 * fids.length, 16, (c) => fids.forEach((id, i) => { drawForage(c, i * 32, id, false); drawForage(c, i * 32 + 16, id, true); }));
  fids.forEach((id, i) => { fr.add(id, 0, i * 32, 0, 16, 16); fr.add(`${id}_fruit`, 0, i * 32 + 16, 0, 16, 16); });

  // Villagers: one frame each, facing you; strangers by their look.
  const vids = Object.keys(VILLAGERS);
  const looks = ["beggar", "traveler", "shepherd", "potter", "bard", "tiresias"];
  const people = canvasTex(scene, "people", 16 * (vids.length + looks.length), 16, (c) => {
    vids.forEach((id, i) => drawPerson(c, i * 16, VILLAGERS[id].look));
    looks.forEach((l, i) => drawStranger(c, (vids.length + i) * 16, l));
  });
  vids.forEach((id, i) => people.add(id, 0, i * 16, 0, 16, 16));
  looks.forEach((l, i) => people.add(l, 0, (vids.length + i) * 16, 0, 16, 16));

  // The Mythborn: a Naiad, and satyrs in two dancing frames.
  canvasTex(scene, "naiad", 16, 16, (c) => {
    px(c, 5, 14, 6, 2, "rgba(40,100,140,0.35)");
    px(c, 5, 6, 6, 8, "rgba(170,220,235,0.9)"); px(c, 5, 10, 6, 4, "rgba(120,190,215,0.9)");
    px(c, 6, 1, 4, 5, "#d8eef0"); px(c, 5, 1, 6, 2, "#3a8a8a"); px(c, 4, 2, 2, 8, "#3a8a8a"); px(c, 10, 2, 2, 8, "#3a8a8a");
    px(c, 7, 3, 1, 1, "#1a4a5a"); px(c, 8, 3, 1, 1, "#1a4a5a"); px(c, 7, 0, 2, 1, "#f2e6c9");
  });
  const sat = canvasTex(scene, "satyr", 32, 16, (c) => {
    for (const o of [0, 16]) {
      const f = o ? 1 : 0;
      px(c, o + 5, 14, 6, 2, "rgba(0,0,0,0.22)");
      px(c, o + 5 + f, 10, 2, 4, "#6b4a2b"); px(c, o + 9 - f, 10, 2, 4, "#6b4a2b"); px(c, o + 5 + f, 13, 2, 1, "#2a1d14"); px(c, o + 9 - f, 13, 2, 1, "#2a1d14");
      px(c, o + 5, 5, 6, 6, "#c98e62"); px(c, o + 5, 9, 6, 2, "#7a5a3a");
      px(c, o + 6, 1, 4, 4, "#c98e62"); px(c, o + 6, 1, 4, 1, "#4a3324"); px(c, o + 5, 0, 1, 2, "#e8dcc2"); px(c, o + 10, 0, 1, 2, "#e8dcc2");
      px(c, o + 7, 3, 1, 1, "#2a1d14"); px(c, o + 8, 3, 1, 1, "#2a1d14"); px(c, o + 6, 5, 4, 1, "#4a3324");
      px(c, o + 5, 1, 6, 1, "#5e7f34"); // ivy crown
      px(c, o + (f ? 11 : 3), 4, 2, 2, "#c98e62"); px(c, o + (f ? 3 : 11), 6, 2, 2, "#c98e62");
    }
  });
  sat.add(0, 0, 0, 0, 16, 16); sat.add(1, 0, 16, 0, 16, 16);

  // The cave: its mouth, the way down, a hoard, and its dwellers.
  canvasTex(scene, "cavemouth", 32, 24, (c) => {
    px(c, 0, 6, 32, 18, "#8d877b"); px(c, 2, 2, 28, 6, "#9c968a"); px(c, 6, 0, 20, 4, "#a49e91");
    px(c, 8, 8, 16, 16, "#1a1612"); px(c, 10, 6, 12, 3, "#1a1612"); px(c, 6, 20, 20, 4, "#2a241e");
    px(c, 3, 9, 3, 2, "#6c675e"); px(c, 26, 12, 3, 2, "#6c675e"); px(c, 1, 16, 5, 6, "#6f8a3a");
  });
  canvasTex(scene, "ladder", 16, 16, (c) => { px(c, 4, 0, 2, 16, "#8a5f35"); px(c, 10, 0, 2, 16, "#8a5f35"); for (let y = 2; y < 16; y += 4) px(c, 4, y, 8, 2, "#a87443"); px(c, 3, 0, 10, 1, "#f2e6c9"); });
  canvasTex(scene, "hole", 16, 16, (c) => { px(c, 2, 4, 12, 10, "#0e0c0a"); px(c, 4, 2, 8, 3, "#0e0c0a"); px(c, 1, 12, 14, 3, "#2a241e"); px(c, 3, 3, 1, 1, "#6c675e"); });
  canvasTex(scene, "hoard", 20, 16, (c) => {
    px(c, 2, 13, 16, 3, "rgba(0,0,0,0.3)"); px(c, 1, 6, 8, 8, "#9c5532"); px(c, 2, 4, 6, 3, "#7a4a2a");
    px(c, 10, 9, 9, 5, "#6b4a2b"); px(c, 11, 8, 7, 2, "#8a5f35");
    for (const [x, y] of [[4, 12], [12, 7], [15, 8], [8, 13], [17, 12]]) px(c, x, y, 2, 1, "#f2c14e");
  });
  const bat = canvasTex(scene, "bat", 32, 16, (c) => { for (const o of [0, 16]) { px(c, o + 6, 7, 4, 3, "#2a241e"); px(c, o + 6, 6, 1, 1, "#2a241e"); px(c, o + 9, 6, 1, 1, "#2a241e"); if (o) { px(c, o + 1, 5, 5, 2, "#3a332c"); px(c, o + 10, 5, 5, 2, "#3a332c"); } else { px(c, o + 2, 8, 4, 3, "#3a332c"); px(c, o + 10, 8, 4, 3, "#3a332c"); } } });
  bat.add(0, 0, 0, 0, 16, 16); bat.add(1, 0, 16, 0, 16, 16);
  const myr = canvasTex(scene, "myrmex", 32, 16, (c) => {
    for (const o of [0, 16]) {
      const f = o ? 1 : 0, D = "#2a1d14", B = "#5a3a1a";
      px(c, o + 1, 14, 14, 2, "rgba(0,0,0,0.25)");
      for (const x of [4, 7, 10]) { px(c, o + x - f, 11, 1, 3, D); px(c, o + x + 1 + f, 11, 1, 3, D); }
      px(c, o + 1, 7, 5, 5, B); px(c, o + 6, 8, 3, 3, B); px(c, o + 9, 6, 5, 5, B); px(c, o + 13, 7, 2, 2, "#e8c86a");
      px(c, o + 12, 3, 1, 3, D); px(c, o + 14, 2, 1, 3, D); px(c, o + 14, 10, 2, 1, D); px(c, o + 2, 8, 2, 1, "#7a5a3a");
    }
  });
  myr.add(0, 0, 0, 0, 16, 16); myr.add(1, 0, 16, 0, 16, 16);
  const eid = canvasTex(scene, "eidolon", 32, 16, (c) => {
    for (const o of [0, 16]) { const f = o ? 1 : 0;
      px(c, o + 5, 5, 6, 8 + f, "rgba(200,205,220,0.55)"); px(c, o + 6, 1, 4, 4, "rgba(220,225,235,0.7)"); px(c, o + 7, 2, 1, 1, "#1a1a2a"); px(c, o + 8, 2, 1, 1, "#1a1a2a");
      px(c, o + 4, 6, 1, 5, "rgba(200,205,220,0.4)"); px(c, o + 11, 6, 1, 5, "rgba(200,205,220,0.4)"); px(c, o + 6, 13 + f, 4, 2, "rgba(200,205,220,0.25)"); }
  });
  eid.add(0, 0, 0, 0, 16, 16); eid.add(1, 0, 16, 0, 16, 16);
  const lam = canvasTex(scene, "lampad", 32, 16, (c) => {
    for (const o of [0, 16]) { const f = o ? 1 : 0;
      px(c, o + 5, 6, 6, 8, "#4a3a6a"); px(c, o + 6, 1, 4, 5, "#d8c8e8"); px(c, o + 5, 1, 6, 2, "#1a1a2a"); px(c, o + 7, 3, 1, 1, "#1a1a2a"); px(c, o + 8, 3, 1, 1, "#1a1a2a");
      px(c, o + 12, 3, 1, 8, "#6b4a2b"); px(c, o + 11, 1 - f, 3, 3, "#f2c14e"); px(c, o + 12, 0, 1, 2, "#e0703a"); }
  });
  lam.add(0, 0, 0, 0, 16, 16); lam.add(1, 0, 16, 0, 16, 16);
  // Wandering monsters (AEGIS Terata).
  const cen = canvasTex(scene, "centaur", 48, 24, (c) => {
    for (const o of [0, 24]) { const f = o ? 1 : 0, H = "#7a4a2a", D = "#4a2c18";
      px(c, o + 3, 21, 18, 3, "rgba(0,0,0,0.25)");
      px(c, o + 2, 11, 14, 7, H); px(c, o + 1, 12, 2, 4, D); px(c, o + 0, 13, 2, 6, D); // body and tail
      for (const [x, k] of [[3, f], [6, -f], [12, -f], [15, f]] as [number, number][]) px(c, o + x + k, 18, 2, 4, D);
      px(c, o + 13, 4, 6, 8, "#c98e62"); px(c, o + 14, 0, 4, 4, "#c98e62"); px(c, o + 14, 0, 4, 1, "#2a1d14"); px(c, o + 13, 1, 1, 3, "#2a1d14");
      px(c, o + 17, 2, 1, 1, "#1a1210"); px(c, o + 13, 7, 6, 2, "#5e7f34"); // eye, fillet of leaves
      px(c, o + 19, 3 + f, 1, 10, "#8a5f35"); px(c, o + 20, 4 + f, 1, 8, "#e9e1cf"); // bow
      px(c, o + 11, 5, 2, 4, "#6b4a2b"); // quiver
    }
  });
  cen.add(0, 0, 0, 0, 24, 24); cen.add(1, 0, 24, 0, 24, 24);
  const skel = canvasTex(scene, "skeleton", 32, 16, (c) => {
    for (const o of [0, 16]) { const f = o ? 1 : 0, B = "#e4dcc4", S = "#9c947c";
      px(c, o + 4, 14, 8, 2, "rgba(0,0,0,0.25)");
      px(c, o + 6, 1, 4, 4, B); px(c, o + 7, 2, 1, 1, "#1a1210"); px(c, o + 9, 2, 1, 1, "#1a1210"); px(c, o + 7, 4, 2, 1, S);
      px(c, o + 7, 5, 2, 5, B); for (const y of [6, 8]) px(c, o + 5, y, 6, 1, S);
      px(c, o + 4, 6, 1, 4 + f, B); px(c, o + 11, 6, 1, 4 - f, B);
      px(c, o + 6 - f, 10, 1, 5, B); px(c, o + 9 + f, 10, 1, 5, B);
      px(c, o + 12, 3 - f, 1, 7, "#7a8a6a"); px(c, o + 12, 10 - f, 1, 1, "#5a4a3a"); // a corroded blade
    }
  });
  skel.add(0, 0, 0, 0, 16, 16); skel.add(1, 0, 16, 0, 16, 16);
  canvasTex(scene, "bones", 16, 10, (c) => {
    px(c, 2, 8, 12, 2, "rgba(0,0,0,0.2)"); px(c, 3, 4, 4, 3, "#e4dcc4"); px(c, 4, 5, 1, 1, "#1a1210");
    px(c, 7, 6, 7, 1, "#d8d0b8"); px(c, 8, 3, 1, 5, "#d8d0b8"); px(c, 10, 2, 4, 1, "#c4bca4"); px(c, 1, 7, 5, 1, "#c4bca4"); px(c, 11, 4, 1, 4, "#7a8a6a");
  });
  for (const [key, trueForm] of [["empousa", false], ["empousaTrue", true]] as [string, boolean][]) {
    const t = canvasTex(scene, key, 32, 16, (c) => {
      for (const o of [0, 16]) { const f = o ? 1 : 0;
        px(c, o + 4, 14, 8, 2, "rgba(0,0,0,0.25)");
        px(c, o + 5, 5, 6, 8, trueForm ? "#7a2030" : "#c24a5a"); px(c, o + 5, 7, 6, 1, "#f2c14e");
        px(c, o + 6, 1, 4, 4, trueForm ? "#e86a4a" : "#e0b090"); px(c, o + 5, 0, 6, 2, "#1a1210"); px(c, o + 4, 2, 1, 5, "#1a1210"); px(c, o + 11, 2, 1, 5, "#1a1210");
        px(c, o + 7, 2, 1, 1, trueForm ? "#f2e030" : "#2a1d14"); px(c, o + 9, 2, 1, 1, trueForm ? "#f2e030" : "#2a1d14");
        if (trueForm) px(c, o + 6, 4, 4, 1, "#fff6e0"); // a grin too wide for any mouth
        px(c, o + 6, 13, 1, 2 + f, trueForm ? "#d8a040" : "#e0b090"); // one leg of bronze...
        px(c, o + 9, 13, 2, 2 - f, trueForm ? "#5a4a3a" : "#e0b090"); // ...and one of an ass
      }
    });
    t.add(0, 0, 0, 0, 16, 16); t.add(1, 0, 16, 0, 16, 16);
  }

  // Darkness: a black field with a soft hole of light, small without a torch, larger with one.
  for (const [key, r] of [["dark0", 30], ["dark1", 78], ["dark2", 112], ["dark3", 142]] as [string, number][]) {
    canvasTex(scene, key, 640, 640, (c) => {
      const g = c.createRadialGradient(320, 320, r * 0.4, 320, 320, r);
      g.addColorStop(0, "rgba(8,6,4,0)"); g.addColorStop(1, "rgba(8,6,4,0.97)");
      c.fillStyle = g; c.fillRect(0, 0, 640, 640);
    });
  }

  // The treading vat: broken, empty, full of must, and with sealed jars working beside it.
  const vat = canvasTex(scene, "vat", 96, 24, (c) => {
    for (let f = 0; f < 4; f++) {
      const o = f * 24;
      px(c, o + 2, 20, 20, 3, "rgba(0,0,0,0.2)");
      px(c, o + 2, 8, 20, 13, f === 0 ? "#9c968a" : "#c4bdae"); px(c, o + 4, 10, 16, 7, f === 0 ? "#6c675e" : "#8d877b");
      px(c, o + 20, 16, 4, 3, "#a49e91"); // spout
      if (f === 0) { px(c, o + 8, 8, 1, 6, "#4a453e"); px(c, o + 14, 12, 4, 1, "#4a453e"); px(c, o + 3, 6, 4, 3, "#6f8a3a"); px(c, o + 17, 5, 4, 4, "#5a6b2c"); }
      if (f === 2) { px(c, o + 4, 10, 16, 7, "#6a2a4a"); px(c, o + 6, 11, 4, 1, "#8a4a6a"); }
      if (f === 3) { px(c, o + 4, 12, 16, 5, "#5a2a3a"); for (const x of [1, 8, 15]) { px(c, o + x, 0, 6, 8, "#c4703f"); px(c, o + x + 1, 0, 4, 1, "#9c5532"); px(c, o + x + 1, 3, 4, 1, "#2a1d14"); } }
    }
  });
  for (let f = 0; f < 4; f++) vat.add(f, 0, f * 24, 0, 24, 24);

  // The village buildings.
  canvasTex(scene, "mill", 64, 56, (c) => {
    px(c, 4, 20, 56, 34, "#d8ccb0"); px(c, 4, 48, 56, 6, "#b8a888"); for (let y = 24; y < 48; y += 6) px(c, 4, y, 56, 1, "#c4b898");
    px(c, 0, 8, 64, 15, "#a9853f"); px(c, 4, 2, 56, 8, "#c9a35a"); for (let x = 2; x < 64; x += 5) px(c, x, 9, 1, 13, "#8a6a32");
    px(c, 26, 32, 12, 22, "#6b4a2b"); px(c, 28, 34, 8, 18, "#5a3d22");
    px(c, 44, 38, 14, 14, "#9c968a"); px(c, 46, 40, 10, 10, "#b8b2a6"); px(c, 50, 44, 2, 2, "#6c675e"); // millstone
    px(c, 8, 42, 8, 10, "#c9b48f"); px(c, 9, 40, 6, 3, "#b8a07a"); px(c, 16, 44, 7, 8, "#c9b48f"); // sacks
  });
  canvasTex(scene, "smithy", 64, 56, (c) => {
    px(c, 2, 18, 60, 36, "#8a7a62"); px(c, 6, 24, 52, 30, "#3a2c22");
    px(c, 0, 10, 64, 10, "#6b5a45"); px(c, 46, 0, 10, 14, "#7a6a55"); px(c, 47, 0, 8, 2, "#4a3c30");
    px(c, 10, 34, 16, 12, "#8d877b"); px(c, 12, 36, 12, 6, "#e0703a"); px(c, 14, 37, 8, 3, "#f2c14e"); // forge
    px(c, 34, 42, 14, 4, "#4a4a50"); px(c, 38, 46, 6, 8, "#3a3a40"); px(c, 32, 42, 4, 2, "#4a4a50"); // anvil
    px(c, 2, 50, 60, 4, "#6b5a45");
  });
  canvasTex(scene, "shrine", 64, 56, (c) => {
    px(c, 2, 46, 60, 4, "#c4bdae"); px(c, 0, 50, 64, 6, "#a49e91");
    px(c, 4, 10, 56, 6, "#e8e2d0"); px(c, 8, 2, 48, 8, "#d8d0bc"); px(c, 30, 0, 4, 2, "#d8d0bc"); px(c, 12, 4, 40, 4, "#b0412f");
    for (const x of [8, 22, 36, 50]) { px(c, x, 16, 6, 30, "#f2ece0"); px(c, x + 1, 16, 1, 30, "#d8d0bc"); }
    px(c, 16, 22, 32, 24, "#5a4a3a"); px(c, 28, 28, 8, 12, "#c9a35a"); // the image within
  });
  canvasTex(scene, "inn", 80, 56, (c) => {
    px(c, 4, 20, 72, 34, "#e8dcc2"); px(c, 4, 48, 72, 6, "#c9b48f");
    px(c, 0, 6, 80, 16, "#c9a35a"); px(c, 4, 0, 72, 8, "#d8b468"); for (let x = 2; x < 80; x += 5) px(c, x, 8, 1, 13, "#b38f48");
    px(c, 34, 32, 12, 22, "#6b4a2b"); px(c, 36, 34, 8, 18, "#5a3d22");
    px(c, 10, 30, 10, 8, "#3a2c22"); px(c, 60, 30, 10, 8, "#3a2c22"); // windows
    px(c, 52, 22, 2, 10, "#6b4a2b"); px(c, 48, 30, 12, 7, "#8a5f35"); px(c, 53, 32, 2, 3, "#e6c74a"); // sign
    px(c, 8, 48, 20, 3, "#8a5f35"); px(c, 9, 51, 2, 3, "#6b4a2b"); px(c, 25, 51, 2, 3, "#6b4a2b"); // bench
  });

  // An arrow in flight (pointing right; rotated as it flies) and one stuck in the ground.
  canvasTex(scene, "arrow", 10, 3, (c) => { px(c, 0, 1, 8, 1, "#a87443"); px(c, 8, 0, 2, 3, "#8d877b"); px(c, 0, 0, 2, 1, "#e8e2d0"); px(c, 0, 2, 2, 1, "#e8e2d0"); });
  canvasTex(scene, "spearFly", 20, 3, (c) => { px(c, 0, 1, 16, 1, "#9c7445"); px(c, 16, 0, 3, 3, "#c98a55"); px(c, 19, 1, 1, 1, "#e8c48a"); px(c, 0, 0, 1, 3, "#c98a55"); });
  canvasTex(scene, "spearStuck", 7, 18, (c) => { px(c, 3, 3, 1, 14, "#9c7445"); px(c, 2, 0, 3, 3, "#c98a55"); px(c, 3, 0, 1, 1, "#e8c48a"); px(c, 1, 16, 5, 2, "rgba(0,0,0,0.25)"); });
  canvasTex(scene, "arrowStuck", 5, 8, (c) => { px(c, 2, 0, 1, 7, "#a87443"); px(c, 1, 0, 1, 2, "#e8e2d0"); px(c, 3, 0, 1, 2, "#e8e2d0"); px(c, 1, 7, 3, 1, "rgba(0,0,0,0.25)"); });
  // The Pythia's tripod: a bronze bowl on three tall legs.
  canvasTex(scene, "tripod", 16, 18, (c) => {
    px(c, 2, 3, 12, 3, "#b08a3a"); px(c, 3, 2, 10, 1, "#d0aa5a"); px(c, 3, 6, 10, 1, "#8a6a2a");
    for (const x of [3, 7, 12]) px(c, x, 7, 1, 10, "#8a6a2a"); px(c, 1, 17, 14, 1, "rgba(0,0,0,0.25)");
  });
  // The omphalos: the navel of the world, an egg of stone under a net of woollen fillets.
  canvasTex(scene, "omphalos", 14, 14, (c) => {
    px(c, 3, 2, 8, 10, "#c8c0aa"); px(c, 2, 4, 10, 7, "#c8c0aa"); px(c, 4, 1, 6, 1, "#d8d0ba"); px(c, 3, 3, 3, 3, "#e0d8c4");
    for (let i = 0; i < 4; i++) { px(c, 2 + i * 3, 4, 1, 7, "#9a8a6a"); px(c, 2, 5 + i * 2, 10, 1, "#9a8a6a"); }
    px(c, 1, 12, 12, 2, "#8e846e");
  });
  // Horns of consecration, on the palace's roofs and altars.
  canvasTex(scene, "horns", 18, 12, (c) => {
    px(c, 1, 8, 16, 4, "#d8ccb0"); px(c, 1, 2, 3, 6, "#d8ccb0"); px(c, 14, 2, 3, 6, "#d8ccb0"); px(c, 2, 1, 2, 1, "#e8dcc0"); px(c, 14, 1, 2, 1, "#e8dcc0");
    px(c, 4, 6, 10, 2, "#d8ccb0"); px(c, 1, 11, 16, 1, "#a89c80");
  });
  // The Minotaur: a man's body, a bull's head, horns like spear-blades. Two frames, facing right.
  {
    const t = canvasTex(scene, "minotaur", 40, 22, (c) => {
      for (const f of [0, 1]) {
        const o = f * 20, sk = "#9a6a4a", dk = "#6a4028", hd = "#3a2418";
        px(c, o + 3, 20, 14, 2, "rgba(0,0,0,0.3)");
        if (f === 0) { px(c, o + 6, 15, 3, 5, sk); px(c, o + 11, 15, 3, 5, sk); } else { px(c, o + 7, 15, 3, 5, sk); px(c, o + 10, 15, 3, 4, sk); }
        px(c, o + 6, 13, 8, 3, "#6a2a1e"); // loincloth
        px(c, o + 5, 6, 10, 7, sk); px(c, o + 6, 7, 3, 3, "#b07a58"); px(c, o + 13, 7, 2, 6, dk); // chest and arm
        px(c, o + 3, 7, 2, 6, dk); px(c, o + 15, 8, 2, 4, sk);
        px(c, o + 8, 1, 8, 6, hd); px(c, o + 15, 3, 3, 3, hd); px(c, o + 17, 4, 1, 2, "#1a100a"); // the bull's head and muzzle
        px(c, o + 12, 2, 1, 1, "#e83a2a"); // its eye
        px(c, o + 7, 0, 2, 1, "#e8e0c8"); px(c, o + 5, 0, 2, 1, "#e8e0c8"); px(c, o + 13, 0, 2, 1, "#e8e0c8"); px(c, o + 15, 0, 1, 1, "#e8e0c8");
      }
    });
    t.add(0, 0, 0, 0, 20, 22); t.add(1, 0, 20, 0, 20, 22);
  }
  // A stone throne, high-backed, its arms carved as griffins long worn away.
  canvasTex(scene, "throne", 14, 20, (c) => {
    px(c, 2, 0, 10, 12, "#a89a7c"); px(c, 3, 1, 8, 10, "#bcae8e"); px(c, 0, 9, 14, 4, "#9a8c70"); px(c, 1, 9, 12, 2, "#c4b696");
    px(c, 2, 13, 10, 5, "#8e8066"); px(c, 0, 18, 14, 2, "rgba(0,0,0,0.25)"); px(c, 5, 3, 4, 3, "#9c3a2a");
  });
  canvasTex(scene, "pithos", 12, 16, (c) => {
    px(c, 2, 2, 8, 13, "#b5643b"); px(c, 1, 5, 10, 7, "#c4703f"); px(c, 3, 0, 6, 3, "#9c5532"); px(c, 2, 8, 8, 1, "#2a1d14");
  });
}

/** Icons for weapons and tools from the Core Rules' tables. */
function drawEquipIcon(c: Ctx, o: number, id: string): boolean {
  const diag = (x0: number, y0: number, n: number, col: string, w = 1) => { for (let i = 0; i < n; i++) px(c, o + x0 + i, y0 - i, w, w, col); };
  switch (id) {
    case "Kopis": diag(2, 13, 4, "#6b4a2b", 2); px(c, o + 5, 9, 3, 1, "#c8a050"); for (let i = 0; i < 8; i++) px(c, o + 6 + i, 8 - i + (i > 4 ? (i - 4) : 0), 2, 2 + (i > 3 ? 1 : 0), "#c8c0b0"); px(c, o + 12, 2, 2, 4, "#e0d8c8"); return true;
    case "Club": diag(2, 14, 6, "#8a6440", 2); px(c, o + 7, 3, 6, 6, "#6b4a2b"); px(c, o + 8, 2, 4, 1, "#8a6440"); px(c, o + 9, 5, 1, 1, "#4a3220"); px(c, o + 11, 7, 1, 1, "#4a3220"); return true;
    case "SilverDagger": diag(3, 13, 3, "#4a3220", 2); px(c, o + 5, 9, 3, 2, "#9a9aa8"); diag(7, 9, 7, "#e8e8f0", 2); px(c, o + 13, 2, 1, 1, "#ffffff"); return true;
    case "Cestus": for (const x of [2, 9]) { px(c, o + x, 4, 5, 9, "#a8804e"); for (let y = 5; y < 13; y += 2) px(c, o + x, y, 5, 1, "#6b4a2b"); px(c, o + x + 1, 3, 3, 1, "#c99a72"); } return true;
    case "Sling": px(c, o + 6, 9, 5, 4, "#8a6440"); px(c, o + 7, 10, 3, 2, "#9c968a"); diag(2, 8, 5, "#c9b48f"); for (let i = 0; i < 6; i++) px(c, o + 10 + (i >> 1), 8 - i, 1, 1, "#c9b48f"); px(c, o + 1, 9, 2, 2, "#c9b48f"); return true;
    case "Javelin": for (const dx of [0, 3, 6]) { diag(1 + dx, 14, 10, "#8a6440"); px(c, o + 10 + dx, 3, 2, 2, "#9c968a"); } return true;
    case "FireArrow": diag(2, 14, 9, "#8a6440"); px(c, o + 2, 12, 2, 2, "#e9e1cf"); px(c, o + 10, 4, 4, 3, "#e0702a"); px(c, o + 11, 2, 3, 3, "#f2a03a"); px(c, o + 12, 1, 2, 2, "#fbe39a"); return true;
    case "HealerKit": px(c, o + 2, 5, 12, 9, "#8a6440"); px(c, o + 2, 5, 12, 2, "#a8804e"); px(c, o + 7, 7, 2, 6, "#e9e1cf"); px(c, o + 5, 9, 6, 2, "#e9e1cf"); px(c, o + 6, 3, 4, 2, "#6b4a2b"); return true;
    case "Tackle": for (const [x, y] of [[3, 3], [8, 2], [12, 4]]) { px(c, o + x, y, 1, 7, "#c8a050"); px(c, o + x - 2, y + 7, 3, 1, "#c8a050"); px(c, o + x - 2, y + 5, 1, 2, "#c8a050"); } px(c, o + 2, 13, 12, 1, "#e0d8c8"); px(c, o + 6, 12, 3, 3, "#7a7a80"); return true;
    case "Mirror": px(c, o + 4, 1, 8, 9, "#c8a050"); px(c, o + 3, 2, 10, 7, "#c8a050"); px(c, o + 5, 2, 6, 7, "#f0e0a0"); px(c, o + 6, 3, 2, 3, "#ffffff"); px(c, o + 7, 10, 2, 5, "#8a6a2a"); px(c, o + 5, 14, 6, 1, "#8a6a2a"); return true;
    case "Waterskin": px(c, o + 3, 5, 10, 9, "#8a6440"); px(c, o + 4, 4, 8, 1, "#8a6440"); px(c, o + 6, 1, 3, 4, "#6b4a2b"); px(c, o + 5, 7, 3, 3, "#a8804e"); px(c, o + 3, 13, 10, 1, "#6b4a2b"); return true;
    case "Tent": px(c, o + 7, 2, 2, 2, "#6b4a2b"); for (let i = 0; i < 10; i++) px(c, o + 7 - Math.round(i * 0.6), 3 + i, 2 + Math.round(i * 1.2), 1, i % 3 ? "#b89a6a" : "#a08458"); px(c, o + 7, 8, 2, 6, "#3a2a1a"); return true;
    case "Map": px(c, o + 1, 3, 14, 10, "#d8c8a0"); px(c, o + 1, 3, 1, 10, "#b8a880"); px(c, o + 14, 3, 1, 10, "#b8a880"); px(c, o + 3, 5, 4, 3, "#6fae52"); px(c, o + 8, 6, 5, 4, "#3a6a8a"); px(c, o + 4, 9, 3, 2, "#9c8a6a"); px(c, o + 7, 5, 1, 6, "#b0412f"); return true;
    case "Loadstone": px(c, o + 4, 5, 8, 7, "#3a3640"); px(c, o + 3, 6, 10, 5, "#3a3640"); px(c, o + 5, 6, 3, 2, "#5a5660"); px(c, o + 7, 2, 2, 3, "#b0412f"); px(c, o + 7, 12, 2, 2, "#6a7ab0"); return true;
    case "Scale": px(c, o + 7, 2, 2, 11, "#8a6a2a"); px(c, o + 2, 3, 12, 1, "#c8a050"); px(c, o + 1, 6, 4, 2, "#c8a050"); px(c, o + 11, 6, 4, 2, "#c8a050"); px(c, o + 2, 4, 1, 2, "#a8a090"); px(c, o + 13, 4, 1, 2, "#a8a090"); px(c, o + 5, 13, 6, 2, "#6b4a2b"); return true;
    case "Knife": diag(3, 13, 4, "#6b4a2b", 2); diag(7, 9, 6, "#c8a050", 2); px(c, o + 12, 3, 1, 1, "#f0d890"); return true;
    case "Pack": px(c, o + 3, 3, 10, 11, "#8a6440"); px(c, o + 3, 3, 10, 3, "#6b4a2b"); px(c, o + 7, 6, 2, 2, "#c8a050"); px(c, o + 4, 9, 8, 1, "#6b4a2b"); px(c, o + 2, 5, 1, 7, "#4a3220"); px(c, o + 13, 5, 1, 7, "#4a3220"); return true;
  }
  return false;
}

/** Icons for the things you wear. */
function drawGearIcon(c: Ctx, o: number, id: string): boolean {
  const tunic = (col: string, long = false) => { px(c, o + 4, 3, 8, long ? 12 : 10, col); px(c, o + 2, 3, 3, 4, col); px(c, o + 11, 3, 3, 4, col); px(c, o + 6, 2, 4, 2, "rgba(0,0,0,0.25)"); };
  switch (id) {
    case "Chiton": tunic("#e9e1cf"); px(c, o + 4, 7, 8, 1, "#b0412f"); return true;
    case "Exomis": tunic("#b8a47a"); px(c, o + 11, 3, 3, 4, "rgba(0,0,0,0)"); c.clearRect(o + 11, 3, 3, 4); px(c, o + 4, 7, 8, 1, "#6b4a2b"); return true;
    case "Peplos": tunic("#5a6aa0", true); px(c, o + 4, 6, 8, 1, "#7a8ac0"); return true;
    case "Robes": tunic("#f0ead8", true); px(c, o + 4, 14, 8, 1, "#d39a3a"); px(c, o + 2, 6, 3, 1, "#d39a3a"); px(c, o + 11, 6, 3, 1, "#d39a3a"); return true;
    case "Himation": px(c, o + 2, 3, 12, 11, "#c8bc9e"); for (let k = 0; k < 10; k++) px(c, o + 3 + k, 3 + k, 1, 1, "#a89c7e"); px(c, o + 2, 13, 12, 1, "#a89c7e"); return true;
    case "Petasos": px(c, o + 1, 9, 14, 3, "#c8a050"); px(c, o + 2, 8, 12, 1, "#d8b468"); px(c, o + 5, 4, 6, 5, "#d3ad5e"); px(c, o + 5, 7, 6, 1, "#8a3a2a"); return true;
    case "Kynee": px(c, o + 3, 5, 10, 7, "#8a6440"); px(c, o + 4, 4, 8, 1, "#a8804e"); px(c, o + 3, 11, 10, 1, "#6b4a2b"); px(c, o + 4, 8, 8, 1, "#6b4a2b"); return true;
    case "TuskHelm": px(c, o + 3, 4, 10, 9, "#e8dcc4"); for (const y of [6, 9, 12]) px(c, o + 3, y, 10, 1, "#8a6440"); px(c, o + 7, 2, 2, 2, "#8a6440"); return true;
    case "Corinthian": px(c, o + 3, 4, 10, 10, "#c8a050"); px(c, o + 2, 2, 12, 2, "#b0412f"); px(c, o + 4, 8, 3, 1, "#2a1d14"); px(c, o + 9, 8, 3, 1, "#2a1d14"); px(c, o + 7, 8, 2, 4, "#a8803a"); px(c, o + 5, 11, 2, 3, "rgba(0,0,0,0)"); c.clearRect(o + 6, 11, 4, 3); px(c, o + 4, 5, 1, 4, "#f0d890"); return true;
    case "LeatherShirt": tunic("#8a6440"); px(c, o + 8, 3, 1, 8, "#6b4a2b"); return true;
    case "Linothorax": tunic("#e8dcc0"); px(c, o + 2, 3, 12, 2, "#b0412f"); for (let x = 4; x < 12; x += 2) px(c, o + x, 12, 1, 3, "#e8dcc0"); return true;
    case "ScaleCuirass": tunic("#b8903a"); for (let y = 4; y < 13; y++) for (let x = 4 + (y % 2); x < 12; x += 2) px(c, o + x, y, 1, 1, "#8a6a2a"); return true;
    case "Cuirass": tunic("#d0a848"); px(c, o + 6, 5, 4, 1, "#a8803a"); px(c, o + 7, 6, 2, 3, "#a8803a"); px(c, o + 5, 4, 1, 6, "#f0d890"); px(c, o + 4, 11, 8, 1, "#a8803a"); return true;
    case "Pelte": px(c, o + 2, 4, 12, 9, "#8a6440"); px(c, o + 5, 2, 2, 3, "#8a6440"); px(c, o + 9, 2, 2, 3, "#8a6440"); c.clearRect(o + 7, 2, 2, 4); px(c, o + 5, 7, 6, 2, "#c8a050"); return true;
    case "Aspis": px(c, o + 4, 1, 8, 14, "#c8a050"); px(c, o + 2, 3, 12, 10, "#c8a050"); px(c, o + 1, 5, 14, 6, "#c8a050"); px(c, o + 5, 5, 6, 6, "#b0412f"); px(c, o + 7, 7, 2, 2, "#c8a050"); px(c, o + 4, 1, 8, 1, "#f0d890"); return true;
    case "Greaves": for (const x of [3, 9]) { px(c, o + x, 2, 4, 12, "#c8a050"); px(c, o + x, 2, 1, 12, "#f0d890"); px(c, o + x + 1, 6, 2, 2, "#a8803a"); } return true;
    case "Sandals": for (const x of [2, 9]) { px(c, o + x, 5, 5, 10, "#8a6440"); px(c, o + x + 1, 7, 3, 1, "#4a3220"); px(c, o + x + 1, 10, 3, 1, "#4a3220"); } return true;
    case "Boots": for (const x of [2, 9]) { px(c, o + x, 2, 4, 10, "#6b4a2b"); px(c, o + x, 11, 6, 3, "#6b4a2b"); px(c, o + x, 4, 4, 1, "#8a6440"); px(c, o + x, 7, 4, 1, "#8a6440"); } return true;
  }
  return false;
}

export const ITEM_ICON_ORDER = ["Pearl", "Moly", "Clew", "Labrys", "Torch", "Copper", "GoldDust", "Must", "Wine", "Cutting", "Ivy", "Syrinx", "WildGrapes", "Plum", "Cornel", "Purslane", "Oats", "Thyme", "Capers", "Clay", "Ochre", "Mushrooms", "SeaFennel", "Saltbush", "MountainTea", "Thistle", "Fennel", "Fibula", "Figurine", "Arrowhead", "OldCoin", "Nest", "Fossil", "Obsidian", "Amber", "OwlFeather", "Thunderstone", "HeliadTear", "LionPelt",
  "Workbench", "Kiln", "Loom", "Chest", "Table", "Stool", "Chair", "Couch", "Rug", "Pelt", "LampStand", "Basket", "Vase", "Tapestry", "Fence", "Snare", "Amphora", "WineAmphora", "Lamp", "Cloth", "Kopis", "Club", "SilverDagger", "Cestus", "Sling", "Javelin", "FireArrow", "HealerKit", "Tackle", "Mirror", "Waterskin", "Tent", "Map", "Loadstone", "Scale", "Knife", "Pack", "Cloak", "Chiton", "Exomis", "Peplos", "Robes", "Himation", "Petasos", "Kynee", "TuskHelm", "Corinthian", "LeatherShirt", "Linothorax", "ScaleCuirass", "Cuirass", "Pelte", "Aspis", "Greaves", "Sandals", "Boots", "Garland", "Campfire", "Boat", "Press", "Forge", "Olives", "OliveOil", "Parcel", "spear", "sword", "hoe", "jar", "sickle", "axe", "mattock", "bow", "Arrow", "Meat", "Hide", "Antler", "Tusk", "Feather", "Wood", "Stone", "Fiber", "Flowers", "Milk", "Honey", "Wax", "Grapes",
  ...Object.keys(CROPS), ...Object.keys(CROPS).map(seedId), ...DISH_IDS, "Lyre", "Aulos", "rod", "Chub", "Perch", "Trout", "Eel", "Mullet", "Sardine", "Bream", "RedMullet", "Octopus", "Tuna", "Cuttlefish", ...PHARM_ICON_IDS, ...CIRCLET_ICON_IDS];

const CROP_COL: Record<string, [string, string]> = {
  Millet: ["#d9b25e", "#b38f48"], Chickpeas: ["#d8c48e", "#9aa04a"], Melon: ["#7aa04a", "#e8c86a"], Mint: ["#5e9f5a", "#3f7a3f"],
  Poppy: ["#d83a3a", "#8aa070"], Garlic: ["#efe8d8", "#9ab07a"], Barley: ["#d8c070", "#b09a50"], Wheat: ["#e8c050", "#c09a38"],
};

function drawCrop(c: Ctx, o: number, id: string, st: number) {
  const leaf = "#6f9a3c", leafD = "#557a2c", [a, b] = CROP_COL[id];
  if (st === 0) { px(c, o + 5, 9, 2, 1, "#5a3d22"); px(c, o + 9, 10, 2, 1, "#5a3d22"); px(c, o + 7, 12, 2, 1, "#5a3d22"); return; }
  if (st === 1) { px(c, o + 7, 9, 1, 4, leaf); px(c, o + 5, 9, 2, 1, leaf); px(c, o + 8, 8, 2, 1, leaf); return; }
  switch (id) {
    case "Millet":
      for (const x of [4, 7, 10]) { px(c, o + x, 5, 1, 9, leaf); px(c, o + x - 1, 8, 1, 3, leafD); }
      if (st === 3) for (const x of [4, 7, 10]) { px(c, o + x - 1, 2, 3, 4, a); px(c, o + x, 1, 1, 2, b); }
      break;
    case "Chickpeas":
      px(c, o + 4, 6, 8, 7, leafD); px(c, o + 5, 5, 6, 2, leaf); px(c, o + 3, 8, 2, 3, leaf); px(c, o + 11, 8, 2, 3, leaf);
      if (st === 3) for (const [x, y] of [[5, 7], [9, 8], [7, 10], [10, 11]]) px(c, o + x, y, 2, 2, a);
      break;
    case "Melon":
      px(c, o + 2, 11, 12, 2, leafD); px(c, o + 3, 9, 3, 3, leaf); px(c, o + 10, 9, 3, 3, leaf);
      if (st === 3) { px(c, o + 5, 7, 6, 6, a); px(c, o + 6, 6, 4, 1, a); px(c, o + 6, 8, 1, 3, b); px(c, o + 9, 8, 1, 3, b); }
      else px(c, o + 7, 10, 2, 2, a);
      break;
    case "Mint":
      px(c, o + 7, 6, 1, 8, leafD); for (const [x, y] of [[4, 7], [9, 6], [5, 10], [9, 10]]) px(c, o + x, y, 3, 2, st === 3 ? a : leaf);
      if (st === 3) { px(c, o + 6, 3, 3, 3, b); px(c, o + 7, 2, 1, 1, "#c9a0d8"); }
      break;
    case "Poppy": // grey-green stems; red flowers while growing, then the swollen seed heads
      for (const x of [4, 8, 11]) { px(c, o + x, 5, 1, 9, "#8aa070"); px(c, o + x - 1, 11, 3, 1, "#7a9060"); }
      if (st === 3) for (const x of [4, 8, 11]) { px(c, o + x - 1, 2, 3, 3, b); px(c, o + x - 1, 2, 3, 1, "#6a8060"); px(c, o + x, 1, 1, 1, "#5a6a4a"); }
      else for (const x of [4, 8, 11]) { px(c, o + x - 1, 3, 3, 2, a); px(c, o + x, 4, 1, 1, "#2a1a1a"); }
      break;
    case "Barley": case "Wheat": // grain: bearded barley, golden wheat
      for (const x of [3, 6, 9, 12]) { px(c, o + x, 5, 1, 9, st === 3 ? b : leaf); px(c, o + x - 1, 9, 1, 2, leafD); }
      if (st === 3) for (const x of [3, 6, 9, 12]) { px(c, o + x - 1, 2, 2, 4, a); if (id === "Barley") { px(c, o + x - 2, 1, 1, 2, a); px(c, o + x + 1, 1, 1, 2, a); } else px(c, o + x, 1, 1, 1, a); }
      break;
    case "Garlic": // strap leaves, and the bulbs shouldering out of the soil when ripe
      for (const x of [4, 7, 10]) { px(c, o + x, 4, 1, 9, b); px(c, o + x + 1, 6, 1, 6, leafD); }
      if (st === 3) for (const x of [4, 7, 10]) { px(c, o + x - 1, 12, 3, 2, a); px(c, o + x, 11, 1, 1, "#f8f4ec"); }
      break;
  }
}

function drawForage(c: Ctx, o: number, id: string, fruit: boolean) {
  const leaf = "#5e7f34", leafL = "#71953f", leafD = "#4a6629";
  if (!fruit) switch (id) {
    case "plum": px(c, o + 3, 6, 10, 7, leafD); px(c, o + 4, 4, 8, 3, leaf); px(c, o + 5, 5, 3, 2, leafL); px(c, o + 7, 13, 2, 2, "#6b4a2b"); px(c, o + 3, 14, 10, 2, "rgba(0,0,0,0.2)"); break;
    case "cornel": px(c, o + 5, 3, 6, 10, leafD); px(c, o + 6, 2, 4, 3, leaf); px(c, o + 6, 4, 2, 3, leafL); px(c, o + 7, 13, 2, 2, "#6b4a2b"); px(c, o + 4, 14, 8, 2, "rgba(0,0,0,0.2)"); break;
    case "wildgrape": for (let i = 0; i < 12; i++) px(c, o + 2 + i, 11 + Math.round(Math.sin(i * 0.9) * 2), 1, 1, "#6b4a2b"); for (const x of [3, 7, 11]) { px(c, o + x, 8, 3, 3, leaf); px(c, o + x + 1, 8, 1, 1, leafL); } break;
    case "purslane": px(c, o + 7, 9, 2, 5, "#9a5040"); for (const [x, y] of [[4, 10], [10, 10], [6, 8], [9, 12], [5, 12]]) px(c, o + x, y, 2, 2, leafL); break;
    case "oats": for (const x of [4, 6, 8, 10, 12]) px(c, o + x, 5 + (x % 3), 1, 14 - 5 - (x % 3), "#8fa04a"); px(c, o + 3, 13, 10, 1, "#6f8a3a"); break;
    case "thyme": px(c, o + 3, 9, 10, 5, "#7d8f6a"); px(c, o + 4, 8, 8, 2, "#8fa07a"); px(c, o + 5, 10, 2, 1, "#6b7d5a"); px(c, o + 9, 11, 2, 1, "#6b7d5a"); break;
    case "caper": px(c, o + 2, 11, 12, 2, "#5a6b3c"); for (const [x, y] of [[3, 9], [7, 8], [11, 9], [5, 12], [10, 12]]) px(c, o + x, y, 2, 2, "#7aa04a"); break;
    case "clay": px(c, o + 2, 10, 12, 4, "#a07a62"); px(c, o + 4, 8, 8, 3, "#b08a70"); px(c, o + 5, 9, 3, 1, "#c09a80"); break;
    case "ochre": px(c, o + 2, 11, 12, 3, "#b08a3a"); px(c, o + 4, 10, 6, 2, "#c4a04a"); px(c, o + 10, 12, 3, 1, "#8a6a2a"); break;
    case "mushrooms": px(c, o + 2, 11, 12, 3, "#7a5a33"); px(c, o + 4, 10, 3, 1, "#8a6a3a"); px(c, o + 9, 12, 3, 1, "#6b4a2b"); break;
    case "seafennel": for (const [x, y] of [[3, 9], [6, 7], [9, 8], [12, 10], [5, 11], [10, 12]]) px(c, o + x, y, 2, 3, "#7aa08a"); px(c, o + 3, 13, 10, 1, "#5a7a6a"); break;
    case "saltbush": px(c, o + 3, 8, 10, 6, "#9aa49a"); px(c, o + 5, 6, 6, 3, "#aab4aa"); px(c, o + 6, 9, 2, 1, "#7a847a"); break;
    case "mountaintea": for (const x of [4, 7, 10]) { px(c, o + x, 6, 2, 8, "#a8b098"); px(c, o + x - 1, 9, 4, 2, "#b8c0a8"); } break;
    case "thistle": px(c, o + 7, 6, 2, 8, "#6a8a5a"); for (const [x, y] of [[4, 9], [10, 8], [5, 12], [10, 12]]) px(c, o + x, y, 3, 1, "#7a9a6a"); break;
    case "fennel": for (const x of [5, 8, 11]) px(c, o + x, 4, 1, 10, "#7a9a4a"); for (const [x, y] of [[3, 6], [9, 5], [6, 8], [11, 9]]) px(c, o + x, y, 3, 1, "#9aba5a"); break;
    // The herb-Art's plants.
    case "sage": px(c, o + 3, 9, 10, 5, "#8a9a88"); for (const [x, y] of [[4, 7], [8, 6], [11, 8], [6, 10]]) px(c, o + x, y, 3, 2, "#a4b4a0"); break;
    case "yarrow": for (const x of [4, 8, 11]) px(c, o + x, 6, 1, 8, "#6a8a4a"); for (const [x, y] of [[3, 10], [7, 9], [10, 11], [5, 12]]) px(c, o + x, y, 3, 1, "#7a9a5a"); break;
    case "willow": px(c, o + 7, 6, 2, 9, "#6b5a3a"); px(c, o + 3, 2, 10, 4, "#8aa05a"); for (const x of [3, 5, 10, 12]) px(c, o + x, 5, 1, 7, "#9ab06a"); px(c, o + 4, 14, 8, 1, "rgba(0,0,0,0.2)"); break;
    case "dittany": px(c, o + 2, 12, 12, 3, "#8a8478"); px(c, o + 3, 10, 4, 2, "#9a9488"); for (const [x, y] of [[4, 8], [8, 7], [11, 9]]) { px(c, o + x, y, 3, 3, "#b8c4a8"); px(c, o + x, y, 1, 1, "#d8e0c8"); } break;
    case "wormwood": px(c, o + 3, 7, 10, 7, "#a8b0a0"); px(c, o + 5, 5, 6, 3, "#c0c8b8"); px(c, o + 6, 9, 1, 3, "#8a9080"); px(c, o + 10, 8, 1, 3, "#8a9080"); break;
    case "squill": px(c, o + 4, 11, 8, 4, "#d8c8b0"); px(c, o + 5, 10, 6, 1, "#c8b8a0"); for (const x of [4, 7, 10]) px(c, o + x, 5, 2, 6, "#5a8a4a"); break;
    case "laurel": px(c, o + 7, 10, 2, 5, "#6b4a2b"); px(c, o + 3, 3, 10, 8, "#3f6a34"); px(c, o + 4, 2, 8, 2, "#4f7a3c"); px(c, o + 5, 4, 2, 2, "#6a9a4a"); px(c, o + 10, 6, 2, 2, "#6a9a4a"); break;
    case "asphodel": for (const x of [5, 10]) px(c, o + x, 4, 1, 10, "#7a8a5a"); px(c, o + 3, 12, 10, 2, "#6a7a4a"); break;
    case "cyclamen": px(c, o + 2, 12, 12, 3, "#8a8478"); for (const [x, y] of [[4, 11], [8, 10], [11, 11]]) px(c, o + x, y, 3, 2, "#4a6a3a"); for (const x of [5, 9]) px(c, o + x, 7, 1, 4, "#6a5a4a"); break;
    case "wildrose": px(c, o + 2, 6, 12, 8, "#4f6b2c"); px(c, o + 3, 5, 10, 2, "#5e7f34"); for (const [x, y] of [[3, 8], [12, 9], [7, 12]]) px(c, o + x, y, 1, 1, "#8a6a4a"); break;
    case "seaholly": for (const [x, y] of [[3, 9], [6, 7], [9, 8], [12, 10], [7, 11]]) { px(c, o + x, y, 2, 3, "#8aa0b8"); px(c, o + x - 1, y + 1, 1, 1, "#a8bcd0"); } break;
    case "mandrake": px(c, o + 2, 10, 12, 4, "#2f4a2a"); for (const [x, y] of [[3, 9], [6, 8], [10, 9], [12, 11]]) px(c, o + x, y, 3, 2, "#3f5a34"); break;
    case "hellebore": px(c, o + 3, 8, 10, 6, "#2f4a34"); for (const [x, y] of [[4, 7], [9, 6], [11, 9]]) px(c, o + x, y, 3, 2, "#3f5a44"); break;
    case "henbane": px(c, o + 7, 5, 2, 9, "#6a7a4a"); for (const [x, y] of [[3, 9], [10, 8], [4, 12], [10, 12]]) px(c, o + x, y, 3, 2, "#7a8a54"); break;
    case "hemlock": for (const x of [5, 9]) { px(c, o + x, 4, 1, 10, "#7a8a5a"); for (const y of [6, 9, 12]) px(c, o + x, y, 1, 1, "#7a3a5a"); } for (const [x, y] of [[3, 7], [10, 6], [6, 10]]) px(c, o + x, y, 3, 1, "#8aa06a"); break;
    // Plants for crowns and wreaths.
    case "myrtle": px(c, o + 3, 6, 10, 8, "#3f6a3a"); px(c, o + 4, 5, 8, 2, "#4f7a4a"); for (const [x, y] of [[4, 8], [9, 7], [11, 10]]) px(c, o + x, y, 2, 1, "#6a9a5a"); px(c, o + 7, 13, 2, 2, "#6b4a2b"); break;
    case "ivy": for (let i = 0; i < 10; i++) px(c, o + 3 + i, 12 - Math.round(Math.sin(i * 0.8) * 2) - (i >> 1), 1, 1, "#5a4a2a"); for (const [x, y] of [[3, 10], [6, 8], [9, 7], [12, 5], [5, 12]]) { px(c, o + x, y, 2, 2, "#2f5a2a"); px(c, o + x, y, 1, 1, "#4a7a3a"); } break;
    case "poplar": px(c, o + 7, 8, 2, 7, "#a8a090"); px(c, o + 5, 1, 6, 9, "#7a9a6a"); px(c, o + 6, 0, 4, 2, "#8aaa7a"); for (const [x, y] of [[6, 3], [9, 5], [7, 7]]) px(c, o + x, y, 1, 1, "#e0e8e0"); break;
    case "parsley": for (const [x, y] of [[4, 9], [7, 8], [10, 9], [5, 11], [9, 11]]) { px(c, o + x, y, 2, 2, "#5a9a3a"); px(c, o + x + 1, y, 1, 1, "#7aba4a"); } px(c, o + 4, 13, 8, 1, "#4a7a2a"); break;
    case "celery": for (const x of [4, 7, 10]) { px(c, o + x, 6, 1, 8, "#8aa060"); px(c, o + x - 1, 4, 3, 2, "#6a9a3a"); } break;
  } else switch (id) {
    case "plum": for (const [x, y] of [[4, 6], [8, 5], [10, 8], [6, 9], [9, 11]]) { px(c, o + x, y, 2, 2, "#6a3a7a"); px(c, o + x, y, 1, 1, "#9a6aaa"); } break;
    case "cornel": for (const [x, y] of [[5, 4], [8, 6], [6, 8], [9, 10], [6, 11]]) { px(c, o + x, y, 2, 2, "#c0302a"); px(c, o + x, y, 1, 1, "#e06050"); } break;
    case "wildgrape": for (const x of [4, 9]) { px(c, o + x, 10, 3, 2, "#5a2d5e"); px(c, o + x + 1, 12, 1, 1, "#5a2d5e"); px(c, o + x, 10, 1, 1, "#8a5a8e"); } break;
    case "purslane": for (const [x, y] of [[5, 9], [10, 9], [8, 11]]) px(c, o + x, y, 1, 1, "#f2d040"); break;
    case "oats": for (const x of [4, 6, 8, 10, 12]) { px(c, o + x - 1, 4 + (x % 3), 3, 2, "#d9c27a"); } break;
    case "thyme": for (const [x, y] of [[4, 8], [7, 7], [10, 8], [6, 10], [9, 10], [12, 10]]) px(c, o + x, y, 1, 1, "#c9a0d8"); break;
    case "caper": for (const [x, y] of [[4, 8], [8, 7], [12, 8], [6, 11]]) { px(c, o + x, y, 2, 1, "#c8e0a0"); px(c, o + x, y + 1, 1, 1, "#e8f0d0"); } break;
    case "clay": px(c, o + 5, 11, 1, 2, "#7a5a48"); px(c, o + 8, 10, 1, 3, "#7a5a48"); px(c, o + 11, 11, 1, 2, "#7a5a48"); px(c, o + 6, 9, 2, 1, "#d8b8a0"); break;
    case "ochre": for (const [x, y] of [[4, 10], [8, 11], [11, 10]]) px(c, o + x, y, 2, 2, "#e8c040"); break;
    case "mushrooms": for (const [x, y] of [[4, 9], [8, 8], [11, 10]]) { px(c, o + x, y, 3, 2, "#e8e2d0"); px(c, o + x + 1, y + 2, 1, 2, "#d8d0bc"); } break;
    case "seafennel": for (const [x, y] of [[6, 6], [9, 7], [4, 8]]) px(c, o + x, y, 2, 1, "#e8d870"); break;
    case "saltbush": for (const [x, y] of [[5, 7], [9, 8], [7, 10], [11, 11]]) px(c, o + x, y, 1, 1, "#e0d8c0"); break;
    case "mountaintea": for (const x of [4, 7, 10]) px(c, o + x, 5, 2, 2, "#e8d860"); break;
    case "thistle": px(c, o + 6, 4, 4, 3, "#a060c0"); px(c, o + 7, 3, 2, 1, "#c080e0"); px(c, o + 6, 7, 4, 1, "#6a8a5a"); break;
    case "fennel": for (const x of [4, 8, 11]) { px(c, o + x, 3, 3, 1, "#e8d040"); px(c, o + x + 1, 2, 1, 1, "#f0e070"); } break;
    case "sage": for (const [x, y] of [[5, 5], [9, 4], [12, 6]]) px(c, o + x, y, 1, 2, "#9a7ad0"); break;
    case "yarrow": for (const x of [3, 7, 10]) { px(c, o + x, 4, 3, 2, "#f2eee0"); px(c, o + x + 1, 3, 1, 1, "#ffffff"); } break;
    case "willow": px(c, o + 6, 8, 4, 2, "#a07a52"); px(c, o + 7, 8, 2, 1, "#c09a6a"); break;
    case "dittany": for (const [x, y] of [[5, 6], [9, 5]]) px(c, o + x, y, 2, 2, "#e8a0c8"); break;
    case "wormwood": for (const [x, y] of [[5, 4], [9, 4], [7, 6]]) px(c, o + x, y, 1, 1, "#e0d070"); break;
    case "squill": for (const x of [4, 7, 10]) px(c, o + x, 3, 2, 3, "#f2f0e0"); break;
    case "laurel": for (const [x, y] of [[4, 4], [8, 3], [11, 6], [6, 8]]) px(c, o + x, y, 2, 1, "#8ac060"); break;
    case "asphodel": for (const x of [5, 10]) { px(c, o + x - 1, 3, 3, 3, "#f0e8e0"); px(c, o + x, 4, 1, 1, "#c07a6a"); } break;
    case "cyclamen": for (const x of [4, 8]) { px(c, o + x, 5, 3, 2, "#e070a8"); px(c, o + x + 1, 4, 1, 1, "#f0a0c8"); } break;
    case "wildrose": for (const [x, y] of [[4, 6], [9, 5], [11, 9], [6, 9]]) { px(c, o + x, y, 2, 2, "#f0a0b8"); px(c, o + x, y, 1, 1, "#f8d0dc"); } break;
    case "seaholly": for (const [x, y] of [[6, 5], [10, 6]]) { px(c, o + x, y, 2, 2, "#6a80d0"); px(c, o + x, y, 1, 1, "#9ab0f0"); } break;
    case "mandrake": for (const [x, y] of [[5, 8], [9, 7]]) px(c, o + x, y, 2, 2, "#c8b060"); px(c, o + 7, 13, 2, 2, "#c8a888"); break;
    case "hellebore": for (const [x, y] of [[5, 5], [10, 5]]) { px(c, o + x, y, 3, 2, "#c8d8a0"); px(c, o + x + 1, y, 1, 1, "#e8f0d0"); } break;
    case "henbane": for (const [x, y] of [[6, 4], [9, 5], [4, 8]]) { px(c, o + x, y, 2, 2, "#d8c890"); px(c, o + x, y + 1, 1, 1, "#6a3a5a"); } break;
    case "hemlock": for (const x of [4, 8]) px(c, o + x, 3, 3, 2, "#f2f0e8"); break;
    case "myrtle": for (const [x, y] of [[5, 6], [9, 5], [7, 9], [11, 8]]) { px(c, o + x, y, 1, 1, "#f2f0e8"); px(c, o + x, y + 1, 1, 1, "#e8d870"); } break;
    case "ivy": for (const [x, y] of [[6, 6], [10, 4]]) px(c, o + x, y, 2, 2, "#2a2a3a"); break;
    case "poplar": for (const [x, y] of [[5, 2], [9, 3], [6, 6], [10, 7]]) px(c, o + x, y, 1, 1, "#f0f4f0"); break;
    case "parsley": for (const [x, y] of [[5, 7], [9, 7]]) px(c, o + x, y, 2, 1, "#e8e8b0"); break;
    case "celery": for (const x of [4, 7, 10]) px(c, o + x - 1, 3, 3, 1, "#e8e8c0"); break;
  }
}
const FORAGE_ICON: Record<string, string> = { WildGrapes: "wildgrape", Plum: "plum", Cornel: "cornel", Purslane: "purslane", Oats: "oats", Thyme: "thyme", Capers: "caper", Clay: "clay", Ochre: "ochre", Mushrooms: "mushrooms", SeaFennel: "seafennel", Saltbush: "saltbush", MountainTea: "mountaintea", Thistle: "thistle", Fennel: "fennel",
  Sage: "sage", Yarrow: "yarrow", WillowBark: "willow", Dittany: "dittany", Wormwood: "wormwood", Squill: "squill", Laurel: "laurel", Asphodel: "asphodel", Cyclamen: "cyclamen", WildRose: "wildrose", SeaHolly: "seaholly", Mandrake: "mandrake", Hellebore: "hellebore", Henbane: "henbane", Hemlock: "hemlock",
  Myrtle: "myrtle", Poplar: "poplar", Parsley: "parsley", Celery: "celery" };

function drawIcon(c: Ctx, o: number, id: string) {
  if (drawFurnIcon(c, o, id)) return;
  if (drawGearIcon(c, o, id)) return;
  if (drawEquipIcon(c, o, id)) return;
  if (id === "rod") { for (let i = 0; i < 12; i++) px(c, o + 2 + i, 13 - i, 1, 1, "#8a5a2a"); px(c, o + 13, 1, 1, 9, "rgba(230,230,220,0.7)"); px(c, o + 12, 10, 2, 2, "#d8402a"); return; }
  const FISHC: Record<string, [string, string, number]> = { Chub: ["#8a8a6a", "#c8c8a8", 9], Perch: ["#6a8a3a", "#c8d070", 9], Trout: ["#7a8a7a", "#e0a0a0", 10], Mullet: ["#8a9098", "#d8dce0", 10],
    Sardine: ["#5a7a9a", "#e0e8f0", 7], Bream: ["#8a9aa8", "#f0d060", 10], RedMullet: ["#c85a50", "#f0b0a0", 9], Tuna: ["#2a3a5a", "#a0b0c8", 12] };
  if (FISHC[id]) { // a fish, nose right
    const [back, belly, len] = FISHC[id], x0 = o + Math.floor((14 - len) / 2);
    px(c, x0 + 2, 6, len - 3, 4, back); px(c, x0 + 2, 9, len - 3, 2, belly); px(c, x0 + 1, 7, 1, 3, back); px(c, x0 - 1, 5, 2, 2, back); px(c, x0 - 1, 10, 2, 2, back);
    px(c, x0 + len - 3, 7, 1, 1, "#1a1410"); if (id === "Bream") px(c, x0 + len - 4, 6, 2, 1, "#f0d060"); if (id === "Perch") for (const x of [4, 6, 8]) px(c, x0 + x, 6, 1, 3, "#3a5a1a");
    return;
  }
  if (id === "Eel") { for (let i = 0; i < 12; i++) px(c, o + 2 + i, 8 + Math.round(Math.sin(i * 0.9) * 2), 1, 2, "#4a4a2a"); px(c, o + 13, 7, 1, 1, "#1a1410"); return; }
  if (id === "Octopus") { px(c, o + 5, 3, 6, 6, "#b0605a"); px(c, o + 6, 5, 1, 1, "#1a1410"); px(c, o + 9, 5, 1, 1, "#1a1410"); for (const x of [4, 6, 8, 10]) { px(c, o + x, 9, 1, 4, "#b0605a"); px(c, o + x + 1, 12, 1, 2, "#b0605a"); } return; }
  if (id === "Cuttlefish") { px(c, o + 3, 6, 9, 5, "#a89880"); px(c, o + 3, 6, 9, 1, "#7a6a58"); px(c, o + 10, 7, 1, 1, "#1a1410"); for (const y of [7, 9]) px(c, o + 12, y, 3, 1, "#a89880"); return; }
  if (id === "Lyre") { // a tortoise-shell sounding box, two antler horns, a crossbar and strings
    px(c, o + 4, 9, 8, 5, "#8a6a3a"); px(c, o + 5, 10, 6, 3, "#a8844a"); px(c, o + 6, 11, 1, 1, "#5a4020"); px(c, o + 9, 11, 1, 1, "#5a4020");
    px(c, o + 4, 3, 1, 7, "#e8dcc0"); px(c, o + 11, 3, 1, 7, "#e8dcc0"); px(c, o + 3, 2, 2, 1, "#e8dcc0"); px(c, o + 11, 2, 2, 1, "#e8dcc0");
    px(c, o + 4, 3, 8, 1, "#6b4a2b"); for (const x of [6, 8, 10]) px(c, o + x, 4, 1, 6, "#f2ecd8"); return;
  }
  if (id === "Aulos") { // two pipes, splayed
    for (let i = 0; i < 10; i++) { px(c, o + 7 - Math.floor(i / 3), 3 + i, 1, 1, "#b08a52"); px(c, o + 8 + Math.floor(i / 3), 3 + i, 1, 1, "#b08a52"); }
    px(c, o + 7, 2, 2, 2, "#5a4020"); for (const y of [6, 9]) { px(c, o + 6, y, 1, 1, "#3a2810"); px(c, o + 9, y, 1, 1, "#3a2810"); } return;
  }
  if (id.startsWith("meal_") || id.startsWith("dish_")) {
    // A clay bowl, its food colored by the Aretai (plain dishes) or the god (a god's dish), steam rising.
    const GOD_COL: Record<string, string> = { Hades: "#5a4a6a", Hecate: "#6a4a8a" };
    const ar = id.slice(5), named = NAMED.find((n) => `dish_${n.key}` === id);
    const col = named ? GOD_COL[named.god] ?? WHEEL.find((w) => w.god === named.god)?.color ?? "#c9a35a" : WHEEL.find((w) => w.aretai === ar)?.color ?? "#c9a35a";
    px(c, o + 2, 8, 12, 1, "#9c5532"); px(c, o + 3, 9, 10, 3, "#c4703f"); px(c, o + 5, 12, 6, 2, "#9c5532");
    px(c, o + 3, 7, 10, 2, col); px(c, o + 5, 6, 6, 1, col); px(c, o + 6, 7, 2, 1, "rgba(255,255,255,0.45)");
    if (named) { px(c, o + 7, 10, 2, 1, "#f2d27a"); } // a gold mark: a god's dish
    px(c, o + 6, 2, 1, 2, "rgba(255,255,255,0.5)"); px(c, o + 9, 1, 1, 3, "rgba(255,255,255,0.4)");
    return;
  }
  if (id === "OliveSprig" || id === "OakLeaves" || id === "PineBoughs") { // a cut spray of leaves
    for (let i = 0; i < 9; i++) px(c, o + 3 + i, 13 - i, 1, 1, "#6b4a2b");
    const lf = id === "OliveSprig" ? ["#8a9a6a", "#b0c098"] : id === "OakLeaves" ? ["#4a6a2a", "#6a8a3a"] : ["#2f4a2a", "#4a6a3a"];
    if (id === "PineBoughs") for (let i = 0; i < 8; i++) { px(c, o + 3 + i, 11 - i, 1, 3, lf[i % 2]); px(c, o + 5 + i, 13 - i, 1, 2, lf[(i + 1) % 2]); }
    else for (const [x, y] of [[3, 9], [6, 9], [5, 6], [8, 6], [7, 3], [10, 4]]) { px(c, o + x, y, id === "OakLeaves" ? 3 : 2, 2, lf[0]); px(c, o + x, y, 1, 1, lf[1]); }
    if (id === "OliveSprig") for (const [x, y] of [[9, 8], [5, 4]]) px(c, o + x, y, 1, 1, "#3a3a2a");
    return;
  }
  if (id === "Mortar") { px(c, o + 3, 8, 10, 5, "#a09888"); px(c, o + 4, 13, 8, 1, "#7a7266"); px(c, o + 4, 8, 8, 2, "#5a5448"); px(c, o + 5, 8, 6, 1, "#6a9a4a"); for (let i = 0; i < 6; i++) px(c, o + 8 + i, 7 - i, 2, 1, "#8a6a42"); return; }
  if (id.startsWith("pharm_")) {
    const col = ASPECTS[id.slice(6) as Aspect]?.color ?? "#c9a35a";
    switch (id) {
      case "pharm_healing": case "pharm_love": // a little lidded pot of salve, or scent
        px(c, o + 4, 6, 8, 8, "#c4703f"); px(c, o + 4, 13, 8, 1, "#9c5532"); px(c, o + 5, 7, 6, 3, col); px(c, o + 6, 7, 2, 1, "rgba(255,255,255,0.5)"); px(c, o + 3, 5, 10, 2, "#9c5532"); px(c, o + 7, 3, 2, 2, "#9c5532"); break;
      case "pharm_sight": // a bound bundle of leaves for burning, smoking
        for (let i = 0; i < 7; i++) px(c, o + 3 + i, 12 - i, 3, 2, i % 2 ? "#4f7a3c" : col); px(c, o + 6, 9, 2, 2, "#c41e1e"); px(c, o + 11, 3, 1, 2, "rgba(255,255,255,0.5)"); px(c, o + 12, 1, 1, 2, "rgba(255,255,255,0.35)"); break;
      case "pharm_warding": // a herb-bag on a red cord
        for (let i = 0; i < 8; i++) { px(c, o + 3 + i, 2 + Math.floor(i / 2), 1, 1, "#c41e1e"); } px(c, o + 5, 6, 7, 7, "#b8a070"); px(c, o + 5, 6, 7, 1, "#8a7450"); px(c, o + 7, 8, 3, 3, col); break;
      default: // a stoppered flask: draughts, and the poison
        px(c, o + 5, 7, 6, 7, col); px(c, o + 6, 4, 4, 3, col); px(c, o + 6, 2, 4, 2, "#8a6a42"); px(c, o + 5, 13, 6, 1, "rgba(0,0,0,0.3)"); px(c, o + 6, 8, 1, 3, "rgba(255,255,255,0.45)");
        if (id === "pharm_venom") { px(c, o + 7, 9, 2, 2, "#2a3a1a"); px(c, o + 8, 11, 1, 1, "#2a3a1a"); }
    }
    return;
  }
  if (FORAGE_ICON[id]) { drawForage(c, o, FORAGE_ICON[id], false); drawForage(c, o, FORAGE_ICON[id], true); return; }
  if (id.startsWith("seed_")) {
    const [a] = CROP_COL[id.slice(5)];
    px(c, o + 4, 4, 8, 10, "#c9b48f"); px(c, o + 5, 3, 6, 2, "#a99878"); px(c, o + 6, 2, 4, 1, "#8a7a5a"); px(c, o + 4, 13, 8, 1, "#a99878");
    px(c, o + 6, 7, 2, 2, a); px(c, o + 9, 9, 2, 2, a); px(c, o + 6, 10, 1, 1, a);
    return;
  }
  if (CROP_COL[id]) { drawCrop(c, o, id, 3); return; }
  const wood = "#8a5f35", bronze = "#c98a3e", bronzeD = "#9c6528";
  switch (id) {
    case "Torch": px(c, o + 7, 5, 2, 10, "#8a5f35"); px(c, o + 6, 4, 4, 2, "#5a3d22"); px(c, o + 6, 1, 4, 3, "#e0703a"); px(c, o + 7, 0, 2, 2, "#f2c14e"); break;
    case "Copper": px(c, o + 3, 5, 10, 8, "#6c675e"); for (const [x, y] of [[4, 6], [8, 8], [10, 6], [6, 10]]) px(c, o + x, y, 2, 2, "#3a9a7a"); break;
    case "GoldDust": px(c, o + 4, 6, 8, 7, "#c9b48f"); px(c, o + 5, 4, 6, 3, "#a99878"); px(c, o + 6, 7, 4, 3, "#f2c14e"); px(c, o + 7, 6, 2, 1, "#ffe08a"); break;
    case "Must": px(c, o + 4, 5, 8, 9, "#c4703f"); px(c, o + 5, 3, 6, 2, "#9c5532"); px(c, o + 5, 6, 6, 3, "#7a2a4a"); px(c, o + 4, 13, 8, 1, "#9c5532"); break;
    case "Wine": px(c, o + 6, 1, 4, 3, "#9c5532"); px(c, o + 5, 4, 6, 8, "#c4703f"); px(c, o + 4, 6, 8, 5, "#c4703f"); px(c, o + 6, 12, 4, 2, "#9c5532"); px(c, o + 5, 7, 6, 2, "#2a1d14"); px(c, o + 6, 7, 1, 1, "#e8c86a"); px(c, o + 9, 7, 1, 1, "#e8c86a"); break;
    case "Cutting": for (let i = 0; i < 11; i++) px(c, o + 4 + i, 13 - i, 1, 1, "#6b4a2b"); px(c, o + 9, 5, 3, 3, "#5e7f34"); px(c, o + 6, 9, 2, 2, "#71953f"); break;
    case "Ivy": for (const [x, y] of [[4, 3], [8, 5], [5, 8], [9, 10], [6, 12]]) { px(c, o + x, y, 3, 3, "#3f6a2a"); px(c, o + x + 1, y, 1, 1, "#5e8a3a"); } for (let i = 0; i < 11; i++) px(c, o + 7 + Math.round(Math.sin(i) * 2), 2 + i, 1, 1, "#4a3a22"); break;
    case "Syrinx": for (let i = 0; i < 6; i++) px(c, o + 3 + i * 2, 3, 2, 10 - i, "#c9b48f"); px(c, o + 3, 8, 12, 1, "#8a6a3a"); break;
    case "bow":
      for (let i = 0; i < 12; i++) { const x = 4 + Math.round(Math.sin((i / 11) * Math.PI) * 4); px(c, o + x, 2 + i, 2, 1, i % 4 === 0 ? "#5a3d22" : "#8a5f35"); }
      px(c, o + 11, 2, 1, 12, "#e8e2d0"); px(c, o + 4, 2, 7, 1, "#6b4a2b"); px(c, o + 4, 13, 7, 1, "#6b4a2b"); break;
    case "Arrow":
      for (let i = 0; i < 10; i++) px(c, o + 3 + i, 12 - i, 1, 1, "#a87443");
      px(c, o + 12, 2, 2, 2, "#8d877b"); px(c, o + 13, 1, 1, 1, "#b8b2a6"); px(c, o + 2, 11, 2, 1, "#e8e2d0"); px(c, o + 3, 13, 1, 2, "#e8e2d0"); break;
    case "Meat": px(c, o + 3, 5, 9, 7, "#b5443b"); px(c, o + 4, 6, 6, 3, "#d0645a"); px(c, o + 11, 8, 3, 2, "#f2ece0"); px(c, o + 13, 7, 2, 4, "#f2ece0"); break;
    case "Hide": px(c, o + 3, 3, 10, 10, "#a47a52"); px(c, o + 1, 4, 2, 3, "#a47a52"); px(c, o + 13, 4, 2, 3, "#a47a52"); px(c, o + 2, 11, 2, 3, "#a47a52"); px(c, o + 12, 11, 2, 3, "#a47a52"); px(c, o + 6, 5, 4, 6, "#c09468"); break;
    case "Fibula": for (let i = 0; i < 9; i++) px(c, o + 3 + i, 11 - Math.round(Math.sin((i / 8) * Math.PI) * 5), 1, 1, "#5a9a7a"); px(c, o + 3, 11, 10, 1, "#7ab89a"); px(c, o + 11, 9, 3, 3, "#4a8a6a"); px(c, o + 2, 10, 2, 2, "#4a8a6a"); break;
    case "Figurine": px(c, o + 6, 5, 4, 9, "#c47a4a"); px(c, o + 7, 2, 2, 3, "#c47a4a"); px(c, o + 3, 3, 3, 2, "#c47a4a"); px(c, o + 10, 3, 3, 2, "#c47a4a"); px(c, o + 7, 7, 2, 1, "#8a4a2a"); px(c, o + 7, 10, 2, 1, "#8a4a2a"); px(c, o + 5, 13, 6, 1, "#a8603a"); break;
    case "Arrowhead": for (let i = 0; i < 6; i++) px(c, o + 8 - Math.floor(i / 1.5), 3 + i, 1 + Math.floor(i * 1.2), 1, i % 2 ? "#8a8070" : "#a09888"); px(c, o + 6, 9, 4, 4, "#8a8070"); px(c, o + 7, 13, 2, 2, "#6b5a45"); break;
    case "OldCoin": px(c, o + 4, 4, 8, 8, "#c8ccd0"); px(c, o + 3, 6, 1, 4, "#c8ccd0"); px(c, o + 12, 6, 1, 4, "#c8ccd0"); px(c, o + 6, 3, 4, 1, "#c8ccd0"); px(c, o + 6, 12, 4, 1, "#a8acb0"); px(c, o + 6, 6, 4, 4, "#9a9ea4"); px(c, o + 7, 7, 1, 1, "#e8ecf0"); px(c, o + 9, 7, 1, 1, "#e8ecf0"); break;
    case "Nest": px(c, o + 2, 8, 12, 5, "#8a6a3a"); px(c, o + 4, 7, 8, 2, "#6b4a2b"); px(c, o + 5, 8, 6, 2, "#4a3420"); for (const [x, y] of [[3, 9], [7, 11], [11, 10], [5, 12], [12, 12]]) px(c, o + x, y, 2, 1, "#b0905a"); break;
    case "Fossil": px(c, o + 3, 5, 10, 7, "#b8b0a0"); for (let i = 0; i < 5; i++) px(c, o + 4 + i * 2, 5, 1, 7, "#9a9282"); px(c, o + 6, 12, 4, 2, "#a8a090"); break;
    case "Obsidian": px(c, o + 5, 3, 3, 10, "#1e1a24"); px(c, o + 8, 5, 3, 7, "#2a2632"); px(c, o + 6, 4, 1, 6, "#5a5468"); px(c, o + 9, 6, 1, 3, "#6a6478"); break;
    case "Pearl": px(c, o + 5, 5, 6, 6, "#e8e4dc"); px(c, o + 4, 6, 1, 4, "#cfc8bc"); px(c, o + 11, 6, 1, 4, "#cfc8bc"); px(c, o + 5, 11, 6, 1, "#b8b0a4"); px(c, o + 6, 6, 2, 2, "#ffffff"); break;
    case "Moly": px(c, o + 7, 3, 2, 8, "#5a8a3a"); px(c, o + 4, 5, 3, 2, "#6a9a4a"); px(c, o + 9, 6, 3, 2, "#6a9a4a"); px(c, o + 6, 1, 4, 3, "#f4f2ea"); px(c, o + 7, 2, 2, 1, "#e8d870"); px(c, o + 6, 11, 4, 4, "#1e1a18"); px(c, o + 5, 13, 1, 2, "#1e1a18"); px(c, o + 10, 13, 1, 2, "#1e1a18"); break;
    case "Clew": px(c, o + 4, 5, 8, 7, "#b8282a"); px(c, o + 5, 4, 6, 1, "#c83a3a"); px(c, o + 5, 12, 6, 1, "#8a1a1c"); px(c, o + 5, 6, 6, 1, "#e05a50"); px(c, o + 5, 9, 6, 1, "#e05a50"); px(c, o + 12, 10, 3, 1, "#b8282a"); px(c, o + 14, 11, 1, 3, "#b8282a"); break;
    case "Labrys": px(c, o + 7, 2, 2, 12, "#8a6a2a"); px(c, o + 2, 4, 5, 6, "#e8c050"); px(c, o + 9, 4, 5, 6, "#e8c050"); px(c, o + 3, 5, 3, 4, "#f8e080"); px(c, o + 10, 5, 3, 4, "#f8e080"); px(c, o + 2, 9, 5, 1, "#b89030"); px(c, o + 9, 9, 5, 1, "#b89030"); break;
    case "Amber": px(c, o + 5, 5, 6, 6, "#d8902a"); px(c, o + 4, 6, 1, 4, "#c07a1a"); px(c, o + 11, 6, 1, 4, "#c07a1a"); px(c, o + 6, 6, 2, 2, "#f8c860"); break;
    case "OwlFeather": for (let i = 0; i < 10; i++) { px(c, o + 4 + i, 13 - i, 1, 1, "#7a7068"); px(c, o + 3 + i, 11 - i, 2, 2, i % 3 ? "#b8aca0" : "#8a7e72"); } break;
    case "Thunderstone": px(c, o + 4, 5, 8, 7, "#2e2c30"); px(c, o + 3, 7, 1, 3, "#2e2c30"); px(c, o + 6, 4, 4, 1, "#3e3c40"); px(c, o + 6, 6, 2, 1, "#8a8a9a"); px(c, o + 9, 8, 1, 2, "#6a6a7a"); px(c, o + 12, 3, 1, 3, "#f2e070"); px(c, o + 11, 5, 1, 2, "#f2e070"); break;
    case "HeliadTear": px(c, o + 6, 3, 4, 2, "#f0b040"); px(c, o + 5, 5, 6, 6, "#f0a830"); px(c, o + 6, 11, 4, 1, "#d88820"); px(c, o + 7, 6, 2, 3, "#fff0a0"); px(c, o + 7, 2, 2, 1, "#f8d070"); break;
    case "Boat": px(c, o + 1, 6, 14, 5, "#7a5a33"); px(c, o, 5, 16, 2, "#9c7445"); px(c, o + 2, 7, 12, 2, "#4a3220"); px(c, o + 3, 2, 1, 5, "#c4a070"); px(c, o + 1, 12, 14, 1, "#3f7fa0"); break;
    case "Campfire": for (const [x, y] of [[1, 12], [5, 13], [10, 13], [13, 11], [2, 9], [13, 8]] as [number, number][]) px(c, o + x, y, 3, 2, "#8a8780"); px(c, o + 6, 4, 5, 7, "#e0702a"); px(c, o + 7, 2, 3, 5, "#f2a03a"); px(c, o + 8, 6, 1, 3, "#fff3c0"); break;
    case "Press": px(c, o + 1, 10, 14, 5, "#a49e91"); px(c, o + 3, 11, 10, 2, "#7f7a70"); px(c, o + 2, 2, 2, 9, "#6b4a2b"); px(c, o, 4, 16, 2, "#8a5f35"); px(c, o + 6, 6, 4, 4, "#5e4026"); break;
    case "Forge": px(c, o + 2, 7, 10, 8, "#a8653a"); px(c, o + 4, 9, 6, 3, "#d9732e"); px(c, o + 6, 9, 2, 2, "#f2c14e"); px(c, o + 5, 1, 3, 6, "#8a8780"); px(c, o + 11, 10, 4, 4, "#a47a52"); break;
    case "Olives": for (const [x, y] of [[4, 6], [8, 4], [10, 8], [6, 10], [11, 12]]) { px(c, o + x, y, 3, 3, "#3a3442"); px(c, o + x, y, 1, 1, "#7a7488"); } px(c, o + 6, 2, 5, 1, "#6f8a4a"); px(c, o + 3, 3, 4, 2, "#7a9a52"); break;
    case "OliveOil": px(c, o + 6, 1, 4, 2, "#8a5f35"); px(c, o + 5, 3, 6, 2, "#c4703f"); px(c, o + 4, 5, 8, 8, "#c4703f"); px(c, o + 5, 7, 6, 4, "#b8b04a"); px(c, o + 6, 13, 4, 2, "#a8653a"); px(c, o + 6, 8, 1, 1, "#e8e08a"); break;
    case "Parcel": px(c, o + 2, 5, 12, 9, "#c9b48f"); px(c, o + 2, 5, 12, 2, "#e0d0a8"); px(c, o + 7, 5, 2, 9, "#8a5a2c"); px(c, o + 2, 9, 12, 1, "#8a5a2c"); px(c, o + 6, 3, 4, 2, "#8a5a2c"); break;
    case "spear": for (let i = 0; i < 11; i++) px(c, o + 2 + i, 13 - i, 1, 1, "#9c7445"); px(c, o + 12, 1, 3, 3, "#c98a55"); px(c, o + 14, 0, 2, 2, "#e8c48a"); px(c, o + 1, 13, 2, 2, "#c98a55"); break;
    case "sword": for (let i = 0; i < 8; i++) px(c, o + 6 + i, 9 - i, 2, 2, "#d8c890"); px(c, o + 7, 6, 1, 1, "#f4ecc8"); px(c, o + 3, 9, 5, 2, "#8a5a2c"); px(c, o + 5, 7, 2, 6, "#8a5a2c"); px(c, o + 2, 12, 3, 3, "#5e4026"); px(c, o + 1, 14, 2, 2, "#c98a55"); break;
    case "Workbench": px(c, o + 1, 5, 14, 3, "#9c7445"); px(c, o + 1, 5, 14, 1, "#b88d58"); px(c, o + 2, 8, 2, 6, "#5e4026"); px(c, o + 12, 8, 2, 6, "#5e4026"); px(c, o + 4, 3, 4, 2, "#8a8780"); break;
    case "Kiln": px(c, o + 3, 6, 10, 9, "#b0703f"); px(c, o + 5, 3, 6, 3, "#b0703f"); px(c, o + 7, 1, 2, 2, "#6b5a4e"); px(c, o + 6, 10, 4, 4, "#2a1d14"); px(c, o + 7, 12, 2, 2, "#f2c14e"); px(c, o + 2, 14, 12, 1, "#8a8780"); break;
    case "Loom": px(c, o + 2, 1, 2, 14, "#6b4a2b"); px(c, o + 12, 1, 2, 14, "#6b4a2b"); px(c, o + 2, 1, 12, 2, "#8a5f35"); for (let x = 5; x <= 11; x += 2) px(c, o + x, 3, 1, 9, "#e9e1cf"); px(c, o + 4, 3, 8, 4, "#c4703f"); for (let x = 4; x <= 11; x += 2) px(c, o + x, 12, 2, 2, "#a8653a"); break;
    case "Chest": px(c, o + 1, 5, 14, 9, "#7a5a33"); px(c, o + 1, 4, 14, 3, "#9c7445"); px(c, o + 1, 7, 14, 1, "#5e4026"); px(c, o + 7, 6, 2, 3, "#c98a55"); break;
    case "Fence": for (const x of [2, 7, 12]) px(c, o + x, 3, 2, 11, "#6b4a2b"); px(c, o + 1, 6, 14, 2, "#9c7445"); px(c, o + 1, 10, 14, 2, "#9c7445"); break;
    case "Snare": px(c, o + 3, 3, 1, 11, "#6b4a2b"); px(c, o + 3, 3, 8, 1, "#7a5a33"); px(c, o + 7, 6, 6, 6, "#c9b48f"); c.clearRect(o + 8, 7, 4, 4); break;
    case "Amphora": px(c, o + 6, 1, 4, 3, "#a8653a"); px(c, o + 4, 3, 2, 4, "#a8653a"); px(c, o + 10, 3, 2, 4, "#a8653a"); px(c, o + 5, 4, 6, 8, "#c4703f"); px(c, o + 6, 12, 4, 2, "#a8653a"); px(c, o + 7, 14, 2, 1, "#8a4a2a"); px(c, o + 5, 7, 6, 1, "#2a1d14"); break;
    case "WineAmphora": px(c, o + 6, 0, 4, 2, "#2a1d14"); px(c, o + 6, 2, 4, 2, "#a8653a"); px(c, o + 4, 3, 2, 4, "#a8653a"); px(c, o + 10, 3, 2, 4, "#a8653a"); px(c, o + 5, 4, 6, 8, "#c4703f"); px(c, o + 6, 12, 4, 2, "#a8653a"); px(c, o + 5, 7, 6, 2, "#6b2a3a"); px(c, o + 7, 8, 2, 1, "#e8c86a"); break;
    case "Lamp": px(c, o + 2, 9, 12, 4, "#c4703f"); px(c, o + 3, 8, 8, 1, "#a8653a"); px(c, o + 12, 8, 3, 2, "#a8653a"); px(c, o + 6, 9, 3, 1, "#2a1d14"); px(c, o + 13, 5, 2, 3, "#f2c14e"); px(c, o + 13, 4, 1, 1, "#fff3c0"); break;
    case "Cloth": px(c, o + 2, 4, 12, 9, "#e9e1cf"); px(c, o + 2, 4, 12, 2, "#f7f0e0"); px(c, o + 2, 9, 12, 1, "#d8c8a4"); px(c, o + 12, 6, 2, 7, "#cfc2a2"); break;
    case "Cloak": px(c, o + 4, 2, 8, 3, "#7a3b2e"); px(c, o + 3, 5, 10, 9, "#8f4a36"); px(c, o + 2, 9, 2, 5, "#7a3b2e"); px(c, o + 12, 9, 2, 5, "#7a3b2e"); px(c, o + 7, 3, 2, 2, "#d9b25e"); break;
    case "Garland": for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; px(c, o + 7 + Math.round(Math.cos(a) * 5), 7 + Math.round(Math.sin(a) * 5), 2, 2, ["#e8c86a", "#c94c4c", "#e9e1cf", "#9a7ad0"][i % 4]); } px(c, o + 7, 2, 2, 1, "#5e9f5a"); break;
    case "LionPelt": px(c, o + 2, 4, 12, 9, "#c8964a"); px(c, o + 1, 5, 2, 3, "#c8964a"); px(c, o + 13, 5, 2, 3, "#c8964a"); px(c, o + 1, 11, 3, 3, "#c8964a"); px(c, o + 12, 11, 3, 3, "#c8964a"); px(c, o + 5, 1, 6, 5, "#7a4a22"); px(c, o + 6, 3, 4, 3, "#c8964a"); px(c, o + 7, 4, 1, 1, "#1a1008"); px(c, o + 9, 4, 1, 1, "#1a1008"); break;
    case "Antler": px(c, o + 4, 13, 2, 2, "#c9b48f"); for (let i = 0; i < 10; i++) px(c, o + 5 + Math.floor(i / 3), 12 - i, 1, 1, "#d8c8a0"); px(c, o + 8, 6, 4, 1, "#d8c8a0"); px(c, o + 11, 4, 1, 2, "#d8c8a0"); px(c, o + 6, 8, 1, 1, "#d8c8a0"); px(c, o + 3, 7, 3, 1, "#d8c8a0"); break;
    case "Tusk": for (let i = 0; i < 9; i++) px(c, o + 3 + i, 12 - Math.round(Math.sin((i / 8) * Math.PI) * 7), 2, 2, "#f2ece0"); px(c, o + 3, 12, 2, 2, "#c9b48f"); break;
    case "Feather": for (let i = 0; i < 10; i++) { px(c, o + 4 + i, 13 - i, 1, 1, "#6b5a45"); px(c, o + 3 + i, 11 - i, 2, 2, i < 8 ? "#8a7a62" : "#a99878"); } break;
    case "hoe": for (let i = 0; i < 11; i++) px(c, o + 3 + i, 13 - i, 2, 2, wood); px(c, o + 10, 1, 5, 3, bronze); px(c, o + 12, 4, 3, 2, bronzeD); break;
    case "jar":
      px(c, o + 5, 1, 6, 2, "#9c5532"); px(c, o + 6, 3, 4, 2, "#b5643b"); px(c, o + 3, 5, 10, 9, "#c4703f"); px(c, o + 4, 14, 8, 1, "#9c5532");
      px(c, o + 3, 8, 10, 1, "#2a1d14"); px(c, o + 1, 6, 2, 4, "#9c5532"); px(c, o + 13, 6, 2, 4, "#9c5532"); break;
    case "sickle":
      px(c, o + 3, 10, 2, 5, wood); px(c, o + 4, 9, 2, 2, wood);
      px(c, o + 5, 3, 2, 7, bronze); px(c, o + 6, 2, 5, 2, bronze); px(c, o + 10, 3, 3, 2, bronze); px(c, o + 12, 5, 2, 3, bronzeD); break;
    case "axe": for (let i = 0; i < 11; i++) px(c, o + 3 + i, 14 - i, 2, 2, wood); px(c, o + 8, 1, 6, 7, bronze); px(c, o + 7, 2, 2, 5, bronzeD); break;
    case "mattock": for (let i = 0; i < 11; i++) px(c, o + 3 + i, 14 - i, 2, 2, wood); px(c, o + 5, 2, 10, 3, "#8d877b"); px(c, o + 4, 4, 2, 4, "#6c675e"); px(c, o + 14, 4, 2, 2, "#6c675e"); break;
    case "Wood": px(c, o + 1, 6, 14, 5, "#8a5f35"); px(c, o + 2, 7, 12, 1, "#a87443"); px(c, o + 13, 6, 3, 5, "#c9a06a"); px(c, o + 3, 10, 12, 4, "#7a5230"); px(c, o + 14, 10, 2, 4, "#c9a06a"); break;
    case "Stone": px(c, o + 3, 5, 10, 8, "#9c968a"); px(c, o + 4, 4, 7, 2, "#b5afa2"); px(c, o + 3, 12, 10, 2, "#7f7a70"); break;
    case "Fiber": for (let i = 0; i < 5; i++) px(c, o + 3 + i * 2, 2 + (i % 2), 1, 12, "#9aa04a"); px(c, o + 3, 8, 10, 2, "#c4a35a"); break;
    case "Flowers": px(c, o + 7, 6, 1, 9, "#5e7f34"); px(c, o + 5, 3, 2, 2, "#e85f7a"); px(c, o + 9, 4, 2, 2, "#f2c14e"); px(c, o + 6, 7, 2, 2, "#e8e2f0"); break;
    case "Grapes": for (const [x, y] of [[4, 4], [8, 4], [6, 7], [10, 7], [8, 10], [6, 11]]) { px(c, o + x, y, 3, 3, "#5a2d5e"); px(c, o + x, y, 1, 1, "#8a5a8e"); } px(c, o + 8, 1, 1, 3, "#6b4a2b"); px(c, o + 9, 2, 3, 2, "#5e7f34"); break;
    case "Milk": px(c, o + 3, 6, 10, 7, "#b5643b"); px(c, o + 2, 5, 12, 2, "#c4703f"); px(c, o + 3, 5, 10, 2, "#f4efe4"); px(c, o + 4, 13, 8, 1, "#9c5532"); break;
    case "Honey": px(c, o + 4, 4, 8, 10, "#c4703f"); px(c, o + 5, 2, 6, 2, "#9c5532"); px(c, o + 5, 6, 6, 6, "#e0a530"); px(c, o + 6, 7, 2, 2, "#f6cf5a"); break;
    case "Wax": px(c, o + 2, 5, 12, 8, "#e6c74a"); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) px(c, o + 3 + i * 4 + (j % 2) * 2, 6 + j * 3, 2, 2, "#c9a530"); break;
  }
}

function drawPerson(c: Ctx, o: number, look: { tunic: string; hair: string; skin: string; beard?: boolean; veil?: string }) {
  px(c, o + 5, 13, 6, 2, "rgba(0,0,0,0.25)");
  px(c, o + 5, 6, 6, 7, look.tunic); px(c, o + 5, 9, 6, 1, "#3a2c22");
  px(c, o + 6, 1, 4, 5, look.skin); px(c, o + 6, 1, 4, 2, look.hair);
  px(c, o + 7, 3, 1, 1, "#2a1d14"); px(c, o + 8, 3, 1, 1, "#2a1d14");
  if (look.beard) px(c, o + 6, 5, 4, 2, look.hair);
  if (look.veil) { px(c, o + 5, 0, 6, 2, look.veil); px(c, o + 5, 2, 1, 6, look.veil); px(c, o + 10, 2, 1, 6, look.veil); }
  px(c, o + 6, 13, 1, 2, "#6b4a2b"); px(c, o + 9, 13, 1, 2, "#6b4a2b");
}

function drawStranger(c: Ctx, o: number, look: string) {
  const base = { tunic: "#8a7a62", hair: "#5a4632", skin: "#c98e62" };
  switch (look) {
    case "beggar":
      drawPerson(c, o, { tunic: "#7a7468", hair: "#c8c8c0", skin: "#b88a62" });
      px(c, o + 4, 4, 8, 9, "#6a645a"); px(c, o + 5, 0, 6, 3, "#6a645a"); px(c, o + 12, 3, 1, 12, "#6b4a2b"); break;
    case "traveler":
      drawPerson(c, o, base); px(c, o + 3, 0, 10, 2, "#8a6a3a"); px(c, o + 6, -1, 4, 2, "#7a5a2a"); px(c, o + 4, 5, 8, 6, "#9a7a4a"); break;
    case "shepherd":
      drawPerson(c, o, { tunic: "#c9b48f", hair: "#3a2c22", skin: "#c98e62" }); px(c, o + 12, 2, 1, 13, "#6b4a2b"); px(c, o + 12, 1, 3, 1, "#6b4a2b"); px(c, o + 14, 2, 1, 2, "#6b4a2b"); break;
    case "tiresias": // old, white-bearded, eyes closed, a cornel-wood staff
      drawPerson(c, o, { tunic: "#d8d0bc", hair: "#ecebe4", skin: "#c99a72", beard: true });
      px(c, o + 6, 5, 4, 3, "#ecebe4"); px(c, o + 7, 3, 2, 1, "#a8785a"); px(c, o + 4, 6, 1, 7, "#bfb6a0");
      px(c, o + 12, 1, 1, 14, "#7a4a2a"); px(c, o + 11, 1, 2, 1, "#9a6a3a"); break;
    case "potter":
      drawPerson(c, o, { tunic: "#a07a62", hair: "#2a1d14", skin: "#a8744a", beard: true }); px(c, o + 1, 4, 4, 7, "#c4703f"); px(c, o + 2, 3, 2, 1, "#9c5532"); break;
    case "bard":
      drawPerson(c, o, { tunic: "#e8e2d0", hair: "#c98e2a", skin: "#d8a878" }); px(c, o + 10, 7, 4, 4, "#8a6a3a"); px(c, o + 10, 4, 1, 4, "#c9b48f"); px(c, o + 13, 4, 1, 4, "#c9b48f"); px(c, o + 10, 4, 4, 1, "#c9b48f"); break;
  }
}

/** The player's sprite, in the colors chosen at creation. Redrawn whenever a life begins or is loaded. */
/** Poses in each facing's run of frames: frame = facing * POSES + pose. */
export const POSES = 7;
export const POSE = { stand: 0, walk1: 1, walk2: 2, raise: 3, strike: 4, lookA: 5, lookB: 6 } as const;

/**
 * The player in 4 facings (down, left, right, up) x 7 poses: standing, two walking steps,
 * raising and striking with a tool, and a hand over the brow looking one way, then the other.
 */
export function makePlayerTexture(scene: Phaser.Scene, look: { tunic: string; hair: string; skin: string }, worn?: Worn, crown?: string[]) { makeFigureTexture(scene, "player", look, { ...(worn ? { gear: worn } : {}), ...(crown?.length ? { crown } : {}) }); }

export interface FigureExtras { beard?: boolean; long?: boolean; veil?: string;
  /** A traveler's broad-brimmed hat (petasos), in this color. */ hat?: string;
  /** Something carried upright: a walking staff, a spear, a club, or a bow. */ pole?: "staff" | "spear" | "club" | "bow";
  /** A bundle on the back, in this color. */ pack?: string;
  /** What they wear (gear.ts): drawn over the figure. */ gear?: Worn;
  /** A crown of leaves (Wreaths and Crowns): its colors, leaf first, then any flowers. */ crown?: string[] }
/** Any walking person: the player, villagers, the folk of the wild huts. Same 28 frames as the player. */
export function makeFigureTexture(scene: Phaser.Scene, key: string, look: { tunic: string; hair: string; skin: string }, ex: FigureExtras = {}) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const belt = look.tunic === "#b0412f" ? "#e9e1cf" : "#b0412f";
  const eye = "#2a1d14", tool = "#7a5a33", toolHead = "#9c968a";
  const gw = (slot: keyof Worn) => { const id = ex.gear?.[slot]; return id ? WEAR[id] : undefined; };
  const gBody = gw("body"), gArmor = gw("armor"), gCloak = gw("cloak"), gShield = gw("shield"), gHead = gw("head"), gLegs = gw("legs"), gFeet = gw("feet");
  // Legs: bare, or in greaves, boots, sandals.
  const leg = gLegs ? gLegs.look.col! : gFeet?.look.kind === "boots" ? gFeet.look.col! : "#6b4a2b";
  const foot = gFeet?.look.kind === "boots" ? gFeet.look.col! : gFeet?.look.kind === "sandals" ? "#4a3220" : leg;
  if (gHead?.look.kind === "petasos" && !ex.hat) ex = { ...ex, hat: gHead.look.col };
  const player = canvasTex(scene, key, 16 * 4 * POSES, 16, (c) => {
    for (let f = 0; f < 4; f++) for (let pose = 0; pose < POSES; pose++) {
      const o = (f * POSES + pose) * 16;
      // Left is drawn as right, mirrored.
      const mir = f === 1, side = f === 1 || f === 2;
      const p = (x: number, y: number, w: number, h: number, col: string) => px(c, o + (mir ? 16 - x - w : x), y, w, h, col);
      const walk = pose === 1 ? 1 : pose === 2 ? -1 : 0;
      p(5, 13, 6, 2, "rgba(0,0,0,0.25)");
      // Legs.
      const L2 = (x: number, h: number) => { p(x, 13, 1, h, leg); if (h === 2) p(x, 14, 1, 1, foot); };
      if (!side) { L2(6, walk === -1 ? 1 : 2); L2(9, walk === 1 ? 1 : 2); }
      else if (walk === 1) { L2(9, 2); L2(6, 2); }
      else if (walk === -1) { L2(7, 2); L2(8, 1); }
      else { L2(7, 2); L2(8, 2); }
      // A cloak hangs behind (seen from the back, it covers you).
      if (gCloak && f === 3) { const ck = gCloak.look; p(4, 5, 8, 9, ck.col!); p(5, 12, 6, 1, "rgba(0,0,0,0.18)"); if (ck.kind === "lion") { p(4, 13, 2, 1, ck.col!); p(10, 13, 2, 1, ck.col!); } }
      else if (gCloak && side) p(3, 6, 2, 7, gCloak.look.col!);
      // Body: the garment, then armor over it.
      const bk = gBody?.look.kind ?? "chiton", bcol = bk === "chiton" ? look.tunic : gBody!.look.col!;
      if (bk === "peplos" || bk === "robes") { p(5, 6, 6, 8, bcol); p(5, 8, 6, 1, "rgba(255,255,255,0.18)"); if (bk === "robes") p(5, 13, 6, 1, gBody!.look.col2!); }
      else if (bk === "exomis") { p(5, 6, 6, 6, bcol); if (!side && f !== 3) p(9, 6, 2, 1, look.skin); else if (side) p(7, 6, 2, 1, look.skin); }
      else p(5, 6, 6, 7, bcol);
      if (gArmor) {
        const ak = gArmor.look.kind, a1 = gArmor.look.col!, a2 = gArmor.look.col2!;
        p(5, 6, 6, 4, a1);
        if (ak === "scale") for (let yy = 6; yy < 10; yy++) for (let xx = 5 + (yy % 2); xx < 11; xx += 2) p(xx, yy, 1, 1, a2);
        if (ak === "bronze") { p(f === 3 ? 5 : 6, 7, 1, 2, "#f0d890"); if (f === 0) { p(7, 7, 1, 1, a2); p(8, 7, 1, 1, a2); p(7, 8, 2, 1, a2); } }
        if (ak === "armor" && a2 === "#b0412f") { p(5, 6, 6, 1, a2); for (let xx = 5; xx < 11; xx += 2) p(xx, 10, 1, 2, a1); } // a linothorax: shoulder-pieces, and its skirt of strips
        if (ak === "armor" && a2 !== "#b0412f" && !side) p(f === 3 ? 6 : 9, 6, 1, 3, a2); // the jerkin's lacing
      }
      p(5, 9, 6, 1, gArmor?.look.kind === "bronze" ? gArmor.look.col2! : belt);
      p(6, 1, 4, 5, look.skin); p(6, 1, 4, 2, look.hair);
      if (f === 3) p(6, 1, 4, 4, look.hair);
      if (ex.long) { if (f === 3) p(5, 1, 6, 6, look.hair); else if (side) p(5, 1, 1, 6, look.hair); else { p(5, 2, 1, 5, look.hair); p(10, 2, 1, 5, look.hair); } }
      if (ex.beard && f !== 3) { if (side) p(8, 5, 2, 1, look.hair); else p(6, 5, 4, 1, look.hair); }
      if (ex.veil) { if (f === 3) p(5, 0, 6, 7, ex.veil); else if (side) { p(5, 0, 5, 2, ex.veil); p(5, 2, 1, 6, ex.veil); } else { p(5, 0, 6, 2, ex.veil); p(5, 2, 1, 6, ex.veil); p(10, 2, 1, 6, ex.veil); } }
      // Eyes, which wander when looking around.
      if (f === 0) {
        const ex = pose === 5 ? 8 : pose === 6 ? 6 : 7;
        p(ex, 3, 1, 1, eye); p(ex + 1, 3, 1, 1, eye);
      } else if (side) p(pose === 6 ? 8 : 9, 3, 1, 1, eye);
      // Headgear.
      if (gHead && gHead.look.kind !== "petasos") {
        const hk = gHead.look.kind, h1 = gHead.look.col!, h2 = gHead.look.col2 ?? h1;
        if (hk === "cap") { if (f === 3) p(6, 1, 4, 4, h1); else p(6, 1, 4, 2, h1); p(6, 2, 4, 1, "rgba(0,0,0,0.2)"); }
        else if (hk === "tusk") { if (f === 3) p(6, 0, 4, 5, h1); else p(6, 0, 4, 3, h1); p(6, 1, 4, 1, h2); p(6, 3, 4, 1, h2); p(7, 0, 2, 1, h2); }
        else if (hk === "corinth") {
          p(6, 1, 4, 5, h1); p(5, 0, 6, 1, h2); p(7, 0, 2, 1, h2); // bronze bowl and a horsehair crest
          if (f === 0) { p(6, 3, 1, 1, eye); p(9, 3, 1, 1, eye); p(7, 4, 2, 2, look.skin); p(7, 3, 2, 1, "#a8803a"); }
          else if (side) { p(9, 3, 1, 1, eye); p(9, 4, 1, 2, look.skin); }
          p(f === 3 ? 6 : 6, 2, 1, 2, "#f0d890");
        }
      }
      // A crown of leaves around the brow (not over a helmet), dotted with its flowers.
      if (ex.crown && !(gHead && gHead.look.kind !== "petasos")) {
        const [lf, ...fl] = ex.crown;
        if (side) { p(5, 1, 5, 1, lf); p(5, 0, 1, 1, lf); p(9, 0, 1, 1, lf); } else { p(5, 1, 6, 1, lf); p(5, 0, 1, 1, lf); p(10, 0, 1, 1, lf); p(7, 0, 2, 1, lf); }
        fl.forEach((col, i) => p(side ? 6 + i * 2 : 6 + i * 3, 1, 1, 1, col));
      }
      // The pack on the back (drawn first on the back view, so it sits on the tunic).
      if (ex.pack) { if (f === 3) { p(5, 6, 6, 5, ex.pack); p(6, 7, 4, 1, "rgba(0,0,0,0.18)"); } else if (side) p(3, 6, 2, 5, ex.pack); else { p(6, 6, 1, 3, "#6b4a2b"); p(9, 6, 1, 3, "#6b4a2b"); } }
      // The petasos: a wide brim over the brow and a low crown.
      if (ex.hat) { if (side) { p(4, 1, 9, 1, ex.hat); p(6, 0, 4, 1, ex.hat); } else { p(3, 1, 10, 1, ex.hat); p(6, 0, 4, 1, ex.hat); } }
      // Arms, by pose.
      const sk = look.skin;
      if (!side) {
        const L = () => p(4, walk === 1 ? 8 : 7, 1, walk === 1 ? 3 : 4, sk);
        if (pose <= 2) { L(); p(11, walk === -1 ? 8 : 7, 1, walk === -1 ? 3 : 4, sk); }
        else if (pose === 3) { L(); p(11, 1, 1, 6, sk); p(11, 0, 2, 1, toolHead); p(12, 1, 1, 2, tool); }
        else if (pose === 4) { L(); p(10, 9, 1, 3, sk); p(10, 12, 2, 1, tool); p(11, 13, 2, 2, toolHead); }
        else if (f === 0) { L(); p(11, 4, 1, 4, sk); p(8, 2, 3, 1, sk); }
        else if (pose === 5) { p(4, 7, 1, 4, sk); p(11, 3, 1, 5, sk); p(10, 2, 1, 1, sk); }
        else { p(11, 7, 1, 4, sk); p(4, 3, 1, 5, sk); p(5, 2, 1, 1, sk); }
      } else {
        if (pose === 0) p(8, 7, 1, 4, sk);
        else if (pose === 1) { p(9, 7, 1, 1, sk); p(10, 8, 1, 2, sk); }
        else if (pose === 2) { p(7, 7, 1, 1, sk); p(6, 8, 1, 2, sk); }
        else if (pose === 3) { p(6, 2, 1, 5, sk); p(5, 0, 2, 2, toolHead); p(6, 2, 1, 1, tool); }
        else if (pose === 4) { p(9, 8, 4, 1, sk); p(13, 7, 1, 3, tool); p(14, 9, 2, 2, toolHead); }
        else { p(9, 5, 1, 3, sk); p(9, 2, 3, 1, sk); p(10, 3, 1, 1, sk); }
      }
      // A cloak's edges in front, pinned at the shoulder; a lion's head worn as a hood.
      if (gCloak && f !== 3) {
        const ck = gCloak.look;
        if (ck.kind === "lion") { p(5, 0, 6, 2, ck.col2!); p(5, 0, 1, 1, ck.col!); p(10, 0, 1, 1, ck.col!); p(6, 1, 4, 1, ck.col!); p(7, 1, 2, 1, "#a87a3a"); if (f === 0) { p(5, 1, 1, 5, ck.col2!); p(10, 1, 1, 5, ck.col2!); p(6, 8, 1, 2, ck.col!); p(9, 8, 1, 2, ck.col!); } else p(5, 1, 2, 6, ck.col2!); }
        else if (ck.kind === "himation") { if (f === 0) { p(5, 6, 2, 1, ck.col!); p(6, 7, 2, 1, ck.col!); p(7, 8, 2, 2, ck.col!); p(8, 10, 3, 2, ck.col!); } else p(5, 7, 4, 4, ck.col!); }
        else if (f === 0) { p(5, 6, 1, 7, ck.col!); p(10, 6, 1, 7, ck.col!); p(6, 6, 1, 1, "#d9b25e"); }
      }
      // A shield on the left arm: round (aspis) or crescent (pelte).
      if (gShield && !(pose === 3 || pose === 4)) {
        const sk2 = gShield.look, big = sk2.kind === "aspis", s1 = sk2.col!, s2 = sk2.col2!;
        const disc = (x: number, y: number) => {
          if (big) { p(x + 1, y, 4, 7, s1); p(x, y + 1, 6, 5, s1); p(x + 2, y + 2, 2, 3, s2); p(x + 1, y, 4, 1, "#f0d890"); }
          else { p(x, y + 1, 5, 4, s1); p(x + 1, y + 5, 3, 1, s1); p(x + 1, y, 1, 1, s1); p(x + 3, y, 1, 1, s1); p(x + 2, y + 1, 1, 1, s2); p(x + 1, y + 2, 3, 1, s2); }
        };
        if (f === 0) disc(big ? 10 : 10, 6); else if (f === 3) disc(big ? 0 : 1, 6); else disc(big ? 2 : 3, 6);
      }
      // What they carry, held upright while they walk or stand (not in the working poses).
      if (ex.pole && (pose <= 2 || pose >= 5)) {
        const wood = "#8a6a42", bronze = "#c8c0a8", bx = side ? 10 : f === 3 ? 4 : 12;
        if (ex.pole === "bow") { const bw = "#7a4a22"; if (f === 3) { p(7, 4, 1, 1, bw); p(8, 5, 1, 1, bw); p(9, 6, 1, 1, bw); p(10, 7, 1, 1, bw); } else { p(bx, 4, 1, 1, bw); p(bx + 1, 5, 1, 5, bw); p(bx, 10, 1, 1, bw); p(bx, 5, 1, 5, "#d8d0b8"); } }
        else {
          p(bx, ex.pole === "spear" ? 1 : 3, 1, ex.pole === "spear" ? 13 : 11, wood);
          if (ex.pole === "spear") p(bx, 0, 1, 2, bronze);
          if (ex.pole === "club") p(bx - 1, 2, 2, 3, "#6a4a2a");
        }
      }
    }
  });
  for (let i = 0; i < 4 * POSES; i++) player.add(i, 0, i * 16, 0, 16, 16);
}

/**
 * Tiresias: walking (the 28 frames every person has), and sitting with his staff across his knees, nodding (2 frames).
 */
export function makeTiresiasTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("tiresiasSit")) return;
  makeFigureTexture(scene, "tiresias", { tunic: "#d8d0bc", hair: "#ecebe4", skin: "#c99a72" }, { beard: true });
  const sit = canvasTex(scene, "tiresiasSit", 32, 16, (c) => {
    for (let f = 0; f < 2; f++) {
      const o = f * 16, n = f; // n: the head dips on the second frame
      px(c, o + 3, 13, 11, 2, "rgba(0,0,0,0.25)");
      px(c, o + 4, 11, 8, 3, "#8a7a62"); px(c, o + 4, 11, 8, 1, "#a8987a"); // the stone he sits on
      px(c, o + 5, 6 + n, 6, 6 - n, "#d8d0bc"); px(c, o + 4, 7 + n, 1, 4, "#bfb6a0"); // robe and mantle
      px(c, o + 5, 11, 7, 2, "#c8c0aa"); px(c, o + 6, 13, 1, 1, "#6b4a2b"); px(c, o + 10, 13, 1, 1, "#6b4a2b"); // knees and feet
      px(c, o + 6, 1 + n, 4, 5, "#c99a72"); px(c, o + 6, 1 + n, 4, 2, "#ecebe4"); px(c, o + 6, 5 + n, 4, 3, "#ecebe4"); // head, beard
      px(c, o + 7, 3 + n, 2, 1, "#a8785a"); // closed eyes
      px(c, o + 12, 2, 1, 12, "#7a4a2a"); px(c, o + 11, 2, 2, 1, "#9a6a3a"); px(c, o + 11, 9, 1, 1, "#c99a72"); // the staff, and his hand on it
    }
  });
  sit.add(0, 0, 0, 0, 16, 16); sit.add(1, 0, 16, 0, 16, 16);
}

/** Little lives and weather: butterflies, swallows, leaves, smoke, mist and cloud shadows. */
export function makeAmbientTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("butterfly")) return;
  const bf = canvasTex(scene, "butterfly", 10, 5, (c) => {
    px(c, 0, 0, 2, 2, "#ffffff"); px(c, 3, 0, 2, 2, "#ffffff"); px(c, 2, 1, 1, 3, "#3a2e24"); px(c, 0, 2, 2, 1, "#e8e8e8"); px(c, 3, 2, 2, 1, "#e8e8e8"); // wings open
    px(c, 6, 0, 1, 3, "#ffffff"); px(c, 8, 0, 1, 3, "#ffffff"); px(c, 7, 1, 1, 3, "#3a2e24"); // wings closed
  });
  bf.add(0, 0, 0, 0, 5, 5); bf.add(1, 0, 5, 0, 5, 5);
  const sw = canvasTex(scene, "swallow", 18, 6, (c) => {
    px(c, 0, 1, 3, 1, "#1f2430"); px(c, 3, 2, 3, 1, "#1f2430"); px(c, 6, 1, 3, 1, "#1f2430"); px(c, 4, 3, 1, 2, "#1f2430"); // wings up
    px(c, 9, 3, 3, 1, "#1f2430"); px(c, 12, 2, 3, 1, "#1f2430"); px(c, 15, 3, 3, 1, "#1f2430"); px(c, 13, 3, 1, 2, "#1f2430"); // wings down
  });
  sw.add(0, 0, 0, 0, 9, 6); sw.add(1, 0, 9, 0, 9, 6);
  canvasTex(scene, "leaf", 3, 2, (c) => { px(c, 0, 0, 2, 1, "#ffffff"); px(c, 1, 1, 2, 1, "#dddddd"); });
  canvasTex(scene, "streak", 14, 1, (c) => { px(c, 0, 0, 14, 1, "rgba(255,255,255,0.5)"); px(c, 4, 0, 6, 1, "rgba(255,255,255,0.8)"); });
  const soft = (key: string, size: number, rgb: string, a0: number) => {
    const t = scene.textures.createCanvas(key, size, size)!, c = t.getContext();
    const g = c.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
    g.addColorStop(0, `rgba(${rgb},${a0})`); g.addColorStop(0.6, `rgba(${rgb},${a0 * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, size, size); t.refresh();
  };
  soft("puff", 16, "200,196,188", 0.9);
  soft("mist", 96, "236,240,244", 0.75);
  soft("cloudShadow", 128, "10,16,30", 1);
}

/** Birds and beasts of signs and omens, and the glint of something half buried. */
export function makeOmenTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("crane")) return;
  const two = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, o: number, f: number) => void) => {
    const t = canvasTex(scene, key, w * 2, h, (c) => { draw(c, 0, 0); draw(c, w, 1); });
    t.add(0, 0, 0, 0, w, h); t.add(1, 0, w, 0, w, h);
  };
  two("crane", 16, 8, (c, o, f) => { px(c, o + 6, 4, 6, 1, "#b8b8b0"); px(c, o + 12, 3, 3, 1, "#b8b8b0"); px(c, o + 14, 3, 1, 1, "#b02020"); px(c, o + 2, 4, 4, 1, "#9a9a92");
    if (f) { px(c, o + 7, 5, 2, 3, "#d8d8d0"); px(c, o + 9, 5, 2, 2, "#3a3a3a"); } else { px(c, o + 7, 0, 2, 4, "#d8d8d0"); px(c, o + 9, 1, 2, 3, "#3a3a3a"); } });
  two("eagle", 16, 8, (c, o, f) => { px(c, o + 6, 3, 5, 2, "#5a3a20"); px(c, o + 11, 3, 2, 1, "#e8e0d0"); px(c, o + 13, 3, 1, 1, "#d8a020"); px(c, o + 3, 3, 3, 2, "#4a2e18");
    if (f) { px(c, o + 5, 5, 6, 3, "#4a2e18"); } else { px(c, o + 1, 1, 6, 2, "#4a2e18"); px(c, o + 8, 0, 6, 2, "#4a2e18"); } });
  two("owl", 10, 8, (c, o, f) => { px(c, o + 3, 2, 4, 5, "#8a7a62"); px(c, o + 4, 3, 1, 1, "#f2d040"); px(c, o + 6, 3, 1, 1, "#f2d040");
    if (f) { px(c, o + 0, 4, 3, 2, "#7a6a52"); px(c, o + 7, 4, 3, 2, "#7a6a52"); } else { px(c, o + 0, 1, 3, 2, "#7a6a52"); px(c, o + 7, 1, 3, 2, "#7a6a52"); } });
  canvasTex(scene, "snail", 8, 6, (c) => { px(c, 3, 0, 4, 4, "#a87a4a"); px(c, 4, 1, 2, 2, "#c8a070"); px(c, 0, 3, 6, 2, "#c8b890"); px(c, 0, 1, 1, 2, "#c8b890"); });
  // A fishing float: riding the water, then dipped under with a ring of ripples.
  const fl = canvasTex(scene, "bobber", 16, 8, (c) => {
    px(c, 2, 1, 3, 2, "#d8402a"); px(c, 2, 3, 3, 2, "#f2ecd8"); px(c, 1, 5, 5, 1, "rgba(220,240,250,0.6)");
    px(c, 9, 4, 6, 1, "rgba(220,240,250,0.8)"); px(c, 8, 5, 1, 1, "rgba(220,240,250,0.8)"); px(c, 15, 5, 1, 1, "rgba(220,240,250,0.8)"); px(c, 9, 6, 6, 1, "rgba(220,240,250,0.8)"); px(c, 11, 4, 2, 1, "#d8402a");
  });
  fl.add(0, 0, 0, 0, 8, 8); fl.add(1, 0, 8, 0, 8, 8);
  canvasTex(scene, "glint", 7, 7, (c) => { px(c, 3, 0, 1, 7, "#fffbe0"); px(c, 0, 3, 7, 1, "#fffbe0"); px(c, 2, 2, 3, 3, "#fff4b0"); });
}

/** A soft round light, for showing what you are looking at. */
export function makeGlowTexture(scene: Phaser.Scene) {
  if (scene.textures.exists("focusGlow")) return;
  const t = scene.textures.createCanvas("focusGlow", 48, 48)!, c = t.getContext();
  const g = c.createRadialGradient(24, 24, 2, 24, 24, 22);
  g.addColorStop(0, "rgba(255,236,170,0.9)"); g.addColorStop(0.45, "rgba(255,220,140,0.45)"); g.addColorStop(1, "rgba(255,210,120,0)");
  c.fillStyle = g; c.fillRect(0, 0, 48, 48); t.refresh();
}

// ------------------------------------------------------------------ the character sheet portrait
/** God colors and emblems (8×8), for the halo of the god who favors you most. */
const GOD_HUE: Record<string, string> = { Zeus: "#d63a2a", Hera: "#4f7fd1", Poseidon: "#3fa9a0", Demeter: "#6fae52", Athena: "#4b4fa8", Apollo: "#e8b84a", Artemis: "#b9c4d8", Ares: "#b02a3a", Aphrodite: "#f2a6c4", Hephaestus: "#e6874a", Hermes: "#c9479a", Dionysus: "#7a3f96", Hades: "#3a2a4a", Hecate: "#5a3a7a" };
function emblem(c: Ctx, x: number, y: number, god: string, col: string) {
  const p = (dx: number, dy: number, w = 1, h = 1) => px(c, x + dx, y + dy, w, h, col);
  switch (god) {
    case "Zeus": p(4, 0, 2); p(3, 1, 2); p(2, 2, 3); p(3, 3, 3); p(4, 4, 2); p(3, 5, 2); p(2, 6); p(1, 7); break; // a thunderbolt
    case "Hera": p(2, 1, 4, 5); px(c, x + 3, y + 2, 2, 3, "#2a5a8a"); px(c, x + 3, y + 3, 1, 1, "#f2d040"); break; // a peacock's eye
    case "Poseidon": p(0, 1, 1, 2); p(3, 0, 1, 3); p(6, 1, 1, 2); p(0, 3, 7); p(3, 3, 1, 5); break; // a trident
    case "Demeter": p(3, 0, 1, 8); p(2, 1); p(4, 1); p(2, 3); p(4, 3); p(1, 2); p(5, 2); p(1, 4); p(5, 4); break; // an ear of grain
    case "Athena": p(1, 1, 6, 6); px(c, x + 2, y + 2, 2, 2, "#f2e6c9"); px(c, x + 5, y + 2, 2, 2, "#f2e6c9"); px(c, x + 2, y + 2, 1, 1, "#1a1410"); px(c, x + 5, y + 2, 1, 1, "#1a1410"); p(3, 5, 2); break; // an owl
    case "Apollo": p(3, 3, 2, 2); for (const [a, b] of [[3, 0], [3, 6], [0, 3], [6, 3], [1, 1], [5, 1], [1, 5], [5, 5]]) p(a, b, 1, 1); break; // the sun
    case "Artemis": p(2, 0, 2); p(1, 1, 2); p(1, 2, 1, 4); p(1, 6, 2); p(2, 7, 2); break; // a crescent moon
    case "Ares": p(1, 1, 6, 6); px(c, x + 2, y + 2, 4, 4, "#1f1712"); p(3, 3, 2, 2); break; // a round shield
    case "Aphrodite": p(1, 1, 2, 2); p(4, 1, 2, 2); p(1, 2, 5, 2); p(2, 4, 3); p(3, 5); break; // a heart (her dove would not fit)
    case "Hephaestus": p(0, 3, 7, 2); p(2, 5, 3, 2); p(1, 7, 5); p(5, 1, 1, 2); break; // an anvil
    case "Hermes": p(3, 0, 1, 8); p(1, 1, 2); p(4, 1, 2); p(2, 3); p(4, 3); p(2, 5); p(4, 5); break; // a caduceus
    case "Dionysus": for (const [a, b] of [[2, 1], [4, 1], [1, 3], [3, 3], [5, 3], [2, 5], [4, 5], [3, 7]]) p(a, b, 2, 2); break; // grapes
    case "Hades": p(2, 0, 1, 3); p(5, 0, 1, 3); p(2, 3, 4); p(3, 3, 2, 5); break; // a bident
    case "Hecate": p(2, 0, 3, 3); px(c, x + 3, y + 1, 1, 1, "#1f1712"); p(3, 3, 1, 5); p(4, 5, 2); p(4, 7, 2); break; // a key
  }
}
/** Things in hand (from the highest Aretai) and on the head (from the second), drawn on a 64×64 portrait. */
function handItem(c: Ctx, ar: string) {
  const p = (x: number, y: number, w: number, h: number, col: string) => px(c, x, y, w, h, col);
  switch (ar) {
    case "Kratos": p(46, 20, 5, 30, "#6b4a2b"); p(44, 16, 9, 9, "#5a3d22"); p(45, 18, 2, 2, "#3a2810"); break; // a club
    case "Thymos": p(47, 4, 2, 52, "#7a5a33"); p(45, 2, 6, 6, "#c4a060"); p(46, 1, 4, 1, "#e0c080"); break; // a spear
    case "Aiolos": p(47, 12, 2, 44, "#c9a35a"); p(44, 12, 8, 2, "#e8dcc0"); p(43, 9, 3, 3, "#e8dcc0"); p(50, 9, 3, 3, "#e8dcc0"); break; // a herald's staff, winged
    case "Pneuma": p(47, 14, 2, 42, "#8a6a3a"); p(44, 8, 8, 9, "#5a7a2a"); p(45, 9, 2, 2, "#7a9a3a"); p(48, 12, 2, 2, "#7a9a3a"); break; // the thyrsus
    case "Ourania": p(42, 28, 12, 10, "#a8844a"); p(42, 14, 2, 15, "#e8dcc0"); p(52, 14, 2, 15, "#e8dcc0"); p(42, 14, 12, 2, "#6b4a2b"); for (const x of [45, 48, 51]) p(x, 16, 1, 13, "#f2ecd8"); break; // a lyre
    case "Logos": p(42, 30, 14, 9, "#e8dcc0"); p(41, 29, 2, 11, "#a8844a"); p(55, 29, 2, 11, "#a8844a"); for (const y of [32, 34, 36]) p(44, y, 10, 1, "#8a7a62"); break; // a scroll
    case "Gnosis": p(47, 16, 1, 34, "#6a8a6a"); p(44, 8, 7, 10, "#3a7a8a"); p(46, 10, 3, 5, "#2a5a8a"); p(47, 12, 1, 1, "#f2d040"); break; // a peacock feather
    case "Metis": p(47, 8, 2, 48, "#7a5a33"); p(42, 4, 2, 7, "#a8a8a0"); p(47, 2, 2, 8, "#a8a8a0"); p(52, 4, 2, 7, "#a8a8a0"); p(42, 10, 12, 2, "#a8a8a0"); break; // a trident
    case "Techne": p(47, 22, 2, 30, "#6b4a2b"); p(42, 18, 12, 6, "#7a7a80"); p(42, 18, 12, 1, "#a8a8b0"); break; // a hammer
    case "Oikos": p(47, 24, 2, 30, "#6b4a2b"); p(40, 14, 3, 3, "#b8b8b0"); p(42, 12, 6, 2, "#b8b8b0"); p(47, 14, 3, 10, "#b8b8b0"); p(38, 16, 3, 6, "#e0c060"); break; // a sickle and grain
    case "Kardia": p(48, 8, 2, 46, "#6b4a2b"); p(46, 6, 2, 4, "#6b4a2b"); p(46, 52, 2, 4, "#6b4a2b"); p(44, 9, 1, 44, "#e8e8e0"); break; // a bow
    case "Phoenix": p(42, 18, 10, 12, "#c9a35a"); p(44, 20, 6, 8, "#e8f0f0"); p(46, 30, 2, 18, "#c9a35a"); break; // a bronze mirror
  }
}
function headItem(c: Ctx, ar: string, hair: string) {
  const p = (x: number, y: number, w: number, h: number, col: string) => px(c, x, y, w, h, col);
  switch (ar) {
    case "Kratos": p(20, 8, 24, 10, "#c8a050"); p(18, 14, 4, 22, "#b89040"); p(42, 14, 4, 22, "#b89040"); p(24, 6, 4, 4, "#c8a050"); p(36, 6, 4, 4, "#c8a050"); break; // a lion-skin hood
    case "Thymos": p(21, 8, 22, 12, "#b8883a"); p(21, 18, 4, 10, "#b8883a"); p(39, 18, 4, 10, "#b8883a"); p(28, 1, 8, 9, "#b02a3a"); p(30, 0, 4, 2, "#d04050"); break; // a crested helmet
    case "Aiolos": p(14, 12, 36, 4, "#8a6a3a"); p(22, 6, 20, 7, "#9a7a4a"); p(20, 9, 2, 3, "#e8dcc0"); p(42, 9, 2, 3, "#e8dcc0"); break; // a petasos, winged
    case "Pneuma": for (let x = 20; x < 44; x += 4) { p(x, 11, 4, 3, "#4a7a2a"); p(x + 1, 10, 2, 1, "#6a9a3a"); } p(22, 13, 3, 3, "#5a2a6a"); p(38, 13, 3, 3, "#5a2a6a"); break; // ivy and grapes
    case "Ourania": for (let x = 20; x < 44; x += 3) p(x, 11 + (x % 2), 3, 2, "#5a8a3a"); break; // a laurel wreath
    case "Logos": for (let x = 20; x < 44; x += 3) p(x, 11, 3, 2, "#7a8a5a"); p(31, 9, 2, 2, "#7a8a5a"); break; // an olive wreath
    case "Gnosis": p(22, 9, 20, 3, "#c9a35a"); p(30, 6, 4, 4, "#c9a35a"); p(31, 7, 2, 2, "#4f7fd1"); break; // a diadem
    case "Metis": p(21, 9, 22, 6, "#3a6a7a"); p(23, 7, 18, 3, "#3a6a7a"); break; // a fisher's cap
    case "Techne": p(22, 4, 20, 10, "#8a6a4a"); p(24, 2, 16, 3, "#8a6a4a"); break; // a craftsman's pilos
    case "Oikos": p(14, 12, 36, 3, "#d8c070"); p(22, 6, 20, 7, "#e0c880"); break; // a straw hat
    case "Kardia": p(20, 11, 24, 3, "#8a5a3a"); p(42, 8, 3, 5, "#e8e8e0"); break; // a headband and a feather
    case "Phoenix": for (let x = 20; x < 44; x += 4) { p(x, 10, 3, 3, ["#f2a6c4", "#f2e6c9", "#e85f7a"][(x / 4) % 3]); } break; // a flower crown
  }
  void hair;
}
/**
 * A portrait for the character sheet: your own colors; in hand, the mark of your highest Aretai; on your head, your second's;
 * behind you, the halo of the god who favors you most (brighter with higher favor); and a shadow if a god is angry with you.
 */
export function makePortrait(scene: Phaser.Scene, key: string, look: { tunic: string; hair: string; skin: string }, first: string, second: string, god: string | null, tier: number, wrath: string | null) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  canvasTex(scene, key, 64, 64, (c) => {
    // The ground behind: a god's color, or plain earth.
    px(c, 0, 0, 64, 64, "#2a2018");
    if (god) {
      const col = GOD_HUE[god] ?? "#c9a35a", rings = Math.min(5, 1 + Math.floor(tier));
      for (let r = 30; r > 0; r -= 2) { c.globalAlpha = Math.min(0.75, (0.05 + (rings * 0.04)) * (1 - r / 34) * 2.2); c.fillStyle = col; c.beginPath(); c.arc(32, 22, r, 0, Math.PI * 2); c.fill(); }
      c.globalAlpha = 1;
      if (tier >= 2) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; px(c, 32 + Math.round(Math.cos(a) * (24 + tier)), 22 + Math.round(Math.sin(a) * (24 + tier)), 1, 1, col); }
      emblem(c, 3, 3, god, col);
    }
    if (wrath) { c.globalAlpha = 0.55; for (let i = 0; i < 64; i += 2) { px(c, 0, i, 4 + ((i * 7) % 5), 2, "#0a0610"); px(c, 60 - ((i * 5) % 5), i, 6, 2, "#0a0610"); } c.globalAlpha = 1; emblem(c, 53, 53, wrath, "#7a5a8a"); }
    // The figure: shoulders and tunic, neck, head, hair, face.
    const { tunic, hair, skin } = look;
    px(c, 14, 40, 36, 24, tunic); px(c, 12, 44, 4, 20, tunic); px(c, 48, 44, 4, 20, tunic);
    px(c, 14, 46, 36, 2, "rgba(0,0,0,0.15)"); px(c, 30, 40, 4, 10, "rgba(0,0,0,0.12)");
    px(c, 28, 34, 8, 7, skin);
    px(c, 22, 12, 20, 24, skin); px(c, 20, 18, 2, 8, skin); px(c, 42, 18, 2, 8, skin);
    px(c, 21, 9, 22, 7, hair); px(c, 20, 12, 3, 12, hair); px(c, 41, 12, 3, 12, hair);
    px(c, 26, 22, 3, 2, "#1a1410"); px(c, 35, 22, 3, 2, "#1a1410"); px(c, 26, 20, 3, 1, hair); px(c, 35, 20, 3, 1, hair);
    px(c, 31, 24, 2, 5, "rgba(0,0,0,0.12)"); px(c, 28, 30, 8, 1, "#8a4a3a");
    px(c, 46, 44, 5, 8, skin); // the hand that holds
    headItem(c, second, hair);
    handItem(c, first);
  });
}

// ------------------------------------------------------------------ the creation backdrop
/**
 * A landscape behind the wheel at creation: the step's place on the wheel sets the scene (Artemis' forest under the moon,
 * Zeus' storm over Olympus...); the choice within it lends the sky its god's color and emblem. Painted small and scaled up.
 */
const WHEEL_GOD = ["Aphrodite", "Artemis", "Demeter", "Hephaestus", "Poseidon", "Hera", "Athena", "Apollo", "Dionysus", "Hermes", "Ares", "Zeus"];
export function paintCreationBg(scene: Phaser.Scene, key: string, theme: number, accent: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const W = 320, H = 214, tg = WHEEL_GOD[theme], ag = WHEEL_GOD[accent];
  canvasTex(scene, key, W, H, (c) => {
    const mix = (a: string, b: string, t: number) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, mix("#0d1220", GOD_HUE[ag], 0.5)); sky.addColorStop(0.55, mix("#1f2a3a", GOD_HUE[tg], 0.45)); sky.addColorStop(1, "#0d0a08");
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    let seed = (theme * 131 + accent * 17 + 7) >>> 0; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const hill = (y0: number, amp: number, col: string, f = 0.03) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 4) c.lineTo(x, y0 + Math.sin(x * f + theme) * amp + Math.sin(x * f * 2.3 + accent) * amp * 0.4); c.lineTo(W, H); c.fill(); };
    const dark = (t: number) => mix("#0d0a08", GOD_HUE[tg], t);
    // The scene.
    switch (tg) {
      case "Aphrodite": hill(150, 6, dark(0.25), 0.05); c.fillStyle = "rgba(255,230,240,0.5)"; for (let x = 0; x < W; x += 9) c.fillRect(x, 148 + Math.sin(x) * 2, 5, 1); for (let i = 0; i < 18; i++) px(c, r() * W, r() * 140, 2, 1, "#f2a6c4"); c.fillStyle = "#e8d8c8"; c.beginPath(); c.arc(250, 165, 14, Math.PI, 0); c.fill(); break; // the foam, petals, a shell
      case "Artemis": hill(130, 10, dark(0.2)); for (let i = 0; i < 26; i++) { const x = r() * W, h = 30 + r() * 40, y = 150 - h; c.fillStyle = dark(0.12); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 9, y + h); c.lineTo(x + 9, y + h); c.fill(); } hill(175, 5, dark(0.08)); break; // pines
      case "Demeter": hill(120, 8, dark(0.3)); hill(150, 6, dark(0.45)); c.fillStyle = mix("#c8a040", GOD_HUE[tg], 0.2); for (let x = 2; x < W; x += 4) c.fillRect(x, 168 + (x % 3), 1, 14); hill(185, 3, dark(0.2)); break; // fields of grain
      case "Hephaestus": c.fillStyle = dark(0.15); c.beginPath(); c.moveTo(60, H); c.lineTo(160, 70); c.lineTo(185, 70); c.lineTo(290, H); c.fill(); c.fillStyle = "#e6874a"; c.fillRect(162, 68, 22, 4); for (let i = 0; i < 20; i++) px(c, 165 + r() * 18, 30 + r() * 38, 1, 1, "#f2c14e"); hill(180, 4, dark(0.05)); break; // the smoking mountain
      case "Poseidon": for (let row = 0; row < 6; row++) hill(130 + row * 14, 4 + row, mix(dark(0.3), "#3fa9a0", row * 0.08), 0.06 + row * 0.01); break; // waves
      case "Hera": for (let i = 0; i < 60; i++) px(c, r() * W, r() * 120, 1, 1, "#e8e8f8"); hill(160, 4, dark(0.2)); for (let x = 90; x <= 230; x += 20) { c.fillStyle = "#cfc6b4"; c.fillRect(x, 120, 6, 42); } c.fillRect(84, 114, 154, 7); break; // stars over a colonnade
      case "Athena": hill(150, 6, dark(0.25)); c.fillStyle = "#cfc6b4"; for (let x = 200; x <= 280; x += 12) c.fillRect(x, 96, 5, 40); c.beginPath(); c.moveTo(194, 96); c.lineTo(240, 78); c.lineTo(290, 96); c.fill(); for (const x of [40, 90, 140]) { c.fillStyle = dark(0.15); c.fillRect(x, 130, 4, 24); c.beginPath(); c.arc(x + 2, 126, 16, 0, Math.PI * 2); c.fillStyle = "#5a6a3a"; c.fill(); } break; // olives and a temple
      case "Apollo": { const g = c.createRadialGradient(160, 60, 4, 160, 60, 70); g.addColorStop(0, "rgba(255,230,150,0.9)"); g.addColorStop(1, "rgba(255,200,100,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(255,220,140,0.35)"; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; c.beginPath(); c.moveTo(160, 60); c.lineTo(160 + Math.cos(a) * 200, 60 + Math.sin(a) * 200); c.stroke(); } hill(160, 8, dark(0.25)); break; } // the sun
      case "Dionysus": hill(160, 6, dark(0.2)); for (let x = 0; x < W; x += 22) { c.strokeStyle = "#4a6a2a"; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 11, 30 + (x % 3) * 8, x + 22, 0); c.stroke(); for (let k = 0; k < 4; k++) px(c, x + 6 + k * 3, 18 + (x % 3) * 6 + (k % 2) * 3, 3, 3, "#6a3a86"); } break; // vines
      case "Hermes": hill(140, 10, dark(0.25)); c.strokeStyle = "#a8987a"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 200); c.bezierCurveTo(100, 150, 200, 190, 320, 140); c.stroke(); c.lineWidth = 1; c.fillStyle = "rgba(240,240,250,0.25)"; for (let i = 0; i < 8; i++) c.fillRect(r() * W, 20 + r() * 80, 30 + r() * 40, 2); c.fillStyle = "#cfc6b4"; c.fillRect(240, 150, 6, 18); c.fillRect(239, 146, 8, 6); break; // a road, wind, a herm
      case "Ares": hill(140, 12, dark(0.25)); for (let x = 20; x < W; x += 9) { c.fillStyle = "#3a2a1a"; c.fillRect(x, 120 + (x % 5), 1, 50); px(c, x - 1, 117 + (x % 5), 3, 4, "#a89060"); } hill(175, 4, dark(0.1)); break; // a line of spears
      case "Zeus": c.fillStyle = "rgba(30,34,48,0.8)"; for (let i = 0; i < 14; i++) { c.beginPath(); c.arc(r() * W, 20 + r() * 40, 20 + r() * 20, 0, Math.PI * 2); c.fill(); } c.fillStyle = dark(0.2); c.beginPath(); c.moveTo(40, H); c.lineTo(170, 80); c.lineTo(300, H); c.fill(); c.strokeStyle = "#fff6c8"; c.lineWidth = 2; c.beginPath(); c.moveTo(120, 30); c.lineTo(110, 60); c.lineTo(125, 60); c.lineTo(108, 100); c.stroke(); c.lineWidth = 1; break; // storm over Olympus
    }
    // The choice's god: an emblem in the sky, large.
    c.globalAlpha = 0.6;
    const s = 3; const tmp = document.createElement("canvas"); tmp.width = 8; tmp.height = 8; const tc = tmp.getContext("2d")!;
    emblem(tc, 0, 0, ag, GOD_HUE[ag]);
    c.drawImage(tmp, 8, 8, 8 * s, 8 * s); // top left, clear of the wheel and the words
    c.globalAlpha = 1;
  });
}

/**
 * Fences that join: 16 pieces by which neighbors are fences too (N 1, E 2, S 4, W 8). A post in the middle;
 * rails run out east and west as two bars, and north and south as a narrow rail seen end-on, with a post where a run ends.
 */
export function makeFenceTextures(scene: Phaser.Scene) {
  if (scene.textures.exists("fences")) return;
  const rail = "#8a5f35", dark = "#5a3d22", post = "#6b4a2b", top = "#a87443";
  const tx = canvasTex(scene, "fences", 16 * 16, 16, (c) => {
    for (let m = 0; m < 16; m++) {
      const o = m * 16, N = m & 1, E = m & 2, S = m & 4, Wd = m & 8;
      px(c, o + 5, 14, 6, 1, "rgba(0,0,0,0.18)"); // shadow at the foot
      if (E) { px(c, o + 8, 5, 8, 2, rail); px(c, o + 8, 10, 8, 2, rail); px(c, o + 8, 7, 8, 1, dark); }
      if (Wd) { px(c, o, 5, 8, 2, rail); px(c, o, 10, 8, 2, rail); px(c, o, 7, 8, 1, dark); }
      if (N) { px(c, o + 7, 0, 2, 6, rail); px(c, o + 9, 0, 1, 6, dark); }
      if (S) { px(c, o + 7, 10, 2, 6, rail); px(c, o + 9, 10, 1, 6, dark); }
      // The post: taller at corners, ends and joins; a slim one in the middle of a straight run.
      const straight = (m === 10 || m === 5);
      if (straight && m === 10) { px(c, o + 7, 3, 2, 11, post); px(c, o + 7, 3, 2, 1, top); }
      else if (straight) { px(c, o + 6, 5, 4, 6, post); px(c, o + 6, 5, 4, 1, top); }
      else { px(c, o + 6, 2, 4, 12, post); px(c, o + 6, 2, 4, 1, top); px(c, o + 9, 3, 1, 11, dark); }
    }
  });
  for (let m = 0; m < 16; m++) tx.add(m, 0, m * 16, 0, 16, 16);
}
