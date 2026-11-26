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

/** The day's weather, rolled on a d12 each dawn by season. Rain waters the fields. */
export type Weather = "clear" | "cloudy" | "rain" | "mist" | "wind";
export const WEATHER_BY_SEASON: Record<string, [Weather, number][]> = {
  // [weather, highest d12 roll for it]; anything above the last is clear
  Summer: [["rain", 1], ["cloudy", 3], ["mist", 4], ["wind", 6]],
  Autumn: [["rain", 3], ["cloudy", 5], ["mist", 7], ["wind", 8]],
  Winter: [["rain", 4], ["cloudy", 7], ["mist", 9], ["wind", 10]],
  Spring: [["rain", 2], ["cloudy", 4], ["mist", 6], ["wind", 8]],
};
export function rollWeather(season: string, d12: number): Weather {
  for (const [w, top] of WEATHER_BY_SEASON[season] ?? []) if (d12 <= top) return w;
  return "clear";
}
export const WEATHER_WORD: Record<Weather, string> = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", mist: "Morning mist", wind: "Windy" };

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

/** The element each Aretai draws on: the Cosmic Wheel's four quarters. */
export const ELEMENT_OF: Record<string, "Earth" | "Water" | "Air" | "Fire"> = {
  Kardia: "Earth", Oikos: "Earth", Techne: "Earth", Metis: "Water", Gnosis: "Water", Logos: "Water",
  Ourania: "Air", Pneuma: "Air", Aiolos: "Air", Thymos: "Fire", Kratos: "Fire", Phoenix: "Fire",
};
/**
 * Pacing. Every action tests one Aretai and draws on that Aretai's element. Its Essence cost is its effort,
 * scaled by your skill: 9 / (Aretai + 6), so effort 3 costs 3 at Aretai 3, 2.25 at 6 and 1.5 at 12.
 * Your pool (the sum of the element's three Aretai) holds a few actions; it refills from empty in
 * ESSENCE.refillSeconds, more slowly as Fatigue mounts.
 */
export const ESSENCE = { refillSeconds: 12, tiredSlowdown: 0.4, runPerSecond: 2, runPerTap: 0.8 };
export const EFFORT = {
  // Fire: Thymos (fighting) and Kratos (heavy labor).
  strike: 3, shove: 2, throwSpear: 4, chop: 4, sapling: 3, stone: 4, boulder: 6, mine: 5,
  // Earth: Oikos (field work), Techne (making), Kardia (calming).
  till: 2, cut: 2, pull: 3, dig: 3, gather: 1, plant: 1, plantCutting: 2, repair: 5, hand: 1, station: 3, calm: 3,
  // Water: Gnosis (study), Logos (wit).
  study: 3, mock: 2,
  // Air: Ourania (aim), Pneuma (rites), Aiolos (running, per second: ESSENCE.runPerSecond).
  shoot: 3, rite: 3,
};
export const skillCost = (effort: number, aretai: number) => (effort * 9) / (Math.max(0, aretai) + 6);

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
export type ItemKind = "tool" | "material" | "seed" | "crop" | "find" | "place" | "meal";
export interface ItemDef { id: string; name: string; greek?: string; kind: ItemKind; desc: string; value?: number }

