/**
 * The living world: small things that happen around you and change nothing in play.
 * Butterflies over flowers, swallows overhead, fireflies at dusk, falling leaves in autumn,
 * ripples on still water, chimney smoke, morning mist, drifting cloud shadows and wind on open ground.
 * What appears depends on the season, the hour, the day's weather and the land.
 */
import Phaser from "phaser";
import { T, TILE } from "./textures";
import type { GameState } from "./state";

export interface AmbienceOpts {
  outdoor: boolean;
  terrain: number; // TERRAINS n (the farm and village count as Cultivated Farmlands, 3)
  layer?: Phaser.Tilemaps.TilemapLayer; // the objects layer, to find flowers, trees and water
  chimneys?: [number, number][]; // world positions smoke rises from
}

interface Mote { img: Phaser.GameObjects.Image; vx: number; vy: number; t: number; life: number; kind: string; hx?: number; hy?: number; ph?: number }

const r = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <X>(xs: X[]) => xs[Math.floor(Math.random() * xs.length)];
const BUTTERFLY_COLORS = [0xf2f0e8, 0xf2c14e, 0xe8a060, 0xb8d8f0, 0xe0a8d8];
const LEAF_COLORS = [0xc0782e, 0xa85a26, 0xd8a040, 0x8a4a22];

export class Ambience {
  motes: Mote[] = [];
  flowers: [number, number][] = [];
  trees: [number, number][] = [];
  water: [number, number][] = [];
  timers: Record<string, number> = { bird: r(4, 12), leaf: 0, ripple: 1, smoke: 0, wind: 0 };
  mist: Phaser.GameObjects.Image[] = [];
  shadows: Phaser.GameObjects.Image[] = [];

  constructor(public scene: Phaser.Scene, public G: GameState, public o: AmbienceOpts) {
    o.layer?.forEachTile((t) => {
      if (t.index === T.FLOWERS) this.flowers.push([t.x, t.y]);
      else if (t.index === T.TREE || t.index === T.PINE || t.index === T.OLIVE) this.trees.push([t.x, t.y]);
      else if (t.index === T.WATER) this.water.push([t.x, t.y]);
    });
    if (!o.outdoor) return;
    const w = G.data.weather, W = (o.layer?.width ?? 640), H = (o.layer?.height ?? 480);
    // Cloud shadows drift across the land: many on a cloudy day, a couple on a clear one, none in rain.
    const nShadows = w === "cloudy" ? 6 : w === "rain" ? 0 : w === "wind" ? 3 : 2;
    for (let i = 0; i < nShadows; i++)
      this.shadows.push(scene.add.image(r(0, W), r(0, H), "cloudShadow").setScale(r(2.2, 3.6), r(1.4, 2.2)).setAlpha(w === "cloudy" ? 0.13 : 0.09).setDepth(99000));
    // Mist lies in the low places on a misty morning (and in the marsh most mornings).
    if (w === "mist" || o.terrain === 5)
      for (let i = 0; i < 14; i++) this.mist.push(scene.add.image(r(0, W), r(0, H), "mist").setScale(r(1.6, 2.8), r(0.8, 1.3)).setAlpha(0).setDepth(99001));
  }

  get season() { return this.G.month.season; }
  get day() { return this.G.isDay; }
  get dusk() { return this.G.data.clock >= this.G.daylight - 1.2; }
  /** The part of the world on screen, a little enlarged. */
  view() { const v = this.scene.cameras.main.worldView; return new Phaser.Geom.Rectangle(v.x - 24, v.y - 24, v.width + 48, v.height + 48); }
  inView(tiles: [number, number][]) { const v = this.view(); return tiles.filter(([x, y]) => v.contains(x * TILE + 8, y * TILE + 8)); }

