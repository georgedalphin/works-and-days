/**
 * Friends who throw in their lot with you: people of the village households, and people met on the road.
 * Get close to someone (a close friend, +8), do the great thing they need (their big quest), and they are
 * your sworn friend; then they may follow you and stand by you, or come and live on your homestead and help
 * with the work. How many will is your Phoenix less 2. One of them may become your husband or wife.
 */
import type { FigureExtras } from "./textures";

/** A person who has joined you. Village folk keep their household's id ("v2a"); people of the road get one of their own. */
export interface Friend {
  id: string; name: string; female: boolean; age: "adult" | "elder";
  look: { tunic: string; hair: string; skin: string }; extras: FigureExtras;
  /** Where they came from: a village trade, or a kind of wayfarer. */
  from: "village" | "road"; trade: string; title: string;
  /** Following you (and with you now, or waiting on the farm), living at your house and helping, or your spouse. */
  role: "follow" | "home" | "spouse";
  /** For followers: with you now (true), or resting at your farm. */
  with?: boolean;
  chore?: Chore;
  since: number;
}
export type Chore = "fields" | "goats" | "forage" | "hearth" | "trade";
export const CHORE_NAME: Record<Chore, string> = {
  fields: "Water the fields every morning", goats: "Keep the goats fed and watered", forage: "Gather what grows wild nearby",
  hearth: "Keep the house and the hearth", trade: "Work at their own trade",
};

/** What village households like to be given, by trade. */
export const FOLK_TASTES: Record<string, { loves: string[]; likes: string[]; dislikes: string[] }> = {
  potter: { loves: ["Ochre", "Figurine"], likes: ["Clay", "Wine", "Honey"], dislikes: ["Stone"] },
  weaver: { loves: ["Cloth", "Pearl"], likes: ["Fiber", "Flowers", "Honey"], dislikes: ["Meat"] },
  goatherd: { loves: ["Wine", "Syrinx"], likes: ["Milk", "Cornel", "WildGrapes"], dislikes: ["Clay"] },
  carpenter: { loves: ["Amber", "OliveOil"], likes: ["Wood", "Wine", "Plum"], dislikes: ["Fiber"] },
  beekeeper: { loves: ["Thyme", "Flowers"], likes: ["Wax", "Mint", "Melon"], dislikes: ["Mushrooms"] },
  basketmaker: { loves: ["Ivy", "Garland"], likes: ["Fiber", "Purslane", "Honey"], dislikes: ["Copper"] },
  oldsoldier: { loves: ["Wine", "Fibula"], likes: ["Meat", "Arrow", "OldCoin"], dislikes: ["Flowers"] },
  midwife: { loves: ["Moly", "Honey"], likes: ["Mint", "Thyme", "MountainTea"], dislikes: ["Meat"] },
  baker: { loves: ["Honey", "Oats"], likes: ["Millet", "Chickpeas", "Milk"], dislikes: ["Clay"] },
  charcoal: { loves: ["Wine", "Copper"], likes: ["Wood", "Meat", "Torch"], dislikes: ["Flowers"] },
};

/**
 * The great thing a village household needs (one each, once): things to bring, or deeds to do.
 * Deeds count from when you accept (`note` counters).
 */
