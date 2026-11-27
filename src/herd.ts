/**
 * Working animals of the household (Core Rules, Animals & Travel): a hunting hound, a plough ox,
 * a pack donkey and a riding horse. Unlike a creature tamed from the wild (graces.ts), these are bought,
 * fed from the manger, kept on the farm, and called along or sent home as you like.
 */
import type { Slot } from "./state";
import { ITEMS } from "./data";

export type BeastKind = "hound" | "ox" | "donkey" | "steed";

export interface Beast {
  id: string; kind: BeastKind; name: string; since: number;
  /** Walking with you (true), or kept at home on the farm. */
  follow: boolean;
  /** The last day it went to bed hungry (the manger empty); it works badly the next day. */
  hungry?: number;
  /** The ox's ploughing: how many furrows (tiles) it has drawn today. */
  work?: { day: number; n: number };
  /** The donkey's panniers. */
  pack?: (Slot | null)[];
  /** The day the hound was last given meat (Artemis smiles on hunters who keep their hounds well). */
  meatDay?: number;
  /** You're on its back (the horse). */
  riding?: boolean;
}

export interface BeastDef {
  name: string; price: number;
  /** Walking pace, px/s, when following; its sprite's frame rate. */
  walk: number; frameRate: number;
  /** What it does, for its menu. */
  does: string;
  /** Eats from the manger at night when kept at home. */
  grazes: boolean;
}

export const BEASTS: Record<BeastKind, BeastDef> = {
  hound: { name: "hound", price: 25, walk: 34, frameRate: 8, grazes: false,
    does: "noses out what game is about, runs down hares and birds, holds bigger game at bay for your bow or spear, and stands by you if anything comes at you. At home, it keeps the fox off" },
  ox: { name: "ox", price: 50, walk: 14, frameRate: 4, grazes: true,
    does: "draws the ard: yoked on the farm, it breaks a furrow wherever it walks, up to sixty in a day, for a fraction of the work of the hoe" },
  donkey: { name: "donkey", price: 30, walk: 20, frameRate: 6, grazes: true,
    does: "carries ten loads in its panniers, and takes what your pack has no room for" },
  steed: { name: "horse", price: 400, walk: 26, frameRate: 8, grazes: true,
    does: "carries you, nearly twice as fast as you walk. It is a riding horse, not a warhorse: a beast charging at it may make it rear" },
};

export const BEAST_NAMES: Record<BeastKind, string[]> = {
  hound: ["Argos", "Melampous", "Lailaps", "Ichnobates", "Oribasos", "Agre", "Aura", "Harpyia", "Tigris", "Lakon"],
  ox: ["Podargos", "Kallikeros", "Xanthos", "Leukos", "Boukolos", "Karpos", "Melas", "Glaukos"],
  donkey: ["Onos", "Kanthon", "Silenos", "Gaster", "Philoponos", "Mylon", "Bromios"],
  steed: ["Aithon", "Balios", "Podarge", "Lampos", "Phaethon", "Kyllaros", "Arion", "Xanthe"],
};

export const PANNIER_SIZE = 10;
/** How many furrows an ox draws in a day before it must rest. */
export const OX_DAY = 60;

export function newBeast(kind: BeastKind, day: number, taken: string[]): Beast {
  const names = BEAST_NAMES[kind].filter((n) => !taken.includes(n));
  const name = (names.length ? names : BEAST_NAMES[kind])[Math.floor(Math.random() * (names.length || BEAST_NAMES[kind].length))];
  const b: Beast = { id: `${kind}${day}${Math.floor(Math.random() * 1000)}`, kind, name, since: day, follow: kind === "hound" };
  if (kind === "donkey") b.pack = Array(PANNIER_SIZE).fill(null);
  return b;
}

/** The ard: a wooden scratch-plough, for an ox to draw. */
ITEMS.Ard = { id: "Ard", value: 12, name: "Ard (plough)", greek: "arotron", kind: "tool", desc: "A wooden scratch-plough with a bronze share. An ox draws it: talk to your ox on the farm and yoke it, then walk where you want furrows." };
export const HERD_ICON_IDS = ["Ard"];
