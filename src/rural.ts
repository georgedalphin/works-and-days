/**
 * The Rural Arts (Thaumas): simple, practical magic for shepherds, farmers and householders, with hearth fire,
 * sunlight, wild plants and simple offerings. Each is a rite like the Hospitality Blessing: three checks
 * (d12 + Aretai + performance against a CR), lowered by each component brought and by the conditions that hold.
 * Herbal Healing and the Protective Amulet are already the herb-Art's (pharmakeia.ts).
 *
 * Hestia answers to Demeter in this game, Helios to Apollo, and Pan to Hermes his father.
 */
import { ARTS } from "./gods";
import { DISH_IDS } from "./cooking";

const CROP_ITEMS = ["Millet", "Chickpeas", "Melon", "Mint", "Poppy", "Garlic", "Barley", "Wheat", "Grapes", "Olives"];
const GRAIN = ["Millet", "Oats", "Barley", "Wheat"];
const WILD_PLANTS = ["Thistle", "Thyme", "Wormwood", "Hellebore", "Asphodel", "Fennel", "Saltbush", "Squill", "PineBoughs"];

ARTS.hearth = {
  id: "hearth", name: "Hearth Blessing", patron: "Demeter", teacher: "eudora", teachAt: 3, where: "hearth",
  requirement: "At your own household hearth, kept tended. Hestia's grace makes a home a sanctuary.",
  cost: { Pathos: 1 },
  checks: [
    { aretai: "Oikos", label: "Household harmony: the hearth kept as it should be", cr: 12 },
    { aretai: "Kardia", label: "Protective warmth and care", cr: 11 },
    { aretai: "Pneuma", label: "Hestia's blessing called down", cr: 10 },
  ],
  components: [
    { item: "@dish", label: "The first and last portion of your best meal" },
    { item: ["@springwater", "@water"], label: "Pure water (the Naiad's spring is best)" },
    { item: ["Thyme", "Laurel", "Sage", "Wormwood"], label: "Aromatic herbs for the fire" },
  ],
  timing: [
    { id: "morning", label: "Morning, as the household's work begins", cr: -2 },
    { id: "tended", label: "The hearth tended today", cr: -1 },
    { id: "hostedWeek", label: "A house known for hospitality (a guest this week)", cr: -3 },
    { id: "family", label: "A family that loves each other (someone lives with you)", cr: -2 },
    { id: "festDemeter", label: "A festival of Demeter (and Hestia) today", cr: -3 },
  ],
  location: { label: "Your household hearth", cr: 0 },
  effect: "For a month the house is a sanctuary: dishes cooked at your hearth come out richer, you rest better at home, and those who live with you grow fonder every morning.",
  days: 30,
  failure: { text: "The fire smokes and sulks; Demeter, who keeps the hearth here, is put out (favor −1).", likelihood: 4 },
};

ARTS.crop = {
  id: "crop", name: "Crop Blessing", patron: "Demeter", teacher: "theron", teachAt: 2, where: "field",
  requirement: "In your own fields, on the homestead, with planting under your care.",
  cost: {},
  checks: [
    { aretai: "Oikos", label: "Farming knowledge and care for the land", cr: 9 },
    { aretai: "Pneuma", label: "Call on Demeter, Helios and Pan", cr: 10 },
    { aretai: "Phoenix", label: "Understanding of growth and fertility", cr: 8 },
  ],
  components: [
    { item: CROP_ITEMS, label: "First fruits of the last harvest, given back" },
    { item: ["Wine", "Milk"], label: "A libation of wine or milk on the field" },
    { item: GRAIN, label: "Grain burned for the gods" },
  ],
  timing: [
    { id: "spring", label: "Spring planting", cr: -4 },
    { id: "sprouted", label: "A planting just sprouted", cr: -3 },
    { id: "dawn", label: "Sunrise, Helios' blessing", cr: -2 },
    { id: "festDemeter", label: "An agricultural festival today", cr: -2 },
    { id: "yearFarmed", label: "Land you have farmed a year or more", cr: -2 },
  ],
  location: { label: "Your fields", cr: 0 },
  effect: "For a growing season (a month): every harvest gives a measure more, and your plantings bear a dry spell two nights longer before they wither. Share the surplus.",
  days: 30,
  failure: { text: "A blight: one of your plantings withers.", likelihood: 3 },
};

