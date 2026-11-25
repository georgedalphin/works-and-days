/**
 * Cooking: at a campfire or the hut's hearth, up to three things go in the pot.
 * Any honest combination makes a dish that strengthens one Aretai for a while (the Aretai of its rarest ingredient).
 * Certain old combinations are a god's own dish: eaten, they bring that god's favor closer for a while.
 * The rarer the ingredients, the stronger the dish and the longer it lasts.
 */
import { ITEMS } from "./data";

export type IngKind = "meat" | "grain" | "veg" | "herb" | "fruit" | "dairy" | "sweet" | "drink";
/** What can go in the pot: how rare it is (1 common, 2 uncommon, 3 rare), what kind of food, and the Aretai it feeds. */
export const INGREDIENTS: Record<string, { rarity: number; kind: IngKind; aretai: string }> = {
  Meat: { rarity: 1, kind: "meat", aretai: "Kratos" },
  Millet: { rarity: 1, kind: "grain", aretai: "Oikos" },
  Oats: { rarity: 1, kind: "grain", aretai: "Oikos" },
  Chickpeas: { rarity: 1, kind: "veg", aretai: "Oikos" },
  Purslane: { rarity: 1, kind: "veg", aretai: "Oikos" },
  Melon: { rarity: 2, kind: "fruit", aretai: "Phoenix" },
  Plum: { rarity: 1, kind: "fruit", aretai: "Phoenix" },
  Cornel: { rarity: 1, kind: "fruit", aretai: "Kardia" },
  Mushrooms: { rarity: 2, kind: "veg", aretai: "Kardia" },
  Grapes: { rarity: 1, kind: "fruit", aretai: "Pneuma" },
  WildGrapes: { rarity: 1, kind: "fruit", aretai: "Pneuma" },
  Wine: { rarity: 2, kind: "drink", aretai: "Pneuma" },
  Mint: { rarity: 1, kind: "herb", aretai: "Pneuma" },
  Milk: { rarity: 1, kind: "dairy", aretai: "Gnosis" },
  Honey: { rarity: 2, kind: "sweet", aretai: "Ourania" },
  MountainTea: { rarity: 3, kind: "herb", aretai: "Ourania" },
  Olives: { rarity: 1, kind: "fruit", aretai: "Logos" },
  OliveOil: { rarity: 2, kind: "sweet", aretai: "Logos" },
  Thyme: { rarity: 2, kind: "herb", aretai: "Thymos" },
  Thistle: { rarity: 2, kind: "veg", aretai: "Kratos" },
  Fennel: { rarity: 2, kind: "herb", aretai: "Techne" },
  Capers: { rarity: 2, kind: "herb", aretai: "Aiolos" },
  Saltbush: { rarity: 3, kind: "herb", aretai: "Aiolos" },
  SeaFennel: { rarity: 3, kind: "herb", aretai: "Metis" },
};

/** The everyday dish of each Aretai: what you get from any combination whose rarest ingredient feeds it. */
export const PLAIN: Record<string, { name: string; desc: string }> = {
  Kratos: { name: "Hearty roast", desc: "Meat and something to go with it. Strength for heavy work." },
  Oikos: { name: "Farmhouse porridge", desc: "Grain and greens, the food of the fields." },
  Phoenix: { name: "Sweet dish", desc: "Fruit, soft and fragrant. It puts you in a warm humor." },
  Kardia: { name: "Forager's stew", desc: "What the woods give, stewed. Sharpens the hunter's senses." },
  Pneuma: { name: "Heady stew", desc: "Grape and mint. It lifts the spirit." },
  Gnosis: { name: "Milk pottage", desc: "Gentle food that clears the mind." },
  Ourania: { name: "Honeyed broth", desc: "Sweet and herbal, a healer's food." },
  Logos: { name: "Olive dish", desc: "Athena's tree on the plate. A clear head for reasoning." },
  Thymos: { name: "Thyme-roasted dish", desc: "Thyme gives courage, the old people say." },
  Techne: { name: "Fennel roast", desc: "Fennel carried fire once. Steady hands." },
  Aiolos: { name: "Road fare", desc: "Salty and keeping, for the traveler." },
  Metis: { name: "Shore broth", desc: "Sea herbs, salt and cunning." },
};

