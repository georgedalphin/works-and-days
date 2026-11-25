/**
 * What the gods' favor and disfavor do, tier by tier.
 *
 *   ±1  "Noticed"     a small help or hindrance in the god's domain (the passive boon, scaling with tier)
 *   ±4  "Known"       gifts left for you in their domain, or small troubles there
 *   ±8  "Approval"    a power you may call on in their domain (recharges), or their anger breaking out there
 *  ±10  "Chosen"      the god's own Aretai rises (or falls) by one while it lasts; gifts may be treasures
 *  +12               thorough protection from anything in the god's domain
 *  −12               genuine danger there
 *
 * All favor drifts back toward 0, in both directions, unless kept up.
 * Hades and Hecate, beneath the earth, keep the same tiers.
 */
import { TWELVE } from "./gods";

export const ALL_GODS = [...TWELVE, "Hades", "Hecate"];

/** Places that belong to a god, beyond their own land of the Cosmic Wheel. */
export type Place = "farm" | "home" | "village" | "road" | "crossroads" | "crossnight" | "graveyard" | "gravenight" | "cave" | "storm";

export interface DivineDef {
  /** Wild lands of the Wheel that are theirs. */
  terrains: number[];
  places: Place[];
  domain: string;
  /** The Aretai a Chosen gains (and the accursed loses). */
  aretai: string;
  /** What a priest says pleases or angers the god. */
  pleases: string;
  angers: string;
  /** The everyday boon, ±1 and up. */
  passive: string;
  /** Gifts found in their domain at +4 and up; at +10 one in four is the treasure. */
  gifts: [string, number][];
  treasure: [string, number];
  trouble: string;
  power: { name: string; desc: string };
  wrath: string;
  ward: string;
  danger: string;
  /** What a priest asks you to bring for the god. */
  wants: [string, number][];
}

