/**
 * Character creation: the Core Rules' twelve steps, laid out on the Cosmic Wheel (Character Systems doc).
 * The vertical slice starts every life as a Young Adult. Tables are the Core Rules' own.
 */
export interface TableEntry { name: string; text: string; aretai?: Record<string, number>; wealth?: number; health?: number; stealth?: number; favor?: Record<string, number>; favorPoints?: number; rel?: number; relWith?: string }

export const STEPS = ["Cosmic Sign", "Birthright", "Life Stage", "Training", "Hamartia", "Aretai", "Expertises", "Thaumatai", "Divine Favor", "Resources", "Astheneia", "Moros"];
export const STEP_HELP: string[] = [
  "Your birth sign: the first flash of divine attention, and an affinity with one position on the Wheel.",
  "The circumstances into which you were born: your family, your class, your first connections.",
  "Your age and stage of life. This slice begins every life as a Young Adult: 8 Life Thread, 36 Aretai points.",
  "Your education and trade, which shapes the Aretai you begin with.",
  "Your fatal flaw, the dark mirror of your heroism, drawing you toward your doom. It stays visible, so you can plan around it.",
  "Your twelve excellences. Spend 36 points; 3 is basic competence, 10 the human peak. Birthright and Training add to these.",
  "Specialized skills that add dice to particular actions. (Expertises come in a later build.)",
  "The supernatural quality that makes a mortal heroic. (Natural Thaumatai come in a later build.)",
  "Spread +4 and -2 favor among the gods, on top of your sign's gift.",
  "Twelve points across Wealth (starting coin), Health (blows hurt you less) and Stealth (creatures let you closer). At least 1 in each.",
  "Your personal weakness, which no effort will ever quite cure.",
  "Your fated doom. The Fates keep it hidden: it will come out over a lifetime, in omens, dreams and oracles.",
];

export const SIGNS: TableEntry[] = [
  ["The Lover", "Aphrodite"], ["The Hunter", "Artemis"], ["The Farmer", "Demeter"], ["The Smith", "Hephaestus"], ["The Merchant", "Poseidon"], ["The Sage", "Hera"],
  ["The Judge", "Athena"], ["The Visionary", "Apollo"], ["The Priestess", "Hecate"], ["The Messenger", "Hermes"], ["The Warrior", "Ares"], ["The Lord", "Zeus"],
].map(([name, god]) => ({ name, text: `+1 favor with ${god}${god === "Hecate" ? " (a hidden, chthonic track)" : ""}.`, favor: { [god]: 1 } }));

export const BIRTHRIGHTS: TableEntry[] = [
  { name: "The Gutter", text: "+1 Phoenix, -3 Wealth, +3 Stealth.", aretai: { Phoenix: 1 }, wealth: -3, stealth: 3 },
  { name: "Wild Shepherd/Hunter", text: "+1 Kardia, -1 Wealth, +1 Health.", aretai: { Kardia: 1 }, wealth: -1, health: 1 },
  { name: "Farmstead", text: "+1 Oikos, +1 Wealth.", aretai: { Oikos: 1 }, wealth: 1 },
  { name: "Craftsman's Workshop", text: "+1 Techne.", aretai: { Techne: 1 } },
  { name: "Sailing Merchants", text: "+1 Metis, +2 Wealth.", aretai: { Metis: 1 }, wealth: 2 },
  { name: "Library", text: "+1 Gnosis.", aretai: { Gnosis: 1 } },
  { name: "City Streets", text: "+1 Logos, +1 Wealth.", aretai: { Logos: 1 }, wealth: 1 },
  { name: "Poets", text: "+1 Ourania.", aretai: { Ourania: 1 } },
  { name: "Temple Sanctuary", text: "+1 Pneuma, +2 Divine Favor to spread.", aretai: { Pneuma: 1 }, favorPoints: 2 },
  { name: "Travelers", text: "+1 Aiolos, +1 Stealth.", aretai: { Aiolos: 1 }, stealth: 1 },
  { name: "Barracks", text: "+1 Thymos, +1 Health.", aretai: { Thymos: 1 }, health: 1 },
  { name: "Noble House", text: "+1 Kratos, +3 Wealth, -3 Stealth.", aretai: { Kratos: 1 }, wealth: 3, stealth: -3 },
];

export const TRAININGS: TableEntry[] = [
  ["Acting", "Phoenix", "Metis", "Pneuma"], ["Hunting", "Kardia", "Aiolos", "Thymos"], ["Farming", "Oikos", "Techne", "Gnosis"],
  ["Crafting", "Techne", "Kardia", "Ourania"], ["Marketplace", "Metis", "Oikos", "Kratos"], ["Scrolls", "Gnosis", "Logos", "Techne"],
  ["Politics", "Logos", "Phoenix", "Oikos"], ["Nature", "Ourania", "Gnosis", "Aiolos"], ["Temple", "Pneuma", "Ourania", "Logos"],
  ["Athletics", "Aiolos", "Thymos", "Kardia"], ["Warfare", "Thymos", "Kratos", "Metis"], ["Rulership", "Kratos", "Pneuma", "Phoenix"],
].map(([name, a, b, c]) => ({ name, text: `+3 ${a}, +2 ${b}, +1 ${c}.`, aretai: { [a]: 3, [b]: 2, [c]: 1 } }));