ARTS.flock = {
  id: "flock", name: "Flock Thriving", patron: "Hermes", teacher: "shepherd", teachAt: 0, where: "wild",
  requirement: "In a wild place where Pan is felt, for the flock in your care.",
  cost: {},
  checks: [
    { aretai: "Oikos", label: "Husbandry and care", cr: 11 },
    { aretai: "Kardia", label: "Strength to protect and endure with the flock", cr: 12 },
    { aretai: "Phoenix", label: "Understanding of breeding and life", cr: 10 },
  ],
  components: [
    { item: "@pipes", label: "Pan's pipes, played as well as you can", keep: true },
    { item: "Wine", label: "Wine poured at a spring or cave" },
    { item: "Meat", label: "A meal shared with Pan (you eat it)" },
    { item: ["Flowers", "Thyme", "Garland"], label: "Wild flowers or herbs" },
  ],
  timing: [
    { id: "spring", label: "The breeding season, spring", cr: -4 },
    { id: "noonWild", label: "Noon in the wild, Pan's hour", cr: -3 },
    { id: "meadow", label: "A mountain meadow or wild pasture", cr: -4 },
    { id: "cave", label: "Near a cave or grotto", cr: -3 },
    { id: "festHermes", label: "A festival of Hermes today", cr: -2 },
  ],
  location: { label: "A wild place", cr: 0 },
  effect: "For a season (a month) your goats thrive: a contented goat gives more milk, sickness can't take hold of them, and petting them makes them fonder twice over.",
  days: 30,
  failure: { text: "Pan is unimpressed: your goats turn skittish (affection −1 each).", likelihood: 4 },
};

ARTS.dawn = {
  id: "dawn", name: "Dawn Renewal", patron: "Apollo", teacher: "hermit", teachAt: 0, where: "dawn",
  requirement: "Outdoors, watching the sun come up (the first hour and a half of the day), facing east.",
  cost: {},
  checks: [
    { aretai: "Ourania", label: "The sun's cycle, and the proper moment", cr: 10 },
    { aretai: "Phoenix", label: "Renewal: the day reborn in you", cr: 11 },
    { aretai: "Kardia", label: "The discipline to rise for it", cr: 9 },
  ],
  components: [
    { item: "@water", label: "Clean water, sipped at sunrise" },
    { item: [...GRAIN, ...DISH_IDS], label: "Bread or simple food, shared with the sun" },
  ],
  timing: [
    { id: "equinox", label: "An equinox", cr: -5 },
    { id: "solstice", label: "A solstice", cr: -4 },
    { id: "high", label: "A high place with a clear eastern sky", cr: -4 },
    { id: "seaDawn", label: "A sunrise over the sea", cr: -3 },
    { id: "sameSpot", label: "The place you greeted it last time", cr: -2 },
  ],
  location: { label: "Outdoors at sunrise", cr: 0 },
  effect: "You begin the day blessed: yesterday's weariness gone (Energy +25), and today's work tires you less. Seven mornings running, and Apollo, who is the sun here, notices (+1).",
  days: 1,
  failure: { text: "Groggy despite the early hour: Energy −15.", likelihood: 3 },
};

ARTS.panic = {
  id: "panic", name: "Wild Panic", patron: "Hermes", teacher: "satyrs", teachAt: 2, where: "wild", instant: true,
  requirement: "In the wild, when something threatens. Pan's terror is not a precise weapon.",
  cost: { Hubris: 1 },
  checks: [
    { aretai: "Thymos", label: "Channel the terror without falling to it", cr: 13 },
    { aretai: "Aiolos", label: "The wild, chaotic rush", cr: 12 },
    { aretai: "Pneuma", label: "Pan's own nature", cr: 11 },
  ],
  components: [
    { item: "@pipes", label: "Pan's pipes carried, in respect", keep: true },
    { item: WILD_PLANTS, label: "Wild plants that send beasts running" },
  ],
  timing: [
    { id: "noonWild", label: "Noon in the wilderness", cr: -4 },
    { id: "threatened", label: "Truly threatened: something is coming for you", cr: -3 },
    { id: "deep", label: "Deep wilderness, far from home", cr: -4 },
    { id: "cave", label: "A cave or grotto", cr: -3 },
    { id: "twilight", label: "Twilight, when fear comes naturally", cr: -2 },
  ],
  location: { label: "The wild", cr: 0 },
  effect: "Panic: every creature near you, beast, monster or man, breaks and flees, and those that were coming for you won't come back. (+1 Hubris)",
  days: 0,
  failure: { text: "The terror takes you too: you bolt in blind fright (Energy −20), and whatever was coming for you is not frightened at all.", likelihood: 5 },
};

