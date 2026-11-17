import {
  MONTHS, WHEEL, START_ARETAI, essencePools, DAYLIGHT_REAL_SECONDS,
  NIGHT_WATCHES_PLAYABLE, SLEEP_RECOVERY_PER_HOUR, moonPhase,
  ITEMS, STACK_MAX, JAR_CAPACITY, INVENTORY_SIZE,
  START_GOATS, type Goat, terrain, HOME_TERRAIN,
} from "./data";

export interface Slot { id: string; qty: number }
export interface ScreenRec { terrain: number; special: boolean; feature: string; cleared: string[] }

const SAVE_KEY = "worksanddays.save.v1";

export interface Essence { Earth: number; Water: number; Air: number; Fire: number }

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
  scene: "Farm" | "House" | "Wild";
  wx: number; wy: number; // the wilderness screen, in screens from home (0,0)
  entry: "" | "N" | "S" | "E" | "W"; // the side of the next map the player walks in from
  lastTerrain: number; // terrain of the screen the player just left
  screens: Record<string, ScreenRec>;
  px: number; py: number;
  tendedHearthDay: string;
  goats: Goat[];
  manger: number; // fodder in the goats' manger
  trough: number; // water in the goats' trough
  hiveDay: number; // day number of the last honey harvest
}

export class GameState {
  data: SaveData;
  essence: Essence;
  essenceMax: Essence;
  messages: { text: string; t: number }[] = [];

  constructor(data?: SaveData) {
    this.data = GameState.migrate(data ?? GameState.fresh());
    this.essenceMax = essencePools(this.data.aretai);
    this.essence = { ...this.essenceMax };
  }

  static startingSlots(): (Slot | null)[] {
    const s: (Slot | null)[] = Array(INVENTORY_SIZE).fill(null);
    ["hoe", "jar", "sickle", "axe", "mattock"].forEach((id, i) => (s[i] = { id, qty: 1 }));
    return s;
  }

  /** Bring saves from earlier builds up to date. */
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
    d.wx ??= 0; d.wy ??= 0; d.entry ??= ""; d.lastTerrain ??= HOME_TERRAIN; d.screens ??= {};
    return d;
  }

  // ---- inventory ----
  get selectedItem(): Slot | null { return this.data.slots[this.data.selected]; }

  count(id: string) { return this.data.slots.reduce((n, s) => n + (s && s.id === id ? s.qty : 0), 0); }

  /** Add items, stacking where possible. Returns how many did not fit. */
  addItem(id: string, qty: number): number {
    const def = ITEMS[id];
    const stacks = def && def.kind === "material";
    if (stacks) {
      for (const s of this.data.slots) {
        if (qty <= 0) break;
        if (s && s.id === id && s.qty < STACK_MAX) { const add = Math.min(qty, STACK_MAX - s.qty); s.qty += add; qty -= add; }
      }
    }
    for (let i = 0; i < this.data.slots.length && qty > 0; i++) {
      if (!this.data.slots[i]) { const add = stacks ? Math.min(qty, STACK_MAX) : 1; this.data.slots[i] = { id, qty: add }; qty -= add; }
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
    const rec = this.data.screens[`${this.data.wx},${this.data.wy}`];
    const dist = Math.abs(this.data.wx) + Math.abs(this.data.wy);
    return `${rec ? terrain(rec.terrain).name : "The wild"} · ${dist} screen${dist === 1 ? "" : "s"} from home`;
  }
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
    // Essence refills from empty to full in about 5 seconds.
    for (const k of Object.keys(this.essence) as (keyof Essence)[]) {
      this.essence[k] = Math.min(this.essenceMax[k], this.essence[k] + (this.essenceMax[k] / 5) * realSeconds);
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
  sleep(collapsed = false) {
    const hoursSlept = this.sleepHours;
    const credit = collapsed ? 0.5 : 1;
    const recovered = Math.min(this.data.fatigue, hoursSlept * SLEEP_RECOVERY_PER_HOUR * credit);
    this.data.fatigue -= recovered;
    this.data.clock = 0;
    this.data.day += 1;
    if (this.data.day > this.month.days) {
      this.data.day = 1;
      this.data.month = (this.data.month + 1) % 12;
      if (this.data.month === 0) this.data.year += 1;
    }
    this.essence = { ...this.essenceMax };
    for (const k of Object.keys(this.data.ground)) if (this.data.ground[k] === "wet") this.data.ground[k] = "tilled";
    // The goats eat and drink in the night; a goat that goes without gives no milk.
    const notes: string[] = [];
    for (const g of this.data.goats) {
      if (this.data.manger >= 1 && this.data.trough >= 1) { this.data.manger--; this.data.trough--; g.fed = true; }
      else { g.fed = false; g.affection = Math.max(0, g.affection - 1); notes.push(`${g.name} went hungry or thirsty in the night.`); }
    }
    return { hoursSlept, recovered, notes };
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
