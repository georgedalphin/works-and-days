import { VILLAGERS } from "./village";
import type { Request, Rumor } from "./quests";
import { ALL_GODS, DIVINE, boonOf, giftChance, DRIFT_DAYS } from "./divine";
import { START_CURRENCIES, type Currency, favorLabel } from "./gods";
import { SIGNS, SIGN_DAYS, MAGIC_FINDS, type SignEffect, DREAMS, MOROS_DREAMS, OMEN_MEANING } from "./omens";
import {
  MONTHS, WHEEL, START_ARETAI, essencePools, ESSENCE, DAYLIGHT_REAL_SECONDS, rollWeather, WEATHER_WORD, type Weather,
  NIGHT_WATCHES_PLAYABLE, SLEEP_RECOVERY_PER_HOUR, moonPhase,
  ITEMS, money, STACK_MAX, JAR_CAPACITY, INVENTORY_SIZE,
  START_GOATS, type Goat, terrain, HOME_TERRAIN,
  CROPS, seedId, START_SEEDS, START_SILVER, STARTING_ARROWS, ARCHERY, START_LIFE_THREAD, DRY_LIMIT, QUALITY_MULT,
} from "./data";

export interface Slot { id: string; qty: number; q?: number } // q: quality 1-3 for produce
export interface CropRec { id: string; growth: number; dryNights: number; dryStreak: number; hourBonus: boolean; withered: boolean; picks: number; nymph?: boolean; sign?: boolean }
/** What a young farmer already knows on the first day. */
const START_LORE: Record<string, number> = { goat: 1, bees: 1, Millet: 1, Chickpeas: 1, Melon: 1, Mint: 1, vine: 1, olive: 1, t3: 1 };
export interface ScreenRec { terrain: number; special: boolean; feature: string; cleared: string[]; picked?: Record<string, number>; barrow?: [number, number]; laid?: boolean; glint?: number;
  /** A lonely hut on this screen: who lives there, and what you have done there today. */
  hut?: { tx: number; ty: number; kind: string; seed: number; god: string; hosted?: number; special?: number; sensed?: boolean; met?: boolean } | null;
  /** Roads through this screen (the sides whose gaps carry a track), a crossroads where three or more meet, a graveyard, a shrine. */
  /** The landmark: what has been taken from it this season, and whether its cache has been searched. */
  lmTook?: Record<number, string>; lmCache?: string; lmSeen?: boolean; boatRolled?: boolean;
  river?: boolean; ford?: [number, number] | null;
  roads?: string[]; crossroads?: boolean; hecateNight?: number; met?: boolean; graveyard?: [number, number] | null; shrine?: { tx: number; ty: number; god: string; seed: number } | null }

const SAVE_KEY = "worksanddays.save.v1";

export interface Essence { Earth: number; Water: number; Air: number; Fire: number }

/** Something you made and set down: a station, a chest, a fence, a snare. */
export interface Placed { id: string; where: string; x: number; y: number; store?: (Slot | null)[]; set?: number; caught?: string; /** A campfire burns until this hour (absolute clock hours). */ fuel?: number }
export const CHEST_SIZE = 20;