  update(dt: number, paused: boolean) {
    if (!this.o.outdoor) return;
    const w = this.G.data.weather, s = this.season;
    if (!paused) {
      const wind = w === "wind" ? 1 : 0.35;
      // Cloud shadows, moving with the wind.
      for (const c of this.shadows) { c.x += dt * 9 * (1 + wind); c.y += dt * 2; const W = (this.o.layer?.width ?? 640); if (c.x > W + 200) { c.x = -200; c.y = r(0, this.o.layer?.height ?? 480); } }
      // Mist thins as the morning goes on.
      const mistA = (w === "mist" ? 0.6 : 0.3) * Phaser.Math.Clamp(1 - (this.G.data.clock - 1) / 2.5, 0, 1);
      for (const m of this.mist) { m.x += dt * 3; m.setAlpha(Phaser.Math.Linear(m.alpha, mistA, Math.min(1, dt * 1.5))); }

      const rain = w === "rain";
      // Butterflies about the flowers, on fine days in spring and summer.
      const nb = this.motes.filter((m) => m.kind === "butterfly").length;
      if (this.day && !rain && (s === "Spring" || s === "Summer") && nb < 4) {
        const near = this.inView(this.flowers);
        if (near.length && Math.random() < dt * 0.6) {
          const [fx, fy] = pick(near);
          const img = this.scene.add.image(fx * TILE + 8, fy * TILE + 4, "butterfly", 0).setTint(pick(BUTTERFLY_COLORS)).setDepth(99010);
          this.motes.push({ img, vx: 0, vy: 0, t: 0, life: r(14, 30), kind: "butterfly", hx: fx * TILE + 8, hy: fy * TILE + 4, ph: r(0, 6) });
        }
      }
      // Swallows cut across overhead, their shadows racing below.
      if (this.day && !rain && (this.timers.bird -= dt) <= 0) {
        this.timers.bird = r(10, 30);
        const v = this.scene.cameras.main.worldView, left = Math.random() < 0.5, y = r(v.y + 20, v.bottom - 40);
        for (let i = 0; i < (Math.random() < 0.3 ? 3 : 1); i++) {
          const img = this.scene.add.image(left ? v.x - 20 - i * 14 : v.right + 20 + i * 14, y + i * 7, "swallow", 0).setFlipX(!left).setDepth(99020);
          const sh = this.scene.add.image(img.x, img.y + 34, "swallow", 0).setTint(0x000000).setAlpha(0.18).setFlipX(!left).setDepth(2);
          this.motes.push({ img, vx: left ? 150 : -150, vy: r(-12, 12), t: 0, life: 6, kind: "bird" });
          this.motes.push({ img: sh, vx: left ? 150 : -150, vy: 0, t: 0, life: 6, kind: "birdShadow" });
        }
      }
      // Fireflies at dusk and after, in the warm months, in green places.
      const nf = this.motes.filter((m) => m.kind === "firefly").length;
      if (this.dusk && !rain && s !== "Winter" && [1, 2, 3, 5].includes(this.o.terrain) && nf < 12 && Math.random() < dt * 2) {
        const v = this.view(), img = this.scene.add.image(r(v.x, v.right), r(v.y, v.bottom), "focusGlow").setScale(0.09).setTint(0xd8ff70).setBlendMode(Phaser.BlendModes.ADD).setDepth(99030).setAlpha(0);
        this.motes.push({ img, vx: r(-6, 6), vy: r(-6, 6), t: 0, life: r(4, 9), kind: "firefly", ph: r(0, 6) });
      }
      // Falling leaves under the trees in autumn (and a few in a high wind).
      if ((s === "Autumn" || w === "wind") && (this.timers.leaf -= dt) <= 0) {
        this.timers.leaf = s === "Autumn" ? 0.35 : 1.2;
        const near = this.inView(this.trees);
        if (near.length) {
          const [tx, ty] = pick(near);
          const img = this.scene.add.image(tx * TILE + r(2, 14), ty * TILE + r(0, 6), "leaf").setTint(s === "Autumn" ? pick(LEAF_COLORS) : 0x6a8a3a).setDepth(ty * TILE + 30);
          this.motes.push({ img, vx: r(4, 14) * (w === "wind" ? 3 : 1), vy: r(8, 14), t: 0, life: r(1.6, 2.6), kind: "leaf", ph: r(0, 6) });
        }
      }
      // Rings spread on still water: a fish, a frog, a raindrop.
      if ((this.timers.ripple -= dt) <= 0) {
        this.timers.ripple = rain ? 0.12 : r(1.2, 3.5);
        const near = this.inView(this.water);
        if (near.length) {
          const [tx, ty] = pick(near), x = tx * TILE + r(3, 13), y = ty * TILE + r(4, 12);
          const ring = this.scene.add.ellipse(x, y, 2, 1).setStrokeStyle(1, 0xe8f4ff, 0.7).setDepth(3);
          this.scene.tweens.add({ targets: ring, scaleX: 6, scaleY: 6, alpha: 0, duration: rain ? 700 : 1300, onComplete: () => ring.destroy() });
        }
      }
      // Smoke from the chimneys, leaning with the wind.
      if (this.o.chimneys?.length && (this.timers.smoke -= dt) <= 0) {
        this.timers.smoke = 0.5;
        for (const [cx, cy] of this.o.chimneys) {
          const img = this.scene.add.image(cx + r(-1, 1), cy, "puff").setScale(0.35).setAlpha(0.55).setDepth(cy + 400);
          this.motes.push({ img, vx: (w === "wind" ? 14 : 4) + r(-1, 2), vy: -r(7, 10), t: 0, life: 3.2, kind: "smoke" });
        }
      }
      // Wind runs over open ground in streaks.
      if ((w === "wind" || [7, 10, 12].includes(this.o.terrain)) && !rain && (this.timers.wind -= dt) <= 0) {
        this.timers.wind = w === "wind" ? 0.25 : 0.9;
        const v = this.view(), img = this.scene.add.image(v.x - 10, r(v.y, v.bottom), "streak").setAlpha(0).setDepth(99015);
        this.motes.push({ img, vx: r(110, 160), vy: r(-4, 4), t: 0, life: v.width / 130, kind: "wind" });
      }
    }
    // Move and age everything.
    for (const m of [...this.motes]) {
      if (paused) continue;
      m.t += dt;
      if (m.t >= m.life) { m.img.destroy(); this.motes.splice(this.motes.indexOf(m), 1); continue; }
      const u = m.t / m.life;
      switch (m.kind) {
        case "butterfly": {
          const ph = m.ph! + m.t * 1.3;
          m.img.setPosition(m.hx! + Math.sin(ph) * 14 + Math.sin(ph * 2.3) * 5, m.hy! + Math.cos(ph * 1.7) * 8 - 6 + Math.sin(m.t * 9) * 1.5);
          m.img.setFrame(Math.floor(m.t * 10) % 2).setAlpha(u > 0.9 ? (1 - u) * 10 : 1);
          if (u > 0.92) m.hy! -= dt * 30; // flutters off
          break;
        }
        case "bird": case "birdShadow": m.img.x += m.vx * dt; m.img.y += m.vy * dt; m.img.setFrame(Math.floor(m.t * 8) % 2); break;
        case "firefly": m.img.x += m.vx * dt + Math.sin(m.t * 2 + m.ph!) * 0.2; m.img.y += m.vy * dt; m.img.setAlpha(Math.max(0, Math.sin(m.t * 2.2 + m.ph!)) * 0.9 * Math.min(1, (1 - u) * 4)); break;
        case "leaf": m.img.x += (m.vx + Math.sin(m.t * 5 + m.ph!) * 12) * dt; m.img.y += m.vy * dt; m.img.setAngle(Math.sin(m.t * 6) * 40).setAlpha(1 - u * u); break;
        case "smoke": m.img.x += m.vx * dt; m.img.y += m.vy * dt; m.img.setScale(0.35 + u * 0.9).setAlpha(0.5 * (1 - u)); break;
        case "wind": m.img.x += m.vx * dt; m.img.y += m.vy * dt; m.img.setAlpha(Math.sin(u * Math.PI) * 0.5); break;
      }
    }
  }
}

