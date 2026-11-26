/**
 * Sites: places bigger than one screen. A citadel is three screens by three: a ring of Cyclopean wall runs through
 * the eight outer screens, and the ninth, in the middle, is the heart of it, with the palace. Isles lie out on the
 * open sea, one to four screens of water with land in the middle.
 *
 * Where they are is fixed by the world's seed (so every screen of one agrees about it); what they are called is
 * given when you first find one. Finding any part of a site lays out all of it: every screen of it is known from
 * then on.
 */
import { rng } from "./state";

export const SW = 40, SH = 30; // a screen, in tiles

export type SiteKind = "fortress" | "isle";
export type Fate = "brigands" | "beast" | "haunted";
export type IsleType = "nymph" | "sirens" | "goats" | "sacred" | "forge" | "reef";
export type Side = "N" | "S" | "E" | "W";

/** What the seed says is at a place: pure, the same every time it is asked. */
export interface SiteInfo {
  id: string; kind: SiteKind; x0: number; y0: number; w: number; h: number; seed: number;
  /** Citadels: the side the main gate faces, and what holds the place now. */
  gate?: Side; fate?: Fate; beast?: string;
  /** Isles: what kind. */
  isle?: IsleType;
}

/** What you know of a site once found: its name, and what has been done there. */
export interface SiteRec {
  kind: SiteKind; name: string; x0: number; y0: number; w: number; h: number; seed: number; found: number; terrain: number;
  gate?: Side; fate?: Fate; beast?: string; isle?: IsleType; god: string; line: string;
  /** The citadel's trouble ended (brigands driven out, the beast dead, the shades at rest). */
  cleared?: boolean;
  /** The treasury (or the wreck, the god's gift) taken. */
  treasury?: boolean;
  /** Storage jars and other one-time searches already made: "wx,wy,tx,ty". */
  looted?: string[];
  /** Things done once a season or once a day: key → season key or day. */
  marks?: Record<string, string | number>;
}

const hash = (seed: number, a: number, b: number, salt: number) => {
  let h = (seed ^ Math.imul(a, 0x27d4eb2d) ^ Math.imul(b, 0x165667b1) ^ salt) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};

// ------------------------------------------------------------------ citadels
/** Citadels: one in some of each 10×10 block of the world, never within three screens of home, never across the village road. */
const FR = 10;
const BEASTS = ["lion", "stymphalian", "sphinx"];
export function fortressAt(seed: number, wx: number, wy: number): SiteInfo | null {
  const rx = Math.floor(wx / FR), ry = Math.floor(wy / FR);
  const s = hash(seed, rx, ry, 0xf0e7), r = rng(s);
  if (r() > 0.55) return null;
  const x0 = rx * FR + 1 + Math.floor(r() * (FR - 4)), y0 = ry * FR + 1 + Math.floor(r() * (FR - 4));
  if (wx < x0 || wy < y0 || wx > x0 + 2 || wy > y0 + 2) return null;
  // Far enough from home, and clear of the village road (the column x = 0 running south).
  for (let y = y0; y <= y0 + 2; y++) for (let x = x0; x <= x0 + 2; x++) if (Math.max(Math.abs(x), Math.abs(y)) < 3 || x === 0) return null;
  const gate = (["N", "S", "E", "W"] as Side[])[Math.floor(r() * 4)];
  const fr = r(), fate: Fate = fr < 0.4 ? "brigands" : fr < 0.72 ? "beast" : "haunted";
  return { id: `F${x0},${y0}`, kind: "fortress", x0, y0, w: 3, h: 3, seed: s, gate, fate, beast: BEASTS[Math.floor(r() * BEASTS.length)] };
}