export interface SaveData {
  seed: number;
  year: number;
  month: number; // index into MONTHS
  day: number; // 1-based
  clock: number; // clock hours since dawn (0 = dawn, 24 = next dawn)
  fatigue: number; // 0..100
  aretai: Record<string, number>;
  slots: (Slot | null)[]; // INVENTORY_SIZE slots; 0-9 are the hotbar
  selected: number; // hotbar index 0-9
  jarWater: number;
  cleared: string[]; // "x,y" tiles cleared on the homestead
  ground: Record<string, "tilled" | "wet">; // worked soil on the homestead
  treeHits: Record<string, number>;
  scene: "Farm" | "House" | "Wild" | "Village" | "Cave" | "Gym";
  /** A festival footrace waiting to be run at the gymnasion (the festival's id). */
  raceFor?: string;
  wx: number; wy: number; // the wilderness screen, in screens from home (0,0)
  /** Where along the side you walk in (tile x for N/S, tile y for E/W), so you arrive at the gap you left by. */
  entryAt?: number | null;
  entry: "" | "N" | "S" | "E" | "W" | "C" | "U"; // C: out of a cave mouth; U: up from a deeper cave level // the side of the next map the player walks in from
  lastTerrain: number; // terrain of the screen the player just left
  screens: Record<string, ScreenRec>;
  px: number; py: number;
  tendedHearthDay: string;
  goats: Goat[];
  manger: number; // fodder in the goats' manger
  trough: number; // water in the goats' trough
  hiveDay: number; // day number of the last honey harvest
  crops: Record<string, CropRec>; // "x,y" on the homestead
  silver: number; // your purse, counted in silver coins (20 silver = 1 gold)
  outbox: Slot[]; // goods left in the pithos for the miller's cart
  orders: Slot[]; // seeds ordered, delivered at dawn
  vineYear: number; // year the old vine was last picked
  seedsGiven?: boolean;
  archeryXp: number;
  name: string;
  look: { tunic: string; hair: string; skin: string };
  birth: { sign: string; birthright: string; training: string; hamartia: [string, string]; astheneia: [string, string]; moros: [string, string] } | null;
  health: number; // Resources: your Vitality is 6 per point of Health (4 is the baseline: 24 Vitality)
  /** Vitality: hit points. Blows and hazards take it; at 0 you fall, and your Life Thread frays. Food and sleep heal it. */
  vitality: number;
  stealth: number; // Resources: creatures let you closer (4 is the baseline)
  lifeThread: number;
  farmPicked: Record<string, number>;
  npc: Record<string, { rel: number; talked: number; gifted: number }>;
  stranger: { kind: number; god: string; arrived: number; hosted: boolean; sensed: boolean } | null;
  tools: Record<string, number>; // tool levels from the smith (1 = as you started)
  smithJob: { tool: string; level: number; ready: number } | null;
  favor: Record<string, number>; // divine favor, -12 to +12
  currencies: Record<Currency, number>;
  devotion: Record<string, number>; // days of household prayer per god
  prayedDay: number;
  offered: Record<string, number>; // god -> day of the last offering they noticed
  knownByName: Record<string, boolean>; // gods who have reached +4 (each gives Ambrosia once)
  deerDebt: number; // deer taken today without Artemis' share
  wildOaks: number; // oaks felled in the wild (Artemis keeps count)
  arts: string[];
  blessing: { id: string; until: number } | null;
  hostedDay: number;
  anchors: { spring?: string; satyrs?: string; cave?: string; tirShrine?: string; tirGrave?: string };
  caves: Record<string, { type: "common" | "sacred" | "chthonic"; boss: "alive" | "appeased" | "slain"; hoard: boolean; mined: Record<string, string[]> }>;
  cave: { key: string; level: number }; // where you are underground
  torchLit: boolean; // a torch burns for this visit underground
  myth: Record<string, { days: number; last: number; gone: number; name: string; stolen?: string; gift: number }>;
  /** How many times you have met each kind of wandering monster. */
  met: Record<string, number>;
  /** Things you have made and set down (where: "farm" or "w:<screen>"). */
  placed: Placed[];
  /** Where your thrown spear lies, until you pick it up. */
  spearAt: { k: string; x: number; y: number } | null;
  spearGiven?: boolean;
  spearHotbar?: boolean;
  /** Rowing from one screen to the next: the boat comes too. */
  boatCarry?: boolean;
  /** Villagers' requests you have taken on, and rumors of lands you've been told of. */
  requests: Request[];
  rumors: Rumor[];
  reqSeq: number;
  /** Day you last asked each villager for work, and for rumors. */
  askedReq: Record<string, number>;
  askedRumor: Record<string, number>;
  /** Year each olive tree on the homestead was last picked. */
  olives: Record<string, number>;
  /** Tiresias: which of his tasks you are on, what has happened since it began, where he sits. */
  /** A meal's effects while they last: one Aretai, one god's favor. `until` is in absolute clock hours (day × 24 + clock). */
  meal: { aretai?: { ar: string; n: number; until: number; dish: string }; favor?: { god: string; n: number; until: number; dish: string } };
  /** Music: the melodies you know, the day each last worked its magic, and song effects running (until, in absolute clock hours). */
  songs: string[]; songUsed: Record<string, number>; songBuff: Record<string, number>;
  /** Festivals you have joined, by "year:id": the rite walked, the feast given to, the agon entered. */
  fest: Record<string, { rite?: number; feast?: number; agon?: number; place?: number }>;
  /** The dishes you have cooked, so you know them when you see them in the pot. */
  dishes: string[];
  tir: { step: number; ev: Record<string, number>; base: Record<string, number>; doneDay: number; spot: number; met: boolean; said: number };
  /** The gods at work: gifts and troubles waiting in their domains, powers used, Chosen marks, charges, and days. */
  divine: {
    gifts: { god: string; item: string; qty: number; q?: number }[];
    troubles: string[];
    powerUsed: Record<string, number>;
    chosen: Record<string, number>; // +1 while Chosen (+10), -1 while Accursed (-10)
    charges: Record<string, number>;
    wrathDay: Record<string, number>;
    day: Record<string, number>; // calm, fury, hecateLight, wellDry, goatSick...
    quests: Record<string, { item: string; qty: number; posted: number } | undefined>;
  };
  /** Today's weather, rolled at dawn, and tomorrow's (which a chance word may tell you). */
  weather: Weather;
  nextWeather?: Weather;
  /** Signs seen: the day number each was last seen. */
  signs: Record<string, number>;
  /** Today's omen: whose, whether it was truly good, and what you made of it. */
  omen?: { day: number; god: string; good: boolean; noticed: boolean; read?: boolean };
  /** The day a dream came, if one did. */
  dreamDay?: number;
  jarSpring: boolean; // the jar holds the Naiad's water
  vat: { repaired: boolean; must: number; q: number; sealed: number }; // sealed: day the must was sealed to work, or -1
  vines: Record<string, { planted: number; picked: number }>; // young vines on the homestead: picked = year last picked
  cuttings: Record<string, number>; // wild vines you have taken a cutting from ("screen:x,y" -> day) // forage gathered on the homestead: "x,y" -> day number
  bowGiven?: boolean;
  lore: { tier: Record<string, number>; fails: Record<string, number>; studied: Record<string, number> };
}