/** The ground details each land scatters: pebbles, leaves, tufts, a ring of mushrooms, an old skull. */
export const DETAILS: Record<number, [number, number][]> = {
  1: [[T.BLOOMS, 4], [T.TUFT, 3], [T.PEBBLES, 1]],
  2: [[T.LEAVES, 4], [T.TWIGS, 3], [T.TUFT, 1], [T.MUSHRING, 0.4]],
  3: [[T.TUFT, 3], [T.PEBBLES, 2], [T.BLOOMS, 1], [T.TWIGS, 0.5]],
  4: [[T.PEBBLES, 5], [T.TUFT, 1], [T.SKULL, 0.2]],
  5: [[T.TUFT, 4], [T.TWIGS, 1], [T.LEAVES, 1]],
  7: [[T.SHELLS, 3], [T.PEBBLES, 2], [T.TWIGS, 1]],
  8: [[T.CRACKS, 4], [T.PEBBLES, 2], [T.SKULL, 0.4]],
  9: [[T.PEBBLES, 3], [T.TUFT, 2], [T.BLOOMS, 1]],
  10: [[T.TUFT, 5], [T.BLOOMS, 1.5], [T.PEBBLES, 0.5]],
  11: [[T.PEBBLES, 3], [T.CRACKS, 2], [T.SKULL, 0.4], [T.TWIGS, 1]],
  12: [[T.PEBBLES, 3], [T.TUFT, 2], [T.BLOOMS, 1]],
};

/** Object kinds that take a little natural variety: a mirrored shape and a slight shift of color. */
const VARIED = [T.TREE, T.PINE, T.OLIVE, T.SAPLING, T.BRUSH, T.STONE, T.BOULDER, T.FLOWERS, T.REEDS, T.THORN];
const GREENS = [0xffffff, 0xf0fae6, 0xe6f2dc, 0xfff6e2, 0xf6f6ee];
const STONES = [0xffffff, 0xf0eee8, 0xe8e6e0, 0xfaf4ea];
const hash = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; };

/**
 * Vary the objects and ground of a map by position and season, so no two oaks or meadows look quite alike:
 * oaks turn russet in autumn and grey-bare in winter, and the ground goes gold in high summer and cool in winter.
 */
export function seasonGroundTint(G: GameState) {
  const s = G.month.season, m = G.data.month;
  return s === "Summer" ? (m === 2 ? 0xfff0cc : 0xfff8e4) : s === "Autumn" ? 0xf8ead4 : s === "Winter" ? 0xdfe4e8 : 0xffffff;
}
/**
 * How far each kind of thing may sit off the centre of its square, in pixels. Purely visual:
 * collision stays on the grid (trunk colliders are wider than the trunks, so the slack hides it).
 */
