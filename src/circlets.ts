/**
 * Wreaths and Crowns (Thaumas): circlets of fresh plants that carry their god's blessing. A crown is worn, and works
 * on the wearer; a wreath is hung at home, and blesses the household. Materials must be gathered fresh, the same
 * day. Each material is its own check (Aretai and CR from Thaumas), and every check must hold, or the circlet falls
 * apart. Plant magic is short-lived: a circlet wilts in a day to three, longer if woven at a festival or a holy place.
 */
import { ITEMS, CROPS, seedId } from "./data";
import { FORAGE } from "./forage";
import { LORE } from "./lore";
import type { Currency } from "./gods";

export interface Material {
  id: string; name: string; item: string; god: string; seasons: string[]; wild: boolean;
  check: { aretai: string; cr: number }; cost?: Partial<Record<Currency, number>>; days: number;
  /** Crown: Aretai while worn, and what else it does. */
  crown: { gains: [string, number][]; text: string };
  /** Wreath: comfort it adds to the home, and what else it does. */
  wreath: { comfort: number; text: string };
  leaf: string; flower?: string;
}
export const MATERIALS: Material[] = [
  { id: "laurel", name: "Laurel", item: "Laurel", god: "Apollo", seasons: ["Spring", "Summer", "Autumn", "Winter"], wild: true, check: { aretai: "Pneuma", cr: 8 }, days: 3, leaf: "#3f6a34",
    crown: { gains: [["Pneuma", 1]], text: "Pneuma +1; songs come easier (+1), and no charm or song can bend your will" },
    wreath: { comfort: 1, text: "music at home +1; truth sits easier in the house" } },
  { id: "olive", name: "Olive", item: "OliveSprig", god: "Athena", seasons: ["Summer", "Autumn"], wild: false, check: { aretai: "Logos", cr: 8 }, days: 3, leaf: "#8a9a6a",
    crown: { gains: [["Logos", 1]], text: "Logos +1; a calm, clear head" },
    wreath: { comfort: 3, text: "wisdom and order: a household at peace" } },
  { id: "oak", name: "Oak", item: "OakLeaves", god: "Zeus", seasons: ["Spring", "Summer"], wild: true, check: { aretai: "Kratos", cr: 9 }, cost: { Hubris: 1 }, days: 3, leaf: "#4a6a2a",
    crown: { gains: [["Kratos", 1]], text: "Kratos +1; your voice carries authority (Intimidation +1), and lightning hurts you half as much" },
    wreath: { comfort: 1, text: "lightning will not strike your homestead" } },
  { id: "myrtle", name: "Myrtle", item: "Myrtle", god: "Aphrodite", seasons: ["Spring", "Summer", "Autumn"], wild: false, check: { aretai: "Phoenix", cr: 8 }, cost: { Pathos: 1 }, days: 2, leaf: "#4f7a4a", flower: "#f2f0e8",
    crown: { gains: [["Phoenix", 2]], text: "Phoenix +2; people warm to you (+1 when you chat or give)" },
    wreath: { comfort: 2, text: "those who live with you grow fonder every morning" } },
  { id: "ivy", name: "Ivy", item: "Ivy", god: "Dionysus", seasons: ["Spring", "Summer", "Autumn", "Winter"], wild: true, check: { aretai: "Pneuma", cr: 8 }, days: 3, leaf: "#2f5a2a",
    crown: { gains: [["Pneuma", 1]], text: "Pneuma +1; joy and freedom: weariness lifts faster" },
    wreath: { comfort: 2, text: "celebration and good cheer in the house" } },
  { id: "pine", name: "Pine", item: "PineBoughs", god: "Hermes", seasons: ["Spring", "Summer", "Autumn", "Winter"], wild: true, check: { aretai: "Ourania", cr: 9 }, days: 3, leaf: "#2f4a2a",
    crown: { gains: [["Kardia", 1]], text: "Kardia +1; at home in the wild: beasts are slower to anger at you" },
    wreath: { comfort: 1, text: "wild vitality: your goats grow fonder of you" } },
  { id: "rose", name: "Rose", item: "WildRose", god: "Aphrodite", seasons: ["Spring", "Summer"], wild: false, check: { aretai: "Phoenix", cr: 9 }, cost: { Pathos: 1 }, days: 1, leaf: "#4f6b2c", flower: "#f0a0b8",
    crown: { gains: [["Phoenix", 1]], text: "Phoenix +1; you look lovely, and people judge you kindly (+1 when you chat)" },
    wreath: { comfort: 3, text: "beauty and calm in the house" } },
  { id: "barley", name: "Barley", item: "Barley", god: "Demeter", seasons: ["Spring", "Summer"], wild: false, check: { aretai: "Oikos", cr: 8 }, days: 2, leaf: "#c8b060",
    crown: { gains: [["Oikos", 1]], text: "Oikos +1; abundance: the meals you eat last half again as long" },
    wreath: { comfort: 1, text: "plenty: dishes cooked at your hearth come out richer" } },
  { id: "willow", name: "Willow", item: "WillowBark", god: "Hecate", seasons: ["Spring"], wild: true, check: { aretai: "Pneuma", cr: 10 }, cost: { Hubris: 1 }, days: 2, leaf: "#8aa05a",
    crown: { gains: [["Pneuma", 1]], text: "Pneuma +1; you see the dead clearly, and they must hold back from you" },
    wreath: { comfort: 1, text: "the dead may cross your threshold, but can do no harm there" } },
  { id: "wheat", name: "Wheat", item: "Wheat", god: "Demeter", seasons: ["Summer"], wild: false, check: { aretai: "Oikos", cr: 8 }, days: 2, leaf: "#d8b860",
    crown: { gains: [["Oikos", 1]], text: "Oikos +1; vitality: you heal faster while you wear it" },
    wreath: { comfort: 1, text: "health: sleep at home heals more, and your goats don't fall sick" } },
  { id: "poplar", name: "White poplar", item: "Poplar", god: "Ares", seasons: ["Spring", "Summer"], wild: true, check: { aretai: "Thymos", cr: 9 }, cost: { Kleos: 1 }, days: 3, leaf: "#a8b8a0",
    crown: { gains: [["Thymos", 1], ["Kardia", 1]], text: "Thymos +1, Kardia +1; Heracles' courage, proof against the terrors of the dead" },
    wreath: { comfort: 1, text: "heroic courage in the house" } },
  { id: "parsley", name: "Parsley", item: "Parsley", god: "Hades", seasons: ["Spring", "Summer", "Autumn"], wild: false, check: { aretai: "Pneuma", cr: 9 }, days: 2, leaf: "#5a9a3a",
    crown: { gains: [["Pneuma", 1]], text: "Pneuma +1; pure for the rites (offerings +1, Arts' CRs −2). Unlucky to wear except at funerals, games and purifications" },
    wreath: { comfort: 1, text: "ritual purity: offerings at your household altar count 1 more" } },
  { id: "celery", name: "Celery", item: "Celery", god: "Poseidon", seasons: ["Spring", "Summer"], wild: true, check: { aretai: "Aiolos", cr: 8 }, days: 2, leaf: "#7aa04a",
    crown: { gains: [["Aiolos", 1], ["Thymos", 1]], text: "Aiolos +1, Thymos +1; the victor's crown: running costs less breath" },
    wreath: { comfort: 1, text: "a competitive spirit about the place" } },
];
export const material = (id: string) => MATERIALS.find((m) => m.id === id)!;
export const materialOfItem = (item: string) => MATERIALS.find((m) => m.item === item);

