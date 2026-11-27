/**
 * The graces of divine favor (AEGIS Theoi, each god's favor tiers): what a god's favor lets you do, beyond the
 * everyday boon. A grace opens at +4 (the Theoi's "+4 to +6" tier) and deepens at +7 ("+7 to +9"). Names are
 * the Theoi's own tier names where it gives them.
 */
export interface Grace { name: string; desc: string }
export const GRACES: Record<string, { at4: Grace; at7: Grace }> = {
  Aphrodite: {
    at4: { name: "Beauty-Blessed", desc: "People warm to you: each day's chat counts one more, and flowers spring up where you walk." },
    at7: { name: "Golden One", desc: "Gifts count two more, and a lapsed request costs you no goodwill." },
  },
  Artemis: {
    at4: { name: "Wild-Favored", desc: "You can tame wild beasts. Hold out the food a creature likes and it lets you near; let it eat from your hand on three different days and the next one follows you home. One companion at a time." },
    at7: { name: "Moon-Blessed", desc: "Two days' feeding tames a beast (one at +10). Birds cry alarm when something dangerous is near, and under the moon you see by night." },
  },
  Demeter: {
    at4: { name: "Green-Blessed", desc: "Every harvest gives back seed to sow again." },
    at7: { name: "Earth's Blessing", desc: "Watered crops often grow two nights' worth in one." },
  },
  Hephaestus: {
    at4: { name: "Forge-Friend", desc: "Your station work is never poor." },
    at7: { name: "The Smith's Apprentice", desc: "Forge work needs one less copper." },
  },
  Poseidon: {
    at4: { name: "Sea-Blessed", desc: "Swimming costs half the breath, and horses calm at your touch: one feeding tames a wild horse." },
    at7: { name: "Wave-Master", desc: "You cannot drown, and you row a third faster." },
  },
  Hera: {
    at4: { name: "Hearth-Honored", desc: "Your house counts two more comforts, and your goats grow fond of you twice as fast." },
    at7: { name: "Queen's Favor", desc: "A night's sleep in your own bed heals you wholly." },
  },
  Athena: {
    at4: { name: "Wisdom's Child", desc: "Owls warn you when danger comes near, and which way it lies." },
    at7: { name: "Grey-Eyed Champion", desc: "You see through disguises: an empousa shows her true face, and a god in a traveler's cloak can't hide from you." },
  },
  Apollo: {
    at4: { name: "Lyre-Blessed", desc: "Prophetic dreams: on waking you know tomorrow's weather, and now and then a dream points the way to something you haven't found." },
    at7: { name: "Light-Bringer", desc: "Your healing works twice as well (the healer's kit, and sleep), and sickness passes you by." },
  },
  Dionysus: {
    at4: { name: "Wine-Touched", desc: "The wine you make is always fine." },
    at7: { name: "Twice-Blessed", desc: "The satyrs and maenads count every kindness twice." },
  },
  Hermes: {
    at4: { name: "Road-Blessed", desc: "Roads quicken your step, and you always know which way home lies." },
    at7: { name: "Swift One", desc: "Thieves can't rob you: brigands let one of Hermes' own walk on." },
  },
  Ares: {
    at4: { name: "War-Touched", desc: "Quick recovery: when nothing has hurt you for a while, your wounds slowly close." },
    at7: { name: "Blood-Blessed", desc: "The wounds you deal bleed: a creature you strike takes another blow's worth a moment later." },
  },
  Zeus: {
    at4: { name: "Storm-Spared", desc: "Storms never harm you (rain and cold don't wear on you), and your blows bite deeper into monsters." },
    at7: { name: "Lawgiver", desc: "Your word carries weight: quarrels you judge always end in peace." },
  },
  Hades: {
    at4: { name: "Deep-Sighted", desc: "In caves you see further into the dark." },
    at7: { name: "Wealth-Giver", desc: "Ore always breaks out richer." },
  },
  Hecate: {
    at4: { name: "Torch-Kin", desc: "The night hinders you less: you see by dark as by dusk." },
    at7: { name: "Key-Holder", desc: "The restless dead let you pass." },
  },
};

/** Wild creatures that can be tamed, what they'll eat from your hand, and what they do as companions. */
export type Role = "guard" | "watch" | "mount";
export const TAMABLE: Record<string, { food: string[]; role: Role; bite?: number }> = {
  hare: { food: ["Purslane", "Chickpeas", "Millet", "Mint"], role: "watch" },
  deer: { food: ["Millet", "Chickpeas", "Melon", "Oats", "Plum"], role: "watch" },
  ibex: { food: ["Thyme", "Millet", "Oats", "Capers"], role: "watch" },
  fox: { food: ["Meat", "Grapes", "WildGrapes"], role: "guard", bite: 0.5 },
  jackal: { food: ["Meat"], role: "guard", bite: 0.5 },
  wolf: { food: ["Meat"], role: "guard", bite: 1 },
  boar: { food: ["Millet", "Chickpeas", "Melon", "Mushrooms"], role: "guard", bite: 1 },
  bear: { food: ["Honey", "Meat", "Plum"], role: "guard", bite: 2 },
  horse: { food: ["Oats", "Millet", "Melon", "Plum"], role: "mount" },
};
export const PET_NAMES = ["Argos", "Melampous", "Aithon", "Xanthos", "Podarge", "Phoibe", "Lampos", "Aura", "Kallisto", "Arktos", "Bia", "Nike", "Selene", "Ione", "Kyllaros", "Balios"];