export const DIVINE: Record<string, DivineDef> = {
  Aphrodite: {
    terrains: [1], places: ["village"], domain: "the flowering valleys and the company of people", aretai: "Phoenix",
    pleases: "Garlands, flowers, honey; kindness between people; gifts given freely.", angers: "Spurning a kindness, letting a friendship sour, cruelty to lovers and doves.",
    passive: "Chats and gifts warm people more (or less).",
    gifts: [["Flowers", 5], ["Honey", 1], ["Nest", 1], ["Garland", 1]], treasure: ["Garland", 3],
    trouble: "Someone in the village is cool toward you.",
    power: { name: "The charm of her girdle", desc: "Everyone in the village warms to you (+2 with each)." },
    wrath: "Someone in the village turns against you (-2).",
    ward: "No one's regard for you ever falls.",
    danger: "The village turns cold: everyone thinks less of you each day.",
    wants: [["Garland", 1], ["Flowers", 6], ["Honey", 2]],
  },
  Artemis: {
    terrains: [2], places: [], domain: "the wild forests", aretai: "Kardia",
    pleases: "Giving her the share of every deer; taking only what you need; sparing the young.", angers: "Unshared kills, felling the wild oaks, fouling springs, harming her nymphs.",
    passive: "Wild creatures let you closer and are slower (or quicker) to anger; snares catch more.",
    gifts: [["Antler", 1], ["Feather", 4], ["Hide", 1], ["Meat", 2]], treasure: ["Antler", 3],
    trouble: "Something in the forest turns on you.",
    power: { name: "Mistress of beasts", desc: "No wild creature anywhere will attack you for the rest of the day." },
    wrath: "A wolf comes hunting you through her woods.",
    ward: "Wild beasts never turn on you.",
    danger: "Her wolves hunt you in the forest, and every beast is quick to anger.",
    wants: [["Antler", 1], ["Hide", 2], ["Meat", 3]],
  },
  Demeter: {
    terrains: [3], places: ["farm"], domain: "fields, farmland and your own homestead", aretai: "Oikos",
    pleases: "First fruits of every harvest; tending the soil; bread shared with the hungry.", angers: "Letting crops wither, wasting grain, a dirty threshing floor.",
    passive: "A chance of an extra measure (or one fewer) at harvest.",
    gifts: [["seed_Millet", 6], ["seed_Chickpeas", 4], ["Honey", 2], ["seed_Melon", 2]], treasure: ["seed_Mint", 6],
    trouble: "One of your growing crops withers back.",
    power: { name: "The ripening", desc: "Every crop growing on your homestead ripens at once." },
    wrath: "Blight: a third of your crops die.",
    ward: "Your crops never dry out or wither.",
    danger: "Famine: a crop dies on your land every night.",
    wants: [["Millet", 6], ["Chickpeas", 5], ["Honey", 2]],
  },
  Hephaestus: {
    terrains: [4], places: [], domain: "the mineral hills, and every forge and kiln", aretai: "Techne",
    pleases: "Good work honestly made; offerings of ore, ochre and clay; tending the fire.", angers: "Shoddy work, waste of metal, mocking the lame.",
    passive: "Finer (or poorer) work at every station; extra arrows.",
    gifts: [["Copper", 2], ["Ochre", 2], ["Obsidian", 1], ["Clay", 4]], treasure: ["Copper", 6],
    trouble: "Your next piece of station work is spoiled.",
    power: { name: "The god's own hand", desc: "Your next three pieces of station work are excellent." },
    wrath: "One of your tools loses its fine edge.",
    ward: "Your work is never poor, and your tools never fail.",
    danger: "In his hills, the rocks fall on you.",
    wants: [["Copper", 2], ["Ochre", 2], ["Fibula", 1]],
  },
  Poseidon: {
    terrains: [5, 6, 7], places: [], domain: "marsh, sea and shore", aretai: "Metis",
    pleases: "Libations poured into water; shells and fossils returned to him; respect for horses.", angers: "Fouling water, boasting of the sea, taking from it without thanks.",
    passive: "Your water jar holds more (or less).",
    gifts: [["SeaFennel", 3], ["Saltbush", 3], ["Fossil", 1], ["Saltbush", 2]], treasure: ["Fossil", 3],
    trouble: "Your jar spills and you slip in the wet.",
    power: { name: "The Earth-shaker's springs", desc: "Every tilled square on your homestead is watered, and your jar is full." },
    wrath: "Your well runs dry for three days.",
    ward: "Water never hinders you; your jar never runs dry.",
    danger: "In his lands the waters drag at you and pull you under.",
    wants: [["Wine", 2], ["Fossil", 1], ["SeaFennel", 4]],
  },
  Hera: {
    terrains: [6], places: ["home"], domain: "hearth, home and household", aretai: "Gnosis",
    pleases: "A well-kept house; faithfulness; care of the household and its animals.", angers: "Neglected animals, broken oaths, a cold hearth.",
    passive: "Study comes easier (or harder).",
    gifts: [["Milk", 2], ["Cloth", 1], ["Figurine", 1], ["Honey", 1]], treasure: ["Figurine", 2],
    trouble: "One of your goats gives no milk today.",
    power: { name: "Hearth and home", desc: "Fatigue gone and Essence full; your goats are fed and content." },
    wrath: "A goat falls sick: no milk for three days.",
    ward: "Your home is a sanctuary: your goats never go hungry, and sleep there restores you fully.",
    danger: "Your home gives you no rest: sleep there heals you only half.",
    wants: [["Figurine", 1], ["Milk", 3], ["Cloth", 2]],
  },
  Athena: {
    terrains: [7], places: ["village"], domain: "the coasts, the town, the olive and the loom", aretai: "Logos",
    pleases: "Olive oil, woven cloth, cunning used well; learning.", angers: "Boasting, sloppy thinking, misreading her owls.",
    passive: "Her cunning helps (or hinders) you in calming beasts.",
    gifts: [["Olives", 6], ["OliveOil", 1], ["OwlFeather", 1], ["Cloth", 1]], treasure: ["OwlFeather", 3],
    trouble: "Your next study comes to nothing.",
    power: { name: "Owl-eyed", desc: "Your next five studies succeed." },
    wrath: "You forget something you knew (a lore tier).",
    ward: "You never misread an omen.",
    danger: "Each night you forget something you knew.",
    wants: [["OliveOil", 1], ["Cloth", 2], ["Olives", 8]],
  },
  Apollo: {
    terrains: [8], places: [], domain: "the sunlit desert and high places", aretai: "Ourania",
    pleases: "Music, healing herbs, honest prophecy; laurel and cornel.", angers: "Lies, plague-bringing filth, harming his ravens and wolves.",
    passive: "Your arrows land closer to (or farther from) your aim.",
    gifts: [["Cornel", 5], ["MountainTea", 3], ["Amber", 1], ["Arrow", 6]], treasure: ["HeliadTear", 1],
    trouble: "A headache dims your eyes (Fatigue).",
    power: { name: "Far-darter", desc: "Your next six arrows or spear throws fly true." },
    wrath: "A fever takes you.",
    ward: "The sun's heat and arrows shot at you never find you.",
    danger: "His plague arrows: fever wears you down in his lands.",
    wants: [["Cornel", 5], ["MountainTea", 3], ["Amber", 1]],
  },
  Dionysus: {
    terrains: [9], places: ["farm"], domain: "the sacred mountains, the vine and the wine", aretai: "Pneuma",
    pleases: "Wine poured out, ivy, revelry, welcoming strangers to the feast.", angers: "Refusing the god, harming his satyrs and maenads, sour wine.",
    passive: "Your vines give more (or less); rites with his followers go better (or worse).",
    gifts: [["Wine", 2], ["WildGrapes", 5], ["Ivy", 3], ["Grapes", 4]], treasure: ["WineAmphora", 1],
    trouble: "The wine in your vat loses its quality.",
    power: { name: "Liberation", desc: "The must in your vat becomes wine at once, and your weariness lifts." },
    wrath: "The wine in your vat sours to nothing.",
    ward: "His madness never touches you, and his followers are always your friends.",
    danger: "On his mountain, madness seizes you: your feet will not go where you will.",
    wants: [["Wine", 3], ["Ivy", 3], ["Grapes", 6]],
  },
  Hermes: {
    terrains: [10], places: ["road", "crossroads", "village"], domain: "roads, crossroads, markets and the open plains", aretai: "Aiolos",
    pleases: "Stones added to his herms, fair dealing, quick feet, guiding the lost.", angers: "Cheating at the market, ignoring a herm, stealing (badly).",
    passive: "Running costs less (or more) Air, and goods sell for more (or less).",
    gifts: [["OldCoin", 1], ["Arrow", 6], ["Feather", 3], ["Fibula", 1]], treasure: ["OldCoin", 3],
    trouble: "You lose a few coins on the road.",
    power: { name: "Winged sandals", desc: "You are home in an instant." },
    wrath: "Thieves: a fifth of your silver is gone.",
    ward: "You are never robbed, and running costs you nothing.",
    danger: "On his roads you lose your way, and are robbed.",
    wants: [["OldCoin", 1], ["Fibula", 1], ["Arrow", 10]],
  },
  Ares: {
    terrains: [11], places: [], domain: "the rugged badlands and every fight", aretai: "Thymos",
    pleases: "Courage, blood shed in fair fight, tusks and weapons dedicated.", angers: "Cowardice, fleeing a fight you started, scorn of warriors.",
    passive: "A bonus (or penalty) to land blows, and to throw the spear.",
    gifts: [["Tusk", 1], ["Arrow", 8], ["Thistle", 3], ["Meat", 2]], treasure: ["Tusk", 3],
    trouble: "A beast here turns on you.",
    power: { name: "Battle-fury", desc: "For the rest of the day, blows cost half the Fire and land more surely." },
    wrath: "He sends a monster of the land against you.",
    ward: "Blows against you are halved, and can never bring you down.",
    danger: "His monsters hunt you, near home or far.",
    wants: [["Tusk", 1], ["Thistle", 4], ["Hide", 2]],
  },
  Zeus: {
    terrains: [12], places: ["storm"], domain: "the heights, the open sky in a storm, and every guest", aretai: "Kratos",
    pleases: "Hospitality, oaths kept, oak honored, meat burned on his altar.", angers: "Turning away guests, broken oaths, hubris.",
    passive: "Heavy labor tires you less (or more).",
    gifts: [["Wood", 8], ["Meat", 2], ["Feather", 3], ["Stone", 6]], treasure: ["Thunderstone", 1],
    trouble: "A sudden squall soaks you.",
    power: { name: "The thunderbolt", desc: "Lightning strikes everything that threatens you here." },
    wrath: "Lightning strikes beside you.",
    ward: "Storms and heavy labor never wear on you.",
    danger: "Lightning seeks you out under his sky.",
    wants: [["Meat", 3], ["Wood", 10], ["Thunderstone", 1]],
  },
  Hades: {
    terrains: [], places: ["graveyard", "cave"], domain: "graves, caves and everything beneath the earth", aretai: "Kratos",
    pleases: "Due rites for the dead, mint and black offerings, never boasting of wealth.", angers: "Disturbing the dead, robbing graves, speaking his name lightly.",
    passive: "Caves give up more (or less) of their ore.",
    gifts: [["Copper", 2], ["OldCoin", 1], ["Mint", 3], ["Obsidian", 1]], treasure: ["OldCoin", 4],
    trouble: "A chill from the grave (Fatigue).",
    power: { name: "Return from below", desc: "The next time you would fall, you do not." },
    wrath: "A shade rises against you.",
    ward: "Your Life Thread cannot fray.",
    danger: "The dead hunt you by night.",
    wants: [["Mint", 4], ["Honey", 2], ["Milk", 2]],
  },
  Hecate: {
    terrains: [], places: ["crossnight", "gravenight", "cave"], domain: "crossroads and graves at night, and the dark places", aretai: "Metis",
    pleases: "Suppers left at the crossroads at the dark of the moon; torches; respect for the restless dead.", angers: "Mocking magic, harming her torch-bearers, passing a crossroads at night without a word.",
    passive: "The dark hinders you less (or more).",
    gifts: [["Mushrooms", 3], ["Mint", 2], ["Lamp", 1], ["Torch", 2]], treasure: ["Lamp", 2],
    trouble: "Your light gutters out.",
    power: { name: "Torch of the crossroads", desc: "For the rest of the day you carry her light: no darkness hinders you, and the dead let you pass." },
    wrath: "Ghosts gather at the crossroads and come for you.",
    ward: "The dead never harm you, and darkness never hinders you.",
    danger: "At night her ghosts hunt you wherever you go.",
    wants: [["Mushrooms", 3], ["Honey", 2], ["Lamp", 1]],
  },
};