// ---- the new materials as items: sprigs cut from trees with the sickle, wild plants, and two grains ----
ITEMS.OliveSprig = { id: "OliveSprig", value: 2, name: "Olive sprig", greek: "thallos", kind: "material", desc: "A leafy olive twig, cut with the sickle: Athena's tree, for crowns and wreaths. Weave it fresh." };
ITEMS.OakLeaves = { id: "OakLeaves", value: 2, name: "Oak leaves", greek: "drys", kind: "material", desc: "A spray of oak leaves, cut with the sickle: Zeus' tree, for crowns of authority. Weave it fresh." };
ITEMS.PineBoughs = { id: "PineBoughs", value: 1, name: "Pine boughs", greek: "pitys", kind: "material", desc: "Resinous pine boughs, cut with the sickle: Pan's tree, for hunters' crowns. Weave them fresh." };
interface NewPlant { item: string; name: string; greek: string; value: number; desc: string; forage: { id: string; qty: number; regrow: number; months: number[]; terrains: number[]; bearsWhen: string; weight: number }; lore: { vague: string; category: string; rarity: "Common" | "Uncommon" | "Rare"; found: string; patron: string; season: string; mundane: string; magical: string; habits: string } }
const SPRING = [9, 10, 11], SUMMER = [0, 1, 2], AUTUMN = [3, 4, 5], ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const NEW_PLANTS: NewPlant[] = [
  { item: "Myrtle", name: "Myrtle", greek: "myrsine", value: 3, desc: "Glossy, scented myrtle with starry white flowers: Aphrodite's, for brides' crowns.",
    forage: { id: "myrtle", qty: 2, regrow: 3, months: [...SPRING, ...SUMMER, 3], terrains: [7, 1, 3], bearsWhen: "spring to early autumn", weight: 2 },
    lore: { vague: "a glossy, scented shrub", category: "Shrub", rarity: "Common", found: "Coastal Waters, Flowering Valleys, Farmlands", patron: "Aphrodite", season: "Spring to autumn", mundane: "Scent; berries for flavoring", magical: "Love; brides' crowns", habits: "Grows by the sea and in gardens. Aphrodite hid behind myrtle when she rose from the foam." } },
  { item: "Ivy", name: "Ivy", greek: "kissos", value: 2, desc: "Dionysus' evergreen: for crowns and the thyrsus.",
    forage: { id: "ivy", qty: 2, regrow: 3, months: ALL, terrains: [2, 4], bearsWhen: "any time", weight: 2 },
    lore: { vague: "a dark climbing vine", category: "Vine", rarity: "Common", found: "Wild Forests, Mineral Hills", patron: "Dionysus", season: "Evergreen", mundane: "—", magical: "Revelry; the god's crown", habits: "Climbs rocks and trees, green the year round." } },
  { item: "Poplar", name: "White poplar", greek: "leuke", value: 3, desc: "Leaves green above and silver below: Heracles wore it home from Hades, and the white is his sweat.",
    forage: { id: "poplar", qty: 2, regrow: 3, months: [...SPRING, ...SUMMER], terrains: [5, 1], bearsWhen: "spring and summer", weight: 2 },
    lore: { vague: "a tall tree with silvery leaves", category: "Tree", rarity: "Common", found: "Marshy Swamps, Flowering Valleys", patron: "Ares", season: "Spring, summer", mundane: "Light timber", magical: "Heroic courage; funeral games", habits: "Grows by water. Its leaves flicker silver in any wind." } },
  { item: "Parsley", name: "Parsley", greek: "selinon", value: 2, desc: "Wild parsley, for purification, the dead, and the crowns of the Nemean games.",
    forage: { id: "parsley", qty: 2, regrow: 3, months: [...SPRING, ...SUMMER, ...AUTUMN], terrains: [3, 1, 4], bearsWhen: "spring to autumn", weight: 2 },
    lore: { vague: "a low, bright-leaved herb", category: "Herb", rarity: "Common", found: "Farmlands, Flowering Valleys, Mineral Hills", patron: "Hades", season: "Spring to autumn", mundane: "Flavoring", magical: "Purification; funeral rites", habits: "Grows at field edges and, they say, wherever a hero's blood was spilled." } },
  { item: "Celery", name: "Wild celery", greek: "selinon agrion", value: 2, desc: "Marsh celery, rank and green: the victor's crown at the Isthmian and Nemean games.",
    forage: { id: "celery", qty: 2, regrow: 3, months: [...SPRING, ...SUMMER], terrains: [5, 7], bearsWhen: "spring and summer", weight: 2 },
    lore: { vague: "a rank green marsh plant", category: "Herb", rarity: "Common", found: "Marshy Swamps, Coastal Waters", patron: "Poseidon", season: "Spring, summer", mundane: "Food, medicine", magical: "Victory; stamina", habits: "Grows in wet ground and brackish marshes." } },
];
for (const h of NEW_PLANTS) {
  ITEMS[h.item] = { id: h.item, name: h.name, greek: h.greek, value: h.value, kind: "material", desc: h.desc };
  FORAGE[h.forage.id] = { ...h.forage, item: h.item };
  const f = h.forage;
  LORE[f.id] = { id: f.id, name: h.name, ...h.lore, full: `${f.qty} a picking; ready again after ${f.regrow} days.`, perk: `${h.name} gives 1 more.` };
}
CROPS.Barley = { id: "Barley", name: "Barley", greek: "krithe", days: 9, yield: 3, seasons: ["Winter", "Spring"], aretai: "Oikos", god: "Demeter", value: 3, seedPrice: 5, packet: 5,
  desc: "Demeter's oldest grain: for barley-cakes, groats for the kykeon, and harvest crowns.", seedDesc: "Grows winter and spring. Ripe in 9 watered nights." };
