import Phaser from "phaser";

/**
 * The inside of the hut: one warm room under a reed roof. Lime-plastered walls over a stone socle, a red-ochre
 * dado, timber posts and a ceiling beam; a packed-earth floor, flagstones round the hearth. The hearth stands at
 * the back wall under a clay hood, with a bronze pot on its chain; the bed in the corner, the storage jars in the
 * other, the household altar in its niche, herbs and garlic hung from the beam, a shuttered window with a pot of
 * basil on the sill. The middle of the floor is left clear for what you make yourself.
 */
export const HOME = { W: 19, H: 12, DOOR: 9 };
/** Floor tiles that are taken by the fixed things (no furniture there), as "x,y". */
export const HOME_FIXED = new Set<string>();
for (const [x0, y0, x1, y1] of [[1, 3, 2, 5], [8, 3, 10, 4], [11, 3, 11, 3], [15, 3, 15, 3], [16, 3, 17, 4], [3, 4, 3, 5]] as number[][])
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) HOME_FIXED.add(`${x},${y}`);
HOME_FIXED.add(`${HOME.DOOR},10`); // the way in stays clear
/** Back-wall columns already hung with something (wall hangings go elsewhere). */
export const HOME_WALL_BUSY = new Set([1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 13, 14]);
/** Where the window is (pixels): its opening, for the sky behind it. */
export const HOME_WINDOW = { x: 52, y: 19, w: 24, h: 17 };

/**
 * Things you make and set down. Sizes are in tiles: the anchor is the tile you face, the piece reaching left and
 * right of it about evenly, and back (up) from it. Flat things lie on the floor (you walk over them, and other
 * things stand on them); wall things hang on the back wall. Seats can be sat in, to rest; lights burn at night.
 */
export interface FurnDef { w: number; h: number; flat?: boolean; wall?: boolean; seat?: number; light?: number; frames?: number; indoor?: boolean; sitWord?: string }
export const FURN: Record<string, FurnDef> = {
  Table: { w: 2, h: 1, frames: 3, indoor: true },
  Stool: { w: 1, h: 1, seat: 1.5, indoor: true, sitWord: "Sit on the stool" },
  Chair: { w: 1, h: 1, seat: 1.6, indoor: true, sitWord: "Sit in the chair" },
  Couch: { w: 2, h: 1, seat: 2, indoor: true, sitWord: "Lie back on the couch" },
  Rug: { w: 3, h: 2, flat: true, indoor: true },
  Pelt: { w: 2, h: 1, flat: true, indoor: true },
  LampStand: { w: 1, h: 1, light: 52, indoor: true },
  Basket: { w: 1, h: 1, indoor: true },
  Vase: { w: 1, h: 1, indoor: true },
  Tapestry: { w: 1, h: 2, wall: true, indoor: true },
  Chest: { w: 1, h: 1, indoor: true },
  Loom: { w: 1, h: 1, indoor: true },
  Workbench: { w: 1, h: 1, indoor: true },
};
export const furn = (id: string): FurnDef => FURN[id] ?? { w: 1, h: 1 };
/** The tiles a piece covers, set down facing (tx, ty). */
export function footprint(id: string, tx: number, ty: number): [number, number][] {
  const f = furn(id), x0 = tx - Math.floor((f.w - 1) / 2), y0 = ty - (f.h - 1), out: [number, number][] = [];
  for (let y = y0; y < y0 + f.h; y++) for (let x = x0; x < x0 + f.w; x++) out.push([x, y]);
  return out;
}
/** Where its picture stands: bottom middle of the footprint (pixels). */
export function footAnchor(id: string, tx: number, ty: number): [number, number] {
  const f = furn(id), x0 = tx - Math.floor((f.w - 1) / 2), y0 = ty - (f.h - 1);
  return [(x0 + f.w / 2) * 16, (y0 + f.h) * 16 - 1];
}
/** What makes a home comfortable: each kind of furnishing counts once. */
export const COMFORT_KIND: Record<string, string> = {
  Table: "table", Stool: "seat", Chair: "seat", Couch: "couch", Rug: "rug", Pelt: "rug", LampStand: "lamp",
  Basket: "basket", Vase: "flowers", Tapestry: "hanging", Chest: "chest", Loom: "loom",
};

type Ctx = CanvasRenderingContext2D;
function px(c: Ctx, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(x, y, w, h); }
const hsh = (x: number, y: number, s = 0) => {
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
function canvasTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  const c = tex.getContext(); c.imageSmoothingEnabled = false; draw(c); tex.refresh(); return tex;
}
const sh = (c: Ctx, x: number, y: number, w: number, a = 0.22) => { px(c, x + 1, y, w - 2, 2, `rgba(0,0,0,${a})`); px(c, x, y + 1, w, 1, `rgba(0,0,0,${a * 0.6})`); };

