/**
 * Ordinary people: the households of the village who go about their day, and the folk of the lonely huts in the wild.
 * They walk, fetch water, gossip in pairs, watch their children play and go home at dusk.
 */
import Phaser from "phaser";
import { makeFigureTexture, POSES, POSE, TILE } from "./textures";
import { rng, type GameState } from "./state";

const FONT = "Georgia, 'Times New Roman', serif";

// ------------------------------------------------------------------ names and trades
export const MEN = ["Alkimos", "Bion", "Chremes", "Demeas", "Euphron", "Glaukos", "Hippias", "Ktesias", "Laches", "Mnason", "Nikon", "Polemon", "Simon", "Timon", "Xanthos", "Zopyros", "Ariston", "Kimon"];
export const WOMEN = ["Agariste", "Chloe", "Daphne", "Eudoxia", "Gorgo", "Harmonia", "Iole", "Kallirhoe", "Lysandra", "Melitta", "Nausikaa", "Phile", "Rhode", "Sostrate", "Thaleia", "Xene", "Arete", "Korinna"];
export const CHILDREN = ["little Bion", "Pais", "Nikoleos", "Melissa", "Kore", "Teukros", "Ione", "Philinna"];

export interface Trade { id: string; name: string; patron: string; lines: string[]; tip: string }
export const TRADES: Trade[] = [
  { id: "potter", name: "the potter's household", patron: "Hephaestus", lines: ["\"Kiln's hot today. Don't touch the jars.\"", "\"Clay from the hills fires red; marsh clay grey.\""], tip: "\"Bring me ochre from the hills and Lykos will want to buy it, mark me.\"" },
  { id: "weaver", name: "the weaver's household", patron: "Athena", lines: ["\"The loom never stops in this house.\"", "\"Athena gave us the loom. We give her our evenings.\""], tip: "\"Flax wants the spring; wool wants a good shepherd.\"" },
  { id: "goatherd", name: "the goatherd's household", patron: "Dionysus", lines: ["\"The goats went up the hill again. They always go up.\"", "\"Goat's milk and a little honey. What else is there?\""], tip: "\"Out past the plains, folk live alone in huts. Shepherds mostly. They'll feed a guest.\"" },
  { id: "carpenter", name: "the carpenter's household", patron: "Athena", lines: ["\"Oak for the frame, pine for the beams.\"", "\"Every house here, my grandfather raised.\""], tip: "\"Black pine grows up on the sacred mountains. Good straight timber.\"" },
  { id: "beekeeper", name: "the beekeeper's household", patron: "Demeter", lines: ["\"The bees are cross today. It'll rain.\"", "\"Thyme honey is the best honey. Don't let anyone tell you different.\""], tip: "\"When the snail climbs the stalk, put down your mattock and pick up your sickle.\"" },
  { id: "basketmaker", name: "the basket-maker's household", patron: "Demeter", lines: ["\"Reeds from the marsh, willow from the stream.\"", "\"My fingers know the weave in the dark.\""], tip: "\"The marsh mud will suck your sandals off. Go round the pools.\"" },
  { id: "oldsoldier", name: "the old soldier's household", patron: "Ares", lines: ["\"I stood in the line at the river ford, you know. Long ago.\"", "\"Keep your spear arm loose and your shield high.\""], tip: "\"Out in the forests there are horse-men. Wine makes them friends. Insults make them anything but.\"" },
  { id: "midwife", name: "the midwife's household", patron: "Artemis", lines: ["\"Three babes this month. Artemis keeps me busy.\"", "\"Mugwort for dreams, chamomile for sleep.\""], tip: "\"If a lovely stranger meets you in the meadow at dusk, look at her feet.\"" },
  { id: "baker", name: "the baker's household", patron: "Demeter", lines: ["\"Barley cakes, hot. Well, warm.\"", "\"The mill turns, the oven burns.\""], tip: "\"When the cranes go over crying, my husband sows. Every year, like a clock.\"" },
  { id: "charcoal", name: "the charcoal-burner's household", patron: "Hephaestus", lines: ["\"Smell that? That's a good burn.\"", "\"Lykos takes all the charcoal I can make.\""], tip: "\"There's a cave up in the hills. Take a torch, or don't go.\"" },
];