ARTS.solar = {
  id: "solar", name: "Solar Witness", patron: "Apollo", teacher: "myrrhine", teachAt: 5, where: "sky", instant: true,
  requirement: "Outdoors by day under an open sky, the sun in sight. Helios sees everything under the sun.",
  cost: { Kleos: 1 },
  checks: [
    { aretai: "Ourania", label: "The sun's watch over the world", cr: 13 },
    { aretai: "Logos", label: "Frame the question clearly", cr: 12 },
    { aretai: "Pneuma", label: "Speak to the Titan", cr: 11 },
  ],
  components: [
    { item: ["GoldDust", "OldCoin", "HeliadTear"], label: "Gold or precious metal offered to the sun" },
    { item: "@water", label: "Pure water to catch the sunlight" },
    { item: ["Thyme", "Laurel", "Sage"], label: "Incense burned" },
    { item: "@blood", label: "A little of your own blood (2 Vitality)" },
  ],
  timing: [
    { id: "noon", label: "High noon, the sun at its height", cr: -5 },
    { id: "solstice", label: "A solstice", cr: -4 },
    { id: "edges", label: "Sunrise or sunset", cr: -3 },
    { id: "high", label: "A high place with a clear sky", cr: -3 },
  ],
  location: { label: "Under the open sky", cr: 0 },
  effect: "Helios shows you what he has seen: whether today's omen was truly good, what was stolen from you under the sun and where it went, and every disguise the sun falls on, for the rest of the day.",
  days: 0,
  failure: { text: "Helios does not answer: the shadows fall strangely and tell you nothing.", likelihood: 3 },
};

/** Where and when you are, for the rites. */
export interface ArtCtx {
  scene: string; outdoors: boolean; clock: number; daylight: number; month: number; day: number; season: string;
  moon: string; weather: string; terrain?: number; nearHome: number; cave: boolean; threatened: boolean;
  hostedDays: number; family: boolean; tended: boolean; festGod?: string; sprouted: boolean; years: number;
  spotKey: string; lastDawnSpot?: string;
}
const nearDay = (c: ArtCtx, month: number, day: number) => c.month === month && Math.abs(c.day - day) <= 2;
/** Which of an Art's conditions hold. */
export function artCondition(id: string, c: ArtCtx): boolean {
  const dawn = c.clock < 1.5, noon = Math.abs(c.clock - c.daylight / 2) <= 1, dusk = c.clock >= c.daylight - 1.5 && c.clock < c.daylight + 0.5;
  switch (id) {
    case "morning": return c.clock < 3;
    case "tended": return c.tended;
    case "hostedWeek": return c.hostedDays <= 7;
    case "family": return c.family;
    case "festDemeter": return c.festGod === "Demeter";
    case "festHermes": return c.festGod === "Hermes";
    case "spring": return c.season === "Spring";
    case "sprouted": return c.sprouted;
    case "dawn": return dawn;
    case "yearFarmed": return c.years >= 1;
    case "noonWild": return noon && c.scene === "Wild";
    case "noon": return noon;
    case "meadow": return c.terrain === 9 || c.terrain === 10 || c.terrain === 12;
    case "cave": return c.cave || c.scene === "Cave";
    // The Attic year begins at the summer solstice; the winter solstice falls in Poseideon, the equinoxes in Boedromion and Elaphebolion.
    case "solstice": return nearDay(c, 0, 1) || nearDay(c, 11, 28) || nearDay(c, 5, 15);
    case "equinox": return nearDay(c, 2, 15) || nearDay(c, 8, 15);
    case "high": return c.terrain === 9 || c.terrain === 12;
    case "seaDawn": return c.terrain === 7;
    case "sameSpot": return !!c.lastDawnSpot && c.lastDawnSpot === c.spotKey;
    case "threatened": return c.threatened;
    case "deep": return c.scene === "Wild" && c.nearHome >= 4;
    case "twilight": return dusk;
    case "edges": return dawn || dusk;
    case "zeusHour": return false; // (the Hospitality Blessing's own, worked out where it always was)
  }
  return false;
}
/** Is this the right place and time for the Art? Null if it is; otherwise why not. */
export function artWhere(where: string | undefined, c: ArtCtx): string | null {
  switch (where) {
    case "hearth": return c.scene === "House" ? null : "This is done at your own hearth, in your house.";
    case "field": return c.scene === "Farm" ? null : "This is done in your own fields, on the homestead.";
    case "wild": return c.scene === "Wild" ? null : "This is done out in the wild, where Pan is.";
    case "outdoors": return c.outdoors ? null : "This is done outdoors.";
    case "dawn": return !c.outdoors ? "You must be outdoors to watch the sun rise." : c.clock >= 1.5 ? "The sun is already up. Come out at first light tomorrow." : null;
    case "sky": return !c.outdoors || c.clock >= c.daylight ? "Helios witnesses only what is under the sun: go out by day." : c.weather === "rain" || c.weather === "cloudy" ? "Clouds hide the sun today. Helios must be in sight." : null;
  }
  return null;
}
/** Who teaches the Rural Arts, for the journal and the help. */
export const RURAL_TEACHERS: Record<string, string> = {
  hearth: "Eudora the innkeeper, who knows hospitality (friendship 3)",
  crop: "Theron the miller (friendship 2)",
  flock: "the shepherds and goatherds in the wild huts",
  dawn: "the hermit in his hut",
  panic: "the satyrs, once they know you",
  solar: "Myrrhine the priestess (friendship 5)",
};
export const RURAL_IDS = ["hearth", "crop", "flock", "dawn", "panic", "solar"];