/** The legendary citadels, named in the order you find them. */
export const CITADELS: { name: string; god: string; line: string; fate?: Fate; beast?: string }[] = [
  { name: "Tiryns", god: "Hera", line: "Tiryns of the great walls, raised by the Cyclopes for King Proitos; Herakles set out on his labors from here." },
  { name: "Mycenae", god: "Hera", line: "Mycenae, rich in gold, Agamemnon's citadel; the curse of the house of Atreus lies on it still.", fate: "haunted" },
  { name: "the Cadmeia", god: "Ares", line: "The Cadmeia, citadel of Thebes, founded by Cadmus where he sowed the dragon's teeth.", fate: "beast", beast: "sphinx" },
  { name: "Pylos", god: "Poseidon", line: "Sandy Pylos, the palace of old Nestor, where they sacrificed black bulls to Poseidon on the shore." },
  { name: "Midea", god: "Hera", line: "Midea on its crag, Perseus' city, guarding the road over the hills." },
  { name: "Gla", god: "Athena", line: "Gla: a vast fortress on a rock, whose builders no one remembers." },
  { name: "Iolkos", god: "Hera", line: "Iolkos, Pelias' citadel, where Jason came down from the mountain with one sandal." },
  { name: "Orchomenos", god: "Dionysus", line: "Orchomenos of the Minyans, whose treasury was the wonder of the world." },
  { name: "Larisa", god: "Athena", line: "Larisa, the high citadel of Argos." },
  { name: "Kalydon", god: "Artemis", line: "Kalydon, Meleager's city, which Artemis punished with the great boar." },
  { name: "Asine", god: "Apollo", line: "Asine on its headland, which Homer names among the cities that sailed for Troy." },
  { name: "Amyklai", god: "Apollo", line: "Amyklai, where Apollo's friend Hyakinthos fell, and the flower sprang from his blood." },
];

/** One tile of a citadel's layout, in the coordinates of the whole site (120 × 90 tiles). */
export interface FortCell { o?: number; g?: number }
export interface FortLayout {
  cells: (FortCell | undefined)[][];
  /** Props, in site tiles: [key, x, y, solid]. */
  props: [string, number, number, boolean][];
  pithoi: [number, number][];
  hearth: [number, number]; treasury: [number, number]; throne: [number, number]; altar: [number, number];
  tholos: [number, number]; cistern: [number, number]; gateAt: [number, number];
}

/** Tile numbers, passed in so this module needn't know the tile sheet. */
export interface Tiles { WALL: number; FLAGS: number; COLUMN: number; STONE: number; BOULDER: number; BRUSH: number; TREE: number; OLIVE: number; WATER: number; PATH: number; DIRT: number; LIMESTONE: number; FLOWERS: number }

/**
 * The citadel: a ring of wall wandering round the middle of the site, a gate in it on the gate side and a postern
 * opposite; inside, a court and the palace in the middle screen, storerooms and houses about, a cistern; outside,
 * a road up to the gate and a beehive tomb.
 */