export const ITEMS: Record<string, ItemDef> = {
  hoe: { id: "hoe", name: "Hoe", greek: "dikella", kind: "tool", desc: "Breaks ground into tilled soil." },
  jar: { id: "jar", name: "Water jar", greek: "hydria", kind: "tool", desc: "Waters tilled soil. Refill it at the well." },
  sickle: { id: "sickle", name: "Sickle", greek: "drepanon", kind: "tool", desc: "Cuts brush and flowers." },
  axe: { id: "axe", name: "Bronze axe", greek: "pelekys", kind: "tool", desc: "Fells saplings, and trees with several swings." },
  bow: { id: "bow", name: "Hunting bow", greek: "toxon", kind: "tool", desc: "Hold Space to draw and aim, click where you want the arrow to land. Arrows strike only where they fall." },
  mattock: { id: "mattock", name: "Mattock", greek: "makele", kind: "tool", desc: "Breaks and lifts stones." },
  spear: { id: "spear", name: "Spear", greek: "dory", kind: "tool", desc: "Ash shaft, bronze point. Click to thrust: it reaches farther than a sword, but bites a little less. Hold the button (or Space) to aim, release to throw; then go and fetch it." },
  sword: { id: "sword", name: "Bronze sword", greek: "xiphos", kind: "tool", desc: "A leaf-bladed sword from Lykos' forge. Click to strike: close in, but it hits hardest." },
  Wood: { id: "Wood", value: 1, name: "Wood", kind: "material", desc: "Timber for building and fuel." },
  Stone: { id: "Stone", value: 1, name: "Stone", kind: "material", desc: "Fieldstone for walls and building." },
  Fiber: { id: "Fiber", name: "Fiber", kind: "material", desc: "Plant fiber for cord and thatch, and fodder for the goats." },
  Flowers: { id: "Flowers", value: 1, name: "Wildflowers", kind: "material", desc: "For garlands and small offerings." },
  Arrow: { id: "Arrow", name: "Arrows", greek: "oistos", kind: "material", desc: "Stone-tipped arrows. Craft more from wood and stone (C)." },
  Meat: { id: "Meat", value: 4, name: "Meat", greek: "kreas", kind: "material", desc: "Fresh game. Roast it, salt it, or offer the thigh bones to the gods." },
  Hide: { id: "Hide", value: 6, name: "Hide", greek: "dora", kind: "material", desc: "A pelt for leather, cloaks and bedding." },
  Antler: { id: "Antler", value: 8, name: "Antler", kind: "material", desc: "For tool handles, pins and charms. Artemis' animal: honor her for it." },
  Tusk: { id: "Tusk", value: 10, name: "Boar tusk", kind: "material", desc: "Protective amulets (+3), and the plates of a boar's-tusk helmet." },
  Feather: { id: "Feather", value: 1, name: "Feathers", kind: "material", desc: "For fletching and small charms." },
  WildGrapes: { id: "WildGrapes", value: 2, name: "Wild grapes", kind: "material", desc: "Small and sour, but good for the vat, and cuttings for a vineyard." },
  Plum: { id: "Plum", value: 3, name: "Wild plums", kind: "material", desc: "Sweet fruit for eating fresh or drying." },
  Cornel: { id: "Cornel", value: 3, name: "Cornelian cherries", kind: "material", desc: "Tart red fruit. The wood makes the best javelins." },
  Purslane: { id: "Purslane", value: 1, name: "Purslane", kind: "material", desc: "Fleshy wild greens from the field edges." },
  Oats: { id: "Oats", value: 1, name: "Wild oats", kind: "material", desc: "Fodder: the goats will eat it from the manger." },
  // Rare finds (omens.ts says where they turn up).
  // Made things (crafting.ts says how).
  Boat: { id: "Boat", value: 40, name: "Boat", greek: "akatos", kind: "place", desc: "A little boat of planks and hide. Set it down in the shallows by a shore, get in (E), and row (half again slower than walking, in strokes)." },
  Campfire: { id: "Campfire", value: 4, name: "Campfire", greek: "pyra", kind: "place", desc: "A ring of stones and a bundle of kindling. Set it down anywhere and sleep beside it (half the rest of a bed, but you wake where you lay)." },
  Workbench: { id: "Workbench", value: 20, name: "Workbench", greek: "ergasterion", kind: "place", desc: "A stout bench for joinery. Place it on your homestead and use it to make larger things." },
  Kiln: { id: "Kiln", value: 30, name: "Kiln", greek: "kaminos", kind: "place", desc: "A beehive of clay and stone for firing pots. Place it on your homestead." },
  Loom: { id: "Loom", value: 25, name: "Loom", greek: "histos", kind: "place", desc: "An upright warp-weighted loom, Athena's gift. Place it on your homestead." },
  Chest: { id: "Chest", value: 18, name: "Chest", greek: "kibotos", kind: "place", desc: "A wooden chest with a bronze hasp. Place it and keep things in it." },
  Fence: { id: "Fence", value: 2, name: "Fence", greek: "phragmos", kind: "place", desc: "A length of wattle fence. Place it to mark a field or pen a goat." },
  Snare: { id: "Snare", value: 3, name: "Snare", greek: "brochos", kind: "place", desc: "A noose of twisted fiber on a bent stick. Set it in the wild or on your land; check it after a night." },
  Amphora: { id: "Amphora", value: 8, name: "Amphora", greek: "amphoreus", kind: "material", desc: "A two-handled jar for wine and oil." },
  WineAmphora: { id: "WineAmphora", value: 70, name: "Amphora of wine", greek: "amphoreus oinou", kind: "material", desc: "Three measures of wine, sealed with pitch. Worth far more to the miller than loose wine." },
  Lamp: { id: "Lamp", value: 10, name: "Clay lamp", greek: "lychnos", kind: "material", desc: "A little lamp burning beeswax. Carried, it lights caves wider than a torch, and never burns out." },
  Cloth: { id: "Cloth", value: 6, name: "Linen cloth", greek: "othone", kind: "material", desc: "A bolt of plain linen from your loom." },
  Cloak: { id: "Cloak", value: 30, name: "Woolen cloak", greek: "chlaina", kind: "material", desc: "A thick cloak pinned at the shoulder. Carried, it turns a little of every blow (Health +1)." },
  Press: { id: "Press", value: 35, name: "Press", greek: "lenos", kind: "place", desc: "A beam press over a stone bed, for olives and grapes. Place it on your homestead." },
  Forge: { id: "Forge", value: 45, name: "Forge", greek: "eschara", kind: "place", desc: "A clay hearth with leather bellows, for working bronze. Place it on your homestead." },
  Olives: { id: "Olives", value: 2, name: "Olives", greek: "elaiai", kind: "crop", desc: "Black and bitter from the tree. Pressed, they give oil." },
  OliveOil: { id: "OliveOil", value: 22, name: "Olive oil", greek: "elaion", kind: "material", desc: "Athena's gift, golden-green: for lamps, for the body, for the table and the altar." },
  Parcel: { id: "Parcel", value: 0, name: "Parcel", kind: "material", desc: "Something a villager asked you to carry. Look in your journal (J) for whom it's for." },
  Garland: { id: "Garland", value: 5, name: "Garland", greek: "stephanos", kind: "material", desc: "Wildflowers woven on a fiber cord. Everyone likes a garland; Aphrodite most of all." },
  LionPelt: { id: "LionPelt", value: 70, name: "Lion pelt", greek: "leonte", kind: "material", desc: "The hide of a lion of the high country, mane and all. Heracles wore one. Worth a great deal, and more in glory." },
  Fibula: { id: "Fibula", value: 12, name: "Bronze fibula", greek: "porpe", kind: "find", desc: "A cloak pin, green with age. Someone lost it long ago." },
  Figurine: { id: "Figurine", value: 10, name: "Clay figurine", greek: "kore", kind: "find", desc: "A little clay woman with raised arms: a votive, once offered to a goddess." },
  Arrowhead: { id: "Arrowhead", value: 4, name: "Flint arrowhead", greek: "glochis", kind: "find", desc: "Knapped by hands older than memory. Still sharp: it makes fine arrows." },
  OldCoin: { id: "OldCoin", value: 20, name: "Old silver coin", greek: "argyrion", kind: "find", desc: "Worn smooth; the stamp might be an owl, or a turtle." },
  Nest: { id: "Nest", value: 3, name: "Empty bird's nest", greek: "kalia", kind: "find", desc: "Woven of grass and hair, abandoned after the fledging." },
  Fossil: { id: "Fossil", value: 8, name: "Stone seashell", greek: "konche", kind: "find", desc: "A shell turned to stone, found far from any sea. Poseidon's once." },
  Obsidian: { id: "Obsidian", value: 10, name: "Obsidian flake", greek: "obsidianos", kind: "find", desc: "Black volcanic glass, sharper than bronze. It makes keen arrowheads." },
  Amber: { id: "Amber", value: 15, name: "Amber bead", greek: "elektron", kind: "find", desc: "Golden and warm to the touch; rub it and it draws chaff." },
  OwlFeather: { id: "OwlFeather", value: 6, name: "Owl feather", greek: "pteron glaukos", kind: "find", desc: "Soft and silent. Athena's bird." },
  Thunderstone: { id: "Thunderstone", value: 60, name: "Thunderstone", greek: "keraunia", kind: "find", desc: "Black iron fallen from the sky where Zeus' bolt struck. Carried, Zeus' favor sits heavier on you." },
  HeliadTear: { id: "HeliadTear", value: 50, name: "Tear of the Heliades", greek: "dakry Heliadon", kind: "find", desc: "Amber that holds a faint light: a sister of Phaethon wept it. Carried, Apollo's aim is yours." },
  SeaFennel: { id: "SeaFennel", value: 3, name: "Sea fennel", greek: "krithmon", kind: "material", desc: "Salty shore greens, good pickled." },
  Saltbush: { id: "Saltbush", value: 1, name: "Saltbush", greek: "halimos", kind: "material", desc: "Grey desert leaves; fodder for beasts." },
  MountainTea: { id: "MountainTea", value: 4, name: "Mountain tea", greek: "sideritis", kind: "material", desc: "Woolly mountain herb, brewed for tea and medicine." },
  Thistle: { id: "Thistle", value: 1, name: "Thistle", greek: "akantha", kind: "material", desc: "Fodder, and food when the shoots are young." },
  Fennel: { id: "Fennel", value: 3, name: "Fennel", greek: "marathon", kind: "material", desc: "For cooking and medicine. Its hollow stalks make the thyrsus." },
  Thyme: { id: "Thyme", value: 3, name: "Thyme", greek: "thymon", kind: "material", desc: "For cooking and purifying smoke. Bees love it." },
  Capers: { id: "Capers", value: 4, name: "Caper buds", kind: "material", desc: "Pickled, they keep for a year." },
  Clay: { id: "Clay", value: 2, name: "Clay", kind: "material", desc: "For pottery, bricks and votive figurines." },
  Ochre: { id: "Ochre", value: 5, name: "Ochre", kind: "material", desc: "Earth pigment for paint, and for funeral and ritual marks." },
  Mushrooms: { id: "Mushrooms", value: 4, name: "Mushrooms", kind: "material", desc: "Good eating, mostly. Some bring visions, or death." },
  Ivy: { id: "Ivy", value: 2, name: "Ivy", kind: "material", desc: "Dionysus' evergreen: for crowns and the thyrsus." },
  Syrinx: { id: "Syrinx", value: 0, name: "Reed pipes", greek: "syrinx", kind: "material", desc: "Pan's pipes, a satyr's gift. Music Arts will use them." },
  Torch: { id: "Torch", value: 0, name: "Torches", kind: "material", desc: "Pitch-soaked wood. One burns for a whole visit underground; without light, every action is at -3." },
  Copper: { id: "Copper", value: 6, name: "Copper ore", kind: "material", desc: "Green-stained stone. Lykos will want it, once there is tin to marry it to." },
  GoldDust: { id: "GoldDust", value: 20, name: "Gold dust", kind: "material", desc: "Dug by the giant ants of the deep places. Worth a gold coin a pinch." },
  Must: { id: "Must", value: 3, name: "Must", greek: "gleukos", kind: "material", desc: "Sweet trodden grape juice. Left to work in the vat, it becomes wine." },
  Wine: { id: "Wine", value: 12, name: "Wine", greek: "oinos", kind: "material", desc: "Dionysus' gift: for libations to any god, for guests, and for satyrs who have waited all year." },
  Cutting: { id: "Cutting", value: 0, name: "Vine cutting", kind: "material", desc: "A cutting from a wild vine. Plant it in tilled soil at home: in a year it will bear." },
  Milk: { id: "Milk", value: 5, name: "Goat's milk", greek: "gala", kind: "material", desc: "Fresh from your goats. Cheese comes with the dairy." },
  Honey: { id: "Honey", value: 10, name: "Honey", greek: "meli", kind: "material", desc: "Sweet and sacred: food, medicine and a fine offering." },
  Wax: { id: "Wax", value: 4, name: "Beeswax", greek: "keros", kind: "material", desc: "For candles, writing tablets and sealing jars." },
};

