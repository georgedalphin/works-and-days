// Core data drawn from the Works & Days design docs.

export interface WheelPosition {
  n: number;
  aretai: string;
  god: string;
  color: string; // hex, from the Core Rules' Aretai concepts
  benefit: string; // hour-patron benefit text
}

export const WHEEL: WheelPosition[] = [
  { n: 1, aretai: "Phoenix", god: "Aphrodite", color: "#f2a6c4", benefit: "Gifts and conversations go better" },
  { n: 2, aretai: "Kardia", god: "Artemis", color: "#b9773f", benefit: "Foraging and hunting" },
  { n: 3, aretai: "Oikos", god: "Demeter", color: "#6fae52", benefit: "Farm work and clearing brush come easier" },
  { n: 4, aretai: "Techne", god: "Hephaestus", color: "#e6c74a", benefit: "Crafting and forge work" },
  { n: 5, aretai: "Metis", god: "Poseidon", color: "#3fa9a0", benefit: "Fishing and sailing" },
  { n: 6, aretai: "Gnosis", god: "Hera", color: "#4f7fd1", benefit: "Household and family" },
  { n: 7, aretai: "Logos", god: "Athena", color: "#4b4fa8", benefit: "Weaving, the olive press, puzzles" },
  { n: 8, aretai: "Ourania", god: "Apollo", color: "#8d6cc9", benefit: "Healing, herbs, music" },
  { n: 9, aretai: "Pneuma", god: "Dionysus", color: "#7a3f96", benefit: "Wine, revelry, festivals" },
  { n: 10, aretai: "Aiolos", god: "Hermes", color: "#c9479a", benefit: "Running costs less breath" },
  { n: 11, aretai: "Thymos", god: "Ares", color: "#b02a3a", benefit: "Combat" },
  { n: 12, aretai: "Kratos", god: "Zeus", color: "#d63a2a", benefit: "Heavy labor comes easier" },
];

export interface Month {
  name: string;
  season: string;
  days: number;
  daylight: number; // clock hours of daylight, approximate for Greece
}

export const MONTHS: Month[] = [
  { name: "Hekatombaion", season: "Summer", days: 30, daylight: 14.5 },
  { name: "Metageitnion", season: "Summer", days: 29, daylight: 13.5 },
  { name: "Boedromion", season: "Summer", days: 30, daylight: 12.3 },
  { name: "Pyanepsion", season: "Autumn", days: 29, daylight: 11.0 },
  { name: "Maimakterion", season: "Autumn", days: 30, daylight: 10.0 },
  { name: "Poseideon", season: "Autumn", days: 29, daylight: 9.5 },
  { name: "Gamelion", season: "Winter", days: 30, daylight: 9.6 },
  { name: "Anthesterion", season: "Winter", days: 29, daylight: 10.5 },
  { name: "Elaphebolion", season: "Winter", days: 30, daylight: 11.7 },
  { name: "Mounichion", season: "Spring", days: 29, daylight: 13.0 },
  { name: "Thargelion", season: "Spring", days: 30, daylight: 14.0 },
  { name: "Skirophorion", season: "Spring", days: 29, daylight: 14.6 },
];

export function moonPhase(day: number): string {
  if (day <= 3 || day >= 28) return "New moon";
  if (day <= 12) return "Waxing moon";
  if (day <= 18) return "Full moon";
  return "Waning moon";
}

// A Young Adult starting build: 36 Aretai points, in wheel order.
export const START_ARETAI: Record<string, number> = {
  Phoenix: 3, Kardia: 3, Oikos: 4, Techne: 3, Metis: 3, Gnosis: 3,
  Logos: 3, Ourania: 3, Pneuma: 3, Aiolos: 3, Thymos: 3, Kratos: 3,
};

export function essencePools(a: Record<string, number>) {
  return {
    Earth: a.Kardia + a.Oikos + a.Techne,
    Water: a.Metis + a.Gnosis + a.Logos,
    Air: a.Ourania + a.Pneuma + a.Aiolos,
    Fire: a.Thymos + a.Kratos + a.Phoenix,
  };
}

// Real seconds of play for the whole daylight period, whatever the season.
export const DAYLIGHT_REAL_SECONDS = 600;
// Night is divided into three watches; the player collapses at the end of the second.
export const NIGHT_WATCHES_PLAYABLE = 2;
// Sleep clears this share of Fatigue per clock hour slept.
export const SLEEP_RECOVERY_PER_HOUR = 12;