function drawRoom(c: Ctx) {
  const PW = HOME.W * 16, PH = HOME.H * 16, img = c.createImageData(PW, PH), d = img.data;
  const put = (x: number, y: number, [r, g, b]: number[], k = 1) => { const i = (y * PW + x) * 4; d[i] = Math.max(0, Math.min(255, r * k)); d[i + 1] = Math.max(0, Math.min(255, g * k)); d[i + 2] = Math.max(0, Math.min(255, b * k)); d[i + 3] = 255; };
  const earth = hex("#9a7450"), earthHi = hex("#a47c56"), plaster = hex("#e2d2b0"), thatch = hex("#6e5532"), wallTop = hex("#b7a27c"), stone = hex("#a39b8a");
  const doorX = HOME.DOOR * 16;
  // Flat colors, like the tiles outdoors: a few calm tones, no grain.
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    const side = x < 16 || x >= PW - 16, front = y >= PH - 16 && !(x >= doorX && x < doorX + 16);
    if (side || front) { // wall tops, seen from above: plastered mudbrick, in courses
      put(x, y, wallTop, (y & 7) === 0 ? 0.9 : 1);
    } else if (y < 10) { // the reed thatch above, in shadow
      put(x, y, thatch, (x + (y >> 1)) % 6 === 0 ? 0.62 : 0.7);
    } else if (y < 48) { // the back wall: plaster
      put(x, y, plaster, y < 14 ? 0.9 : 1);
    } else if (y >= PH - 16) { // the doorway: daylight on the threshold
      put(x, y, hex("#d6c49a"), 1);
    } else { // the floor: packed earth, one flat tone like the paths outside, a little darker along the walls, worn lighter from door to hearth
      const edge = y < 52 || x < 20 || x >= PW - 20 ? 0.9 : 1;
      const worn = Math.abs(x - (doorX + 8)) < 10 && y > 100;
      put(x, y, worn ? earthHi : earth, edge);
    }
  }
  c.putImageData(img, 0, 0);
  // Specks of grit and a few pebbles, sparse as the specks in the grass outside.
  for (let i = 0; i < 90; i++) {
    const x = 20 + Math.floor(hsh(i, 3, 7) * (PW - 40)), y = 54 + Math.floor(hsh(i, 4, 7) * (PH - 74));
    if (x > 110 && x < 196 && y < 92) continue;
    px(c, x, y, 1, 1, hsh(i, 5, 7) < 0.5 ? "#86643f" : "#b08a64");
  }
  // Flagstones before the hearth: plain, even slabs.
  for (let y = 50; y < 94; y += 10) for (let x = 112 + ((y / 10) & 1 ? 0 : 6); x < 192; x += 12) {
    if (Math.hypot(x + 5 - 152, (y + 4 - 60) * 1.5) > 46) continue;
    px(c, x, y, 11, 9, "#857c6c"); px(c, x + 1, y + 1, 9, 7, "#a39a88"); px(c, x + 1, y + 1, 9, 1, "#b8b09e");
  }
  // A little straw strewn by the bed and the door.
  for (let i = 0; i < 12; i++) {
    const x = 24 + Math.floor(hsh(i, 7, 6) * (PW - 48)), y = 60 + Math.floor(hsh(i, 8, 6) * (PH - 84));
    if (x > 110 && x < 196 && y < 92) continue;
    px(c, x, y, 3, 1, "#c8aa66");
  }
  // The wall: red-ochre dado, a stone socle, timber posts, the ceiling beam, a crack or two.
  px(c, 16, 35, PW - 32, 1, "#7e3a24"); px(c, 16, 36, PW - 32, 3, "#9c4a2e"); px(c, 16, 39, PW - 32, 1, "#7e3a24");
  for (let x = 16, k = 0; x < PW - 16; k++) {
    const w = 7 + Math.floor(hsh(k, 1, 10) * 6);
    px(c, x, 40, w, 8, "#8f8676"); px(c, x + 1, 40, w - 1, 7, k % 2 ? "#a49c8a" : "#aca492");
    px(c, x + 1, 40, w - 1, 1, "#c2baa8"); x += w;
  }
  px(c, 16, 47, PW - 32, 1, "#6e665a");
  for (const x of [88, 184, 250]) { px(c, x - 2, 10, 5, 30, "#5e4026"); px(c, x - 2, 10, 1, 30, "#7a5a33"); px(c, x + 2, 10, 1, 30, "#4a3220"); px(c, x - 3, 38, 7, 2, "#4a3220"); }
  px(c, 16, 8, PW - 32, 5, "#5e4026"); px(c, 16, 8, PW - 32, 1, "#7f5c38"); px(c, 16, 12, PW - 32, 1, "#3e2a18");
  for (let x = 30; x < PW - 20; x += 34) { px(c, x, 0, 6, 8, "#4a3220"); px(c, x, 0, 1, 8, "#5e4026"); } // rafters going back
  // Side walls: their inner edge, and the corners where they meet the back wall.
  for (const x of [15, PW - 16]) { px(c, x, 0, 1, PH - 16, "#8a7a5c"); }
  px(c, 16, 10, 2, 38, "rgba(0,0,0,0.12)"); px(c, PW - 18, 10, 2, 38, "rgba(0,0,0,0.12)");
  px(c, 0, PH - 17, doorX, 1, "#d2c2a0"); px(c, doorX + 16, PH - 17, PW - doorX - 16, 1, "#d2c2a0");
  // The door: a stone threshold, door jambs, the wooden door swung open against the wall.
  px(c, doorX, PH - 16, 16, 5, "#a49c8c"); px(c, doorX, PH - 16, 16, 1, "#c4bcac"); px(c, doorX, PH - 12, 16, 1, "#7f786c");
  px(c, doorX - 2, PH - 17, 2, 17, "#5e4026"); px(c, doorX + 16, PH - 17, 2, 17, "#5e4026");
  px(c, doorX + 18, PH - 15, 3, 14, "#7a5a33"); px(c, doorX + 18, PH - 15, 1, 14, "#9c7445");
  // The window: a timber frame, a bar across, shutters folded back, a pot of basil on the sill.
  const { x: wx, y: wy, w: ww, h: wh } = HOME_WINDOW;
  px(c, wx - 3, wy - 3, ww + 6, wh + 6, "#5e4026"); px(c, wx - 3, wy - 3, ww + 6, 1, "#7f5c38");
  c.clearRect(wx, wy, ww, wh);
  px(c, wx, wy + 7, ww, 2, "#5e4026"); px(c, wx + 11, wy, 2, wh, "#5e4026");
  for (const sx of [wx - 11, wx + ww + 3]) { px(c, sx, wy - 2, 8, wh + 4, "#7a5a33"); px(c, sx, wy - 2, 8, 1, "#9c7445"); px(c, sx + 2, wy - 2, 1, wh + 4, "#5e4026"); px(c, sx + 5, wy - 2, 1, wh + 4, "#5e4026"); px(c, sx + (sx < wx ? 7 : 0), wy + 5, 1, 2, "#c98a55"); }
  px(c, wx - 4, wy + wh, ww + 8, 3, "#c9b48f"); px(c, wx - 4, wy + wh, ww + 8, 1, "#e0d0ac"); px(c, wx - 4, wy + wh + 3, ww + 8, 1, "rgba(0,0,0,0.25)");
  px(c, wx + 15, wy + wh - 4, 6, 4, "#b5643b"); px(c, wx + 14, wy + wh - 5, 8, 2, "#c4703f");
  for (const [x, y] of [[15, -9], [17, -10], [19, -8], [16, -7], [18, -6], [20, -6], [14, -6], [17, -8]]) px(c, wx + x, wy + wh + y, 2, 2, (x + y) % 2 ? "#5e8f3a" : "#79a84a");
}