// ---- the homestead's animals ----
export const MANGER_MAX = 6; // fodder, one per goat per night
export const TROUGH_MAX = 6; // water, one per goat per night
export const HIVE_DAYS = 4; // days for the bees to fill new comb
export interface Goat { name: string; tint: number; affection: number; fed: boolean; pettedDay: number; milkedDay: number; songDay?: number }
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
/** Every land of the wheel can be walked to; the Deep Seas (6) wait for boats. */
export const SLICE_TERRAINS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
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

// ---- hunting ----
export const BOW_RANGE = 170; // px, the farthest you can send an arrow
export const ARROW_SPEED = 230; // px/s along the ground, plus a moment to loose
export const STARTING_ARROWS = 12;
/** Hits to bring down each creature, and what it leaves. */
export const QUARRY: Record<string, { hp: number; size: number; drops: [string, number][] }> = {
  hare: { hp: 1, size: 5, drops: [["Meat", 1], ["Hide", 1]] },
  bird: { hp: 1, size: 4, drops: [["Meat", 1], ["Feather", 2]] },
  fox: { hp: 1, size: 6, drops: [["Hide", 1]] },
  deer: { hp: 2, size: 8, drops: [["Meat", 3], ["Hide", 1], ["Antler", 1]] },
  boar: { hp: 3, size: 7, drops: [["Meat", 3], ["Hide", 1], ["Tusk", 1]] },
  wolf: { hp: 2, size: 7, drops: [["Hide", 1]] },
  bat: { hp: 1, size: 4, drops: [] },
  myrmex: { hp: 5, size: 8, drops: [["GoldDust", 1]] },
  eidolon: { hp: 3, size: 6, drops: [] },
  lampad: { hp: 2, size: 6, drops: [] },
  // Wandering monsters: Terata Vitality scaled to hits (a boar's 18 Vitality = 3 hits).
  centaur: { hp: 4, size: 10, drops: [["Hide", 1], ["Arrow", 3]] },
  // The far lands.
  duck: { hp: 1, size: 5, drops: [["Meat", 1], ["Feather", 2]] },
  gull: { hp: 1, size: 5, drops: [["Feather", 2]] },
  pigeon: { hp: 1, size: 4, drops: [["Meat", 1], ["Feather", 1]] },
  heron: { hp: 1, size: 6, drops: [["Feather", 3]] },
  eagle: { hp: 2, size: 6, drops: [["Feather", 3]] },
  crab: { hp: 1, size: 5, drops: [["Meat", 1]] },
  jackal: { hp: 1, size: 7, drops: [["Hide", 1]] },
  scorpion: { hp: 1, size: 5, drops: [] },
  ibex: { hp: 2, size: 8, drops: [["Meat", 2], ["Hide", 1], ["Antler", 1]] },
  bear: { hp: 5, size: 10, drops: [["Meat", 4], ["Hide", 2]] },
  horse: { hp: 3, size: 10, drops: [["Meat", 3], ["Hide", 2]] },
  bustard: { hp: 1, size: 6, drops: [["Meat", 2], ["Feather", 2]] },
  siren: { hp: 4, size: 7, drops: [["Feather", 3]] },
  sphinx: { hp: 6, size: 12, drops: [] },
  lion: { hp: 5, size: 10, drops: [["LionPelt", 1], ["Meat", 3]] },
  stymphalian: { hp: 2, size: 6, drops: [["Copper", 1], ["Feather", 1]] },
  strix: { hp: 2, size: 6, drops: [["Feather", 2]] },
  skeleton: { hp: 3, size: 7, drops: [] },
  empousa: { hp: 3, size: 6, drops: [] },
};
/** Practice makes the archer: experience per shot and per hit, and how much a level is. */
export const ARCHERY = { perShot: 1, perHit: 5, perLevel: 20, maxLevel: 10 };
/** Where a recipe is made: by hand anywhere, or at a station you have built and placed on the homestead. */
export type Station = "hand" | "workbench" | "kiln" | "loom" | "press" | "forge";
export const STATION_NAME: Record<Station, string> = { hand: "Handwork", workbench: "The workbench", kiln: "The kiln", loom: "The loom", press: "The press", forge: "The forge" };
/** A recipe. `upgrade` raises a tool you carry to that level instead of making a new thing. */
export const RECIPES: { out: string; qty: number; needs: [string, number][]; desc: string; at?: Station; quality?: boolean; upgrade?: number }[] = [
  { out: "Arrow", qty: 4, needs: [["Wood", 1], ["Stone", 1]], desc: "Shafts from wood, points knapped from stone." },
  { out: "bow", qty: 1, needs: [["Wood", 4], ["Fiber", 3]], desc: "A spare bow, strung with twisted fiber." },
  { out: "Arrow", qty: 6, needs: [["Wood", 1], ["Obsidian", 1]], desc: "Obsidian points: keener, and more of them." },
  { out: "Arrow", qty: 5, needs: [["Wood", 1], ["Arrowhead", 1]], desc: "An old flint point, rehafted, and its fellows knapped to match." },
  { out: "Torch", qty: 2, needs: [["Wood", 1], ["Fiber", 1]], desc: "Wood wrapped in fiber and pitch, for the dark places." },
  { out: "Snare", qty: 1, needs: [["Fiber", 2], ["Wood", 1]], desc: "A noose on a bent stick. Set it, and check it after a night." },
  { out: "Garland", qty: 1, needs: [["Flowers", 3], ["Fiber", 1]], desc: "Wildflowers woven on a cord: a gift, or an offering." },
  { out: "Campfire", qty: 1, needs: [["Fiber", 12], ["Stone", 4]], desc: "Kindling and a ring of stones: sleep out wherever you are (half the rest of a bed)." },
  { out: "Workbench", qty: 1, needs: [["Wood", 8], ["Stone", 2]], desc: "The first station: place it on your homestead to make larger things." },
  { out: "WineAmphora", qty: 1, needs: [["Amphora", 1], ["Wine", 3]], desc: "Seal three measures of wine in an amphora with pitch." },
  // At the workbench.
  { out: "Chest", qty: 1, needs: [["Wood", 6], ["Copper", 1]], desc: "Somewhere to keep what your pack can't carry.", at: "workbench" },
  { out: "Fence", qty: 4, needs: [["Wood", 2]], desc: "Wattle fencing, for fields and pens.", at: "workbench" },
  { out: "Boat", qty: 1, needs: [["Wood", 16], ["Fiber", 6], ["Hide", 2]], desc: "Planks, pitch and hide: for the shallows and the deep.", at: "workbench" },
  { out: "Kiln", qty: 1, needs: [["Clay", 12], ["Stone", 6]], desc: "For firing clay: amphorae, lamps, figurines.", at: "workbench" },
  { out: "Loom", qty: 1, needs: [["Wood", 10], ["Fiber", 4]], desc: "For weaving linen and wool.", at: "workbench" },
  { out: "Press", qty: 1, needs: [["Wood", 12], ["Stone", 8]], desc: "For olive oil, and must without treading.", at: "workbench" },
  { out: "Forge", qty: 1, needs: [["Stone", 10], ["Clay", 6], ["Hide", 1]], desc: "For bronze: arrowheads, pins, and your own tool work.", at: "workbench" },
  // At the press.
  { out: "OliveOil", qty: 1, needs: [["Olives", 4]], desc: "Crush and press the olives, and let the oil settle.", at: "press", quality: true },
  { out: "Must", qty: 2, needs: [["Grapes", 5]], desc: "Press grapes to must, for the vat to ferment.", at: "press" },
  { out: "Must", qty: 1, needs: [["WildGrapes", 4]], desc: "Wild grapes give a thinner must.", at: "press" },
  // At the forge.
  { out: "Arrow", qty: 8, needs: [["Copper", 1], ["Wood", 2]], desc: "Cast bronze arrowheads, a whole quiver's worth.", at: "forge" },
  { out: "Fibula", qty: 1, needs: [["Copper", 1]], desc: "A bronze cloak pin: a fine gift, or an offering to Athena.", at: "forge", quality: true },
  { out: "axe", qty: 1, needs: [["Copper", 3], ["Wood", 4]], desc: "Rework your axe with a finer bronze edge (fells oaks in two blows).", at: "forge", upgrade: 2 },
  { out: "mattock", qty: 1, needs: [["Copper", 4], ["Wood", 5]], desc: "Shoe your mattock with bronze (it splits boulders).", at: "forge", upgrade: 2 },
  // At the kiln.
  { out: "Amphora", qty: 1, needs: [["Clay", 3]], desc: "A two-handled jar for wine.", at: "kiln", quality: true },
  { out: "Lamp", qty: 1, needs: [["Clay", 1], ["Wax", 1]], desc: "A wax lamp: lights caves wide, and never burns out.", at: "kiln", quality: true },
  { out: "Figurine", qty: 1, needs: [["Clay", 2], ["Ochre", 1]], desc: "A votive, painted with ochre: an excellent offering.", at: "kiln", quality: true },
  // At the loom.
  { out: "Cloth", qty: 1, needs: [["Fiber", 3]], desc: "A bolt of linen.", at: "loom", quality: true },
  { out: "Cloak", qty: 1, needs: [["Cloth", 2], ["Hide", 1]], desc: "Turns a little of every blow (Health +1 while carried).", at: "loom", quality: true },
];