export class GameState {
  data: SaveData;
  essence: Essence;
  essenceMax: Essence;
  /** The element you last ran dry of, for the HUD to blink (not saved). */
  spentFlash?: { el: string; at: number };
  messages: { text: string; t: number }[] = [];

  constructor(data?: SaveData) {
    this.data = GameState.migrate(data ?? GameState.fresh());
    this.essenceMax = essencePools(this.data.aretai);
    this.essence = { ...this.essenceMax };
  }

  static startingSlots(): (Slot | null)[] {
    const s: (Slot | null)[] = Array(INVENTORY_SIZE).fill(null);
    ["hoe", "jar", "sickle", "axe", "mattock"].forEach((id, i) => (s[i] = { id, qty: 1 }));
    s[9] = { id: "bow", qty: 1 }; s[10] = { id: "Arrow", qty: STARTING_ARROWS };
    return s;
  }

  /** Bring saves from earlier builds up to date. */
  /** Your full Vitality: 6 for each point of Health. */
  get vitalityMax() { return 6 * Math.max(2, this.data.health); }
  /** Heal (or, with a negative n, hurt) Vitality, within 0 and the maximum. */
  heal(n: number) { this.data.vitality = Math.max(0, Math.min(this.vitalityMax, this.data.vitality + n)); }
  /** Is a song's effect still running? */
  songOn(k: string) { return (this.data.songBuff[k] ?? -1) > this.absHour; }
  /** Now, in clock hours since the world began. */
  get absHour() { return this.dayNumber * 24 + this.data.clock; }
  /** A god's dish you ate brings their favor closer for a while. */
  mealFavor(god: string) { const f = this.data.meal.favor; return f && f.god === god && f.until > this.absHour ? f.n : 0; }
  /** Eat a dish: its Aretai or its god's favor for a while. A new meal of the same sort replaces the old one. */
  eatMeal(dish: string, effect: { ar?: string; god?: string; n: number; hours: number }) {
    this.endMeal("aretai", effect.ar ? undefined : "keep");
    if (effect.ar) {
      this.data.aretai[effect.ar] = (this.data.aretai[effect.ar] ?? 3) + effect.n;
      this.data.meal.aretai = { ar: effect.ar, n: effect.n, until: this.absHour + effect.hours, dish };
    } else if (effect.god) this.data.meal.favor = { god: effect.god, n: effect.n, until: this.absHour + effect.hours, dish };
  }
  /** Take a meal's Aretai back off when it ends (or is replaced). */
  endMeal(which: "aretai", keep?: string) {
    const m = this.data.meal.aretai;
    if (!m || keep) return;
    this.data.aretai[m.ar] = (this.data.aretai[m.ar] ?? 3) - m.n;
    this.data.meal.aretai = undefined;
  }
  /** Meals wear off. Returns what ended, to say so. */
  mealTick(): string[] {
    const now = this.absHour, out: string[] = [], m = this.data.meal;
    if (m.aretai && m.aretai.until <= now) { out.push(`The ${m.aretai.ar} from your meal wears off.`); this.endMeal("aretai"); }
    if (m.favor && m.favor.until <= now) { out.push(`The nearness of ${m.favor.god} that came with your meal fades.`); m.favor = undefined; }
    return out;
  }

  /** Something happened that Tiresias may ask after: count it. */
  note(ev: string, n = 1) { this.data.tir.ev[ev] = (this.data.tir.ev[ev] ?? 0) + n; }