export interface BigQuest { ask: string; bring?: [string, number][]; deed?: { note: string; n: number; what: string }; thanks: string; patron: string }
export const BIG_QUESTS: Record<string, BigQuest> = {
  potter: { ask: "\"My daughter marries in the spring, and I promised her a krater fit for a king's table. I need red ochre from the hills for the painting, clay, and a votive to dedicate in the kiln. Two ochre, eight clay, and a figurine from your own kiln.\"", bring: [["Ochre", 2], ["Clay", 8], ["Figurine", 1]], thanks: "\"The krater will be the best thing I ever made. Every time anyone drinks from it, I'll tell them where the colors came from.\"", patron: "Hephaestus" },
  weaver: { ask: "\"I am weaving a robe for Athena's festival, and it wants something no one in this village has ever seen on a loom: two pearls from the sea, sewn in at the breast. The sea gives them up only far out, among the isles.\"", bring: [["Pearl", 2]], thanks: "\"Pearls! The goddess will see them from Olympus. I'll weave your name into the border, small, where only she can read it.\"", patron: "Athena" },
  goatherd: { ask: "\"Wolves. They take a kid every week, and my children cry. Kill three of them for me, and I'll never forget it.\"", deed: { note: "kill:wolf", n: 3, what: "wolves slain" }, thanks: "\"Three wolves! The goats can graze the high meadow again. You'll never want for milk while I live.\"", patron: "Dionysus" },
  carpenter: { ask: "\"I'm building a marriage chest for the priestess's niece, and I've sworn it will be inlaid. Bring me twenty-five good lengths of wood and a piece of amber for the lid.\"", bring: [["Wood", 25], ["Amber", 1]], thanks: "\"Now that's a chest. It'll outlast the both of us. Anything you need built, you come to me first.\"", patron: "Athena" },
  beekeeper: { ask: "\"A bear's been at my hives, out past the fields. It smashes a skep a night. I can't fight a bear. Can you?\"", deed: { note: "kill:bear", n: 1, what: "bear slain" }, thanks: "\"The bear is dead? Then the bees will sing again. Here, taste: that's the honey you saved.\"", patron: "Demeter" },
  basketmaker: { ask: "\"The festival wants baskets, a hundred of them, and my hands are slow this year. Bring me twenty bundles of fiber and three sprays of ivy, and I'll make it in time.\"", bring: [["Fiber", 20], ["Ivy", 3]], thanks: "\"A hundred baskets, and one more for you. My fingers thank you, and so do I.\"", patron: "Demeter" },
  oldsoldier: { ask: "\"There are brigands on the roads again, and the young men here have never held a spear. Put two of them in the ground and the rest will go elsewhere.\"", deed: { note: "kill:brigand", n: 2, what: "brigands brought down" }, thanks: "\"Two brigands! You stood in the line, then, and held. I'd have been proud to stand beside you at the ford.\"", patron: "Ares" },
  midwife: { ask: "\"There is a root with a black stem and a white flower, called moly, that grows on Aiaia, the witch's island. With it I could save mothers I lose now. Bring me one.\"", bring: [["Moly", 1]], thanks: "\"Moly! Hermes himself gave it to Odysseus. Mothers you'll never meet will live because of this.\"", patron: "Artemis" },
  baker: { ask: "\"The harvest feast is mine to bake for, the whole village, and the miller is short. Twelve measures of millet, four of chickpeas and two jars of honey, and I'll bake loaves they'll sing about.\"", bring: [["Millet", 12], ["Chickpeas", 4], ["Honey", 2]], thanks: "\"There'll be bread for everyone, and honey cakes for the children. Come early: the first loaf is yours.\"", patron: "Demeter" },
  charcoal: { ask: "\"Lykos wants copper, and the ore's gone from the near hills. Six lumps of copper ore from the caves, and he'll pay me in a new axe, and I'll owe you everything.\"", bring: [["Copper", 6]], thanks: "\"Six! You went down into the dark for me. My clamp will burn for you whenever you need it.\"", patron: "Hephaestus" },
};

