/**
 * The village: four of its twelve households for the vertical slice (Village & People doc),
 * each with one person to know. Relationships run from -12 to +12, the same scale as divine favor.
 */
export interface Villager {
  id: string;
  name: string;
  household: string;
  patron: string;
  aretai: string;
  look: { tunic: string; hair: string; skin: string; beard?: boolean; veil?: string };
  loves: string[];
  likes: string[];
  dislikes: string[];
  /** What they say, by how well they know you: cool (below 0), new (0–3), friend (4–7), close (8+). */
  lines: { cool: string[]; new: string[]; friend: string[]; close: string[] };
}

export const VILLAGERS: Record<string, Villager> = {
  theron: {
    id: "theron", name: "Theron", household: "the miller", patron: "Demeter", aretai: "Oikos",
    look: { tunic: "#d8c8a0", hair: "#d8d8d0", skin: "#c98e62", beard: true },
    loves: ["Honey", "Melon"], likes: ["Millet", "Chickpeas", "Plum", "Milk", "Wine", "Amphora", "Cloth"], dislikes: ["Stone", "Clay", "Feather"],
    lines: {
      cool: ["Hm. You again.", "Grain doesn't grind itself. Is there something you need?"],
      new: ["New on the old homestead, aren't you? The soil there is good, if you treat it right.",
        "Sow in Demeter's hour, the third of the day. My father swore by it, and his father before him.",
        "The cart comes by your place each dawn. Leave what you'd sell in the pithos and my boy will fetch it."],
      friend: ["You've a farmer's hands now. I can see it.", "Come the Kronia we eat together, master and slave alike. Old Kronos' golden age, for a day.",
        "If your millet comes in heavy, bring me some. I'll pay you fair, fairer than most."],
      close: ["My wife used to say the mill sings when the harvest is good. It's been singing since you came.",
        "When I'm gone, someone will need to keep the old ways. I'd not mind if it were you."],
    },
  },
  lykos: {
    id: "lykos", name: "Lykos", household: "the smith", patron: "Hephaestus", aretai: "Techne",
    look: { tunic: "#6b5a45", hair: "#2a1d14", skin: "#a8744a", beard: true },
    loves: ["Ochre", "Meat", "Lamp"], likes: ["Wood", "Clay", "Capers", "Tusk", "Wine"], dislikes: ["Flowers", "Mint"],
    lines: {
      cool: ["Mind the sparks. And mind yourself.", "I've work. Make it quick."],
      new: ["Bronze is copper married to tin, and tin comes from the ends of the earth. So I don't waste it.",
        "That mattock of yours won't touch a boulder. Bring me silver and I'll shoe it in bronze.",
        "The forge is Hephaestus' altar. Every blow is a prayer, if you do it right."],
      friend: ["Your axe is holding up. Good. A tool remembers how it's treated.",
        "Clay from the hills makes the best crucibles. If you find a seam, I'll take some off you."],
      close: ["I'll tell you a secret: the god himself was lame, and cast down, and still he made the finest things on Olympus.",
        "Here, sit by the fire. You've earned the warmth."],
    },
  },
  myrrhine: {
    id: "myrrhine", name: "Myrrhine", household: "the priestess", patron: "Dionysus", aretai: "Pneuma",
    look: { tunic: "#7a3a6a", hair: "#4a2a1a", skin: "#d8a878", veil: "#e8e2d0" },
    loves: ["Grapes", "WildGrapes", "Wine", "Garland", "WineAmphora"], likes: ["Figurine", "Flowers", "Thyme", "Milk", "Honey"], dislikes: ["Stone", "Hide"],
    lines: {
      cool: ["The god sees what you do. So do I.", "Come back when your heart is clearer."],
      new: ["Every hour of the day belongs to one of the Twelve. Learn whose, and work with them, not against them.",
        "Dionysus keeps the seat that Hades left empty. Wine and death are older friends than people think.",
        "Strangers come to the inn. Treat them well. You never know who walks in borrowed clothes."],
      friend: ["The night is not Olympian. Hades and Hecate have it. Be careful what you plant in the dark.",
        "When the old vine fruits, bring me the first clusters. The god will notice who remembers him."],
      close: ["I dreamed of you among the vines, with ivy in your hair. The god is fond of you, I think.",
        "There are rites I don't speak of in the square. Soon, perhaps, you'll be ready."],
    },
  },
  eudora: {
    id: "eudora", name: "Eudora", household: "the innkeeper", patron: "Hermes", aretai: "Aiolos",
    look: { tunic: "#3a6a7a", hair: "#8a4a2a", skin: "#c98e62" },
    loves: ["Milk", "Cornel", "Cloak"], likes: ["Garland", "Lamp", "Purslane", "Plum", "Mushrooms", "Meat", "Honey", "Wine"], dislikes: ["Feather", "Clay"],
    lines: {
      cool: ["Rooms are for paying guests.", "Hm? Oh. It's you."],
      new: ["Everyone passes through an inn sooner or later. Kings, beggars, and once, I swear, a man with goat's legs.",
        "Wolves in the forest east of you, they say. They come out at dusk. Don't be out there then.",
        "Hermes guards the road and the stranger on it. Be kind to travelers. It's good luck, and good sense."],
      friend: ["A shepherd swore he saw a hill full of pale earth to the east, good clay for the smith.",
        "The flowering valleys are where the satyrs dance, they say. I'd keep my wine jars close.",
        "You have a good face for news. People will tell you things."],
      close: ["You're always welcome at my hearth, paying or not.",
        "If you ever need to get a message somewhere fast, my courier is yours."],
    },
  },
};

