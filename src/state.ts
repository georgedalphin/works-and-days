import { BEASTS, type Beast } from "./herd";
import { WONDERS, DISTORTIONS, type WonderData } from "./wonders";
import { COMFORT_KIND } from "./home";
import { MATERIALS } from "./circlets";
const CROWN_GOD: Record<string, string> = Object.fromEntries(MATERIALS.map((m) => [m.id, m.god]));
const WREATH_COMFORT: Record<string, number> = Object.fromEntries(MATERIALS.map((m) => [m.id, m.wreath.comfort]));
import { WEAR, gearMods, type Worn, type WearSlot } from "./gear";
import { GRACES } from "./graces";
import { TRADE_WORK, NEAR_FORAGE, CHORE_NAME, type Friend } from "./friends";
import type { SiteRec } from "./sites";
import { VILLAGERS } from "./village";
import type { Request, Rumor } from "./quests";
import { ALL_GODS, DIVINE, boonOf, giftChance, DRIFT_DAYS } from "./divine";
import { START_CURRENCIES, type Currency, favorLabel } from "./gods";
import { SIGNS, SIGN_DAYS, MAGIC_FINDS, type SignEffect, DREAMS, MOROS_DREAMS, OMEN_MEANING } from "./omens";
import {
  MONTHS, WHEEL, START_ARETAI, essencePools, ESSENCE, DAYLIGHT_REAL_SECONDS, rollWeather, WEATHER_WORD, type Weather,
  NIGHT_WATCHES_PLAYABLE, SLEEP_RECOVERY_PER_HOUR, moonPhase,
  ITEMS, money, STACK_MAX, JAR_CAPACITY, INVENTORY_SIZE, MANGER_MAX, TROUGH_MAX,
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
  /** Part of a citadel or an isle (its id in G.data.sites); for a coast reached from the sea, the corner the sea fills. */
  site?: string; corner?: [number, number];
  /** A coast's sea along each side, tile by tile ("0" land, "1" sea; one character for a whole side), so neighbours join up. */
  shore?: Record<"N" | "S" | "E" | "W", string>;
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
  /** The waterskin's drinks (0-4); when you last drank from it (absolute hour); the day you last used the healer's kit. */
  skin?: number; drankAt?: number; kitDay?: number;
  /** Taming (Artemis' grace): days you've fed each kind of creature from your hand, and the last day you did. */
  tame?: Record<string, { n: number; day: number }>;
  /** Your animal companion, if you have one: what it is, its name, and where you told it to wait. */
  /** People who have joined you (friends.ts), and each village household's big quest: when you took it on, the deed count then, done. */
  friends?: Friend[];
  folkQuest?: Record<string, { day: number; base?: number; done?: boolean }>;
  /** Pharmakeia: whether you've been taught the Art, the herbs whose aspects you've found by trying them, the remedies you've made,
   *  the day you last gathered each herb (fresh herbs work better), your poisoned shots left, and a draught's Aretai while it lasts. */
  pharm?: { taught: boolean; tried: string[]; made: string[] };
  fresh?: Record<string, number>;
  venom?: { n: number; tier: number };
  draught?: { gains: [string, number][]; until: number };
  /** The Rural Arts' blessings running (art id: the last day it holds); where you last greeted the dawn, and how many mornings running. */
  blessings?: Record<string, number>;
  dawnSpot?: string; dawnStreak?: { n: number; last: number };
  /** Wreaths and Crowns: the crown on your head and the wreath over your door (materials, and when they wilt, in absolute hours);
   *  whether a weaver taught you; the day each tree last gave a sprig. */
  crown?: { mats: string[]; until: number; gains: [string, number][] } | null;
  wreath?: { mats: string[]; until: number } | null;
  weaveTaught?: boolean;
  sprigs?: Record<string, number>;
  companion?: { kind: string; name: string; since: number; riding?: boolean; stay?: { scene: string; wx: number; wy: number; x: number; y: number } } | null;
  cleared: string[]; // "x,y" tiles cleared on the homestead
  ground: Record<string, "tilled" | "wet">; // worked soil on the homestead
  treeHits: Record<string, number>;
  scene: "Farm" | "House" | "Wild" | "Village" | "Cave" | "Gym" | "Labyrinth";
  /** A festival footrace waiting to be run at the gymnasion (the festival's id). */
  raceFor?: string;
  wx: number; wy: number; // the wilderness screen, in screens from home (0,0)
  /** Where along the side you walk in (tile x for N/S, tile y for E/W), so you arrive at the gap you left by. */
  entryAt?: number | null;
  entry: "" | "N" | "S" | "E" | "W" | "C" | "U" | "D"; // D: down into the Labyrinth // C: out of a cave mouth; U: up from a deeper cave level // the side of the next map the player walks in from
  lastTerrain: number; // terrain of the screen the player just left
  screens: Record<string, ScreenRec>;
  px: number; py: number;
  tendedHearthDay: string;
  goats: Goat[];
  manger: number; // fodder in the goats' manger
  /** Working animals: hound, ox, donkey, horse (herd.ts). */
  beasts: Beast[];
  /** Thaumatapoiia: the workings you know, those bound into your things (by item id), and a work in progress. */
  wonders: WonderData;
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
  /** What you're wearing, by slot (gear.ts). */
  worn: Worn;
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
  /** Citadels and isles found: id → what is known of them. */
  sites: Record<string, SiteRec>;
  /** What the Pythia has foretold: places not yet found ("x,y" of a screen in them, and her words). */
  foretold?: { key: string; text: string }[];
  /** Rowing on from the open sea: the next new screen is sea too. */
  fromSea?: boolean;
  anchors: { delphi?: string; knossos?: string; crete?: string; knossosAt?: string; spring?: string; satyrs?: string; cave?: string; tirShrine?: string; tirGrave?: string };
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
  /** The crown wilted: the player's look must be redrawn. */
  crownChanged?: boolean;
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
      this.data.meal.aretai = { ar: effect.ar, n: effect.n, until: this.absHour + effect.hours * (this.crownHas("barley") ? 1.5 : 1), dish };
    } else if (effect.god) this.data.meal.favor = { god: effect.god, n: effect.n, until: this.absHour + effect.hours * (this.crownHas("barley") ? 1.5 : 1), dish };
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
    if (this.data.draught && this.data.draught.until <= now) { out.push("The heat of the hero's draught goes out of you."); this.endDraught(); }
    if (this.data.crown && this.data.crown.until <= now) { out.push("Your crown has wilted. Burn it with thanks, or give it back to the earth."); this.takeOffCrown(); this.crownChanged = true; }
    if (this.data.wreath && this.data.wreath.until <= now) { out.push("The wreath over your door has withered."); this.data.wreath = null; }
    return out;
  }

  /** A draught that strengthens Aretai for a while (a new one replaces the old). */
  drinkDraught(gains: [string, number][], hours: number) {
    this.endDraught();
    for (const [ar, n] of gains) this.data.aretai[ar] = (this.data.aretai[ar] ?? 3) + n;
    this.data.draught = { gains, until: this.absHour + hours };
  }
  endDraught() {
    const d = this.data.draught; if (!d) return;
    for (const [ar, n] of d.gains) this.data.aretai[ar] = (this.data.aretai[ar] ?? 3) - n;
    this.data.draught = undefined;
  }
  /** Pharmakeia's record, made on first use. */
  get pharm() { return (this.data.pharm ??= { taught: false, tried: [], made: [] }); }
  /** Was this herb gathered today? */
  isFresh(id: string) { return (this.data.fresh ?? {})[id] === this.dayNumber; }
  markFresh(id: string) { (this.data.fresh ??= {})[id] = this.dayNumber; }

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
    d.manger ??= 2; d.beasts ??= []; d.wonders ??= { known: [], on: {} }; d.trough ??= 2; d.hiveDay ??= -1;
    d.crops ??= {}; d.silver ??= (d as SaveData & { tally?: number }).tally ?? START_SILVER; d.outbox ??= []; d.orders ??= []; d.vineYear ??= 0;
    if (!d.seedsGiven) { d.seedsGiven = true; const g = Object.create(GameState.prototype) as GameState; g.data = d; for (const [c, n] of START_SEEDS) g.addItem(seedId(c), n); }
    d.archeryXp ??= 0; d.name ??= ""; d.look ??= { tunic: "#e9e1cf", hair: "#4a3324", skin: "#c98e62" }; d.birth ??= null; d.health ??= 4; d.stealth ??= 4; d.lifeThread ??= START_LIFE_THREAD; d.farmPicked ??= {}; d.npc ??= {}; d.stranger ??= null; d.tools ??= {}; d.smithJob ??= null; d.favor ??= {}; d.currencies ??= { ...START_CURRENCIES }; d.devotion ??= {}; d.prayedDay ??= -1; d.offered ??= {}; d.knownByName ??= {}; d.deerDebt ??= 0; d.wildOaks ??= 0; d.arts ??= []; d.blessing ??= null; d.hostedDay ??= -99; d.anchors ??= {}; d.sites ??= {}; d.caves ??= {}; d.cave ??= { key: "", level: 1 }; d.torchLit ??= false; d.myth ??= {}; d.jarSpring ??= false; d.vat ??= { repaired: false, must: 0, q: 1, sealed: -1 }; d.vines ??= {}; d.cuttings ??= {}; d.met ??= {}; d.placed ??= []; d.worn ??= { body: "Chiton" }; d.spearAt ??= null; d.requests ??= []; d.rumors ??= []; d.reqSeq ??= 0; d.askedReq ??= {}; d.askedRumor ??= {}; d.olives ??= {}; d.vitality ??= 6 * Math.max(2, d.health ?? 4); d.meal ??= {}; d.dishes ??= []; d.songs ??= []; d.fest ??= {}; d.songUsed ??= {}; d.songBuff ??= {}; d.tir ??= { step: 0, ev: {}, base: {}, doneDay: -1, spot: 0, met: false, said: -1 }; d.divine ??= { gifts: [], troubles: [], powerUsed: {}, chosen: {}, charges: {}, wrathDay: {}, day: {}, quests: {} }; d.divine.quests ??= {};
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
  /** Your gear, added up (Aiolos, Stealth, Intimidation, weather...). */
  get gear() { return gearMods(this.data.worn); }
  /** Stealth now: your Resources' Stealth, less heavy bronze, more under a cloak in the wild. */
  stealthNow(wild: boolean) { const g = this.gear; return Math.max(0, this.data.stealth + g.stealth + (wild ? g.wildStealth : 0)); }
  /** Put on something from your pack (what was there before goes back in the pack). Returns why not, or null. */
  wear(id: string): string | null {
    const d = WEAR[id]; if (!d) return "You can't wear that.";
    if (this.count(id) <= 0) return "You don't have that.";
    const old = this.data.worn[d.slot];
    this.removeItem(id, 1);
    if (old && this.addItem(old, 1) > 0) { this.addItem(id, 1); return "Your pack is too full to take off what you're wearing."; }
    this.data.worn[d.slot] = id;
    return null;
  }
  /** Take something off, into your pack. */
  unwear(slot: WearSlot): string | null {
    const id = this.data.worn[slot]; if (!id) return null;
    if (this.addItem(id, 1) > 0) return "Your pack is full.";
    this.data.worn[slot] = null;
    return null;
  }
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
    // What the pack can't hold goes into the panniers of a donkey walking with you.
    const donkey = qty > 0 ? this.data.beasts?.find((b) => b.kind === "donkey" && b.follow && b.pack) : undefined;
    if (donkey) {
      const pk = donkey.pack!;
      if (stacks) for (const s of pk) { if (qty <= 0) break; if (s && s.id === id && s.q === q && s.qty < STACK_MAX) { const add = Math.min(qty, STACK_MAX - s.qty); s.qty += add; qty -= add; } }
      for (let i = 0; i < pk.length && qty > 0; i++) if (!pk[i]) { const add = stacks ? Math.min(qty, STACK_MAX) : 1; pk[i] = q ? { id, qty: add, q } : { id, qty: add }; qty -= add; }
      if (qty <= 0) this.toPanniers = donkey.name;
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
      scene: "House", px: 9 * 16 + 8, py: 7 * 16 + 8,
      tendedHearthDay: "",
      goats: START_GOATS.map((g) => ({ ...g })),
      manger: 2, trough: 2, beasts: [], wonders: { known: [], on: {} }, hiveDay: -1,
      wx: 0, wy: 0, entry: "", lastTerrain: HOME_TERRAIN, screens: {},
      archeryXp: 0, name: "", look: { tunic: "#e9e1cf", hair: "#4a3324", skin: "#c98e62" }, birth: null, health: 4, stealth: 4, bowGiven: true, lifeThread: START_LIFE_THREAD, farmPicked: {}, npc: {}, stranger: null, tools: {}, smithJob: null, favor: {}, currencies: { ...START_CURRENCIES }, devotion: {}, prayedDay: -1, offered: {}, knownByName: {}, deerDebt: 0, wildOaks: 0, arts: [], blessing: null, hostedDay: -99, anchors: {}, sites: {}, caves: {}, cave: { key: "", level: 1 }, torchLit: false, myth: {}, jarSpring: false, vat: { repaired: false, must: 0, q: 1, sealed: -1 }, vines: {}, cuttings: {}, met: {}, placed: [], worn: { body: "Chiton" }, spearAt: null, requests: [], rumors: [], reqSeq: 0, askedReq: {}, askedRumor: {}, olives: {}, vitality: 24, meal: {}, dishes: [], fest: {}, songs: [], songUsed: {}, songBuff: {}, tir: { step: 0, ev: {}, base: {}, doneDay: -1, spot: 0, met: false, said: -1 }, divine: { gifts: [], troubles: [], powerUsed: {}, chosen: {}, charges: {}, wrathDay: {}, day: {}, quests: {} }, weather: "clear", signs: {},
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
    if (this.data.scene === "Labyrinth") return `The Labyrinth beneath Knossos${this.data.torchLit ? " · torchlit" : " · in darkness"}`;
    if (this.data.scene === "Cave") { const c = this.data.caves[this.data.cave.key]; return `A ${c?.type ?? ""} cave · level ${this.data.cave.level}${this.data.torchLit ? " · torchlit" : " · in darkness"}`; }
    const rec = this.data.screens[`${this.data.wx},${this.data.wy}`];
    const dist = Math.abs(this.data.wx) + Math.abs(this.data.wy);
    const site = rec?.site ? this.data.sites[rec.site] : undefined;
    const where = site ? `${site.name[0].toUpperCase()}${site.name.slice(1)}${site.kind === "isle" ? "" : `, ${terrain(rec!.terrain).name.toLowerCase()}`}` : rec?.terrain === 6 ? "The open sea" : rec ? terrain(rec.terrain).name : "The wild";
    return `${where} · ${dist} screen${dist === 1 ? "" : "s"} from home`;
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
    const gr = GRACES[god];
    if (gr) for (const [t, g] of [[4, gr.at4], [7, gr.at7]] as [number, { name: string; desc: string }][]) if (before < t && after >= t) this.say(`${god} grants you a grace: ${g.name}. ${g.desc}`);
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
    const f = this.favor(god) + this.mealFavor(god) + (this.songOn(`favor:${god}`) ? 2 : 0) + (this.crownGods.includes(god) ? 1 : 0); // a crown carries its god's blessing
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
  blessed(id: string) {
    if (id === "dawn" && !this.isDay) return false; // the dawn's blessing lasts until sunset
    return (this.data.blessings?.[id] ?? -1) >= this.dayNumber || (!!this.data.blessing && this.data.blessing.id === id && this.dayNumber <= this.data.blessing.until);
  }
  bless(id: string, days: number) { (this.data.blessings ??= {})[id] = this.dayNumber + days - 1; }
  /** Is a crown of this material on your head (and not yet wilted)? A wreath of it over your door? */
  crownHas(m: string) { const c = this.data.crown; return !!c && c.until > this.absHour && c.mats.includes(m); }
  wreathHas(m: string) { const w = this.data.wreath; return !!w && w.until > this.absHour && w.mats.includes(m); }
  /** Put on a crown (a new one replaces the old, whose Aretai go with it). */
  wearCrown(mats: string[], gains: [string, number][], hours: number) {
    this.takeOffCrown();
    for (const [ar, n] of gains) this.data.aretai[ar] = (this.data.aretai[ar] ?? 3) + n;
    this.data.crown = { mats, gains, until: this.absHour + hours };
  }
  takeOffCrown() {
    const c = this.data.crown; if (!c) return;
    for (const [ar, n] of c.gains) this.data.aretai[ar] = (this.data.aretai[ar] ?? 3) - n;
    this.data.crown = null;
  }
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

  /** Apollo's prophetic dreams: tomorrow's weather, and sometimes the way to a place you haven't found. */
  apolloDream(): string {
    const w = this.data.nextWeather, sky: Record<string, string> = { clear: "a clear sky, and larks", rain: "rain on the thatch", cloudy: "a sky like grey wool", wind: "wind in the olives", mist: "mist in the hollows", storm: "thunder" };
    let s = `You dreamed of ${sky[w ?? "clear"] ?? "tomorrow"}: tomorrow's weather, Apollo tells you.`;
    const way = (k?: string) => { if (!k) return ""; const [x, y] = k.split(",").map(Number), ew = x > 0 ? "east" : x < 0 ? "west" : "", ns = y > 0 ? "south" : y < 0 ? "north" : ""; return [ns, ew].filter(Boolean).join("-") || "near"; };
    const a = this.data.anchors, found = (name: string) => !!this.data.sites[name];
    const unfound: string[] = [];
    if (a.delphi && !found("Delphi")) unfound.push(`a laurel tree and a voice from a cleft in the rock, far to the ${way(a.delphi)}`);
    if (a.crete && !found("Crete")) unfound.push(`a bull in a palace on an island, far over the sea to the ${way(a.crete)}`);
    if (a.cave && !this.data.screens[a.cave]) unfound.push(`a mouth in the hillside breathing cold air, to the ${way(a.cave)}`);
    if (unfound.length && Math.random() < 0.35) s += ` And you dreamed of ${unfound[Math.floor(Math.random() * unfound.length)]}.`;
    return s;
  }
  /** How comfortable the house is: one for each kind of furnishing in it (a table, a seat, a couch, a rug, a lamp...). */
  get homeComfort() {
    const kinds = new Set<string>();
    for (const p of this.data.placed) if (p.where === "house" && COMFORT_KIND[p.id]) kinds.add(COMFORT_KIND[p.id]);
    const fr = this.data.friends ?? [];
    const w = this.data.wreath, wreath = w && w.until > this.absHour ? w.mats.reduce((n, m) => n + (WREATH_COMFORT[m] ?? 0), 0) : 0; // a wreath over the door
    return kinds.size + (this.grace("Hera") >= 4 ? 2 : 0) + (this.spouse ? 2 : 0) + (fr.some((f) => f.role !== "follow" && f.chore === "hearth") ? 1 : 0) + wreath + (this.blessed("hearth") ? 3 : 0); // Hera keeps the house; a spouse makes it a home; Hestia's blessing
  }
  /** How many people will throw in their lot with you: your Phoenix, less 2. */
  get friendCap() { return Math.max(0, (this.data.aretai.Phoenix ?? 3) - 2); }
  get spouse() { return (this.data.friends ?? []).find((f) => f.role === "spouse"); }
  /** The household's work, done before you wake: by the people who live with you. */
  chores(notes: string[]) {
    // People of the road walk with you only a while, then the road calls them back.
    for (const f of [...(this.data.friends ?? [])]) if (f.from === "road" && f.role === "follow" && f.until !== undefined && this.dayNumber >= f.until) {
      this.data.friends = (this.data.friends ?? []).filter((x) => x !== f);
      notes.push(`${f.name} was gone at first light, back to the road, as wanderers go. ${f.female ? "She" : "He"} left a word for you with the morning: luck on your road.`);
    }
    for (const f of this.data.friends ?? []) {
      if (f.role === "follow") continue;
      const c = f.chore ?? (f.role === "spouse" ? "hearth" : "trade");
      const deliver = (id: string, n: number, what: string) => { const left = this.addItem(id, n); notes.push(left >= n ? `${f.name} ${what}, but your pack was too full to take it.` : `${f.name} ${what}: +${n - left} ${ITEMS[id].name.toLowerCase()}.`); };
      if (c === "fields") { let n = 0; for (const [k, v] of Object.entries(this.data.ground)) if (v === "tilled") { this.data.ground[k] = "wet"; n++; } notes.push(n ? `${f.name} watered the fields at first light (${n} plot${n > 1 ? "s" : ""}).` : `${f.name} looked over the fields: nothing needed water.`); }
      else if (c === "goats") { this.data.manger = MANGER_MAX; this.data.trough = TROUGH_MAX; for (const g of this.data.goats) g.affection = Math.min(10, g.affection + 1); notes.push(`${f.name} filled the manger and the trough, and saw to the goats.`); }
      else if (c === "forage") { const opts = NEAR_FORAGE[this.month.season] ?? NEAR_FORAGE.Summer; deliver(opts[Math.floor(Math.random() * opts.length)], 2, "went out early and came back with something"); }
      else if (c === "hearth") { this.data.tendedHearthDay = this.dateKey; notes.push(`${f.name} swept the house and tended the hearth, with the first portion for Hestia.`); }
      else { const w = TRADE_WORK[f.trade]; if (w?.give) deliver(w.give[0], w.give[1], w.say); else if (w?.fatigue) { this.addFatigue(-w.fatigue); notes.push(`${f.name} ${w.say}.`); } }
      if (f.role === "spouse") { this.heal(this.vitalityMax / 4); notes.push(`${f.name} brings you warm bread and a cup of milk before the day begins.`); }
      if (this.blessed("hearth") || this.wreathHas("myrtle")) this.npcRec(f.id).rel += 1; // a blessed hearth, a myrtle wreath: the household grows fonder
    }
  }
  /** The gods whose plants are on your head. */
  get crownGods(): string[] { const c = this.data.crown; return c && c.until > this.absHour ? c.mats.map((m) => CROWN_GOD[m]).filter(Boolean) : []; }
  /** A god's grace (graces.ts): 0, 4 or 7 (10 at the top, for taming). */
  grace(god: string): number { const f = this.favor(god); return f >= 10 ? 10 : f >= 7 ? 7 : f >= 4 ? 4 : 0; }
  sleep(collapsed = false, rough: boolean | "tent" = false) {
    const hoursSlept = this.sleepHours;
    const credit = collapsed ? 0.5 : rough === "tent" ? (this.gear.blanket ? 0.95 : 0.85) : rough ? (this.gear.blanket ? 0.75 : 0.5) : 1; // a collapse, or the hard ground by a campfire: half the rest (wrapped in a cloak, three quarters)
    // Hera keeps the house: at +12 sleep there restores you wholly; at -12 it gives you half the rest.
    const hera = !collapsed && !rough && this.data.scene === "House" ? (this.warded("Hera") ? 100 : this.doomed("Hera") ? 0.5 : 1) : 1;
    // A comfortable home (each kind of furnishing you've made for it) rests you a little better.
    const comfort = !collapsed && !rough && this.data.scene === "House" ? this.homeComfort : 0;
    // A sleeping draught (Pharmakeia) taken tonight: you sleep like the dead, and wake wholly rested.
    const drugged = !collapsed && this.songOn("hypnos"), drugHeal = drugged && this.songOn("hypnos3");
    if (drugged) { this.data.songBuff.hypnos = -1; this.data.songBuff.hypnos3 = -1; }
    const recovered = hera === 100 || drugged ? this.data.fatigue : Math.min(this.data.fatigue, hoursSlept * SLEEP_RECOVERY_PER_HOUR * credit * hera * (this.signActive("rest") ? 1.25 : 1) * (1 + 0.03 * comfort));
    this.data.fatigue -= recovered;
    const v0 = this.data.vitality;
    if (this.data.scene === "House" && !collapsed && !rough && this.grace("Hera") >= 7) this.heal(this.vitalityMax); // Hera's own bed
    this.heal((hoursSlept / 8) * this.vitalityMax * credit * (hera === 100 ? 2 : hera) * (1 + 0.15 * this.boon("Apollo")) * (1 + 0.05 * comfort) * (this.grace("Apollo") >= 7 ? 2 : 1));
    if (drugHeal) this.heal(this.vitalityMax);
    if (this.crownHas("wheat") || (this.data.scene === "House" && this.wreathHas("wheat"))) this.heal((this.data.vitality - v0) * 0.5); // Demeter's wheat: health
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
    if (drugged) notes.push(drugHeal ? "The poppy's sleep held you all night, deep and dreamless. You wake wholly rested, and whole." : "The poppy's sleep held you all night, deep and dreamless. You wake wholly rested.");
    if (comfort >= 3) notes.push(comfort >= 8 ? "Your home is warm and full of good things, and you wake deeply rested." : comfort >= 5 ? "Your home is snug, and you wake well rested." : "Your home is getting cozy, and you sleep a little better for it.");
    // Requests not met in time lapse, and the asker is a little let down.
    for (const q of [...this.data.requests]) if (this.dayNumber > q.due) {
      this.data.requests.splice(this.data.requests.indexOf(q), 1);
      const kind = this.warded("Aphrodite") || this.grace("Aphrodite") >= 7;
      if (!kind) this.npcRec(q.from).rel -= 1;
      notes.push(`${VILLAGERS[q.from].name}'s request lapsed${kind ? "" : ` (-1 with ${VILLAGERS[q.from].name})`}.`);
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
      if (this.data.ground[k] === "wet" || this.warded("Demeter")) { c.growth += this.grace("Demeter") >= 7 && Math.random() < 0.5 ? 2 : 1; c.growth = Math.min(c.growth, ripeAt); c.dryStreak = 0; } // Demeter's protection waters them; her blessing hastens them
      else { c.dryNights++; c.dryStreak++; if (c.dryStreak >= DRY_LIMIT + (this.blessed("crop") ? 2 : 0)) { c.withered = true; withered++; } }
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
    if (this.grace("Apollo") >= 4) notes.push(this.apolloDream());
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
    this.chores(notes);
    // Wonders settling: a Pneuma check each night, or the working distorts a little. A flame that has gone a season without blood dies.
    for (const [item, list] of Object.entries(this.data.wonders.on)) for (const e of [...list]) {
      const nm = `${ITEMS[item]?.name.toLowerCase() ?? item}`;
      if (e.settleUntil !== undefined) {
        const roll = 1 + Math.floor(Math.random() * 12), a = this.data.aretai.Pneuma ?? 3;
        if (roll + a < 7) {
          if (e.tier > 1 && Math.random() < 0.5) { e.tier = (e.tier - 1) as 1 | 2; notes.push(`The ${WONDERS[e.id].name} settling in your ${nm} drifted in the night and came out weaker. (Pneuma d12 ${roll} + ${a} vs 7)`); }
          else { e.quirk = DISTORTIONS[Math.floor(Math.random() * DISTORTIONS.length)]; notes.push(`The ${WONDERS[e.id].name} in your ${nm} settled a little wrong: ${e.quirk.toLowerCase()} (Pneuma d12 ${roll} + ${a} vs 7)`); }
        }
        if (e.settleUntil <= this.dayNumber) { delete e.settleUntil; notes.push(`The ${WONDERS[e.id].name} in your ${nm} has settled. It is fully yours now.`); }
      }
      if (e.id === "flame" && e.fed !== undefined) {
        const hungry = this.dayNumber - e.fed;
        if (hungry > 90) { list.splice(list.indexOf(e), 1); notes.push(`The fire in your ${nm} has gone out: a season without blood, and the binding failed.`); }
        else if (hungry === 60) notes.push(`The fire in your ${nm} burns low. It wants blood.`);
      }
    }
    // The working animals at home eat from the manger too (those out with you graze where you sleep).
    for (const b of this.data.beasts) {
      if (!BEASTS[b.kind].grazes || (b.follow && rough)) continue;
      if (this.data.manger >= 1) this.data.manger--;
      else if (this.warded("Hera")) { /* Hera keeps the household fed */ }
      else { b.hungry = this.dayNumber; notes.push(`${b.name} the ${BEASTS[b.kind].name} went hungry in the night: the manger was empty.`); }
    }
    // The goats eat and drink in the night; a goat that goes without gives no milk.
    for (const g of this.data.goats) {
      if (this.data.manger >= 1 && this.data.trough >= 1) { this.data.manger--; this.data.trough--; g.fed = true; }
      else if (this.warded("Hera")) { g.fed = true; } // Hera keeps the household fed
      else { g.fed = false; g.affection = Math.max(0, g.affection - 1); notes.push(`${g.name} went hungry or thirsty in the night.`); }
    }
    return { hoursSlept, recovered, healed, notes };
  }

  /** Set when something just went into a donkey's panniers (the scene says so once). */
  toPanniers = "";
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