/** What a wayfarer asks of you before they'll throw in their lot with you, there and then. */
export const ROAD_ASKS: Record<string, { ask: string; bring?: [string, number][]; helped?: boolean; thanks: string; title: string }> = {
  traveler: { ask: "\"Go with you? Maybe. The road has been cold to me. If you had a good cloak to spare, I'd follow you to the end of the world.\"", bring: [["Cloak", 1]], thanks: "\"A cloak like this... All right. Where you go, I go.\"", title: "a traveler" },
  pilgrim: { ask: "\"I am bound to the god until I make my offering. Give me a garland and honey to lay on the altar, and I am free to go where I like.\"", bring: [["Garland", 1], ["Honey", 1]], thanks: "\"The god has his offering, and I have my freedom. I'll walk with you.\"", title: "a pilgrim" },
  pilgrims: { ask: "\"We are bound to the god until we make our offering. Give us a garland and honey, and one of us will be free to stay with you.\"", bring: [["Garland", 1], ["Honey", 1]], thanks: "\"Go on, then,\" says the other. \"I'll finish the road alone.\"", title: "a pilgrim" },
  rhapsode: { ask: "\"A singer goes where the songs are. Give me something to sing about, and something to drink while I sing it: a jar of wine.\"", bring: [["Wine", 1]], thanks: "\"Then I'll sing of you. It'll need a better ending than you have yet. Let's go and find one.\"", title: "a singer" },
  hunter: { ask: "\"I hunt alone, mostly. Show me you're worth hunting beside: five good arrows and two hides, a hunter's gift.\"", bring: [["Arrow", 5], ["Hide", 2]], thanks: "\"Fair shooting, and you share. All right: two bows are better than one.\"", title: "a hunter" },
  herder: { ask: "\"My flock is my life. If you'd help me get them through to the summer grazing without the wolves taking any, I'd owe you more than I can pay. Kill one wolf here, or show me you've driven them off.\"", helped: true, thanks: "\"You saved my flock. My son can take them on from here. I'll come with you.\"", title: "a shepherd" },
  woodcutter: { ask: "\"My axe is worn to nothing. Bring me copper for a new head, two lumps, and I'll swing it for you instead.\"", bring: [["Copper", 2]], thanks: "\"Bronze! I'll keep your woodpile higher than your roof.\"", title: "a woodcutter" },
  herbwoman: { ask: "\"Stay with you? You'd need to be worth my roots. Bring me three of thyme and two of mint, and we'll see if you know one plant from another.\"", bring: [["Thyme", 3], ["Mint", 2]], thanks: "\"Well. You know your herbs. I'll come, and teach you the rest.\"", title: "a root-cutter" },
  fisher: { ask: "\"Fish, at your place? Only with good hooks. Bring me bronze tackle, and I'll put fish on your table every day.\"", bring: [["Tackle", 1]], thanks: "\"Proper hooks! I'll come. The sea can do without me a while.\"", title: "a fisherman" },
  soldiers: { ask: "\"Our captain won't let a man go for nothing. A jar of wine for the band, and a good spear-arm will be yours.\"", bring: [["Wine", 1]], thanks: "\"The captain grumbles, and drinks, and waves me off. I'm yours, then.\"", title: "a soldier" },
  wounded: { ask: "\"You saved my life. What else do I have but the life you gave back? Let me spend it beside you.\"", helped: true, thanks: "\"Then it's settled.\"", title: "a traveler you saved" },
  parched: { ask: "\"You gave me water when I was dying. Let me walk with you, and carry your water for once.\"", helped: true, thanks: "\"Then it's settled.\"", title: "a traveler you saved" },
  camp: { ask: "\"Leave the fire and go with you? Pass round a jar of wine first, and we'll see who's willing.\"", bring: [["Wine", 1]], thanks: "\"Ha! I'll come. The fire was getting dull anyway.\"", title: "a wanderer" },
};

/** What each trade's housemate produces at their own trade each morning. */
export const TRADE_WORK: Record<string, { give?: [string, number]; fatigue?: number; say: string }> = {
  potter: { give: ["Clay", 2], say: "dug and worked clay" }, weaver: { give: ["Cloth", 1], say: "wove a bolt of linen" }, goatherd: { give: ["Milk", 2], say: "brought in milk" },
  carpenter: { give: ["Wood", 4], say: "split wood" }, beekeeper: { give: ["Honey", 1], say: "took honey from the wild bees" }, basketmaker: { give: ["Fiber", 4], say: "gathered and twisted fiber" },
  oldsoldier: { give: ["Arrow", 3], say: "fletched arrows" }, midwife: { give: ["Thyme", 2], say: "gathered herbs" }, baker: { fatigue: 10, say: "baked bread, and you breakfast on it" },
  charcoal: { give: ["Torch", 2], say: "made torches" },
  // People of the road.
  traveler: { give: ["Fiber", 3], say: "cut fiber" }, pilgrim: { give: ["Flowers", 3], say: "gathered flowers for the altar" }, rhapsode: { fatigue: 6, say: "sang at the hearth, and your heart is lighter" },
  hunter: { give: ["Meat", 1], say: "hunted" }, herder: { give: ["Milk", 1], say: "milked the goats" }, woodcutter: { give: ["Wood", 5], say: "cut wood" },
  herbwoman: { give: ["Mint", 2], say: "gathered herbs" }, fisher: { give: ["Sardine", 2], say: "caught fish" }, soldiers: { give: ["Arrow", 2], say: "made arrows" },
  wounded: { give: ["Fiber", 3], say: "cut fiber" }, parched: { give: ["Fiber", 3], say: "cut fiber" }, camp: { give: ["Wood", 3], say: "gathered firewood" },
};
/** What someone foraging nearby might bring in, by season. */
export const NEAR_FORAGE: Record<string, string[]> = { Spring: ["Purslane", "Flowers", "Mint"], Summer: ["Thyme", "Capers", "Plum"], Autumn: ["Mushrooms", "WildGrapes", "Cornel"], Winter: ["Mushrooms", "Thyme", "Fiber"] };

/** Closeness needed: to be asked for help (close friend), to marry (beloved). */
export const FRIEND_REL = 8, MARRY_REL = 12;