/** A god's own dish. Each entry of `needs` is one ingredient, or a list of which any one will do. */
export interface Named { key: string; name: string; greek?: string; god: string; needs: (string | string[])[]; desc: string; eaten: string }
export const NAMED: Named[] = [
  { key: "kykeon", name: "Kykeon", greek: "kykeon", god: "Demeter", needs: [["Millet", "Oats"], "Mint", "Milk"], desc: "Barley-groats, pennyroyal and milk: the drink Demeter took at Eleusis, ending her fast.", eaten: "Demeter's own drink. The grief of the Mother eases in you, and the fields seem nearer." },
  { key: "melikraton", name: "Melikraton", greek: "melikraton", god: "Hades", needs: ["Honey", "Milk"], desc: "Honey mixed with milk, as is poured for the dead.", eaten: "Sweet, and strangely cold. The ones below remember the taste." },
  { key: "hecate", name: "Hecate's supper", greek: "Hekates deipnon", god: "Hecate", needs: ["Honey", "Mushrooms", ["Milk", "Meat"]], desc: "The supper left at the crossroads at the month's end. Best left at a herm by night.", eaten: "You eat the goddess's supper. The dark seems to lean closer, curious." },
  { key: "oulochytai", name: "Sacrificial portion", greek: "thysia", god: "Zeus", needs: ["Meat", "Wine", ["Millet", "Oats"]], desc: "Meat roasted with wine poured over and grain scattered, the sacrificer's share.", eaten: "The share of the sacrifice. The sky feels close, and approving." },
  { key: "heroroast", name: "Hero's portion", god: "Ares", needs: ["Meat", "Thyme", "OliveOil"], desc: "The chine of meat, oiled and thyme-roasted, given to the bravest at the feast.", eaten: "The hero's portion. Your blood runs hot." },
  { key: "kakavia", name: "Kakavia", greek: "kakavia", god: "Poseidon", needs: ["Meat", "SeaFennel", ["Capers", "OliveOil"]], desc: "A fisherman's stew of the shore.", eaten: "Salt and the sea's bounty. Poseidon smiles on full bellies." },
  { key: "relish", name: "Olive and chickpea relish", god: "Athena", needs: [["Olives", "OliveOil"], "Chickpeas", "Thyme"], desc: "Simple, careful food, the kind wise people eat.", eaten: "Athena's tree, Athena's patience. Your thoughts line up neatly." },
  { key: "venison", name: "Huntress' spit", god: "Artemis", needs: ["Meat", "Cornel", ["Saltbush", "Purslane", "Mushrooms"]], desc: "Game roasted with cornel berries and wild greens, as hunters eat in the hills.", eaten: "The huntress' food. You hear the woods more keenly." },
  { key: "roadbread", name: "Traveler's bread", god: "Hermes", needs: [["Millet", "Oats"], "Capers", "OliveOil"], desc: "Hard bread with capers and oil, that keeps for a long road.", eaten: "Hermes' bread. Your feet feel lighter already." },
  { key: "tisane", name: "Healer's tisane", god: "Apollo", needs: ["MountainTea", "Honey"], desc: "Mountain tea steeped with honey, as Apollo's healers brew it.", eaten: "Clean, bright, warming. Apollo's healing in a cup." },
  { key: "melon", name: "Honeyed melon", god: "Aphrodite", needs: ["Melon", "Honey", ["Mint", "Plum"]], desc: "Sweet melon with honey and fruit or mint. A gift for a lover.", eaten: "Sweetness on sweetness. Aphrodite laughs somewhere." },
  { key: "plums", name: "Drunken plums", god: "Dionysus", needs: ["Plum", "Wine", "Honey"], desc: "Plums stewed in wine and honey.", eaten: "The god of the vine is in this dish, and now in you." },
  { key: "fennelroast", name: "Prometheus' roast", god: "Hephaestus", needs: ["Meat", "Fennel"], desc: "Meat roasted over fennel stalks, the way fire first came to men.", eaten: "Fire's own food. The smith-god warms to you." },
  { key: "weddingcake", name: "Wedding cake", greek: "plakous", god: "Hera", needs: [["Millet", "Oats"], "Honey", "Milk"], desc: "A honey-cake of grain and milk, as is baked for a wedding.", eaten: "The marriage-cake. Hera, queen of the household, is pleased." },
];

