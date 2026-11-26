/**
 * Tiresias of Thebes: an old blind seer who has come to sit out his long life on your farm.
 * He asks small things of you, and each one happens to lead you a little further into the world:
 * the well and the field, the goats, the gods' hours, the village, the wild, the dark, the water and the dead.
 */
import { ITEMS, seedId } from "./data";
import type { GameState } from "./state";

/** What a step needs to know: how often a thing has happened since he asked. */
export interface TirCtx { got: (ev: string) => number; G: GameState }
export interface TirStep {
  title: string;
  /** What he says when he asks. {where} is filled with directions, for the steps that send you somewhere. */
  ask: string;
  /** Plainly, how it's done: shown in parentheses and in the journal. */
  how: string;
  /** Done yet? And how far along, in a few words. */
  check: (c: TirCtx) => [boolean, string];
  /** What handing it over takes from you, if anything. */
  take?: (G: GameState) => void;
  /** The words for handing it over. */
  give?: string;
  thanks: string;
  /** Give the reward; say what it was. */
  reward: (G: GameState) => string;
  /** A place he sends you to, fixed when he asks. */
  anchor?: "tirShrine" | "tirGrave" | "cave";
}

const have = (G: GameState, id: string, n = 1): [boolean, string] => [G.count(id) >= n, `you carry ${Math.min(G.count(id), n)} of ${n} ${ITEMS[id].name.toLowerCase()}`];
const times = (c: TirCtx, ev: string, n: number, what: string): [boolean, string] => [c.got(ev) >= n, `${what}: ${Math.min(c.got(ev), n)} of ${n}`];
const items = (G: GameState, list: [string, number][]) => list.map(([id, n]) => { G.addItem(id, n); return `${n} ${ITEMS[id].name.toLowerCase()}`; }).join(", ");
const silver = (G: GameState, n: number) => { G.data.silver += n; return `${n} silver`; };
const favor = (G: GameState, god: string, n: number) => { G.addFavor(god, n); return `${god} +${n}`; };

