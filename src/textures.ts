import Phaser from "phaser";
import { CROPS, seedId } from "./data";
import { FORAGE } from "./forage";
import { VILLAGERS } from "./village";

// Placeholder pixel art, drawn in code. Warm Mediterranean palette.
export const T = {
  GRASS: 0, GRASS2: 1, DIRT: 2, PATH: 3,
  BRUSH: 4, SAPLING: 5, STONE: 6, TREE: 7, BOULDER: 8, EDGE: 9,
  FLOOR: 10, WALL: 11, FLOWERS: 12, OLIVE: 13, TILLED: 14, WET: 15, FENCE: 16,
  MEADOW: 17, FOREST: 18, ROCKY: 19,
};
export const TILE = 16;
const COUNT = 20;

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

export function makeTextures(scene: Phaser.Scene) {
  const tiles = canvasTex(scene, "tiles", TILE * COUNT, TILE, (c) => { for (let i = 0; i < COUNT; i++) drawTile(c, i); });
  for (let i = 0; i < COUNT; i++) tiles.add(`t${i}`, 0, i * TILE, 0, TILE, TILE); // single tiles, for break effects

  // Player: four facings in one strip (down, left, right, up), 16x16 each.
  const player = canvasTex(scene, "player", 64, 16, (c) => {
    for (let f = 0; f < 4; f++) {
      const o = f * 16;
      px(c, o + 5, 13, 6, 2, "rgba(0,0,0,0.25)");
      px(c, o + 5, 6, 6, 7, "#e9e1cf"); // chiton
      px(c, o + 5, 9, 6, 1, "#b0412f"); // belt
      px(c, o + 6, 1, 4, 5, "#c98e62"); // head
      px(c, o + 6, 1, 4, 2, "#4a3324"); // hair
      px(c, o + 6, 13, 1, 2, "#6b4a2b"); px(c, o + 9, 13, 1, 2, "#6b4a2b");
      if (f === 0) { px(c, o + 7, 3, 1, 1, "#2a1d14"); px(c, o + 8, 3, 1, 1, "#2a1d14"); }
      if (f === 1) px(c, o + 6, 3, 1, 1, "#2a1d14");
      if (f === 2) px(c, o + 9, 3, 1, 1, "#2a1d14");
      if (f === 3) px(c, o + 6, 1, 4, 4, "#4a3324");
    }
  });
  for (let f = 0; f < 4; f++) player.add(f, 0, f * 16, 0, 16, 16);

  // The one-room hut: limestone walls, reed thatch, a door.
  canvasTex(scene, "hut", 64, 56, (c) => {
    px(c, 4, 22, 56, 32, "#e8dcc2"); px(c, 4, 48, 56, 6, "#c9b48f");
    px(c, 0, 8, 64, 18, "#c9a35a"); px(c, 4, 2, 56, 8, "#d8b468"); px(c, 0, 24, 64, 3, "#a9853f");
    for (let x = 2; x < 64; x += 5) px(c, x, 10, 1, 14, "#b38f48");
    px(c, 26, 32, 12, 22, "#6b4a2b"); px(c, 28, 34, 8, 18, "#5a3d22"); px(c, 34, 43, 1, 2, "#e6c74a");
    px(c, 10, 32, 8, 7, "#5a4632"); px(c, 46, 32, 8, 7, "#5a4632");
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
  const looks = ["beggar", "traveler", "shepherd", "potter", "bard"];
  const people = canvasTex(scene, "people", 16 * (vids.length + looks.length), 16, (c) => {
    vids.forEach((id, i) => drawPerson(c, i * 16, VILLAGERS[id].look));
    looks.forEach((l, i) => drawStranger(c, (vids.length + i) * 16, l));
  });
  vids.forEach((id, i) => people.add(id, 0, i * 16, 0, 16, 16));
  looks.forEach((l, i) => people.add(l, 0, (vids.length + i) * 16, 0, 16, 16));

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
  canvasTex(scene, "arrowStuck", 5, 8, (c) => { px(c, 2, 0, 1, 7, "#a87443"); px(c, 1, 0, 1, 2, "#e8e2d0"); px(c, 3, 0, 1, 2, "#e8e2d0"); px(c, 1, 7, 3, 1, "rgba(0,0,0,0.25)"); });
  canvasTex(scene, "pithos", 12, 16, (c) => {
    px(c, 2, 2, 8, 13, "#b5643b"); px(c, 1, 5, 10, 7, "#c4703f"); px(c, 3, 0, 6, 3, "#9c5532"); px(c, 2, 8, 8, 1, "#2a1d14");
  });
}

export const ITEM_ICON_ORDER = ["WildGrapes", "Plum", "Cornel", "Purslane", "Oats", "Thyme", "Capers", "Clay", "Ochre", "Mushrooms", "hoe", "jar", "sickle", "axe", "mattock", "bow", "Arrow", "Meat", "Hide", "Antler", "Tusk", "Feather", "Wood", "Stone", "Fiber", "Flowers", "Milk", "Honey", "Wax", "Grapes",
  ...Object.keys(CROPS), ...Object.keys(CROPS).map(seedId)];

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
  }
}
const FORAGE_ICON: Record<string, string> = { WildGrapes: "wildgrape", Plum: "plum", Cornel: "cornel", Purslane: "purslane", Oats: "oats", Thyme: "thyme", Capers: "caper", Clay: "clay", Ochre: "ochre", Mushrooms: "mushrooms" };

