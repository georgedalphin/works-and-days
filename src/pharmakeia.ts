/**
 * Pharmakeia: the Art of herbs, drugs and charms (Thaumas: Herbal Healing, Protective Amulet; the Core Rules'
 * Medicinal Plants and Magical Botanical Components; the Component Reference tables).
 *
 * Every herb and substance carries aspects: what it is good for, and how strongly (Yarrow: Healing 3; Laurel:
 * Sight 2, Warding 1). Up to four go in the mortar. The strongest aspect of the mix (less its opposite) decides
 * the remedy and how potent its herbs make it. Then the work itself: Gnosis (knowing what each plant does),
 * Techne (the dose and the preparing) and one more Aretai by the remedy, each d12 + Aretai + bonuses against a CR.
 * The bonuses are the Thaumas conditions: the hour, the moon, the season, the place, fresh herbs, a slow steeping,
 * your heart poured in (Pathos). Successes set the result, as in Thaumatapoiia: none, the brew is spoiled;
 * one, it comes out a step weaker; two, as the herbs promise; three, a step stronger.
 */
import { ITEMS, RECIPES, CROPS, seedId } from "./data";
import { FORAGE } from "./forage";
import { LORE } from "./lore";

export type Aspect = "healing" | "cleansing" | "sleep" | "sight" | "warding" | "love" | "courage" | "venom";
export interface AspectDef {
  id: Aspect; name: string; greek: string; god: string; color: string;
  /** The aspect that spoils this one in a mix: it is taken off the total. */
  opposite?: Aspect;
  /** The three checks: Gnosis, Techne and one by the remedy. */
  checks: { aretai: string; label: string; cr: number }[];
}
export const ASPECTS: Record<Aspect, AspectDef> = {
  healing: { id: "healing", name: "Healing", greek: "iasis", god: "Apollo", color: "#9ad07a", opposite: "venom",
    checks: [{ aretai: "Gnosis", label: "Know which plant does what", cr: 10 }, { aretai: "Techne", label: "Dose, timing, how to apply it", cr: 9 }, { aretai: "Kardia", label: "A caring hand", cr: 8 }] },
  cleansing: { id: "cleansing", name: "Cleansing", greek: "katharsis", god: "Artemis", color: "#bfe4f0",
    checks: [{ aretai: "Gnosis", label: "Know what purifies", cr: 10 }, { aretai: "Techne", label: "Steep and strain it clean", cr: 9 }, { aretai: "Pneuma", label: "A pure intention", cr: 9 }] },
  sleep: { id: "sleep", name: "Sleep", greek: "hypnos", god: "Hermes", color: "#8a8ad0", opposite: "courage",
    checks: [{ aretai: "Gnosis", label: "Know the sleep-bringers", cr: 10 }, { aretai: "Techne", label: "Measure it: too much, and they never wake", cr: 10 }, { aretai: "Metis", label: "A light touch", cr: 8 }] },
  sight: { id: "sight", name: "Sight", greek: "manteia", god: "Apollo", color: "#f0d878",
    checks: [{ aretai: "Gnosis", label: "Know the seers' plants", cr: 10 }, { aretai: "Techne", label: "Dry and bind them for burning", cr: 9 }, { aretai: "Ourania", label: "Open the inner eye", cr: 10 }] },
  warding: { id: "warding", name: "Warding", greek: "phylake", god: "Athena", color: "#7aa0e0",
    checks: [{ aretai: "Gnosis", label: "Know what protects against what", cr: 7 }, { aretai: "Techne", label: "Bind it into a charm", cr: 8 }, { aretai: "Pneuma", label: "Imbue it with protective intent", cr: 9 }] },
  love: { id: "love", name: "Love", greek: "eros", god: "Aphrodite", color: "#f2a6c4",
    checks: [{ aretai: "Gnosis", label: "Know the sweet plants", cr: 9 }, { aretai: "Techne", label: "Press and blend the scent", cr: 9 }, { aretai: "Phoenix", label: "Mean it", cr: 10 }] },
  courage: { id: "courage", name: "Courage", greek: "thymos", god: "Ares", color: "#e07050", opposite: "sleep",
    checks: [{ aretai: "Gnosis", label: "Know the heartening herbs", cr: 9 }, { aretai: "Techne", label: "Brew it strong", cr: 9 }, { aretai: "Thymos", label: "Your own fire in it", cr: 10 }] },
  venom: { id: "venom", name: "Venom", greek: "toxikon", god: "Hecate", color: "#8ac040", opposite: "healing",
    checks: [{ aretai: "Gnosis", label: "Know the deadly plants", cr: 11 }, { aretai: "Techne", label: "Draw it out without touching it", cr: 10 }, { aretai: "Metis", label: "Keep your nerve", cr: 9 }] },
};
export const ASPECT_IDS = Object.keys(ASPECTS) as Aspect[];