  static migrate(d: SaveData & { inventory?: Record<string, number> }): SaveData {
    if (!d.slots) {
      d.slots = GameState.startingSlots();
      const old = d.inventory ?? {};
      d.selected = 0; d.jarWater = JAR_CAPACITY; d.ground = {}; d.treeHits = {};
      const g = new GameState(d as SaveData);
      for (const [k, v] of Object.entries(old)) if (v > 0) g.addItem(k, v);
      delete d.inventory;
    }
    d.ground ??= {}; d.treeHits ??= {};
    d.goats ??= START_GOATS.map((g) => ({ ...g }));
    d.manger ??= 2; d.trough ??= 2; d.hiveDay ??= -1;
    d.crops ??= {}; d.silver ??= (d as SaveData & { tally?: number }).tally ?? START_SILVER; d.outbox ??= []; d.orders ??= []; d.vineYear ??= 0;
    if (!d.seedsGiven) { d.seedsGiven = true; const g = Object.create(GameState.prototype) as GameState; g.data = d; for (const [c, n] of START_SEEDS) g.addItem(seedId(c), n); }
    d.archeryXp ??= 0; d.name ??= ""; d.look ??= { tunic: "#e9e1cf", hair: "#4a3324", skin: "#c98e62" }; d.birth ??= null; d.health ??= 4; d.stealth ??= 4; d.lifeThread ??= START_LIFE_THREAD; d.farmPicked ??= {}; d.npc ??= {}; d.stranger ??= null; d.tools ??= {}; d.smithJob ??= null; d.favor ??= {}; d.currencies ??= { ...START_CURRENCIES }; d.devotion ??= {}; d.prayedDay ??= -1; d.offered ??= {}; d.knownByName ??= {}; d.deerDebt ??= 0; d.wildOaks ??= 0; d.arts ??= []; d.blessing ??= null; d.hostedDay ??= -99; d.anchors ??= {}; d.caves ??= {}; d.cave ??= { key: "", level: 1 }; d.torchLit ??= false; d.myth ??= {}; d.jarSpring ??= false; d.vat ??= { repaired: false, must: 0, q: 1, sealed: -1 }; d.vines ??= {}; d.cuttings ??= {}; d.met ??= {}; d.placed ??= []; d.spearAt ??= null; d.requests ??= []; d.rumors ??= []; d.reqSeq ??= 0; d.askedReq ??= {}; d.askedRumor ??= {}; d.olives ??= {}; d.vitality ??= 6 * Math.max(2, d.health ?? 4); d.meal ??= {}; d.dishes ??= []; d.songs ??= []; d.fest ??= {}; d.songUsed ??= {}; d.songBuff ??= {}; d.tir ??= { step: 0, ev: {}, base: {}, doneDay: -1, spot: 0, met: false, said: -1 }; d.divine ??= { gifts: [], troubles: [], powerUsed: {}, chosen: {}, charges: {}, wrathDay: {}, day: {}, quests: {} }; d.divine.quests ??= {};
    if (!d.spearGiven) { d.spearGiven = true; if (!d.slots.some((s) => s?.id === "spear")) { const g = Object.create(GameState.prototype) as GameState; g.data = d; g.addItem("spear", 1); } }
    // The spear belongs on the hotbar: an empty hotbar slot, or the last seed set there (which moves to the pack).
    if (!d.spearHotbar) {
      d.spearHotbar = true;
      const i = d.slots.findIndex((s) => s?.id === "spear");
      if (i >= 10) {
        let h = d.slots.slice(0, 10).findIndex((s) => !s);
        if (h < 0) for (let k = 9; k >= 0; k--) if (d.slots[k]?.id.startsWith("seed_")) { h = k; break; }
        if (h >= 0) [d.slots[h], d.slots[i]] = [d.slots[i], d.slots[h]];
      }
    }
    d.weather ??= "clear"; d.signs ??= {};
    if (!d.bowGiven) { d.bowGiven = true; if (!d.slots.some((s) => s?.id === "bow")) { const g = Object.create(GameState.prototype) as GameState; g.data = d; g.addItem("bow", 1); g.addItem("Arrow", STARTING_ARROWS); } }
    d.lore ??= { tier: { ...START_LORE }, fails: {}, studied: {} };
    d.wx ??= 0; d.wy ??= 0; d.entry ??= ""; d.lastTerrain ??= HOME_TERRAIN; d.screens ??= {};
    return d;
  }

  // ---- inventory ----
  get selectedItem(): Slot | null { return this.data.slots[this.data.selected]; }

  count(id: string) { return this.data.slots.reduce((n, s) => n + (s && s.id === id ? s.qty : 0), 0); }

  /** Add items, stacking where possible. Returns how many did not fit. */
  addItem(id: string, qty: number, q?: number): number {
    const def = ITEMS[id];
    const stacks = def && def.kind !== "tool";
    if (stacks) {
      for (const s of this.data.slots) {
        if (qty <= 0) break;
        if (s && s.id === id && s.q === q && s.qty < STACK_MAX) { const add = Math.min(qty, STACK_MAX - s.qty); s.qty += add; qty -= add; }
      }
    }
    for (let i = 0; i < this.data.slots.length && qty > 0; i++) {
      if (!this.data.slots[i]) { const add = stacks ? Math.min(qty, STACK_MAX) : 1; this.data.slots[i] = q ? { id, qty: add, q } : { id, qty: add }; qty -= add; }
    }
    return qty;
  }

  /** Take up to qty of an item. Returns how many were taken. */
  removeItem(id: string, qty: number): number {
    let taken = 0;
    const s = this.data.slots;
    for (let i = s.length - 1; i >= 0 && taken < qty; i--) {
      const sl = s[i];
      if (sl && sl.id === id) { const n = Math.min(sl.qty, qty - taken); sl.qty -= n; taken += n; if (sl.qty <= 0) s[i] = null; }
    }
    return taken;
  }

  swapSlots(a: number, b: number) {
    const s = this.data.slots; [s[a], s[b]] = [s[b], s[a]];
  }

