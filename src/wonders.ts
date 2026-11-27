/**
 * Thaumatapoiia, wonder-making (Thaumas, "Wondrous Creations"): binding power permanently into a made thing
 * at a forge. The four Elements of Creation: a base object (Earth), the workshop (Water: your own forge, Lykos'
 * master smithy +1 to every check, the god's forge on its island +5), the components (Air), and the work and
 * time (Fire). Cosmic costs are paid whether or not it takes. Each check passed is a success: 0 the working
 * fails, 1 it holds weakly, 2 as described, 3 (every check passed with a wide margin) enhanced. Moderate and
 * complex workings must then settle (stabilize) for a day or a week, a Pneuma check each night, or they distort.
 */
import { ITEMS, MELEE } from "./data";
import { WEAR } from "./gear";
import type { Currency } from "./gods";

export type WonderId = "keen" | "returning" | "flame" | "bane" | "ghost" | "warding" | "divine" | "living" | "masterwork";
export type WonderOn = "weapon" | "thrown" | "armor" | "tool";
export type Workshop = "home" | "lykos" | "god";
export interface WonderCtx { clock: number; daylight: number; isDay: boolean; season: string; moon: string; weather: string; festival: string; terrain: number; where: Workshop; crossroads: boolean; graveyard: boolean }

export interface Wonder {
  id: WonderId; name: string; greek: string; on: WonderOn;
  /** What it does when it holds as described (and weakly, and enhanced). */
  does: string; tiers: [string, string, string];
  comps: [string, number][]; silver: number;
  cost: Partial<Record<Currency, number>>;
  checks: { aretai: string; cr: number; what: string }[];
  /** A single session of so many hours, or so many days' sessions (four hours each, on separate days). */
  hours?: number; days?: number;
  /** Days it must settle afterwards (0: at once). */
  settle: number;
  /** Who teaches it: Lykos once he knows you (4) or well (8), or Hephaestus' own favor (4). */
  teach: "lykos" | "lykos8" | "hephaestus";
  bonus: (c: WonderCtx) => { label: string; n: number }[];
}

const noon = (c: WonderCtx) => c.isDay && Math.abs(c.clock - c.daylight / 2) <= 1;
const dawn = (c: WonderCtx) => c.isDay && c.clock < 1.5;
const midnight = (c: WonderCtx) => !c.isDay && c.clock >= c.daylight + 2;
const B = (on: boolean, label: string, n: number) => (on ? [{ label, n }] : []);