/**
 * What each thing brings to the mortar. `lore` is its lore subject (if it has one); `toxic` ones give off
 * fumes if a brew goes badly wrong. Values follow the Component Reference (Honey +2 healing, Salt +2
 * purification, Laurel +2 prophecy +1 protection, Mandrake +3 love, Hellebore +2 madness +2 cleansing...) and the
 * Core Rules' plant notes.
 */
export interface HerbDef { aspects: Partial<Record<Aspect, number>>; lore?: string; toxic?: boolean }
export const HERBS: Record<string, HerbDef> = {
  // Things the farm and the wild already give.
  Honey: { aspects: { healing: 2, cleansing: 1 } },
  Milk: { aspects: { healing: 1, sleep: 1 } },
  Wine: { aspects: { courage: 1, love: 1 } },
  OliveOil: { aspects: { warding: 1, healing: 1 } },
  Wax: { aspects: { warding: 1 } },
  Thyme: { aspects: { healing: 1, cleansing: 1, courage: 1 }, lore: "thyme" },
  Mint: { aspects: { healing: 1, cleansing: 1 } },
  MountainTea: { aspects: { healing: 2 }, lore: "mountaintea" },
  Fennel: { aspects: { healing: 1, courage: 1 }, lore: "fennel" },
  SeaFennel: { aspects: { healing: 1 }, lore: "seafennel" },
  Saltbush: { aspects: { cleansing: 1 }, lore: "saltbush" },
  Mushrooms: { aspects: { sight: 2, venom: 1 }, lore: "mushrooms", toxic: true },
  Ivy: { aspects: { sight: 1, courage: 1 } },
  Flowers: { aspects: { love: 1, sleep: 1 }, lore: "poppy" },
  Garland: { aspects: { love: 2 } },
  Moly: { aspects: { warding: 4 } },
  Tusk: { aspects: { warding: 2, courage: 1 } },
  Antler: { aspects: { courage: 1, warding: 1 } },
  OwlFeather: { aspects: { sight: 2 }, lore: "owlfeather" },
  Feather: { aspects: { sight: 1 } },
  Obsidian: { aspects: { sight: 1, venom: 1 }, lore: "obsidian" },
  Amber: { aspects: { warding: 2 }, lore: "amber" },
  Pearl: { aspects: { love: 2 } },
  // Herbs of the Core Rules' tables, gathered in the wild (forage below) or grown at home.
  Sage: { aspects: { healing: 2, cleansing: 1 }, lore: "sage" },
  Yarrow: { aspects: { healing: 3 }, lore: "yarrow" },
  WillowBark: { aspects: { healing: 2, sleep: 1 }, lore: "willow" },
  Dittany: { aspects: { healing: 4 }, lore: "dittany" },
  Wormwood: { aspects: { cleansing: 2, warding: 1 }, lore: "wormwood" },
  Squill: { aspects: { cleansing: 2, warding: 2 }, lore: "squill" },
  Laurel: { aspects: { sight: 2, warding: 1 }, lore: "laurel" },
  Asphodel: { aspects: { warding: 2, sleep: 1 }, lore: "asphodel" },
  Cyclamen: { aspects: { sleep: 2, love: 1 }, lore: "cyclamen" },
  WildRose: { aspects: { love: 3, healing: 1 }, lore: "wildrose" },
  SeaHolly: { aspects: { love: 2, warding: 1 }, lore: "seaholly" },
  Mandrake: { aspects: { love: 3, sleep: 2 }, lore: "mandrake", toxic: true },
  Hellebore: { aspects: { cleansing: 2, venom: 2 }, lore: "hellebore", toxic: true },
  Henbane: { aspects: { sight: 2, venom: 2, sleep: 1 }, lore: "henbane", toxic: true },
  Hemlock: { aspects: { venom: 3, sleep: 1 }, lore: "hemlock", toxic: true },
  Poppy: { aspects: { sleep: 3, healing: 1 } },
  // The crown-makers' plants (circlets.ts) have their uses in the mortar too.
  Myrtle: { aspects: { love: 2, cleansing: 1 }, lore: "myrtle" },
  Parsley: { aspects: { cleansing: 2 }, lore: "parsley" },
  Celery: { aspects: { healing: 1, courage: 1 }, lore: "celery" },
  Poplar: { aspects: { courage: 1, warding: 1 }, lore: "poplar" },
  OakLeaves: { aspects: { courage: 1, warding: 1 } },
  Barley: { aspects: { healing: 1 } },
  Wheat: { aspects: { healing: 1 } },
  Garlic: { aspects: { warding: 2, healing: 1 } },
};

