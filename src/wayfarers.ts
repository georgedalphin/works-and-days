/**
 * Wayfarers: people met on the way. A traveler on the road, a shepherd with his flock, a hunter after deer,
 * a root-cutter bent over her herbs, a camp of travelers round their fire, a sacred procession, and now and then
 * brigands. They are rolled each time you come to a screen (and sometimes walk in while you're there), and they
 * go on their way: most want nothing, some want help, and a few want your purse.
 */
import Phaser from "phaser";
import { Walker, makeFolk, type Folk } from "./folk";
import { POSES, POSE, type FigureExtras } from "./textures";
import { Animal } from "./animals";

/** How a group moves: across the screen from one way out to another, staying at a spot, or roaming about one. */
export type WayMode = "cross" | "stay" | "roam";
/** What they are doing when they stop. */
export type WayActivity = "walk" | "chop" | "gather" | "fish" | "camp" | "hunt" | "herd" | "hurt" | "run" | "argue" | "lurk";

export interface WayRole {
  age?: "adult" | "elder" | "child";
  /** true / false, or leave it to chance. */
  female?: boolean;
  hat?: boolean; pole?: FigureExtras["pole"]; pack?: boolean;
  /** A fixed tunic color (white for pilgrims and processions, dun for brigands). */
  tunic?: string;
}

export interface WayDef {
  id: string;
  /** What you'd call them on sight. */
  title: string;
  roles: WayRole[];
  /** A chance of one more: [chance, who]. */
  extra?: [number, WayRole];
  mode: WayMode;
  activity: WayActivity;
  when: "day" | "night" | "any";
  /** The lands they are met in (empty: anywhere). */
  terrains: number[];
  /** How often, relative to the others; multiplied by `road` on a screen with a road. */
  weight: number; road?: number;
  /** Not this close to home (screens, the larger of |x| and |y|). */
  minDepth?: number;
  /** Only where there is water to fish. */
  water?: boolean;
  /** The god whose people they are. */
  god: string;
  /** What they say when you come up to them. */
  greet: string[];
  /** Things they say to each other, or to the air, as they go. */
  chatter?: string[];
  hostile?: boolean;
  /** How fast they walk, as a share of an ordinary walk. */
  pace?: number;
}

const WHITE = "#ece6d6", DUN = "#7a6a4a";
const HAT = ["#b89a5a", "#a8884a", "#c8b07a", "#8a7a52"];
const PACK = ["#8a6a42", "#a07a4a", "#6a5a3a"];

