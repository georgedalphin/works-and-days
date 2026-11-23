/**
 * Wandering monsters: rare meetings far out in the wilderness, drawn from AEGIS Terata.
 * Each is tied to a terrain and a time of day. They come only to screens at least
 * WANDER_MIN_DEPTH screens from home, and only on a high d12 when you arrive.
 */
import type { Species } from "./animals";

export type MonsterKind = "centaur" | "skeleton" | "empousa";

export interface MonsterDef {
  kind: MonsterKind;
  terrain: number; // the terrain it wanders (TERRAINS n)
  when: "any" | "night" | "dusk"; // dusk = from the last daylight hour on
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
    kind: "centaur", terrain: 2, when: "any", patron: "Poseidon",
    first: "It comes down the slope at a canter, a man's torso rising from a horse's body. It looks you over with sharp, half-amused eyes, deciding whether this is a conversation or a fight.",
    again: "Hoofbeats among the trees: a centaur, looking you over.",
    calm: "Calm the centaur",
  },
  skeleton: {
    kind: "skeleton", terrain: 4, when: "night", patron: "Hades",
    first: "The bones among the stones are standing now, sorting themselves with dry clicks into the shape of a man, and the empty sockets turn toward you with a purpose.",
    again: "Dry clicks in the dark: the bones are standing again.",
    calm: "",
  },
  empousa: {
    kind: "empousa", terrain: 1, when: "dusk", patron: "Hecate",
    first: "A beautiful stranger meets you in the meadow at dusk, all warmth and invitation.",
    again: "Someone lovely is walking toward you through the flowers in the failing light.",
    calm: "Mock her",
  },
};

export const monsterFor = (terrain: number) => Object.values(MONSTERS).find((m) => m.terrain === terrain);
export const isMonster = (k: Species | string): k is MonsterKind => k in MONSTERS;
/** Libations the dead accept at a burial rite. */
export const GRAVE_OFFERINGS = ["Wine", "Milk", "Honey"];