export const WONDERS: Record<WonderId, Wonder> = {
  keen: { id: "keen", name: "Keen Edge", greek: "akmē", on: "weapon", teach: "lykos",
    does: "it bites deeper: more damage with every blow", tiers: ["+½ damage", "+1 damage", "+1½ damage"],
    comps: [["Copper", 1], ["OliveOil", 1]], silver: 0, cost: {}, hours: 1, settle: 0,
    checks: [{ aretai: "Techne", cr: 11, what: "prepare blade and materials" }, { aretai: "Pneuma", cr: 13, what: "imbue cutting essence" }],
    bonus: (c) => [...B(noon(c), "Noon, the sun at its height", 2)] },
  returning: { id: "returning", name: "Returning Weapon", greek: "palintropos", on: "thrown", teach: "lykos",
    does: "thrown, it flies back to your hand", tiers: ["it comes back to your feet", "it flies back to your hand", "it flies back to your hand, and strikes harder (+1)"],
    comps: [["Loadstone", 1]], silver: 20, cost: { Hubris: 1 }, hours: 4, settle: 0,
    checks: [{ aretai: "Techne", cr: 13, what: "forge the lodestone's pull into it" }, { aretai: "Pneuma", cr: 12, what: "bind it to your blood" }],
    bonus: (c) => [...B(noon(c), "Noon", 1), ...B(c.weather === "storm", "A thunderstorm", 1), ...B(c.terrain === 9 || c.terrain === 12, "High on the mountains", 1)] },
  flame: { id: "flame", name: "Flame Weapon", greek: "pyrphoros", on: "weapon", teach: "hephaestus",
    does: "fire burns in the bronze without fuel: it burns what it strikes, lights the dark like a torch, and touches the dead as fire does. It must taste blood at least once a season, or the fire dies", tiers: ["+½ fire", "+1 fire", "+1½ fire"],
    comps: [["Copper", 2], ["Wood", 2]], silver: 10, cost: { Kleos: 3, Pathos: 2 }, hours: 6, settle: 1,
    checks: [{ aretai: "Techne", cr: 14, what: "forge-bind the flame" }, { aretai: "Pneuma", cr: 12, what: "stabilize the fire's essence" }, { aretai: "Phoenix", cr: 15, what: "make it endure" }],
    bonus: (c) => [...B(c.season === "Summer", "Summer", 2), ...B(noon(c), "Noon", 1)] },
  bane: { id: "bane", name: "Monster-Slayer", greek: "olethros", on: "weapon", teach: "lykos8",
    does: "deadly to one kind of creature, a little weaker against all others", tiers: ["double damage to its bane; −½ to others", "triple damage to its bane; −1 to others", "triple damage +1 to its bane; −1 to others"],
    comps: [], silver: 20, cost: { Kleos: 2, Pathos: 2, Hubris: 1 }, days: 3, settle: 1,
    checks: [{ aretai: "Gnosis", cr: 13, what: "understand the creature's nature" }, { aretai: "Techne", cr: 16, what: "forge its opposite into the blade" }, { aretai: "Pneuma", cr: 14, what: "seal the bane" }],
    bonus: (c) => [...B(c.moon === "New moon", "The new moon (binding)", 3), ...B(c.crossroads, "At a crossroads", 2)] },
  ghost: { id: "ghost", name: "Ghost Blade", greek: "psychopompos", on: "weapon", teach: "lykos8",
    does: "it cuts shades and the restless dead as if they were flesh, and harder than flesh", tiers: ["strikes the dead, +1 against them", "strikes the dead, +2 against them", "strikes the dead, +3 against them"],
    comps: [["Feather", 1]], silver: 20, cost: { Hubris: 2 }, days: 3, settle: 1,
    checks: [{ aretai: "Pneuma", cr: 16, what: "attune it to the world of shades" }, { aretai: "Techne", cr: 14, what: "forge the spirit-cutting edge" }, { aretai: "Ourania", cr: 15, what: "align it with the gods' justice" }],
    bonus: (c) => [...B(midnight(c), "Midnight", 2), ...B(c.moon === "New moon" || c.festival === "Noumenia", "Noumenia, when the dead walk", 2), ...B(c.graveyard, "Among graves or at a crossroads", 2)] },
  warding: { id: "warding", name: "Warding", greek: "phylakē", on: "armor", teach: "lykos",
    does: "it turns one kind of harm: beasts' teeth, claws and horns, or men's weapons and arrows", tiers: ["a quarter of that harm turned", "half of that harm turned", "half turned, and 1 more"],
    comps: [], silver: 20, cost: {}, hours: 2, settle: 0,
    checks: [{ aretai: "Techne", cr: 12, what: "prepare the armor" }, { aretai: "Pneuma", cr: 14, what: "weave the protection in" }],
    bonus: (c) => [...B(dawn(c), "Dawn (protection)", 2)] },
  divine: { id: "divine", name: "Divine Protection", greek: "theia skepē", on: "armor", teach: "lykos8",
    does: "signs worked into it turn uncanny harm: monsters, the dead, and the gods' own troubles (fevers, madness, storms, lightning)", tiers: ["a quarter of uncanny harm turned", "half of it turned", "half turned, and 1 more"],
    comps: [["Sage", 1], ["Thyme", 1]], silver: 30, cost: { Pathos: 2, Ambrosia: 1 }, days: 2, settle: 1,
    checks: [{ aretai: "Techne", cr: 14, what: "work the protective signs" }, { aretai: "Pneuma", cr: 16, what: "bind the resistance" }, { aretai: "Gnosis", cr: 13, what: "understand what it must turn" }],
    bonus: (c) => [...B(c.festival !== "", "A festival day", 3)] },
  living: { id: "living", name: "Living Armor", greek: "empsychos", on: "armor", teach: "hephaestus",
    does: "it half-wakes: warns you of danger by warming and cooling, and shifts to take a blow that would land", tiers: ["it warns of danger", "it warns of danger, and turns one blow a day", "it warns of danger, and turns two blows a day"],
    comps: [["Copper", 3], ["OliveOil", 1]], silver: 20, cost: { Kleos: 6, Hubris: 1 }, days: 7, settle: 7,
    checks: [{ aretai: "Techne", cr: 18, what: "make its adaptive joints" }, { aretai: "Pneuma", cr: 16, what: "give it a sort of mind" }, { aretai: "Phoenix", cr: 17, what: "let it renew itself" }],
    bonus: (c) => [...B(c.season === "Spring", "Spring (life)", 3), ...B(dawn(c), "Dawn", 1)] },
  masterwork: { id: "masterwork", name: "Masterwork Tool", greek: "aristourgēma", on: "tool", teach: "lykos",
    does: "the work seems to do itself: everything you do with it costs less Energy and Essence", tiers: ["a fifth less effort", "two fifths less effort", "half the effort"],
    comps: [["GoldDust", 1], ["Wine", 1]], silver: 20, cost: { Kleos: 1, Pathos: 2 }, hours: 3, settle: 0,
    checks: [{ aretai: "Techne", cr: 13, what: "perfect its balance and form" }, { aretai: "Pneuma", cr: 11, what: "imbue it with skill" }],
    bonus: () => [] },
};
export const WONDER_ORDER: WonderId[] = ["keen", "returning", "flame", "bane", "ghost", "warding", "divine", "living", "masterwork"];
export const WORKSHOP: Record<Workshop, { name: string; n: number }> = {
  home: { name: "your own forge", n: 0 }, lykos: { name: "Lykos' smithy (a master workshop)", n: 1 }, god: { name: "the god's forge (a divine forge)", n: 5 },
};
export const WARD_KINDS = { beast: "beasts", weapon: "weapons" } as const;