const JITTER: Record<number, number> = {
  [T.TREE]: 2, [T.PINE]: 2, [T.OLIVE]: 2, [T.SAPLING]: 3, [T.BRUSH]: 3, [T.THORN]: 3, [T.REEDS]: 3,
  [T.STONE]: 3, [T.BOULDER]: 2, [T.FLOWERS]: 4,
};
/** A fixed offset for a square, the same every visit. */
export function jitterOf(x: number, y: number, amt: number): [number, number] {
  if (amt <= 0) return [0, 0];
  const h = hash(x * 7 + 3, y * 13 + 5), n = 2 * amt + 1;
  return [(h % n) - amt, ((h >>> 9) % n) - amt];
}
/** Nudge the things on a layer off the grid. Details (pebbles, tufts, shells) wander the most. */
export function jitterLayer(layer: Phaser.Tilemaps.TilemapLayer | undefined, details = false) {
  layer?.forEachTile((t) => {
    if (t.index < 0) return;
    const amt = details ? 5 : JITTER[t.index] ?? 0;
    if (!amt) return;
    const [dx, dy] = jitterOf(t.x, t.y, amt);
    t.pixelX = t.x * t.baseWidth + dx; t.pixelY = t.y * t.baseHeight + dy;
  });
}

export function varyLayers(G: GameState, ground: Phaser.Tilemaps.TilemapLayer | undefined, objects: Phaser.Tilemaps.TilemapLayer | undefined) {
  const s = G.month.season;
  const groundTint = seasonGroundTint(G);
  ground?.forEachTile((t) => { if (t.index >= 0) t.tint = groundTint; });
  objects?.forEachTile((t) => {
    if (!VARIED.includes(t.index)) return;
    const h = hash(t.x, t.y);
    t.flipX = (h & 1) === 1;
    const rock = t.index === T.STONE || t.index === T.BOULDER;
    let tint = (rock ? STONES : GREENS)[(h >>> 3) % (rock ? STONES.length : GREENS.length)];
    if (t.index === T.TREE || t.index === T.SAPLING) {
      if (s === "Autumn") tint = [0xffa860, 0xff9850, 0xffb878, 0xf0c060][(h >>> 5) % 4];
      else if (s === "Winter") tint = [0xd8d0c4, 0xccc4b8][(h >>> 5) % 2];
    }
    if (t.index === T.BRUSH && s === "Autumn") tint = 0xf4dca8;
    t.tint = tint;
  });
  jitterLayer(objects);
}

export const SOFT_GID = 4000;
/**
 * Soften the square edges of a map's ground patches (patch over base): patch tiles that border the base are
 * eroded raggedly and laid over base ground, and base tiles beside a patch get a ragged fringe of it.
 * Returns the overlay layer (create it right after the ground layer so it draws above it, below details).
 */
export function softenPatches(map: Phaser.Tilemaps.Tilemap, _groundLayer: Phaser.Tilemaps.TilemapLayer, ground: number[][], patch: number, base: number, tint: number): Phaser.Tilemaps.TilemapLayer | null {
  const ts = map.getTileset("tilesSoft") ?? map.addTilesetImage("tilesSoft", "tilesSoft", 16, 16, 0, 0, SOFT_GID);
  if (!ts) return null;
  const soft = map.createBlankLayer("soft", ts)!;
  const H = ground.length, W = ground[0].length;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : ground[y][x]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // Base ground beside a patch gets a ragged spill of the patch along the touching sides.
    if (ground[y][x] !== base) continue;
    const m = (at(x, y - 1) === patch ? 1 : 0) | (at(x + 1, y) === patch ? 2 : 0) | (at(x, y + 1) === patch ? 4 : 0) | (at(x - 1, y) === patch ? 8 : 0);
    if (!m) continue;
    soft.putTileAt(SOFT_GID + patch * 64 + 32 + (hash(x, y) & 1) * 16 + m, x, y).tint = tint;
  }
  return soft;
}

/** Scatter ground details over the open tiles of a map, the same every visit. */
export function scatterDetails(terrain: number, seed: number, objs: number[][], blocked: (x: number, y: number) => boolean, density = 0.07): number[][] {
  const list = DETAILS[terrain] ?? DETAILS[3];
  const total = list.reduce((n, [, w]) => n + w, 0);
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
  return objs.map((row, y) => row.map((o, x) => {
    if (o !== -1 || blocked(x, y) || rnd() >= density) return -1;
    let k = rnd() * total;
    for (const [tile, w] of list) { if ((k -= w) <= 0) return tile; }
    return list[0][0];
  }));
}