export const REL_MIN = -12, REL_MAX = 12;
export function relTier(r: number): "cool" | "new" | "friend" | "close" {
  return r < 0 ? "cool" : r < 4 ? "new" : r < 8 ? "friend" : "close";
}
export function relLabel(r: number) {
  return r <= -6 ? "Hostile" : r < 0 ? "Cool" : r < 4 ? "Acquaintance" : r < 8 ? "Friend" : r < 12 ? "Close friend" : "Beloved";
}

// ---- the smith's work ----
export interface Upgrade { tool: string; level: number; name: string; cost: number; wood: number; desc: string }
export const UPGRADES: Upgrade[] = [
  { tool: "mattock", level: 2, name: "Bronze-shod mattock", cost: 60, wood: 5, desc: "Breaks boulders for 4 stone." },
  { tool: "axe", level: 2, name: "Fine bronze axe", cost: 40, wood: 4, desc: "Fells an oak in two blows." },
];
export const toolName = (id: string, level: number, base: string) => UPGRADES.find((u) => u.tool === id && u.level === level)?.name ?? base;

// ---- strangers at the inn ----
/** Any stranger has a small chance (1 in 12) of being a god in disguise. */
export interface Stranger { look: string; desc: string; god: string; disguise: string }
export const STRANGER_KINDS: { look: string; desc: string; gods: string[] }[] = [
  { look: "beggar", desc: "an old woman in a threadbare cloak, leaning on a stick", gods: ["Demeter", "Hera", "Athena"] },
  { look: "traveler", desc: "a lean traveler with a broad hat and dusty sandals", gods: ["Hermes", "Zeus", "Apollo"] },
  { look: "shepherd", desc: "a young shepherd with a crook and a cheerful grin", gods: ["Hermes", "Dionysus", "Apollo"] },
  { look: "potter", desc: "a potter walking his wares to market, his pack clinking", gods: ["Hephaestus", "Athena"] },
  { look: "bard", desc: "a wandering singer with a tortoiseshell lyre", gods: ["Apollo", "Aphrodite", "Dionysus"] },
];
export const STRANGER_DAYS = 3; // a new stranger every few days
export const GOD_CHANCE = 1; // on a d12
/** Food fit to set before a guest. */
export const GUEST_FOOD = ["Wine", "Milk", "Honey", "Meat", "Melon", "Plum", "Grapes", "WildGrapes", "Millet", "Chickpeas", "Cornel", "Mushrooms", "Purslane"];