// ---- items ----
export type ItemKind = "tool" | "material" | "seed" | "crop";
export interface ItemDef { id: string; name: string; greek?: string; kind: ItemKind; desc: string; value?: number }

export const ITEMS: Record<string, ItemDef> = {
  hoe: { id: "hoe", name: "Hoe", greek: "dikella", kind: "tool", desc: "Breaks ground into tilled soil." },
  jar: { id: "jar", name: "Water jar", greek: "hydria", kind: "tool", desc: "Waters tilled soil. Refill it at the well." },
  sickle: { id: "sickle", name: "Sickle", greek: "drepanon", kind: "tool", desc: "Cuts brush and flowers." },
  axe: { id: "axe", name: "Bronze axe", greek: "pelekys", kind: "tool", desc: "Fells saplings, and trees with several swings." },
  mattock: { id: "mattock", name: "Mattock", greek: "makele", kind: "tool", desc: "Breaks and lifts stones." },
  Wood: { id: "Wood", value: 1, name: "Wood", kind: "material", desc: "Timber for building and fuel." },
  Stone: { id: "Stone", value: 1, name: "Stone", kind: "material", desc: "Fieldstone for walls and building." },
  Fiber: { id: "Fiber", name: "Fiber", kind: "material", desc: "Plant fiber for cord and thatch, and fodder for the goats." },
  Flowers: { id: "Flowers", value: 1, name: "Wildflowers", kind: "material", desc: "For garlands and small offerings." },
  Milk: { id: "Milk", value: 5, name: "Goat's milk", greek: "gala", kind: "material", desc: "Fresh from your goats. Cheese comes with the dairy." },
  Honey: { id: "Honey", value: 10, name: "Honey", greek: "meli", kind: "material", desc: "Sweet and sacred: food, medicine and a fine offering." },
  Wax: { id: "Wax", value: 4, name: "Beeswax", greek: "keros", kind: "material", desc: "For candles, writing tablets and sealing jars." },
};

// ---- the homestead's animals ----
export const MANGER_MAX = 6; // fodder, one per goat per night
export const TROUGH_MAX = 6; // water, one per goat per night
export const HIVE_DAYS = 4; // days for the bees to fill new comb
export interface Goat { name: string; tint: number; affection: number; fed: boolean; pettedDay: number; milkedDay: number }
export const START_GOATS: Goat[] = [
  { name: "Kissa", tint: 0xffffff, affection: 2, fed: true, pettedDay: -1, milkedDay: -1 },
  { name: "Melaina", tint: 0x9a7a5c, affection: 1, fed: true, pettedDay: -1, milkedDay: -1 },
];

export const STACK_MAX = 99;
export const JAR_CAPACITY = 20;
export const INVENTORY_SIZE = 30; // three rows of ten; the first row is the hotbar

// ---- the wilderness ----
export interface Terrain { n: number; name: string; aretai: string; element: "Earth" | "Water" | "Air" | "Fire" }
export const TERRAINS: Terrain[] = [
  { n: 1, name: "Flowering Valleys", aretai: "Phoenix", element: "Fire" },
  { n: 2, name: "Wild Forests", aretai: "Kardia", element: "Earth" },
  { n: 3, name: "Cultivated Farmlands", aretai: "Oikos", element: "Earth" },
  { n: 4, name: "Mineral Hills", aretai: "Techne", element: "Earth" },
  { n: 5, name: "Marshy Swamps", aretai: "Metis", element: "Water" },
  { n: 6, name: "Deep Seas", aretai: "Gnosis", element: "Water" },
  { n: 7, name: "Coastal Waters", aretai: "Logos", element: "Water" },
  { n: 8, name: "Desolate Desert", aretai: "Ourania", element: "Air" },
  { n: 9, name: "Sacred Mountains", aretai: "Pneuma", element: "Air" },
  { n: 10, name: "Windswept Plains", aretai: "Aiolos", element: "Air" },
  { n: 11, name: "Rugged Badlands", aretai: "Thymos", element: "Fire" },
  { n: 12, name: "Dominating Heights", aretai: "Kratos", element: "Fire" },
];
export const terrain = (n: number) => TERRAINS[n - 1];
/** The vertical slice opens only the gentle lands around home. */
export const SLICE_TERRAINS = [1, 2, 3, 4];
export const HOME_TERRAIN = 3;

