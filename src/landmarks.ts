/**
 * Landmarks: each wild screen has one, a tenth to a quarter of the map. The "Here: …" of a new land is a real
 * place: a layout of its own, things worth finding (restocked each season), sometimes a cache to search, a
 * danger that belongs to it (a creature, or the place itself), and now and then something only it offers.
 */
import type { MonsterKind } from "./monsters";

export type Layout = "grove" | "rocks" | "meadow" | "thicket" | "reeds" | "pool" | "ruin" | "clearing" | "mound" | "field" | "beach" | "scree";

export type Danger =
  | { kind: "beast"; species: string; n?: number; when?: "night" | "day"; chance: number; text: string; on?: "enter" | "search" }
  | { kind: "monster"; monster: MonsterKind; when?: "night" | "day"; chance: number; text: string; on?: "enter" | "search" }
  | { kind: "hazard"; on: "enter" | "search" | "gather"; chance: number; dmg: number; text: string; cause: string; rain?: boolean };

export interface LandmarkDef {
  /** Radius in tiles: 5 is about a tenth of the map, 8 about a quarter. */
  r: number;
  layout: Layout;
  density: number;
  /** Things drawn at the place: sprite key, offset from the centre in tiles, and whether it blocks. */
  props: [string, number, number, boolean?][];
  /** What lies about to be picked up (restocks each season): item, and how many in each spot. */
  finds: [string, number][];
  nFinds: number;
  /** One place to search (restocks each season). */
  cache?: { label: string; items: [string, number][]; text: string };
  dangers: Danger[];
  /** Something only this place offers. */
  action?: "lookout" | "dig" | "offer";
  god?: string;
  /** What you see as you come upon it. */
  sight: string;
}