/** Little exchanges people trade when they meet: [first speaker, second speaker]. */
export const GOSSIP: [string, string][] = [
  ["Rain coming?", "My knee says yes."], ["Did you see the stranger at the inn?", "Kept to himself."], ["The barley looks thin.", "Demeter will provide."],
  ["Your goat was in my garden.", "She has good taste."], ["Lykos burned his hand again.", "Ha! Again?"], ["Festival soon.", "I'll need new sandals."],
  ["The new farmer on the old homestead...", "Works hard, I'll say that."], ["Wolves on the hill last night.", "Keep the dog in."], ["Owl on the roof this morning.", "Athena's watching, then."],
  ["Heard thunder from a clear sky.", "Zeus is restless."], ["How's your mother?", "Stubborn as ever."], ["That honey was good.", "Thyme honey. Always thyme."],
];

// ------------------------------------------------------------------ the village households
export interface Folk { id: string; name: string; age: "adult" | "elder" | "child"; female: boolean; look: { tunic: string; hair: string; skin: string }; extras: { beard?: boolean; long?: boolean; veil?: string } }
export interface Household { trade: Trade; house: { tx: number; ty: number; key: string }; members: Folk[] }

const TUNIC = ["#e9e1cf", "#b0412f", "#3a6a7a", "#6f8a3a", "#7a3a6a", "#c9a35a", "#5a4a3a", "#d8c8a8", "#8a6a4a"];
const HAIR = ["#4a3324", "#2a1d14", "#8a4a2a", "#5a3a22", "#1a1410"];
const SKIN = ["#c98e62", "#e0b08a", "#a8744a", "#b88a62", "#7a5034"];
const VEIL = ["#d8d0c0", "#8a5a7a", "#5a6a8a", "#c8b890"];

/** Where the extra houses stand (top-left tile); each gets a household drawn from the world seed. */
export const HOUSE_SPOTS: [number, number][] = [[13, 3], [23, 3], [2, 10], [35, 10], [12, 21], [24, 22]];

export function makeFolk(r: () => number, id: string, age: Folk["age"], female: boolean, used: Set<string>): Folk {
  const pool = age === "child" ? CHILDREN : female ? WOMEN : MEN;
  let name = pool[Math.floor(r() * pool.length)];
  for (let i = 0; i < 6 && used.has(name); i++) name = pool[Math.floor(r() * pool.length)];
  used.add(name);
  const hair = age === "elder" ? (r() < 0.5 ? "#d8d8d0" : "#a8a8a0") : HAIR[Math.floor(r() * HAIR.length)];
  return {
    id, name, age, female,
    look: { tunic: TUNIC[Math.floor(r() * TUNIC.length)], hair, skin: SKIN[Math.floor(r() * SKIN.length)] },
    extras: female ? (r() < 0.45 ? { veil: VEIL[Math.floor(r() * VEIL.length)] } : { long: true }) : { beard: age !== "child" && r() < 0.7 },
  };
}

/** The village's ordinary households, the same for the whole of a world. */
export function villageHouseholds(seed: number): Household[] {
  const r = rng((seed ^ 0x40c5e) >>> 0), used = new Set<string>();
  const trades = [...TRADES].sort(() => r() - 0.5);
  return HOUSE_SPOTS.map(([tx, ty], i) => {
    const trade = trades[i % trades.length];
    const members: Folk[] = [];
    const n = 1 + Math.floor(r() * 3);
    members.push(makeFolk(r, `v${i}a`, r() < 0.2 ? "elder" : "adult", r() < 0.5, used));
    if (n >= 2) members.push(makeFolk(r, `v${i}b`, "adult", !members[0].female, used));
    if (n >= 3 || r() < 0.4) members.push(makeFolk(r, `v${i}c`, r() < 0.7 ? "child" : "elder", r() < 0.5, used));
    return { trade, house: { tx, ty, key: `cottage${i % 3}` }, members };
  });
}