export function fortressLayout(si: SiteInfo, T: Tiles): FortLayout {
  const W = 120, H = 90, r = rng(si.seed ^ 0x51a7);
  const cells: (FortCell | undefined)[][] = []; for (let y = 0; y < H; y++) cells.push(new Array(W).fill(undefined));
  const set = (x: number, y: number, c: FortCell) => { if (x >= 0 && y >= 0 && x < W && y < H) cells[y][x] = { ...cells[y][x], ...c }; };
  const cx = 60, cy = 45, A = 37, B = 28, p1 = r() * 6.28, p2 = r() * 6.28;
  // The ring: a rounded square whose radius wanders a little.
  const norm = (x: number, y: number) => { const u = (x - cx) / A, v = (y - cy) / B; return Math.pow(Math.pow(Math.abs(u), 4) + Math.pow(Math.abs(v), 4), 0.25); };
  const rad = (x: number, y: number) => { const t = Math.atan2((y - cy) / B, (x - cx) / A); return 1 + 0.05 * Math.sin(3 * t + p1) + 0.03 * Math.sin(5 * t + p2); };
  const TH = 0.085;
  const ruined = si.fate !== "haunted" ? 0.04 : 0.02;
  const gate = si.gate ?? "S";
  const onAxis = (x: number, y: number, w: number, side: Side) => (side === "N" || side === "S" ? Math.abs(x + 0.5 - cx) <= w : Math.abs(y + 0.5 - cy) <= w) && (side === "N" ? y < cy : side === "S" ? y > cy : side === "W" ? x < cx : x > cx);
  const opp: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };
  let gateAt: [number, number] = [cx, cy];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = norm(x + 0.5, y + 0.5), R = rad(x + 0.5, y + 0.5);
    if (n <= R && n > R - TH) {
      if (onAxis(x, y, 1.6, gate)) { set(x, y, { o: -1, g: T.PATH }); gateAt = [x, y]; continue; } // the gate
      if (onAxis(x, y, 0.6, opp[gate])) { set(x, y, { o: -1, g: T.DIRT }); continue; } // the postern
      set(x, y, { o: r() < ruined ? T.STONE : T.WALL, g: T.DIRT });
    } else if (n <= R - TH) {
      // Inside the walls: trodden ground, a little rubble and overgrowth.
      const k = r();
      set(x, y, { o: k < 0.03 ? T.STONE : k < 0.06 ? T.BRUSH : k < 0.07 ? T.OLIVE : -1, g: r() < 0.6 ? T.LIMESTONE : T.DIRT });
    } else if (n <= R + 0.04) set(x, y, { o: r() < 0.15 ? T.STONE : -1 }); // a clear strip below the walls
  }
  // Gateposts: great stones either side of the gate.
  const props: FortLayout["props"] = [];
  // The road: from the edge of the site on the gate side, up through the gate, round the palace to its court.
  const road = (pts: [number, number][]) => {
    for (let k = 1; k < pts.length; k++) {
      let [x, y] = pts[k - 1]; const [tx, ty] = pts[k], horiz = y === ty;
      for (let i = 0; i < 200; i++) {
        for (let d = -1; d <= 1; d++) { const [ax, ay] = horiz ? [x, y + d] : [x + d, y]; if (cells[ay]?.[ax]?.o !== T.WALL) set(ax, ay, { o: -1, g: T.PATH }); }
        if (x === tx && y === ty) break;
        if (x !== tx) x += Math.sign(tx - x); else y += Math.sign(ty - y);
      }
    }
  };
  const cty = cy + 1; // the road's end, in the court before the palace
  road(gate === "S" ? [[cx, H - 1], [cx, cty]] : gate === "N" ? [[cx, 0], [cx, cy - 22], [cx - 15, cy - 22], [cx - 15, cty], [cx, cty]]
    : gate === "W" ? [[0, cy], [cx - 15, cy], [cx - 15, cty], [cx, cty]] : [[W - 1, cy], [cx + 15, cy], [cx + 15, cty], [cx, cty]]);
  // The palace: a megaron with its porch, its hearth and four columns, and a throne; a court before it with the altar.
  const mx0 = cx - 7, my0 = cy - 11, mw = 14, mh = 9;
  for (let y = my0; y < my0 + mh; y++) for (let x = mx0; x < mx0 + mw; x++) {
    const wall = x === mx0 || x === mx0 + mw - 1 || y === my0 || y === my0 + mh - 1;
    const door = y === my0 + mh - 1 && Math.abs(x + 0.5 - cx) <= 1;
    set(x, y, { o: wall && !door ? T.WALL : -1, g: T.FLAGS });
  }
  for (const [dx, dy] of [[-3, 3], [2, 3], [-3, 6], [2, 6]]) set(cx + dx, my0 + dy, { o: T.COLUMN });
  const hearth: [number, number] = [cx, my0 + 5];
  const throne: [number, number] = [mx0 + mw - 3, my0 + 4];
  // The treasury: a small strong room on the palace's west side, its door into the hall.
  const tx0 = mx0 - 5, ty0 = my0 + 1;
  for (let y = ty0; y < ty0 + 5; y++) for (let x = tx0; x < tx0 + 6; x++) {
    const wall = x === tx0 || x === tx0 + 5 || y === ty0 || y === ty0 + 4;
    set(x, y, { o: wall ? T.WALL : -1, g: T.FLAGS });
  }
  set(tx0 + 5, ty0 + 2, { o: -1 }); set(mx0, ty0 + 2, { o: -1 }); // through the shared wall into the hall
  const treasury: [number, number] = [tx0 + 2, ty0 + 2];
  // The court, paved, south of the hall, with the altar.
  for (let y = my0 + mh; y < my0 + mh + 8; y++) for (let x = cx - 8; x < cx + 8; x++) set(x, y, { o: -1, g: T.FLAGS });
  const altar: [number, number] = [cx, my0 + mh + 5];
  // Storerooms and houses about the inner ground, each with its storage jars.
  const pithoi: [number, number][] = [];
  const inside = (x: number, y: number) => norm(x + 0.5, y + 0.5) <= rad(x + 0.5, y + 0.5) - TH - 0.03;
  const busy = (x: number, y: number) => (x >= tx0 - 2 && x <= mx0 + mw + 1 && y >= my0 - 2 && y <= my0 + mh + 9) || cells[y]?.[x]?.g === T.PATH;
  for (let k = 0, made = 0; k < 400 && made < 14; k++) {
    const w = 5 + Math.floor(r() * 3), h = 4 + Math.floor(r() * 2), x0 = 14 + Math.floor(r() * (W - 28)), y0 = 10 + Math.floor(r() * (H - 20));
    let ok = true;
    for (let y = y0 - 1; y <= y0 + h && ok; y++) for (let x = x0 - 1; x <= x0 + w && ok; x++) if (!inside(x, y) || busy(x, y) || cells[y][x]?.o === T.WALL || cells[y][x]?.o === T.COLUMN) ok = false;
    // Not across the seams between screens, so no room is cut in half by an edge.
    if (Math.floor(x0 / SW) !== Math.floor((x0 + w) / SW) || Math.floor(y0 / SH) !== Math.floor((y0 + h) / SH)) ok = false;
    if (!ok) continue;
    made++;
    const doorX = x0 + 1 + Math.floor(r() * (w - 2));
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const wall = x === x0 || x === x0 + w - 1 || y === y0 || y === y0 + h - 1;
      set(x, y, { o: wall && !(y === y0 + h - 1 && x === doorX) ? (r() < ruined * 3 ? T.STONE : T.WALL) : -1, g: T.DIRT });
    }
    const n = 1 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) pithoi.push([x0 + 1 + (i % (w - 2)), y0 + 1]);
  }
  // A cistern: still water under a stone lip, somewhere inside (not in the middle screen).
  let cistern: [number, number] = [cx - 25, cy + 18];
  for (let k = 0; k < 200; k++) {
    const x = 12 + Math.floor(r() * (W - 24)), y = 8 + Math.floor(r() * (H - 16));
    if (x >= 40 && x < 80 && y >= 30 && y < 60) continue;
    let ok = true; for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 3; xx <= x + 3; xx++) if (!inside(xx, yy) || busy(xx, yy) || cells[yy][xx]?.o !== -1 && cells[yy][xx]?.o !== T.STONE && cells[yy][xx]?.o !== T.BRUSH && cells[yy][xx]?.o !== T.OLIVE) ok = false;
    if (Math.floor((x - 3) / SW) !== Math.floor((x + 3) / SW) || Math.floor((y - 2) / SH) !== Math.floor((y + 2) / SH)) ok = false;
    if (ok) { cistern = [x, y]; break; }
  }
  for (let yy = cistern[1] - 1; yy <= cistern[1] + 1; yy++) for (let xx = cistern[0] - 2; xx <= cistern[0] + 2; xx++) set(xx, yy, { o: Math.abs(yy - cistern[1]) < 1 && Math.abs(xx - cistern[0]) < 2 ? T.WATER : -1, g: T.FLAGS });
  // A beehive tomb outside the walls, its passage facing away: in a corner screen the road doesn't cross.
  const corners: [number, number][] = [[14, 12], [106, 12], [14, 78], [106, 78]];
  const tholos = corners[Math.floor(r() * 4)];
  for (let y = tholos[1] - 4; y <= tholos[1] + 4; y++) for (let x = tholos[0] - 4; x <= tholos[0] + 4; x++) {
    const d = Math.hypot(x - tholos[0], (y - tholos[1]) * 1.1);
    if (d <= 4.2) set(x, y, { o: d > 3 ? T.BOULDER : -1, g: T.DIRT });
  }
  const dx = tholos[0] < cx ? 1 : -1; // the passage runs toward the citadel
  for (let i = 3; i <= 7; i++) for (const off of [-1, 0, 1]) set(tholos[0] + dx * i, tholos[1] + off, { o: off === 0 ? -1 : T.STONE, g: T.DIRT });
  return { cells, props, pithoi, hearth, treasury, throne, altar, tholos, cistern, gateAt };
}