  static fresh(): SaveData {
    return {
      seed: Math.floor(Math.random() * 1e9),
      year: 1, month: 0, day: 1, clock: 0.5,
      fatigue: 0,
      aretai: { ...START_ARETAI },
      slots: GameState.startingSlots(),
      selected: 0,
      jarWater: JAR_CAPACITY,
      cleared: [],
      ground: {},
      treeHits: {},
      scene: "House", px: 6 * 16 + 8, py: 5 * 16 + 8,
      tendedHearthDay: "",
      goats: START_GOATS.map((g) => ({ ...g })),
      manger: 2, trough: 2, hiveDay: -1,
      wx: 0, wy: 0, entry: "", lastTerrain: HOME_TERRAIN, screens: {},
      archeryXp: 0, name: "", look: { tunic: "#e9e1cf", hair: "#4a3324", skin: "#c98e62" }, birth: null, health: 4, stealth: 4, bowGiven: true, lifeThread: START_LIFE_THREAD, farmPicked: {}, npc: {}, stranger: null, tools: {}, smithJob: null, favor: {}, currencies: { ...START_CURRENCIES }, devotion: {}, prayedDay: -1, offered: {}, knownByName: {}, deerDebt: 0, wildOaks: 0, arts: [], blessing: null, hostedDay: -99, anchors: {}, caves: {}, cave: { key: "", level: 1 }, torchLit: false, myth: {}, jarSpring: false, vat: { repaired: false, must: 0, q: 1, sealed: -1 }, vines: {}, cuttings: {}, met: {}, placed: [], spearAt: null, requests: [], rumors: [], reqSeq: 0, askedReq: {}, askedRumor: {}, olives: {}, vitality: 24, meal: {}, dishes: [], fest: {}, songs: [], songUsed: {}, songBuff: {}, tir: { step: 0, ev: {}, base: {}, doneDay: -1, spot: 0, met: false, said: -1 }, divine: { gifts: [], troubles: [], powerUsed: {}, chosen: {}, charges: {}, wrathDay: {}, day: {}, quests: {} }, weather: "clear", signs: {},
      lore: { tier: { ...START_LORE }, fails: {}, studied: {} },
      crops: {}, silver: START_SILVER, outbox: [], orders: [], vineYear: 0,
    };
  }

  // ---- calendar and clock ----
  get month() { return MONTHS[this.data.month]; }
  get daylight() { return this.month.daylight; }
  get night() { return 24 - this.daylight; }
  /** Days since the start of year 1 (1 = Hekatombaion 1, Year 1). */
  get dayNumber() {
    const yearDays = MONTHS.reduce((n, m) => n + m.days, 0);
    return (this.data.year - 1) * yearDays + MONTHS.slice(0, this.data.month).reduce((n, m) => n + m.days, 0) + this.data.day;
  }
  locationLabel(): string {
    if (this.data.scene === "House") return "Your hut";
    if (this.data.scene === "Farm") return "Your homestead · Cultivated Farmlands";
    if (this.data.scene === "Village") return "The village · 1 screen from home";
    if (this.data.scene === "Gym") return "The gymnasion · east of the village";
    if (this.data.scene === "Cave") { const c = this.data.caves[this.data.cave.key]; return `A ${c?.type ?? ""} cave · level ${this.data.cave.level}${this.data.torchLit ? " · torchlit" : " · in darkness"}`; }
    const rec = this.data.screens[`${this.data.wx},${this.data.wy}`];
    const dist = Math.abs(this.data.wx) + Math.abs(this.data.wy);
    return `${rec ? terrain(rec.terrain).name : "The wild"} · ${dist} screen${dist === 1 ? "" : "s"} from home`;
  }
  /** Your understanding of a kind of thing: 0 Unknown, 1 Basics, 2 Deep, 3 Full. */
  get archery() { return Math.min(ARCHERY.maxLevel, Math.floor(this.data.archeryXp / ARCHERY.perLevel)); }
  /** How well a villager knows you, -12 to +12. */
  rel(id: string) { return this.data.npc[id]?.rel ?? 0; }
  npcRec(id: string) { return (this.data.npc[id] ??= { rel: 0, talked: -1, gifted: -1 }); }
  favor(god: string) { return this.data.favor[god] ?? 0; }
  /** Change a god's favor, up to an optional cap. Reaching +4 ("known by name") the first time gives Ambrosia. */
  addFavor(god: string, d: number, cap = 12): number {
    const before = this.favor(god);
    let after = before + d;
    if (d > 0) after = Math.min(after, Math.max(before, cap));
    after = Math.max(-12, Math.min(12, after));
    this.data.favor[god] = after;
    if (after >= 4 && !this.data.knownByName[god]) { this.data.knownByName[god] = true; this.data.currencies.Ambrosia++; this.say(`${god} knows you by name now. (+1 Ambrosia)`); }
    if (favorLabel(after) !== favorLabel(before)) this.say(`${god}: ${favorLabel(after).toLowerCase()} (favor ${after >= 0 ? "+" : ""}${after}).`);
    this.checkChosen(god);
    return after;
  }
  /** At +10 a god's own Aretai rises by one while you stay Chosen; at -10 it falls by one while you stay Accursed. */
  checkChosen(god: string) {
    const def = DIVINE[god]; if (!def) return;
    const f = this.favor(god), want = f >= 10 ? 1 : f <= -10 ? -1 : 0, had = this.data.divine.chosen[god] ?? 0;
    if (want === had) return;
    const a = def.aretai;
    this.data.aretai[a] = Math.max(0, Math.min(12, (this.data.aretai[a] ?? 0) - had + want));
    if (want) this.data.divine.chosen[god] = want; else delete this.data.divine.chosen[god];
    this.essenceMax = essencePools(this.data.aretai);
    if (want > 0) this.say(`${god} has chosen you. Your ${a} rises to ${this.data.aretai[a]} while you keep their favor.`);
    else if (want < 0) this.say(`${god} has cursed you. Your ${a} falls to ${this.data.aretai[a]} until you make amends.`);
    else this.say(`${god}'s ${had > 0 ? "choice" : "curse"} has passed. Your ${a} is ${this.data.aretai[a]} again.`);
  }
  /**
   * The gods at dawn: favor drifts back toward nothing; gifts and troubles are laid in the gods' domains for you
   * to find; and the protections and dangers of +12 and -12 that work at home do their work.
   */
  divineDawn(): string[] {
    const notes: string[] = [], dv = this.data.divine, today = this.dayNumber;
    for (const god of ALL_GODS) {
      const f = this.favor(god);
      // Drift: every DRIFT_DAYS days (on average) a step back toward 0, either way.
      if (f !== 0 && Math.random() < 1 / DRIFT_DAYS) { this.data.favor[god] = f - Math.sign(f); this.checkChosen(god); }
      const p = giftChance(f);
      if (p && Math.random() < p) {
        if (f > 0 && !dv.gifts.some((g) => g.god === god)) {
          const def = DIVINE[god], treasure = f >= 10 && Math.random() < 0.25;
          const [item, qty] = treasure ? def.treasure : def.gifts[Math.floor(Math.random() * def.gifts.length)];
          dv.gifts.push({ god, item, qty, q: f >= 10 ? 3 : f >= 8 ? 2 : 1 });
        }
        if (f < 0 && !dv.troubles.includes(god)) dv.troubles.push(god);
      }
    }
    if (this.doomed("Demeter")) {
      const live = Object.entries(this.data.crops).filter(([, c]) => !c.withered);
      if (live.length) { live[Math.floor(Math.random() * live.length)][1].withered = true; notes.push("Famine: Demeter takes another of your crops in the night."); }
    }
    if (this.doomed("Athena")) {
      const known = Object.entries(this.data.lore.tier).filter(([, t]) => t > 0);
      if (known.length) { const [id] = known[Math.floor(Math.random() * known.length)]; this.data.lore.tier[id]--; notes.push("You wake having forgotten something you knew. Athena's owl hoots once, far off."); }
    }
    if (this.doomed("Aphrodite")) { for (const id of Object.keys(VILLAGERS)) this.npcRec(id).rel -= 1; notes.push("The village thinks less of you again today (-1 with everyone)."); }
    void today;
    return notes;
  }