export const TIRESIAS: TirStep[] = [
  {
    title: "A cup of water",
    ask: `"My throat is dust from the road, and I cannot see your well. Would you draw me a cup?"`,
    how: "Hold the water jar (1–0) and press Space at the well to fill it, then come back and speak to him (E).",
    check: ({ G }) => [G.count("jar") > 0 && G.data.jarWater > 0, G.data.jarWater > 0 ? "your jar has water in it" : "your jar is empty"],
    take: (G) => { G.data.jarWater--; },
    give: "Pour him a cup from your jar",
    thanks: `He drinks it slowly, the whole cup. "Cold. Deep-drawn. A good well is the first blessing of a house, and you have one. Hesiod would approve."`,
    reward: (G) => items(G, [["Plum", 3]]),
  },
  {
    title: "The smell of the season",
    ask: `"I know the year by its smells now. Bring me something growing, so I know where we are in it. Flowers, if any are out."`,
    how: "Wildflowers grow around the farm: pick them by hand (E or Space with nothing useful in hand), or cut them with the sickle.",
    check: ({ G }) => have(G, "Flowers"),
    take: (G) => { G.removeItem("Flowers", 1); },
    give: "Put the flowers in his hands",
    thanks: `He holds them to his face. "Ah. So that is the month. I'd lost count somewhere on the road." He tucks one behind his ear, and looks very pleased with himself.`,
    reward: (G) => silver(G, 5),
  },
  {
    title: "Seed in the furrow",
    ask: `"A farm that is not sown is only a house with a view. Break three squares of ground, and if the season allows it, put a seed in one."`,
    how: "Hold the hoe and press Space on bare ground to till it. Hold seeds and press Space on tilled soil to sow, then water it with the jar. (In winter, nothing will grow: tilling is enough.)",
    check: ({ got, G }) => {
      const winter = G.month.season === "Winter";
      const done = got("till") >= 3 && (winter || got("sow") >= 1);
      return [done, `tilled ${Math.min(got("till"), 3)} of 3${winter ? "" : `, sown ${Math.min(got("sow"), 1)} of 1`}`];
    },
    thanks: `He listens to the hoe's work in the distance as if it were music. "Good. Water them each day, and sow in the god's own hour if you can: Demeter's, for grain. Things sown in their hour grow finer."`,
    reward: (G) => items(G, [[seedId("Mint"), 3]]),
  },
  {
    title: "The goats' complaint",
    ask: `"Your goats talk all day. They say they are underfed, but goats always say that. Bring me a little milk, and we'll know if they're lying."`,
    how: "Pet each goat (E), keep the manger full of fiber or wild oats and the trough full of water. A goat that ate and drank last night can be milked (E) today.",
    check: ({ G }) => have(G, "Milk"),
    take: (G) => { G.removeItem("Milk", 1); },
    give: "Give him the milk",
    thanks: `"Warm. They were lying, then: they're fed well enough." He drinks. "Keep them content and they'll give twice as much. A goat is a moody thing, like a god."`,
    reward: (G) => items(G, [["Honey", 1], ["Oats", 6]]),
  },
  {
    title: "The names of things",
    ask: `"Athena took my eyes, and in return she let me understand what I could no longer see. You still have your eyes. Use them: study two things closely, and tell me what you learn."`,
    how: "Look at a plant, a creature or a stone and press Q to study it (a Gnosis roll, once per kind per day). What you learn goes in your lore book (K), and the more you know, the more you get from it.",
    check: (c) => times(c, "study", 2, "things studied"),
    thanks: `"And? No, don't tell me. I can hear it in your voice: you know it better now. Knowing a thing is half of using it well."`,
    reward: (G) => `${favor(G, "Athena", 1)}, ${silver(G, 6)}`,
  },
  {
    title: "Hands that make",
    ask: `"A carpenter lived on this farm once. I can smell the old shavings in the hut. Build yourself a workbench, and let it be a working house again."`,
    how: "Press C to craft. A workbench takes wood and stone (the axe fells trees, the mattock breaks stone). Hold it and click to set it down on your land, then press E at it to make chests, fences, a kiln, a loom, a press, a forge, a boat.",
    check: (c) => times(c, "place:Workbench", 1, "workbench set down"),
    thanks: `He runs his hands along the new wood. "Square. Well joined. Hephaestus limps, they say, but his hands are true. Yours too."`,
    reward: (G) => items(G, [["Wood", 10], ["Fiber", 6]]),
  },
  {
    title: "The hours of the gods",
    ask: `"Each hour of the day belongs to one of the Twelve. You should know whose hour you are working in. Pray at your household altar, and make an offering to some god, any god, of something that is theirs."`,
    how: "The altar is inside your hut (E). Pray to one god a day; every few days of prayer they notice you. To offer, hold something that belongs to a god (grain to Demeter, grapes or wine to Dionysus, wood or meat to Zeus) and use the altar. F shows the gods, and how you stand with each.",
    check: ({ got }) => [got("pray") >= 1 && got("offer") >= 1, `prayed ${Math.min(got("pray"), 1)} of 1, offered ${Math.min(got("offer"), 1)} of 1`],
    thanks: `"I smelled the smoke. The gods are not so different from the rest of us: they like to be remembered, and they like to be fed."`,
    reward: (G) => `${favor(G, "Zeus", 1)} (for taking in a stranger), ${items(G, [["Torch", 2]])}`,
  },
  {
    title: "A greeting to the village",
    ask: `"There's a priestess in the village below, I'm told. Myrrhine. Take her my greeting. Tell her the old man from Thebes is sitting under your olive tree, and is in no hurry to leave it."`,
    how: "The road south leads to the village. Find Myrrhine, the priestess, and talk to her (E).",
    check: (c) => times(c, "greet:myrrhine", 1, "greeting given"),
    thanks: `"She laughed? Good. Priests who can laugh are the only ones worth listening to. Talk with your neighbors every day, and bring them small gifts: they'll warm to you."`,
    reward: (G) => silver(G, 10),
  },
  {
    title: "A neighbor's need",
    ask: `"Neighbors are a farmer's wealth, Hesiod says, more than his barns. Ask one of them what they need, and see that they get it."`,
    how: "In the village, ask a villager if they need anything. They may want goods brought or a parcel carried. Your journal (J) keeps your promises.",
    check: (c) => times(c, "request", 1, "requests fulfilled"),
    thanks: `"Word travels even to a blind man under a tree. They speak well of you down there. Keep it so."`,
    reward: (G) => `${silver(G, 12)}, ${items(G, [["Cornel", 3]])}`,
  },
  {
    title: "A land not your own",
    ask: `"East of your fence the land changes as you walk: forest, hills, marsh, plains. I walked them all once, in my seven lifetimes. Go out until you stand in a land that is not like this one, and come and tell me of it."`,
    how: "Walk off the east edge of the farm into the wild. Each new stretch of country may be a different land. Mind the hour: night is dangerous out there. A campfire (12 fiber, 4 stone) lets you sleep out.",
    check: (c) => times(c, "foreign", 1, "other lands seen"),
    thanks: `"I can smell it on you: resin, or salt, or marsh mud. The world is wide, and every part of it is some god's. Learn whose, and walk carefully."`,
    reward: (G) => `${items(G, [["Torch", 2], ["Meat", 2]])}`,
  },
  {
    title: "What the birds say",
    ask: `"When Athena blinded me, she cleaned my ears so that I understand the birds. Now I'll teach you a little of it. Watch the sky, and when a bird or a sign comes to you, notice which side it comes from."`,
    how: "Omens come now and then outdoors: birds, thunder, a voice. Your Pneuma decides whether you notice one, your Gnosis whether you read it right. On your right, a fair sign; on your left, a warning.",
    check: (c) => times(c, "omen", 1, "omens noticed"),
    thanks: `"From the right? Or the left? Either way, you noticed. Most people walk through omens like a goat through a sanctuary."`,
    reward: (G) => `${favor(G, "Apollo", 1)}, ${items(G, [["Feather", 3]])}`,
  },
  {
    title: "Meat for an old man",
    ask: `"I have eaten your plums and drunk your milk, and I am grateful. But a man of my age remembers meat. Hunt something for me."`,
    how: "Click with the spear to thrust (it reaches far). Hold the button to aim and release to throw it, then go and fetch it. Each blow burns Fire Essence: strike, then let it rekindle. The bow works too. Deer are Artemis': give her a share at an altar.",
    check: ({ G }) => have(G, "Meat"),
    take: (G) => { G.removeItem("Meat", 1); },
    give: "Give him the meat",
    thanks: `He eats it with enormous satisfaction. "Seven lifetimes, and nothing has ever beaten roast meat. Not even prophecy."`,
    reward: (G) => silver(G, 15),
  },
  {
    title: "A rumor run to ground",
    ask: `"Village people talk of far places they have never seen. Half of what they say is true. Find out which half: ask one of them for a rumor, and go and see."`,
    how: "Ask a villager for rumors of lands they've heard of. Your journal (J) keeps the directions. The land will be what they said when you get there.",
    check: (c) => times(c, "rumor", 1, "rumors found true"),
    thanks: `"True, was it? Then remember who told you, and tell them so: people like to be believed."`,
    reward: (G) => `${silver(G, 10)}, ${items(G, [["Thyme", 3]])}`,
  },
  {
    title: "The god in the country",
    ask: `"Out in the wild there are shrines with nobody to visit them but their keepers. I smelled one on the wind years ago, {where}. Go there and talk with whoever keeps it."`,
    how: "Find the shrine and speak to its priest or priestess: they will tell you what their god loves and hates, how you stand, and what the god would have of you.",
    check: (c) => times(c, "shrineKeeper", 1, "shrine keepers spoken with"),
    thanks: `"Keepers of shrines are lonely people. They'll have told you more than you asked. Remember it: a god's favor drifts back to nothing if it isn't tended."`,
    reward: (G) => `${silver(G, 12)}, ${items(G, [["Flowers", 4]])}`,
    anchor: "tirShrine",
  },
  {
    title: "Into the dark",
    ask: `"There is a cave out there, {where}. Caves are the mouths of the earth. Go in, and bring me back the feel of the dark."`,
    how: "Carry a torch (crafted with C) or a lamp, or every action in the dark is at -3. Press E at the cave mouth to go in.",
    check: (c) => times(c, "cave", 1, "caves entered"),
    thanks: `"Cold, wasn't it, and the sound wrong? I live in that dark always, and it's not so bad. But you should come home from it."`,
    reward: (G) => items(G, [["Torch", 3], ["Copper", 1]]),
    anchor: "cave",
  },
  {
    title: "The old places",
    ask: `"Every land out there keeps one old place: a fallen tower, a lightning-struck oak, a wreck on the shore, a den. People leave things in such places, and things wait in them. Go and take something from one."`,
    how: "Each stretch of the wild has a landmark (its name shows where you are). Things to find there come back each season; some have a cache to search, a lookout to climb or a dry bed to dig. Some have dangers of their own.",
    check: (c) => times(c, "landmark", 1, "landmarks searched"),
    thanks: `"And it didn't bite you. Good. Old places remember who has been there before."`,
    reward: (G) => `${silver(G, 15)}, ${items(G, [["Fiber", 6], ["Stone", 4]])}`,
  },
  {
    title: "Across the water",
    ask: `"I crossed many rivers in my years and never once learned to swim. Row a boat from one land into the next, and tell me if it is easier than walking."`,
    how: "Boats are rare where the shallows meet the shore; or build one at your workbench and set it in the water. Get in (E), row in strokes with the move keys, and row off the edge along a river or coast to carry it with you.",
    check: (c) => times(c, "boatmap", 1, "lands crossed by boat"),
    thanks: `"Easier, until it isn't. Poseidon gives and he takes. But a river is a road that carries you, and that is something."`,
    reward: (G) => `${favor(G, "Poseidon", 1)}, ${silver(G, 15)}`,
  },
  {
    title: "A stranger at the gate",
    ask: `"You took me in without asking who I was. That is xenia, and Zeus watches it. Now there will be other strangers: when one comes to the village inn, feed them."`,
    how: "Strangers come to the village inn every so often. Talk to one and offer them food. Some strangers are more than they seem.",
    check: (c) => times(c, "host", 1, "strangers fed"),
    thanks: `"Was it a god? It might have been. That is the point: you can never be sure, so you must be kind to all of them."`,
    reward: (G) => `${favor(G, "Zeus", 1)}, ${silver(G, 15)}`,
  },
  {
    title: "Where three roads meet",
    ask: `"I met a man once at a place where three roads meet. He went on to his father's death and his mother's bed, and I told him so, and he did not thank me. Crossroads are Hecate's at night. Leave her a supper at one, and do not look back."`,
    how: "Wild tracks sometimes cross, and a herm stands at every crossroads: a stone for Hermes by day. At night, hold some food (honey, meat, milk, mint) and leave it at the herm. The dead walk at crossroads at night.",
    check: (c) => times(c, "hecate", 1, "suppers left for Hecate"),
    thanks: `"You didn't look back? Good. Hecate keeps the keys of the doors between things. It's well to have her on your side."`,
    reward: (G) => `${favor(G, "Hecate", 1)}, ${items(G, [["Torch", 2], ["Honey", 1]])}`,
  },
  {
    title: "The asphodel",
    ask: `"I have outlived seven generations of Thebes. All of them are below now. There is a graveyard {where}: I smell the asphodel from here. Go at night and pour something out for them, for the ones I outlived."`,
    how: "The dead take their offerings only in the dark. At the graveyard, by night, hold honey, milk, wine or meat and pour it for the dead (E).",
    check: (c) => times(c, "graveOffer", 1, "offerings poured for the dead"),
    thanks: `He is quiet a long time. "They drank it. I heard them." He turns his blind face toward you. "You have walked the whole round of the world for me now: well and field, gods and neighbors, the wild, the dark, the water and the dead. Here is what I see for you. Your days will be many, and hard, and good. Sow in your season. Keep your guests. And when you go below at last, they will know your name there."`,
    reward: (G) => {
      const before = G.data.aretai.Pneuma ?? 3;
      G.data.aretai.Pneuma = Math.min(8, before + 1);
      return `${G.data.aretai.Pneuma > before ? "Pneuma +1 (you see a little of what he sees)" : "his blessing"}, ${favor(G, "Hades", 1)}, ${items(G, [["OwlFeather", 1]])}`;
    },
    anchor: "tirGrave",
  },
];