// ------------------------------------------------------------------ isles
const IR = 5;
const ISLE_W: [IsleType, number][] = [["reef", 3], ["goats", 2], ["sacred", 1.5], ["sirens", 1.6], ["nymph", 1.3], ["forge", 1.2]];
/** Isles out on the sea: about one in each 5×5 block of the world, at least two screens from home. Only where the sea is. */
export function isleAt(seed: number, wx: number, wy: number): SiteInfo | null {
  const rx = Math.floor(wx / IR), ry = Math.floor(wy / IR);
  const s = hash(seed, rx, ry, 0x15e1), r = rng(s);
  if (r() > 0.5) return null;
  let k = r() * ISLE_W.reduce((n, [, w]) => n + w, 0), isle: IsleType = "reef";
  for (const [t, w] of ISLE_W) if ((k -= w) <= 0) { isle = t; break; }
  const sz = r(), [w, h] = isle === "reef" ? [1, 1] : sz < 0.5 ? [1, 1] : sz < 0.7 ? [2, 1] : sz < 0.85 ? [1, 2] : [2, 2];
  const x0 = rx * IR + Math.floor(r() * (IR - w)), y0 = ry * IR + Math.floor(r() * (IR - h));
  if (wx < x0 || wy < y0 || wx >= x0 + w || wy >= y0 + h) return null;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (Math.max(Math.abs(x), Math.abs(y)) < 2) return null;
  return { id: `I${x0},${y0}`, kind: "isle", x0, y0, w, h, seed: s, isle };
}