// ---- the new herbs as items, forage and lore ----
const SPRING = [9, 10, 11], SUMMER = [0, 1, 2], AUTUMN = [3, 4, 5], WINTER = [6, 7, 8], ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
interface NewHerb {
  item: string; name: string; greek: string; value: number; desc: string;
  forage: { id: string; qty: number; regrow: number; months: number[]; terrains: number[]; bearsWhen: string; weight: number };
  lore: { vague: string; category: string; rarity: "Common" | "Uncommon" | "Rare"; found: string; patron: string; season: string; mundane: string; magical: string; habits: string };
}
const NEW_HERBS: NewHerb[] = [
  { item: "Sage", name: "Sage", greek: "elelisphakos", value: 4, desc: "Grey, velvet leaves that smell of camphor. Cleans wounds and sore throats.",
    forage: { id: "sage", qty: 2, regrow: 3, months: [...SPRING, ...SUMMER], terrains: [4, 12, 1], bearsWhen: "spring and summer", weight: 3 },
    lore: { vague: "a grey, velvet-leaved shrub", category: "Herb", rarity: "Common", found: "Mineral Hills, Dominating Heights, Flowering Valleys", patron: "Zeus", season: "Leaves spring, summer", mundane: "Medicine for throat and wounds", magical: "Healing; cleansing smoke", habits: "Grows wild across Hellas on dry slopes. Pick the young leaves." } },
  { item: "Yarrow", name: "Yarrow", greek: "achilleios", value: 5, desc: "Feathery leaves and flat white flowers: Achilles' herb, which Chiron taught him to lay on wounds. It stops bleeding.",
    forage: { id: "yarrow", qty: 2, regrow: 4, months: [11, 0, 1, 2], terrains: [1, 10, 3], bearsWhen: "early summer to autumn", weight: 2 },
    lore: { vague: "a feathery plant with flat white flowers", category: "Herb", rarity: "Common", found: "Flowering Valleys, Windswept Plains, Farmlands", patron: "Ares", season: "Flowers summer", mundane: "Staunches bleeding", magical: "Healing (strong)", habits: "The soldiers' herb: crush it onto a cut and the blood stops." } },
  { item: "WillowBark", name: "Willow bark", greek: "itea", value: 3, desc: "Bitter inner bark from a water willow. It brings down fever and eases pain.",
    forage: { id: "willow", qty: 2, regrow: 6, months: ALL, terrains: [5, 1], bearsWhen: "any time", weight: 2 },
    lore: { vague: "a drooping waterside tree", category: "Tree", rarity: "Common", found: "Marshy Swamps, Flowering Valleys", patron: "Hera", season: "All year", mundane: "Fever and pain; baskets from the withies", magical: "Healing; gentle sleep", habits: "Strip a little bark at a time, and the tree will heal and give again." } },
  { item: "Dittany", name: "Dittany", greek: "diktamnon", value: 40, desc: "Woolly, round leaves from a cliff face. Wounded goats seek it out; laid on a wound it draws out the arrow and heals it clean.",
    forage: { id: "dittany", qty: 1, regrow: 8, months: [...SUMMER, 3], terrains: [12, 9], bearsWhen: "summer", weight: 1 },
    lore: { vague: "a woolly plant clinging to a cliff", category: "Herb", rarity: "Rare", found: "Dominating Heights, Sacred Mountains (cliffs)", patron: "Artemis", season: "Summer", mundane: "The finest wound herb", magical: "Healing (very strong)", habits: "Grows only on sheer rock. Artemis' herb: wounded animals know it by instinct." } },
  { item: "Wormwood", name: "Wormwood", greek: "apsinthion", value: 6, desc: "Silver, bitter artemisia, sacred to Artemis. Drives out worms and fleas, and is burned to purify.",
    forage: { id: "wormwood", qty: 2, regrow: 4, months: [...SUMMER, 3, 4], terrains: [10, 8], bearsWhen: "summer and autumn", weight: 2 },
    lore: { vague: "a silvery, bitter-smelling bush", category: "Herb", rarity: "Common", found: "Windswept Plains, Desolate Desert", patron: "Artemis", season: "Summer, autumn", mundane: "Purges worms; repels fleas", magical: "Purification; a little warding", habits: "Bitter as its name. Hung in a house it keeps the vermin out." } },
  { item: "Squill", name: "Squill", greek: "skilla", value: 8, desc: "A great sea onion. Hung over the door it wards off the evil eye; it is struck on the pharmakos at the Thargelia.",
    forage: { id: "squill", qty: 1, regrow: 6, months: ALL, terrains: [7], bearsWhen: "any time", weight: 2 },
    lore: { vague: "a huge bulb half out of the sand", category: "Herb", rarity: "Common", found: "Coastal Waters", patron: "Apollo", season: "Bulbs all year, flowers autumn", mundane: "Heart medicine; rat poison", magical: "Purification, the evil eye turned away", habits: "Dig the bulb from the shore sand. Its white spikes flower at summer's end." } },
  { item: "Laurel", name: "Laurel leaves", greek: "daphne", value: 5, desc: "Daphne, Apollo's tree. The Pythia chews it before she prophesies; its smoke opens the eyes.",
    forage: { id: "laurel", qty: 2, regrow: 4, months: ALL, terrains: [2, 9], bearsWhen: "any time", weight: 2 },
    lore: { vague: "a glossy evergreen tree", category: "Tree", rarity: "Common", found: "Wild Forests, Sacred Mountains", patron: "Apollo", season: "Evergreen", mundane: "Wreaths; flavoring", magical: "Prophecy; a little protection", habits: "Evergreen: take leaves any time. Burned, it crackles and speaks." } },
  { item: "Asphodel", name: "Asphodel root", greek: "asphodelos", value: 20, desc: "The pale flower of Hades' meadows, and its tuberous root. It holds the restless dead to their place.",
    forage: { id: "asphodel", qty: 1, regrow: 5, months: [...WINTER, ...SPRING], terrains: [10, 4, 11], bearsWhen: "winter and spring", weight: 2 },
    lore: { vague: "a tall, pale-flowered lily", category: "Flower", rarity: "Uncommon", found: "Windswept Plains, Mineral Hills, Rugged Badlands", patron: "Hades", season: "Flowers late winter, spring", mundane: "Roasted root, poor man's food", magical: "Binds spirits; wards against the dead", habits: "Asphodel carpets the poorest ground, as it carpets the meadows below." } },
  { item: "Cyclamen", name: "Cyclamen root", greek: "kyklaminos", value: 15, desc: "A round root from a shady rock. Smeared on a threshold, those who cross it grow drowsy; it goes into love-charms too.",
    forage: { id: "cyclamen", qty: 1, regrow: 5, months: [...AUTUMN, ...WINTER], terrains: [2, 4], bearsWhen: "autumn and winter", weight: 2 },
    lore: { vague: "a small pink flower with swept-back petals", category: "Flower", rarity: "Uncommon", found: "Wild Forests, Mineral Hills (shaded limestone)", patron: "Hecate", season: "Flowers autumn, winter", mundane: "—", magical: "Sleep; love-charms", habits: "Flowers in the shade of rocks as the year turns cold." } },
  { item: "WildRose", name: "Rose petals", greek: "rhodon", value: 8, desc: "Wild dog-rose petals, pink and sweet: Aphrodite's flower, which sprang from Adonis' blood.",
    forage: { id: "wildrose", qty: 2, regrow: 4, months: [10, 11, 0], terrains: [1, 3], bearsWhen: "late spring and early summer", weight: 2 },
    lore: { vague: "a thorny, arching bush", category: "Flower", rarity: "Common", found: "Flowering Valleys, Farmlands", patron: "Aphrodite", season: "Flowers late spring", mundane: "Perfume; rose-oil", magical: "Love (strong); beauty", habits: "Flowers just as spring turns to summer, and then not again for a year." } },
  { item: "SeaHolly", name: "Sea holly", greek: "eryngion", value: 10, desc: "Blue-grey, spiny, from the dunes. Eros' plant: it goes into love-charms, and turns back curses.",
    forage: { id: "seaholly", qty: 1, regrow: 4, months: SUMMER, terrains: [7], bearsWhen: "summer", weight: 2 },
    lore: { vague: "a spiny blue-grey plant in the dunes", category: "Herb", rarity: "Uncommon", found: "Coastal Waters", patron: "Aphrodite", season: "Summer", mundane: "Candied root", magical: "Love; turns back curses", habits: "Grows in the sand above the tide line. Mind the spines." } },
  { item: "Mandrake", name: "Mandrake root", greek: "mandragoras", value: 45, desc: "A root shaped like a little man. It screams when it is pulled up. Hecate's plant: love, binding and deep sleep.",
    forage: { id: "mandrake", qty: 1, regrow: 20, months: [...AUTUMN, ...WINTER, 9], terrains: [2], bearsWhen: "autumn to spring", weight: 1 },
    lore: { vague: "a low rosette of dark leaves", category: "Herb", rarity: "Rare", found: "Wild Forests", patron: "Hecate", season: "Autumn to spring", mundane: "A strong sleeping drug", magical: "Love and binding; deep sleep", habits: "The root screams as it comes up. The root-cutters dig it at night, facing west, and stop their ears." } },
  { item: "Hellebore", name: "Black hellebore", greek: "helleboros", value: 25, desc: "Melampus cured the mad daughters of Proetus with it. A little purges; more brings madness, and death.",
    forage: { id: "hellebore", qty: 1, regrow: 5, months: [...WINTER, 9], terrains: [9, 12], bearsWhen: "winter and early spring", weight: 2 },
    lore: { vague: "a dark-leaved plant with greenish flowers", category: "Herb", rarity: "Uncommon", found: "Sacred Mountains, Dominating Heights", patron: "Dionysus", season: "Flowers winter", mundane: "A violent purge", magical: "Cleansing; madness; poison", habits: "Flowers in the snow. Handle it with care, and wash after." } },
  { item: "Henbane", name: "Henbane", greek: "hyoskyamos", value: 20, desc: "Sticky, foul-smelling leaves. A little brings visions; more, confusion and death. Apollo's and Hecate's both.",
    forage: { id: "henbane", qty: 1, regrow: 5, months: [...SPRING, ...SUMMER], terrains: [11, 8, 4], bearsWhen: "spring and summer", weight: 2 },
    lore: { vague: "a sticky, ill-smelling weed", category: "Herb", rarity: "Uncommon", found: "Rugged Badlands, Desolate Desert, Mineral Hills", patron: "Apollo", season: "Spring, summer", mundane: "Painkiller", magical: "Visions; poison", habits: "Grows in waste ground and old rubble. The smell warns you off." } },
  { item: "Hemlock", name: "Hemlock", greek: "koneion", value: 15, desc: "Spotted stems, a mousy smell. A little sedates; more creeps up from the feet and stops the heart, as it did Socrates'.",
    forage: { id: "hemlock", qty: 1, regrow: 5, months: [10, 11, 0, 1], terrains: [5, 1], bearsWhen: "late spring and summer", weight: 2 },
    lore: { vague: "a tall plant with purple-spotted stems", category: "Herb", rarity: "Uncommon", found: "Marshy Swamps, Flowering Valleys (damp ground)", patron: "Hades", season: "Late spring, summer", mundane: "A sedative, in the smallest doses", magical: "Poison (deadly)", habits: "Grows in damp ground like a harmless parsley. It is not." } },
];
for (const h of NEW_HERBS) {
  ITEMS[h.item] = { id: h.item, name: h.name, greek: h.greek, value: h.value, kind: "material", desc: h.desc };
  FORAGE[h.forage.id] = { ...h.forage, item: h.item };
  const f = h.forage;
  LORE[f.id] = { id: f.id, name: h.item === "WildRose" ? "Wild rose" : h.name.replace(/ (root|leaves|bark)$/, ""), ...h.lore,
    full: `${f.qty} a picking; ready again after ${f.regrow} days.${HERBS[h.item]?.toxic ? " Toxic: a spoiled brew with it gives off fumes." : ""}`, perk: `${h.name} gives 1 more.` };
}