  /** +12: thorough protection in the god's domain. */
  warded(god: string) { return this.favor(god) >= 12; }
  /** -12: genuine danger there. */
  doomed(god: string) { return this.favor(god) <= -12; }
  /** Favor tier, -4 to +4: what boons and penalties scale by. */
  boon(god: string) {
    const f = this.favor(god) + this.mealFavor(god) + (this.songOn(`favor:${god}`) ? 2 : 0);
    let b = boonOf(f);
    const o = this.data.omen;
    if (o && o.day === this.dayNumber && o.god === god) b += o.good ? 1 : -1; // today's omen, whether you read it or not
    for (const [id, g] of Object.entries(MAGIC_FINDS)) if (g === god && this.count(id) > 0) b += 1; // a thunderstone, a Heliad's tear
    return Math.max(-4, Math.min(4, b));
  }
  /** Is a sign's help running? (Seen in the last few days, and known well enough to read.) */
  signActive(effect: SignEffect) {
    return Object.values(SIGNS).some((s) => s.effect === effect && (this.data.lore.tier[s.id] ?? 0) >= 1 && this.data.signs[s.id] !== undefined && this.dayNumber - this.data.signs[s.id] < SIGN_DAYS);
  }
  /** Was a sign seen (and understood) this year? */
  signThisYear(id: string) { const d = this.data.signs[id]; return d !== undefined && this.yearOf(d) === this.data.year && (this.data.lore.tier[id] ?? 0) >= 1; }
  yearOf(day: number) { const yd = MONTHS.reduce((n, m) => n + m.days, 0); return Math.floor((day - 1) / yd) + 1; }
  earn(c: Currency, n = 1, why = "") { this.data.currencies[c] += n; this.say(`+${n} ${c}${why ? `: ${why}` : ""}.`); }
  blessed(id: string) { return !!this.data.blessing && this.data.blessing.id === id && this.dayNumber <= this.data.blessing.until; }
  toolLevel(id: string) { return this.data.tools[id] ?? 1; }
  lore(id: string) { return this.data.lore.tier[id] ?? 0; }
  get dateKey() { return `${this.data.year}-${this.data.month}-${this.data.day}`; }