export function makeHomeTextures(scene: Phaser.Scene) {
  canvasTex(scene, "home_room", HOME.W * 16, HOME.H * 16, drawRoom);

  // A soft round light, for cutting holes in the dark.
  canvasTex(scene, "softLight", 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.45, "rgba(255,255,255,0.75)"); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  // A shaft of daylight from the window, falling to the floor.
  canvasTex(scene, "home_shaft", 64, 84, (c) => {
    for (let y = 0; y < 84; y++) {
      const a = 0.55 * (1 - y / 100) * Math.min(1, y / 6), x0 = Math.round(y * 0.42);
      c.fillStyle = `rgba(255,240,200,${a})`; c.fillRect(x0, y, 26, 1);
    }
  });

  // The hearth: a clay hood up the wall, a stone curb, the fire pit, the pot's chain.
  canvasTex(scene, "home_hearth", 52, 60, (c) => {
    sh(c, 1, 57, 50, 0.28);
    for (let y = 0; y < 31; y++) {
      const half = 11 + Math.round(y * 0.36), x0 = 26 - half;
      px(c, x0, y, half * 2, 1, "#cbb48e");
      px(c, x0, y, 1, 1, "#a8916c"); px(c, x0 + half * 2 - 1, y, 1, 1, "#e0cca6");
      if (y > 12) { const a = (y - 12) / 26; c.fillStyle = `rgba(60,46,34,${a * 0.8})`; c.fillRect(x0 + 3, y, half * 2 - 6, 1); }
    }
    px(c, 14, 0, 24, 2, "#b39c76"); px(c, 3, 28, 46, 3, "#a8916c"); px(c, 3, 28, 46, 1, "#c8b28c"); // a ledge along its foot
    px(c, 7, 23, 4, 5, "#c4703f"); px(c, 8, 22, 2, 1, "#9c5532"); px(c, 7, 25, 4, 1, "#2a1d14"); // a little jug,
    px(c, 41, 25, 5, 3, "#2a221c"); px(c, 41, 25, 5, 1, "#c4703f"); // and a cup
    px(c, 5, 31, 42, 9, "#2e2018"); for (let x = 6; x < 46; x += 4) px(c, x, 31 + ((x >> 2) & 1) * 4, 3, 1, "#3e2c20");
    px(c, 25, 2, 2, 28, "#3a3530"); for (let y = 4; y < 30; y += 3) px(c, 24, y, 4, 1, "#5a5248"); // the chain
    // The curb: dressed stones, a fire pit of ash and embers.
    px(c, 1, 37, 50, 21, "#7a7264"); px(c, 2, 38, 48, 10, "#a39c8c"); px(c, 2, 38, 48, 1, "#c4bcac");
    for (let x = 2, k = 0; x < 50; k++) { const w = 7 + (k % 3) * 2; px(c, x, 49, w - 1, 8, k % 2 ? "#8d8576" : "#958d7d"); px(c, x, 49, w - 1, 1, "#aaa292"); x += w; }
    px(c, 10, 39, 32, 9, "#4a3c30"); px(c, 11, 40, 30, 7, "#3a2e24");
    for (let i = 0; i < 16; i++) px(c, 12 + Math.floor(hsh(i, 1, 20) * 28), 41 + Math.floor(hsh(i, 2, 20) * 6), 1, 1, hsh(i, 3, 20) < 0.5 ? "#e8862e" : "#b0412f");
    px(c, 14, 44, 24, 2, "#4a3220"); px(c, 18, 42, 16, 2, "#5e4026"); px(c, 14, 44, 2, 2, "#7a5a33"); px(c, 36, 44, 2, 2, "#7a5a33");
  });
  const flame = canvasTex(scene, "home_flame", 60, 18, (c) => {
    for (let f = 0; f < 3; f++) {
      const o = f * 20, s = [0, 1, -1][f];
      px(c, o + 3, 11, 14, 6, "#d85a22"); px(c, o + 5 + s, 6, 10, 8, "#e8862e"); px(c, o + 7 - s, 3, 6, 8, "#f2b040");
      px(c, o + 8 + s, 1, 3, 6, "#f8d870"); px(c, o + 9, 9, 3, 6, "#fff3c0"); px(c, o + 2 + f, 13 - f, 2, 3, "#e8862e"); px(c, o + 15 - f, 12, 2, 4, "#e8862e");
    }
  });
  for (let f = 0; f < 3; f++) flame.add(f, 0, f * 20, 0, 20, 18);
  canvasTex(scene, "home_pot", 18, 14, (c) => {
    px(c, 2, 2, 14, 2, "#8a6a3a"); px(c, 1, 3, 16, 7, "#6a4a2a"); px(c, 2, 10, 14, 2, "#5a3e22"); px(c, 4, 12, 10, 1, "#4a3220");
    px(c, 3, 4, 3, 4, "#8a6a3a"); px(c, 2, 2, 14, 1, "#a88a50"); px(c, 0, 4, 1, 3, "#5a3e22"); px(c, 17, 4, 1, 3, "#5a3e22");
    px(c, 4, 1, 10, 1, "#c8c0b0"); px(c, 8, 0, 1, 1, "rgba(220,220,220,0.6)");
  });

  canvasTex(scene, "home_bed", 28, 46, (c) => {
    sh(c, 0, 44, 28, 0.25);
    px(c, 0, 0, 28, 44, "#4a3220"); px(c, 1, 1, 26, 42, "#6b4a2b"); px(c, 0, 0, 3, 9, "#5e4026"); px(c, 25, 0, 3, 9, "#5e4026"); px(c, 0, 0, 28, 2, "#7f5c38");
    px(c, 3, 5, 22, 37, "#d8ccb0"); // the linen-covered mattress
    px(c, 4, 6, 20, 7, "#ece4d0"); px(c, 4, 12, 20, 1, "#c8bc9e"); px(c, 6, 8, 16, 1, "#f6f0e0");
    px(c, 3, 15, 22, 27, "#a8412f"); px(c, 3, 15, 22, 3, "#c45a40"); px(c, 3, 18, 22, 1, "#7e2e20");
    for (const y of [23, 31]) { px(c, 3, y, 22, 2, "#d39a3a"); px(c, 3, y + 2, 22, 1, "#5a2418"); }
    px(c, 8, 20, 1, 18, "#93382a"); px(c, 18, 26, 1, 12, "#93382a");
    for (let x = 4; x < 24; x += 3) px(c, x, 38 + (x % 2), 2, 3, "#f0e8d8"); px(c, 3, 37, 22, 1, "#e4dccb"); // a fleece across the foot
    px(c, 1, 42, 3, 4, "#4a3220"); px(c, 24, 42, 3, 4, "#4a3220");
  });
  canvasTex(scene, "home_mat", 14, 26, (c) => {
    px(c, 1, 1, 12, 24, "#b0924f");
    for (let y = 1; y < 25; y++) for (let x = 1; x < 13; x++) if ((x + (y >> 1)) % 3 === 0) px(c, x, y, 1, 1, "#c8aa66");
    px(c, 1, 1, 12, 1, "#9a7e42"); px(c, 1, 24, 12, 1, "#9a7e42");
    for (let x = 1; x < 13; x += 2) { px(c, x, 0, 1, 1, "#c8aa66"); px(c, x, 25, 1, 1, "#c8aa66"); }
  });
  canvasTex(scene, "home_pegs", 30, 30, (c) => {
    px(c, 1, 3, 28, 3, "#6b4a2b"); px(c, 1, 3, 28, 1, "#8a6440");
    for (const x of [5, 15, 25]) px(c, x, 6, 2, 2, "#4a3220");
    // a wide straw hat
    px(c, 0, 10, 12, 3, "#c8a050"); px(c, 1, 9, 10, 1, "#d8b468"); px(c, 3, 6, 6, 4, "#d3ad5e"); px(c, 3, 8, 6, 1, "#8a3a2a"); px(c, 0, 12, 12, 1, "#a8843e");
    // a woolen cloak
    px(c, 12, 7, 7, 3, "#4a5672"); px(c, 11, 10, 9, 17, "#3e4a6a"); px(c, 13, 10, 1, 17, "#2e3a58"); px(c, 17, 10, 1, 16, "#2e3a58"); px(c, 11, 26, 9, 2, "#344060"); px(c, 15, 8, 2, 2, "#c98a55");
    // a leather bag on its strap
    px(c, 25, 7, 1, 8, "#5e4026"); px(c, 22, 14, 7, 7, "#8a6440"); px(c, 22, 14, 7, 2, "#6b4a2b"); px(c, 25, 16, 1, 1, "#c98a55");
  });
  canvasTex(scene, "home_shelf", 32, 28, (c) => {
    for (const y of [11, 25]) { px(c, 0, y, 32, 3, "#6b4a2b"); px(c, 0, y, 32, 1, "#8a6440"); px(c, 3, y + 3, 2, 2, "#4a3220"); px(c, 27, y + 3, 2, 2, "#4a3220"); }
    // a jug with a black band, two cups, a little oil flask
    px(c, 3, 2, 6, 9, "#c4703f"); px(c, 4, 0, 4, 2, "#b5643b"); px(c, 3, 5, 6, 2, "#2a221c"); px(c, 9, 3, 1, 4, "#9c5532");
    px(c, 12, 7, 7, 3, "#2a221c"); px(c, 13, 10, 5, 1, "#2a221c"); px(c, 12, 7, 7, 1, "#c4703f");
    px(c, 20, 8, 5, 2, "#2a221c"); px(c, 21, 10, 3, 1, "#2a221c"); px(c, 20, 8, 5, 1, "#c4703f");
    px(c, 27, 4, 3, 7, "#e0d6c0"); px(c, 28, 2, 1, 2, "#e0d6c0"); px(c, 27, 6, 3, 1, "#2a221c");
    // stacked bowls, a round loaf, a basket of eggs
    px(c, 2, 21, 9, 2, "#b5643b"); px(c, 3, 19, 7, 2, "#c4703f"); px(c, 4, 18, 5, 1, "#2a221c");
    px(c, 13, 19, 8, 6, "#c08a4a"); px(c, 14, 18, 6, 1, "#d8a868"); px(c, 15, 20, 1, 3, "#9a6a34"); px(c, 18, 20, 1, 3, "#9a6a34");
    px(c, 23, 21, 8, 4, "#a8884a"); px(c, 23, 21, 8, 1, "#c8aa66"); px(c, 24, 19, 2, 2, "#f0e8d8"); px(c, 27, 19, 2, 2, "#e8dcc4"); px(c, 26, 18, 2, 2, "#f0e8d8");
  });
  canvasTex(scene, "home_herbs", 32, 30, (c) => {
    for (const x of [3, 10, 17, 24, 29]) px(c, x, 0, 1, 6, "#c9b48f");
    // bundles of thyme and oregano, a braid of garlic, a string of onions, dried figs
    for (const [x, col] of [[3, "#6f8a3a"], [24, "#5e7a34"]] as [number, string][]) { px(c, x - 2, 6, 5, 8, col); px(c, x - 1, 13, 3, 4, col); px(c, x - 1, 5, 3, 2, "#8a6440"); px(c, x - 2, 8, 1, 3, "#87a24a"); }
    for (let y = 6; y < 26; y += 3) { px(c, 9 + (y % 2), y, 3, 3, "#ece4d0"); px(c, 10 + (y % 2), y, 1, 1, "#d8ccb0"); }
    px(c, 10, 26, 1, 3, "#c9b48f");
    for (let y = 6; y < 22; y += 4) { px(c, 16, y, 4, 4, "#c88a4a"); px(c, 17, y, 1, 1, "#e0a868"); }
    for (let y = 6; y < 24; y += 3) px(c, 28 + (y % 2), y, 3, 2, "#6a4a3a");
  });
  canvasTex(scene, "home_altar", 22, 32, (c) => {
    px(c, 2, 4, 18, 26, "#c4b08c"); px(c, 4, 2, 14, 3, "#c4b08c"); px(c, 7, 0, 8, 2, "#c4b08c");
    px(c, 4, 6, 14, 18, "#8e7c5e"); px(c, 6, 4, 10, 2, "#8e7c5e"); px(c, 8, 3, 6, 1, "#8e7c5e"); px(c, 5, 7, 12, 16, "#7a6a50");
    px(c, 3, 24, 16, 2, "#e0d0ac"); px(c, 3, 26, 16, 1, "#9a8668"); // the ledge
    px(c, 9, 13, 4, 11, "#eee6d4"); px(c, 10, 10, 2, 3, "#eee6d4"); px(c, 9, 16, 4, 1, "#c8402a"); // Hestia, small and white
    px(c, 14, 21, 4, 3, "#c4703f"); px(c, 13, 22, 1, 1, "#c4703f"); px(c, 15, 19, 1, 2, "#f2c14e"); px(c, 15, 18, 1, 1, "#fff3c0"); // the lamp, always lit
    for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); px(c, 11 + Math.round(Math.cos(a) * 9), 9 - Math.round(Math.sin(a) * 7), 2, 2, i % 3 === 0 ? "#e8a0b0" : i % 3 === 1 ? "#f2d06a" : "#6f8a3a"); }
    px(c, 6, 27, 10, 3, "#b5643b"); px(c, 7, 27, 8, 1, "#d8c080"); // an offering bowl, with barley in it
  });
  canvasTex(scene, "home_wood", 20, 20, (c) => {
    sh(c, 0, 18, 20, 0.25);
    const log = (x: number, y: number, w: number) => { // a split log lying on its side, its cut end toward you
      px(c, x, y, w, 5, "#5e4026"); px(c, x, y, w, 1, "#7a5a33"); px(c, x + 2, y + 2, w - 4, 1, "#4a3220");
      px(c, x - 1, y, 4, 5, "#c49a64"); px(c, x - 1, y, 4, 1, "#d8b07a"); px(c, x, y + 2, 2, 1, "#a87e4c");
    };
    log(2, 13, 16); log(1, 8, 17); log(3, 3, 14);
    px(c, 15, 1, 4, 2, "#9c7445"); // a stick of kindling on top
  });
  canvasTex(scene, "home_broom", 10, 28, (c) => {
    for (let y = 0; y < 18; y++) px(c, 7 - Math.floor(y / 6), y, 1, 1, "#8a6440");
    px(c, 2, 17, 6, 9, "#c8aa66"); px(c, 1, 20, 8, 6, "#b8964f"); for (let x = 1; x < 9; x += 2) px(c, x, 25, 1, 2, "#d8bc78"); px(c, 2, 18, 6, 1, "#8a3a2a");
  });
  canvasTex(scene, "home_pithoi", 36, 38, (c) => {
    sh(c, 1, 35, 34, 0.25);
    const jar = (x: number, y: number, w: number, h: number) => {
      px(c, x + 2, y + 2, w - 4, h - 3, "#b5643b"); px(c, x, y + 6, w, h - 12, "#c4703f"); px(c, x + 3, y, w - 6, 3, "#9c5532"); px(c, x + 2, y + 1, w - 4, 1, "#d0844f");
      for (const by of [y + 9, y + h - 9]) { px(c, x + 1, by, w - 2, 2, "#9c5532"); for (let k = x + 2; k < x + w - 2; k += 3) px(c, k, by, 1, 1, "#d0844f"); }
      px(c, x + 3, y + 7, 2, h - 14, "#d0844f");
    };
    px(c, 26, 2, 8, 28, "#c4703f"); px(c, 27, 0, 6, 3, "#9c5532"); px(c, 25, 6, 1, 6, "#9c5532"); px(c, 34, 6, 1, 6, "#9c5532"); px(c, 27, 8, 6, 1, "#2a221c"); // an amphora against the wall
    jar(1, 4, 16, 32); px(c, 3, 3, 12, 2, "#8a6440"); px(c, 7, 2, 4, 1, "#6b4a2b"); // a lidded pithos
    jar(15, 14, 13, 22);
    px(c, 28, 30, 6, 6, "#e0d6c0"); px(c, 29, 28, 4, 2, "#d0c6ae"); px(c, 28, 32, 6, 1, "#2a221c"); // a little white jug
  });

  // ---- what you make ----
  const table = canvasTex(scene, "pl_Table", 96, 24, (c) => {
    for (let f = 0; f < 3; f++) {
      const o = f * 32;
      sh(c, o + 1, 21, 30, 0.25);
      px(c, o + 3, 12, 2, 10, "#4a3220"); px(c, o + 27, 12, 2, 10, "#4a3220"); px(c, o + 5, 12, 2, 8, "#5e4026"); px(c, o + 25, 12, 2, 8, "#5e4026");
      px(c, o + 1, 6, 30, 7, "#8a6440"); px(c, o + 1, 6, 30, 1, "#a8804e"); px(c, o + 1, 12, 30, 2, "#5e4026");
      for (const x of [9, 17, 24]) px(c, o + x, 7, 1, 5, "#7a5a33");
      if (f === 1) { // bread and a cup
        px(c, o + 5, 3, 9, 5, "#c08a4a"); px(c, o + 6, 2, 7, 1, "#d8a868"); px(c, o + 8, 4, 1, 3, "#9a6a34"); px(c, o + 11, 4, 1, 3, "#9a6a34");
        px(c, o + 19, 4, 6, 3, "#2a221c"); px(c, o + 18, 5, 1, 1, "#2a221c"); px(c, o + 25, 5, 1, 1, "#2a221c"); px(c, o + 19, 4, 6, 1, "#c4703f");
      } else if (f === 2) { // a bowl of figs and a jug
        px(c, o + 5, 6, 10, 2, "#b5643b"); px(c, o + 6, 4, 8, 2, "#6a4a3a"); px(c, o + 8, 3, 2, 1, "#7a5a4a"); px(c, o + 11, 3, 2, 1, "#5a3a5a");
        px(c, o + 21, 0, 5, 8, "#c4703f"); px(c, o + 22, 0, 3, 1, "#9c5532"); px(c, o + 21, 3, 5, 1, "#2a221c"); px(c, o + 26, 2, 1, 3, "#9c5532");
      }
    }
  });
  for (let f = 0; f < 3; f++) table.add(f, 0, f * 32, 0, 32, 24);
  canvasTex(scene, "pl_Stool", 14, 14, (c) => {
    sh(c, 1, 12, 12, 0.22);
    px(c, 2, 6, 2, 7, "#4a3220"); px(c, 10, 6, 2, 7, "#4a3220"); px(c, 4, 9, 6, 1, "#5e4026");
    px(c, 1, 3, 12, 4, "#8a6440"); px(c, 2, 2, 10, 2, "#a88a5a"); px(c, 3, 3, 8, 1, "#c4a070");
  });
  canvasTex(scene, "pl_Chair", 16, 24, (c) => {
    sh(c, 1, 22, 14, 0.22);
    for (let y = 0; y < 8; y++) { px(c, 2 + (y < 3 ? 0 : 1), 13 + y, 2, 1, "#4a3220"); px(c, 12 - (y < 3 ? 0 : 1), 13 + y, 2, 1, "#4a3220"); } // splayed legs
    px(c, 2, 2, 2, 12, "#5e4026"); px(c, 12, 2, 2, 12, "#5e4026"); px(c, 1, 1, 14, 4, "#7a5a33"); px(c, 1, 1, 14, 1, "#9c7445"); // the curved back
    px(c, 2, 11, 12, 4, "#8a6440"); px(c, 3, 11, 10, 2, "#b08a5a"); px(c, 3, 12, 10, 1, "#9a7648"); // a seat of stretched hide
  });
  canvasTex(scene, "pl_Couch", 32, 24, (c) => {
    sh(c, 0, 22, 32, 0.25);
    px(c, 2, 16, 2, 7, "#4a3220"); px(c, 28, 16, 2, 7, "#4a3220");
    px(c, 0, 2, 4, 15, "#5e4026"); px(c, 0, 2, 4, 1, "#7a5a33"); px(c, 1, 0, 3, 3, "#7a5a33"); // the raised head end
    px(c, 1, 10, 30, 7, "#6b4a2b"); px(c, 1, 16, 30, 1, "#4a3220");
    px(c, 3, 7, 28, 5, "#d8ccb0"); px(c, 3, 7, 28, 1, "#ece4d0"); // the mattress
    px(c, 4, 4, 8, 5, "#a8412f"); px(c, 5, 4, 6, 1, "#c45a40"); px(c, 4, 6, 8, 1, "#d39a3a"); // a cushion
    px(c, 14, 8, 17, 6, "#3e4a6a"); px(c, 14, 8, 17, 1, "#56628a"); for (const x of [17, 23, 29]) px(c, x, 9, 1, 5, "#d39a3a"); // a striped cover
  });
  canvasTex(scene, "pl_Rug", 48, 32, (c) => {
    px(c, 1, 1, 46, 30, "#8a2e20"); px(c, 3, 3, 42, 26, "#e0d0a8"); px(c, 5, 5, 38, 22, "#2a2420");
    for (let x = 5; x < 43; x += 4) { px(c, x, 5, 1, 3, "#e0d0a8"); px(c, x, 5, 3, 1, "#e0d0a8"); px(c, x + 2, 5, 1, 2, "#e0d0a8"); px(c, x, 24, 1, 3, "#e0d0a8"); px(c, x, 26, 3, 1, "#e0d0a8"); px(c, x + 2, 25, 1, 2, "#e0d0a8"); } // a meander border
    px(c, 7, 9, 34, 14, "#a8412f"); px(c, 9, 11, 30, 10, "#b8513a");
    px(c, 20, 13, 8, 6, "#d39a3a"); px(c, 22, 14, 4, 4, "#2a2420"); px(c, 12, 15, 4, 2, "#d39a3a"); px(c, 32, 15, 4, 2, "#d39a3a");
    for (let x = 2; x < 47; x += 2) { px(c, x, 0, 1, 1, "#e0d0a8"); px(c, x, 31, 1, 1, "#e0d0a8"); } // fringe
  });
  canvasTex(scene, "pl_Pelt", 32, 16, (c) => {
    const rows = [[6, 20], [3, 26], [2, 28], [1, 30], [2, 29], [1, 30], [2, 28], [3, 27], [2, 28], [4, 24], [6, 20], [9, 13]];
    rows.forEach(([x, w], y) => px(c, x, y + 2, w, 1, "#ece2ce"));
    for (let i = 0; i < 40; i++) px(c, 3 + Math.floor(hsh(i, 1, 30) * 26), 3 + Math.floor(hsh(i, 2, 30) * 10), 2, 1, hsh(i, 3, 30) < 0.5 ? "#d8ccb4" : "#f8f2e4");
    px(c, 0, 5, 2, 2, "#ece2ce"); px(c, 30, 5, 2, 2, "#ece2ce"); px(c, 0, 10, 2, 2, "#ece2ce"); px(c, 30, 10, 2, 2, "#ece2ce");
  });
  canvasTex(scene, "pl_LampStand", 12, 28, (c) => {
    sh(c, 1, 26, 10, 0.22);
    px(c, 2, 24, 8, 2, "#5a3e22"); px(c, 5, 6, 2, 19, "#7a5a33"); px(c, 5, 6, 1, 19, "#9c7445"); px(c, 3, 5, 6, 2, "#6a4a2a");
    px(c, 2, 2, 7, 3, "#c4703f"); px(c, 8, 3, 2, 1, "#c4703f"); px(c, 3, 2, 3, 1, "#2a221c"); px(c, 9, 0, 1, 2, "#f2c14e"); px(c, 9, 0, 1, 1, "#fff3c0");
  });
  canvasTex(scene, "pl_Basket", 14, 13, (c) => {
    sh(c, 1, 11, 12, 0.2);
    px(c, 2, 4, 10, 8, "#a8884a"); px(c, 1, 3, 12, 2, "#c8aa66"); for (let y = 5; y < 12; y += 2) px(c, 2, y, 10, 1, "#8a6c38");
    px(c, 3, 0, 4, 4, "#e9e1cf"); px(c, 7, 1, 4, 3, "#a8412f"); px(c, 4, 1, 1, 1, "#d0c6ae"); px(c, 11, 0, 1, 5, "#8a6440"); // balls of wool, a spindle
  });
  canvasTex(scene, "pl_Vase", 12, 20, (c) => {
    sh(c, 1, 18, 10, 0.22);
    px(c, 2, 9, 8, 9, "#c4703f"); px(c, 3, 7, 6, 2, "#b5643b"); px(c, 1, 11, 10, 5, "#c4703f"); px(c, 1, 13, 10, 1, "#2a221c"); px(c, 2, 15, 8, 1, "#2a221c"); px(c, 4, 17, 4, 1, "#9c5532");
    for (const [x, y, col] of [[3, 3, "#e8a0b0"], [6, 1, "#f2d06a"], [8, 3, "#e8e0f0"], [5, 4, "#c8402a"], [2, 5, "#f2d06a"]] as [number, number, string][]) { px(c, x + 1, y + 2, 1, 7 - y, "#5e7f34"); px(c, x, y, 2, 2, col); }
  });
  canvasTex(scene, "pl_Tapestry", 16, 30, (c) => {
    px(c, 0, 0, 16, 2, "#6b4a2b"); px(c, 0, 0, 16, 1, "#8a6440");
    px(c, 1, 2, 14, 24, "#3e4a6a"); px(c, 2, 4, 12, 20, "#a8412f");
    for (let y = 6; y < 22; y += 4) { px(c, 3, y, 10, 2, "#d39a3a"); px(c, 5 + ((y >> 2) % 2) * 3, y + 2, 3, 2, "#e0d0a8"); }
    for (let x = 1; x < 15; x += 2) px(c, x, 26, 1, 3, "#d39a3a");
  });
}

