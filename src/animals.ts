import Phaser from "phaser";

export type Species = "goat" | "hare" | "fox" | "bird" | "deer" | "boar" | "wolf" | "bat" | "myrmex" | "eidolon" | "lampad" | "centaur" | "skeleton" | "empousa"
  | "heron" | "duck" | "gull" | "crab" | "jackal" | "scorpion" | "ibex" | "bear" | "horse" | "bustard" | "eagle" | "pigeon"
  | "siren" | "sphinx" | "lion" | "stymphalian" | "strix";

interface SpeciesDef {
  name: string;
  walk: number; // wandering speed, px/s
  flee: number; // fleeing speed
  scare: number; // how close the player can come before it bolts, px
  idle: [number, number]; // seconds spent idling between wanders
  body: [number, number, number, number]; // physics body w, h, offset x, y
  frameRate: number;
  aggression: number; // a d12 at or under this when it notices you means it comes at you
  charge: number; // charging speed, px/s
  damage: number; // Fatigue dealt by a blow
  notice?: number; // how far off it notices you (default: its scare distance, at least 40)
  giveUp?: number; // how far you must get before a charge is abandoned (default 230)
  flies?: boolean; // hops in place, flies up and away when scared
}

export const SPECIES: Record<Species, SpeciesDef> = {
  goat: { name: "goat", walk: 14, flee: 0, scare: 0, idle: [1.5, 5], body: [10, 5, 3, 10], frameRate: 4, aggression: 0, charge: 0, damage: 0 },
  hare: { name: "hare", walk: 22, flee: 100, scare: 44, idle: [1, 4], body: [8, 4, 4, 10], frameRate: 7, aggression: 0, charge: 0, damage: 0 },
  fox: { name: "fox", walk: 28, flee: 95, scare: 64, idle: [0.6, 2.5], body: [10, 4, 3, 10], frameRate: 6, aggression: 2, charge: 85, damage: 5 },
  wolf: { name: "wolf", walk: 30, flee: 100, scare: 80, idle: [0.6, 2], body: [11, 4, 2, 10], frameRate: 7, aggression: 6, charge: 108, damage: 10 },
  deer: { name: "deer", walk: 20, flee: 110, scare: 72, idle: [1.5, 4], body: [10, 4, 3, 11], frameRate: 7, aggression: 1, charge: 95, damage: 8 },
  boar: { name: "boar", walk: 16, flee: 80, scare: 48, idle: [1, 3.5], body: [11, 5, 2, 10], frameRate: 6, aggression: 5, charge: 100, damage: 15 },
  bat: { name: "bat", walk: 40, flee: 90, scare: 30, idle: [0.2, 0.8], body: [6, 4, 5, 6], frameRate: 14, aggression: 0, charge: 0, damage: 0 },
  myrmex: { name: "myrmex", walk: 16, flee: 0, scare: 0, idle: [1, 3], body: [14, 6, 1, 9], frameRate: 8, aggression: 8, charge: 92, damage: 12, notice: 84 },
  eidolon: { name: "eidolon", walk: 8, flee: 0, scare: 0, idle: [1.5, 4], body: [8, 6, 4, 9], frameRate: 3, aggression: 6, charge: 42, damage: 5, notice: 72 }, // slow, drifting; a chill touch (2 Vitality)
  lampad: { name: "lampad", walk: 6, flee: 0, scare: 0, idle: [2, 5], body: [8, 6, 4, 9], frameRate: 3, aggression: 1, charge: 50, damage: 5, notice: 70 },
  // Wandering monsters (AEGIS Terata). The centaur gallops; the dead march and never tire.
  centaur: { name: "centaur", walk: 26, flee: 0, scare: 0, idle: [1, 3], body: [14, 6, 5, 16], frameRate: 8, aggression: 5, charge: 118, damage: 13, notice: 120, giveUp: 320 },
  skeleton: { name: "skeleton", walk: 12, flee: 0, scare: 0, idle: [1.5, 4], body: [8, 5, 4, 11], frameRate: 5, aggression: 6, charge: 36, damage: 10, notice: 96, giveUp: 600 },
  empousa: { name: "empousa", walk: 18, flee: 0, scare: 0, idle: [1, 3], body: [8, 5, 4, 11], frameRate: 4, aggression: 6, charge: 74, damage: 12, notice: 110, giveUp: 300 },
  bird: { name: "bird", walk: 0, flee: 85, scare: 40, idle: [0.6, 2], body: [4, 3, 6, 10], frameRate: 12, aggression: 0, charge: 0, damage: 0, flies: true },
  // The far lands (Flora & Fauna).
  duck: { name: "duck", walk: 0, flee: 80, scare: 46, idle: [0.8, 2.5], body: [6, 3, 5, 10], frameRate: 10, aggression: 0, charge: 0, damage: 0, flies: true },
  gull: { name: "gull", walk: 0, flee: 90, scare: 50, idle: [0.6, 2], body: [6, 3, 5, 10], frameRate: 10, aggression: 0, charge: 0, damage: 0, flies: true },
  pigeon: { name: "pigeon", walk: 0, flee: 85, scare: 40, idle: [0.6, 2], body: [5, 3, 5, 10], frameRate: 12, aggression: 0, charge: 0, damage: 0, flies: true },
  heron: { name: "heron", walk: 0, flee: 75, scare: 60, idle: [2, 5], body: [5, 3, 6, 12], frameRate: 6, aggression: 0, charge: 0, damage: 0, flies: true },
  eagle: { name: "eagle", walk: 0, flee: 100, scare: 70, idle: [1.5, 4], body: [6, 3, 5, 3], frameRate: 6, aggression: 0, charge: 0, damage: 0, flies: true },
  crab: { name: "crab", walk: 10, flee: 34, scare: 26, idle: [1, 3], body: [8, 4, 4, 11], frameRate: 8, aggression: 1, charge: 30, damage: 3 },
  jackal: { name: "jackal", walk: 28, flee: 95, scare: 60, idle: [0.6, 2.5], body: [10, 4, 3, 10], frameRate: 7, aggression: 4, charge: 92, damage: 6 },
  scorpion: { name: "scorpion", walk: 9, flee: 22, scare: 22, idle: [1.5, 4], body: [8, 4, 4, 11], frameRate: 8, aggression: 4, charge: 40, damage: 8, notice: 34 },
  ibex: { name: "wild goat", walk: 20, flee: 112, scare: 70, idle: [1.2, 3.5], body: [10, 4, 3, 11], frameRate: 7, aggression: 1, charge: 90, damage: 7 },
  bear: { name: "bear", walk: 16, flee: 60, scare: 56, idle: [1.5, 4], body: [12, 5, 2, 10], frameRate: 5, aggression: 6, charge: 102, damage: 18, notice: 90 },
  horse: { name: "wild horse", walk: 26, flee: 140, scare: 84, idle: [1.2, 3.5], body: [12, 4, 2, 11], frameRate: 8, aggression: 0, charge: 0, damage: 0 },
  bustard: { name: "bustard", walk: 14, flee: 92, scare: 52, idle: [1, 3], body: [8, 4, 4, 11], frameRate: 8, aggression: 0, charge: 0, damage: 0 },
  // More wandering monsters (AEGIS Terata).
  siren: { name: "siren", walk: 0, flee: 0, scare: 0, idle: [2, 5], body: [8, 5, 4, 11], frameRate: 4, aggression: 5, charge: 60, damage: 12, notice: 150, giveUp: 260 },
  sphinx: { name: "sphinx", walk: 10, flee: 0, scare: 0, idle: [2, 5], body: [14, 6, 5, 16], frameRate: 4, aggression: 6, charge: 96, damage: 16, notice: 120, giveUp: 320 },
  lion: { name: "lion", walk: 18, flee: 0, scare: 0, idle: [1.5, 4], body: [12, 5, 2, 10], frameRate: 6, aggression: 8, charge: 118, damage: 20, notice: 110, giveUp: 300 },
  stymphalian: { name: "stymphalian bird", walk: 14, flee: 0, scare: 0, idle: [0.6, 2], body: [8, 4, 4, 10], frameRate: 10, aggression: 7, charge: 80, damage: 9, notice: 130, giveUp: 300 },
  strix: { name: "strix", walk: 20, flee: 0, scare: 0, idle: [0.6, 2], body: [8, 4, 4, 10], frameRate: 10, aggression: 5, charge: 100, damage: 10, notice: 120, giveUp: 260 },
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * A creature with simple habits: it idles, wanders to a spot within its home,
 * and (if wild) bolts when the player comes too close. Birds take flight together
 * and settle somewhere else a little later.
 */
export class Animal {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: "idle" | "walk" | "flee" | "gone" | "dead" | "charge" | "recoil" = "idle";
  /** Has it rolled its Aggression this encounter? It may roll again after a while apart. */
  rolled = false;
  rerollT = 0;
  appeased = false;
  /** A shade that has already shrunk from the light once (so it is said only once). */
  shunned = false;
  /** A ghost circling a crossroads or graveyard on the night of Noumenia: the center, radius and its place in the ring. */
  orbit?: { cx: number; cy: number; r: number; phase: number };
  /** The scene decides what happens when it notices you (the Aggression roll) and when it lands a blow. */
  decide?: (a: Animal) => void;
  strikes?: (a: Animal) => void;
  hp = -1; // set from the quarry table on the first hit
  timer: number;
  tx = 0; ty = 0;
  animT = 0;
  flock: Animal[] = [];

  constructor(
    public scene: Phaser.Scene,
    public kind: Species,
    x: number, y: number,
    public home: Phaser.Geom.Rectangle,
    public isFree: (x: number, y: number) => boolean = () => true,
  ) {
    const d = SPECIES[kind];
    this.sprite = scene.physics.add.sprite(x, y, kind, 0);
    this.sprite.setSize(d.body[0], d.body[1]).setOffset(d.body[2], d.body[3]);
    this.sprite.setFlipX(Math.random() < 0.5);
    this.timer = rand(0, 2);
  }

  get def() { return SPECIES[this.kind]; }

  update(dt: number, player: { x: number; y: number }, scareMult: number) {
    const s = this.sprite, d = this.def;
    if (this.state === "dead") return;
    if (this.state === "gone") {
      this.timer -= dt;
      if (this.timer <= 0) this.settle();
      return;
    }
    const dist = Phaser.Math.Distance.Between(s.x, s.y, player.x, player.y);
    if (this.rolled && this.state !== "charge" && this.state !== "recoil" && (this.rerollT -= dt) <= 0 && dist > d.scare * 2) this.rolled = false;
    // Noticing you: the creature rolls its Aggression (the scene decides: charge, or flee as usual).
    if (d.aggression > 0 && !this.rolled && !this.appeased && this.state !== "flee" && dist < (d.notice ?? Math.max(d.scare, 40)) * scareMult && this.decide) {
      this.rolled = true; this.rerollT = 25;
      this.decide(this);
    }
    if (this.state === "charge" || this.state === "recoil") { this.hunt(dt, player, dist); this.animate(dt); return; }
    if (d.scare && this.state !== "flee" && !this.appeased) {
      if (dist < d.scare * scareMult) {
        for (const a of this.flock.length ? this.flock : [this]) if (a.state !== "flee" && a.state !== "gone") a.bolt(player);
      }
    }
    this.timer -= dt;
    const body = s.body as Phaser.Physics.Arcade.Body;
    switch (this.state) {
      case "idle":
        s.setVelocity(0, 0);
        if (this.timer <= 0) {
          if (SPECIES[this.kind].flies) { // birds hop and peck in place
            s.setFlipX(!s.flipX);
            this.timer = rand(...d.idle);
          } else {
            this.tx = rand(this.home.left, this.home.right);
            this.ty = rand(this.home.top, this.home.bottom);
            this.state = "walk"; this.timer = 4;
          }
        }
        break;
      case "walk": {
        const dx = this.tx - s.x, dy = this.ty - s.y, len = Math.hypot(dx, dy);
        if (len < 3 || this.timer <= 0 || (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down)) {
          this.state = "idle"; this.timer = rand(...d.idle); s.setVelocity(0, 0);
        } else s.setVelocity((dx / len) * d.walk, (dy / len) * d.walk);
        break;
      }
      case "flee":
        if (SPECIES[this.kind].flies) {
          s.setAlpha(Math.max(0, s.alpha - dt * 0.8));
          if (this.timer <= 0) { this.state = "gone"; this.timer = rand(18, 40); s.setVisible(false); s.setVelocity(0, 0); }
        } else if (this.timer <= 0) { this.state = "idle"; this.timer = rand(...d.idle); }
        break;
    }
    this.animate(dt);
  }

  /** Charging the player, falling back after a blow, and giving up if outrun. */
  chaseT = 0;
  hunt(dt: number, player: { x: number; y: number }, dist: number) {
    const s = this.sprite, d = this.def;
    this.timer -= dt; this.chaseT -= dt;
    if (this.state === "recoil") {
      if (this.timer <= 0) { this.state = "charge"; }
      return;
    }
    if (this.chaseT <= 0 || dist > (d.giveUp ?? 230)) { this.state = "idle"; this.timer = 2; s.setVelocity(0, 0); return; } // it gives up
    const ang = Math.atan2(player.y + 3 - s.y, player.x - s.x);
    s.setVelocity(Math.cos(ang) * d.charge, Math.sin(ang) * d.charge);
    if (dist < 10) {
      this.strikes?.(this);
      this.state = "recoil"; this.timer = 0.7;
      s.setVelocity(-Math.cos(ang) * 60, -Math.sin(ang) * 60);
    }
  }

  charge(seconds = 5) { this.state = "charge"; this.chaseT = seconds; }

  animate(dt: number) {
    const s = this.sprite, d = this.def;
    const body = s.body as Phaser.Physics.Arcade.Body;
    // Animation: two frames while moving, the first at rest.
    const moving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 1;
    if (moving) {
      this.animT += dt * d.frameRate;
      s.setFrame(SPECIES[this.kind].flies ? 1 : Math.floor(this.animT) % 2);
      if (Math.abs(body.velocity.x) > 0.5) s.setFlipX(body.velocity.x < 0);
    } else s.setFrame(0);
    s.setDepth(this.state === "flee" && SPECIES[this.kind].flies ? 9999 : s.y);
    void d;
  }

  /** Run (or fly) away from the player. */
  bolt(from: { x: number; y: number }) {
    const s = this.sprite, d = this.def;
    let ang = Math.atan2(s.y - from.y, s.x - from.x) + rand(-0.5, 0.5);
    if (SPECIES[this.kind].flies) ang = Math.atan2(-1, Math.sign(s.x - from.x) || 1) + rand(-0.4, 0.4); // up and away
    s.setVelocity(Math.cos(ang) * d.flee, Math.sin(ang) * d.flee);
    this.state = "flee";
    this.timer = SPECIES[this.kind].flies ? 1.4 : rand(0.9, 1.4);
  }

  /** A bird comes down again somewhere in its home range. */
  settle() {
    for (let tries = 0; tries < 20; tries++) {
      const x = rand(this.home.left, this.home.right), y = rand(this.home.top, this.home.bottom);
      if (!this.isFree(x, y)) continue;
      this.sprite.setPosition(x, y).setVisible(true).setAlpha(0);
      this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 600 });
      this.state = "idle"; this.timer = rand(...this.def.idle);
      return;
    }
    this.timer = 5;
  }
}
