import Phaser from "phaser";
import { GameState, rng, CHEST_SIZE, type Placed, type Slot, type SaveData } from "./state";
import { makeTextures, makePlayerTexture, makePortrait, paintCreationBg, makeFigureTexture, T, TILE, POSES, POSE } from "./textures";
import { fortressAt, isleAt, fortressLayout, isleLand, partOf, CITADELS, ISLES, uniqueAt, pickUniqueSpot, delphiLayout, knossosLayout, knossosLayoutGrand, creteAt, pickKnossosScreen, type SiteInfo, type FortLayout, type UniqueLayout } from "./sites";
import { fillShore, coastMask, allSea, someSea, unpack, type Shore, type Intent } from "./coast";
import type { SiteRec } from "./sites";
import { WAYFARERS, rollWayfarers, makeParty, findPath, Wayfarer, FigureFoe, WOLF_CRY, NEAR_WORDS, WAY_SEEN, WAY_COMING, pick, theTitle, type WayDef } from "./wayfarers";
import { Ambience, varyLayers, scatterDetails, seasonGroundTint, jitterLayer, jitterOf, softenPatches } from "./ambience";
import { SOUND } from "./audio";
import { villageHouseholds, HOUSE_SPOTS, Walker, pickGossip, HUT_KINDS, makeFolk, type Household, type Folk } from "./folk";
import { WEATHER_WORD, DAYLIGHT_REAL_SECONDS, MONTHS, rollWeather, STATION_NAME, ELEMENT_OF, EFFORT, ESSENCE, skillCost, SLEEP_RECOVERY_PER_HOUR, type Station } from "./data";
import { MOROS_DREAMS, SIGNS as SIGN_TABLE } from "./omens";
import { LANDMARKS, seasonKey, type LandmarkDef } from "./landmarks";
import { DIVINE, ALL_GODS, tierOf, TIER_WORDS, wrathChance, powerRecharge } from "./divine";
import { TIRESIAS, TIR_CALLS, TIR_WEATHER } from "./tiresias";
import { fishHere, fishDef, type FishDef } from "./fishing";
import { villageFestivals, daysUntil, festival, type FestivalDef } from "./festivals";
import { HARMONIAI, INSTRUMENTS, MELODIES, melody, stepFreq, VILLAGE_SONGS, HUT_SONGS, type Melody } from "./music";
import { INGREDIENTS, PLAIN, NAMED, PLAIN_EFFECT, NAMED_EFFECT, cookResult, dishId, DISH_GOD } from "./cooking";
import { WANTS, RUMOR_TERRAINS, RUMOR_WORDS, PARCELS, directions, requestPay, type Rumor, type Request } from "./quests";
import { SIGNS as HESIOD_SIGNS, SIGN_DAYS, EFFECT_WORD, OMENS, OMEN_MEANING, KLEDON, FIND_TABLES, FIND_CHANCE, pickFrom, type SignDef, type OmenDef } from "./omens";
import { STEPS, STEP_HELP, SIGNS, BIRTHRIGHTS, TRAININGS, HAMARTIAI, ASTHENEIAI, MOROI, YOUNG_ADULT, ARETAI_MAX_AT_CREATION, FAVOR_PLUS, FAVOR_MINUS, RESOURCE_POINTS, RESOURCE_MAX, SILVER_PER_WEALTH, NAMES, TUNICS, HAIRS, SKINS, type TableEntry } from "./creation";
import { WHEEL, ITEMS, JAR_CAPACITY, INVENTORY_SIZE, STACK_MAX, MANGER_MAX, TROUGH_MAX, HIVE_DAYS, type Goat, terrain, rollTerrain, HOME_TERRAIN,
  CROPS, seedId, QUALITY, QUALITY_MULT, money, CAVE_KINDS, CAVE_LEVELS, type CaveType, VAT_REPAIR, GRAPES_PER_MUST, FERMENT_DAYS, VINE_BEARS_AFTER, YOUNG_VINE_YIELD, BOW_RANGE, ARROW_SPEED, QUARRY, ARCHERY, RECIPES, PEACE_FOOD, MELEE, MELEE_REACH, WEAPONS, SPEAR_THROW, SWORD_ORDER, START_LIFE_THREAD, SLICE_TERRAINS } from "./data";
import type { CropRec } from "./state";
import { LORE, TIERS, TIER_MOD, RARITY_MOD, HERA_HOUR_BONUS, MAX_PERSEVERANCE, loreLines } from "./lore";
import { Animal, SPECIES, type Species } from "./animals";
import { FORAGE, bearing, type ForageDef } from "./forage";
import { TWELVE, CHTHONIC, favorLabel, BOONS, OFFER_PATRON, HOME_CAP, SHRINE_CAP, DEVOTION_STEP, CURRENCIES, CURRENCY_DESC, raiseCost, ARTS, type Art } from "./gods";
import { essencePools } from "./data";
import { MONSTERS, isMonster, monsterFor, wanderTarget, WANDER_MIN_DEPTH, GRAVE_OFFERINGS, RIDDLES, type MonsterKind } from "./monsters";
import { MYTH, RUNGS, RUNG_DAYS, NAIAD_NAMES, SATYR_NAMES, SPRING_SITES } from "./mythborn";
import { VILLAGERS, REL_MIN, REL_MAX, relTier, relLabel, UPGRADES, toolName, STRANGER_KINDS, STRANGER_DAYS, GOD_CHANCE, GUEST_FOOD, type Villager } from "./village";
import type { ScreenRec } from "./state";

const W = 960, H = 640, ZOOM = 3;
Object.assign(OFFER_PATRON, DISH_GOD); // a god's own dish is a fitting offering to that god
let G: GameState;
/** Underground without a torch: every action is at -3 (World & Wilderness). */
let inDark = false;
/** The dark hinders you (−3 to every action), less with Hecate's favor; not at all in her light or under her protection. */
const darkPen = () => (!inDark || G.warded("Hecate") || G.data.divine.day.hecateLight === G.dayNumber ? 0 : Math.max(0, Math.min(6, 3 - G.boon("Hecate"))));

/** Things that fill a tile: arrows and dropped things are lost in them. */
const BLOCKING = [T.BRUSH, T.SAPLING, T.STONE, T.TREE, T.BOULDER, T.EDGE, T.OLIVE, T.FENCE, T.WATER, T.SHALLOW, T.CAVEWALL, T.ORE, T.PINE, T.REEDS, T.THORN, T.CYCLO, T.COLUMN, T.WALL];
/** Water: 1 for shallows (wade), 2 for deep (swim), 0 for none. */
const waterKind = (t: number | undefined) => (t === T.SHALLOW ? 1 : t === T.WATER ? 2 : 0);
/** Bushes slow you as you push through; they do not stop you. */
const BUSHES: Record<number, number> = { [T.BRUSH]: 0.55, [T.REEDS]: 0.6, [T.THORN]: 0.45 };
/** Trees block only at the trunk: a round trunk lets you slip between two trees that stand corner to corner. */
const TRUNKS: Record<number, number> = { [T.TREE]: 5.75, [T.OLIVE]: 5.75, [T.PINE]: 5.75, [T.SAPLING]: 4 };
/** What blocks a whole tile: stone, water, walls, fences. */
const SOLID = BLOCKING.filter((t) => !(t in BUSHES) && !(t in TRUNKS) && t !== T.WATER && t !== T.SHALLOW); // water is waded, swum or rowed
const TREE_HITS = 3;

type Dir = 0 | 1 | 2 | 3; // down, left, right, up
const DV: Record<Dir, [number, number]> = { 0: [0, 1], 1: [-1, 0], 2: [1, 0], 3: [0, -1] };
const FONT = "Georgia, serif";

/** Something the player can use with E: a door, the bed, a sign. */
interface Target { x: number; y: number; label: string; act: () => void }

// ------------------------------------------------------------------ helpers
function ui(scene: Phaser.Scene) { return scene.scene.get("UI") as unknown as UIScene; }

const SPENT: Record<string, string> = {
  Fire: "Your arms are heavy and your breath short: give your Fire a moment to rekindle.",
  Earth: "Your hands need a moment: your Earth is spent.",
  Water: "Your thoughts are muddied: let your Water settle a moment.",
  Air: "You need to catch your breath: your Air is spent.",
};
let lastSpentSay = 0;
/** What a piece of work would cost you now, in the element of the Aretai it tests. */
function laborCost(effort: number, aretai: string): [keyof typeof G.essence, number] {
  return [ELEMENT_OF[aretai] ?? "Earth", skillCost(effort, G.data.aretai[aretai] ?? 3) * G.hourDiscount(aretai)];
}
/**
 * Pay for a piece of work: Essence from the element of the Aretai it tests, cheaper the more skilled you are
 * and in the matching hour, plus Fatigue. When the element runs dry you must wait for it to refill.
 */
function labor(effort: number, fatigue: number, aretai: string): string | null {
  if (G.exhausted) { G.say("You are too exhausted to work. Rest."); return null; }
  const disc = G.hourDiscount(aretai);
  let [el, cost] = laborCost(effort, aretai);
  if (aretai === "Thymos" && G.data.divine.day.fury === G.dayNumber) cost /= 2; // Ares' battle-fury
  if (!G.spend({ [el]: cost })) {
    G.spentFlash = { el, at: performance.now() };
    if (performance.now() - lastSpentSay > 1500) { G.say(SPENT[el]); lastSpentSay = performance.now(); }
    return null;
  }
  const zeus = aretai === "Kratos" ? (G.warded("Zeus") ? 0 : 1 - 0.08 * G.boon("Zeus")) : 1; // Zeus eases heavy labor
  G.addFatigue(fatigue * disc * zeus);
  return disc < 1 ? ` (${G.patron!.god}'s hour: the work comes easier)` : "";
}

// ------------------------------------------------------------------ music
/** Singing: whether V is held, the harmonia, the notes just sung, and a song heard in the world waiting to be sung back. */
const SING = { on: false, mode: 0, buf: [] as { n: number; t: number; mode: number }[], pending: null as null | { id: string; until: number }, hintAt: -1e9, lit: {} as Record<number, number>, heard: {} as Record<string, number> };
/** What you are making music with: the instrument in your hand, or your voice. */
/** A melody's name in a sentence: "the Paean", "the nightingale's song", "Tiresias' bird-call". */
const songName = (m: { name: string }) => m.name.startsWith("The ") ? `the ${m.name.slice(4)}` : m.name.startsWith("Tiresias") ? m.name : `the ${m.name}`;
const curInstrument = () => INSTRUMENTS[G.selectedItem?.id ?? ""] ?? INSTRUMENTS.voice;

/** A campfire burns two hours for each fiber fed to it. */
const CAMP_HOURS_PER_FIBER = 2;
const campLit = (p: Placed) => (p.fuel ?? 0) > G.absHour;

/** How much a blow is softened: a woolen cloak, if you carry one. (Health gives you more Vitality instead.) */
const armor = () => (G.count("Cloak") > 0 ? 1 : 0);
/** A creature's blow in Vitality: its old Fatigue figure scaled to Terata hits (a fox 2, a wolf 4, a boar 6, a lion 8). */
const blowOf = (fatigueDmg: number) => Math.max(1, Math.round(fatigueDmg / 2.5));
/** Extra yield for things you understand fully. */
const mastery = (id: string, n = 1) => (G.lore(id) >= 3 ? n : 0);
const OBJ_SUBJECT: Record<number, string> = {
  [T.TREE]: "oak", [T.SAPLING]: "oak", [T.BRUSH]: "bramble", [T.STONE]: "stone", [T.BOULDER]: "stone", [T.FLOWERS]: "poppy", [T.OLIVE]: "olive",
  [T.PINE]: "pine", [T.REEDS]: "reed", [T.THORN]: "thornscrub",
};
const loreName = (id: string) => (G.lore(id) >= 1 ? LORE[id].name : LORE[id].vague);
/** A creature as you would name it: "wild boar" once you know it, "dark, bristling beast" before. */
/** Monsters, and men, turn on you when hurt; beasts usually run. */
const fightsBack = (k: string) => isMonster(k) || k === "brigand" || k === "minotaur";
const beast = (id: string) => (LORE[id] ? (G.lore(id) >= 1 ? LORE[id].name.toLowerCase() : LORE[id].vague.replace(/^(an?|your) /, "")) : id);

/**
 * Investigate a kind of thing: a Gnosis check (d12 ≤ Gnosis + modifiers) that may raise
 * your understanding of it one tier. Once per kind per day; costs a little Water Essence.
 */
function study(id: string): boolean {
  const d = LORE[id];
  if (!d) return false;
  const tier = G.lore(id);
  if (tier >= 3) { G.say(`You know all there is to know about the ${d.name.toLowerCase()}.`); return false; }
  if (G.data.lore.studied[id] === G.dayNumber) { G.say(`You've studied ${loreName(id)} all you can today. Come back tomorrow with fresh eyes.`); return false; }
  const gnosis = G.data.aretai.Gnosis ?? 3;
  const hera = G.patron?.aretai === "Gnosis" ? HERA_HOUR_BONUS : 0;
  const fails = Math.min(MAX_PERSEVERANCE, G.data.lore.fails[id] ?? 0);
  const target = gnosis + TIER_MOD[tier + 1] + RARITY_MOD[d.rarity] + hera + fails + G.boon("Hera") - darkPen();
  if (target <= 0) { G.say(`${d.name}: understanding this deeply is beyond your Gnosis for now.`); return false; }
  const b = labor(EFFORT.study, 1, "Gnosis"); if (b === null) return false;
  G.data.lore.studied[id] = G.dayNumber; G.note("study");
  const ch = G.data.divine.charges;
  if (ch.dull) { ch.dull = 0; G.say(`You study ${loreName(id)}, but your thoughts slide away like water. Athena withholds her light today.`); return false; }
  let roll = 1 + Math.floor(Math.random() * 12);
  if (ch.Athena) { ch.Athena--; roll = 1; G.say(`Athena's owl-eyed clarity: you see it whole.${ch.Athena ? ` (${ch.Athena} more)` : ""}`); }
  const odds = `d12 ${roll}, needed 1–${Math.min(12, target)}${hera ? ", Hera's hour +2" : ""}${fails ? `, perseverance +${fails}` : ""}`;
  if (roll <= target) {
    G.data.lore.tier[id] = tier + 1; G.data.lore.fails[id] = 0;
    G.say(`You understand ${d.name.toLowerCase()} better: ${TIERS[tier + 1]} (${odds}).`);
    return true;
  }
  G.data.lore.tier[id] = tier; G.data.lore.fails[id] = (G.data.lore.fails[id] ?? 0) + 1;
  G.say(`You study ${loreName(id)} closely, but nothing new comes clear (${odds}). Try again tomorrow.`);
  return false;
}

/** How far along the path of befriending a Mythborn neighbor is (0 Wary .. 4 Ally). */
const rungOf = (days: number) => RUNG_DAYS.reduce((r, need, i) => (days >= need ? i : r), 0);
const mythRec = (id: string) => (G.data.myth[id] ??= { days: 0, last: -1, gone: -1, name: id === "naiad" ? NAIAD_NAMES[G.data.seed % NAIAD_NAMES.length] : SATYR_NAMES[G.data.seed % SATYR_NAMES.length], gift: -1 });

/**
 * Creatures that answer to an Aretai: at 6 and above it lowers their Aggression (6: -2, 7: -3, 8: -4).
 * The dead know Pneuma; Artemis' beasts know Kardia; the farm's raiders know Oikos; Ares' wolf and the lion know Thymos.
 */
export const CALMED_BY: Record<string, string[]> = {
  eidolon: ["Pneuma"], lampad: ["Pneuma"], deer: ["Kardia"], ibex: ["Kardia"], bear: ["Kardia"], fox: ["Oikos"], boar: ["Oikos", "Kratos"],
  jackal: ["Aiolos"], crab: ["Metis"], wolf: ["Thymos"], lion: ["Thymos"], sphinx: ["Logos"], myrmex: ["Gnosis"], scorpion: ["Ourania"], strix: ["Ourania"],
  stymphalian: ["Techne"], centaur: ["Phoenix"], empousa: ["Phoenix"],
};
const aretaiCalm = (kind: string): [number, string] => {
  let best = 0, by = "";
  for (const ar of CALMED_BY[kind] ?? []) { const v = (G.data.aretai[ar] ?? 3) - 4; if (v >= 2 && v > best) { best = v; by = ar; } }
  return [best, by];
};
/** The festivals your village keeps: the great ones of the year, and those of the gods its households honor. */
let festCache: { seed: number; list: FestivalDef[] } | null = null;
function villageFests(): FestivalDef[] {
  if (festCache?.seed !== G.data.seed) {
    const patrons = [...Object.values(VILLAGERS).map((v) => v.patron), ...villageHouseholds(G.data.seed).map((h) => h.trade.patron)];
    festCache = { seed: G.data.seed, list: villageFestivals(patrons) };
  }
  return festCache.list;
}
/** The festival today, if the village keeps one. */
const festToday = () => villageFests().find((f) => f.month === G.data.month && f.day === G.data.day) ?? null;
const festKey = (f: FestivalDef) => `${G.data.year}:${f.id}`;
const festRec = (f: FestivalDef) => (G.data.fest[festKey(f)] ??= {});
/** The next festivals, soonest first, with the days until each. */
const festUpcoming = (n: number) => villageFests().map((f) => ({ f, d: daysUntil(G.data.month, G.data.day, f.month, f.day) })).sort((a, b) => a.d - b.d).slice(0, n);

/** Noumenia: the first day of the month. That night the dead gather at the crossroads, and wander near the living. */
const noumeniaNight = () => G.data.day === 1 && !G.isDay;

/** Poseidon's favor deepens your water jar. */
const jarCap = () => Math.max(10, JAR_CAPACITY + 5 * G.boon("Poseidon"));

/** Maybe turn up a rare find from one of the find tables. Finds come excellent, so the gods value them as offerings. */
function rollFind(table: keyof typeof FIND_TABLES, chance: number): boolean {
  if (Math.random() >= chance) return false;
  const id = pickFrom(FIND_TABLES[table]), lid = id.toLowerCase();
  const first = (G.data.lore.tier[lid] ?? 0) < 1;
  if (first) G.data.lore.tier[lid] = 1;
  SOUND.sfx("find");
  G.say(`A find! ${ITEMS[id].desc} ${give(id, 1, 3)}${first ? " (New in your lore book.)" : ""}`);
  return true;
}

/** What a dish does when eaten, by its quality (1–3). */
function mealEffect(id: string, q: number): { ar?: string; god?: string; n: number; hours: number } {
  const named = NAMED.find((n) => dishId(n) === id);
  if (named) { const e = NAMED_EFFECT[q]!; return { god: named.god, n: e.n, hours: e.hours }; }
  const e = PLAIN_EFFECT[q]!; return { ar: id.slice(5), n: e.n, hours: e.hours };
}
/** An item's name in a sentence: lower case, except names of gods and heroes. */
const lowerName = (id: string) => /^(Hecate|Prometheus|Kykeon|Kakavia|Melikraton)/.test(ITEMS[id].name) ? ITEMS[id].name : ITEMS[id].name.toLowerCase();
const effectText = (e: { ar?: string; god?: string; n: number; hours: number }) => e.god ? `${e.god}'s favor counts as ${e.n} higher for ${e.hours} hours` : `${e.ar} +${e.n} for ${e.hours} hours`;
/** Eat the dish in your hand. */
function eatHeld() {
  const i = G.data.selected, s = G.data.slots[i]; if (!s) return;
  const id = s.id, q = s.q ?? 1, e = mealEffect(id, q), named = NAMED.find((n) => dishId(n) === id);
  s.qty--; if (s.qty <= 0) G.data.slots[i] = null;
  const v0 = G.data.vitality; G.heal(3 + 3 * q);
  G.eatMeal(id, e); G.addFatigue(-(4 + 4 * q)); SOUND.sfx("pickup");
  G.say(`${named ? named.eaten : `You eat the ${ITEMS[id].name.toLowerCase()}.`} (${effectText(e)}; ${G.data.vitality > v0 ? `Vitality +${Math.round(G.data.vitality - v0)}, ` : ""}Fatigue −${4 + 4 * q}.)`);
}

function give(id: string, qty: number, q?: number): string {
  const left = G.addItem(id, qty, q);
  if (qty - left > 0) SOUND.sfx("pickup");
  if (left > 0) G.say(`Your hands are full: ${left} ${ITEMS[id].name} left on the ground.`);
  return `+${qty - left} ${q && q > 1 ? QUALITY[q] + " " : ""}${ITEMS[id].name}`;
}


/** Work on the land's objects with whatever is in hand: the same at home and in the wild. */
function workObject(sc: Phaser.Scene & { clearObject(x: number, y: number): void }, tool: string | null, obj: number, x: number, y: number, hitKey: string): boolean {
    // The far lands' plants: black pine falls like an oak, reeds cut like brush, thorn scrub gives kindling.
    if (obj === T.PINE) {
      if (tool !== "axe") { G.say(tool ? "A pine wants the axe." : "You need a tool for that. Choose one with the number keys 1–0."); return true; }
      const b = labor(EFFORT.chop, 4, "Kratos"); if (b === null) return true;
      const k = hitKey; G.data.treeHits[k] = (G.data.treeHits[k] ?? 0) + 1;
      const hits = G.toolLevel("axe") >= 2 ? 2 : TREE_HITS;
      if (G.data.treeHits[k] >= hits) { delete G.data.treeHits[k]; sc.clearObject(x, y); G.say(`The pine comes down, smelling of resin: ${give("Wood", 5 + mastery("pine", 2))}${b}`); rollFind("tree", FIND_CHANCE.tree / 2); }
      else { G.say(`You swing the axe into the pine (${G.data.treeHits[k]} of ${hits}).${b}`); sc.cameras.main.shake(80, 0.002); (sc as unknown as PlayScene).chips(x, y, T.PINE, 4); }
      return true;
    }
    if (obj === T.REEDS) {
      const b = labor(tool === "sickle" ? EFFORT.cut : EFFORT.pull, tool === "sickle" ? 2 : 3, "Oikos"); if (b === null) return true;
      sc.clearObject(x, y); G.say(`You ${tool === "sickle" ? "cut" : "pull"} the reeds: ${give("Fiber", (tool === "sickle" ? 2 : 1) + mastery("reed"))}${b}`); return true;
    }
    if (obj === T.THORN) {
      if (tool !== "sickle" && tool !== "axe") { G.say(tool ? "Thorn scrub wants the sickle or the axe." : "The thorns tear at your hands. Use the sickle or the axe."); return true; }
      const b = labor(EFFORT.dig, 3, "Oikos"); if (b === null) return true;
      sc.clearObject(x, y); G.say(`You hack out the thorn scrub for kindling: ${give("Wood", 1 + mastery("thornscrub"))}, ${give("Fiber", 1)}${b}`); return true;
    }
    switch (tool) {
      case "sickle":
        if (obj === T.BRUSH) { const b = labor(EFFORT.cut, 2, "Oikos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You cut the brush: ${give("Fiber", 2 + mastery("bramble"))}${b}`); }
        else if (obj === T.FLOWERS) { sc.clearObject(x, y); G.say(`You cut wildflowers: ${give("Flowers", 2)}`); }
        else G.say("The sickle is for brush and flowers.");
        return true;
      case "axe":
        if (obj === T.SAPLING) { const b = labor(EFFORT.sapling, 4, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You fell the sapling: ${give("Wood", 2)}${b}`); }
        else if (obj === T.TREE) {
          const b = labor(EFFORT.chop, 4, "Kratos"); if (b === null) return true;
          const k = hitKey; G.data.treeHits[k] = (G.data.treeHits[k] ?? 0) + 1;
          const hits = G.toolLevel("axe") >= 2 ? 2 : TREE_HITS;
          if (G.data.treeHits[k] >= hits) { delete G.data.treeHits[k]; sc.clearObject(x, y); G.say(`The oak comes down: ${give("Wood", 6 + mastery("oak", 2))}${b}`); rollFind("tree", FIND_CHANCE.tree * (["Spring", "Summer"].includes(G.month.season) ? 1 : 0.5)); }
          else { G.say(`You swing the axe into the oak (${G.data.treeHits[k]} of ${hits}).${b}`); sc.cameras.main.shake(80, 0.002); (sc as unknown as PlayScene).chips(x, y, T.TREE, 4); }
        }
        else if (obj === T.OLIVE) G.say("You would never cut an olive tree. Athena would not forgive it.");
        else if (obj === T.FENCE) G.say("That's the goats' fence.");
        else G.say("Nothing here for the axe.");
        return true;
      case "mattock":
        if (obj === T.STONE) { const b = labor(EFFORT.stone, 4, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You break up the stone: ${give("Stone", 2 + mastery("stone"))}${b}`); rollFind("stone", FIND_CHANCE.stone); }
        else if (obj === T.BOULDER && G.toolLevel("mattock") >= 2) { const b = labor(EFFORT.boulder, 6, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`The bronze-shod mattock splits the boulder: ${give("Stone", 4 + mastery("stone"))}${b}`); }
        else if (obj === T.BOULDER) G.say("Too big for this mattock. Lykos the smith in the village can shoe it in bronze.");
        else G.say("Nothing here for the mattock.");
        return true;
      default:
        // Bare hands, or a material in hand.
        if (obj === T.FLOWERS) { sc.clearObject(x, y); G.say(`You pick wildflowers: ${give("Flowers", 1)}`); }
        else if (obj === T.BRUSH) { const b = labor(EFFORT.pull, 3, "Oikos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You pull up the brush by hand: ${give("Fiber", 1 + mastery("bramble"))}${b}`); }
        else if (obj === T.TREE || obj === T.SAPLING || obj === T.STONE || obj === T.BOULDER) G.say("You need a tool for that. Choose one with the number keys 1–0.");
    }
  return true;
}

abstract class PlayScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  facing: Dir = 0;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  targets: Target[] = [];
  current: Target | null = null;
  leaving = false;

  setupInput() {
    // Scenes are reused when they restart: begin each visit with no arrows in the air.
    this.spots = []; inDark = false;
    this.placedObjs = []; this.fenceImgs = []; this.ghost = undefined; this.boat = undefined; this.swimming = false; this.fish = undefined;
    this.spearHold = 0; this.spearBy = ""; this.spearAiming = false; this.spearChecked = false;
    this.arrows = []; this.pickups = []; this.cooldown = 0; this.aiming = false; this.knock = 0; this.invuln = 0;
    this.aimGfx = this.add.graphics().setDepth(100000);
    this.mouseIn = true;
    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", () => { this.mouseUsed = true; });
    this.input.on("gameout", () => { this.mouseIn = false; });
    this.input.on("gameover", () => { this.mouseIn = true; });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.mouseUsed = true;
      if (this.aiming) { if (p.leftButtonDown()) { if (this.holdingSpear) this.releaseSpear(); else { const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2; this.loose(w.x, w.y); } } return; }
      // Like Stardew: left click works with what you hold, right click interacts. Clicks on the hotbar belong to it.
      if (this.paused || p.y > HOTBAR_Y - 8) return;
      if (p.rightButtonDown()) this.interactNow();
      else if (p.leftButtonDown() && G.selectedItem?.id !== "bow") {
        if (this.holdingSpear && this.canHunt) { this.spearHold = performance.now(); this.spearBy = "mouse"; } // a tap thrusts, a hold aims to throw
        else this.useNow();
      }
    });
    this.input.on("pointerup", () => { if (this.spearBy === "mouse") this.releaseSpear(); });
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,Q,SPACE,SHIFT") as Record<string, Phaser.Input.Keyboard.Key>;
  }

  makePlayer(x: number, y: number) {
    this.player = this.physics.add.sprite(x, y, "player", 0);
    this.player.setSize(8, 6).setOffset(4, 10).setDepth(10);
    this.ambience = undefined;
    this.poseT = 0; this.poseKind = ""; this.walkT = 0; this.trunks = undefined; this.trunkAt.clear(); this.rustleT = 0; this.thornSaid = false;
    this.focusGlow = this.add.image(0, 0, "focusGlow").setBlendMode(Phaser.BlendModes.ADD).setVisible(false).setDepth(99980);
    this.focusMarks = this.add.graphics().setDepth(99981);
    this.focusTag = this.add.text(0, 0, "", { fontFamily: FONT, fontSize: "6px", color: "#fbe39a", stroke: "#1f1712", strokeThickness: 2 }).setOrigin(0.5, 1).setResolution(5).setAlpha(0.9).setDepth(99982).setVisible(false);
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2).setZoom(ZOOM).setRoundPixels(true);
  }

  get paused() { return this.leaving || ui(this).modal; }

  goTo(key: string) {
    if (this.leaving) return;
    this.leaving = true;
    this.player.setVelocity(0, 0);
    this.cameras.main.fadeOut(180);
    this.time.delayedCall(200, () => this.scene.start(key));
  }

  knock = 0; // seconds of being thrown back by a blow
  invuln = 0; // seconds before another blow can land
  mealT = 0;
  /** Held still (at the start line, before the race begins). */
  hold = false;
  /** The dash: how built-up your sprint is (0–1), and how long the last burst lasts. */
  dashLvl = 0; dashT = 0;
  lastHealAt = -1;
  /** Has tonight's Noumenia visit been rolled here? */
  noumRolled = false;
  /** On the night of Noumenia the dead come near the houses of the living. */
  noumeniaVisit(spots: [number, number][], chance: number, maxN: number, say: string) { // (on ghost festivals too)
    if (G.isDay) { this.noumRolled = false; return; }
    const fest = festToday();
    if (this.noumRolled || !(noumeniaNight() || (fest?.ghosts && !G.isDay))) return;
    if (!noumeniaNight() && fest) say = `It is the night of the ${fest.name}, and the dead are abroad: pale shapes stand at the doors, waiting for what the living owe them.`;
    this.noumRolled = true;
    if (Math.random() >= chance) return;
    const n = 1 + Math.floor(Math.random() * maxN);
    for (let i = 0; i < n; i++) {
      const [tx, ty] = spots[Math.floor(Math.random() * spots.length)], x = tx * TILE + 8 + (i ? 18 : 0), y = ty * TILE + 8;
      const a = new Animal(this, "eidolon", x, y, new Phaser.Geom.Rectangle(x - 60, y - 40, 120, 80));
      a.sprite.setAlpha(0); this.tweens.add({ targets: a.sprite, alpha: 0.85, duration: 1500 });
      this.animals.push(a);
    }
    G.say(say);
  }


  movePlayer(dt: number) {
    if (this.invuln > 0) { this.invuln -= dt; this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 ? 0.4 : 1); }
    if (this.knock > 0) { this.knock -= dt; return; }
    const k = this.keys, c = this.cursors;
    let vx = 0, vy = 0;
    if (!this.paused && !this.hold) {
      if (k.A.isDown || c.left.isDown) vx -= 1;
      if (k.D.isDown || c.right.isDown) vx += 1;
      if (k.W.isDown || c.up.isDown) vy -= 1;
      if (k.S.isDown || c.down.isDown) vy += 1;
    }
    let speed = 70;
    const moving = vx !== 0 || vy !== 0;
    // Running: each tap of Shift is a quick burst of speed, paid in Air; tap fast and they build into a sprint.
    if (Phaser.Input.Keyboard.JustDown(k.SHIFT) && moving && !this.paused) {
      const cost = G.warded("Hermes") ? 0 : skillCost(ESSENCE.runPerTap, G.data.aretai.Aiolos ?? 3) * G.hourDiscount("Aiolos") * Math.max(0.4, 1 - 0.12 * G.boon("Hermes")) * (G.songOn("lark") ? 0.5 : 1);
      if (G.essence.Air >= cost) {
        G.essence.Air -= cost; this.dashLvl = Math.min(1, this.dashLvl + 0.34); this.dashT = 0.42;
        const puff = this.add.image(this.player.x, this.player.y + 6, "puff").setDepth(this.player.y - 1).setAlpha(0.55).setScale(0.5);
        this.tweens.add({ targets: puff, alpha: 0, scale: 0.9, duration: 380, onComplete: () => puff.destroy() });
      } else { G.spentFlash = { el: "Air", at: performance.now() }; }
    }
    if ((this.dashT -= dt) <= 0) this.dashLvl = Math.max(0, this.dashLvl - dt * 2.6);
    if (!moving) this.dashLvl = Math.max(0, this.dashLvl - dt * 5);
    speed *= 1 + 0.85 * this.dashLvl;
    if (G.exhausted) speed *= 0.6;
    const len = Math.hypot(vx, vy) || 1;
    if (this.boat) { this.row(dt, moving ? vx / len : 0, moving ? vy / len : 0); this.animatePlayer(dt, false, 0); this.player.setDepth(this.player.y); return; }
    const w = this.underfoot();
    if (w) { speed = Math.min(speed, 70); this.dashLvl = 0; } // no running in water
    speed *= this.groundSpeed() * this.bushSpeed(dt, moving);
    this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
    this.swim(dt, w);
    this.rest(dt, moving, w);
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? 1 : 2; else this.facing = vy < 0 ? 3 : 0;
    }
    this.animatePlayer(dt, moving, speed);
    this.player.setDepth(this.player.y);
  }

  // ---------------------------------------------------------------- the player's body
  poseKind: "" | "act" | "look" = "";
  poseT = 0;
  walkT = 0;

  /** Play a gesture: a tool swing ("act") or shading the eyes to look around ("look"). */
  gesture(kind: "act" | "look") { this.poseKind = kind; this.poseT = kind === "act" ? 0.3 : 1.2; }

  /** Steps while walking (quicker when running), a swing when working, a look about when studying. */
  animatePlayer(dt: number, moving: boolean, speed: number) {
    let pose: number = POSE.stand;
    if (this.poseT > 0) {
      this.poseT -= dt;
      if (this.poseKind === "look" && moving) this.poseT = 0; // walking off breaks the look
      else if (this.poseKind === "act") pose = this.poseT > 0.17 ? POSE.raise : POSE.strike;
      else pose = Math.floor(this.poseT / 0.4) % 2 ? POSE.lookA : POSE.lookB;
    }
    if (this.poseT <= 0 && moving) {
      this.walkT += dt * (speed / 70);
      pose = [POSE.walk1, POSE.stand, POSE.walk2, POSE.stand][Math.floor(this.walkT / 0.11) % 4];
    } else if (!moving) this.walkT = 0;
    this.player.setFrame(this.facing * POSES + pose);
  }

  // ---------------------------------------------------------------- what you are looking at
  focusGlow!: Phaser.GameObjects.Image;
  focusMarks!: Phaser.GameObjects.Graphics;
  focusTag!: Phaser.GameObjects.Text;

  /**
   * A soft light on what E, Space or Q will act on, so it is always clear.
   * What E would use comes first; then a creature in front; then the tile in front, if anything is there.
   * Holding a tool marks the tile it will strike with faint corners; anything you can study gets a small name tag.
   */
  updateFocus() {
    const pulse = 0.22 + 0.08 * Math.sin(this.time.now / 260);
    let fx = 0, fy = 0, on = false, tag = "", big = false;
    const [tx, ty] = this.facingTile();
    const ahead = this.creatureAhead();
    const spot = this.forageAt(tx, ty);
    const objs = (this as unknown as { objects?: Phaser.Tilemaps.TilemapLayer }).objects;
    const obj = objs?.getTileAt(tx, ty)?.index ?? -1;
    const subject = this.paused ? null : ahead ? ahead.kind : spot ? spot.def.id : this.subjectAt();
    if (this.current) { fx = this.current.x; fy = this.current.y; on = true; }
    else if (ahead) { fx = ahead.sprite.x; fy = ahead.sprite.y; on = true; big = ahead.kind === "centaur"; }
    else if (spot || (obj >= 0 && obj !== T.EDGE && obj !== T.CAVEWALL) || (subject && !/^t\d+$/.test(subject))) {
      const tile = obj >= 0 ? objs!.getTileAt(tx, ty) : null; // sits a little off its square's centre
      fx = tile ? tile.pixelX + 8 : spot ? spot.base.x : tx * TILE + 8; fy = tile ? tile.pixelY + 8 : spot ? spot.base.y : ty * TILE + 8; on = true;
    }
    if (on && subject && LORE[subject] && !/^t\d+$/.test(subject)) tag = loreName(subject);
    const show = on && !this.paused && !this.aiming;
    this.focusGlow.setVisible(show);
    if (show) this.focusGlow.setPosition(fx, fy - 2).setAlpha(pulse).setScale(big ? 1.3 : 0.75);
    this.focusTag.setVisible(show && !!tag && !this.current);
    if (show && tag) this.focusTag.setText(tag[0].toUpperCase() + tag.slice(1)).setPosition(fx, fy - (big ? 18 : 10));
    // Faint corners on the tile a tool or seed in hand will work; a dim grey mark when the mouse is out of reach.
    this.focusMarks.clear();
    if (this.cursorMode && !this.paused && !this.cursorInReach()) {
      const [cx, cy] = this.cursorWorld(), x0 = Math.floor(cx / TILE) * TILE, y0 = Math.floor(cy / TILE) * TILE;
      this.focusMarks.lineStyle(1, 0x8d877b, 0.35).strokeRect(x0 + 0.5, y0 + 0.5, 15, 15);
      return;
    }
    const held = G.selectedItem ? ITEMS[G.selectedItem.id] : null;
    if (!this.paused && !this.aiming && held && (held.kind === "tool" || held.kind === "seed") && held.id !== "bow") {
      const x0 = tx * TILE, y0 = ty * TILE, a = 0.35 + 0.15 * Math.sin(this.time.now / 260);
      this.focusMarks.lineStyle(1, 0xfbe39a, a);
      for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x0 + 16, y0, -1, 1], [x0, y0 + 16, 1, -1], [x0 + 16, y0 + 16, -1, -1]]) {
        this.focusMarks.lineBetween(cx, cy, cx + 4 * sx, cy); this.focusMarks.lineBetween(cx, cy, cx, cy + 4 * sy);
      }
    }
  }

  // ---------------------------------------------------------------- what you are aiming at
  /** How far you can reach: things within this many tiles of the one you stand on. */
  static REACH = 2;
  mouseUsed = false;
  mouseIn = true;

  /** Aiming follows the mouse once you have used it and it is over the game; otherwise it follows the way you face. */
  get cursorMode() { return this.mouseUsed && this.mouseIn && !this.aiming; }
  playerTile(): [number, number] { return [Math.floor(this.player.x / TILE), Math.floor((this.player.y + 5) / TILE)]; }
  cursorWorld(): [number, number] { const w = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2; return [w.x, w.y]; }
  /** Is a point in the world within reach (two tiles of yours, any direction)? */
  inReach(x: number, y: number) { const [px, py] = this.playerTile(); return Math.max(Math.abs(Math.floor(x / TILE) - px), Math.abs(Math.floor(y / TILE) - py)) <= PlayScene.REACH; }
  cursorInReach() { const [x, y] = this.cursorWorld(); return this.inReach(x, y); }
  /** The point you are looking at: under the mouse, or just in front of you. */
  lookPoint(): [number, number] {
    if (this.cursorMode) return this.cursorWorld();
    const [dx, dy] = DV[this.facing];
    return [this.player.x + dx * 14, this.player.y + 4 + dy * 14];
  }
  /** Turn to face something before acting on it. */
  faceToward(x: number, y: number) {
    const dx = x - this.player.x, dy = y - (this.player.y + 4);
    if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
  }

  /** The tile you would work: under the mouse (if within reach), or the one in front of your feet. */
  facingTile(): [number, number] {
    if (this.cursorMode) {
      const [x, y] = this.cursorWorld();
      return this.inReach(x, y) ? [Math.floor(x / TILE), Math.floor(y / TILE)] : [-99, -99];
    }
    const [tx, ty] = this.playerTile();
    const [dx, dy] = DV[this.facing];
    return [tx + dx, ty + dy];
  }

  // ---------------------------------------------------------------- things you set down
  placedObjs: { p: Placed; img?: Phaser.GameObjects.Image; body?: Phaser.GameObjects.Zone; t?: Target }[] = [];
  ghost?: Phaser.GameObjects.Image;
  /** Where placed things are kept for this map ("" if nothing can be set down here). */
  placeKey(): string { return ""; }
  /** Why a thing can't be set down on this tile, or null if it can. */
  placeBlocked(_tx: number, _ty: number): string | null { return "There's nowhere to set that down here."; }
  /** The objects layer, for fences (the farm and the wild have one). */
  objLayer(): Phaser.Tilemaps.TilemapLayer | undefined { return (this as unknown as { objects?: Phaser.Tilemaps.TilemapLayer }).objects; }

  placedAt(tx: number, ty: number) { return this.placedObjs.find((o) => o.p.x === tx && o.p.y === ty); }
  /** Draw everything already set down on this map. Call once the map and its targets exist. */
  drawPlaced() {
    const key = this.placeKey(); if (!key) return;
    for (const p of G.data.placed) if (p.where === key) this.spawnPlaced(p);
  }
  spawnPlaced(p: Placed) {
    const cx = p.x * TILE + 8, by = p.y * TILE + 15;
    if (p.id === "Fence") {
      this.objLayer()?.putTileAt(T.FENCE, p.x, p.y).setCollision(true);
      this.refreshFences();
      this.placedObjs.push({ p }); return;
    }
    if (p.id === "Snare") this.resolveSnare(p);
    const img = this.add.image(cx, by, `pl_${p.id}`, p.id === "Snare" ? (p.caught ? 1 : 0) : undefined).setOrigin(0.5, 1).setDepth(by);
    const o: { p: Placed; img: Phaser.GameObjects.Image; body?: Phaser.GameObjects.Zone; t: Target } = { p, img, t: { x: cx, y: p.y * TILE + 10, label: "", act: () => {} } };
    if (p.id !== "Snare" && p.id !== "Boat") {
      const body = this.add.zone(cx, p.y * TILE + 11, 14, 8); this.physics.add.existing(body, true);
      this.physics.add.collider(this.player, body); o.body = body;
    }
    const sc = this;
    const station: Record<string, Station> = { Workbench: "workbench", Kiln: "kiln", Loom: "loom", Press: "press", Forge: "forge" };
    if (station[p.id]) o.t = { ...o.t, label: `Work at the ${ITEMS[p.id].name.toLowerCase()}`, act: () => ui(sc).openCraft(station[p.id]) };
    else if (p.id === "Chest") o.t = { ...o.t, label: "Open the chest", act: () => ui(sc).openChest(p) };
    else if (p.id === "Boat") o.t = { ...o.t, get label() { return sc.boat ? "" : "Get in the boat"; }, act: () => sc.boardBoat(o) };
    else if (p.id === "Campfire") {
      o.t = { ...o.t, get label() { return campLit(p) ? `The campfire (about ${Math.max(1, Math.round(p.fuel! - G.absHour))} h of fuel)` : "The campfire (cold)"; }, act: () => sc.campfireMenu(p) };
      const glow = this.add.image(cx, by - 6, "focusGlow").setDepth(by - 1).setTint(0xffa040).setAlpha(0.5).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD);
      const t1 = this.tweens.add({ targets: glow, alpha: 0.25, scale: 2, yoyo: true, repeat: -1, duration: 380 + Math.random() * 200 });
      const t2 = this.tweens.add({ targets: img, scaleY: 1.06, yoyo: true, repeat: -1, duration: 260 });
      (o as { fire?: { glow: Phaser.GameObjects.Image; tweens: Phaser.Tweens.Tween[]; lit?: boolean } }).fire = { glow, tweens: [t1, t2] };
      this.showFire(o);
    }
    else if (p.id === "Snare") o.t = { x: o.t.x, y: o.t.y, get label() { return p.caught ? "Something is in the snare" : "Check the snare"; }, act: () => sc.checkSnare(o) };
    this.targets.push(o.t);
    this.placedObjs.push(o);
  }
  /** Fences join up: each fence tile is drawn as the piece that fits its neighbors (the tile itself stays, unseen, for collision). */
  fenceImgs: Phaser.GameObjects.Image[] = [];
  refreshFences() {
    for (const i of this.fenceImgs) i.destroy();
    this.fenceImgs = [];
    const o = this.objLayer(); if (!o) return;
    const is = (x: number, y: number) => o.getTileAt(x, y)?.index === T.FENCE;
    o.forEachTile((t) => {
      if (t.index !== T.FENCE) return;
      t.setAlpha(0);
      const m = (is(t.x, t.y - 1) ? 1 : 0) | (is(t.x + 1, t.y) ? 2 : 0) | (is(t.x, t.y + 1) ? 4 : 0) | (is(t.x - 1, t.y) ? 8 : 0);
      this.fenceImgs.push(this.add.image(t.pixelX, t.pixelY, "fences", m).setOrigin(0, 0).setDepth(t.pixelY + 13));
    });
  }
  /** Show a campfire lit or cold (it goes out when its fuel is spent). */
  showFire(o: { p: Placed; img?: Phaser.GameObjects.Image }) {
    const f = (o as { fire?: { glow: Phaser.GameObjects.Image; tweens: Phaser.Tweens.Tween[]; lit?: boolean } }).fire; if (!f || !o.img) return;
    const lit = campLit(o.p);
    if (f.lit === lit) return;
    if (f.lit && !lit && Math.hypot(o.img.x - this.player.x, o.img.y - this.player.y) < 200) G.say("The campfire burns down to embers, and goes out.");
    f.lit = lit;
    f.glow.setVisible(lit); for (const t of f.tweens) { if (lit) t.resume(); else t.pause(); }
    o.img.setScale(1).setTint(lit ? 0xffffff : 0x6a6058);
  }
  /** The campfire: feed it, cook on it, sleep by it. */
  campfireMenu(p: Placed) {
    const u = ui(this), lit = campLit(p), fiber = G.count("Fiber");
    const opts: { label: string; fn: () => void }[] = [];
    const feed = (n: number) => () => {
      G.removeItem("Fiber", n); p.fuel = Math.max(p.fuel ?? 0, G.absHour) + n * CAMP_HOURS_PER_FIBER; SOUND.sfx("chop");
      const o = this.placedObjs.find((x) => x.p === p); if (o) this.showFire(o);
      u.closeTalk(); G.say(`${lit ? "You feed the fire" : "You strike a spark into the fiber, and blow, and the fire catches"}: about ${Math.round(p.fuel - G.absHour)} hours of burning now.`);
    };
    if (fiber >= 1) opts.push({ label: lit ? "Feed it a handful of fiber (+2 hours)" : "Relight it with a handful of fiber (2 hours)", fn: feed(1) });
    if (fiber >= 5) opts.push({ label: `${lit ? "Feed it" : "Relight it with"} 5 fiber (+10 hours)`, fn: feed(5) });
    if (lit) {
      opts.push({ label: "Cook something", fn: () => { u.closeTalk(); u.openCook("campfire"); } });
      opts.push({ label: "Sleep here until dawn", fn: () => { u.closeTalk(); this.campSleep(); } });
    }
    const left = lit ? Math.max(1, Math.round(p.fuel! - G.absHour)) : 0;
    u.showTalk("The campfire", "Fire under the open sky", lit ? `The fire crackles. A pot sits on the stones at its edge. It has fuel for about ${left} hour${left > 1 ? "s" : ""}; each handful of fiber keeps it going two hours more.` : `The campfire is cold: ash and blackened stones. ${fiber ? "Feed it fiber to light it again." : "You'll need fiber to light it again (cut brush or reeds)."}`, opts);
  }

  /** Sleep out by a campfire: half the rest of a bed, but you wake where you lay down. */
  campSleep() {
    const hours = G.sleepHours, rec = Math.min(G.data.fatigue, hours * 12 * 0.5);
    const early = G.isDay && G.data.clock < G.daylight - 2 ? "\nIt is still day: the rest of today will pass, and only the night's sleep counts." : "";
    ui(this).choose(`Sleep here by the fire until dawn?${early}\n\nThe ground is hard: about ${hours.toFixed(1)} hours of rough sleep, clearing ${Math.round(rec)} Fatigue (half what a bed gives). You will wake here.`, () => ui(this).sleep(this, false, undefined, true));
  }
  /** A snare set for at least a night has had its chance: d12 ≤ Oikos + 2, and Artemis' favor. */
  resolveSnare(p: Placed) {
    if (p.caught || p.set === undefined || G.dayNumber <= p.set) return;
    const roll = d12(), need = (G.data.aretai.Oikos ?? 3) + 2 + Math.max(0, G.boon("Artemis"));
    if (roll <= need) p.caught = Math.random() < 0.6 ? "hare" : "partridge";
    else p.set = G.dayNumber;
  }
  checkSnare(o: { p: Placed; img?: Phaser.GameObjects.Image; t?: Target }) {
    const p = o.p;
    if (p.caught) {
      const got = p.caught === "hare" ? `${give("Meat", 1)}, ${give("Hide", 1)}` : `${give("Meat", 1)}, ${give("Feather", 2)}`;
      G.say(`A ${p.caught} hangs in the noose. You take it and reset the snare: ${got}.`);
      if (p.where !== "farm") G.data.deerDebt += 0; // small game: Artemis asks no share
      p.caught = undefined; p.set = G.dayNumber; o.img?.setFrame(0);
      return;
    }
    const fresh = p.set === G.dayNumber;
    ui(this).choose(`${fresh ? "The snare is set. Give it a night." : "The noose hangs empty. Perhaps tonight."}\n\nTake up the snare?`, () => this.pickUp(o));
  }
  /** Lift a placed thing back into your pack. */
  pickUp(o: { p: Placed; img?: Phaser.GameObjects.Image; body?: Phaser.GameObjects.Zone; t?: Target }) {
    const p = o.p;
    if (p.store?.some((s) => s)) { G.say("Empty the chest before you move it."); return; }
    if (G.addItem(p.id, 1) > 0) { G.say("Your pack is full."); return; }
    if (p.id === "Fence") { this.objLayer()?.putTileAt(-1, p.x, p.y); this.refreshFences(); }
    o.img?.destroy(); o.body?.destroy();
    if (o.t) this.targets = this.targets.filter((t) => t !== o.t);
    this.placedObjs = this.placedObjs.filter((x) => x !== o);
    G.data.placed = G.data.placed.filter((x) => x !== p);
    G.say(`You take up the ${ITEMS[p.id].name.toLowerCase()}.`);
  }
  /** Set down the held thing on the tile under the cursor (or in front of you). */
  tryPlace() {
    const held = G.selectedItem!; const name = ITEMS[held.id].name.toLowerCase();
    const key = this.placeKey();
    if (!key) { G.say(`There's nowhere to set the ${name} down here.`); return; }
    if (key !== "farm" && held.id !== "Snare" && held.id !== "Campfire" && held.id !== "Boat") { G.say(`The ${name} belongs on your own homestead.`); return; }
    const [tx, ty] = this.facingTile(); if (tx < 0) return;
    const why = (held.id === "Boat" ? this.boatSpot(tx, ty) : this.placeBlocked(tx, ty)) ?? (this.placedAt(tx, ty) ? "Something is already there." : null);
    if (why) { G.say(why); return; }
    const [px, py] = this.playerTile();
    if (px === tx && py === ty) { G.say("Step aside first."); return; }
    if (held.id === "Snare" && G.data.placed.filter((p) => p.id === "Snare" && p.where === key).length >= 3) { G.say("Three snares on one stretch of ground is plenty."); return; }
    G.removeItem(held.id, 1);
    const p: Placed = { id: held.id, where: key, x: tx, y: ty };
    if (held.id === "Chest") p.store = Array(CHEST_SIZE).fill(null);
    if (held.id === "Snare") p.set = G.dayNumber;
    if (held.id === "Campfire") p.fuel = G.absHour + CAMP_HOURS_PER_FIBER; // lit with one fiber's worth
    G.data.placed.push(p); this.spawnPlaced(p); G.note(`place:${held.id}`);
    SOUND.sfx("pickup");
    G.say(held.id === "Boat" ? "You push the boat into the shallows. Get in with E." : held.id === "Snare" ? "You set the snare along a run in the grass. Check it after a night." : held.id === "Fence" ? "You drive in a length of fence." : `You set down the ${name}. (Strike it with the axe or mattock to move it again.)`);
  }
  /** The ghost of what you're about to set down. */
  updateGhost() {
    const held = G.selectedItem;
    const placing = held && ITEMS[held.id]?.kind === "place" && !this.paused;
    if (!placing) { this.ghost?.setVisible(false); return; }
    const [tx, ty] = this.facingTile();
    if (tx < 0) { this.ghost?.setVisible(false); return; }
    const tex = held.id === "Fence" ? "items" : `pl_${held.id}`;
    if (!this.ghost || !this.ghost.active) this.ghost = this.add.image(0, 0, tex).setOrigin(0.5, 1).setAlpha(0.55).setDepth(99980);
    if (this.ghost.texture.key !== tex) this.ghost.setTexture(tex);
    if (held.id === "Fence") this.ghost.setFrame("Fence"); else if (held.id === "Snare") this.ghost.setFrame(0);
    const ok = this.placeKey() && !(held.id === "Boat" ? this.boatSpot(tx, ty) : this.placeBlocked(tx, ty)) && !this.placedAt(tx, ty) && (this.placeKey() === "farm" || held.id === "Snare" || held.id === "Campfire" || held.id === "Boat");
    this.ghost.setPosition(tx * TILE + 8, ty * TILE + 15).setTint(ok ? 0xffffff : 0xff6a5a).setVisible(true);
  }

  // ---------------------------------------------------------------- the gods at work (divine.ts)
  divineT = 0; hazardT: Record<string, number> = {}; madUntil = 0; powerHinted = false;
  /** The wild screen's record, if this is one. */
  get wildRec(): ScreenRec | null { return this.scene.key === "Wild" ? (this as unknown as { rec: ScreenRec }).rec : null; }
  get outdoors() { return this.scene.key !== "House" && this.scene.key !== "Cave"; }
  /** Is this place (now) in the god's domain? */
  inDomain(god: string): boolean {
    const def = DIVINE[god]; if (!def) return false;
    const key = this.scene.key, w = this.wildRec;
    if (w && def.terrains.includes(w.terrain)) return true;
    for (const p of def.places) {
      if (p === "farm" && key === "Farm") return true;
      if (p === "home" && (key === "House" || key === "Farm")) return true;
      if (p === "village" && key === "Village") return true;
      if (p === "road" && (key === "Village" || !!w?.roads?.length)) return true;
      if (p === "crossroads" && w?.crossroads) return true;
      if (p === "crossnight" && w?.crossroads && !G.isDay) return true;
      if (p === "graveyard" && w?.graveyard) return true;
      if (p === "gravenight" && w?.graveyard && !G.isDay) return true;
      if (p === "cave" && key === "Cave") return true;
      if (p === "storm" && this.outdoors && (G.data.weather === "rain" || G.data.weather === "wind")) return true;
    }
    return false;
  }
  /** Where the god's -12 danger reaches: their domain, and for the gods below, anywhere outdoors at night. */
  dangerHere(god: string) { return this.inDomain(god) || ((god === "Hades" || god === "Hecate") && this.outdoors && !G.isDay); }
  /** Can the god's +8 power be called on here, now? Returns why not, or null. */
  powerBlocked(god: string): string | null {
    const f = G.favor(god);
    if (f < 8) return `${god} does not yet approve of you that much (+8).`;
    const used = G.data.divine.powerUsed[god];
    if (used !== undefined && G.dayNumber - used < powerRecharge(f)) return `Not again so soon: ${powerRecharge(f) - (G.dayNumber - used)} more days.`;
    if (!this.inDomain(god)) return `Only in ${DIVINE[god].domain}.`;
    return null;
  }

  /** Every few seconds: gifts and troubles waiting here, the god's wrath, and the dangers of -12. */
  divineTick(dt: number) {
    if (this.paused || this.leaving) return;
    this.divineT -= dt;
    if (this.divineT > 0) return;
    this.divineT = 4;
    const dv = G.data.divine, today = G.dayNumber;
    for (const god of ALL_GODS) {
      const here = this.inDomain(god), f = G.favor(god);
      if (here) {
        const gi = dv.gifts.findIndex((g) => g.god === god);
        if (gi >= 0 && this.outdoors) { const g = dv.gifts.splice(gi, 1)[0]; this.layGift(g); }
        const ti = dv.troubles.indexOf(god);
        if (ti >= 0) { dv.troubles.splice(ti, 1); this.trouble(god); }
        if (dv.wrathDay[god] !== today && f <= -8) { dv.wrathDay[god] = today; if (Math.random() < wrathChance(f)) this.wrath(god); }
        if (f >= 8 && !this.powerHinted && !this.powerBlocked(god)) { this.powerHinted = true; G.say(`You feel ${god} near. You could call on them here (F).`); }
      }
      if (f <= -12 && this.dangerHere(god)) {
        this.hazardT[god] = (this.hazardT[god] ?? 20 + Math.random() * 30) - 4;
        if (this.hazardT[god] <= 0) { this.hazardT[god] = 40 + Math.random() * 50; this.danger(god); }
      }
    }
  }

  /** A gift of the god, left somewhere near you in their domain, glinting. */
  layGift(g: { god: string; item: string; qty: number; q?: number }) {
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 110;
      const x = this.player.x + Math.cos(a) * d, y = this.player.y + Math.sin(a) * d;
      if (!this.openGround(x, y)) continue;
      this.dropItem(g.item, g.qty, x, y, undefined, g.q, g.god);
      const p = this.pickups[this.pickups.length - 1];
      this.tweens.add({ targets: p.img, alpha: 0.55, yoyo: true, repeat: -1, duration: 600 });
      const glint = this.add.image(x, y - 6, "glint").setDepth(99990).setScale(0.8);
      this.tweens.add({ targets: glint, alpha: 0, scale: 1.4, duration: 1400, repeat: 2, onComplete: () => glint.destroy() });
      G.say(`Something lies on the ground nearby that wasn't there before. A gift of ${g.god}?`);
      return;
    }
  }

  /** A creature sent against you, coming from a little way off. */
  summon(kind: Species, n = 1) {
    const free = (this as unknown as { free?: (x: number, y: number) => boolean }).free?.bind(this) ?? ((x: number, y: number) => this.openGround(x, y));
    const objs = (this as unknown as { objects?: Phaser.Tilemaps.TilemapLayer }).objects;
    for (let k = 0; k < n; k++) for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2, d = 140 + Math.random() * 60;
      const x = this.player.x + Math.cos(a) * d, y = this.player.y + Math.sin(a) * d;
      if (!free(x, y)) continue;
      const b = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - 200, y - 200, 400, 400), free);
      if (objs) this.physics.add.collider(b.sprite, objs);
      this.collideTrunks(b.sprite);
      if (kind === "eidolon") { b.sprite.setAlpha(0); this.tweens.add({ targets: b.sprite, alpha: 0.85, duration: 1200 }); }
      this.animals.push(b); b.charge(kind === "wolf" ? 9 : 7); this.alarm(b);
      break;
    }
  }
  /** Harm from no creature (lightning, fever, falling rocks): Fatigue, and if spent, you fall. */
  harm(dmg: number, what: string, cause: string, body = false) {
    if (this.leaving) return;
    this.stillT = 0; // no catching your breath while something is biting you
    SOUND.sfx("hurt");
    this.cameras.main.shake(160, 0.006);
    this.player.setTint(0xff7070); this.time.delayedCall(220, () => this.player.clearTint());
    if (body) { // wounds to the body: lightning, falling rock, drowning, stings
      const v = Math.max(1, Math.round(dmg / 3)); G.heal(-v);
      G.say(`${what} (−${v} Vitality)${this.lowWarn()}`);
      if (G.data.vitality <= 0) this.struckDown(cause);
      return;
    }
    G.addFatigue(dmg); // fevers, chills, malaise: they wear you down
    G.say(`${what} (+${dmg} Fatigue)`);
    if (G.data.fatigue >= 100) this.struckDown(cause);
  }
  /** Hades holds back the shears: at +12 always, or once after you've called on him. */
  spareFromBelow(): boolean {
    const ch = G.data.divine.charges;
    if (!G.warded("Hades") && !ch.Hades) return false;
    if (!G.warded("Hades")) ch.Hades = 0;
    G.data.vitality = Math.max(G.data.vitality, Math.ceil(G.vitalityMax * 0.25));
    for (const b of this.animals) if (b.state === "charge" || b.state === "recoil") { b.state = "idle"; b.sprite.setVelocity(0, 0); b.bolt(this.player); }
    G.say("You fall, and the earth will not take you. Hades holds back the Fates' shears, and you rise.");
    return true;
  }
  /** A flash and a crack: Zeus' lightning, at a spot. */
  lightning(x: number, y: number) {
    const flash = this.add.rectangle(this.cameras.main.worldView.centerX, this.cameras.main.worldView.centerY, W * 2, H * 2, 0xffffff, 0.8).setDepth(100005);
    this.tweens.add({ targets: flash, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
    const bolt = this.add.graphics().setDepth(100004);
    bolt.lineStyle(2, 0xfff6c0, 1); bolt.beginPath(); bolt.moveTo(x, y - 200);
    for (let i = 1; i <= 8; i++) bolt.lineTo(x + (Math.random() - 0.5) * 22, y - 200 + i * 25);
    bolt.strokePath(); this.time.delayedCall(260, () => bolt.destroy());
    this.cameras.main.shake(260, 0.012); SOUND.sfx("chop");
  }
  nearestBeast() {
    return this.animals.filter((a) => a.kind !== "goat" && a.state !== "dead" && a.state !== "gone" && a.sprite.visible && !isMonster(a.kind))
      .sort((p, q) => Math.hypot(p.sprite.x - this.player.x, p.sprite.y - this.player.y) - Math.hypot(q.sprite.x - this.player.x, q.sprite.y - this.player.y))[0];
  }
  growingCrops() { return Object.entries(G.data.crops).filter(([, c]) => !c.withered); }
  redrawFarm() { const f = this as unknown as { drawCrop?: (k: string) => void }; if (f.drawCrop) for (const k of Object.keys(G.data.crops)) f.drawCrop(k); }
  someone() { const ids = Object.keys(VILLAGERS); return VILLAGERS[ids[Math.floor(Math.random() * ids.length)]]; }

  /** -4: a small trouble, waiting for you in the god's domain. */
  trouble(god: string) {
    const ch = G.data.divine.charges, day = G.data.divine.day, today = G.dayNumber;
    const at = `${god} is displeased with you.`;
    switch (god) {
      case "Aphrodite": { const v = this.someone(); ui(this).changeRel(v.id, -1); G.say(`${v.name} greets you coolly today. ${at} (-1)`); break; }
      case "Artemis": case "Ares": { const b = this.nearestBeast(); if (b) { b.charge(6); this.alarm(b); G.say(`The ${beast(b.kind)} turns on you without warning. ${at}`); } else G.say(`The birds fall silent. Something here wishes you gone. ${at}`); break; }
      case "Demeter": { const cs = this.growingCrops(); if (cs.length) { const [, c] = cs[Math.floor(Math.random() * cs.length)]; c.growth = Math.max(0, c.growth - 2); c.dryStreak++; this.redrawFarm(); G.say(`One of your crops has withered back overnight. ${at}`); } break; }
      case "Hephaestus": ch.botch = 1; G.say(`Your hands feel clumsy today. ${at}`); break;
      case "Poseidon": G.data.jarWater = 0; G.addFatigue(5); G.say(`You slip in the wet and your jar spills empty. ${at}`); break;
      case "Hera": { const g = G.data.goats[Math.floor(Math.random() * G.data.goats.length)]; if (g) { day[`sick_${g.name}`] = today + 1; G.say(`${g.name} is off her milk today. ${at}`); } break; }
      case "Athena": ch.dull = 1; G.say(`Your thoughts are slow and muddled today. ${at}`); break;
      case "Apollo": this.harm(10, `A headache throbs behind your eyes. ${at}`, "Apollo's fever"); break;
      case "Dionysus": if (G.data.vat.must > 0) { G.data.vat.q = Math.max(1, G.data.vat.q - 1); G.say(`Your must smells off today: the wine will be poorer. ${at}`); } else this.harm(8, `Your head aches as if after a feast you never had. ${at}`, "Dionysus' madness"); break;
      case "Hermes": { const n = Math.max(2, Math.round(G.data.silver * 0.08)); G.data.silver = Math.max(0, G.data.silver - n); G.say(`A few coins have slipped from your purse somewhere on the road (-${money(n)}). ${at}`); break; }
      case "Zeus": G.data.weather = "rain"; this.harm(8, `A sudden squall soaks you to the skin. ${at}`, "a storm"); break;
      case "Hades": this.harm(10, `A chill rises from the earth into your bones. ${at}`, "the cold of the grave"); break;
      case "Hecate": G.removeItem("Torch", 1); G.say(`A cold wind finds your torches and snuffs one out for good. ${at}`); break;
    }
  }

  /** -8 and worse: the god's anger breaks out here. */
  wrath(god: string) {
    const day = G.data.divine.day, today = G.dayNumber;
    const at = `${god} is angry with you.`;
    switch (god) {
      case "Aphrodite": { const v = this.someone(); ui(this).changeRel(v.id, -2); G.say(`Word reaches you that ${v.name} has turned against you. ${at} (-2)`); break; }
      case "Artemis": G.say(`A wolf's howl, close. ${at}`); this.summon("wolf"); break;
      case "Demeter": { const cs = this.growingCrops(); const n = Math.ceil(cs.length / 3); for (let i = 0; i < n; i++) cs[Math.floor(Math.random() * cs.length)][1].withered = true; this.redrawFarm(); if (n) G.say(`Blight: ${n} of your crops have blackened on the stalk. ${at}`); break; }
      case "Hephaestus": { const t = Object.entries(G.data.tools).filter(([, l]) => l >= 2); if (t.length) { const [id] = t[Math.floor(Math.random() * t.length)]; G.data.tools[id]--; G.say(`The edge of your ${ITEMS[id].name.toLowerCase()} chips and dulls: it is a lesser tool now. ${at}`); } else { const n = Math.floor(G.count("Arrow") / 2); G.removeItem("Arrow", n); G.say(`Your arrows warp and split${n ? ` (-${n})` : ""}. ${at}`); } break; }
      case "Poseidon": day.wellDry = today + 3; G.data.jarWater = 0; G.say(`The ground shudders underfoot. Your well will be dry for three days. ${at}`); break;
      case "Hera": { const g = G.data.goats[Math.floor(Math.random() * G.data.goats.length)]; if (g) { day[`sick_${g.name}`] = today + 3; g.affection = Math.max(0, g.affection - 2); G.say(`${g.name} has fallen sick: no milk for three days. ${at}`); } break; }
      case "Athena": { const k = Object.entries(G.data.lore.tier).filter(([, t]) => t > 0); if (k.length) { const [id] = k[Math.floor(Math.random() * k.length)]; G.data.lore.tier[id]--; G.say(`Something you knew about ${LORE[id]?.name.toLowerCase() ?? id} slips from your mind. ${at}`); } break; }
      case "Apollo": this.harm(30, `A fever burns through you. ${at}`, "Apollo's fever"); break;
      case "Dionysus": if (G.data.vat.must > 0) { G.data.vat.must = 0; G.data.vat.sealed = -1; G.say(`The wine in your vat has soured to vinegar. ${at}`); } else this.harm(20, `The world tilts and roars like a feast gone wrong. ${at}`, "Dionysus' madness"); break;
      case "Hermes": { const n = Math.round(G.data.silver * 0.2); G.data.silver -= n; G.say(`Thieves! Your purse is lighter by ${money(n)}. ${at}`); break; }
      case "Ares": { const w = this as unknown as { spawnMonster?: (k: MonsterKind) => void; rec?: ScreenRec }; const k = w.rec ? monsterFor(w.rec.terrain)?.kind : undefined; if (w.spawnMonster && k) { G.say(`${at} Something terrible comes.`); w.spawnMonster(k); } else { G.say(at); this.summon("boar"); } break; }
      case "Zeus": { this.lightning(this.player.x + 40, this.player.y - 10); G.essence.Fire = 0; this.harm(20, `Lightning strikes beside you! ${at}`, "lightning", true); break; }
      case "Hades": G.say(`The ground breathes cold. A shade rises. ${at}`); this.summon("eidolon"); break;
      case "Hecate": G.say(`Dogs howl where no dogs are. The dead gather. ${at}`); this.summon("eidolon", 2); break;
    }
  }

  /** -12: genuine danger, every so often, wherever the god's anger reaches. */
  danger(god: string) {
    const alive = (k: string) => this.animals.filter((a) => a.kind === k && a.state !== "dead" && a.state !== "gone").length;
    switch (god) {
      case "Artemis": if (alive("wolf") < 3) { G.say("Wolves, hunting you through Artemis' woods."); this.summon("wolf", 2); } break;
      case "Hephaestus": this.harm(14, "Rocks come crashing down the hillside onto you!", "falling rocks", true); break;
      case "Poseidon": this.harm(12, "The ground turns to sucking water beneath you and drags you down!", "the water", true); break;
      case "Apollo": this.harm(10, "Fever: an unseen arrow of Apollo finds you.", "plague"); break;
      case "Dionysus": this.madUntil = this.time.now + 5000; G.say("Madness! Your feet will not go where you will them."); break;
      case "Hermes": { const n = Math.max(1, Math.round(G.data.silver * 0.1)); G.data.silver -= n; this.harm(8, `You lose your way, and your purse (-${money(n)}).`, "the road"); break; }
      case "Ares": { const w = this as unknown as { spawnMonster?: (k: MonsterKind) => void; rec?: ScreenRec; monster?: Animal }; const k = w.rec ? monsterFor(w.rec.terrain)?.kind : undefined; if (w.spawnMonster && k && !w.monster) w.spawnMonster(k); else if (alive("boar") < 2) this.summon("boar"); break; }
      case "Zeus": { this.lightning(this.player.x, this.player.y); this.harm(18, "Lightning strikes you!", "lightning", true); break; }
      case "Hades": case "Hecate": if (alive("eidolon") < 3) { G.say(god === "Hades" ? "The dead are hunting you." : "Hecate's ghosts come for you out of the dark."); this.summon("eidolon"); } break;
    }
  }

  /** +8: call on the god for their power, here in their domain. */
  invokePower(god: string) {
    const why = this.powerBlocked(god);
    if (why) { G.say(why); return; }
    const dv = G.data.divine, today = G.dayNumber, def = DIVINE[god];
    dv.powerUsed[god] = today;
    SOUND.sfx("omen");
    let said = "";
    switch (god) {
      case "Aphrodite": for (const id of Object.keys(VILLAGERS)) ui(this).changeRel(id, 2); said = "Everyone you meet today seems glad of you. (+2 with each)"; break;
      case "Artemis": dv.day.calm = today; for (const a of this.animals) if (!isMonster(a.kind) && (a.state === "charge" || a.state === "recoil")) { a.state = "idle"; a.sprite.setVelocity(0, 0); a.appeased = true; } said = "The beasts lower their heads. None will attack you today."; break;
      case "Demeter": for (const [, c] of this.growingCrops()) { const d = CROPS[c.id]; c.growth = c.picks > 0 && d.regrow ? d.regrow : d.days; } this.redrawFarm(); said = "The fields swell and ripen before your eyes."; break;
      case "Hephaestus": dv.charges.Hephaestus = 3; said = "Your hands feel the god's own skill: your next three pieces of station work will be excellent."; break;
      case "Poseidon": { const f = this as unknown as { setGround?: (x: number, y: number, s: "wet") => void }; for (const [k, s] of Object.entries(G.data.ground)) if (s === "tilled") { if (f.setGround) { const [x, y] = k.split(",").map(Number); f.setGround(x, y, "wet"); } else G.data.ground[k] = "wet"; } G.data.jarWater = jarCap(); said = "Springs rise under every furrow, and your jar is full."; break; }
      case "Hera": G.data.fatigue = 0; G.essence = { ...G.essenceMax }; for (const g of G.data.goats) { g.fed = true; g.affection = Math.min(10, g.affection + 1); } said = "The warmth of the hearth fills you. Your weariness is gone, and your goats are content."; break;
      case "Athena": dv.charges.Athena = 5; said = "Your eyes see as an owl's: your next five studies will succeed."; break;
      case "Apollo": dv.charges.Apollo = 6; said = "Your aim is the god's: your next six shots will fly true."; break;
      case "Dionysus": if (G.data.vat.must > 0) { if (G.data.vat.sealed < 0) G.data.vat.sealed = today; G.data.vat.sealed = Math.min(G.data.vat.sealed, today - FERMENT_DAYS); } G.data.fatigue = 0; said = G.data.vat.must > 0 ? "Your must is wine, now, and your heart is light." : "Your heart is light, and your weariness falls away."; break;
      case "Hermes": G.data.px = DOOR_X; G.data.py = (DOOR.ty + 1) * TILE + 8; said = "Wings at your heels: in a breath you stand at your own door."; G.say(`You call on ${god}. ${said}`); G.data.entry = ""; this.goTo("Farm"); return;
      case "Ares": dv.day.fury = today; said = "Battle-fury fills you: today your blows cost half the Fire and land more surely."; break;
      case "Zeus": { let n = 0; for (const a of this.animals) if (a.state !== "dead" && a.state !== "gone" && a.kind !== "goat" && (a.state === "charge" || isMonster(a.kind) || a.kind === "eidolon")) { this.lightning(a.sprite.x, a.sprite.y); this.kill(a); n++; } if (!n) this.lightning(this.player.x + 60, this.player.y - 30); said = n ? `Lightning strikes ${n > 1 ? `${n} times` : "once"}, and what threatened you is ash.` : "Thunder answers you, rolling across the sky."; break; }
      case "Hades": dv.charges.Hades = 1; said = "The earth will hold you up: the next time you would fall, you will not."; break;
      case "Hecate": dv.day.hecateLight = today; for (const a of this.animals) if (a.kind === "eidolon" || a.kind === "lampad") { a.appeased = true; a.state = "idle"; a.sprite.setVelocity(0, 0); } said = "A torch kindles by itself at your shoulder. The dark is no dark to you today, and the dead step aside."; break;
    }
    G.say(`You call on ${god}: ${def.power.name}. ${said}`);
  }

  tooFar() { G.say("That's too far. Come within two paces of it."); }
  /** E or a right click: use whatever is under the cursor (or in front of you). */
  interactNow() {
    if (performance.now() - ui(this).closedByE < 150) return; // that E press closed a panel
    if (this.boat) { this.disembark(); return; }
    if (this.current) { this.faceToward(this.current.x, this.current.y); this.current.act(); }
    else if (this.cursorMode && !this.cursorInReach()) this.tooFar();
  }
  /** Space or a left click: work with what you hold. */
  useNow() {
    if (this.cursorMode && !this.cursorInReach()) { this.tooFar(); return; }
    const [lx, ly] = this.lookPoint(); if (this.cursorMode) this.faceToward(lx, ly);
    this.gesture("act");
    if (G.selectedItem && ITEMS[G.selectedItem.id]?.kind === "place") { this.tryPlace(); return; }
    if (G.selectedItem && ITEMS[G.selectedItem.id]?.kind === "meal") { eatHeld(); return; }
    if (G.selectedItem?.id === "rod") { this.fishNow(); return; }
    if (G.selectedItem && INSTRUMENTS[G.selectedItem.id]) { G.say(`To play ${INSTRUMENTS[G.selectedItem.id].name}, hold V and press 1–8. The mouse wheel changes harmonia.`); return; }
    if (G.selectedItem?.id === "axe" || G.selectedItem?.id === "mattock") {
      const [tx, ty] = this.facingTile(), o = this.placedAt(tx, ty);
      if (o) { SOUND.sfx("chop"); this.pickUp(o); return; }
    }
    const tool = G.selectedItem?.id; if (tool === "axe" || tool === "mattock" || tool === "hoe" || tool === "sickle") SOUND.sfx("chop");
    this.useItem();
  }
  /** Q: study what you are looking at. */
  studyNow() {
    if (this.cursorMode && !this.cursorInReach() && !(this.skySubject && this.time.now < this.skySubject.until)) { this.tooFar(); return; }
    const [lx, ly] = this.lookPoint(); if (this.cursorMode && this.cursorInReach()) this.faceToward(lx, ly);
    this.investigate();
  }

  /** The nearest usable thing: under the mouse (within reach), or near what the player faces. */
  findTarget(): Target | null {
    if (this.cursorMode) {
      const [cx, cy] = this.cursorWorld();
      if (!this.inReach(cx, cy)) return null;
      let best: Target | null = null, bestD = 14;
      for (const t of this.targets) {
        if (!t.label || !this.inReach(t.x, t.y)) continue;
        const d = Math.hypot(t.x - cx, t.y - cy);
        if (d < bestD) { bestD = d; best = t; }
      }
      return best;
    }
    const [dx, dy] = DV[this.facing];
    const fx = this.player.x + dx * 10, fy = this.player.y + 4 + dy * 10;
    let best: Target | null = null, bestD = 22;
    for (const t of this.targets) {
      if (!t.label) continue;
      const d = Math.min(Math.hypot(t.x - fx, t.y - fy), Math.hypot(t.x - this.player.x, t.y - this.player.y - 4) + 6);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  /** Per-frame upkeep shared by every play scene. Returns false if paused. */
  common(dt: number): boolean {
    this.ambience?.update(dt, this.paused);
    if (this.fish) this.fishTick();
    if ((this.mealT -= dt) <= 0) {
      this.mealT = 1; for (const m of G.mealTick()) G.say(m);
      if (!this.paused) this.maybeHearSong();
      for (const o of this.placedObjs) if (o.p.id === "Campfire") this.showFire(o);
      if (G.data.weather === "rain" && this.scene.key === "Farm") { const f = this as unknown as FarmScene; for (const [k, v] of Object.entries(G.data.ground)) if (v === "tilled") { const [x, y] = k.split(",").map(Number); f.setGround(x, y, "wet"); } } // rain soaks the tilled soil
      // Slow healing while awake (a longer jump in time is sleep, which heals by itself).
      const h = G.absHour; if (this.lastHealAt >= 0 && h > this.lastHealAt && h - this.lastHealAt < 2 && !this.paused) G.heal((h - this.lastHealAt) * G.vitalityMax / 96 * (1 + 0.25 * G.boon("Apollo"))); this.lastHealAt = h;
    }
    if (!this.spearChecked) { // your spear, if it lies where you left it
      this.spearChecked = true;
      const s = G.data.spearAt;
      if (s && s.k === this.groundKey()) this.dropItem("spear", 1, s.x, s.y, "spearStuck");
    }
    this.movePlayer(dt);
    if (this.madUntil > this.time.now && !G.warded("Dionysus")) { const v = this.player.body!.velocity; this.player.setVelocity(-v.x, -v.y); }
    this.divineTick(dt);
    if (this.paused) { ui(this).prompt(null); this.focusGlow?.setVisible(false); this.focusTag?.setVisible(false); this.focusMarks?.clear(); return false; }
    if (G.tick(dt)) { ui(this).collapse(this); return false; }
    G.data.px = this.player.x; G.data.py = this.player.y;
    this.current = this.findTarget();
    const angry = this.animals.find((a) => (a.state === "charge" || a.state === "recoil") && Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) < 56 && !(isMonster(a.kind) && !MONSTERS[a.kind].calm));
    if (angry) this.current = { x: angry.sprite.x, y: angry.sprite.y, label: angry.kind === "brigand" ? "Yield: throw them your purse" : isMonster(angry.kind) && G.lore(angry.kind) >= 1 ? MONSTERS[angry.kind].calm : `Calm the ${beast(angry.kind)}`, act: () => this.appease(angry) };
    ui(this).prompt(this.current ? this.current.label : null);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interactNow();
    const bow = G.selectedItem?.id === "bow";
    if (this.spearHold && !this.holdingSpear) { this.spearHold = 0; this.spearBy = ""; this.spearAiming = false; }
    if (this.spearHold && !this.spearAiming && performance.now() - this.spearHold >= SPEAR_THROW.holdMs) this.spearAiming = true;
    this.aiming = (bow && this.canHunt && this.keys.SPACE.isDown) || this.spearAiming;
    if (this.aiming) this.aimAtPointer();
    this.drawAim();
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.updateFocus(); this.updateGhost();
    if (this.ambience) { this.maybeSign(dt); this.maybeOmen(dt); }
    if (this.spearBy === "key" && Phaser.Input.Keyboard.JustUp(this.keys.SPACE)) this.releaseSpear();
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      if (this.holdingSpear && this.canHunt) { this.spearHold = performance.now(); this.spearBy = "key"; }
      else if (!bow) this.useNow();
      else if (!this.canHunt) G.say("Not indoors.");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.studyNow();
    this.updateArrows(dt);
    this.updatePickups();
    return true;
  }

  // ---------------------------------------------------------------- danger
  /**
   * When a creature notices you it rolls a d12 against its Aggression: at or under, it comes at you.
   * Night makes beasts bolder (+2), Artemis' hour calms them (-2), and a wounded beast fights (+3).
   */
  aggressionRoll(a: Animal, bonus = 0): boolean {
    const d = SPECIES[a.kind];
    if (d.aggression <= 0 || a.appeased) return false;
    const beastly = !isMonster(a.kind) && a.kind !== "eidolon" && a.kind !== "lampad";
    if (beastly && (G.warded("Artemis") || G.data.divine.day.calm === G.dayNumber)) return false; // the Mistress of beasts holds them
    if ((a.kind === "eidolon" || a.kind === "lampad") && (G.warded("Hecate") || G.data.divine.day.hecateLight === G.dayNumber)) return false;
    if (beastly && G.doomed("Artemis")) bonus += 3;
    // Beasts answer to Artemis and the hunter's hour; a monster to the god whose domain it is.
    const calmer = isMonster(a.kind) ? -Math.trunc(G.boon(MONSTERS[a.kind].patron) / 2) : (G.patron?.aretai === "Kardia" ? -2 : 0) - Math.trunc(G.boon("Artemis") / 2);
    const [calm, by] = aretaiCalm(a.kind);
    if ((a.kind === "eidolon" || a.kind === "lampad") && G.songOn("paean")) bonus -= 4; // Apollo's hymn keeps the dead at a distance
    const agg = d.aggression + (G.isDay ? 0 : 2) + calmer + bonus - calm;
    const roll = 1 + Math.floor(Math.random() * 12);
    if (roll > agg) {
      if (calm && roll <= agg + calm && d.aggression >= 2) G.say(`The ${beast(a.kind)} eyes you, then lets you be. ${by === "Pneuma" && (a.kind === "eidolon" || a.kind === "lampad") ? "The dead know a soul that has seen past the veil." : `Something in you (${by} ${G.data.aretai[by]}) holds it back.`}`);
      return false;
    }
    a.charge(a.kind === "wolf" ? 7 : a.kind === "skeleton" ? 40 : a.kind === "centaur" ? 12 : 5);
    this.alarm(a);
    if (a.kind === "empousa") a.sprite.setTexture("empousaTrue", 0);
    const name = loreName(a.kind);
    const how: Record<string, string> = { boar: "lowers its tusks and charges", wolf: "bares its teeth and comes for you", fox: "snarls and darts at you", deer: "lowers its antlers and charges",
      centaur: "throws back its head, laughs, and comes on at the gallop", jackal: "yips and darts in", scorpion: "raises its tail", bear: "rears up roaring and comes on", crab: "snaps its claws at you",
      lion: "flattens its ears and charges", stymphalian: "screams, bronze feathers rattling, and stoops at you", strix: "shrieks and drops out of the dark at you", sphinx: "springs from the rock", skeleton: "lifts its corroded blade and marches at you", empousa: "shows her true face, a grin too wide for any mouth, and springs at you" };
    const what = a.kind === "skeleton" ? "Run, or break it." : a.kind === "empousa" ? `Run, fight, or ${G.lore("empousa") >= 1 ? "mock her" : "do something"} (E).` : isMonster(a.kind) && !MONSTERS[a.kind].calm ? "Run, or fight." : "Run, fight, or calm it (E).";
    G.say(`${name[0].toUpperCase() + name.slice(1)} ${how[a.kind] ?? "comes at you"}! (d12 ${roll}${G.lore(a.kind) >= 2 ? `, Aggression ${agg}` : ""}) ${what}`);
    return true;
  }

  alarm(a: Animal) {
    const t = this.add.text(a.sprite.x, a.sprite.y - 12, "!", { fontFamily: FONT, fontSize: "10px", color: "#e0403a", stroke: "#1f1712", strokeThickness: 2 }).setOrigin(0.5).setResolution(3).setDepth(99999);
    this.tweens.add({ targets: t, y: t.y - 8, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  /** A creature lands a blow: Fatigue, a knock back, and if you were already spent, you fall. */
  struck(a: Animal) {
    SOUND.sfx("hurt");
    if (this.invuln > 0 || this.leaving) return;
    const d = SPECIES[a.kind];
    let dmg = Math.max(1, blowOf(d.damage) - armor() + (G.exhausted ? 1 : 0)); // a cloak softens it; worn out, you take it worse
    if (G.warded("Ares")) dmg = Math.max(1, Math.floor(dmg / 2)); // Ares turns the blow
    G.heal(-dmg); G.addFatigue(2);
    if (G.warded("Ares")) G.data.vitality = Math.max(1, G.data.vitality);
    this.invuln = 1; this.knock = 0.22;
    const ang = Math.atan2(this.player.y - a.sprite.y, this.player.x - a.sprite.x);
    const throwV = a.kind === "centaur" ? 280 : 170; // the hooved charge knocks you sprawling
    this.player.setVelocity(Math.cos(ang) * throwV, Math.sin(ang) * throwV); if (a.kind === "centaur") this.knock = 0.35;
    this.cameras.main.shake(140, 0.006);
    this.player.setTint(0xff7070); this.time.delayedCall(200, () => this.player.clearTint());
    const verb: Record<string, string> = { minotaur: "gores", brigand: "clubs", boar: "gores", wolf: "bites", fox: "snaps at", deer: "butts", centaur: "rides you down! Hooves", skeleton: "hacks at", empousa: "bites", jackal: "bites", scorpion: "stings", bear: "mauls", crab: "pinches", lion: "mauls", stymphalian: "slashes", strix: "rakes", sphinx: "claws", siren: "strikes" };
    if (a.kind === "empousa") { a.hp = Math.min(QUARRY.empousa.hp, (a.hp < 0 ? QUARRY.empousa.hp : a.hp) + 1); } // the blood-draught heals her
    G.say(`The ${beast(a.kind)} ${verb[a.kind] ?? "strikes"} you! (−${dmg} Vitality)${this.lowWarn()}`);
    if (G.data.vitality <= 0) this.struckDown(a);
  }

  // ---------------------------------------------------------------- fishing
  fish?: { tx: number; ty: number; sea: boolean; deep: boolean; bob: Phaser.GameObjects.Image; line: Phaser.GameObjects.Graphics; biteAt: number; biteUntil: number; state: "wait" | "bite" | "reel"; nibbles: number; px: number; py: number };
  /** Space with the rod: cast into the water ahead, strike when the float dips, or reel in to stop. */
  fishNow() {
    if (performance.now() - ui(this).reelClosedAt < 450) return; // the Space that landed the fish is not a new cast
    const f = this.fish;
    if (f?.state === "bite") { this.strike(); return; }
    if (f) { this.endFishing("You reel in your line."); return; }
    const o = this.objLayer(); if (!o) { G.say("There's no water to fish here."); return; }
    // The first water within three tiles ahead (aim with the mouse, or face it).
    const [lx, ly] = this.lookPoint(), d = DV[this.facing];
    let spot: [number, number] | null = null;
    const ptx = Math.floor(this.player.x / TILE), pty = Math.floor((this.player.y + 4) / TILE);
    const aimed = [Math.floor(lx / TILE), Math.floor(ly / TILE)];
    if (this.cursorMode && waterKind(o.getTileAt(aimed[0], aimed[1])?.index) && Math.hypot(aimed[0] - ptx, aimed[1] - pty) <= 3.5) spot = aimed as [number, number];
    for (let k = 1; k <= 3 && !spot; k++) if (waterKind(o.getTileAt(ptx + d[0] * k, pty + d[1] * k)?.index)) spot = [ptx + d[0] * k, pty + d[1] * k];
    if (!spot) { G.say("Cast into water: face the shallows or deep water within three paces."); return; }
    const w = this as unknown as { hasSpring?: boolean };
    if (w.hasSpring && Math.hypot(spot[0] - SPRING.x, spot[1] - SPRING.y - 2) < 6) { G.say("This is the Naiad's own pool. You would not dare cast a hook into it."); return; }
    const b = labor(EFFORT.hand, 1, "Metis"); if (b === null) return;
    const [tx, ty] = spot, deep = waterKind(o.getTileAt(tx, ty)?.index) === 2, sea = [6, 7].includes(this.wildRec?.terrain ?? 0);
    const bob = this.add.image(tx * TILE + 8, ty * TILE + 8, "bobber", 0).setDepth(ty * TILE + 9);
    this.tweens.add({ targets: bob, y: bob.y - 1, yoyo: true, repeat: -1, duration: 700 });
    const line = this.add.graphics().setDepth(99990);
    this.fish = { tx, ty, sea, deep, bob, line, biteAt: this.time.now + this.biteWait(), biteUntil: 0, state: "wait", nibbles: 0, px: this.player.x, py: this.player.y };
    this.faceToward(tx * TILE + 8, ty * TILE + 8); this.gesture("act");
    SOUND.sfx("loose");
    G.say(`You cast into the ${deep ? "deep water" : "shallows"}${sea ? " of the sea" : ""}. Wait for the float to dip, then strike (Space).${b}`);
  }
  /** How long until a bite (ms): dawn, dusk and rain bring fish up; Poseidon and Metis help. */
  biteWait() {
    const h = G.data.clock, dl = G.daylight, edge = h < 1.5 || Math.abs(h - dl) < 1.2, rain = G.data.weather === "rain";
    const metis = G.data.aretai.Metis ?? 3;
    return (3000 + Math.random() * 7000) * (edge ? 0.65 : 1) * (rain ? 0.8 : 1) * Math.max(0.5, 1 - 0.08 * G.boon("Poseidon")) * (1.15 - metis * 0.03) * (G.patron?.aretai === "Metis" ? 0.75 : 1);
  }
  fishTick() {
    const f = this.fish!, now = this.time.now;
    if (this.paused && f.state !== "reel") return;
    // The line: from your hands to the float.
    f.line.clear(); f.line.lineStyle(1, 0xe8e8e0, 0.6).lineBetween(this.player.x + (this.facing === 1 ? -6 : 6), this.player.y - 8, f.bob.x, f.bob.y - 2);
    if (f.state === "reel") return;
    if (Math.hypot(this.player.x - f.px, this.player.y - f.py) > 6) { this.endFishing("You walk off, and the line goes slack."); return; }
    if (f.state === "wait" && now >= f.biteAt) {
      f.state = "bite"; f.bob.setFrame(1);
      // Metis gives you a moment longer to strike.
      f.biteUntil = now + 650 + 70 * (G.data.aretai.Metis ?? 3);
      SOUND.sfx("pickup"); this.alarm({ sprite: f.bob } as unknown as Animal);
    } else if (f.state === "bite" && now > f.biteUntil) {
      f.state = "wait"; f.bob.setFrame(0); f.nibbles++;
      if (f.nibbles >= 3) { this.endFishing("The fish have stripped your hook clean. Cast again."); return; }
      f.biteAt = now + this.biteWait();
      G.say("Too slow: it took the bait and let go. Keep watching the float.");
    }
  }
  /** Strike: something is on the line. Which fish, by the water, the land, the hour and the weather; now bring it in. */
  strike() {
    const f = this.fish!; f.state = "reel"; f.bob.setFrame(1);
    const h = G.data.clock, dl = G.daylight;
    const pool = fishHere(f.sea, f.deep, this.wildRec?.terrain ?? 3, { dawn: h < 1.5, dusk: Math.abs(h - dl) < 1.2, night: !G.isDay, rain: G.data.weather === "rain" });
    if (Math.random() < 0.04) { // an old thing on the bottom, not a fish at all
      this.endFishing(""); rollFind(f.sea ? "shore" : "glint", 1); G.say("Your hook snags something on the bottom, and you haul it up: not a fish at all."); return;
    }
    const total = pool.reduce((n, p) => n + p.w, 0); let k = Math.random() * total, fish = pool[0].f;
    for (const p of pool) if ((k -= p.w) <= 0) { fish = p.f; break; }
    ui(this).openReel(fish, (landed, perfect) => this.landed(fish, landed, perfect));
  }
  landed(fish: FishDef, ok: boolean, perfect: boolean) {
    if (!ok) { this.endFishing(fish.hits >= 4 ? "Something big tears free and is gone, line and all thrashing. Next time." : "It slips the hook and is gone."); return; }
    const q = Math.min(3, (perfect ? 2 : 1) + (G.boon("Poseidon") >= 4 ? 1 : 0));
    const first = !G.data.lore.tier[fish.id.toLowerCase()];
    G.data.lore.tier[fish.id.toLowerCase()] = Math.max(1, G.data.lore.tier[fish.id.toLowerCase()] ?? 0);
    G.note("fish"); G.note(`fish:${fish.id}`);
    this.endFishing("");
    SOUND.sfx("find");
    const nm = fish.name.toLowerCase(), art = nm.endsWith("s") ? "some " : fish.hits >= 4 ? "a fine " : /^[aeiou]/.test(nm) ? "an " : "a ";
    G.say(`You land ${art}${nm}! ${give(fish.id, 1, q)}${first ? `. ${fish.desc}` : ""}${fish.id === "Tuna" && first ? " The first tunny is owed to Poseidon: offer it at an altar." : ""}`);
  }
  endFishing(say: string) {
    const f = this.fish; if (!f) return;
    f.bob.destroy(); f.line.destroy(); this.fish = undefined;
    if (say) G.say(say);
  }

  // ---------------------------------------------------------------- music in the world
  /** A little note rising from you as you sing or play. */
  noteFx(n: number, x = this.player.x, y = this.player.y - 12, color?: string) {
    const cols = ["#f2e6c9", "#f2c14e", "#e8a05a", "#e07a6a", "#c97ab8", "#8a9ae0", "#6ac0c0", "#9ad07a"];
    const t = this.add.text(x + (Math.random() * 10 - 5), y, "♪", { fontFamily: FONT, fontSize: "9px", color: color ?? cols[(n - 1) % 8], stroke: "#1f1712", strokeThickness: 2 }).setOrigin(0.5).setResolution(4).setDepth(99998);
    this.tweens.add({ targets: t, y: y - 18 - n * 1.5, x: t.x + (Math.random() * 12 - 6), alpha: 0, duration: 1300, onComplete: () => t.destroy() });
  }
  /** Creatures within reach that a calming song can reach. */
  near(r: number, which: (a: Animal) => boolean) { return this.animals.filter((a) => a.state !== "dead" && a.state !== "gone" && which(a) && Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) < r); }
  quiet(a: Animal) { a.appeased = true; a.state = "idle"; a.sprite.setVelocity(0, 0); a.rolled = true; a.rerollT = 999; }
  /** What a melody does, performed well (strong: performed beautifully). Returns null if there is nothing here for it to do. */
  songEffect(id: string, strong: boolean): string | null {
    const until = (h: number) => G.absHour + h, buff = G.data.songBuff;
    const ghost = (a: Animal) => a.kind === "eidolon" || a.kind === "lampad";
    switch (id) {
      case "work": { const f = strong ? 18 : 10; G.addFatigue(-f); G.essence.Earth = G.essenceMax.Earth; return `The work goes easier. (Fatigue −${f}, Earth restored.)`; }
      case "shepherd": {
        const calmed = this.near(strong ? 220 : 150, (a) => !isMonster(a.kind) && !ghost(a) && SPECIES[a.kind].aggression > 0 && !a.appeased);
        for (const a of calmed) this.quiet(a);
        let goats = 0;
        if (this.scene.key === "Farm") for (const g of G.data.goats) if (g.songDay !== G.dayNumber) { g.songDay = G.dayNumber; g.affection = Math.min(10, g.affection + 1); goats++; }
        if (!calmed.length && !goats) return null;
        return [calmed.length && `The beasts nearby settle and turn away (${calmed.length}).`, goats && `The goats come to the fence to listen, and love you a little more (affection +1).`].filter(Boolean).join(" ");
      }
      case "lullaby": {
        const angry = this.near(strong ? 260 : 170, (a) => (a.state === "charge" || a.state === "recoil") && (!isMonster(a.kind) || strong) && !ghost(a));
        if (!angry.length) return null;
        for (const a of angry) this.quiet(a);
        return `The ${angry.length > 1 ? "creatures" : beast(angry[0].kind)} slow${angry.length > 1 ? "" : "s"}, and stop${angry.length > 1 ? "" : "s"}, and lie${angry.length > 1 ? "" : "s"} down in the grass to listen. Orpheus would be proud.`;
      }
      case "rowers": buff.row = until(strong ? 6 : 3); return `The chant settles into your arms: rowing is swifter for ${strong ? 6 : 3} hours.`;
      case "paean": {
        const v = G.data.vitality; G.heal(strong ? 12 : 6); buff.paean = until(3);
        for (const a of this.near(240, ghost)) { this.quiet(a); a.bolt(this.player); }
        return `Apollo's hymn: you feel whole again (Vitality +${Math.round(G.data.vitality - v)}), and for 3 hours the dead keep their distance.`;
      }
      case "lament": {
        const shades = this.near(240, ghost); for (const a of shades) this.quiet(a);
        if (G.isDay && !shades.length) return null;
        let favor = "";
        if (!G.isDay) { const w = this.wildRec; const graves = w?.graveyard && Math.hypot(w.graveyard[0] * TILE + 24 - this.player.x, w.graveyard[1] * TILE + 30 - this.player.y) < 140; const after = G.addFavor("Hades", graves || strong ? 2 : 1, 6); favor = ` Below, the lord of the dead hears it${graves ? ", here among his own" : ""}. (Hades ${after >= 0 ? "+" : ""}${after})`; }
        return `${shades.length ? "The restless dead fall quiet and drift away. " : "The night listens. "}${favor}`.trim();
      }
      case "augury": buff.augury = until(24); return "Birds gather on the branches and fall silent, as if listening. The next omen will come to you clearly, and you will read it aright.";
      case "naiad": {
        if (this.scene.key === "Farm") {
          const r = strong ? 9 : 5, ptx = this.player.x / TILE, pty = this.player.y / TILE, f = this as unknown as FarmScene; let n = 0;
          for (const [k, v] of Object.entries(G.data.ground)) { const [x, y] = k.split(",").map(Number); if (v === "tilled" && Math.hypot(x - ptx, y - pty) <= r) { f.setGround(x, y, "wet"); n++; } }
          if (!n) return null;
          return `Dew beads on the furrows all around you, then soaks in: ${n} square${n > 1 ? "s" : ""} of tilled soil watered.`;
        }
        if (G.count("jar")) G.data.jarWater = jarCap(); G.essence.Water = G.essenceMax.Water;
        return "Water answers the song: your jar is full, and your Water restored.";
      }
      case "revel": { G.essence.Fire = G.essenceMax.Fire; G.essence.Air = G.essenceMax.Air; G.addFatigue(-15); buff["favor:Dionysus"] = until(strong ? 8 : 4); return `Joy runs through you like wine: Fire and Air full, weariness gone (Fatigue −15), and Dionysus near you for ${strong ? 8 : 4} hours.`; }
      case "nightingale": buff.charm = until(12); return "Something sweet lingers about you: for half a day, people will warm to you more (+1 when you chat or give).";
      case "lark": buff.lark = until(strong ? 6 : 3); return `Your feet feel light: running costs half the breath for ${strong ? 6 : 3} hours.`;
      case "cicadas": buff.muse = until(strong ? 6 : 3); return `The Muses lean close: for ${strong ? 6 : 3} hours every song comes easier (+2).`;
    }
    return null;
  }
  /**
   * Songs in the world: a nightingale at dusk, a lark at dawn, the cicadas at summer noon; the Naiad in her spring and
   * the satyrs at their revel, once they know you. Hear one, and you may sing it back before it fades, and have it.
   */
  maybeHearSong() {
    if (SING.pending && performance.now() < SING.pending.until) return;
    const key = this.scene.key; if (key !== "Farm" && key !== "Wild" && key !== "Village") return;
    const terr = this.wildRec?.terrain ?? 3, h = G.data.clock, dl = G.daylight, R = Math.random();
    const fresh = (id: string) => !G.data.songs.includes(id) && SING.heard[id] !== G.dayNumber;
    const w = this as unknown as { naiad?: Phaser.GameObjects.Image; satyrs?: Phaser.GameObjects.Image[] };
    const dist = (o?: Phaser.GameObjects.Image) => (o && o.visible ? Math.hypot(o.x - this.player.x, o.y - this.player.y) : 1e9);
    if (fresh("naiad") && rungOf(mythRec("naiad").days) >= 1 && dist(w.naiad) < 170 && R < 0.05) return this.hearSong(melody("naiad"), "nymph", `${mythRec("naiad").name} is singing softly to herself in the spring`, w.naiad!.x, w.naiad!.y - 10);
    if (fresh("revel") && rungOf(mythRec("satyrs").days) >= 1 && dist(w.satyrs?.[0]) < 190 && R < 0.05) return this.hearSong(melody("revel"), "syrinx", "The satyrs strike up a tune on their pipes", w.satyrs![0].x, w.satyrs![0].y - 10);
    if (fresh("nightingale") && h > dl - 1.5 && h < dl + 1.5 && [1, 2, 3, 9].includes(terr) && R < 0.006) return this.hearSong(melody("nightingale"), "bird", "In the dusk, a nightingale begins to sing");
    if (fresh("lark") && h < 1.5 && [1, 3, 10].includes(terr) && R < 0.006) return this.hearSong(melody("lark"), "bird", "A crested lark goes up singing into the dawn");
    if (fresh("cicadas") && G.month.season === "Summer" && h > dl * 0.35 && h < dl * 0.65 && terr !== 7 && R < 0.004) return this.hearSong(melody("cicadas"), "bird", "In the noon heat the cicadas' song rises and falls, and for a moment it is almost a tune");
  }
  hearSong(m: Melody, sound: "bird" | "nymph" | "syrinx", intro: string, x = this.player.x + 40, y = this.player.y - 30) {
    SING.heard[m.id] = G.dayNumber;
    // Hearing a nymph's song clearly takes a spirit open to the divine (Pneuma); birds sing for anyone who listens.
    if (sound !== "bird") { const roll = d12(), need = (G.data.aretai.Pneuma ?? 3) + 3; if (roll > need) { G.say(`${intro}, but the tune slips past you before you can catch it (Pneuma d12 ${roll}, needed 1–${need}).`); return; } }
    const root = 69;
    m.notes.forEach((n, i) => this.time.delayedCall(300 + i * 480, () => { SOUND.note(stepFreq(m.mode, n, root), sound, sound === "bird" ? 0.35 : 0.5, 0.9); this.noteFx(n, x, y, "#fff6c8"); }));
    SING.pending = { id: m.id, until: performance.now() + 90000 };
    G.say(`${intro}. The tune: ${HARMONIAI[m.mode].name}, ${m.notes.join(" ")}. Sing it back before it fades from your mind (hold V; the wheel changes harmonia).`);
  }

  /** Firelight on this screen: placed campfires, and a torch or lamp in your hand. */
  fireLights(): { x: number; y: number; r: number }[] {
    const out = this.placedObjs.filter((o) => o.p.id === "Campfire" && o.img && campLit(o.p)).map((o) => ({ x: o.img!.x, y: o.img!.y - 6, r: 60 }));
    const held = G.selectedItem?.id;
    if (held === "Torch" || held === "Lamp") out.push({ x: this.player.x, y: this.player.y, r: held === "Torch" ? 46 : 38 });
    return out;
  }
  /** Keep a shade out of the light: pushed back if it is inside, held at the edge if it would come in. */
  shunLight(a: Animal, lights: { x: number; y: number; r: number }[]) {
    const s = a.sprite, v = s.body!.velocity as Phaser.Math.Vector2;
    for (const L of lights) {
      const dx = s.x - L.x, dy = s.y - L.y, d = Math.hypot(dx, dy) || 1, nx = dx / d, ny = dy / d;
      if (d < L.r) { s.setVelocity(nx * 50, ny * 50); if (!a.shunned) { a.shunned = true; G.say("The shade shrinks back from the light, and hovers at its edge."); } }
      else if (d < L.r + 10) { const inward = -(v.x * nx + v.y * ny); if (inward > 0) s.setVelocity(v.x + nx * inward, v.y + ny * inward); } // slide along the edge
    }
  }
  /** A warning when Vitality runs low. */
  lowWarn() { const v = G.data.vitality, m = G.vitalityMax; return v > 0 && v <= m * 0.3 ? " You're badly hurt: get away, or eat something." : ""; }

  struckDown(a: Animal | string) {
    if (this.spareFromBelow()) return;
    G.data.vitality = 0; // knocked out: the blow beyond your Vitality goes into your Life Thread
    G.data.lifeThread = Math.max(0, G.data.lifeThread - 1);
    G.data.currencies.Pathos++; // what suffering teaches
    for (const b of this.animals) if (b.state === "charge" || b.state === "recoil") { b.state = "idle"; b.sprite.setVelocity(0, 0); }
    if (typeof a === "string") {
      if (G.data.lifeThread <= 0) { ui(this).death(a); return; }
      ui(this).sleep(this, true, `You are struck down by ${a}. Someone finds you and carries you home.\nYour Life Thread frays: ${G.data.lifeThread} of ${START_LIFE_THREAD} remain.`); return;
    }
    if (G.data.lifeThread <= 0) { ui(this).death(`${LORE[a.kind]?.name ?? a.kind}`); return; }
    ui(this).sleep(this, true, `You are struck down by the ${beast(a.kind)}. A shepherd finds you and carries you home.\nYour Life Thread frays: ${G.data.lifeThread} of ${START_LIFE_THREAD} remain.`);
  }

  /** Space with a tool (or bare hands) at a creature right in front of you: a Thymos check to land a blow. */
  tryStrike(tool: string | null): boolean {
    const torch = G.selectedItem?.id === "Torch";
    if (tool && !(tool in MELEE)) return false;
    const a = this.creatureAhead();
    const reach = (tool ? MELEE_REACH[tool] : undefined) ?? 26, weapon = !!tool && WEAPONS.includes(tool);
    if (!a || a.kind === "goat" || Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) > reach) {
      if (weapon && !(a && a.kind === "goat")) { if (labor(EFFORT.strike, 0.5, "Thymos") === null) return true; SOUND.sfx("loose"); if (a && a.kind !== "goat") G.say(`Out of reach: the ${tool === "sword" ? "sword wants you close in" : "spear reaches only so far"}.`); return true; } // a swing at the air
      return false;
    }
    if (torch) tool = "torch";
    if (a.kind === "eidolon" && tool !== "torch") { G.say("Your blow passes through the shade like smoke. Only fire touches the dead."); return true; }
    if (a.kind === "skeleton" && a.state === "dead") return false;
    const b = labor(tool ? EFFORT.strike : EFFORT.shove, 1, "Thymos"); if (b === null) return true;
    const name = beast(a.kind);
    const thymos = G.data.aretai.Thymos ?? 3;
    if (!tool) { // bare fists: a light blow that knocks the creature back
      const target = thymos + 2 + (G.data.divine.day.fury === G.dayNumber ? 2 : 0) + (G.patron?.aretai === "Thymos" ? 2 : 0) + G.boon("Ares") - darkPen();
      const roll = d12(); this.gesture("act");
      if (roll > target) { G.say(`You swing your fist at the ${name} and miss (d12 ${roll}, needed 1–${target}).${b}`); return true; }
      const q = QUARRY[a.kind]; if (a.hp < 0) a.hp = q.hp;
      a.hp -= 0.5; SOUND.sfx("hit");
      if (a.hp <= 0) { this.kill(a); this.creatureEvent(a, "slain"); return true; }
      const ang = Math.atan2(a.sprite.y - this.player.y, a.sprite.x - this.player.x), push = 150;
      a.sprite.setVelocity(Math.cos(ang) * push, Math.sin(ang) * push);
      a.sprite.setTint(0xff8080); this.time.delayedCall(220, () => a.sprite.clearTint());
      if (a.state === "charge" || a.state === "recoil") { a.state = "recoil"; a.timer = 0.6; } // knocked back, it gathers itself
      else if (!this.aggressionRoll(a, 2)) { if (fightsBack(a.kind)) a.charge(6); else a.bolt(this.player); }
      G.say(`You punch the ${name} and knock it back! (d12 ${roll}, needed 1–${target})${b}`);
      return true;
    }
    const target = thymos + 3 + (weapon ? 1 : 0) + (G.data.divine.day.fury === G.dayNumber ? 2 : 0) + (G.patron?.aretai === "Thymos" ? 2 : 0) + G.boon("Ares") - darkPen();
    const roll = 1 + Math.floor(Math.random() * 12);
    if (roll > target) { G.say(`You swing at the ${name} and miss (d12 ${roll}, needed 1–${target}).`); if (a.state !== "charge" && a.state !== "recoil" && !this.aggressionRoll(a, 3)) a.bolt(this.player); return true; }
    const q = QUARRY[a.kind];
    if (a.hp < 0) a.hp = q.hp;
    // Bare bone shrugs off cuts and shatters under crushing blows (Terata).
    const dmg = tool === "torch" ? 1 : a.kind === "skeleton" ? ({ mattock: 2, axe: 1, sickle: 0, spear: 1, sword: 1 } as Record<string, number>)[tool] ?? 1 : MELEE[tool];
    if (dmg === 0) { G.say(`Your ${tool} skitters off bare bone. It needs a crushing blow.`); return true; }
    a.hp -= dmg;
    if (a.kind === "empousa" && a.state !== "charge" && a.state !== "recoil") { a.charge(6); a.sprite.setTexture("empousaTrue", 0); }
    this.chips(Math.floor(a.sprite.x / TILE), Math.floor(a.sprite.y / TILE), -1, 4);
    if (a.hp <= 0) { this.kill(a); this.creatureEvent(a, "slain"); return true; }
    a.sprite.setTint(0xff8080); this.time.delayedCall(250, () => a.sprite.clearTint());
    G.say(`You strike the ${name}! (d12 ${roll}, needed 1–${target})`);
    if (a.state !== "charge" && a.state !== "recoil" && !this.aggressionRoll(a, 3)) { if (fightsBack(a.kind)) a.charge(6); else a.bolt(this.player); }
    return true;
  }

  /**
   * Calm an angry creature (E): a Kardia check, easier with food it likes held out in your hand.
   * The first step of befriending: a calmed creature lets you be.
   */
  appease(a: Animal) {
    if (a.kind === "empousa") { this.mock(a); return; }
    const b = labor(EFFORT.calm, 1, "Kardia"); if (b === null) return;
    const name = beast(a.kind);
    const held = G.selectedItem?.id ?? "";
    const food = (PEACE_FOOD[a.kind] ?? []).includes(held);
    if (food) G.removeItem(held, 1);
    const kardia = G.data.aretai.Kardia ?? 3;
    const target = kardia + 2 + (food ? 3 : 0) + (G.patron?.aretai === "Kardia" ? 2 : 0) - Math.floor(SPECIES[a.kind].aggression / 2) + G.boon("Athena") - darkPen();
    const roll = 1 + Math.floor(Math.random() * 12);
    const odds = `d12 ${roll}, needed 1–${Math.max(0, target)}${food ? `, ${ITEMS[held].name.toLowerCase()} offered +3` : ""}`;
    if (roll <= target) {
      a.appeased = true; a.state = "idle"; a.timer = 3; a.sprite.setVelocity(0, 0);
      const t = this.add.text(a.sprite.x, a.sprite.y - 12, "♥", { fontFamily: FONT, fontSize: "9px", color: "#9ad07a" }).setOrigin(0.5).setResolution(3).setDepth(99999);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
      G.say(`You speak low and hold still. The ${name} calms and lets you be (${odds}).`);
      this.creatureEvent(a, "appeased");
    } else {
      a.charge(4);
      G.say(`The ${name} won't be calmed (${odds}).${PEACE_FOOD[a.kind] && !food ? ` Try holding out ${PEACE_FOOD[a.kind][0].toLowerCase()}.` : ""}`);
    }
  }

  // ---------------------------------------------------------------- forage
  spots: { k: string; tx: number; ty: number; def: ForageDef; base: Phaser.GameObjects.Image; fruit: Phaser.GameObjects.Image }[] = [];
  /** Where this map remembers what's been gathered: "x,y" -> day number. */
  picked(): Record<string, number> { return {}; }

  /** Scatter forage over open ground, chosen from what grows in this terrain. */
  placeForage(gen: () => number, terrainN: number, count: number, ok: (x: number, y: number) => boolean) {
    for (const s of this.spots) { s.base.destroy(); s.fruit.destroy(); }
    this.spots = [];
    const defs = Object.values(FORAGE).filter((f) => f.terrains.includes(terrainN));
    if (!defs.length) return;
    const total = defs.reduce((n, d) => n + d.weight, 0);
    for (let tries = 0; tries < count * 30 && this.spots.length < count; tries++) {
      const x = 2 + Math.floor(gen() * 60), y = 2 + Math.floor(gen() * 40);
      let r = gen() * total, def = defs[0];
      for (const d of defs) { if ((r -= d.weight) <= 0) { def = d; break; } }
      if (!ok(x, y) || this.spots.some((s) => Math.abs(s.tx - x) + Math.abs(s.ty - y) < 3)) continue;
      const [jx, jy] = jitterOf(x, y, 3), px = x * TILE + 8 + jx, py = y * TILE + 8 + jy;
      const base = this.add.image(px, py, "forage", def.id).setDepth(py + 2);
      const fruit = this.add.image(px, py, "forage", `${def.id}_fruit`).setDepth(py + 3).setVisible(false);
      this.spots.push({ k: `${x},${y}`, tx: x, ty: y, def, base, fruit });
    }
    this.refreshForage();
  }

  /** What a plant bears shows only once you understand its kind at Basics. */
  refreshForage() {
    const picked = this.picked();
    for (const s of this.spots) s.fruit.setVisible(G.lore(s.def.id) >= 1 && bearing(s.def, G.data.month, G.dayNumber, picked[s.k]));
  }

  forageAt(tx: number, ty: number) { return this.spots.find((s) => s.tx === tx && s.ty === ty); }

  /** Where this map is, for remembering cuttings taken. */
  mapKey() { return "farm"; }

  gather(tx: number, ty: number, tool: string | null = null): boolean {
    const s = this.forageAt(tx, ty);
    if (!s) return false;
    const d = s.def, name = LORE[d.id].name.toLowerCase();
    if (G.lore(d.id) < 1) { G.say(`You don't know ${LORE[d.id].vague} well enough to tell whether anything on it is good to gather. Investigate it (Q).`); return true; }
    // With the sickle, a known wild vine gives a cutting for your own vineyard (once per vine).
    if (d.id === "wildgrape" && tool === "sickle") {
      const ck = `${this.mapKey()}:${s.k}`;
      if (G.data.cuttings[ck] !== undefined) { G.say("You've already taken a cutting from this vine. Let it heal."); return true; }
      G.data.cuttings[ck] = G.dayNumber;
      G.say(`You take a cutting from the wild vine: ${give("Cutting", 1)}. Plant it in tilled soil at home.`);
      return true;
    }
    const picked = this.picked();
    if (!d.months.includes(G.data.month)) { G.say(`Nothing to gather from the ${name} now. It bears in ${d.bearsWhen}.`); return true; }
    if (picked[s.k] !== undefined && G.dayNumber - picked[s.k] < d.regrow) {
      const left = d.regrow - (G.dayNumber - picked[s.k]);
      G.say(`You've already gathered from this ${name}. ${left > 30 ? "Not again this season." : `It will bear again in ${left} day${left > 1 ? "s" : ""}.`}`); return true;
    }
    const b = labor(EFFORT.gather, 0.5, "Oikos"); if (b === null) return true;
    picked[s.k] = G.dayNumber;
    G.say(`You gather from the ${name}: ${give(d.item, d.qty + mastery(d.id))}${b}`);
    this.chips(tx, ty, T.FLOWERS, 4);
    this.refreshForage();
    return true;
  }

  // ---------------------------------------------------------------- break effects
  /** Bits flying off a tree, stone or bush as a tool bites into it. */
  chips(tx: number, ty: number, tile: number, n = 7) {
    const cols: Record<number, number[]> = {
      [T.TREE]: [0x8a5f35, 0x5e7f34, 0x71953f], [T.SAPLING]: [0x8a5f35, 0x71953f], [T.OLIVE]: [0x8a9a6a],
      [T.STONE]: [0x9c968a, 0xc4bdae, 0x6c675e], [T.BOULDER]: [0x9c968a, 0x6c675e],
      [T.BRUSH]: [0x6f8a3a, 0x8fa04a, 0x5a6b2c], [T.FLOWERS]: [0xe85f7a, 0xf2c14e, 0xe8e2f0, 0x5e7f34],
      [T.PINE]: [0x8a5f35, 0x2f4a2a, 0x4a6a3a], [T.REEDS]: [0x8a9a4a, 0x7a5a33], [T.THORN]: [0x7a6a3a, 0xe0d8b8],
    };
    const c = cols[tile] ?? [0x8d877b];
    const cx = tx * TILE + 8, cy = ty * TILE + 9;
    for (let i = 0; i < n; i++) {
      const bit = this.add.rectangle(cx + (Math.random() - 0.5) * 8, cy + (Math.random() - 0.5) * 6, 2, 2, c[i % c.length]).setDepth(cy + 20);
      const dx = (Math.random() - 0.5) * 30, up = 6 + Math.random() * 10;
      this.tweens.add({ targets: bit, x: bit.x + dx, duration: 450, ease: "Linear" });
      this.tweens.add({ targets: bit, y: bit.y - up, duration: 180, ease: "Quad.easeOut", yoyo: true, hold: 0,
        onComplete: () => this.tweens.add({ targets: bit, alpha: 0, duration: 200, onComplete: () => bit.destroy() }) });
    }
  }

  /** A quick, simple animation of something being taken down. */
  breakFx(tx: number, ty: number, tile: number) {
    this.removeTrunk(tx, ty);
    if (tile < 0) return;
    const x = tx * TILE + 8, y = ty * TILE + 16;
    const ghost = this.add.image(x, y, "tiles", `t${tile}`).setOrigin(0.5, 1).setDepth(y + 1);
    if (tile === T.TREE || tile === T.SAPLING || tile === T.PINE) {
      // Topples away from the player and fades.
      const dir = this.player.x < x ? 1 : -1;
      this.tweens.add({ targets: ghost, angle: 85 * dir, duration: 420, ease: "Quad.easeIn",
        onComplete: () => { this.chips(tx + dir, ty, tile, 8); this.tweens.add({ targets: ghost, alpha: 0, duration: 220, onComplete: () => ghost.destroy() }); } });
    } else if (tile === T.STONE || tile === T.BOULDER) {
      // Cracks apart: a jolt, then crumbles.
      this.chips(tx, ty, tile, 10);
      this.tweens.add({ targets: ghost, scaleX: 1.15, scaleY: 0.6, alpha: 0, duration: 260, ease: "Quad.easeOut", onComplete: () => ghost.destroy() });
    } else {
      // Brush and flowers: cut down to nothing.
      this.chips(tx, ty, tile, 6);
      this.tweens.add({ targets: ghost, scaleY: 0, alpha: 0.4, duration: 200, ease: "Quad.easeIn", onComplete: () => ghost.destroy() });
    }
  }

  // ---------------------------------------------------------------- hunting
  aiming = false;
  aimGfx!: Phaser.GameObjects.Graphics;
  cooldown = 0;
  arrows: { img: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse; sx: number; sy: number; lx: number; ly: number; t: number; T: number; h: number; from?: Animal; spear?: boolean }[] = [];
  pickups: { id: string; qty: number; img: Phaser.GameObjects.Image; q?: number; from?: string; lm?: number }[] = [];
  get canHunt() { return true; }

  /** Where the pointer is in the world, pulled in to the bow's range (or the spear's). */
  aimPoint(): [number, number] {
    const w = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const px = this.player.x, py = this.player.y + 4, range = this.holdingSpear ? SPEAR_THROW.range : BOW_RANGE;
    let dx = w.x - px, dy = w.y - py; const d = Math.hypot(dx, dy);
    if (d > range) { dx *= range / d; dy *= range / d; }
    return [px + dx, py + dy];
  }

  // ---------------------------------------------------------------- the spear
  spearHold = 0; // when the button went down with the spear in hand
  spearBy: "" | "mouse" | "key" = "";
  spearAiming = false;
  spearChecked = false;
  /** Apollo's Far-darter: this shot flies true. */
  trueShot() { const ch = G.data.divine.charges; if (!ch.Apollo) return false; ch.Apollo--; return true; }
  get holdingSpear() { return G.selectedItem?.id === "spear"; }
  /** Where things you drop and leave are remembered for this map. */
  groundKey() { return this.placeKey() || this.scene.key; }
  /** The button comes up: a tap was a thrust, a hold was a throw. */
  releaseSpear() {
    const threw = this.spearAiming;
    this.spearHold = 0; this.spearBy = ""; this.spearAiming = false;
    if (this.paused) return;
    if (threw) { this.throwSpear(); this.aiming = false; this.drawAim(); } else this.useNow();
  }
  /** How wide a thrown spear may stray: Thymos and Ares steady the arm; distance, weariness and the dark don't. */
  spearSpread(dist: number) {
    const thy = G.data.aretai.Thymos ?? 3;
    let r = Math.max(3, 24 - 2 * thy) * (0.45 + dist / SPEAR_THROW.range);
    if (G.patron?.aretai === "Thymos") r *= 0.75;
    r *= Math.max(0.5, 1 - 0.08 * G.boon("Ares"));
    if (G.exhausted) r *= 1.4;
    if (inDark) r *= 1.6;
    return r;
  }
  throwSpear() {
    if (!this.holdingSpear || !this.canHunt) return;
    const b = labor(EFFORT.throwSpear, 1, "Thymos"); if (b === null) return;
    const [tx, ty] = this.aimPoint();
    const sx = this.player.x, sy = this.player.y + 4;
    const d = Math.hypot(tx - sx, ty - sy), r = this.spearSpread(d);
    const a = Math.random() * Math.PI * 2, rr = this.trueShot() ? 0 : r * Math.sqrt(Math.random());
    const lx = tx + Math.cos(a) * rr, ly = ty + Math.sin(a) * rr;
    G.removeItem("spear", 1);
    this.gesture("act"); SOUND.sfx("loose");
    const img = this.add.image(sx, sy - 8, "spearFly").setDepth(100001);
    const shadow = this.add.ellipse(sx, sy, 12, 2, 0x000000, 0.25).setDepth(1);
    this.arrows.push({ img, shadow, sx, sy: sy - 8, lx, ly, t: 0, T: 0.15 + Math.hypot(lx - sx, ly - sy) / SPEAR_THROW.speed, h: d * 0.16 + 5, spear: true });
  }
  /** Where the spear comes down: a heavy blow if it finds a creature, and then it lies there until you fetch it. */
  landSpear(x: number, y: number) {
    const hit = this.animals.find((a) => a.state !== "dead" && a.state !== "gone" && a.sprite.visible && a.kind !== "goat"
      && Math.hypot(a.sprite.x - x, a.sprite.y + 3 - y) <= QUARRY[a.kind].size + 3);
    if (hit && hit.kind === "eidolon") { G.say("Your spear passes through the shade and clatters on the stone."); hit.charge(5); }
    else if (hit) {
      const q = QUARRY[hit.kind];
      if (hit.hp < 0) hit.hp = q.hp;
      const dmg = hit.kind === "skeleton" ? 1 : SPEAR_THROW.damage;
      hit.hp -= dmg;
      if (hit.hp <= 0) { G.say(`Your spear takes the ${beast(hit.kind)} cleanly.`); this.kill(hit); this.creatureEvent(hit, "slain"); }
      else {
        hit.sprite.setTint(0xff8080); this.time.delayedCall(250, () => hit.sprite.clearTint());
        if (hit.kind === "skeleton") { G.say("Your spear cracks a rib, no more. Bone wants a crushing blow."); if (hit.state !== "charge") hit.charge(40); }
        else if (this.aggressionRoll(hit, 3)) G.say(`The spear strikes home! The wounded ${beast(hit.kind)} turns on you!`);
        else if (fightsBack(hit.kind)) { hit.charge(8); if (hit.kind === "empousa") hit.sprite.setTexture("empousaTrue", 0); G.say(`The spear strikes home! The ${beast(hit.kind)} turns on you!`); }
        else { hit.bolt({ x, y: y - 20 }); G.say(`The spear strikes home! The ${beast(hit.kind)} is badly hurt and runs.`); }
      }
    } else {
      for (const a of this.animals) if (a.kind !== "goat" && a.state !== "dead" && a.state !== "gone" && Math.hypot(a.sprite.x - x, a.sprite.y - y) < 48) a.bolt({ x, y });
    }
    // It comes to rest on open ground: if it fell in brush or water, where it last skipped.
    let dx = x, dy = y;
    const ux = this.player.x - x, uy = this.player.y + 4 - y, ul = Math.hypot(ux, uy) || 1;
    for (let i = 0; i < 16 && !this.openGround(dx, dy); i++) { dx += (ux / ul) * 6; dy += (uy / ul) * 6; }
    this.dropItem("spear", 1, dx, dy, "spearStuck");
    G.data.spearAt = { k: this.groundKey(), x: Math.round(dx), y: Math.round(dy) };
    if (!hit) G.say("Your spear thuds into the ground. Go and fetch it.");
  }

  aimAtPointer() {
    this.player.setVelocity(0, 0);
    const [tx, ty] = this.aimPoint();
    const dx = tx - this.player.x, dy = ty - this.player.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
    this.player.setFrame(this.facing * POSES + POSE.raise);
  }

  /**
   * How far from the aimed spot an arrow may land: wide for a beginner, tight for a master.
   * Ourania (aim) and Archery practice narrow it; distance widens it; Apollo's hour steadies the hand.
   */
  spread(dist: number) {
    const our = G.data.aretai.Ourania ?? 3;
    let r = Math.max(2, 26 - 2 * our - 2 * G.archery) * (0.45 + dist / BOW_RANGE);
    if (G.patron?.aretai === "Ourania") r *= 0.75;
    r *= Math.max(0.5, 1 - 0.08 * G.boon("Apollo"));
    if (G.exhausted) r *= 1.4;
    if (inDark) r *= 1.6;
    return r;
  }

  drawAim() {
    const g = this.aimGfx; g.clear();
    if (!this.aiming) return;
    const sx = this.player.x, sy = this.player.y + 4;
    const [tx, ty] = this.aimPoint();
    const d = Math.hypot(tx - sx, ty - sy), h = d * 0.22 + 6;
    g.fillStyle(0x2a1d14, 0.55);
    for (let i = 1; i < 12; i++) { const u = i / 12; g.fillRect(sx + (tx - sx) * u, sy + (ty - sy) * u - 4 * h * u * (1 - u), 1, 1); }
    const r = this.holdingSpear ? this.spearSpread(d) : this.spread(d);
    g.lineStyle(1, this.cooldown > 0 ? 0x8d877b : 0xf2c14e, 0.9).strokeCircle(tx, ty, r);
    g.fillStyle(0xf2c14e, 1).fillRect(tx - 1, ty, 3, 1).fillRect(tx, ty - 1, 1, 3);
  }

  loose(tx0: number, ty0: number) {
    SOUND.sfx("loose");
    if (this.cooldown > 0) return;
    if (G.count("Arrow") <= 0) { G.say("No arrows left. Craft more from wood and stone (C)."); return; }
    const b = labor(EFFORT.shoot, 0.5, "Ourania"); if (b === null) return;
    G.removeItem("Arrow", 1);
    const [tx, ty] = this.aimPoint();
    const sx = this.player.x, sy = this.player.y + 4;
    const d = Math.hypot(tx - sx, ty - sy), r = this.spread(d);
    const a = Math.random() * Math.PI * 2, rr = this.trueShot() ? 0 : r * Math.sqrt(Math.random());
    const lx = tx + Math.cos(a) * rr, ly = ty + Math.sin(a) * rr;
    const before = G.archery;
    G.data.archeryXp += ARCHERY.perShot;
    if (G.archery > before) G.say(`Your archery improves to ${G.archery}: your arrows fly truer.`);
    const img = this.add.image(sx, sy - 6, "arrow").setDepth(100001);
    const shadow = this.add.ellipse(sx, sy, 6, 2, 0x000000, 0.25).setDepth(1);
    this.arrows.push({ img, shadow, sx, sy: sy - 6, lx, ly, t: 0, T: 0.12 + Math.hypot(lx - sx, ly - sy) / ARROW_SPEED, h: d * 0.22 + 6 });
    this.cooldown = 0.7;
    void tx0; void ty0;
  }

  updateArrows(dt: number) {
    for (const a of [...this.arrows]) {
      a.t += dt;
      const u = Math.min(1, a.t / a.T);
      const gx = a.sx + (a.lx - a.sx) * u, gy = a.sy + (a.ly - a.sy) * u;
      const z = 4 * a.h * u * (1 - u), dz = (4 * a.h * (1 - 2 * u)) / a.T;
      a.img.setPosition(gx, gy - z).setRotation(Math.atan2((a.ly - a.sy) / a.T - dz, (a.lx - a.sx) / a.T));
      a.shadow.setPosition(gx, gy);
      if (u >= 1) { this.arrows.splice(this.arrows.indexOf(a), 1); a.img.destroy(); a.shadow.destroy(); if (a.from) this.arrowAtYou(a.lx, a.ly, a.from); else if (a.spear) this.landSpear(a.lx, a.ly); else this.land(a.lx, a.ly); }
    }
  }

  /** Is this spot open ground an arrow can stick in? */
  openGround(_x: number, _y: number) { return true; }

  /** Something notable happened to a creature (a cave's keeper slain or appeased). */
  creatureEvent(_a: Animal, _what: "slain" | "appeased") {}
  /** How the ground underfoot slows you (mud in the marsh, sand on the shore). */
  /** What water is under your feet: 0 none, 1 shallows, 2 deep. */
  underfoot(): number {
    const o = this.objLayer(); if (!o) return 0;
    return waterKind(o.getTileAtWorldXY(this.player.x, this.player.y + 5)?.index);
  }
  swimming = false; drownT = 0;
  /** Seconds you've stood still; the clock-hour of your last splash in the shallows; whether you've been told about resting. */
  stillT = 0; splashHour = -99; restTold = false;
  /**
   * Catching your breath: stand still a couple of seconds and your weariness eases, at about two
   * thirds the pace of sleep (faster by a lit campfire, or standing cool in the shallows).
   * Wading into shallow water also refreshes you once an hour.
   */
  rest(dt: number, moving: boolean, w: number) {
    if (this.paused) return;
    if (w === 1 && G.absHour - this.splashHour >= 1) {
      this.splashHour = G.absHour;
      if (G.data.fatigue > 1) {
        const cold = G.month.season === "Winter", n = Math.min(G.data.fatigue, cold ? 4 : 8);
        G.addFatigue(-n);
        G.say(cold ? "The water is bitter cold, but it wakes you up." : "You splash cool water on your face and neck. Refreshing.");
        this.splashFx();
      }
    }
    if (moving || w === 2 || G.data.fatigue <= 0) { this.stillT = 0; return; }
    this.stillT += dt;
    if (this.stillT < 2) return;
    if (!this.restTold && G.data.fatigue >= 5) { this.restTold = true; G.say("You stand and catch your breath. Keeping still slowly eases your weariness."); }
    const fire = this.fireLights().some((l) => l.r >= 60 && Math.hypot(l.x - this.player.x, l.y - this.player.y) < l.r);
    const perHour = SLEEP_RECOVERY_PER_HOUR * (2 / 3) * (fire ? 1.5 : 1) * (w === 1 ? 1.25 : 1) * (G.signActive("rest") ? 1.25 : 1);
    G.addFatigue(-perHour * dt / G.secondsPerClockHour);
    if (Math.floor(this.stillT) !== Math.floor(this.stillT - dt) && Math.floor(this.stillT) % 3 === 0) this.restFx();
  }
  splashFx() {
    for (let i = 0; i < 6; i++) {
      const d = this.add.circle(this.player.x + (Math.random() - 0.5) * 10, this.player.y + 2, 1.2, 0xbfe6f5).setDepth(this.player.y + 2);
      this.tweens.add({ targets: d, y: d.y - 8 - Math.random() * 6, alpha: 0, duration: 420 + Math.random() * 200, ease: "Quad.easeOut", onComplete: () => d.destroy() });
    }
  }
  restFx() { // a slow breath rising
    const b = this.add.text(this.player.x + 5, this.player.y - 12, "~", { fontFamily: "Georgia, serif", fontSize: "10px", color: "#e8e0c8" }).setOrigin(0.5).setDepth(this.player.y + 50).setAlpha(0.8);
    this.tweens.add({ targets: b, y: b.y - 10, alpha: 0, duration: 1400, onComplete: () => b.destroy() });
  }
  /** In deep water every stroke costs breath (Air); with none left, you start to drown. */
  swim(dt: number, w: number) {
    this.player.setCrop(w === 2 ? new Phaser.Geom.Rectangle(0, 0, 16, 9) : w === 1 ? new Phaser.Geom.Rectangle(0, 0, 16, 13) : undefined);
    if (w !== 2) { this.swimming = false; this.drownT = 0; return; }
    if (!this.swimming) { this.swimming = true; G.say("Out of your depth: you're swimming. Every stroke costs breath (Air). Get to the shallows before it runs out."); }
    if (G.warded("Poseidon")) return;
    const drain = 2.5 * dt * Math.max(0.4, 1 - 0.1 * G.boon("Poseidon"));
    if (G.essence.Air > drain) { G.essence.Air -= drain; return; }
    G.essence.Air = 0; G.spentFlash = { el: "Air", at: performance.now() };
    this.drownT -= dt;
    if (this.drownT <= 0) { this.drownT = 1; this.harm(10, "You're drowning! Water fills your mouth.", "the water", true); }
  }

  // ---------------------------------------------------------------- boats
  boat?: { p: Placed; img?: Phaser.GameObjects.Image };
  strokeT = 0;
  /** In a boat: rowing comes in strokes, a surge and a glide, about two-thirds of walking pace; only on water. */
  row(dt: number, dx: number, dy: number) {
    const b = this.boat!; const o = this.objLayer()!;
    if (dx || dy) { this.strokeT = (this.strokeT + dt) % 0.8; if (this.strokeT < dt) SOUND.sfx("loose"); } else this.strokeT = 0;
    const surge = this.strokeT < 0.3 ? 1.45 : 0.5; // average ≈ 0.85 of 70 × 2/3
    const speed = 70 * (2 / 3) * surge * (G.exhausted ? 0.6 : 1) * (G.songOn("row") ? 1.35 : 1); // the rowers' chant
    let vx = dx * speed, vy = dy * speed;
    const wetAt = (x: number, y: number) => waterKind(o.getTileAtWorldXY(x, y)?.index) > 0;
    const look = 8;
    if (vx && !wetAt(this.player.x + Math.sign(vx) * look, this.player.y + 4)) vx = 0;
    if (vy && !wetAt(this.player.x, this.player.y + 4 + Math.sign(vy) * look)) vy = 0;
    this.player.setVelocity(vx, vy);
    if (dx || dy) { if (Math.abs(dx) > Math.abs(dy)) this.facing = dx < 0 ? 1 : 2; else this.facing = dy < 0 ? 3 : 0; }
    this.player.setCrop(new Phaser.Geom.Rectangle(0, 0, 16, 11));
    b.img?.setPosition(this.player.x, this.player.y + 12).setDepth(this.player.y + 1).setFlipX(this.facing === 1);
  }
  boardBoat(o: { p: Placed; img?: Phaser.GameObjects.Image }, quiet = false) {
    if (this.boat) return;
    this.boat = o;
    this.player.setPosition(o.img!.x, o.img!.y - 12); this.player.setVelocity(0, 0);
    this.player.body!.checkCollision.none = false;
    if (!quiet) G.say("You step down into the boat and take up the oars. (Move to row; E to step ashore. Row off the edge of the map to go on by water.)");
  }
  /** Step out onto the nearest dry ground, leaving the boat where it floats. */
  disembark() {
    const b = this.boat!; const o = this.objLayer()!;
    const ptx = Math.floor(this.player.x / TILE), pty = Math.floor((this.player.y + 4) / TILE);
    let land: [number, number] | null = null;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const t = o.getTileAt(ptx + dx, pty + dy)?.index ?? -1;
      if (t === -1 || t === T.FLOWERS) { land = [ptx + dx, pty + dy]; break; }
    }
    if (!land) { G.say("Row to the shore to step out."); return; }
    b.p.x = ptx; b.p.y = pty;
    b.img?.setPosition(ptx * TILE + 8, pty * TILE + 15).setDepth(pty * TILE + 15).setFlipX(false);
    if (b.img) { const t = this.placedObjs.find((q) => q.p === b.p)?.t; if (t) { t.x = ptx * TILE + 8; t.y = pty * TILE + 10; } }
    this.boat = undefined; this.player.setCrop();
    this.player.setPosition(land[0] * TILE + 8, land[1] * TILE + 8); this.player.setVelocity(0, 0);
    G.say("You step ashore and pull the boat up into the shallows.");
  }
  /** Arriving by boat: put it on the nearest water to where you came in (or, with no water near, carry it). */
  landBoat(): boolean {
    G.data.boatCarry = false; G.note("boatmap");
    const o = this.objLayer()!; const ptx = Math.floor(this.player.x / TILE), pty = Math.floor(this.player.y / TILE);
    let best: [number, number] | null = null, bd = 99;
    for (let y = pty - 6; y <= pty + 6; y++) for (let x = ptx - 6; x <= ptx + 6; x++) {
      if (!waterKind(o.getTileAt(x, y)?.index)) continue;
      const d = Math.hypot(x - ptx, y - pty); if (d < bd) { bd = d; best = [x, y]; }
    }
    if (!best) {
      if (G.addItem("Boat", 1) > 0) G.say("The water runs out here, and your pack is full: you leave the boat behind.");
      else G.say("The water runs out here. You haul the boat out and carry it on your back.");
      return false;
    }
    G.data.placed.push({ id: "Boat", where: this.placeKey(), x: best[0], y: best[1] });
    this.player.setPosition(best[0] * TILE + 8, best[1] * TILE + 3);
    return true;
  }
  /** Where a boat can be set down: in the water, with dry land beside it. */
  boatSpot(tx: number, ty: number): string | null {
    const o = this.objLayer(); if (!o) return "There's no water here.";
    if (!waterKind(o.getTileAt(tx, ty)?.index)) return "A boat goes in the water, where it meets the shore.";
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { const t = o.getTileAt(tx + dx, ty + dy)?.index ?? -1; if (t === -1 || t === T.FLOWERS) return null; }
    return "Put the boat in where the water meets the shore.";
  }

  groundSpeed() { return 1; }

  // ---------------------------------------------------------------- signs and omens
  /** A passing sign or omen you can still study with Q, until the time given. */
  skySubject?: { id: string; until: number };
  omenLeft = 0;

  /** Once a year in its months, each of Hesiod's signs shows itself to someone outdoors. */
  maybeSign(dt: number) {
    const m = G.data.month;
    for (const s of Object.values(HESIOD_SIGNS)) {
      if (!s.months.includes(m)) continue;
      const seen = G.data.signs[s.id];
      if (seen !== undefined && G.yearOf(seen) === G.data.year) continue;
      const timeOk = s.when === "dawn" ? G.data.clock < 1.5 : G.isDay && G.data.clock > 1;
      if (!timeOk || Math.random() > dt / (s.when === "dawn" ? 5 : 45)) continue;
      this.showSign(s);
      return;
    }
  }

  showSign(s: SignDef) {
    G.data.signs[s.id] = G.dayNumber;
    this.skySubject = { id: s.id, until: this.time.now + 20000 };
    const v = this.cameras.main.worldView;
    if (s.visual === "cranes") {
      // A long V of cranes, crossing slowly high over the land, their shadows below.
      for (let i = 0; i < 9; i++) {
        const k = i - 4, x = v.right + 30 + Math.abs(k) * 14, y = v.y + 40 + k * 9;
        const img = this.add.image(x, y, "crane", i % 2).setDepth(99050);
        const sh = this.add.image(x, y + 50, "crane", 0).setTint(0).setAlpha(0.15).setDepth(2);
        for (const o of [img, sh]) this.tweens.add({ targets: o, x: v.x - 60 - Math.abs(k) * 14, y: o.y + 40, duration: 14000, onComplete: () => o.destroy() });
        this.time.addEvent({ delay: 350, repeat: 38, callback: () => img.active && img.setFrame((Number(img.frame.name) + 1) % 2) });
      }
    } else if (s.visual === "swallow") {
      const img = this.add.image(v.x - 10, this.player.y - 30, "swallow", 0).setDepth(99050);
      this.tweens.add({ targets: img, x: v.right + 20, y: this.player.y - 60, duration: 2600, onComplete: () => img.destroy() });
    } else if (s.visual === "stars") {
      // Seven faint stars low over the edge of the world, fading with the dawn.
      const east = s.id !== "pleiadesSet";
      for (let i = 0; i < 7; i++) {
        const img = this.add.image((east ? v.right - 40 : v.x + 40) + ((i * 7) % 13) - 6, v.y + 22 + ((i * 5) % 9), "glint").setScale(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(99060).setAlpha(0);
        this.tweens.add({ targets: img, alpha: 0.9, duration: 1500, yoyo: true, hold: 6000, onComplete: () => img.destroy() });
      }
    } else if (s.visual === "snail") {
      const near = this.ambience?.inView(this.ambience.flowers.length ? this.ambience.flowers : this.ambience.trees) ?? [];
      const [tx, ty] = near.length ? near.sort((a, b) => Math.hypot(a[0] * TILE - this.player.x, a[1] * TILE - this.player.y) - Math.hypot(b[0] * TILE - this.player.x, b[1] * TILE - this.player.y))[0] : [Math.floor(this.player.x / TILE) + 1, Math.floor(this.player.y / TILE)];
      const img = this.add.image(tx * TILE + 9, ty * TILE + 2, "snail").setDepth(ty * TILE + 40);
      this.time.delayedCall(60000, () => img.destroy());
    }
    const known = G.lore(s.id) >= 1;
    SOUND.sfx("sign");
    G.say(known ? `${s.sight} ${s.meaning} (For ${SIGN_DAYS} days, ${EFFECT_WORD[s.effect]}.)` : `${s.sight} (Press Q while it lasts to study it.)`);
  }

  /** The gods speak now and then: an omen comes on about one day in three, outdoors. */
  maybeOmen(dt: number) {
    const o = G.data.omen;
    if (o && o.day === G.dayNumber) return;
    if (Math.random() > dt * 0.35 / DAYLIGHT_REAL_SECONDS) return;
    const dusk = G.data.clock >= G.daylight - 1.2 && G.data.clock < G.daylight + 1.5;
    const wild = this.scene.key === "Wild";
    const ok = OMENS.filter((d) => (d.when === "dusk" ? dusk : G.isDay && !dusk) && (d.visual !== "thunder" || G.data.weather === "clear") && (d.visual !== "hind" || wild));
    if (ok.length) this.fireOmen(ok[Math.floor(Math.random() * ok.length)]);
  }

  /**
   * An omen: its truth is set by the god's mood (a god who favors you leans fair). Pneuma decides whether you notice it
   * (d12 at or under Pneuma + Dionysus' boon); Gnosis whether you read it rightly (d12 at or under Gnosis + 2 + your augury).
   * What you see is the truth; what you are told is your reading of it.
   */
  fireOmen(d: OmenDef) {
    const good = Math.random() < Phaser.Math.Clamp(0.55 + 0.07 * G.boon(d.god), 0.15, 0.85);
    const pneuma = (G.data.aretai.Pneuma ?? 3) + G.boon("Dionysus"), nRoll = 1 + Math.floor(Math.random() * 12);
    const sung = G.songOn("augury"); if (sung) G.data.songBuff.augury = -1; // Tiresias' bird-call
    const noticed = sung || nRoll <= pneuma;
    G.data.omen = { day: G.dayNumber, god: d.god, good, noticed };
    if (noticed) G.note("omen");
    this.omenVisual(d, good);
    if (!noticed) { G.say(d.plain); return; }
    const gnosis = (G.data.aretai.Gnosis ?? 3) + 2 + G.lore("augury"), rRoll = 1 + Math.floor(Math.random() * 12);
    const right = sung || rRoll <= gnosis || G.warded("Athena"), belief = right ? good : !good;
    G.data.omen.read = right;
    SOUND.sfx("omen");
    this.skySubject = { id: "augury", until: this.time.now + 12000 };
    G.say(`${belief ? d.good : d.bad} An omen. ${OMEN_MEANING[d.god][belief ? 0 : 1]}`);
  }

  /** The bird, beast or sound itself, on the side it truly came. */
  omenVisual(d: OmenDef, good: boolean) {
    const side = good ? 1 : -1, v = this.cameras.main.worldView, x = this.player.x + side * 70;
    if (d.visual === "thunder") { this.cameras.main.flash(220, 255, 250, 230); this.cameras.main.shake(300, 0.003); return; }
    if (d.visual === "voice") {
      const t = this.add.text(x, this.player.y - 20, d.id === "cuckoo" ? "cu-ckoo" : "kraak", { fontFamily: FONT, fontSize: "7px", color: "#e8e0c8", stroke: "#1f1712", strokeThickness: 2 }).setOrigin(0.5).setResolution(4).setDepth(99070);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 2200, onComplete: () => t.destroy() });
      return;
    }
    if (d.visual === "hind") {
      const img = this.add.image(this.player.x + side * 40, this.player.y - 10, "deer", 0).setFlipX(side < 0).setDepth(this.player.y);
      this.tweens.add({ targets: img, x: img.x + side * 120, alpha: 0, delay: good ? 900 : 100, duration: good ? 2200 : 900, onComplete: () => img.destroy() });
      return;
    }
    const key = d.visual === "owl" ? "owl" : "eagle";
    const img = this.add.image(x, v.y - 10, key, 0).setDepth(99070).setScale(d.visual === "hawk" ? 0.8 : 1);
    if (d.visual === "raven") img.setTint(0x26262e);
    if (d.visual === "hawk") img.setTint(0xb08050);
    const sh = this.add.image(x, v.y + 30, key, 0).setTint(0).setAlpha(0.15).setDepth(2);
    for (const o of [img, sh]) this.tweens.add({ targets: o, y: o.y + v.height + 40, x: o.x + side * 30, duration: 3200, onComplete: () => o.destroy() });
    this.time.addEvent({ delay: 180, repeat: 16, callback: () => img.active && img.setFrame((Number(img.frame.name) + 1) % 2) });
  }

  /** Butterflies, swallows, smoke, mist: the small life of the place (outdoor scenes only). */
  ambience?: Ambience;

  // ---------------------------------------------------------------- trunks and bushes
  trunks?: Phaser.Physics.Arcade.StaticGroup;
  trunkAt = new Map<string, Phaser.GameObjects.Zone>();
  rustleT = 0;
  thornSaid = false;
  get layer() { return (this as unknown as { objects?: Phaser.Tilemaps.TilemapLayer }).objects; }

  /** Give every tree a small round trunk to bump against, instead of a whole blocked tile. */
  buildTrunks() {
    const layer = this.layer;
    if (this.trunks || !layer) return;
    this.trunks = this.physics.add.staticGroup();
    layer.forEachTile((t) => {
      const r = TRUNKS[t.index]; if (!r) return;
      const z = this.add.zone(t.x * TILE + 8, t.y * TILE + 10, r * 2, r * 2);
      this.physics.add.existing(z, true);
      (z.body as Phaser.Physics.Arcade.StaticBody).setCircle(r);
      this.trunks!.add(z); this.trunkAt.set(`${t.x},${t.y}`, z);
    });
    this.physics.add.collider(this.player, this.trunks);
  }
  collideTrunks(o: Phaser.GameObjects.GameObject) { this.buildTrunks(); if (this.trunks) this.physics.add.collider(o, this.trunks); }
  removeTrunk(tx: number, ty: number) { const z = this.trunkAt.get(`${tx},${ty}`); if (z) { this.trunks?.remove(z, true, true); this.trunkAt.delete(`${tx},${ty}`); } }

  /** Pushing through a bush: slower, a rustle of leaves, and thorns that snag. You wade in to the knees. */
  bushSpeed(dt: number, moving: boolean) {
    const layer = this.layer;
    const t = layer?.getTileAtWorldXY(this.player.x, this.player.y + 5)?.index ?? -1;
    const m = BUSHES[t];
    if (!m) { if (this.player.isCropped) this.player.setCrop(); return 1; }
    this.player.setCrop(0, 0, 16, 12);
    if (moving && (this.rustleT -= dt) <= 0) {
      this.rustleT = 0.28;
      this.chips(Math.floor(this.player.x / TILE), Math.floor((this.player.y + 5) / TILE), t, 2);
    }
    if (t === T.THORN && moving) {
      G.addFatigue(dt * 0.6);
      if (!this.thornSaid) { this.thornSaid = true; G.say("The thorns snag at you as you push through."); }
    }
    return m;
  }
  /** A scene may take over what happens when a creature is beaten (the dead fall apart and rise again). */
  overcome(_a: Animal) { return false; }

  /** A creature's arrow falls: only where it lands, as with yours. Keep moving. */
  arrowAtYou(x: number, y: number, from: Animal) {
    if (Math.hypot(this.player.x - x, this.player.y + 4 - y) > 9 || this.invuln > 0 || this.leaving || G.warded("Apollo")) {
      if (from.kind === "centaur" && this.openGround(x, y) && Math.random() < 0.5) this.dropItem("Arrow", 1, x, y, "arrowStuck");
      return;
    }
    const dmg = Math.max(1, blowOf(8) - armor());
    G.heal(-dmg); G.addFatigue(1); this.invuln = 0.8;
    this.cameras.main.shake(100, 0.004);
    this.player.setTint(0xff7070); this.time.delayedCall(200, () => this.player.clearTint());
    G.say(from.kind === "stymphalian" ? `A bronze feather slices into you! (−${dmg} Vitality)` : `An arrow from the ${beast(from.kind)} finds you! (−${dmg} Vitality)`);
    if (G.data.vitality <= 0) this.struckDown(from);
  }

  /** A creature looses an arrow at where you will be, leading you a little. */
  shootAt(a: Animal, tint?: number) {
    const sx = a.sprite.x, sy = a.sprite.y - 4;
    const v = this.player.body!.velocity, d = Math.hypot(this.player.x - sx, this.player.y - sy);
    const T = 0.12 + d / ARROW_SPEED, lead = 0.7;
    const ang = Math.random() * Math.PI * 2, rr = 14 * Math.sqrt(Math.random());
    const lx = this.player.x + v.x * T * lead + Math.cos(ang) * rr, ly = this.player.y + 4 + v.y * T * lead + Math.sin(ang) * rr;
    const img = this.add.image(sx, sy, "arrow").setDepth(100001);
    if (tint !== undefined) img.setTint(tint);
    const shadow = this.add.ellipse(sx, sy + 4, 6, 2, 0x000000, 0.25).setDepth(1);
    this.arrows.push({ img, shadow, sx, sy, lx, ly, t: 0, T, h: d * 0.22 + 6, from: a });
  }

  /** Sincere mockery routs an empousa: a Logos or Phoenix check against CR 8 (d12 + the better of the two). */
  mock(a: Animal) {
    const b = labor(EFFORT.mock, 0.5, "Logos"); if (b === null) return;
    const best = Math.max(G.data.aretai.Logos ?? 3, G.data.aretai.Phoenix ?? 3), roll = 1 + Math.floor(Math.random() * 12);
    const odds = `d12 ${roll} + ${best} vs 8`;
    if (roll + best >= 8) {
      G.say(`You laugh at her: the bronze leg, the ass's hoof, the borrowed face. She shrieks, a terrible cry, and flees into the dark (${odds}).`);
      G.earn("Kleos", 1, "you laughed an empousa off the road");
      a.state = "dead"; a.sprite.setVelocity(0, 0);
      this.tweens.add({ targets: a.sprite, alpha: 0, y: a.sprite.y - 10, duration: 600, onComplete: () => { a.sprite.destroy(); this.animals.splice(this.animals.indexOf(a), 1); } });
      if (G.lore("empousa") < 1) G.data.lore.tier.empousa = 1;
    } else { G.say(`Your mockery comes out thin and frightened, and she only smiles wider (${odds}).`); if (a.state !== "charge") a.charge(6); }
  }

  /** An arrow that falls among the Mythborn: an offense, not a hunt. */
  mythHit(_x: number, _y: number) { return false; }

  /** An arrow strikes only where it falls. */
  land(x: number, y: number) {
    if (this.mythHit(x, y)) return;
    const hit = this.animals.find((a) => a.state !== "dead" && a.state !== "gone" && a.sprite.visible && a.kind !== "goat"
      && Math.hypot(a.sprite.x - x, a.sprite.y + 3 - y) <= QUARRY[a.kind].size + 2);
    const goat = this.animals.find((a) => a.kind === "goat" && Math.hypot(a.sprite.x - x, a.sprite.y + 3 - y) <= 10);
    let broke = Math.random() < 0.1;
    if (hit && hit.kind === "eidolon") { G.say("Your arrow passes through the shade and clatters on the stone."); hit.charge(5); }
    else if (hit && hit.kind === "skeleton") { G.say("Your arrow rattles through its ribs and does nothing. Bone wants a crushing blow."); if (hit.state !== "charge") hit.charge(40); }
    else if (hit) {
      const q = QUARRY[hit.kind];
      if (hit.hp < 0) hit.hp = q.hp;
      hit.hp--; broke = Math.random() < 0.3;
      const before = G.archery; G.data.archeryXp += ARCHERY.perHit;
      if (G.archery > before) G.say(`Your archery improves to ${G.archery}: your arrows fly truer.`);
      if (hit.hp <= 0) { this.kill(hit); this.creatureEvent(hit, "slain"); }
      else {
        hit.sprite.setTint(0xff8080); this.time.delayedCall(250, () => hit.sprite.clearTint());
        if (this.aggressionRoll(hit, 3)) G.say(`A hit! The wounded ${beast(hit.kind)} turns on you!`);
        else if (fightsBack(hit.kind)) { hit.charge(8); if (hit.kind === "empousa") hit.sprite.setTexture("empousaTrue", 0); G.say(`A hit! The ${beast(hit.kind)} turns on you!`); }
        else { hit.bolt({ x, y: y - 20 }); G.say(`A hit! The ${beast(hit.kind)} is wounded and runs.`); }
      }
    } else {
      if (goat) G.say(this.scene.key === "Farm" ? "Your arrow thuds into the goat pen. The goats bleat at you reproachfully." : "Your arrow thuds into the turf among the goats. Their herder shouts at you.");
      // The thud of a near miss sends creatures running.
      for (const a of this.animals) if (a.kind !== "goat" && a.state !== "dead" && a.state !== "gone" && Math.hypot(a.sprite.x - x, a.sprite.y - y) < 40) a.bolt({ x, y });
    }
    if (broke) return;
    if (!this.openGround(x, y)) return; // lost in the brush
    this.dropItem("Arrow", 1, x, y, "arrowStuck");
  }

  kill(a: Animal) {
    if (this.overcome(a)) return;
    const known = G.lore(a.kind) >= 1;
    G.note("kill"); G.note(`kill:${a.kind}`);
    a.state = "dead"; a.sprite.setVelocity(0, 0).setFlipY(true).setTint(0xb0a090);
    const name = beast(a.kind);
    G.say(`You bring down the ${name}.${a.kind === "deer" ? " Artemis' animal: offer her a share (antler or meat) at an altar before you sleep." : ""}`);
    if (a.kind === "deer") G.data.deerDebt++;
    if (["boar", "wolf", "centaur", "bear", "siren", "stymphalian"].includes(a.kind)) G.earn("Kleos", 1, `you brought down a ${name}`);
    if (a.kind === "lion" || a.kind === "sphinx") G.earn("Kleos", 2, `you overcame a ${name}`);
    if (a.kind === "empousa") { G.say("She collapses into foul ash, and the meadow smells of flowers again."); G.earn("Kleos", 1, "you destroyed an empousa"); }
    if (!known && LORE[a.kind]) { G.data.lore.tier[a.kind] = 1; G.say(`Up close, you know it now: a ${LORE[a.kind].name.toLowerCase()}.`); }
    if (a.flock.length) for (const b of a.flock) if (b !== a && b.state !== "dead" && b.state !== "gone") b.bolt(a.sprite);
    this.time.delayedCall(700, () => {
      QUARRY[a.kind].drops.forEach(([id, n], i) => this.dropItem(id, n, a.sprite.x - 6 + i * 6, a.sprite.y + 2 + (i % 2) * 4));
      this.tweens.add({ targets: a.sprite, alpha: 0, duration: 500, onComplete: () => a.sprite.destroy() });
      this.animals.splice(this.animals.indexOf(a), 1);
    });
  }

  dropItem(id: string, qty: number, x: number, y: number, tex?: string, q?: number, from?: string) {
    const img = tex ? this.add.image(x, y - 3, tex) : this.add.image(x, y, "items", id).setScale(0.75);
    img.setDepth(y);
    this.pickups.push({ id, qty, img, q, from });
  }

  /** Walk over what lies on the ground to pick it up. */
  updatePickups() {
    for (const p of [...this.pickups]) {
      if (Math.hypot(p.img.x - this.player.x, p.img.y - (this.player.y + 4)) > 12) continue;
      const left = G.addItem(p.id, p.qty, p.q);
      if (left === p.qty) continue; // no room
      if (p.id === "spear") { G.data.spearAt = null; G.say("You pull your spear out of the ground."); }
      else if (p.lm !== undefined) {
        const w = this as unknown as { rec: ScreenRec; lmDangers?: (on: "gather") => void };
        (w.rec.lmTook ??= {})[p.lm] = seasonKey(G.data.year, G.month.season); G.note("landmark");
        G.say(`+${p.qty - left} ${ITEMS[p.id].name}`); w.lmDangers?.("gather");
      }
      else if (p.from) { G.say(`A gift of ${p.from}: +${p.qty - left} ${p.q && p.q > 1 ? QUALITY[p.q] + " " : ""}${ITEMS[p.id].name}.`); SOUND.sfx("find"); }
      else G.say(`+${p.qty - left} ${ITEMS[p.id].name}`);
      if (left > 0) { p.qty = left; continue; }
      p.img.destroy(); this.pickups.splice(this.pickups.indexOf(p), 1);
    }
  }

  abstract useItem(): void;
  /** The kind of thing in front of the player, for investigating. */
  subjectAt(): string | null { return null; }
  animals: Animal[] = [];

  /** A creature under the mouse (within reach), or close in front of the player. */
  creatureAhead(): Animal | null {
    const [fx, fy] = this.lookPoint(), cursor = this.cursorMode;
    if (cursor && !this.inReach(fx, fy)) return null;
    let best: Animal | null = null, bestD = cursor ? 14 : 34;
    for (const a of this.animals) {
      if (a.state === "gone" || !a.sprite.visible) continue;
      if (cursor && !this.inReach(a.sprite.x, a.sprite.y)) continue;
      const d = Math.hypot(a.sprite.x - fx, a.sprite.y - fy);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  investigate() {
    this.gesture("look");
    const a = this.creatureAhead();
    const [fx, fy] = this.facingTile();
    const spot = this.forageAt(fx, fy);
    const subj = this.subjectAt();
    const sky = this.skySubject && this.time.now < this.skySubject.until ? this.skySubject.id : null;
    const id = a ? a.kind : spot ? spot.def.id : sky && (!subj || /^t\d+$/.test(subj)) ? sky : subj;
    if (!id || !LORE[id]) { G.say("There's nothing here to investigate."); return; }
    if (study(id)) { ui(this).openLore(id); this.refreshForage(); }
  }

  /** How close creatures let you come: running scares them, Artemis' hour and full understanding calm them. */
  updateAnimals(dt: number) {
    const running = this.dashLvl > 0.3 && this.player.body!.velocity.length() > 80;
    const base = (running ? 1.6 : 1) * (G.patron?.aretai === "Kardia" ? 0.7 : 1) * Math.max(0.5, 1 - 0.08 * G.boon("Artemis")) * Math.max(0.5, 1 - 0.04 * (G.data.stealth - 4));
    for (const a of this.animals) { a.decide ??= (x) => this.aggressionRoll(x); a.strikes ??= (x) => this.struck(x); }
    const lights = this.animals.some((a) => a.kind === "eidolon") ? this.fireLights() : [];
    if (!this.paused) for (const a of this.animals) {
      a.update(dt, this.player, base * (G.lore(a.kind) >= 3 ? 0.67 : 1));
      // Noumenia: the gathered dead circle their crossroads or graveyard, until something draws them.
      if (a.orbit && (a.state === "idle" || a.state === "walk")) {
        const o = a.orbit, t = this.time.now / 1000 * 0.35 + o.phase, tx = o.cx + Math.cos(t) * o.r, ty = o.cy + Math.sin(t) * o.r * 0.6;
        const dx = tx - a.sprite.x, dy = ty - a.sprite.y, d = Math.hypot(dx, dy) || 1, sp = Math.min(16, d * 2);
        a.sprite.setVelocity((dx / d) * sp, (dy / d) * sp); a.state = "walk"; a.timer = 1;
      }
      // The dead shrink from fire: they come at you, but will not cross into the light of a campfire or a torch.
      if (a.kind === "eidolon" && a.state !== "dead" && a.state !== "gone") this.shunLight(a, lights);
    }
    else for (const a of this.animals) a.sprite.setVelocity(0, 0);
  }
}

// ------------------------------------------------------------------ boot and title
class BootScene extends Phaser.Scene {
  constructor() { super("Boot"); }
  create() { makeTextures(this); this.scene.start("Title"); }
}

class TitleScene extends Phaser.Scene {
  starting = false;
  constructor() { super("Title"); }
  create() {
    this.starting = false;
    const save = GameState.load();
    this.cameras.main.setBackgroundColor("#1f2a3a");
    const g = this.add.graphics();
    g.fillStyle(0xc4703f); // a meander border, after Greek pottery
    for (const y of [40, H - 56]) for (let x = 0; x < W; x += 24) { g.fillRect(x, y, 20, 4); g.fillRect(x + 16, y, 4, 16); g.fillRect(x + 4, y + 12, 16, 4); g.fillRect(x + 4, y + 6, 4, 10); }
    this.add.text(W / 2, 200, "Works & Days", { fontFamily: FONT, fontSize: "64px", color: "#f2e6c9" }).setOrigin(0.5);
    this.add.text(W / 2, 260, "a vertical slice · Milestone 1.1: tools and belongings", { fontFamily: FONT, fontSize: "18px", color: "#c9b48f" }).setOrigin(0.5);

    const options: { label: string; go: () => void }[] = [];
    if (save) options.push({ label: "Continue", go: () => this.begin(new GameState(save)) });
    options.push({ label: "New life", go: () => { if (this.starting) return; this.starting = true; this.scene.start("Creation"); } });

    let sel = 0;
    const texts = options.map((o, i) =>
      this.add.text(W / 2, 360 + i * 48, o.label, { fontFamily: FONT, fontSize: "30px", color: "#f2e6c9" })
        .setOrigin(0.5).setInteractive({ useHandCursor: true })
        .on("pointerover", () => { sel = i; draw(); })
        .on("pointerdown", () => o.go()));
    const draw = () => texts.forEach((t, i) => t.setColor(i === sel ? "#f2c14e" : "#f2e6c9").setText((i === sel ? "›  " : "") + options[i].label));
    draw();
    this.input.keyboard!.on("keydown-UP", () => { sel = (sel + options.length - 1) % options.length; draw(); });
    this.input.keyboard!.on("keydown-DOWN", () => { sel = (sel + 1) % options.length; draw(); });
    this.input.keyboard!.on("keydown-ENTER", () => options[sel].go());
    this.input.keyboard!.on("keydown-SPACE", () => options[sel].go());
    this.add.text(W / 2, H - 100, "Click the game first so it can hear your keys. Your saved life lives in this browser only.", { fontFamily: FONT, fontSize: "14px", color: "#8d877b" }).setOrigin(0.5);
  }
  /** The title screen has its lyre and a soft wind (once a key or click lets sound begin). */
  update(_t: number, dms: number) { SOUND.update(dms / 1000, { scene: "Title", terrain: 3, season: "Summer", day: true, dusk: false, weather: "clear", danger: false }); }

  begin(state: GameState) {
    if (this.starting) return; // a click and a key in the same frame must not start the game twice
    this.starting = true;
    startLife(this, state);
  }
}

/** Begin (or resume) a life: dress the player in their colors and open the world. */
function startLife(scene: Phaser.Scene, state: GameState) {
  G = state;
  (window as unknown as { G: GameState }).G = G; // for testing from the console
  makePlayerTexture(scene, G.data.look);
  scene.scene.start(G.data.scene);
  if (scene.scene.isActive("UI")) scene.scene.stop("UI");
  scene.scene.launch("UI");
}

// ------------------------------------------------------------------ character creation
const ARETAI_ORDER = WHEEL.map((w) => w.aretai);
const TABLES: Record<number, TableEntry[]> = { 0: SIGNS, 1: BIRTHRIGHTS, 3: TRAININGS, 4: HAMARTIAI, 10: ASTHENEIAI, 11: MOROI };
const d12i = () => Math.floor(Math.random() * 12);

/**
 * The creation screen is the Cosmic Wheel itself: twelve segments, one per step, filling in as each is
 * decided. Modes from the Character Systems doc: choose four steps and roll the rest (default), let the
 * Fates roll everything, or (for testing and the curious) choose freely.
 */
class CreationScene extends Phaser.Scene {
  mode: "four" | "fates" | "free" = "four";
  sel = 0;
  picks: Record<number, number> = {};
  chosen = new Set<number>();
  aretai: Record<string, number> = {};
  favor: Record<string, number> = {};
  res = { Wealth: 4, Health: 4, Stealth: 4 };
  name = "";
  look = { tunic: TUNICS[0], hair: HAIRS[0], skin: SKINS[0] };
  root?: Phaser.GameObjects.Container;
  naming = false;
  note = "";
  done = false;

  constructor() { super("Creation"); }

  create() {
    this.done = false; this.naming = false; this.note = ""; this.sel = 0; this.mode = "four"; this.bg = undefined; this.bgKey = "";
    this.name = NAMES[d12i() % NAMES.length];
    this.rollAll();
    this.cameras.main.setBackgroundColor("#1f2a3a");
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.naming) return;
      const dx = p.x - WC.x, dy = p.y - WC.y, r = Math.hypot(dx, dy);
      if (r < WC.r0 || r > WC.r1) return;
      let a = (Math.atan2(dy, dx) * 180) / Math.PI + 90 + 15; if (a < 0) a += 360;
      this.sel = Math.floor(a / 30) % 12; this.note = ""; this.draw();
    });
    this.input.keyboard!.on("keydown", (e: KeyboardEvent) => {
      if (!this.naming) return;
      if (e.key === "Backspace") this.name = this.name.slice(0, -1);
      else if (e.key === "Enter" || e.key === "Escape") this.naming = false;
      else if (e.key.length === 1 && /[\p{L} '-]/u.test(e.key) && this.name.length < 16) this.name += e.key;
      this.draw();
    });
    this.draw();
  }

  rollTable(step: number) { this.picks[step] = d12i(); }

  /** Roll the whole life: every table, and a random spread of points. */
  rollAll() {
    for (const k of Object.keys(TABLES)) this.rollTable(Number(k));
    this.chosen.clear();
    this.aretai = Object.fromEntries(ARETAI_ORDER.map((a) => [a, 3]));
    for (let i = 0; i < 14; i++) {
      const from = ARETAI_ORDER[d12i()], to = ARETAI_ORDER[d12i()];
      if (from !== to && this.aretai[from] > 1 && this.aretai[to] < ARETAI_MAX_AT_CREATION) { this.aretai[from]--; this.aretai[to]++; }
    }
    this.favor = {};
    const plus = this.favorPool();
    for (let i = 0; i < plus; i++) { const g = WHEEL[d12i()].god; this.favor[g] = (this.favor[g] ?? 0) + 1; }
    for (let i = 0; i < FAVOR_MINUS; i++) { const g = WHEEL[d12i()].god; this.favor[g] = (this.favor[g] ?? 0) - 1; }
    this.res = { Wealth: 4, Health: 4, Stealth: 4 };
    for (let i = 0; i < 5; i++) {
      const keys = ["Wealth", "Health", "Stealth"] as const, from = keys[d12i() % 3], to = keys[d12i() % 3];
      if (from !== to && this.res[from] > 1 && this.res[to] < RESOURCE_MAX[to]) { this.res[from]--; this.res[to]++; }
    }
  }

  favorPool() { return FAVOR_PLUS + (BIRTHRIGHTS[this.picks[1] ?? 0].favorPoints ?? 0); }
  pointsLeft() { return YOUNG_ADULT.aretaiPoints - ARETAI_ORDER.reduce((n, a) => n + this.aretai[a], 0); }
  resLeft() { return RESOURCE_POINTS - this.res.Wealth - this.res.Health - this.res.Stealth; }
  bonus(a: string) { return (BIRTHRIGHTS[this.picks[1]].aretai?.[a] ?? 0) + (TRAININGS[this.picks[3]].aretai?.[a] ?? 0); }

  canChoose(step: number) {
    if (step === 11) return false; // Moros stays hidden
    if (this.mode === "fates") return false;
    if (this.mode === "free") return true;
    return this.chosen.has(step) || this.chosen.size < 4;
  }

  choose(step: number, i: number) {
    if (!this.canChoose(step)) { this.note = step === 11 ? "Your doom is the Fates' to keep." : this.mode === "fates" ? "The Fates are deciding everything. Change the mode to choose." : "You have chosen four steps; the Fates decide the rest."; this.draw(); return; }
    this.picks[step] = i; this.chosen.add(step); this.note = ""; this.draw();
  }

  bg?: Phaser.GameObjects.Image; bgKey = "";
  /** The backdrop: the selected step's place on the wheel sets the scene; the choice within it, the sky's god. */
  drawBackdrop() {
    const s = this.sel;
    let accent = s;
    if (TABLES[s] && s !== 11) accent = this.picks[s] ?? s;
    else if (s === 5) accent = ARETAI_ORDER.reduce((best, a, i) => (this.aretai[a] + this.bonus(a) > this.aretai[ARETAI_ORDER[best]] + this.bonus(ARETAI_ORDER[best]) ? i : best), 0);
    else if (s === 8) { const top = Object.entries(this.favor).sort((a, b) => b[1] - a[1])[0]; const i = top && top[1] > 0 ? WHEEL.findIndex((w) => w.god === top[0]) : -1; accent = i >= 0 ? i : s; }
    else if (s === 9) accent = this.res.Health >= this.res.Wealth && this.res.Health >= this.res.Stealth ? 10 : this.res.Wealth >= this.res.Stealth ? 9 : 1;
    const key = `${s}:${accent}`;
    if (key === this.bgKey && this.bg) return;
    this.bgKey = key;
    paintCreationBg(this, "creationBg", s, accent);
    if (!this.bg) {
      this.bg = this.add.image(0, 0, "creationBg").setOrigin(0, 0).setScale(3).setDepth(-10);
      this.add.rectangle(0, 0, W, H, 0x0d1018, 0.12).setOrigin(0, 0).setDepth(-9); // a veil, so the words stand out
      this.add.rectangle(484, 44, W - 500, H - 150, 0x0d1018, 0.55).setOrigin(0, 0).setDepth(-9); // behind the step's text
      this.add.rectangle(24, H - 104, W - 48, 92, 0x0d1018, 0.55).setOrigin(0, 0).setDepth(-9); // behind the modes and the way forward
    } else this.bg.setTexture("creationBg");
  }

  draw() {
    this.root?.destroy();
    this.drawBackdrop();
    const root = this.add.container(0, 0); this.root = root;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const txt = (x: number, y: number, t: string, size = 14, color = "#f2e6c9", extra: object = {}) => { const o = this.add.text(x, y, t, { ...font, fontSize: `${size}px`, color, ...extra }); root.add(o); return o; };
    const button = (x: number, y: number, t: string, fn: () => void, on = true, size = 14) => {
      const o = txt(x, y, t, size, on ? "#f2e6c9" : "#8d877b");
      if (on) o.setInteractive({ useHandCursor: true }).on("pointerover", () => o.setColor("#f2c14e")).on("pointerout", () => o.setColor("#f2e6c9")).on("pointerdown", (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); fn(); });
      return o;
    };
    txt(W / 2, 14, "The Moirai spin a new Life Thread", 22).setOrigin(0.5, 0);
    // The wheel.
    const g = this.add.graphics(); root.add(g);
    for (let i = 0; i < 12; i++) {
      const a0 = Phaser.Math.DegToRad(-90 - 15 + i * 30), a1 = a0 + Phaser.Math.DegToRad(30);
      const fixed = i === 2 || i === 6 || i === 7, chosen = this.chosen.has(i) || (this.mode === "free" && TABLES[i] !== undefined) || [5, 8, 9].includes(i);
      const col = Phaser.Display.Color.HexStringToColor(WHEEL[i].color).color;
      g.fillStyle(fixed ? 0x3a3a46 : col, fixed ? 1 : chosen ? 0.85 : 0.4);
      g.beginPath(); g.arc(WC.x, WC.y, WC.r1, a0, a1, false); g.arc(WC.x, WC.y, WC.r0, a1, a0, true); g.closePath(); g.fillPath();
      g.lineStyle(i === this.sel ? 3 : 1, i === this.sel ? 0xf2c14e : 0x1f2a3a, 1).strokePath();
      const am = (a0 + a1) / 2, lr = (WC.r0 + WC.r1) / 2;
      txt(WC.x + Math.cos(am) * lr, WC.y + Math.sin(am) * lr - 8, STEPS[i], 11, "#fffaf0", { stroke: "#1f2a3a", strokeThickness: 3 }).setOrigin(0.5);
      txt(WC.x + Math.cos(am) * lr, WC.y + Math.sin(am) * lr + 7, this.stepValue(i), 9, "#fbe39a", { stroke: "#1f2a3a", strokeThickness: 3, wordWrap: { width: 80 }, align: "center" }).setOrigin(0.5);
    }
    // At the center: the one being made.
    const pi = this.add.image(WC.x, WC.y - 24, "player", 0).setScale(3); root.add(pi);
    txt(WC.x, WC.y + 6, this.name || "(unnamed)", 16).setOrigin(0.5, 0);
    txt(WC.x, WC.y + 26, `${YOUNG_ADULT.name} · Life Thread ${YOUNG_ADULT.thread}`, 11, "#c9b48f").setOrigin(0.5, 0);
    button(WC.x - 34, WC.y + 44, "Name & look", () => { this.naming = true; this.draw(); }, true, 12);

    // The selected step.
    const px0 = 500, pw = 440;
    txt(px0, 56, `${this.sel + 1}. ${STEPS[this.sel]}`, 20, Phaser.Display.Color.HexStringToColor(WHEEL[this.sel].color).rgba);
    txt(px0, 84, `${WHEEL[this.sel].aretai} · ${WHEEL[this.sel].god}`, 11, "#c9b48f");
    txt(px0, 100, STEP_HELP[this.sel], 12, "#e0d2b4", { wordWrap: { width: pw } });
    let y = 148;
    const table = TABLES[this.sel];
    if (this.sel === 11) txt(px0, y, "Hidden. The Fates have already drawn it.\nIt will show itself in omens, dreams and oracles.", 14, "#a8a0c0");
    else if (table) {
      table.forEach((e, i) => {
        const on = this.picks[this.sel] === i;
        const t = button(px0, y, `${on ? "›" : " "} ${i + 1}. ${e.name}  ·  ${e.text}`, () => this.choose(this.sel, i), this.canChoose(this.sel), 12);
        if (on) t.setColor("#f2c14e");
        t.setWordWrapWidth(pw);
        y += Math.max(18, t.height + 3);
      });
      const tag = this.chosen.has(this.sel) ? "Chosen by you." : this.mode === "free" ? "" : "Rolled by the Fates.";
      txt(px0, y + 4, tag, 11, "#c9b48f");
      if (this.mode !== "fates") button(px0 + 150, y + 4, this.chosen.has(this.sel) ? "Give it back to the Fates (roll)" : "Roll again", () => { this.chosen.delete(this.sel); this.rollTable(this.sel); this.draw(); }, true, 11);
    } else if (this.sel === 5) {
      txt(px0, y, `Points left: ${this.pointsLeft()} of ${YOUNG_ADULT.aretaiPoints}`, 14, this.pointsLeft() ? "#fbe39a" : "#9ad07a"); y += 24;
      ARETAI_ORDER.forEach((a, i) => {
        const v = this.aretai[a], b = this.bonus(a);
        txt(px0, y, `${a}`, 13); txt(px0 + 90, y, `${WHEEL[i].god}`, 10, "#c9b48f");
        button(px0 + 170, y, "−", () => { if (this.aretai[a] > 1 && this.mode !== "fates") { this.aretai[a]--; this.draw(); } }, this.mode !== "fates" && v > 1);
        txt(px0 + 190, y, `${v}`, 13).setOrigin(0.5, 0);
        button(px0 + 204, y, "+", () => { if (this.pointsLeft() > 0 && this.aretai[a] < ARETAI_MAX_AT_CREATION) { this.aretai[a]++; this.draw(); } }, this.mode !== "fates" && this.pointsLeft() > 0 && v < ARETAI_MAX_AT_CREATION);
        txt(px0 + 230, y, b ? `+${b}  =  ${Math.min(12, v + b)}` : `=  ${v}`, 13, b ? "#fbe39a" : "#f2e6c9");
        y += 20;
      });
    } else if (this.sel === 8) {
      const pos = Object.values(this.favor).filter((v) => v > 0).reduce((n, v) => n + v, 0), neg = Object.values(this.favor).filter((v) => v < 0).reduce((n, v) => n + v, 0);
      txt(px0, y, `Favor to give: +${this.favorPool() - pos}   Disfavor to take: ${-FAVOR_MINUS - neg}   (plus your sign: ${SIGNS[this.picks[0]].text})`, 12, "#fbe39a", { wordWrap: { width: pw } }); y += 34;
      WHEEL.forEach((w) => {
        const v = this.favor[w.god] ?? 0;
        txt(px0, y, w.god, 13);
        button(px0 + 170, y, "−", () => { if (v > 0 || neg > -FAVOR_MINUS) { this.favor[w.god] = v - 1; this.draw(); } }, this.mode !== "fates" && (v > 0 || neg > -FAVOR_MINUS));
        txt(px0 + 192, y, `${v > 0 ? "+" : ""}${v}`, 13, v > 0 ? "#fbe39a" : v < 0 ? "#e09080" : "#f2e6c9").setOrigin(0.5, 0);
        button(px0 + 208, y, "+", () => { if (v < 0 || pos < this.favorPool()) { this.favor[w.god] = v + 1; this.draw(); } }, this.mode !== "fates" && (v < 0 || pos < this.favorPool()));
        y += 20;
      });
    } else if (this.sel === 9) {
      txt(px0, y, `Points left: ${this.resLeft()} of ${RESOURCE_POINTS}`, 14, this.resLeft() ? "#fbe39a" : "#9ad07a"); y += 26;
      const br = BIRTHRIGHTS[this.picks[1]], as = ASTHENEIAI[this.picks[10]];
      const extra = { Wealth: (br.wealth ?? 0) + (as.wealth ?? 0), Health: (br.health ?? 0) + (as.health ?? 0), Stealth: br.stealth ?? 0 };
      const what = { Wealth: (n: number) => `${Math.max(0, n) * SILVER_PER_WEALTH} silver to start`, Health: (n: number) => `${6 * Math.max(2, n)} Vitality`, Stealth: (n: number) => `creatures notice you ${Math.abs((n - 4) * 4)}% ${n >= 4 ? "later" : "sooner"}` };
      for (const k of ["Wealth", "Health", "Stealth"] as const) {
        const v = this.res[k], total = v + extra[k];
        txt(px0, y, k, 14);
        button(px0 + 100, y, "−", () => { if (this.res[k] > 1) { this.res[k]--; this.draw(); } }, this.mode !== "fates" && v > 1);
        txt(px0 + 122, y, `${v}`, 14).setOrigin(0.5, 0);
        button(px0 + 138, y, "+", () => { if (this.resLeft() > 0 && this.res[k] < RESOURCE_MAX[k]) { this.res[k]++; this.draw(); } }, this.mode !== "fates" && this.resLeft() > 0 && v < RESOURCE_MAX[k]);
        txt(px0 + 170, y, `${extra[k] ? `${extra[k] > 0 ? "+" : ""}${extra[k]} = ${total}: ` : ""}${what[k](total)}`, 12, "#e0d2b4");
        y += 28;
      }
    } else {
      const info: Record<number, string> = {
        2: `${YOUNG_ADULT.name} (${YOUNG_ADULT.gift}): ${YOUNG_ADULT.thread} Life Thread, ${YOUNG_ADULT.aretaiPoints} Aretai points, ${YOUNG_ADULT.expertise} Expertise points.\nOther life stages come with childhood starts, aging and heirs.`,
        6: `${YOUNG_ADULT.expertise} Expertise points are waiting. Expertises arrive in a later build.`,
        7: "One Natural Thaumata, matching one of your two highest Aretai, arrives in a later build.",
      };
      txt(px0, y, info[this.sel] ?? "", 13, "#e0d2b4", { wordWrap: { width: pw } });
    }
    if (this.note) txt(px0, 520, this.note, 12, "#e09080", { wordWrap: { width: pw } });

    // Modes and the way forward.
    const by = H - 70;
    txt(40, by - 24, "How shall this life be made?", 13, "#c9b48f");
    ([["four", "Choose four, roll the rest"], ["fates", "Let the Fates decide"], ["free", "Choose freely"]] as const).forEach(([m, label], i) => {
      const b = button(40 + i * 205, by, `${this.mode === m ? "● " : "○ "}${label}`, () => { this.mode = m; if (m === "fates") this.rollAll(); if (m === "four") { while (this.chosen.size > 4) this.chosen.delete([...this.chosen][this.chosen.size - 1]); } this.note = ""; this.draw(); }, true, 13);
      if (this.mode === m) b.setColor("#f2c14e");
    });
    button(40, by + 28, "Roll everything again", () => { this.rollAll(); this.note = ""; this.draw(); }, true, 13);
    const ready = this.pointsLeft() === 0 && this.resLeft() === 0 && this.name.trim().length > 0;
    const begin = button(W - 220, by + 10, "Begin this life  ›", () => this.finish(), true, 20);
    if (!ready) begin.setColor("#8d877b");
    if (!ready) txt(W - 220, by + 40, this.pointsLeft() ? `Spend all your Aretai points (${this.pointsLeft()} left).` : this.resLeft() ? `Spend all your Resources (${this.resLeft()} left).` : "Give yourself a name.", 11, "#e09080");

    if (this.naming) this.drawNaming(root, txt, button);
  }

  stepValue(i: number): string {
    if (TABLES[i]) return i === 11 ? "hidden" : TABLES[i][this.picks[i]].name;
    if (i === 2) return YOUNG_ADULT.name;
    if (i === 5) return this.pointsLeft() ? `${this.pointsLeft()} to spend` : "spent";
    if (i === 8) { const best = Object.entries(this.favor).sort((a, b) => b[1] - a[1])[0]; return best && best[1] > 0 ? `${best[0]} +${best[1]}` : "—"; }
    if (i === 9) return `W${this.res.Wealth} H${this.res.Health} S${this.res.Stealth}`;
    return "later";
  }

  drawNaming(root: Phaser.GameObjects.Container, txt: (x: number, y: number, t: string, size?: number, color?: string, extra?: object) => Phaser.GameObjects.Text, button: (x: number, y: number, t: string, fn: () => void, on?: boolean, size?: number) => Phaser.GameObjects.Text) {
    const bg = this.add.rectangle(W / 2, H / 2, 560, 330, 0x1f1712, 0.98).setStrokeStyle(2, 0xc4703f).setInteractive(); root.add(bg);
    const x0 = W / 2 - 250, y0 = H / 2 - 150;
    txt(W / 2, y0, "Name & look", 20).setOrigin(0.5, 0);
    txt(x0, y0 + 40, "Name (type it; Enter when done):", 13, "#c9b48f");
    txt(x0, y0 + 60, `${this.name}_`, 22, "#fbe39a");
    button(x0 + 360, y0 + 66, "Another name", () => { this.name = NAMES[Math.floor(Math.random() * NAMES.length)]; this.draw(); }, true, 12);
    const row = (label: string, y: number, list: string[], key: "tunic" | "hair" | "skin") => {
      txt(x0, y, label, 13, "#c9b48f");
      list.forEach((c, i) => {
        const sw = this.add.rectangle(x0 + 90 + i * 34, y + 8, 26, 18, Phaser.Display.Color.HexStringToColor(c).color).setStrokeStyle(this.look[key] === c ? 3 : 1, this.look[key] === c ? 0xf2c14e : 0x6b4a2b)
          .setInteractive({ useHandCursor: true }).on("pointerdown", (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); this.look[key] = c; makePlayerTexture(this, this.look); this.draw(); });
        root.add(sw);
      });
    };
    row("Chiton", y0 + 110, TUNICS, "tunic"); row("Hair", y0 + 145, HAIRS, "hair"); row("Skin", y0 + 180, SKINS, "skin");
    const pi = this.add.image(x0 + 430, y0 + 160, "player", 0).setScale(4); root.add(pi);
    button(W / 2 - 30, y0 + 270, "Done", () => { this.naming = false; this.draw(); }, true, 18);
  }

  finish() {
    if (this.done) return;
    if (this.pointsLeft() !== 0 || this.resLeft() !== 0 || !this.name.trim()) { this.note = "Not yet: spend every point and give yourself a name."; this.draw(); return; }
    this.done = true;
    GameState.clearSave();
    const st = new GameState(), d = st.data;
    const sign = SIGNS[this.picks[0]], br = BIRTHRIGHTS[this.picks[1]], tr = TRAININGS[this.picks[3]];
    const ham = HAMARTIAI[this.picks[4]], ast = ASTHENEIAI[this.picks[10]], mor = MOROI[this.picks[11]];
    d.name = this.name.trim(); d.look = { ...this.look };
    d.aretai = Object.fromEntries(ARETAI_ORDER.map((a) => [a, Math.min(12, this.aretai[a] + this.bonus(a))]));
    st.essenceMax = essencePools(d.aretai); st.essence = { ...st.essenceMax };
    d.favor = {};
    for (const [god, v] of Object.entries({ ...sign.favor })) d.favor[god] = (d.favor[god] ?? 0) + v;
    for (const [god, v] of Object.entries(this.favor)) if (v) d.favor[god] = (d.favor[god] ?? 0) + v;
    for (const god of Object.keys(d.favor)) if (d.favor[god] >= 4) d.knownByName[god] = true;
    d.silver = Math.max(0, this.res.Wealth + (br.wealth ?? 0) + (ast.wealth ?? 0)) * SILVER_PER_WEALTH;
    d.health = this.res.Health + (br.health ?? 0) + (ast.health ?? 0);
    d.vitality = 6 * Math.max(2, d.health);
    d.stealth = Math.max(0, this.res.Stealth + (br.stealth ?? 0));
    if (ast.rel) { for (const id of Object.keys(VILLAGERS)) if (!ast.relWith || ast.relWith === id) st.npcRec(id).rel = ast.rel; }
    d.lifeThread = YOUNG_ADULT.thread;
    d.birth = { sign: sign.name, birthright: br.name, training: tr.name, hamartia: [ham.name, ham.text], astheneia: [ast.name, ast.text], moros: [mor.name, mor.text] };
    st.say(`${d.name}, ${sign.name.replace(/^The /, "born under the ")}, of the ${br.name.replace(/^The /, "")}, trained in ${tr.name.toLowerCase()}.`);
    startLife(this, st);
  }
}
const WC = { x: 250, y: 330, r0: 95, r1: 205 };

// ------------------------------------------------------------------ the homestead
const MW = 48, MH = 36;
const HUT = { tx: 22, ty: 7, w: 4 }; // in tiles
const DOOR = { tx: 24, ty: 10 };
const DOOR_X = HUT.tx * TILE + 32; // the door's centre in pixels
const WELL = { tx: 30, ty: 9 };
const PEN = { x0: 14, y0: 15, x1: 20, y1: 20, gateY: 17 }; // fence on the border, gate gap on the east side
const HIVE = { tx: 36, ty: 10 };
const inPen = (x: number, y: number) => x >= PEN.x0 && x <= PEN.x1 && y >= PEN.y0 && y <= PEN.y1;
/** Where Tiresias likes to sit (tiles): the olive's shade, the doorstep (at night and in the rain), the well, the hive, the pen fence, beside the vat. */
const TIR_SPOTS: [number, number, string][] = [[17, 10, "under the olive tree"], [22, 11, "on the doorstep"], [31, 11, "by the well"], [37, 12, "by the beehive"], [21, 19, "against the goat pen"], [22, 13, "beside the treading vat"], [18, 12, "at the foot of the other olive"]];
const TIR_DOOR = 1;
/** Where he keeps out of the rain: under either olive, or on your doorstep. */
const TIR_RAIN = [0, 6, TIR_DOOR];
/** He goes everywhere by the path in front of the hut: he knows it, and it keeps him off the fences. */
const TIR_HUB: [number, number] = [24, 12];
const d12 = () => 1 + Math.floor(Math.random() * 12);

class FarmScene extends PlayScene {
  map!: Phaser.Tilemaps.Tilemap;
  groundLayer!: Phaser.Tilemaps.TilemapLayer;
  objects!: Phaser.Tilemaps.TilemapLayer;
  baseGround: number[][] = [];
  goats: { a: Animal; g: Goat; t: Target }[] = [];
  fox: Animal | null = null;
  manger!: Phaser.GameObjects.Image;
  trough!: Phaser.GameObjects.Image;
  bees!: Phaser.GameObjects.Graphics;
  beeT = 0;
  cropSprites = new Map<string, Phaser.GameObjects.Image>();
  vine!: Phaser.GameObjects.Image;
  vat!: Phaser.GameObjects.Image;
  youngVines = new Map<string, Phaser.GameObjects.Image>();

  soft: Phaser.Tilemaps.TilemapLayer | null = null;
  constructor() { super("Farm"); }
  /** Tiles under the homestead's fixed structures, where nothing can be set down. */
  reserved = new Set<string>();
  placeKey() { return "farm"; }
  placeBlocked(tx: number, ty: number) {
    const k = `${tx},${ty}`;
    if (tx < 2 || ty < 2 || tx >= MW - 2 || ty >= MH - 2) return "Not at the very edge of your land.";
    if (inPen(tx, ty)) return "Not inside the goat pen.";
    if (this.baseGround[ty][tx] === T.PATH) return "Leave the path clear.";
    if ((this.objects.getTileAt(tx, ty)?.index ?? -1) !== -1) return "Clear the ground there first.";
    if (G.data.ground[k] || G.data.crops[k] || G.data.vines[k]) return "Not on worked soil.";
    if (this.reserved.has(k)) return "There's no room there.";
    return null;
  }

  create() {
    this.leaving = false;
    const r = rng(G.data.seed);
    const ground: number[][] = [], objs: number[][] = [];
    const cx = 24, cy = 14;
    for (let y = 0; y < MH; y++) {
      ground.push([]); objs.push([]);
      for (let x = 0; x < MW; x++) {
        const d = Math.hypot((x - cx) / 1.3, y - cy);
        ground[y].push(r() < 0.3 ? T.GRASS2 : T.GRASS);
        let o = -1;
        const edge = x < 2 || y < 2 || x >= MW - 2 || y >= MH - 2;
        const roll = r();
        if (edge) o = T.EDGE;
        else if (d > 8) {
          if (roll < 0.16) o = T.BRUSH; else if (roll < 0.21) o = T.SAPLING; else if (roll < 0.27) o = T.STONE;
          else if (roll < 0.35) o = T.TREE; else if (roll < 0.37) o = T.BOULDER; else if (roll < 0.41) o = T.FLOWERS;
        } else if (d > 6) {
          if (roll < 0.08) o = T.BRUSH; else if (roll < 0.1) o = T.STONE; else if (roll < 0.14) o = T.FLOWERS;
        }
        objs[y].push(o);
      }
    }
    // Openings: the road to the village (south) and the way into the wild (east).
    for (let y = MH - 2; y < MH; y++) for (let x = 23; x <= 25; x++) objs[y][x] = -1;
    for (let x = MW - 2; x < MW; x++) for (let y = 15; y <= 17; y++) objs[y][x] = -1;
    for (let y = DOOR.ty + 1; y < MH; y++) { ground[y][24] = T.PATH; objs[y][24] = -1; }
    for (let x = 25; x < MW; x++) { ground[16][x] = T.PATH; objs[16][x] = -1; }
    // The starting plot beside the hut, and a pair of old olive trees.
    for (let y = 12; y <= 15; y++) for (let x = 27; x <= 32; x++) { ground[y][x] = T.DIRT; objs[y][x] = -1; }
    objs[9][18] = T.OLIVE; objs[12][19] = T.OLIVE;
    for (let y = HUT.ty; y < HUT.ty + 5; y++) for (let x = HUT.tx - 2; x < HUT.tx + HUT.w + 1; x++) objs[y][x] = -1;
    for (let y = WELL.ty - 1; y <= WELL.ty + 1; y++) for (let x = WELL.tx - 1; x <= WELL.tx + 1; x++) objs[y][x] = -1;
    for (let y = 12; y <= 13; y++) for (let x = 20; x <= 21; x++) objs[y][x] = -1; // the treading vat
    for (const k of Object.keys(G.data.vines)) { const [x, y] = k.split(",").map(Number); if (objs[y]) objs[y][x] = -1; }
    // The goat pen west of the path, and the beehive among flowers to the east.
    for (let y = PEN.y0 - 1; y <= PEN.y1 + 1; y++) for (let x = PEN.x0 - 1; x <= PEN.x1 + 1; x++) objs[y][x] = -1;
    for (let y = HIVE.ty - 1; y <= HIVE.ty + 1; y++) for (let x = HIVE.tx - 1; x <= HIVE.tx + 1; x++) objs[y][x] = -1;
    for (const [x, y] of [[34, 10], [34, 12], [38, 11], [36, 13], [38, 9], [35, 8]]) objs[y][x] = T.FLOWERS;
    for (const k of G.data.cleared) { const [x, y] = k.split(",").map(Number); if (objs[y]) objs[y][x] = -1; }
    for (let y = PEN.y0; y <= PEN.y1; y++) for (let x = PEN.x0; x <= PEN.x1; x++) {
      const border = x === PEN.x0 || x === PEN.x1 || y === PEN.y0 || y === PEN.y1;
      objs[y][x] = border && !(x === PEN.x1 && y === PEN.gateY) ? T.FENCE : -1;
    }
    for (const [x, y] of TIR_SPOTS) objs[y][x] = -1; // Tiresias' seats are kept clear
    this.baseGround = ground.map((row) => [...row]);
    for (const [k, v] of Object.entries(G.data.ground)) { const [x, y] = k.split(",").map(Number); if (ground[y]) ground[y][x] = v === "wet" ? T.WET : T.TILLED; }

    this.map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MW, height: MH });
    const ts = this.map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    this.groundLayer = this.map.createBlankLayer("ground", ts)!;
    this.groundLayer.putTilesAt(ground, 0, 0);
    this.soft = softenPatches(this.map, this.groundLayer, ground, T.GRASS2, T.GRASS, seasonGroundTint(G));
    this.details = this.map.createBlankLayer("details", ts)!;
    this.objects = this.map.createBlankLayer("objects", ts)!;
    this.details.putTilesAt(scatterDetails(3, 0xfa53, objs, (x, y) => ground[y][x] !== this.baseGround[y][x] || ground[y][x] === T.PATH || inPen(x, y), 0.06), 0, 0);
    jitterLayer(this.details, true);
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(SOLID);
    this.objects.setDepth(1);
    varyLayers(G, this.groundLayer, this.objects);

    // The hut, the well, the storage jar and the signposts.
    const hut = this.add.image(HUT.tx * TILE, HUT.ty * TILE, "hut").setOrigin(0, 0).setDepth((HUT.ty + 3.4) * TILE);
    const solids = this.physics.add.staticGroup();
    this.reserved = new Set([`${Math.floor(DOOR_X / TILE)},${DOOR.ty + 1}`, ...TIR_SPOTS.map(([x, y]) => `${x},${y}`)]);
    const solid = (x: number, y: number, w: number, h: number) => {
      for (let ty = Math.floor((y - h / 2) / TILE); ty <= Math.floor((y + h / 2) / TILE); ty++)
        for (let tx = Math.floor((x - w / 2) / TILE); tx <= Math.floor((x + w / 2) / TILE); tx++) this.reserved.add(`${tx},${ty}`);
      const b = solids.create(x, y, "") as Phaser.Physics.Arcade.Sprite;
      b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    };
    solid(hut.x + 32, hut.y + 38, 56, 30);
    this.chimneys = [[hut.x + 46, hut.y + 6]];
    this.add.image(WELL.tx * TILE + 8, WELL.ty * TILE + 6, "well").setDepth(WELL.ty * TILE + 14);
    solid(WELL.tx * TILE + 8, WELL.ty * TILE + 10, 18, 10);
    const pithos = { x: (HUT.tx + 4.3) * TILE, y: (HUT.ty + 3) * TILE };
    this.add.image(pithos.x, pithos.y, "pithos").setDepth(pithos.y + 6);
    solid(pithos.x, pithos.y + 4, 10, 6);

    // The goats' manger and trough, and the hive.
    this.manger = this.add.image((PEN.x0 + 1) * TILE + 8, (PEN.y0 + 1) * TILE + 6, "manger", 0).setDepth((PEN.y0 + 1) * TILE + 10);
    solid(this.manger.x, this.manger.y + 2, 14, 8);
    this.trough = this.add.image((PEN.x1 - 1) * TILE + 8, (PEN.y0 + 1) * TILE + 6, "trough", 0).setDepth((PEN.y0 + 1) * TILE + 10);
    solid(this.trough.x, this.trough.y + 2, 14, 7);
    const hive = this.add.image(HIVE.tx * TILE + 8, HIVE.ty * TILE + 4, "hive").setDepth(HIVE.ty * TILE + 12);
    solid(hive.x, hive.y + 6, 12, 8);
    this.bees = this.add.graphics().setDepth(HIVE.ty * TILE + 13);

    // The old vine beside the hut, and whatever is growing in the soil.
    this.vine = this.add.image(20 * TILE + 8, 10 * TILE + 4, "vine", 0).setDepth(11 * TILE);
    solid(this.vine.x, this.vine.y + 8, 14, 6);
    this.cropSprites.clear();
    for (const k of Object.keys(G.data.crops)) this.drawCrop(k);
    this.vat = this.add.image(20 * TILE + 16, 13 * TILE + 2, "vat", 0).setOrigin(0.5, 1).setDepth(13 * TILE);
    solid(this.vat.x, this.vat.y - 6, 20, 8);
    this.youngVines.clear();
    for (const k of Object.keys(G.data.vines)) this.drawYoungVine(k);

    const signs = [
      { tx: 22, ty: MH - 3, text: "South: the road to the village, and beyond it, the wild." },
      { tx: MW - 3, ty: 14, text: "East: the wild lands, where the land changes as you go. Mind the hour: night falls hard out there." },
    ];
    for (const s of signs) {
      this.add.image(s.tx * TILE + 8, s.ty * TILE + 8, "sign").setDepth(s.ty * TILE + 12);
      this.objects.putTileAt(-1, s.tx, s.ty); solid(s.tx * TILE + 8, s.ty * TILE + 13, 4, 4);
    }

    const at = (tx: number, ty: number) => ({ x: tx * TILE + 8, y: ty * TILE + 8 });
    const farm = this;
    this.targets = [
      { x: DOOR_X, y: (DOOR.ty + 1) * TILE, label: "Enter the hut", act: () => this.enterHouse() },
      { ...at(WELL.tx, WELL.ty), label: "Look at the well", act: () => G.say("A stone-lined well. With your water jar in hand, press Space here to fill it.") },
      { x: pithos.x, y: pithos.y + 6, label: "Trade with the miller's cart", act: () => ui(this).openMarket() },
      { x: this.vat.x, y: this.vat.y - 2, get label() { return farm.vatLabel(); }, act: () => this.useVat() },
      { x: this.vine.x, y: this.vine.y + 4, get label() { return G.data.month === 1 && G.data.vineYear !== G.data.year ? "Pick grapes" : "Look at the vine"; }, act: () => this.tendVine() },
      { ...at(18, 9), get label() { return farm.olivesReady("18,9") ? "Pick olives" : "Look at the olive tree"; }, act: () => this.pickOlives("18,9", "An old olive tree, Athena's gift. Its fruit ripens in autumn.") },
      { ...at(19, 12), get label() { return farm.olivesReady("19,12") ? "Pick olives" : "Look at the olive tree"; }, act: () => this.pickOlives("19,12", "An old olive tree, gnarled and patient. Its fruit ripens in autumn.") },
      ...signs.map((s) => ({ ...at(s.tx, s.ty), label: "Read the sign", act: () => G.say(s.text) })),
      { x: this.manger.x, y: this.manger.y + 4, get label() { return `Fill the manger with fodder (${G.data.manger}/${MANGER_MAX})`; }, act: () => this.fillManger() },
      { x: this.trough.x, y: this.trough.y + 4, get label() { return `Fill the trough from your jar (${G.data.trough}/${TROUGH_MAX})`; }, act: () => this.fillTrough() },
      { x: hive.x, y: hive.y + 6, get label() { return G.dayNumber - G.data.hiveDay >= HIVE_DAYS ? "Take honey from the hive" : "Look at the hive"; }, act: () => this.tendHive() },
    ];

    this.physics.world.setBounds(0, 0, MW * TILE, MH * TILE);
    this.cameras.main.setBounds(0, 0, MW * TILE, MH * TILE);
    this.setupInput();
    const fromHouse = G.data.scene === "House";
    let sx = fromHouse ? DOOR_X : G.data.px, sy = fromHouse ? (DOOR.ty + 1) * TILE + 8 : G.data.py;
    if (G.data.entry === "E") { sx = (MW - 1.5) * TILE; sy = 16 * TILE + 8; }
    if (G.data.entry === "S") { sx = 24 * TILE + 8; sy = (MH - 1.5) * TILE; }
    G.data.entry = "";
    G.data.scene = "Farm";
    this.makePlayer(sx, sy);
    this.ambience = new Ambience(this, G, { outdoor: true, terrain: 3, layer: this.objects, chimneys: this.chimneys });
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();
    this.physics.add.collider(this.player, solids);
    // Forage grows in the rough ground at the edges of the homestead.
    this.placeForage(rng(G.data.seed ^ 0x51f0a9e), HOME_TERRAIN, 6, (x, y) =>
      x < MW - 2 && y < MH - 2 && Math.hypot((x - 24) / 1.3, y - 14) > 9 && objs[y][x] === -1 && this.baseGround[y][x] !== T.PATH && !inPen(x, y));
    this.spawnAnimals(r, objs);
    this.drawPlaced();
    this.refreshFences();
    this.setupTiresias(solids);
    this.cameras.main.fadeIn(250);
  }

  // ---------------------------------------------------------------- Tiresias
  tir!: { s: Phaser.Physics.Arcade.Sprite; goal: number | null; via: boolean; walkT: number; nodT: number; moveIn: number; callAt: number; facing: number };
  setupTiresias(_solids: Phaser.Physics.Arcade.StaticGroup) {
    const t = G.data.tir;
    if (!G.isDay) t.spot = TIR_DOOR;
    else if (G.data.weather === "rain" && !TIR_RAIN.includes(t.spot)) t.spot = TIR_RAIN[Math.floor(Math.random() * TIR_RAIN.length)];
    const [tx, ty] = TIR_SPOTS[t.spot] ?? TIR_SPOTS[0];
    const s = this.physics.add.sprite(tx * TILE + 8, ty * TILE + 8, "tiresiasSit", 0);
    s.setSize(10, 6).setOffset(3, 9).setImmovable(true).setDepth(ty * TILE + 8);
    this.physics.add.collider(this.player, s);
    this.tir = { s, goal: null, via: false, walkT: 0, nodT: 0, moveIn: 60 + Math.random() * 90, callAt: 0, facing: 0 };
    const farm = this;
    this.targets.push({ get x() { return farm.tir.s.x; }, get y() { return farm.tir.s.y + 4; }, get label() { return G.data.tir.met ? "Talk to Tiresias" : "Speak to the old man"; }, act: () => ui(this).talkTiresias() });
  }
  /** What he would call out to you now. */
  tirCall(): string {
    const t = G.data.tir, step = TIRESIAS[t.step], pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    if (!t.met) return pick(TIR_CALLS.first);
    if (step && t.said === t.step && ui(this).tirReady()) return pick(TIR_CALLS.ready);
    if (step && t.said !== t.step) return ui(this).tirCanAsk() ? pick(TIR_CALLS.ask) : pick(TIR_CALLS.waiting);
    if (!G.isDay) return pick(TIR_CALLS.night);
    if (G.data.weather === "rain" && Math.random() < 0.5) return pick(TIR_CALLS.rain);
    return pick(step ? TIR_CALLS.idle : TIR_CALLS.done);
  }
  tiresiasTick(dt: number) {
    const T0 = this.tir, s = T0.s, t = G.data.tir;
    // Night and rain send him to the doorstep; by day, now and then, he gets up and shuffles to another seat.
    const night = !G.isDay, rain = G.data.weather === "rain", shelter = night || rain;
    const near = Math.hypot(this.player.x - s.x, this.player.y - s.y);
    if (T0.goal === null) {
      T0.moveIn -= dt;
      if (night && t.spot !== TIR_DOOR) T0.goal = TIR_DOOR;
      else if (rain && !night && !TIR_RAIN.includes(t.spot)) { // the nearest dry seat: the olives' shade or the eaves
        const d = (i: number) => Math.hypot(TIR_SPOTS[i][0] * TILE - s.x, TIR_SPOTS[i][1] * TILE - s.y);
        T0.goal = [...TIR_RAIN].sort((a, b) => d(a) - d(b))[0];
      }
      else if (!shelter && T0.moveIn <= 0 && near > 40) {
        let g = t.spot; while (g === t.spot || g === TIR_DOOR) g = Math.floor(Math.random() * TIR_SPOTS.length);
        T0.goal = g;
      }
      if (T0.goal !== null) { T0.via = true; s.setTexture("tiresias", 0); if (near < 90) this.tirBubble(rain && !night ? (T0.goal === TIR_DOOR ? "Rain! To your eaves, old man." : "Rain! Under the olive, quick as I can.") : T0.goal === TIR_DOOR ? "Time I was indoors... near enough." : "My old bones want another seat."); }
    }
    if (T0.goal !== null) {
      const [gx, gy] = T0.via ? TIR_HUB : TIR_SPOTS[T0.goal], x = gx * TILE + 8, y = gy * TILE + 8, dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
      if (d < 1.5 && T0.via) T0.via = false;
      else if (d < 1.5) {
        s.setPosition(x, y).setVelocity(0, 0).setTexture("tiresiasSit", 0);
        t.spot = T0.goal; T0.goal = null; T0.moveIn = 90 + Math.random() * 120;
      } else {
        const sp = 9; // an old man with a staff
        s.setVelocity((dx / d) * sp, (dy / d) * sp);
        T0.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
        T0.walkT += dt;
        s.setFrame(T0.facing * POSES + [POSE.walk1, POSE.stand, POSE.walk2, POSE.stand][Math.floor(T0.walkT / 0.3) % 4]);
      }
    } else {
      s.setVelocity(0, 0);
      T0.nodT += dt; s.setFrame(Math.floor(T0.nodT / 2.6) % 3 === 2 ? 1 : 0); // dozing, the head dips now and then
    }
    s.setDepth(s.y);
    // When you come near, he calls out: what he needs, or just whatever is on his mind.
    if (near < 64 && this.time.now > T0.callAt && !ui(this).talkPanel) { T0.callAt = this.time.now + 22000 + Math.random() * 14000; this.tirBubble(this.tirCall()); }
  }
  tirBubble(text: string) {
    const s = this.tir.s;
    const b = this.add.text(s.x, s.y - 11, text, { fontFamily: FONT, fontSize: "6px", color: "#2a1d14", backgroundColor: "#f2e6c9", padding: { x: 2, y: 1 }, wordWrap: { width: 96 } })
      .setOrigin(0.5, 1).setResolution(5).setDepth(99990);
    this.tweens.add({ targets: b, alpha: 0, delay: 3200, duration: 500, onComplete: () => b.destroy() });
    const follow = this.time.addEvent({ delay: 30, loop: true, callback: () => { if (!b.active) { follow.remove(); return; } b.setPosition(s.x, s.y - 11); } });
  }

  /** The old olive trees bear once a year, in autumn. */
  olivesReady(k: string) { return G.month.season === "Autumn" && G.data.olives[k] !== G.data.year; }
  pickOlives(k: string, look: string) {
    if (!this.olivesReady(k)) { G.say(G.data.olives[k] === G.data.year ? "You've stripped this tree for the year." : look); return; }
    const b = labor(EFFORT.gather * 2, 1, "Oikos"); if (b === null) return;
    G.data.olives[k] = G.data.year;
    G.say(`You beat the branches with a stick and gather the fallen olives: ${give("Olives", 6 + mastery("olive", 2))}.${b} A press would turn them to oil.`);
  }

  /** Can a creature stand on this spot? */
  free(x: number, y: number) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 2 || ty < 2 || tx >= MW - 2 || ty >= MH - 2 || inPen(tx, ty)) return false;
    const o = this.objects.getTileAt(tx, ty)?.index ?? -1;
    return o === -1 || o === T.FLOWERS;
  }

  spawnAnimals(r: () => number, objs: number[][]) {
    this.animals = []; this.goats = []; this.fox = null;
    // The goats live in the pen.
    const penHome = new Phaser.Geom.Rectangle((PEN.x0 + 1) * TILE + 6, (PEN.y0 + 2) * TILE + 2, (PEN.x1 - PEN.x0 - 1) * TILE - 12, (PEN.y1 - PEN.y0 - 2) * TILE - 10);
    G.data.goats.forEach((g, i) => {
      const a = new Animal(this, "goat", penHome.x + 10 + i * 34, penHome.y + 12 + i * 10, penHome);
      a.sprite.setTint(g.tint);
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      this.animals.push(a);
      const t: Target = { x: 0, y: 0, label: "", act: () => this.tendGoat(g, a) };
      this.goats.push({ a, g, t });
      this.targets.push(t);
    });
    // Wild creatures keep to the rough ground at the edges of the homestead.
    const spots: [number, number][] = [];
    for (let y = 3; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) {
      const d = Math.hypot((x - 24) / 1.3, y - 14);
      if (d > 9 && (objs[y][x] === -1 || objs[y][x] === T.FLOWERS) && !inPen(x, y) && this.baseGround[y][x] !== T.PATH) spots.push([x, y]);
    }
    const pick = () => spots[Math.floor(r() * spots.length)];
    const free = (x: number, y: number) => this.free(x, y);
    for (let i = 0; i < 3; i++) {
      const [x, y] = pick();
      const a = new Animal(this, "hare", x * TILE + 8, y * TILE + 8, new Phaser.Geom.Rectangle(x * TILE - 64, y * TILE - 64, 128, 128), free);
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      this.animals.push(a);
    }
    for (let f = 0; f < 2; f++) {
      const [x, y] = pick();
      const flock: Animal[] = [];
      for (let i = 0; i < 3; i++) {
        const a = new Animal(this, "bird", x * TILE + 4 + i * 6, y * TILE + 6 + (i % 2) * 5, new Phaser.Geom.Rectangle(x * TILE - 120, y * TILE - 90, 240, 180), free);
        flock.push(a); this.animals.push(a);
      }
      flock.forEach((a) => (a.flock = flock));
    }
  }

  /** At dusk a fox comes out of the brush on the wild side of the farm. */
  maybeFox() {
    if (this.fox || G.data.clock < G.daylight - 1.2) return;
    for (let tries = 0; tries < 40; tries++) {
      const tx = 38 + Math.floor(Math.random() * 7), ty = 6 + Math.floor(Math.random() * 24);
      if (!this.free(tx * TILE + 8, ty * TILE + 8)) continue;
      const a = new Animal(this, "fox", tx * TILE + 8, ty * TILE + 8, new Phaser.Geom.Rectangle(30 * TILE, 4 * TILE, 15 * TILE, 28 * TILE), (x, y) => this.free(x, y));
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      this.animals.push(a); this.fox = a;
      G.say("A fox slips out of the brush at the edge of the fields.");
      return;
    }
  }

  heart(x: number, y: number, text = "♥", color = "#e85f7a") {
    const t = this.add.text(x, y - 10, text, { fontFamily: FONT, fontSize: "9px", color }).setOrigin(0.5).setResolution(3).setDepth(9999);
    this.tweens.add({ targets: t, y: y - 22, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
  }

  goatLabel(g: Goat) {
    if (g.pettedDay !== G.dayNumber) return `Pet ${g.name}`;
    if (g.fed && g.milkedDay !== G.dayNumber) return `Milk ${g.name}`;
    return g.name;
  }

  tendGoat(g: Goat, a: Animal) {
    const today = G.dayNumber;
    if (g.pettedDay !== today) {
      g.pettedDay = today; g.affection = Math.min(10, g.affection + 1);
      this.heart(a.sprite.x, a.sprite.y);
      G.say(`${g.name} leans into your hand. (Affection ${g.affection}/10)`);
    } else if (g.fed && g.milkedDay !== today && (G.data.divine.day[`sick_${g.name}`] ?? 0) > today) {
      G.say(`${g.name} is sick and off her milk. Hera's displeasure is on your household.`);
    } else if (g.fed && g.milkedDay !== today) {
      g.milkedDay = today; G.addFatigue(1);
      const n = g.affection >= (G.lore("goat") >= 3 ? 5 : 6) ? 2 : 1;
      G.say(`You milk ${g.name}: ${give("Milk", n)}${n > 1 ? " (a contented goat gives more)" : ""}`);
    } else {
      G.say(`${g.name} · affection ${g.affection}/10 · ${g.fed ? "ate and drank well last night; milked today" : "went hungry last night, so no milk today"}.`);
    }
  }

  fillManger() {
    if (G.data.manger >= MANGER_MAX) { G.say("The manger is full."); return; }
    const fiber = G.removeItem("Fiber", MANGER_MAX - G.data.manger);
    const oats = G.removeItem("Oats", MANGER_MAX - G.data.manger - fiber);
    const n = fiber + oats;
    if (!n) { G.say("You have no fodder. Cut brush with the sickle for fiber, or gather wild oats."); return; }
    G.data.manger += n;
    G.say(`You fork ${[fiber && `${fiber} fiber`, oats && `${oats} wild oats`].filter(Boolean).join(" and ")} into the manger. Each goat eats one a night.`);
  }

  fillTrough() {
    if (G.data.trough >= TROUGH_MAX) { G.say("The trough is full."); return; }
    if (!G.count("jar") || G.data.jarWater <= 0) { G.say("Your water jar is empty. Fill it at the well."); return; }
    const n = Math.min(G.data.jarWater, TROUGH_MAX - G.data.trough);
    G.data.jarWater -= n; G.data.trough += n;
    G.say(`You pour water into the trough (${G.data.trough}/${TROUGH_MAX}). Each goat drinks one a night.`);
  }

  tendHive() {
    const ready = G.dayNumber - G.data.hiveDay >= HIVE_DAYS;
    if (!G.isDay) { G.say("The hive hums softly. The bees are asleep."); return; }
    if (!ready) { const left = HIVE_DAYS - (G.dayNumber - G.data.hiveDay); G.say(`The bees are busy. New comb in ${left} day${left > 1 ? "s" : ""}.`); return; }
    G.data.hiveDay = G.dayNumber;
    let flowers = 0;
    for (let y = HIVE.ty - 5; y <= HIVE.ty + 5; y++) for (let x = HIVE.tx - 5; x <= HIVE.tx + 5; x++) if (this.objects.getTileAt(x, y)?.index === T.FLOWERS) flowers++;
    const honey = (flowers >= 4 ? 2 : 1) + mastery("bees");
    const got = `${give("Honey", honey)}, ${give("Wax", 1)}`;
    const calm = G.patron?.aretai === "Oikos";
    if (!calm && d12() <= 3) { G.addFatigue(6); this.cameras.main.shake(100, 0.003); G.say(`A bee stings you! ${got}. (In Demeter's hour the bees stay calm.)`); }
    else G.say(`You lift out the comb${calm ? " in Demeter's hour, and the bees let you be" : ""}: ${got}${honey > 1 ? " (the flowers nearby feed them well)" : ""}.`);
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    for (const { a, g, t } of this.goats) { t.x = a.sprite.x; t.y = a.sprite.y + 4; t.label = this.goatLabel(g); }
    this.updateAnimals(dt);
    this.manger.setFrame(G.data.manger > 0 ? 1 : 0);
    this.vine.setFrame(G.data.month === 1 && G.data.vineYear !== G.data.year ? 1 : 0);
    const v = G.data.vat;
    this.vat.setFrame(!v.repaired ? 0 : v.sealed >= 0 ? 3 : v.must > 0 ? 2 : 1);
    for (const [k, img] of this.youngVines) img.setFrame(this.vineBearing(k) ? 1 : 0);
    this.trough.setFrame(G.data.trough > 0 ? 1 : 0);
    this.drawBees(dt);
    if (!this.common(dt)) return;
    this.tiresiasTick(dt);
    this.noumeniaVisit([[26, 13], [21, 12], [29, 12]], 0.45, 1, "It is the night of Noumenia. A shade has come up to your hut, and stands by the door as if it once lived here.");
    this.maybeFox();
    // Walking off the east or south edge leads into the wild.
    if (this.knock > 0) return;
    if (this.player.x > MW * TILE - 7) this.leaveFor(1, 0, "W");
    else if (this.player.y > MH * TILE - 12) this.toVillage();
    // Walking up into the doorway enters the hut.
    const pty = Math.floor((this.player.y + 4) / TILE);
    if (Math.abs(this.player.x - DOOR_X) < 10 && pty <= DOOR.ty + 1 && this.facing === 3 && (this.keys.W.isDown || this.cursors.up.isDown) && this.player.y < (DOOR.ty + 1) * TILE + 6) {
      this.enterHouse();
    }
  }

  drawBees(dt: number) {
    const g = this.bees; g.clear();
    if (!G.isDay) return;
    this.beeT += dt;
    const cx = HIVE.tx * TILE + 8, cy = HIVE.ty * TILE + 2;
    g.fillStyle(0xf2c14e);
    for (let i = 0; i < 6; i++) {
      const k = 1 + i * 0.37;
      g.fillRect(Math.round(cx + Math.cos(this.beeT * 2.1 * k + i) * (7 + i * 2)), Math.round(cy - 4 + Math.sin(this.beeT * 3.3 * k + i * 2) * (4 + i)), 1, 1);
    }
  }

  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }
  picked() { return G.data.farmPicked; }

  ripeAt(c: CropRec) { const d = CROPS[c.id]; return c.picks > 0 && d.regrow ? d.regrow : d.days; }
  isRipe(c: CropRec) { return !c.withered && c.growth >= this.ripeAt(c); }

  drawCrop(k: string) {
    const c = G.data.crops[k];
    let img = this.cropSprites.get(k);
    if (!c) { img?.destroy(); this.cropSprites.delete(k); return; }
    const [x, y] = k.split(",").map(Number);
    const at = this.ripeAt(c);
    const frame = c.withered ? "withered" : `${c.id}_${c.growth >= at ? 3 : c.picks > 0 ? 2 : c.growth === 0 ? 0 : c.growth < at / 2 ? 1 : 2}`;
    if (!img) { img = this.add.image(x * TILE + 8, y * TILE + 8, "crops", frame).setDepth(y * TILE + 10); this.cropSprites.set(k, img); }
    else img.setFrame(frame);
  }

  /** Space on a planted tile: harvest it, clear it, or say how it's doing. Returns true if handled. */
  workCrop(x: number, y: number, tool: string | null): boolean {
    const k = `${x},${y}`, c = G.data.crops[k];
    if (!c) return false;
    const d = CROPS[c.id];
    if (c.withered) { delete G.data.crops[k]; this.drawCrop(k); G.say(`You pull up the withered ${d.name.toLowerCase()}.`); return true; }
    if (this.isRipe(c)) {
      const q = Math.min(3, 1 + (c.dryNights === 0 ? 1 : 0) + (c.hourBonus ? 1 : 0) + (c.nymph ? 1 : 0) + (c.sign ? 1 : 0));
      const reap = G.signActive("reap") ? 1 : 0; // the Pleiades are up, or the snail has climbed
      if (reap) G.say("Reaped in its season, as the signs say: an extra measure.");
      const dem = G.boon("Demeter"); // Demeter's favor (or anger) at the harvest
      const extra = dem !== 0 && Math.random() < 0.15 * Math.abs(dem) ? Math.sign(dem) : 0;
      const got = give(d.id, Math.max(1, d.yield + mastery(d.id) + extra + reap), q);
      if (extra > 0) G.say("Demeter is generous: an extra measure.");
      if (d.regrow) { c.picks++; c.growth = 0; c.dryNights = 0; c.dryStreak = 0; G.say(`You pick the ${d.name.toLowerCase()}: ${got}. It will be ready again in ${d.regrow} nights.`); }
      else { delete G.data.crops[k]; G.say(`You harvest the ${d.name.toLowerCase()}: ${got}${q === 3 ? ". A splendid crop!" : ""}`); }
      this.drawCrop(k);
      return true;
    }
    if (tool === "jar") return false; // watering goes ahead as usual
    const wet = G.data.ground[k] === "wet";
    G.say(`${d.name}: ${c.growth} of ${this.ripeAt(c)} nights grown.${wet ? " Watered today." : " It needs water today."}`);
    return true;
  }

  plant(x: number, y: number, seed: string) {
    const k = `${x},${y}`, crop = seed.slice(5), d = CROPS[crop];
    if (!G.data.ground[k]) { G.say("Seeds need tilled soil. Break the ground with the hoe first."); return; }
    if (!d.seasons.includes(G.month.season)) { G.say(`It isn't the season for ${d.name.toLowerCase()}.`); return; }
    const b = labor(EFFORT.plant, 1, "Oikos"); if (b === null) return;
    G.removeItem(seed, 1);
    const hour = d.aretai === "Night" ? !G.isDay : G.patron?.aretai === d.aretai;
    const signed = G.signActive("sow");
    G.note("sow");
    G.data.crops[k] = { id: crop, growth: 0, dryNights: 0, dryStreak: 0, hourBonus: hour, withered: false, picks: 0, sign: signed };
    this.drawCrop(k);
    if (signed) G.say("Sown in the season the signs proclaim, it will grow finer.");
    G.say(`You sow ${d.name.toLowerCase()}.${hour ? ` Sown in ${d.aretai === "Night" ? "the night, Hades' time" : `${d.god}'s hour`}, it will grow finer.` : ""}${G.data.ground[k] === "wet" ? "" : " Water it today."}`);
  }

  /** Grapes picked in Dionysus' hour, or by one he favors, are finer. */
  grapeQuality() { return Math.min(3, 1 + (G.patron?.aretai === "Pneuma" ? 1 : 0) + (G.boon("Dionysus") >= 1 ? 1 : 0) + (G.signActive("vintage") ? 1 : 0)); }

  vineBearing(k: string) { const v = G.data.vines[k]; return !!v && G.data.month === 1 && G.dayNumber - v.planted >= VINE_BEARS_AFTER && v.picked !== G.data.year; }

  drawYoungVine(k: string) {
    const [x, y] = k.split(",").map(Number);
    const img = this.add.image(x * TILE + 8, y * TILE + 14, "vine", 0).setOrigin(0.5, 1).setScale(0.75).setDepth(y * TILE + 12);
    this.youngVines.set(k, img);
  }

  /** Space on a young vine: pick it when it bears, otherwise say how it's doing. */
  workVine(x: number, y: number): boolean {
    const k = `${x},${y}`, v = G.data.vines[k];
    if (!v) return false;
    if (this.vineBearing(k)) { v.picked = G.data.year; G.say(`You pick your young vine: ${give("Grapes", YOUNG_VINE_YIELD + mastery("vine", 2) + (G.signThisYear("swallow") ? 2 : 0), this.grapeQuality())}.`); return true; }
    const left = VINE_BEARS_AFTER - (G.dayNumber - v.planted);
    G.say(v.picked === G.data.year ? "You've picked this vine for the year." : left > 0 ? `A young vine, taking root. It needs ${left} more day${left > 1 ? "s" : ""} before it can bear, and bears only in Metageitnion.` : "A young vine, well rooted. It will bear in Metageitnion.");
    return true;
  }

  plantCutting(x: number, y: number) {
    const k = `${x},${y}`;
    if (!G.data.ground[k]) { G.say("Plant the cutting in tilled soil."); return; }
    if (G.data.crops[k] || G.data.vines[k]) { G.say("Something is already growing there."); return; }
    const b = labor(EFFORT.plantCutting, 2, "Oikos"); if (b === null) return;
    G.removeItem("Cutting", 1);
    G.data.vines[k] = { planted: G.dayNumber, picked: -1 };
    this.drawYoungVine(k);
    G.say(`You plant the vine cutting and firm the earth around it. In ${VINE_BEARS_AFTER} days it will have rooted, and it bears in Metageitnion.${b}`);
  }

  vatLabel() {
    const v = G.data.vat;
    if (!v.repaired) return `Repair the treading vat (${VAT_REPAIR.map(([i, n]) => `${n} ${ITEMS[i].name.toLowerCase()}`).join(", ")})`;
    if (v.sealed >= 0) { const left = FERMENT_DAYS - (G.dayNumber - v.sealed); return left > 0 ? `The wine is working (${left} day${left > 1 ? "s" : ""})` : "Draw off the wine"; }
    return G.count("Grapes") + G.count("WildGrapes") >= GRAPES_PER_MUST ? "Tread your grapes in the vat" : "The treading vat (bring grapes)";
  }

  useVat() {
    const v = G.data.vat;
    if (!v.repaired) {
      const missing = VAT_REPAIR.filter(([i, n]) => G.count(i) < n);
      if (missing.length) { G.say(`An old stone treading vat, cracked and overgrown. To repair it you need ${VAT_REPAIR.map(([i, n]) => `${n} ${ITEMS[i].name.toLowerCase()}`).join(" and ")}.`); return; }
      const b = labor(EFFORT.repair, 6, "Techne"); if (b === null) return;
      for (const [i, n] of VAT_REPAIR) G.removeItem(i, n);
      v.repaired = true; this.breakFx(20, 12, T.STONE);
      G.say(`You patch the cracks and clear the drain. The treading vat is whole again.${b}`);
      return;
    }
    if (v.sealed >= 0) {
      const left = FERMENT_DAYS - (G.dayNumber - v.sealed);
      if (left > 0) { G.say(`The must is working in the sealed jars. ${left} more day${left > 1 ? "s" : ""}. You can hear it, faintly, if you lean close.`); return; }
      const got = give("Wine", v.must, v.q);
      v.must = 0; v.sealed = -1;
      G.say(`You unseal the jars and draw off the wine: ${got}. Dionysus' gift.`);
      if (!G.data.lore.tier.vine || G.data.lore.tier.vine < 2) { G.data.lore.tier.vine = 2; G.say("You understand the vine better now: Deep."); }
      return;
    }
    const grapes = G.count("Grapes"), wild = G.count("WildGrapes");
    if (grapes + wild < GRAPES_PER_MUST) { G.say(`Tread at least ${GRAPES_PER_MUST} clusters of grapes at a time. The old vine bears in Metageitnion; wild vines too.`); return; }
    if (G.exhausted) { G.say("You are too exhausted to tread grapes. Rest."); return; }
    ui(this).rhythm("Treading the grapes", "Aiolos and Dionysus: stamp on the beat. Press Space as the mark crosses the gold.", 5, (score) => this.treadDone(score));
  }

  /** Must from the treading, then sealed to ferment. Quality: the grapes, the treading, and Dionysus' hour. */
  treadDone(score: number) {
    const v = G.data.vat;
    // Weigh the grapes' quality: wild grapes are poor stuff for wine.
    let n = 0, qsum = 0;
    for (const s of G.data.slots) if (s && (s.id === "Grapes" || s.id === "WildGrapes")) { n += s.qty; qsum += s.qty * (s.id === "WildGrapes" ? 0.5 : s.q ?? 1); }
    const must = Math.floor(n / GRAPES_PER_MUST);
    let take = must * GRAPES_PER_MUST;
    for (const id of ["WildGrapes", "Grapes"]) { const t = G.removeItem(id, take); take -= t; }
    const base = qsum / Math.max(1, n);
    const great = score >= 11, dion = G.patron?.aretai === "Pneuma";
    const q = Math.max(1, Math.min(3, Math.round(base) + (great ? 1 : 0) + (dion ? 1 : 0) - (score <= 4 ? 1 : 0)));
    G.addFatigue(6);
    v.must = must; v.q = q; v.sealed = G.dayNumber;
    G.say(`You tread the grapes until your legs are purple to the knee: ${must} measure${must > 1 ? "s" : ""} of must, sealed in jars to work for ${FERMENT_DAYS} days.${great ? " A fine treading." : score <= 4 ? " A clumsy treading; the must is muddied." : ""}${dion ? " In Dionysus' hour, the god himself seems to stamp with you." : ""} It will be ${QUALITY[q]} wine.`);
  }

  tendVine() {
    if (G.data.month !== 1) { G.say(`An old vine, older than you. Its grapes ripen in Metageitnion.`); return; }
    if (G.data.vineYear === G.data.year) { G.say("You've picked the vine clean this year."); return; }
    G.data.vineYear = G.data.year;
    const q = this.grapeQuality();
    G.say(`You cut the heavy clusters from the old vine: ${give("Grapes", 12 + mastery("vine", 4) + 2 * Math.max(0, G.boon("Dionysus")) + (G.signThisYear("swallow") ? 2 : 0), q)}. Tread them in the vat for wine.`);
  }

  subjectAt(): string | null {
    const [x, y] = this.facingTile();
    const crop = G.data.crops[`${x},${y}`];
    if (crop) return crop.id;
    if (x === HIVE.tx && (y === HIVE.ty || y === HIVE.ty + 1)) return "bees";
    if ((x === 20 && (y === 10 || y === 11)) || G.data.vines[`${x},${y}`]) return "vine";
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (OBJ_SUBJECT[obj]) return OBJ_SUBJECT[obj];
    return obj === -1 ? "t3" : null;
  }

  toVillage() {
    if (this.leaving) return;
    G.data.entry = "N"; G.data.scene = "Village";
    this.goTo("Village");
  }

  leaveFor(wx: number, wy: number, entry: "N" | "W") {
    if (this.leaving) return;
    G.data.wx = wx; G.data.wy = wy; G.data.entry = entry; G.data.entryAt = null; G.data.lastTerrain = HOME_TERRAIN; G.data.scene = "Wild";
    this.goTo("Wild");
  }

  enterHouse() {
    if (this.leaving) return;
    G.data.scene = "House";
    G.data.px = -1; G.data.py = -1; // the hut places us just inside the door
    this.goTo("House");
  }

  details?: Phaser.Tilemaps.TilemapLayer;
  chimneys: [number, number][] = [];
  setGround(x: number, y: number, state: "tilled" | "wet" | null) {
    if (state) this.details?.removeTileAt(x, y);
    const k = `${x},${y}`;
    if (state) G.data.ground[k] = state; else delete G.data.ground[k];
    if (state) G.note(state === "wet" ? "water" : "till");
    this.groundLayer.putTileAt(state === "wet" ? T.WET : state === "tilled" ? T.TILLED : this.baseGround[y][x], x, y).tint = seasonGroundTint(G);
    this.soft?.removeTileAt(x, y); // worked soil shows through any soft grass edge
  }

  clearObject(x: number, y: number) {
    this.breakFx(x, y, this.objects.getTileAt(x, y)?.index ?? -1);
    this.objects.putTileAt(-1, x, y);
    G.data.cleared.push(`${x},${y}`);
  }

  useItem() {
    const [x, y] = this.facingTile();
    if (x < 0 || y < 0 || x >= MW || y >= MH) return;
    const item = G.selectedItem;
    const tool = item && ITEMS[item.id].kind === "tool" ? item.id : null;
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    const soil = G.data.ground[`${x},${y}`];
    const isWell = x === WELL.tx && (y === WELL.ty || y === WELL.ty + 1);
    if (this.tryStrike(tool)) return;
    if (tool !== "hoe" && tool !== "jar" && this.gather(x, y, tool)) return;
    if (tool !== "hoe" && tool !== "jar" && this.workVine(x, y)) return;
    if (item?.id === "Cutting") { this.plantCutting(x, y); return; }
    if (this.workCrop(x, y, tool)) return;
    if (item && ITEMS[item.id].kind === "seed") {
      if (G.data.crops[`${x},${y}`]) { G.say("Something is already growing there."); return; }
      this.plant(x, y, item.id); return;
    }

    switch (tool) {
      case "hoe":
        if (obj !== -1 && obj !== T.FLOWERS) { G.say("Clear the ground first."); return; }
        if (this.baseGround[y][x] === T.PATH) { G.say("Leave the path to the road."); return; }
        if (inPen(x, y)) { G.say("Not in the goat pen."); return; }
        if (soil) { G.say("This soil is already tilled."); return; }
        { const b = labor(EFFORT.till, 2, "Oikos"); if (b === null) return;
          if (obj === T.FLOWERS) this.clearObject(x, y);
          this.setGround(x, y, "tilled"); G.say(`You break the ground.${b}`); rollFind("hoe", FIND_CHANCE.hoe); }
        return;
      case "jar":
        if (isWell) {
          if ((G.data.divine.day.wellDry ?? 0) > G.dayNumber) { G.say("The well is dry. Poseidon has turned the water away from you."); return; }
          G.data.jarWater = jarCap(); G.data.jarSpring = false; G.say("You fill the water jar at the well."); return;
        }
        if (x === PEN.x1 - 1 && y === PEN.y0 + 1) { this.fillTrough(); return; }
        if (!soil) { G.say("Water only does good on tilled soil."); return; }
        if (soil === "wet") { G.say("This soil is already watered."); return; }
        if (G.data.jarWater <= 0) { G.say("The jar is empty. Fill it at the well."); return; }
        if (!G.warded("Poseidon")) G.data.jarWater -= 1; this.setGround(x, y, "wet");
        if (G.data.jarSpring && G.data.crops[`${x},${y}`]) { G.data.crops[`${x},${y}`].nymph = true; G.say("The Naiad's water sinks in, and the plant seems to lift."); }
        if (G.data.jarWater === 0) G.say("You water the soil. The jar is empty now.");
        return;
      default:
        workObject(this, tool, obj, x, y, `${x},${y}`);
    }
  }
}

// ------------------------------------------------------------------ inside the hut
const RW = 12, RH = 9;
class HouseScene extends PlayScene {
  constructor() { super("House"); }

  create() {
    this.leaving = false;
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: RW, height: RH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    const floor = map.createBlankLayer("floor", ts)!;
    const data: number[][] = [];
    for (let y = 0; y < RH; y++) { data.push([]); for (let x = 0; x < RW; x++) data[y].push(y < 2 || x === 0 || x === RW - 1 || (y === RH - 1 && x !== 6) ? T.WALL : T.FLOOR); }
    floor.putTilesAt(data, 0, 0);
    floor.setCollision([T.WALL]);
    this.cameras.main.setBackgroundColor("#2a1d14");

    this.add.image(6 * TILE, 4 * TILE, "hearth").setDepth(3.5 * TILE);
    this.add.image(1.5 * TILE, 3 * TILE, "bed").setOrigin(0.5, 0).setDepth(4.5 * TILE);
    this.add.image(10.5 * TILE, 1.5 * TILE, "niche").setDepth(1);
    this.add.image(9.5 * TILE, 6.5 * TILE, "pithos").setDepth(7 * TILE);

    const blocks = this.physics.add.staticGroup();
    const block = (x: number, y: number, w: number, h: number) => {
      const b = blocks.create(x, y, "") as Phaser.Physics.Arcade.Sprite;
      b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    };
    block(6 * TILE, 4 * TILE + 4, 30, 14);
    block(1.5 * TILE, 4.7 * TILE, 14, 26);
    block(9.5 * TILE, 6.7 * TILE, 10, 8);

    this.targets = [
      { x: 1.5 * TILE + 8, y: 4.5 * TILE, label: "Sleep", act: () => this.askSleep() },
      { x: 6 * TILE, y: 4.6 * TILE, label: "The hearth: tend it, or cook", act: () => ui(this).hearthMenu(() => this.tendHearth()) },
      { x: 10.5 * TILE, y: 2.4 * TILE, label: "The household altar", act: () => ui(this).openAltar("home") },
      { x: 9.5 * TILE, y: 7 * TILE, label: "Look in the storage jar", act: () => G.say("A pithos for grain and oil. Empty, for now.") },
    ];

    this.physics.world.setBounds(0, 0, RW * TILE, RH * TILE);
    this.cameras.main.setBounds(-TILE * 4, -TILE * 2, (RW + 8) * TILE, (RH + 4) * TILE);
    this.setupInput();
    const inside = G.data.px > 0 && G.data.px < RW * TILE && G.data.py > 0 && G.data.py < RH * TILE;
    G.data.scene = "House";
    this.makePlayer(inside ? G.data.px : 6 * TILE + 8, inside ? G.data.py : 7 * TILE + 8);
    this.physics.add.collider(this.player, floor);
    this.physics.add.collider(this.player, blocks);
    this.cameras.main.fadeIn(250);
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    if (!this.common(dt)) return;
    if (this.player.y > (RH - 1) * TILE - 4 && Math.floor(this.player.x / TILE) === 6) {
      G.data.scene = "House"; // FarmScene places us at the door
      this.goTo("Farm");
    }
  }

  useItem() { G.say("Not indoors."); }
  get canHunt() { return false; }

  askSleep() {
    const hours = G.sleepHours;
    const rec = Math.min(G.data.fatigue, hours * 12);
    const early = G.isDay && G.data.clock < G.daylight - 2 ? "\nIt is still day: the rest of today will pass, and only the night's sleep counts." : "";
    ui(this).choose(`Sleep until dawn?${early}\n\nAbout ${hours.toFixed(1)} hours of real sleep, which would clear ${Math.round(rec)} Fatigue.`, () => ui(this).sleep(this, false));
  }

  tendHearth() {
    if (G.data.tendedHearthDay === G.dateKey) { G.say("The hearth burns steady. You have already tended it today."); return; }
    G.data.tendedHearthDay = G.dateKey;
    G.say("You feed the hearth and give its first portion to Hestia, the hearth's own goddess, who answers to Demeter here.");
  }
}


// ------------------------------------------------------------------ the wild
const WW = 40, WH = 30;
type Side = "N" | "S" | "E" | "W";

interface Profile { ground: number; ground2: number; objects: [number, number][]; density: number; creatures: [Species, number][]; features: string[] }
const PROFILES: Record<number, Profile> = {
  1: { ground: T.MEADOW, ground2: T.GRASS2, objects: [[T.FLOWERS, 6], [T.BRUSH, 3], [T.TREE, 1], [T.SAPLING, 1], [T.STONE, 1]], density: 0.22,
       creatures: [["hare", 3], ["bird", 2], ["deer", 1]], features: ["Herb patch", "Bee tree", "Animal den", "Flower meadow"] },
  2: { ground: T.FOREST, ground2: T.GRASS2, objects: [[T.TREE, 7], [T.SAPLING, 3], [T.BRUSH, 3], [T.FLOWERS, 0.6], [T.STONE, 0.5], [T.BOULDER, 0.3]], density: 0.5,
       creatures: [["deer", 2], ["boar", 1], ["bird", 1], ["hare", 1], ["fox", 1]], features: ["Old oak", "Animal den", "Fallen giant", "Mossy hollow"] },
  3: { ground: T.GRASS, ground2: T.GRASS2, objects: [[T.BRUSH, 3], [T.OLIVE, 2], [T.STONE, 1.5], [T.FLOWERS, 1], [T.TREE, 1]], density: 0.16,
       creatures: [["hare", 2], ["bird", 2]], features: ["Abandoned field", "Boundary stones", "Olive grove"] },
  4: { ground: T.ROCKY, ground2: T.DIRT, objects: [[T.STONE, 5], [T.BOULDER, 3], [T.BRUSH, 2], [T.SAPLING, 1]], density: 0.32,
       creatures: [["hare", 1], ["bird", 1], ["boar", 1]], features: ["Stone outcrop", "Ore seam", "Scree slope"] },
};
// The rest of the wheel, from the Flora & Fauna sheet's "Found in" column.
Object.assign(PROFILES, {
  5: { ground: T.MUD, ground2: T.GRASS2, objects: [[T.REEDS, 7], [T.TREE, 1], [T.BRUSH, 1], [T.FLOWERS, 0.5]], density: 0.36,
       creatures: [["duck", 2], ["heron", 1], ["boar", 1], ["bird", 1]], features: ["Reed bed", "Still pool", "Willow stand"] },
  7: { ground: T.SAND, ground2: T.GRASS2, objects: [[T.STONE, 3], [T.BOULDER, 2], [T.BRUSH, 2], [T.FLOWERS, 0.5]], density: 0.14,
       creatures: [["gull", 3], ["crab", 2]], features: ["Tide pools", "Driftwood beach", "Headland"] },
  8: { ground: T.SAND, ground2: T.REDROCK, objects: [[T.THORN, 4], [T.STONE, 2], [T.BOULDER, 2]], density: 0.12,
       creatures: [["jackal", 1], ["scorpion", 2], ["hare", 1]], features: ["Dry wadi", "Oasis", "Sun-bleached bones"] },
  9: { ground: T.ALPINE, ground2: T.ROCKY, objects: [[T.PINE, 6], [T.STONE, 3], [T.BOULDER, 3], [T.FLOWERS, 1]], density: 0.36,
       creatures: [["ibex", 2], ["eagle", 1], ["deer", 1], ["bear", 0.6]], features: ["Mountain spring", "Shrine stones", "Eagle crag"] },
  10: { ground: T.DRYGRASS, ground2: T.GRASS, objects: [[T.BRUSH, 2], [T.FLOWERS, 2], [T.STONE, 1], [T.THORN, 1], [T.TREE, 0.3]], density: 0.1,
       creatures: [["horse", 3], ["hare", 2], ["bustard", 2], ["bird", 1]], features: ["Wild herd grounds", "Lone oak", "Burial mound"] },
  11: { ground: T.REDROCK, ground2: T.DIRT, objects: [[T.BOULDER, 4], [T.STONE, 3], [T.THORN, 3]], density: 0.34,
       creatures: [["jackal", 1], ["scorpion", 1], ["ibex", 1], ["boar", 1]], features: ["Gully", "Old battlefield", "Thorn thicket"] },
  12: { ground: T.LIMESTONE, ground2: T.GRASS2, objects: [[T.BOULDER, 3], [T.STONE, 3], [T.OLIVE, 1], [T.FLOWERS, 1], [T.PINE, 1]], density: 0.24,
       creatures: [["pigeon", 2], ["eagle", 1], ["hare", 1], ["ibex", 1]], features: ["Ruined watchtower", "Eagle crag", "Acropolis ruins"] },
} as Record<number, Profile>);
const profile = (t: number) => PROFILES[t] ?? PROFILES[1];
const SPRING = { x: 28, y: 9 }, REVEL = { x: 12, y: 20 }, CAVE_AT = { x: 9, y: 7 };

/**
 * Where a citadel's road comes in: the edge between the middle screen of its gate side and the land beyond. Both
 * screens ask, so both agree: one gap, in the middle, and a road through it.
 */
function fortGateEdge(kind: "H" | "V", x: number, y: number): number | null {
  const [bx, by] = kind === "H" ? [x, y + 1] : [x + 1, y];
  const fa = fortressAt(G.data.seed, x, y), fb = fortressAt(G.data.seed, bx, by);
  if (!!fa === !!fb) return null; // inside one (or none)
  const f = (fa ?? fb)!, mx = f.x0 + 1, my = f.y0 + 1;
  if (kind === "H" && f.gate === "S" && fa && x === mx && y === f.y0 + 2) return 20;
  if (kind === "H" && f.gate === "N" && fb && bx === mx && by === f.y0) return 20;
  if (kind === "V" && f.gate === "E" && fa && x === f.x0 + 2 && y === my) return 15;
  if (kind === "V" && f.gate === "W" && fb && bx === f.x0 && by === my) return 15;
  return null;
}
/**
 * The gaps in the border between two neighbouring screens. Both screens ask the same question of the same
 * edge, so their gaps always line up. "H" is the edge below screen (x, y); "V" the edge to its right.
 * Returns tile positions along the edge (x for H, y for V): one to three gaps, anywhere along it.
 */
function edgeGates(kind: "H" | "V", x: number, y: number): number[] {
  const fg = fortGateEdge(kind, x, y); if (fg !== null) return [fg];
  if (kind === "V" && x === 0 && y === 0) return [15]; // the farm's east gate
  if (kind === "H" && x === 0 && y === 1) return [20]; // the village's south road
  const len = kind === "H" ? WW : WH;
  const r = rng((Math.imul(G.data.seed ^ (kind === "H" ? 0x48a1 : 0x56c3), 31) ^ Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) >>> 0);
  const roll = r(), n = roll < 0.5 ? 1 : roll < 0.88 ? 2 : 3;
  const gates: number[] = kind === "H" && x === 0 && y >= 1 ? [20] : []; // the road south keeps its line
  for (let tries = 0; tries < 40 && gates.length < n; tries++) {
    const g = 3 + Math.floor(r() * (len - 6));
    if (gates.every((o) => Math.abs(o - g) >= 7)) gates.push(g);
  }
  return gates.sort((a, b) => a - b);
}
/**
 * Which of an edge's gaps carry a road: about one in four, decided by the edge itself so both screens agree.
 * The farm's east gate and the village's road south are always roads.
 */
function edgeRoads(kind: "H" | "V", x: number, y: number): number[] {
  const gates = edgeGates(kind, x, y);
  if (fortGateEdge(kind, x, y) !== null) return gates; // the road up to a citadel's gate
  if (kind === "V" && x === 0 && y === 0) return gates;
  if (kind === "H" && x === 0 && y >= 1) return gates.filter((g) => g === 20);
  const r = rng((Math.imul(G.data.seed ^ 0x70ad, 17) ^ Math.imul(x + (kind === "H" ? 7 : 3), 2654435761) ^ Math.imul(y, 40503)) >>> 0);
  return gates.filter(() => r() < 0.17);
}
function sideRoads(wx: number, wy: number, side: Side): number[] {
  return side === "N" ? edgeRoads("H", wx, wy - 1) : side === "S" ? edgeRoads("H", wx, wy) : side === "W" ? edgeRoads("V", wx - 1, wy) : edgeRoads("V", wx, wy);
}
/**
 * Rivers run in long courses: down some columns of screens (north to south) and across some rows (west to east),
 * each for a stretch of screens. Where a river crosses an edge is decided by the edge itself, so both screens agree.
 * Never through the farm or the village.
 */
function riverSpan(kind: "col" | "row", n: number): [number, number] | null {
  if (kind === "col" && n === 0) return null;
  if (kind === "row" && (n === 0 || n === 1)) return null;
  const r = rng((Math.imul(G.data.seed ^ (kind === "col" ? 0x2a1f : 0x7c33), 9176) ^ Math.imul(n, 2246822519)) >>> 0);
  if (r() > (kind === "col" ? 0.2 : 0.16)) return null;
  const from = -7 + Math.floor(r() * 9), len = 3 + Math.floor(r() * 9);
  return [from, from + len];
}
function edgeRiver(kind: "H" | "V", x: number, y: number): { at: number; w: number } | null {
  const [bx0, by0] = kind === "H" ? [x, y + 1] : [x + 1, y];
  if (fortressAt(G.data.seed, x, y) || fortressAt(G.data.seed, bx0, by0) || uniqueAt(G.data.anchors, x, y) || uniqueAt(G.data.anchors, bx0, by0)) return null; // rivers keep clear of citadels and sanctuaries
  const span = kind === "H" ? riverSpan("col", x) : riverSpan("row", y);
  if (!span) return null;
  const [a, b] = span, n0 = kind === "H" ? y : x;
  if (n0 < a || n0 + 1 > b) return null; // both screens must be on the river's course
  if (kind === "V" && (x === 0 || x === -1) && (y === 0 || y === 1)) return null;
  const r = rng((Math.imul(G.data.seed ^ 0x51ee, 31) ^ Math.imul(x + (kind === "H" ? 11 : 5), 668265263) ^ Math.imul(y, 374761393)) >>> 0);
  const len = kind === "H" ? WW : WH;
  return { at: 5 + Math.floor(r() * (len - 16)), w: 3 + Math.floor(r() * 6) };
}
function sideRiver(wx: number, wy: number, side: Side) {
  return side === "N" ? edgeRiver("H", wx, wy - 1) : side === "S" ? edgeRiver("H", wx, wy) : side === "W" ? edgeRiver("V", wx - 1, wy) : edgeRiver("V", wx, wy);
}
/** The gaps on one side of a wild screen. */
function sideGates(wx: number, wy: number, side: Side): number[] {
  return side === "N" ? edgeGates("H", wx, wy - 1) : side === "S" ? edgeGates("H", wx, wy) : side === "W" ? edgeGates("V", wx - 1, wy) : edgeGates("V", wx, wy);
}

function screenSeed(wx: number, wy: number) {
  let h = (G.data.seed ^ Math.imul(wx, 73856093) ^ Math.imul(wy, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return h;
}

/** A group of wayfarers on this screen, and what they are about. */
interface WayGroup {
  def: WayDef; people: Wayfarer[]; foes: FigureFoe[]; goats: Animal[]; raiders: Animal[];
  phase: string; t: number; t2: number; t3?: number; wT?: number; life: number; met: boolean; talking: boolean;
  /** What you've already done with them (the day you did it). */
  done: Record<string, number>;
  trail: [number, number][]; trailT: number; chatT: number; chatI: number; nearSaid: boolean; gone: boolean; kills: number; god: string;
  anchor: [number, number]; restT: number; truth: number; shootT: number;
  exit?: [number, number]; first?: [number, number][]; after?: [number, number][]; outT?: number; leaving?: boolean;
  tree?: [number, number]; water?: [number, number]; fire?: Phaser.GameObjects.Image; glow?: Phaser.GameObjects.Image; stone?: Phaser.GameObjects.Image; gfx?: Phaser.GameObjects.Graphics;
  bite?: number; swing?: number; stray?: Animal; leading?: boolean; quest?: string; raidT?: number; raidOn?: boolean; helpedRaid?: boolean; lost?: number;
  cool?: Map<Animal, number>; pack?: Animal[]; prey?: Animal; fortress?: boolean; beast?: Animal; killedBeast?: boolean;
}
/** Something a stranger would be glad to eat. */
const isFoodGift = (id: string) => !!id && !!ITEMS[id] && (!!INGREDIENTS[id] || ITEMS[id].kind === "meal" || ITEMS[id].kind === "crop" || ["Milk", "Honey", "Plum", "Cornel", "WildGrapes", "Grapes", "Wine"].includes(id));

class WildScene extends PlayScene {
  key = "";
  hasSpring = false;
  hasRevel = false;
  hasCave = false;
  naiad?: Phaser.GameObjects.Image;
  satyrs: Phaser.GameObjects.Image[] = [];
  danceT = 0;
  satyrsNoticed = false;
  rec!: ScreenRec;
  objects!: Phaser.Tilemaps.TilemapLayer;
  open: Record<Side, boolean> = { N: true, S: true, E: true, W: true };
  gates: Record<Side, number[]> = { N: [], S: [], E: [], W: [] };

  constructor() { super("Wild"); }
  placeKey() { return `w:${this.key}`; }
  placeBlocked(tx: number, ty: number) {
    if (tx < 2 || ty < 2 || tx >= WW - 2 || ty >= WH - 2) return "Not at the very edge of the land.";
    return (this.objects.getTileAt(tx, ty)?.index ?? -1) === -1 ? null : "Find open ground for it.";
  }

  /** Which sides lead somewhere. Next to home, only the farm's own gateways connect. */
  sideOpen(wx: number, wy: number, side: Side) {
    const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[side];
    if (wx + dx === 0 && wy + dy === 0) return wx === 1 && wy === 0 && side === "W";
    if (wx + dx === 0 && wy + dy === 1) return wx === 0 && wy === 2 && side === "N"; // the village's south road
    return true;
  }

  create() {
    this.leaving = false; this.heatSaid = false;
    const wx = G.data.wx, wy = G.data.wy;
    this.key = `${wx},${wy}`;
    for (const sd of ["N", "S", "E", "W"] as Side[]) this.open[sd] = this.sideOpen(wx, wy, sd);
    const r = rng(screenSeed(wx, wy));

    // First visit: roll the terrain from the land just left, and the screen's feature.
    this.placeSanctuaries();
    let firstVisit = false, foundNow: SiteRec | null = null;
    G.data.fromSea = false;
    if (!G.data.screens[this.key]) {
      firstVisit = true;
      const uniq = uniqueAt(G.data.anchors, wx, wy), crete = creteAt(G.data.anchors, wx, wy), fort = fortressAt(G.data.seed, wx, wy);
      if (crete && (foundNow = this.foundSite(crete))) { /* Crete: all eighteen screens of it */ }
      else if (uniq && (foundNow = this.foundSite(uniq))) { /* Delphi */ }
      else if (fort && (foundNow = this.foundSite(fort))) { /* the whole citadel is laid out */ }
      else {
        // What the neighbours' borders say this must be: a coast where their sea meets yours, ocean where it is all sea.
        const d = this.shoreFor(wx, wy, r);
        if (d.kind === "ocean") {
          const isle = isleAt(G.data.seed, wx, wy);
          if (!(isle && this.isleFits(isle) && (foundNow = this.foundSite(isle)))) G.data.screens[this.key] = { terrain: 6, special: false, feature: "Open sea", cleared: [] };
          G.note("explore");
        } else if (d.kind === "coast") {
          const pc = profile(7);
          G.data.screens[this.key] = { terrain: 7, special: false, feature: pc.features[Math.floor(r() * pc.features.length)], cleared: [], shore: d.shore };
          G.note("explore"); G.note("foreign");
        }
        this.landOnly = d.kind === "land";
        this.freeSide = d.free;
      }
    }
    if (!G.data.screens[this.key]) {
      // A land someone told you of is what they said it was.
      const rumor = G.data.rumors.find((x) => x.key === this.key && !x.found);
      let roll = rumor ? { terrain: rumor.terrain, special: false } : rollTerrain(G.data.lastTerrain || HOME_TERRAIN, r);
      if (roll.terrain === 6) roll = { terrain: 7, special: false };
      // A coast rolled on dry land: only where nothing says this must be plain land, and its sea faces the unknown.
      if (roll.terrain === 7 && (this.landOnly || !this.freeSide)) {
        let t = 7; for (let i = 0; i < 8 && (t === 7 || t === 6); i++) t = rollTerrain(G.data.lastTerrain || HOME_TERRAIN, r).terrain;
        roll = { terrain: t === 7 || t === 6 ? 8 : t, special: roll.special };
      }
      if (rumor && VILLAGERS[rumor.from]) G.note("rumor");
      if (rumor && rumor.from === "road") { rumor.found = true; rumor.told = true; this.time.delayedCall(600, () => G.say(`${RUMOR_WORDS[rumor.terrain][0].toUpperCase() + RUMOR_WORDS[rumor.terrain].slice(1)}: just as the traveler on the road said.`)); }
      else if (rumor) { rumor.found = true; if (VILLAGERS[rumor.from]) this.time.delayedCall(600, () => G.say(`${RUMOR_WORDS[rumor.terrain][0].toUpperCase() + RUMOR_WORDS[rumor.terrain].slice(1)}: just as ${VILLAGERS[rumor.from].name} said. (Tell ${VILLAGERS[rumor.from].name} you found it.)`)); }
      const p = profile(roll.terrain);
      G.note("explore"); if (roll.terrain !== HOME_TERRAIN) G.note("foreign");
      G.data.screens[this.key] = { terrain: roll.terrain, special: roll.special, feature: p.features[Math.floor(r() * p.features.length)], cleared: [] };
      if (roll.terrain === 7) G.data.screens[this.key].shore = fillShore(this.knownSides(wx, wy).known, WW, WH, r, "free", this.freeSide);
    }
    this.landOnly = false; this.freeSide = undefined;
    // A coast from before shores were kept: work its shore out now from its neighbours, and keep it.
    if (G.data.screens[this.key].terrain === 7 && !G.data.screens[this.key].shore && !G.data.screens[this.key].site) G.data.screens[this.key].shore = this.shoreFor(wx, wy, r, true).shore ?? fillShore(this.knownSides(wx, wy).known, WW, WH, r, "free");
    this.rec = G.data.screens[this.key];
    this.isSea = this.rec.terrain === 6;
    this.site = this.rec.site ? G.data.sites[this.rec.site] : undefined;
    this.siteInfo = this.site ? (this.site.kind === "fortress" ? fortressAt(G.data.seed, wx, wy) : this.site.kind === "isle" ? (this.site.isle === "crete" ? creteAt(G.data.anchors, wx, wy) : isleAt(G.data.seed, wx, wy)) : uniqueAt(G.data.anchors, wx, wy)) ?? undefined : undefined;
    if (this.site && !this.siteInfo) this.site = undefined; // (a world whose seed no longer agrees: treat it as plain land)
    if (this.isSea) for (const sd of ["N", "S", "E", "W"] as Side[]) this.open[sd] = true;
    const p = profile(this.rec.terrain);
    const gen = rng(screenSeed(wx, wy) ^ 0x9e3779b9); // layout depends only on the screen, so it never changes

    // Clumpy density: a coarse random grid, smoothly interpolated.
    const CG = 6, cw = Math.ceil(WW / CG) + 2, ch = Math.ceil(WH / CG) + 2;
    const coarse: number[][] = []; for (let y = 0; y < ch; y++) { coarse.push([]); for (let x = 0; x < cw; x++) coarse[y].push(gen()); }
    const field = (x: number, y: number) => {
      const fx = x / CG, fy = y / CG, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const a = coarse[y0][x0] * (1 - tx) + coarse[y0][x0 + 1] * tx, b = coarse[y0 + 1][x0] * (1 - tx) + coarse[y0 + 1][x0 + 1] * tx;
      return a * (1 - ty) + b * ty;
    };
    const total = p.objects.reduce((n, [, w]) => n + w, 0);
    const pickObj = () => { let k = gen() * total; for (const [t, w] of p.objects) { if ((k -= w) <= 0) return t; } return p.objects[0][0]; };

    const ground: number[][] = [], objs: number[][] = [];
    for (let y = 0; y < WH; y++) {
      ground.push([]); objs.push([]);
      for (let x = 0; x < WW; x++) {
        const edge = x < 1 || y < 1 || x >= WW - 1 || y >= WH - 1;
        const f = field(x, y);
        ground[y].push((1 - f) > 0.6 && gen() < 0.85 ? p.ground2 : gen() < 0.06 ? p.ground2 : p.ground);
        objs[y].push(edge ? T.EDGE : gen() < p.density * f * 2 ? pickObj() : -1);
      }
    }
    // The shore: the sea comes in where the borders say, and the shoreline runs smoothly between them, beach behind it.
    if (this.rec.terrain === 7 && this.rec.shore) {
      const m = coastMask(this.rec.shore, WW, WH, rng(screenSeed(wx, wy) ^ 0x5ea5));
      const near = (x: number, y: number) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (m[y + dy]?.[x + dx]) return true; return false; };
      for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
        if (m[y][x]) { objs[y][x] = T.WATER; ground[y][x] = T.SAND; }
        else if (near(x, y)) { ground[y][x] = T.SAND; if (objs[y][x] !== T.EDGE) objs[y][x] = gen() < 0.08 ? T.STONE : -1; }
      }
    }
    // The marsh: still pools fringed with reeds.
    if (this.rec.terrain === 5) {
      for (let i = 0; i < 6; i++) {
        const px0 = 4 + Math.floor(gen() * (WW - 8)), py0 = 4 + Math.floor(gen() * (WH - 8)), r = 1.2 + gen() * 1.6;
        for (let y = py0 - 4; y <= py0 + 4; y++) for (let x = px0 - 4; x <= px0 + 4; x++) {
          if (x < 2 || y < 2 || x >= WW - 2 || y >= WH - 2) continue;
          const d = Math.hypot(x - px0, y - py0);
          if (d <= r) objs[y][x] = T.WATER; else if (d <= r + 1.2 && gen() < 0.6) objs[y][x] = T.REEDS;
        }
      }
    }
    // A citadel's walls and halls, or the open sea and its isle, over the land drawn so far.
    this.fort = undefined;
    if (this.isSea) this.stampSea(objs, ground, gen);
    else if (this.site?.kind === "fortress") this.stampFortress(objs, ground);
    else if (this.site) this.stampSanctuary(objs, ground);
    const plain = !this.isSea && !this.site;
    const cx = 20, cy = 15;
    // The village road runs south from the farm.
    if (wx === 0 && wy >= 2) for (let y = 0; y < WH; y++) { ground[y][cx] = T.PATH; for (let x = cx - 1; x <= cx + 1; x++) if (y > 0 && y < WH - 1 || x === cx || objs[y][x] !== T.EDGE) objs[y][x] = -1; objs[y][cx] = -1; }
    // The screen's landmark (or small feature), somewhere away from the middle.
    const lmDef = plain ? LANDMARKS[this.rec.feature] : undefined;
    this.lm = null;
    if (!plain) { /* a site has its own features */ }
    else if (lmDef) {
      const r = lmDef.r, west = gen() < 0.5;
      const lx = west ? r + 2 + Math.floor(gen() * Math.max(1, 12 - r)) : WW - r - 3 - Math.floor(gen() * Math.max(1, 12 - r));
      const ly = r + 2 + Math.floor(gen() * Math.max(1, WH - 2 * r - 4));
      this.lm = { name: this.rec.feature, def: lmDef, x: lx, y: ly };
      this.stampLandmark(objs, ground, lx, ly, lmDef, gen);
    } else {
      const fx = gen() < 0.5 ? 4 + Math.floor(gen() * 8) : WW - 12 + Math.floor(gen() * 8);
      const fy = 4 + Math.floor(gen() * (WH - 8));
      this.stampFeature(objs, fx, fy, this.rec.feature, gen);
    }
    for (const k of this.rec.cleared) { const [x, y] = k.split(",").map(Number); if (objs[y] && objs[y][x] !== T.EDGE && !waterKind(objs[y][x])) objs[y][x] = -1; }
    // Gaps in the border on each open side (matching the neighbour's), each with a winding clear way to the middle.
    this.gates = { N: [], S: [], E: [], W: [] };
    // A way cleared through water leaves a ford rather than dry ground.
    const carve = (x: number, y: number, road = false) => { for (let yy = y; yy <= y + 1; yy++) for (let xx = x; xx <= x + 1; xx++) if (xx > 0 && yy > 0 && xx < WW - 1 && yy < WH - 1) objs[yy][xx] = waterKind(objs[yy][xx]) ? (road ? T.SHALLOW : objs[yy][xx]) : -1; };
    const ggen = rng(screenSeed(wx, wy) ^ 0x6a7e);
    const roadSides: Side[] = [];
    const within = this.siteSides(wx, wy);
    for (const sd of ["N", "S", "E", "W"] as Side[]) {
      if (!this.open[sd]) continue;
      if (within.includes(sd)) { this.gates[sd] = this.openAlong(objs, sd); continue; }
      const roads = sideRoads(wx, wy, sd);
      for (const g of (this.gates[sd] = sideGates(wx, wy, sd))) {
        const [sx0, sy0] = sd === "N" ? [g, 0] : sd === "S" ? [g, WH - 1] : sd === "W" ? [0, g] : [WW - 1, g];
        for (let i = -1; i <= 1; i++) { if (sd === "N" || sd === "S") objs[sy0][sx0 + i] = -1; else objs[sy0 + i][sx0] = -1; }
        // Off-centre gaps wander in toward the middle; a road runs all the way, and is trodden bare.
        const road = roads.includes(g);
        if (road && !roadSides.includes(sd)) roadSides.push(sd);
        let x = sx0, y = sy0;
        const tx = road ? cx : cx + Math.round((ggen() - 0.5) * 6), ty = road ? cy : cy + Math.round((ggen() - 0.5) * 4);
        for (let step = 0; step < (plain ? 90 : 6) && (Math.abs(x - tx) > (road ? 0 : 1) || Math.abs(y - ty) > (road ? 0 : 1)); step++) {
          carve(x - 1, y - 1, road);
          if (road) ground[y][x] = T.PATH;
          const px0 = x;
          if (ggen() < 0.7) { x += Math.sign(tx - x); y += Math.sign(ty - y); }
          else if (sd === "N" || sd === "S") x += ggen() < 0.5 ? -1 : 1; else y += ggen() < 0.5 ? -1 : 1;
          x = Math.max(1, Math.min(WW - 2, x)); y = Math.max(1, Math.min(WH - 2, y));
          if (road) { ground[y][px0] = T.PATH; ground[y][x] = T.PATH; } // keep the track joined, not stepping on corners
        }
        if (road) ground[y][x] = T.PATH;
      }
    }
    if (!this.isSea) for (const sd of ["N", "S", "E", "W"] as Side[]) { const rv = sideRiver(wx, wy, sd); if (rv) this.gates[sd].push(rv.at + Math.floor(rv.w / 2)); }
    // Roads: where three or more meet in the middle there is a crossroads, and a herm stands at it.
    this.rec.roads = roadSides;
    const nRoads = roadSides.reduce((n, sd) => n + sideRoads(wx, wy, sd).filter((g) => this.gates[sd].includes(g)).length, 0);
    this.rec.crossroads = nRoads >= 3;
    if (nRoads) { ground[cy][cx] = T.PATH; for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (this.rec.crossroads) ground[cy + dy][cx + dx] = T.PATH; }
    if (this.rec.crossroads) for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) if (objs[y][x] !== T.EDGE) objs[y][x] = -1;
    const ring0 = (cx0: number, cy0: number, rad: number, fn: (x: number, y: number) => void) => {
      for (let y = cy0 - rad; y <= cy0 + rad; y++) for (let x = cx0 - rad; x <= cx0 + rad; x++) if (x > 1 && y > 1 && x < WW - 2 && y < WH - 2 && Math.hypot(x - cx0, y - cy0) <= rad + 0.3) fn(x, y);
    };
    // Anchors: the Naiad's spring lies at a near site fixed for this world; the satyrs revel in the first flowering valley you find.
    if (!G.data.anchors.spring) { const r0 = rng(G.data.seed ^ 0x5eed5); const [ax, ay] = SPRING_SITES[Math.floor(r0() * SPRING_SITES.length)]; G.data.anchors.spring = `${ax},${ay}`; }
    if (!G.data.anchors.satyrs && plain && this.rec.terrain === 1 && Math.abs(wx) + Math.abs(wy) >= 1 && this.key !== G.data.anchors.spring) G.data.anchors.satyrs = this.key;
    // The first cave: in the first mineral hills at least two screens out, or by three screens out, wherever you are.
    const dist0 = Math.abs(wx) + Math.abs(wy);
    if (!G.data.anchors.cave && plain && this.key !== G.data.anchors.spring && this.key !== G.data.anchors.satyrs && ((this.rec.terrain === 4 && dist0 >= 2) || dist0 >= 3)) G.data.anchors.cave = this.key;
    this.hasCave = this.key === G.data.anchors.cave;
    if (this.hasCave) ring0(CAVE_AT.x, CAVE_AT.y + 1, 3, (x, y) => { objs[y][x] = -1; });
    this.hasSpring = this.key === G.data.anchors.spring;
    this.hasRevel = this.key === G.data.anchors.satyrs;
    const ring = (cx0: number, cy0: number, rad: number, fn: (x: number, y: number, d: number) => void) => {
      for (let y = cy0 - rad; y <= cy0 + rad; y++) for (let x = cx0 - rad; x <= cx0 + rad; x++) if (x > 1 && y > 1 && x < WW - 2 && y < WH - 2) { const d = Math.hypot(x - cx0, y - cy0); if (d <= rad + 0.3) fn(x, y, d); }
    };
    if (this.hasSpring) ring(SPRING.x, SPRING.y, 4, (x, y, d) => { objs[y][x] = d <= 1.5 ? T.WATER : d > 3.2 && gen() < 0.5 ? T.FLOWERS : -1; if (d <= 3) ground[y][x] = T.MEADOW; });
    if (this.hasRevel) ring(REVEL.x, REVEL.y, 5, (x, y, d) => { objs[y][x] = d > 4.3 && gen() < 0.6 ? T.FLOWERS : -1; });

    if (!this.isSea) this.carveRivers(objs, ground, wx, wy); // last, so nothing cuts the river (roads cross it at fords)
    // Where water meets land it is shallow: deep water only in the middle of things.
    const wet = (x: number, y: number) => x < 0 || y < 0 || x >= WW || y >= WH || objs[y][x] === T.WATER || objs[y][x] === T.SHALLOW || objs[y][x] === -2 || objs[y][x] === T.EDGE;
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) if (objs[y][x] === T.WATER && (!wet(x - 1, y) || !wet(x + 1, y) || !wet(x, y - 1) || !wet(x, y + 1))) objs[y][x] = -2;
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) if (objs[y][x] === -2) objs[y][x] = T.SHALLOW;
    // Where the sea meets the border, a boat can pass.
    this.wetGates = { N: [], S: [], E: [], W: [] };
    if (this.rec.terrain === 7 || this.isSea) for (const sd of ["N", "S", "E", "W"] as Side[]) {
      const n = sd === "N" || sd === "S" ? WW : WH;
      for (let i = 1; i < n - 1; i++) { const t = sd === "N" ? objs[1][i] : sd === "S" ? objs[WH - 2][i] : sd === "W" ? objs[i][1] : objs[i][WW - 2]; if (waterKind(t)) this.wetGates[sd].push(i); }
    }
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: WW, height: WH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    this.groundLayer = map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    this.groundData = ground;
    if (p.ground2 !== p.ground) softenPatches(map, this.groundLayer, ground, p.ground2, p.ground, seasonGroundTint(G));
    if (this.rec.roads?.length) softenPatches(map, this.groundLayer, ground, T.PATH, p.ground, seasonGroundTint(G), "softRoad");
    jitterLayer(map.createBlankLayer("details", ts)!.putTilesAt(scatterDetails(this.landTerrain, screenSeed(wx, wy) ^ 0xdec0, objs, () => false), 0, 0), true);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(SOLID).setDepth(1);
    varyLayers(G, this.groundLayer, this.objects);
    this.targets = [];
    this.water = []; for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) if (waterKind(objs[y][x])) this.water.push([x, y]);

    this.physics.world.setBounds(0, 0, WW * TILE, WH * TILE);
    this.cameras.main.setBounds(0, 0, WW * TILE, WH * TILE);
    this.setupInput();
    let sx = G.data.px, sy = G.data.py;
    const e = G.data.entry;
    // Walk in at the gap you came through (or the gap nearest the middle).
    const at = (sd: Side, mid: number) => {
      const wetG = this.wetGates[sd], dryG = this.gates[sd].filter((g) => !wetG.includes(g));
      const gs = G.data.boatCarry && wetG.length ? wetG : dryG.length ? dryG : this.gates[sd].length ? this.gates[sd] : wetG; const want = G.data.entryAt ?? mid;
      return gs.length ? gs.reduce((b, g) => (Math.abs(g - want) < Math.abs(b - want) ? g : b), gs[0]) : mid;
    };
    if (e === "W") { sx = 1.5 * TILE; sy = at("W", cy) * TILE + 8; }
    if (e === "E") { sx = (WW - 1.5) * TILE; sy = at("E", cy) * TILE + 8; }
    if (e === "N") { sx = at("N", cx) * TILE + 8; sy = 1.5 * TILE; }
    if (e === "S") { sx = at("S", cx) * TILE + 8; sy = (WH - 1.5) * TILE; }
    G.data.entryAt = null;
    if (e === "C") { sx = CAVE_AT.x * TILE + 8; sy = (CAVE_AT.y + 1.6) * TILE; }
    G.data.entry = ""; G.data.scene = "Wild";
    this.makePlayer(sx, sy);
    this.ambience = new Ambience(this, G, { outdoor: true, terrain: this.landTerrain, layer: this.objects });
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();
    this.wolvesOut = false;
    // Forage: placed from the screen's own seed, so the same plants are there every visit.
    const fgen = rng(screenSeed(wx, wy) ^ 0x2545f491);
    this.placeForage(fgen, this.landTerrain, this.isSea ? (this.site ? 3 + Math.floor(fgen() * 3) : 0) : 4 + Math.floor(fgen() * 4), (x, y) =>
      x > 1 && y > 1 && x < WW - 2 && y < WH - 2 && objs[y][x] === -1 && ground[y][x] !== T.PATH && ground[y][x] !== T.FLAGS);
    if (!this.isSea) this.spawnCreatures(p, gen); else { this.animals = []; this.chase = new Map(); }
    if (plain) this.spawnMythborn();
    if (this.hasCave) this.placeCaveMouth();
    this.setupBarrow();
    this.monster = undefined;
    if (plain) { this.maybeMonster(); this.setupGlint(); this.setupHut(); this.setupSites(); }
    else { this.siteFolk = []; this.hutFolk = []; this.ghostsRolled = true; } // no huts, shrines or herms in a site or at sea
    this.setupLandmark();
    if (!this.isSea && !(this.site?.kind === "fortress" && partOf(this.site, wx, wy) === "the heart of it")) this.setupWayfarers(); else { this.ways = []; this.chase = new Map(); this.wayT = 9999; }
    this.setupSite(foundNow);
    const arrivingByBoat = !!G.data.boatCarry && this.landBoat();
    this.drawPlaced();
    if (arrivingByBoat) { const o = this.placedObjs.find((q) => q.p.id === "Boat" && q.p.x === Math.floor(this.player.x / TILE) && q.p.y === Math.floor((this.player.y + 12) / TILE)) ?? this.placedObjs.filter((q) => q.p.id === "Boat").pop(); if (o) { this.boat = undefined; this.boardBoat(o, true); } }
    this.cameras.main.fadeIn(250);

    const t = terrain(this.rec.terrain);
    if (this.site) this.siteArrival(foundNow);
    else if (this.isSea) G.say(firstVisit ? "The open sea. The land drops behind you, and there is nothing ahead but water and sky. (Row off any edge to go on.)" : "The open sea.");
    else if (firstVisit) G.say(`New land: ${t.name} (${t.aretai}, ${t.element}). Here: ${this.rec.feature.toLowerCase()}.${this.rec.special ? " Something about this place feels set apart." : ""}`);
    else G.say(`${t.name}, as you left it.`);
  }

  // ---------------------------------------------------------------- shores that join up (coast.ts)
  landOnly = false;
  freeSide?: Side;
  wetGates: Record<Side, number[]> = { N: [], S: [], E: [], W: [] };
  /**
   * What each neighbour's facing border says: its sea, tile by tile, and what kind of place it is. A place not yet
   * walked says nothing, unless it is Crete (sea all round), or a citadel or Delphi (dry land), which are known
   * before they are found so the sea forms round them properly.
   */
  knownSides(wx: number, wy: number) {
    const known: Partial<Record<Side, string>> = {}, from: Partial<Record<Side, "land" | "coast" | "ocean" | "virtual">> = {};
    const opp: Record<Side, Side> = { N: "S", S: "N", E: "W", W: "E" };
    for (const sd of ["N", "S", "E", "W"] as Side[]) {
      const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[sd], nx = wx + dx, ny = wy + dy;
      if (nx === 0 && (ny === 0 || ny === 1)) { known[sd] = "0"; from[sd] = "land"; continue; } // the farm and the village
      const n = G.data.screens[`${nx},${ny}`];
      if (n) {
        if (n.terrain === 6) { known[sd] = "1"; from[sd] = "ocean"; }
        else if (n.terrain === 7) { if (n.shore) { known[sd] = n.shore[opp[sd]]; from[sd] = "coast"; } }
        else { known[sd] = "0"; from[sd] = "land"; }
      } else if (creteAt(G.data.anchors, nx, ny)) { known[sd] = "1"; from[sd] = "virtual"; }
      else if (fortressAt(G.data.seed, nx, ny) || uniqueAt(G.data.anchors, nx, ny)) { known[sd] = "0"; from[sd] = "virtual"; }
    }
    return { known, from };
  }
  /**
   * What a new screen must be, by its neighbours: a coast if any border it shares is part sea; the ocean if a coast's
   * all-sea side faces it (or, mostly, if it comes out of the ocean); plain land if a coast's dry side faces it;
   * otherwise whatever the land rolls, a coast's sea set toward the unknown.
   */
  shoreFor(wx: number, wy: number, r: () => number, forceCoast = false): { kind: "ocean" | "coast" | "land" | "roll"; shore?: Shore; free?: Side } {
    const { known, from } = this.knownSides(wx, wy), sides = ["N", "S", "E", "W"] as Side[];
    const partial = sides.some((sd) => known[sd] !== undefined && known[sd] !== "0" && known[sd] !== "1");
    const full = sides.filter((sd) => known[sd] === "1"), dry = sides.filter((sd) => known[sd] === "0");
    const fullFromCoast = full.some((sd) => from[sd] === "coast"), coastDry = dry.some((sd) => from[sd] === "coast");
    const unknown = sides.filter((sd) => known[sd] === undefined);
    const ahead = ({ N: "S", S: "N", E: "W", W: "E", "": undefined } as Record<string, Side | undefined>)[G.data.entry];
    const free = ahead && unknown.includes(ahead) ? ahead : unknown[Math.floor(r() * unknown.length)];
    const coast = (intent: Intent) => {
      const sh = fillShore(known, WW, WH, r, intent, free);
      return allSea(sh) ? { kind: "ocean" as const } : sides.some((sd) => someSea(sh[sd])) ? { kind: "coast" as const, shore: sh } : { kind: "land" as const };
    };
    if (forceCoast) return coast(partial ? "coast" : full.length ? "fromSea" : "free");
    if (partial) return coast("coast");
    if (full.length) {
      if (dry.length) return coast("fromSea");
      if (fullFromCoast) return { kind: "ocean" };
      if (isleAt(G.data.seed, wx, wy)) return { kind: "ocean" }; // where an isle lies, the sea stays open round it
      return r() < 0.82 ? { kind: "ocean" } : coast("fromSea");
    }
    if (coastDry) return { kind: "land" };
    return { kind: "roll", free };
  }
  /** An isle shows only where all round it is open sea (or not yet walked), and never on Crete's waters. */
  isleFits(si: SiteInfo) {
    for (let y = si.y0 - 1; y <= si.y0 + si.h; y++) for (let x = si.x0 - 1; x <= si.x0 + si.w; x++) {
      if (creteAt(G.data.anchors, x, y)) return false;
      const inside = x >= si.x0 && y >= si.y0 && x < si.x0 + si.w && y < si.y0 + si.h;
      if (inside) continue;
      const n = G.data.screens[`${x},${y}`];
      if (n && n.terrain !== 6 && !(n.terrain === 7 && n.shore && Object.values(n.shore).some((p) => p === "1"))) return false;
      if (!n && (fortressAt(G.data.seed, x, y) || uniqueAt(G.data.anchors, x, y))) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- sites: citadels and isles (sites.ts)
  isSea = false;
  site?: SiteRec;
  siteInfo?: SiteInfo;
  fort?: FortLayout;
  seaCorner?: [number, number, number];
  siteBeast?: Animal;
  seaSaidT = 0;
  /** What land this is, for plants, ground details and the air: an isle's own, the shore's at sea. */
  get landTerrain() { return this.site?.kind === "isle" ? ISLES[this.site.isle!].land : this.isSea ? 7 : this.rec.terrain; }

  /**
   * The first sight of any part of a site lays out all of it: every screen gets its record, so the rest is known
   * (and joins up) however you come at it. Not if some of it was already walked as something else.
   */
  foundSite(si: SiteInfo): SiteRec | null {
    for (let y = si.y0; y < si.y0 + si.h; y++) for (let x = si.x0; x < si.x0 + si.w; x++) if (G.data.screens[`${x},${y}`]) return null;
    const used = new Set(Object.values(G.data.sites).map((s) => s.name));
    let rec: SiteRec;
    if (si.kind === "delphi" || si.kind === "knossos") {
      const d = si.kind === "delphi";
      rec = { kind: si.kind, name: d ? "Delphi" : "Knossos", god: d ? "Apollo" : "Poseidon",
        line: d ? "Delphi, the navel of the world, where Apollo killed the serpent Python and his priestess speaks his oracles." : "Knossos, Minos' palace, where Daedalus built the Labyrinth to hold the bull-headed son of the queen.",
        x0: si.x0, y0: si.y0, w: 2, h: 2, seed: si.seed, found: G.dayNumber, terrain: d ? 12 : 3, looted: [], marks: {}, ...(d ? {} : { minotaur: "alive" as const }) };
    } else if (si.kind === "fortress") {
      const c = CITADELS.find((q) => !used.has(q.name));
      const rolled = rollTerrain(G.data.lastTerrain || HOME_TERRAIN, rng(si.seed)).terrain;
      rec = { kind: "fortress", name: c?.name ?? "a nameless citadel", god: c?.god ?? "Zeus", line: c?.line ?? "A citadel whose name no one remembers.",
        x0: si.x0, y0: si.y0, w: 3, h: 3, seed: si.seed, found: G.dayNumber, terrain: [5, 6, 7].includes(rolled) ? 4 : rolled,
        gate: si.gate, fate: c?.fate ?? si.fate, beast: c?.beast ?? si.beast, looted: [], marks: {} };
    } else {
      const d = ISLES[si.isle!], name = d.names.find((n) => !used.has(n)) ?? (si.isle === "nymph" ? "a nymph's isle" : si.isle === "sirens" ? "a sirens' rock" : d.names[0]);
      rec = { kind: "isle", name, god: d.god, line: d.line, isle: si.isle, x0: si.x0, y0: si.y0, w: si.w, h: si.h, seed: si.seed, found: G.dayNumber, terrain: 6, looted: [], marks: {}, ...(si.isle === "crete" ? { minotaur: "alive" as const } : {}) };
    }
    G.data.sites[si.id] = rec;
    for (let y = si.y0; y < si.y0 + si.h; y++) for (let x = si.x0; x < si.x0 + si.w; x++) {
      G.data.screens[`${x},${y}`] = { terrain: rec.terrain, special: false, feature: si.kind === "fortress" ? "Citadel" : si.kind === "isle" ? "Isle" : rec.name, cleared: [], site: si.id, hut: null, shrine: null, graveyard: null };
      for (const ru of G.data.rumors) if (ru.key === `${x},${y}`) { ru.found = true; ru.told = true; }
    }
    G.note("explore"); G.note("site");
    G.data.foretold = (G.data.foretold ?? []).filter((f) => !G.data.screens[f.key]?.site);
    return rec;
  }

  /** The sides of this screen that open onto more of the same site (at sea: every side, all water). */
  siteSides(wx: number, wy: number): Side[] {
    if (this.isSea && !this.site) return ["N", "S", "E", "W"];
    const s = this.site; if (!s) return [];
    const out: Side[] = [];
    if (wy > s.y0) out.push("N"); if (wy < s.y0 + s.h - 1) out.push("S"); if (wx > s.x0) out.push("W"); if (wx < s.x0 + s.w - 1) out.push("E");
    if (this.isSea) for (const sd of ["N", "S", "E", "W"] as Side[]) if (!out.includes(sd)) out.push(sd); // the isle's outer sides are sea too
    return out;
  }
  /** Every place along a side you can pass (an open border inside a site, or the open sea). */
  openAlong(objs: number[][], sd: Side): number[] {
    const out: number[] = [], len = sd === "N" || sd === "S" ? WW : WH;
    for (let i = 1; i < len - 1; i++) {
      const [a, b] = sd === "N" ? [objs[0][i], objs[1][i]] : sd === "S" ? [objs[WH - 1][i], objs[WH - 2][i]] : sd === "W" ? [objs[i][0], objs[i][1]] : [objs[i][WW - 1], objs[i][WW - 2]];
      if (!SOLID.includes(a) && !SOLID.includes(b)) out.push(i);
    }
    return out;
  }

  stampFortress(objs: number[][], ground: number[][]) {
    const si = this.siteInfo!, wx = G.data.wx, wy = G.data.wy;
    const L = fortressLayout(si, { WALL: T.CYCLO, FLAGS: T.FLAGS, COLUMN: T.COLUMN, STONE: T.STONE, BOULDER: T.BOULDER, BRUSH: T.BRUSH, TREE: T.TREE, OLIVE: T.OLIVE, WATER: T.WATER, PATH: T.PATH, DIRT: T.DIRT, LIMESTONE: T.LIMESTONE, FLOWERS: T.FLOWERS });
    this.fort = L;
    const ox = (wx - si.x0) * WW, oy = (wy - si.y0) * WH, within = this.siteSides(wx, wy);
    const borderSide = (x: number, y: number): Side | null => (y === 0 ? "N" : y === WH - 1 ? "S" : x === 0 ? "W" : x === WW - 1 ? "E" : null);
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const c = L.cells[oy + y][ox + x], b = borderSide(x, y);
      if (b && within.includes(b) && objs[y][x] === T.EDGE) objs[y][x] = -1; // inside the site the border is open
      if (!c) continue;
      if (c.g !== undefined) ground[y][x] = c.g;
      if (c.o === undefined) continue;
      if (b && !within.includes(b) && objs[y][x] === T.EDGE && c.g !== T.PATH) continue; // the site's own outer edge stays, but for the road
      objs[y][x] = c.o;
    }
  }

  /** Where an isle's heart is (site tiles): its grotto, altar, forge or wreck. Off the seams between screens. */
  isleFeature(si: { w: number; h: number }): [number, number] { return [Math.floor((si.w * WW) / 2) - (si.w > 1 ? 9 : 0), Math.floor((si.h * WH) / 2) - (si.h > 1 ? 8 : 0)]; }

  stampSea(objs: number[][], ground: number[][], gen: () => number) {
    const si = this.siteInfo, wx = G.data.wx, wy = G.data.wy, type = this.site?.isle;
    const land = si ? isleLand(si) : null, ox = si ? (wx - si.x0) * WW : 0, oy = si ? (wy - si.y0) * WH : 0;
    const G0: Record<string, number> = { nymph: T.MEADOW, sirens: T.GRASS, goats: T.FOREST, sacred: T.LIMESTONE, forge: T.REDROCK, reef: T.SAND, crete: T.GRASS };
    const inner = (): number => {
      const k = gen();
      switch (type) {
        case "nymph": return k < 0.1 ? T.TREE : k < 0.22 ? T.FLOWERS : k < 0.25 ? T.BRUSH : -1;
        case "sirens": return k < 0.28 ? T.FLOWERS : k < 0.33 ? T.BOULDER : k < 0.37 ? T.STONE : -1;
        case "goats": return k < 0.22 ? T.TREE : k < 0.3 ? T.BRUSH : k < 0.34 ? T.STONE : k < 0.37 ? T.SAPLING : -1;
        case "sacred": return k < 0.05 ? T.OLIVE : k < 0.09 ? T.STONE : k < 0.14 ? T.FLOWERS : -1;
        case "forge": return k < 0.06 ? T.ORE : k < 0.14 ? T.STONE : k < 0.2 ? T.BOULDER : -1;
        case "crete": return k < 0.07 ? T.OLIVE : k < 0.13 ? T.TREE : k < 0.17 ? T.BRUSH : k < 0.21 ? T.STONE : k < 0.23 ? T.BOULDER : k < 0.27 ? T.FLOWERS : -1;
        default: return k < 0.06 ? T.STONE : -1;
      }
    };
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const n = land ? land(ox + x, oy + y) : 9;
      if (n < 1) { const beach = n > 0.8; ground[y][x] = beach ? T.SAND : G0[type ?? "reef"]; objs[y][x] = beach ? (gen() < 0.05 ? T.STONE : -1) : inner(); }
      else { ground[y][x] = T.SAND; objs[y][x] = !land && x > 2 && y > 2 && x < WW - 3 && y < WH - 3 && gen() < 0.0012 ? T.BOULDER : T.WATER; }
    }
    // Knossos, on its screen of Crete.
    this.sanct = undefined;
    if (type === "crete" && this.key === G.data.anchors.knossosAt) {
      const L = knossosLayout({ WALL: T.WALL, FLAGS: T.FLAGS, COLUMN: T.COLUMN, STONE: T.STONE, BOULDER: T.BOULDER, BRUSH: T.BRUSH, TREE: T.TREE, OLIVE: T.OLIVE, WATER: T.WATER, PATH: T.PATH, DIRT: T.DIRT, LIMESTONE: T.LIMESTONE, FLOWERS: T.FLOWERS });
      this.sanct = L;
      for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) { const c = L.cells[y][x]; if (!c || objs[y][x] === T.WATER) continue; if (c.g !== undefined) ground[y][x] = c.g; if (c.o !== undefined) objs[y][x] = c.o; }
    }
    if (si && type && type !== "crete") {
      const [fx, fy] = this.isleFeature(si), lx = fx - ox, ly = fy - oy;
      for (let y = ly - 3; y <= ly + 3; y++) for (let x = lx - 4; x <= lx + 4; x++) if (objs[y]?.[x] !== undefined && objs[y][x] !== T.WATER) objs[y][x] = -1;
      if (type === "nymph") for (let y = ly - 1; y <= ly + 1; y++) for (let x = lx + 4; x <= lx + 6; x++) if (objs[y]?.[x] !== undefined && Math.hypot(x - lx - 5, y - ly) < 1.3) objs[y][x] = T.WATER; // her spring
    }
  }

  /** Props, searches, keepers and dangers of the site, on this screen. */
  setupSite(found: SiteRec | null) {
    this.siteBeast = undefined;
    const s = this.site, si = this.siteInfo; if (!s || !si) return;
    void found;
    const sc = this, wx = G.data.wx, wy = G.data.wy, ox = (wx - si.x0) * WW, oy = (wy - si.y0) * WH;
    const here = ([x, y]: [number, number]) => x >= ox && x < ox + WW && y >= oy && y < oy + WH;
    const at = ([x, y]: [number, number]): [number, number] => [(x - ox) * TILE + 8, (y - oy) * TILE + 8];
    const prop = (key: string, p: [number, number], solid = true, dy = 6) => { const [x, y] = at(p); const img = this.add.image(x, y + dy, key).setOrigin(0.5, 1).setDepth(y + dy); if (solid) this.solidAt(x, y + dy - 4, Math.min(img.width - 4, 30), 8); return img; };
    s.looted ??= []; s.marks ??= {};
    if (s.kind === "delphi" || s.kind === "knossos") {
      this.setupSanctuary();
      // Pilgrims come and go on the Sacred Way.
      if (s.kind === "delphi" && G.isDay && !this.ways.length && Math.random() < 0.5) { const want = pick(["pilgrim", "pilgrims", "procession"]), d = this.wayDefs.find((w) => w.id === want)!; if (this.spawnWay(d, false)) this.time.delayedCall(1500, () => G.say("Pilgrims are on the Sacred Way, come to ask the god.")); }
      return;
    }
    const heart = partOf(s, wx, wy) === "the heart of it";
    if (s.kind === "fortress" && this.fort) {
      const L = this.fort;
      if (here(L.hearth)) {
        prop("hearth", L.hearth, false, 10);
        this.targets.push({ x: at(L.hearth)[0], y: at(L.hearth)[1], get label() { return s.fate === "haunted" && !s.cleared ? "Pour a libation for the restless dead" : ""; }, act: () => sc.layToRest() });
      }
      if (here(L.throne)) prop("throne", L.throne);
      if (here(L.altar)) {
        prop("altar", L.altar);
        this.targets.push({ x: at(L.altar)[0], y: at(L.altar)[1] + 4, label: `Make an offering to ${s.god} at the old altar`, act: () => ui(sc).priestTalk(s.god, "", `the altar of ${s.name}`, true, 6) });
      }
      L.pithoi.forEach((p) => {
        if (!here(p)) return;
        const key = `${p[0]},${p[1]}`, img = prop("pithos", p);
        if (s.looted!.includes(key)) img.setTint(0x9a9080);
        this.targets.push({ x: at(p)[0], y: at(p)[1] + 6, get label() { return s.looted!.includes(key) ? "" : "Search the storage jar"; }, act: () => sc.searchJar(key, img) });
      });
      if (here(L.treasury)) {
        const hoard = s.treasury ? null : prop("hoard", L.treasury, false, 8);
        this.targets.push({ x: at(L.treasury)[0], y: at(L.treasury)[1], get label() { return s.treasury ? "" : "Search the king's treasury"; }, act: () => sc.searchTreasury(hoard) });
      }
      if (here(L.tholos)) {
        prop("stele", L.tholos, true, 4);
        this.targets.push({ x: at(L.tholos)[0], y: at(L.tholos)[1] + 6, get label() { return s.marks!.tholos ? "" : "Search the beehive tomb"; }, act: () => sc.searchTholos() });
        if (s.fate === "haunted" && !s.cleared && !G.isDay) this.time.delayedCall(1500, () => this.summon("eidolon", 1));
      }
      // What holds the citadel now.
      if (heart && !s.cleared) {
        if (s.fate === "brigands") { const g = this.spawnWay(this.wayDefs.find((w) => w.id === "brigands")!, false); if (g) g.fortress = true; }
        else if (s.fate === "beast") { this.spawnMonster(s.beast as MonsterKind); this.siteBeast = this.monster; }
        else if (s.fate === "haunted" && !G.isDay) this.time.delayedCall(1800, () => { G.say("Shapes stand up out of the dark between the columns: the old dead of the citadel, who were never given their due."); this.summon("eidolon", 2); });
      }
      return;
    }
    // ---- isles
    const type = s.isle!, f = this.isleFeature(si), land = isleLand(si);
    if (type === "crete") {
      if (this.sanct) this.setupSanctuary(this.sanct, 0, 0);
      const spawnC = (kind: Species, n: number) => { for (let k = 0; k < n; k++) for (let i = 0; i < 60; i++) {
        const tx = 3 + Math.floor(Math.random() * (WW - 6)), ty = 3 + Math.floor(Math.random() * (WH - 6)), x = tx * TILE + 8, y = ty * TILE + 8;
        if (land(ox + tx, oy + ty) > 0.8 || !this.free(x, y) || (this.sanct && this.sanct.cells[ty][tx])) continue;
        const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - 40, y - 30, 80, 60), (px, py) => this.free(px, py) && land(ox + Math.floor(px / TILE), oy + Math.floor(py / TILE)) < 0.9);
        this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite); this.animals.push(a); break;
      } };
      if (!this.sanct) { spawnC("ibex", 1 + Math.floor(Math.random() * 3)); spawnC("hare", 1); if (Math.random() < 0.4) spawnC("boar", 1); }
      return;
    }
    const spawnOn = (kind: Species, n: number) => {
      for (let k = 0; k < n; k++) for (let i = 0; i < 60; i++) {
        const tx = 3 + Math.floor(Math.random() * (WW - 6)), ty = 3 + Math.floor(Math.random() * (WH - 6)), x = tx * TILE + 8, y = ty * TILE + 8;
        if (land(ox + tx, oy + ty) > 0.8 || !this.free(x, y)) continue;
        const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - 40, y - 30, 80, 60), (px, py) => this.free(px, py) && land(ox + Math.floor(px / TILE), oy + Math.floor(py / TILE)) < 0.9);
        this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite); this.animals.push(a); break;
      }
    };
    if (type === "goats") spawnOn("ibex", 3 + Math.floor(Math.random() * 2));
    if (type === "nymph") { spawnOn("deer", 1); spawnOn("hare", 2); }
    if (type === "sacred") spawnOn("bird", 3);
    if (type === "reef") spawnOn("crab", 2);
    if (type === "sirens" && G.isDay && !s.cleared) { this.spawnMonster("siren"); this.siteBeast = this.monster; }
    // The wreck lies on the beach south of the heart (on the reef, at it).
    let wreck: [number, number] = f;
    if (type === "sirens") { for (let y = f[1]; y < si.h * WH; y++) if (land(f[0], y) > 0.86) { wreck = [f[0] + 2, y - 1]; break; } }
    if (!here(f) && !here(wreck)) return;
    const name = s.name;
    switch (type) {
      case "nymph": {
        if (!here(f)) break;
        prop("cavemouth", f, true, 4);
        const [nx, ny] = at([f[0], f[1] + 2]);
        const nymph = this.add.image(nx, ny + 6, "naiad").setOrigin(0.5, 1).setDepth(ny + 6);
        this.tweens.add({ targets: nymph, y: ny + 5, yoyo: true, repeat: -1, duration: 1400 });
        const who = name === "Aiaia" ? "Circe" : name === "Ogygia" ? "Calypso" : "the nymph";
        this.targets.push({ x: nx, y: ny, label: `Speak with ${who}`, act: () => sc.nymphTalk(who) });
        break;
      }
      case "goats": if (here(f)) { prop("cavemouth", f, true, 4); this.targets.push({ x: at(f)[0], y: at(f)[1] + 8, get label() { return s.marks!.cave === seasonKey(G.data.year, G.month.season) ? "" : "Look into the great cave"; }, act: () => sc.cyclopsCave() }); } break;
      case "sacred": if (here(f)) {
        prop("palm", f, true, 6); prop("altar", [f[0] + 2, f[1] + 1]);
        this.targets.push({ x: at([f[0] + 2, f[1] + 1])[0], y: at([f[0] + 2, f[1] + 1])[1] + 4, label: "Make an offering to Apollo and Artemis", act: () => ui(sc).priestTalk("Apollo", "", "Leto's altar on Ortygia", true, 8) });
        this.targets.push({ x: at(f)[0], y: at(f)[1] + 6, get label() { return s.marks!.palm ? "" : "Pray under Leto's palm"; }, act: () => sc.letoPalm() });
      } break;
      case "forge": if (here(f)) { prop("pl_Forge", f, true, 6); this.targets.push({ x: at(f)[0], y: at(f)[1] + 8, get label() { return s.marks!.forge === seasonKey(G.data.year, G.month.season) ? "" : "Search about the god's forge"; }, act: () => sc.godsForge() }); } break;
      case "sirens": case "reef": if (here(wreck)) {
        const img = prop("wreck", wreck, false, 8); if (s.treasury) img.setAlpha(0.8);
        this.targets.push({ x: at(wreck)[0], y: at(wreck)[1], get label() { return s.treasury ? "" : "Search the wreck"; }, act: () => sc.searchWreck() });
      } break;
    }
  }

  // ---- the great sanctuaries: Delphi and Knossos
  sanct?: UniqueLayout;
  /** Set Delphi and Knossos somewhere no one has been yet, once, the first time the wild is walked. */
  placeSanctuaries() {
    const a = G.data.anchors;
    if (a.delphi && a.knossos) return;
    const taken = new Set([a.spring, a.satyrs, a.cave, a.tirShrine, a.tirGrave, `${G.data.wx},${G.data.wy}`].filter(Boolean) as string[]);
    const ok = (x0: number, y0: number, other?: string) => {
      if (x0 <= 0 && x0 + 1 >= 0) return false; // clear of the village road's column
      if (other) { const [ox, oy] = other.split(",").map(Number); if (Math.abs(ox - x0) < 5 && Math.abs(oy - y0) < 5) return false; }
      for (let y = y0 - 1; y <= y0 + 2; y++) for (let x = x0 - 1; x <= x0 + 2; x++) {
        const k = `${x},${y}`;
        if (G.data.screens[k] || taken.has(k) || fortressAt(G.data.seed, x, y) || (x === 0 && (y === 0 || y === 1))) return false;
      }
      return true;
    };
    // Far out, so they take finding: no part of Delphi nearer than 10 screens to the homestead, nor of Knossos than 16.
    const far = (x0: number, y0: number, min: number) => Math.min(...[[x0, y0], [x0 + 1, y0], [x0, y0 + 1], [x0 + 1, y0 + 1]].map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)))) >= min;
    a.delphi ??= pickUniqueSpot(G.data.seed, 1, DELPHI_FAR, DELPHI_FAR + 4, (x, y) => far(x, y, DELPHI_FAR) && ok(x, y, a.crete)) ?? undefined;
    // Knossos stands on Crete now: a mainland Knossos never found moves out to sea with it. (One already found stays.)
    if (a.knossos && !G.data.sites.Knossos) a.knossos = undefined;
    if (!a.crete && !G.data.sites.Knossos) {
      // Crete, six screens by three, far out: nothing walked, no citadel, nor Delphi, within two screens of it.
      const clear = (x0: number, y0: number) => {
        if (x0 - 3 <= 0 && x0 + 8 >= 0) return false; // well clear of the village road's column
        const big = [[x0, y0], [x0 + 5, y0], [x0, y0 + 2], [x0 + 5, y0 + 2]].map(([x, y]) => Math.max(Math.abs(x), Math.abs(y)));
        if (Math.min(...big) < KNOSSOS_FAR) return false;
        if (a.delphi) { const [dx0, dy0] = a.delphi.split(",").map(Number); if (dx0 > x0 - 5 && dx0 < x0 + 10 && dy0 > y0 - 5 && dy0 < y0 + 7) return false; }
        for (let y = y0 - 2; y <= y0 + 4; y++) for (let x = x0 - 2; x <= x0 + 7; x++) { const k = `${x},${y}`; if (G.data.screens[k] || taken.has(k) || fortressAt(G.data.seed, x, y)) return false; }
        return true;
      };
      a.crete = pickUniqueSpot(G.data.seed, 3, KNOSSOS_FAR + 2, KNOSSOS_FAR + 9, (x, y) => clear(x - 3, y - 1)) ?? undefined;
      if (a.crete) { const [cx0, cy0] = a.crete.split(",").map(Number); a.crete = `${cx0 - 3},${cy0 - 1}`; a.knossosAt = pickKnossosScreen(creteAt(a, cx0 - 3, cy0 - 1)!, G.data.seed); }
    }
  }
  stampSanctuary(objs: number[][], ground: number[][]) {
    const s = this.site!, si = this.siteInfo!, wx = G.data.wx, wy = G.data.wy;
    const tiles = { WALL: s.kind === "knossos" ? T.WALL : T.CYCLO, FLAGS: T.FLAGS, COLUMN: T.COLUMN, STONE: T.STONE, BOULDER: T.BOULDER, BRUSH: T.BRUSH, TREE: T.TREE, OLIVE: T.OLIVE, WATER: T.WATER, PATH: T.PATH, DIRT: T.DIRT, LIMESTONE: T.LIMESTONE, FLOWERS: T.FLOWERS };
    const L = s.kind === "delphi" ? delphiLayout(tiles) : knossosLayoutGrand(tiles);
    this.sanct = L;
    const ox = (wx - si.x0) * WW, oy = (wy - si.y0) * WH, within = this.siteSides(wx, wy);
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const b: Side | null = y === 0 ? "N" : y === WH - 1 ? "S" : x === 0 ? "W" : x === WW - 1 ? "E" : null;
      if (b && within.includes(b) && objs[y][x] === T.EDGE) objs[y][x] = -1;
      const c = L.cells[oy + y][ox + x]; if (!c) continue;
      if (c.g !== undefined) ground[y][x] = c.g;
      if (c.o === undefined) continue;
      if (b && !within.includes(b) && objs[y][x] === T.EDGE && c.g !== T.PATH) continue;
      objs[y][x] = c.o;
    }
  }
  setupSanctuary(L: UniqueLayout = this.sanct!, ox0?: number, oy0?: number) {
    const s = this.site!, si = this.siteInfo!, sc = this, wx = G.data.wx, wy = G.data.wy;
    const ox = ox0 ?? (wx - si.x0) * WW, oy = oy0 ?? (wy - si.y0) * WH;
    const here = ([x, y]: [number, number]) => x >= ox && x < ox + WW && y >= oy && y < oy + WH;
    const at = ([x, y]: [number, number]): [number, number] => [(x - ox) * TILE + 8, (y - oy) * TILE + 8];
    const prop = (key: string, p: [number, number], solid = true, dy = 6) => { const [x, y] = at(p); const img = this.add.image(x, y + dy, key).setOrigin(0.5, 1).setDepth(y + dy); if (solid) this.solidAt(x, y + dy - 4, Math.min(img.width - 4, 30), 8); return img; };
    const figure = (p: [number, number], id: string, female: boolean, tunic: string, veil?: string) => {
      const key = `folk_${id}`;
      if (!this.textures.exists(key)) makeFigureTexture(this, key, { tunic, hair: "#2a1a12", skin: female ? "#d8a47a" : "#b07850" }, { veil, long: female });
      const [x, y] = at(p); return this.add.sprite(x, y, key, 0).setDepth(y + 8);
    };
    const pure = () => s.marks!.pure === G.dayNumber;
    s.marks ??= {}; s.looted ??= [];
    if (s.kind === "delphi" && L.at.tripod) {
      if (here(L.at.tripod)) { prop("tripod", L.at.tripod, true, 8); figure(L.at.pythia, "pythia", true, "#f0ece0", "#e8e0c8"); this.targets.push({ x: at(L.at.tripod)[0], y: at(L.at.tripod)[1] + 10, label: "Consult the Pythia", act: () => sc.oracle() }); }
      if (here(L.at.altar)) { prop("altar", L.at.altar); this.targets.push({ x: at(L.at.altar)[0], y: at(L.at.altar)[1] + 4, label: "Make an offering at Apollo's altar", act: () => ui(sc).priestTalk("Apollo", "", "the great altar at Delphi", true, 8) }); }
      if (here(L.at.omphalos)) { prop("omphalos", L.at.omphalos); this.targets.push({ x: at(L.at.omphalos)[0], y: at(L.at.omphalos)[1] + 4, get label() { return s.marks!.omphalos ? "The omphalos" : "Lay your hand on the omphalos"; }, act: () => sc.omphalos() }); }
      if (here(L.at.spring)) this.targets.push({ x: at(L.at.spring)[0], y: at(L.at.spring)[1], get label() { return pure() ? "" : "Wash in the Castalian spring"; }, act: () => { s.marks!.pure = G.dayNumber; sc.gesture("act"); G.say("You wash your hands and face and hair in the Castalian spring. The water is so cold it burns. You are clean to ask the god."); } });
      for (const [name, p] of L.treasuries) if (here(p)) this.targets.push({ x: at(p)[0], y: at(p)[1], label: `Look into ${name}`, act: () => sc.treasuryOf(name) });
      return;
    }
    // Knossos
    if (here(L.at.throne)) prop("throne", L.at.throne);
    if (here(L.at.horns)) prop("horns", L.at.horns, false, 4);
    if (here(L.at.stair)) {
      const [x, y] = at(L.at.stair); this.add.image(x, y, "hole").setDepth(y - 8);
      this.targets.push({ x, y, label: "Go down the stair into the Labyrinth", act: () => sc.intoLabyrinth() });
    }
    if (here(L.at.ariadne)) {
      const a = figure(L.at.ariadne, "ariadne", true, "#c0392b");
      this.targets.push({ x: a.x, y: a.y + 2, label: "Speak with Ariadne", act: () => sc.ariadne() });
    }
    L.pithoi.forEach((p) => {
      if (!here(p)) return;
      const key = `${p[0]},${p[1]}`, img = prop("pithos", p);
      if (s.looted!.includes(key)) img.setTint(0x9a9080);
      this.targets.push({ x: at(p)[0], y: at(p)[1] + 6, get label() { return s.looted!.includes(key) ? "" : "Search the storage jar"; }, act: () => sc.searchJar(key, img) });
    });
  }
  /** The oracle: wash first, pay the fee, and ask; she answers once a month. */
  oracle(said?: string) {
    const s = this.site!, u = ui(this), month = `${G.data.year}-${G.data.month}`;
    const opts: { label: string; fn: () => void }[] = [];
    const asked = s.marks!.oracle === month, pure = s.marks!.pure === G.dayNumber, fee = 10;
    const ask = (q: () => string) => () => {
      if (!pure) { this.oracle("The priest stops you at the door of the inner room. \"Have you washed in Castalia? No? Then the god will not hear you. Go and wash.\""); return; }
      if (G.data.silver < fee) { this.oracle(`"The pelanos, the sacred cake, costs ${fee} silver. The god does not answer for nothing."`); return; }
      G.data.silver -= fee; s.marks!.oracle = month;
      this.oracle(`You pay for the sacred cake, and a goat is sprinkled with water; it shivers, and that means the god is willing. Down in the inner room the Pythia sits on her tripod over the cleft, laurel in her hand, and the sweet vapour rises. She speaks, and the priest gives you her words:\n\n${q()}\n\n(−${fee} silver)`);
    };
    if (!asked) {
      opts.push({ label: "Ask where you should go", fn: ask(() => this.prophecyPlace()) });
      opts.push({ label: "Ask how the gods regard you", fn: ask(() => this.prophecyGods()) });
      opts.push({ label: "Ask about your fate", fn: ask(() => {
        const t = G.data.lifeThread;
        return t >= 6 ? "\"Long is the thread the Spinner spun for you, and the Cutter's shears are far. Spend it well; it is not endless.\"" : t >= 3 ? "\"The thread runs on, but it is thinner than you think. Do not throw it away on the field of another's quarrel.\"" : "\"The Cutter has her shears open. Walk carefully, and honor the ones below.\"";
      }) });
    }
    u.showTalk("The Pythia", "Delphi · Apollo's priestess", said ?? (asked ? "The Pythia speaks once a month for each who asks. The priest shakes his head: come back next month." : `The Pythia sits in the adyton on her bronze tripod, veiled, a laurel branch in her hand. A priest waits to put your question.${pure ? "" : "\n\n(You have not washed at the Castalian spring today.)"}`), opts);
  }
  /** She names a place not yet found: the Labyrinth's palace, or a citadel of the heroes. */
  prophecyPlace(): string {
    const wx = G.data.wx, wy = G.data.wy, cands: { key: string; mx: number; my: number; text: string }[] = [];
    const k = G.data.anchors.knossosAt;
    if (k && !G.data.sites.Crete) { const [x, y] = k.split(",").map(Number); cands.push({ key: k, mx: x, my: y, text: "Out on the wine-dark sea, on the island of a hundred cities, where the bull's son is penned in the house of the double axe" }); }
    for (let r = 2; r <= 16 && cands.length < 3; r++) for (let y = wy - r; y <= wy + r; y++) for (let x = wx - r; x <= wx + r; x++) {
      if (Math.max(Math.abs(x - wx), Math.abs(y - wy)) !== r) continue;
      const f = fortressAt(G.data.seed, x, y); if (!f || x !== f.x0 || y !== f.y0 || G.data.screens[`${x},${y}`]) continue;
      if (!cands.some((c) => c.key === `${x},${y}`)) cands.push({ key: `${x},${y}`, mx: x + 1, my: y + 1, text: "Where the one-eyed builders piled stones too great for men" });
    }
    const c = cands[Math.floor(Math.random() * Math.min(2, cands.length))];
    if (!c) { const v = G.addFavor("Apollo", 1, 8); return `"You have found what there is to find near you. Go home, and plant." (Apollo ${v >= 0 ? "+" : ""}${v})`; }
    const dir = directions(c.mx, c.my);
    (G.data.foretold ??= []).push({ key: c.key, text: `${c.text.toLowerCase()}: ${dir}.` });
    return `"${c.text}, there your road goes: ${dir}."\n\n(Your journal, J, notes the place.)`;
  }
  prophecyGods(): string {
    const gods = TWELVE.map((g) => [g, G.favor(g)] as [string, number]).sort((a, b) => b[1] - a[1]);
    const [hi, lo] = [gods[0], gods[gods.length - 1]];
    return `"${hi[0]} holds a hand over you; ${lo[0]} ${lo[1] < 0 ? "remembers a slight" : "has not yet noticed you"}. Honor the one who is cold to you, before you need them."`;
  }
  omphalos() {
    const s = this.site!; this.gesture("look");
    if (s.marks!.omphalos) { G.say("The omphalos: the stone Zeus' two eagles met above, flying from the ends of the earth."); return; }
    s.marks!.omphalos = G.dayNumber; const v = G.addFavor("Apollo", 1, 8);
    G.say(`You lay your hand on the navel of the world. Two eagles, flying from the ends of the earth, met above this stone. You feel the middle of everything under your palm. (Apollo ${v >= 0 ? "+" : ""}${v})`);
  }
  /** The cities' treasuries: dedicate something fine to the god, or (sacrilege) take something. */
  treasuryOf(name: string, said?: string) {
    const s = this.site!, u = ui(this), key = `t:${name}`, held = G.selectedItem?.id ?? "", find = held && ITEMS[held].kind === "find";
    const opts: { label: string; fn: () => void }[] = [];
    if (find) opts.push({ label: `Dedicate your ${ITEMS[held].name.toLowerCase()} to Apollo`, fn: () => {
      const val = ITEMS[held].value ?? 0; G.removeItem(held, 1);
      const v = G.addFavor("Apollo", val >= 30 ? 2 : 1, 8);
      if (val >= 40) G.earn("Kleos", 1, `your gift to Apollo at Delphi`);
      this.treasuryOf(name, `You set your ${ITEMS[held].name.toLowerCase()} among the offerings, and a priest writes your name on the list of givers. (Apollo ${v >= 0 ? "+" : ""}${v})`);
    } });
    if (!s.looted!.includes(key)) opts.push({ label: "Slip something into your pack while no one is looking", fn: () => {
      s.looted!.push(key); G.data.silver += 30; const v = G.addFavor("Apollo", -4); G.earn("Hubris", 2, "you robbed the god at Delphi");
      u.closeTalk(); G.say(`A silver bowl, a bronze statuette: 30 silver's worth, gone into your pack. The laurels hiss though there is no wind. (Apollo ${v}; +2 Hubris)`);
    } });
    u.showTalk(name[4].toUpperCase() + name.slice(5), "Delphi · the Sacred Way", said ?? `A little marble house built to hold one city's thanks to the god: bowls and tripods of bronze and silver, statuettes, shields taken in battle, a gold crown on a peg. ${find ? "" : "(Hold a fine find to dedicate it here.)"}`, opts);
  }
  ariadne(said?: string) {
    const s = this.site!, u = ui(this), opts: { label: string; fn: () => void }[] = [];
    if (s.minotaur !== "slain") {
      if (!G.count("Clew")) opts.push({ label: s.clew ? "Ask her for another thread" : "Say that you will go into the Labyrinth", fn: () => {
        s.clew = true; this.ariadne(`She looks at you a long while, and then presses a ball of red thread into your hands. "Tie the end at the door, and let it run out behind you. It is the only way back. Daedalus made it so that no one comes out." ${give("Clew", 1)}`);
      } });
      opts.push({ label: "Ask about the Minotaur", fn: () => this.ariadne(`"My brother. Asterion, the starry one: my mother's son by the bull Poseidon sent. My father keeps him below, and feeds him the youths of Athens. He is very strong, and he knows the dark. Kill him, if you can. Carry a torch, and do not let him corner you."`) });
    } else if (!s.marks!.ariadne) opts.push({ label: "Tell her the Minotaur is dead", fn: () => {
      s.marks!.ariadne = G.dayNumber; const v = G.addFavor("Dionysus", 2, 8);
      this.ariadne(`She closes her eyes. "Then it's over." When she opens them she is almost smiling. "Take this: wine from my own vines, and my thanks. A god has asked me to be his bride, and I think I will say yes." ${give("Wine", 2)}. (Dionysus ${v >= 0 ? "+" : ""}${v})`);
    } });
    const greet = s.minotaur === "slain" ? `Ariadne, daughter of Minos. "The palace is quieter now."` : `A young woman in a flounced red skirt, with gold in her hair: Ariadne, daughter of Minos. "You have the look of someone who has come about the Labyrinth."`;
    u.showTalk("Ariadne", "Knossos · daughter of Minos", said ?? greet, opts);
  }
  intoLabyrinth() {
    if (this.leaving) return;
    G.data.torchLit = G.count("Lamp") > 0 || G.count("Torch") > 0 || G.data.divine.day.hecateLight === G.dayNumber;
    if (G.doomed("Hecate") && !G.data.divine.day.hecateLight) { G.data.torchLit = false; G.say("Your light will not catch. Hecate denies you fire in the dark."); }
    else if (G.count("Lamp") <= 0 && G.data.torchLit && G.data.divine.day.hecateLight !== G.dayNumber) G.removeItem("Torch", 1);
    G.data.px = this.player.x; G.data.py = this.player.y + 18;
    G.data.scene = "Labyrinth"; G.data.entry = "D";
    this.goTo("Labyrinth");
  }

  /** On arriving: the first sight of a site, or where in it you are. */
  siteArrival(found: SiteRec | null) {
    const s = this.site!, part = partOf(s, G.data.wx, G.data.wy), wx = G.data.wx, wy = G.data.wy;
    const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
    if (s.kind === "delphi" || s.kind === "knossos") {
      if (found) G.say(s.kind === "delphi"
        ? `A wall of fitted grey stone climbs the mountain's shoulder; inside it, a temple, treasuries, laurels, smoke from an altar. ${s.line} (Wash at the Castalian spring before you ask the god anything. Your journal, J, marks the place.)`
        : `A palace with no walls, its roofs crowned with stone horns, its columns painted red: so many rooms it looks like a town. ${s.line} (Your journal, J, marks the place.)`);
      else G.say(`${s.name}.`);
      return;
    }
    if (s.kind === "fortress") {
      if (found) {
        const ix = wx - s.x0, iy = wy - s.y0, run = [iy < 2 ? "south" : "", iy > 0 ? "north" : "", ix < 2 ? "east" : "", ix > 0 ? "west" : ""].filter(Boolean);
        const hint = s.fate === "brigands" ? "Smoke rises from inside the walls: someone has made the ruin their own." : s.fate === "beast" ? "There are gnawed bones in the gateway. Something large has its lair inside." : "No birds sing on these walls, and the wind sounds like voices.";
        G.say(`Walls of huge unworked boulders, too great for men to have lifted: Cyclopean work. ${cap(s.line)} You are at ${part === "the heart of it" ? "its heart" : part}; the walls run on ${run.join(" and ")}. ${hint} (Your journal, J, marks the place.)`);
      } else G.say(`${cap(s.name)}, ${part === "the heart of it" ? "within the walls" : part}.${s.cleared ? "" : s.fate === "brigands" && part === "the heart of it" ? " Smoke from the brigands' fire." : ""}`);
      if (part === "the heart of it" && !s.cleared && s.fate === "haunted" && G.isDay) this.time.delayedCall(1200, () => G.say("By daylight the hall is empty. But the cold by the hearth is not the cold of stone. (Bring wine, honey or milk to pour for the dead.)"));
    } else {
      if (found) G.say(`Land, out of the open sea. ${s.line} This is ${s.name}.${s.w * s.h > 1 ? " It runs on past what you can see from here." : ""}`);
      else G.say(`${cap(s.name)}.`);
      if (s.isle === "crete" && this.key === G.data.anchors.knossosAt && !s.marks?.palace) {
        (s.marks ??= {}).palace = G.dayNumber;
        this.time.delayedCall(1400, () => G.say("Knossos: Minos' palace, with no walls at all, its roofs crowned with stone horns, its columns painted red. So many rooms it looks like a town. Daedalus built the Labyrinth beneath it to hold the bull-headed son of the queen."));
      }
    }
  }

  /** Each frame: is the citadel's beast dead? Have its brigands been beaten? */
  siteTick() {
    const s = this.site; if (!s || s.cleared) return;
    const b = this.siteBeast;
    if (b && (!b.sprite.active || b.state === "dead" || b.state === "gone" || b.appeased)) {
      this.siteBeast = undefined;
      if (s.kind === "fortress") { s.cleared = true; G.earn("Kleos", 1, `you rid ${s.name} of its ${beast(s.beast!)}`); this.time.delayedCall(1200, () => G.say(`With the ${beast(s.beast!)} gone, ${s.name} is quiet. Nothing now stands between you and the king's treasury.`)); }
      else if (s.isle === "sirens" && b.state === "dead") { s.cleared = true; this.time.delayedCall(1200, () => G.say("The song has stopped. The flowery isle is only an island now.")); }
    }
  }

  // ---- searches and the like
  searchJar(key: string, img: Phaser.GameObjects.Image) {
    const s = this.site!; if (s.looted!.includes(key)) return;
    s.looted!.push(key); this.gesture("act"); img.setTint(0x9a9080);
    const k = Math.random();
    const got = k < 0.3 ? null : k < 0.5 ? give("Millet", 2) : k < 0.62 ? give("Wine", 1) : k < 0.72 ? give("OldCoin", 1) : k < 0.82 ? give("Figurine", 1) : k < 0.9 ? give("Fibula", 1) : give("Arrowhead", 2);
    G.say(got ? `You tip the great jar and reach down into it. ${got}.` : pick(["Only dust and a dead mouse.", "Empty, but for the smell of old oil.", "Cracked, and long since emptied."]));
  }
  searchTreasury(hoard: Phaser.GameObjects.Image | null) {
    const s = this.site!; if (s.treasury) return;
    if (s.fate === "haunted" && !s.cleared) { G.say("As your hand touches the gold, the air goes cold. The dead guard their king's treasure."); this.summon("eidolon", 2); }
    s.treasury = true; this.gesture("act"); hoard?.destroy();
    const silver = 40 + Math.floor(Math.random() * 40) + this.depth * 4; G.data.silver += silver;
    const extra = [Math.random() < 0.3 ? give("Thunderstone", 1) : give("Amber", 2), give("OldCoin", 3), give("Fibula", 1)];
    if (!G.count("sword") && Math.random() < 0.6) extra.push(give("sword", 1));
    G.say(`The treasury of ${s.name}: +${silver} silver, ${extra.join(", ")}.`);
    G.earn("Kleos", 2, `you found the treasure of ${s.name}`); G.note("treasury");
  }
  searchTholos() {
    const s = this.site!; if (s.marks!.tholos) return;
    s.marks!.tholos = G.dayNumber; this.gesture("act");
    G.say(`You crawl in under the great lintel. The beehive dome closes over you, every stone ring smaller than the one below. In the floor, a shaft grave: ${[give("Amber", 2), give("OldCoin", 2), give("Figurine", 1)].join(", ")}.`);
    if ((s.fate === "haunted" && !s.cleared) || (!G.isDay && Math.random() < 0.4)) { this.time.delayedCall(900, () => G.say("Something stirs behind you, in the dark of the dome.")); this.summon("eidolon", 1); }
  }
  layToRest() {
    const s = this.site!; if (s.cleared) return;
    const held = G.selectedItem?.id ?? "";
    if (!["Wine", "Honey", "Milk", "OliveOil"].includes(held)) { G.say("The dead want a libation: hold wine, honey, milk or oil, and pour it on the hearth."); return; }
    G.removeItem(held, 1); this.gesture("act");
    s.cleared = true; const v = G.addFavor("Hades", 2, 8);
    for (const a of this.animals) if (a.kind === "eidolon") { a.appeased = true; a.state = "idle"; this.tweens.add({ targets: a.sprite, alpha: 0, duration: 1500 }); }
    G.say(`You pour the ${ITEMS[held].name.toLowerCase()} on the cold hearth and speak the names you guess at, kings and their women, servants, the children. The cold goes out of the hall like a breath let go. ${s.name}'s dead are at rest. (Hades ${v >= 0 ? "+" : ""}${v})`);
    G.earn("Kleos", 1, `you laid the dead of ${s.name} to rest`);
  }
  searchWreck() {
    const s = this.site!; if (s.treasury) return;
    if (s.isle === "sirens" && !s.cleared && G.isDay && this.siteBeast) G.say("You search with the song in your ears the whole time, sweeter and sweeter.");
    s.treasury = true; this.gesture("act");
    if (s.isle === "sirens") {
      const silver = 30 + Math.floor(Math.random() * 30); G.data.silver += silver;
      G.say(`Among the ribs of the ship, the crew's chest, and their bones around it: +${silver} silver, ${[give("Pearl", 1), give("OldCoin", 2), Math.random() < 0.15 ? give("Thunderstone", 1) : give("Amber", 1)].join(", ")}.`);
    } else {
      const silver = 10 + Math.floor(Math.random() * 15); G.data.silver += silver;
      G.say(`Sealed jars still wedged in the hold, and a captain's purse: +${silver} silver, ${[give(Math.random() < 0.5 ? "Wine" : "OliveOil", 2), give("OldCoin", 1), ...(Math.random() < 0.4 ? [give("Pearl", 1)] : [])].join(", ")}.`);
    }
  }
  cyclopsCave() {
    const s = this.site!, sk = seasonKey(G.data.year, G.month.season); if (s.marks!.cave === sk) return;
    s.marks!.cave = sk; this.gesture("act");
    G.say(`A cave big enough to stable a ship. Pens of lambs and kids, racks of cheeses, pails of whey: the master is out with his flock. You help yourself: ${give("Milk", 3)}, ${give("Meat", 2)}.`);
    if (Math.random() < 0.25) this.time.delayedCall(1200, () => this.harm(12, "A boulder the size of a cart comes thundering down the slope, flung by something enormous coming home. It glances off you!", "a Cyclops' boulder", true));
  }
  letoPalm() {
    const s = this.site!; if (s.marks!.palm) return;
    s.marks!.palm = G.dayNumber; this.gesture("look");
    const a = G.addFavor("Artemis", 2, 8), b = G.addFavor("Apollo", 1, 8);
    G.say(`You lay your hand on the palm Leto clung to when she bore the twins, and pray. Quail rise from the grass all round you. (Artemis ${a >= 0 ? "+" : ""}${a}, Apollo ${b >= 0 ? "+" : ""}${b})`);
  }
  godsForge() {
    const s = this.site!, sk = seasonKey(G.data.year, G.month.season); if (s.marks!.forge === sk) return;
    s.marks!.forge = sk; this.gesture("act");
    const v = G.addFavor("Hephaestus", 1, 6);
    G.say(`The anvil is still warm. Around it lie the god's leavings: ${[give("Obsidian", 2), give("Copper", 2), ...(Math.random() < 0.2 ? [give("Thunderstone", 1)] : [])].join(", ")}. (Hephaestus ${v >= 0 ? "+" : ""}${v})`);
  }
  nymphTalk(who: string, said?: string) {
    const s = this.site!, u = ui(this), today = G.dayNumber, again = (t: string) => this.nymphTalk(who, t);
    const opts: { label: string; fn: () => void }[] = [];
    if (s.marks!.rest !== today) opts.push({ label: "Rest in her grotto", fn: () => {
      s.marks!.rest = today; G.addFatigue(-100); G.heal(99); G.essence = { ...G.essenceMax };
      again("You sleep on fleeces by a fire of cedar and citron-wood, and wake whole. (Rested: Fatigue, Vitality and Essence restored)");
    } });
    if (!s.treasury) opts.push({ label: "Ask her for a parting gift", fn: () => {
      s.treasury = true;
      if (who === "Circe") { const v = G.addFavor("Hecate", 1, 6); again(`"Since you ask so prettily." She digs a black-rooted, white-flowered herb from the hillside and puts it in your hand. "You'll want this, near singers and witches." ${give("Moly", 1)}. (Hecate ${v >= 0 ? "+" : ""}${v})`); }
      else { const v = G.addFavor("Hermes", 1, 6); again(`She gives you a cloak she wove at her loom, and a pearl from the sea-floor below her island. "Go, then. They all go." ${give("Cloth", 2)}, ${give("Pearl", 1)}. (Hermes ${v >= 0 ? "+" : ""}${v})`); }
    } });
    if (who === "Circe" && s.marks!.cup !== today) opts.push({ label: "Drink from the cup she offers", fn: () => {
      s.marks!.cup = today;
      if (G.count("Moly") > 0) { G.earn("Kleos", 1, "you drank Circe's cup unchanged"); const v = G.addFavor("Hermes", 1, 6); again(`You drink. Nothing happens. She stares at you, then at the moly at your belt, and laughs, delighted. "Hermes' doing! Well. You must be the clever one they told me of." (Hermes ${v >= 0 ? "+" : ""}${v})`); return; }
      u.closeTalk(); G.addFatigue(40); G.data.clock = Math.min(G.data.clock + 3, 23.5);
      G.say("The wine is sweet, and then the world tilts. You come to yourself hours later, on all fours in her sty, rooting among the acorns, with a nose too short and a voice that won't make words. Then it passes. She is laughing. (Time passes; +40 Fatigue. Moly, they say, protects against her.)");
    } });
    if (who === "Calypso") opts.push({ label: "Ask her the way home", fn: () => again(`"Home! Always home. I could make you deathless, and you'd still sit on the shore and weep for a stony farm." She sighs. "East, and then the way you came."`) });
    const greet = who === "Circe" ? `A woman with heavy braided hair sits weaving at a loom in the grotto's mouth, singing. Wolves and lions lie about her like dogs. "A guest! Come in, sit, drink."`
      : who === "Calypso" ? `A nymph with hair like dark water looks up from her loom, and smiles as though she has been waiting a long time. "Another one the sea has sent me."` : `A nymph of the island watches you from the grotto's mouth.`;
    u.showTalk(who === "the nymph" ? "A nymph" : who, `${s.name} · a goddess of the island`, said ?? greet, opts);
  }

  /** Walking off into the sea without a boat, or off an isle: not without a boat. */
  mayLeave(dx: number, dy: number): boolean {
    if (this.boat) return true;
    const k = `${G.data.wx + dx},${G.data.wy + dy}`, n = G.data.screens[k];
    if (this.rec.site && n?.site === this.rec.site) return true;
    const sd: Side = dx < 0 ? "W" : dx > 0 ? "E" : dy < 0 ? "N" : "S";
    const seaward = this.rec.terrain === 7 && this.rec.shore?.[sd] === "1" && !n;
    if (!this.isSea && n?.terrain !== 6 && !seaward) return true;
    this.player.setPosition(Math.max(12, Math.min(WW * TILE - 12, this.player.x - dx * 8)), Math.max(12, Math.min(WH * TILE - 14, this.player.y - dy * 8)));
    if (this.time.now > this.seaSaidT) { this.seaSaidT = this.time.now + 4000; G.say("Open sea that way, as far as you can see. Not without a boat."); }
    return false;
  }

  // ---------------------------------------------------------------- landmarks (landmarks.ts)
  lm: { name: string; def: LandmarkDef; x: number; y: number } | null = null;
  lmInside = false; lmGuards: Animal[] = [];
  /**
   * Rivers: from each side the river crosses, it winds to a meeting point in the middle; a river that crosses only
   * one side ends in a lake. Three tiles or wider it has a deep middle, and then (usually) a ford, all shallows.
   */
  carveRivers(objs: number[][], ground: number[][], wx: number, wy: number) {
    const ends: { sd: Side; at: number; w: number }[] = [];
    for (const sd of ["N", "S", "E", "W"] as Side[]) { const rv = sideRiver(wx, wy, sd); if (rv) ends.push({ sd, ...rv }); }
    this.rec.river = ends.length > 0;
    if (!ends.length) return;
    const g = rng((screenSeed(wx, wy) ^ 0x61e4) >>> 0);
    const hx = 14 + Math.floor(g() * 12), hy = 10 + Math.floor(g() * 10);
    const stamp = (x: number, y: number, w: number) => {
      const r = w / 2;
      for (let yy = Math.floor(y - r - 1); yy <= y + r + 1; yy++) for (let xx = Math.floor(x - r - 1); xx <= x + r + 1; xx++) {
        if (xx < 0 || yy < 0 || xx >= WW || yy >= WH) continue;
        if (Math.hypot(xx + 0.5 - x, yy + 0.5 - y) <= r) { if (objs[yy][xx] !== T.SHALLOW) objs[yy][xx] = ground[yy][xx] === T.PATH ? T.SHALLOW : T.WATER; if (ground[yy][xx] !== T.PATH) ground[yy][xx] = T.SAND; } // a road crosses at a ford
      }
    };
    let widest = 0, fordAt: [number, number, number] | null = null;
    for (const e of ends) {
      widest = Math.max(widest, e.w);
      const mid = e.at + e.w / 2;
      let [x, y] = e.sd === "N" ? [mid, -1] : e.sd === "S" ? [mid, WH + 1] : e.sd === "W" ? [-1, mid] : [WW + 1, mid];
      const steps = 80;
      for (let i = 0; i < steps; i++) {
        const dx = hx + 0.5 - x, dy = hy + 0.5 - y, d = Math.hypot(dx, dy);
        if (d < 0.8) break;
        const wob = (g() - 0.5) * 1.4; // meander
        x += (dx / d) * 0.6 + (e.sd === "N" || e.sd === "S" ? wob : 0); y += (dy / d) * 0.6 + (e.sd === "W" || e.sd === "E" ? wob : 0);
        stamp(x, y, e.w);
        if (!fordAt && e.w >= 3 && i === 14) fordAt = [x, y, e.w];
      }
    }
    if (ends.length === 1) { const R = 2.5 + g() * 2; for (let yy = hy - 6; yy <= hy + 6; yy++) for (let xx = hx - 8; xx <= hx + 8; xx++) if (xx > 0 && yy > 0 && xx < WW - 1 && yy < WH - 1 && Math.hypot((xx - hx) * 0.8, yy - hy) <= R + 2) { objs[yy][xx] = T.WATER; ground[yy][xx] = T.SAND; } }
    else stamp(hx + 0.5, hy + 0.5, widest + 1);
    // A ford across the deep river: all shallows, wide enough to wade.
    if (fordAt && g() < 0.85) {
      const [fx, fy, w] = fordAt;
      for (let yy = Math.floor(fy - w); yy <= fy + w; yy++) for (let xx = Math.floor(fx - w); xx <= fx + w; xx++)
        if (xx > 0 && yy > 0 && xx < WW - 1 && yy < WH - 1 && Math.hypot(xx + 0.5 - fx, yy + 0.5 - fy) <= w * 0.8 && objs[yy][xx] === T.WATER) objs[yy][xx] = T.SHALLOW;
      this.rec.ford = [Math.floor(fx), Math.floor(fy)];
    } else this.rec.ford = null;
  }

  /** Lay out a landmark: clear its ground, then its own pattern of trees, stones, water or ruins. */
  stampLandmark(objs: number[][], ground: number[][], cx: number, cy: number, d: LandmarkDef, gen: () => number) {
    const r = d.r, propAt = new Set(d.props.map(([, dx, dy]) => `${cx + dx},${cy + dy}`));
    const nearProp = (x: number, y: number) => d.props.some(([, dx, dy]) => Math.abs(x - cx - dx) <= 2 && Math.abs(y - cy - dy) <= 2);
    const grove = this.rec.feature === "Olive grove" ? T.OLIVE : this.rec.terrain === 12 || this.rec.terrain === 9 ? T.PINE : T.TREE;
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      if (x < 2 || y < 2 || x >= WW - 2 || y >= WH - 2) continue;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist > r + 0.4 || objs[y][x] === T.EDGE) continue;
      const edge = dist > r - 1.2, ring = Math.max(Math.abs(x - cx), Math.abs(y - cy));
      let t = -1;
      const roll = gen();
      switch (d.layout) {
        case "grove": t = dist > 2 && roll < d.density ? grove : -1; break;
        case "rocks": t = roll < d.density ? (gen() < 0.4 ? T.BOULDER : T.STONE) : -1; break;
        case "scree": t = roll < d.density ? T.STONE : roll < d.density + 0.05 ? T.BOULDER : -1; if (this.rec.terrain === 8) ground[y][x] = T.SAND; break;
        case "meadow": t = roll < d.density ? T.FLOWERS : -1; break;
        case "thicket": t = roll < d.density ? (this.rec.terrain === 11 ? T.THORN : T.BRUSH) : -1; break;
        case "field": t = roll < d.density ? T.BRUSH : -1; break;
        case "reeds": t = roll < d.density ? T.REEDS : roll < d.density + 0.08 ? T.WATER : -1; break;
        case "pool": t = dist <= r * 0.38 ? T.WATER : roll < d.density ? (this.rec.terrain === 8 ? -1 : gen() < 0.5 ? T.REEDS : T.FLOWERS) : -1; break;
        case "ruin": t = ring === r - 1 && roll < d.density ? (gen() < 0.6 ? T.BOULDER : T.STONE) : ring < r - 1 && roll < 0.06 ? T.STONE : -1; break;
        case "mound": t = edge && roll < d.density ? T.STONE : -1; break;
        case "beach": ground[y][x] = T.SAND; t = roll < d.density ? T.STONE : -1; break;
        case "clearing": t = roll < d.density ? T.STONE : -1; break;
      }
      if (nearProp(x, y) || propAt.has(`${x},${y}`)) t = -1;
      objs[y][x] = t;
    }
  }

  /** Draw the landmark's props, lay out what can be found there this season, and its cache and special action. */
  setupLandmark() {
    this.lmInside = false; this.lmGuards = [];
    // Now and then someone has left a boat where the shallows meet the shore.
    if (!this.rec.boatRolled) {
      this.rec.boatRolled = true;
      const shore = this.water.filter(([x, y]) => this.objects.getTileAt(x, y)?.index === T.SHALLOW && !this.boatSpot(x, y));
      if (shore.length > 6 && Math.random() < 0.12) {
        const [x, y] = shore[Math.floor(Math.random() * shore.length)];
        G.data.placed.push({ id: "Boat", where: this.placeKey(), x, y });
        this.time.delayedCall(800, () => G.say("Someone has left a little boat pulled up in the shallows here."));
      }
    }
    const lm = this.lm; if (!lm) return;
    const d = lm.def, sk = seasonKey(G.data.year, G.month.season), sc = this, rec = this.rec;
    rec.lmTook ??= {};
    for (const [key, dx, dy, solid] of d.props) {
      const x = (lm.x + dx) * TILE + 8, y = (lm.y + dy) * TILE + 14;
      const img = this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
      if (solid) this.solidAt(x, y - 4, Math.min(img.width - 6, 40), 8);
    }
    // Things lying about: the same spots each visit, gone once taken until the season turns.
    const r = rng((screenSeed(G.data.wx, G.data.wy) ^ 0x1a2d) >>> 0);
    for (let i = 0; i < d.nFinds; i++) {
      const [item, qty] = d.finds[i % d.finds.length];
      let placed = false;
      for (let k = 0; k < 40 && !placed; k++) {
        const a = r() * Math.PI * 2, dist = 1 + r() * (d.r - 1);
        const x = (lm.x + Math.cos(a) * dist) * TILE + 8, y = (lm.y + Math.sin(a) * dist) * TILE + 8;
        if (!this.openGround(x, y)) continue;
        placed = true;
        if (rec.lmTook[i] === sk) continue;
        this.dropItem(item, qty, x, y);
        this.pickups[this.pickups.length - 1].lm = i;
      }
    }
    const [ax, ay] = d.props.length ? [(lm.x + d.props[0][1]) * TILE + 8, (lm.y + d.props[0][2]) * TILE + 18] : [lm.x * TILE + 8, lm.y * TILE + 8];
    if (d.cache) this.targets.push({ x: ax, y: ay, get label() { return rec.lmCache === sk ? "" : d.cache!.label; }, act: () => sc.searchLandmark() });
    if (d.action === "lookout") this.targets.push({ x: ax + 6, y: ay - 4, label: `Look out from the ${lm.name.toLowerCase()}`, act: () => sc.lookout() });
    if (d.action === "dig") this.targets.push({ x: lm.x * TILE + 8, y: lm.y * TILE + 8, label: "Dig in the riverbed for water", act: () => sc.digWater() });
    if (d.action === "offer" && d.god) this.targets.push({ x: ax, y: ay - 2, label: `Make an offering to ${d.god} here`, act: () => ui(sc).priestTalk(d.god!, "", `the ${lm.name.toLowerCase()}`, true, 6) });
    if (rec.feature === "Burial mound") { rec.barrow ??= [lm.x, lm.y + 2]; this.setupBarrow(); }
  }

  /** Stepping into the landmark: its sight the first time, and the dangers that wait for whoever comes. */
  landmarkTick() {
    const lm = this.lm; if (!lm || this.paused || this.leaving) return;
    const tx = this.player.x / TILE, ty = (this.player.y + 4) / TILE;
    const inside = Math.hypot(tx - lm.x - 0.5, ty - lm.y - 0.5) <= lm.def.r;
    if (inside && !this.lmInside) {
      if (!this.rec.lmSeen) { this.rec.lmSeen = true; G.say(lm.def.sight); }
      this.lmDangers("enter");
    }
    this.lmInside = inside;
  }
  lmDangers(on: "enter" | "search" | "gather") {
    const lm = this.lm!; const rain = G.data.weather === "rain" || G.data.weather === "wind";
    for (const dg of lm.def.dangers) {
      if ((dg.kind === "hazard" ? dg.on : dg.on ?? "enter") !== on) continue;
      if (dg.kind !== "hazard" && dg.when && (dg.when === "night") === G.isDay) continue;
      if (dg.kind === "hazard" && dg.rain && !rain) continue;
      if (dg.kind === "hazard" && dg.cause === "bees" && on === "search" && G.selectedItem?.id === "Torch") { G.say("You hold the torch to the hollow: the smoke sends the bees drowsy."); continue; }
      if (Math.random() >= dg.chance) continue;
      if (dg.kind === "hazard") { this.harm(dg.dmg, dg.text, dg.cause, true); continue; }
      if (on === "enter" && this.lmGuards.length) continue; // they've already come for you this visit
      G.say(dg.text);
      if (dg.kind === "monster") {
        if (dg.monster === "skeleton") { this.rec.barrow = [lm.x, lm.y + 2]; this.setupBarrow(); }
        this.spawnMonster(dg.monster);
        if (this.monster && dg.monster !== "skeleton") { this.monster.sprite.setPosition(lm.x * TILE + 8, lm.y * TILE + 8); this.monster.charge(8); }
        if (this.monster) this.lmGuards.push(this.monster);
      } else {
        const free = (x: number, y: number) => this.free(x, y);
        const many = dg.species === "eidolon" ? (noumeniaNight() ? (dg.n ?? 1) + 1 : 1) : dg.n ?? 1; // the dead walk in company only at Noumenia
        for (let i = 0; i < many; i++) {
          const x = (lm.x + (i - 1) * 1.5) * TILE + 8, y = (lm.y + 1) * TILE + 8;
          const a = new Animal(this, dg.species as Species, x, y, new Phaser.Geom.Rectangle(x - lm.def.r * TILE, y - lm.def.r * TILE, lm.def.r * TILE * 2, lm.def.r * TILE * 2), free);
          this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
          if (dg.species === "eidolon") { a.sprite.setAlpha(0); this.tweens.add({ targets: a.sprite, alpha: 0.85, duration: 1200 }); }
          this.animals.push(a); this.lmGuards.push(a);
          a.charge(7); this.alarm(a);
        }
      }
    }
  }
  /** Search the landmark's cache: worth doing once a season, and not always safe. */
  searchLandmark() {
    const lm = this.lm!, d = lm.def, sk = seasonKey(G.data.year, G.month.season);
    if (this.rec.lmCache === sk) { G.say("You've already been through it this season. Come back when the season turns."); return; }
    const b = labor(EFFORT.pull, 2, "Oikos"); if (b === null) return;
    this.rec.lmCache = sk; this.gesture("look"); G.note("landmark");
    const got = d.cache!.items.filter(() => Math.random() < 0.75).map(([id, n]) => give(id, n));
    if (!got.length) got.push(give(d.cache!.items[0][0], d.cache!.items[0][1]));
    G.say(`${d.cache!.text} ${got.join(", ")}.${b}`);
    this.lmDangers("search");
  }
  /** From the heights you can see what lies around: the lands you will meet are fixed by what you saw. */
  lookout() {
    G.note("landmark");
    const lm = this.lm!, far = lm.name === "Ruined watchtower" || lm.name === "Acropolis ruins" ? 2 : 1;
    this.gesture("look");
    const seen: string[] = [];
    const dirs: [number, number, string][] = [[0, -1, "north"], [1, -1, "northeast"], [1, 0, "east"], [1, 1, "southeast"], [0, 1, "south"], [-1, 1, "southwest"], [-1, 0, "west"], [-1, -1, "northwest"]];
    for (let k = 1; k <= far; k++) for (const [dx, dy, name] of dirs) {
      const x = G.data.wx + dx * k, y = G.data.wy + dy * k, key = `${x},${y}`;
      if (x === 0 && (y === 0 || y === 1)) continue;
      let t = G.data.screens[key]?.terrain ?? G.data.rumors.find((q) => q.key === key)?.terrain;
      if (t === undefined) {
        t = rollTerrain(this.rec.terrain, rng((screenSeed(x, y) ^ 0x5ee) >>> 0)).terrain;
        G.data.rumors.push({ key, terrain: t, from: "lookout", day: G.dayNumber, told: true });
      }
      seen.push(`${k > 1 ? "far " : ""}${name}: ${terrain(t).name.toLowerCase()}`);
    }
    G.say(`From up here you can see the lands around. ${seen.slice(0, 8).join("; ")}.`);
    if (seen.length > 8) G.say(`And further off: ${seen.slice(8).join("; ")}.`);
  }
  digWater() {
    if (G.data.jarWater >= jarCap()) { G.say("Your jar is already full."); return; }
    const b = labor(EFFORT.dig, 2, "Oikos"); if (b === null) return;
    this.gesture("act");
    G.data.jarWater = jarCap(); G.say(`You dig down through the sand of the riverbed until water seeps in, and fill your jar.${b}`);
  }

  stampFeature(objs: number[][], fx: number, fy: number, name: string, gen: () => number) {
    const ring = (rad: number, fn: (x: number, y: number, d: number) => void) => {
      const R = Math.ceil(rad);
      for (let y = fy - R; y <= fy + R; y++) for (let x = fx - R; x <= fx + R; x++) {
        if (x < 2 || y < 2 || x >= WW - 2 || y >= WH - 2) continue;
        const d = Math.hypot(x - fx, y - fy); if (d <= rad + 0.3) fn(x, y, d);
      }
    };
    switch (name) {
      case "Herb patch": case "Flower meadow": ring(2.5, (x, y) => (objs[y][x] = gen() < 0.7 ? T.FLOWERS : -1)); break;
      case "Bee tree": case "Old oak": case "Fallen giant": case "Mossy hollow":
        ring(3, (x, y) => (objs[y][x] = -1)); objs[fy][fx] = T.TREE; ring(3, (x, y, d) => { if (d > 2.4 && gen() < 0.3) objs[y][x] = T.FLOWERS; }); break;
      case "Animal den": ring(2, (x, y) => (objs[y][x] = gen() < 0.4 ? T.BRUSH : -1)); objs[fy][fx] = T.BOULDER; break;
      case "Stone outcrop": case "Ore seam": case "Scree slope": case "Boundary stones":
        ring(2.5, (x, y) => (objs[y][x] = gen() < 0.5 ? (gen() < 0.4 ? T.BOULDER : T.STONE) : -1)); break;
      case "Abandoned field": ring(3, (x, y) => (objs[y][x] = gen() < 0.25 ? T.BRUSH : -1)); break;
      case "Olive grove": ring(3, (x, y) => (objs[y][x] = gen() < 0.3 ? T.OLIVE : -1)); break;
      // The far lands.
      case "Reed bed": ring(3, (x, y) => (objs[y][x] = gen() < 0.7 ? T.REEDS : -1)); break;
      case "Still pool": case "Mountain spring": case "Tide pools":
        ring(name === "Tide pools" ? 2 : 2.6, (x, y, d) => (objs[y][x] = d <= (name === "Tide pools" ? 0.8 : 1.4) ? T.WATER : name === "Still pool" && gen() < 0.5 ? T.REEDS : name === "Mountain spring" && gen() < 0.4 ? T.FLOWERS : name === "Tide pools" && gen() < 0.4 ? T.STONE : -1)); break;
      case "Oasis": ring(3.5, (x, y, d) => (objs[y][x] = d <= 1.6 ? T.WATER : d > 2.4 && gen() < 0.45 ? T.TREE : -1)); break;
      case "Willow stand": ring(3, (x, y) => (objs[y][x] = gen() < 0.35 ? T.TREE : -1)); break;
      case "Driftwood beach": case "Wild herd grounds": case "Dry wadi": case "Sun-bleached bones": ring(name === "Wild herd grounds" ? 4 : 3, (x, y) => (objs[y][x] = name === "Dry wadi" && gen() < 0.15 ? T.STONE : -1)); break;
      case "Lone oak": ring(3, (x, y) => (objs[y][x] = -1)); objs[fy][fx] = T.TREE; break;
      case "Headland": case "Eagle crag": case "Gully": ring(2.5, (x, y) => (objs[y][x] = gen() < 0.55 ? T.BOULDER : -1)); break;
      case "Shrine stones": ring(3, (x, y, d) => (objs[y][x] = d > 2.2 && gen() < 0.7 ? T.STONE : -1)); break;
      case "Burial mound": ring(2.5, (x, y, d) => (objs[y][x] = d < 1 ? T.BOULDER : d > 1.8 && gen() < 0.5 ? T.STONE : -1)); break;
      case "Old battlefield": ring(3.5, (x, y) => (objs[y][x] = gen() < 0.2 ? T.STONE : -1)); break;
      case "Thorn thicket": ring(3, (x, y) => (objs[y][x] = gen() < 0.6 ? T.THORN : -1)); break;
      case "Ruined watchtower": case "Acropolis ruins": {
        const h = name === "Acropolis ruins" ? 3 : 2;
        ring(h + 1.5, (x, y) => { const ex = Math.abs(x - fx), ey = Math.abs(y - fy); objs[y][x] = (ex === h || ey === h) && ex <= h && ey <= h && gen() < 0.75 ? (gen() < 0.6 ? T.BOULDER : T.STONE) : -1; });
        break;
      }
    }
  }

  free(x: number, y: number) {
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tx < 1 || ty < 1 || tx >= WW - 1 || ty >= WH - 1) return false;
    const o = this.objects.getTileAt(tx, ty)?.index ?? -1;
    return o === -1 || o === T.FLOWERS;
  }

  spawnCreatures(p: Profile, gen: () => number) {
    this.animals = [];
    const free = (x: number, y: number) => this.free(x, y);
    const spot = (): [number, number] => {
      for (let i = 0; i < 60; i++) {
        const x = 3 + Math.floor(gen() * (WW - 6)), y = 3 + Math.floor(gen() * (WH - 6));
        if (Math.hypot(x * TILE - this.player.x, y * TILE - this.player.y) > 90 && free(x * TILE + 8, y * TILE + 8)) return [x * TILE + 8, y * TILE + 8];
      }
      return [WW * 8, WH * 8];
    };
    for (const [kind, n0] of p.creatures) {
      const n = Math.floor(n0) + (gen() < n0 % 1 ? 1 : 0); // a fraction is a chance (bears are rarer)
      for (let i = 0; i < n; i++) {
        if (gen() < 0.25) continue; // not every creature is home every time
        const [x, y] = spot();
        if (kind === "bird" || kind === "duck" || kind === "gull" || kind === "pigeon") {
          const flock: Animal[] = [];
          for (let j = 0; j < 3; j++) { const a = new Animal(this, kind, x + j * 6, y + (j % 2) * 5, new Phaser.Geom.Rectangle(x - 120, y - 90, 240, 180), free); flock.push(a); this.animals.push(a); }
          flock.forEach((a) => (a.flock = flock));
        } else {
          const range = kind === "deer" ? 110 : 70;
          const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - range, y - range, range * 2, range * 2), free);
          this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
          this.animals.push(a);
        }
      }
    }
  }

  placeCaveMouth() {
    const mx = CAVE_AT.x * TILE + 8, my = CAVE_AT.y * TILE + 8;
    this.add.image(mx, my, "cavemouth").setDepth(my + 4);
    const blocks = this.physics.add.staticGroup();
    const b = blocks.create(mx, my - 2, "") as Phaser.Physics.Arcade.Sprite; b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(30, 14);
    this.physics.add.collider(this.player, blocks);
    this.targets.push({ x: mx, y: my + 12, label: "Enter the cave", act: () => this.enterCave() });
    if (!G.data.caves[this.key]) G.say("A cave mouth opens in the rock here, breathing cold air.");
  }

  enterCave() {
    if (this.leaving) return;
    if (!G.data.caves[this.key]) {
      // The cave's kind is rolled when it is found (a d12: common 1-6, sacred 7-9, chthonic 10-12), then fixed.
      const roll = 1 + Math.floor(rng(screenSeed(G.data.wx, G.data.wy) ^ 0xc4fe)() * 12);
      const type: CaveType = roll <= 6 ? "common" : roll <= 9 ? "sacred" : "chthonic";
      G.data.caves[this.key] = { type, boss: "alive", hoard: false, mined: {} };
    }
    G.data.torchLit = G.count("Lamp") > 0 || G.count("Torch") > 0 || G.data.divine.day.hecateLight === G.dayNumber;
    if (G.doomed("Hecate") && !G.data.divine.day.hecateLight) { G.data.torchLit = false; G.say("Your light will not catch. Hecate denies you fire in the dark."); }
    else if (G.data.divine.day.hecateLight === G.dayNumber) G.say("Hecate's torch goes before you into the dark.");
    else if (G.count("Lamp") > 0) G.say("You light your clay lamp and duck inside. Its steady flame throws the light wide.");
    else if (G.data.torchLit) { G.removeItem("Torch", 1); G.say("You light a torch and duck inside."); }
    else G.say("You have no torch. You feel your way into the dark: every action is at -3. (Make torches with C.)");
    G.note("cave");
    G.data.cave = { key: this.key, level: 1 }; G.data.entry = "N"; G.data.scene = "Cave";
    this.goTo("Cave");
  }

  /** The Naiad by her pool, and the satyrs round their wine jar. */
  spawnMythborn() {
    this.naiad = undefined; this.satyrs = []; this.satyrsNoticed = false;
    if (this.hasSpring) {
      mythRec("naiad");
      this.naiad = this.add.image(SPRING.x * TILE + 8, (SPRING.y + 2) * TILE + 10, "naiad").setDepth((SPRING.y + 3) * TILE);
      this.tweens.add({ targets: this.naiad, alpha: 0.7, duration: 1400, yoyo: true, repeat: -1 });
      const n = this.naiad;
      this.targets.push({ x: n.x, y: n.y + 2, get label() { return n.visible ? (rungOf(mythRec("naiad").days) >= 1 ? `Speak with ${mythRec("naiad").name}` : "Approach the Naiad") : "The spring"; },
        act: () => (n.visible ? ui(this).talkToMyth("naiad") : G.say(G.isDay ? "The pool is still. She has gone beneath for today." : "The pool is dark and still. She is somewhere beneath."))});
      if (G.data.myth.naiad && G.data.myth.naiad.days === 0) G.say("A spring wells up here, clear and cold, and someone is watching you from the water.");
    }
    if (this.hasRevel) {
      mythRec("satyrs");
      this.add.image(REVEL.x * TILE + 8, REVEL.y * TILE + 6, "pithos").setDepth(REVEL.y * TILE + 12);
      for (let i = 0; i < 3; i++) this.satyrs.push(this.add.image(REVEL.x * TILE, REVEL.y * TILE, "satyr", 0));
      this.targets.push({ x: REVEL.x * TILE + 8, y: REVEL.y * TILE + 14, get label() { return rungOf(mythRec("satyrs").days) >= 1 ? `Join ${mythRec("satyrs").name} and the satyrs` : "Approach the satyrs"; }, act: () => ui(this).talkToMyth("satyrs") });
      G.say(G.isDay ? "Pipes and laughter: satyrs are dancing in the meadow." : "Torchlight and drunken song: satyrs are reveling in the dark.");
    }
  }

  updateMythborn(dt: number) {
    const today = G.dayNumber;
    if (this.naiad) {
      const rec = mythRec("naiad");
      this.naiad.setVisible(G.isDay && rec.gone !== today);
      // Shy: running at her sends her under the water for the day.
      const running = this.dashLvl > 0.3 && this.player.body!.velocity.length() > 80;
      if (this.naiad.visible && rungOf(rec.days) === 0 && running && Math.hypot(this.naiad.x - this.player.x, this.naiad.y - this.player.y) < 64) {
        rec.gone = today; G.say("The Naiad starts at your rush and slips beneath the water. Gone, for today.");
      }
    }
    if (this.satyrs.length) {
      this.danceT += dt * (G.isDay ? 0.9 : 1.6);
      const cx = REVEL.x * TILE + 8, cy = REVEL.y * TILE + 8;
      this.satyrs.forEach((s, i) => {
        const a = this.danceT + (i * Math.PI * 2) / 3;
        s.setPosition(cx + Math.cos(a) * 26, cy + Math.sin(a) * 15).setFrame(Math.floor(this.danceT * 4 + i) % 2).setDepth(cy + Math.sin(a) * 15 + 8);
      });
      // An unfriendly band may make mischief when you come near: a d12 against their Aggression.
      const rec = mythRec("satyrs");
      if (!this.satyrsNoticed && Math.hypot(cx - this.player.x, cy - this.player.y) < 72) {
        this.satyrsNoticed = true;
        const agg = 3 + (G.isDay ? 0 : 2), roll = 1 + Math.floor(Math.random() * 12);
        const loot = G.data.slots.filter((s) => s && ITEMS[s.id].kind !== "tool");
        if (rungOf(rec.days) === 0 && roll <= agg && loot.length && !rec.stolen) {
          const s = loot[Math.floor(Math.random() * loot.length)]!;
          G.removeItem(s.id, 1); rec.stolen = s.id;
          this.cameras.main.shake(80, 0.002);
          G.say(`A satyr darts in, snatches your ${ITEMS[s.id].name.toLowerCase()} and dances off laughing! (d12 ${roll}${G.lore("satyr") >= 2 ? `, Aggression ${agg}` : ""}) Win them over and they may give it back.`);
        }
      }
    }
  }

  /** Arrows among the Mythborn offend them and their god. */
  mythHit(x: number, y: number) {
    const near = (o?: Phaser.GameObjects.Image) => !!o && o.visible && Math.hypot(o.x - x, o.y + 3 - y) < 12;
    if (near(this.naiad)) {
      const rec = mythRec("naiad"); rec.gone = G.dayNumber; rec.days = Math.max(0, rec.days - 2);
      G.addFavor("Artemis", -2); G.earn("Hubris", 1, "you shot at a nymph");
      G.say("Your arrow cuts the water where the Naiad stood. She is gone, and the spring runs cold. (Artemis -2)");
      return true;
    }
    if (this.satyrs.some((s) => near(s))) {
      const rec = mythRec("satyrs"); rec.days = Math.max(0, rec.days - 2);
      G.addFavor("Dionysus", -2); G.earn("Hubris", 1, "you shot at the god's revelers");
      G.say("The satyrs scatter, shrieking curses, then come creeping back to glare at you. (Dionysus -2)");
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- a hut in the wild
  hutFolk: Walker[] = [];
  // ---------------------------------------------------------------- holy places: herms, shrines, graveyards
  siteFolk: { w: Walker; god: string; when: "day" | "night"; home: [number, number] }[] = [];
  ghostsRolled = false;
  /** An open patch of ground for a holy place, away from where you stand; cleared, and kept clear. */
  siteSpot(w: number, h: number, seed: number): [number, number] | null {
    const r = rng(seed >>> 0);
    for (let i = 0; i < 120; i++) {
      const tx = 4 + Math.floor(r() * (WW - w - 8)), ty = 4 + Math.floor(r() * (WH - h - 8));
      let ok = Math.abs(tx - 20) > 3 || Math.abs(ty - 15) > 3;
      for (let y = ty; y < ty + h && ok; y++) for (let x = tx; x < tx + w && ok; x++) { const t = this.objects.getTileAt(x, y)?.index ?? -1; if (waterKind(t) || t === T.EDGE) ok = false; }
      if (this.rec.hut && Math.abs(tx - this.rec.hut.tx) < 8 && Math.abs(ty - this.rec.hut.ty) < 8) ok = false;
      if (ok) return [tx, ty];
    }
    return null;
  }
  clearSite(tx: number, ty: number, w: number, h: number) {
    for (let y = ty - 1; y <= ty + h; y++) for (let x = tx - 1; x <= tx + w; x++) {
      const t = this.objects.getTileAt(x, y)?.index ?? -1;
      if (t !== -1 && t !== T.EDGE && !waterKind(t)) { this.objects.putTileAt(-1, x, y); this.removeTrunk(x, y); }
    }
  }
  solidAt(x: number, y: number, w: number, h: number) {
    const z = this.add.zone(x, y, w, h); this.physics.add.existing(z, true); this.physics.add.collider(this.player, z);
  }
  /** A priest, priestess or keeper who tends the place, and speaks for the god. */
  siteKeeper(god: string, seed: number, x: number, y: number, when: "day" | "night", role: string) {
    const r = rng(seed >>> 0), female = ["Aphrodite", "Artemis", "Demeter", "Hera", "Athena", "Hecate"].includes(god) ? true : god === "Hades" ? r() < 0.5 : r() < 0.3;
    const folk = makeFolk(r, `site${seed}`, r() < 0.5 ? "elder" : "adult", female, new Set());
    const w = new Walker(this, folk, x, y, [x, y]);
    this.physics.add.collider(w.sprite, this.objects); this.collideTrunks(w.sprite);
    this.siteFolk.push({ w, god, when, home: [x, y] });
    const sc = this;
    this.targets.push({ get x() { return w.sprite.x; }, get y() { return w.sprite.y + 2; }, get label() { return w.sprite.visible ? `Talk to ${folk.name}, ${role}` : ""; },
      act: () => ui(sc).priestTalk(god, folk.name, role) });
  }
  directSiteFolk(dt: number) {
    for (const s of this.siteFolk) {
      s.w.update(dt, this.paused);
      const on = s.when === "day" ? G.isDay : !G.isDay && this.rec.hecateNight === G.dayNumber;
      s.w.sprite.setVisible(on);
      if (this.paused || !on || s.w.doing !== "idle" || s.w.wait > 0) continue;
      s.w.goTo(s.home[0] + Phaser.Math.Between(-24, 24), s.home[1] + Phaser.Math.Between(-6, 18));
      s.w.wait = 4 + Math.random() * 6;
    }
    // Night falls: the dead may walk.
    if (!G.isDay && !this.ghostsRolled) { this.ghostsRolled = true; this.rollGhosts(); }
    if (G.isDay) this.ghostsRolled = false;
  }

  /**
   * The dead at night. On an ordinary night: one, rarely two, at a crossroads or a graveyard; now and then one on a road,
   * a little more often in a marsh. On the night of Noumenia they gather: a ring of them circles every crossroads and graveyard,
   * and they come close to the huts of the living, and may turn up anywhere.
   */
  rollGhosts() {
    const rec = this.rec, nou = G.data.day === 1, R = Math.random;
    const site: [number, number] | null = rec.graveyard ? [rec.graveyard[0] * TILE + 24, rec.graveyard[1] * TILE + 34] : rec.crossroads ? [20 * TILE + 8, 15 * TILE + 8] : null;
    let n = 0, at: [number, number] | null = null, ring = false, say = "";
    if (site && nou) {
      n = 3 + Math.floor(R() * 3); at = site; ring = true;
      say = rec.graveyard ? "It is the night of Noumenia. The dead have risen among the graves, and circle them, and circle." : "It is the night of Noumenia, and the dead have gathered at the crossroads. They circle the herm, waiting for Hecate's supper.";
    } else if (site && R() < 0.35) {
      n = R() < 0.25 ? 2 : 1; at = site;
      say = rec.graveyard ? (n > 1 ? "Two pale shapes stand among the graves." : "A pale shape rises among the graves.") : "At the crossroads, in the dark, a shade is standing.";
    } else if (nou && rec.hut && R() < 0.6) {
      n = R() < 0.4 ? 2 : 1; at = [rec.hut.tx * TILE + 30, rec.hut.ty * TILE + 44];
      say = "On Noumenia night the dead come near the living: a shade stands by the hut, looking in.";
    } else {
      const road = !!rec.roads?.length, p = nou ? 0.25 : rec.terrain === 5 ? 0.12 : road ? 0.06 : 0;
      if (R() < p) { n = 1; at = (road && rec.terrain !== 5 && this.roadSpot()) || this.openSpot(); say = rec.terrain === 5 ? "Out over the marsh, something pale is drifting." : road ? "Down the road, a pale figure walks without a sound." : "Something pale is standing in the dark."; }
    }
    if (!n || !at) return;
    const [gx, gy] = at, free = (x: number, y: number) => this.free(x, y);
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2, r = ring ? 30 : 14;
      const a = new Animal(this, "eidolon", gx + Math.cos(ang) * r, gy + Math.sin(ang) * r, new Phaser.Geom.Rectangle(gx - 80, gy - 60, 160, 120), free);
      a.sprite.setAlpha(0); this.tweens.add({ targets: a.sprite, alpha: 0.85, duration: 1500 });
      if (ring) a.orbit = { cx: gx, cy: gy, r, phase: ang };
      else this.physics.add.collider(a.sprite, this.objects);
      this.animals.push(a);
    }
    G.say(say);
  }
  /** A spot on a road, for a walking ghost. */
  roadSpot(): [number, number] | null {
    const spots: [number, number][] = [];
    for (let y = 3; y < WH - 3; y++) for (let x = 3; x < WW - 3; x++) if (this.groundLayer?.getTileAt(x, y)?.index === T.PATH && (this.objects.getTileAt(x, y)?.index ?? -1) === -1) spots.push([x, y]);
    if (!spots.length) return null;
    const [x, y] = spots[Math.floor(Math.random() * spots.length)]; return [x * TILE + 8, y * TILE + 8];
  }
  openSpot(): [number, number] {
    for (let i = 0; i < 60; i++) { const x = (4 + Math.random() * (WW - 8)) * TILE, y = (4 + Math.random() * (WH - 8)) * TILE; if (this.free(x, y)) return [x, y]; }
    return [20 * TILE + 8, 15 * TILE + 8];
  }

  setupSites() {
    this.siteFolk = []; this.ghostsRolled = false;
    const sc = this, rec = this.rec, cx = 20, cy = 15;
    // The herm at the crossroads: Hermes' by day, Hecate's by night.
    if (rec.crossroads) {
      const hx = (cx + 1) * TILE + 6, hy = (cy - 1) * TILE + 14;
      this.add.image(hx, hy, "herm").setOrigin(0.5, 1).setDepth(hy);
      this.solidAt(hx, hy - 3, 8, 6);
      if (Math.abs(rec.hecateNight ?? 0) !== G.dayNumber) rec.hecateNight = Math.random() < 0.35 ? G.dayNumber : -G.dayNumber; // some nights she is there
      this.siteKeeper("Hecate", screenSeed(G.data.wx, G.data.wy) ^ 0x4ec, hx - 20, hy + 10, "night", "Hecate's wise woman");
      this.targets.push({ x: hx, y: hy - 6, get label() { return G.isDay ? "Add a stone to the herm" : "Leave a supper for Hecate"; }, act: () => sc.atHerm() });
      if (!rec.met) G.say("A crossroads, and a herm standing at it: roads to three or four lands.");
    }
    // A country shrine to the god of this land, with someone to tend it.
    if (rec.shrine === undefined) {
      rec.shrine = null;
      if (this.key === G.data.anchors.tirShrine || (this.depth >= 2 && this.key !== G.data.anchors.tirGrave && Math.random() < 0.07)) {
        const seed = Math.floor(Math.random() * 1e9), at = this.siteSpot(4, 3, seed);
        if (at) rec.shrine = { tx: at[0], ty: at[1], god: WHEEL[rec.terrain - 1].god, seed };
      }
    }
    if (rec.shrine) {
      const s = rec.shrine; this.clearSite(s.tx, s.ty, 3, 3);
      const x = s.tx * TILE + 24, y = s.ty * TILE + 30;
      this.add.image(x, y, "wshrine").setOrigin(0.5, 1).setDepth(y);
      this.add.rectangle(x, y - 26, 4, 4, Phaser.Display.Color.HexStringToColor(WHEEL.find((w) => w.god === s.god)!.color).color).setDepth(y + 1);
      this.solidAt(x, y - 4, 30, 8);
      this.siteKeeper(s.god, s.seed, x + 22, y + 10, "day", `${["Aphrodite", "Artemis", "Demeter", "Hera", "Athena", "Hecate"].includes(s.god) ? "priestess" : "priest"} of ${s.god}`);
      this.targets.push({ x, y: y - 6, label: `The shrine of ${s.god}`, act: () => ui(sc).priestTalk(s.god, "", `shrine of ${s.god}`, true) });
      if (!rec.met) G.say(`A small shrine of ${s.god} stands here, its altar fire kept burning.`);
    }
    // A graveyard: Hades' shrine. The dead are buried far from the living.
    if (rec.graveyard === undefined) {
      rec.graveyard = null;
      if (this.key === G.data.anchors.tirGrave || (this.depth >= 2 && !rec.shrine && Math.random() < 0.045)) {
        const at = this.siteSpot(4, 3, Math.floor(Math.random() * 1e9));
        if (at) rec.graveyard = at;
      }
    }
    if (rec.graveyard) {
      const [tx, ty] = rec.graveyard; this.clearSite(tx, ty, 3, 3);
      const x = tx * TILE + 24, y = ty * TILE + 30;
      this.add.image(x, y, "graves").setOrigin(0.5, 1).setDepth(y);
      this.solidAt(x + 12, y - 8, 20, 10);
      this.siteKeeper("Hades", tx * 977 + ty * 131 + G.data.seed, x - 30, y + 12, "day", "keeper of the graves");
      this.targets.push({ x: x - 8, y: y - 6, get label() { return G.isDay ? "Look at the graves" : "Pour an offering for the dead"; }, act: () => ui(sc).priestTalk("Hades", "", "the graves", true) });
      if (!rec.met) G.say("A graveyard, far from any living house: Hades' ground.");
    }
    rec.met = true;
  }

  /** A herm: a stone for Hermes by day; at night, a supper for Hecate. */
  atHerm() {
    const today = G.dayNumber, held = G.selectedItem?.id;
    if (G.isDay) {
      if (G.data.offered.herm === today) { G.say("You've added your stone today. Hermes keeps count."); return; }
      G.data.offered.herm = today; G.note("herm");
      G.addFavor("Hermes", 1, 4);
      G.say("You pick up a stone from the road and add it to the heap at the herm's foot. Travelers do; Hermes notices. (Hermes, up to +4)");
      return;
    }
    const food = ["Honey", "Mushrooms", "Mint", "Meat", "Milk", "Wine", "Plum", "Millet", ...Object.keys(ITEMS).filter((k) => ITEMS[k].kind === "meal")];
    if (!held || !food.includes(held)) { G.say("At night the crossroads is Hecate's. Suppers are left for her here: hold some food (honey, meat, milk, mint, mushrooms) and offer it."); return; }
    if (G.data.offered.hecateSupper === today) { G.say("Your supper for Hecate is already left here tonight."); return; }
    G.data.offered.hecateSupper = today; G.note("hecate");
    const ring = this.animals.filter((a) => a.orbit && a.state !== "dead" && a.state !== "gone");
    if (ring.length) {
      for (const a of ring) { a.appeased = true; a.state = "idle"; a.sprite.setVelocity(0, 0); this.tweens.add({ targets: a.sprite, alpha: 0, duration: 2500, delay: 400 + Math.random() * 800, onComplete: () => { a.state = "gone"; a.sprite.setVisible(false); } }); }
      G.say("The circling dead stop. One by one they bend to Hecate's supper, and are gone.");
    }
    G.removeItem(held, 1);
    const proper = held === "dish_hecate", cooked = ITEMS[held].kind === "meal";
    const after = G.addFavor("Hecate", (G.moon === "New moon" ? 2 : 1) + (proper ? 2 : cooked ? 1 : 0), proper ? 8 : 6);
    if (proper) G.say("Her own supper, cooked as it should be. The goddess is very near.");
    G.say(`You set ${held === "dish_hecate" ? "her own supper" : `the ${lowerName(held)}`} at the herm's foot and walk away without looking back, as is proper.${G.moon === "New moon" ? " At the dark of the moon, she is especially near." : ""} (Hecate ${after >= 0 ? "+" : ""}${after})`);
  }
  /**
   * About one screen in fifteen, two or more out from home, someone lives alone or with their family in a hut.
   * Who depends on the land: shepherds on the plains, a root-cutter in the marsh, a hermit in the badlands.
   * The hut is rolled once, when the screen is first made, and stays.
   */
  setupHut() {
    this.hutFolk = [];
    if (this.rec.hut === undefined) {
      this.rec.hut = null;
      const kinds = HUT_KINDS.filter((k) => k.terrains.includes(this.rec.terrain));
      if (this.depth >= 2 && kinds.length && Math.random() < 0.07) {
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        let at: [number, number] | null = null;
        for (let i = 0; i < 80 && !at; i++) {
          const tx = 5 + Math.floor(Math.random() * (WW - 12)), ty = 4 + Math.floor(Math.random() * (WH - 10));
          if (Math.hypot(tx * TILE - this.player.x, ty * TILE - this.player.y) > 120 && this.objects.getTileAt(tx + 1, ty + 2)?.index !== T.WATER) at = [tx, ty];
        }
        if (at) this.rec.hut = { tx: at[0], ty: at[1], kind: kind.id, seed: Math.floor(Math.random() * 1e9), god: 1 + Math.floor(Math.random() * 12) <= GOD_CHANCE ? (kind.patron === "Hecate" ? "Hecate" : kind.patron) : "" };
      }
    }
    const hut = this.rec.hut;
    if (!hut) return;
    const kind = HUT_KINDS.find((k) => k.id === hut.kind)!;
    // A clearing around the hut, kept clear.
    for (let y = hut.ty - 1; y <= hut.ty + 5; y++) for (let x = hut.tx - 2; x <= hut.tx + 4; x++) {
      const t = this.objects.getTileAt(x, y)?.index ?? -1;
      if (t !== -1 && t !== T.EDGE && t !== T.WATER) { this.objects.putTileAt(-1, x, y); this.removeTrunk(x, y); }
    }
    const img = this.add.image(hut.tx * TILE, hut.ty * TILE, "wildhut").setOrigin(0, 0).setDepth((hut.ty + 2.1) * TILE);
    const solids = this.physics.add.staticGroup(), b = solids.create(img.x + 20, img.y + 24, "") as Phaser.Physics.Arcade.Sprite;
    b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(34, 18);
    this.physics.add.collider(this.player, solids);
    if (this.ambience) (this.ambience.o.chimneys ??= []).push([img.x + 28, img.y + 2]);
    const door: [number, number] = [img.x + 20, img.y + 40];
    // Who lives here, the same every visit.
    const r = rng(hut.seed >>> 0), used = new Set<string>();
    const solo = ["hermit", "rootcutter", "charcoal"].includes(kind.id);
    const members: Folk[] = [makeFolk(r, `h${hut.seed}a`, kind.id === "hermit" || kind.id === "rootcutter" ? "elder" : "adult", kind.id === "rootcutter" ? true : kind.id === "hermit" || kind.id === "hunter" || kind.id === "charcoal" ? false : r() < 0.5, used)];
    if (!solo) {
      if (kind.id !== "hunter") members.push(makeFolk(r, `h${hut.seed}b`, "adult", !members[0].female, used));
      const kids = kind.id === "hunter" ? 2 : Math.floor(r() * 3);
      for (let i = 0; i < kids; i++) members.push(makeFolk(r, `h${hut.seed}k${i}`, kind.id === "hunter" ? "adult" : "child", kind.id === "hunter" ? false : r() < 0.5, used));
    }
    members.forEach((f, i) => {
      const w = new Walker(this, f, door[0] + (i - 1) * 12, door[1] + 6, door);
      this.physics.add.collider(w.sprite, this.objects); this.physics.add.collider(w.sprite, solids); this.collideTrunks(w.sprite);
      this.hutFolk.push(w);
    });
    const sc = this;
    const names = members.filter((m) => m.age !== "child").map((m) => m.name).join(" and ") + (members.some((m) => m.age === "child") ? ", and their children" : "");
    this.targets.push({ x: door[0], y: door[1] - 2, get label() { return G.isDay ? `Call at the hut` : "Knock at the hut door"; }, act: () => sc.visitHut(kind, names) });
    for (const w of this.hutFolk) this.targets.push({ get x() { return w.sprite.x; }, get y() { return w.sprite.y + 2; }, get label() { return w.sprite.visible ? `Talk to ${w.folk.name}` : ""; }, act: () => sc.visitHut(kind, names) });
    if (!hut.met) { hut.met = true; G.say(`A hut stands alone here, smoke rising from its roof. ${kind.title} lives here.`); }
  }

  /** The hut folk go about their small round by day, and are indoors at night. */
  directHutFolk(dt: number) {
    const hut = this.rec.hut; if (!hut) return;
    for (const w of this.hutFolk) {
      w.update(dt, this.paused);
      if (this.paused) continue;
      w.sprite.setVisible(G.isDay);
      if (!G.isDay || w.doing !== "idle" || w.wait > 0) continue;
      const range = w.folk.age === "child" ? 60 : 30;
      w.goTo(w.home[0] + Phaser.Math.Between(-range, range), w.home[1] + Phaser.Math.Between(4, range));
      w.wait = w.folk.age === "child" ? 1 + Math.random() * 2 : 3 + Math.random() * 6;
    }
  }

  /**
   * Calling at a hut in the wild: here you are the guest. They will feed you and let you rest; a guest's gift pleases Zeus.
   * Each kind of household has something of its own to share, and a few goods to trade. One in twelve houses a god.
   */
  visitHut(kind: typeof HUT_KINDS[number], names: string) {
    const hut = this.rec.hut!, u = ui(this), today = G.dayNumber;
    const opts: { label: string; fn: () => void }[] = [];
    const again = () => this.visitHut(kind, names);
    if (hut.hosted !== today) opts.push({ label: "Accept their hospitality", fn: () => {
      hut.hosted = today;
      G.data.fatigue = Math.max(0, G.data.fatigue - 30); G.essence = { ...G.essenceMax };
      u.showTalk(kind.title, names, "They sit you by the fire and put bread, olives and something warm in front of you. You eat, and rest a while. (Fatigue -30, Essence full.)", [{ label: "Back", fn: again }]);
    } });
    const held = G.selectedItem;
    const food = held && (ITEMS[held.id].kind === "crop" || ["Milk", "Honey", "Meat", "Grapes", "Wine", "WildGrapes", "Plum", "Cornel", "Mint", "Thyme"].includes(held.id));
    if (food && hut.hosted === today && (hut as { gifted?: number }).gifted !== today) opts.push({ label: `Leave them a gift of your ${ITEMS[held!.id].name.toLowerCase()}`, fn: () => {
      (hut as { gifted?: number }).gifted = today;
      G.removeItem(held!.id, 1);
      G.addFavor("Zeus", 1, 6);
      if (hut.god) {
        const god = hut.god; hut.god = "";
        G.addFavor(god, 2, 12);
        u.showTalk(kind.title, names, `As you set it down, the eldest of them straightens, and is suddenly taller than the doorway, and bright. It was ${god} all along, testing the guest as gods test hosts. "You came as a guest and gave as a guest. Go well." (${god} +2, Zeus +1)`, []);
      } else u.showTalk(kind.title, names, "They protest, then accept it gladly. A guest who gives is a good guest; Zeus Xenios sees it. (Zeus +1)", [{ label: "Back", fn: again }]);
    } });
    const hs = HUT_SONGS[kind.id];
    if (hs && !G.data.songs.includes(hs)) opts.push({ label: "Ask them for a song", fn: () => u.showTalk(kind.title, names, `They look at each other, then the eldest begins, and the others join in. It's an old song of their trade, and they sing it until you can sing it with them.\n\n${u.learnSong(melody(hs))}`, [{ label: "Back", fn: again }]) });
    if (hut.special !== today) opts.push({ label: kind.special, fn: () => { hut.special = today; this.hutSpecial(kind, names, again); } });
    for (const [id, price] of kind.goods) if (G.data.silver >= price) opts.push({ label: `Buy ${ITEMS[id].name.toLowerCase()} (${price} silver)`, fn: () => { G.data.silver -= price; give(id, 1); again(); } });
    if (!hut.sensed) opts.push({ label: "Look closely at them (Pneuma)", fn: () => {
      hut.sensed = true;
      const roll = 1 + Math.floor(Math.random() * 12), target = Math.max(1, (G.data.aretai.Pneuma ?? 3) - 2 + G.boon("Dionysus"));
      const seen = hut.god && roll <= target;
      u.showTalk(kind.title, names, seen ? `Something about the eldest of them catches at you: eyes a little too bright, a stillness too deep for a hut in the wild. Whoever this is, they are more than they seem. (d12 ${roll}, needed 1–${target})` : `Ordinary folk, weathered by the wild, kind enough. (d12 ${roll}, needed 1–${target})`, [{ label: "Back", fn: again }]);
    } });
    u.showTalk(kind.title, `${names} · ${kind.patron}'s folk`, G.isDay ? kind.greeting : `A voice behind the door: "Who's there at this hour?" Then the bar lifts. ${kind.greeting}`, opts);
  }

  hutSpecial(kind: typeof HUT_KINDS[number], names: string, back: () => void) {
    const u = ui(this);
    let text = "";
    switch (kind.id) {
      case "shepherd": case "goatherd": text = `They press a skin of milk on you for the road: ${give("Milk", 2)}.`; break;
      case "charcoal": text = `"Take these. Caves are dark." ${give("Torch", 2)}.`; break;
      case "fisher": text = `They share the day's catch, and a bundle of sea fennel: ${give("Meat", 1)}, ${give("SeaFennel", 2)}.`; break;
      case "hunter": G.data.archeryXp += 20; text = "He takes your bow, laughs at your grip, and fixes it. You shoot at a knot in a tree until your fingers sting. (Archery practice +20)"; break;
      case "rootcutter": {
        const unknown = Object.keys(FORAGE).filter((id) => G.lore(id) < 1 && LORE[id]);
        if (unknown.length) { const id = unknown[Math.floor(Math.random() * unknown.length)]; G.data.lore.tier[id] = 1; text = `She shows you ${LORE[id].vague}, and names it: ${LORE[id].name}. "Now you'll see what it bears." (${LORE[id].name}: Basics)`; }
        else text = "\"You know the plants as well as I do already. Go on with you.\"";
        break;
      }
      case "hermit": {
        const b = G.data.birth;
        text = b ? `He looks at you a long time. "I see this: ${(MOROS_DREAMS[b.moros[0]] ?? "a road").replace(/^You dream of /, "").replace(/\.$/, "")}. And this: ${b.hamartia[1].charAt(0).toLowerCase() + b.hamartia[1].slice(1)}" He will say no more.` : "He looks at you a long time and says nothing at all.";
        break;
      }
    }
    u.showTalk(kind.title, names, text, [{ label: "Back", fn: back }]);
  }

  // ---------------------------------------------------------------- glints
  /** Some days, something half buried catches the light on a screen (more often on the shore, where the sea brings things). */
  setupGlint() {
    if (this.rec.glint === G.dayNumber) return;
    const r = rng((screenSeed(G.data.wx, G.data.wy) ^ Math.imul(G.dayNumber, 7919)) >>> 0);
    if (r() >= (this.rec.terrain === 7 ? 0.3 : 0.12)) return;
    let at: [number, number] | null = null;
    for (let i = 0; i < 60 && !at; i++) { const tx = 3 + Math.floor(r() * (WW - 6)), ty = 3 + Math.floor(r() * (WH - 6)); if (this.free(tx * TILE + 8, ty * TILE + 8)) at = [tx, ty]; }
    if (!at) return;
    const [gx, gy] = [at[0] * TILE + 8, at[1] * TILE + 10];
    const img = this.add.image(gx, gy, "glint").setScale(0.6).setDepth(gy).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: img, alpha: 0.2, scale: 0.35, duration: 700, yoyo: true, repeat: -1, repeatDelay: 1400 });
    const sc = this;
    this.targets.push({ x: gx, y: gy, get label() { return img.active ? "Something glints here" : ""; },
      act: () => { img.destroy(); sc.rec.glint = G.dayNumber; sc.gesture("act"); rollFind(sc.rec.terrain === 7 ? "shore" : "glint", FIND_CHANCE.glint); } });
  }

  // ---------------------------------------------------------------- the lands themselves
  groundLayer?: Phaser.Tilemaps.TilemapLayer;
  /** What each square of ground really is (soft edges change only how it looks). */
  groundData?: number[][];
  water: [number, number][] = [];
  heatSaid = false;
  /** Mud drags at your feet; sand slows you a little. */
  groundSpeed() {
    if (G.warded("Poseidon")) return 1;
    const w = this.underfoot();
    if (w === 1) return 0.5; // wading
    if (w === 2) return 0.25; // swimming
    const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y + 4) / TILE);
    const t = this.groundData?.[ty]?.[tx] ?? this.groundLayer?.getTileAtWorldXY(this.player.x, this.player.y + 4)?.index;
    return t === T.MUD ? 0.7 : t === T.SAND ? 0.88 : 1;
  }
  /** The desert sun wears you down by day, except in the shade by water. */
  desertHeat(dt: number) {
    if (this.rec.terrain !== 8 || !G.isDay || G.warded("Apollo")) return;
    const tx = this.player.x / TILE, ty = this.player.y / TILE;
    if (this.water.some(([x, y]) => Math.hypot(x - tx, y - ty) < 5)) return;
    G.addFatigue(dt * 0.05);
    if (!this.heatSaid) { this.heatSaid = true; G.say("The sun beats down on the desert. It tires you by day; rest in the shade by water."); }
  }

  // ---------------------------------------------------------------- wandering monsters
  monster?: Animal;
  bones?: Phaser.GameObjects.Image;
  riseT = 0;
  shootT = 0;
  meeting: "" | "coming" | "talking" | "done" = "";

  /** How far out this screen lies: the larger of its distances from home east-west and north-south. */
  get depth() { return Math.max(Math.abs(G.data.wx), Math.abs(G.data.wy)); }

  /** On arrival far from home, a d12: on a high roll, this terrain's monster is here (if it is its hour). */
  maybeMonster() {
    this.monster = undefined; this.meeting = ""; this.shootT = 1.5;
    const m = monsterFor(this.rec.terrain);
    if (!m || (m.kind === "skeleton" && this.rec.barrow)) return; // a known barrow keeps its own dead
    if (this.depth < WANDER_MIN_DEPTH || !this.monsterHour(m.when)) return;
    const roll = 1 + Math.floor(Math.random() * 12);
    if (roll < wanderTarget(this.depth)) return;
    this.spawnMonster(m.kind);
  }

  monsterHour(when: "any" | "night" | "dusk" | "day") { return when === "any" || (when === "day" ? G.isDay : when === "night" ? !G.isDay : G.data.clock >= G.daylight - 1); }

  spawnMonster(kind: MonsterKind) {
    const m = MONSTERS[kind], free = (x: number, y: number) => this.free(x, y);
    let x = WW * 8, y = WH * 8;
    if (kind === "skeleton") {
      if (!this.rec.barrow) { this.rec.barrow = this.barrowSpot(); this.setupBarrow(); }
      [x, y] = [this.rec.barrow[0] * TILE + 8, this.rec.barrow[1] * TILE + 8];
    } else {
      for (let i = 0; i < 80; i++) {
        const tx = 3 + Math.floor(Math.random() * (WW - 6)), ty = 3 + Math.floor(Math.random() * (WH - 6));
        if (Math.hypot(tx * TILE - this.player.x, ty * TILE - this.player.y) > 170 && free(tx * TILE + 8, ty * TILE + 8)) { x = tx * TILE + 8; y = ty * TILE + 8; break; }
      }
    }
    const range = kind === "centaur" || kind === "lion" ? 160 : kind === "siren" ? 0 : 60;
    const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - range, y - range, range * 2 + 1, range * 2 + 1), free);
    this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
    this.animals.push(a); this.monster = a;
    // A flock: more of them, rising together.
    for (let i = 1; i < (m.count ?? 1); i++) {
      const b = new Animal(this, kind, x + (i % 2 ? 14 : -14), y + i * 6, new Phaser.Geom.Rectangle(x - range, y - range, range * 2, range * 2), free);
      this.physics.add.collider(b.sprite, this.objects); this.collideTrunks(b.sprite); this.animals.push(b);
    }
    if (kind === "siren") { a.decide = () => {}; a.sprite.setImmovable(true); } // she does not come to you: her song brings you to her
    if (kind === "sphinx") a.decide = () => { this.meeting = "coming"; };
    if (kind === "centaur") a.decide = (b) => { if (!this.aggressionRoll(b)) { this.meeting = "coming"; G.say(`The ${beast("centaur")} trots toward you, curious.`); } };
    if (kind === "empousa") a.decide = () => { this.meeting = "coming"; };
    if (kind === "skeleton") {
      a.decide = (b) => { if (!this.aggressionRoll(b)) b.rerollT = 4; }; // the dead keep looking for the living
      if (this.bones) this.bones.setVisible(false);
      a.sprite.setAlpha(0); this.tweens.add({ targets: a.sprite, alpha: 1, duration: 900 });
    }
    const sc = this;
    if (kind === "centaur" || kind === "empousa" || kind === "sphinx") this.targets.push({ get x() { return a.sprite.x; }, get y() { return a.sprite.y + 2; },
      get label() { return a.state === "dead" || a.state === "charge" || a.state === "recoil" || !a.sprite.active ? "" : kind === "centaur" ? (a.appeased ? "" : "Speak with the centaur") : kind === "sphinx" ? "Hear the riddle" : "Speak with the stranger"; },
      act: () => (kind === "centaur" ? sc.talkCentaur(a) : kind === "sphinx" ? sc.meetSphinx(a) : sc.meetEmpousa(a)) });
    const met = G.data.met[kind] ?? 0; G.data.met[kind] = met + 1;
    G.say(met ? m.again : m.first);
  }

  /** A grave among the stones, chosen once for the screen. */
  barrowSpot(): [number, number] {
    const r = rng(screenSeed(G.data.wx, G.data.wy) ^ 0xb0e5);
    for (let i = 0; i < 200; i++) {
      const tx = 4 + Math.floor(r() * (WW - 8)), ty = 4 + Math.floor(r() * (WH - 8));
      if (this.free(tx * TILE + 8, ty * TILE + 8) && Math.hypot(tx * TILE - this.player.x, ty * TILE - this.player.y) > 120) return [tx, ty];
    }
    return [Math.floor(WW / 2), Math.floor(WH / 2)];
  }

  /** A known barrow: the bones lie there by day and stand at night, until they are given their rites. */
  setupBarrow() {
    if (!this.rec.barrow || this.bones?.active) return;
    const [bx, by] = this.rec.barrow, x = bx * TILE + 8, y = by * TILE + 10;
    this.bones = this.add.image(x, y, "bones").setDepth(y - 6);
    if (this.rec.laid) { this.bones.setAlpha(0.55); this.add.image(x + 9, y - 6, "items", "Stone").setDepth(y - 2).setScale(0.6); }
    const sc = this;
    this.targets.push({ get x() { return sc.bones!.x; }, get y() { return sc.bones!.y; },
      get label() { return !sc.bones!.visible ? "" : sc.rec.laid ? "A grave, at rest" : "Give the bones their rites"; }, act: () => sc.rite() });
  }

  /** The dead fall apart, and unless the bones are given their rites, they gather and rise again. */
  overcome(a: Animal) {
    if (a.kind !== "skeleton") return false;
    a.state = "dead"; a.sprite.setVelocity(0, 0).setVisible(false);
    this.bones?.setPosition(a.sprite.x, a.sprite.y + 2).setVisible(true).setDepth(a.sprite.y - 4);
    this.chips(Math.floor(a.sprite.x / TILE), Math.floor(a.sprite.y / TILE), -1, 6);
    this.riseT = 20;
    G.say("It falls apart in a clatter of bones. Give them their rites (E, with a libation in hand) before they gather again.");
    if (G.lore("skeleton") < 1) { G.data.lore.tier.skeleton = 1; G.say("Up close, you know it now: the restless dead, a skeleton."); }
    return true;
  }

  /** A libation and a Pneuma check (d12 at or under Pneuma + 3, Hades' favor helping) lays the dead to rest. */
  rite() {
    const sk = this.monster?.kind === "skeleton" ? this.monster : undefined;
    if (this.rec.laid) { G.say("The grave is quiet. Whoever lies here is at rest."); return; }
    if (sk && sk.state !== "dead") { G.say("It is standing. Break it first."); return; }
    const held = G.selectedItem?.id ?? "";
    if (!GRAVE_OFFERINGS.includes(held)) { G.say(`Old bones, scattered among the stones, unburied. ${G.lore("skeleton") >= 1 ? "Hold out a libation (wine, milk or honey) to give them their rites." : "They seem to want something."}`); return; }
    const b = labor(EFFORT.rite, 1, "Pneuma"); if (b === null) return;
    G.removeItem(held, 1);
    const target = (G.data.aretai.Pneuma ?? 3) + 3 + G.boon("Hades"), roll = 1 + Math.floor(Math.random() * 12);
    const odds = `d12 ${roll}, needed 1–${target}`;
    if (roll > target) { G.say(`You pour the ${ITEMS[held].name.toLowerCase()} over the bones and speak the words, but they will not settle (${odds}).`); return; }
    this.rec.laid = true; this.riseT = 0;
    if (sk) { sk.sprite.destroy(); this.animals.splice(this.animals.indexOf(sk), 1); this.monster = undefined; }
    this.bones?.setAlpha(0.55);
    if (this.bones) this.add.image(this.bones.x + 9, this.bones.y - 6, "items", "Stone").setDepth(this.bones.y - 2).setScale(0.6);
    G.addFavor("Hades", 1, 3); G.data.currencies.Pathos += 1; G.data.silver += 15;
    G.say(`You pour the ${ITEMS[held].name.toLowerCase()} over the bones, heap stones above them and speak the old words. They are still (${odds}). Among them, 15 silver in old grave goods. (+1 Pathos; the dead remember you.)`);
  }

  monsterTick(dt: number) {
    // The barrow's dead stand at nightfall, gather again if broken, and lie down at dawn.
    if (this.rec.barrow && !this.rec.laid) {
      const sk = this.monster?.kind === "skeleton" ? this.monster : undefined;
      if (!sk && !G.isDay) this.spawnMonster("skeleton");
      else if (sk && sk.state === "dead" && (this.riseT -= dt) <= 0) {
        if (G.isDay) { this.riseT = 1; }
        else {
          sk.state = "idle"; sk.hp = QUARRY.skeleton.hp; sk.rolled = false; sk.appeased = false;
          sk.sprite.setPosition(this.bones!.x, this.bones!.y - 2).setVisible(true).setAlpha(0);
          this.tweens.add({ targets: sk.sprite, alpha: 1, duration: 900 });
          this.bones!.setVisible(false);
          G.say("Dry clicks: the bones gather themselves and stand again.");
        }
      } else if (sk && sk.state !== "dead" && G.isDay) {
        sk.state = "dead"; sk.sprite.setVisible(false).setVelocity(0, 0); this.riseT = 1;
        this.bones!.setPosition(sk.sprite.x, sk.sprite.y + 2).setVisible(true);
        G.say("Dawn: the bones fall where they stand and lie still.");
      }
    }
    this.farLandMonsters(dt);
    const a = this.monster;
    if (!a || !a.sprite.active || a.state === "dead") return;
    const dist = Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y);
    // The centaur shoots when it cannot reach you, then comes on again.
    if (a.kind === "centaur" && a.state === "charge" && dist > 70 && dist < 230 && (this.shootT -= dt) <= 0) {
      this.shootT = 2.2 + Math.random();
      a.state = "recoil"; a.timer = 0.6; a.sprite.setVelocity(0, 0);
      this.time.delayedCall(250, () => { if (a.sprite.active && a.state !== "dead") this.shootAt(a); });
    }
    // A curious centaur, or the stranger, walks up to you.
    if (this.meeting === "coming" && a.state !== "charge" && a.state !== "recoil" && !a.appeased) {
      if (dist > 26) { a.state = "walk"; a.tx = this.player.x; a.ty = this.player.y + 2; a.timer = 1; }
      else { a.state = "idle"; a.timer = 2; a.sprite.setVelocity(0, 0); if (a.kind === "empousa") this.meetEmpousa(a); else if (a.kind === "sphinx") this.meetSphinx(a); else this.meeting = "done"; }
    }
    // Walking away from the stranger's invitation is declining it.
    if (a.kind === "empousa" && this.meeting === "talking" && !ui(this).talkPanel) { this.meeting = "done"; this.declineEmpousa(a); }
    if (a.kind === "sphinx" && this.meeting === "talking" && !ui(this).talkPanel) { this.meeting = "done"; G.say("You turn away without an answer. That is an answer too. The Sphinx springs."); a.charge(30); }
  }

  songT = 0; sungSaid = false;
  /**
   * The monsters of the far lands, each by its Terata nature: the Siren draws you in with her song unless you hold wax;
   * the bronze birds shoot their feathers from range; the Strix flies from fire.
   */
  farLandMonsters(dt: number) {
    for (const m of this.animals) {
      if (!m.sprite.active || m.state === "dead") continue;
      const d = Math.hypot(m.sprite.x - this.player.x, m.sprite.y - this.player.y);
      if (m.kind === "siren" && G.isDay) {
        const stopped = G.selectedItem?.id === "Wax" || G.count("Moly") > 0;
        if (d < 170 && !stopped && !this.paused && this.knock <= 0) {
          // The song pulls you toward her; you can still walk hard away.
          const v = this.player.body!.velocity, k = 42 / Math.max(1, d);
          this.player.setVelocity(v.x + (m.sprite.x - this.player.x) * k, v.y + (m.sprite.y - this.player.y) * k);
          if (!this.sungSaid) { this.sungSaid = true; G.say(`The song draws you toward the rocks. ${G.lore("siren") >= 1 ? "Hold wax to stop your ears, or walk hard away." : "Your feet are moving on their own."}`); }
          if (d < 18 && (this.songT -= dt) <= 0) { this.songT = 1.6; m.state = "idle"; this.struck(m); }
        } else if (d < 170 && stopped && !this.sungSaid) { this.sungSaid = true; G.say("You press the wax into your ears. Her mouth moves, and you hear nothing at all."); }
      }
      if (m.kind === "stymphalian" && m.state === "charge" && d > 50 && d < 200 && Math.random() < dt * 0.5) {
        m.state = "recoil"; m.timer = 0.5; m.sprite.setVelocity(0, 0);
        this.time.delayedCall(200, () => { if (m.sprite.active && m.state !== "dead") this.shootAt(m, 0xd8a850); });
      }
      if (m.kind === "strix" && G.selectedItem?.id === "Torch" && d < 90 && m.state !== "flee") { m.bolt(this.player); m.appeased = true; G.say("The night-bird shrieks at the torchlight and wheels away into the dark."); }
    }
  }

  /** The Sphinx asks her riddle. Gnosis may recall the old answer; a true answer unmakes her, a wrong one and she springs. */
  meetSphinx(a: Animal) {
    if (this.meeting === "talking" || a.state === "charge" || a.state === "recoil" || a.state === "dead") return;
    const u = ui(this);
    this.meeting = "talking"; a.state = "idle"; a.timer = 99; a.sprite.setVelocity(0, 0);
    const r = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];
    const g = (G.data.aretai.Gnosis ?? 3) + G.lore("sphinx"), roll = 1 + Math.floor(Math.random() * 12);
    const recall = roll + g >= 9;
    const order = [...r.answers].sort(() => Math.random() - 0.5);
    const opts = order.map((ans) => ({ label: ans, fn: () => {
      this.meeting = "done"; u.closeTalk();
      if (ans === r.answers[0]) {
        G.say(`"${ans.split(":")[0]}." She stares at you, and a cry tears out of her, and she throws herself from the rock and is gone like smoke.`);
        G.earn("Kleos", 2, "you answered the Sphinx"); G.data.currencies.Ambrosia += 1;
        if (G.lore("sphinx") < 1) G.data.lore.tier.sphinx = 1;
        a.state = "dead"; this.tweens.add({ targets: a.sprite, alpha: 0, y: a.sprite.y + 20, duration: 900, onComplete: () => { a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); } });
      } else { G.say(`"${ans}." Wrong. The Sphinx smiles, and springs.`); a.charge(30); }
    } }));
    u.showTalk("The Sphinx", "a winged lion with a woman's face", `"Answer, traveler, and pass. Fail, and be eaten."\n\n"${r.q}"${recall ? `\n\n(Something stirs in your memory: an old story, a lame king at Thebes... Gnosis d12 ${roll} + ${g} vs 9.)` : ""}`, opts);
    if (recall) { const right = opts.find((o) => o.label === r.answers[0]); if (right) right.label = `${right.label}  ✦`; u.showTalk("The Sphinx", "a winged lion with a woman's face", `"Answer, traveler, and pass. Fail, and be eaten."\n\n"${r.q}"\n\n(Something stirs in your memory: an old story, a lame king at Thebes... Gnosis d12 ${roll} + ${g} vs 9.)`, opts); }
  }

  /** A centaur that chose conversation: wine, a contest of strength, or leave it be. */
  talkCentaur(a: Animal) {
    const u = ui(this), name = G.lore("centaur") >= 1 ? "The centaur" : "The horse-man";
    a.state = "idle"; a.timer = 6; a.sprite.setVelocity(0, 0); this.meeting = "done";
    const wine = G.count("Wine") > 0;
    const leave = (msg: string) => { a.appeased = true; u.closeTalk(); G.say(msg); this.time.delayedCall(1500, () => { if (a.sprite.active) { a.state = "walk"; a.tx = a.sprite.x < WW * 8 ? -40 : WW * TILE + 40; a.ty = a.sprite.y; a.timer = 12; } }); };
    const opts: { label: string; fn: () => void }[] = [];
    if (wine) opts.push({ label: "Offer him wine, with respect", fn: () => {
      G.removeItem("Wine", 1);
      G.data.archeryXp += 20; G.addFavor("Poseidon", 1, 3);
      if (G.lore("centaur") < 2) G.data.lore.tier.centaur = Math.max(1, G.lore("centaur"));
      leave(`${name} drinks deep, wipes his beard and laughs. In thanks he shows you how his people draw and loose at the gallop. (Archery practice +20; Poseidon is pleased.)`);
    } });
    opts.push({ label: "Wrestle him for honor (Kratos)", fn: () => {
      const k = G.data.aretai.Kratos ?? 3, roll = 1 + Math.floor(Math.random() * 12);
      if (roll <= k) { G.earn("Kleos", 1, "you threw a centaur"); leave(`You catch him off balance and throw him on his flank! ${name} roars with laughter and gives you the win (d12 ${roll}, needed 1–${k}).`); }
      else { G.addFatigue(15); leave(`${name} lifts you off your feet and drops you in the bracken, laughing (d12 ${roll}, needed 1–${k}; +15 Fatigue). "Another day, little two-legs."`); }
    } });
    opts.push({ label: "Nod, and let him go his way", fn: () => leave(`${name} tosses his head and canters off among the trees.`) });
    u.showTalk(G.lore("centaur") >= 1 ? "A centaur" : "A horse-man", "Half man, half stallion, sharp-eyed and half-amused",
      wine ? "\"Two-legs! I smell wine on you. Or is it only hope?\"" : "\"Two-legs. Have you anything to drink, or only questions?\"", opts);
  }

  /** The stranger at dusk. A Gnosis check (d12 + Gnosis vs CR 10) may show you what she is. */
  pierced = false;
  meetEmpousa(a: Animal) {
    if (this.meeting === "talking" || a.state === "charge" || a.state === "recoil") return;
    const u = ui(this);
    this.meeting = "talking"; a.state = "idle"; a.timer = 99; a.sprite.setVelocity(0, 0);
    const g = (G.data.aretai.Gnosis ?? 3) + (G.lore("empousa") >= 2 ? 2 : 0), roll = 1 + Math.floor(Math.random() * 12);
    this.pierced = roll + g >= 10;
    const seen = this.pierced ? ` But as she turns, the last light catches her legs: one of bronze, one the hoof of an ass. (Gnosis: d12 ${roll} + ${g} vs 10.)` : "";
    if (this.pierced && G.lore("empousa") < 1) G.data.lore.tier.empousa = 1;
    const opts: { label: string; fn: () => void }[] = [
      { label: "Go with her", fn: () => { this.meeting = "done"; u.closeTalk(); this.drained(a); } },
    ];
    if (this.pierced) opts.push({ label: "Laugh at her (Logos or Phoenix)", fn: () => { this.meeting = "done"; u.closeTalk(); this.mock(a); } });
    opts.push({ label: "Thank her, and decline", fn: () => { this.meeting = "done"; u.closeTalk(); this.declineEmpousa(a); } });
    u.showTalk("A beautiful stranger", this.pierced ? "An empousa, Hecate's night-demon" : "Lovely, and alone, at dusk",
      `"You look tired, traveler. Come and rest with me a while, just over there, where the flowers are thickest."${seen}`, opts);
  }

  /** Seduced: she feeds, and you wake alone among the flowers. */
  drained(a: Animal) {
    G.addFatigue(20); G.heal(-8);
    this.tweens.add({ targets: a.sprite, alpha: 0, duration: 800, onComplete: () => { a.state = "dead"; a.sprite.destroy(); this.animals.splice(this.animals.indexOf(a), 1); } });
    this.cameras.main.flash(500, 120, 20, 30);
    G.say(`You wake alone among the trampled flowers, cold and weak, with two small wounds at your throat. (−8 Vitality, +20 Fatigue)${G.lore("empousa") < 1 ? "" : " An empousa."}`);
    if (G.data.vitality <= 0) this.struckDown(a);
  }

  /** Refused, she may let you go, or show her true face (her Aggression roll). */
  declineEmpousa(a: Animal) {
    if (!this.aggressionRoll(a)) {
      G.say("She smiles, a little too long, and walks away into the dusk. You do not see where she goes.");
      a.appeased = true; a.state = "walk"; a.tx = a.sprite.x + 200; a.ty = a.sprite.y - 120; a.timer = 6;
      this.tweens.add({ targets: a.sprite, alpha: 0, delay: 2500, duration: 1500, onComplete: () => { a.state = "dead"; a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); } });
    }
  }

  // ---------------------------------------------------------------- wayfarers (wayfarers.ts)
  ways: WayGroup[] = [];
  wayT = 0;
  /** Where sites are (for testing from the console). */
  siteFns = { fortressAt, isleAt };
  /** The table of who may be met (for testing from the console). */
  wayDefs = WAYFARERS;
  /** Creatures going after something other than you: a wolf after a goat, a wounded boar after its hunter, a man running off. */
  chase = new Map<Animal, { to: () => { x: number; y: number } | null; speed: number; reach: () => void; leave?: boolean }>();

  /** On arrival: perhaps someone is here, on the road or at their work. */
  setupWayfarers() {
    this.ways = []; this.chase = new Map(); this.wayT = 50 + Math.random() * 60;
    const def = rollWayfarers(Math.random, { terrain: this.rec.terrain, road: !!this.rec.roads?.length, depth: this.depth, day: G.isDay, water: this.water.length > 6, monster: !!this.monster, hutHere: !!this.rec.hut, only: this.site ? (w) => w.mode === "cross" : undefined });
    if (def) { const g = this.spawnWay(def, false); if (g) this.time.delayedCall(900, () => G.say(WAY_SEEN[def.id] ?? `Here: ${def.title.toLowerCase()}.`)); }
  }

  /** What it costs a walker to cross a tile: roads are easiest, brush and fords hard, trees, stone and deep water impossible. */
  wayCost(x: number, y: number) {
    if (x < 1 || y < 1 || x >= WW - 1 || y >= WH - 1) return Infinity;
    const t = this.objects.getTileAt(x, y)?.index ?? -1;
    if (this.wayBlocked(x, y)) return Infinity;
    if (t === -1) return this.groundData?.[y]?.[x] === T.PATH ? 1 : 2;
    if (t === T.FLOWERS) return 2.2;
    if (t === T.SHALLOW) return 6;
    if (t in BUSHES) return 6;
    if (t in TRUNKS || t === T.WATER || SOLID.includes(t)) return Infinity;
    return 3;
  }
  /** The hut, the shrine, the graves and the cave mouth stand in the way too. */
  wayBlocked(x: number, y: number) {
    const r = this.rec, inR = (tx: number, ty: number, w: number, h: number) => x >= tx && x < tx + w && y >= ty && y < ty + h;
    return (!!r.hut && inR(r.hut.tx, r.hut.ty, 3, 3)) || (!!r.shrine && inR(r.shrine.tx, r.shrine.ty, 4, 3)) || (!!r.graveyard && inR(r.graveyard[0], r.graveyard[1], 4, 3)) || (this.hasCave && inR(CAVE_AT.x - 1, CAVE_AT.y - 1, 3, 2));
  }
  nearestOpen(x: number, y: number): [number, number] | null {
    for (let r = 0; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && isFinite(this.wayCost(x + dx, y + dy))) return [x + dx, y + dy];
    return null;
  }
  /** A walking route in world points, from a point to a tile. */
  wayRoute(fx: number, fy: number, tx: number, ty: number): [number, number][] | null {
    const a = this.nearestOpen(Math.floor(fx / TILE), Math.floor(fy / TILE)), b = this.nearestOpen(tx, ty);
    if (!a || !b) return null;
    const p = findPath(WW, WH, (x, y) => this.wayCost(x, y), a, b);
    return p ? p.map(([x, y]) => [x * TILE + 8, y * TILE + 8] as [number, number]) : null;
  }
  /** The ways in and out of this screen: the gaps in its border, roads marked. */
  wayGates() {
    const out: { tile: [number, number]; off: [number, number]; road: boolean }[] = [];
    for (const sd of ["N", "S", "E", "W"] as Side[]) {
      if (!this.open[sd]) continue;
      const roads = sideRoads(G.data.wx, G.data.wy, sd);
      for (const g of this.gates[sd]) {
        const tile: [number, number] = sd === "N" ? [g, 1] : sd === "S" ? [g, WH - 2] : sd === "W" ? [1, g] : [WW - 2, g];
        if (!isFinite(this.wayCost(tile[0], tile[1]))) continue;
        const off: [number, number] = sd === "N" ? [g * TILE + 8, -14] : sd === "S" ? [g * TILE + 8, WH * TILE + 14] : sd === "W" ? [-14, g * TILE + 8] : [WW * TILE + 14, g * TILE + 8];
        out.push({ tile, off, road: roads.includes(g) });
      }
    }
    return out;
  }
  /** A way across: in by one gap, out by another (by road, if they keep to roads). */
  crossRoute(def: WayDef): { pts: [number, number][]; in: [number, number]; out: [number, number] } | null {
    const gs = this.wayGates(); if (gs.length < 2) return null;
    const roads = gs.filter((q) => q.road), pool = def.road && roads.length >= 2 && Math.random() < 0.85 ? roads : gs;
    for (let tries = 0; tries < 6; tries++) {
      const a = pool[Math.floor(Math.random() * pool.length)], others = pool.filter((q) => q !== a && Math.hypot(q.tile[0] - a.tile[0], q.tile[1] - a.tile[1]) > 10);
      if (!others.length) continue;
      const b = others[Math.floor(Math.random() * others.length)];
      const pts = findPath(WW, WH, (x, y) => this.wayCost(x, y), a.tile, b.tile);
      if (pts && pts.length > 6) return { pts: [[a.tile[0] * TILE + 8, a.tile[1] * TILE + 8], ...pts.map(([x, y]) => [x * TILE + 8, y * TILE + 8] as [number, number])], in: a.off, out: b.off };
    }
    return null;
  }
  /** An open spot for a group to stop at, away from you (near the road if they keep to roads). */
  waySpot(minD: number, ok: (x: number, y: number) => boolean = () => true, road = false): [number, number] | null {
    let best: [number, number] | null = null, bestS = -1;
    for (let i = 0; i < 220; i++) {
      const x = 3 + Math.floor(Math.random() * (WW - 6)), y = 3 + Math.floor(Math.random() * (WH - 6));
      if (!this.dryAt(x, y) || !ok(x, y)) continue;
      const d = Math.hypot(x * TILE + 8 - this.player.x, y * TILE + 8 - this.player.y);
      if (d < minD) continue;
      let s = Math.random();
      if (road) { let nr = 99; for (let yy = y - 5; yy <= y + 5; yy++) for (let xx = x - 5; xx <= x + 5; xx++) if (this.groundData?.[yy]?.[xx] === T.PATH) nr = Math.min(nr, Math.hypot(xx - x, yy - y)); s += nr <= 1 ? 0.5 : nr < 6 ? 2 - nr / 4 : 0; }
      if (s > bestS) { bestS = s; best = [x, y]; }
    }
    return best;
  }
  /** Dry, open ground to stand on (not a ford, not in the brush). */
  dryAt(x: number, y: number) { const t = this.objects.getTileAt(x, y)?.index ?? -1; return (t === -1 || t === T.FLOWERS) && isFinite(this.wayCost(x, y)); }
  /** Room for a fire and people round it. */
  roomAt(x: number, y: number, r = 1) { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (!this.dryAt(xx, yy)) return false; return true; }

  spawnWay(def: WayDef, arriving: boolean): WayGroup | null {
    const seed = Math.floor(Math.random() * 1e9), folk = makeParty(def, seed), sc = this;
    const g: WayGroup = { def, people: [], foes: [], goats: [], raiders: [], phase: "", t: 0, t2: 0, life: 120 + Math.random() * 120, met: false, talking: false, done: {}, trail: [], trailT: 0, chatT: 2 + Math.random() * 4, chatI: 0,
      nearSaid: false, gone: false, kills: 0, god: def.god || TWELVE[Math.floor(Math.random() * TWELVE.length)], anchor: [0, 0], restT: 0, truth: Math.random() < 0.5 ? 0 : 1, shootT: 1.5 };
    // Where they stand, and where they are going.
    let spots: [number, number][] = [];
    const ring = (cx: number, cy: number, r: number) => folk.map((_, i) => [cx + Math.cos((i / folk.length) * Math.PI * 2 + 0.6) * r, cy + Math.sin((i / folk.length) * Math.PI * 2 + 0.6) * r * 0.8] as [number, number]);
    if (def.mode === "cross") {
      const route = this.crossRoute(def); if (!route) return null;
      const k = arriving ? 0 : Math.floor(route.pts.length * (0.2 + Math.random() * 0.4));
      const start: [number, number] = arriving ? route.in : route.pts[k];
      spots = folk.map((_, i) => (arriving ? [start[0], start[1]] : route.pts[Math.max(0, k - 2 * i)]) as [number, number]);
      g.exit = route.out;
      const rest = def.activity === "walk" && def.id !== "couple" && Math.random() < (arriving ? 0.25 : 0.45);
      const restAt = rest ? k + Math.floor((route.pts.length - k) * (0.25 + Math.random() * 0.3)) : -1;
      g.first = restAt > k ? route.pts.slice(k, restAt) : [...route.pts.slice(k), route.out];
      if (restAt > k) { g.after = [...route.pts.slice(restAt), route.out]; g.restT = 12 + Math.random() * 20; }
    } else {
      let at: [number, number] | null = null;
      const far = def.hostile ? 190 : 120;
      if (def.activity === "chop") {
        for (let i = 0; i < 260 && !at; i++) {
          const x = 3 + Math.floor(Math.random() * (WW - 6)), y = 3 + Math.floor(Math.random() * (WH - 6)), t = this.objects.getTileAt(x, y)?.index ?? -1;
          if (!(t === T.TREE || t === T.PINE || t === T.OLIVE)) continue;
          for (const dx of [-1, 1]) if (!at && this.dryAt(x + dx, y) && Math.hypot((x + dx) * TILE - this.player.x, y * TILE - this.player.y) > far) { at = [x + dx, y]; g.tree = [x, y]; }
        }
      } else if (def.activity === "fish") {
        const sh = this.water.filter(([x, y]) => Math.hypot(x * TILE - this.player.x, y * TILE - this.player.y) > 100).sort(() => Math.random() - 0.5);
        for (const [wx0, wy0] of sh) {
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) { const t = this.objects.getTileAt(wx0 + dx, wy0 + dy)?.index ?? -1; if (!at && t === -1 && this.dryAt(wx0 + dx, wy0 + dy)) { at = [wx0 + dx, wy0 + dy]; g.water = [wx0 * TILE + 8 - dx * 10, wy0 * TILE + 8 - dy * 10]; } }
          if (at) break;
        }
      } else if (def.activity === "camp") at = this.waySpot(far, (x, y) => this.roomAt(x, y, 1), true);
      else if (def.activity === "lurk") at = this.waySpot(far, (x, y) => this.roomAt(x, y, 1), true);
      else if (def.activity === "hurt" || def.activity === "argue") at = this.waySpot(100, (x, y) => this.roomAt(x, y, 1), true);
      else at = this.waySpot(far, (x, y) => this.roomAt(x, y, 1));
      if (!at) return null;
      const ax = at[0] * TILE + 8, ay = at[1] * TILE + 8;
      g.anchor = [ax, ay];
      if (def.activity === "camp") {
        g.fire = this.add.image(ax, ay + 7, "pl_Campfire").setOrigin(0.5, 1).setDepth(ay + 7);
        g.glow = this.add.image(ax, ay + 1, "focusGlow").setDepth(ay + 6).setTint(0xffa040).setAlpha(0.5).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: g.glow, alpha: 0.25, scale: 2, yoyo: true, repeat: -1, duration: 420 });
        this.tweens.add({ targets: g.fire, scaleY: 1.06, yoyo: true, repeat: -1, duration: 260 });
        spots = ring(ax, ay, 17);
      } else if (def.activity === "argue") {
        g.stone = this.add.image(ax, ay + 2, "items", "Stone").setDepth(ay + 2).setScale(0.8);
        spots = [[ax - 11, ay], [ax + 11, ay]];
      } else if (def.activity === "lurk") spots = ring(ax, ay, 12);
      else spots = folk.map((_, i) => [ax + (i ? (i % 2 ? 14 : -14) : 0), ay + (i ? 6 : 0)] as [number, number]);
    }
    // The people: brigands fight like beasts, so they are made as creatures; everyone else walks.
    if (def.hostile) {
      folk.forEach((f, i) => {
        const key = `folk_${f.id}`; makeFigureTexture(this, key, f.look, f.extras);
        if (!this.textures.exists("brigand")) makeFigureTexture(this, "brigand", f.look, f.extras);
        const [x, y] = spots[i];
        const a = new FigureFoe(this, "brigand", x, y, new Phaser.Geom.Rectangle(x - 12, y - 10, 24, 20), (px, py) => this.free(px, py));
        a.sprite.setTexture(key, 0).setFlipX(false); a.folk = f; a.decide = () => {};
        this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
        this.animals.push(a); g.foes.push(a);
      });
    } else folk.forEach((f, i) => {
      const [x, y] = spots[i];
      const w = new Wayfarer(this, f, x, y, [x, y]); w.pace = def.pace ?? 1;
      g.people.push(w);
      this.targets.push({ get x() { return w.sprite.x; }, get y() { return w.sprite.y + 2; }, get label() { return g.gone || !w.sprite.visible ? "" : sc.wayLabel(g, w); }, act: () => sc.talkWay(g, w) });
    });
    const lead = g.people[0];
    if (lead && g.first) lead.walk(g.first);
    if (lead && def.activity === "camp") g.people.forEach((w) => w.face(g.anchor[0], g.anchor[1]));
    if (lead && def.activity === "argue") { g.people[0].face(g.anchor[0] + 20, g.anchor[1]); g.people[1].face(g.anchor[0] - 20, g.anchor[1]); }
    if (lead && def.activity === "chop" && g.tree) { lead.face(g.tree[0] * TILE + 8, g.tree[1] * TILE + 8); lead.work = "chop"; }
    if (lead && def.activity === "fish" && g.water) { lead.face(g.water[0], g.water[1]); lead.work = "fish"; g.gfx = this.add.graphics().setDepth(lead.sprite.y + 1); g.t2 = 15 + Math.random() * 20; }
    if (def.activity === "hurt") for (const w of g.people) w.lying = true;
    if (def.activity === "hunt") { g.phase = "seek"; g.t2 = 2; }
    // A shepherd's flock: goats that keep near him. Sometimes one has strayed; sometimes wolves are watching.
    if (def.activity === "herd" && lead) {
      const n = 3 + Math.floor(Math.random() * 3), free = (x: number, y: number) => this.free(x, y);
      for (let i = 0; i < n; i++) {
        const gx = g.anchor[0] + (Math.random() - 0.5) * 50, gy = g.anchor[1] + (Math.random() - 0.5) * 36;
        const a = new Animal(this, "goat", gx, gy, new Phaser.Geom.Rectangle(gx - 30, gy - 24, 60, 48), free);
        this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
        this.animals.push(a); g.goats.push(a);
      }
      if (Math.random() < 0.45) {
        const at = this.waySpot(200, (x, y) => Math.hypot(x * TILE - g.anchor[0], y * TILE - g.anchor[1]) > 200);
        if (at) {
          const [sx, sy] = [at[0] * TILE + 8, at[1] * TILE + 8];
          const a = new Animal(this, "goat", sx, sy, new Phaser.Geom.Rectangle(sx - 20, sy - 16, 40, 32), free);
          this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
          this.animals.push(a); g.stray = a; g.quest = "goat";
          this.targets.push({ get x() { return a.sprite.x; }, get y() { return a.sprite.y + 2; }, get label() { return g.stray === a && !g.leading && !g.gone && a.sprite.active ? "Lead the stray goat back" : ""; },
            act: () => { g.leading = true; G.say("You take the stray by her bell-strap. She comes, complaining, and keeps trying to eat your sleeve."); } });
        }
      }
      if ([1, 2, 9, 10, 11, 12].includes(this.rec.terrain) && Math.random() < 0.35) g.raidT = 25 + Math.random() * 35;
    }
    this.ways.push(g);
    G.note("wayfarer");
    return g;
  }

  /** Who they are, in a line: names, and the children with them. */
  wayNames(g: WayGroup) {
    const ad = g.people.length ? g.people : [];
    const big = ad.filter((w) => w.folk.age !== "child").map((w) => w.folk.name), kids = ad.filter((w) => w.folk.age === "child");
    return (big.length > 2 ? `${big.slice(0, -1).join(", ")} and ${big[big.length - 1]}` : big.join(" and ")) + (kids.length ? `, and ${kids.length > 1 ? "children" : kids[0].folk.female ? "a girl" : "a boy"}` : "");
  }
  wayLabel(g: WayGroup, w: Wayfarer): string {
    const d = g.def;
    if (w.lying) return g.done.helped !== undefined ? "" : `Help ${g.met ? w.folk.name : "the hurt traveler"}`;
    if (d.id === "runner") return g.done.cheer !== undefined ? "" : "Hail the runner";
    return g.met ? `Talk to ${w.folk.name}` : `Greet ${theTitle(d.title)}`;
  }

  /** Every frame: chases, groups at their business, and newcomers. */
  wayTick(dt: number) {
    for (const [a, c] of [...this.chase]) {
      const tgt = c.to();
      if (!tgt || !a.sprite.active || a.state === "dead" || a.state === "gone" || a.state === "charge" || a.state === "recoil" || a.state === "flee" || (a.appeased && !c.leave)) { this.chase.delete(a); continue; }
      if (this.paused) continue;
      const dx = tgt.x - a.sprite.x, dy = tgt.y - a.sprite.y, d = Math.hypot(dx, dy) || 1;
      a.state = "walk"; a.tx = tgt.x; a.ty = tgt.y; a.timer = 1;
      a.sprite.setVelocity((dx / d) * c.speed, (dy / d) * c.speed);
      if (d < 9) { this.chase.delete(a); c.reach(); }
    }
    for (const g of [...this.ways]) this.tickWay(g, dt);
    if (this.paused) return;
    // Now and then someone comes along while you're here.
    if ((this.wayT -= dt) <= 0) {
      this.wayT = 70 + Math.random() * 90;
      if (this.ways.length < 2 && !this.ways.some((g) => g.def.hostile) && !this.monster) {
        const def = rollWayfarers(Math.random, { terrain: this.rec.terrain, road: !!this.rec.roads?.length, depth: this.depth, day: G.isDay, water: false, monster: false, hutHere: true, only: (w) => w.mode === "cross" });
        if (def && this.spawnWay(def, true)) G.say(WAY_COMING[def.id] ?? `Someone is coming along the way: ${def.title.toLowerCase()}.`);
      }
    }
  }

  tickWay(g: WayGroup, dt: number) {
    const d = g.def, lead = g.people[0];
    for (const w of g.people) w.step(dt, this.paused);
    if (g.gfx) this.drawLine(g);
    if (this.paused) return;
    g.t += dt;
    const px = this.player.x, py = this.player.y, far = (o: { x: number; y: number }) => Math.hypot(o.x - px, o.y - py);
    if (d.hostile) { this.tickBrigands(g, dt); return; }
    if (!lead) { this.dropWay(g); return; }
    // Talking: they stand and face you while you talk.
    if (g.talking) { if (ui(this).talkPanel) { if (d.id !== "runner") for (const w of g.people) { w.hold = Math.max(w.hold, 0.5); if (!w.lying) w.face(px, py); } } else g.talking = false; }
    // Coming up to them, they look round and greet you.
    if (!g.nearSaid && far(lead.sprite) < 44) {
      g.nearSaid = true;
      const w = g.people.find((p) => !p.lying && p.folk.age !== "child") ?? lead;
      if (!w.lying) { w.say(d.id === "runner" ? "Make way!" : pick(NEAR_WORDS)); if (d.mode === "cross" && d.id !== "runner") for (const p of g.people) { p.hold = 2; p.face(px, py); } }
    }
    // Their talk among themselves (and the arguing farmers' arms flung up).
    if (d.chatter && far(lead.sprite) < 300 && !g.talking && (g.chatT -= dt) <= 0) {
      g.chatT = (d.activity === "argue" ? 3 : 6) + Math.random() * 6;
      const w = g.people[g.chatI++ % g.people.length];
      if (!w.lying && !(d.activity === "herd" && g.raiders.length)) { w.say(pick(d.chatter)); if (d.activity === "argue") { w.work = "draw"; this.time.delayedCall(800, () => { w.work = ""; }); } }
    }
    this.shyAnimals(g);
    // Day folk head home at dusk; roamers move on after a while.
    if (!g.leaving && !g.talking && !g.people.some((p) => p.lying) && ((d.when === "day" && !G.isDay && d.activity !== "hurt") || (d.mode === "roam" && (g.life -= dt) <= 0 && !g.raiders.length && g.phase !== "dress" && g.phase !== "draw" && !g.leading))) this.wayLeave(g);
    if (d.mode === "cross" || g.leaving) {
      // The leader keeps a trail, and the others walk in their steps.
      if (lead.walking && (g.trailT -= dt) <= 0) { g.trailT = 0.22; g.trail.push([lead.sprite.x, lead.sprite.y]); if (g.trail.length > 90) g.trail.shift(); }
      g.people.forEach((w, i) => {
        if (i === 0 || w.hold > 0 || w.lying) return;
        const c = g.trail[g.trail.length - 1 - 3 * i];
        if (lead.walking && c && Math.hypot(c[0] - w.sprite.x, c[1] - w.sprite.y) > 6) w.walk([c]);
        else if (!lead.walking && !w.walking && g.after) w.face(lead.sprite.x, lead.sprite.y);
      });
      if (d.activity === "herd") this.herdFollow(g, 30);
      if (!lead.walking && lead.hold <= 0) {
        if (g.after) {
          if ((g.restT -= dt) <= 0) { lead.walk(g.after); g.after = undefined; }
        } else if (!g.outT) { g.outT = 1; for (const w of g.people.slice(1)) w.walk([g.exit!]); }
      }
      if (g.outT && g.people.every((w) => !w.walking || this.offScreen(w.sprite))) this.dropWay(g);
      return;
    }
    switch (d.activity) {
      case "hunt": this.tickHunter(g, dt); break;
      case "herd": this.tickHerder(g, dt); break;
      case "gather": this.wander(g, dt, 70, "gather"); break;
      case "chop": {
        if (!g.tree || lead.walking) break;
        lead.work = "chop";
        const swing = Math.floor(lead.workT / 0.55);
        if (swing !== g.swing) { g.swing = swing; if (swing % 2 === 0 && far(lead.sprite) < 240) { SOUND.sfx("chop"); if (swing % 6 === 0) this.chips(g.tree[0], g.tree[1], T.TREE, 2); } }
        break;
      }
      case "fish": {
        if ((g.t2 -= dt) <= 0) { g.t2 = 18 + Math.random() * 22; lead.say(pick(["Ha! Got one.", "A little one.", "Come here, you...", "Poseidon be thanked!"])); g.bite = 0.8; }
        if (g.bite) g.bite = Math.max(0, g.bite - dt);
        break;
      }
    }
    // A child or companion keeps near the one they're with.
    if (d.mode === "roam") g.people.forEach((w, i) => { if (i && !w.lying && w.hold <= 0 && !w.walking && Math.hypot(w.sprite.x - lead.sprite.x, w.sprite.y - lead.sprite.y) > 30) { const r = this.wayRoute(w.sprite.x, w.sprite.y, Math.floor((lead.sprite.x + (Math.random() - 0.5) * 30) / TILE), Math.floor((lead.sprite.y + 12) / TILE)); if (r) w.walk(r); } });
  }

  offScreen(s: { x: number; y: number }) { return s.x < -6 || s.y < -6 || s.x > WW * TILE + 6 || s.y > WH * TILE + 6; }

  /** Wildlife shies from people as it does from you: from most folk at about the distance it bolts from you; a hunter creeps much closer. */
  shyAnimals(g: WayGroup) {
    for (const a of this.animals) {
      const sp = SPECIES[a.kind];
      if (!sp.scare || a.appeased || (a.state !== "idle" && a.state !== "walk") || this.chase.has(a) || isMonster(a.kind)) continue;
      for (const w of g.people) {
        if (w.lying) continue;
        const k = g.def.activity === "hunt" ? 0.35 : 0.85;
        if (Math.hypot(a.sprite.x - w.sprite.x, a.sprite.y - w.sprite.y) < sp.scare * k) { for (const b of a.flock.length ? a.flock : [a]) if (b.state !== "flee" && b.state !== "gone") b.bolt(w.sprite); break; }
      }
    }
  }

  /** Off to somewhere else: the nearest way out, or the one they meant to take. */
  wayLeave(g: WayGroup) {
    const lead = g.people[0]; if (!lead) return;
    const gs = this.wayGates(); if (!gs.length) { this.dropWay(g); return; }
    gs.sort((a, b) => Math.hypot(a.tile[0] * TILE - lead.sprite.x, a.tile[1] * TILE - lead.sprite.y) - Math.hypot(b.tile[0] * TILE - lead.sprite.x, b.tile[1] * TILE - lead.sprite.y));
    const to = gs[Math.floor(Math.random() * Math.min(2, gs.length))];
    const r = this.wayRoute(lead.sprite.x, lead.sprite.y, to.tile[0], to.tile[1]);
    for (const w of g.people) { w.work = ""; w.lying = false; }
    g.leaving = true; g.exit = to.off; g.after = undefined; g.trail = [];
    lead.walk([...(r ?? []), to.off]);
    if (g.fire) { this.tweens.add({ targets: [g.fire, g.glow], alpha: 0, duration: 2000 }); }
    if (g.gfx) { g.gfx.destroy(); g.gfx = undefined; }
  }

  /** They have gone: take them (and their goats and fire) away. */
  dropWay(g: WayGroup) {
    if (g.gone) return;
    g.gone = true;
    for (const w of g.people) w.sprite.destroy();
    for (const a of [...g.goats, ...(g.stray && g.leading ? [] : [])]) {
      this.chase.delete(a);
      this.tweens.add({ targets: a.sprite, alpha: 0, duration: 800, onComplete: () => { a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); } });
    }
    g.fire?.destroy(); g.glow?.destroy(); g.stone?.destroy(); g.gfx?.destroy();
    const i = this.ways.indexOf(g); if (i >= 0) this.ways.splice(i, 1);
  }

  /** Root-cutters and the like: from spot to spot near where they are, stooping at each. */
  wander(g: WayGroup, dt: number, radius: number, work: Wayfarer["work"]) {
    const lead = g.people[0];
    if (lead.walking || lead.hold > 0) return;
    if ((g.wT = (g.wT ?? 0) - dt) > 0) { lead.work = work; return; }
    lead.work = "";
    g.wT = 4 + Math.random() * 6;
    for (let i = 0; i < 12; i++) {
      const tx = Math.floor((g.anchor[0] + (Math.random() - 0.5) * 2 * radius) / TILE), ty = Math.floor((g.anchor[1] + (Math.random() - 0.5) * 2 * radius * 0.75) / TILE);
      if (!this.dryAt(tx, ty)) continue;
      const r = this.wayRoute(lead.sprite.x, lead.sprite.y, tx, ty);
      if (r && r.length < 20) { lead.walk(r); return; }
    }
  }

  /** The fisher's line, and the float that dips when a fish takes it. */
  drawLine(g: WayGroup) {
    const w = g.people[0], gf = g.gfx!; gf.clear();
    if (!w || !g.water || w.walking) return;
    const dir = [[0, 1], [-1, 0], [1, 0], [0, -1]][w.facing], hx = w.sprite.x + dir[0] * 7 + (dir[1] ? 4 : 0), hy = w.sprite.y - 6 + dir[1] * 3;
    const bob = Math.sin(this.time.now / 500) * 0.8 + (g.bite ? 2 : 0);
    gf.lineStyle(1, 0xe0d8c0, 0.7).beginPath().moveTo(hx, hy).lineTo(g.water[0], g.water[1] + bob).strokePath();
    gf.fillStyle(0xd84030, 1).fillCircle(g.water[0], g.water[1] + bob, 1.2);
    gf.setDepth(w.sprite.y + 1);
  }

  // ---- the shepherd and his flock
  /** The goats keep round the herder; a goat that falls behind hurries after. */
  herdFollow(g: WayGroup, spread: number) {
    const lead = g.people[0]; if (!lead) return;
    for (const a of g.goats) {
      if (!a.sprite.active || a.state === "dead") continue;
      a.home.setTo(lead.sprite.x - spread, lead.sprite.y - spread * 0.6, spread * 2, spread * 1.2);
      const d = Math.hypot(a.sprite.x - lead.sprite.x, a.sprite.y - lead.sprite.y);
      if (d > spread * 1.8 && !this.chase.has(a) && (a.state === "idle" || a.state === "walk")) {
        a.state = "walk"; a.tx = lead.sprite.x + (Math.random() - 0.5) * 20; a.ty = lead.sprite.y + (Math.random() - 0.5) * 14; a.timer = 2;
        const dx = a.tx - a.sprite.x, dy = a.ty - a.sprite.y, l = Math.hypot(dx, dy) || 1; a.sprite.setVelocity((dx / l) * 30, (dy / l) * 30);
      }
    }
  }

  tickHerder(g: WayGroup, dt: number) {
    const lead = g.people[0];
    this.herdFollow(g, 28);
    // The stray, led back by the bell-strap.
    if (g.stray && g.leading && g.stray.sprite.active) {
      const a = g.stray, d = Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y);
      a.home.setTo(this.player.x - 14, this.player.y - 10, 28, 20);
      if (d > 90) { a.sprite.setPosition(this.player.x - 16, this.player.y + 6); a.sprite.setAlpha(0.4); this.tweens.add({ targets: a.sprite, alpha: 1, duration: 400 }); } // she finds her own way round
      if (d > 14) { a.state = "walk"; a.tx = this.player.x; a.ty = this.player.y + 4; a.timer = 1; const l = d || 1, v = d > 30 ? 60 : 34; a.sprite.setVelocity(((this.player.x - a.sprite.x) / l) * v, ((this.player.y + 4 - a.sprite.y) / l) * v); }
      if (Math.hypot(a.sprite.x - lead.sprite.x, a.sprite.y - lead.sprite.y) < 48) {
        g.leading = false; g.goats.push(a); g.stray = undefined; g.quest = undefined; g.done.goat = G.dayNumber;
        lead.say("There she is!"); lead.hold = 2; lead.face(this.player.x, this.player.y);
        G.addFavor("Hermes", 1, 6); G.data.silver += 6;
        G.say(`${lead.folk.name} throws his arms round the goat's neck and scolds her like a child. "Bless you, stranger." He presses milk and coin on you: ${give("Milk", 2)}, +6 silver. (Hermes, god of herdsmen, is pleased.)`);
      }
    }
    // Wolves come for the flock.
    if (g.raidT !== undefined && (g.raidT -= dt) <= 0 && G.isDay) { g.raidT = undefined; this.raid(g); }
    const goats = g.goats.filter((a) => a.sprite.active && a.state !== "dead");
    const wolves = this.animals.filter((a) => (a.kind === "wolf" || a.kind === "jackal") && a.sprite.active && a.state !== "dead" && a.state !== "gone" && !a.appeased);
    for (const wf of wolves) {
      if (this.chase.has(wf) || wf.state === "charge" || wf.state === "recoil" || wf.state === "flee" || (g.cool?.get(wf) ?? 0) > this.time.now) continue;
      const goat = goats.sort((a, b) => Math.hypot(a.sprite.x - wf.sprite.x, a.sprite.y - wf.sprite.y) - Math.hypot(b.sprite.x - wf.sprite.x, b.sprite.y - wf.sprite.y))[0];
      if (!goat || (Math.hypot(goat.sprite.x - wf.sprite.x, goat.sprite.y - wf.sprite.y) > 190 && !g.pack?.includes(wf))) continue;
      if (!g.raiders.includes(wf)) {
        g.raiders.push(wf);
        if (g.raiders.length === 1) { lead.say(pick(WOLF_CRY)); G.say(`${lead.folk.name} the shepherd shouts: ${wf.kind === "jackal" ? "jackals" : "wolves"} at the flock! (Help him drive them off.)`); }
      }
      this.chase.set(wf, { to: () => (goat.sprite.active && goat.state !== "dead" ? { x: goat.sprite.x, y: goat.sprite.y } : null), speed: SPECIES[wf.kind].charge * 0.75, reach: () => this.goatTaken(g, goat, wf) });
    }
    // The shepherd runs at them with his staff.
    g.raiders = g.raiders.filter((a) => a.sprite.active && a.state !== "dead" && !a.appeased && !this.offScreen(a.sprite));
    if (g.raiders.length) {
      const wf = g.raiders.sort((a, b) => Math.hypot(a.sprite.x - lead.sprite.x, a.sprite.y - lead.sprite.y) - Math.hypot(b.sprite.x - lead.sprite.x, b.sprite.y - lead.sprite.y))[0];
      const d = Math.hypot(wf.sprite.x - lead.sprite.x, wf.sprite.y - lead.sprite.y);
      if ((g.t2 -= dt) <= 0) { g.t2 = 0.5; lead.pace = 1.4; lead.walk([[wf.sprite.x, wf.sprite.y]]); if (Math.random() < 0.3) lead.say(pick(WOLF_CRY)); }
      if (d < 22) { lead.work = "draw"; this.chase.delete(wf); wf.bolt(lead.sprite); (g.cool ??= new Map()).set(wf, this.time.now + 5000); }
      g.raidOn = true;
    } else if (g.raidOn) {
      g.raidOn = false; lead.pace = g.def.pace ?? 1; lead.work = "";
      const lost = g.lost ?? 0;
      if (g.helpedRaid && g.done.raid === undefined) {
        g.done.raid = G.dayNumber; G.addFavor("Hermes", 1, 6); G.data.silver += 8; G.note("savedFlock");
        lead.say("Pan bless you!");
        G.say(`The ${lost ? "rest of the " : ""}flock is safe. ${lead.folk.name} wipes his face. "You've a strong arm, friend. Take this." ${give("Milk", 2)}, +8 silver.${lost ? "" : " Not one lost."} (Hermes +1)`);
        G.earn("Kleos", 1, "you saved a shepherd's flock");
      } else if (lost) G.say(`${lead.folk.name} counts his goats, and counts again, and curses the wolves.`);
    }
    if (!g.raiders.length && !g.leading) this.wander(g, dt, 90, "");
  }

  /** Wolves out of the brush, after the goats. */
  raid(g: WayGroup) {
    const kind: Species = this.rec.terrain === 11 ? "jackal" : "wolf", n = kind === "jackal" ? 2 : 1 + (Math.random() < 0.4 ? 1 : 0);
    const gs = this.wayGates(), lead = g.people[0];
    const from = gs.sort((a, b) => Math.hypot(b.tile[0] * TILE - lead.sprite.x, b.tile[1] * TILE - lead.sprite.y) - Math.hypot(a.tile[0] * TILE - lead.sprite.x, a.tile[1] * TILE - lead.sprite.y))[0];
    if (!from) return;
    for (let i = 0; i < n; i++) {
      const x = from.tile[0] * TILE + 8 + i * 10, y = from.tile[1] * TILE + 8 + i * 6;
      const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - 80, y - 80, 160, 160), (px, py) => this.free(px, py));
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      this.animals.push(a); (g.pack ??= []).push(a);
    }
    G.say(kind === "jackal" ? "Yipping in the scrub: jackals, slinking toward the goats." : "Grey shapes slip out of the brush, low to the ground, toward the flock: wolves.");
  }

  goatTaken(g: WayGroup, goat: Animal, wf: Animal) {
    if (!goat.sprite.active || goat.state === "dead") return;
    goat.state = "dead"; goat.sprite.setVelocity(0, 0).setFlipY(true).setTint(0xb0a090);
    g.lost = (g.lost ?? 0) + 1;
    g.goats.splice(g.goats.indexOf(goat), 1);
    this.time.delayedCall(1800, () => { this.tweens.add({ targets: goat.sprite, alpha: 0, duration: 600, onComplete: () => { goat.sprite.destroy(); const i = this.animals.indexOf(goat); if (i >= 0) this.animals.splice(i, 1); } }); });
    G.say(`The ${beast(wf.kind)} pulls down one of the goats!`);
    this.runOff(wf, 90);
  }

  /** A creature (or a man) makes for the nearest edge and is gone. */
  runOff(a: Animal, speed = 80) {
    const x = a.sprite.x, y = a.sprite.y;
    const ex = [[-30, y], [WW * TILE + 30, y], [x, -30], [x, WH * TILE + 30]].sort((p, q) => Math.hypot(p[0] - x, p[1] - y) - Math.hypot(q[0] - x, q[1] - y))[0];
    a.appeased = true; a.rolled = true;
    this.chase.set(a, { to: () => ({ x: ex[0], y: ex[1] }), speed, reach: () => {}, leave: true });
    this.time.delayedCall(9000, () => { if (a.sprite.active && this.offScreen(a.sprite)) { a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); } });
    const check = this.time.addEvent({ delay: 300, loop: true, callback: () => {
      if (!a.sprite.active) { check.remove(); return; }
      if (this.offScreen(a.sprite)) { check.remove(); this.chase.delete(a); a.state = "gone"; a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); }
      else if (!this.chase.has(a) && a.state !== "charge" && a.state !== "recoil" && a.state !== "dead") this.chase.set(a, { to: () => ({ x: ex[0], y: ex[1] }), speed, reach: () => {}, leave: true });
    } });
  }

  // ---- the hunter
  tickHunter(g: WayGroup, dt: number) {
    const w = g.people[0];
    if (w.lying) return;
    const PREY: Species[] = ["deer", "hare", "boar", "ibex", "bustard"];
    const alive = (a?: Animal) => !!a && a.sprite.active && a.state !== "dead" && a.state !== "gone" && a.sprite.visible && this.animals.includes(a);
    const d = (a: Animal) => Math.hypot(a.sprite.x - w.sprite.x, a.sprite.y - w.sprite.y);
    if (g.phase === "dress") {
      const c = g.prey!;
      if (!c.sprite.active) { g.phase = "seek"; return; }
      if (d(c) > 16) { if (!w.walking) { const side = w.sprite.x < c.sprite.x ? -10 : 10, r = d(c) > 40 ? this.wayRoute(w.sprite.x, w.sprite.y, Math.floor(c.sprite.x / TILE), Math.floor(c.sprite.y / TILE)) : null; w.walk(r && r.length > 1 ? r : [[c.sprite.x + side, c.sprite.y]]); } return; }
      w.work = "kneel"; w.face(c.sprite.x, c.sprite.y);
      if ((g.t2 -= dt) <= 0) {
        w.work = ""; g.kills++; g.phase = "seek"; g.t2 = 3;
        this.tweens.add({ targets: c.sprite, alpha: 0, duration: 500, onComplete: () => { c.sprite.destroy(); const i = this.animals.indexOf(c); if (i >= 0) this.animals.splice(i, 1); } });
        w.say(c.kind === "deer" ? "Lady Artemis, your share." : "Good."); if (g.kills >= 2) g.life = 0;
      }
      return;
    }
    if (g.phase === "draw") {
      if (!alive(g.prey)) { g.phase = "seek"; w.work = ""; return; }
      w.face(g.prey!.sprite.x, g.prey!.sprite.y); w.work = "draw";
      if ((g.t2 -= dt) <= 0) { w.work = ""; g.phase = "loosed"; this.hunterLoose(g, w, g.prey!); }
      return;
    }
    if (g.phase === "loosed") return;
    if (g.phase === "stalk") {
      const p = g.prey;
      if (!alive(p) || p!.state === "flee" || d(p!) > 300) { g.phase = "seek"; g.t2 = 2; w.pace = 1; return; }
      if (d(p!) <= 92 || this.chase.get(p!)) { w.walk([]); w.doing = "idle"; g.phase = "draw"; g.t2 = 0.9; return; }
      if ((g.t3 = (g.t3 ?? 0) - dt) <= 0) { g.t3 = 1.2; w.pace = 0.55; const r = this.wayRoute(w.sprite.x, w.sprite.y, Math.floor(p!.sprite.x / TILE), Math.floor(p!.sprite.y / TILE)); if (r) w.walk(r.slice(0, Math.max(1, r.length - 3))); }
      return;
    }
    // Looking for game.
    if ((g.t2 -= dt) > 0) { this.wander(g, dt, 120, ""); return; }
    g.t2 = 2;
    const game = this.animals.filter((a) => PREY.includes(a.kind) && alive(a) && (a.state === "idle" || a.state === "walk") && !this.chase.has(a) && d(a) < 260).sort((a, b) => d(a) - d(b))[0];
    if (game) { g.prey = game; g.phase = "stalk"; g.t3 = 0; if (Math.hypot(w.sprite.x - this.player.x, w.sprite.y - this.player.y) < 160) w.say("Shh..."); }
  }

  hunterLoose(g: WayGroup, w: Wayfarer, prey: Animal) {
    const sx = w.sprite.x, sy = w.sprite.y - 4, tx = prey.sprite.x, ty = prey.sprite.y;
    const img = this.add.image(sx, sy, "arrow").setDepth(100001).setRotation(Math.atan2(ty - sy, tx - sx));
    if (Math.hypot(sx - this.player.x, sy - this.player.y) < 280) SOUND.sfx("loose");
    this.tweens.add({ targets: img, x: tx, y: ty, duration: Math.max(180, (Math.hypot(tx - sx, ty - sy) / ARROW_SPEED) * 1000), onComplete: () => {
      img.destroy();
      if (g.gone) return;
      g.phase = "seek"; g.t2 = 2.5;
      const there = prey.sprite.active && prey.state !== "dead" && Math.hypot(prey.sprite.x - tx, prey.sprite.y - ty) < 14;
      if (!there || Math.random() > 0.6) { if (prey.sprite.active && prey.state !== "dead") prey.bolt(w.sprite); w.say(pick(["Missed!", "Curse it.", "Too far."])); return; }
      if (prey.hp < 0) prey.hp = QUARRY[prey.kind].hp;
      prey.hp -= prey.kind === "boar" || prey.kind === "bear" ? 1 : 2; // a hunter's arrow goes where he means it to
      if (prey.hp <= 0) {
        prey.state = "dead"; prey.sprite.setVelocity(0, 0).setFlipY(true).setTint(0xb0a090); this.chase.delete(prey);
        g.phase = "dress"; g.prey = prey; g.t2 = 3.5;
        if (Math.hypot(sx - this.player.x, sy - this.player.y) < 300) G.say(`${w.folk.name} the hunter's arrow takes the ${beast(prey.kind)}.`);
        return;
      }
      prey.sprite.setTint(0xff8080); this.time.delayedCall(250, () => prey.sprite.clearTint());
      // A wounded boar or bear turns on whoever hurt it.
      if (prey.kind === "boar" || prey.kind === "bear") {
        g.phase = "draw"; g.t2 = 1.1; g.prey = prey;
        w.say("Gods! It's coming!");
        G.say(`The wounded ${beast(prey.kind)} turns on ${w.folk.name} the hunter!`);
        this.chase.set(prey, { to: () => (w.lying || g.gone ? null : { x: w.sprite.x, y: w.sprite.y }), speed: SPECIES[prey.kind].charge * 0.8, reach: () => this.hunterGored(g, w, prey) });
        g.beast = prey;
      } else prey.bolt(w.sprite);
    } });
  }

  hunterGored(g: WayGroup, w: Wayfarer, a: Animal) {
    w.lying = true; w.work = ""; w.walk([]); g.phase = "hurt"; g.beast = a;
    a.state = "idle"; a.timer = 3; a.rolled = false; a.sprite.setVelocity(0, 0);
    this.cameras.main.shake(80, 0.002);
    G.say(`The ${beast(a.kind)} catches ${w.folk.name} and throws him down! He lies in the grass, hurt. (Help him: food, or cloth to bind the wound.)`);
    for (const p of g.people.slice(1)) p.say("Father!");
  }

  // ---- brigands
  tickBrigands(g: WayGroup, dt: number) {
    const live = g.foes.filter((a) => a.sprite.active && a.state !== "dead" && !a.routed);
    const px = this.player.x, py = this.player.y;
    const dist = (a: Animal) => Math.hypot(a.sprite.x - px, a.sprite.y - py);
    const nearest = live.length ? Math.min(...live.map(dist)) : 999;
    if (!live.length) {
      if (g.phase === "fight" && g.done.won === undefined) {
        g.done.won = G.dayNumber;
        const slain = g.foes.filter((a) => a.state === "dead").length, loot = 4 + slain * (6 + this.depth * 2) + Math.floor(Math.random() * 6);
        G.data.silver += loot;
        G.say(`The road is quiet again. ${slain ? `Among the dead men's things you find a purse:` : "They dropped their purse as they ran:"} +${loot} silver.`);
        G.earn("Kleos", 1, "you fought off brigands on the road");
        if (g.fortress && this.site && !this.site.cleared) { this.site.cleared = true; this.time.delayedCall(1500, () => G.say(`${this.site!.name} is free of them. The king's treasury is yours to search.`)); }
      }
      if (g.foes.every((a) => !a.sprite.active || a.state === "dead")) { const i = this.ways.indexOf(g); if (i >= 0) this.ways.splice(i, 1); g.gone = true; }
      return;
    }
    // Strike first, and it's a fight whatever was said.
    if (g.phase !== "fight" && live.some((a) => a.state === "charge" || a.state === "recoil" || (a.hp >= 0 && a.hp < QUARRY.brigand.hp))) { if (g.phase === "parley") ui(this).closeTalk(); for (const a of live) a.appeased = false; this.brigandsAttack(g, "Blood is drawn, and that settles it."); return; }
    if (g.phase === "") {
      if (nearest < (G.isDay ? 120 : 84)) {
        g.phase = "coming"; G.say(live.length > 1 ? `${live.length === 2 ? "Two" : "Three"} men step out onto the way ahead of you, and they are not smiling.` : "A man steps out onto the way ahead of you, and he is not smiling.");
        for (const a of live) this.alarm(a);
      }
      return;
    }
    if (g.phase === "coming") {
      for (const a of live) { if (a.state === "charge" || a.state === "recoil") continue; a.state = "walk"; a.tx = px; a.ty = py + 2; a.timer = 1; (a as FigureFoe).faceTo(px, py); }
      if (nearest < 34) this.parley(g);
      else if (nearest > 280) { g.phase = "gaveup"; G.say("You leave them behind. They don't follow far."); for (const a of live) { a.state = "idle"; a.timer = 99; a.sprite.setVelocity(0, 0); } }
      return;
    }
    if (g.phase === "gaveup") { if (nearest < 90) g.phase = "coming"; return; }
    if (g.phase === "parley") {
      for (const a of live) { a.state = "idle"; a.timer = 99; a.sprite.setVelocity(0, 0); (a as FigureFoe).faceTo(px, py); }
      if (!ui(this).talkPanel) this.brigandsAttack(g, "You turn your back on them. That was a mistake.");
      return;
    }
    if (g.phase === "fight") {
      for (const a of live) {
        // Hurt badly, a man throws down his weapon and runs.
        if (a.hp > 0 && a.hp <= 1) { this.rout(g, a); continue; }
        if (a.state === "idle" || a.state === "walk") a.charge(30);
        if ((a as FigureFoe).folk.extras.pole === "bow" && a.state === "charge" && dist(a) > 70 && dist(a) < 230 && (g.shootT -= dt) <= 0) {
          g.shootT = 2.2 + Math.random(); a.state = "recoil"; a.timer = 0.6; a.sprite.setVelocity(0, 0);
          this.time.delayedCall(250, () => { if (a.sprite.active && a.state !== "dead") this.shootAt(a); });
        }
      }
    }
  }

  /** The brigands' demand, and what you can do about it. */
  parley(g: WayGroup) {
    const u = ui(this), live = g.foes.filter((a) => a.sprite.active && a.state !== "dead" && !a.routed), n = live.length;
    g.phase = "parley";
    const toll = Math.min(G.data.silver, 6 + 4 * n + this.depth * 2);
    const go = (msg: string) => { u.closeTalk(); this.brigandsLeave(g, msg); };
    const fight = (msg: string) => { u.closeTalk(); this.brigandsAttack(g, msg); };
    const opts: { label: string; fn: () => void }[] = [];
    if (G.data.silver > 0) opts.push({ label: `Hand over ${toll} silver`, fn: () => { G.data.silver -= toll; go(`They weigh the coins in their hands, grin, and melt back into the brush. (−${toll} silver)`); } });
    else opts.push({ label: "Turn out your empty purse", fn: () => { const r = d12(); if (r <= 6) go("They stare at your empty purse, and laugh, and one of them claps you on the back. \"Poorer than us! Go on, then.\""); else fight("\"Nothing? Then we'll take it out of your hide.\""); } });
    const tl = (G.data.aretai.Logos ?? 3) + 1 + G.boon("Hermes");
    opts.push({ label: "Talk your way past (Logos)", fn: () => { const r = d12(); if (r <= tl) go(`You talk: about the soldiers you passed on the road, about the shepherd who saw them, about how poor you are and how rich the next fool will be. They look at each other, and let you by. (d12 ${r}, needed 1–${tl})`); else fight(`They hear you out, then laugh. "Pretty words." (d12 ${r}, needed 1–${tl})`); } });
    const held = G.selectedItem?.id ?? "", armed = ["spear", "sword", "axe"].includes(held), kl = Math.min(3, Math.floor((G.data.currencies.Kleos ?? 0) / 3));
    const tt = Math.max(1, (G.data.aretai.Thymos ?? 3) + (armed ? 2 : 0) + kl - (n - 1) + G.boon("Ares"));
    opts.push({ label: `Face them down (Thymos${armed ? `, ${ITEMS[held].name.toLowerCase()} in hand` : ""})`, fn: () => { const r = d12(); if (r <= tt) { go(`You plant your feet and look them in the eye${armed ? `, your ${ITEMS[held].name.toLowerCase()} ready` : ""}${kl ? ", and one of them mutters your name" : ""}. They decide you are not worth it. (d12 ${r}, needed 1–${tt})`); G.earn("Kleos", 1, "you stared down brigands"); } else fight(`Your voice cracks. They smell it. (d12 ${r}, needed 1–${tt})`); } });
    opts.push({ label: "Fight them", fn: () => fight("You won't pay. So be it.") });
    const names = live.map((a) => (a as FigureFoe).folk.name).join(" and ");
    u.showTalk(n > 1 ? "Brigands" : "A brigand", `${names} · men of the lonely roads`, `${pick(g.def.greet)}${live.some((a) => (a as FigureFoe).folk.extras.pole === "bow") ? "\n\nOne of them has an arrow on the string." : ""}`, opts);
  }
  brigandsAttack(g: WayGroup, msg: string) {
    g.phase = "fight";
    G.say(`${msg} They come at you!`);
    for (const a of g.foes) if (a.sprite.active && a.state !== "dead" && !a.routed) { a.charge(30); this.alarm(a); }
  }
  brigandsLeave(g: WayGroup, msg: string) {
    g.phase = "paid"; G.say(msg);
    for (const a of g.foes) if (a.sprite.active && a.state !== "dead") { a.appeased = true; a.state = "idle"; this.runOff(a, 40); }
  }
  rout(g: WayGroup, a: FigureFoe) {
    a.routed = true; a.appeased = true; a.state = "idle"; a.sprite.setVelocity(0, 0);
    const what = a.folk.extras.pole === "bow" ? "bow" : a.folk.extras.pole ?? "knife";
    G.say(`${a.folk.name} throws down his ${what} and runs for it!`);
    this.runOff(a, 95);
  }
  /** Yielding in the fight: your purse thrown down in the road. */
  yieldPurse(g: WayGroup) {
    if (G.data.silver <= 0) { G.say("You've nothing to throw them. They keep coming."); return; }
    const n = g.foes.filter((a) => a.sprite.active && a.state !== "dead" && !a.routed).length, toll = Math.min(G.data.silver, 10 + 5 * n + this.depth * 2);
    G.data.silver -= toll;
    for (const a of g.foes) if (a.state === "charge" || a.state === "recoil") { a.state = "idle"; a.sprite.setVelocity(0, 0); }
    this.brigandsLeave(g, `You throw your purse down in the road. They snatch it up and are gone. (−${toll} silver)`);
  }

  // ---- what you do for them
  /** A creature slain or calmed: it may be a wolf at the flock, or the boar that went for the hunter. */
  creatureEvent(a: Animal, what: "slain" | "appeased") {
    for (const g of this.ways) {
      if (g.raiders.includes(a)) g.helpedRaid = true;
      if (g.beast === a && what === "slain") {
        const w = g.people[0];
        if (w && !w.lying && g.done.saved === undefined) {
          g.done.saved = G.dayNumber; g.phase = "seek"; w.work = ""; w.say("Artemis! You saved me!");
          G.data.silver += 6; G.addFavor("Artemis", 1, 6);
          G.say(`${w.folk.name} lets out his breath. "That was close as a whisker. You've a hunter's eye." He gives you a share of his purse: +6 silver. (Artemis +1)`);
          G.earn("Kleos", 1, "you saved a hunter from a beast");
        } else if (w && w.lying) g.killedBeast = true;
      }
      if (g.prey === a && what === "slain" && g.phase !== "dress") { const w = g.people[0]; if (w && !w.lying) { w.say("Hey! That one was mine!"); g.phase = "seek"; g.t2 = 3; w.work = ""; } }
    }
  }
  appease(a: Animal) {
    if (a.kind === "brigand") { const g = this.ways.find((x) => x.foes.includes(a as FigureFoe)); if (g) this.yieldPurse(g); return; }
    super.appease(a);
  }
  kill(a: Animal) {
    if (a.kind !== "brigand") { super.kill(a); return; }
    G.note("kill");
    a.state = "dead"; a.sprite.setVelocity(0, 0).setAngle(90).setTint(0xc8b8a8);
    G.say("The brigand goes down, and does not get up.");
    const g = this.ways.find((x) => x.foes.includes(a as FigureFoe));
    if (g) for (const b of g.foes) if (b !== a && b.sprite.active && b.state !== "dead" && !b.routed && Math.random() < 0.5) this.rout(g, b);
    this.time.delayedCall(3500, () => this.tweens.add({ targets: a.sprite, alpha: 0, duration: 1200, onComplete: () => { a.sprite.destroy(); const i = this.animals.indexOf(a); if (i >= 0) this.animals.splice(i, 1); } }));
  }
  struckDown(a: Animal | string) {
    if (typeof a !== "string" && a.kind === "brigand" && G.data.silver > 0 && !G.warded("Hades") && !G.data.divine.charges.Hades) {
      const lost = Math.ceil(G.data.silver / 2); G.data.silver -= lost;
      G.say(`While you lie senseless, they go through your things: −${lost} silver.`);
      const g = this.ways.find((x) => x.foes.includes(a as FigureFoe)); if (g) { g.phase = "paid"; for (const b of g.foes) if (b.sprite.active && b.state !== "dead") { b.appeased = true; this.runOff(b, 40); } }
    }
    super.struckDown(a);
  }
  /** Their campfire lights the dark as yours does, and the dead keep out of it. */
  fireLights() {
    const out = super.fireLights();
    for (const g of this.ways) if (g.fire && !g.leaving) out.push({ x: g.fire.x, y: g.fire.y - 6, r: 60 });
    return out;
  }

  /** Talking with wayfarers: news of the road, a little trade, and now and then someone who needs a hand. */
  talkWay(g: WayGroup, w: Wayfarer, said?: string) {
    const u = ui(this), d = g.def, today = G.dayNumber, first = !g.met;
    g.met = true; g.talking = true;
    if (d.id !== "runner") for (const p of g.people) { p.hold = Math.max(p.hold, 2); if (!p.lying) p.face(this.player.x, this.player.y); }
    const again = (s: string) => this.talkWay(g, w, s);
    const opts: { label: string; fn: () => void }[] = [];
    const held = G.selectedItem?.id ?? "", food = isFoodGift(held), heldName = held ? ITEMS[held].name.toLowerCase() : "";
    const buy = (id: string, price: number, qty = 1) => { if (G.data.silver >= price) opts.push({ label: `Buy ${qty > 1 ? `${qty} ` : ""}${ITEMS[id].name.toLowerCase()} (${price} silver)`, fn: () => { G.data.silver -= price; again(`${give(id, qty)}. (−${price} silver)`); } }); };
    const news = (who: string) => { if (G.data.askedRumor.road !== today) opts.push({ label: "Ask about the road ahead", fn: () => {
      G.data.askedRumor.road = today;
      const r = UIScene.makeRumor("road", SLICE_TERRAINS.filter((t) => t !== this.rec.terrain));
      if (!r) { again(`"Nothing you haven't seen yourself, by the look of your sandals."`); return; }
      r.from = "road";
      const [x, y] = r.key.split(",").map(Number);
      again(`"${who} ${RUMOR_WORDS[r.terrain]}, ${directions(x, y)}. Worth the walk, if you've the legs for it."\n\n(Your journal, J, notes the way.)`);
    } }); };
    const share = (god: string, cap: number, thanks: string) => { if (food && g.done.fed === undefined) opts.push({ label: `Share your ${heldName} with ${g.people.length > 1 ? "them" : w.folk.female ? "her" : "him"}`, fn: () => {
      g.done.fed = today; G.removeItem(held, 1); const v = G.addFavor(god, 1, cap); again(`${thanks} (${god} ${v >= 0 ? "+" : ""}${v})`);
    } }); };
    let text = said ?? (first ? pick(d.greet) : pick([`${w.folk.name} waits to hear what you want.`, `"Yes, friend?"`, `${w.folk.name} looks up.`]));
    const sub = `${this.wayNames(g)} · ${g.god}${g.god.endsWith("s") ? "'" : "'s"} folk`;
    switch (d.id) {
      case "traveler":
        news("I came by"); share("Zeus", 5, "\"Bless you. A stranger's bread tastes of the gods.\" Zeus Xenios sees it.");
        break;
      case "peddler":
        buy("Torch", 3); buy("Wax", 4); buy("Arrow", 5, 3); buy("Fiber", 3, 4); buy("Cloth", 12); news("A carter told me of");
        break;
      case "pilgrim": case "pilgrims": {
        const known = Object.entries(G.data.screens).find(([k, s]) => s.shrine && k !== this.key);
        if (g.done.way === undefined) {
          if (known) opts.push({ label: `Tell ${g.people.length > 1 ? "them" : "him"} the way to the shrine of ${known[1].shrine!.god}`, fn: () => {
            g.done.way = today; const [x, y] = known[0].split(",").map(Number);
            const a = G.addFavor("Hermes", 1, 5), b = G.addFavor(known[1].shrine!.god, 1, 4);
            again(`You tell them of the shrine of ${known[1].shrine!.god}, ${directions(x, y)}. They repeat it back twice to be sure, and thank you, and promise to say your name to the god. (Hermes ${a >= 0 ? "+" : ""}${a}, ${known[1].shrine!.god} ${b >= 0 ? "+" : ""}${b})`);
          } });
          else if (this.rec.shrine) opts.push({ label: "Point them to the shrine here", fn: () => { g.done.way = today; const b = G.addFavor(this.rec.shrine!.god, 1, 4); again(`"Here? Gods, we walked right past it!" They laugh at themselves, and promise to say your name at the altar. (${this.rec.shrine!.god} ${b >= 0 ? "+" : ""}${b})`); } });
        }
        share("Zeus", 5, "They eat a little, and pray over the rest, and thank you.");
        break;
      }
      case "rhapsode": {
        const teach = MELODIES.filter((m) => m.source === "taught" && m.id !== "augury" && !G.data.songs.includes(m.id));
        if (g.done.song === undefined) opts.push({ label: food ? `Give him your ${heldName}, and ask for a song` : "Ask him for a song", fn: () => {
          if (!food) { again(`"A song for a crust, I said. Singers eat too, friend." (Hold some food to give him.)`); return; }
          g.done.song = today; G.removeItem(held, 1);
          if (teach.length) { const m = teach[Math.floor(Math.random() * teach.length)]; again(`He eats, wipes his fingers on his cloak, and sings, and makes you sing it back until you have it.\n\n${u.learnSong(m)}`); }
          else { const v = G.addFavor("Apollo", 1, 4); again(`He eats, and sings of the wrath of Achilles until the light changes. You know every song he knows, he says, so he gives you his best instead. (Apollo ${v >= 0 ? "+" : ""}${v})`); }
        } });
        if (!G.count("Lyre")) buy("Lyre", 35);
        news("I sang at a wedding past");
        break;
      }
      case "runner":
        text = said ?? "\"Can't stop! Message for the council!\" He's past you before you can say more.";
        if (g.done.cheer === undefined) opts.push({ label: "Cheer him on his way", fn: () => { g.done.cheer = today; const v = G.addFavor("Hermes", 1, 3); u.closeTalk(); w.say("Ha!"); G.say(`He raises a hand without slowing. Hermes loves a runner, and those who speed him. (Hermes ${v >= 0 ? "+" : ""}${v})`); } });
        break;
      case "hunter": {
        if (w.lying) { this.helpHurt(g, w, opts, again, "Artemis"); text = said ?? `${w.folk.name} lies clutching his side, grey in the face. "The boar... it came out of nowhere. Help me up, friend, or help me some other way."`; break; }
        if (g.kills) buy("Meat", 4); buy("Hide", 6);
        if (g.done.game === undefined) opts.push({ label: "Ask about the hunting here", fn: () => {
          g.done.game = today; G.data.archeryXp += 8;
          const kinds = [...new Set(this.animals.filter((a) => a.state !== "dead" && !["goat", "eidolon", "brigand"].includes(a.kind) && !isMonster(a.kind)).map((a) => beast(a.kind)))];
          again(`"${kinds.length ? `There's ${kinds.slice(0, 3).join(", ")} about, if you've eyes.` : "Thin today. Everything's gone to ground."} Walk slow, keep the wind in your face, and loose before you're sure, not after." He shows you how he nocks without looking. (Archery practice +8)`);
        } });
        break;
      }
      case "herder": {
        buy("Milk", 4);
        if (!G.data.songs.includes("shepherd") && g.done.song === undefined) opts.push({ label: "Ask him for a song", fn: () => { g.done.song = today; again(`"The call? Every shepherd has it. Listen." He whistles it to the goats, who come trotting, and then makes you do it until they come for you too.\n\n${u.learnSong(melody("shepherd"))}`); } });
        if (g.quest === "goat" && !said) text = `${text}\n\n"And if you see a brown nanny with a bell on her, she's mine. Strayed off this morning, the wretch. Bring her back and you'll not be sorry."`;
        if (g.raiders.length) text = said ?? `"The wolves! Never mind talking, help me!"`;
        break;
      }
      case "woodcutter":
        buy("Wood", 4, 3);
        if (g.done.tip === undefined) opts.push({ label: "Ask about the woods", fn: () => { g.done.tip = today; const v = G.addFavor("Athena", 1, 3); again(`"Cut where the tree tells you. Look at the lean, look at the crown. Fell the old ones, and leave the young; take one, plant one, and the dryads don't mind. Much." (Athena ${v >= 0 ? "+" : ""}${v})`); } });
        break;
      case "herbwoman": {
        if (g.done.taught === undefined) opts.push({ label: "Ask her to show you a plant", fn: () => {
          g.done.taught = today;
          const unknown = Object.keys(FORAGE).filter((id) => G.lore(id) < 1 && LORE[id]);
          if (unknown.length) { const id = unknown[Math.floor(Math.random() * unknown.length)]; G.data.lore.tier[id] = 1; again(`She shows you ${LORE[id].vague}, and names it: ${LORE[id].name}. "Now you'll know it when you see it." (${LORE[id].name}: Basics)`); }
          else again("\"You know them as well as I do. Who taught you? Never mind. Go on with you.\"");
        } });
        buy("Thyme", 3); buy("Mint", 4);
        break;
      }
      case "fisher": {
        const sea = this.rec.terrain === 7 || this.rec.terrain === 6;
        buy(sea ? "Sardine" : "Chub", 3); if (!G.count("rod")) buy("rod", 8);
        if (g.done.tip === undefined) opts.push({ label: "Ask how they're biting", fn: () => { g.done.tip = today; again(`"Dawn and dusk, and after rain. ${sea ? "The deep water holds the big ones, if you've a boat." : "In the slow water by the bank, where it's dark."} And don't stamp about."`); } });
        break;
      }
      case "wounded": case "parched":
        if (d.id === "wounded") { this.helpHurt(g, w, opts, again, "Zeus"); text = said ?? (g.done.helped === undefined ? pick(d.greet) : "\"Gods keep you, friend.\""); break; }
        if (g.done.helped === undefined) {
          const water = G.count("jar") > 0 && G.data.jarWater > 0;
          opts.push({ label: water ? "Give him water from your jar" : G.count("jar") ? "Your jar is empty" : "You have no water to give", fn: () => {
            if (!water) { again("He looks at your empty hands and sags. (Fill your jar at a spring, a river or your well.)"); return; }
            g.done.helped = today; const n = Math.min(G.data.jarWater, 3); G.data.jarWater -= n;
            const v = G.addFavor("Zeus", 1, 6), gift = pick(["Obsidian", "OldCoin", "Amber"]);
            u.closeTalk(); w.lying = false;
            G.say(`He drinks like a dry field drinks rain. "I owe you my life. Here, it's all I have that's worth anything." ${give(gift, 1)}. (Zeus ${v >= 0 ? "+" : ""}${v})`);
            this.time.delayedCall(2500, () => { if (!g.gone) this.wayLeave(g); });
          } });
        }
        break;
      case "couple":
        if (g.done.secret === undefined) {
          opts.push({ label: "Promise you never saw them", fn: () => { g.done.secret = today; const v = G.addFavor("Aphrodite", 1, 5); u.closeTalk(); for (const p of g.people) { p.pace = 1.6; p.hold = 0; } G.say(`"Thank you! Thank you!" They are already running. (Aphrodite ${v >= 0 ? "+" : ""}${v})`); } });
          opts.push({ label: "Tell them to go home to her father", fn: () => { g.done.secret = today; const v = G.addFavor("Hera", 1, 4); G.addFavor("Aphrodite", -1); u.closeTalk(); for (const p of g.people) p.hold = 0; G.say(`The girl bursts into tears; the boy glares at you. They go on anyway, the way they were going. Hera, keeper of marriages, approves of you, if they don't. (Hera ${v >= 0 ? "+" : ""}${v}, Aphrodite −1)`); } });
        }
        break;
      case "quarrel":
        if (g.done.judged === undefined) {
          const [old, young] = g.people;
          const tl = (G.data.aretai.Logos ?? 3) + 2 + G.boon("Athena");
          opts.push({ label: "Hear them both out, and judge (Logos)", fn: () => {
            const r = d12();
            if (r > tl) { G.addFatigue(5); again(`You listen, and ask, and listen, and by the end they are both shouting at you instead of each other. (d12 ${r}, needed 1–${tl}; +5 Fatigue)`); return; }
            g.done.judged = today; const v = G.addFavor("Zeus", 1, 6); G.data.silver += 5; G.earn("Kleos", 1, "you judged a boundary quarrel");
            u.closeTalk(); G.say(`You walk the line with them, find the old hole where the stone stood, and set it back. They grumble, and then they shake hands, and press 5 silver on you for your trouble. (d12 ${r}, needed 1–${tl}; Zeus of boundaries ${v >= 0 ? "+" : ""}${v}; +5 silver)`);
            this.time.delayedCall(2000, () => { if (!g.gone) this.wayLeave(g); });
          } });
          const side = (i: number) => () => {
            g.done.judged = today; u.closeTalk();
            const right = i === g.truth, v = G.addFavor("Zeus", right ? 1 : -1, 6);
            G.say(right ? `You side with ${g.people[i].folk.name}. The other one's face falls; he knows he moved it. (Zeus, who guards boundaries, ${v >= 0 ? "+" : ""}${v})` : `You side with ${g.people[i].folk.name}, and he smirks a little too much. You have just helped a man steal a field. (Zeus ${v >= 0 ? "+" : ""}${v})`);
            this.time.delayedCall(2000, () => { if (!g.gone) this.wayLeave(g); });
          };
          opts.push({ label: `Side with ${old.folk.name}, the elder`, fn: side(0) });
          opts.push({ label: `Side with ${young.folk.name}`, fn: side(1) });
        }
        break;
      case "camp": {
        if (g.done.sat !== today) opts.push({ label: "Sit by their fire a while", fn: () => {
          g.done.sat = today; G.addFatigue(-20); G.heal(4); G.essence = { ...G.essenceMax };
          again(`They make room for you on the log. Someone hands you bread and a cup; someone else tells a story about a one-eyed giant that you're fairly sure isn't true. (Fatigue −20, Vitality +4, Essence full)`);
        } });
        share("Zeus", 6, "You add your share to the common pot, as a guest should. Zeus Xenios sees it.");
        if (G.data.songs.length && g.done.sang === undefined) opts.push({ label: "Sing them a song", fn: () => {
          g.done.sang = today; const m = melody(pick(G.data.songs)), coin = 2 + Math.floor(Math.random() * 5); G.data.silver += coin;
          const v = G.addFavor("Apollo", 1, 4);
          again(`You sing them ${songName(m)}. They clap along, badly, and toss you a few coins when you're done. (+${coin} silver, Apollo ${v >= 0 ? "+" : ""}${v})`);
        } });
        news("We came by");
        break;
      }
      case "caravan":
        buy("Wine", 10); buy("OliveOil", 8); buy("Cloth", 12); buy("Honey", 6); buy("Lamp", 10); news("We came through");
        break;
      case "procession":
        text = said ?? `${text}\n\nThey go to the festival of ${g.god}.`;
        if (g.done.hymn !== today) opts.push({ label: `Walk with them a while, and join the hymn to ${g.god}`, fn: () => {
          g.done.hymn = today; G.data.clock = Math.min(G.data.clock + 0.5, 23.5); const v = G.addFavor(g.god, 2, 6);
          u.closeTalk(); G.say(`You fall in with them and sing until your throat is raw, and turn back where the road bends. (Half an hour passes; ${g.god} ${v >= 0 ? "+" : ""}${v})`);
        } });
        break;
      case "soldiers":
        if (g.done.news === undefined) opts.push({ label: "Ask them for news", fn: () => { g.done.news = today; again(pick(["\"Brigands on the far roads, three of them, one with a bow. If you meet them, run, or pay. Don't be a hero.\"", "\"Wolves came down off the mountain last winter and took half a village's sheep. Keep your goats in at night.\"", "\"Nothing. Marching, mostly. Our captain's lost, but don't tell him we said so.\""])); } });
        if (held === "Wine") opts.push({ label: "Offer them a drink of your wine", fn: () => { G.removeItem("Wine", 1); const v = G.addFavor("Ares", 1, 4); again(`They pass it round and it's gone in a breath. "A good farmer. Ares keep your fields." (Ares ${v >= 0 ? "+" : ""}${v})`); } });
        break;
    }
    u.showTalk(d.title, sub, text, opts);
  }

  /** Someone lying hurt: food, or cloth to bind the wound, and they'll get up and go on. */
  helpHurt(g: WayGroup, w: Wayfarer, opts: { label: string; fn: () => void }[], again: (s: string) => void, god: string) {
    if (g.done.helped !== undefined || !w.lying) return;
    const held = G.selectedItem?.id ?? "", food = isFoodGift(held), cloth = G.count("Cloth") > 0 ? "Cloth" : G.count("Fiber") >= 2 ? "Fiber" : "";
    const helped = (how: string) => {
      g.done.helped = G.dayNumber; w.lying = false; w.hold = 2;
      const v = G.addFavor(god, god === "Zeus" ? 2 : 1, god === "Zeus" ? 8 : 6);
      let gift = "";
      if (g.def.id === "hunter") { gift = ` ${give("Meat", 2)}, ${give("Hide", 1)}.`; G.data.archeryXp += 15; gift += " And he shows you the trick of a second arrow nocked before the first lands. (Archery practice +15)"; }
      else { G.data.silver += 8; gift = " He presses 8 silver on you: \"All I have, and gladly.\""; }
      ui(this).closeTalk();
      G.say(`${how} He gets up, slowly, and tests his weight.${gift} (${god} ${v >= 0 ? "+" : ""}${v})`);
      G.earn("Kleos", g.killedBeast ? 2 : 1, g.killedBeast ? "you killed the beast and saved its hunter" : "you helped a stranger hurt on the road");
      this.time.delayedCall(3000, () => { if (!g.gone) { for (const p of g.people) p.pace = 0.6; this.wayLeave(g); } });
    };
    if (food) opts.push({ label: `Give ${w.folk.female ? "her" : "him"} your ${ITEMS[held].name.toLowerCase()}`, fn: () => { G.removeItem(held, 1); helped(`${w.folk.name} eats as if it were the first food in days. Color comes back into ${w.folk.female ? "her" : "his"} face.`); } });
    if (cloth) opts.push({ label: `Bind the wound with ${cloth === "Cloth" ? "cloth" : "twisted fiber"}`, fn: () => { G.removeItem(cloth, cloth === "Cloth" ? 1 : 2); helped(`You bind the wound tight. ${w.folk.name} hisses through his teeth, then nods.`); } });
    if (!food && !cloth) opts.push({ label: "You have nothing to help with", fn: () => again("(Hold some food to give, or carry cloth or fiber to bind the wound.)") });
  }

  /** Wolves hunt the forests from dusk. */
  wolvesOut = false;
  maybeWolves(gen: () => number = Math.random) {
    if (this.wolvesOut || (this.rec.terrain !== 2 && this.rec.terrain !== 9) || (G.isDay && G.data.clock < G.daylight - 1)) return;
    this.wolvesOut = true;
    const n = 2 + (gen() < 0.5 ? 1 : 0);
    for (let tries = 0, made = 0; tries < 60 && made < n; tries++) {
      const x = 3 + Math.floor(gen() * (WW - 6)), y = 3 + Math.floor(gen() * (WH - 6));
      if (Math.hypot(x * TILE - this.player.x, y * TILE - this.player.y) < 140 || !this.free(x * TILE + 8, y * TILE + 8)) continue;
      const a = new Animal(this, "wolf", x * TILE + 8, y * TILE + 8, new Phaser.Geom.Rectangle(x * TILE - 90, y * TILE - 90, 180, 180), (px, py) => this.free(px, py));
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      this.animals.push(a); made++;
    }
    G.say("Somewhere in the trees, a wolf howls.");
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    this.updateAnimals(dt);
    this.updateMythborn(dt);
    this.directHutFolk(dt);
    this.directSiteFolk(dt);
    this.wayTick(dt);
    this.siteTick();
    this.landmarkTick();
    if (!this.common(dt)) return;
    this.maybeWolves();
    this.monsterTick(dt);
    this.desertHeat(dt);
    const px = this.player.x, py = this.player.y;
    if (this.knock > 0) return; // a blow can't throw you onto the next map
    if (px < 7 && this.open.W) { if (this.mayLeave(-1, 0)) this.leaveFor(-1, 0, "E"); }
    else if (px > WW * TILE - 7 && this.open.E) { if (this.mayLeave(1, 0)) this.leaveFor(1, 0, "W"); }
    else if (py < 6 && this.open.N) { if (this.mayLeave(0, -1)) this.leaveFor(0, -1, "S"); }
    else if (py > WH * TILE - 12 && this.open.S) { if (this.mayLeave(0, 1)) this.leaveFor(0, 1, "N"); }
  }

  subjectAt(): string | null {
    const [fx, fy] = this.lookPoint();
    if (this.cursorMode && !this.inReach(fx, fy)) return null;
    if (this.naiad?.visible && Math.hypot(this.naiad.x - fx, this.naiad.y - fy) < 24) return "naiad";
    if (this.satyrs.some((s) => Math.hypot(s.x - fx, s.y - fy) < 30)) return "satyr";
    const [x, y] = this.facingTile();
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (obj === T.WATER) return "deepwater";
    if (obj === T.SHALLOW) return "shallows";
    if (OBJ_SUBJECT[obj]) return OBJ_SUBJECT[obj];
    return obj === -1 ? `t${this.rec.terrain}` : null;
  }

  leaveFor(dx: number, dy: number, entry: Side) {
    if (this.leaving) return;
    if (this.boat) {
      // Row on to the next stretch of water: the boat comes with you.
      G.data.placed = G.data.placed.filter((q) => q !== this.boat!.p);
      G.data.boatCarry = true;
      // Off the sea side of a shore, or on across the open sea: the next new water is sea.
      const sc0 = this.seaCorner;
      G.data.fromSea = this.isSea || (this.rec.terrain === 7 && !!sc0 && Math.hypot(this.player.x / TILE - sc0[0], (this.player.y / TILE - sc0[1]) * 1.2) < sc0[2] + 3);
      const nx0 = G.data.wx + dx, ny0 = G.data.wy + dy;
      if (nx0 === 0 && (ny0 === 0 || ny0 === 1)) { G.data.boatCarry = false; G.addItem("Boat", 1); G.say("You haul the boat out and carry it home on your back."); }
    }
    const nx = G.data.wx + dx, ny = G.data.wy + dy;
    G.data.lastTerrain = this.rec.terrain; G.data.entry = entry;
    G.data.entryAt = dx !== 0 ? Math.floor(this.player.y / TILE) : Math.floor(this.player.x / TILE);
    if (nx === 0 && ny === 0) { G.data.scene = "Farm"; this.goTo("Farm"); return; }
    if (nx === 0 && ny === 1) { G.data.scene = "Village"; this.goTo("Village"); return; }
    G.data.wx = nx; G.data.wy = ny; G.data.scene = "Wild";
    this.goTo("Wild");
  }

  clearObject(x: number, y: number) {
    const tile = this.objects.getTileAt(x, y)?.index ?? -1;
    this.breakFx(x, y, tile);
    this.objects.putTileAt(-1, x, y);
    this.rec.cleared.push(`${x},${y}`);
    // Artemis keeps count of the wild oaks you fell (Demeter vs Artemis: field against forest).
    if (tile === T.TREE && ++G.data.wildOaks % 4 === 0) { G.addFavor("Artemis", -1); G.say("The forest is thinner for your axe. Artemis notices."); }
  }

  picked() { return (this.rec.picked ??= {}); }
  mapKey() { return this.key; }

  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }

  useItem() {
    const [x, y] = this.facingTile();
    if (x < 1 || y < 1 || x >= WW - 1 || y >= WH - 1) return;
    const item = G.selectedItem;
    const tool = item && ITEMS[item.id].kind === "tool" ? item.id : null;
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (this.tryStrike(tool)) return;
    if (tool !== "hoe" && tool !== "jar" && this.gather(x, y, tool)) return;
    if (tool === "hoe") { G.say("Save the hoe for your own fields."); return; }
    if (tool === "jar") {
      if (!waterKind(this.objects.getTileAt(x, y)?.index)) { G.say("No water here."); return; }
      G.data.jarWater = jarCap();
      if (rungOf(mythRec("naiad").days) >= 1) { G.data.jarSpring = true; G.say(`You fill your jar from ${mythRec("naiad").name}'s spring, with her blessing. Her water makes crops finer.`); }
      else { G.data.jarSpring = false; G.addFavor("Artemis", -1); G.say("You fill your jar without asking. The pool goes still and cold beneath your hands. (Artemis -1)"); }
      return;
    }
    workObject(this, tool, obj, x, y, `${this.key}:${x},${y}`);
  }
}




/** How far out the great sanctuaries lie (in screens from the homestead, the larger of east-west and north-south). */
const DELPHI_FAR = 10, KNOSSOS_FAR = 16;
// ------------------------------------------------------------------ the Labyrinth
/**
 * Daedalus' Labyrinth, beneath Knossos: a maze of passages two paces wide, walled in great stones, dark but for what
 * you bring. In its middle the Minotaur's hall, and the bones and gold of the tribute. The Minotaur hears you and
 * hunts through the passages; Ariadne's thread, if you carry it, runs out behind you to show the way back.
 */
const LCX = 32, LCY = 24, LW = LCX * 3 + 1, LH = LCY * 3 + 1;
class LabyrinthScene extends PlayScene {
  objects!: Phaser.Tilemaps.TilemapLayer;
  dark!: Phaser.GameObjects.Image;
  grid: number[][] = [];
  mino?: Animal;
  minoT = 0; minoHit = 0; heard = false;
  dist: Int32Array = new Int32Array(0); distT = 0;
  wanderTo: [number, number] | null = null;
  thread: [number, number][] = []; threadG?: Phaser.GameObjects.Graphics;
  door = { x: 0, y: 0 };
  constructor() { super("Labyrinth"); }
  get site() { return G.data.sites.Crete ?? G.data.sites.Knossos; }

  create() {
    this.leaving = false;
    const site = this.site, r = rng(((site?.seed ?? 77) ^ 0x1abe) >>> 0);
    // The maze: a backtracker over cells, then some walls knocked through so there is more than one way round.
    const g: number[][] = []; for (let y = 0; y < LH; y++) g.push(new Array(LW).fill(1));
    const seen = new Set<number>(), stack: [number, number][] = [[Math.floor(LCX / 2), 0]];
    const open = (cx: number, cy: number) => { for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g[cy * 3 + 1 + y][cx * 3 + 1 + x] = 0; };
    seen.add(stack[0][1] * LCX + stack[0][0]); open(stack[0][0], stack[0][1]);
    while (stack.length) {
      const [cx, cy] = stack[stack.length - 1];
      const nb = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < LCX && y < LCY && !seen.has(y * LCX + x));
      if (!nb.length) { stack.pop(); continue; }
      const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length)];
      seen.add(ny * LCX + nx); open(nx, ny);
      // knock through the wall between
      for (let k = 0; k < 2; k++) { if (dx) g[cy * 3 + 1 + k][cx * 3 + (dx > 0 ? 3 : 0)] = 0; else g[cy * 3 + (dy > 0 ? 3 : 0)][cx * 3 + 1 + k] = 0; }
      stack.push([nx, ny]);
    }
    for (let i = 0; i < 90; i++) { // loops
      const cx = 1 + Math.floor(r() * (LCX - 2)), cy = 1 + Math.floor(r() * (LCY - 2)), horiz = r() < 0.5;
      for (let k = 0; k < 2; k++) { if (horiz) g[cy * 3 + 1 + k][cx * 3] = 0; else g[cy * 3][cx * 3 + 1 + k] = 0; }
    }
    // The hall in the middle.
    const hx0 = 13 * 3 + 1, hy0 = 9 * 3 + 1, hx1 = 19 * 3, hy1 = 15 * 3;
    for (let y = hy0; y <= hy1; y++) for (let x = hx0; x <= hx1; x++) g[y][x] = 0;
    this.grid = g;
    this.door = { x: Math.floor(LCX / 2) * 3 + 1, y: 1 };
    const objs = g.map((row) => row.map((v) => (v ? T.CYCLO : -1))), ground = g.map((row) => row.map(() => T.FLAGS));
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: LW, height: LH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0).setTint(0x9a9080);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0).setTint(0xa09888);
    this.objects.setCollision(SOLID).setDepth(1);
    this.cameras.main.setBackgroundColor("#0a0908");
    this.physics.world.setBounds(0, 0, LW * TILE, LH * TILE);
    this.cameras.main.setBounds(0, 0, LW * TILE, LH * TILE);
    this.setupInput();
    inDark = !G.data.torchLit;
    this.targets = [];
    const dx = this.door.x * TILE + 16, dy = this.door.y * TILE + 8;
    this.add.image(dx, dy, "ladder").setDepth(TILE * 2);
    this.targets.push({ x: dx, y: dy + 8, label: "Climb back up into the palace", act: () => this.climbOut() });
    // Bones of the tribute, here and there; and in the hall, the gold they wore.
    for (let i = 0; i < 14; i++) { const cx = Math.floor(r() * LCX), cy = Math.floor(r() * LCY); this.add.image(cx * 3 * TILE + 24, cy * 3 * TILE + 26, "lmbones").setDepth(cy * 3 * TILE + 20).setAlpha(0.85); }
    const hc = { x: ((hx0 + hx1) / 2) * TILE + 8, y: ((hy0 + hy1) / 2) * TILE + 8 };
    if (site) {
      const hoard = site.marks?.lab ? null : this.add.image(hc.x, hc.y + 30, "hoard").setDepth(hc.y + 30);
      const sc = this;
      this.targets.push({ x: hc.x, y: hc.y + 28, get label() { return site.marks?.lab ? "" : "Search among the bones of the tribute"; }, act: () => sc.searchTribute(hoard) });
    }
    let sx = dx, sy = dy + 24;
    if (G.data.entry === "" && G.data.px > 0 && G.data.scene === "Labyrinth" && G.data.px < LW * TILE) { sx = G.data.px; sy = G.data.py; }
    G.data.entry = ""; G.data.scene = "Labyrinth";
    this.makePlayer(sx, sy);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();
    // The thread, tied at the door.
    this.thread = G.count("Clew") > 0 ? [[dx, dy + 12]] : [];
    this.threadG = this.add.graphics().setDepth(5);
    // Asterion.
    this.animals = []; this.mino = undefined; this.heard = false; this.minoHit = 0; this.distT = 0;
    if (site && site.minotaur !== "slain") {
      const a = new Animal(this, "minotaur", hc.x, hc.y, new Phaser.Geom.Rectangle(hc.x - 60, hc.y - 40, 120, 80));
      a.decide = () => {}; a.rolled = true; a.hp = QUARRY.minotaur.hp;
      this.physics.add.collider(a.sprite, this.objects);
      this.animals.push(a); this.mino = a;
    }
    this.dark = this.add.image(sx, sy, inDark ? "dark0" : G.count("Lamp") > 0 ? "dark2" : "dark1").setDepth(99990);
    this.cameras.main.fadeIn(400);
    G.say(site?.minotaur === "slain" ? "The Labyrinth. Quiet now, and still the same dark turnings." : `You go down the stair into the Labyrinth. The air is cold and smells of a byre.${this.thread.length ? " You tie the end of Ariadne's thread to the doorpost." : " (Without a thread, you may not find your way back.)"}${inDark ? " (Light a torch: it is utterly dark.)" : ""}`);
  }

  picked() { return ((G.data as unknown as { labPicked?: Record<string, number> }).labPicked ??= {}); }
  mapKey() { return "labyrinth"; }
  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }
  clearObject(_x: number, _y: number) { /* Daedalus built well */ }
  subjectAt(): string | null { return null; }
  useItem() {
    const tool = G.selectedItem && ITEMS[G.selectedItem.id].kind === "tool" ? G.selectedItem.id : null;
    if (this.tryStrike(tool)) return;
    const [x, y] = this.facingTile();
    if ((this.objects.getTileAt(x, y)?.index ?? -1) === T.CYCLO) G.say("Stone blocks fitted without a crack. Daedalus built well.");
  }

  climbOut() {
    if (this.leaving) return;
    const k = G.data.sites.Crete ? undefined : G.data.sites.Knossos, ka = G.data.anchors.knossosAt;
    if (G.data.sites.Crete && ka) { const [sx, sy] = knossosLayout({ WALL: T.WALL, FLAGS: T.FLAGS, COLUMN: T.COLUMN, STONE: T.STONE, BOULDER: T.BOULDER, BRUSH: T.BRUSH, TREE: T.TREE, OLIVE: T.OLIVE, WATER: T.WATER, PATH: T.PATH, DIRT: T.DIRT, LIMESTONE: T.LIMESTONE, FLOWERS: T.FLOWERS }).at.stair;
      [G.data.wx, G.data.wy] = ka.split(",").map(Number); G.data.px = sx * TILE + 8; G.data.py = sy * TILE + 26; }
    if (k) { const L = knossosLayoutGrand({ WALL: T.WALL, FLAGS: T.FLAGS, COLUMN: T.COLUMN, STONE: T.STONE, BOULDER: T.BOULDER, BRUSH: T.BRUSH, TREE: T.TREE, OLIVE: T.OLIVE, WATER: T.WATER, PATH: T.PATH, DIRT: T.DIRT, LIMESTONE: T.LIMESTONE, FLOWERS: T.FLOWERS }); const [sx, sy] = L.at.stair;
      G.data.wx = k.x0 + Math.floor(sx / WW); G.data.wy = k.y0 + Math.floor(sy / WH); G.data.px = (sx % WW) * TILE + 8; G.data.py = (sy % WH) * TILE + 26; }
    G.data.entry = ""; G.data.scene = "Wild"; G.data.torchLit = false;
    this.goTo("Wild");
  }

  searchTribute(hoard: Phaser.GameObjects.Image | null) {
    const s = this.site; if (!s || s.marks?.lab) return;
    if (this.mino && this.mino.state !== "dead" && Math.hypot(this.mino.sprite.x - this.player.x, this.mino.sprite.y - this.player.y) < 160) { G.say("Not with the Minotaur so near."); return; }
    (s.marks ??= {}).lab = G.dayNumber; hoard?.destroy(); this.gesture("act");
    const silver = 50 + Math.floor(Math.random() * 30); G.data.silver += silver;
    G.say(`Among the bones of Athens' sons and daughters, the gold they were sent in: +${silver} silver, ${give("Labrys", 1)}, ${give("Amber", 2)}.`);
    G.earn("Kleos", 1, "you came to the heart of the Labyrinth");
  }

  creatureEvent(a: Animal, what: "slain" | "appeased") {
    if (a !== this.mino || what !== "slain" || !this.site) return;
    this.site.minotaur = "slain";
    G.earn("Kleos", 3, "you killed the Minotaur in the Labyrinth");
    this.time.delayedCall(800, () => G.say("Asterion, the Minotaur, falls in the dark, and does not rise. Somewhere above, in the palace, Ariadne will want to know."));
  }

  /** Every so often, how far every passage is from you, walking: the Minotaur follows it down to you. */
  updateDist() {
    const W = LW, H = LH, d = new Int32Array(W * H).fill(-1);
    const px = Math.floor(this.player.x / TILE), py = Math.floor((this.player.y + 4) / TILE);
    if (px < 0 || py < 0 || px >= W || py >= H) return;
    const q = [py * W + px]; d[q[0]] = 0;
    for (let i = 0; i < q.length; i++) {
      const n = q[i], x = n % W, y = (n / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || this.grid[ny][nx]) continue;
        const m = ny * W + nx; if (d[m] >= 0) continue; d[m] = d[n] + 1; q.push(m);
      }
    }
    this.dist = d;
  }

  minotaurTick(dt: number) {
    const a = this.mino; if (!a || a.state === "dead" || !a.sprite.active) return;
    if ((this.distT -= dt) <= 0) { this.distT = 0.35; this.updateDist(); }
    const W = LW, tx = Math.floor(a.sprite.x / TILE), ty = Math.floor((a.sprite.y + 4) / TILE), here = this.dist[ty * W + tx] ?? -1;
    const hunting = here >= 0 && here < (inDark ? 34 : 46); // it hears you, and a torch carries further
    if (hunting && !this.heard) { this.heard = true; SOUND.sfx("hurt"); this.cameras.main.shake(300, 0.003); G.say("A bellow shakes the stones: something has heard you, and it is coming."); }
    if (!hunting && this.heard && here > 60) this.heard = false;
    let goal: [number, number] | null = null;
    if (hunting) {
      let best = here;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const v = this.dist[(ty + dy) * W + tx + dx]; if (v >= 0 && v < best) { best = v; goal = [tx + dx, ty + dy]; } }
    } else {
      if (!this.wanderTo || Math.hypot(this.wanderTo[0] * TILE - a.sprite.x, this.wanderTo[1] * TILE - a.sprite.y) < 10) {
        const opts = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]).filter(([dx, dy]) => !this.grid[ty + dy]?.[tx + dx]);
        const [dx, dy] = opts[Math.floor(Math.random() * opts.length)] ?? [0, 0]; this.wanderTo = [tx + dx * 3, ty + dy * 3];
        if (this.grid[this.wanderTo[1]]?.[this.wanderTo[0]] !== 0) this.wanderTo = [tx + dx, ty + dy];
      }
      goal = this.wanderTo;
    }
    const d = Math.hypot(this.player.x - a.sprite.x, this.player.y - a.sprite.y);
    if (a.state === "recoil" || a.state === "flee") return; // reeling from a blow
    a.state = "walk"; a.timer = 1;
    if (d < 20 && hunting) { a.tx = this.player.x; a.ty = this.player.y; const k = 60 / Math.max(1, d); a.sprite.setVelocity((this.player.x - a.sprite.x) * k, (this.player.y - a.sprite.y) * k); }
    else if (goal) { const gx = goal[0] * TILE + 8, gy = goal[1] * TILE + 4, l = Math.hypot(gx - a.sprite.x, gy - a.sprite.y) || 1, v = hunting ? 58 : 24; a.tx = gx; a.ty = gy; a.sprite.setVelocity(((gx - a.sprite.x) / l) * v, ((gy - a.sprite.y) / l) * v); }
    if ((this.minoHit -= dt) <= 0 && d < 14) { this.minoHit = 1.3; this.struck(a); }
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    this.updateAnimals(dt);
    this.minotaurTick(dt);
    // The thread pays out behind you.
    if (this.thread.length) {
      const [lx, ly] = this.thread[this.thread.length - 1];
      if (Math.hypot(this.player.x - lx, this.player.y + 4 - ly) > 10 && this.thread.length < 6000) this.thread.push([this.player.x, this.player.y + 4]);
      const g = this.threadG!; g.clear().lineStyle(1.5, 0xc02828, 0.9).beginPath(); g.moveTo(this.thread[0][0], this.thread[0][1]);
      for (const [x, y] of this.thread) g.lineTo(x, y); g.lineTo(this.player.x, this.player.y + 4); g.strokePath();
    }
    this.dark.setPosition(this.player.x, this.player.y);
    this.common(dt);
  }
}

// ------------------------------------------------------------------ the cave
const CW = 40, CH = 30;

class CaveScene extends PlayScene {
  objects!: Phaser.Tilemaps.TilemapLayer;
  dark!: Phaser.GameObjects.Image;
  boss?: Animal;
  rec!: { type: CaveType; boss: "alive" | "appeased" | "slain"; hoard: boolean; mined: Record<string, string[]> };
  level = 1;
  exitUp = { x: 20, y: 1 };
  exitDown = { x: 20, y: 27 };
  hoardAt = { x: 20, y: 27 };

  constructor() { super("Cave"); }

  create() {
    this.leaving = false;
    const { key, level } = G.data.cave;
    this.level = level;
    this.rec = G.data.caves[key];
    const [cwx, cwy] = key.split(",").map(Number);
    // Each level is the same every visit: it comes from the cave's own seed.
    const gen = rng(screenSeed(cwx, cwy) ^ (0x9a7e + level * 7919));
    let grid: number[][] = [];
    for (let y = 0; y < CH; y++) { grid.push([]); for (let x = 0; x < CW; x++) grid[y].push(x === 0 || y === 0 || x === CW - 1 || y === CH - 1 || gen() < 0.44 ? 1 : 0); }
    const start = { x: 20, y: 2 };
    const end = level < CAVE_LEVELS ? { x: 6 + Math.floor(gen() * 28), y: 26 } : { x: 20, y: 24 };
    const path: [number, number][] = [];
    let px = start.x, py = start.y;
    for (let i = 0; i < 400 && (px !== end.x || py !== end.y); i++) {
      path.push([px, py]);
      if (gen() < 0.6) { if (gen() < 0.5 && px !== end.x) px += Math.sign(end.x - px); else if (py !== end.y) py += Math.sign(end.y - py); else px += Math.sign(end.x - px); }
      else { px += gen() < 0.5 ? -1 : 1; px = Math.max(2, Math.min(CW - 3, px)); }
    }
    path.push([end.x, end.y]);
    for (let it = 0; it < 4; it++) {
      const next = grid.map((row) => [...row]);
      for (let y = 1; y < CH - 1; y++) for (let x = 1; x < CW - 1; x++) {
        let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) n += grid[y + dy][x + dx];
        next[y][x] = n >= 5 ? 1 : n <= 2 ? 0 : grid[y][x];
      }
      grid = next;
    }
    const open = (x: number, y: number, r: number) => { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) if (xx > 0 && yy > 0 && xx < CW - 1 && yy < CH - 1) grid[yy][xx] = 0; };
    for (const [x, y] of path) open(x, y, 1);
    open(start.x, start.y, 1);
    if (level === CAVE_LEVELS) {
      for (let y = 19; y <= 28; y++) for (let x = 14; x <= 26; x++) if (Math.hypot((x - 20) / 1.3, y - 24) <= 4.6 && y < CH - 1) grid[y][x] = 0;
    } else open(end.x, end.y, 1);
    this.exitDown = { x: end.x, y: end.y + (level < CAVE_LEVELS ? 1 : 0) };
    this.hoardAt = { x: 20, y: 27 };
    if (level === CAVE_LEVELS) grid[27][20] = 0;
    else grid[end.y + 1][end.x] = 0;
    // Ore in the walls' edges, mined once and gone for good.
    const mined = (this.rec.mined[level] ??= []);
    const objs: number[][] = [], ground: number[][] = [];
    for (let y = 0; y < CH; y++) {
      objs.push([]); ground.push([]);
      for (let x = 0; x < CW; x++) {
        ground[y].push(T.CAVEFLOOR);
        let o = grid[y][x] ? T.CAVEWALL : -1;
        if (o === -1 && Math.abs(x - start.x) + Math.abs(y - start.y) > 4) {
          let walls = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) walls += grid[y + dy]?.[x + dx] ?? 1;
          if (walls >= 2 && gen() < 0.07 && !path.some(([a, b]) => a === x && b === y)) o = T.ORE;
        }
        if (mined.includes(`${x},${y}`)) o = -1;
        objs[y].push(o);
      }
    }
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: CW, height: CH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(SOLID).setDepth(1);
    this.cameras.main.setBackgroundColor("#0e0c0a");

    this.physics.world.setBounds(0, 0, CW * TILE, CH * TILE);
    this.cameras.main.setBounds(0, 0, CW * TILE, CH * TILE);
    this.setupInput();
    inDark = !G.data.torchLit;
    this.targets = [];
    // The way up, and the way down (or the keeper's chamber and its hoard).
    this.add.image(start.x * TILE + 8, 1 * TILE + 8, "ladder").setDepth(TILE * 2);
    this.targets.push({ x: start.x * TILE + 8, y: 2 * TILE, label: level === 1 ? "Climb out of the cave" : "Climb back up", act: () => this.climb(-1) });
    if (level < CAVE_LEVELS) {
      this.add.image(this.exitDown.x * TILE + 8, this.exitDown.y * TILE + 8, "hole").setDepth(this.exitDown.y * TILE);
      this.targets.push({ x: this.exitDown.x * TILE + 8, y: this.exitDown.y * TILE + 4, label: "Go deeper", act: () => this.climb(1) });
    } else {
      this.add.image(this.hoardAt.x * TILE + 8, this.hoardAt.y * TILE + 8, "hoard").setDepth(this.hoardAt.y * TILE + 10);
      const sc = this;
      this.targets.push({ x: this.hoardAt.x * TILE + 8, y: this.hoardAt.y * TILE + 4, get label() { return sc.rec.hoard ? "The emptied hoard" : "Search the hoard"; }, act: () => this.searchHoard() });
    }
    let sx = start.x * TILE + 8, sy = 2.6 * TILE;
    if (G.data.entry === "U") { sx = this.exitDown.x * TILE + 8; sy = (this.exitDown.y - 1) * TILE + 8; }
    if (G.data.entry === "" && G.data.px > 0) { sx = G.data.px; sy = G.data.py; }
    G.data.entry = ""; G.data.scene = "Cave";
    this.makePlayer(sx, sy);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();

    // Dwellers: bats in the upper level; the keeper in the deepest chamber.
    this.animals = [];
    if (level === 1) for (let i = 0; i < 4; i++) {
      const [bx, by] = path[Math.floor(path.length * (0.3 + gen() * 0.6))];
      this.animals.push(new Animal(this, "bat", bx * TILE + 8, by * TILE + 8, new Phaser.Geom.Rectangle(bx * TILE - 40, by * TILE - 40, 80, 80)));
    }
    this.boss = undefined;
    if (level === CAVE_LEVELS && this.rec.boss !== "slain") {
      const kind = CAVE_KINDS[this.rec.type].boss;
      const a = new Animal(this, kind, 20 * TILE + 8, 24 * TILE, new Phaser.Geom.Rectangle(16 * TILE, 21 * TILE, 8 * TILE, 5 * TILE));
      this.physics.add.collider(a.sprite, this.objects); this.collideTrunks(a.sprite);
      if (this.rec.boss === "appeased") { a.appeased = true; a.rolled = true; }
      this.animals.push(a); this.boss = a;
      const sc = this;
      this.targets.push({ get x() { return a.sprite.x; }, get y() { return a.sprite.y + 2; }, get label() { return a.state === "dead" ? "" : `Approach the ${beast(a.kind)}`; }, act: () => (a.appeased ? G.say(`The ${beast(a.kind)} lets you be.`) : sc.appease(a)) } as unknown as Target);
    }
    // Clay and ochre in the cave floor.
    this.placeForage(rng(screenSeed(cwx, cwy) ^ (0x51 + level)), 99, 3, (x, y) => x > 1 && y > 3 && x < CW - 2 && y < CH - 2 && objs[y][x] === -1 && !path.some(([a, b]) => a === x && b === y));

    this.dark = this.add.image(sx, sy, inDark ? "dark0" : G.count("Lamp") > 0 ? "dark2" : "dark1").setDepth(99990);
    this.cameras.main.fadeIn(300);
    if (level === 1 && !this.rec.mined.seen) { this.rec.mined.seen = ["1"]; G.say(CAVE_KINDS[this.rec.type].signs); }
    if (level === CAVE_LEVELS && this.rec.boss === "alive") G.say("The passage opens into a chamber. Something here is awake.");
  }

  picked() { const k = `${G.data.cave.key}:${this.level}`; return ((G.data as unknown as { cavePicked?: Record<string, Record<string, number>> }).cavePicked ??= {})[k] ??= {}; }
  mapKey() { return `cave:${G.data.cave.key}:${this.level}`; }

  climb(dir: number) {
    if (this.leaving) return;
    if (dir < 0 && this.level === 1) { G.data.entry = "C"; G.data.scene = "Wild"; G.data.torchLit = false; this.goTo("Wild"); return; }
    G.data.cave.level += dir; G.data.entry = dir > 0 ? "" : "U"; G.data.px = -1;
    this.goTo("Cave");
  }

  searchHoard() {
    if (this.rec.hoard) { G.say("You've taken what was here."); return; }
    if (this.rec.boss === "alive" && this.boss && this.boss.state !== "dead") { G.say(`The ${beast(this.boss.kind)} guards it. Win it over, or overcome it.`); return; }
    this.rec.hoard = true;
    const kind = CAVE_KINDS[this.rec.type];
    const got = this.rec.type === "common" ? `${give("GoldDust", 2)}, ${give("Copper", 2)}` : this.rec.type === "sacred" ? (() => { G.data.silver += 30; return "30 silver among the votive offerings"; })() : (() => { G.data.silver += 40; return "40 silver in grave goods"; })();
    G.say(`You search ${kind.hoard}: ${got}.`);
    G.earn("Kleos", 1, "you went to the bottom of the cave and came back");
  }

  /** The keeper of the deep chamber, slain or won over. */
  creatureEvent(a: Animal, what: "slain" | "appeased") {
    if (a !== this.boss) return;
    this.rec.boss = what;
    const k = a.kind;
    if (what === "appeased") {
      if (k === "eidolon") { G.data.currencies.Pathos += 2; G.addFavor("Hades", 1, 3); G.say("The shade drinks the offering, sighs, and is still. It is at rest at last. (+2 Pathos; something below is grateful.)"); }
      if (k === "lampad") { G.data.currencies.Ambrosia += 1; G.addFavor("Hecate", 1, 3); G.say("The lampad raises her torch, and for a moment you see every hidden thing in the cave. (+1 Ambrosia; Hecate's hidden favor stirs.)"); }
      if (k === "myrmex") G.say("The great ant tastes the honey, clicks its jaws, and lets you pass.");
    } else {
      if (k === "lampad") { G.addFavor("Hecate", -3); G.earn("Hubris", 2, "you struck down Hecate's torch-bearer"); }
      if (k === "eidolon") G.say("The shade comes apart in the torchlight like mist. It will not trouble the living again.");
      if (k === "myrmex") G.earn("Kleos", 1, "you slew a giant ant of the deep");
    }
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    this.updateAnimals(dt);
    if (!this.common(dt)) { this.dark.setPosition(this.player.x, this.player.y); return; }
    this.dark.setPosition(this.player.x, this.player.y);
  }

  subjectAt(): string | null {
    const [x, y] = this.facingTile();
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (obj === T.ORE) return null;
    return obj === T.CAVEWALL || obj === -1 ? "cave" : null;
  }

  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }

  clearObject(x: number, y: number) {
    this.breakFx(x, y, T.STONE);
    this.objects.putTileAt(-1, x, y);
    this.rec.mined[this.level].push(`${x},${y}`);
  }

  useItem() {
    const [x, y] = this.facingTile();
    const tool = G.selectedItem && ITEMS[G.selectedItem.id].kind === "tool" ? G.selectedItem.id : null;
    if (this.tryStrike(tool)) return;
    if (tool !== "hoe" && tool !== "jar" && this.gather(x, y, tool)) return;
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (obj === T.ORE) {
      if (tool !== "mattock") { G.say("Green-stained stone: copper ore. You'll need the mattock."); return; }
      const b = labor(EFFORT.mine, 5 + darkPen(), "Kratos"); if (b === null) return;
      this.clearObject(x, y);
      G.say(`You break out the ore: ${give("Copper", Math.max(1, 1 + (Math.random() < 0.4 ? 1 : 0) + Math.trunc(G.boon("Hades") / 2)))}${inDark ? " (by feel, in the dark)" : ""}${b}`);
      return;
    }
    if (obj === T.CAVEWALL) { G.say("Solid rock."); return; }
  }
}

// ------------------------------------------------------------------ the village
const VW = 40, VH = 30;
const BUILDINGS: { key: string; tx: number; ty: number; w: number; who?: string; label: string }[] = [
  { key: "mill", tx: 6, ty: 4, w: 64, who: "theron", label: "the mill" },
  { key: "smithy", tx: 28, ty: 4, w: 64, who: "lykos", label: "the smithy" },
  { key: "inn", tx: 5, ty: 20, w: 80, who: "eudora", label: "the inn" },
  { key: "shrine", tx: 28, ty: 20, w: 64, who: "myrrhine", label: "the shrine" },
];

class VillageScene extends PlayScene {
  objects!: Phaser.Tilemaps.TilemapLayer;
  people: { id: string; img: Phaser.GameObjects.Image }[] = [];
  strangerImg?: Phaser.GameObjects.Image;

  constructor() { super("Village"); }

  create() {
    this.leaving = false;
    const r = rng(G.data.seed ^ 0x7a11a9e);
    const ground: number[][] = [], objs: number[][] = [];
    for (let y = 0; y < VH; y++) {
      ground.push([]); objs.push([]);
      for (let x = 0; x < VW; x++) {
        ground[y].push(r() < 0.3 ? T.GRASS2 : T.GRASS);
        const edge = x < 1 || y < 1 || x >= VW - 1 || y >= VH - 1;
        objs[y].push(edge && !(x >= 19 && x <= 21) && !(x === VW - 1 && y >= 14 && y <= 16) ? T.EDGE : -1); // gaps: the road north and south, and east to the gymnasion
      }
    }
    // The road through, and the square where it widens.
    for (let y = 0; y < VH; y++) ground[y][20] = T.PATH;
    for (let y = 12; y <= 18; y++) for (let x = 13; x <= 27; x++) ground[y][x] = T.PATH;
    for (let x = 27; x < VW; x++) { ground[15][x] = T.PATH; } // the track east to the gymnasion
    for (const b of BUILDINGS) for (let y = b.ty + 3; y <= 12; y++) ground[y][b.tx + Math.floor(b.w / 32)] = T.PATH;
    for (const b of BUILDINGS) for (let y = 18; y <= b.ty + 3; y++) ground[y][b.tx + Math.floor(b.w / 32)] = T.PATH;
    // A few olives, flowers and stones about the place.
    for (const [x, y, t] of [[3, 15, T.OLIVE], [37, 19, T.OLIVE], [3, 17, T.FLOWERS], [36, 18, T.FLOWERS], [17, 2, T.FLOWERS], [27, 2, T.STONE], [17, 27, T.FLOWERS], [21, 27, T.OLIVE], [11, 15, T.FLOWERS], [29, 15, T.FLOWERS]] as [number, number, number][]) objs[y][x] = t;
    // The ordinary households: a cottage each, with a path from the door to the square.
    this.households = villageHouseholds(G.data.seed);
    for (const h of this.households) {
      const { tx, ty } = h.house, dx = tx + 1, dy = ty + 3;
      for (let y = ty; y <= ty + 3; y++) for (let x = tx; x <= tx + 2; x++) if (objs[y]?.[x] !== undefined && objs[y][x] !== T.EDGE) objs[y][x] = -1;
      if (ty < 12) for (let y = dy; y <= 12; y++) { ground[y][dx] = T.PATH; if (dx < 13 || dx > 27) break; }
      if (ty > 18) for (let y = 18; y < ty; y++) ground[y][dx] = T.PATH;
      if (tx < 13) for (let x = dx; x <= 13; x++) ground[dy][x] = T.PATH;
      if (tx > 27) for (let x = 27; x <= dx; x++) ground[dy][x] = T.PATH;
      if (dy >= 12 && dy <= 18) for (let x = Math.min(dx, 13); x <= Math.max(dx, 27) && (x <= 13 || x >= 27 || x === dx); x++) ground[dy][x] = T.PATH;
    }

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: VW, height: VH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    const vGround = map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    softenPatches(map, vGround, ground, T.GRASS2, T.GRASS, seasonGroundTint(G));
    jitterLayer(map.createBlankLayer("details", ts)!.putTilesAt(scatterDetails(3, 0x7111, objs, (x, y) => ground[y][x] === T.PATH, 0.05), 0, 0), true);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(SOLID).setDepth(1);
    varyLayers(G, vGround, this.objects);
    const chimneys: [number, number][] = [];

    const solids = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number) => {
      const b = solids.create(x, y, "") as Phaser.Physics.Arcade.Sprite;
      b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    };
    this.targets = [];
    this.people = [];
    for (const b of BUILDINGS) {
      const img = this.add.image(b.tx * TILE, b.ty * TILE, b.key).setOrigin(0, 0).setDepth((b.ty + 3.3) * TILE);
      solid(img.x + b.w / 2, img.y + 38, b.w - 6, 30);
      chimneys.push([img.x + b.w * 0.72, img.y + 6]);
      const doorX = img.x + b.w / 2, doorY = img.y + 56;
      if (b.who) {
        const v = VILLAGERS[b.who];
        const p = this.add.image(doorX + 16, doorY + 6, "people", b.who).setDepth(doorY + 10);
        this.tweens.add({ targets: p, y: p.y - 1, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1 });
        this.people.push({ id: b.who, img: p });
        this.targets.push({ x: p.x, y: p.y + 2, get label() { return G.isDay ? `Talk to ${v.name}` : `Knock at ${b.label}`; },
          act: () => (G.isDay ? ui(this).talkTo(v) : G.say(`No answer. ${v.name} is asleep; come back by day.`)) });
      }
    }
    // The cottages of the ordinary households.
    for (const h of this.households) {
      const img = this.add.image(h.house.tx * TILE, h.house.ty * TILE, h.house.key).setOrigin(0, 0).setDepth((h.house.ty + 2.4) * TILE);
      solid(img.x + 24, img.y + 30, 42, 22);
      chimneys.push([img.x + 34, img.y + 4]);
    }
    // The village well, and the altar before the shrine.
    this.add.image(16 * TILE + 8, 14 * TILE + 6, "well").setDepth(14 * TILE + 14); solid(16 * TILE + 8, 14 * TILE + 10, 18, 10);
    this.add.image(31 * TILE + 8, 25 * TILE + 8, "altar").setDepth(25 * TILE + 12); solid(31 * TILE + 8, 25 * TILE + 10, 12, 6);
    this.targets.push(
      { x: 16 * TILE + 8, y: 15 * TILE, label: "The village well", act: () => G.say("The village well. With your water jar in hand, press Space here to fill it.") },
      { x: 31 * TILE + 8, y: 25 * TILE + 12, label: "The village altar", act: () => ui(this).openAltar("shrine") },
      { x: (VW - 2) * TILE + 8, y: 14 * TILE, label: "Read the sign", act: () => G.say("East: the gymnasion and the stadion track. Young men train there every day.") },
    );
    // A festival: pennants strung over the altar ground, the sacrificial fire lit, and the village gathered there.
    const fest = festToday();
    if (fest && G.isDay) {
      const g = this.add.graphics().setDepth(30 * TILE);
      const cols = [0xc4402a, 0xf2c14e, 0x3a6a9a, 0xe9e1cf, 0x6f8a3a];
      for (const [x0, y0, x1, y1] of [[25, 20.6, 36, 20.6], [25, 27.4, 36, 27.4]] as [number, number, number, number][]) {
        g.lineStyle(1, 0x6b4a2b).lineBetween(x0 * TILE, y0 * TILE, x1 * TILE, y1 * TILE);
        for (let i = 0, n = 22; i < n; i++) { const x = (x0 + (x1 - x0) * (i + 0.5) / n) * TILE, y = y0 * TILE + Math.sin(i / 3) * 2; g.fillStyle(cols[i % cols.length]).fillTriangle(x - 3, y, x + 3, y, x, y + 6); }
      }
      const fx = 29 * TILE + 8, fy = 24 * TILE + 8;
      const glow = this.add.image(fx, fy, "focusGlow").setTint(0xffa040).setAlpha(0.5).setScale(2.2).setBlendMode(Phaser.BlendModes.ADD).setDepth(fy);
      this.tweens.add({ targets: glow, alpha: 0.25, scale: 2, yoyo: true, repeat: -1, duration: 420 });
      this.add.image(fx, fy + 6, "pl_Campfire").setOrigin(0.5, 1).setDepth(fy);
      this.targets.push({ x: fx, y: fy + 4, label: `The ${fest.name}: join the festival`, act: () => ui(this).festivalMenu(fest) });
      this.time.delayedCall(700, () => G.say(`The village keeps the ${fest.name} today. ${fest.rite}`));
    }
    // A stranger may be resting on the inn's bench.
    this.rollStranger();
    const st = G.data.stranger;
    if (st && G.isDay) {
      this.strangerImg = this.add.image(5 * TILE + 18, 23 * TILE + 8, "people", STRANGER_KINDS[st.kind].look).setDepth(23 * TILE + 16);
      this.targets.push({ x: this.strangerImg.x, y: this.strangerImg.y + 2, label: "Greet the stranger", act: () => ui(this).talkToStranger() });
    }

    this.physics.world.setBounds(0, 0, VW * TILE, VH * TILE);
    this.cameras.main.setBounds(0, 0, VW * TILE, VH * TILE);
    this.setupInput();
    let sx = G.data.px, sy = G.data.py;
    if (G.data.entry === "N") { sx = 20 * TILE + 8; sy = 1.5 * TILE; }
    if (G.data.entry === "S") { sx = 20 * TILE + 8; sy = (VH - 1.5) * TILE; }
    if (G.data.entry === "E") { sx = (VW - 1.5) * TILE; sy = 15 * TILE + 8; }
    G.data.entry = ""; G.data.scene = "Village";
    for (let y = 14; y <= 16; y++) for (let x = VW - 2; x < VW; x++) this.objects.putTileAt(-1, x, y); // keep the east way clear
    this.makePlayer(sx, sy);
    this.ambience = new Ambience(this, G, { outdoor: true, terrain: 3, layer: this.objects, chimneys });
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();
    this.physics.add.collider(this.player, solids);
    // A flock of sparrows works the square for crumbs.
    const flock: Animal[] = [];
    for (let i = 0; i < 3; i++) { const a = new Animal(this, "bird", 23 * TILE + i * 6, 16 * TILE + (i % 2) * 5, new Phaser.Geom.Rectangle(14 * TILE, 12 * TILE, 13 * TILE, 6 * TILE)); flock.push(a); }
    flock.forEach((a) => (a.flock = flock));
    this.animals = flock;
    // The households come out by day.
    this.walkers = [];
    for (const h of this.households) {
      const door: [number, number] = [h.house.tx * TILE + 24, h.house.ty * TILE + 50];
      h.members.forEach((f, i) => {
        const w = new Walker(this, f, door[0] + (i - 1) * 10, door[1] + 4, door);
        this.physics.add.collider(w.sprite, this.objects); this.physics.add.collider(w.sprite, solids); this.collideTrunks(w.sprite);
        w.sprite.setVisible(G.isDay);
        this.walkers.push({ w, h });
        const sc = this;
        this.targets.push({ get x() { return w.sprite.x; }, get y() { return w.sprite.y + 2; },
          get label() { return w.sprite.visible ? (f.age === "child" ? `Say hello to ${f.name}` : `Talk to ${f.name}`) : ""; }, act: () => sc.talkToFolk(w, h) });
      });
    }
    this.cameras.main.fadeIn(250);
    G.say(G.isDay ? "The village. Smoke from the smithy, the creak of the mill." : "The village sleeps. A dog barks somewhere.");
  }

  /** A new stranger comes to the inn every few days; one in twelve is a god in disguise. */
  rollStranger() {
    const st = G.data.stranger;
    if (st && G.dayNumber - st.arrived < STRANGER_DAYS) return;
    const kind = Math.floor(Math.random() * STRANGER_KINDS.length);
    const gods = STRANGER_KINDS[kind].gods;
    const god = 1 + Math.floor(Math.random() * 12) <= GOD_CHANCE ? gods[Math.floor(Math.random() * gods.length)] : "";
    G.data.stranger = { kind, god, arrived: G.dayNumber, hosted: false, sensed: false };
  }

  households: Household[] = [];
  walkers: { w: Walker; h: Household }[] = [];

  /**
   * What the households do with their day: walk to the square or the well, stop to gossip with a neighbor,
   * sit by their own door, let the children run. At dusk they all go home and in.
   */
  directFolk(dt: number) {
    const dusk = G.data.clock >= G.daylight - 0.4, day = G.isDay;
    const idleAdults = this.walkers.map(({ w }) => w).filter((w) => w.doing === "idle" && w.folk.age !== "child" && w.sprite.visible && w.wait <= 0);
    for (const { w, h } of this.walkers) {
      w.update(dt, this.paused);
      if (this.paused) continue;
      const s = w.sprite;
      if (!day) { if (s.visible) s.setVisible(false); continue; }
      if (!s.visible) { s.setVisible(true).setPosition(w.home[0], w.home[1] + 4); w.doing = "idle"; w.wait = Math.random() * 4; }
      if (dusk) {
        if (w.doing !== "home") { w.talkWith = undefined; w.goTo(w.home[0], w.home[1]); w.doing = "home"; w.wait = 30; }
        else if (Math.hypot(s.x - w.home[0], s.y - w.home[1]) < 8) s.setVisible(false);
        continue;
      }
      // Gossip: trade lines back and forth for a while.
      if (w.doing === "talk" && w.talkWith) {
        w.talkLeft -= dt; w.bubbleT -= dt;
        if (w.bubbleT <= 0 && w.pair) { if (w.line === 0) w.say(w.pair[0]); else w.talkWith.say(w.pair[1]); w.line++; w.bubbleT = 2.6; if (w.line > 1) { w.pair = pickGossip(); w.line = 0; w.bubbleT = 4; } }
        if (w.talkLeft <= 0) { const o = w.talkWith; w.doing = "idle"; w.wait = 3; w.talkWith = undefined; if (o) { o.doing = "idle"; o.wait = 3; o.talkWith = undefined; } }
        continue;
      }
      if (w.doing !== "idle" || w.wait > 0) continue;
      const r = Math.random();
      if (w.folk.age === "child") {
        // Children chase each other about, or run to the square.
        const other = this.walkers.find(({ w: o }) => o !== w && o.folk.age === "child" && o.sprite.visible);
        if (other && r < 0.6) w.goTo(other.w.sprite.x + Phaser.Math.Between(-12, 12), other.w.sprite.y + Phaser.Math.Between(-10, 10));
        else w.goTo(Phaser.Math.Between(14, 26) * TILE, Phaser.Math.Between(12, 18) * TILE);
        w.wait = 1 + Math.random() * 2;
      } else if (r < 0.25) {
        const o = idleAdults.find((x) => x !== w && x.doing === "idle");
        if (o) {
          // Meet halfway and talk.
          const mx = (w.sprite.x + o.sprite.x) / 2, my = (w.sprite.y + o.sprite.y) / 2;
          w.goTo(mx - 7, my); o.goTo(mx + 7, my);
          w.doing = "talk"; o.doing = "talk"; w.talkWith = o; o.talkWith = w;
          w.talkLeft = 8 + Math.random() * 8; w.pair = pickGossip(); w.line = 0; w.bubbleT = 2.5; o.talkLeft = 999;
        } else w.wait = 2;
      } else if (r < (festToday() ? 0.8 : 0.5)) { if (festToday()) w.goTo(Phaser.Math.Between(26, 34) * TILE, Phaser.Math.Between(21, 26) * TILE + 6); else w.goTo(Phaser.Math.Between(14, 26) * TILE, Phaser.Math.Between(12, 18) * TILE + 8); } // the square; on a festival, nearly everyone gathers at the altar
      else if (r < 0.62) w.goTo(16 * TILE + 8 + Phaser.Math.Between(-14, 14), 15 * TILE + 12); // the well
      else if (r < 0.85 || w.folk.age === "elder") { w.goTo(w.home[0] + Phaser.Math.Between(-16, 16), w.home[1] + Phaser.Math.Between(2, 10)); } // by their own door
      else w.wait = 4 + Math.random() * 6; // just stand a while
    }
  }

  /** A few words with one of the households. Children have their own questions. */
  talkToFolk(w: Walker, h: Household) {
    const f = w.folk, u = ui(this);
    w.sprite.setVelocity(0, 0); w.doing = "idle"; w.wait = 6;
    w.facing = Math.abs(this.player.x - w.sprite.x) > Math.abs(this.player.y - w.sprite.y) ? (this.player.x < w.sprite.x ? 1 : 2) : this.player.y < w.sprite.y ? 3 : 0;
    if (f.age === "child") {
      const q = ["\"Are you the new farmer? Do you have a goat? Can I see it?\"", "\"I found a beetle this big. Bigger.\"", "\"My mother says not to talk to strangers. Are you a stranger?\"", "\"Is it true there are horse-men in the forest?\""];
      u.showTalk(f.name, `a child of ${h.trade.name}`, q[Math.floor(Math.random() * q.length)], []);
      return;
    }
    const greet = G.isDay && G.data.clock < 2 ? "Up early." : G.data.weather === "rain" ? "Wet enough for you?" : "Good day to you.";
    u.showTalk(f.name, `of ${h.trade.name} · ${h.trade.patron} keeps their hearth`, `"${greet}" ${h.trade.lines[Math.floor(Math.random() * h.trade.lines.length)]}`,
      [{ label: "Ask about their work", fn: () => u.showTalk(f.name, `of ${h.trade.name}`, h.trade.tip, []) }]);
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    for (const p of this.people) p.img.setVisible(G.isDay);
    this.directFolk(dt);
    this.updateAnimals(dt);
    if (!this.common(dt)) return;
    this.noumeniaVisit(HOUSE_SPOTS.map(([x, y]) => [x + 2, y + 4] as [number, number]), 0.7, 2, "It is the night of Noumenia. The dead have come into the village: pale shapes stand at the doors, where the living have set out suppers for Hecate.");
    if (this.knock > 0) return;
    if (this.player.x > VW * TILE - 6) { if (!this.leaving) { G.data.entry = "W"; G.data.scene = "Gym"; this.goTo("Gym"); } return; }
    if (this.player.y < 6) this.leaveVillage("Farm");
    else if (this.player.y > VH * TILE - 12) this.leaveVillage("Wild");
  }

  leaveVillage(to: "Farm" | "Wild") {
    if (this.leaving) return;
    if (to === "Farm") { G.data.entry = "S"; G.data.scene = "Farm"; this.goTo("Farm"); return; }
    G.data.wx = 0; G.data.wy = 2; G.data.entry = "N"; G.data.entryAt = null; G.data.lastTerrain = HOME_TERRAIN; G.data.scene = "Wild";
    this.goTo("Wild");
  }

  subjectAt(): string | null {
    const [x, y] = this.facingTile();
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    return OBJ_SUBJECT[obj] ?? (obj === -1 ? "t3" : null);
  }

  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }

  useItem() {
    const [x, y] = this.facingTile();
    const tool = G.selectedItem && ITEMS[G.selectedItem.id].kind === "tool" ? G.selectedItem.id : null;
    if (tool === "jar" && x === 16 && (y === 14 || y === 15)) { G.data.jarWater = jarCap(); G.data.jarSpring = false; G.say("You fill the water jar at the village well."); return; }
    if (tool) { G.say("Not in the village. People live here."); return; }
  }
}

// ------------------------------------------------------------------ the HUD, hotbar, inventory, light, dialogs and sleep
const SLOT = 44, GAP = 4;
interface Cell { bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image; qty: Phaser.GameObjects.Text; star: Phaser.GameObjects.Text }
const HOTBAR_X = (W - (SLOT * 10 + GAP * 9)) / 2, HOTBAR_Y = H - SLOT - 14;

// ------------------------------------------------------------------ the gymnasion
const GW = 56, GH = 22;
/** The stadion track runs east-west on rows 8–11, from the start sills to the finish post: about a stade, scaled down. */
const TRACK = { y0: 8, y1: 11, start: 6, finish: 50 };
class GymScene extends PlayScene {
  objects!: Phaser.Tilemaps.TilemapLayer;
  youths: Walker[] = [];
  race?: { runners: { w: Walker; x: number; v: number; phase: number; done: number }[]; state: "ready" | "go" | "done"; t: number; order: number; place: number; onDone: (place: number, n: number) => void; banner: Phaser.GameObjects.Text };
  constructor() { super("Gym"); }
  create() {
    this.leaving = false; this.race = undefined; this.hold = false;
    const r = rng(G.data.seed ^ 0x6e7a5);
    const ground: number[][] = [], objs: number[][] = [];
    for (let y = 0; y < GH; y++) {
      ground.push([]); objs.push([]);
      for (let x = 0; x < GW; x++) {
        ground[y].push(r() < 0.25 ? T.GRASS2 : T.GRASS);
        const edge = x < 1 || y < 1 || x >= GW - 1 || y >= GH - 1;
        let o = edge && !(x === 0 && y >= 14 && y <= 16) ? T.EDGE : -1;
        // Plane trees along the north and south, for shade, as at every gymnasion.
        if (!edge && (y === 2 || y === 19) && x % 4 === (y === 2 ? 1 : 3) && x > 2 && x < GW - 3) o = T.TREE;
        objs[y].push(o);
      }
    }
    for (let y = TRACK.y0; y <= TRACK.y1; y++) for (let x = TRACK.start - 2; x <= TRACK.finish + 2; x++) ground[y][x] = T.PATH; // the track, beaten earth
    for (let x = 0; x <= 20; x++) ground[15][x] = T.PATH; // the way in, past the herm to the palaestra
    for (let y = 12; y <= 15; y++) ground[y][6] = T.PATH;
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: GW, height: GH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    const gl = map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    softenPatches(map, gl, ground, T.GRASS2, T.GRASS, seasonGroundTint(G));
    this.objects = map.createBlankLayer("objects", ts)!; this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(SOLID).setDepth(1);
    varyLayers(G, gl, this.objects);
    const solids = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number) => { const b = solids.create(x, y, "") as Phaser.Physics.Arcade.Sprite; b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h); };
    const g = this.add.graphics().setDepth(TRACK.y0 * TILE - 1);
    // The start sills (balbis): a row of stone slabs with grooves for the toes; the finish: a post at each side.
    g.fillStyle(0xd8d0bc).fillRect(TRACK.start * TILE, TRACK.y0 * TILE, 6, (TRACK.y1 - TRACK.y0 + 1) * TILE);
    for (let y = TRACK.y0 * TILE + 3; y < (TRACK.y1 + 1) * TILE; y += 8) g.fillStyle(0x9c968a).fillRect(TRACK.start * TILE + 2, y, 2, 4);
    g.fillStyle(0xe9e1cf, 0.55).fillRect(TRACK.finish * TILE + 7, TRACK.y0 * TILE, 2, (TRACK.y1 - TRACK.y0 + 1) * TILE);
    for (const y of [TRACK.y0 * TILE - 10, (TRACK.y1 + 1) * TILE]) { g.fillStyle(0xe9e1cf).fillRect(TRACK.finish * TILE + 6, y, 4, 12); g.fillStyle(0xc4402a).fillRect(TRACK.finish * TILE + 5, y, 6, 3); }
    // The palaestra: a colonnaded court for wrestling, roofed in red tile.
    const px0 = 9 * TILE, py0 = 16 * TILE, pw = 11 * TILE;
    const pg = this.add.graphics().setDepth(py0 + 3 * TILE);
    pg.fillStyle(0xa8987a).fillRect(px0, py0 - 4, pw, 6); pg.fillStyle(0x9c4a32).fillRect(px0 - 4, py0 - 14, pw + 8, 11); pg.fillStyle(0x7a3a28).fillRect(px0 - 4, py0 - 4, pw + 8, 2);
    pg.fillStyle(0x8a7a62).fillRect(px0, py0 + 2, pw, 30);
    for (let x = px0 + 4; x < px0 + pw - 2; x += 14) { pg.fillStyle(0xf2ecd8).fillRect(x, py0 + 2, 5, 30); pg.fillStyle(0xd8d0bc).fillRect(x - 1, py0 + 2, 7, 2); }
    pg.fillStyle(0xd8d0bc).fillRect(px0 - 4, py0 + 32, pw + 8, 5);
    solid(px0 + pw / 2, py0 + 18, pw, 30);
    // The herm of Hermes, lord of the gymnasion.
    const hx = 4 * TILE + 8, hy = 14 * TILE + 6;
    this.add.image(hx, hy, "herm").setOrigin(0.5, 1).setDepth(hy); solid(hx, hy - 3, 8, 6);
    const sc = this;
    this.targets = [
      { x: hx, y: hy - 4, label: "Touch the herm of Hermes", act: () => {
        if (G.data.offered.gymHerm === G.dayNumber) { G.say("You've touched the herm for luck today."); return; }
        G.data.offered.gymHerm = G.dayNumber; const after = G.addFavor("Hermes", 1, 3);
        G.say(`You touch the herm for luck, as the athletes do before they train. (Hermes ${after >= 0 ? "+" : ""}${after}, up to +3)`);
      } },
      { x: TRACK.start * TILE + 12, y: (TRACK.y1 + 1) * TILE + 4, get label() { return G.isDay ? "Race the young men (wager 5 silver)" : "The start line"; }, act: () => sc.offerRace() },
      { x: px0 + pw / 2, y: py0 + 40, get label() { return G.isDay ? "Wrestle in the palaestra (wager 5 silver)" : "The palaestra"; }, act: () => sc.offerWrestle() },
    ];
    this.physics.world.setBounds(0, 0, GW * TILE, GH * TILE);
    this.cameras.main.setBounds(0, 0, GW * TILE, GH * TILE);
    this.setupInput();
    let sx = G.data.px, sy = G.data.py;
    if (G.data.entry === "W") { sx = 1.5 * TILE; sy = 15 * TILE + 8; }
    G.data.entry = ""; G.data.scene = "Gym";
    this.makePlayer(sx, sy);
    this.ambience = new Ambience(this, G, { outdoor: true, terrain: 3, layer: this.objects, chimneys: [] });
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects); this.buildTrunks();
    this.physics.add.collider(this.player, solids);
    this.animals = [];
    // Young men at the track by day, stretching and running their laps.
    this.youths = [];
    const used = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const f = makeFolk(rng((G.data.seed ^ (0x9a + i * 77)) >>> 0), `gym${i}`, "adult", false, used);
      const w = new Walker(this, f, (8 + i * 3) * TILE, (TRACK.y1 + 2) * TILE + 6, [(8 + i * 3) * TILE, (TRACK.y1 + 2) * TILE + 6]);
      w.sprite.setVisible(G.isDay); this.youths.push(w);
    }
    this.cameras.main.fadeIn(250);
    G.say(G.isDay ? "The gymnasion: a track of beaten earth under the plane trees, and the palaestra's colonnade. Young men are training, oiled and dusty." : "The gymnasion is empty under the stars.");
    // A festival footrace waiting to be run.
    const fid = G.data.raceFor;
    if (fid) { G.data.raceFor = undefined; const f = festival(fid); this.time.delayedCall(900, () => this.startRace((place, n) => ui(this).awardAgon(f, place, `${f.agon!.name[0].toUpperCase() + f.agon!.name.slice(1)} at the ${f.name}: you finished ${["", "first", "second", "third", "fourth", "fifth"][place]} of ${n}.`))); }
  }
  offerRace() {
    if (!G.isDay) { G.say("No one runs here at night."); return; }
    if (this.race) return;
    if (G.data.silver < 5) { G.say("They want 5 silver on it, to make it interesting."); return; }
    ui(this).choose("Race the young men down the stadion for 5 silver? Tap Shift, fast, to sprint; mind your Air.", () => {
      G.data.silver -= 5;
      this.startRace((place) => {
        if (place === 1) { G.data.silver += 15; G.say("You win the race! They pay up, grumbling: +15 silver (your 5 back, and 10 of theirs)."); }
        else G.say(`You come in ${["", "first", "second", "third", "last"][place]}. They pocket your 5 silver, and slap you on the back.`);
      });
    });
  }
  offerWrestle() {
    if (!G.isDay) { G.say("The palaestra is empty at night."); return; }
    if (G.data.silver < 5) { G.say("A bout costs 5 silver on the side, they say."); return; }
    ui(this).choose("Wrestle a bout for 5 silver? Throw your weight with the beat (Space).", () => {
      G.data.silver -= 5;
      ui(this).rhythm("Wrestling in the palaestra", "Throw your weight with the beat (Space).", 6, (score) => {
        const you = score + 2 * (G.data.aretai.Kratos ?? 3) + (G.patron?.aretai === "Kratos" ? 2 : 0), them = 6 + d12() + Math.floor(Math.random() * 6);
        if (you >= them) { G.data.silver += 10; G.say(`You throw him three times in the sand (${you} to ${them}). +10 silver.`); }
        else G.say(`He throws you, and you taste the sand (${you} to ${them}). Your 5 silver is his.`);
      });
    });
  }
  /** A footrace down the track: you and three young men. Tap Shift to sprint; your Air decides how long you can keep it up. */
  startRace(onDone: (place: number, n: number) => void) {
    const laneY = (i: number) => (TRACK.y0 + i) * TILE + 10;
    this.player.setPosition(TRACK.start * TILE + 14, laneY(1)); this.player.setVelocity(0, 0); this.facing = 2;
    this.hold = true;
    const runners = this.youths.slice(0, 3).map((w, i) => {
      w.sprite.setVisible(true).setPosition(TRACK.start * TILE + 14, laneY(i === 0 ? 0 : i + 1)).setVelocity(0, 0);
      return { w, x: w.sprite.x, v: 0, phase: Math.random() * 6, done: 0 };
    });
    const banner = this.add.text(this.player.x + 40, this.player.y - 40, "Ready...", { fontFamily: FONT, fontSize: "14px", color: "#f2e6c9", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(0.5).setResolution(4).setDepth(99999);
    this.race = { runners, state: "ready", t: 0, order: 0, place: 0, onDone, banner };
    G.essence.Air = Math.max(G.essence.Air, G.essenceMax.Air * 0.8); // a breath at the line
  }
  raceTick(dt: number) {
    const R = this.race!; R.t += dt;
    const finishX = TRACK.finish * TILE + 8;
    if (R.state === "ready") {
      const left = 3 - Math.floor(R.t);
      R.banner.setText(left > 0 ? String(left) : "Go!").setPosition(this.player.x + 40, this.player.y - 40);
      if (R.t >= 3) { R.state = "go"; R.t = 0; this.hold = false; SOUND.sfx("loose"); this.time.delayedCall(600, () => R.banner.setVisible(false)); }
      return;
    }
    if (R.state !== "go") return;
    // The young men: a steady pace with surges and fades of their own.
    for (const r of R.runners) {
      if (r.done) { if (r.v > 0) { r.v = Math.max(0, r.v - 120 * dt); r.x += r.v * dt; } }
      else {
        const target = 82 + 14 * Math.sin(R.t * 1.3 + r.phase) + (R.t > 4 ? 8 : 0) + r.phase * 2;
        r.v += (target - r.v) * Math.min(1, dt * 3); r.x += r.v * dt;
        if (r.x >= finishX) r.done = ++R.order;
      }
      r.w.sprite.x = r.x;
      const pose = r.v > 5 ? [POSE.walk1, POSE.stand, POSE.walk2, POSE.stand][Math.floor(R.t * (r.v / 14)) % 4] : POSE.stand;
      r.w.sprite.setFrame(2 * POSES + pose).setDepth(r.w.sprite.y);
    }
    if (this.player.x >= finishX && !R.place) { R.place = R.order + 1; R.order++; }
    if (R.place || R.t > 40) {
      R.state = "done"; const place = R.place || R.runners.length + 1;
      this.time.delayedCall(800, () => { R.banner.destroy(); for (const r of R.runners) r.w.sprite.setPosition(r.w.home[0], r.w.home[1]); this.race = undefined; R.onDone(place, R.runners.length + 1); });
    }
  }
  update(_t: number, dms: number) {
    const dt = dms / 1000;
    for (const w of this.youths) { w.sprite.setVisible(G.isDay || !!this.race); if (!this.race) w.update(dt, this.paused); }
    if (!this.race) for (const w of this.youths) if (w.doing === "idle" && w.wait <= 0 && G.isDay) { w.goTo(Phaser.Math.Between(TRACK.start + 2, TRACK.finish - 2) * TILE, (TRACK.y1 + 2) * TILE + Phaser.Math.Between(-2, 30)); w.wait = 3 + Math.random() * 5; }
    if (this.race) this.raceTick(dt);
    if (!this.common(dt)) return;
    if (this.knock > 0) return;
    if (this.player.x < 6 && !this.race) { if (!this.leaving) { G.data.entry = "E"; G.data.scene = "Village"; this.goTo("Village"); } }
  }
  subjectAt(): string | null { return null; }
  clearObject() {}
  useItem() {
    const tool = G.selectedItem && ITEMS[G.selectedItem.id].kind === "tool" ? G.selectedItem.id : null;
    if (this.tryStrike(tool)) return;
  }
}

class UIScene extends Phaser.Scene {
  rainGfx?: Phaser.GameObjects.Graphics;
  drops: { x: number; y: number; v: number }[] = [];
  /** Rain falls across the screen outdoors, slanting a little. */
  drawRain(dt: number) {
    const on = G.data.weather === "rain" && ["Farm", "Wild", "Village", "Gym"].includes(G.data.scene);
    if (!this.rainGfx || !this.rainGfx.active) { this.rainGfx = this.add.graphics().setDepth(-1); this.drops = []; this.children.sendToBack(this.rainGfx); this.children.moveAbove(this.rainGfx, this.shade); }
    this.rainGfx.clear();
    if (!on) return;
    while (this.drops.length < 140) this.drops.push({ x: Math.random() * W, y: Math.random() * H, v: 380 + Math.random() * 160 });
    this.rainGfx.lineStyle(1, 0xc8d8ec, 0.45);
    for (const d of this.drops) {
      d.y += d.v * dt; d.x -= d.v * dt * 0.18;
      if (d.y > H) { d.y = -10; d.x = Math.random() * (W + 60); }
      this.rainGfx.lineBetween(d.x, d.y, d.x + 2, d.y - 9);
    }
  }
  modal = false;
  shade!: Phaser.GameObjects.Rectangle;
  date!: Phaser.GameObjects.Text;
  timeText!: Phaser.GameObjects.Text;
  place!: Phaser.GameObjects.Text;
  purse!: Phaser.GameObjects.Text;
  thread!: Phaser.GameObjects.Text;
  patron!: Phaser.GameObjects.Text;
  badge!: Phaser.GameObjects.Rectangle;
  bars!: Phaser.GameObjects.Graphics;
  labels: Record<string, Phaser.GameObjects.Text> = {};
  log: Phaser.GameObjects.Text[] = [];
  help!: Phaser.GameObjects.Container;
  dialog?: Phaser.GameObjects.Container;
  promptText!: Phaser.GameObjects.Text;
  itemName!: Phaser.GameObjects.Text;
  hotbar: Cell[] = [];
  market?: Phaser.GameObjects.Container;
  loreBook?: Phaser.GameObjects.Container;
  craft?: Phaser.GameObjects.Container;
  loreSel = "";
  hotbarGfx!: Phaser.GameObjects.Graphics;
  inv?: { root: Phaser.GameObjects.Container; cells: Cell[]; info: Phaser.GameObjects.Text };
  held: number | null = null;

  constructor() { super("UI"); }

  create() {
    // A scene object is reused when it restarts: start every list and panel fresh.
    this.hotbar = []; this.labels = {}; this.log = []; this.modal = false;
    this.inv = undefined; this.market = undefined; this.loreBook = undefined; this.craft = undefined; this.talkPanel = undefined; this.talkOpts = [];
    this.sheetPanel = undefined; this.sheet = ""; this.ritual = undefined; this.dialog = undefined; this.held = null;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    this.shade = this.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0, 0);

    // Date, hour and patron.
    this.add.rectangle(12, 12, 400, 92, 0x1f1712, 0.78).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f);
    this.date = this.add.text(24, 20, "", { ...font, fontSize: "15px" });
    this.badge = this.add.rectangle(24, 46, 12, 12, 0xffffff).setOrigin(0, 0);
    this.timeText = this.add.text(44, 42, "", { ...font, fontSize: "17px", color: "#fbe39a" });
    this.patron = this.add.text(24, 70, "", { ...font, fontSize: "13px", color: "#e0d2b4", wordWrap: { width: 380 } });
    this.place = this.add.text(16, 110, "", { ...font, fontSize: "14px", color: "#f2e6c9", stroke: "#1f1712", strokeThickness: 4 });

    // Fatigue and Essence, top right.
    this.add.rectangle(W - 312, 12, 300, 108, 0x1f1712, 0.78).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f);
    this.bars = this.add.graphics();
    this.thread = this.add.text(W - 16, 146, "", { ...font, fontSize: "13px", color: "#e8c0b0", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(1, 0);
    this.purse = this.add.text(W - 16, 126, "", { ...font, fontSize: "14px", color: "#e8e2d0", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(1, 0);

    // Hotbar.
    this.hotbarGfx = this.add.graphics();
    for (let i = 0; i < 10; i++) {
      const x = HOTBAR_X + i * (SLOT + GAP);
      const bg = this.add.rectangle(x, HOTBAR_Y, SLOT, SLOT, 0x1f1712, 0.96).setOrigin(0, 0).setStrokeStyle(2, 0x6b4a2b)
        .setInteractive({ useHandCursor: true }).on("pointerdown", () => { if (!this.modal) G.data.selected = i; });
      this.add.text(x + 3, HOTBAR_Y + 1, String((i + 1) % 10), { ...font, fontSize: "11px", color: "#c9b48f" });
      const icon = this.add.image(x + SLOT / 2, HOTBAR_Y + SLOT / 2, "items", "hoe").setScale(2);
      const qty = this.add.text(x + SLOT - 3, HOTBAR_Y + SLOT - 2, "", { ...font, fontSize: "12px", stroke: "#1f1712", strokeThickness: 3 }).setOrigin(1, 1);
      const star = this.add.text(x + SLOT - 3, HOTBAR_Y + 1, "", { ...font, fontSize: "12px", stroke: "#1f1712", strokeThickness: 3 }).setOrigin(1, 0);
      this.hotbar.push({ bg, icon, qty, star });
    }
    this.itemName = this.add.text(W / 2, HOTBAR_Y - 12, "", { ...font, fontSize: "14px", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(0.5, 1);
    this.promptText = this.add.text(W / 2, HOTBAR_Y - 36, "", { ...font, fontSize: "16px", color: "#fbe39a", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(0.5, 1);

    for (let i = 0; i < 4; i++) this.log.push(this.add.text(W / 2, H - 240 + i * 22, "", { ...font, fontSize: "15px", stroke: "#1f1712", strokeThickness: 4, align: "center", wordWrap: { width: 860 } }).setOrigin(0.5, 0).setDepth(3));

    // Keys: 1-0 choose a hotbar slot, the wheel cycles, I or Tab opens the inventory.
    const kb = this.input.keyboard!;
    kb.addCapture("TAB");
    kb.on("keydown", (e: KeyboardEvent) => {
      if (this.dialog) return;
      // Music: hold V to sing (or play what you hold); 1–8 are the steps of the harmonia.
      if (e.key === "v" || e.key === "V") { if (!e.repeat && !this.modal) this.singStart(); return; }
      if (SING.on && e.key >= "1" && e.key <= "8") { if (!e.repeat) this.singNote(Number(e.key)); return; }
      if (SING.on && (e.key === "9" || e.key === "0")) return;
      if (this.talkPanel && e.key >= "1" && e.key <= "9") { const o = this.talkOpts[Number(e.key) - 1]; if (o) o.fn(); return; }
      if (e.key >= "0" && e.key <= "9" && !this.modal) G.data.selected = (Number(e.key) + 9) % 10;
      if ((e.key === "i" || e.key === "I" || e.key === "Tab") && !this.market && !this.loreBook) this.toggleInventory();
      if (e.key === "`" || e.key === "~") { if (this.devPanel) this.closeDev(); else this.openDev(); }
      if ((e.key === "j" || e.key === "J") && !this.market && !this.inv && !this.craft && !this.chestPanel && !this.loreBook) { if (this.talkPanel) this.closeTalk(); else this.openJournal(); }
      if ((e.key === "k" || e.key === "K") && !this.market && !this.inv && !this.craft) { if (this.loreBook) this.closeLore(); else this.openLore(); }
      if (e.key === "m" || e.key === "M") G.say(SOUND.toggleMute() ? "Sound off (M to turn it back on)." : "Sound on.");
      if (e.key === "n" || e.key === "N") G.say(SOUND.toggleMusic() ? "Music on." : "Music off (N to bring it back). The world still sounds.");
      if ((e.key === "c" || e.key === "C") && !this.market && !this.inv && !this.loreBook && !this.chestPanel) { if (this.craft) this.closeCraft(); else this.openCraft(); }
      if ((e.key === "f" || e.key === "F") && !this.talkPanel) { if (this.sheet === "gods") this.closeSheet(); else this.openSheet("gods"); }
      if ((e.key === "p" || e.key === "P") && !this.talkPanel) { if (this.sheet === "self") this.closeSheet(); else this.openSheet("self"); }
    });
    kb.on("keyup", (e: KeyboardEvent) => { if (e.key === "v" || e.key === "V") this.singStop(); });
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (SING.on) { SING.mode = (SING.mode + (dy > 0 ? 1 : HARMONIAI.length - 1)) % HARMONIAI.length; SING.buf = []; return; }
      if (this.modal) return;
      G.data.selected = (G.data.selected + (dy > 0 ? 1 : 9)) % 10;
    });

    this.makeHelp(font);
    G.say(`Dawn on your homestead. ${G.dateLabel()}. Press H for help.`);
  }

  makeHelp(font: { fontFamily: string; color: string }) {
    // Two pages of two columns.
    const pages: [string[], string[]][] = [[[
      "CONTROLS",
      "Move: WASD or arrows. Run: tap Shift, fast, for bursts of speed (each tap spends a little Air).",
      "Aim: point the mouse at anything within two paces. Mouse outside the window: you act on what you face.",
      "Left click or Space: work with what you hold. Right click or E: interact. Q: study.",
      "Items: 1–0 or the mouse wheel. I or Tab: inventory (click two slots to swap). C: crafting.",
      "J: journal. K: lore book. F: the gods. P: who you are. V (hold): sing. M: mute. N: music. H: this help. Esc: pause, save and quit.",
      "",
      "PACING",
      "Every action draws Essence from its Aretai's element: fighting and heavy labor burn Fire; field work, making and calming use Earth; study and wit Water; aim, song and running Air. Skill makes each act cheaper, and so does the matching god's hour. An empty bar refills in about 12 seconds (slower when weary).",
      "Work builds Fatigue; each hour of sleep clears about 12%. Stay up past the second watch and you collapse. A campfire (12 Fiber, 4 Stone, by hand) lets you sleep out for half a bed's rest. Your life is saved each dawn.",
      "",
      "FIGHTING AND HUNTING",
      "Spear: click to thrust (long reach). Hold to aim, release to throw, then go and fetch it.",
      "Sword (forged by Lykos): short reach, hardest blow. Axe, mattock and sickle serve at a pinch.",
      "Bare hands (an empty slot): a light punch that knocks a creature back.",
      "Bow: hold Space to aim, click where the arrow lands. Lead moving quarry.",
      "Angry beasts charge: run, fight, or calm them (E), food in hand. Blows take Vitality (the red bar: 6 per point of Health). At 0 you fall, and your Life Thread frays. Food, sleep and time heal it.",
    ], [
      "THE HOMESTEAD",
      "Hoe tills, the jar waters (refill at the well), the sickle cuts brush, the axe fells, the mattock breaks stone.",
      "Sow on tilled soil and water daily; crops watered every night or sown in their god's hour grow finer (★). Sell at the pithos.",
      "Goats: pet and milk them (E), keep manger and trough full. Honey every few days. Wine: mend the vat, tread grapes, wait 6 days.",
      "Crafting: handwork anywhere (C). Build a workbench, hold it and click to set it down, then E at it for chests, fences, a kiln, a loom, a press (oil, must) and a forge (bronze, tool work).",
      "Tiresias, an old blind seer, sits about the farm. His small requests lead you through the whole world, one a day.",
      "",
      "COOKING",
      "At a campfire or the hearth (E): up to three foods in the pot. A dish strengthens the Aretai of its rarest food for a while, and heals; some old combinations are a god's own dish, and bring that god near. Eat with Space.",
      "",
      "FISHING",
      "Make a rod (C). Hold it and press Space facing water within three paces to cast. Strike (Space) when the float dips, then press as the mark crosses the green. Fresh water and the sea hold different fish; the deep holds the big ones; dawn, dusk and rain bring them up.",
      "",
      "MUSIC",
      "Hold V to hum: 1–8 sing the steps of the harmonia, and the mouse wheel changes harmonia. Hold an instrument to play it instead. Some melodies are minor magic: people teach them; nymphs and birds sing them (sing them back to learn).",
    ]], [[
      "THE WILD",
      "East of the farm lies the wild; each place stays as you left it. Gaps in its borders can be anywhere along an edge. Forage shows its fruit once you know the plant (Q).",
      "Each land has a landmark: things to find (restocked each season), often a cache to search, and its own dangers.",
      "Far out lie citadels of the heroes' age, three screens by three, walled with Cyclopean stone; and off the coasts, row on into the open sea to find its isles. Both go in your journal's Places.",
      "Somewhere out there are Delphi, where the Pythia speaks Apollo's oracles to the clean, once a month, and Knossos, Minos' palace, with the Labyrinth beneath it. Take a torch, and Ariadne's thread.",
      "Shallows: wade at half pace. Deep water: swim at a quarter, and every stroke costs Air; when it's gone you drown. A boat (workbench) rows in strokes, and along rivers and coasts from map to map. Rivers usually have a ford.",
      "Far out, monsters wander rarely. Caves need a torch or lamp (dark: every action -3).",
      "A Naiad's spring and a satyr band are out there: appease them on separate days.",
      "The dead walk at night at crossroads and graveyards; on Noumenia, the first of the month, they gather.",
      "",
      "FESTIVALS AND GAMES",
      "The village keeps the festivals of the year on their days (J lists the next three). On the day, go to the altar: walk in the rite, bring the feast what it wants, and enter the agon for prizes and Kleos. Offerings to the festival's god count double.",
      "East of the village are the gymnasion and the stadion track. The footrace is run there; any day, you can race the young men for a wager. Tap Shift to sprint.",
    ], [
      "GODS, SIGNS AND PEOPLE",
      "Each of the day's twelve hours belongs to a god of the Cosmic Wheel. Pray and make offerings at altars (E).",
      "Favor (F) steps up at 1, 4, 8, 10, 12: help, gifts in the god's domain, a power to call on there, their Aretai +1, protection. Disfavor mirrors it, to real danger at -12. It drifts back toward 0. Country shrines, graveyards and crossroads herms have keepers who will tell you what their god wants.",
      "Hesiod's signs mark the year: study one as it happens and it helps for 4 days. Birds on your right are fair omens, on your left a warning. Watch for glints: rare finds.",
      "Villagers: talk daily and give gifts (hold the item, E). Theron trades; Lykos upgrades tools and forges swords.",
      "Ask villagers if they need anything, and for rumors of lands they've heard of. J: your journal of festivals, promises and rumors.",
      "Strangers come to the inn; feed them, for any of them may be a god.",
    ]]];
    const hbg = this.add.rectangle(W / 2, H / 2, 920, 630, 0x1f1712, 0.96).setStrokeStyle(2, 0xc4703f);
    const title = this.add.text(W / 2, 18, "Works & Days", { ...font, fontSize: "20px" }).setOrigin(0.5, 0);
    const col = (lines: string[], x: number) => this.add.text(x, 54, lines.join("\n"), { ...font, fontSize: "13px", lineSpacing: 2, wordWrap: { width: 424 } });
    const pageObjs = pages.map(([l, r]) => [col(l, W / 2 - 444), col(r, W / 2 + 14)]);
    const foot = this.add.text(W / 2, H - 26, "", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0);
    let page = 0;
    const showPage = (n: number) => {
      page = (n + pages.length) % pages.length;
      pageObjs.forEach((objs, i) => objs.forEach((o) => o.setVisible(i === page)));
      foot.setText(`Page ${page + 1} of ${pages.length}  ·  ← → or click to turn the page  ·  H, Space or Esc to close`);
    };
    showPage(0);
    const lt = pageObjs[0][0], rt = pageObjs[0][1];
    this.input.keyboard!.on("keydown-RIGHT", () => { if (this.help.visible) showPage(page + 1); });
    this.input.keyboard!.on("keydown-LEFT", () => { if (this.help.visible) showPage(page - 1); });
    this.helpPage = showPage;
    const ht = this.add.container(0, 0, [title, ...pageObjs.flat(), foot]); void lt; void rt;
    this.help = this.add.container(0, 0, [hbg, ht]).setDepth(20).setVisible(true);
    this.modal = true;
    const closeHelp = () => { if (this.help.visible) { this.help.setVisible(false); this.modal = !!this.inv; } };
    this.input.keyboard!.on("keydown-H", () => {
      if (this.dialog || this.inv) return;
      this.help.setVisible(!this.help.visible); this.modal = this.help.visible; if (this.help.visible) showPage(0);
    });
    this.input.keyboard!.on("keydown-E", () => {
      if (this.chestPanel) { this.closeChest(); this.closedByE = performance.now(); }
      else if (this.craft && this.craftAt !== "hand") { this.closeCraft(); this.closedByE = performance.now(); }
    });
    for (const k of ["ESC", "ENTER", "SPACE"]) this.input.keyboard!.on(`keydown-${k}`, () => {
      if (this.ritual && k === "SPACE") return; else if (this.sheetPanel && k === "ESC") this.closeSheet(); else if (this.talkPanel && k === "ESC" && !this.ritual) this.closeTalk(); else if (this.craft && (k === "ESC" || (k === "E" && this.craftAt !== "hand"))) this.closeCraft(); else if (this.chestPanel && (k === "ESC" || k === "E")) this.closeChest(); else if (this.devPanel && k === "ESC") this.closeDev(); else if (this.loreBook && k !== "SPACE") this.closeLore(); else if (this.market && k === "ESC") this.closeMarket(); else if (this.inv && k === "ESC") this.toggleInventory(); else if (k === "ESC" && !this.help.visible && !this.dialog && !this.ritual && this.playScene()) this.openPause(); else closeHelp();
    });
    this.input.keyboard!.on("keydown-E", () => { if (this.market) this.closeMarket(); else if (this.talkPanel) this.closeTalk(); });
    hbg.setInteractive().on("pointerdown", () => { if (page < pages.length - 1) showPage(page + 1); else { closeHelp(); showPage(0); } });
  }

  helpPage?: (n: number) => void;
  prompt(label: string | null) { this.promptText.setText(label ? `E — ${label}` : ""); }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    if (SING.on && this.modal) this.singStop();
    this.drawSing(); this.drawReel(dt);
    this.date.setText(`${G.dateLabel()} · ${G.moon} · ${WEATHER_WORD[G.data.weather]}`);
    const play = this.scene.get(G.data.scene) as PlayScene | undefined;
    const terrain = G.data.scene === "Wild" ? (G.data.screens[`${G.data.wx},${G.data.wy}`]?.terrain ?? 3) : G.data.scene === "Cave" ? 99 : 3;
    const danger = !!play?.animals?.some((a) => (a.state === "charge" || a.state === "recoil") && a.sprite.active && Math.hypot(a.sprite.x - play.player.x, a.sprite.y - play.player.y) < 260);
    SOUND.update(dt, { scene: G.data.scene, terrain, season: G.month.season, day: G.isDay, dusk: G.data.clock >= G.daylight - 1.2 && G.data.clock < G.daylight + 1, weather: G.data.weather, danger, festival: !!festToday() });
    this.drawRain(dt);
    this.timeText.setText(G.timeLabel());
    this.place.setText(G.locationLabel());
    this.purse.setText(`Purse: ${money(G.data.silver)}`);
    const ml = G.data.meal, hrs = (u: number) => Math.max(1, Math.ceil(u - G.absHour));
    const fed = [ml.aretai && ml.aretai.until > G.absHour ? `${ml.aretai.ar} +${ml.aretai.n} (${hrs(ml.aretai.until)}h)` : "", ml.favor && ml.favor.until > G.absHour ? `${ml.favor.god} near (${hrs(ml.favor.until)}h)` : ""].filter(Boolean).join(" · ");
    const lt = `Life Thread ${"●".repeat(G.data.lifeThread)}${"○".repeat(Math.max(0, START_LIFE_THREAD - G.data.lifeThread))}${fed ? `\nFed: ${fed}` : ""}`;
    if (this.thread.text !== lt) this.thread.setText(lt);
    const p = G.patron;
    if (p) {
      this.badge.setFillStyle(Phaser.Display.Color.HexStringToColor(p.color).color);
      this.patron.setText(`${p.god}'s hour (${p.aretai}): ${p.benefit}`);
    } else {
      this.badge.setFillStyle(0x6b7a99);
      this.patron.setText("Night belongs to the chthonic powers. Rest soon.");
    }

    // Light: dawn pink, clear day, dusk orange, silver-blue night.
    const day = G.daylight, c = G.data.clock;
    let col = 0x000000, a = 0;
    if (c < 0.8) { col = 0xf2a6c4; a = 0.22 * (1 - c / 0.8); }
    else if (c >= day - 1.2 && c < day) { col = 0xd9732e; a = 0.25 * (1 - (day - c) / 1.2); }
    else if (c >= day) { col = 0x0b1630; a = Math.min(0.62, 0.3 + (c - day) * 0.12); }
    // A grey day: overcast and rain dim the daylight a little.
    const outdoor = ["Farm", "Wild", "Village", "Gym"].includes(G.data.scene);
    if (outdoor && c < day && (G.data.weather === "rain" || G.data.weather === "cloudy")) { const g = G.data.weather === "rain" ? 0.2 : 0.08; if (a < g) { col = 0x3a4250; a = g; } }
    this.shade.setFillStyle(col, a);

    this.drawBars();
    this.drawHotbar();
    if (this.inv) this.drawInventory();

    G.messages.forEach((m) => (m.t += dt));
    G.messages = G.messages.filter((m) => m.t < 6).slice(-4);
    // Stack the messages upward from just above the prompt, so long ones wrap instead of running off screen.
    let y = HOTBAR_Y - 64 - (SING.on ? 150 : 0); // above the singing panel while you sing
    for (let i = this.log.length - 1; i >= 0; i--) {
      const t = this.log[i], m = G.messages[i];
      const txt = m ? m.text : "";
      if (t.text !== txt) t.setText(txt);
      t.setAlpha(m ? Math.min(1, (6 - m.t) / 1.5) : 0);
      if (txt) { y -= t.height + 2; t.setY(y); }
    }
  }

  vitText?: Phaser.GameObjects.Text;
  drawBars() {
    const g = this.bars; g.clear();
    const x = W - 300, y0 = 22;
    const flash = G.spentFlash, since = flash ? performance.now() - flash.at : 1e9;
    const bar = (label: string, y: number, frac: number, color: number) => {
      g.fillStyle(0x3a2c22).fillRect(x + 70, y, 210, 11);
      g.fillStyle(color).fillRect(x + 70, y, 210 * Math.max(0, Math.min(1, frac)), 11);
      // The element you just ran dry of blinks, so you can see what you are waiting on.
      if (flash && flash.el === label && since < 900 && Math.floor(since / 150) % 2 === 0) g.lineStyle(2, 0xfff3c0, 1).strokeRect(x + 69, y - 1, 212, 13);
      if (!this.labels[label]) this.labels[label] = this.add.text(x, y - 3, label, { fontFamily: FONT, fontSize: "13px", color: "#f2e6c9" });
    };
    const vf = G.data.vitality / G.vitalityMax, low = vf <= 0.3 && Math.floor(performance.now() / 400) % 2 === 0;
    bar("Vitality", y0, vf, low ? 0xff6a5a : 0xc0392b);
    const vt = `${Math.ceil(G.data.vitality)} / ${G.vitalityMax}`;
    this.vitText ??= this.add.text(x + 175, y0 - 1, "", { fontFamily: FONT, fontSize: "10px", color: "#fff4e8", stroke: "#1f1712", strokeThickness: 3 }).setOrigin(0.5, 0);
    if (this.vitText.text !== vt) this.vitText.setText(vt);
    bar("Fatigue", y0 + 16, G.data.fatigue / 100, G.exhausted ? 0xb02a3a : 0xc98e62);
    bar("Earth", y0 + 32, G.essence.Earth / G.essenceMax.Earth, 0x6fae52);
    bar("Water", y0 + 48, G.essence.Water / G.essenceMax.Water, 0x3fa9a0);
    bar("Air", y0 + 64, G.essence.Air / G.essenceMax.Air, 0xc9c4e8);
    bar("Fire", y0 + 80, G.essence.Fire / G.essenceMax.Fire, 0xd63a2a);
  }

  fillSlot(cell: Cell, i: number) {
    const s = G.data.slots[i];
    if (!s) { cell.icon.setVisible(false); if (cell.qty.text) cell.qty.setText(""); if (cell.star.text) cell.star.setText(""); return; }
    cell.icon.setVisible(true).setFrame(s.id);
    cell.qty.setText(ITEMS[s.id].kind !== "tool" ? String(s.qty) : s.id === "jar" ? `${G.data.jarWater}` : "");
    // Only touch the star when it changes: restyling text every frame is costly and can fail in WebGL.
    const star = s.q && s.q > 1 ? "★" : "", col = s.q === 3 ? "#f2c14e" : "#d8d8e0";
    if (cell.star.text !== star) cell.star.setText(star);
    if (star && cell.star.style.color !== col) cell.star.setColor(col);
  }

  drawHotbar() {
    for (let i = 0; i < 10; i++) {
      const h = this.hotbar[i];
      this.fillSlot(h, i);
      h.bg.setStrokeStyle(i === G.data.selected ? 3 : 2, i === G.data.selected ? 0xf2c14e : 0x6b4a2b);
    }
    const s = G.selectedItem;
    const d = s ? ITEMS[s.id] : null;
    this.itemName.setText(d ? `${s!.q && s!.q > 1 ? QUALITY[s!.q] + " " : ""}${toolName(d.id, G.toolLevel(d.id), d.name)}${d.greek ? ` (${d.greek})` : ""}${s!.id === "jar" ? ` · ${G.data.jarWater}/${jarCap()} water` : ""}${s!.id === "bow" ? ` · ${G.count("Arrow")} arrows · Archery ${G.archery} · hold Space to aim, click to loose` : ""}` : "Bare hands");
  }

  toggleInventory() {
    if (this.dialog) return;
    if (this.inv) { this.inv.root.destroy(); this.inv = undefined; this.held = null; this.modal = this.help.visible; return; }
    if (this.help.visible) this.help.setVisible(false);
    this.modal = true;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const rows = INVENTORY_SIZE / 10, w = 10 * (SLOT + GAP) + 40, h = rows * (SLOT + GAP) + 130;
    const x0 = (W - w) / 2, y0 = (H - h) / 2 - 30;
    const root = this.add.container(0, 0).setDepth(22);
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.96).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 14, "Belongings", { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 40, "The top row is your hotbar (keys 1–0). Click a slot, then another, to swap them.", { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    const cells = [];
    for (let i = 0; i < INVENTORY_SIZE; i++) {
      const cx = x0 + 20 + (i % 10) * (SLOT + GAP), cy = y0 + 66 + Math.floor(i / 10) * (SLOT + GAP) + (i >= 10 ? 8 : 0);
      const bg = this.add.rectangle(cx, cy, SLOT, SLOT, 0x2a1d14, 1).setOrigin(0, 0).setStrokeStyle(2, 0x6b4a2b).setInteractive({ useHandCursor: true });
      const icon = this.add.image(cx + SLOT / 2, cy + SLOT / 2, "items", "hoe").setScale(2);
      const qty = this.add.text(cx + SLOT - 3, cy + SLOT - 2, "", { ...font, fontSize: "12px", stroke: "#1f1712", strokeThickness: 3 }).setOrigin(1, 1);
      const star = this.add.text(cx + SLOT - 3, cy + 1, "", { ...font, fontSize: "12px", stroke: "#1f1712", strokeThickness: 3 }).setOrigin(1, 0);
      bg.on("pointerdown", () => this.clickSlot(i));
      bg.on("pointerover", () => { if (this.inv) this.inv.info.setText(this.describe(i)); });
      root.add([bg, icon, qty, star]);
      cells.push({ bg, icon, qty, star });
    }
    const info = this.add.text(W / 2, y0 + h - 44, "Hover over an item to see what it is.", { ...font, fontSize: "14px", align: "center", wordWrap: { width: w - 40 } }).setOrigin(0.5, 0);
    root.add(info);
    root.add(this.add.text(W / 2, y0 + h + 10, "I, Tab or Esc to close", { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    this.inv = { root, cells, info };
  }

  // ---------------------------------------------------------------- conversation
  talkPanel?: Phaser.GameObjects.Container;
  talkOpts: { label: string; fn: () => void }[] = [];

  /** A conversation card: who, how they feel about you, what they say, and what you can do. */
  showTalk(title: string, sub: string, text: string, opts: { label: string; fn: () => void }[], img?: string) {
    SOUND.sfx("talk");
    this.talkPanel?.destroy();
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.modal = true;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    opts = [...opts, { label: "Goodbye", fn: () => this.closeTalk() }];
    this.talkOpts = opts;
    // Size the card to its words: measure the text first, then lay out the options beneath it.
    const long = text.length > 500;
    const body = this.add.text(0, 0, text, { ...font, fontSize: long ? "13px" : "15px", wordWrap: { width: (long ? 760 : 680) - 40 }, lineSpacing: 2 });
    const w = long ? 760 : 680, h = Math.min(H - 20, 100 + body.height + 14 + opts.length * 24 + 10), x0 = (W - w) / 2, y0 = Math.max(10, Math.min(H - h - 90, (H - h) / 2 + 60));
    const root = this.add.container(0, 0).setDepth(24);
    this.talkPanel = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    let tx = x0 + 20;
    if (img) { root.add(this.add.rectangle(x0 + 16, y0 + 16, 56, 56, 0x3a2c22).setOrigin(0, 0)); root.add(this.add.image(x0 + 44, y0 + 44, "people", img).setScale(3)); tx = x0 + 86; }
    root.add(this.add.text(tx, y0 + 14, title, { ...font, fontSize: "20px" }));
    root.add(this.add.text(tx, y0 + 42, sub, { ...font, fontSize: "13px", color: "#fbe39a" }));
    body.setPosition(x0 + 20, y0 + 86); root.add(body);
    opts.forEach((o, i) => {
      const t = this.add.text(x0 + 24, y0 + h - 14 - (opts.length - i) * 24, `${i + 1}.  ${o.label}`, { ...font, fontSize: "15px" })
        .setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => o.fn());
      root.add(t);
    });
  }
  closeTalk() { if (!this.talkPanel) return; this.talkPanel.destroy(); this.talkPanel = undefined; this.talkOpts = []; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook || !!this.craft; }

  changeRel(id: string, d: number) { const r = G.npcRec(id); if (d < 0 && G.warded("Aphrodite")) return r.rel; r.rel = Math.max(REL_MIN, Math.min(REL_MAX, r.rel + d)); return r.rel; }

  talkTo(v: Villager, said?: string) {
    const rec = G.npcRec(v.id), today = G.dayNumber;
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    const line = said ?? `"${pick(v.lines[relTier(rec.rel)])}"`;
    const sub = `${v.household[0].toUpperCase() + v.household.slice(1)} · ${v.patron}'s household · ${relLabel(rec.rel)} (${rec.rel >= 0 ? "+" : ""}${rec.rel})`;
    const aph = G.boon("Aphrodite");
    const phoenix = (G.patron?.aretai === "Phoenix" ? 1 : 0) + (aph >= 2 ? 1 : aph <= -2 ? -1 : 0); // Aphrodite's hour and favor
    const welcome = (G.blessed("hospitality") ? 1 : 0) + (G.songOn("charm") ? 1 : 0); // and the nightingale's song
    const opts: { label: string; fn: () => void }[] = [];
    if (rec.talked !== today) opts.push({ label: "Chat a while", fn: () => {
      rec.talked = today; G.note(`chat:${v.id}`); const gain = Math.max(0, 1 + phoenix + welcome); const r = this.changeRel(v.id, gain);
      // A kledon: now and then a chance word turns out to be about tomorrow. Pneuma tells you it was meant for you.
      let kledon = "";
      if (G.data.nextWeather && Math.random() < 0.25) {
        const felt = 1 + Math.floor(Math.random() * 12) <= (G.data.aretai.Pneuma ?? 3) + 2;
        kledon = `\n\nAs you turn to go, ${v.name} says to no one in particular: ${KLEDON[G.data.nextWeather]}${felt ? " The words stay with you, as if meant for you: a kledon." : ""}`;
      }
      this.talkTo(v, `"${pick(v.lines[relTier(r)])}"${kledon}\n\n(${v.name} warms to you: +${gain}${phoenix > 0 ? ", Aphrodite smiles on it" : ""}${welcome ? ", the Hospitality Blessing" : ""}.)`);
    } });
    const held = G.selectedItem;
    if (held && ITEMS[held.id].kind !== "tool" && rec.gifted !== today) opts.push({ label: `Give ${v.name} your ${ITEMS[held.id].name.toLowerCase()}`, fn: () => {
      G.removeItem(held.id, 1); rec.gifted = today;
      const id = held.id, n = ITEMS[id].name.toLowerCase();
      let d = 1, say = `"Thank you. That's kind."`;
      if (v.loves.includes(id)) { d = 3; say = `"${n[0].toUpperCase() + n.slice(1)}! How did you know? Thank you, truly."`; }
      else if (v.likes.includes(id)) { d = 2; say = `"Oh, ${n}. I'll put this to good use."`; }
      else if (v.dislikes.includes(id)) { d = -2; say = `"...${n}. Well. Thank you, I suppose."`; }
      if (d > 0) d += phoenix + (G.songOn("charm") ? 1 : 0);
      this.changeRel(v.id, d);
      this.talkTo(v, `${say}\n\n(${d >= 0 ? `+${d}` : d} with ${v.name}.)`);
    } });
    const ts = G.data.tir;
    if (v.id === "myrrhine" && TIRESIAS[ts.step]?.title === "A greeting to the village" && ts.said === ts.step && this.tirGot("greet:myrrhine") < 1) opts.push({ label: "Give her Tiresias' greeting", fn: () => {
      G.note("greet:myrrhine"); this.changeRel(v.id, 1);
      this.talkTo(v, `"Tiresias? The Tiresias, the seer of Thebes? Under your olive tree?" She laughs, delighted. "He should be dead six times over. Tell him the priestess of the village greets him, and that the gods must be very fond of your farm."\n\n(+1 with ${v.name}. Go back and tell Tiresias.)`);
    } });
    const vs = VILLAGE_SONGS[v.id];
    if (vs && !G.data.songs.includes(vs.song)) opts.push({ label: "Ask if they know any songs", fn: () => {
      if (rec.rel < vs.rel) { this.talkTo(v, `"Songs? Maybe, once I know you better." (Friendship +${vs.rel} needed)`); return; }
      this.talkTo(v, `${vs.line}\n\n${this.learnSong(melody(vs.song))}`);
    } });
    this.requestOptions(v, opts);
    this.rumorOptions(v, opts);
    if (v.id === "theron") opts.push({ label: "Trade at the mill", fn: () => this.openMarket("mill") });
    if (v.id === "lykos") this.smithOptions(v, opts);
    if (v.id === "myrrhine" && !G.data.arts.includes("hospitality")) opts.push({ label: "Ask her to teach you an Art", fn: () => {
      if (rec.rel < ARTS.hospitality.teachAt) { this.talkTo(v, `"The Arts are not for strangers. Come to know me better first." (Friendship +${ARTS.hospitality.teachAt} needed)`); return; }
      G.data.arts.push("hospitality");
      this.talkTo(v, `"Then learn the Hospitality Blessing, Zeus's own. Perform it at your hearth: honey, milk, flowers, grapes and grain make it easier, and his hour and the full moon easier still. Done well, every guest and neighbor will feel welcome at your door."\n\n(You learn the Hospitality Blessing. Perform it at your hearth.)`);
    } });
    if (v.id === "myrrhine") opts.push({ label: "Ask about the gods", fn: () => {
      const p = G.patron;
      this.talkTo(v, `"${p ? `This is ${p.god}'s hour, the hour of ${p.aretai}. ${p.benefit}.` : "The night is not ours."} ${pick([
        "Each god gives most to those who work in step with them.",
        "The Twelve notice who honors them. So do the ones beneath the earth.",
        "Bring the first of anything to the altar, and you will not be forgotten.",
        "Pray at your household altar each day and the gods will know your face. To be known by name, bring offerings here, to the village altar."])}"`);
    } });
    if (v.id === "eudora") {
      opts.push({ label: "Any news?", fn: () => {
        const sp = G.data.anchors.spring ?? (() => { const r0 = rng(G.data.seed ^ 0x5eed5); const [ax, ay] = SPRING_SITES[Math.floor(r0() * SPRING_SITES.length)]; return (G.data.anchors.spring = `${ax},${ay}`); })();
        const [ax, ay] = sp.split(",").map(Number);
        const dir = `${ay < 0 ? "north" : ay > 0 ? "south" : ""}${ax > 0 ? (ay ? "-east" : "east") : ""}`;
        const spring = `"A herdsman told me there's a spring ${Math.abs(ax) + Math.abs(ay)} days' walk… well, ${Math.abs(ax) + Math.abs(ay)} stretches of country ${dir} of your place, with a nymph in it. Mind your manners there, and don't go charging up."`;
        this.talkTo(v, Math.random() < 0.4 ? spring : `"${pick(v.lines[rec.rel >= 4 ? "friend" : "new"])}"`);
      } });
      if (G.data.silver >= 30 && !G.count("Aulos")) opts.push({ label: "Buy the aulos a troupe of players left behind (1 gold, 10 silver)", fn: () => { G.data.silver -= 30; give("Aulos", 1); this.talkTo(v, `"Take it, and welcome. They never came back for it, and nobody here can play the thing without sounding like a goose."`); } });
      const st = G.data.stranger;
      if (st) opts.push({ label: "Ask about the stranger", fn: () => this.talkTo(v, `"That one? ${STRANGER_KINDS[st.kind].desc[0].toUpperCase() + STRANGER_KINDS[st.kind].desc.slice(1)}. Came in ${G.dayNumber - st.arrived === 0 ? "this morning" : `${G.dayNumber - st.arrived} day${G.dayNumber - st.arrived > 1 ? "s" : ""} ago`}. Keeps to the bench out front. Be kind; you never know."`) });
    }
    this.showTalk(v.name, sub, line, opts, v.id);
  }

  // ---------------------------------------------------------------- festivals
  festivalMenu(f: FestivalDef, said?: string) {
    const rec = festRec(f), held = G.selectedItem, opts: { label: string; fn: () => void }[] = [];
    if (!rec.rite) opts.push({ label: "Join the rite and the procession", fn: () => {
      rec.rite = 1; G.addFatigue(-10); const after = G.addFavor(f.god, 1, 6); G.note("festRite");
      this.festivalMenu(f, `${f.rite} You walk with the village, and sing, and the god is honored. (${f.god} ${after >= 0 ? "+" : ""}${after}; Fatigue −10.)`);
    } });
    const edible = held && (INGREDIENTS[held.id] || ITEMS[held.id].kind === "meal" || ["Flowers", "Wine", "Grapes"].includes(held.id));
    if (!rec.feast) opts.push({ label: edible ? `Bring your ${ITEMS[held!.id].name.toLowerCase()} to the feast` : `Bring something to the feast (best: ${f.feastWord})`, fn: () => {
      if (!edible) { this.festivalMenu(f, `Hold something to bring to the feast. Best of all would be ${f.feastWord}.`); return; }
      G.removeItem(held!.id, 1); rec.feast = 1; G.note("festFeast");
      const ideal = f.feast.includes(held!.id);
      for (const id of Object.keys(VILLAGERS)) this.changeRel(id, ideal ? 2 : 1);
      if (ideal) { G.earn("Kleos", 1, `your gift to the ${f.name} feast`); G.addFavor(f.god, 1, 10); }
      this.festivalMenu(f, ideal ? `"${ITEMS[held!.id].name}! Just what the ${f.name} wants." It goes to the head of the table, and everyone has some. (Everyone in the village +2; ${f.god} +1.)` : `It goes on the table with everything else, and is eaten. The village is glad of it. (Everyone in the village +1.)`);
    } });
    if (f.agon && !rec.agon) opts.push({ label: f.agon.kind === "race" ? `Run in ${f.agon.name} at the gymnasion track (prize: ${f.agon.prizeName})` : `Enter ${f.agon.name} (${f.agon.aretai}; prize: ${f.agon.prizeName})`, fn: () => {
      rec.agon = 1; this.closeTalk(); G.note("festAgon");
      if (f.agon!.kind === "race") { G.data.raceFor = f.id; const sc = this.playScene(); G.say("The runners go out to the stadion east of the village, and the crowd follows."); if (sc) { G.data.entry = "W"; G.data.scene = "Gym"; sc.goTo("Gym"); } return; }
      this.rhythm(`${f.name}: ${f.agon!.name}`, f.agon!.help, 6, (score) => this.agonResult(f, score));
    } });
    opts.push({ label: `Make an offering at the altar (counts double for ${f.god} today)`, fn: () => this.openAltar("shrine") });
    const done = [rec.rite && "walked in the rite", rec.feast && "given to the feast", rec.agon && (rec.place ? `placed ${["", "first", "second", "third", "last"][rec.place]} in the contest` : "entered the contest")].filter(Boolean).join(", ");
    this.showTalk(`The ${f.name}`, `${f.god}'s festival · ${G.dateLabel()}`, said ?? `${f.desc}${done ? `\n\nYou have ${done}.` : ""}`, opts);
  }
  /** The agon: your rhythm, your Aretai (twice), your hour, and for song your instrument and a song of the god, against three rivals. */
  agonResult(f: FestivalDef, score: number) {
    const a = f.agon!, rec = festRec(f), ar = G.data.aretai[a.aretai] ?? 3;
    let bonus = G.patron?.aretai === a.aretai ? 2 : 0;
    if (a.kind === "song") { const inst = curInstrument(); bonus += inst.power + (MELODIES.some((m) => m.god === f.god && G.data.songs.includes(m.id)) ? 2 : 0); }
    if (a.kind === "archery" && G.count("bow")) bonus += 1;
    const you = score + ar * 2 + bonus;
    const folk = villageHouseholds(G.data.seed).flatMap((h) => h.members).filter((m) => m.age === "adult").map((m) => m.name);
    const names = [...folk].sort(() => Math.random() - 0.5).slice(0, 3);
    const rivals = names.map((n) => ({ n, v: 6 + d12() + Math.floor(Math.random() * 6) }));
    const place = 1 + rivals.filter((r) => r.v > you).length;
    const table = [...rivals.map((r) => ({ n: r.n, v: r.v })), { n: "You", v: you }].sort((x, y) => y.v - x.v).map((r, i) => `${i + 1}. ${r.n} (${r.v})`).join("   ");
    this.awardAgon(f, place, `${a.name[0].toUpperCase() + a.name.slice(1)}: your timing ${score} of 18, ${a.aretai} ${ar} (×2)${bonus ? `, +${bonus}` : ""}: ${you}.\n\n${table}`);
  }
  /** Prizes for a festival agon, by place. */
  awardAgon(f: FestivalDef, place: number, summary: string) {
    const a = f.agon!, rec = festRec(f); rec.place = place;
    let prize = "";
    if (place === 1) {
      prize = `You win ${a.prizeName}! ${a.prize.map(([id, n]) => give(id, n)).join(", ")}.`;
      G.earn("Kleos", 2, `victory at the ${f.name}`); G.addFavor(f.god, 1, 10);
      for (const id of Object.keys(VILLAGERS)) this.changeRel(id, 1);
      SOUND.sfx("find");
    } else if (place === 2) { G.data.silver += 10; G.earn("Kleos", 1, `second at the ${f.name}`); prize = "Second place: 10 silver, and the crowd's cheers."; }
    else if (place === 3) { G.data.silver += 4; prize = "Third place: 4 silver."; }
    else prize = "Last. The crowd laughs, kindly enough, and someone hands you a cup of wine.";
    this.festivalMenu(f, `${summary}\n\n${prize}`);
  }

  // ---------------------------------------------------------------- fishing: bringing it in
  reelClosedAt = 0;
  reel?: { root: Phaser.GameObjects.Container; gfx: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; fish: FishDef; pos: number; dir: number; zone: number; width: number; hits: number; misses: number; done: (ok: boolean, perfect: boolean) => void; flash: number; flashOk: boolean };
  /** Bring a fish in: press Space (or click) as the mark crosses the green. Metis and Poseidon widen the green. */
  openReel(fish: FishDef, done: (ok: boolean, perfect: boolean) => void) {
    this.modal = true;
    const x0 = W / 2 - 240, y0 = H / 2 + 40;
    const root = this.add.container(0, 0).setDepth(25);
    root.add(this.add.rectangle(x0, y0, 480, 92, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    const text = this.add.text(W / 2, y0 + 8, "", { fontFamily: FONT, fontSize: "13px", color: "#f2e6c9", align: "center" }).setOrigin(0.5, 0);
    const gfx = this.add.graphics();
    root.add([gfx, text]);
    const width = Math.max(0.1, Math.min(0.36, 0.14 + 0.012 * (G.data.aretai.Metis ?? 3) + 0.015 * Math.max(0, G.boon("Poseidon")) - 0.012 * (fish.hits - 2)));
    this.reel = { root, gfx, text, fish, pos: 0, dir: 1, zone: 0.3 + Math.random() * 0.4, width, hits: 0, misses: 0, done, flash: 0, flashOk: false };
    const onKey = (e: KeyboardEvent) => { if (!this.reel) { this.input.keyboard!.off("keydown", onKey); return; } if (e.key === " " || e.key === "Enter") this.reelPress(); if (e.key === "Escape") this.closeReel(false); };
    this.input.keyboard!.on("keydown", onKey);
    root.add(this.add.rectangle(x0, y0, 480, 92, 0, 0).setOrigin(0, 0).setInteractive().on("pointerdown", () => this.reelPress()));
  }
  reelPress() {
    const r = this.reel; if (!r) return;
    const inZone = Math.abs(r.pos - r.zone) <= r.width / 2;
    r.flash = performance.now(); r.flashOk = inZone;
    if (inZone) { r.hits++; SOUND.sfx("chop"); r.zone = 0.12 + Math.random() * 0.76; }
    else { r.misses++; SOUND.sfx("hurt"); }
    if (r.hits >= r.fish.hits) this.closeReel(true);
    else if (r.misses >= r.fish.misses) this.closeReel(false);
  }
  closeReel(ok: boolean) {
    const r = this.reel; if (!r) return;
    r.root.destroy(); this.reel = undefined; this.reelClosedAt = performance.now();
    this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook || !!this.craft || !!this.talkPanel;
    r.done(ok, ok && r.misses === 0);
  }
  drawReel(dt: number) {
    const r = this.reel; if (!r) return;
    r.pos += r.dir * dt * 0.62 * r.fish.speed;
    if (r.pos > 1) { r.pos = 1; r.dir = -1; } if (r.pos < 0) { r.pos = 0; r.dir = 1; }
    const x0 = W / 2 - 200, y = H / 2 + 98, w = 400, g = r.gfx; g.clear();
    g.fillStyle(0x2a3a4a).fillRect(x0, y, w, 16);
    g.fillStyle(0x5aa04a).fillRect(x0 + w * (r.zone - r.width / 2), y, w * r.width, 16);
    const since = performance.now() - r.flash;
    if (since < 250) g.lineStyle(2, r.flashOk ? 0xf2e6c9 : 0xd8402a, 1 - since / 250).strokeRect(x0 - 2, y - 2, w + 4, 20);
    g.fillStyle(0xf2c14e).fillRect(x0 + w * r.pos - 2, y - 4, 4, 24);
    const known = (G.data.lore.tier[r.fish.id.toLowerCase()] ?? 0) >= 1;
    r.text.setText(`${known ? `A ${r.fish.name.toLowerCase()} is on the line!` : r.fish.hits >= 4 ? "Something heavy is on the line!" : "Something is on the line!"}  Press Space as the mark crosses the green.\nLanded: ${"●".repeat(r.hits)}${"○".repeat(r.fish.hits - r.hits)}    Slips: ${"✕".repeat(r.misses)}${"·".repeat(r.fish.misses - r.misses)}`);
  }

  // ---------------------------------------------------------------- music
  singPanel?: Phaser.GameObjects.Container; singGfx?: Phaser.GameObjects.Graphics; singText?: Phaser.GameObjects.Text; singCols?: Phaser.GameObjects.Text[]; singPend?: Phaser.GameObjects.Text; singKey = "";
  /** The scene you are playing in, for a song's effects. */
  play() { return this.scene.manager.getScenes(true).find((sc) => sc instanceof PlayScene) as PlayScene | undefined; }
  singStart() { if (SING.on) return; SING.on = true; SING.buf = []; SOUND.duck(true); }
  singStop() { if (!SING.on) return; SING.on = false; SOUND.duck(false); }
  singNote(n: number) {
    const inst = curInstrument(), now = performance.now();
    SOUND.note(stepFreq(SING.mode, n, inst.root), inst.sound, inst.sound === "lyre" ? 1.4 : 0.62);
    SING.lit[n] = now; this.play()?.noteFx(n);
    if (SING.buf.length && now - SING.buf[SING.buf.length - 1].t > 2500) SING.buf = []; // a pause ends the phrase
    SING.buf.push({ n, t: now, mode: SING.mode }); if (SING.buf.length > 12) SING.buf.shift();
    this.checkMelodies();
  }
  /** Did those notes make a melody? One you know works its magic; one you heard is learned; one you stumble on is yours. */
  checkMelodies() {
    const seq = SING.buf.map((b) => b.n), now = performance.now();
    const ends = (m: Melody) => m.mode === SING.mode && seq.length >= m.notes.length && m.notes.every((x, i) => seq[seq.length - m.notes.length + i] === x);
    const p = SING.pending;
    if (p && now < p.until) { const m = melody(p.id); if (ends(m)) { SING.pending = null; SING.buf = []; G.say(`You sing it back, note for note, and it is yours. ${this.learnSong(m)}`); return; } }
    for (const m of MELODIES) if (G.data.songs.includes(m.id) && ends(m)) { SING.buf = []; this.performSong(m); return; }
    for (const m of MELODIES) if (m.source === "taught" && !G.data.songs.includes(m.id) && ends(m)) { SING.buf = []; G.say(`You stumble onto an old tune by ear! ${this.learnSong(m)}`); return; }
    if (now - SING.hintAt > 20000) for (const m of MELODIES) {
      if (m.source !== "taught" || G.data.songs.includes(m.id) || m.mode !== SING.mode) continue;
      for (let k = Math.min(seq.length, m.notes.length - 1); k >= 3; k--) if (m.notes.slice(0, k).every((x, i) => seq[seq.length - k + i] === x)) { SING.hintAt = now; G.say("Something in the tune stirs, as if it wants to go somewhere you almost remember..."); return; }
    }
  }
  /** Learn a melody: say what it is, how it goes, and what it does. */
  learnSong(m: Melody): string {
    if (!G.data.songs.includes(m.id)) G.data.songs.push(m.id);
    SOUND.sfx("find"); G.note("learnSong");
    return `(You know ${songName(m)}: ${HARMONIAI[m.mode].name}, ${m.notes.join("-")}. ${m.desc} Hold V and play it.)`;
  }
  /** Perform a melody you know: an Art. A d12 against Ourania, helped by the instrument, the god's hour, the Muses and Apollo. */
  performSong(m: Melody) {
    const inst = curInstrument(), today = G.dayNumber;
    const verb = inst.id === "voice" ? "sing" : `play ${inst.name}:`;
    if (G.data.songUsed[m.id] === today) { G.say(`You ${verb} ${songName(m)}. Today it is only a tune: its power is spent until tomorrow.`); return; }
    const b = labor(EFFORT.hand, 1, "Ourania"); if (b === null) return;
    const skill = UIScene.songSkill(m, inst);
    const roll = d12();
    if (roll > skill) { G.say(`You ${verb} ${songName(m)}, but it doesn't quite come together (Ourania d12 ${roll}, needed 1–${skill}). Try again.${b}`); return; }
    const strong = roll <= Math.ceil(skill / 2);
    const out = this.play()?.songEffect(m.id, strong) ?? null;
    if (out === null) { G.say(`You ${verb} ${songName(m)}, sweetly, but there is nothing here for it to work on.${b}`); return; }
    G.data.songUsed[m.id] = today; G.note("song"); G.note(`song:${m.id}`);
    G.say(`You ${verb} ${songName(m)}${strong ? ", and it rings true" : ""} (d12 ${roll}, needed 1–${skill}). ${out}${b}`);
  }
  static songSkill(m: Melody, inst = curInstrument()) {
    return Math.max(1, (G.data.aretai.Ourania ?? 3) + inst.power + (inst.gods.includes(m.god) ? 1 : 0) + (G.patron?.god === m.god ? 2 : 0) + (G.songOn("muse") ? 2 : 0) + Math.max(0, G.boon("Apollo")) - m.hard);
  }
  /** While V is held: the harmonia, the eight steps, and the melodies you know. */
  drawSing() {
    if (!SING.on) { if (this.singPanel?.visible) this.singPanel.setVisible(false); return; }
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const x0 = W / 2 - 340, y0 = HOTBAR_Y - 196, w = 680, h = 186;
    if (!this.singPanel) {
      const bg = this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.98).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f);
      this.singGfx = this.add.graphics();
      this.singText = this.add.text(x0 + 14, y0 + 8, "", { ...font, fontSize: "13px", wordWrap: { width: w - 28 } });
      this.singCols = [0, 1].map((c) => this.add.text(x0 + 14 + c * 336, y0 + 82, "", { ...font, fontSize: "11.5px", lineSpacing: 3, wordWrap: { width: 328 } }));
      this.singPend = this.add.text(x0 + 360, y0 + 36, "", { ...font, fontSize: "12px", color: "#fbe39a", wordWrap: { width: w - 374 } });
      const nums = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => this.add.text(x0 + 14 + (n - 1) * 40 + 15, y0 + 46, String(n), { ...font, fontSize: "14px" }).setOrigin(0.5));
      this.singPanel = this.add.container(0, 0, [bg, this.singGfx, this.singText, ...this.singCols, this.singPend, ...nums]).setDepth(24);
    }
    this.singPanel.setVisible(true);
    const g = this.singGfx!; g.clear();
    const now = performance.now();
    for (let n = 1; n <= 8; n++) {
      const lit = Math.max(0, 1 - (now - (SING.lit[n] ?? 0)) / 600), bx = x0 + 14 + (n - 1) * 40, by = y0 + 32;
      g.fillStyle(0x3a2c22).fillRect(bx, by, 30, 28);
      if (lit > 0) g.fillStyle(0xf2c14e, lit).fillRect(bx, by, 30, 28);
      g.lineStyle(1, 0x8a6a4a).strokeRect(bx, by, 30, 28);
    }
    const inst = curInstrument(), hm = HARMONIAI[SING.mode], p = SING.pending && now < SING.pending.until ? SING.pending : null;
    const mine = MELODIES.filter((m) => G.data.songs.includes(m.id));
    const key = `${SING.mode}|${inst.id}|${mine.length}|${p ? p.id + Math.ceil((p.until - now) / 5000) : ""}|${G.dayNumber}`;
    if (key === this.singKey) return;
    this.singKey = key;
    const head = `♪ ${inst.id === "voice" ? "Humming" : `Playing ${inst.name}`} in the ${hm.name} harmonia (${hm.ethos}). Wheel: change harmonia.`;
    const songLine = (m: Melody) => `${m.mode === SING.mode ? "▸ " : "    "}${m.name} · ${HARMONIAI[m.mode].name} ${m.notes.join("-")}${G.data.songUsed[m.id] === G.dayNumber ? " · spent today" : ` · d12 ≤ ${UIScene.songSkill(m, inst)}`}`;
    this.singText!.setText(head);
    this.singPend!.setText(p ? `Sing it back before it fades (${Math.ceil((p.until - now) / 1000)}s):\n${melody(p.id).name}, ${HARMONIAI[melody(p.id).mode].name} ${melody(p.id).notes.join("-")}` : "▸ marks melodies in this harmonia.\nd12 ≤ n: your chance to work its magic.");
    const lines = mine.length ? mine.map(songLine) : ["You know no melodies yet. People teach them;", "nymphs and birds sing them, if you listen."];
    const half = Math.ceil(lines.length / 2);
    this.singCols![0].setText(lines.slice(0, Math.max(half, mine.length ? 6 : 2)).join("\n"));
    this.singCols![1].setText(lines.slice(Math.max(half, mine.length ? 6 : 2)).join("\n"));
  }

  // ---------------------------------------------------------------- Tiresias
  /** How often a thing has happened since he asked for it. */
  tirGot(ev: string) { const t = G.data.tir; return (t.ev[ev] ?? 0) - (t.base[ev] ?? 0); }
  tirCtx() { return { got: (ev: string) => this.tirGot(ev), G }; }
  /** Is what he asked for done? */
  tirReady() { const t = G.data.tir, st = TIRESIAS[t.step]; return !!st && t.said === t.step && st.check(this.tirCtx())[0]; }
  /** Will he ask for the next thing yet? The first few come at once; after that, one a day. */
  tirCanAsk() { const t = G.data.tir; return !!TIRESIAS[t.step] && t.said !== t.step && (t.step < 3 || t.doneDay < G.dayNumber); }
  /** Fix the place he sends you to, and say where it is from your farm. */
  tirWhere(kind: "tirShrine" | "tirGrave" | "cave"): string {
    const a = G.data.anchors;
    if (kind === "cave") {
      if (a.cave) { const [x, y] = a.cave.split(",").map(Number); return directions(x, y); }
      return "three stretches of country out from your farm, or two if you go into the copper hills";
    }
    if (!a[kind]) {
      const [lo, hi] = kind === "tirShrine" ? [2, 3] : [3, 4], r = rng((G.data.seed ^ (kind === "tirShrine" ? 0x5417e : 0x6a7e)) >>> 0), cands: string[] = [];
      for (let y = -hi; y <= hi; y++) for (let x = -hi; x <= hi; x++) {
        const d = Math.abs(x) + Math.abs(y), k = `${x},${y}`;
        if (d < lo || d > hi || x === 0 || G.data.screens[k] || fortressAt(G.data.seed, x, y) || k === a.cave || k === a.spring || k === a.satyrs || k === a.tirShrine || k === a.tirGrave) continue;
        cands.push(k);
      }
      a[kind] = cands.length ? cands[Math.floor(r() * cands.length)] : kind === "tirShrine" ? "3,0" : "4,0";
    }
    const [x, y] = a[kind]!.split(",").map(Number);
    return directions(x, y);
  }
  talkTiresias(said?: string) {
    const t = G.data.tir, today = G.dayNumber, step = TIRESIAS[t.step];
    const opts: { label: string; fn: () => void }[] = [];
    if (!t.met) {
      opts.push({ label: "Welcome him as your guest", fn: () => {
        t.met = true; G.addFavor("Zeus", 1);
        this.tirAsk(`"Zeus sees it, and so do I, in my way. Thank you." He settles his staff across his knees with a sigh. "You'll find me about the place. I don't go far, and I don't go fast."\n\n(Zeus, who keeps the law of guests: favor +1.)`);
      } });
      this.showTalk("An old man", "a stranger, blind, with a staff of cornel wood", said ?? `An old man sits on your land as if he has always been there. His eyes are milk-white, and he turns his face toward you before you make a sound.\n\n"Don't be alarmed. I am Tiresias, of Thebes, and I am older than anyone you will ever meet. I have walked a long way looking for somewhere quiet to sit. Zeus protects strangers. Will you let an old man stay a while?"`, opts, "tiresias");
      return;
    }
    const N = TIRESIAS.length;
    const sub = `Tiresias of Thebes · seer · ${step ? `${t.step} of ${N} tasks done` : "the round of the world is walked"}`;
    if (step && t.said === t.step) {
      const [done, prog] = step.check(this.tirCtx());
      if (done) opts.push({ label: step.give ?? `Tell him: ${step.title.toLowerCase()}, done`, fn: () => {
        step.take?.(G);
        const got = step.reward(G);
        t.step++; t.doneDay = today; t.base = {};
        SOUND.sfx("find");
        const next = TIRESIAS[t.step] ? (this.tirCanAsk() ? "" : "\n\nHe settles back against the warm stone. \"Enough for one day. Come and see me tomorrow.\"") : "";
        this.talkTiresias(`${step.thanks}\n\n(${got}.)${next}`);
      } });
      else opts.push({ label: `About what you asked: ${step.title.toLowerCase()}`, fn: () => this.talkTiresias(`${step.ask.replace("{where}", step.anchor ? this.tirWhere(step.anchor) : "")}\n\n(${step.how} So far: ${prog}.)`) });
    } else if (step && this.tirCanAsk()) opts.push({ label: "Ask if there's anything he needs", fn: () => this.tirAsk() });
    if (!G.data.songs.includes("augury")) opts.push({ label: "Ask him to teach you a song", fn: () => {
      this.talkTiresias(`"A song? I have only one worth the name. When Athena took my eyes she cleaned my ears, and I have understood the birds ever since. This is how they call each other to speak. Hum it after me." He whistles, thin and old and surprisingly true.\n\n${this.learnSong(melody("augury"))}`);
    } });
    if (t.ev.satDay !== today) opts.push({ label: "Sit with him a while", fn: () => {
      t.ev.satDay = today; G.addFatigue(-6);
      const says = [
        "\"The gods hide a man's living from him, Hesiod says. Otherwise you'd do a year's work in a day and sit idle the rest.\"",
        "\"I was a woman for seven years. Hera asked me once who has the better of love, men or women. I told her the truth, and she blinded me for it. That's one story. Athena tells another.\"",
        "\"Seven lifetimes. You'd think a man would get wiser. Mostly he gets slower.\"",
        "\"The crane's cry from the clouds means it's time to plough. When the snail climbs the stalk, stop digging the vines and sharpen your sickles.\"",
        "\"Don't cross a river without washing your hands and praying first. Rivers are gods too.\"",
        "\"Never piss facing the sun. I'm serious. Hesiod is very clear on this.\"",
        "\"Thebes had seven gates. I outlived the men who built every one.\"",
        "\"The best treasure a man has is a sparing tongue.\"",
        "\"When the Pleiades rise, reap. When they set, plough.\"",
      ];
      this.talkTiresias(`You sit with him a while in the sun. Neither of you says much. Then:\n\n${says[(today + t.step) % says.length]}\n\n(You rest: Fatigue −6.)`);
    } });
    if (!step && t.ev.counsel !== today) opts.push({ label: "Ask what tomorrow brings", fn: () => {
      t.ev.counsel = today;
      this.talkTiresias(`He tilts his head as if listening to birds you can't hear. "${TIR_WEATHER[G.data.nextWeather ?? "clear"]}"`);
    } });
    const line = said ?? (!step ? `"${TIR_CALLS.done[today % TIR_CALLS.done.length]}" He turns his blind face to the sun.`
      : t.said === t.step ? `"Well? Have you done what I asked?"` : this.tirCanAsk() ? `"Ah, you. Sit, sit. I've been thinking of something you could do for an old man."` : `He's dozing in the sun. "Mm? Tomorrow, child. Come tomorrow."`);
    this.showTalk("Tiresias", sub, line, opts, "tiresias");
  }
  /** He asks for the next thing on his list. */
  tirAsk(pre = "") {
    const t = G.data.tir, step = TIRESIAS[t.step];
    if (!step) { this.talkTiresias(pre); return; }
    t.said = t.step; t.base = { ...t.ev };
    const ask = step.ask.replace("{where}", step.anchor ? this.tirWhere(step.anchor) : "");
    this.talkTiresias(`${pre ? pre + "\n\n" : ""}${step.title.toUpperCase()}\n${ask}\n\n(${step.how})`);
  }

  // ---------------------------------------------------------------- requests and rumors
  /** How many of a thing you carry at or above a quality. */
  static countQ(id: string, minQ = 1) { return G.data.slots.reduce((n, s) => n + (s && s.id === id && (s.q ?? 1) >= minQ ? s.qty : 0), 0); }
  /** Take n of a thing at or above a quality, the plainest first (so your best stays with you). */
  static takeQ(id: string, n: number, minQ = 1) {
    const slots = G.data.slots.map((s, i) => [s, i] as const).filter(([s]) => s && s.id === id && (s.q ?? 1) >= minQ).sort((a, b) => (a[0]!.q ?? 1) - (b[0]!.q ?? 1));
    for (const [s, i] of slots) { const k = Math.min(n, s!.qty); s!.qty -= k; n -= k; if (!s!.qty) G.data.slots[i] = null; if (!n) break; }
  }
  static reqText(q: Request) {
    const who = VILLAGERS[q.from].name, left = q.due - G.dayNumber;
    const when = left <= 0 ? "by tonight" : `within ${left + 1} days`;
    if (q.kind === "deliver") return `${who}: carry the parcel to ${VILLAGERS[q.to!].name} ${when}. (${money(q.silver)})`;
    const have = UIScene.countQ(q.item, q.minQ ?? 1);
    return `${who}: ${q.qty} ${q.minQ ? QUALITY[q.minQ] + " " : ""}${ITEMS[q.item].name.toLowerCase()} ${when}. You have ${have}. (${money(q.silver)})`;
  }

  requestOptions(v: Villager, opts: { label: string; fn: () => void }[]) {
    const today = G.dayNumber;
    for (const q of G.data.requests.filter((r) => r.kind === "deliver" && r.to === v.id)) if (G.count("Parcel") > 0) opts.push({ label: `Hand over the parcel from ${VILLAGERS[q.from].name}`, fn: () => {
      G.removeItem("Parcel", 1); G.data.requests.splice(G.data.requests.indexOf(q), 1); G.note("request");
      G.data.silver += q.silver; this.changeRel(v.id, 1); this.changeRel(q.from, 2);
      this.talkTo(v, `"For me? From ${VILLAGERS[q.from].name}? Thank you. ${VILLAGERS[q.from].name} left this for your trouble."\n\n(+${money(q.silver)}; +2 with ${VILLAGERS[q.from].name}, +1 with ${v.name}.)`);
    } });
    const mine = G.data.requests.find((r) => r.from === v.id);
    if (mine && mine.kind === "bring" && UIScene.countQ(mine.item, mine.minQ ?? 1) >= mine.qty) opts.push({ label: `Give ${v.name} the ${mine.qty} ${ITEMS[mine.item].name.toLowerCase()} asked for`, fn: () => {
      UIScene.takeQ(mine.item, mine.qty, mine.minQ ?? 1);
      G.data.requests.splice(G.data.requests.indexOf(mine), 1); G.note("request");
      G.data.silver += mine.silver; const early = mine.due - today >= 2 ? 1 : 0; this.changeRel(v.id, 2 + early);
      SOUND.sfx("find");
      this.talkTo(v, `"You came through. Here, as promised."\n\n(+${money(mine.silver)}; +${2 + early} with ${v.name}${early ? ", for being quick about it" : ""}.)`);
    } });
    else if (mine) opts.push({ label: "About what you asked of me…", fn: () => {
      const left = mine.due - today + 1, have = UIScene.countQ(mine.item, mine.minQ ?? 1);
      this.talkTo(v, mine.kind === "deliver" ? `"Has my parcel reached ${VILLAGERS[mine.to!].name} yet? ${left > 1 ? "There's still time." : "Today, if you can."}"`
        : `"I'm still hoping for those ${mine.qty} ${mine.minQ ? QUALITY[mine.minQ] + " " : ""}${ITEMS[mine.item].name.toLowerCase()}. You have ${have} so far. ${left > 1 ? `I can wait ${left} more days.` : "I need them by tonight."}"`);
    } });
    if (!mine && G.data.askedReq[v.id] !== today) opts.push({ label: "Ask if they need anything", fn: () => this.offerRequest(v) });
  }

  offerRequest(v: Villager) {
    const today = G.dayNumber; G.data.askedReq[v.id] = today;
    const sub = `${v.household[0].toUpperCase() + v.household.slice(1)} · a request`;
    if (Math.random() < 0.25) { this.talkTo(v, `"Not today, thank you. Ask me again another day."`); return; }
    const parcels = PARCELS.filter((p) => p.from === v.id && !G.data.requests.some((r) => r.kind === "deliver"));
    let q: Request, line: string;
    if (parcels.length && Math.random() < 0.3) {
      const p = parcels[Math.floor(Math.random() * parcels.length)];
      q = { id: ++G.data.reqSeq, from: v.id, kind: "deliver", item: "Parcel", qty: 1, to: p.to, why: p.what, silver: 12 + Math.floor(Math.random() * 8), posted: today, due: today + 2 };
      line = `"Could you take ${p.what} to ${VILLAGERS[p.to].name}? I can't leave the ${v.id === "theron" ? "mill" : v.id === "lykos" ? "forge" : v.id === "myrrhine" ? "altar" : "inn"}. ${VILLAGERS[p.to].name} will see you right."`;
    } else {
      const w = WANTS[v.id][Math.floor(Math.random() * WANTS[v.id].length)];
      const qty = w.qty[0] + Math.floor(Math.random() * (w.qty[1] - w.qty[0] + 1));
      q = { id: ++G.data.reqSeq, from: v.id, kind: "bring", item: w.item, qty, minQ: w.minQ, why: w.why, silver: requestPay(w.item, qty, w.minQ), posted: today, due: today + 3 + Math.floor(Math.random() * 4) + (w.minQ ? 2 : 0) };
      line = `"${w.why} Could you bring me ${qty} ${w.minQ ? QUALITY[w.minQ] + " " : ""}${ITEMS[w.item].name.toLowerCase()}, within ${q.due - today + 1} days? I'd pay ${money(q.silver)}."`;
    }
    this.showTalk(v.name, sub, line, [
      { label: "I'll do it", fn: () => {
        if (q.kind === "deliver" && G.addItem("Parcel", 1) > 0) { this.talkTo(v, `"Your pack's too full to take it. Make room and ask me again."`); G.data.askedReq[v.id] = -1; return; }
        G.data.requests.push(q);
        this.talkTo(v, `"Thank you. I knew I could ask you."\n\n(Your journal, J, keeps track of what you've promised.)`);
      } },
      { label: "Not this time", fn: () => this.talkTo(v, `"No matter. Another time."`) },
    ], v.id);
  }

  rumorOptions(v: Villager, opts: { label: string; fn: () => void }[]) {
    const today = G.dayNumber;
    const open = G.data.rumors.find((r) => r.from === v.id && !r.told);
    if (open?.found) opts.push({ label: `Tell ${v.name} about the ${terrain(open.terrain).name.toLowerCase()}`, fn: () => {
      open.told = true; this.changeRel(v.id, 2);
      const id = `t${open.terrain}`; if (LORE[id] && G.lore(id) < 1) G.data.lore.tier[id] = 1;
      this.talkTo(v, `"You went? And it was true? Tell me everything." ${v.name} listens to every word, and adds a few things of their own about such places.\n\n(+2 with ${v.name}.)`);
    } });
    else if (open) opts.push({ label: "Where was that place again?", fn: () => { const [x, y] = open.key.split(",").map(Number); this.talkTo(v, `"${RUMOR_WORDS[open.terrain][0].toUpperCase() + RUMOR_WORDS[open.terrain].slice(1)}, ${directions(x, y)}. Count the stretches of country as you go."`); } });
    else if (G.data.askedRumor[v.id] !== today) opts.push({ label: "Heard any rumors?", fn: () => {
      G.data.askedRumor[v.id] = today;
      const r = UIScene.makeRumor(v.id);
      const src: Record<string, string> = { theron: "A carter on the mill road told me of", lykos: "An ore trader swore to me there's", myrrhine: "Pilgrims at the altar speak of", eudora: "A traveler at my table last night told of" };
      if (!r) { this.talkTo(v, `"Nothing you haven't seen for yourself, by the sound of it. You get about more than I do."`); return; }
      const [x, y] = r.key.split(",").map(Number);
      this.talkTo(v, `"${src[v.id]} ${RUMOR_WORDS[r.terrain]}, ${directions(x, y)}. I've never been. Maybe you will."\n\n(Your journal, J, notes the way.)`);
    } });
  }

  /** A place a villager has heard of: an unexplored stretch two to six screens out, of a land their trade brings news of. */
  static makeRumor(vid: string, terrains?: number[]): Rumor | null {
    const cands: [string, number][] = [];
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) {
      const d = Math.abs(x) + Math.abs(y), key = `${x},${y}`;
      if (d < 2 || d > 6 || (x === 0 && (y === 0 || y === 1)) || G.data.screens[key] || fortressAt(G.data.seed, x, y) || G.data.rumors.some((r) => r.key === key)) continue;
      cands.push([key, 1 / d]);
    }
    if (!cands.length) return null;
    let k = Math.random() * cands.reduce((n, [, w]) => n + w, 0), key = cands[0][0];
    for (const [c, w] of cands) { if ((k -= w) <= 0) { key = c; break; } }
    const ts = terrains ?? RUMOR_TERRAINS[vid];
    const r: Rumor = { key, terrain: ts[Math.floor(Math.random() * ts.length)], from: vid, day: G.dayNumber };
    G.data.rumors.push(r);
    return r;
  }

  // ---------------------------------------------------------------- testing: jump through the year
  devPanel?: Phaser.GameObjects.Container;
  closeDev() { this.devPanel?.destroy(); this.devPanel = undefined; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook || !!this.craft || !!this.chestPanel; }
  /** The active play scene, if any. */
  playScene() { return this.scene.manager.getScenes(true).find((s) => s instanceof PlayScene) as PlayScene | undefined; }
  /**
   * A tool for testing (the ` key): jump to the start of any month (always forward, into next year if need be),
   * see which of Hesiod's signs fall in it, and call up this month's sign at once.
   */
  openDev() {
    if (this.market || this.dialog || this.loreBook || this.craft || this.chestPanel) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.modal = true;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 640, h = 470, x0 = (W - w) / 2, y0 = (H - h) / 2;
    const root = this.add.container(0, 0).setDepth(30); this.devPanel = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x14100c, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0x6a8fb0));
    root.add(this.add.text(W / 2, y0 + 10, "Testing · jump through the year", { ...font, fontSize: "18px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 36, `Now: ${G.dateLabel()}. Jumps go forward to the 1st of the month, at dawn; crops and requests count the days skipped.`, { ...font, fontSize: "12px", color: "#9fb4c8", wordWrap: { width: w - 40 }, align: "center" }).setOrigin(0.5, 0));
    const signsIn = (m: number) => Object.values(SIGN_TABLE).filter((s) => s.months.includes(m)).map((s) => s.id);
    MONTHS.forEach((mo, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = x0 + 24 + col * 300, y = y0 + 76 + row * 46;
      const cur = i === G.data.month;
      const t = this.add.text(x, y, `${mo.name} · ${mo.season}`, { ...font, fontSize: "15px", color: cur ? "#f2c14e" : "#f2e6c9" });
      const sg = signsIn(i);
      root.add([t, this.add.text(x, y + 19, sg.length ? `signs: ${sg.join(", ")}` : "no signs", { ...font, fontSize: "11px", color: "#9fb4c8" })]);
      t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#9fd0ff")).on("pointerout", () => t.setColor(cur ? "#f2c14e" : "#f2e6c9")).on("pointerdown", () => this.jumpTo(i));
    });
    const btn = (label: string, x: number, fn: () => void) => {
      const t = this.add.text(x, y0 + h - 64, label, { ...font, fontSize: "14px", backgroundColor: "#2a3a4a", padding: { x: 8, y: 4 } as Phaser.Types.GameObjects.Text.TextPadding });
      t.setInteractive({ useHandCursor: true }).on("pointerdown", fn); root.add(t);
    };
    btn("+1 day", x0 + 24, () => this.jumpDays(1));
    btn("+7 days", x0 + 104, () => this.jumpDays(7));
    btn("Show this month's sign now", x0 + 194, () => {
      const ps = this.playScene();
      const s = Object.values(SIGN_TABLE).find((x) => x.months.includes(G.data.month));
      if (!ps || !s) { G.say(s ? "Step outside first." : "No sign falls in this month."); return; }
      delete G.data.signs[s.id]; this.closeDev(); ps.showSign(s);
    });
    btn("Forget this year's signs", x0 + 430, () => { G.data.signs = {}; G.say("This year's signs can be seen again."); });
    root.add(this.add.text(W / 2, y0 + h - 26, "` or Esc to close", { ...font, fontSize: "12px", color: "#9fb4c8" }).setOrigin(0.5, 0));
  }
  /** Go forward to the 1st of month m (next year if it's not ahead of us), at dawn, and redraw the world. */
  jumpTo(m: number) {
    if (m <= G.data.month) G.data.year += 1;
    G.data.month = m; G.data.day = 1;
    this.afterJump();
  }
  jumpDays(n: number) {
    for (let i = 0; i < n; i++) {
      G.data.day += 1;
      if (G.data.day > MONTHS[G.data.month].days) { G.data.day = 1; G.data.month += 1; if (G.data.month >= MONTHS.length) { G.data.month = 0; G.data.year += 1; } }
    }
    this.afterJump();
  }
  afterJump() {
    G.data.clock = 0.6;
    G.data.weather = G.data.nextWeather = rollWeather(G.month.season, 1 + Math.floor(Math.random() * 12));
    this.closeDev();
    const ps = this.playScene();
    G.save();
    G.say(`Testing: it is now ${G.dateLabel()}.`);
    if (ps) { G.data.entry = ""; ps.scene.restart(); }
  }

  // ---------------------------------------------------------------- the gods' servants
  /** What applies with a god right now: the tier, its words, and what each step brings. */
  static standing(god: string): string {
    const f = G.favor(god), t = tierOf(f), d = DIVINE[god];
    const lines = [`${god}: ${f >= 0 ? "+" : ""}${f}, ${TIER_WORDS[t]}.`];
    if (t === 0) lines.push(`${god} does not know you yet.`);
    if (t >= 1) lines.push(`Noticed: ${d.passive}`);
    if (t >= 4) lines.push(`Known: gifts are left for you in ${d.domain}.`);
    if (t >= 8) lines.push(`Approval: you may call on ${d.power.name.toLowerCase()} there. ${d.power.desc}`);
    if (t >= 10) lines.push(`Chosen: your ${d.aretai} is one higher while it lasts.`);
    if (t >= 12) lines.push(`Protection: ${d.ward}`);
    if (t <= -1) lines.push(`Displeased: ${d.passive.replace(/\(or ([^)]*)\)/g, "($1)")} works against you.`);
    if (t <= -4) lines.push(`Disapproval: troubles wait for you in ${d.domain}: ${d.trouble.toLowerCase()}`);
    if (t <= -8) lines.push(`Anger: ${d.wrath}`);
    if (t <= -10) lines.push(`Accursed: your ${d.aretai} is one lower until you make amends.`);
    if (t <= -12) lines.push(`Doom: ${d.danger}`);
    if (f !== 0) lines.push(`Left alone, it will drift back toward nothing.`);
    return lines.join("\n");
  }
  /** Speak with a priest, priestess or keeper of a god (or stand at the god's altar). */
  priestCtx: [string, string, string, boolean, number] = ["", "", "", false, 9];
  priestTalk(god: string, name: string, role: string, atAltar = false, cap = 9) {
    this.priestCtx = [god, name, role, atAltar, cap];
    if (name && /^(priest|priestess) of/.test(role)) G.note("shrineKeeper");
    const d = DIVINE[god], dv = G.data.divine, held = G.selectedItem?.id;
    const who = name ? `${name}, ${role}` : role[0].toUpperCase() + role.slice(1);
    const chthonic = CHTHONIC.includes(god);
    const opts: { label: string; fn: () => void }[] = [];
    if (name) {
      opts.push({ label: `What pleases ${god}?`, fn: () => this.priestTalk2(god, who, `"${d.pleases}"`) });
      opts.push({ label: `What angers ${god}?`, fn: () => this.priestTalk2(god, who, `"${d.angers}"`) });
      opts.push({ label: `How do I stand with ${god}?`, fn: () => this.priestTalk2(god, who, UIScene.standing(god)) });
      const q = dv.quests[god];
      if (q && UIScene.countQ(q.item) >= q.qty) opts.push({ label: `Give the ${q.qty} ${ITEMS[q.item].name.toLowerCase()} for ${god}`, fn: () => {
        UIScene.takeQ(q.item, q.qty); dv.quests[god] = undefined;
        const after = G.addFavor(god, 2, 10); G.data.currencies.Kleos += 1;
        this.priestTalk2(god, who, `"${god} will know of this." The gifts are laid before the god with the proper words.\n\n(${god} ${after >= 0 ? "+" : ""}${after}, +1 Kleos)`);
      } });
      else if (q) opts.push({ label: `About what ${god} asked…`, fn: () => this.priestTalk2(god, who, `"${god} asks for ${q.qty} ${ITEMS[q.item].name.toLowerCase()}. You have ${UIScene.countQ(q.item)}. Bring them to any shrine of ${god}."`) });
      else opts.push({ label: `What would ${god} have of me?`, fn: () => {
        const [item, qty] = d.wants[Math.floor(Math.random() * d.wants.length)];
        dv.quests[god] = { item, qty, posted: G.dayNumber };
        this.priestTalk2(god, who, `"Bring ${qty} ${ITEMS[item].name.toLowerCase()} for ${god}, to this shrine or any of the god's. It would be well received."\n\n(Your journal, J, keeps it. Reward: favor +2, up to +10, and Kleos.)`);
      } });
    }
    if (name && god === "Hades" && !G.data.songs.includes("lament")) opts.push({ label: "Ask for the song of mourning", fn: () => this.priestTalk2(god, who, `"The lament. We sing it for the ones no one else sings for." The keeper sings it low, falling, note by note, to the ground.\n\n${this.learnSong(melody("lament"))}`) });
    if (held && ITEMS[held]?.kind !== "tool") opts.push({ label: `Offer the ${ITEMS[held].name.toLowerCase()} to ${god}`, fn: () => {
      if (chthonic && G.isDay) { this.priestTalk2(god, who, `"Not by daylight. The ones below take their offerings in the dark."`); return; }
      if (G.data.offered[god] === G.dayNumber) { this.priestTalk2(god, who, `${god} has had your offering today.`); return; }
      if (G.favor(god) >= cap) { this.priestTalk2(god, who, `${name ? `"${god} knows you well.` : `${god} knows you well here.`} Greater favor comes from deeds, and from what ${god} asks of you${name ? '."' : "."}`); return; }
      const slot = G.data.slots.find((s) => s && s.id === held && s.q === 3) ?? G.data.slots.find((s) => s && s.id === held);
      const fine = slot?.q === 3, liked = (OFFER_PATRON[held] ?? "") === god || d.wants.some(([i]) => i === held);
      G.removeItem(held, 1); G.data.offered[god] = G.dayNumber; G.note("offer"); if (role.includes("grave")) G.note("graveOffer");
      const after = G.addFavor(god, (fine ? 2 : 1) + (liked ? 1 : 0), cap);
      this.priestTalk2(god, who, `The ${ITEMS[held].name.toLowerCase()} is given to ${god}${liked ? ", and it is the kind of thing the god loves" : ""}. (favor ${after >= 0 ? "+" : ""}${after}; offerings here raise favor as far as +${cap})`);
    } });
    const line = name ? (chthonic ? `"Speak softly here. What do you need of the ${god === "Hades" ? "lord below" : "goddess of the crossroads"}?"` : `"Be welcome at ${god}'s shrine. What do you seek?"`)
      : atAltar ? `${chthonic ? "The graves are quiet." : `${god}'s altar, its fire tended.`} ${held ? "" : "Hold something to offer it."}` : "";
    this.showTalk(who, d.domain, line, opts);
  }
  priestTalk2(god: string, who: string, text: string) {
    this.showTalk(who, DIVINE[god].domain, text, [{ label: "Back", fn: () => this.priestTalk(...this.priestCtx) }]);
  }

  // ---------------------------------------------------------------- pause: save, quit
  openPause() {
    const ps = this.playScene(); if (!ps) return;
    this.showTalk("Paused", G.dateLabel(), "Your life is saved each dawn. You can also save now and leave, and pick up exactly here.", [
      { label: "Save and quit to the title", fn: () => this.quitToTitle(true) },
      { label: "Quit without saving (back to the last save)", fn: () => this.choose("Quit without saving? Anything since your last save will be lost.", () => this.quitToTitle(false)) },
    ]);
  }
  quitToTitle(save: boolean) {
    const ps = this.playScene();
    this.closeTalk();
    if (save && ps) {
      G.data.scene = ps.scene.key as SaveData["scene"]; G.data.px = ps.player.x; G.data.py = ps.player.y; G.data.entry = "";
      if (!G.save()) { G.say("This browser would not let the game save."); return; }
    }
    this.modal = false;
    for (const s of this.scene.manager.getScenes(true)) if (s !== this) s.scene.stop();
    this.scene.start("Title");
  }

  openJournal() {
    const reqs = G.data.requests.map((q) => `• ${UIScene.reqText(q)}`);
    const rum = G.data.rumors.filter((r) => !r.told).map((r) => {
      const [x, y] = r.key.split(",").map(Number);
      if (!VILLAGERS[r.from]) return `• Heard on the road: ${RUMOR_WORDS[r.terrain].split(",")[0]}, ${directions(x, y)}.`;
      return `• ${VILLAGERS[r.from].name}: ${r.found ? `you found the ${terrain(r.terrain).name.toLowerCase()}; tell ${VILLAGERS[r.from].name}` : `${RUMOR_WORDS[r.terrain].split(",")[0]}, ${directions(x, y)}`}.`;
    });
    const gq = Object.entries(G.data.divine.quests).filter(([, q]) => q).map(([g, q]) => `• ${g}: ${q!.qty} ${ITEMS[q!.item].name.toLowerCase()}, to any shrine of ${g}. You have ${UIScene.countQ(q!.item)}.`);
    reqs.push(...gq);
    const ts = G.data.tir, st = TIRESIAS[ts.step];
    if (st && ts.said === ts.step) reqs.unshift(`• Tiresias: ${st.title.toLowerCase()}. ${st.check(this.tirCtx())[0] ? "Done: go and tell him." : `${st.check(this.tirCtx())[1]}.`} ${st.how}`);
    const fests = festUpcoming(3).map(({ f, d }) => `• ${f.name} (${f.god}): ${d === 0 ? "today!" : d === 1 ? "tomorrow" : `in ${d} days`}, ${f.day} ${MONTHS[f.month].name}. ${f.feastWord[0].toUpperCase() + f.feastWord.slice(1)} for the feast${f.agon ? `; ${f.agon.name}` : ""}.`);
    const places = Object.values(G.data.sites).map((p) => {
      const mx = p.x0 + Math.floor(p.w / 2), my = p.y0 + Math.floor(p.h / 2);
      const state = p.isle === "crete" ? `Minos' island; ${G.data.anchors.knossosAt && G.data.screens[G.data.anchors.knossosAt]?.site && p.marks?.palace ? `Knossos stands on it, ${directions(...(G.data.anchors.knossosAt.split(",").map(Number) as [number, number]))}; ` : "Knossos is somewhere on it; "}${p.minotaur === "slain" ? "the Minotaur is dead" : "the Minotaur waits in the Labyrinth"}` : p.kind === "delphi" ? "the oracle of Apollo" : p.kind === "knossos" ? (p.minotaur === "slain" ? "Minos' palace; the Minotaur is dead" : "Minos' palace; the Minotaur waits in the Labyrinth") : p.kind === "isle" ? ISLES[p.isle!].line.split(".")[0].replace(/^A |^An /, "a ").toLowerCase()
        : p.fate === "brigands" ? (p.cleared ? "brigands driven out" : "held by brigands") : p.fate === "beast" ? (p.cleared ? `its ${beast(p.beast!)} is dead` : `a ${beast(p.beast!)} lairs there`) : p.cleared ? "its dead at rest" : "haunted";
      return `• ${p.name[0].toUpperCase() + p.name.slice(1)} (${{ fortress: "citadel", isle: "isle", delphi: "sanctuary", knossos: "palace" }[p.kind]}), ${directions(mx, my)}: ${state}${p.treasury ? (p.kind === "fortress" ? "; treasury taken" : "") : ""}.`;
    });
    for (const f of G.data.foretold ?? []) places.push(`• Foretold by the Pythia: ${f.text}`);
    const text = `FESTIVALS\n${fests.join("\n")}\n\nREQUESTS\n${reqs.length ? reqs.join("\n") : "Nothing promised. Ask the villagers if they need anything."}\n\nRUMORS\n${rum.length ? rum.join("\n") : "None. Ask around in the village."}${places.length ? `\n\nPLACES\n${places.join("\n")}` : ""}`;
    this.showTalk("Journal", `${G.dateLabel()} · you are ${directions(G.data.scene === "Wild" ? G.data.wx : 0, G.data.scene === "Wild" ? G.data.wy : 0).replace(" of your farm", "") || "at home"}${G.data.scene === "Wild" ? " of your farm" : ""}`, text, []);
  }

  smithOptions(v: Villager, opts: { label: string; fn: () => void }[]) {
    const job = G.data.smithJob;
    if (job) {
      const u = UPGRADES.find((x) => x.tool === job.tool && x.level === job.level)!;
      if (G.dayNumber >= job.ready) opts.push({ label: `Collect your ${u.name.toLowerCase()}`, fn: () => {
        const left = G.addItem(job.tool, 1);
        if (left) { this.talkTo(v, `"Make room in your pack first."`); return; }
        G.data.tools[job.tool] = job.level; G.data.smithJob = null;
        this.talkTo(v, `"There. ${u.desc} Treat it well."\n\n(You receive the ${u.name.toLowerCase()}.)`);
      } });
      return;
    }
    const discount = G.rel("lykos") >= 4 ? 0.8 : 1;
    for (const u of UPGRADES) {
      if (G.toolLevel(u.tool) >= u.level || G.count(u.tool) <= 0) continue;
      const price = Math.round(u.cost * discount);
      const ok = G.data.silver >= price && G.count("Wood") >= u.wood;
      opts.push({ label: `${u.name}: ${money(price)} and ${u.wood} wood${ok ? "" : " (you can't afford it yet)"}`, fn: () => {
        if (!ok) { this.talkTo(v, `"${money(price)} and ${u.wood} wood. Bronze isn't cheap, and neither is my time."`); return; }
        G.data.silver -= price; G.removeItem("Wood", u.wood); G.removeItem(u.tool, 1);
        G.data.smithJob = { tool: u.tool, level: u.level, ready: G.dayNumber + 1 };
        this.talkTo(v, `"Leave it with me. Come back tomorrow."\n\n(${u.desc}${discount < 1 ? " As a friend, you paid a fifth less." : ""})`);
      } });
    }
    if (G.count("sword") <= 0) {
      const price = Math.round(SWORD_ORDER.silver * discount);
      const ok = G.data.silver >= price && G.count("Copper") >= SWORD_ORDER.copper;
      opts.push({ label: `Forge me a sword: ${money(price)} and ${SWORD_ORDER.copper} copper ore${ok ? "" : " (you can't afford it yet)"}`, fn: () => {
        if (!ok) { this.talkTo(v, `"A sword? ${money(price)}, and bring me ${SWORD_ORDER.copper} lumps of copper ore. I've tin, but copper I have to beg for."`); return; }
        G.data.silver -= price; G.removeItem("Copper", SWORD_ORDER.copper);
        G.data.smithJob = { tool: "sword", level: 1, ready: G.dayNumber + 1 };
        this.talkTo(v, `"A leaf-bladed xiphos, then, the old way. Come back tomorrow, and don't go looking for trouble with it."`);
      } });
    }
  }

  /** The stranger at the inn. Xenia, the guest-friendship, is sacred to Zeus; and some guests are more than they seem. */
  talkToStranger(said?: string) {
    const st = G.data.stranger; if (!st) return;
    const kind = STRANGER_KINDS[st.kind];
    const greet: Record<string, string> = {
      beggar: `"Kindness, young one? The road is hard on old bones."`,
      traveler: `"Fair day. I've come a long way, and I've a long way to go."`,
      shepherd: `"Hullo! Lost a ewe two valleys back. Have you seen her? No? Ah well."`,
      potter: `"Pots, jars, cups! Well, not for sale here. The market's in the town. But I'll rest a while."`,
      bard: `"Shall I sing you something? The wrath of Achilles, perhaps, or something gentler?"`,
    };
    const opts: { label: string; fn: () => void }[] = [];
    if (!st.sensed) opts.push({ label: "Look closely at them (Pneuma)", fn: () => {
      st.sensed = true;
      const target = Math.max(1, (G.data.aretai.Pneuma ?? 3) - 2 + G.boon("Dionysus")), roll = 1 + Math.floor(Math.random() * 12);
      const odds = `(Pneuma: d12 ${roll}, needed 1–${target})`;
      this.talkToStranger(st.god && roll <= target ? `Something shines behind their eyes, old as the hills and bright as noon. This is no ordinary traveler. ${odds}` : `A traveler, tired and dusty, as far as you can tell. ${odds}`);
    } });
    if (kind.look === "bard") {
      const can = MELODIES.filter((m) => m.source === "taught" && m.id !== "augury" && !G.data.songs.includes(m.id));
      const sx = st as { taught?: boolean };
      if (can.length && !sx.taught) opts.push({ label: "Ask the singer to teach you a song", fn: () => {
        sx.taught = true; const m = can[Math.floor(Math.random() * can.length)];
        this.talkToStranger(`"Gladly. Every road has a song, and here is one I learned on mine." The singer plays it through twice on the lyre, then hums it with you until you have it.\n\n${this.learnSong(m)}`);
      } });
      if (G.data.silver >= 60 && !G.count("Lyre")) opts.push({ label: "Buy the singer's spare lyre (3 gold)", fn: () => { G.data.silver -= 60; give("Lyre", 1); this.talkToStranger(`"Treat her kindly. She's older than you are." (A lyre: hold it, then hold V to play.)`); } });
    }
    const held = G.selectedItem;
    if (!st.hosted) {
      if (held && GUEST_FOOD.includes(held.id)) opts.push({ label: `Welcome them, and offer your ${ITEMS[held.id].name.toLowerCase()}`, fn: () => this.hostStranger(held.id) });
      else opts.push({ label: "Offer hospitality", fn: () => this.talkToStranger(`The stranger smiles. "You're kind. Have you anything to eat? The road is long." (Hold some food in your hand: milk, honey, meat, fruit or grain.)`) });
    }
    this.showTalk("A stranger", kind.desc[0].toUpperCase() + kind.desc.slice(1), said ?? (st.hosted ? `"Thank you again for your kindness."` : greet[kind.look]), opts, kind.look);
  }

  hostStranger(food: string) {
    const st = G.data.stranger!; st.hosted = true; G.note("host");
    G.removeItem(food, 1); G.data.hostedDay = G.dayNumber;
    const twice = G.blessed("hospitality") ? 2 : 1;
    const favor = (god: string, d: number) => { G.addFavor(god, d * twice); };
    if (!st.god) {
      favor("Zeus", 1);
      const gifts = [
        () => { G.data.silver += 3; return `They press 3 silver into your hand. "For your trouble."`; },
        () => { G.addItem(seedId("Melon"), 1); return `They give you a melon seed from their pack. "It grew well where I come from."`; },
        () => `"Wolves in the eastern forests come out at dusk. And the boar there: hold out grain, and he'll often leave you be."`,
      ];
      this.talkToStranger(`${gifts[Math.floor(Math.random() * gifts.length)]()}\n\n(Zeus, god of guests and hosts, sees your xenia: favor with Zeus +${twice}.)`);
      return;
    }
    favor(st.god, 2); favor("Zeus", 1);
    G.addFatigue(-30); for (const k of Object.keys(G.essence) as (keyof typeof G.essence)[]) G.essence[k] = G.essenceMax[k];
    const boons: Record<string, () => string> = {
      Demeter: () => { G.addItem(seedId("Millet"), 5); G.addItem(seedId("Chickpeas"), 5); return "Your fields will remember this day. She leaves seed grain in your hands."; },
      Hera: () => { G.data.lifeThread = Math.min(START_LIFE_THREAD, G.data.lifeThread + 1); return "Hera, queen of heaven. She touches your brow, and a frayed strand of your Life Thread is mended."; },
      Athena: () => { for (const id of Object.keys(G.data.lore.tier)) if (G.data.lore.tier[id] === 0) G.data.lore.tier[id] = 1; return "Grey-eyed Athena. Things you had only glimpsed come suddenly clear."; },
      Hermes: () => { G.data.silver += 40; return "Quick Hermes, laughing. 2 gold glints in your palm, where you don't remember any."; },
      Zeus: () => { favor("Zeus", 1); return "The sky darkens, then clears. Zeus, father of gods and men, who keeps the law of guests. He is pleased."; },
      Apollo: () => { G.data.archeryXp += 40; return "Bright Apollo, the far-shooter. Your hands remember a bow better than they did."; },
      Dionysus: () => { G.addItem("Grapes", 6); return "Dionysus, wreathed in ivy. The air smells of wine; there are grapes in your pack."; },
      Aphrodite: () => { for (const id of Object.keys(VILLAGERS)) this.changeRel(id, 1); return "Aphrodite, golden. For days after, people smile at you more readily."; },
      Hephaestus: () => { G.addItem("Ochre", 3); G.addItem("Clay", 3); return "Hephaestus, limping and sooty, smiling. He leaves earth for pigment and for the kiln."; },
    };
    const boon = (boons[st.god] ?? boons.Zeus)();
    G.earn("Kleos", 1, `you hosted ${st.god} unknowing`);
    this.talkToStranger(`As you set the food before them, the stranger straightens, and grows tall, and the light changes. It is ${st.god}! ${boon}\n\n(Favor with ${st.god} +${2 * twice}, with Zeus +${twice}. Your Fatigue eases and your Essence fills.)`);
    G.data.stranger = { ...st, god: "", hosted: true }; // the god departs; the bench is empty in spirit
  }

  // ---------------------------------------------------------------- a rhythm test (treading, and later dance and music)
  rhythm(title: string, help: string, beats: number, done: (score: number) => void) {
    if (this.inv) this.toggleInventory();
    this.modal = true;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 620, h = 190, x0 = (W - w) / 2, y0 = (H - h) / 2 - 40;
    const root = this.add.container(0, 0).setDepth(26);
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 14, title, { ...font, fontSize: "18px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 42, help, { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    const bx = x0 + 60, bw = w - 120, by = y0 + 90;
    root.add(this.add.rectangle(bx, by, bw, 18, 0x3a2c22).setOrigin(0, 0));
    root.add(this.add.rectangle(bx + bw / 2 - 40, by, 80, 18, 0x6a2a4a).setOrigin(0, 0));
    root.add(this.add.rectangle(bx + bw / 2 - 12, by, 24, 18, 0xf2c14e).setOrigin(0, 0));
    const marker = this.add.rectangle(bx, by - 4, 3, 26, 0xf2e6c9).setOrigin(0.5, 0); root.add(marker);
    const status = this.add.text(W / 2, y0 + 128, "", { ...font, fontSize: "14px", align: "center" }).setOrigin(0.5, 0); root.add(status);
    const key = this.input.keyboard!.addKey("SPACE");
    let t = 0, beat = 0, score = 0, wait = 0;
    this.ritual = { art: ARTS.hospitality, use: new Set(), step: 0, results: [], t: 0 }; // holds Space for the rhythm
    const tick = (_: number, dms: number) => {
      const dt = dms / 1000;
      if (wait > 0) { wait -= dt; if (wait <= 0 && beat >= beats) finish(); return; }
      t += dt * (1.4 + beat * 0.15);
      marker.x = bx + ((Math.sin(t * Math.PI - Math.PI / 2) + 1) / 2) * bw;
      if (Phaser.Input.Keyboard.JustDown(key)) {
        const off = Math.abs(marker.x - (bx + bw / 2));
        const pts = off <= 12 ? 3 : off <= 40 ? 1 : 0;
        score += pts; beat++;
        status.setText(`${"●".repeat(beat)}${"○".repeat(beats - beat)}   ${pts === 3 ? "Right on the beat!" : pts ? "Close." : "Off the beat."}   (${score} of ${beats * 3})`);
        wait = beat >= beats ? 0.9 : 0.25;
      }
    };
    const finish = () => { this.events.off("update", tick); root.destroy(); this.ritual = undefined; this.modal = false; done(score); };
    this.events.on("update", tick);
  }

  // ---------------------------------------------------------------- the Mythborn
  talkToMyth(id: string, said?: string) {
    const d = MYTH[id], m = mythRec(id), today = G.dayNumber, rung = rungOf(m.days);
    const title = id === "naiad" ? (rung >= 1 ? `${m.name}, the Naiad` : "The Naiad") : rung >= 1 ? `${m.name} and the satyrs` : "The satyrs";
    const next = RUNG_DAYS[rung + 1];
    const sub = `${d.kind} · ${d.god}'s · ${RUNGS[rung]}${next ? ` (appeased on ${m.days} of ${next} days for ${RUNGS[rung + 1]})` : ""}`;
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    const opts: { label: string; fn: () => void }[] = [];
    const held = G.selectedItem;
    if (m.last !== today) {
      if (held && d.offers.includes(held.id)) opts.push({ label: `Offer your ${ITEMS[held.id].name.toLowerCase()}`, fn: () => {
        G.removeItem(held.id, 1);
        if (id === "satyrs" && held.id === "Wine") { m.days++; this.appeaseMyth(id, "WINE! The satyrs fall on the jar with a roar that shakes the leaves. It counts for two days of friendship."); return; }
        this.appeaseMyth(id, `You set down your ${ITEMS[held.id].name.toLowerCase()}. ${id === "satyrs" ? (held.id.includes("Grapes") ? "They fall on it with whoops: not wine, but wine-to-be!" : "They pass it round, delighted.") : "She takes it with a small, grave smile."}`);
      } });
      opts.push({ label: d.check.label, fn: () => {
        const a = G.data.aretai[d.check.aretai] ?? 3, target = a + 2 + rung, roll = 1 + Math.floor(Math.random() * 12);
        const odds = `(d12 ${roll}, needed 1–${target})`;
        if (roll <= target) this.appeaseMyth(id, id === "naiad" ? `You sit by the water and pray without words. After a long while she sits beside you. ${odds}` : `You leap into the ring and somehow keep the step. The satyrs roar with delight. ${odds}`);
        else if (id === "naiad") { m.gone = today; this.closeTalk(); G.say(`Your prayer stumbles, and when you look up she is gone beneath the water. ${odds}`); }
        else { G.addFatigue(8); m.last = today; this.talkToMyth(id, `You trip over a hoof and land in the grass. The satyrs howl with laughter and won't stop. (+8 Fatigue) ${odds}`); }
      } });
    }
    if (rung >= 3 && m.gift !== today) {
      if (id === "naiad") opts.push({ label: "Bathe in the spring", fn: () => { m.gift = today; G.addFatigue(-40); this.talkToMyth(id, "You bathe in the cold, clear water, and come out feeling new. (-40 Fatigue)"); } });
      else opts.push({ label: "Share their feast", fn: () => {
        m.gift = today;
        const gifts: [string, number][] = [["WildGrapes", 3], ["Honey", 1], ["Ivy", 2]];
        const [it, n] = gifts[Math.floor(Math.random() * gifts.length)];
        this.talkToMyth(id, `They press food and garlands on you, and you leave with your arms full. (${give(it, n)})`);
      } });
    }
    this.showTalk(title, sub, said ?? pick(d.lines[rung]), opts, undefined);
  }

  appeaseMyth(id: string, how: string) {
    const d = MYTH[id], m = mythRec(id), before = rungOf(m.days);
    m.last = G.dayNumber; m.days++; G.note(`myth:${id}`);
    const after = rungOf(m.days);
    let note = "";
    if (m.stolen && id === "satyrs") { G.addItem(m.stolen, 1); note += ` A satyr sheepishly hands back your ${ITEMS[m.stolen].name.toLowerCase()}.`; m.stolen = undefined; }
    if (after > before) {
      note += `\n\n${id === "naiad" ? m.name : `${m.name} and the satyrs`}: ${RUNGS[after]}.`;
      if (after === 1) note += ` ${id === "naiad" ? `She tells you her name: ${m.name}. You may draw from her spring now.` : `Their leader is ${m.name}.`}`;
      if (after === 2 || after === 4) { G.addFavor(d.god, 1); note += ` ${d.god} is pleased with you. (+1)`; }
      if (after === 3) note += id === "naiad" ? " She invites you to bathe in her spring." : " They'll share their feasts with you now.";
      if (after === 4) {
        G.earn("Kleos", 1, `friend of the ${d.kind.toLowerCase()}`);
        if (id === "satyrs") { G.addItem("Syrinx", 1); note += " They give you reed pipes of your own."; }
        note += ` (Ally: one day, one of your line could live among the ${d.kind === "Naiad" ? "nymphs" : "satyrs"}. Playable Mythborn come later.)`;
      }
    }
    this.talkToMyth(id, how + note);
  }

  // ---------------------------------------------------------------- the gods
  /** An altar: pray once a day at home, and offer what belongs to a god. The village altar can raise favor further. */
  openAltar(where: "home" | "shrine", said?: string) {
    const today = G.dayNumber;
    const cap = where === "home" ? HOME_CAP : SHRINE_CAP;
    const opts: { label: string; fn: () => void }[] = [];
    if (where === "home") {
      if (G.data.prayedDay !== today) opts.push({ label: "Pray to one of the Twelve", fn: () => this.chooseGod() });
    }
    const held = G.selectedItem;
    if (held && ITEMS[held.id].kind !== "tool") {
      const artemisShare = G.data.deerDebt > 0 && (held.id === "Antler" || held.id === "Meat");
      const god = artemisShare ? "Artemis" : OFFER_PATRON[held.id];
      if (god) opts.push({ label: `Offer your ${ITEMS[held.id].name.toLowerCase()} to ${CHTHONIC.includes(god) ? "the one below" : god}`, fn: () => this.offer(where, held.id, god, cap) });
      // Wine can be poured out to any god: a libation.
      if (held.id === "Figurine" || held.id === "Garland") opts.push({ label: `Dedicate the ${ITEMS[held.id].name.toLowerCase()} to another god`, fn: () => this.showTalk("To whom?", "A votive may be given to any god", "", TWELVE.map((g) => ({ label: `${g} (${G.favor(g) >= 0 ? "+" : ""}${G.favor(g)})`, fn: () => this.offer(where, held.id, g, cap) }))) });
      if (held.id === "Wine") opts.push({ label: "Pour a libation to another god", fn: () => this.showTalk("A libation to whom?", "Wine poured out is welcome to every god", "", TWELVE.map((g) => ({ label: `${g} (${G.favor(g) >= 0 ? "+" : ""}${G.favor(g)})`, fn: () => this.offer(where, "Wine", g, cap) }))) });
    }
    const text = said ?? (where === "home"
      ? `The household altar in its niche, a little smoke-dark. Pray here once a day: every ${DEVOTION_STEP} days of prayer to a god earns their notice (+1), up to +${HOME_CAP}. Offerings of what belongs to a god please them too, up to +${HOME_CAP} here.${G.data.prayedDay === today ? "\n\nYou have prayed today." : ""}`
      : `The village altar, black with old offerings. Gifts brought here can make you known by name to a god, up to +${SHRINE_CAP}. Hold what you would offer.`);
    if (!opts.length && !said) opts.push({ label: "(Hold something to offer: grain to Demeter, grapes to Dionysus, wood or meat to Zeus…)", fn: () => this.closeTalk() });
    this.showTalk(where === "home" ? "The household altar" : "The village altar", "Pray, and offer the first of what you have", text, opts);
  }

  chooseGod() {
    const opts = TWELVE.map((god) => ({
      label: `${god} (${G.favor(god) >= 0 ? "+" : ""}${G.favor(god)}, devotion ${G.data.devotion[god] ?? 0})`,
      fn: () => {
        G.data.prayedDay = G.dayNumber; G.note("pray");
        // A sneeze as you finish: the god has heard (an extra day of devotion).
        const sneeze = Math.random() < 1 / 8;
        const n = (G.data.devotion[god] = (G.data.devotion[god] ?? 0) + (sneeze ? 2 : 1));
        let note = `${DEVOTION_STEP - (n % DEVOTION_STEP)} more day${DEVOTION_STEP - (n % DEVOTION_STEP) > 1 ? "s" : ""} of prayer to be noticed further.`;
        if (n % DEVOTION_STEP === 0) {
          if (G.favor(god) < HOME_CAP) { G.addFavor(god, 1, HOME_CAP); note = `${god} has noticed your devotion: favor +1.`; }
          else note = `${god} knows your household well. To be known by name, bring offerings to the village altar.`;
        }
        if (n % DEVOTION_STEP === 0 && G.favor(god) >= HOME_CAP) note = note;
        this.openAltar("home", `You light the lamp, pour a little water, and pray to ${god}.${sneeze ? " As you finish, you sneeze. The god has heard you." : ""}\n\n${note}`);
      },
    }));
    this.showTalk("Pray to whom?", "Choose one god today. Each day of prayer counts toward their notice.", "", opts);
  }

  offer(where: "home" | "shrine", item: string, god: string, cap: number) {
    const today = G.dayNumber;
    const name = lowerName(item);
    // The chthonic powers take nothing by daylight, and only in the old ways.
    if (CHTHONIC.includes(god)) {
      if (G.isDay) { this.openAltar(where, `You hold out the ${name}, but it belongs to the one below, and he takes nothing by daylight.`); return; }
      if (G.data.offered[god] === today) { this.openAltar(where, "The earth has already drunk your offering tonight."); return; }
      G.removeItem(item, 1); G.data.offered[god] = today; G.note("offer");
      G.addFavor(god, 1, 3);
      this.openAltar(where, `In the dark you crush the ${name} and let it fall. The earth drinks it. Something below has noticed you. (A hidden favor stirs: ${god} +1.)`);
      return;
    }
    if (G.data.offered[god] === today) { this.openAltar(where, `${god} has already received your offering today. Come again tomorrow.`); return; }
    if (god === "Artemis" && G.data.deerDebt > 0) {
      G.removeItem(item, 1); G.data.deerDebt--; G.data.offered[god] = today;
      this.openAltar(where, `You set aside the ${name} for Artemis, mistress of beasts. Her share is given; she is satisfied.`);
      return;
    }
    if (G.favor(god) >= (where === "shrine" && festToday()?.god === god ? 10 : cap)) {
      this.openAltar(where, where === "home" ? `${god} already knows your household. To be known by name, bring your offerings to the village altar.` : `${god} knows you well. Greater favor comes from deeds, festivals and the gods' own tests.`);
      return;
    }
    const slot = G.data.slots.find((s) => s && s.id === item && s.q === 3) ?? G.data.slots.find((s) => s && s.id === item);
    const fine = slot?.q === 3, ft = festToday(), feast = where === "shrine" && ft?.god === god;
    G.removeItem(item, 1); G.data.offered[god] = today; G.note("offer");
    const after = G.addFavor(god, (fine ? 2 : 1) * (feast ? 2 : 1), feast ? 10 : cap);
    this.openAltar(where, `You offer the ${fine ? "finest " : ""}${name} to ${god}${feast ? ` at the ${ft!.name}, before the whole village` : ""}, and the smoke rises straight. ${god} is pleased. (favor ${after >= 0 ? "+" : ""}${after}${feast ? "; on the god's festival, offerings count double, as high as +10" : ""})`);
  }

  hearthMenu(tend: () => void) {
    const opts = [{ label: "Tend the hearth", fn: () => { this.closeTalk(); tend(); } }, { label: "Cook something", fn: () => { this.closeTalk(); this.openCook("hearth"); } }];
    for (const id of G.data.arts) opts.push({ label: `Plan the ${ARTS[id].name}`, fn: () => this.planRitual(ARTS[id]) });
    this.showTalk("The hearth", "Hestia's fire, the heart of the household", "The fire burns low and steady. Here the household's rites are done.", opts);
  }

  // ---- the gods and the self: two reference sheets
  sheet: "" | "gods" | "self" = "";
  sheetPanel?: Phaser.GameObjects.Container;
  openSheet(which: "gods" | "self") {
    if (this.market || this.dialog || this.craft || this.loreBook) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.sheet = which; this.modal = true;
    which === "gods" ? this.buildGods() : this.buildSelf();
  }
  closeSheet() { this.sheetPanel?.destroy(); this.sheetPanel = undefined; this.sheet = ""; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook || !!this.craft || !!this.talkPanel; }

  sheetFrame(title: string, sub: string, h = 520) {
    this.sheetPanel?.destroy();
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 820, x0 = (W - w) / 2, y0 = (H - h) / 2 - 10;
    const root = this.add.container(0, 0).setDepth(23);
    this.sheetPanel = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 1).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 12, title, { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 38, sub, { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
    return { root, font, w, h, x0, y0 };
  }

  buildGods() {
    const om = G.data.omen && G.data.omen.day === G.dayNumber && G.data.omen.noticed ? G.data.omen : null;
    const omenLine = om ? `  Today's omen, as you read it: ${OMEN_MEANING[om.god][(om.read ? om.good : !om.good) ? 0 : 1]}` : "";
    const { root, font, x0, y0, h } = this.sheetFrame("The gods", `Favor runs from -12 to +12; what it brings steps up at 1, 4, 8, 10 and 12, and it drifts back toward nothing. Point at a god for more.${omenLine}`, 600);
    const g = this.add.graphics(); root.add(g);
    const ps = this.playScene();
    const detail = this.add.text(x0 + 20, y0 + h - 118, "", { ...font, fontSize: "12px", color: "#e8e2d0", wordWrap: { width: 790 }, lineSpacing: 1 });
    ALL_GODS.forEach((god, i) => {
      const y = y0 + 58 + i * 26, f = G.favor(god), w = WHEEL.find((x) => x.god === god), d = DIVINE[god];
      const color = w ? Phaser.Display.Color.HexStringToColor(w.color).color : 0x6a6080;
      root.add(this.add.rectangle(x0 + 20, y + 3, 10, 10, color).setOrigin(0, 0));
      const nm = this.add.text(x0 + 38, y, god, { ...font, fontSize: "14px", color: w ? "#f2e6c9" : "#c0b8d8" });
      root.add(nm);
      root.add(this.add.text(x0 + 130, y + 1, d.aretai, { ...font, fontSize: "11px", color: "#c9b48f" }));
      const bx = x0 + 195, bw = 150, mid = bx + bw / 2;
      g.fillStyle(0x3a2c22).fillRect(bx, y + 4, bw, 8);
      g.fillStyle(f >= 0 ? 0xc9a35a : 0xb02a3a).fillRect(f >= 0 ? mid : mid + (f / 12) * (bw / 2), y + 4, Math.abs(f / 12) * (bw / 2), 8);
      g.fillStyle(0xf2e6c9).fillRect(mid, y + 2, 1, 12);
      for (const t of [4, 8, 10]) for (const sgn of [1, -1]) g.fillStyle(0x8d877b).fillRect(mid + sgn * (t / 12) * (bw / 2), y + 11, 1, 3);
      const t = tierOf(f);
      root.add(this.add.text(bx + bw + 10, y, `${f >= 0 ? "+" : ""}${f}  ${TIER_WORDS[t]}`, { ...font, fontSize: "13px", color: f > 0 ? "#fbe39a" : f < 0 ? "#e09080" : "#8d877b" }));
      // The power, when they approve of you enough.
      const px = x0 + 545;
      if (f >= 8) {
        const why = ps ? ps.powerBlocked(god) : "Step outside first.";
        const b = this.add.text(px, y, why ? `${d.power.name} (not now)` : `Call on ${god}: ${d.power.name}`, { ...font, fontSize: "12px", color: why ? "#8d877b" : "#f2c14e", backgroundColor: why ? undefined : "#3a2a18", padding: { x: 4, y: 1 } as Phaser.Types.GameObjects.Text.TextPadding });
        root.add(b);
        b.setInteractive({ useHandCursor: !why }).on("pointerover", () => detail.setText(`${d.power.name}: ${d.power.desc}${why ? `\n${why}` : ""}`)).on("pointerdown", () => { if (!why && ps) { this.closeSheet(); ps.invokePower(god); } });
      } else {
        root.add(this.add.text(px, y + 1, f <= -4 ? `troubles in ${d.domain.split(",")[0]}` : f >= 4 ? `gifts in ${d.domain.split(",")[0]}` : f !== 0 ? d.passive.split(";")[0] : "", { ...font, fontSize: "11px", color: f !== 0 ? "#c9c0a8" : "#8d877b", wordWrap: { width: 270 } }).setMaxLines(1));
      }
      nm.setInteractive({ useHandCursor: true }).on("pointerover", () => detail.setText(`${UIScene.standing(god)}\nDomain: ${d.domain}.`));
    });
    root.add(detail);
    root.add(this.add.text(x0 + 20, y0 + h - 140, CURRENCIES.map((c) => `${c} ${G.data.currencies[c]}`).join("   ·   "), { ...font, fontSize: "13px", color: "#fbe39a" }));
    root.add(this.add.text(x0 + 820 / 2, y0 + h - 22, "F or Esc to close   ·   P for your Aretai", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  buildSelf() {
    const b = G.data.birth;
    // Who you are, as the world would see you: your two strongest Aretai and the gods who stand closest.
    const ranked = [...WHEEL].sort((x, y) => (G.data.aretai[y.aretai] ?? 0) - (G.data.aretai[x.aretai] ?? 0));
    const first = ranked[0].aretai, second = ranked[1].aretai;
    const favors = [...TWELVE, ...CHTHONIC].map((g) => [g, G.favor(g)] as [string, number]);
    const best = favors.filter(([, f]) => f >= 1).sort((x, y) => y[1] - x[1])[0] ?? null;
    const worst = favors.filter(([, f]) => f <= -4).sort((x, y) => x[1] - y[1])[0] ?? null;
    const tier = best ? (best[1] >= 10 ? 4 : best[1] >= 8 ? 3 : best[1] >= 4 ? 2 : 1) : 0;
    makePortrait(this, "portrait", G.data.look, first, second, best?.[0] ?? null, tier, worst?.[0] ?? null);
    const EPITHET: Record<string, string> = { Phoenix: "the Charming", Kardia: "the Hunter", Oikos: "of the Hearth", Techne: "the Skilled", Metis: "the Cunning", Gnosis: "the Knowing", Logos: "the Well-spoken", Ourania: "the Sweet-voiced", Pneuma: "the Inspired", Aiolos: "the Swift-footed", Thymos: "the Bold", Kratos: "the Strong" };
    const favorWord = best ? `${best[1] >= 10 ? "chosen of" : best[1] >= 8 ? "dear to" : best[1] >= 4 ? "beloved of" : "noticed by"} ${best[0]}` : "";
    const title = `${G.data.name || "You"} ${EPITHET[first]}${favorWord ? `, ${favorWord}` : ""}`;
    const { root, font, x0, y0, h } = this.sheetFrame(title, b ? `${b.sign} · born to ${b.birthright} · trained in ${b.training} · Young Adult` : "Young Adult", 586);
    // The portrait and the body.
    root.add(this.add.rectangle(x0 + 22, y0 + 62, 198, 198, 0x0d0a08).setOrigin(0, 0).setStrokeStyle(2, 0x8a6a4a));
    root.add(this.add.image(x0 + 25, y0 + 65, "portrait").setOrigin(0, 0).setScale(3));
    const stat = (y: number, label: string, val: string, color = "#f2e6c9") => { root.add(this.add.text(x0 + 24, y, label, { ...font, fontSize: "12px", color: "#c9b48f" })); root.add(this.add.text(x0 + 218, y, val, { ...font, fontSize: "13px", color }).setOrigin(1, 0)); };
    let sy = y0 + 270;
    stat(sy, "Vitality", `${Math.ceil(G.data.vitality)} / ${G.vitalityMax}`, "#e8a090"); sy += 18;
    stat(sy, "Fatigue", `${Math.round(G.data.fatigue)} / 100`); sy += 18;
    stat(sy, "Life Thread", `${G.data.lifeThread} of ${START_LIFE_THREAD}`, "#e8c0b0"); sy += 18;
    stat(sy, "Health · Stealth", `${G.data.health} · ${G.data.stealth}`); sy += 18;
    stat(sy, "Essence (E W A F)", (["Earth", "Water", "Air", "Fire"] as const).map((k) => Math.round(G.essenceMax[k])).join(" · ")); sy += 18;
    stat(sy, "Purse", money(G.data.silver), "#fbe39a"); sy += 18;
    const ml = G.data.meal;
    if (ml.aretai && ml.aretai.until > G.absHour) { stat(sy, "Fed", `${ml.aretai.ar} +${ml.aretai.n}`); sy += 18; }
    sy += 6;
    const looks = [`In hand: the mark of ${first}`, `On the head: the mark of ${second}`, best ? `Behind: ${best[0]}'s light (${TIER_WORDS[tierOf(best[1])]})` : "No god stands behind you yet", worst ? `A shadow: ${worst[0]} (${TIER_WORDS[tierOf(worst[1])]})` : ""].filter(Boolean);
    root.add(this.add.text(x0 + 24, sy, looks.join("\n"), { ...font, fontSize: "10.5px", color: "#a89a80", lineSpacing: 1, wordWrap: { width: 196 } }));
    // The Aretai, in the order of the Wheel, with the cost to raise each.
    const ax = x0 + 246;
    root.add(this.add.text(ax, y0 + 60, "ARETAI  (spend Ambrosia to raise)", { ...font, fontSize: "12px", color: "#c9b48f" }));
    WHEEL.forEach((w, i) => {
      const y = y0 + 80 + i * 22, v = G.data.aretai[w.aretai] ?? 0, cost = raiseCost(v);
      root.add(this.add.rectangle(ax, y + 4, 10, 10, Phaser.Display.Color.HexStringToColor(w.color).color).setOrigin(0, 0));
      root.add(this.add.text(ax + 16, y, `${w.aretai}`, { ...font, fontSize: "14px", color: w.aretai === first || w.aretai === second ? "#fbe39a" : "#f2e6c9" }));
      root.add(this.add.text(ax + 112, y, `${v}`, { ...font, fontSize: "14px" }).setOrigin(1, 0));
      root.add(this.add.text(ax + 124, y + 2, `${w.god} · ${w.benefit}`, { ...font, fontSize: "10px", color: "#a89a80" }));
      const ok = G.data.currencies.Ambrosia >= cost && v < 12;
      const t = this.add.text(ax + 548, y + 1, v >= 12 ? "at its peak" : `+1: ${cost} Ambrosia`, { ...font, fontSize: "11px", color: ok ? "#f2e6c9" : "#6d675b" }).setOrigin(1, 0);
      if (ok) t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => {
        G.data.currencies.Ambrosia -= cost; G.data.aretai[w.aretai] = v + 1;
        G.essenceMax = essencePools(G.data.aretai);
        G.say(`Your ${w.aretai} rises to ${v + 1}.`);
        this.buildSelf();
      });
      root.add(t);
    });
    // The cosmic currencies, and where you stand with the gods.
    let y = y0 + 80 + 12 * 22 + 8;
    root.add(this.add.text(ax, y, CURRENCIES.map((c) => `${c} ${G.data.currencies[c]}`).join("     "), { ...font, fontSize: "14px", color: "#fbe39a" })); y += 22;
    const top = favors.filter(([, f]) => f !== 0).sort((p, q) => Math.abs(q[1]) - Math.abs(p[1])).slice(0, 6);
    root.add(this.add.text(ax, y, top.length ? `The gods: ${top.map(([g, f]) => `${g} ${f > 0 ? "+" : ""}${f}`).join(" · ")}  (F for more)` : "No god knows you yet. (F for the gods)", { ...font, fontSize: "12px", color: "#e0d2b4", wordWrap: { width: 548 } })); y += 22;
    if (b) {
      root.add(this.add.text(ax, y, `Hamartia: ${b.hamartia[0]}. ${b.hamartia[1]}\nAstheneia: ${b.astheneia[0]}. ${b.astheneia[1]}\nMoros: hidden by the Fates.`, { ...font, fontSize: "11px", color: "#c9b48f", wordWrap: { width: 548 }, lineSpacing: 1 }));
    }
    root.add(this.add.text(x0 + 820 / 2, y0 + h - 22, "P or Esc to close   ·   F for the gods", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  // ---- rituals: plan, then perform
  ritual?: { art: Art; use: Set<string>; step: number; results: { label: string; roll: number; bonus: number; need: number; ok: boolean }[]; marker?: Phaser.GameObjects.Rectangle; t: number; panel?: Phaser.GameObjects.Container };

  ritualConditions(art: Art) {
    const moonFull = G.moon === "Full moon";
    const met: Record<string, boolean> = { zeusHour: G.patron?.aretai === "Kratos", fullMoon: moonFull, hosted: G.dayNumber - G.data.hostedDay <= 3 };
    return art.timing.map((t) => ({ ...t, ok: !!met[t.id] }));
  }

  /** The CR of each check after components, timing and place. */
  ritualCRs(art: Art, use: Set<string>) {
    const timing = this.ritualConditions(art).filter((t) => t.ok).reduce((n, t) => n + t.cr, 0);
    const reduce = -use.size + timing + art.location.cr;
    return art.checks.map((c) => ({ ...c, cr: Math.max(2, c.cr + reduce) }));
  }

  /** A d12 plus your Aretai (plus performance) must meet the CR. */
  odds(aretai: number, cr: number) { return Math.max(0, Math.min(1, (13 - (cr - aretai)) / 12)); }

  planRitual(art: Art, use?: Set<string>) {
    const sel = use ?? new Set(art.components.filter((c) => G.count(c.item) > 0).map((c) => c.item));
    const crs = this.ritualCRs(art, sel);
    const exact = (G.data.aretai.Gnosis ?? 3) >= 4; // Gnosis reveals the true odds
    const rough = (p: number) => (p >= 0.85 ? "near certain" : p >= 0.6 ? "likely" : p >= 0.35 ? "a fair chance" : p >= 0.15 ? "unlikely" : "nearly impossible");
    const lines: string[] = [];
    lines.push(`${art.requirement}  Cost: ${Object.entries(art.cost).map(([k, v]) => `${v} ${k}`).join(", ")} (you have ${Object.entries(art.cost).map(([k]) => G.data.currencies[k as keyof typeof G.data.currencies]).join(", ")}).`);
    lines.push("Conditions: " + this.ritualConditions(art).map((t) => `${t.ok ? "✓" : "·"} ${t.label} (${t.cr})`).join("   ") + `   ✓ ${art.location.label} (${art.location.cr})`);
    lines.push("Checks (each: d12 + Aretai + performance must meet the CR):");
    for (const c of crs) { const a = G.data.aretai[c.aretai] ?? 3, p = this.odds(a, c.cr); lines.push(`   ${c.label} · ${c.aretai} ${a} · ${exact ? `CR ${c.cr} (${Math.round(p * 100)}% before performance)` : rough(p)}`); }
    lines.push(`Effect: ${art.effect}`);
    lines.push(`On failure: Likelihood ${art.failure.likelihood} of 12: ${art.failure.text}${exact ? "" : "   (Gnosis 4+ shows exact odds.)"}`);
    const opts: { label: string; fn: () => void }[] = art.components.map((c) => {
      const have = G.count(c.item) > 0, on = sel.has(c.item);
      return { label: `${on ? "[x]" : "[ ]"} ${c.label}${have ? "" : " (you have none)"}  -1 CR`, fn: () => { if (!have) return; const n = new Set(sel); on ? n.delete(c.item) : n.add(c.item); this.planRitual(art, n); } };
    });
    const canPay = Object.entries(art.cost).every(([k, v]) => G.data.currencies[k as keyof typeof G.data.currencies] >= (v ?? 0));
    opts.push({ label: canPay ? "Perform the rite now" : "Perform the rite (you can't pay its cost)", fn: () => { if (canPay) this.performRitual(art, sel); } });
    this.showTalk(art.name, `An Art of ${art.patron} · plan the rite: components, timing and place lower every CR`, lines.join("\n"), opts);
  }

  performRitual(art: Art, use: Set<string>) {
    for (const [k, v] of Object.entries(art.cost)) G.data.currencies[k as keyof typeof G.data.currencies] -= v ?? 0;
    for (const item of use) G.removeItem(item, 1);
    this.closeTalk();
    this.modal = true;
    this.ritual = { art, use, step: 0, results: [], t: 0 };
    this.ritualStep();
  }

  /** One step of the rite: a short timing test, then the roll. Hitting the gold adds performance bonus. */
  ritualStep() {
    const r = this.ritual!; r.panel?.destroy();
    const crs = this.ritualCRs(r.art, r.use);
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 620, h = 200, x0 = (W - w) / 2, y0 = (H - h) / 2 - 40;
    const root = this.add.container(0, 0).setDepth(26);
    r.panel = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    if (r.step >= crs.length) { this.ritualEnd(); return; }
    const c = crs[r.step];
    root.add(this.add.text(W / 2, y0 + 14, `${r.art.name} · step ${r.step + 1} of ${crs.length}`, { ...font, fontSize: "14px", color: "#fbe39a" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 38, c.label, { ...font, fontSize: "18px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 66, `${c.aretai}: press Space as the mark crosses the gold`, { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    const bx = x0 + 60, bw = w - 120, by = y0 + 110;
    root.add(this.add.rectangle(bx, by, bw, 18, 0x3a2c22).setOrigin(0, 0));
    root.add(this.add.rectangle(bx + bw / 2 - 40, by, 80, 18, 0x8a6a2a).setOrigin(0, 0));
    root.add(this.add.rectangle(bx + bw / 2 - 12, by, 24, 18, 0xf2c14e).setOrigin(0, 0));
    r.marker = this.add.rectangle(bx, by - 4, 3, 26, 0xf2e6c9).setOrigin(0.5, 0);
    root.add(r.marker);
    r.t = 0;
    const speed = 1.3 + r.step * 0.25;
    const key = this.input.keyboard!.addKey("SPACE");
    const tick = (_: number, dms: number) => {
      if (!this.ritual || !r.marker) return;
      r.t += (dms / 1000) * speed;
      const u = (Math.sin(r.t * Math.PI - Math.PI / 2) + 1) / 2;
      r.marker.x = bx + u * bw;
      if (Phaser.Input.Keyboard.JustDown(key)) {
        this.events.off("update", tick);
        const off = Math.abs(r.marker.x - (bx + bw / 2));
        const bonus = off <= 12 ? 3 : off <= 40 ? 1 : 0;
        const a = G.data.aretai[c.aretai] ?? 3, roll = 1 + Math.floor(Math.random() * 12);
        const ok = roll + a + bonus >= c.cr;
        r.results.push({ label: c.label, roll, bonus, need: c.cr, ok });
        root.add(this.add.text(W / 2, y0 + 146, `${bonus === 3 ? "A fine performance (+3)." : bonus ? "A fair performance (+1)." : "A stumble (+0)."}  d12 ${roll} + ${c.aretai} ${a} + ${bonus} = ${roll + a + bonus} against CR ${c.cr}: ${ok ? "it holds." : "it falters."}`, { ...font, fontSize: "13px", color: ok ? "#9ad07a" : "#e09080", wordWrap: { width: w - 40 }, align: "center" }).setOrigin(0.5, 0));
        this.time.delayedCall(1400, () => { r.step++; this.ritualStep(); });
      }
    };
    this.events.on("update", tick);
  }

  ritualEnd() {
    const r = this.ritual!, art = r.art;
    const ok = r.results.every((x) => x.ok);
    let text: string;
    if (ok) {
      G.data.blessing = { id: art.id, until: G.dayNumber + art.days - 1 };
      G.addFavor(art.patron, 1);
      text = `The rite is complete. The fire leaps once, and settles warm. ${art.effect}\n\n(Favor with ${art.patron} +1.)`;
    } else {
      const roll = 1 + Math.floor(Math.random() * 12);
      const bad = roll <= art.failure.likelihood;
      if (bad && art.id === "hospitality") G.addFavor("Zeus", -1);
      text = `The rite falters at "${r.results.find((x) => !x.ok)!.label.split(":")[0]}". ${bad ? art.failure.text : "No harm done, this time."} (Likelihood ${art.failure.likelihood}: d12 ${roll}.) The components and cost are spent.`;
    }
    r.panel?.destroy();
    this.ritual = undefined;
    this.modal = false;
    this.showTalk(art.name, ok ? "The rite holds" : "The rite fails", text, []);
  }

  craftAt: Station = "hand";
  closedByE = -1;
  openCraft(at: Station = "hand") {
    if (this.market || this.dialog || this.loreBook) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.craftAt = at;
    this.modal = true; this.buildCraft();
  }
  closeCraft() { this.craft?.destroy(); this.craft = undefined; this.pot = []; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook; }

  /** Your hands' skill at a station: Techne, and Hephaestus' boon when he favors you. */
  static craftQuality(): { q: number; roll: number; skill: number } {
    const skill = Math.max(1, (G.data.aretai.Techne ?? 3) + G.boon("Hephaestus"));
    const roll = d12(), ch = G.data.divine.charges;
    let q = roll <= Math.ceil(skill / 2) ? 3 : roll <= skill + 3 ? 2 : 1;
    if (ch.Hephaestus) { ch.Hephaestus--; q = 3; G.say(`The god's own hand guides yours.${ch.Hephaestus ? ` (${ch.Hephaestus} more)` : ""}`); }
    else if (ch.botch) { ch.botch = 0; q = 1; G.say("Something is off in the work today. Hephaestus looks away."); }
    if (G.warded("Hephaestus")) q = Math.max(2, q);
    return { q, roll, skill };
  }

  /** Handwork you can do anywhere (C), or the work of a station you have built (E at the station). */
  buildCraft() {
    this.craft?.destroy();
    const at = this.craftAt;
    // Tool work at the forge shows only while there's a better edge to give it.
    const list = RECIPES.filter((r) => (r.at ?? "hand") === at && (!r.upgrade || G.toolLevel(r.out) < r.upgrade));
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const row = 50, w = 600, h = 84 + list.length * row + 36, x0 = (W - w) / 2, y0 = Math.max(8, (H - h) / 2 - 30);
    const root = this.add.container(0, 0).setDepth(23);
    this.craft = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 12, STATION_NAME[at], { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    const sub = at === "hand" ? "Click a recipe to make it from what you carry. Larger work needs a workbench."
      : `Click a recipe to make it. Fine work is a Techne check (skill ${Math.max(1, (G.data.aretai.Techne ?? 3) + G.boon("Hephaestus"))}).`;
    root.add(this.add.text(W / 2, y0 + 40, sub, { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    list.forEach((r, i) => {
      const y = y0 + 68 + i * row;
      const ok = r.needs.every(([id, n]) => G.count(id) >= n) && (!r.upgrade || G.count(r.out) > 0);
      root.add(this.add.image(x0 + 34, y + 16, "items", r.out).setScale(2));
      const need = r.needs.map(([id, n]) => `${n} ${ITEMS[id].name} (${G.count(id)})`).join(", ") + (r.upgrade ? ` + your ${ITEMS[r.out].name.toLowerCase()}` : "");
      const label = r.upgrade ? toolName(r.out, r.upgrade, ITEMS[r.out].name) : ITEMS[r.out].name;
      const t = this.add.text(x0 + 64, y, `${label}${r.qty > 1 ? ` × ${r.qty}` : ""}  ←  ${need}`, { ...font, fontSize: "15px", color: ok ? "#f2e6c9" : "#8d877b" });
      root.add(t);
      root.add(this.add.text(x0 + 64, y + 21, r.desc + (r.quality ? " ★" : ""), { ...font, fontSize: "12px", color: "#c9b48f" }));
      if (ok) t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => this.makeRecipe(r));
    });
    root.add(this.add.text(W / 2, y0 + h - 26, `${at === "hand" ? "C" : "E"} or Esc to close${list.some((r) => r.quality) ? "   ·   ★ quality depends on your hands" : ""}`, { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  makeRecipe(r: (typeof RECIPES)[number]) {
    const heavy = r.at && r.at !== "hand";
    if (labor(heavy ? EFFORT.station : EFFORT.hand, heavy ? 2 : 1, "Techne") === null) return;
    for (const [id, n] of r.needs) G.removeItem(id, n);
    G.note("craft"); G.note(`craft:${r.out}`);
    if (r.upgrade) {
      G.data.tools[r.out] = r.upgrade; SOUND.sfx("chop");
      G.say(`${STATION_NAME[r.at ?? "hand"]}: you heat, hammer and quench. Your ${ITEMS[r.out].name.toLowerCase()} is now a ${toolName(r.out, r.upgrade, ITEMS[r.out].name).toLowerCase()}.`);
      this.buildCraft(); return;
    }
    const qty = Math.max(1, r.qty + (r.out === "Arrow" ? G.boon("Hephaestus") : 0));
    let q: number | undefined, note = "";
    if (r.quality) {
      const c = UIScene.craftQuality(); q = c.q;
      note = ` (Techne d12 ${c.roll} against ${c.skill}: ${q === 3 ? "excellent work" : q === 2 ? "fine work" : "ordinary work"})`;
    }
    const got = give(r.out, qty, q);
    G.say(`${STATION_NAME[r.at ?? "hand"]}: ${got}${note}.${qty > r.qty ? " Hephaestus guides your hands." : ""}`);
    this.buildCraft();
  }

  // ---------------------------------------------------------------- cooking
  pot: string[] = [];
  cookAt: "campfire" | "hearth" = "campfire";
  /** Cook at a campfire or the hearth: up to three things in the pot. (Shares the crafting panel's place on screen.) */
  openCook(at: "campfire" | "hearth") {
    if (this.market || this.dialog || this.loreBook) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.cookAt = at; this.craftAt = "workbench"; this.pot = [];
    this.modal = true; this.buildCook();
  }
  /** How well you cook: Oikos, and more in Demeter's hour. */
  static cookSkill() { return (G.data.aretai.Oikos ?? 3) + (G.patron?.aretai === "Oikos" ? 2 : 0); }
  buildCook() {
    this.craft?.destroy();
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const have = Object.keys(INGREDIENTS).filter((id) => ITEMS[id] && G.count(id) > 0);
    const inPot = (id: string) => this.pot.filter((x) => x === id).length;
    const cols = 4, cw = 150, rows = Math.max(1, Math.ceil(have.length / cols));
    const known = NAMED.filter((n) => G.data.dishes.includes(dishId(n)));
    const w = 660, h = 230 + rows * 30 + (known.length ? 26 + Math.ceil(known.length / 2) * 17 : 20), x0 = (W - w) / 2, y0 = Math.max(6, (H - h) / 2 - 30);
    const root = this.add.container(0, 0).setDepth(23); this.craft = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 10, this.cookAt === "hearth" ? "Cooking at the hearth" : "Cooking at the campfire", { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 38, "Click foods to put up to three in the pot; click the pot to take them out. Rarer things make stronger dishes.", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
    if (!have.length) root.add(this.add.text(W / 2, y0 + 66, "You carry nothing to cook: meat, grain, greens, herbs, fruit, milk, honey, oil or wine.", { ...font, fontSize: "14px", color: "#8d877b" }).setOrigin(0.5, 0));
    have.forEach((id, i) => {
      const x = x0 + 24 + (i % cols) * cw, y = y0 + 62 + Math.floor(i / cols) * 30, left = G.count(id) - inPot(id), ing = INGREDIENTS[id];
      root.add(this.add.image(x + 8, y + 9, "items", id).setScale(1.25));
      const t = this.add.text(x + 22, y, `${ITEMS[id].name} ${left}${"·".repeat(ing.rarity - 1) ? " " + "★".repeat(ing.rarity - 1) : ""}`, { ...font, fontSize: "13px", color: left > 0 && this.pot.length < 3 ? "#f2e6c9" : "#8d877b" });
      root.add(t);
      if (left > 0 && this.pot.length < 3) t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => { this.pot.push(id); this.buildCook(); });
    });
    // The pot.
    const py = y0 + 74 + rows * 30;
    root.add(this.add.text(x0 + 24, py + 10, "The pot:", { ...font, fontSize: "15px" }));
    for (let k = 0; k < 3; k++) {
      const bx = x0 + 110 + k * 46;
      const box = this.add.rectangle(bx, py, 38, 38, 0x3a2c22).setOrigin(0, 0).setStrokeStyle(1, 0x8a6a4a);
      root.add(box);
      const id = this.pot[k];
      if (id) { root.add(this.add.image(bx + 19, py + 19, "items", id).setScale(2)); box.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.pot.splice(k, 1); this.buildCook(); }); }
    }
    // What it will make.
    let preview = "Put something in the pot.";
    if (this.pot.length) {
      const r = cookResult(this.pot), stars = ["", "plain", "good", "rich"][r.tier];
      if (r.named && G.data.dishes.includes(r.id)) preview = `${r.named.name}: ${r.named.god}'s own dish (${stars}). ${effectText(mealEffect(r.id, r.tier))}.`;
      else {
        const plain = PLAIN[r.aretai];
        preview = `${plain.name} (${stars}): ${effectText(mealEffect(`meal_${r.aretai}`, r.tier))}.${r.named ? "\nSomething about this combination smells like a festival..." : ""}`;
      }
      preview += `\nA good cook (Oikos ${UIScene.cookSkill()}) may make it richer; so do fine ingredients.`;
    }
    root.add(this.add.text(x0 + 260, py - 2, preview, { ...font, fontSize: "13px", color: "#fbe39a", wordWrap: { width: w - 280 } }));
    const ok = this.pot.length > 0;
    const btn = this.add.text(x0 + 24, py + 52, "▶ Cook it", { ...font, fontSize: "17px", color: ok ? "#f2c14e" : "#8d877b" });
    root.add(btn);
    if (ok) btn.setInteractive({ useHandCursor: true }).on("pointerover", () => btn.setColor("#ffffff")).on("pointerout", () => btn.setColor("#f2c14e")).on("pointerdown", () => this.cook());
    // The dishes of the gods you have found.
    let ky = py + 90;
    if (known.length) {
      root.add(this.add.text(x0 + 24, ky, "Dishes of the gods you know:", { ...font, fontSize: "13px", color: "#c9b48f" })); ky += 20;
      known.forEach((n, i) => root.add(this.add.text(x0 + 24 + (i % 2) * 310, ky + Math.floor(i / 2) * 17, `${n.name} (${n.god}): ${n.needs.map((x) => (Array.isArray(x) ? x.map((y) => ITEMS[y].name).join(" or ") : ITEMS[x].name)).join(", ")}`, { ...font, fontSize: "11px", color: "#c9b48f", wordWrap: { width: 300 } })));
    } else root.add(this.add.text(x0 + 24, ky, "Some old combinations are the gods' own dishes. You'll know one when you cook it.", { ...font, fontSize: "12px", color: "#8d877b" }));
    root.add(this.add.text(W / 2, y0 + h - 22, "E or Esc to close", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }
  cook() {
    const pot = [...this.pot];
    if (pot.some((id) => G.count(id) < pot.filter((x) => x === id).length)) { this.pot = []; this.buildCook(); return; }
    const b = labor(EFFORT.hand, 1, "Oikos"); if (b === null) return;
    const r = cookResult(pot);
    // Fine ingredients make a finer dish: if every one can come from your better stock, use it.
    const fine = pot.every((id) => UIScene.countQ(id, 2) >= pot.filter((x) => x === id).length);
    for (const id of pot) UIScene.takeQ(id, 1, fine ? 2 : 1);
    const skill = UIScene.cookSkill(), roll = d12(), well = roll <= Math.ceil(skill / 2);
    const tier = Math.min(3, r.tier + (fine ? 1 : 0) + (well ? 1 : 0));
    const first = !G.data.dishes.includes(r.id);
    if (first) G.data.dishes.push(r.id);
    G.note("cook"); G.note(`cook:${r.id}`);
    SOUND.sfx(r.named && first ? "find" : "pickup");
    const got = give(r.id, 1, tier);
    const how = [fine && "fine ingredients", well && `well cooked (Oikos d12 ${roll})`].filter(Boolean).join(", ");
    if (r.named && first) G.say(`A dish of the gods! ${r.named.name}: ${r.named.desc}`);
    G.say(`You cook: ${got}${how ? ` (${how})` : ""}. Eaten: ${effectText(mealEffect(r.id, tier))}.${b}`);
    this.pot = []; this.buildCook();
  }

  // ---------------------------------------------------------------- chests
  chestPanel?: Phaser.GameObjects.Container;
  chestOf?: Placed;
  openChest(p: Placed) {
    if (this.market || this.dialog || this.loreBook || this.craft) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.chestOf = p; this.modal = true; this.buildChest();
  }
  closeChest() { this.chestPanel?.destroy(); this.chestPanel = undefined; this.chestOf = undefined; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook || !!this.craft; }
  /** Move a whole stack between the pack and the chest. */
  static moveStack(from: (Slot | null)[], i: number, to: (Slot | null)[]) {
    const s = from[i]; if (!s) return;
    for (const t of to) if (t && t.id === s.id && (t.q ?? 1) === (s.q ?? 1) && t.qty < STACK_MAX && ITEMS[s.id].kind !== "tool") {
      const n = Math.min(s.qty, STACK_MAX - t.qty); t.qty += n; s.qty -= n; if (!s.qty) { from[i] = null; return; }
    }
    const j = to.findIndex((t) => !t); if (j >= 0) { to[j] = s; from[i] = null; }
  }
  buildChest() {
    this.chestPanel?.destroy();
    const p = this.chestOf!; const store = p.store!;
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const cell = 40, cols = 10, w = cols * cell + 60, h = 340, x0 = (W - w) / 2, y0 = (H - h) / 2 - 20;
    const root = this.add.container(0, 0).setDepth(23); this.chestPanel = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 10, "The chest", { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    const grid = (arr: (Slot | null)[], gy: number, other: (Slot | null)[], n: number) => {
      for (let i = 0; i < n; i++) {
        const cx = x0 + 30 + (i % cols) * cell + cell / 2, cy = gy + Math.floor(i / cols) * cell + cell / 2;
        const box = this.add.rectangle(cx, cy, cell - 4, cell - 4, 0x2c221a).setStrokeStyle(1, 0x5e4a36);
        root.add(box);
        const s = arr[i]; if (!s) continue;
        root.add(this.add.image(cx, cy - 2, "items", s.id).setScale(2));
        if (s.qty > 1) root.add(this.add.text(cx + 16, cy + 16, `${s.qty}`, { ...font, fontSize: "11px" }).setOrigin(1, 1));
        if (s.q && s.q > 1) root.add(this.add.text(cx - 16, cy - 18, "★", { ...font, fontSize: "11px", color: s.q === 3 ? "#f2c14e" : "#d8d8e0" }));
        box.setInteractive({ useHandCursor: true }).on("pointerover", () => { box.setStrokeStyle(2, 0xf2c14e); hint.setText(`${s.q && s.q > 1 ? QUALITY[s.q] + " " : ""}${ITEMS[s.id].name} × ${s.qty}`); })
          .on("pointerout", () => box.setStrokeStyle(1, 0x5e4a36)).on("pointerdown", () => { UIScene.moveStack(arr, i, other); this.buildChest(); });
      }
    };
    root.add(this.add.text(x0 + 30, y0 + 40, "In the chest (click to take)", { ...font, fontSize: "13px", color: "#c9b48f" }));
    grid(store, y0 + 58, G.data.slots, CHEST_SIZE);
    root.add(this.add.text(x0 + 30, y0 + 148, "Your pack (click to put away)", { ...font, fontSize: "13px", color: "#c9b48f" }));
    grid(G.data.slots, y0 + 166, store, INVENTORY_SIZE);
    const hint = this.add.text(W / 2, y0 + h - 26, "E or Esc to close", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0);
    root.add(hint);
  }

  openLore(focus?: string) {
    if (this.market || this.dialog) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.modal = true;
    if (focus) this.loreSel = focus;
    this.buildLore();
  }
  closeLore() { this.loreBook?.destroy(); this.loreBook = undefined; this.modal = this.help.visible || !!this.inv || !!this.market; }

  /** The book of what you know: every kind of thing you've met, and how well you understand it. */
  buildLore() {
    this.loreBook?.destroy();
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 800, h = 480, x0 = (W - w) / 2, y0 = (H - h) / 2 - 20;
    const root = this.add.container(0, 0).setDepth(23);
    this.loreBook = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 12, "What you know", { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 38, "Investigate things in the world with Q. Each study is a Gnosis check that may deepen your understanding of that kind of thing.", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
    const ids = Object.keys(G.data.lore.tier).filter((id) => LORE[id]);
    ids.sort((a, b) => LORE[a].category.localeCompare(LORE[b].category) || LORE[a].name.localeCompare(LORE[b].name));
    if (!this.loreSel || !ids.includes(this.loreSel)) this.loreSel = ids[0] ?? "";
    const pips = (t: number) => "●".repeat(t) + "○".repeat(3 - t);
    let y = y0 + 66, cat = "";
    const lx = x0 + 20;
    for (const id of ids) {
      const d = LORE[id], t = G.lore(id);
      const label = t >= 1 ? d.category : "Not yet known";
      if (label !== cat) { cat = label; root.add(this.add.text(lx, y, cat, { ...font, fontSize: "12px", color: "#fbe39a" })); y += 17; }
      const name = t >= 1 ? d.name : d.vague[0].toUpperCase() + d.vague.slice(1);
      const tx = this.add.text(lx + 8, y, `${pips(t)}  ${name}`, { ...font, fontSize: "13px", color: id === this.loreSel ? "#f2c14e" : "#f2e6c9" })
        .setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.loreSel = id; this.buildLore(); });
      root.add(tx); y += 17;
      if (y > y0 + h - 30) break;
    }
    // The selected subject.
    if (this.loreSel) {
      const d = LORE[this.loreSel], t = G.lore(this.loreSel);
      const rx = x0 + 290, rw = w - 310;
      root.add(this.add.rectangle(rx - 12, y0 + 64, 1, h - 90, 0x6b4a2b).setOrigin(0, 0));
      root.add(this.add.text(rx, y0 + 66, t >= 1 ? d.name : d.vague[0].toUpperCase() + d.vague.slice(1), { ...font, fontSize: "20px" }));
      root.add(this.add.text(rx, y0 + 94, `Understanding: ${TIERS[t]}  ${pips(t)}`, { ...font, fontSize: "13px", color: "#fbe39a" }));
      root.add(this.add.text(rx, y0 + 122, loreLines(d, t).join("\n\n"), { ...font, fontSize: "14px", lineSpacing: 2, wordWrap: { width: rw } }));
      if (t < 3) {
        const gn = G.data.aretai.Gnosis ?? 3, target = Math.max(0, Math.min(12, gn + TIER_MOD[t + 1] + RARITY_MOD[d.rarity] + Math.min(MAX_PERSEVERANCE, G.data.lore.fails[this.loreSel] ?? 0)));
        root.add(this.add.text(rx, y0 + h - 50, `Next tier, ${TIERS[t + 1]}: a Gnosis check succeeds on 1–${target} of 12 (+2 in Hera's hour).`, { ...font, fontSize: "12px", color: "#c9b48f", wordWrap: { width: rw } }));
      }
    }
    root.add(this.add.text(W / 2, y0 + h - 22, "K or Esc to close", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  marketMode: "cart" | "mill" = "cart";
  openMarket(mode: "cart" | "mill" = "cart") { if (this.market || this.dialog) return; if (this.inv) this.toggleInventory(); this.closeTalk(); this.marketMode = mode; this.modal = true; this.buildMarket(); }
  closeMarket() { this.market?.destroy(); this.market = undefined; this.modal = this.help.visible || !!this.inv; }

  /** The miller's cart: leave goods in the pithos to sell, and buy seeds. */
  buildMarket() {
    this.market?.destroy();
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 760, h = 470, x0 = (W - w) / 2, y0 = (H - h) / 2 - 20;
    const root = this.add.container(0, 0).setDepth(23);
    this.market = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    const mill = this.marketMode === "mill";
    const discount = mill && G.rel("theron") >= 4 ? 0.8 : 1; // a friend of the miller pays less for seed
    root.add(this.add.text(W / 2, y0 + 14, `${mill ? "Theron's mill" : "The miller's cart"}  ·  your purse: ${money(G.data.silver)}`, { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 42, mill ? `Theron pays on the spot, and seeds go straight into your pack.${discount < 1 ? " As a friend, you pay a fifth less for seed." : ""}` : "Leave goods in the pithos; his cart takes them at dawn and leaves the coin. Seeds you buy come with it.", { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    const head = (x: number, y: number, t: string) => root.add(this.add.text(x, y, t, { ...font, fontSize: "15px", color: "#fbe39a" }));
    const row = (x: number, y: number, t: string, ok: boolean, fn?: () => void) => {
      const tx = this.add.text(x, y, t, { ...font, fontSize: "14px", color: ok ? "#f2e6c9" : "#8d877b" });
      if (fn && ok) tx.setInteractive({ useHandCursor: true }).on("pointerover", () => tx.setColor("#f2c14e")).on("pointerout", () => tx.setColor("#f2e6c9")).on("pointerdown", () => { fn(); this.buildMarket(); });
      root.add(tx);
    };
    const name = (s: { id: string; q?: number }) => `${s.q && s.q > 1 ? QUALITY[s.q] + " " : ""}${ITEMS[s.id].name}`;
    const hermes = Math.max(0.5, 1 + 0.05 * G.boon("Hermes"));
    const each = (s: { id: string; q?: number }) => Math.round((ITEMS[s.id].value ?? 0) * QUALITY_MULT[s.q ?? 1] * hermes);

    // Left: your goods, then what's already in the pithos.
    const lx = x0 + 24; let y = y0 + 74;
    head(lx, y, mill ? "Your goods (click to sell a stack now)" : "Your goods (click to leave a stack in the pithos)"); y += 24;
    const goods = G.data.slots.map((s, i) => ({ s, i })).filter(({ s }) => s && (ITEMS[s.id].value ?? 0) > 0);
    if (!goods.length) { row(lx, y, "Nothing the miller wants yet.", false); y += 20; }
    for (const { s, i } of goods.slice(0, mill ? 14 : 9)) {
      row(lx, y, `${name(s!)} × ${s!.qty}  ·  ${money(each(s!))} each`, true, () => {
        if (mill) { const got = each(s!) * s!.qty; G.data.silver += got; G.say(`Theron pays you ${money(got)} for the ${name(s!).toLowerCase()}.`); }
        else G.data.outbox.push({ ...s! });
        G.data.slots[i] = null;
      });
      y += 20;
    }
    y += 10;
    if (!mill) {
    const total = G.data.outbox.reduce((n, s) => n + each(s) * s.qty, 0);
    head(lx, y, `In the pithos for the cart: ${money(total)} (click to take back)`); y += 24;
    if (!G.data.outbox.length) { row(lx, y, "Empty.", false); y += 20; }
    G.data.outbox.slice(0, 7).forEach((s, j) => { row(lx, y, `${name(s)} × ${s.qty}`, true, () => { const left = G.addItem(s.id, s.qty, s.q); if (left) s.qty = left; else G.data.outbox.splice(j, 1); }); y += 20; });
    }

    // Right: seed orders.
    const rx = x0 + w / 2 + 30; y = y0 + 74;
    head(rx, y, mill ? "Buy seeds" : "Buy seeds (paid now, delivered at dawn)"); y += 24;
    for (const c of Object.values(CROPS)) {
      const price = Math.max(1, Math.round(c.seedPrice * discount));
      const ok = G.data.silver >= price;
      const season = c.seasons.includes(G.month.season) ? "" : "  (out of season)";
      row(rx, y, `${c.name} seed × ${c.packet}  ·  ${money(price)}${season}`, ok, () => {
        G.data.silver -= price;
        if (mill) { const left = G.addItem(seedId(c.id), c.packet); if (left) { G.data.silver += price; G.say("Your pack is full."); } return; }
        const o = G.data.orders.find((o) => o.id === seedId(c.id));
        if (o) o.qty += c.packet; else G.data.orders.push({ id: seedId(c.id), qty: c.packet });
      });
      y += 20;
    }
    y += 10;
    if (!mill) {
    head(rx, y, "Coming with the cart at dawn"); y += 24;
    if (!G.data.orders.length) row(rx, y, "Nothing ordered.", false);
    else for (const o of G.data.orders) { row(rx, y, `${ITEMS[o.id].name} × ${o.qty}`, false); y += 20; }
    }

    root.add(this.add.text(W / 2, y0 + h - 26, "E or Esc to close", { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  describe(i: number) {
    const s = G.data.slots[i];
    if (!s) return "Empty.";
    const d = ITEMS[s.id];
    return `${s.q ? QUALITY[s.q][0].toUpperCase() + QUALITY[s.q].slice(1) + " " + d.name.toLowerCase() : d.name}${d.greek ? ` (${d.greek})` : ""}${d.kind !== "tool" ? ` × ${s.qty}` : ""}: ${d.desc}${d.value ? ` The miller pays ${money(Math.round(d.value * QUALITY_MULT[s.q ?? 1]))} each.` : ""}`;
  }

  clickSlot(i: number) {
    if (this.held === null) { if (G.data.slots[i]) this.held = i; return; }
    if (this.held !== i) G.swapSlots(this.held, i);
    this.held = null;
  }

  drawInventory() {
    this.inv!.cells.forEach((c, i) => {
      this.fillSlot(c, i);
      const sel = i === this.held ? 0xf2c14e : i === G.data.selected ? 0xc4703f : 0x6b4a2b;
      c.bg.setStrokeStyle(i === this.held ? 3 : 2, sel);
    });
  }

  choose(text: string, onYes: () => void) {
    this.modal = true;
    const bg = this.add.rectangle(W / 2, H / 2, 540, 210, 0x1f1712, 0.96).setStrokeStyle(2, 0xc4703f);
    const t = this.add.text(W / 2, H / 2 - 30, text, { fontFamily: FONT, fontSize: "16px", color: "#f2e6c9", align: "center", wordWrap: { width: 500 } }).setOrigin(0.5);
    const yes = this.add.text(W / 2 - 80, H / 2 + 66, "[Y] Yes", { fontFamily: FONT, fontSize: "18px", color: "#f2c14e" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const no = this.add.text(W / 2 + 80, H / 2 + 66, "[N] Not yet", { fontFamily: FONT, fontSize: "18px", color: "#f2e6c9" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.dialog = this.add.container(0, 0, [bg, t, yes, no]).setDepth(25);
    const close = () => { this.dialog?.destroy(); this.dialog = undefined; this.modal = false; this.input.keyboard!.off("keydown-Y", y); this.input.keyboard!.off("keydown-N", n); };
    const y = () => { close(); onYes(); };
    const n = () => close();
    yes.on("pointerdown", y); no.on("pointerdown", n);
    this.input.keyboard!.on("keydown-Y", y);
    this.input.keyboard!.on("keydown-N", n);
  }

  collapse(from: Phaser.Scene) { this.sleep(from, true); }

  /** The thread is cut. Heirs and the next generation come later; for now, a new life begins. */
  death(by: string) {
    this.modal = true;
    GameState.clearSave();
    this.add.rectangle(0, 0, W, H, 0x0b0b10, 0.92).setOrigin(0, 0).setDepth(40);
    this.add.text(W / 2, H / 2, [`Killed by a ${by.toLowerCase()}.`, "", "Your Life Thread is cut, and the Fates close their shears.", "In the full game your heir would take up the homestead.", "", "Press any key to begin a new life."].join("\n"),
      { fontFamily: FONT, fontSize: "20px", color: "#f2e6c9", align: "center", lineSpacing: 6 }).setOrigin(0.5).setDepth(41);
    this.time.delayedCall(1200, () => { this.input.keyboard!.once("keydown", () => window.location.reload()); this.input.once("pointerdown", () => window.location.reload()); });
  }

  sleep(from: Phaser.Scene, collapsed: boolean, cause?: string, camp = false) {
    this.modal = true;
    if (this.inv) this.toggleInventory();
    this.modal = true;
    const away = from.scene.key === "Wild" && !camp;
    const { hoursSlept, recovered, healed, notes } = G.sleep(collapsed, camp);
    if (away && !cause) notes.unshift("A passing shepherd finds you and helps you home.");
    const ft = festToday(), next = festUpcoming(2).find((x) => x.d === 1);
    if (ft) notes.push(`Today the village keeps the ${ft.name}, for ${ft.god}. Go down to the village altar.`);
    else if (next) notes.push(`Tomorrow the village keeps the ${next.f.name}, for ${next.f.god}.`);
    // By a campfire you wake where you lay down; otherwise beside your own bed.
    const ps = from as PlayScene;
    const wakeScene = camp ? from.scene.key : "House";
    const wakeX = camp ? ps.player.x : 3 * TILE, wakeY = camp ? ps.player.y : 5 * TILE + 8;
    G.data.scene = wakeScene as SaveData["scene"]; G.data.px = wakeX; G.data.py = wakeY; if (camp) G.data.entry = "";
    const saved = G.save();
    const cover = this.add.rectangle(0, 0, W, H, 0x0b1630, 0).setOrigin(0, 0).setDepth(30);
    this.tweens.add({ targets: cover, fillAlpha: 1, duration: 600 });
    const lines = [
      cause ?? (collapsed ? "You collapse from exhaustion in the second watch of the night." : camp ? "You sleep on the hard ground by the fire, waking now and then to feed it." : "You sleep."),
      "",
      `Dawn. ${G.dateLabel()}`,
      `${G.moon}`,
      "",
      `${hoursSlept.toFixed(1)} hours of sleep${collapsed || camp ? " (poor rest: half counted)" : ""}, ${Math.round(recovered)} Fatigue cleared${healed >= 1 ? `, ${Math.round(healed)} Vitality healed` : ""}.`,
      ...notes,
      saved ? "Your life is saved." : "(This browser would not let the game save.)",
      "",
      "Press any key",
    ];
    const t = this.add.text(W / 2, H / 2, lines.join("\n"), { fontFamily: FONT, fontSize: "20px", color: "#f2e6c9", align: "center", lineSpacing: 6 }).setOrigin(0.5).setDepth(31).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, delay: 500, duration: 500 });
    this.time.delayedCall(900, () => {
      const go = () => {
        this.input.keyboard!.off("keydown", go); this.input.off("pointerdown", go);
        cover.destroy(); t.destroy();
        G.data.scene = wakeScene as SaveData["scene"]; G.data.px = wakeX; G.data.py = wakeY; if (camp) G.data.entry = "";
        (from as PlayScene).leaving = true; // keep the old scene from moving us before it closes
        this.modal = false;
        if (camp) from.scene.restart(); else from.scene.start("House");
      };
      this.input.keyboard!.once("keydown", go);
      this.input.once("pointerdown", go);
    });
  }
}

// ------------------------------------------------------------------ boot the game
// Sound can only begin after the player presses a key or clicks.
for (const ev of ["keydown", "pointerdown"]) window.addEventListener(ev, () => SOUND.start());
(window as unknown as { SOUND: typeof SOUND }).SOUND = SOUND; // for testing
(window as unknown as { game: Phaser.Game }).game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W, height: H,
  parent: "game",
  backgroundColor: "#1f2a3a",
  pixelArt: true,
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, CreationScene, FarmScene, HouseScene, WildScene, VillageScene, GymScene, CaveScene, LabyrinthScene, UIScene],
});

(window as unknown as { WHEEL: typeof WHEEL }).WHEEL = WHEEL;
(window as unknown as { Animal: typeof Animal }).Animal = Animal; // for testing from the console