/** Two crops for the garden: the opium poppy and garlic. */
CROPS.Poppy = { id: "Poppy", name: "Poppy", greek: "mekon", days: 8, yield: 2, seasons: ["Spring", "Summer"], aretai: "Oikos", god: "Demeter", value: 6, seedPrice: 10, packet: 3,
  desc: "Seed heads of the opium poppy, Demeter's flower: the tears that weep from them bring sleep and ease pain.", seedDesc: "Grows spring and summer. Ripe in 8 watered nights." };
CROPS.Garlic = { id: "Garlic", name: "Garlic", greek: "skorodon", days: 9, yield: 3, seasons: ["Autumn", "Winter", "Spring"], aretai: "Oikos", god: "Hecate", value: 2, seedPrice: 6, packet: 4,
  desc: "A braid of garlic: medicine, food, and hung at the door against the things of the dark. Hecate's suppers are left with it.", seedDesc: "Grows autumn to spring. Ripe in 9 watered nights." };
for (const id of ["Poppy", "Garlic"]) {
  const c = CROPS[id];
  ITEMS[c.id] = { id: c.id, name: c.name, greek: c.greek, kind: "crop", desc: c.desc, value: c.value };
  ITEMS[seedId(c.id)] = { id: seedId(c.id), name: `${c.name} seed`, kind: "seed", desc: c.seedDesc };
}

