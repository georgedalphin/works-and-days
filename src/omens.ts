/**
 * Signs, omens and rare finds.
 *
 * Signs are Hesiod's farmer's calendar: the world telling you what time of year it is.
 * Known at Basics (study one with Q while it is happening), a sign gives a small help for a few days. Ignoring one costs nothing.
 *
 * Omens are the gods speaking. Pneuma decides whether you notice one; Gnosis (and your study of augury) whether you read it rightly.
 * The omen's effect is real either way: a misread only misleads you.
 *
 * Finds reward attention: lost things in the furrow, rarities in the stone, glints in the wild.
 * They fill the lore book, please the gods as offerings, sell, help in crafting, and very rarely hold a little magic.
 */
import type { Weather } from "./data";

// ------------------------------------------------------------------ signs
export type SignEffect = "sow" | "reap" | "prune" | "vintage" | "rest";
export interface SignDef { id: string; months: number[]; when: "day" | "dawn"; sight: string; meaning: string; effect: SignEffect; visual: "cranes" | "snail" | "stars" | "swallow" | "none" }

/** How many days a sign's help lasts once you have seen it. */
export const SIGN_DAYS = 4;
export const EFFECT_WORD: Record<SignEffect, string> = {
  sow: "seeds sown now grow finer", reap: "harvests give an extra measure", prune: "the vines will bear more this year",
  vintage: "grapes picked now are finer", rest: "sleep restores more",
};

/** Months: 0 Hekatombaion (high summer) … 3 Pyanepsion (autumn) … 6 Gamelion (winter) … 9 Mounichion (spring) … 11 Skirophorion. */
export const SIGNS: Record<string, SignDef> = {
  cranes: { id: "cranes", months: [3, 4], when: "day", effect: "sow", visual: "cranes",
    sight: "High overhead a long wavering line of cranes passes south, crying from the clouds.",
    meaning: "The crane's cry is the sign for plowing and sowing." },
  pleiadesSet: { id: "pleiadesSet", months: [4, 5], when: "dawn", effect: "sow", visual: "stars",
    sight: "Before dawn, the Pleiades are sinking into the west.",
    meaning: "When the Pleiades set, it is time to plow." },
  swallow: { id: "swallow", months: [7, 8], when: "day", effect: "prune", visual: "swallow",
    sight: "The first swallow of the year darts low over the ground.",
    meaning: "Prune the vines before the swallow comes; she brings the spring." },
  pleiadesRise: { id: "pleiadesRise", months: [10, 11], when: "dawn", effect: "reap", visual: "stars",
    sight: "Before dawn, the seven Pleiades are rising in the east.",
    meaning: "When the Pleiades rise, begin the harvest." },
  snail: { id: "snail", months: [10, 11], when: "day", effect: "reap", visual: "snail",
    sight: "A snail has climbed high up a stalk, out of the heat.",
    meaning: "When the house-carrier climbs the plants, stop digging: sharpen the sickles and reap." },
  cicada: { id: "cicada", months: [0, 1], when: "day", effect: "rest", visual: "none",
    sight: "The cicada shrills from the trees in the heat, and the thistle is in flower.",
    meaning: "Now the goats are fattest and the wine is best: rest in the shade." },
  vintage: { id: "vintage", months: [1, 2], when: "dawn", effect: "vintage", visual: "stars",
    sight: "Orion and Sirius stand high, and the rosy dawn finds Arcturus.",
    meaning: "Then cut the grape clusters and bring them home." },
};

// ------------------------------------------------------------------ omens
export interface OmenDef { id: string; god: string; when: "day" | "dusk"; bird: string; plain: string; good: string; bad: string; visual: "eagle" | "owl" | "raven" | "hawk" | "thunder" | "hind" | "voice" }
export const OMENS: OmenDef[] = [
  { id: "eagle", god: "Zeus", when: "day", visual: "eagle", bird: "an eagle", plain: "An eagle sweeps across the sky.", good: "An eagle sweeps across the sky on your right.", bad: "An eagle sweeps across the sky on your left." },
  { id: "thunder", god: "Zeus", when: "day", visual: "thunder", bird: "thunder", plain: "Thunder rolls somewhere far off.", good: "Thunder rolls out of a clear sky, on your right.", bad: "Thunder rolls out of a clear sky, on your left." },
  { id: "owl", god: "Athena", when: "dusk", visual: "owl", bird: "an owl", plain: "An owl glides past in the twilight.", good: "An owl glides past in the twilight, on your right.", bad: "An owl glides past in the twilight, on your left." },
  { id: "heron", god: "Athena", when: "dusk", visual: "voice", bird: "a heron", plain: "Something calls in the dark.", good: "In the dark, a heron calls on your right.", bad: "In the dark, a heron calls on your left." },
  { id: "raven", god: "Apollo", when: "day", visual: "raven", bird: "a raven", plain: "A raven croaks and flies off.", good: "A raven croaks and flies off to your right.", bad: "A raven croaks and flies off to your left." },
  { id: "hawk", god: "Apollo", when: "day", visual: "hawk", bird: "a hawk", plain: "A hawk stoops on something in the grass.", good: "A hawk stoops and rises with its prey, on your right.", bad: "A hawk stoops and misses, on your left." },
  { id: "cuckoo", god: "Hera", when: "day", visual: "voice", bird: "a cuckoo", plain: "A cuckoo calls from the oaks.", good: "A cuckoo calls from the oaks on your right.", bad: "A cuckoo calls from the oaks on your left." },
  { id: "hind", god: "Artemis", when: "day", visual: "hind", bird: "a hind", plain: "A hind crosses ahead of you.", good: "A hind stops on the path, looks back at you calmly, and goes to the right.", bad: "A hind starts at the sight of you and bolts to the left." },
];
/** What a reading of each god's omen means for the day. */
export const OMEN_MEANING: Record<string, [string, string]> = {
  Zeus: ["Zeus is with you today.", "Zeus warns you today. Go carefully."],
  Athena: ["Athena will guide your hand today.", "Athena withholds her counsel today."],
  Apollo: ["Apollo's aim is with you today.", "Apollo turns his face from you today."],
  Hera: ["Hera looks kindly on your house today.", "Hera is displeased today."],
  Artemis: ["Artemis grants you the wild today.", "Artemis bars the wild to you today."],
};