export const LANDMARKS: Record<string, LandmarkDef> = {
  // Flowering Valleys
  "Herb patch": { r: 5, layout: "meadow", density: 0.45, props: [], finds: [["Thyme", 2], ["Mint", 2], ["Fennel", 1], ["Flowers", 2]], nFinds: 7,
    dangers: [{ kind: "hazard", on: "gather", chance: 0.18, dmg: 8, text: "The bees working the herbs rise in a cloud and sting you!", cause: "bees" }],
    sight: "A sheltered slope thick with wild herbs, humming with bees." },
  "Bee tree": { r: 5, layout: "meadow", density: 0.3, props: [["beetree", 0, 0, true]], finds: [["Flowers", 2], ["Thyme", 1]], nFinds: 4,
    cache: { label: "Take honey from the bee tree", items: [["Honey", 3], ["Wax", 2]], text: "You reach into the hollow and break out the comb." },
    dangers: [{ kind: "hazard", on: "search", chance: 0.7, dmg: 14, text: "The bees pour out of the hollow and sting you all over! (A lit torch would have calmed them.)", cause: "bees" }],
    sight: "An old hollow tree, its trunk loud with bees." },
  "Flower meadow": { r: 6, layout: "meadow", density: 0.7, props: [], finds: [["Flowers", 3], ["Nest", 1]], nFinds: 6, god: "Aphrodite", action: "offer",
    dangers: [], sight: "A meadow so thick with flowers the air is sweet. Aphrodite's, surely." },
  "Animal den": { r: 5, layout: "thicket", density: 0.25, props: [["den", 0, 0, true], ["lmbones", 2, 1]], finds: [["Hide", 1], ["Feather", 2], ["Antler", 1]], nFinds: 3,
    dangers: [{ kind: "beast", species: "boar", chance: 0.8, text: "A sow bursts out of the den, tusks down: her young are here!" }],
    sight: "A den under the rocks, bones scattered at its mouth." },
  // Wild Forests
  "Old oak": { r: 6, layout: "clearing", density: 0.08, props: [["bigoak", 0, 0, true]], finds: [["Wood", 3], ["Mushrooms", 1], ["Feather", 2]], nFinds: 4, god: "Zeus", action: "offer",
    dangers: [{ kind: "hazard", on: "enter", chance: 0.5, dmg: 16, text: "Lightning splits the sky and strikes the old oak beside you!", cause: "lightning", rain: true }],
    sight: "An oak older than any city, ribbons tied in its lower branches: Zeus' tree." },
  "Fallen giant": { r: 6, layout: "grove", density: 0.18, props: [["log", 0, 0, true]], finds: [["Wood", 4], ["Mushrooms", 2], ["Ivy", 2]], nFinds: 6,
    cache: { label: "Search the hollow of the fallen giant", items: [["OldCoin", 1], ["Arrowhead", 1], ["Amber", 1]], text: "In the rotten heart of the trunk someone once hid things." },
    dangers: [{ kind: "beast", species: "bear", chance: 0.3, text: "A bear heaves up from the far side of the trunk!" }],
    sight: "A giant oak lies where it fell, its roots taller than a man." },
  "Mossy hollow": { r: 5, layout: "pool", density: 0.3, props: [], finds: [["Mushrooms", 2], ["Ivy", 2], ["Mint", 1]], nFinds: 5, god: "Hecate",
    dangers: [{ kind: "beast", species: "eidolon", when: "night", chance: 0.6, text: "Something pale stands up out of the mist in the hollow." }],
    sight: "A green, dripping hollow around a spring. It is very quiet here." },
  // Cultivated Farmlands
  "Abandoned field": { r: 7, layout: "field", density: 0.2, props: [["stele", -3, -2]], finds: [["seed_Millet", 3], ["seed_Chickpeas", 2], ["seed_Melon", 1], ["Oats", 3]], nFinds: 6,
    dangers: [{ kind: "beast", species: "fox", n: 2, chance: 0.5, text: "Foxes have made the old field theirs, and don't like company." }],
    sight: "A field no one has worked in years, its crops gone wild and seeding themselves." },
  "Boundary stones": { r: 5, layout: "clearing", density: 0.05, props: [["stele", -2, 0], ["stele", 2, 1], ["stele", 0, -2]], finds: [["Stone", 2], ["OldCoin", 1]], nFinds: 3, god: "Hermes", action: "offer",
    dangers: [], sight: "Old boundary stones, inscribed: whose land was this? Hermes guards such marks." },
  "Olive grove": { r: 7, layout: "grove", density: 0.22, props: [["pressruin", 0, 0, true]], finds: [["Olives", 4], ["Wood", 2]], nFinds: 5, god: "Athena",
    cache: { label: "Search the ruined press house", items: [["OliveOil", 1], ["Amphora", 1]], text: "Among the fallen stones a jar has survived." },
    dangers: [], sight: "An untended olive grove around a ruined press house." },
  // Mineral Hills
  "Stone outcrop": { r: 5, layout: "rocks", density: 0.35, props: [], finds: [["Stone", 3], ["Obsidian", 1], ["Arrowhead", 1], ["Ochre", 1]], nFinds: 6,
    dangers: [{ kind: "beast", species: "boar", chance: 0.25, text: "A boar wallowing among the rocks takes your coming badly." }],
    sight: "Bare rock breaks the earth here, flaked and sharp: flint and black glass." },
  "Ore seam": { r: 6, layout: "rocks", density: 0.3, props: [], finds: [["Copper", 1], ["Ochre", 2], ["Stone", 2]], nFinds: 6,
    cache: { label: "Work the green seam", items: [["Copper", 3], ["Ochre", 1]], text: "You hack the green-stained stone out of the seam." },
    dangers: [{ kind: "hazard", on: "search", chance: 0.35, dmg: 14, text: "The rock above the seam gives way!", cause: "a rockfall" }],
    sight: "A seam of green-stained rock: copper, right in the open." },
  "Scree slope": { r: 7, layout: "scree", density: 0.4, props: [], finds: [["Fossil", 1], ["Stone", 2], ["Clay", 2]], nFinds: 5,
    dangers: [{ kind: "hazard", on: "enter", chance: 0.4, dmg: 10, text: "Stones come tumbling down the scree at you!", cause: "falling stones" }],
    sight: "A long slope of loose scree. Shells of stone show in the broken rock." },
  // Marshy Swamps
  "Reed bed": { r: 7, layout: "reeds", density: 0.55, props: [["boat", 3, 2, true]], finds: [["Fiber", 3], ["Feather", 2], ["Nest", 1]], nFinds: 6,
    cache: { label: "Look in the old boat", items: [["Arrow", 4], ["Fibula", 1], ["Wine", 1]], text: "A fisherman's boat, half sunk in the reeds. Someone left things in it." },
    dangers: [{ kind: "hazard", on: "gather", chance: 0.15, dmg: 8, text: "You sink to the thigh in the mud and come out with leeches.", cause: "the marsh" }],
    sight: "Reeds higher than your head, and a boat half-sunk among them." },
  "Still pool": { r: 5, layout: "pool", density: 0.45, props: [], finds: [["Fiber", 2], ["Mint", 1], ["Feather", 1]], nFinds: 4, god: "Poseidon",
    dangers: [{ kind: "hazard", on: "gather", chance: 0.15, dmg: 6, text: "Leeches! You pull them off one by one.", cause: "leeches" }],
    sight: "A black, still pool. Nothing moves in it, which is worse." },
  "Willow stand": { r: 6, layout: "grove", density: 0.25, props: [], finds: [["Wood", 2], ["Fiber", 2], ["Mushrooms", 1]], nFinds: 5, god: "Hecate",
    dangers: [{ kind: "beast", species: "eidolon", when: "night", chance: 0.4, text: "Among the willows a shade is weeping." }],
    sight: "Willows trailing their hair in the water. Hecate's trees, they say." },
  // Coastal Waters
  "Tide pools": { r: 5, layout: "beach", density: 0.3, props: [], finds: [["SeaFennel", 2], ["Saltbush", 2], ["Fossil", 1]], nFinds: 6, god: "Poseidon",
    dangers: [{ kind: "beast", species: "crab", n: 3, chance: 0.6, text: "Crabs scuttle out of the pools, claws up." }],
    sight: "Rock pools full of small lives, left by the sea." },
  "Driftwood beach": { r: 7, layout: "beach", density: 0.15, props: [["wreck", 0, 0, true]], finds: [["Wood", 4], ["Fiber", 2]], nFinds: 6,
    cache: { label: "Search the wreck", items: [["WineAmphora", 1], ["Amphora", 1], ["OldCoin", 2]], text: "The sea gives back what it takes, sometimes." },
    dangers: [{ kind: "hazard", on: "search", chance: 0.25, dmg: 10, text: "A wave breaks over the wreck and throws you against the timbers!", cause: "the sea" }],
    sight: "A beach strewn with driftwood, and the bones of a ship." },
  "Headland": { r: 6, layout: "rocks", density: 0.25, props: [["nest", 2, -2]], finds: [["Feather", 3], ["SeaFennel", 1]], nFinds: 4, action: "lookout",
    dangers: [{ kind: "hazard", on: "enter", chance: 0.2, dmg: 10, text: "The wind off the sea knocks you off your feet near the edge!", cause: "a fall" }],
    sight: "A headland over the sea, wind-scoured. You can see a long way from here." },
  // Desolate Desert
  "Dry wadi": { r: 7, layout: "scree", density: 0.15, props: [], finds: [["Stone", 2], ["Clay", 2], ["Arrowhead", 1]], nFinds: 4, action: "dig",
    dangers: [{ kind: "hazard", on: "enter", chance: 0.6, dmg: 18, text: "A wall of brown water comes roaring down the wadi!", cause: "a flash flood", rain: true }],
    sight: "A dry riverbed. Water runs here sometimes, and fast." },
  "Oasis": { r: 6, layout: "pool", density: 0.2, props: [["palm", -3, -1, true], ["palm", 3, -2, true], ["palm", 2, 3, true]], finds: [["Fiber", 2], ["Feather", 2]], nFinds: 4,
    dangers: [{ kind: "beast", species: "jackal", n: 2, chance: 0.6, text: "Jackals come down to drink, and think you are in their way." }],
    sight: "Palms and water in the waste. Every creature for a day around comes here." },
  "Sun-bleached bones": { r: 6, layout: "clearing", density: 0.05, props: [["lmbones", 0, 0], ["lmbones", -2, 2], ["lmbones", 3, -1]], finds: [["OldCoin", 1], ["Arrowhead", 1], ["Hide", 1]], nFinds: 4,
    cache: { label: "Search the dead caravan's packs", items: [["Fibula", 1], ["OldCoin", 2], ["GoldDust", 1]], text: "The packs have rotted, but bronze and gold keep." },
    dangers: [{ kind: "beast", species: "scorpion", n: 3, chance: 0.75, text: "Scorpions boil out from under the bones!" }],
    sight: "The bones of a caravan, men and beasts together, white in the sun." },
  // Sacred Mountains
  "Mountain spring": { r: 5, layout: "pool", density: 0.3, props: [], finds: [["MountainTea", 2], ["Mint", 1], ["Flowers", 2]], nFinds: 5, god: "Apollo",
    dangers: [], sight: "A spring rising from the mountain, cold enough to hurt your teeth." },
  "Shrine stones": { r: 5, layout: "clearing", density: 0.08, props: [["cairn", 0, 0, true]], finds: [["OldCoin", 1], ["Feather", 2], ["Amber", 1]], nFinds: 3, god: "Dionysus", action: "offer",
    dangers: [], sight: "A cairn on the mountainside, heaped with old offerings." },
  "Eagle crag": { r: 6, layout: "rocks", density: 0.3, props: [["nest", 0, -1]], finds: [["Feather", 3], ["OwlFeather", 1]], nFinds: 4, god: "Zeus", action: "lookout",
    cache: { label: "Reach into the eagle's nest", items: [["Feather", 4], ["Amber", 1]], text: "Feathers, bones, and a shining thing the eagle fancied." },
    dangers: [{ kind: "hazard", on: "search", chance: 0.6, dmg: 12, text: "The eagle stoops on you, talons first!", cause: "an eagle" }],
    sight: "A crag where Zeus' eagles nest. You can see half the world from it." },
  // Windswept Plains
  "Wild herd grounds": { r: 8, layout: "field", density: 0.06, props: [], finds: [["Hide", 1], ["Fiber", 2]], nFinds: 4,
    dangers: [{ kind: "hazard", on: "enter", chance: 0.3, dmg: 14, text: "The herd takes fright and stampedes straight through you!", cause: "a stampede" }],
    sight: "The grass is trampled flat for a long way: the wild herd's ground." },
  "Lone oak": { r: 5, layout: "clearing", density: 0.04, props: [["bigoak", 0, 0, true]], finds: [["Wood", 2], ["Feather", 2]], nFinds: 3, god: "Zeus", action: "offer",
    dangers: [{ kind: "hazard", on: "enter", chance: 0.5, dmg: 16, text: "Lightning strikes the lone oak, and you beneath it!", cause: "lightning", rain: true }],
    sight: "A single oak on the plain, the only shade for miles." },
  "Burial mound": { r: 6, layout: "mound", density: 0.3, props: [["mound", 0, 0, true]], finds: [["Arrowhead", 1], ["OldCoin", 1]], nFinds: 3,
    cache: { label: "Dig into the grave goods", items: [["Fibula", 1], ["OldCoin", 3], ["Arrow", 6], ["GoldDust", 1]], text: "A hero's grave goods: bronze, coin, and his arrows." },
    dangers: [{ kind: "monster", monster: "skeleton", chance: 1, on: "search", text: "The earth heaves. The dead man is not pleased." }],
    sight: "A hero's mound, grassed over, on the open plain." },
  // Rugged Badlands
  "Gully": { r: 6, layout: "rocks", density: 0.3, props: [["den", 2, 0, true]], finds: [["Ochre", 2], ["Stone", 2], ["Tusk", 1]], nFinds: 4,
    dangers: [{ kind: "beast", species: "jackal", n: 3, chance: 0.6, text: "Jackals were waiting in the gully. They come at you together." }],
    sight: "A deep gully, a good place for an ambush. Red earth for the taking." },
  "Old battlefield": { r: 8, layout: "clearing", density: 0.12, props: [["spears", -2, 1], ["spears", 3, -2], ["lmbones", 0, 2]], finds: [["Arrowhead", 2], ["Arrow", 3], ["Copper", 1], ["Tusk", 1]], nFinds: 6,
    dangers: [{ kind: "beast", species: "eidolon", n: 2, when: "night", chance: 0.7, text: "The dead of the old battle rise and come for you." }],
    sight: "An old battlefield. Spears still stand in the ground where they fell." },
  "Thorn thicket": { r: 6, layout: "thicket", density: 0.55, props: [], finds: [["Thistle", 2], ["Plum", 2], ["Cornel", 2]], nFinds: 5,
    cache: { label: "Crawl to the bundle in the thorns", items: [["Arrow", 6], ["OldCoin", 2], ["Fibula", 1]], text: "Someone hid a bundle deep in the thorns, and never came back for it." },
    dangers: [{ kind: "hazard", on: "search", chance: 0.8, dmg: 8, text: "The thorns tear you to ribbons on the way in.", cause: "thorns" }],
    sight: "A thicket of thorn, impossible to cross, with something hidden in its heart." },
  // Dominating Heights
  "Ruined watchtower": { r: 6, layout: "ruin", density: 0.6, props: [["tower", 0, -1, true]], finds: [["Arrow", 3], ["Arrowhead", 1], ["Stone", 2]], nFinds: 4, action: "lookout",
    cache: { label: "Search the guardroom", items: [["Arrow", 8], ["Fibula", 1], ["OldCoin", 2]], text: "The old garrison left in a hurry." },
    dangers: [{ kind: "monster", monster: "strix", when: "night", chance: 0.7, text: "Something shrieks from the top of the tower and drops toward you." }],
    sight: "A ruined watchtower. From the top you could see far into the lands around." },
  "Acropolis ruins": { r: 8, layout: "ruin", density: 0.5, props: [["columns", -2, -1, true], ["columns", 3, -2, true], ["statue", 0, 1, true]], finds: [["OldCoin", 2], ["Arrowhead", 1], ["Stone", 3], ["Fibula", 1]], nFinds: 6, action: "lookout",
    cache: { label: "Search the treasury", items: [["GoldDust", 2], ["Figurine", 1], ["OldCoin", 3], ["Amber", 1]], text: "Behind the fallen columns, the treasury of a city no one remembers." },
    dangers: [{ kind: "beast", species: "eidolon", n: 2, when: "night", chance: 0.6, text: "The city's dead walk their streets again." }, { kind: "monster", monster: "lion", when: "day", chance: 0.25, text: "A lion has made its lair in the ruins." }],
    sight: "The ruins of a high city: columns, a statue of a forgotten god, and the way to the treasury." },
};

/** The season's key, so things found restock when it turns. */
export const seasonKey = (year: number, season: string) => `${year}:${season}`;