// ---- the remedies ----
export interface RemedyDef { id: string; aspect: Aspect; name: string; greek: string; verb: string; desc: string; tiers: [string, string, string] }
export const REMEDIES: Record<Aspect, RemedyDef> = {
  healing: { id: "pharm_healing", aspect: "healing", name: "Healing salve", greek: "malagma", verb: "Smear it on your wounds",
    desc: "A salve of wound-herbs in honey.", tiers: ["Vitality +⅓", "Vitality +⅔", "All Vitality back, and Energy +20"] },
  cleansing: { id: "pharm_cleansing", aspect: "cleansing", name: "Purifying draught", greek: "katharmos", verb: "Drink it",
    desc: "Bitter and clean: it washes miasma from body and soul, as is proper before the rites.",
    tiers: ["Pure for half a day: offerings please the gods 1 more, and Arts' CRs are 2 lower", "Pure for a day", "Pure for two days, and Energy +15"] },
  sleep: { id: "pharm_sleep", aspect: "sleep", name: "Sleeping draught", greek: "hypnotikon", verb: "Drink it, or blow it in a creature's face",
    desc: "Poppy-tears and sleep-roots. Drunk before bed, you sleep deep; blown at a beast close by, it lies down and sleeps.",
    tiers: ["Sleep tonight rests you wholly; a beast near you sleeps", "As before; a larger beast too", "As before; even a monster sleeps, and sleep tonight heals you wholly"] },
  sight: { id: "pharm_sight", aspect: "sight", name: "Seer's smoke", greek: "thymiama mantikon", verb: "Burn it and breathe the smoke",
    desc: "Laurel and stranger leaves, bound to be burned. In the smoke you see what is hidden.",
    tiers: ["For 12 hours you see what any plant bears, known or not; the next omen you read aright", "The same for a day", "The same for two days"] },
  warding: { id: "pharm_warding", aspect: "warding", name: "Protective amulet", greek: "periapton", verb: "Tie it on",
    desc: "A little bag of protective herbs on a red cord. It turns the evil eye: the next trouble a god sends you, and keeps the restless dead off.",
    tiers: ["For 3 days, or until it turns one trouble aside", "For 7 days; blows land 1 softer", "For 14 days; blows land 1 softer"] },
  love: { id: "pharm_love", aspect: "love", name: "Love charm", greek: "philtron", verb: "Wear it as a scent",
    desc: "Rose and sweet roots: not to force anyone's heart, but to open it a little. People warm to you.",
    tiers: ["For 12 hours: +1 when you chat or give", "For a day: +1, and gifts +1 more", "For two days: +2, and gifts +1 more"] },
  courage: { id: "pharm_courage", aspect: "courage", name: "Hero's draught", greek: "pharmakon thymou", verb: "Drink it",
    desc: "Strong, hot and herbal. Fear goes out of you.", tiers: ["Thymos +1 for 6 hours", "Thymos +2 for 12 hours", "Thymos +2 and Kratos +1 for 12 hours, Energy +15"] },
  venom: { id: "pharm_venom", aspect: "venom", name: "Arrow poison", greek: "toxikon", verb: "Coat your arrows and javelins with it",
    desc: "The word toxic comes from it: the archers' poison. A poisoned beast weakens and falls. (Brewing it is no light thing: +1 Hubris.)",
    tiers: ["Your next 6 shots are poisoned: a hit costs the beast one more wound, soon after", "The next 10 shots", "The next 16 shots, and each poisoned wound hurts twice"] },
};
export const REMEDY_IDS = Object.values(REMEDIES).map((r) => r.id);
/** Everything new that needs an icon. */
export const PHARM_ICON_IDS = [...NEW_HERBS.map((h) => h.item), ...Object.values(REMEDIES).map((r) => r.id), "Mortar"];
export const remedyOf = (id: string) => Object.values(REMEDIES).find((r) => r.id === id);
for (const r of Object.values(REMEDIES)) ITEMS[r.id] = { id: r.id, name: r.name, greek: r.greek, value: r.aspect === "venom" ? 18 : r.aspect === "warding" || r.aspect === "love" ? 14 : 10, kind: "remedy", desc: `${r.desc} ${r.verb} (Space).` };