  /** Real seconds per clock hour, so daylight always lasts DAYLIGHT_REAL_SECONDS. */
  get secondsPerClockHour() { return DAYLIGHT_REAL_SECONDS / this.daylight; }

  get isDay() { return this.data.clock < this.daylight; }

  /** 1..12 during daylight (Greek hours), or null at night. */
  get greekHour(): number | null {
    if (!this.isDay) return null;
    return Math.min(12, Math.floor(this.data.clock / (this.daylight / 12)) + 1);
  }

  get patron() { const h = this.greekHour; return h ? WHEEL[h - 1] : null; }

  /** 1..3 at night. */
  get watch(): number {
    const into = this.data.clock - this.daylight;
    return Math.min(3, Math.floor(into / (this.night / 3)) + 1);
  }

  get collapseClock() { return this.daylight + (this.night / 3) * NIGHT_WATCHES_PLAYABLE; }

  get moon() { return moonPhase(this.data.day); }

  timeLabel(): string {
    const h = this.greekHour;
    if (h) {
      const tag = h === 1 ? " · dawn" : h === 6 ? " · midday" : h === 12 ? " · dusk" : "";
      return `Hour ${h} of 12${tag}`;
    }
    return ["First", "Second", "Third"][this.watch - 1] + " watch of the night";
  }

  dateLabel(): string {
    return `${this.month.name} ${this.data.day} · ${this.month.season} · Year ${this.data.year}`;
  }

  /** Advance the clock by real seconds. Returns true if the player has collapsed. */
  tick(realSeconds: number): boolean {
    const hours = realSeconds / this.secondsPerClockHour;
    this.data.clock += hours;
    this.addFatigue(hours * 1.0); // being awake wears on you slowly
    // Essence refills from empty in ESSENCE.refillSeconds, slower the wearier you are.
    const rate = (1 - ESSENCE.tiredSlowdown * (this.data.fatigue / 100)) / ESSENCE.refillSeconds;
    for (const k of Object.keys(this.essence) as (keyof Essence)[]) {
      this.essence[k] = Math.min(this.essenceMax[k], this.essence[k] + this.essenceMax[k] * rate * realSeconds);
    }
    return this.data.clock >= this.collapseClock;
  }

  addFatigue(n: number) { this.data.fatigue = Math.max(0, Math.min(100, this.data.fatigue + n)); }
  get exhausted() { return this.data.fatigue >= 100; }

  spend(cost: Partial<Essence>): boolean {
    for (const k of Object.keys(cost) as (keyof Essence)[]) {
      if ((this.essence[k] ?? 0) < (cost[k] ?? 0)) return false;
    }
    for (const k of Object.keys(cost) as (keyof Essence)[]) this.essence[k] -= cost[k] ?? 0;
    return true;
  }

  /** Discount when the work belongs to the current hour's Aretai. */
  hourDiscount(aretai: string): number {
    return this.patron?.aretai === aretai ? 0.75 : 1;
  }

  /** Restful hours from now to dawn: only from about two hours before dusk. */
  get sleepHours() { return Math.max(0, 24 - Math.max(this.data.clock, this.daylight - 2)); }

