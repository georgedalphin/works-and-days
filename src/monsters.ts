/**
 * Wandering monsters: rare meetings far out in the wilderness, drawn from AEGIS Terata.
 * Each is tied to a terrain and a time of day. They come only to screens at least
 * WANDER_MIN_DEPTH screens from home, and only on a high d12 when you arrive.
 */
import type { Species } from "./animals";

export type MonsterKind = "centaur" | "skeleton" | "empousa" | "siren" | "sphinx" | "lion" | "stymphalian" | "strix";

export interface MonsterDef {
  kind: MonsterKind;
  terrains: number[]; // the lands it wanders (TERRAINS n)
  when: "any" | "night" | "dusk" | "day"; // dusk = from the last daylight hour on
  count?: number; // flocks come several at once
  patron: string; // Terata divine domain, mapped into the game's gods
  first: string; // Terata "First Encounter": said the first time you meet one
  again: string; // said on later meetings
  calm: string; // the E prompt while it is coming at you ("" = it cannot be talked down)
}

/** How far from home (in screens, the larger of |x| and |y|) before monsters wander. */
export const WANDER_MIN_DEPTH = 3;

/**
 * The d12 a wandering monster needs on arrival: 12 at depth 3-4, 11+ at 5-6, 10+ beyond.
 * Roughly one deep screen in twelve, a little more the further out you go.
 */
export function wanderTarget(depth: number) {
  return 12 - Math.min(2, Math.floor(Math.max(0, depth - WANDER_MIN_DEPTH) / 2));
}

export const MONSTERS: Record<MonsterKind, MonsterDef> = {
  centaur: {
    kind: "centaur", terrains: [2, 10], when: "any", patron: "Poseidon",
    first: "It comes down the slope at a canter, a man's torso rising from a horse's body. It looks you over with sharp, half-amused eyes, deciding whether this is a conversation or a fight.",
    again: "Hoofbeats among the trees: a centaur, looking you over.",
    calm: "Calm the centaur",
  },
  skeleton: {
    kind: "skeleton", terrains: [4], when: "night", patron: "Hades",
    first: "The bones among the stones are standing now, sorting themselves with dry clicks into the shape of a man, and the empty sockets turn toward you with a purpose.",
    again: "Dry clicks in the dark: the bones are standing again.",
    calm: "",
  },
  empousa: {
    kind: "empousa", terrains: [1], when: "dusk", patron: "Hecate",
    first: "A beautiful stranger meets you in the meadow at dusk, all warmth and invitation.",
    again: "Someone lovely is walking toward you through the flowers in the failing light.",
    calm: "Mock her",
  },
  siren: {
    kind: "siren", terrains: [7], when: "day", patron: "Apollo",
    first: "A song comes over the rocks, so sweet it hurts: a voice that knows your name, and everything you ever wanted to hear.",
    again: "That song again, over the rocks.",
    calm: "",
  },
  sphinx: {
    kind: "sphinx", terrains: [8, 12], when: "any", patron: "Hera",
    first: "On the high rock above the way sits a lion with eagle's wings and a woman's face, and she has been waiting for you.",
    again: "The winged one on the rock, waiting.",
    calm: "",
  },
  lion: {
    kind: "lion", terrains: [11, 12], when: "any", patron: "Zeus",
    first: "A deep cough from the rocks, and then the lion: tawny, maned, unhurried, the king of this country.",
    again: "A lion, watching you from the rocks.",
    calm: "",
  },
  stymphalian: {
    kind: "stymphalian", terrains: [5], when: "any", patron: "Hephaestus", count: 3,
    first: "A clatter like hail on bronze: birds rise from the reeds, and their feathers are metal.",
    again: "The bronze birds, rising from the reeds.",
    calm: "",
  },
  strix: {
    kind: "strix", terrains: [3], when: "night", patron: "Hecate",
    first: "A shriek out of the dark overhead, and something with wide wings and a hungry face drops toward you.",
    again: "The night-bird's shriek, overhead.",
    calm: "",
  },
};

export const monsterFor = (terrain: number) => { const ms = Object.values(MONSTERS).filter((m) => m.terrains.includes(terrain)); return ms.length ? ms[Math.floor(Math.random() * ms.length)] : undefined; };
/** The Sphinx's riddles, with the true answer first. */
export const RIDDLES: { q: string; answers: string[] }[] = [
  { q: "What walks on four feet in the morning, on two at noon, and on three in the evening?", answers: ["A man: he crawls as a babe, walks grown, and leans on a staff when old", "A horse", "The sun", "A tortoise"] },
  { q: "There are two sisters. One gives birth to the other, and she in turn gives birth to the first. Who are they?", answers: ["Day and night", "Earth and sea", "The moon and the stars", "Summer and winter"] },
];
export const isMonster = (k: Species | string): k is MonsterKind => k in MONSTERS;
/** Libations the dead accept at a burial rite. */
export const GRAVE_OFFERINGS = ["Wine", "Milk", "Honey"];