/** Small icons for the things you make, 16x16, drawn into the item sheet. */
export function drawFurnIcon(c: Ctx, o: number, id: string): boolean {
  switch (id) {
    case "Table": px(c, o + 1, 5, 14, 4, "#8a6440"); px(c, o + 1, 5, 14, 1, "#a8804e"); px(c, o + 2, 9, 2, 5, "#4a3220"); px(c, o + 12, 9, 2, 5, "#4a3220"); px(c, o + 4, 3, 4, 2, "#c08a4a"); return true;
    case "Stool": px(c, o + 3, 6, 10, 3, "#8a6440"); px(c, o + 4, 5, 8, 1, "#c4a070"); px(c, o + 4, 9, 2, 5, "#4a3220"); px(c, o + 10, 9, 2, 5, "#4a3220"); return true;
    case "Chair": px(c, o + 4, 1, 8, 3, "#7a5a33"); px(c, o + 4, 2, 2, 8, "#5e4026"); px(c, o + 10, 2, 2, 8, "#5e4026"); px(c, o + 4, 8, 8, 3, "#b08a5a"); px(c, o + 4, 11, 2, 4, "#4a3220"); px(c, o + 10, 11, 2, 4, "#4a3220"); return true;
    case "Couch": px(c, o + 1, 4, 3, 9, "#5e4026"); px(c, o + 1, 8, 14, 4, "#6b4a2b"); px(c, o + 3, 6, 12, 3, "#d8ccb0"); px(c, o + 9, 6, 6, 3, "#3e4a6a"); px(c, o + 2, 12, 2, 2, "#4a3220"); px(c, o + 13, 12, 2, 2, "#4a3220"); return true;
    case "Rug": px(c, o + 1, 3, 14, 10, "#8a2e20"); px(c, o + 2, 4, 12, 8, "#e0d0a8"); px(c, o + 3, 5, 10, 6, "#a8412f"); px(c, o + 6, 7, 4, 2, "#d39a3a"); return true;
    case "Pelt": px(c, o + 2, 4, 12, 8, "#ece2ce"); px(c, o + 1, 5, 14, 6, "#ece2ce"); px(c, o + 4, 6, 2, 1, "#d8ccb4"); px(c, o + 9, 8, 2, 1, "#d8ccb4"); return true;
    case "LampStand": px(c, o + 7, 4, 2, 10, "#7a5a33"); px(c, o + 5, 13, 6, 2, "#5a3e22"); px(c, o + 5, 2, 6, 3, "#c4703f"); px(c, o + 10, 0, 1, 2, "#f2c14e"); return true;
    case "Basket": px(c, o + 3, 7, 10, 7, "#a8884a"); px(c, o + 2, 6, 12, 2, "#c8aa66"); px(c, o + 4, 3, 4, 4, "#e9e1cf"); px(c, o + 8, 4, 4, 3, "#a8412f"); return true;
    case "Vase": px(c, o + 5, 8, 6, 7, "#c4703f"); px(c, o + 4, 10, 8, 3, "#c4703f"); px(c, o + 4, 11, 8, 1, "#2a221c"); px(c, o + 5, 2, 2, 2, "#e8a0b0"); px(c, o + 9, 3, 2, 2, "#f2d06a"); px(c, o + 7, 4, 1, 4, "#5e7f34"); return true;
    case "Tapestry": px(c, o + 3, 1, 10, 1, "#6b4a2b"); px(c, o + 3, 2, 10, 11, "#3e4a6a"); px(c, o + 4, 3, 8, 9, "#a8412f"); px(c, o + 5, 5, 6, 1, "#d39a3a"); px(c, o + 5, 8, 6, 1, "#d39a3a"); for (let x = 3; x < 13; x += 2) px(c, o + x, 13, 1, 2, "#d39a3a"); return true;
  }
  return false;
}