/** Favor tier by the user's thresholds: 0, 1, 4, 8, 10, 12 (signed). */
export function tierOf(f: number): 0 | 1 | 4 | 8 | 10 | 12 | -1 | -4 | -8 | -10 | -12 {
  const a = Math.abs(f), s = Math.sign(f);
  const t = a >= 12 ? 12 : a >= 10 ? 10 : a >= 8 ? 8 : a >= 4 ? 4 : a >= 1 ? 1 : 0;
  return (s * t) as ReturnType<typeof tierOf>;
}
/** The boon, -4..+4, that passive effects scale by: one step per tier. */
export function boonOf(f: number) {
  const a = Math.abs(f);
  return Math.sign(f) * (a >= 10 ? 4 : a >= 8 ? 3 : a >= 4 ? 2 : a >= 1 ? 1 : 0);
}
/** Chance each dawn of a gift (or trouble) waiting in the god's domain. */
export const giftChance = (f: number) => { const a = Math.abs(f); return a >= 10 ? 0.45 : a >= 8 ? 0.3 : a >= 4 ? 0.2 : 0; };
/** Chance, on entering the god's domain, of their wrath breaking out (once a day). */
export const wrathChance = (f: number) => (f <= -12 ? 1 : f <= -10 ? 0.45 : f <= -8 ? 0.25 : 0);
/** Days for a power to come back. */
export const powerRecharge = (f: number) => (f >= 10 ? 10 : 20);
/** Every few days, each favor eases a step back toward nothing. */
export const DRIFT_DAYS = 6;

/** Tier words for each step. */
export const TIER_WORDS: Record<number, string> = {
  12: "Under their protection", 10: "Chosen", 8: "Approval", 4: "Known by name", 1: "Noticed", 0: "Unknown",
  "-1": "Displeased", "-4": "Disapproval", "-8": "Anger", "-10": "Accursed", "-12": "Doom",
};
