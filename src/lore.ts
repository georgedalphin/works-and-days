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
    habits: "Lets you come close, then may charge instead of fleeing, and a wounded boar is worse. Calm it with grain held out (E).",
    full: "Aggression 5 (a d12 of 5 or under and it charges; +3 when wounded, +2 at night, -2 in Artemis' hour). Three blows or arrows bring it down; its charge costs you 15 Fatigue.", perk: "Wild boar let you come a third closer." }),
  fox: L({ id: "fox", name: "Fox", vague: "a red, bushy-tailed animal", category: "Wild animal", rarity: "Uncommon", found: "Flowering Valleys, Windswept Plains", patron: "Dionysus", season: "All year",
    mundane: "Fur", magical: "Fur: stealth (+3); tail hair: illusion (+2)",
    habits: "Comes out at dusk and keeps to the wild edges of farms. Clever and wary.",
    full: "Startles at about 4 paces. Appears from an hour before dusk. Aggression 2: a cornered fox may snap. Calm it with meat.", perk: "Foxes let you come a third closer." }),
  wolf: L({ id: "wolf", name: "Wolf", vague: "a grey, lean beast", category: "Wild animal", rarity: "Uncommon", found: "Wild Forests, Sacred Mountains", patron: "Apollo", season: "All year, raids in hard winters",
    mundane: "Fur", magical: "Fur: hunting (+3), pack loyalty (+2)",
    habits: "Hunts the forests in packs from dusk. Bold, and quick to come at you. Meat held out may calm one (E).",
    full: "Aggression 6 (+2 at night, -2 in Artemis' hour). Two blows or arrows bring one down; each bite costs 10 Fatigue. Faster than you walk, slower than you run.", perk: "Wolves let you come a third closer." }),
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
  // ---- forage (you must know a plant at Basics to see what it bears) ----
  wildgrape: L({ id: "wildgrape", name: "Wild grape", vague: "a twisting wild vine", category: "Wild plant", rarity: "Common", found: "Flowering Valleys, Wild Forests", patron: "Dionysus", season: "Harvest late summer",
    mundane: "Fruit; cuttings for the vineyard", magical: "Wild Dionysian rites",
    habits: "Fruits once a year, in Metageitnion. Dionysus' own plant, untamed.", full: "3 clusters a vine, once a season.", perk: "Wild vines give 1 more cluster." }),
  plum: L({ id: "plum", name: "Wild plum", vague: "a low shrub", category: "Orchard & vine", rarity: "Common", found: "Homestead, Wild Forests", patron: "Demeter", season: "Harvest summer",
    mundane: "Fruit, preserves", magical: "—",
    habits: "Bears through early summer; picked bushes bear again in a few days.", full: "3 plums a picking; ready again after 4 days.", perk: "Wild plums give 1 more." }),
  cornel: L({ id: "cornel", name: "Cornelian cherry", vague: "a slender shrub", category: "Wild plant", rarity: "Common", found: "Wild Forests", patron: "Apollo", season: "Fruit late summer",
    mundane: "Fruit; its hard wood makes javelins", magical: "—",
    habits: "Fruits in late summer. Apollo's tree: its wood is the spear-maker's favorite.", full: "3 cherries a picking; ready again after 5 days.", perk: "Cornel bushes give 1 more." }),
  purslane: L({ id: "purslane", name: "Purslane", vague: "a fleshy weed", category: "Wild plant", rarity: "Common", found: "Cultivated Farmlands", patron: "Demeter", season: "Summer",
    mundane: "Wild greens", magical: "—",
    habits: "Grows at field edges all summer and comes back in days.", full: "2 bunches a picking; ready again after 3 days.", perk: "Purslane gives 1 more." }),
  oats: L({ id: "oats", name: "Wild oats", vague: "a tuft of wild grass", category: "Wild plant", rarity: "Uncommon", found: "Cultivated Farmlands, Windswept Plains", patron: "Demeter", season: "Summer",
    mundane: "Fodder", magical: "—",
    habits: "The goats will eat wild oats from the manger, just as they do fiber.", full: "2 bundles a picking; ready again after 3 days.", perk: "Wild oats give 1 more." }),
  thyme: L({ id: "thyme", name: "Thyme", vague: "a grey-green herb", category: "Herb", rarity: "Common", found: "Homestead, Mineral Hills", patron: "Demeter", season: "Flowers spring, summer",
    mundane: "Cooking, bee forage", magical: "Courage, purifying smoke; boosts honey quality",
    habits: "Flowers through spring and summer on dry stony ground. Bees love it.", full: "2 bunches a picking; ready again after 3 days.", perk: "Thyme gives 1 more." }),
  caper: L({ id: "caper", name: "Caper", vague: "a sprawling thorny plant", category: "Wild plant", rarity: "Common", found: "Mineral Hills, Dominating Heights", patron: "Aphrodite", season: "Buds summer",
    mundane: "Pickled buds", magical: "—",
    habits: "Clings to rocks and walls; pick the buds before they open.", full: "2 handfuls of buds a picking; ready again after 4 days.", perk: "Capers give 1 more." }),
  clay: L({ id: "clay", name: "Clay", vague: "a patch of pale earth", category: "Mineral", rarity: "Common", found: "Mineral Hills, Marshy Swamps", patron: "Hephaestus", season: "All year",
    mundane: "Pottery, bricks, figurines", magical: "Votive figurines",
    habits: "Dig it by hand any time; a seam refills after some days.", full: "2 clay a digging; the seam is ready again after 5 days.", perk: "Clay seams give 1 more." }),
  ochre: L({ id: "ochre", name: "Ochre", vague: "a streak of yellow earth", category: "Mineral", rarity: "Common", found: "Mineral Hills", patron: "Hephaestus", season: "All year",
    mundane: "Pigment", magical: "Funeral and ritual paint",
    habits: "A pigment earth; scrape a little at a time.", full: "1 ochre a scraping; ready again after 6 days.", perk: "Ochre gives 1 more." }),
  mushrooms: L({ id: "mushrooms", name: "Mushrooms", vague: "a ring of pale growths", category: "Wild plant", rarity: "Common", found: "Wild Forests", patron: "Dionysus", season: "Autumn after rain",
    mundane: "Food", magical: "Some cause visions or death",
    habits: "They come up in the forests in autumn, after rain.", full: "2 a gathering; more come up after 3 days.", perk: "Mushroom rings give 1 more." }),
  // ---- mythborn ----
  naiad: L({ id: "naiad", name: "Naiad", vague: "a woman made of light on water", category: "Mythic creature", rarity: "Rare", found: "Springs, in any terrain", patron: "Artemis", season: "Always, by day",
    mundane: "—", magical: "Spring blessings; her water gladdens fields and heals the weary",
    habits: "Shy: she slips into the pool if you come running. Honey, milk, flowers and thyme please her, or quiet prayer (Pneuma).",
    full: "Appeased on 1 day, Familiar after 3, Trusted after 6, Ally after 10. Trusted, she lets you bathe (Fatigue -40) and her water makes crops finer.", perk: "—" }),
  satyr: L({ id: "satyr", name: "Satyr", vague: "goat-legged dancers", category: "Mythic creature", rarity: "Rare", found: "Flowering Valleys, Wild Forests, Sacred Mountains", patron: "Dionysus", season: "Always; loudest at night",
    mundane: "—", magical: "Satyr-blessed wine: supernatural (+3), revelry (+2)",
    habits: "Mischievous: an unfriendly band may snatch something from your pack. Wine and music win them; until there is wine, grapes and a turn in the dance (Aiolos) will do.",
    full: "Aggression 3 (+2 at night), but they steal rather than fight. Appeased on 1 day, Familiar after 3, Trusted after 6, Ally after 10.", perk: "—" }),
  // ---- the deep places ----
  cave: L({ id: "cave", name: "Cave", vague: "a dark opening in the rock", category: "Liminal place", rarity: "Uncommon", found: "Any terrain, most in hills and mountains", patron: "Hades (chthonic)", season: "Always",
    mundane: "Shelter, ore, clay and pigment", magical: "Death magic is stronger inside; some caves are holy, some lead toward the dead",
    habits: "Common caves shelter beasts; sacred caves hold nymphs and oracles; chthonic caves hold spirits. Bring a torch: in the dark every action is at -3.",
    full: "Two levels deep here, laid out the first time you reach them, then fixed. Something keeps the deepest chamber.", perk: "—" }),
  bat: L({ id: "bat", name: "Bat", vague: "something flitting in the dark", category: "Wild animal", rarity: "Common", found: "Mineral Hills, caves", patron: "Hecate (chthonic)", season: "Spring–autumn",
    mundane: "Guano fertilizer", magical: "Night and underworld magic", habits: "Harmless; flits away from light and noise.", full: "Startles at about 2 paces.", perk: "—" }),
  myrmex: L({ id: "myrmex", name: "Myrmex", vague: "a giant, armored crawler", category: "Mythic creature", rarity: "Rare", found: "Mineral Hills, Desolate Desert", patron: "Hephaestus", season: "Always",
    mundane: "—", magical: "Giant gold-digging ants", habits: "Guards its diggings fiercely. Honey may sweeten it (E); otherwise, five hard blows.",
    full: "Aggression 8: it nearly always charges. Each bite costs 12 Fatigue. It hoards gold dust.", perk: "—" }),
  eidolon: L({ id: "eidolon", name: "Eidolon", vague: "a pale shape in the dark", category: "Mythic creature", rarity: "Rare", found: "Chthonic caves, neglected tombs", patron: "Hades (chthonic)", season: "Always",
    mundane: "—", magical: "A restless shade of the neglected dead", habits: "Arrows and bronze pass through it; only fire hurts it. A libation (wine, milk, honey) or mint may lay it to rest (E).",
    full: "Aggression 6 (+2 at night). Three blows with a torch banish it. Laid to rest, it leaves you its grave goods and the dead remember you.", perk: "—" }),
  lampad: L({ id: "lampad", name: "Lampad", vague: "a torch-bearing woman", category: "Mythic creature", rarity: "Rare", found: "Marshy Swamps, Sacred Mountains, sacred caves", patron: "Hecate (chthonic)", season: "Always",
    mundane: "—", magical: "Torch flame: spirit communication (+4), true sight (+3)", habits: "A nymph of Hecate's torches. Peaceful; offerings of honey, milk or mint win her blessing (E). Harming her is a great wrong.",
    full: "Aggression 1. Honored, she shares Hecate's light: Ambrosia and the hidden favor of Hecate.", perk: "—" }),
  // ---- wandering monsters (AEGIS Terata) ----
  centaur: L({ id: "centaur", name: "Centaur", vague: "a horse-man", category: "Mythic creature", rarity: "Rare", found: "Deep in the Wild Forests; the wooded flanks of the Sacred Mountains", patron: "Poseidon", season: "Always",
    mundane: "Hide; arrows from its quiver", magical: "Hair and hide carry charms of wild strength and untamed will",
    habits: "Half man, half stallion: capable of speech and wisdom, quick to drink and quicker to brawl. It decides on sight whether you are a conversation or a fight. Wine offered with respect, or an honest contest of strength, wins it over.",
    full: "Aggression 5 (+2 at night). A galloping charge costs 13 Fatigue and throws you down; at range it shoots, so keep moving. Four hard blows to bring one down. Poseidon's favor softens its temper.", perk: "—" }),
  skeleton: L({ id: "skeleton", name: "Skeleton", vague: "a frame of bones", category: "Mythic creature", rarity: "Rare", found: "Old graves among the Mineral Hills, by night", patron: "Hades (chthonic)", season: "Always",
    mundane: "Old grave goods", magical: "The animated dead",
    habits: "The bones of the wronged dead, risen to destroy the living. It feels no fear and never tires. Blades and arrows do little to bare bone; crushing blows shatter it. Shattered, it gathers itself and rises again, unless the bones are given their rites with a libation (wine, milk or honey).",
    full: "Aggression 6 (+2 at night). Slow, relentless, never gives up the chase. A mattock does double; a sickle does nothing; arrows rattle through. Laid to rest, it leaves its grave goods and the dead remember you.", perk: "—" }),
  empousa: L({ id: "empousa", name: "Empousa", vague: "a beautiful stranger", category: "Mythic creature", rarity: "Rare", found: "Lonely meadows of the Flowering Valleys, at dusk and after", patron: "Hecate (chthonic)", season: "Always",
    mundane: "—", magical: "Its ash, gathered quickly, serves curse-work and bindings",
    habits: "A shapeshifting night-demon of Hecate that wears beauty as a lure, to feed on blood and breath. Look for the mismatched legs: one of bronze, one an ass's hoof. It cannot be appeased, only driven off: sincere mockery sends it shrieking.",
    full: "Aggression 6 (+2 at night). Seeing through her takes Gnosis (10 or better on d12 + Gnosis). Mocking her takes Logos or Phoenix (8 or better). Her bite costs 12 Fatigue and heals her.", perk: "—" }),
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
  // ---- the far lands' plants (Flora & Fauna) ----
  pine: L({ id: "pine", name: "Black pine", vague: "a tall dark conifer", category: "Tree", rarity: "Common", found: "Wild Forests, Sacred Mountains", patron: "Poseidon", season: "All year",
    mundane: "Timber, ship masts, resin, torches", magical: "Pine-cone thyrsus (Dionysus)",
    habits: "Fell it with the axe like an oak; its wood burns hot and resinous.", full: "Three blows (two with a fine axe) for 5 wood.", perk: "Pines give 2 more wood." }),
  reed: L({ id: "reed", name: "Reed", vague: "tall rattling grass", category: "Wild plant", rarity: "Common", found: "Marshy Swamps", patron: "Artemis", season: "All year",
    mundane: "Pipes, arrows, thatch, pens", magical: "Pan's syrinx; music magic",
    habits: "Stands thick at the water's edge. Cut it with the sickle for fiber.", full: "The sickle gives 2 fiber, bare hands 1.", perk: "Reeds give 1 more fiber." }),
  thornscrub: L({ id: "thornscrub", name: "Thorn scrub", vague: "a low thorny bush", category: "Wild plant", rarity: "Common", found: "Desolate Desert, Rugged Badlands", patron: "Ares", season: "All year",
    mundane: "Fencing, kindling", magical: "—",
    habits: "Too thorny to pull by hand. The sickle or axe takes it for kindling.", full: "Gives 1 wood and 1 fiber.", perk: "Thorn scrub gives 1 more wood." }),
  seafennel: L({ id: "seafennel", name: "Sea fennel", vague: "a fleshy shore plant", category: "Wild plant", rarity: "Common", found: "Coastal Waters", patron: "Poseidon", season: "Summer",
    mundane: "Pickled greens", magical: "—", habits: "Grows in the rocks above the tide. Picked in summer.", full: "2 bunches a picking; ready again after 3 days.", perk: "Sea fennel gives 1 more." }),
  saltbush: L({ id: "saltbush", name: "Saltbush", vague: "a grey desert shrub", category: "Wild plant", rarity: "Common", found: "Desolate Desert", patron: "Poseidon", season: "All year",
    mundane: "Fodder", magical: "—", habits: "Salty grey leaves the year round, where little else grows.", full: "2 bundles a picking; ready again after 4 days.", perk: "Saltbush gives 1 more." }),
  mountaintea: L({ id: "mountaintea", name: "Mountain tea", vague: "a woolly mountain herb", category: "Wild plant", rarity: "Common", found: "Sacred Mountains", patron: "Apollo", season: "Summer",
    mundane: "Tea, medicine", magical: "—", habits: "Flowers yellow on the high slopes in summer.", full: "2 bunches a picking; ready again after 4 days.", perk: "Mountain tea gives 1 more." }),
  thistle: L({ id: "thistle", name: "Thistle", vague: "a spiny purple-headed plant", category: "Wild plant", rarity: "Common", found: "Windswept Plains, Rugged Badlands", patron: "Ares", season: "Summer",
    mundane: "Fodder, food when young", magical: "—", habits: "Common on open, dry ground.", full: "2 a picking; ready again after 3 days.", perk: "Thistle gives 1 more." }),
  fennel: L({ id: "fennel", name: "Fennel", vague: "a feathery tall herb", category: "Herb", rarity: "Common", found: "Homestead, Windswept Plains", patron: "Dionysus", season: "Harvest summer",
    mundane: "Cooking, medicine", magical: "Thyrsus staffs; Prometheus' fire-carrier", habits: "Tall yellow umbels on the plains in summer.", full: "2 a picking; ready again after 3 days.", perk: "Fennel gives 1 more." }),
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
  t5: L({ id: "t5", name: "Marshy Swamps", vague: "wet, reedy ground", category: "Terrain", rarity: "Common", found: "Wheel position 5 (Metis, Water)", patron: "Poseidon", season: "All year",
    mundane: "Reeds, clay, waterfowl, boar", magical: "Cunning and hidden things; the Hydra's kind",
    habits: "Still pools and reed beds; the mud slows you down.", full: "Neighbors on the wheel: Mineral Hills and Deep Seas. Element: Water.", perk: "—" }),
  t7: L({ id: "t7", name: "Coastal Waters", vague: "a shore by the sea", category: "Terrain", rarity: "Common", found: "Wheel position 7 (Logos, Water)", patron: "Athena", season: "All year",
    mundane: "Sea fennel, salt, gulls", magical: "Nereids and sea-speech",
    habits: "Sand and rock running down to open water. Boats will come later.", full: "Neighbors on the wheel: Deep Seas and Desolate Desert. Element: Water.", perk: "—" }),
  t8: L({ id: "t8", name: "Desolate Desert", vague: "dry, empty country", category: "Terrain", rarity: "Common", found: "Wheel position 8 (Ourania, Air)", patron: "Apollo", season: "All year",
    mundane: "Saltbush, thorn scrub", magical: "The far-seeing sky; the Phoenix's land",
    habits: "The sun tires you by day here. An oasis gives shade and water.", full: "Neighbors on the wheel: Coastal Waters and Sacred Mountains. Element: Air.", perk: "—" }),
  t9: L({ id: "t9", name: "Sacred Mountains", vague: "high holy slopes", category: "Terrain", rarity: "Common", found: "Wheel position 9 (Pneuma, Air)", patron: "Dionysus", season: "All year",
    mundane: "Black pine, mountain tea, deer", magical: "Closeness to the gods; oreads and wolves",
    habits: "Pines and boulders; wolves hunt here from dusk as in the forests.", full: "Neighbors on the wheel: Desolate Desert and Windswept Plains. Element: Air.", perk: "—" }),
  t10: L({ id: "t10", name: "Windswept Plains", vague: "open grassland", category: "Terrain", rarity: "Common", found: "Wheel position 10 (Aiolos, Air)", patron: "Hermes", season: "All year",
    mundane: "Hares, wild oats, fennel, thistle", magical: "Wind and swiftness; storm-wind beings",
    habits: "Wide, open and easy to cross; game sees you coming.", full: "Neighbors on the wheel: Sacred Mountains and Rugged Badlands. Element: Air.", perk: "—" }),
  t11: L({ id: "t11", name: "Rugged Badlands", vague: "broken red country", category: "Terrain", rarity: "Common", found: "Wheel position 11 (Thymos, Fire)", patron: "Ares", season: "All year",
    mundane: "Stone, thorn scrub, thistle", magical: "War and strife; sown warriors",
    habits: "Gullies and boulders; hard going.", full: "Neighbors on the wheel: Windswept Plains and Dominating Heights. Element: Fire.", perk: "—" }),
  t12: L({ id: "t12", name: "Dominating Heights", vague: "pale commanding uplands", category: "Terrain", rarity: "Common", found: "Wheel position 12 (Kratos, Fire)", patron: "Zeus", season: "All year",
    mundane: "Limestone, capers, olives", magical: "Rule and power; eagles and old citadels",
    habits: "High pale limestone with ruins of watchtowers.", full: "Neighbors on the wheel: Rugged Badlands and Flowering Valleys. Element: Fire.", perk: "—" }),
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