CROPS.Wheat = { id: "Wheat", name: "Wheat", greek: "pyros", days: 10, yield: 3, seasons: ["Spring", "Summer"], aretai: "Oikos", god: "Demeter", value: 4, seedPrice: 7, packet: 5,
  desc: "Golden wheat: fine bread, and crowns for new mothers and the healing.", seedDesc: "Grows spring and summer. Ripe in 10 watered nights." };
for (const id of ["Barley", "Wheat"]) {
  const c = CROPS[id];
  ITEMS[c.id] = { id: c.id, name: c.name, greek: c.greek, kind: "crop", desc: c.desc, value: c.value };
  ITEMS[seedId(c.id)] = { id: seedId(c.id), name: `${c.name} seed`, kind: "seed", desc: c.seedDesc };
}
export const CIRCLET_ICON_IDS = ["OliveSprig", "OakLeaves", "PineBoughs", ...NEW_PLANTS.map((p) => p.item).filter((i) => i !== "Ivy")];

/** Where and when you weave. */
export interface WeaveCtx { scene: string; outdoors: boolean; clock: number; moon: string; season: string; festival: boolean; site?: string; terrain?: number }
export interface WeaveBonus { label: string; n: number }
/** What helps a weaving (Thaumas' location and timing bonuses), for a crown or a wreath of these materials. */
export function weaveBonuses(mats: Material[], kind: "crown" | "wreath", c: WeaveCtx): WeaveBonus[] {
  const out: WeaveBonus[] = [], add = (ok: boolean, label: string, n: number) => { if (ok) out.push({ label, n }); };
  add(c.clock < 1.5, "Dawn, new beginnings", 1);
  add(c.festival, "A festival", 3);
  add(kind === "wreath" && c.moon === "New moon", "The new moon: Hecate's blessing on protective work", 1);
  add(c.moon === "Full moon" && mats.some((m) => m.wild), "The full moon: Artemis' blessing on wild materials", 2);
  add(mats.length > 0 && mats.every((m) => m.seasons.includes(c.season)), "Every material in its season", 2);
  add(c.outdoors && c.scene !== "Village", "Woven outdoors, in the open", 1);
  add(c.site === "delphi", "At Delphi, a great temple", 3);
  add(c.terrain === 9 && c.site !== "delphi", "The sacred mountains, a holy grove", 2);
  add(c.scene === "Village", "At the village shrine", 2);
  add(kind === "wreath" && c.scene === "House", "Your household hearth", 1);
  const gods = mats.map((m) => m.god);
  add(gods.length > 1 && new Set(gods).size < gods.length, "Materials of one god together", 1);
  return out;
}
/** How long a circlet keeps its power, in days: the least hardy material, unless woven at a festival or a holy place. */
export function weaveDays(mats: Material[], c: WeaveCtx): number {
  if (c.festival || c.site === "delphi") return 28;
  if (c.terrain === 9) return 14;
  return Math.min(...mats.map((m) => m.days));
}