export const ISLES: Record<IsleType, { names: string[]; god: string; land: number; line: string }> = {
  nymph: { names: ["Ogygia", "Aiaia"], god: "Hermes", land: 1, line: "A green island, sweet with cedar smoke: a nymph's isle." },
  sirens: { names: ["Anthemoessa"], god: "Apollo", land: 1, line: "The flowery isle, Anthemoessa. The meadow is starred with flowers, and with bones." },
  goats: { names: ["Goat Isle"], god: "Artemis", land: 2, line: "A wooded island where wild goats run without fear: no one hunts here, and no one has ever farmed it." },
  sacred: { names: ["Ortygia"], god: "Apollo", land: 12, line: "Ortygia, the quail isle, where Leto bore Artemis. A single palm stands over an old altar." },
  forge: { names: ["Lemnos"], god: "Hephaestus", land: 11, line: "Lemnos, where Hephaestus fell from heaven and kept his forge. The ground is warm, and smoke rises from cracks in it." },
  reef: { names: ["a nameless reef"], god: "Poseidon", land: 7, line: "A low reef of sand and rock, a ship's ribs bleaching on it." },
};

/** Is a tile of the isle (site coordinates) dry land? A wandering blob in the middle, smaller for a reef. */
export function isleLand(si: SiteInfo) {
  const W = si.w * SW, H = si.h * SH, r = rng(si.seed ^ 0x1a7d);
  const cx = W / 2, cy = H / 2, scale = si.isle === "reef" ? 0.32 : 0.82;
  const A = (W / 2 - 6) * scale, B = (H / 2 - 5) * scale, p = [r() * 6.28, r() * 6.28, r() * 6.28];
  return (x: number, y: number) => {
    const u = (x + 0.5 - cx) / A, v = (y + 0.5 - cy) / B, t = Math.atan2(v, u);
    const R = 1 + 0.12 * Math.sin(2 * t + p[0]) + 0.08 * Math.sin(3 * t + p[1]) + 0.05 * Math.sin(5 * t + p[2]);
    return Math.hypot(u, v) / R; // < 1 is land; near 1 is the beach
  };
}

/** Where on the site this screen sits, in words: "the southwest corner", "the north wall", "the heart of it". */
export function partOf(si: { x0: number; y0: number; w: number; h: number }, wx: number, wy: number): string {
  const ix = wx - si.x0, iy = wy - si.y0;
  const ns = si.h === 1 ? "" : iy === 0 ? "north" : iy === si.h - 1 ? "south" : "";
  const ew = si.w === 1 ? "" : ix === 0 ? "west" : ix === si.w - 1 ? "east" : "";
  if (!ns && !ew) return "the heart of it";
  if (ns && ew) return `the ${ns}${ew} corner`;
  return `the ${ns || ew} side`;
}
