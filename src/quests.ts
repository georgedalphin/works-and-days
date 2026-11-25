// Villagers' requests, and the rumors they pass on about the lands beyond.
import { ITEMS } from "./data";

/** Something a villager has asked of you. */
export interface Request {
  id: number;
  from: string; // villager id
  kind: "bring" | "deliver";
  item: string; // what to bring, or "Parcel" for a delivery
  qty: number;
  minQ?: number; // quality wanted (2 = fine, 3 = excellent)
  to?: string; // a delivery's recipient
  why: string;
  silver: number;
  posted: number; // day number
  due: number; // day number by which it's wanted
}

/** A place a villager has heard of: an unexplored stretch of country, and what it is. */
export interface Rumor { key: string; terrain: number; from: string; day: number; found?: boolean; told?: boolean }

/** What each household tends to need, and why. */
export const WANTS: Record<string, { item: string; qty: [number, number]; minQ?: number; why: string }[]> = {
  theron: [
    { item: "Honey", qty: [2, 3], why: "My wife's mother is visiting, and nothing sweetens her temper like honey." },
    { item: "Millet", qty: [6, 10], why: "The cart's short of grain this week and the inn wants bread." },
    { item: "Chickpeas", qty: [5, 8], why: "Lentils are scarce. Chickpeas would see us through the month." },
    { item: "Milk", qty: [3, 4], why: "My grandson's poorly and the healer says goat's milk." },
    { item: "Amphora", qty: [2, 2], minQ: 2, why: "I need sound jars for the oil. Not the leaky sort the potter sells." },
    { item: "Wood", qty: [15, 20], why: "The mill's sluice gate has rotted through." },
  ],
  lykos: [
    { item: "Copper", qty: [2, 3], why: "The ore carts are late again, and I've orders waiting." },
    { item: "Wood", qty: [20, 25], why: "Charcoal. The forge eats it faster than the burners can make it." },
    { item: "Hide", qty: [2, 3], why: "Leather for the bellows. The old ones wheeze like an old dog." },
    { item: "Stone", qty: [12, 16], why: "I'm rebuilding the hearth of the forge." },
    { item: "Obsidian", qty: [1, 2], why: "A trader wants obsidian blades, and I've a mind to try knapping them." },
    { item: "Lamp", qty: [1, 1], why: "My eyes aren't what they were. A good lamp for the night work." },
  ],
  myrrhine: [
    { item: "Garland", qty: [2, 3], why: "There's a rite at the altar and the god likes to see flowers." },
    { item: "Flowers", qty: [6, 8], why: "For the altar. Wildflowers, the brighter the better." },
    { item: "Wine", qty: [2, 3], why: "Libations. Dionysus is never satisfied with water." },
    { item: "Figurine", qty: [1, 1], minQ: 2, why: "A votive for a girl who is to be married. It must be well made." },
    { item: "Thyme", qty: [3, 5], why: "Thyme for the incense. The hills are thick with it, they say." },
    { item: "Ivy", qty: [2, 3], why: "Ivy, for the god's wreath. It grows in the deep forest." },
  ],
  eudora: [
    { item: "Meat", qty: [3, 4], why: "A party of drovers is coming through and they eat like wolves." },
    { item: "Fennel", qty: [3, 4], why: "Fennel for the fish stew. The travelers ask for it." },
    { item: "Capers", qty: [3, 5], why: "Capers. The cook swears by them, and the cook gets her way." },
    { item: "Plum", qty: [4, 6], why: "Plums for the cakes. The children have been at mine." },
    { item: "WineAmphora", qty: [1, 1], why: "A sealed amphora of wine for the cellar, before the festival crowd." },
    { item: "Cloth", qty: [2, 3], why: "New linen for the guest beds. These are more hole than cloth." },
  ],
};

/** What each household gets wind of: the miller from the carters, the smith from ore traders, the priestess from pilgrims, the innkeeper from everyone. */
export const RUMOR_TERRAINS: Record<string, number[]> = {
  theron: [1, 10, 5],
  lykos: [4, 11, 12],
  myrrhine: [9, 1, 5],
  eudora: [7, 8, 10, 12],
};

/** How a villager describes a land they have heard of (the land of the wheel by number). */
export const RUMOR_WORDS: Record<number, string> = {
  1: "a flowering valley, all poppies and bees, where the satyrs are said to dance",
  2: "old forest, dark and deep, with oaks older than the village",
  3: "good farmland, gone wild, that nobody tills",
  4: "mineral hills, green-stained rock where the copper shows through",
  5: "a marsh of reeds and still pools, thick with frogs and herons",
  7: "the coast: sand, rock and the wine-dark sea",
  8: "true desert, sand and heat, where the sky is bigger than the land",
  9: "a sacred mountain, where the shepherds leave offerings on the cairns",
  10: "windswept plains, where the grass runs on forever and wild horses run with it",
  11: "rugged badlands, red rock and gullies, where lions hunt",
  12: "the dominating heights, crags and eagles, where the sky is close",
};

export const PARCELS: { from: string; to: string; what: string }[] = [
  { from: "theron", to: "eudora", what: "a sack of fresh flour for the inn" },
  { from: "eudora", to: "myrrhine", what: "a jar of honeyed figs, an offering from a grateful guest" },
  { from: "lykos", to: "theron", what: "the mended iron bands for the millstone's spindle" },
  { from: "myrrhine", to: "lykos", what: "a blessed charm to hang over the forge" },
  { from: "theron", to: "lykos", what: "a payment of grain for last month's work" },
  { from: "eudora", to: "theron", what: "a message from a carter, sealed with wax" },
];

const numWord = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** Plain directions from your farm: "two stretches of country east and one south". */
export function directions(wx: number, wy: number): string {
  const part = (n: number, a: string, b: string) => (n === 0 ? "" : `${numWord[Math.abs(n)] ?? Math.abs(n)} ${n > 0 ? a : b}`);
  const ew = part(wx, "east", "west"), ns = part(wy, "south", "north");
  const parts = [ew, ns].filter(Boolean);
  return `${parts.join(" and ")} of your farm`;
}

/** The silver a request pays: what the goods are worth, half again, and something for your trouble. */
export function requestPay(item: string, qty: number, minQ?: number): number {
  const v = ITEMS[item]?.value ?? 3;
  return Math.round(v * qty * 1.5 * (minQ && minQ >= 2 ? 1.5 : 1) + 8);
}