// ---- danger ----
export const START_LIFE_THREAD = 8; // a Young Adult's thread
/** Food a creature will take as a peace offering when you try to calm it. */
export const PEACE_FOOD: Record<string, string[]> = {
  boar: ["Millet", "Chickpeas", "Melon"], deer: ["Millet", "Chickpeas", "Melon"], wolf: ["Meat"], fox: ["Meat"],
  myrmex: ["Honey"], eidolon: ["Wine", "Milk", "Honey", "Mint"], lampad: ["Honey", "Milk", "Mint"],
  centaur: ["Wine"], // Terata: "wine offered with respect, not mockery"
  jackal: ["Meat"], bear: ["Honey", "Meat"], crab: [], scorpion: [], // the bear: "an offering of food left and abandoned"
};
/** Melee damage by what's in hand (hits needed: boar 3, wolf 2). */
export const MELEE: Record<string, number> = { axe: 2, mattock: 2, sickle: 1, spear: 2, sword: 3 };
/** How far a blow reaches, in pixels from you to the creature (26 for anything not listed). */
export const MELEE_REACH: Record<string, number> = { spear: 42, sword: 24 };
/** Weapons are made for fighting: +1 to land a blow. */
export const WEAPONS = ["spear", "sword"];
/** The thrown spear: shorter range than the bow, a heavier blow, and only the one. */
export const SPEAR_THROW = { range: 120, speed: 210, damage: 3, holdMs: 220 };
/** The smith forges a sword to order. */
export const SWORD_ORDER = { silver: 80, copper: 2 };

