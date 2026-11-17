import Phaser from "phaser";

export type Species = "goat" | "hare" | "fox" | "bird" | "deer" | "boar";

interface SpeciesDef {
  name: string;
  walk: number; // wandering speed, px/s
  flee: number; // fleeing speed
  scare: number; // how close the player can come before it bolts, px
  idle: [number, number]; // seconds spent idling between wanders
  body: [number, number, number, number]; // physics body w, h, offset x, y
  frameRate: number;
}

export const SPECIES: Record<Species, SpeciesDef> = {
  goat: { name: "goat", walk: 14, flee: 0, scare: 0, idle: [1.5, 5], body: [10, 5, 3, 10], frameRate: 4 },
  hare: { name: "hare", walk: 22, flee: 100, scare: 44, idle: [1, 4], body: [8, 4, 4, 10], frameRate: 7 },
  fox: { name: "fox", walk: 28, flee: 95, scare: 64, idle: [0.6, 2.5], body: [10, 4, 3, 10], frameRate: 6 },
  deer: { name: "deer", walk: 20, flee: 110, scare: 72, idle: [1.5, 4], body: [10, 4, 3, 11], frameRate: 7 },
  boar: { name: "boar", walk: 16, flee: 80, scare: 36, idle: [1, 3.5], body: [11, 5, 2, 10], frameRate: 6 },
  bird: { name: "bird", walk: 0, flee: 85, scare: 40, idle: [0.6, 2], body: [4, 3, 6, 10], frameRate: 12 },
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * A creature with simple habits: it idles, wanders to a spot within its home,
 * and (if wild) bolts when the player comes too close. Birds take flight together
 * and settle somewhere else a little later.
 */
export class Animal {
  sprite: Phaser.Physics.Arcade.Sprite;
  state: "idle" | "walk" | "flee" | "gone" = "idle";
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
    if (this.state === "gone") {
      this.timer -= dt;
      if (this.timer <= 0) this.settle();
      return;
    }
    if (d.scare && this.state !== "flee") {
      const dist = Phaser.Math.Distance.Between(s.x, s.y, player.x, player.y);
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
          if (this.kind === "bird") { // birds hop and peck in place
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
        if (this.kind === "bird") {
          s.setAlpha(Math.max(0, s.alpha - dt * 0.8));
          if (this.timer <= 0) { this.state = "gone"; this.timer = rand(18, 40); s.setVisible(false); s.setVelocity(0, 0); }
        } else if (this.timer <= 0) { this.state = "idle"; this.timer = rand(...d.idle); }
        break;
    }
    // Animation: two frames while moving, the first at rest.
    const moving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 1;
    if (moving) {
      this.animT += dt * d.frameRate;
      s.setFrame(this.kind === "bird" ? 1 : Math.floor(this.animT) % 2);
      if (Math.abs(body.velocity.x) > 0.5) s.setFlipX(body.velocity.x < 0);
    } else s.setFrame(0);
    s.setDepth(this.state === "flee" && this.kind === "bird" ? 9999 : s.y);
  }

  /** Run (or fly) away from the player. */
  bolt(from: { x: number; y: number }) {
    const s = this.sprite, d = this.def;
    let ang = Math.atan2(s.y - from.y, s.x - from.x) + rand(-0.5, 0.5);
    if (this.kind === "bird") ang = Math.atan2(-1, Math.sign(s.x - from.x) || 1) + rand(-0.4, 0.4); // up and away
    s.setVelocity(Math.cos(ang) * d.flee, Math.sin(ang) * d.flee);
    this.state = "flee";
    this.timer = this.kind === "bird" ? 1.4 : rand(0.9, 1.4);
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