// ------------------------------------------------------------------ the folk of the wild huts
export interface HutKind { id: string; title: string; patron: string; terrains: number[]; greeting: string; special: string; goods: [string, number][] }
export const HUT_KINDS: HutKind[] = [
  { id: "shepherd", title: "A shepherd family", patron: "Hermes", terrains: [1, 9, 10, 12], greeting: "\"A traveler! Sit, sit. There's milk, and the fire's lit.\"", special: "Share their milk", goods: [["Milk", 4], ["Hide", 6], ["Syrinx", 12]] },
  { id: "charcoal", title: "A charcoal-burner", patron: "Hephaestus", terrains: [2, 4], greeting: "\"Mind the clamp, it's smoldering. You're a long way from anywhere.\"", special: "Take a few torches", goods: [["Torch", 3], ["Wood", 2]] },
  { id: "rootcutter", title: "A root-cutter woman", patron: "Hecate", terrains: [1, 5, 9], greeting: "\"I cut roots by moonlight. Don't stare. Do you want to learn something or not?\"", special: "Learn a plant from her", goods: [["Thyme", 3], ["Mint", 4]] },
  { id: "hunter", title: "A hunter and his sons", patron: "Artemis", terrains: [2, 9, 4], greeting: "\"You walk loud. Every deer for a mile knows you're here.\"", special: "Ask for a lesson with the bow", goods: [["Arrow", 2], ["Meat", 5]] },
  { id: "hermit", title: "A hermit", patron: "Apollo", terrains: [8, 11, 12, 9], greeting: "\"Few come this far. Fewer come by chance. Sit.\"", special: "Ask what he sees in you", goods: [] },
  { id: "fisher", title: "A fisher family", patron: "Poseidon", terrains: [7, 5], greeting: "\"The sea gave little today, but there's enough for a guest.\"", special: "Share their catch", goods: [["SeaFennel", 3], ["Meat", 5]] },
  { id: "goatherd", title: "A goatherd", patron: "Dionysus", terrains: [11, 4, 10], greeting: "\"The goats saw you before I did. They're cleverer than me.\"", special: "Share their milk", goods: [["Milk", 4], ["Hide", 6], ["Syrinx", 12]] },
];

// ------------------------------------------------------------------ people walking about
/**
 * One walking person. Give them places to go and they go: to the well, to the square, home at dusk, to talk with a neighbor.
 * They collide with houses and walls like the player; children run and play.
 */
export class Walker {
  sprite: Phaser.Physics.Arcade.Sprite;
  tx = 0; ty = 0; wait = 0; facing = 0; walkT = 0;
  doing: "idle" | "walk" | "talk" | "home" = "idle";
  talkWith?: Walker; bubbleT = 0; talkLeft = 0; line = 0; pair?: [string, string];
  constructor(public scene: Phaser.Scene, public folk: Folk, x: number, y: number, public home: [number, number]) {
    const key = `folk_${folk.id}`;
    if (!scene.textures.exists(key)) makeFigureTexture(scene, key, folk.look, folk.extras);
    this.sprite = scene.physics.add.sprite(x, y, key, 0);
    this.sprite.setSize(8, 5).setOffset(4, 10);
    if (folk.age === "child") this.sprite.setScale(0.8);
  }
  get speed() { return this.folk.age === "child" ? 34 : this.folk.age === "elder" ? 14 : 22; }
  goTo(x: number, y: number) { this.tx = x; this.ty = y; this.doing = "walk"; this.wait = 12; }
  update(dt: number, paused: boolean) {
    const s = this.sprite;
    if (paused) { s.setVelocity(0, 0); return; }
    let moving = false;
    if (this.doing === "walk" || this.doing === "home") {
      const dx = this.tx - s.x, dy = this.ty - s.y, d = Math.hypot(dx, dy);
      this.wait -= dt;
      if (d < 4 || this.wait <= 0) { s.setVelocity(0, 0); this.doing = this.doing === "home" ? "home" : "idle"; this.wait = 2 + Math.random() * 5; }
      else { s.setVelocity((dx / d) * this.speed, (dy / d) * this.speed); moving = true; this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; }
    } else { s.setVelocity(0, 0); this.wait -= dt; }
    if (this.doing === "talk" && this.talkWith) {
      const o = this.talkWith.sprite, dx = o.x - s.x, dy = o.y - s.y;
      this.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0;
    }
    if (moving) this.walkT += dt; else this.walkT = 0;
    const pose = moving ? [POSE.walk1, POSE.stand, POSE.walk2, POSE.stand][Math.floor(this.walkT / 0.14) % 4] : POSE.stand;
    s.setFrame(this.facing * POSES + pose);
    s.setDepth(s.y);
  }
  /** A little speech bubble over the head. */
  say(text: string) {
    const t = this.scene.add.text(this.sprite.x, this.sprite.y - 12, text, { fontFamily: FONT, fontSize: "6px", color: "#2a1d14", backgroundColor: "#f2e6c9", padding: { x: 2, y: 1 }, wordWrap: { width: 90 } })
      .setOrigin(0.5, 1).setResolution(5).setDepth(99990);
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 2200, duration: 400, onComplete: () => t.destroy() });
    const follow = this.scene.time.addEvent({ delay: 30, loop: true, callback: () => { if (!t.active) { follow.remove(); return; } t.setPosition(this.sprite.x, this.sprite.y - 12); } });
  }
}

/** Pick a gossip pair for two people meeting. */
export const pickGossip = () => GOSSIP[Math.floor(Math.random() * GOSSIP.length)];
export type { GameState };
