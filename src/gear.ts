/**
 * What you wear: clothing, armor, shields and footwear, from the Core Rules' tables (Belongings: Armor & Shields,
 * Clothing). Seven places to wear things. Armor works as the rules have it: each blow lands somewhere (a d12 on the
 * Cosmic Wheel of the body: 1 left shoulder ... 12 head), and only what covers that place turns it. Heavy bronze
 * costs Aiolos (you move and sprint worse) and Stealth; a Corinthian helmet narrows your sight (Ourania -1).
 */
export type WearSlot = "head" | "body" | "armor" | "cloak" | "shield" | "legs" | "feet";
export const WEAR_SLOTS: WearSlot[] = ["head", "body", "armor", "cloak", "shield", "legs", "feet"];
export const SLOT_NAME: Record<WearSlot, string> = { head: "Head", body: "Body", armor: "Armor", cloak: "Cloak", shield: "Shield", legs: "Legs", feet: "Feet" };

/** The Hit Location roll (Core Rules): the body around the wheel. */
export const LOC_NAME = ["", "left shoulder", "left arm", "chest", "hip", "left leg", "groin", "right leg", "gut", "chest", "right arm", "right shoulder", "head"];
const AREA: Record<string, number[]> = {
  head: [12], torso: [3, 8, 9], hips: [4, 6], shoulders: [1, 11], legs: [5, 7], arms: [2, 10],
  shieldSide: [1, 2], all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export interface WearDef {
  slot: WearSlot;
  /** Armor by area: how much of a blow landing there it turns. */
  cover?: [string, number][];
  /** Aretai and Stealth while worn (the rules' "-1 Aiolos", "-2 Stealth", "+1 Intimidation", "-1 Ourania"). */
  aiolos?: number; stealth?: number; intim?: number; ourania?: number;
  /** +Stealth in wild places (the traveler's cloak). */
  wildStealth?: number;
  /** Keeps off rain and cold (1 some, 2 fully); shades you from the sun. */
  weather?: number; sun?: boolean;
  /** A cloak that doubles as a blanket: sleeping rough rests you better. */
  blanket?: boolean;
  /** Footwear: 1 sandals (thorns and rough ground trouble you less), 2 boots (still less, and you travel a little faster). */
  feet?: number;
  /** A working garment: field and craft labor tires you less. */
  work?: boolean;
  /** Dressed for the gods: offerings count for more (all gods, or only these). */
  rite?: string[] | true;
  /** How it looks on you (textures.ts draws it). */
  look: { kind: string; col?: string; col2?: string };
  /** One line on what it does, for the item's description and the Belongings panel. */
  does: string;
}

export const WEAR: Record<string, WearDef> = {
  // Head
  Petasos: { slot: "head", weather: 1, sun: true, look: { kind: "petasos", col: "#c8a050" }, does: "Shades you from the sun and keeps off some rain. Sacred to Hermes." },
  Kynee: { slot: "head", cover: [["head", 1]], look: { kind: "cap", col: "#8a6440" }, does: "Head armor 1." },
  TuskHelm: { slot: "head", cover: [["head", 2]], look: { kind: "tusk", col: "#e8dcc4", col2: "#8a6440" }, does: "Head armor 2: rows of boar's-tusk plates on a leather cap." },
  Corinthian: { slot: "head", cover: [["head", 3]], intim: 1, ourania: -1, look: { kind: "corinth", col: "#c8a050", col2: "#b0412f" }, does: "Head armor 3; +1 Intimidation; Ourania -1 (it narrows your sight)." },
  // Body
  Chiton: { slot: "body", look: { kind: "chiton" }, does: "The plain linen tunic everyone wears." },
  Exomis: { slot: "body", work: true, look: { kind: "exomis", col: "#b8a47a" }, does: "A short working tunic, one shoulder bare: field and craft work tire you less." },
  Peplos: { slot: "body", rite: ["Athena", "Hera", "Hestia"], look: { kind: "peplos", col: "#5a6aa0" }, does: "A draped woolen dress, sacred to Athena: offerings to Athena, Hera and Hestia count for more." },
  Robes: { slot: "body", rite: true, look: { kind: "robes", col: "#f0ead8", col2: "#d39a3a" }, does: "White ritual robes with a saffron border: every offering counts for more." },
  // Armor
  LeatherShirt: { slot: "armor", cover: [["torso", 1]], look: { kind: "armor", col: "#8a6440", col2: "#6b4a2b" }, does: "Torso armor 1." },
  Linothorax: { slot: "armor", cover: [["torso", 2], ["shoulders", 1]], look: { kind: "armor", col: "#e8dcc0", col2: "#b0412f" }, does: "Torso armor 2, shoulders 1; no burden. The common soldier's armor." },
  ScaleCuirass: { slot: "armor", cover: [["torso", 3], ["shoulders", 1]], stealth: -1, look: { kind: "scale", col: "#b8903a", col2: "#8a6a2a" }, does: "Torso armor 3, shoulders 1; Stealth -1." },
  Cuirass: { slot: "armor", cover: [["torso", 4], ["shoulders", 2], ["hips", 1]], aiolos: -1, stealth: -2, intim: 1, look: { kind: "bronze", col: "#d0a848", col2: "#a8803a" }, does: "Torso armor 4, shoulders 2, hips 1; +1 Intimidation; Aiolos -1, Stealth -2." },
  // Cloak
  Cloak: { slot: "cloak", cover: [["shoulders", 1]], weather: 2, wildStealth: 1, blanket: true, look: { kind: "cloak", col: "#8f4a36" }, does: "Keeps off rain and cold; shoulders 1; +1 Stealth in the wild; a blanket when you sleep out." },
  Himation: { slot: "cloak", weather: 2, blanket: true, look: { kind: "himation", col: "#c8bc9e" }, does: "A great mantle: keeps off rain and cold, and doubles as a blanket." },
  LionPelt: { slot: "cloak", cover: [["all", 1]], weather: 2, intim: 2, look: { kind: "lion", col: "#c8964a", col2: "#7a4a22" }, does: "Worn as Heracles wore it: armor 1 everywhere, +2 Intimidation, and warm." },
  // Shield
  Pelte: { slot: "shield", cover: [["shieldSide", 1], ["torso", 1]], look: { kind: "pelte", col: "#8a6440", col2: "#c8a050" }, does: "A light crescent shield: +1 on your shield side and chest. No burden." },
  Aspis: { slot: "shield", cover: [["shieldSide", 2], ["torso", 2], ["hips", 1]], aiolos: -1, stealth: -1, look: { kind: "aspis", col: "#c8a050", col2: "#b0412f" }, does: "The great round hoplite shield: +2 on your shield side and torso, hips +1; Aiolos -1, Stealth -1." },
  // Legs
  Greaves: { slot: "legs", cover: [["legs", 2]], aiolos: -1, look: { kind: "greaves", col: "#c8a050" }, does: "Bronze greaves: leg armor 2; Aiolos -1." },
  // Feet
  Sandals: { slot: "feet", feet: 1, look: { kind: "sandals", col: "#8a6440" }, does: "Thorns and rough ground trouble you less." },
  Boots: { slot: "feet", feet: 2, look: { kind: "boots", col: "#6b4a2b" }, does: "High travelers' boots: thorns, mud and sand trouble you little, and you travel a little faster." },
};
export const isWearable = (id: string) => !!WEAR[id];

export type Worn = Partial<Record<WearSlot, string | null>>;
/** How much armor covers a hit location. */
export function armorAt(worn: Worn, loc: number): number {
  let n = 0;
  for (const s of WEAR_SLOTS) { const d = WEAR[worn[s] ?? ""]; if (!d?.cover) continue; for (const [a, v] of d.cover) if (AREA[a].includes(loc)) n += v; }
  return n;
}
/** What turned a blow there: the pieces that cover it. */
export function coverers(worn: Worn, loc: number): string[] {
  return WEAR_SLOTS.map((s) => worn[s]).filter((id): id is string => !!id && !!WEAR[id]?.cover?.some(([a]) => AREA[a].includes(loc)));
}
/** Everything you wear, added up. */
export function gearMods(worn: Worn) {
  const m = { aiolos: 0, stealth: 0, wildStealth: 0, intim: 0, ourania: 0, weather: 0, sun: false, blanket: false, feet: 0, work: false, rite: [] as string[], riteAll: false };
  for (const s of WEAR_SLOTS) {
    const d = WEAR[worn[s] ?? ""]; if (!d) continue;
    m.aiolos += d.aiolos ?? 0; m.stealth += d.stealth ?? 0; m.wildStealth += d.wildStealth ?? 0; m.intim += d.intim ?? 0; m.ourania += d.ourania ?? 0;
    m.weather = Math.max(m.weather, d.weather ?? 0); m.sun ||= !!d.sun; m.blanket ||= !!d.blanket; m.feet = Math.max(m.feet, d.feet ?? 0); m.work ||= !!d.work;
    if (d.rite === true) m.riteAll = true; else if (d.rite) m.rite.push(...d.rite);
  }
  return m;
}
/** A short summary of your protection, by area, for the Belongings panel. */
export function armorSummary(worn: Worn): string {
  const parts: [string, number][] = [["head", armorAt(worn, 12)], ["torso", armorAt(worn, 3)], ["shoulders", Math.min(armorAt(worn, 1), armorAt(worn, 11))], ["arms", Math.min(armorAt(worn, 2), armorAt(worn, 10))], ["hips", armorAt(worn, 4)], ["legs", armorAt(worn, 5)]];
  const any = parts.filter(([, v]) => v > 0);
  return any.length ? any.map(([k, v]) => `${k} ${v}`).join(" · ") : "none";
}