/** One working bound into one of your things. */
export interface Ench {
  id: WonderId; tier: 1 | 2 | 3;
  /** The bane's creature, or the kind of harm warded. */
  choice?: string;
  /** Settling until this day (the working works from then on). */
  settleUntil?: number;
  /** The flame's last taste of blood (day). */
  fed?: number;
  /** What went a little wrong as it settled. */
  quirk?: string;
  /** Living armor: the day and how many blows it has turned today. */
  usedDay?: number; used?: number;
}
export interface WonderWork { wid: WonderId; item: string; choice?: string; done: number; of: number; last: number }
export interface WonderData { known: WonderId[]; on: Record<string, Ench[]>; work?: WonderWork | null }

/** Which things a working can go into. */
export function fits(w: Wonder, id: string): boolean {
  const def = ITEMS[id]; if (!def) return false;
  if (w.on === "weapon") return MELEE[id] !== undefined;
  if (w.on === "thrown") return id === "spear" || id === "Javelin";
  if (w.on === "armor") return !!WEAR[id]?.cover?.length;
  return def.kind === "tool" && MELEE[id] === undefined && !["Torch", "Lamp", "Mortar", "Map", "Mirror", "Scale"].includes(id) || ["axe", "mattock", "sickle"].includes(id);
}

/** Successes from the checks: one each passed; and a masterpiece (every check passed, with 6 to spare in all) counts one more. */
export function successes(rolls: { total: number; cr: number }[]): number {
  const passed = rolls.filter((r) => r.total >= r.cr).length;
  const margin = rolls.reduce((n, r) => n + (r.total - r.cr), 0);
  return Math.min(3, passed + (passed === rolls.length && margin >= 6 && passed < 3 ? 1 : 0));
}

export const DISTORTIONS = [
  "It runs cold to the touch, even in the sun.",
  "It hums faintly at dusk, like bees.",
  "Your reflection in it is a little late.",
  "It smells of the sea, though it never touched salt water.",
  "Dogs will not come near it.",
];
