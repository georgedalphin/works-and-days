import Phaser from "phaser";
import { CROPS, seedId, WHEEL } from "./data";
import { DISH_IDS, NAMED } from "./cooking";
import { FORAGE } from "./forage";
import { VILLAGERS } from "./village";

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
};
export const TILE = 16;
const COUNT = 43;

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
  for (const [key, r] of [["dark0", 30], ["dark1", 78], ["dark2", 112]] as [string, number][]) {
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
  canvasTex(scene, "pithos", 12, 16, (c) => {
    px(c, 2, 2, 8, 13, "#b5643b"); px(c, 1, 5, 10, 7, "#c4703f"); px(c, 3, 0, 6, 3, "#9c5532"); px(c, 2, 8, 8, 1, "#2a1d14");
  });
}

export const ITEM_ICON_ORDER = ["Torch", "Copper", "GoldDust", "Must", "Wine", "Cutting", "Ivy", "Syrinx", "WildGrapes", "Plum", "Cornel", "Purslane", "Oats", "Thyme", "Capers", "Clay", "Ochre", "Mushrooms", "SeaFennel", "Saltbush", "MountainTea", "Thistle", "Fennel", "Fibula", "Figurine", "Arrowhead", "OldCoin", "Nest", "Fossil", "Obsidian", "Amber", "OwlFeather", "Thunderstone", "HeliadTear", "LionPelt",
  "Workbench", "Kiln", "Loom", "Chest", "Fence", "Snare", "Amphora", "WineAmphora", "Lamp", "Cloth", "Cloak", "Garland", "Campfire", "Boat", "Press", "Forge", "Olives", "OliveOil", "Parcel", "spear", "sword", "hoe", "jar", "sickle", "axe", "mattock", "bow", "Arrow", "Meat", "Hide", "Antler", "Tusk", "Feather", "Wood", "Stone", "Fiber", "Flowers", "Milk", "Honey", "Wax", "Grapes",
  ...Object.keys(CROPS), ...Object.keys(CROPS).map(seedId), ...DISH_IDS, "Lyre", "Aulos", "rod", "Chub", "Perch", "Trout", "Eel", "Mullet", "Sardine", "Bream", "RedMullet", "Octopus", "Tuna", "Cuttlefish"];

const CROP_COL: Record<string, [string, string]> = {
  Millet: ["#d9b25e", "#b38f48"], Chickpeas: ["#d8c48e", "#9aa04a"], Melon: ["#7aa04a", "#e8c86a"], Mint: ["#5e9f5a", "#3f7a3f"],
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
  }
}
const FORAGE_ICON: Record<string, string> = { WildGrapes: "wildgrape", Plum: "plum", Cornel: "cornel", Purslane: "purslane", Oats: "oats", Thyme: "thyme", Capers: "caper", Clay: "clay", Ochre: "ochre", Mushrooms: "mushrooms", SeaFennel: "seafennel", Saltbush: "saltbush", MountainTea: "mountaintea", Thistle: "thistle", Fennel: "fennel" };

function drawIcon(c: Ctx, o: number, id: string) {
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
export function makePlayerTexture(scene: Phaser.Scene, look: { tunic: string; hair: string; skin: string }) { makeFigureTexture(scene, "player", look); }

export interface FigureExtras { beard?: boolean; long?: boolean; veil?: string }
/** Any walking person: the player, villagers, the folk of the wild huts. Same 28 frames as the player. */
export function makeFigureTexture(scene: Phaser.Scene, key: string, look: { tunic: string; hair: string; skin: string }, ex: FigureExtras = {}) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const belt = look.tunic === "#b0412f" ? "#e9e1cf" : "#b0412f";
  const leg = "#6b4a2b", eye = "#2a1d14", tool = "#7a5a33", toolHead = "#9c968a";
  const player = canvasTex(scene, key, 16 * 4 * POSES, 16, (c) => {
    for (let f = 0; f < 4; f++) for (let pose = 0; pose < POSES; pose++) {
      const o = (f * POSES + pose) * 16;
      // Left is drawn as right, mirrored.
      const mir = f === 1, side = f === 1 || f === 2;
      const p = (x: number, y: number, w: number, h: number, col: string) => px(c, o + (mir ? 16 - x - w : x), y, w, h, col);
      const walk = pose === 1 ? 1 : pose === 2 ? -1 : 0;
      p(5, 13, 6, 2, "rgba(0,0,0,0.25)");
      // Legs.
      if (!side) {
        p(6, 13, 1, walk === -1 ? 1 : 2, leg); p(9, 13, 1, walk === 1 ? 1 : 2, leg);
      } else if (walk === 1) { p(9, 13, 1, 2, leg); p(6, 13, 1, 2, leg); }
      else if (walk === -1) { p(7, 13, 1, 2, leg); p(8, 13, 1, 1, leg); }
      else { p(7, 13, 1, 2, leg); p(8, 13, 1, 2, leg); }
      // Body and head.
      p(5, 6, 6, 7, look.tunic); p(5, 9, 6, 1, belt);
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