ITEMS.Mortar = { id: "Mortar", value: 12, name: "Mortar and pestle", greek: "igdis", kind: "tool", desc: "A stone bowl and a pestle, for herbs. Hold it and press Space to work the herb-Art, Pharmakeia, wherever you are: the hour, the moon and the place all matter." };
RECIPES.push({ out: "Mortar", qty: 1, needs: [["Stone", 2], ["Wood", 1]], desc: "A hollowed stone and a pestle of olive wood: for grinding herbs." });

// ---- the conditions (Thaumas: timing and location bonuses, component quality and preparation) ----
export interface BrewCtx {
  clock: number; daylight: number; moon: string; season: string; patron: string | null;
  /** Where: "House" or "Farm" are home; "Wild" has terrain and roads; a site's kind. */
  scene: string; terrain?: number; roads: number; site?: string;
  sunlit: boolean; nearWater: boolean;
}
export interface Cond { label: string; n: number }
export function conditions(a: Aspect, c: BrewCtx): Cond[] {
  const out: Cond[] = [], add = (ok: boolean, label: string, n: number) => { if (ok) out.push({ label, n }); };
  const night = c.clock >= c.daylight, dawn = c.clock < 1.5, dusk = c.clock >= c.daylight - 1.5 && c.clock < c.daylight + 0.5;
  const midday = Math.abs(c.clock - c.daylight / 2) <= 1, midnight = Math.abs(c.clock - (c.daylight + (24 - c.daylight) / 2)) <= 1;
  const home = c.scene === "House" || c.scene === "Farm", crossroads = c.scene === "Wild" && c.roads >= 3;
  const god = ASPECTS[a].god;
  if (c.patron === god) out.push({ label: `${god}'s hour`, n: 2 });
  switch (a) {
    case "healing":
      add(dawn, "Dawn, a liminal hour for healing", 2); add(dusk, "Dusk, a liminal hour for healing", 2);
      add(c.moon === "Waxing moon", "The waxing moon", 2); add(c.moon === "Waning moon", "The waning moon", -1);
      add(c.season === "Spring", "Spring, the growing time", 2); add(c.sunlit, "In the sun: Helios blesses healing", 2); add(home, "At home", 3);
      break;
    case "cleansing":
      add(dawn, "Dawn, the day's beginning", 1); add(c.nearWater, "Running water at hand", 2); add(c.season === "Spring", "Spring", 1);
      add(c.terrain === 9, "The pure air of the sacred mountains", 2); add(c.site === "delphi", "At Delphi, by the Castalian spring", 3);
      break;
    case "sleep":
      add(night, "Night", 1); add(midnight, "Midnight, Hypnos' hour", 1); add(c.moon === "New moon", "The dark of the moon", 1); add(home, "At home", 1);
      break;
    case "sight":
      add(c.moon === "Full moon", "The full moon", 3); add(midday, "Midday, Apollo's height", 2); add(c.season === "Spring", "Spring", -1);
      add(crossroads, "A crossroads", 2); add(c.terrain === 9, "The sacred mountains", 2); add(c.site === "delphi", "At Delphi", 3);
      break;
    case "warding":
      add(dawn, "Dawn brings fresh protection", 2); add(c.moon === "Waning moon", "The waning moon", 2); add(c.season === "Autumn", "Autumn, the binding time", 2);
      add(midnight, "Midnight", 1); add(home, "Your own hearth", 3); add(c.scene === "Wild" && !crossroads, "A wild place: Pan's protection", 2); add(crossroads, "A crossroads: Hecate's", 3); add(c.sunlit, "Sunlight: Helios' witness", 2);
      break;
    case "love":
      add(dusk, "Evening, the lovers' hour", 3); add(c.season === "Spring", "Spring", 2); add(dawn, "Dawn, with the dew", 1);
      add(c.terrain === 1, "A flowering valley", 2); add(c.moon === "Full moon", "The full moon", 1);
      break;
    case "courage":
      add(c.season === "Summer", "Summer, the fire season", 2); add(midday, "Midday, the sun's power", 1); add(dawn, "Dawn", 1); add(c.terrain === 11, "The rugged badlands", 2);
      break;
    case "venom":
      add(c.moon === "New moon", "The dark of the moon", 3); add(dusk, "Dusk, the dying of the day", 2); add(c.season === "Winter", "Winter, the dead season", 2);
      add(crossroads, "A crossroads: Hecate's", 2); add(night, "Night", 1); add(c.terrain === 5, "The marshes", 1);
      break;
  }
  return out;
}

