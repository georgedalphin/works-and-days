/**
 * Music: the first of the Arts. Hold V to hum; keys 1–8 sing the steps of the scale of a harmonia (an ancient mode),
 * and the mouse wheel changes harmonia. Hold an instrument and you play it instead.
 * Certain short melodies are more than tunes: performed well, they work small magic.
 * People teach the simpler ones; the stronger ones you must hear, from nymphs or birds, and sing back before they fade.
 */
import { ITEMS, RECIPES } from "./data";

/**
 * The seven harmoniai as the ancients named their octave species (not the later church modes of the same names):
 * the steps of each, in semitones, ascending from its lowest note. Each has an ethos the Greeks spoke of, and a god it suits.
 */
export const HARMONIAI: { name: string; steps: number[]; ethos: string; god: string }[] = [
  { name: "Dorian", steps: [1, 2, 2, 2, 1, 2, 2], ethos: "steady, grave and manly", god: "Ares" },
  { name: "Phrygian", steps: [2, 1, 2, 2, 2, 1, 2], ethos: "ecstatic, for the god's revels", god: "Dionysus" },
  { name: "Lydian", steps: [2, 2, 1, 2, 2, 2, 1], ethos: "soft and sweet", god: "Aphrodite" },
  { name: "Mixolydian", steps: [1, 2, 2, 1, 2, 2, 2], ethos: "plaintive, for lament", god: "Demeter" },
  { name: "Hypodorian", steps: [2, 1, 2, 2, 1, 2, 2], ethos: "proud and grand", god: "Zeus" },
  { name: "Hypophrygian", steps: [2, 2, 1, 2, 2, 1, 2], ethos: "active, the shepherd's mode", god: "Hermes" },
  { name: "Hypolydian", steps: [2, 2, 2, 1, 2, 2, 1], ethos: "bright, Apollo's healing", god: "Apollo" },
];
/** The frequency of step n (1–8) of a harmonia, from a root note (MIDI). */
export function stepFreq(mode: number, n: number, root: number): number {
  const steps = HARMONIAI[mode].steps;
  let semis = 0; for (let i = 0; i < n - 1; i++) semis += steps[i % 7];
  return 440 * Math.pow(2, (root + semis - 69) / 12);
}

/** What you sing or play with: how much it adds to a performance, which gods it leans toward, and how it sounds. */
export interface Instrument { id: string; name: string; power: number; gods: string[]; root: number; sound: "voice" | "lyre" | "syrinx" | "aulos" }
export const INSTRUMENTS: Record<string, Instrument> = {
  voice: { id: "voice", name: "your voice", power: 0, gods: [], root: 57, sound: "voice" },
  Syrinx: { id: "Syrinx", name: "the reed pipes", power: 1, gods: ["Hermes", "Dionysus"], root: 69, sound: "syrinx" },
  Lyre: { id: "Lyre", name: "the lyre", power: 2, gods: ["Apollo", "Hermes"], root: 57, sound: "lyre" },
  Aulos: { id: "Aulos", name: "the aulos", power: 2, gods: ["Dionysus", "Ares", "Athena"], root: 57, sound: "aulos" },
};
ITEMS.Syrinx = { id: "Syrinx", value: 10, name: "Reed pipes", greek: "syrinx", kind: "tool", desc: "Pan's pipes. Hold them, then hold V and play 1–8. Hermes' and Dionysus' music; better than the voice alone (+1)." };
ITEMS.Lyre = { id: "Lyre", value: 40, name: "Lyre", greek: "lyra", kind: "tool", desc: "Hermes made the first from a tortoise shell and horns; Apollo plays it. Hold it, then hold V and play 1–8 (+2, Apollo's and Hermes' songs +1 more)." };
ITEMS.Aulos = { id: "Aulos", value: 30, name: "Aulos", greek: "aulos", kind: "tool", desc: "The double reed pipe, wild and piercing. Hold it, then hold V and play 1–8 (+2, Dionysus', Ares' and Athena's songs +1 more)." };