// ---- the vineyard and the vat ----
export const VAT_REPAIR: [string, number][] = [["Stone", 6], ["Wood", 4]];
export const GRAPES_PER_MUST = 3; // grapes trodden for each measure of must
export const FERMENT_DAYS = 6; // days the must works in the vat before it is wine
export const VINE_BEARS_AFTER = 20; // days a planted cutting needs before its first vintage
export const YOUNG_VINE_YIELD = 6;

// ---- caves ----
export type CaveType = "common" | "sacred" | "chthonic";
/** What waits at the bottom of each kind of cave (World & Wilderness: the Core Rules' three kinds). */
export const CAVE_KINDS: Record<CaveType, { boss: "myrmex" | "lampad" | "eidolon"; signs: string; hoard: string }> = {
  common: { boss: "myrmex", signs: "Old fire-scars and gnawed bones: beasts and bandits have sheltered here.", hoard: "a heap of earth the ants have sifted, glinting with gold" },
  sacred: { boss: "lampad", signs: "Dripping water, a worn stone ledge, little clay offerings: a holy place.", hoard: "a niche of old votive offerings, coins among them" },
  chthonic: { boss: "eidolon", signs: "A cold that is not the cold of stone, and something like whispering.", hoard: "grave goods, laid with someone long dead" },
};
export const CAVE_LEVELS = 2;