export const HAMARTIAI: TableEntry[] = [
  ["Love Thirst", "You are weakened on any day when no one has professed their love for you."],
  ["Unyielding Honor", "You are weakened on any day when you feel your honor has been injured."],
  ["Ancestral Burden", "You are weakened by reminders of a family ancestor who committed heinous crimes."],
  ["Fatal Curiosity", "You are weakened when tempted by an intrigue which you cannot explore."],
  ["Vengeful Persistence", "You are weakened when you have any opportunity for righteous vengeance which you are not taking."],
  ["Intellectual Pride", "You are weakened whenever it is shown that you were wrong about some knowledge."],
  ["Legal Rigidity", "You are weakened when you feel the letter of the law is not being followed."],
  ["Far-Sightedness", "You are weakened when forced to focus on the present moment for too long."],
  ["Oracular Dependence", "You are weakened when you feel your actions are outside of any guidance from the gods."],
  ["Wanderlust", "You are weakened if you stay in one place for too many days."],
  ["Battle Ecstasy", "You are weakened by going too long without fighting."],
  ["Glory Hunger", "You are weakened on any day that you have not been glorified by another."],
].map(([name, text]) => ({ name, text }));

export const ASTHENEIAI: TableEntry[] = [
  { name: "Wine and blades", text: "+2 damage from blades near poured wine." },
  { name: "Rain and arrows", text: "+2 damage from arrows while it is raining." },
  { name: "Meals and blades", text: "+2 damage from blades while anyone is eating nearby." },
  { name: "Fire in armor", text: "+2 damage from fire while wearing any armor." },
  { name: "Coin and blades", text: "+2 damage from blades while you are holding money." },
  { name: "Speech and arrows", text: "+2 damage from arrows when you have just spoken." },
  { name: "Silence and spears", text: "+2 damage from spears when no one has spoken for a while." },
  { name: "The open sky", text: "+2 damage from thirst and disease under a clear sky." },
  { name: "Priest", text: "+3 standing with the priestess and those of her cult.", rel: 3, relWith: "myrrhine" },
  { name: "Foreigner", text: "-2 standing with locals.", rel: -2 },
  { name: "Hero", text: "+1 Health; veterans and Ares' supplicants honor you.", health: 1 },
  { name: "Royalty", text: "+6 Wealth; -1 standing with those not of noble birth.", wealth: 6, rel: -1 },
];

export const MOROI: TableEntry[] = [
  ["Broken Heart", "You are fated to lose a great love, and when you do it could kill you."],
  ["Betrayal", "You are fated to be betrayed in a time of great danger."],
  ["Exile", "You are fated to be exiled from your homeland."],
  ["Slain by Your Creation", "You are fated to be killed by something you have created."],
  ["Web of Lies", "You are fated to be brought down by your own lie."],
  ["Forbidden Knowledge", "You are fated to be destroyed by learning something you were not supposed to know."],
  ["Unfair Prosecution", "You are fated to be brought down by unjust legal action."],
  ["Lost Way", "You are fated to get terminally lost during a dangerous journey."],
  ["Divine Jealousy", "You are fated to become the enemy of one god due to your work for another."],
  ["High Fall", "You are fated to die in a fall from a precipitous height."],
  ["Heroic Stand", "You are fated to die in a courageous battle."],
  ["Heavy Crown", "You are fated to be crushed by the weight of your own power."],
].map(([name, text]) => ({ name, text }));

export const YOUNG_ADULT = { name: "Young Adult", gift: "Poseidon's Wanderlust", thread: 8, aretaiPoints: 36, expertise: 4 };
export const ARETAI_MAX_AT_CREATION = 7; // before Birthright and Training bonuses
export const FAVOR_PLUS = 4, FAVOR_MINUS = 2;
export const RESOURCE_POINTS = 12, RESOURCE_MAX = { Wealth: 10, Health: 10, Stealth: 6 };
export const SILVER_PER_WEALTH = 5;

export const NAMES = ["Lykaon", "Ianthe", "Damon", "Kleio", "Phaedra", "Thrasyllos", "Aglaia", "Nikias", "Myrto", "Agathon", "Eirene", "Philon", "Theano", "Dorion", "Kallisto", "Menon"];
export const TUNICS = ["#e9e1cf", "#b0412f", "#3a6a7a", "#6f8a3a", "#7a3a6a", "#c9a35a", "#5a4a3a"];
export const HAIRS = ["#4a3324", "#2a1d14", "#8a4a2a", "#c9a35a", "#d8d8d0"];
export const SKINS = ["#c98e62", "#e0b08a", "#a8744a", "#7a5034"];