const wrap = (n: number) => ((n - 1 + 120) % 12) + 1;
/** Roll a new screen's terrain from the one the player just left (World & Wilderness doc). */
export function rollTerrain(from: number, r: () => number): { terrain: number; special: boolean; roll: number } {
  const d12 = () => 1 + Math.floor(r() * 12);
  for (let tries = 0; tries < 12; tries++) {
    const roll = d12();
    let t = from, special = false;
    if (roll <= 5) t = from;
    else if (roll <= 7) t = wrap(from + 1);
    else if (roll <= 9) t = wrap(from - 1);
    else if (roll === 10) { const same = TERRAINS.filter((x) => x.element === terrain(from).element && x.n !== from); t = same[Math.floor(r() * same.length)].n; }
    else if (roll === 11) t = wrap(from + (r() < 0.5 ? 2 : -2));
    else { t = 1 + Math.floor(r() * 12); special = true; }
    if (t === 6) continue; // Deep Seas are reached only by boat
    if (!SLICE_TERRAINS.includes(t)) continue;
    return { terrain: t, special, roll };
  }
  return { terrain: from, special: false, roll: 1 };
}

// ---- crops ----
export interface CropDef {
  id: string; name: string; greek: string;
  days: number; // nights of watered growth until ripe
  regrow?: number; // nights to ripen again after picking
  yield: number;
  seasons: string[];
  aretai: string; god: string; // planting in this patron's hour improves the harvest
  value: number; seedPrice: number; packet: number;
  desc: string; seedDesc: string;
}
export const CROPS: Record<string, CropDef> = {
  Millet: { id: "Millet", name: "Millet", greek: "kenchros", days: 6, yield: 3, seasons: ["Summer"], aretai: "Oikos", god: "Demeter", value: 3, seedPrice: 5, packet: 5,
    desc: "A hardy summer grain for porridge and bread.", seedDesc: "Grows in summer. Ripe in 6 watered nights." },
  Chickpeas: { id: "Chickpeas", name: "Chickpeas", greek: "erebinthos", days: 8, yield: 3, seasons: ["Summer"], aretai: "Oikos", god: "Demeter", value: 4, seedPrice: 8, packet: 5,
    desc: "Roasted, stewed or ground: food for the whole year.", seedDesc: "Grows in summer. Ripe in 8 watered nights." },
  Melon: { id: "Melon", name: "Melon", greek: "pepon", days: 10, yield: 1, seasons: ["Summer"], aretai: "Oikos", god: "Demeter", value: 14, seedPrice: 12, packet: 3,
    desc: "Sweet and heavy with juice; prized at any table.", seedDesc: "Grows in summer. Ripe in 10 watered nights." },
  Mint: { id: "Mint", name: "Mint", greek: "minthe", days: 5, regrow: 3, yield: 2, seasons: ["Spring", "Summer", "Autumn"], aretai: "Night", god: "Hades", value: 3, seedPrice: 6, packet: 3,
    desc: "Fragrant: for the kykeon, for medicine, and for the dead.", seedDesc: "Grows spring to autumn. Ripe in 5 nights, then picked again every 3." },
};
export const seedId = (crop: string) => `seed_${crop}`;
for (const c of Object.values(CROPS)) {
  ITEMS[c.id] = { id: c.id, name: c.name, greek: c.greek, kind: "crop", desc: c.desc, value: c.value };
  ITEMS[seedId(c.id)] = { id: seedId(c.id), name: `${c.name} seed`, kind: "seed", desc: c.seedDesc };
}
ITEMS.Grapes = { id: "Grapes", name: "Grapes", greek: "staphyle", kind: "crop", desc: "From the old vine. Tread them in the vat for wine, when you have one.", value: 2 };
export const QUALITY = ["", "ordinary", "fine", "excellent"];
export const QUALITY_MULT = [1, 1, 1.5, 2];
export const START_SEEDS: [string, number][] = [["Millet", 10], ["Chickpeas", 6], ["Mint", 3], ["Melon", 2]];
// ---- money: silver coins, and gold coins worth 20 silver (a deliberate, archaic anachronism) ----
export const START_SILVER = 20;
export const SILVER_PER_GOLD = 20;
export function money(silver: number): string {
  const g = Math.floor(silver / SILVER_PER_GOLD), s = silver % SILVER_PER_GOLD;
  if (!g) return `${s} silver`;
  return s ? `${g} gold, ${s} silver` : `${g} gold`;
}
/** Nights a planted crop can go unwatered before it withers. */
export const DRY_LIMIT = 3;
