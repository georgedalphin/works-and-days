import Phaser from "phaser";
import { GameState, rng } from "./state";
import { makeTextures, T, TILE } from "./textures";
import { WHEEL, ITEMS, JAR_CAPACITY, INVENTORY_SIZE, MANGER_MAX, TROUGH_MAX, HIVE_DAYS, type Goat, terrain, rollTerrain, HOME_TERRAIN,
  CROPS, seedId, QUALITY, QUALITY_MULT, money, BOW_RANGE, ARROW_SPEED, QUARRY, ARCHERY, RECIPES, PEACE_FOOD, MELEE, START_LIFE_THREAD } from "./data";
import type { CropRec } from "./state";
import { LORE, TIERS, TIER_MOD, RARITY_MOD, HERA_HOUR_BONUS, MAX_PERSEVERANCE, loreLines } from "./lore";
import { Animal, SPECIES, type Species } from "./animals";
import { FORAGE, bearing, type ForageDef } from "./forage";
import { TWELVE, CHTHONIC, favorLabel, BOONS, OFFER_PATRON, HOME_CAP, SHRINE_CAP, DEVOTION_STEP, CURRENCIES, CURRENCY_DESC, raiseCost, ARTS, type Art } from "./gods";
import { essencePools } from "./data";
import { VILLAGERS, REL_MIN, REL_MAX, relTier, relLabel, UPGRADES, toolName, STRANGER_KINDS, STRANGER_DAYS, GOD_CHANCE, GUEST_FOOD, type Villager } from "./village";
import type { ScreenRec } from "./state";

const W = 960, H = 640, ZOOM = 3;
let G: GameState;

const BLOCKING = [T.BRUSH, T.SAPLING, T.STONE, T.TREE, T.BOULDER, T.EDGE, T.OLIVE, T.FENCE];
const TREE_HITS = 3;

type Dir = 0 | 1 | 2 | 3; // down, left, right, up
const DV: Record<Dir, [number, number]> = { 0: [0, 1], 1: [-1, 0], 2: [1, 0], 3: [0, -1] };
const FONT = "Georgia, serif";

/** Something the player can use with E: a door, the bed, a sign. */
interface Target { x: number; y: number; label: string; act: () => void }

// ------------------------------------------------------------------ helpers
function ui(scene: Phaser.Scene) { return scene.scene.get("UI") as unknown as UIScene; }

/** Pay for a piece of work: Essence and Fatigue, discounted in the matching hour. */
function labor(cost: Record<string, number>, fatigue: number, aretai: string): string | null {
  if (G.exhausted) { G.say("You are too exhausted to work. Rest."); return null; }
  const disc = G.hourDiscount(aretai);
  const c: Record<string, number> = {};
  for (const [k, v] of Object.entries(cost)) c[k] = v * disc;
  if (!G.spend(c)) { G.say("You need a moment to catch your breath."); return null; }
  const zeus = aretai === "Kratos" ? 1 - 0.08 * G.boon("Zeus") : 1; // Zeus eases heavy labor
  G.addFatigue(fatigue * disc * zeus);
  return disc < 1 ? ` (${G.patron!.god}'s hour: the work comes easier)` : "";
}

/** Extra yield for things you understand fully. */
const mastery = (id: string, n = 1) => (G.lore(id) >= 3 ? n : 0);
const OBJ_SUBJECT: Record<number, string> = {
  [T.TREE]: "oak", [T.SAPLING]: "oak", [T.BRUSH]: "bramble", [T.STONE]: "stone", [T.BOULDER]: "stone", [T.FLOWERS]: "poppy", [T.OLIVE]: "olive",
};
const loreName = (id: string) => (G.lore(id) >= 1 ? LORE[id].name : LORE[id].vague);
/** A creature as you would name it: "wild boar" once you know it, "dark, bristling beast" before. */
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
  const target = gnosis + TIER_MOD[tier + 1] + RARITY_MOD[d.rarity] + hera + fails + G.boon("Hera");
  if (target <= 0) { G.say(`${d.name}: understanding this deeply is beyond your Gnosis for now.`); return false; }
  const b = labor({ Water: 3 }, 1, "Gnosis"); if (b === null) return false;
  G.data.lore.studied[id] = G.dayNumber;
  const roll = 1 + Math.floor(Math.random() * 12);
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

/** Poseidon's favor deepens your water jar. */
const jarCap = () => Math.max(10, JAR_CAPACITY + 5 * G.boon("Poseidon"));

function give(id: string, qty: number, q?: number): string {
  const left = G.addItem(id, qty, q);
  if (left > 0) G.say(`Your hands are full: ${left} ${ITEMS[id].name} left on the ground.`);
  return `+${qty - left} ${q && q > 1 ? QUALITY[q] + " " : ""}${ITEMS[id].name}`;
}