// ------------------------------------------------------------------ dreams and chance words
export const DREAMS = [
  "You dream of walking a furrow that never ends, and the soil is warm.",
  "You dream of your house full of people you have not met yet.",
  "You dream of a river speaking your name, and wake before it finishes.",
  "You dream of bees building comb inside your chest. It does not hurt.",
  "You dream of the sea, though you have never seen it this close.",
  "You dream of an old man counting olives, and every count comes out different.",
];
/** Dreams that circle your hidden doom without naming it. */
export const MOROS_DREAMS: Record<string, string> = {
  "Broken Heart": "You dream of a garland you wove for someone, wilting in your hands while they smile at you.",
  "Betrayal": "You dream of a friend's hand on your shoulder in the dark, and you cannot tell if it steadies you or pushes.",
  "Exile": "You dream of your own door, and the latch will not lift for you.",
  "Slain by Your Creation": "You dream of something you made, standing at the foot of your bed, waiting.",
  "Web of Lies": "You dream of a story you told, growing taller than the house, and everyone believes it.",
  "Forbidden Knowledge": "You dream of a sealed jar that hums, and your hands already on the lid.",
  "Unfair Prosecution": "You dream of a crowd in the agora, every face turned to you, and a speech you never wrote.",
  "Lost Way": "You dream of a road that forks, and forks, and forks, and the sun does not move.",
  "Divine Jealousy": "You dream of two altars, and the smoke of one bending away from the other.",
  "High Fall": "You dream of a ledge, and wind, and the ground very far below, and a kind of peace.",
  "Heroic Stand": "You dream of a narrow place between rocks, and you are not afraid.",
  "Heavy Crown": "You dream of a gold circlet that grows heavier every time someone bows.",
};
/** A villager's chance word that turns out to be about tomorrow. */
export const KLEDON: Record<Weather, string> = {
  rain: "\"...and you can smell it, can't you? Rain tomorrow.\"",
  cloudy: "\"...grey tomorrow, I'd wager. My knee says so.\"",
  mist: "\"...the hollows will be full of mist come morning.\"",
  wind: "\"...the wind's getting up. It'll blow tomorrow.\"",
  clear: "\"...it'll be fine tomorrow. Clear as a bell.\"",
};

// ------------------------------------------------------------------ rare finds
export interface FindDef { id: string; magic?: string }
/** Where finds turn up, by activity. Each entry: [find, weight]. */
export const FIND_TABLES: Record<string, [string, number][]> = {
  hoe: [["Fibula", 3], ["Figurine", 3], ["Arrowhead", 4], ["OldCoin", 2]],
  stone: [["Fossil", 4], ["Arrowhead", 2], ["Obsidian", 2], ["Fibula", 1], ["Thunderstone", 0.15]],
  tree: [["Nest", 5], ["OwlFeather", 1]],
  glint: [["OldCoin", 3], ["Fibula", 2], ["Arrowhead", 2], ["OwlFeather", 1], ["Figurine", 1], ["Thunderstone", 0.3]],
  shore: [["Amber", 5], ["Fossil", 1], ["OldCoin", 1], ["HeliadTear", 0.4]],
};
/** Chance per action of a find. */
export const FIND_CHANCE = { hoe: 1 / 35, stone: 1 / 20, tree: 1 / 14, glint: 1 };
/** The very rare magic finds: carried, they lift a god's boon by one. */
export const MAGIC_FINDS: Record<string, string> = { Thunderstone: "Zeus", HeliadTear: "Apollo" };
export const pickFrom = (table: [string, number][]) => {
  const total = table.reduce((n, [, w]) => n + w, 0);
  let k = Math.random() * total;
  for (const [id, w] of table) if ((k -= w) <= 0) return id;
  return table[0][0];
};