/** Where a melody can be learned: taught by a person, or heard in the world and sung back. */
export type SongSource = "taught" | "heard";
/** A melody that works magic: its harmonia, its notes (steps 1–8), its god, and how it is learned. */
export interface Melody { id: string; name: string; mode: number; notes: number[]; god: string; source: SongSource; teacher: string; desc: string; hard: number }
export const MELODIES: Melody[] = [
  // Taught by people.
  { id: "work", name: "Work song", mode: 0, notes: [1, 3, 1, 3, 5, 3], god: "Demeter", source: "taught", teacher: "Lykos the smith, who keeps time with his hammer", desc: "A song to keep time by. It restores Energy and refills your Earth.", hard: 0 },
  { id: "shepherd", name: "Shepherd's call", mode: 5, notes: [5, 3, 5, 3, 1], god: "Hermes", source: "taught", teacher: "shepherds and goatherds in the wild", desc: "Animals settle at it: angry beasts nearby calm, and your goats grow fonder of you.", hard: 0 },
  { id: "lullaby", name: "Lullaby", mode: 2, notes: [5, 4, 3, 2, 1, 2, 1], god: "Aphrodite", source: "taught", teacher: "Theron the miller, who sang his grandson to sleep", desc: "Calms an angry creature that has come for you, as Orpheus calmed the beasts.", hard: 0 },
  { id: "rowers", name: "Rowers' chant", mode: 0, notes: [1, 1, 5, 1, 1, 5], god: "Poseidon", source: "taught", teacher: "Eudora the innkeeper, who hears the sailors sing it, and fisher folk", desc: "Keeps the stroke: rowing is swifter for a few hours.", hard: 0 },
  { id: "paean", name: "Paean", mode: 6, notes: [1, 3, 5, 8, 5, 3], god: "Apollo", source: "taught", teacher: "Myrrhine the priestess", desc: "Apollo's healing hymn: Vitality returns, and the dead keep their distance for a while.", hard: 0 },
  { id: "lament", name: "Lament", mode: 3, notes: [8, 7, 6, 5, 4, 3, 2, 1], god: "Hades", source: "taught", teacher: "the keepers of the graves, and hermits", desc: "Sung for the dead by night: Hades notices, and restless shades are quieted.", hard: 0 },
  { id: "augury", name: "Tiresias' bird-call", mode: 4, notes: [3, 5, 3, 6, 5], god: "Athena", source: "taught", teacher: "Tiresias, who learned it from the birds Athena let him understand", desc: "Calls the birds to speak to you: the next omen you will surely notice, and read aright.", hard: 0 },
  // Heard in the world: nymphs and birds. Harder to perform, and stronger.
  { id: "naiad", name: "The Naiad's song", mode: 2, notes: [5, 6, 8, 6, 5, 3], god: "Poseidon", source: "heard", teacher: "the Naiad, singing in her spring, once she knows you", desc: "Water answers: at home your tilled soil is watered all around you; in the wild your jar fills and your Water is restored.", hard: 2 },
  { id: "revel", name: "The satyrs' revel", mode: 1, notes: [1, 2, 3, 5, 3, 2, 1, 5], god: "Dionysus", source: "heard", teacher: "the satyrs piping at their revel, once they know you", desc: "Wild joy: Fire and Air rush back, weariness falls away, and Dionysus is near you for hours.", hard: 2 },
  { id: "nightingale", name: "The nightingale's song", mode: 2, notes: [8, 7, 8, 5, 6, 5, 3], god: "Aphrodite", source: "heard", teacher: "a nightingale at dusk, in meadow, forest and farmland", desc: "Sweetness lingers on you: for half a day, people warm to you more when you talk and give.", hard: 2 },
  { id: "lark", name: "The lark's song", mode: 6, notes: [5, 6, 5, 8, 8, 6], god: "Hermes", source: "heard", teacher: "a crested lark at dawn, over farmland and plains", desc: "Light feet: for a few hours running costs half the breath.", hard: 2 },
  { id: "cicadas", name: "The cicadas' song", mode: 5, notes: [3, 3, 3, 4, 3, 2, 3], god: "Apollo", source: "heard", teacher: "the cicadas at summer noon, who (Socrates said) report to the Muses who honors them", desc: "The Muses lean close: for a few hours every music you make is easier (+2).", hard: 2 },
];
export const melody = (id: string) => MELODIES.find((m) => m.id === id)!;
/** Who in the village teaches what, and how well they must know you first. */
export const VILLAGE_SONGS: Record<string, { song: string; rel: number; line: string }> = {
  lykos: { song: "work", rel: 1, line: "\"A song? Ha. Only the one I hammer to. Listen: clang, and clang, and up it goes.\"" },
  theron: { song: "lullaby", rel: 2, line: "\"I sing this one to my grandson when the fever's on him. Softly, now.\"" },
  eudora: { song: "rowers", rel: 1, line: "\"The sailors sing it at my tables when they've had enough wine. Every one of them, every night. You'll have it in your head for days.\"" },
  myrrhine: { song: "paean", rel: 2, line: "\"The paean, Apollo's hymn. We sing it for healing, and to keep the restless dead away. Sing it truly.\"" },
};
/** Who in the wild huts teaches what. */
export const HUT_SONGS: Record<string, string> = { shepherd: "shepherd", goatherd: "shepherd", fisher: "rowers", hermit: "lament" };

/** Instruments you can make: reed pipes by hand, the lyre and the aulos at a workbench. (A wandering singer may sell a lyre; Eudora has an aulos.) */
RECIPES.push(
  { out: "Syrinx", qty: 1, needs: [["Fiber", 6], ["Wax", 1]], desc: "Reeds of graded lengths, bound and sealed with wax: Pan's pipes." },
  { out: "Lyre", qty: 1, needs: [["Wood", 3], ["Hide", 1], ["Antler", 1]], desc: "A sounding box, horns of antler, hide stretched taut and strings of gut, as Hermes made the first.", at: "workbench" },
  { out: "Aulos", qty: 1, needs: [["Wood", 2], ["Fiber", 2], ["Wax", 1]], desc: "Two bored pipes with reed mouthpieces, played together.", at: "workbench" },
);