function drawIcon(c: Ctx, o: number, id: string) {
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
    case "bow":
      for (let i = 0; i < 12; i++) { const x = 4 + Math.round(Math.sin((i / 11) * Math.PI) * 4); px(c, o + x, 2 + i, 2, 1, i % 4 === 0 ? "#5a3d22" : "#8a5f35"); }
      px(c, o + 11, 2, 1, 12, "#e8e2d0"); px(c, o + 4, 2, 7, 1, "#6b4a2b"); px(c, o + 4, 13, 7, 1, "#6b4a2b"); break;
    case "Arrow":
      for (let i = 0; i < 10; i++) px(c, o + 3 + i, 12 - i, 1, 1, "#a87443");
      px(c, o + 12, 2, 2, 2, "#8d877b"); px(c, o + 13, 1, 1, 1, "#b8b2a6"); px(c, o + 2, 11, 2, 1, "#e8e2d0"); px(c, o + 3, 13, 1, 2, "#e8e2d0"); break;
    case "Meat": px(c, o + 3, 5, 9, 7, "#b5443b"); px(c, o + 4, 6, 6, 3, "#d0645a"); px(c, o + 11, 8, 3, 2, "#f2ece0"); px(c, o + 13, 7, 2, 4, "#f2ece0"); break;
    case "Hide": px(c, o + 3, 3, 10, 10, "#a47a52"); px(c, o + 1, 4, 2, 3, "#a47a52"); px(c, o + 13, 4, 2, 3, "#a47a52"); px(c, o + 2, 11, 2, 3, "#a47a52"); px(c, o + 12, 11, 2, 3, "#a47a52"); px(c, o + 6, 5, 4, 6, "#c09468"); break;
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
    case "potter":
      drawPerson(c, o, { tunic: "#a07a62", hair: "#2a1d14", skin: "#a8744a", beard: true }); px(c, o + 1, 4, 4, 7, "#c4703f"); px(c, o + 2, 3, 2, 1, "#9c5532"); break;
    case "bard":
      drawPerson(c, o, { tunic: "#e8e2d0", hair: "#c98e2a", skin: "#d8a878" }); px(c, o + 10, 7, 4, 4, "#8a6a3a"); px(c, o + 10, 4, 1, 4, "#c9b48f"); px(c, o + 13, 4, 1, 4, "#c9b48f"); px(c, o + 10, 4, 4, 1, "#c9b48f"); break;
  }
}
