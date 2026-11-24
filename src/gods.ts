/**
 * The gods: favor with each of the Twelve (-12 to +12, Theoi's tiers), what it does for you,
 * household devotion and offerings, the four Cosmic Currencies, and the first Art.
 * See the Dodecatheology and Magic & the Arts docs.
 */
import { WHEEL } from "./data";

export const TWELVE = WHEEL.map((w) => w.god);
export const CHTHONIC = ["Hades", "Hecate"];

/** Theoi's tiers, three points each way. */
export function favorTier(f: number) { return Math.sign(f) * Math.ceil(Math.abs(f) / 3); }
export function favorLabel(f: number) {
  if (f >= 10) return "Chosen agent"; if (f >= 7) return "Genuine approval"; if (f >= 4) return "Known by name"; if (f >= 1) return "Noticed";
  if (f === 0) return "Unknown"; if (f >= -3) return "Displeased"; if (f >= -6) return "Active disapproval"; if (f >= -9) return "Making an example of you"; return "Doom";
}

/** What each god's favor does in play, per tier (negative favor turns it against you). */
export const BOONS: Record<string, string> = {
  Aphrodite: "Chats and gifts warm people a little more (from tier 2).",
  Artemis: "Wild creatures let you closer and are slower to anger.",
  Demeter: "A chance of an extra measure at every harvest.",
  Hephaestus: "Each batch of arrows you make has extra arrows.",
  Poseidon: "Your water jar holds more.",
  Hera: "Study comes easier: a bonus to Gnosis checks.",
  Athena: "Her cunning helps you calm angry beasts.",
  Apollo: "Your arrows land closer to where you aim.",
  Dionysus: "You sense the divine more readily; vines give more.",
  Hermes: "Running costs less Air, and goods sell for more.",
  Ares: "A bonus to strike in close fighting.",
  Zeus: "Heavy labor (felling, stonework) tires you less.",
};

/** Who an offering belongs to, from the Flora & Fauna sheet's Patron column. */
export const OFFER_PATRON: Record<string, string> = {
  Millet: "Demeter", Chickpeas: "Demeter", Melon: "Demeter", Plum: "Demeter", Purslane: "Demeter", Oats: "Demeter",
  Thyme: "Demeter", Honey: "Demeter", Wax: "Demeter", Flowers: "Demeter", Fiber: "Demeter",
  Grapes: "Dionysus", WildGrapes: "Dionysus", Wine: "Dionysus", Must: "Dionysus", Mushrooms: "Dionysus", Milk: "Dionysus",
  Capers: "Aphrodite", Feather: "Aphrodite",
  Clay: "Hephaestus", Ochre: "Hephaestus", Stone: "Hephaestus",
  Wood: "Zeus", Meat: "Zeus",
  Cornel: "Apollo", Antler: "Artemis", Tusk: "Ares",
  Mint: "Hades",
  Fibula: "Athena", Figurine: "Hera", Arrowhead: "Artemis", OldCoin: "Hermes", Nest: "Aphrodite", Fossil: "Poseidon", Obsidian: "Hephaestus",
  Amber: "Apollo", OwlFeather: "Athena", Thunderstone: "Zeus", HeliadTear: "Apollo",
  Garland: "Aphrodite", Cloth: "Athena", Amphora: "Dionysus", WineAmphora: "Dionysus", Lamp: "Hecate",
  SeaFennel: "Poseidon", Saltbush: "Poseidon", MountainTea: "Apollo", Thistle: "Ares", Fennel: "Dionysus",
};
/** Household worship gets you noticed and no further (Theoi): offerings at home reach +3, at the village altar +6. */
export const HOME_CAP = 3, SHRINE_CAP = 6;
export const DEVOTION_STEP = 4; // days of household prayer to a god per +1, up to HOME_CAP

// ---- the Cosmic Currencies ----
export const CURRENCIES = ["Ambrosia", "Kleos", "Pathos", "Hubris"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const CURRENCY_DESC: Record<Currency, string> = {
  Ambrosia: "Divine nourishment: spend it to raise your Aretai.",
  Kleos: "Glory and renown: earned by great deeds, spent on Arts and the proud.",
  Pathos: "What suffering teaches: the fuel of art and deep feeling.",
  Hubris: "Overreach. It gathers when you offend the gods, and it will be called to account.",
};
export const START_CURRENCIES: Record<Currency, number> = { Ambrosia: 2, Kleos: 1, Pathos: 1, Hubris: 0 };
/** Raising an Aretai from n to n+1 costs this much Ambrosia. */
export const raiseCost = (n: number) => Math.ceil((n + 1) / 2);

// ---- the first Art ----
export interface ArtCheck { aretai: string; label: string; cr: number }
export interface Art {
  id: string; name: string; patron: string; teacher: string; teachAt: number;
  requirement: string;
  cost: Partial<Record<Currency, number>>;
  checks: ArtCheck[];
  components: { item: string; label: string }[];
  timing: { id: string; label: string; cr: number }[];
  location: { label: string; cr: number };
  effect: string; days: number;
  failure: { text: string; likelihood: number };
}

export const ARTS: Record<string, Art> = {
  hospitality: {
    id: "hospitality", name: "Hospitality Blessing", patron: "Zeus", teacher: "myrrhine", teachAt: 3,
    requirement: "Performed at your own household hearth.",
    cost: { Kleos: 1 },
    checks: [
      { aretai: "Pneuma", label: "Invocation: call on Zeus Xenios, god of guests", cr: 13 },
      { aretai: "Oikos", label: "Offering: feed the hearth and set out the guest-portion", cr: 14 },
      { aretai: "Logos", label: "The words of welcome", cr: 13 },
    ],
    components: [
      { item: "Honey", label: "Honey for the guest-cake" },
      { item: "Milk", label: "Milk for the libation" },
      { item: "Flowers", label: "A garland of wildflowers" },
      { item: "Grapes", label: "Grapes for the wine" },
      { item: "Millet", label: "Grain for the hearth" },
      { item: "Wine", label: "Wine to pour for Zeus Xenios" },
    ],
    timing: [
      { id: "zeusHour", label: "Zeus's hour (12)", cr: -2 },
      { id: "fullMoon", label: "Under the full moon", cr: -1 },
      { id: "hosted", label: "You have hosted a stranger in the last three days", cr: -2 },
    ],
    location: { label: "Your household hearth", cr: -1 },
    effect: "For 7 days, each chat warms a villager by 1 more, and hosting a stranger pleases the gods twice over.",
    days: 7,
    failure: { text: "Zeus finds the rite careless: favor with Zeus -1.", likelihood: 4 },
  },
};
