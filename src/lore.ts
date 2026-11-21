/**
 * Lore: what the player understands about the kinds of things in the world.
 * Each subject has four tiers: Unknown, Basics, Deep, Full. Investigating something (Q)
 * makes a Gnosis check that may raise your understanding of that whole kind of thing.
 * Text comes from the Flora & Fauna sheet; the Full tier adds the game's own numbers.
 */
export const TIERS = ["Unknown", "Basics", "Deep", "Full"] as const;

export interface LoreDef {
  id: string;
  name: string;
  vague: string; // what you'd call it before you know what it is
  category: string;
  rarity: "Common" | "Uncommon" | "Rare";
  found: string;
  patron: string;
  season: string;
  mundane: string;
  magical: string;
  habits: string; // Deep tier: how it behaves or how to work with it
  full: string; // Full tier: hidden numbers and best practice
  perk: string; // what Full understanding gives you in play
}

const L = (d: LoreDef) => d;

export const LORE: Record<string, LoreDef> = {
  // ---- creatures ----
  hare: L({ id: "hare", name: "Hare", vague: "a long-eared animal", category: "Wild animal", rarity: "Common", found: "Flowering Valleys, Windswept Plains", patron: "Aphrodite", season: "All year",
    mundane: "Meat, fur", magical: "Fertility, love gifts",
    habits: "Feeds in the open and bolts at the first sign of you. Walk, don't run, and it lets you closer.",
    full: "Startles at about 3 paces; flees at a sprint for a second or so, then settles.", perk: "Hares let you come a third closer." }),
  deer: L({ id: "deer", name: "Deer", vague: "a tall, antlered animal", category: "Wild animal", rarity: "Common", found: "Wild Forests, Flowering Valleys", patron: "Artemis", season: "All year",
    mundane: "Venison, hides, antler", magical: "Artemis' sacred animal; hunting rites",
    habits: "The most watchful creature of the woods. It sees you long before you see it; Artemis' hour (2) keeps it calmer.",
    full: "Startles at about 4½ paces and runs farther and faster than any other common beast.", perk: "Deer let you come a third closer." }),
  boar: L({ id: "boar", name: "Wild boar", vague: "a dark, bristling beast", category: "Wild animal", rarity: "Common", found: "Wild Forests, Marshy Swamps", patron: "Ares", season: "All year",
    mundane: "Meat, hide, tusks", magical: "Tusks: protective amulets (+3); hide: implements (+2)",
    habits: "Lets you come close before it moves. When the Aggression roll arrives, this is the one that may charge instead of fleeing.",
    full: "Startles at about 2 paces. Its tusks are its weapon; bronze spear points will matter here.", perk: "Wild boar let you come a third closer." }),
  fox: L({ id: "fox", name: "Fox", vague: "a red, bushy-tailed animal", category: "Wild animal", rarity: "Uncommon", found: "Flowering Valleys, Windswept Plains", patron: "Dionysus", season: "All year",
    mundane: "Fur", magical: "Fur: stealth (+3); tail hair: illusion (+2)",
    habits: "Comes out at dusk and keeps to the wild edges of farms. Clever and wary.",
    full: "Startles at about 4 paces. Appears from an hour before dusk.", perk: "Foxes let you come a third closer." }),
  bird: L({ id: "bird", name: "Sparrow", vague: "a small brown bird", category: "Wild animal", rarity: "Common", found: "Cultivated Farmlands", patron: "Aphrodite", season: "All year",
    mundane: "Pest of grain", magical: "Aphrodite's chariot birds",
    habits: "Feeds in little flocks; when one takes fright, they all do. They come down again elsewhere before long.",
    full: "A flock startles at about 2½ paces and settles again within half a minute.", perk: "Sparrows let you come a third closer." }),
  goat: L({ id: "goat", name: "Goat", vague: "your goats", category: "Livestock", rarity: "Common", found: "Homestead", patron: "Dionysus", season: "Kids in spring",
    mundane: "Milk, cheese, hides, meat", magical: "Sacrifice to Dionysus; Pan's favor",
    habits: "Each goat eats one fodder and drinks one water a night. Fed goats give milk; petted goats grow fond of you.",
    full: "A goat at affection 6 or more gives two milk. A hungry night costs a point of affection.", perk: "Your goats give two milk from affection 5." }),
  bees: L({ id: "bees", name: "Honeybee", vague: "a humming hive", category: "Livestock", rarity: "Common", found: "Homestead, Flowering Valleys", patron: "Demeter", season: "Honey summer, autumn",
    mundane: "Honey, beeswax", magical: "Honey: preservation (+2), offerings; wax: seals (+3)",
    habits: "The bees are Demeter's: in her hour (3) they let you take the comb without stinging.",
    full: "New comb every 4 days. Four or more flowers within 5 paces doubles the honey. Outside Demeter's hour, a sting on a d12 roll of 1–3.", perk: "Your hive yields an extra honey." }),
  // ---- crops ----
  Millet: L({ id: "Millet", name: "Millet", vague: "a grassy seedling", category: "Grain & field crop", rarity: "Uncommon", found: "Homestead", patron: "Demeter", season: "Sow spring, harvest summer",
    mundane: "Porridge, bird feed", magical: "—",
    habits: "Needs water every day it grows. Sow it in Demeter's hour (3) for a finer crop.",
    full: "Ripe after 6 watered nights; 3 a harvest; withers after 3 dry nights in a row.", perk: "Your millet yields one more." }),
  Chickpeas: L({ id: "Chickpeas", name: "Chickpeas", vague: "a leafy little plant", category: "Grain & field crop", rarity: "Common", found: "Homestead", patron: "Demeter", season: "Sow spring, harvest summer",
    mundane: "Food, trade", magical: "—",
    habits: "A patient summer crop. Sow it in Demeter's hour (3) for a finer crop.",
    full: "Ripe after 8 watered nights; 3 a harvest; withers after 3 dry nights in a row.", perk: "Your chickpeas yield one more." }),
  Melon: L({ id: "Melon", name: "Melon", vague: "a sprawling vine", category: "Vegetable", rarity: "Uncommon", found: "Homestead", patron: "Demeter", season: "Harvest summer",
    mundane: "Food, trade", magical: "—",
    habits: "Slow, thirsty and worth it. Sow it in Demeter's hour (3) for a finer crop.",
    full: "Ripe after 10 watered nights; 1 a harvest, but the most valuable of the summer crops.", perk: "Your melon vines yield one more." }),
  Mint: L({ id: "Mint", name: "Mint", vague: "a fragrant green herb", category: "Herb", rarity: "Common", found: "Homestead, Marshy Swamps", patron: "Hades (chthonic)", season: "Harvest spring–autumn",
    mundane: "Cooking, medicine", magical: "Minthe's herb; underworld rites",
    habits: "Minthe was Hades' beloved, made into this herb. Sow it at night, his time, for a finer crop. It keeps growing back.",
    full: "Ripe after 5 watered nights, then picked again every 3; 2 a picking.", perk: "Your mint yields one more." }),
  vine: L({ id: "vine", name: "Grapevine", vague: "an old, twisted vine", category: "Orchard & vine", rarity: "Common", found: "Homestead, Flowering Valleys", patron: "Dionysus", season: "Harvest late summer",
    mundane: "Wine, raisins, vinegar", magical: "Transformation (+2 Dionysus connection); libations",
    habits: "Fruits once a year, in Metageitnion. The grapes want treading in a vat.",
    full: "One picking a year of 12 clusters.", perk: "The old vine gives 4 more clusters." }),
  // ---- the land ----
  olive: L({ id: "olive", name: "Olive", vague: "a gnarled grey-green tree", category: "Orchard & vine", rarity: "Common", found: "Homestead", patron: "Athena", season: "Harvest late autumn, winter",
    mundane: "Oil for food, lamps, skin; trade", magical: "Anointing and blessing (+2 Athena connection)",
    habits: "Athena's gift to her people. Never cut one: it is a crime against the goddess.",
    full: "An olive lives for centuries and fruits in late autumn.", perk: "—" }),
  oak: L({ id: "oak", name: "Oak", vague: "a broad tree", category: "Tree", rarity: "Common", found: "Wild Forests, Homestead", patron: "Zeus", season: "Acorns autumn",
    mundane: "Timber, acorns for pigs, tannin", magical: "Strength (+1), Zeus connection (+2)",
    habits: "Hard to fell; best work done in Zeus's hour (12), when heavy labor comes easier.",
    full: "A grown oak takes 3 axe blows and gives 6 wood; a sapling gives 2.", perk: "Felled oaks give 2 more wood." }),
  bramble: L({ id: "bramble", name: "Bramble", vague: "a tangle of brush", category: "Wild plant", rarity: "Common", found: "Flowering Valleys, Wild Forests", patron: "Demeter", season: "Berries late summer",
    mundane: "Blackberries, hedges", magical: "—",
    habits: "Cut with the sickle for fiber, the goats' fodder. Bare hands work, slowly.",
    full: "The sickle gives 2 fiber, bare hands 1.", perk: "Cut brush gives 1 more fiber." }),
  stone: L({ id: "stone", name: "Limestone", vague: "pale stone", category: "Mineral", rarity: "Common", found: "Mineral Hills, Dominating Heights", patron: "Hephaestus", season: "All year",
    mundane: "Building stone, lime", magical: "—",
    habits: "Loose stones break with the mattock. Great boulders need the smith's bronze-shod mattock.",
    full: "A stone gives 2; heavy work like this is easier in Zeus's hour (12).", perk: "Broken stones give 1 more." }),
  poppy: L({ id: "poppy", name: "Wild poppy", vague: "bright wildflowers", category: "Flower", rarity: "Common", found: "Flowering Valleys, Homestead", patron: "Demeter", season: "Flowers spring",
    mundane: "Dye, garlands", magical: "Sleep and Demeter's grief",
    habits: "Bees love flowers: a hive among them makes more honey.",
    full: "Picked by hand for 1, with the sickle for 2.", perk: "—" }),
  // ---- terrains ----
  t1: L({ id: "t1", name: "Flowering Valleys", vague: "a bright meadow land", category: "Terrain", rarity: "Common", found: "Wheel position 1 (Phoenix, Fire)", patron: "Aphrodite", season: "Best in spring",
    mundane: "Flowers, herbs, hares, deer, bees", magical: "Beauty, love and renewal; satyrs revel here",
    habits: "Gentle, open land with flowers everywhere. Next to Cultivated Farmlands on the wheel.",
    full: "Neighbors on the wheel: Dominating Heights and Wild Forests. Element: Fire.", perk: "—" }),
  t2: L({ id: "t2", name: "Wild Forests", vague: "a dark woodland", category: "Terrain", rarity: "Common", found: "Wheel position 2 (Kardia, Earth)", patron: "Artemis", season: "All year",
    mundane: "Timber, game, nuts and mushrooms", magical: "The hunt; dryads guard their trees",
    habits: "Dense oaks and quick game. Artemis' hour (2) is the hunter's hour.",
    full: "Neighbors on the wheel: Flowering Valleys and Cultivated Farmlands. Element: Earth.", perk: "—" }),
  t3: L({ id: "t3", name: "Cultivated Farmlands", vague: "worked land", category: "Terrain", rarity: "Common", found: "Wheel position 3 (Oikos, Earth)", patron: "Demeter", season: "All year",
    mundane: "Grain, olives, fieldstone", magical: "The household's good spirit lives here",
    habits: "Your homestead's land, and the gentlest on the wheel.",
    full: "Neighbors on the wheel: Wild Forests and Mineral Hills. Element: Earth.", perk: "—" }),
  t4: L({ id: "t4", name: "Mineral Hills", vague: "stony hill country", category: "Terrain", rarity: "Common", found: "Wheel position 4 (Techne, Earth)", patron: "Hephaestus", season: "All year",
    mundane: "Stone, clay, ore", magical: "Craft and the forge; cyclopes work here",
    habits: "Stone and boulders everywhere; bring the mattock.",
    full: "Neighbors on the wheel: Cultivated Farmlands and Marshy Swamps. Element: Earth.", perk: "—" }),
};

/** Base chance (d12 ≤ Gnosis + this) of reaching each tier from the one below. */
export const TIER_MOD = [0, 3, 1, -1];
export const RARITY_MOD = { Common: 0, Uncommon: -1, Rare: -2 };
export const HERA_HOUR_BONUS = 2; // Gnosis is Hera's Aretai
export const MAX_PERSEVERANCE = 3; // +1 per earlier failure at this tier

/** What you can read about a subject at a given tier. */
export function loreLines(d: LoreDef, tier: number): string[] {
  if (tier <= 0) return [`You don't know what ${d.vague} is yet. Investigate one (Q).`];
  const out = [`${d.category} · ${d.rarity} · Found in: ${d.found}`, `Season: ${d.season}`, `Uses: ${d.mundane}`];
  if (tier >= 2) out.push(`Patron: ${d.patron}`, `Sacred and magical: ${d.magical}`, d.habits);
  if (tier >= 3) { out.push(d.full); if (d.perk !== "—") out.push(`Mastery: ${d.perk}`); }
  return out;
}