  /** Sleep until dawn. Returns hours slept and fatigue recovered. */
  sleep(collapsed = false, rough = false) {
    const hoursSlept = this.sleepHours;
    const credit = collapsed || rough ? 0.5 : 1; // a collapse, or the hard ground by a campfire: half the rest
    // Hera keeps the house: at +12 sleep there restores you wholly; at -12 it gives you half the rest.
    const hera = !collapsed && !rough && this.data.scene === "House" ? (this.warded("Hera") ? 100 : this.doomed("Hera") ? 0.5 : 1) : 1;
    const recovered = hera === 100 ? this.data.fatigue : Math.min(this.data.fatigue, hoursSlept * SLEEP_RECOVERY_PER_HOUR * credit * hera * (this.signActive("rest") ? 1.25 : 1));
    this.data.fatigue -= recovered;
    const v0 = this.data.vitality;
    this.heal((hoursSlept / 8) * this.vitalityMax * credit * (hera === 100 ? 2 : hera) * (1 + 0.15 * this.boon("Apollo")));
    const healed = this.data.vitality - v0;
    this.data.clock = 0;
    this.data.day += 1;
    if (this.data.day > this.month.days) {
      this.data.day = 1;
      this.data.month = (this.data.month + 1) % 12;
      if (this.data.month === 0) this.data.year += 1;
    }
    this.essence = { ...this.essenceMax };
    const notes: string[] = [];
    // Requests not met in time lapse, and the asker is a little let down.
    for (const q of [...this.data.requests]) if (this.dayNumber > q.due) {
      this.data.requests.splice(this.data.requests.indexOf(q), 1);
      if (!this.warded("Aphrodite")) this.npcRec(q.from).rel -= 1;
      notes.push(`${VILLAGERS[q.from].name}'s request lapsed${this.warded("Aphrodite") ? "" : ` (-1 with ${VILLAGERS[q.from].name})`}.`);
      if (q.kind === "deliver") this.removeItem("Parcel", 1);
    }
    // Crops grow on nights their soil is watered, and wither after too many dry ones or out of season.
    let withered = 0;
    for (const [k, c] of Object.entries(this.data.crops)) {
      if (c.withered) continue;
      const def = CROPS[c.id];
      if (!def.seasons.includes(this.month.season)) { c.withered = true; withered++; continue; }
      const ripeAt = c.picks > 0 && def.regrow ? def.regrow : def.days;
      if (c.growth >= ripeAt) continue; // ripe: it waits for you
      if (this.data.ground[k] === "wet" || this.warded("Demeter")) { c.growth++; c.dryStreak = 0; } // Demeter's protection waters them
      else { c.dryNights++; c.dryStreak++; if (c.dryStreak >= DRY_LIMIT) { c.withered = true; withered++; } }
    }
    if (withered) notes.push(`${withered} planting${withered > 1 ? "s" : ""} withered.`);
    notes.push(...this.divineDawn());
    // The miller's cart calls at dawn: it takes what you left in the pithos and brings what you ordered.
    if (this.data.outbox.length) {
      let earned = 0;
      const hermes = Math.max(0.5, 1 + 0.05 * this.boon("Hermes")); // Hermes' favor in the market
      for (const s of this.data.outbox) earned += Math.round((ITEMS[s.id].value ?? 0) * QUALITY_MULT[s.q ?? 1] * hermes) * s.qty;
      this.data.silver += earned; this.data.outbox = [];
      notes.push(`The miller's cart took your goods and left ${money(earned)} in the pithos.`);
    }
    if (this.data.orders.length) {
      for (const o of this.data.orders) this.addItem(o.id, o.qty);
      notes.push(`Seeds arrived: ${this.data.orders.map((o) => `${o.qty} ${ITEMS[o.id].name}`).join(", ")}.`);
      this.data.orders = [];
    }
    for (const k of Object.keys(this.data.ground)) if (this.data.ground[k] === "wet") this.data.ground[k] = "tilled";
    // The new day's weather. Rain waters every tilled bed for you.
    this.data.weather = this.data.nextWeather ?? rollWeather(this.month.season, 1 + Math.floor(Math.random() * 12));
    this.data.nextWeather = rollWeather(this.month.season, 1 + Math.floor(Math.random() * 12));
    if (this.data.weather === "rain") {
      for (const k of Object.keys(this.data.ground)) if (this.data.ground[k] === "tilled") this.data.ground[k] = "wet";
      notes.push("Rain is falling: the fields are watered.");
    } else if (this.data.weather !== "clear") notes.push(`${WEATHER_WORD[this.data.weather]} today.`);
    // Dreams, about one night in five. Some circle your hidden doom; a god who knows you well may stand by your bed.
    if (!collapsed && Math.random() < 0.2) {
      this.data.dreamDay = this.dayNumber;
      const b = this.data.birth;
      const best = Object.entries(this.data.favor).filter(([g]) => OMEN_MEANING[g]).sort((x, y) => y[1] - x[1])[0];
      if (b && Math.random() < 0.35) notes.push(MOROS_DREAMS[b.moros[0]] ?? DREAMS[0]);
      else if (best && best[1] >= 4 && Math.random() < 0.5) {
        this.data.omen = { day: this.dayNumber, god: best[0], good: true, noticed: true, read: true };
        notes.push(`You dream of ${best[0]} standing at the foot of your bed, saying nothing, smiling. ${OMEN_MEANING[best[0]][0]}`);
      } else notes.push(DREAMS[Math.floor(Math.random() * DREAMS.length)]);
    }
    // Artemis wants her share of every deer.
    if (this.data.deerDebt > 0) {
      const n = this.data.deerDebt; this.data.deerDebt = 0;
      this.data.favor.Artemis = Math.max(-12, (this.data.favor.Artemis ?? 0) - n); this.data.currencies.Hubris += n;
      notes.push(`Artemis is angered: you took her deer and gave her no share. (Artemis -${n}, +${n} Hubris)`);
    }
    if (this.data.smithJob && this.dayNumber === this.data.smithJob.ready) notes.push("Lykos the smith has finished your tool. Collect it at the smithy.");
    // The goats eat and drink in the night; a goat that goes without gives no milk.
    for (const g of this.data.goats) {
      if (this.data.manger >= 1 && this.data.trough >= 1) { this.data.manger--; this.data.trough--; g.fed = true; }
      else if (this.warded("Hera")) { g.fed = true; } // Hera keeps the household fed
      else { g.fed = false; g.affection = Math.max(0, g.affection - 1); notes.push(`${g.name} went hungry or thirsty in the night.`); }
    }
    return { hoursSlept, recovered, healed, notes };
  }

  say(text: string) { this.messages.push({ text, t: 0 }); }

  // ---- saving ----
  save(): boolean {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); return true; } catch { return false; }
  }
  static load(): SaveData | null {
    try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) as SaveData : null; } catch { return null; }
  }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* storage unavailable */ } }
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