/** What the herbs in the mortar make, before the checks. `known` says which herbs' aspects you know. */
export interface Brew {
  aspect: Aspect | null; total: number; base: number; opposed: number;
  sums: Partial<Record<Aspect, number>>; toxic: boolean;
}
export function brewOf(ings: { id: string; q?: number }[]): Brew {
  const sums: Partial<Record<Aspect, number>> = {};
  for (const g of ings) {
    const h = HERBS[g.id]; if (!h) continue;
    for (const [a, n] of Object.entries(h.aspects) as [Aspect, number][]) sums[a] = (sums[a] ?? 0) + n + ((g.q ?? 1) >= 2 ? 1 : 0);
  }
  let best: Aspect | null = null, total = 0, opposed = 0;
  for (const a of ASPECT_IDS) {
    const opp = ASPECTS[a].opposite, net = (sums[a] ?? 0) - (opp ? sums[opp] ?? 0 : 0);
    if ((sums[a] ?? 0) > 0 && net > total) { best = a; total = net; opposed = opp ? sums[opp] ?? 0 : 0; }
  }
  const base = total <= 0 ? 0 : total <= 2 ? 1 : total <= 4 ? 2 : 3;
  return { aspect: best, total, base, opposed, sums, toxic: ings.some((g) => HERBS[g.id]?.toxic) };
}
/** Successes (0–3) turn the herbs' promise into the remedy's strength, as in Thaumatapoiia. */
export const brewTier = (base: number, successes: number) => (successes <= 0 ? 0 : Math.max(0, Math.min(3, base + (successes - 2))));