export const WAYFARERS: WayDef[] = [
  // ---- alone
  { id: "traveler", title: "A traveler", roles: [{ hat: true, pole: "staff", pack: true }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 10, road: 3, god: "Hermes",
    greet: ["\"Good road to you. Is it far to the next village, do you know?\"", "\"Hermes keep your feet. I've walked since dawn.\"", "\"Don't mind me. Just passing through, like everyone.\""],
    chatter: ["Long road.", "My feet...", "Hermes, guide me."] },
  { id: "peddler", title: "A peddler", roles: [{ hat: true, pack: true }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 6, road: 3, god: "Hermes",
    greet: ["\"Needles, thread, a little salt, a little oil! Something for the road?\"", "\"You've the look of someone who needs a good torch. Or two.\""], chatter: ["Needles! Thread!", "Oil, salt, torches!"] },
  { id: "pilgrim", title: "A pilgrim", roles: [{ pole: "staff", tunic: WHITE }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 5, road: 2.5, god: "Apollo",
    greet: ["\"I'm walking to the god, to ask him a question. Is there a shrine near here, do you know?\"", "\"A vow is a vow. I said I would walk it, so I walk it.\""], chatter: ["...and keep me pure...", "Not far now."] },
  { id: "rhapsode", title: "A wandering singer", roles: [{ pole: "staff", hat: true, tunic: "#7a3a6a" }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 3, road: 2.5, god: "Apollo",
    greet: ["\"Sing, Muse, of the wrath... no, no, you've heard that one. A rhapsode, friend, at your service. A song for a crust?\"", "\"I sing at weddings and funerals and anything between. What about you?\""],
    chatter: ["Sing, goddess...", "Tell me, Muse, of the man...", "La, la..."] },
  { id: "runner", title: "A runner", roles: [{ tunic: "#e9e1cf" }], mode: "cross", activity: "run", when: "any", terrains: [], weight: 2.5, road: 3, god: "Hermes", pace: 3.4,
    greet: ["\"Can't stop! Message!\""], chatter: ["Make way!", "Message!"] },
  { id: "hunter", title: "A hunter", roles: [{ pole: "bow", tunic: "#6f8a3a" }], extra: [0.35, { age: "child", female: false, tunic: "#6f8a3a" }], mode: "roam", activity: "hunt", when: "day", terrains: [1, 2, 4, 9, 10, 12], weight: 8, god: "Artemis",
    greet: ["\"Quiet! You'll scare them off. ...Well, they're scared now. Hello.\"", "\"Artemis gives, and Artemis takes. Today she's mostly taking.\""], chatter: ["Shh.", "There...", "Downwind, boy."] },
  { id: "herder", title: "A shepherd with his flock", roles: [{ pole: "staff", hat: true, female: false }], extra: [0.3, { age: "child", pole: "staff" }], mode: "roam", activity: "herd", when: "day", terrains: [1, 3, 9, 10, 11, 12], weight: 9, god: "Hermes", pace: 0.6,
    greet: ["\"Hup, hup! Mind the goats, they'll eat your cloak.\"", "\"Pan keep the wolves away. Have you seen any, coming this way?\"", "\"Good grazing here, while it lasts.\""], chatter: ["Hup! Hup!", "Come on, you.", "Ho, there!"] },
  { id: "woodcutter", title: "A woodcutter", roles: [{ female: false, tunic: "#5a4a3a" }], mode: "stay", activity: "chop", when: "day", terrains: [2, 4, 9], weight: 6, god: "Athena",
    greet: ["\"Stand clear! When she falls, she falls where she likes.\"", "\"Oak for the charcoal-burners, pine for the shipwrights. I cut, they carry.\""] },
  { id: "herbwoman", title: "A root-cutter", roles: [{ female: true, age: "elder", pack: true }], mode: "roam", activity: "gather", when: "any", terrains: [1, 2, 5, 9], weight: 5, god: "Hecate",
    greet: ["\"Hush. You don't speak while the root comes up. ...There. Now you may.\"", "\"Rue for the eyes, mint for the belly, and other things for other things.\""] },
  { id: "fisher", title: "A fisherman", roles: [{ hat: true, female: false }], mode: "stay", activity: "fish", when: "day", terrains: [], water: true, weight: 7, god: "Poseidon",
    greet: ["\"Shh, you'll frighten them. They hear footsteps, you know.\"", "\"Poseidon's mood is the sea's mood. Today he's sulking.\""] },
  { id: "wounded", title: "A wounded traveler", roles: [{ pack: true }], mode: "stay", activity: "hurt", when: "day", terrains: [], weight: 3, minDepth: 2, god: "Zeus",
    greet: ["\"Thank the gods. I fell on the stones, two days... I can't walk. Have you anything to eat?\""] },
  { id: "parched", title: "A traveler, parched", roles: [{ hat: true, pack: true }], mode: "stay", activity: "hurt", when: "day", terrains: [8, 11], weight: 6, god: "Zeus",
    greet: ["\"Water... please. My skin's empty and the next spring is a day off.\""] },

  // ---- two together
  { id: "pilgrims", title: "Two pilgrims", roles: [{ pole: "staff", tunic: WHITE }, { pole: "staff", tunic: WHITE }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 4, road: 2.5, god: "Apollo",
    greet: ["\"We go to give thanks. Our son came home from the sea.\"", "\"Is there a shrine near here? We were told there was one, but the man who told us was drunk.\""], chatter: ["Is it much further?", "Courage.", "The god sees us."] },
  { id: "couple", title: "A young couple", roles: [{ female: false, pack: true }, { female: true }], mode: "cross", activity: "walk", when: "any", terrains: [], weight: 2, road: 1.5, god: "Aphrodite", pace: 1.3,
    greet: ["\"You... you didn't see us. Please. Her father has a very large spear.\""], chatter: ["Faster!", "Are they behind us?", "Don't look back."] },
  { id: "quarrel", title: "Two farmers, quarreling", roles: [{ female: false, age: "elder" }, { female: false }], mode: "stay", activity: "argue", when: "day", terrains: [1, 3, 10], weight: 3, god: "Zeus",
    greet: ["\"You! Stranger! Settle this. That boundary stone stood THERE, by the old fig, and he moved it in the night.\""],
    chatter: ["Thief!", "Liar!", "My father's father set it!", "Zeus is witness!"] },

  // ---- many
  { id: "camp", title: "Travelers at their fire", roles: [{ hat: true, pack: true }, { pack: true }, {}], extra: [0.5, { pole: "staff" }], mode: "stay", activity: "camp", when: "any", terrains: [], weight: 5, god: "Zeus",
    greet: ["\"Come, sit, there's room by the fire. Zeus loves a stranger.\"", "\"Another traveler! Sit down, sit down. Where are you bound?\""], chatter: ["...and then the ox sat down!", "Pass the bread.", "Ha!", "More wine?"] },
  { id: "caravan", title: "A trader and his porters", roles: [{ hat: true, pole: "staff" }, { pack: true }, { pack: true }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 3, road: 4, minDepth: 1, god: "Hermes", pace: 0.8,
    greet: ["\"Wine from the islands, oil from Attica, cloth from Megara! Look, look, it costs nothing to look.\""], chatter: ["Keep up!", "Mind that jar!", "Heavy..."] },
  { id: "procession", title: "A sacred procession", roles: [{ tunic: WHITE, pole: "staff" }, { tunic: WHITE, female: true }, { tunic: WHITE }, { tunic: WHITE, female: true }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 2, road: 3, god: "", pace: 0.7,
    greet: ["The leader raises a hand in blessing without breaking step. \"We go to the god's festival. Will you walk a little with us, and sing?\""], chatter: ["Io! Io!", "Hear us...", "Paian!"] },
  { id: "soldiers", title: "A band of soldiers", roles: [{ pole: "spear", tunic: "#b0412f", female: false }, { pole: "spear", tunic: "#b0412f", female: false }, { pole: "spear", tunic: "#b0412f", female: false }], mode: "cross", activity: "walk", when: "day", terrains: [], weight: 2, road: 3, minDepth: 1, god: "Ares",
    greet: ["\"Halt. Who are you? ...A farmer. Fine. Go on. Keep off the hill road; there are brigands out.\""], chatter: ["Left, left.", "My feet are dead.", "Quiet in the ranks."] },

  // ---- rarely, trouble
  { id: "brigands", title: "Brigands", roles: [{ pole: "club", tunic: DUN, female: false }, { pole: "spear", tunic: DUN, female: false }], extra: [0.45, { pole: "bow", tunic: DUN, female: false }], mode: "stay", activity: "lurk", when: "any", terrains: [], weight: 3.5, road: 1.5, minDepth: 2, god: "Hermes", hostile: true,
    greet: ["\"Well, well. What has the road brought us? Your purse, friend, and quickly, and you keep your teeth.\""] },
];
export const wayDef = (id: string) => WAYFARERS.find((w) => w.id === id)!;

/** What you see when you come upon them. */
export const WAY_SEEN: Record<string, string> = {
  traveler: "Someone is on the way here: a traveler with a staff and a bundle on his back.",
  peddler: "A peddler is on the road here, his pack hung with pots and bundles.",
  pilgrim: "A pilgrim in white walks here, leaning on a staff.",
  rhapsode: "A wandering singer is on the road, humming to himself.",
  runner: "A runner goes by at a steady lope, not looking left or right.",
  hunter: "A hunter is out here with his bow, moving quietly.",
  herder: "A shepherd is grazing his goats here.",
  woodcutter: "Thock... thock... Someone is felling a tree nearby.",
  herbwoman: "An old woman is bent over the ground here, digging roots.",
  fisher: "A fisherman sits at the water's edge with his line out.",
  wounded: "Someone is lying by the way, not moving much.",
  parched: "A traveler lies in what shade there is, his water skin empty beside him.",
  pilgrims: "Two pilgrims in white are walking here.",
  couple: "A young couple hurries along, glancing back over their shoulders.",
  quarrel: "Shouting: two farmers are quarreling over a stone in the field.",
  camp: "Smoke and voices: travelers have made camp here, round a fire.",
  caravan: "A trader and his porters are on the road, laden with jars and bales.",
  procession: "A procession in white is passing, singing.",
  soldiers: "Spears on the road: a band of soldiers is marching through.",
  brigands: "Something about the stillness here makes the back of your neck prickle.",
};
/** Someone coming into view while you're here. */
/** What cutthroats say when they step out: not a toll, but everything. */
export const CUTTHROAT_GREET = [
  "\"Everything. The purse, the pack, the cloak off your back. Then we'll see.\"",
  "\"Long way from anywhere, this. Nobody to hear. Empty your purse on the ground, slowly.\"",
  "\"You should have stayed on the farm. Put it all down, every coin.\"",
];
export const WAY_COMING: Record<string, string> = {
  traveler: "A traveler comes into view along the way.", peddler: "A peddler comes along, his pots clanking.", pilgrim: "A pilgrim in white is coming this way.",
  rhapsode: "Someone is singing, coming along the road.", runner: "A runner comes pounding along the way.", pilgrims: "Two pilgrims in white come along the way.",
  couple: "A young couple comes hurrying along.", caravan: "A trader and his porters come along the road.", procession: "Singing in the distance: a procession is coming.", soldiers: "The tramp of feet: soldiers, coming this way.",
};
export const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
/** "A traveler" -> "the traveler"; "Two pilgrims" -> "the two pilgrims". */
export const theTitle = (t: string) => (/^an? /i.test(t) ? t.replace(/^an? /i, "the ") : `the ${t[0].toLowerCase()}${t.slice(1)}`).replace(/, .*$/, "");

/**
 * Who you meet, if anyone, on arriving: a d12 roll, more likely on a road, rarer at night (when most folk keep to fires
/**
 * How likely someone is about, on a wild screen: people keep near the farms and the village, and to the roads.
 * `near` is how many screens it is from your farm or the village (whichever is closer); `roads` how many of its
 * edges a road crosses. Close in, on a road, someone is about one time in two; out past the third ring of screens,
 * off the roads, hardly ever.
 */
export function wayChance(near: number, roads: number): number {
  const prox = near <= 1 ? 1 : near === 2 ? 0.6 : near === 3 ? 0.3 : 0.12;
  const road = roads <= 0 ? 0.35 : roads === 1 ? 0.8 : roads === 2 ? 1.1 : 1.3;
  return 0.45 * prox * road;
}
/**
 * How likely brigands are lying in wait on a road: they keep away from the farms and the village, where they'd be
 * known and hunted, and work the long empty roads where travelers are alone. None next to home; about one road in
 * six out past the fourth ring, more where roads meet, more at night. Off the roads they are only the rare chance
 * meeting of the ordinary roll.
 */
export function brigandChance(near: number, roads: number, day: boolean): number {
  if (roads <= 0 || near <= 1) return 0;
  const far = near === 2 ? 0.03 : near === 3 ? 0.07 : near === 4 ? 0.12 : 0.16;
  return far * (roads === 1 ? 1 : roads === 2 ? 1.2 : 1.4) * (day ? 1 : 1.5);
}
export function rollWayfarers(r: () => number, o: { terrain: number; road: boolean; depth: number; day: boolean; water: boolean; monster: boolean; hutHere: boolean; only?: (w: WayDef) => boolean; chance?: number; ambush?: number }): WayDef | null {
  if (o.monster || o.depth < 1) return null;
  // On a road, brigands have their own roll (by distance from home); in the ordinary roll there, they don't come up.
  if (o.road && o.ambush !== undefined) {
    const b = WAYFARERS.find((w) => w.id === "brigands");
    if (b && (!o.only || o.only(b)) && o.depth >= (b.minDepth ?? 1) && r() < o.ambush) return b;
  }
  const chance = (o.chance ?? (o.road ? 0.36 : 0.18)) * (o.day ? 1 : 0.4);
  if (r() >= chance) return null;
  const pool = WAYFARERS.filter((w) => (!o.only || o.only(w)) && !(w.hostile && o.road && o.ambush !== undefined) && (!w.terrains.length || w.terrains.includes(o.terrain)) && (!w.water || o.water) && o.depth >= (w.minDepth ?? 1)
    && (w.when === "any" || (w.when === "day") === o.day) && !(o.hutHere && (w.id === "herbwoman" || w.id === "woodcutter")));
  const wt = (w: WayDef) => w.weight * (o.road ? w.road ?? 1 : 1) * (w.hostile ? (o.day ? 1 : 2.5) * Math.min(2, 1 + (o.depth - 2) * 0.15) : 1) * (w.id === "camp" && !o.day ? 6 : 1);
  const total = pool.reduce((n, w) => n + wt(w), 0);
  let k = r() * total;
  for (const w of pool) if ((k -= wt(w)) <= 0) return w;
  return pool[0] ?? null;
}

/** The people of one group, made from its roles. */
export function makeParty(def: WayDef, seed: number): Folk[] {
  let r = seed >>> 0;
  const rand = () => { r = (r + 0x6d2b79f5) >>> 0; let t = r; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const roles = [...def.roles]; if (def.extra && rand() < def.extra[0]) roles.push(def.extra[1]);
  const used = new Set<string>();
  return roles.map((ro, i) => {
    const f = makeFolk(rand, `way${seed}_${i}`, ro.age ?? (rand() < 0.15 ? "elder" : "adult"), ro.female ?? rand() < 0.4, used);
    if (ro.tunic) f.look.tunic = ro.tunic;
    if (ro.hat) f.extras.hat = HAT[Math.floor(rand() * HAT.length)];
    if (ro.pack) f.extras.pack = PACK[Math.floor(rand() * PACK.length)];
    if (ro.pole) f.extras.pole = ro.pole;
    if (f.extras.hat || ro.pole === "spear") f.extras.veil = undefined; // no veil under a hat or a helmet's road
    return f;
  });
}

// ------------------------------------------------------------------ finding a way across the land
/**
 * The cheapest way from one tile to another: roads are easiest, open ground next, brush and fords harder.
 * `cost` gives each tile's cost, or Infinity where no one can walk.
 */
export function findPath(w: number, h: number, cost: (x: number, y: number) => number, from: [number, number], to: [number, number]): [number, number][] | null {
  const N = w * h, dist = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
  const idx = (x: number, y: number) => y * w + x;
  const start = idx(from[0], from[1]), goal = idx(to[0], to[1]);
  // A small binary heap of [priority, node].
  const heap: [number, number][] = [];
  const push = (p: number, n: number) => { heap.push([p, n]); let i = heap.length - 1; while (i > 0) { const j = (i - 1) >> 1; if (heap[j][0] <= heap[i][0]) break; [heap[i], heap[j]] = [heap[j], heap[i]]; i = j; } };
  const pop = () => { const top = heap[0], last = heap.pop()!; if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, rr = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (rr < heap.length && heap[rr][0] < heap[m][0]) m = rr; if (m === i) break; [heap[i], heap[m]] = [heap[m], heap[i]]; i = m; } } return top; };
  dist[start] = 0; push(0, start);
  const DIRS: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
  while (heap.length) {
    const [d, n] = pop();
    if (n === goal) break;
    if (d > dist[n]) continue;
    const x = n % w, y = (n / w) | 0;
    for (const [dx, dy, k] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const c = cost(nx, ny); if (!isFinite(c)) continue;
      if (dx && dy && (!isFinite(cost(x + dx, y)) || !isFinite(cost(x, y + dy)))) continue; // no cutting corners past trees
      const nd = d + c * k, m = idx(nx, ny);
      if (nd < dist[m]) { dist[m] = nd; prev[m] = n; push(nd, m); }
    }
  }
  if (!isFinite(dist[goal])) return null;
  const out: [number, number][] = [];
  for (let n = goal; n !== -1 && n !== start; n = prev[n]) out.push([n % w, (n / w) | 0]);
  return out.reverse();
}

// ------------------------------------------------------------------ one wayfarer
/**
 * A walking person who follows a path of tiles, and can stop to do their work: chop, dig roots, fish, sit by the fire.
 * Lying hurt, they lie on their side.
 */
export class Wayfarer extends Walker {
  path: [number, number][] = [];
  pace = 1;
  /** The working pose, when standing still: cycles raise/strike. */
  work: "" | "chop" | "gather" | "fish" | "draw" | "kneel" = "";
  workT = 0;
  lying = false;
  /** A moment's halt (talking with you, looking about). */
  hold = 0;
  constructor(scene: Phaser.Scene, folk: Folk, x: number, y: number, home: [number, number]) {
    super(scene, folk, x, y, home);
  }
  get speed() { return (this.folk.age === "child" ? 30 : this.folk.age === "elder" ? 15 : 22) * this.pace; }
  /** Walk a path of world points. */
  walk(points: [number, number][]) { this.path = points; if (points.length) { this.doing = "walk"; this.work = ""; } }
  get walking() { return this.path.length > 0; }
  step(dt: number, paused: boolean) {
    const s = this.sprite;
    if (this.lying) { s.setVelocity(0, 0); s.setAngle(-90); s.setFrame(0); s.setDepth(s.y); return; }
    s.setAngle(0);
    if (this.hold > 0) { this.hold -= dt; s.setVelocity(0, 0); this.doing = "idle"; this.wait = 1; super.update(dt, paused); return; }
    if (this.path.length && !paused) {
      const [x, y] = this.path[0];
      if (Math.hypot(x - s.x, y - s.y) < 4) this.path.shift();
      if (this.path.length) { const [nx, ny] = this.path[0]; this.tx = nx; this.ty = ny; this.doing = "walk"; this.wait = 5; }
      else { this.doing = "idle"; this.wait = 0; }
    }
    super.update(dt, paused);
    // Standing at their work: the working poses.
    const still = !this.path.length && this.doing !== "walk";
    if (still && this.work && !paused) {
      this.workT += dt;
      const slow = this.work === "fish" ? 2.4 : this.work === "gather" ? 0.9 : this.work === "kneel" ? 0.7 : this.work === "draw" ? 99 : 0.55;
      const pose = this.work === "draw" ? POSE.raise : this.work === "fish" ? (Math.floor(this.workT / slow) % 6 === 0 ? POSE.raise : POSE.strike) : Math.floor(this.workT / slow) % 2 ? POSE.strike : POSE.raise;
      s.setFrame(this.facing * POSES + pose);
    }
  }
  face(x: number, y: number) { const dx = x - this.sprite.x, dy = y - this.sprite.y; this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
}

/** What a shepherd says when wolves come at the flock. */
export const WOLF_CRY = ["Wolf! Wolf!", "Get away! Hyah!", "The goats!"];
/** Folk who stop and say a word when you come near. */
export const NEAR_WORDS = ["Chaire!", "Hail, stranger.", "Good day.", "Gods keep you."];

// ------------------------------------------------------------------ brigands
/**
 * A brigand: a person who fights like a beast does (noticing, charging, striking, falling back), drawn and animated
 * as a person. Badly hurt, he throws down his weapon and runs.
 */
export class FigureFoe extends Animal {
  facing = 0; walkT = 0;
  routed = false;
  folk!: Folk;
  animate(dt: number) {
    const s = this.sprite;
    if (this.state === "dead") return;
    const body = s.body as Phaser.Physics.Arcade.Body, vx = body.velocity.x, vy = body.velocity.y;
    const moving = Math.abs(vx) + Math.abs(vy) > 1;
    if (moving) { this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 1 : 2) : vy < 0 ? 3 : 0; this.walkT += dt; }
    const pose = this.state === "recoil" ? POSE.strike : this.state === "charge" && !moving ? POSE.raise
      : moving ? [POSE.walk1, POSE.stand, POSE.walk2, POSE.stand][Math.floor(this.walkT / (this.state === "charge" || this.state === "flee" ? 0.09 : 0.14)) % 4] : POSE.stand;
    s.setFlipX(false).setFrame(this.facing * POSES + pose).setDepth(s.y);
  }
  faceTo(x: number, y: number) { const dx = x - this.sprite.x, dy = y - this.sprite.y; this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
}