export const dishId = (n: Named) => `dish_${n.key}`;
export const plainId = (aretai: string) => `meal_${aretai}`;
/** Dish items: the plain dish of each Aretai, and each god's dish. */
for (const [ar, p] of Object.entries(PLAIN)) ITEMS[plainId(ar)] = { id: plainId(ar), name: p.name, kind: "meal", desc: `${p.desc} Eat it (Space): ${ar} +1 for a while.`, value: 6 };
for (const n of NAMED) ITEMS[dishId(n)] = { id: dishId(n), name: n.name, greek: n.greek, kind: "meal", desc: `${n.desc} Eat it (Space) for ${n.god}'s favor, for a while.`, value: 12 };
export const DISH_IDS = [...Object.keys(PLAIN).map(plainId), ...NAMED.map(dishId)];

/** How long a dish works, and how strong it is, by tier (1–3). Hours are clock hours (24 to a day). */
export const PLAIN_EFFECT = [null, { n: 1, hours: 6 }, { n: 1, hours: 12 }, { n: 2, hours: 12 }] as const;
export const NAMED_EFFECT = [null, { n: 2, hours: 12 }, { n: 3, hours: 18 }, { n: 4, hours: 24 }] as const;

/** Does a pot of distinct ingredients make a god's dish? Every ingredient must be used, and every need met. */
export function namedFor(pot: string[]): Named | null {
  const set = [...new Set(pot)];
  for (const n of NAMED) {
    if (n.needs.length !== set.length) continue;
    // Match each need to a different ingredient (needs are few, so try them in order with backtracking).
    const used = new Set<string>();
    const fit = (i: number): boolean => {
      if (i === n.needs.length) return true;
      const opts = Array.isArray(n.needs[i]) ? (n.needs[i] as string[]) : [n.needs[i] as string];
      for (const o of opts) if (set.includes(o) && !used.has(o)) { used.add(o); if (fit(i + 1)) return true; used.delete(o); }
      return false;
    };
    if (fit(0)) return n;
  }
  return null;
}

/** What a pot makes, before the cook's own skill: the dish, its tier, and what it strengthens. */
export function cookResult(pot: string[]): { id: string; tier: number; score: number; named: Named | null; aretai: string } {
  const ings = pot.map((id) => INGREDIENTS[id]);
  const kinds = new Set(ings.map((i) => i.kind));
  // Rarity adds up; three different kinds of food make a fuller dish.
  const score = ings.reduce((s, i) => s + i.rarity, 0) + (kinds.size >= 3 ? 1 : 0);
  const tier = score >= 7 ? 3 : score >= 4 ? 2 : 1;
  let lead = pot[0];
  for (const id of pot) if (INGREDIENTS[id].rarity > INGREDIENTS[lead].rarity) lead = id;
  const named = namedFor(pot);
  return { id: named ? dishId(named) : plainId(INGREDIENTS[lead].aretai), tier, score, named, aretai: INGREDIENTS[lead].aretai };
}

/** The god whose dish this is, for offerings. */
export const DISH_GOD: Record<string, string> = Object.fromEntries(NAMED.map((n) => [dishId(n), n.god]));