/** Work on the land's objects with whatever is in hand: the same at home and in the wild. */
function workObject(sc: Phaser.Scene & { clearObject(x: number, y: number): void }, tool: string | null, obj: number, x: number, y: number, hitKey: string): boolean {
    switch (tool) {
      case "sickle":
        if (obj === T.BRUSH) { const b = labor({ Earth: 2 }, 2, "Oikos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You cut the brush: ${give("Fiber", 2 + mastery("bramble"))}${b}`); }
        else if (obj === T.FLOWERS) { sc.clearObject(x, y); G.say(`You cut wildflowers: ${give("Flowers", 2)}`); }
        else G.say("The sickle is for brush and flowers.");
        return true;
      case "axe":
        if (obj === T.SAPLING) { const b = labor({ Earth: 3, Fire: 1 }, 4, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You fell the sapling: ${give("Wood", 2)}${b}`); }
        else if (obj === T.TREE) {
          const b = labor({ Earth: 3, Fire: 2 }, 4, "Kratos"); if (b === null) return true;
          const k = hitKey; G.data.treeHits[k] = (G.data.treeHits[k] ?? 0) + 1;
          const hits = G.toolLevel("axe") >= 2 ? 2 : TREE_HITS;
          if (G.data.treeHits[k] >= hits) { delete G.data.treeHits[k]; sc.clearObject(x, y); G.say(`The oak comes down: ${give("Wood", 6 + mastery("oak", 2))}${b}`); }
          else { G.say(`You swing the axe into the oak (${G.data.treeHits[k]} of ${hits}).${b}`); sc.cameras.main.shake(80, 0.002); (sc as unknown as PlayScene).chips(x, y, T.TREE, 4); }
        }
        else if (obj === T.OLIVE) G.say("You would never cut an olive tree. Athena would not forgive it.");
        else if (obj === T.FENCE) G.say("That's the goats' fence.");
        else G.say("Nothing here for the axe.");
        return true;
      case "mattock":
        if (obj === T.STONE) { const b = labor({ Earth: 3, Fire: 2 }, 4, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You break up the stone: ${give("Stone", 2 + mastery("stone"))}${b}`); }
        else if (obj === T.BOULDER && G.toolLevel("mattock") >= 2) { const b = labor({ Earth: 4, Fire: 3 }, 6, "Kratos"); if (b === null) return true; sc.clearObject(x, y); G.say(`The bronze-shod mattock splits the boulder: ${give("Stone", 4 + mastery("stone"))}${b}`); }
        else if (obj === T.BOULDER) G.say("Too big for this mattock. Lykos the smith in the village can shoe it in bronze.");
        else G.say("Nothing here for the mattock.");
        return true;
      default:
        // Bare hands, or a material in hand.
        if (obj === T.FLOWERS) { sc.clearObject(x, y); G.say(`You pick wildflowers: ${give("Flowers", 1)}`); }
        else if (obj === T.BRUSH) { const b = labor({ Earth: 3 }, 3, "Oikos"); if (b === null) return true; sc.clearObject(x, y); G.say(`You pull up the brush by hand: ${give("Fiber", 1 + mastery("bramble"))}${b}`); }
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
    this.spots = [];
    this.arrows = []; this.pickups = []; this.cooldown = 0; this.aiming = false; this.knock = 0; this.invuln = 0;
    this.aimGfx = this.add.graphics().setDepth(100000);
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.aiming || !p.leftButtonDown()) return;
      const w = p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      this.loose(w.x, w.y);
    });
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,Q,SPACE,SHIFT") as Record<string, Phaser.Input.Keyboard.Key>;
  }

  makePlayer(x: number, y: number) {
    this.player = this.physics.add.sprite(x, y, "player", 0);
    this.player.setSize(8, 6).setOffset(4, 10).setDepth(10);
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

  movePlayer(dt: number) {
    if (this.invuln > 0) { this.invuln -= dt; this.player.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 12) % 2 ? 0.4 : 1); }
    if (this.knock > 0) { this.knock -= dt; return; }
    const k = this.keys, c = this.cursors;
    let vx = 0, vy = 0;
    if (!this.paused) {
      if (k.A.isDown || c.left.isDown) vx -= 1;
      if (k.D.isDown || c.right.isDown) vx += 1;
      if (k.W.isDown || c.up.isDown) vy -= 1;
      if (k.S.isDown || c.down.isDown) vy += 1;
    }
    let speed = 70;
    const moving = vx !== 0 || vy !== 0;
    if (moving && k.SHIFT.isDown) {
      const cost = 3 * dt * G.hourDiscount("Aiolos") * Math.max(0.4, 1 - 0.12 * G.boon("Hermes"));
      if (G.essence.Air >= cost) { G.essence.Air -= cost; speed = 115; }
    }
    if (G.exhausted) speed *= 0.6;
    const len = Math.hypot(vx, vy) || 1;
    this.player.setVelocity((vx / len) * speed, (vy / len) * speed);
    if (moving) {
      if (Math.abs(vx) > Math.abs(vy)) this.facing = vx < 0 ? 1 : 2; else this.facing = vy < 0 ? 3 : 0;
    }
    this.player.setFrame(this.facing);
    this.player.setDepth(this.player.y);
  }

  /** The tile in front of the player's feet. */
  facingTile(): [number, number] {
    const tx = Math.floor(this.player.x / TILE), ty = Math.floor((this.player.y + 5) / TILE);
    const [dx, dy] = DV[this.facing];
    return [tx + dx, ty + dy];
  }

  /** The nearest usable thing within reach, preferring what the player faces. */
  findTarget(): Target | null {
    const [dx, dy] = DV[this.facing];
    const fx = this.player.x + dx * 10, fy = this.player.y + 4 + dy * 10;
    let best: Target | null = null, bestD = 22;
    for (const t of this.targets) {
      const d = Math.min(Math.hypot(t.x - fx, t.y - fy), Math.hypot(t.x - this.player.x, t.y - this.player.y - 4) + 6);
      if (d < bestD) { bestD = d; best = t; }
    }
    return best;
  }

  /** Per-frame upkeep shared by every play scene. Returns false if paused. */
  common(dt: number): boolean {
    this.movePlayer(dt);
    if (this.paused) { ui(this).prompt(null); return false; }
    if (G.tick(dt)) { ui(this).collapse(this); return false; }
    G.data.px = this.player.x; G.data.py = this.player.y;
    this.current = this.findTarget();
    const angry = this.animals.find((a) => (a.state === "charge" || a.state === "recoil") && Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) < 56);
    if (angry) this.current = { x: angry.sprite.x, y: angry.sprite.y, label: `Calm the ${beast(angry.kind)}`, act: () => this.appease(angry) };
    ui(this).prompt(this.current ? this.current.label : null);
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) && this.current) this.current.act();
    const bow = G.selectedItem?.id === "bow";
    this.aiming = bow && this.canHunt && this.keys.SPACE.isDown;
    if (this.aiming) this.aimAtPointer();
    this.drawAim();
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      if (!bow) this.useItem();
      else if (!this.canHunt) G.say("Not indoors.");
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.investigate();
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
    const agg = d.aggression + (G.isDay ? 0 : 2) + (G.patron?.aretai === "Kardia" ? -2 : 0) - Math.trunc(G.boon("Artemis") / 2) + bonus;
    const roll = 1 + Math.floor(Math.random() * 12);
    if (roll > agg) return false;
    a.charge(a.kind === "wolf" ? 7 : 5);
    this.alarm(a);
    const name = loreName(a.kind);
    const how: Record<string, string> = { boar: "lowers its tusks and charges", wolf: "bares its teeth and comes for you", fox: "snarls and darts at you", deer: "lowers its antlers and charges" };
    G.say(`${name[0].toUpperCase() + name.slice(1)} ${how[a.kind] ?? "comes at you"}! (d12 ${roll}${G.lore(a.kind) >= 2 ? `, Aggression ${agg}` : ""}) Run, fight, or calm it (E).`);
    return true;
  }

  alarm(a: Animal) {
    const t = this.add.text(a.sprite.x, a.sprite.y - 12, "!", { fontFamily: FONT, fontSize: "10px", color: "#e0403a", stroke: "#1f1712", strokeThickness: 2 }).setOrigin(0.5).setResolution(3).setDepth(99999);
    this.tweens.add({ targets: t, y: t.y - 8, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  /** A creature lands a blow: Fatigue, a knock back, and if you were already spent, you fall. */
  struck(a: Animal) {
    if (this.invuln > 0 || this.leaving) return;
    const d = SPECIES[a.kind];
    G.addFatigue(d.damage);
    this.invuln = 1; this.knock = 0.22;
    const ang = Math.atan2(this.player.y - a.sprite.y, this.player.x - a.sprite.x);
    this.player.setVelocity(Math.cos(ang) * 170, Math.sin(ang) * 170);
    this.cameras.main.shake(140, 0.006);
    this.player.setTint(0xff7070); this.time.delayedCall(200, () => this.player.clearTint());
    const verb: Record<string, string> = { boar: "gores", wolf: "bites", fox: "snaps at", deer: "butts" };
    G.say(`The ${beast(a.kind)} ${verb[a.kind] ?? "strikes"} you! (+${d.damage} Fatigue)`);
    if (G.data.fatigue >= 100) this.struckDown(a);
  }

  struckDown(a: Animal) {
    G.data.lifeThread = Math.max(0, G.data.lifeThread - 1);
    G.data.currencies.Pathos++; // what suffering teaches
    for (const b of this.animals) if (b.state === "charge" || b.state === "recoil") { b.state = "idle"; b.sprite.setVelocity(0, 0); }
    if (G.data.lifeThread <= 0) { ui(this).death(`${LORE[a.kind]?.name ?? a.kind}`); return; }
    ui(this).sleep(this, true, `You are struck down by the ${beast(a.kind)}. A shepherd finds you and carries you home.\nYour Life Thread frays: ${G.data.lifeThread} of ${START_LIFE_THREAD} remain.`);
  }

  /** Space with a tool (or bare hands) at a creature right in front of you: a Thymos check to land a blow. */
  tryStrike(tool: string | null): boolean {
    if (tool && !(tool in MELEE)) return false;
    const a = this.creatureAhead();
    if (!a || a.kind === "goat" || Math.hypot(a.sprite.x - this.player.x, a.sprite.y - this.player.y) > 26) return false;
    const b = labor({ Fire: 2 }, 1, "Thymos"); if (b === null) return true;
    const name = beast(a.kind);
    if (!tool) { // a shove
      a.bolt(this.player);
      G.say(`You shove the ${name} away.`);
      return true;
    }
    const thymos = G.data.aretai.Thymos ?? 3;
    const target = thymos + 3 + (G.patron?.aretai === "Thymos" ? 2 : 0) + G.boon("Ares");
    const roll = 1 + Math.floor(Math.random() * 12);
    if (roll > target) { G.say(`You swing at the ${name} and miss (d12 ${roll}, needed 1–${target}).`); if (a.state !== "charge" && a.state !== "recoil" && !this.aggressionRoll(a, 3)) a.bolt(this.player); return true; }
    const q = QUARRY[a.kind];
    if (a.hp < 0) a.hp = q.hp;
    a.hp -= MELEE[tool];
    this.chips(Math.floor(a.sprite.x / TILE), Math.floor(a.sprite.y / TILE), -1, 4);
    if (a.hp <= 0) { this.kill(a); return true; }
    a.sprite.setTint(0xff8080); this.time.delayedCall(250, () => a.sprite.clearTint());
    G.say(`You strike the ${name}! (d12 ${roll}, needed 1–${target})`);
    if (a.state !== "charge" && a.state !== "recoil" && !this.aggressionRoll(a, 3)) a.bolt(this.player);
    return true;
  }

  /**
   * Calm an angry creature (E): a Kardia check, easier with food it likes held out in your hand.
   * The first step of befriending: a calmed creature lets you be.
   */
  appease(a: Animal) {
    const b = labor({ Water: 2 }, 1, "Kardia"); if (b === null) return;
    const name = beast(a.kind);
    const held = G.selectedItem?.id ?? "";
    const food = (PEACE_FOOD[a.kind] ?? []).includes(held);
    if (food) G.removeItem(held, 1);
    const kardia = G.data.aretai.Kardia ?? 3;
    const target = kardia + 2 + (food ? 3 : 0) + (G.patron?.aretai === "Kardia" ? 2 : 0) - Math.floor(SPECIES[a.kind].aggression / 2) + G.boon("Athena");
    const roll = 1 + Math.floor(Math.random() * 12);
    const odds = `d12 ${roll}, needed 1–${Math.max(0, target)}${food ? `, ${ITEMS[held].name.toLowerCase()} offered +3` : ""}`;
    if (roll <= target) {
      a.appeased = true; a.state = "idle"; a.timer = 3; a.sprite.setVelocity(0, 0);
      const t = this.add.text(a.sprite.x, a.sprite.y - 12, "♥", { fontFamily: FONT, fontSize: "9px", color: "#9ad07a" }).setOrigin(0.5).setResolution(3).setDepth(99999);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
      G.say(`You speak low and hold still. The ${name} calms and lets you be (${odds}).`);
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
      const px = x * TILE + 8, py = y * TILE + 8;
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

  gather(tx: number, ty: number): boolean {
    const s = this.forageAt(tx, ty);
    if (!s) return false;
    const d = s.def, name = LORE[d.id].name.toLowerCase();
    if (G.lore(d.id) < 1) { G.say(`You don't know ${LORE[d.id].vague} well enough to tell whether anything on it is good to gather. Investigate it (Q).`); return true; }
    const picked = this.picked();
    if (!d.months.includes(G.data.month)) { G.say(`Nothing to gather from the ${name} now. It bears in ${d.bearsWhen}.`); return true; }
    if (picked[s.k] !== undefined && G.dayNumber - picked[s.k] < d.regrow) {
      const left = d.regrow - (G.dayNumber - picked[s.k]);
      G.say(`You've already gathered from this ${name}. ${left > 30 ? "Not again this season." : `It will bear again in ${left} day${left > 1 ? "s" : ""}.`}`); return true;
    }
    const b = labor({ Earth: 1 }, 0.5, "Oikos"); if (b === null) return true;
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
    if (tile < 0) return;
    const x = tx * TILE + 8, y = ty * TILE + 16;
    const ghost = this.add.image(x, y, "tiles", `t${tile}`).setOrigin(0.5, 1).setDepth(y + 1);
    if (tile === T.TREE || tile === T.SAPLING) {
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
  arrows: { img: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Ellipse; sx: number; sy: number; lx: number; ly: number; t: number; T: number; h: number }[] = [];
  pickups: { id: string; qty: number; img: Phaser.GameObjects.Image }[] = [];
  get canHunt() { return true; }

  /** Where the pointer is in the world, pulled in to the bow's range. */
  aimPoint(): [number, number] {
    const w = this.input.activePointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const px = this.player.x, py = this.player.y + 4;
    let dx = w.x - px, dy = w.y - py; const d = Math.hypot(dx, dy);
    if (d > BOW_RANGE) { dx *= BOW_RANGE / d; dy *= BOW_RANGE / d; }
    return [px + dx, py + dy];
  }

  aimAtPointer() {
    this.player.setVelocity(0, 0);
    const [tx, ty] = this.aimPoint();
    const dx = tx - this.player.x, dy = ty - this.player.y;
    this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
    this.player.setFrame(this.facing);
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
    const r = this.spread(d);
    g.lineStyle(1, this.cooldown > 0 ? 0x8d877b : 0xf2c14e, 0.9).strokeCircle(tx, ty, r);
    g.fillStyle(0xf2c14e, 1).fillRect(tx - 1, ty, 3, 1).fillRect(tx, ty - 1, 1, 3);
  }

  loose(tx0: number, ty0: number) {
    if (this.cooldown > 0) return;
    if (G.count("Arrow") <= 0) { G.say("No arrows left. Craft more from wood and stone (C)."); return; }
    const b = labor({ Air: 2 }, 0.5, "Ourania"); if (b === null) return;
    G.removeItem("Arrow", 1);
    const [tx, ty] = this.aimPoint();
    const sx = this.player.x, sy = this.player.y + 4;
    const d = Math.hypot(tx - sx, ty - sy), r = this.spread(d);
    const a = Math.random() * Math.PI * 2, rr = r * Math.sqrt(Math.random());
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
      if (u >= 1) { this.arrows.splice(this.arrows.indexOf(a), 1); a.img.destroy(); a.shadow.destroy(); this.land(a.lx, a.ly); }
    }
  }

  /** Is this spot open ground an arrow can stick in? */
  openGround(_x: number, _y: number) { return true; }

  /** An arrow strikes only where it falls. */
  land(x: number, y: number) {
    const hit = this.animals.find((a) => a.state !== "dead" && a.state !== "gone" && a.sprite.visible && a.kind !== "goat"
      && Math.hypot(a.sprite.x - x, a.sprite.y + 3 - y) <= QUARRY[a.kind].size + 2);
    const goat = this.animals.find((a) => a.kind === "goat" && Math.hypot(a.sprite.x - x, a.sprite.y + 3 - y) <= 10);
    let broke = Math.random() < 0.1;
    if (hit) {
      const q = QUARRY[hit.kind];
      if (hit.hp < 0) hit.hp = q.hp;
      hit.hp--; broke = Math.random() < 0.3;
      const before = G.archery; G.data.archeryXp += ARCHERY.perHit;
      if (G.archery > before) G.say(`Your archery improves to ${G.archery}: your arrows fly truer.`);
      if (hit.hp <= 0) this.kill(hit);
      else {
        hit.sprite.setTint(0xff8080); this.time.delayedCall(250, () => hit.sprite.clearTint());
        if (this.aggressionRoll(hit, 3)) G.say(`A hit! The wounded ${beast(hit.kind)} turns on you!`);
        else { hit.bolt({ x, y: y - 20 }); G.say(`A hit! The ${beast(hit.kind)} is wounded and runs.`); }
      }
    } else {
      if (goat) G.say("Your arrow thuds into the goat pen. The goats bleat at you reproachfully.");
      // The thud of a near miss sends creatures running.
      for (const a of this.animals) if (a.kind !== "goat" && a.state !== "dead" && a.state !== "gone" && Math.hypot(a.sprite.x - x, a.sprite.y - y) < 40) a.bolt({ x, y });
    }
    if (broke) return;
    if (!this.openGround(x, y)) return; // lost in the brush
    this.dropItem("Arrow", 1, x, y, "arrowStuck");
  }

  kill(a: Animal) {
    const known = G.lore(a.kind) >= 1;
    a.state = "dead"; a.sprite.setVelocity(0, 0).setFlipY(true).setTint(0xb0a090);
    const name = beast(a.kind);
    G.say(`You bring down the ${name}.${a.kind === "deer" ? " Artemis' animal: offer her a share (antler or meat) at an altar before you sleep." : ""}`);
    if (a.kind === "deer") G.data.deerDebt++;
    if (a.kind === "boar" || a.kind === "wolf") G.earn("Kleos", 1, `you brought down a ${name}`);
    if (!known && LORE[a.kind]) { G.data.lore.tier[a.kind] = 1; G.say(`Up close, you know it now: a ${LORE[a.kind].name.toLowerCase()}.`); }
    if (a.flock.length) for (const b of a.flock) if (b !== a && b.state !== "dead" && b.state !== "gone") b.bolt(a.sprite);
    this.time.delayedCall(700, () => {
      QUARRY[a.kind].drops.forEach(([id, n], i) => this.dropItem(id, n, a.sprite.x - 6 + i * 6, a.sprite.y + 2 + (i % 2) * 4));
      this.tweens.add({ targets: a.sprite, alpha: 0, duration: 500, onComplete: () => a.sprite.destroy() });
      this.animals.splice(this.animals.indexOf(a), 1);
    });
  }

  dropItem(id: string, qty: number, x: number, y: number, tex?: string) {
    const img = tex ? this.add.image(x, y - 3, tex) : this.add.image(x, y, "items", id).setScale(0.75);
    img.setDepth(y);
    this.pickups.push({ id, qty, img });
  }

  /** Walk over what lies on the ground to pick it up. */
  updatePickups() {
    for (const p of [...this.pickups]) {
      if (Math.hypot(p.img.x - this.player.x, p.img.y - (this.player.y + 4)) > 12) continue;
      const left = G.addItem(p.id, p.qty);
      if (left === p.qty) continue; // no room
      G.say(`+${p.qty - left} ${ITEMS[p.id].name}`);
      if (left > 0) { p.qty = left; continue; }
      p.img.destroy(); this.pickups.splice(this.pickups.indexOf(p), 1);
    }
  }

  abstract useItem(): void;
  /** The kind of thing in front of the player, for investigating. */
  subjectAt(): string | null { return null; }
  animals: Animal[] = [];

  /** A creature close in front of the player, if any. */
  creatureAhead(): Animal | null {
    const [dx, dy] = DV[this.facing];
    const fx = this.player.x + dx * 14, fy = this.player.y + 4 + dy * 14;
    let best: Animal | null = null, bestD = 34;
    for (const a of this.animals) {
      if (a.state === "gone" || !a.sprite.visible) continue;
      const d = Math.hypot(a.sprite.x - fx, a.sprite.y - fy);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }

  investigate() {
    const a = this.creatureAhead();
    const [fx, fy] = this.facingTile();
    const spot = this.forageAt(fx, fy);
    const id = a ? a.kind : spot ? spot.def.id : this.subjectAt();
    if (!id || !LORE[id]) { G.say("There's nothing here to investigate."); return; }
    if (study(id)) { ui(this).openLore(id); this.refreshForage(); }
  }

  /** How close creatures let you come: running scares them, Artemis' hour and full understanding calm them. */
  updateAnimals(dt: number) {
    const running = this.keys.SHIFT.isDown && this.player.body!.velocity.length() > 80;
    const base = (running ? 1.6 : 1) * (G.patron?.aretai === "Kardia" ? 0.7 : 1) * Math.max(0.5, 1 - 0.08 * G.boon("Artemis"));
    for (const a of this.animals) { a.decide ??= (x) => this.aggressionRoll(x); a.strikes ??= (x) => this.struck(x); }
    if (!this.paused) for (const a of this.animals) a.update(dt, this.player, base * (G.lore(a.kind) >= 3 ? 0.67 : 1));
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
    options.push({ label: "New life", go: () => { GameState.clearSave(); this.begin(new GameState()); } });

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
  begin(state: GameState) {
    if (this.starting) return; // a click and a key in the same frame must not start the game twice
    this.starting = true;
    G = state;
    (window as unknown as { G: GameState }).G = G; // for testing from the console
    this.scene.start(G.data.scene);
    if (this.scene.isActive("UI")) this.scene.stop("UI");
    this.scene.launch("UI");
  }
}

// ------------------------------------------------------------------ the homestead
const MW = 48, MH = 36;
const HUT = { tx: 22, ty: 7, w: 4 }; // in tiles
const DOOR = { tx: 24, ty: 10 };
const DOOR_X = HUT.tx * TILE + 32; // the door's centre in pixels
const WELL = { tx: 30, ty: 9 };
const PEN = { x0: 14, y0: 15, x1: 20, y1: 20, gateY: 17 }; // fence on the border, gate gap on the east side
const HIVE = { tx: 36, ty: 10 };
const inPen = (x: number, y: number) => x >= PEN.x0 && x <= PEN.x1 && y >= PEN.y0 && y <= PEN.y1;
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

  constructor() { super("Farm"); }

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
    // The goat pen west of the path, and the beehive among flowers to the east.
    for (let y = PEN.y0 - 1; y <= PEN.y1 + 1; y++) for (let x = PEN.x0 - 1; x <= PEN.x1 + 1; x++) objs[y][x] = -1;
    for (let y = HIVE.ty - 1; y <= HIVE.ty + 1; y++) for (let x = HIVE.tx - 1; x <= HIVE.tx + 1; x++) objs[y][x] = -1;
    for (const [x, y] of [[34, 10], [34, 12], [38, 11], [36, 13], [38, 9], [35, 8]]) objs[y][x] = T.FLOWERS;
    for (const k of G.data.cleared) { const [x, y] = k.split(",").map(Number); if (objs[y]) objs[y][x] = -1; }
    for (let y = PEN.y0; y <= PEN.y1; y++) for (let x = PEN.x0; x <= PEN.x1; x++) {
      const border = x === PEN.x0 || x === PEN.x1 || y === PEN.y0 || y === PEN.y1;
      objs[y][x] = border && !(x === PEN.x1 && y === PEN.gateY) ? T.FENCE : -1;
    }
    this.baseGround = ground.map((row) => [...row]);
    for (const [k, v] of Object.entries(G.data.ground)) { const [x, y] = k.split(",").map(Number); if (ground[y]) ground[y][x] = v === "wet" ? T.WET : T.TILLED; }

    this.map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: MW, height: MH });
    const ts = this.map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    this.groundLayer = this.map.createBlankLayer("ground", ts)!;
    this.objects = this.map.createBlankLayer("objects", ts)!;
    this.groundLayer.putTilesAt(ground, 0, 0);
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(BLOCKING);
    this.objects.setDepth(1);

    // The hut, the well, the storage jar and the signposts.
    const hut = this.add.image(HUT.tx * TILE, HUT.ty * TILE, "hut").setOrigin(0, 0).setDepth((HUT.ty + 3.4) * TILE);
    const solids = this.physics.add.staticGroup();
    const solid = (x: number, y: number, w: number, h: number) => {
      const b = solids.create(x, y, "") as Phaser.Physics.Arcade.Sprite;
      b.setVisible(false); (b.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h);
    };
    solid(hut.x + 32, hut.y + 38, 56, 30);
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

    const signs = [
      { tx: 22, ty: MH - 3, text: "South: the road to the village, and beyond it, the wild." },
      { tx: MW - 3, ty: 14, text: "East: the wild lands, where the land changes as you go. Mind the hour: night falls hard out there." },
    ];
    for (const s of signs) {
      this.add.image(s.tx * TILE + 8, s.ty * TILE + 8, "sign").setDepth(s.ty * TILE + 12);
      this.objects.putTileAt(-1, s.tx, s.ty); solid(s.tx * TILE + 8, s.ty * TILE + 13, 4, 4);
    }

    const at = (tx: number, ty: number) => ({ x: tx * TILE + 8, y: ty * TILE + 8 });
    this.targets = [
      { x: DOOR_X, y: (DOOR.ty + 1) * TILE, label: "Enter the hut", act: () => this.enterHouse() },
      { ...at(WELL.tx, WELL.ty), label: "Look at the well", act: () => G.say("A stone-lined well. With your water jar in hand, press Space here to fill it.") },
      { x: pithos.x, y: pithos.y + 6, label: "Trade with the miller's cart", act: () => ui(this).openMarket() },
      { x: this.vine.x, y: this.vine.y + 4, get label() { return G.data.month === 1 && G.data.vineYear !== G.data.year ? "Pick grapes" : "Look at the vine"; }, act: () => this.tendVine() },
      { ...at(18, 9), label: "Look at the olive tree", act: () => G.say("An old olive tree, Athena's gift. Its fruit ripens in late autumn.") },
      { ...at(19, 12), label: "Look at the olive tree", act: () => G.say("An old olive tree, gnarled and patient.") },
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
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects);
    this.physics.add.collider(this.player, solids);
    // Forage grows in the rough ground at the edges of the homestead.
    this.placeForage(rng(G.data.seed ^ 0x51f0a9e), HOME_TERRAIN, 6, (x, y) =>
      x < MW - 2 && y < MH - 2 && Math.hypot((x - 24) / 1.3, y - 14) > 9 && objs[y][x] === -1 && this.baseGround[y][x] !== T.PATH && !inPen(x, y));
    this.spawnAnimals(r, objs);
    this.cameras.main.fadeIn(250);
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
      this.physics.add.collider(a.sprite, this.objects);
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
      this.physics.add.collider(a.sprite, this.objects);
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
      this.physics.add.collider(a.sprite, this.objects);
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
    this.trough.setFrame(G.data.trough > 0 ? 1 : 0);
    this.drawBees(dt);
    if (!this.common(dt)) return;
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
      const q = Math.min(3, 1 + (c.dryNights === 0 ? 1 : 0) + (c.hourBonus ? 1 : 0));
      const dem = G.boon("Demeter"); // Demeter's favor (or anger) at the harvest
      const extra = dem !== 0 && Math.random() < 0.15 * Math.abs(dem) ? Math.sign(dem) : 0;
      const got = give(d.id, Math.max(1, d.yield + mastery(d.id) + extra), q);
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
    const b = labor({ Earth: 1 }, 1, "Oikos"); if (b === null) return;
    G.removeItem(seed, 1);
    const hour = d.aretai === "Night" ? !G.isDay : G.patron?.aretai === d.aretai;
    G.data.crops[k] = { id: crop, growth: 0, dryNights: 0, dryStreak: 0, hourBonus: hour, withered: false, picks: 0 };
    this.drawCrop(k);
    G.say(`You sow ${d.name.toLowerCase()}.${hour ? ` Sown in ${d.aretai === "Night" ? "the night, Hades' time" : `${d.god}'s hour`}, it will grow finer.` : ""}${G.data.ground[k] === "wet" ? "" : " Water it today."}`);
  }

  tendVine() {
    if (G.data.month !== 1) { G.say(`An old vine, older than you. Its grapes ripen in Metageitnion.`); return; }
    if (G.data.vineYear === G.data.year) { G.say("You've picked the vine clean this year."); return; }
    G.data.vineYear = G.data.year;
    G.say(`You cut the heavy clusters from the old vine: ${give("Grapes", 12 + mastery("vine", 4) + 2 * Math.max(0, G.boon("Dionysus")))}. Dionysus will want his share.`);
  }

  subjectAt(): string | null {
    const [x, y] = this.facingTile();
    const crop = G.data.crops[`${x},${y}`];
    if (crop) return crop.id;
    if (x === HIVE.tx && (y === HIVE.ty || y === HIVE.ty + 1)) return "bees";
    if (x === 20 && (y === 10 || y === 11)) return "vine";
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
    G.data.wx = wx; G.data.wy = wy; G.data.entry = entry; G.data.lastTerrain = HOME_TERRAIN; G.data.scene = "Wild";
    this.goTo("Wild");
  }

  enterHouse() {
    if (this.leaving) return;
    G.data.scene = "House";
    G.data.px = -1; G.data.py = -1; // the hut places us just inside the door
    this.goTo("House");
  }

  setGround(x: number, y: number, state: "tilled" | "wet" | null) {
    const k = `${x},${y}`;
    if (state) G.data.ground[k] = state; else delete G.data.ground[k];
    this.groundLayer.putTileAt(state === "wet" ? T.WET : state === "tilled" ? T.TILLED : this.baseGround[y][x], x, y);
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
    if (tool !== "hoe" && tool !== "jar" && this.gather(x, y)) return;
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
        { const b = labor({ Earth: 2 }, 2, "Oikos"); if (b === null) return;
          if (obj === T.FLOWERS) this.clearObject(x, y);
          this.setGround(x, y, "tilled"); G.say(`You break the ground.${b}`); }
        return;
      case "jar":
        if (isWell) { G.data.jarWater = jarCap(); G.say("You fill the water jar at the well."); return; }
        if (x === PEN.x1 - 1 && y === PEN.y0 + 1) { this.fillTrough(); return; }
        if (!soil) { G.say("Water only does good on tilled soil."); return; }
        if (soil === "wet") { G.say("This soil is already watered."); return; }
        if (G.data.jarWater <= 0) { G.say("The jar is empty. Fill it at the well."); return; }
        G.data.jarWater -= 1; this.setGround(x, y, "wet");
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
      { x: 6 * TILE, y: 4.6 * TILE, get label() { return G.data.arts.length ? "The hearth" : "Tend the hearth"; }, act: () => (G.data.arts.length ? ui(this).hearthMenu(() => this.tendHearth()) : this.tendHearth()) },
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
const profile = (t: number) => PROFILES[t] ?? PROFILES[1];

/** A stable seed for each screen of this save's world. */
function screenSeed(wx: number, wy: number) {
  let h = (G.data.seed ^ Math.imul(wx, 73856093) ^ Math.imul(wy, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return h;
}

class WildScene extends PlayScene {
  key = "";
  rec!: ScreenRec;
  objects!: Phaser.Tilemaps.TilemapLayer;
  open: Record<Side, boolean> = { N: true, S: true, E: true, W: true };

  constructor() { super("Wild"); }

  /** Which sides lead somewhere. Next to home, only the farm's own gateways connect. */
  sideOpen(wx: number, wy: number, side: Side) {
    const [dx, dy] = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[side];
    if (wx + dx === 0 && wy + dy === 0) return wx === 1 && wy === 0 && side === "W";
    if (wx + dx === 0 && wy + dy === 1) return wx === 0 && wy === 2 && side === "N"; // the village's south road
    return true;
  }

  create() {
    this.leaving = false;
    const wx = G.data.wx, wy = G.data.wy;
    this.key = `${wx},${wy}`;
    for (const sd of ["N", "S", "E", "W"] as Side[]) this.open[sd] = this.sideOpen(wx, wy, sd);
    const r = rng(screenSeed(wx, wy));

    // First visit: roll the terrain from the land just left, and the screen's feature.
    let firstVisit = false;
    if (!G.data.screens[this.key]) {
      firstVisit = true;
      const roll = rollTerrain(G.data.lastTerrain || HOME_TERRAIN, r);
      const p = profile(roll.terrain);
      G.data.screens[this.key] = { terrain: roll.terrain, special: roll.special, feature: p.features[Math.floor(r() * p.features.length)], cleared: [] };
    }
    this.rec = G.data.screens[this.key];
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
    // Gateways on each open side, with a winding clear way from each to the middle.
    const cx = 20, cy = 15;
    const carve = (x: number, y: number) => { for (let yy = y; yy <= y + 1; yy++) for (let xx = x; xx <= x + 1; xx++) if (xx > 0 && yy > 0 && xx < WW - 1 && yy < WH - 1) objs[yy][xx] = -1; };
    const starts: Record<Side, [number, number]> = { N: [cx, 0], S: [cx, WH - 1], W: [0, cy], E: [WW - 1, cy] };
    for (const sd of ["N", "S", "E", "W"] as Side[]) {
      if (!this.open[sd]) continue;
      const [sx0, sy0] = starts[sd];
      for (let i = -1; i <= 1; i++) { if (sd === "N" || sd === "S") objs[sy0][sx0 + i] = -1; else objs[sy0 + i][sx0] = -1; }
      let x = sx0, y = sy0;
      for (let step = 0; step < 60 && (Math.abs(x - cx) > 1 || Math.abs(y - cy) > 1); step++) {
        carve(x - 1, y - 1);
        if (gen() < 0.7) { x += Math.sign(cx - x); y += Math.sign(cy - y); }
        else if (sd === "N" || sd === "S") x += gen() < 0.5 ? -1 : 1; else y += gen() < 0.5 ? -1 : 1;
        x = Math.max(1, Math.min(WW - 2, x)); y = Math.max(1, Math.min(WH - 2, y));
      }
    }
    // The village road runs south from the farm.
    if (wx === 0 && wy >= 2) for (let y = 0; y < WH; y++) { ground[y][cx] = T.PATH; for (let x = cx - 1; x <= cx + 1; x++) if (y > 0 && y < WH - 1 || x === cx || objs[y][x] !== T.EDGE) objs[y][x] = -1; objs[y][cx] = -1; }
    // The screen's feature, somewhere away from the middle.
    const fx = gen() < 0.5 ? 4 + Math.floor(gen() * 8) : WW - 12 + Math.floor(gen() * 8);
    const fy = 4 + Math.floor(gen() * (WH - 8));
    this.stampFeature(objs, fx, fy, this.rec.feature, gen);
    for (const k of this.rec.cleared) { const [x, y] = k.split(",").map(Number); if (objs[y] && objs[y][x] !== T.EDGE) objs[y][x] = -1; }

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: WW, height: WH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(BLOCKING).setDepth(1);
    this.targets = [];

    this.physics.world.setBounds(0, 0, WW * TILE, WH * TILE);
    this.cameras.main.setBounds(0, 0, WW * TILE, WH * TILE);
    this.setupInput();
    let sx = G.data.px, sy = G.data.py;
    const e = G.data.entry;
    if (e === "W") { sx = 1.5 * TILE; sy = cy * TILE + 8; }
    if (e === "E") { sx = (WW - 1.5) * TILE; sy = cy * TILE + 8; }
    if (e === "N") { sx = cx * TILE + 8; sy = 1.5 * TILE; }
    if (e === "S") { sx = cx * TILE + 8; sy = (WH - 1.5) * TILE; }
    G.data.entry = ""; G.data.scene = "Wild";
    this.makePlayer(sx, sy);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects);
    this.wolvesOut = false;
    // Forage: placed from the screen's own seed, so the same plants are there every visit.
    const fgen = rng(screenSeed(wx, wy) ^ 0x2545f491);
    this.placeForage(fgen, this.rec.terrain, 4 + Math.floor(fgen() * 4), (x, y) =>
      x > 1 && y > 1 && x < WW - 2 && y < WH - 2 && objs[y][x] === -1 && ground[y][x] !== T.PATH);
    this.spawnCreatures(p, gen);
    this.cameras.main.fadeIn(250);

    const t = terrain(this.rec.terrain);
    if (firstVisit) G.say(`New land: ${t.name} (${t.aretai}, ${t.element}). Here: ${this.rec.feature.toLowerCase()}.${this.rec.special ? " Something about this place feels set apart." : ""}`);
    else G.say(`${t.name}, as you left it.`);
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
    for (const [kind, n] of p.creatures) {
      for (let i = 0; i < n; i++) {
        if (gen() < 0.25) continue; // not every creature is home every time
        const [x, y] = spot();
        if (kind === "bird") {
          const flock: Animal[] = [];
          for (let j = 0; j < 3; j++) { const a = new Animal(this, "bird", x + j * 6, y + (j % 2) * 5, new Phaser.Geom.Rectangle(x - 120, y - 90, 240, 180), free); flock.push(a); this.animals.push(a); }
          flock.forEach((a) => (a.flock = flock));
        } else {
          const range = kind === "deer" ? 110 : 70;
          const a = new Animal(this, kind, x, y, new Phaser.Geom.Rectangle(x - range, y - range, range * 2, range * 2), free);
          this.physics.add.collider(a.sprite, this.objects);
          this.animals.push(a);
        }
      }
    }
  }

  /** Wolves hunt the forests from dusk. */
  wolvesOut = false;
  maybeWolves(gen: () => number = Math.random) {
    if (this.wolvesOut || this.rec.terrain !== 2 || (G.isDay && G.data.clock < G.daylight - 1)) return;
    this.wolvesOut = true;
    const n = 2 + (gen() < 0.5 ? 1 : 0);
    for (let tries = 0, made = 0; tries < 60 && made < n; tries++) {
      const x = 3 + Math.floor(gen() * (WW - 6)), y = 3 + Math.floor(gen() * (WH - 6));
      if (Math.hypot(x * TILE - this.player.x, y * TILE - this.player.y) < 140 || !this.free(x * TILE + 8, y * TILE + 8)) continue;
      const a = new Animal(this, "wolf", x * TILE + 8, y * TILE + 8, new Phaser.Geom.Rectangle(x * TILE - 90, y * TILE - 90, 180, 180), (px, py) => this.free(px, py));
      this.physics.add.collider(a.sprite, this.objects);
      this.animals.push(a); made++;
    }
    G.say("Somewhere in the trees, a wolf howls.");
  }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    this.updateAnimals(dt);
    if (!this.common(dt)) return;
    this.maybeWolves();
    const px = this.player.x, py = this.player.y;
    if (this.knock > 0) return; // a blow can't throw you onto the next map
    if (px < 7 && this.open.W) this.leaveFor(-1, 0, "E");
    else if (px > WW * TILE - 7 && this.open.E) this.leaveFor(1, 0, "W");
    else if (py < 6 && this.open.N) this.leaveFor(0, -1, "S");
    else if (py > WH * TILE - 12 && this.open.S) this.leaveFor(0, 1, "N");
  }

  subjectAt(): string | null {
    const [x, y] = this.facingTile();
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (OBJ_SUBJECT[obj]) return OBJ_SUBJECT[obj];
    return obj === -1 ? `t${this.rec.terrain}` : null;
  }

  leaveFor(dx: number, dy: number, entry: Side) {
    if (this.leaving) return;
    const nx = G.data.wx + dx, ny = G.data.wy + dy;
    G.data.lastTerrain = this.rec.terrain; G.data.entry = entry;
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

  openGround(x: number, y: number) { const o = this.objects.getTileAt(Math.floor(x / TILE), Math.floor(y / TILE))?.index ?? -1; return !BLOCKING.includes(o); }

  useItem() {
    const [x, y] = this.facingTile();
    if (x < 1 || y < 1 || x >= WW - 1 || y >= WH - 1) return;
    const item = G.selectedItem;
    const tool = item && ITEMS[item.id].kind === "tool" ? item.id : null;
    const obj = this.objects.getTileAt(x, y)?.index ?? -1;
    if (this.tryStrike(tool)) return;
    if (tool !== "hoe" && tool !== "jar" && this.gather(x, y)) return;
    if (tool === "hoe") { G.say("Save the hoe for your own fields."); return; }
    if (tool === "jar") { G.say("No water here. Springs and rivers come with the wider world."); return; }
    workObject(this, tool, obj, x, y, `${this.key}:${x},${y}`);
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
        objs[y].push(edge && !(x >= 19 && x <= 21) ? T.EDGE : -1);
      }
    }
    // The road through, and the square where it widens.
    for (let y = 0; y < VH; y++) ground[y][20] = T.PATH;
    for (let y = 12; y <= 18; y++) for (let x = 13; x <= 27; x++) ground[y][x] = T.PATH;
    for (const b of BUILDINGS) for (let y = b.ty + 3; y <= 12; y++) ground[y][b.tx + Math.floor(b.w / 32)] = T.PATH;
    for (const b of BUILDINGS) for (let y = 18; y <= b.ty + 3; y++) ground[y][b.tx + Math.floor(b.w / 32)] = T.PATH;
    // A few olives, flowers and stones about the place.
    for (const [x, y, t] of [[3, 12, T.OLIVE], [36, 12, T.OLIVE], [3, 16, T.FLOWERS], [36, 16, T.FLOWERS], [15, 3, T.FLOWERS], [24, 3, T.STONE], [16, 26, T.FLOWERS], [24, 27, T.OLIVE], [11, 15, T.FLOWERS], [29, 15, T.FLOWERS]] as [number, number, number][]) objs[y][x] = t;

    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: VW, height: VH });
    const ts = map.addTilesetImage("tiles", "tiles", TILE, TILE, 0, 0)!;
    map.createBlankLayer("ground", ts)!.putTilesAt(ground, 0, 0);
    this.objects = map.createBlankLayer("objects", ts)!;
    this.objects.putTilesAt(objs, 0, 0);
    this.objects.setCollision(BLOCKING).setDepth(1);

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
    // The village well, and the altar before the shrine.
    this.add.image(16 * TILE + 8, 14 * TILE + 6, "well").setDepth(14 * TILE + 14); solid(16 * TILE + 8, 14 * TILE + 10, 18, 10);
    this.add.image(31 * TILE + 8, 25 * TILE + 8, "altar").setDepth(25 * TILE + 12); solid(31 * TILE + 8, 25 * TILE + 10, 12, 6);
    this.targets.push(
      { x: 16 * TILE + 8, y: 15 * TILE, label: "The village well", act: () => G.say("The village well. With your water jar in hand, press Space here to fill it.") },
      { x: 31 * TILE + 8, y: 25 * TILE + 12, label: "The village altar", act: () => ui(this).openAltar("shrine") },
    );
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
    G.data.entry = ""; G.data.scene = "Village";
    this.makePlayer(sx, sy);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.objects);
    this.physics.add.collider(this.player, solids);
    // A flock of sparrows works the square for crumbs.
    const flock: Animal[] = [];
    for (let i = 0; i < 3; i++) { const a = new Animal(this, "bird", 23 * TILE + i * 6, 16 * TILE + (i % 2) * 5, new Phaser.Geom.Rectangle(14 * TILE, 12 * TILE, 13 * TILE, 6 * TILE)); flock.push(a); }
    flock.forEach((a) => (a.flock = flock));
    this.animals = flock;
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

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    for (const p of this.people) p.img.setVisible(G.isDay);
    this.updateAnimals(dt);
    if (!this.common(dt)) return;
    if (this.knock > 0) return;
    if (this.player.y < 6) this.leaveVillage("Farm");
    else if (this.player.y > VH * TILE - 12) this.leaveVillage("Wild");
  }

  leaveVillage(to: "Farm" | "Wild") {
    if (this.leaving) return;
    if (to === "Farm") { G.data.entry = "S"; G.data.scene = "Farm"; this.goTo("Farm"); return; }
    G.data.wx = 0; G.data.wy = 2; G.data.entry = "N"; G.data.lastTerrain = HOME_TERRAIN; G.data.scene = "Wild";
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
    if (tool === "jar" && x === 16 && (y === 14 || y === 15)) { G.data.jarWater = jarCap(); G.say("You fill the water jar at the village well."); return; }
    if (tool) { G.say("Not in the village. People live here."); return; }
  }
}

// ------------------------------------------------------------------ the HUD, hotbar, inventory, light, dialogs and sleep
const SLOT = 44, GAP = 4;
interface Cell { bg: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Image; qty: Phaser.GameObjects.Text; star: Phaser.GameObjects.Text }
const HOTBAR_X = (W - (SLOT * 10 + GAP * 9)) / 2, HOTBAR_Y = H - SLOT - 14;

class UIScene extends Phaser.Scene {
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
    this.add.rectangle(W - 312, 12, 300, 92, 0x1f1712, 0.78).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f);
    this.bars = this.add.graphics();
    this.thread = this.add.text(W - 16, 130, "", { ...font, fontSize: "13px", color: "#e8c0b0", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(1, 0);
    this.purse = this.add.text(W - 16, 110, "", { ...font, fontSize: "14px", color: "#e8e2d0", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(1, 0);

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

    for (let i = 0; i < 4; i++) this.log.push(this.add.text(W / 2, H - 230 + i * 22, "", { ...font, fontSize: "15px", stroke: "#1f1712", strokeThickness: 4 }).setOrigin(0.5).setDepth(3));

    // Keys: 1-0 choose a hotbar slot, the wheel cycles, I or Tab opens the inventory.
    const kb = this.input.keyboard!;
    kb.addCapture("TAB");
    kb.on("keydown", (e: KeyboardEvent) => {
      if (this.dialog) return;
      if (this.talkPanel && e.key >= "1" && e.key <= "9") { const o = this.talkOpts[Number(e.key) - 1]; if (o) o.fn(); return; }
      if (e.key >= "0" && e.key <= "9" && !this.modal) G.data.selected = (Number(e.key) + 9) % 10;
      if ((e.key === "i" || e.key === "I" || e.key === "Tab") && !this.market && !this.loreBook) this.toggleInventory();
      if ((e.key === "k" || e.key === "K") && !this.market && !this.inv && !this.craft) { if (this.loreBook) this.closeLore(); else this.openLore(); }
      if ((e.key === "c" || e.key === "C") && !this.market && !this.inv && !this.loreBook) { if (this.craft) this.closeCraft(); else this.openCraft(); }
      if ((e.key === "f" || e.key === "F") && !this.talkPanel) { if (this.sheet === "gods") this.closeSheet(); else this.openSheet("gods"); }
      if ((e.key === "p" || e.key === "P") && !this.talkPanel) { if (this.sheet === "self") this.closeSheet(); else this.openSheet("self"); }
    });
    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.modal) return;
      G.data.selected = (G.data.selected + (dy > 0 ? 1 : 9)) % 10;
    });

    this.makeHelp(font);
    G.say(`Dawn on your homestead. ${G.dateLabel()}. Press H for help.`);
  }

  makeHelp(font: { fontFamily: string; color: string }) {
    const helpText = [
      "Works & Days · Milestone 1",
      "",
      "Move: WASD or arrows     Run: hold Shift (spends Air Essence)",
      "Choose a tool or item: number keys 1–0, or the mouse wheel",
      "Use it: Space, on the ground in front of you",
      "Interact: E, when a prompt appears (doors, bed, hearth, signs)",
      "Inventory: I or Tab (click two slots to swap them)     Help: H",
      "Investigate: Q, on a creature, plant, stone or the land itself     What you know: K",
      "Bow: hold Space to aim, click where the arrow should land. It strikes only there, so lead moving quarry.",
      "Handwork: C (arrows from wood and stone)",
      "Forage: plants show what they bear only once you know them (Q to investigate), then gather with Space.",
      "Gods: F shows favor with the Twelve; pray and offer at altars (E). P: your Aretai and currencies.",
      "Danger: some beasts roll Aggression and charge. Run, strike (Space with axe, mattock or sickle), or calm them (E), food in hand.",
      "Blows cost Fatigue; fall when spent and your Life Thread frays.",
      "",
      "Hoe: till soil · Water jar: water tilled soil, refill at the well",
      "Sickle: brush and flowers · Axe: saplings and trees · Mattock: stones",
      "East of the farm lies the wild; south, the road to the village. Each new place stays as you found it.",
      "Villagers: E to talk, chat daily, give gifts (hold the item). Theron trades, Lykos upgrades tools.",
      "Crops: choose seeds and press Space on tilled soil; water daily; harvest with Space when ripe.",
      "Watered every night, or sown in the crop's patron hour, it grows finer (★). Trade at the pithos.",
      "Goats: pet and milk them daily (E); keep the manger in Fiber and the trough in water.",
      "The hive gives honey every few days. Wild creatures bolt if you run at them.",
      "",
      "Each of the day's twelve hours belongs to a god of the Cosmic Wheel.",
      "Work that matches the hour's Aretai costs less: tilling and brush in",
      "Demeter's hour (3), felling and stonework in Zeus's (12), running in Hermes's (10).",
      "",
      "Work builds Fatigue; each hour of sleep clears about 12%.",
      "Stay up past the second watch of the night and you will collapse.",
      "Watered soil dries overnight. Your life is saved each dawn.",
    ].join("\n");
    const hbg = this.add.rectangle(W / 2, H / 2, 880, 636, 0x1f1712, 0.96).setStrokeStyle(2, 0xc4703f);
    const ht = this.add.text(W / 2, H / 2, helpText, { ...font, fontSize: "15px", align: "center", lineSpacing: 3 }).setOrigin(0.5);
    this.help = this.add.container(0, 0, [hbg, ht]).setDepth(20).setVisible(true);
    this.modal = true;
    const closeHelp = () => { if (this.help.visible) { this.help.setVisible(false); this.modal = !!this.inv; } };
    this.input.keyboard!.on("keydown-H", () => {
      if (this.dialog || this.inv) return;
      this.help.setVisible(!this.help.visible); this.modal = this.help.visible;
    });
    for (const k of ["ESC", "ENTER", "SPACE"]) this.input.keyboard!.on(`keydown-${k}`, () => {
      if (this.ritual && k === "SPACE") return; else if (this.sheetPanel && k === "ESC") this.closeSheet(); else if (this.talkPanel && k === "ESC" && !this.ritual) this.closeTalk(); else if (this.craft && k === "ESC") this.closeCraft(); else if (this.loreBook && k !== "SPACE") this.closeLore(); else if (this.market && k === "ESC") this.closeMarket(); else if (this.inv && k === "ESC") this.toggleInventory(); else closeHelp();
    });
    this.input.keyboard!.on("keydown-E", () => { if (this.market) this.closeMarket(); else if (this.talkPanel) this.closeTalk(); });
    hbg.setInteractive().on("pointerdown", closeHelp);
  }

  prompt(label: string | null) { this.promptText.setText(label ? `E — ${label}` : ""); }

  update(_t: number, dms: number) {
    const dt = dms / 1000;
    this.date.setText(`${G.dateLabel()} · ${G.moon}`);
    this.timeText.setText(G.timeLabel());
    this.place.setText(G.locationLabel());
    this.purse.setText(`Purse: ${money(G.data.silver)}`);
    const lt = `Life Thread ${"●".repeat(G.data.lifeThread)}${"○".repeat(Math.max(0, START_LIFE_THREAD - G.data.lifeThread))}`;
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
    this.shade.setFillStyle(col, a);

    this.drawBars();
    this.drawHotbar();
    if (this.inv) this.drawInventory();

    G.messages.forEach((m) => (m.t += dt));
    G.messages = G.messages.filter((m) => m.t < 6).slice(-4);
    this.log.forEach((t, i) => {
      const m = G.messages[i];
      t.setText(m ? m.text : "").setAlpha(m ? Math.min(1, (6 - m.t) / 1.5) : 0);
    });
  }

  drawBars() {
    const g = this.bars; g.clear();
    const x = W - 300, y0 = 22;
    const bar = (label: string, y: number, frac: number, color: number) => {
      g.fillStyle(0x3a2c22).fillRect(x + 70, y, 210, 11);
      g.fillStyle(color).fillRect(x + 70, y, 210 * Math.max(0, Math.min(1, frac)), 11);
      if (!this.labels[label]) this.labels[label] = this.add.text(x, y - 3, label, { fontFamily: FONT, fontSize: "13px", color: "#f2e6c9" });
    };
    bar("Fatigue", y0, G.data.fatigue / 100, G.exhausted ? 0xb02a3a : 0xc98e62);
    bar("Earth", y0 + 16, G.essence.Earth / G.essenceMax.Earth, 0x6fae52);
    bar("Water", y0 + 32, G.essence.Water / G.essenceMax.Water, 0x3fa9a0);
    bar("Air", y0 + 48, G.essence.Air / G.essenceMax.Air, 0xc9c4e8);
    bar("Fire", y0 + 64, G.essence.Fire / G.essenceMax.Fire, 0xd63a2a);
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

  changeRel(id: string, d: number) { const r = G.npcRec(id); r.rel = Math.max(REL_MIN, Math.min(REL_MAX, r.rel + d)); return r.rel; }

  talkTo(v: Villager, said?: string) {
    const rec = G.npcRec(v.id), today = G.dayNumber;
    const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
    const line = said ?? `"${pick(v.lines[relTier(rec.rel)])}"`;
    const sub = `${v.household[0].toUpperCase() + v.household.slice(1)} · ${v.patron}'s household · ${relLabel(rec.rel)} (${rec.rel >= 0 ? "+" : ""}${rec.rel})`;
    const aph = G.boon("Aphrodite");
    const phoenix = (G.patron?.aretai === "Phoenix" ? 1 : 0) + (aph >= 2 ? 1 : aph <= -2 ? -1 : 0); // Aphrodite's hour and favor
    const welcome = G.blessed("hospitality") ? 1 : 0;
    const opts: { label: string; fn: () => void }[] = [];
    if (rec.talked !== today) opts.push({ label: "Chat a while", fn: () => {
      rec.talked = today; const gain = Math.max(0, 1 + phoenix + welcome); const r = this.changeRel(v.id, gain);
      this.talkTo(v, `"${pick(v.lines[relTier(r)])}"\n\n(${v.name} warms to you: +${gain}${phoenix > 0 ? ", Aphrodite smiles on it" : ""}${welcome ? ", the Hospitality Blessing" : ""}.)`);
    } });
    const held = G.selectedItem;
    if (held && ITEMS[held.id].kind !== "tool" && rec.gifted !== today) opts.push({ label: `Give ${v.name} your ${ITEMS[held.id].name.toLowerCase()}`, fn: () => {
      G.removeItem(held.id, 1); rec.gifted = today;
      const id = held.id, n = ITEMS[id].name.toLowerCase();
      let d = 1, say = `"Thank you. That's kind."`;
      if (v.loves.includes(id)) { d = 3; say = `"${n[0].toUpperCase() + n.slice(1)}! How did you know? Thank you, truly."`; }
      else if (v.likes.includes(id)) { d = 2; say = `"Oh, ${n}. I'll put this to good use."`; }
      else if (v.dislikes.includes(id)) { d = -2; say = `"...${n}. Well. Thank you, I suppose."`; }
      if (d > 0) d += phoenix;
      this.changeRel(v.id, d);
      this.talkTo(v, `${say}\n\n(${d >= 0 ? `+${d}` : d} with ${v.name}.)`);
    } });
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
      opts.push({ label: "Any news?", fn: () => this.talkTo(v, `"${pick(v.lines[rec.rel >= 4 ? "friend" : "new"])}"`) });
      const st = G.data.stranger;
      if (st) opts.push({ label: "Ask about the stranger", fn: () => this.talkTo(v, `"That one? ${STRANGER_KINDS[st.kind].desc[0].toUpperCase() + STRANGER_KINDS[st.kind].desc.slice(1)}. Came in ${G.dayNumber - st.arrived === 0 ? "this morning" : `${G.dayNumber - st.arrived} day${G.dayNumber - st.arrived > 1 ? "s" : ""} ago`}. Keeps to the bench out front. Be kind; you never know."`) });
    }
    this.showTalk(v.name, sub, line, opts, v.id);
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
    const held = G.selectedItem;
    if (!st.hosted) {
      if (held && GUEST_FOOD.includes(held.id)) opts.push({ label: `Welcome them, and offer your ${ITEMS[held.id].name.toLowerCase()}`, fn: () => this.hostStranger(held.id) });
      else opts.push({ label: "Offer hospitality", fn: () => this.talkToStranger(`The stranger smiles. "You're kind. Have you anything to eat? The road is long." (Hold some food in your hand: milk, honey, meat, fruit or grain.)`) });
    }
    this.showTalk("A stranger", kind.desc[0].toUpperCase() + kind.desc.slice(1), said ?? (st.hosted ? `"Thank you again for your kindness."` : greet[kind.look]), opts, kind.look);
  }

  hostStranger(food: string) {
    const st = G.data.stranger!; st.hosted = true;
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
        G.data.prayedDay = G.dayNumber;
        const n = (G.data.devotion[god] = (G.data.devotion[god] ?? 0) + 1);
        let note = `${DEVOTION_STEP - (n % DEVOTION_STEP)} more day${DEVOTION_STEP - (n % DEVOTION_STEP) > 1 ? "s" : ""} of prayer to be noticed further.`;
        if (n % DEVOTION_STEP === 0) {
          if (G.favor(god) < HOME_CAP) { G.addFavor(god, 1, HOME_CAP); note = `${god} has noticed your devotion: favor +1.`; }
          else note = `${god} knows your household well. To be known by name, bring offerings to the village altar.`;
        }
        if (n % DEVOTION_STEP === 0 && G.favor(god) >= HOME_CAP) note = note;
        this.openAltar("home", `You light the lamp, pour a little water, and pray to ${god}.\n\n${note}`);
      },
    }));
    this.showTalk("Pray to whom?", "Choose one god today. Each day of prayer counts toward their notice.", "", opts);
  }

  offer(where: "home" | "shrine", item: string, god: string, cap: number) {
    const today = G.dayNumber;
    const name = ITEMS[item].name.toLowerCase();
    // The chthonic powers take nothing by daylight, and only in the old ways.
    if (CHTHONIC.includes(god)) {
      if (G.isDay) { this.openAltar(where, `You hold out the ${name}, but it belongs to the one below, and he takes nothing by daylight.`); return; }
      if (G.data.offered[god] === today) { this.openAltar(where, "The earth has already drunk your offering tonight."); return; }
      G.removeItem(item, 1); G.data.offered[god] = today;
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
    if (G.favor(god) >= cap) {
      this.openAltar(where, where === "home" ? `${god} already knows your household. To be known by name, bring your offerings to the village altar.` : `${god} knows you well. Greater favor comes from deeds, festivals and the gods' own tests.`);
      return;
    }
    const slot = G.data.slots.find((s) => s && s.id === item && s.q === 3) ?? G.data.slots.find((s) => s && s.id === item);
    const fine = slot?.q === 3;
    G.removeItem(item, 1); G.data.offered[god] = today;
    const after = G.addFavor(god, fine ? 2 : 1, cap);
    this.openAltar(where, `You offer the ${fine ? "finest " : ""}${name} to ${god}, and the smoke rises straight. ${god} is pleased. (favor ${after >= 0 ? "+" : ""}${after})`);
  }

  hearthMenu(tend: () => void) {
    const opts = [{ label: "Tend the hearth", fn: () => { this.closeTalk(); tend(); } }];
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
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 12, title, { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 38, sub, { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
    return { root, font, w, h, x0, y0 };
  }

  buildGods() {
    const { root, font, x0, y0, h } = this.sheetFrame("The Twelve", "Favor runs from -12 to +12. Each tier of three brings more of a god's boon, or more of their anger.", 540);
    const g = this.add.graphics(); root.add(g);
    TWELVE.forEach((god, i) => {
      const y = y0 + 64 + i * 34, f = G.favor(god), w = WHEEL[i];
      root.add(this.add.rectangle(x0 + 20, y + 3, 10, 10, Phaser.Display.Color.HexStringToColor(w.color).color).setOrigin(0, 0));
      root.add(this.add.text(x0 + 38, y, `${god}`, { ...font, fontSize: "14px" }));
      root.add(this.add.text(x0 + 130, y + 1, `${w.aretai}`, { ...font, fontSize: "11px", color: "#c9b48f" }));
      const bx = x0 + 200, bw = 180, mid = bx + bw / 2;
      g.fillStyle(0x3a2c22).fillRect(bx, y + 4, bw, 8);
      g.fillStyle(f >= 0 ? 0xc9a35a : 0xb02a3a).fillRect(f >= 0 ? mid : mid + (f / 12) * (bw / 2), y + 4, Math.abs(f / 12) * (bw / 2), 8);
      g.fillStyle(0xf2e6c9).fillRect(mid, y + 2, 1, 12);
      root.add(this.add.text(bx + bw + 10, y, `${f >= 0 ? "+" : ""}${f}  ${favorLabel(f)}`, { ...font, fontSize: "13px", color: f > 0 ? "#fbe39a" : f < 0 ? "#e09080" : "#8d877b" }));
      root.add(this.add.text(x0 + 560, y + 1, BOONS[god], { ...font, fontSize: "11px", color: f !== 0 ? "#e8e2d0" : "#8d877b", wordWrap: { width: 240 } }));
    });
    const below = CHTHONIC.filter((c) => G.favor(c) !== 0);
    const y = y0 + 64 + 12 * 34 + 4;
    root.add(this.add.text(x0 + 20, y, below.length ? `Beneath the earth: ${below.map((c) => `${c} ${G.favor(c) >= 0 ? "+" : ""}${G.favor(c)}`).join(", ")}` : "Beneath the earth: silence.", { ...font, fontSize: "13px", color: "#a8a0c0" }));
    root.add(this.add.text(x0 + 20, y + 22, CURRENCIES.map((c) => `${c} ${G.data.currencies[c]}`).join("   ·   "), { ...font, fontSize: "14px", color: "#fbe39a" }));
    root.add(this.add.text(x0 + 820 / 2, y0 + h - 22, "F or Esc to close   ·   P for your Aretai", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
  }

  buildSelf() {
    const { root, font, x0, y0, h } = this.sheetFrame("Your Aretai", "Twelve excellences, in the order of the Cosmic Wheel. Spend Ambrosia to raise them.", 520);
    WHEEL.forEach((w, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6;
      const x = x0 + 24 + col * 400, y = y0 + 66 + row * 40;
      const v = G.data.aretai[w.aretai] ?? 0, cost = raiseCost(v);
      root.add(this.add.rectangle(x, y + 4, 10, 10, Phaser.Display.Color.HexStringToColor(w.color).color).setOrigin(0, 0));
      root.add(this.add.text(x + 18, y, `${w.aretai}  ${v}`, { ...font, fontSize: "16px" }));
      root.add(this.add.text(x + 18, y + 19, `${w.god} · ${w.benefit}`, { ...font, fontSize: "10px", color: "#c9b48f", wordWrap: { width: 230 } }));
      const ok = G.data.currencies.Ambrosia >= cost && v < 12;
      const t = this.add.text(x + 260, y + 2, v >= 12 ? "at its peak" : `raise: ${cost} Ambrosia`, { ...font, fontSize: "13px", color: ok ? "#f2e6c9" : "#8d877b" });
      if (ok) t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => {
        G.data.currencies.Ambrosia -= cost; G.data.aretai[w.aretai] = v + 1;
        G.essenceMax = essencePools(G.data.aretai);
        G.say(`Your ${w.aretai} rises to ${v + 1}.`);
        this.buildSelf();
      });
      root.add(t);
    });
    let y = y0 + 66 + 6 * 40 + 10;
    for (const c of CURRENCIES) {
      root.add(this.add.text(x0 + 24, y, `${c}  ${G.data.currencies[c]}`, { ...font, fontSize: "15px", color: c === "Hubris" ? "#e09080" : "#fbe39a" }));
      root.add(this.add.text(x0 + 160, y + 2, CURRENCY_DESC[c], { ...font, fontSize: "12px", color: "#c9b48f" }));
      y += 24;
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

  openCraft() {
    if (this.market || this.dialog || this.loreBook) return;
    if (this.inv) this.toggleInventory();
    if (this.help.visible) this.help.setVisible(false);
    this.modal = true; this.buildCraft();
  }
  closeCraft() { this.craft?.destroy(); this.craft = undefined; this.modal = this.help.visible || !!this.inv || !!this.market || !!this.loreBook; }

  /** Simple handwork you can do anywhere. A workbench will come with the homestead's structures. */
  buildCraft() {
    this.craft?.destroy();
    const font = { fontFamily: FONT, color: "#f2e6c9" };
    const w = 560, h = 90 + RECIPES.length * 56 + 40, x0 = (W - w) / 2, y0 = (H - h) / 2 - 30;
    const root = this.add.container(0, 0).setDepth(23);
    this.craft = root;
    root.add(this.add.rectangle(x0, y0, w, h, 0x1f1712, 0.97).setOrigin(0, 0).setStrokeStyle(2, 0xc4703f));
    root.add(this.add.text(W / 2, y0 + 12, "Handwork", { ...font, fontSize: "20px" }).setOrigin(0.5, 0));
    root.add(this.add.text(W / 2, y0 + 40, "Click a recipe to make it from what you carry.", { ...font, fontSize: "13px", color: "#c9b48f" }).setOrigin(0.5, 0));
    RECIPES.forEach((r, i) => {
      const y = y0 + 72 + i * 56;
      const ok = r.needs.every(([id, n]) => G.count(id) >= n);
      root.add(this.add.image(x0 + 34, y + 18, "items", r.out).setScale(2));
      const need = r.needs.map(([id, n]) => `${n} ${ITEMS[id].name} (have ${G.count(id)})`).join(", ");
      const t = this.add.text(x0 + 64, y, `${ITEMS[r.out].name} × ${r.qty}  ←  ${need}`, { ...font, fontSize: "15px", color: ok ? "#f2e6c9" : "#8d877b" });
      root.add(t);
      root.add(this.add.text(x0 + 64, y + 22, r.desc, { ...font, fontSize: "12px", color: "#c9b48f" }));
      if (ok) t.setInteractive({ useHandCursor: true }).on("pointerover", () => t.setColor("#f2c14e")).on("pointerout", () => t.setColor("#f2e6c9")).on("pointerdown", () => {
        if (labor({}, 1, "Techne") === null) return;
        for (const [id, n] of r.needs) G.removeItem(id, n);
        const qty = r.qty + (r.out === "Arrow" ? Math.max(0, G.boon("Hephaestus")) : 0);
        const left = G.addItem(r.out, qty);
        G.say(`You make ${qty - left} ${ITEMS[r.out].name.toLowerCase()}.${left ? " Your pack is full." : ""}${qty > r.qty ? " Hephaestus guides your hands." : ""}`);
        this.buildCraft();
      });
    });
    root.add(this.add.text(W / 2, y0 + h - 26, "C or Esc to close", { ...font, fontSize: "12px", color: "#c9b48f" }).setOrigin(0.5, 0));
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

  sleep(from: Phaser.Scene, collapsed: boolean, cause?: string) {
    this.modal = true;
    if (this.inv) this.toggleInventory();
    this.modal = true;
    const away = from.scene.key === "Wild";
    const { hoursSlept, recovered, notes } = G.sleep(collapsed);
    if (away && !cause) notes.unshift("A passing shepherd finds you and helps you home.");
    const wakeX = 3 * TILE, wakeY = 5 * TILE + 8; // beside the bed
    G.data.scene = "House"; G.data.px = wakeX; G.data.py = wakeY;
    const saved = G.save();
    const cover = this.add.rectangle(0, 0, W, H, 0x0b1630, 0).setOrigin(0, 0).setDepth(30);
    this.tweens.add({ targets: cover, fillAlpha: 1, duration: 600 });
    const lines = [
      cause ?? (collapsed ? "You collapse from exhaustion in the second watch of the night." : "You sleep."),
      "",
      `Dawn. ${G.dateLabel()}`,
      `${G.moon}`,
      "",
      `${hoursSlept.toFixed(1)} hours of sleep${collapsed ? " (poor rest: half counted)" : ""}, ${Math.round(recovered)} Fatigue cleared.`,
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
        G.data.scene = "House"; G.data.px = wakeX; G.data.py = wakeY;
        (from as PlayScene).leaving = true; // keep the old scene from moving us before it closes
        this.modal = false;
        from.scene.start("House");
      };
      this.input.keyboard!.once("keydown", go);
      this.input.once("pointerdown", go);
    });
  }
}

// ------------------------------------------------------------------ boot the game
(window as unknown as { game: Phaser.Game }).game = new Phaser.Game({
  type: Phaser.AUTO,
  width: W, height: H,
  parent: "game",
  backgroundColor: "#1f2a3a",
  pixelArt: true,
  physics: { default: "arcade", arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, FarmScene, HouseScene, WildScene, VillageScene, UIScene],
});

(window as unknown as { WHEEL: typeof WHEEL }).WHEEL = WHEEL;
(window as unknown as { Animal: typeof Animal }).Animal = Animal; // for testing from the console