/** What he says when you come near, by how things stand. */
export const TIR_CALLS = {
  first: ["Who's there? Light feet. Young.", "Is this your farm? Then I'm your guest.", "Come here, come here. I don't bite. Not anymore."],
  ask: ["You there! A moment for an old man?", "I hear you. Come, I have something to ask.", "Ah, you. Sit a moment."],
  ready: ["I can smell what you've brought. Come!", "Is that you? You've done it, haven't you?", "Come, tell me."],
  waiting: ["Enough for today. Come tomorrow.", "Tomorrow. Old men tire.", "Let an old man doze."],
  idle: [
    "Work is no disgrace. Idleness is.", "Sow naked, plough naked, reap naked, Hesiod says. Ha!", "The cranes will cry when it's time to plough.",
    "The goats are arguing again.", "Rain tomorrow, I think. Or not.", "A bad neighbor is a curse.", "I was a woman once, for seven years. Don't ask.",
    "The bees are busy. Good.", "Zeus sees everything. So do I, in my way.", "Mind the hour. Every hour has its god.", "Mm.", "...",
  ],
  night: ["The dark is the same to me.", "Go to bed. The dead walk.", "Owls. Athena's birds."],
  rain: ["Wet as a frog.", "Zeus is weeping again.", "Athena's olive keeps an old man dry. Mostly.", "Good for your fields, this."],
  done: ["Seven lifetimes, and this is the best seat I've had.", "You see more than you did.", "Listen to the bees.", "Sow in your season."],
};

/** His counsel after the course is done: a glimpse of tomorrow's sky. */
export const TIR_WEATHER: Record<string, string> = {
  clear: "Tomorrow the sky will be clean as a washed bowl.",
  cloudy: "Tomorrow clouds, heavy but holding.",
  rain: "Tomorrow, rain. Don't water your fields.",
  mist: "Tomorrow, mist at dawn, thick as wool.",
  wind: "Tomorrow, wind. Mind your fires.",
};
