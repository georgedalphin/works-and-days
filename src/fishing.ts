/**
 * Fishing: a rod of cornel or oak with a twisted line and a bronze hook. Cast into water, wait for the float to dip,
 * strike, then bring the fish in: press as the mark crosses the green. Metis is the fisher's Aretai (Poseidon's place on the wheel).
 * Fresh water and the sea hold different fish; the deep holds the big ones; dawn, dusk and rain bring them up.
 */
import { ITEMS, RECIPES } from "./data";
import { INGREDIENTS } from "./cooking";
import { OFFER_PATRON } from "./gods";

export interface FishDef {
  id: string; name: string; greek: string; value: number;
  /** Where: fresh water (rivers, lakes, marsh) or the sea (the coast), and whether it needs deep water. */
  water: "fresh" | "sea"; deep?: boolean; terrains?: number[];
  /** How often it bites, relative to the others there. */
  weight: number;
  /** Hits needed to land it, and misses it allows (it slips the hook after that). */
  hits: number; misses: number; speed: number;
  /** When it bites best. */
  when?: "dawn" | "dusk" | "night" | "rain";
  god?: string; desc: string;
}
export const FISH: FishDef[] = [
  // Fresh water.
  { id: "Chub", name: "Chub", greek: "kephalos", value: 3, water: "fresh", weight: 10, hits: 2, misses: 3, speed: 1, desc: "A common river fish, bony but filling." },
  { id: "Perch", name: "Perch", greek: "perke", value: 4, water: "fresh", weight: 7, hits: 3, misses: 3, speed: 1.1, desc: "Striped and spiny. Good grilled." },
  { id: "Trout", name: "Trout", greek: "pestrofa", value: 7, water: "fresh", terrains: [2, 9, 12, 4], weight: 5, hits: 3, misses: 2, speed: 1.35, when: "dawn", desc: "Speckled, from cold streams in the forests and mountains." },
  { id: "Eel", name: "Eel", greek: "enchelys", value: 8, water: "fresh", terrains: [5], weight: 6, hits: 4, misses: 3, speed: 1.2, when: "night", desc: "The marsh eel. The Boeotians' greatest delicacy, crowned and sacrificed like a heifer." },
  { id: "Mullet", name: "Grey mullet", greek: "kestreus", value: 5, water: "fresh", terrains: [5, 7], weight: 4, hits: 3, misses: 3, speed: 1.15, desc: "A mullet of brackish waters. Fasting, they say, for it is never found with food in its belly." },
  // The sea.
  { id: "Sardine", name: "Sardines", greek: "sardinos", value: 2, water: "sea", weight: 12, hits: 2, misses: 3, speed: 1.1, desc: "Small silver fish of the shallows, by the handful." },
  { id: "Bream", name: "Gilt-head bream", greek: "chrysophrys", value: 9, water: "sea", weight: 6, hits: 3, misses: 3, speed: 1.25, god: "Aphrodite", desc: "Gold between the eyes. Sacred to Aphrodite, who rose from the sea." },
  { id: "RedMullet", name: "Red mullet", greek: "trigle", value: 10, water: "sea", weight: 4, hits: 3, misses: 2, speed: 1.3, when: "dusk", god: "Hecate", desc: "Rosy and bearded. Hecate's own fish, offered to her as a triple thing (trigle, three times a year)." },
  { id: "Octopus", name: "Octopus", greek: "polypous", value: 11, water: "sea", weight: 3, hits: 4, misses: 3, speed: 1.15, desc: "Cunning, it changes color with the rock. A fit catch for one with Metis." },
  { id: "Tuna", name: "Tunny", greek: "thynnos", value: 18, water: "sea", deep: true, weight: 3, hits: 5, misses: 2, speed: 1.5, god: "Poseidon", desc: "A great tunny from the deep, Poseidon's fish. Its first is owed to him." },
  { id: "Cuttlefish", name: "Cuttlefish", greek: "sepia", value: 7, water: "sea", weight: 4, hits: 3, misses: 3, speed: 1.2, when: "night", desc: "It clouds the water with its ink, and is gone, unless you're quick." },
];
export const fishDef = (id: string) => FISH.find((f) => f.id === id)!;

for (const f of FISH) {
  ITEMS[f.id] = { id: f.id, name: f.name, greek: f.greek, kind: "material", desc: `${f.desc} Cook it, sell it${f.god ? `, or offer it to ${f.god}` : ""}.`, value: f.value };
  INGREDIENTS[f.id] = { rarity: f.value >= 15 ? 3 : f.value >= 7 ? 2 : 1, kind: "meat", aretai: "Metis" };
  if (f.god) OFFER_PATRON[f.id] = f.god;
}
ITEMS.rod = { id: "rod", name: "Fishing rod", greek: "kalamos", kind: "tool", desc: "A rod, a line of twisted fiber and a bronze hook. Hold it and press Space facing water to cast; strike when the float dips." };
RECIPES.push({ out: "rod", qty: 1, needs: [["Wood", 2], ["Fiber", 3]], desc: "A springy rod, a line of twisted fiber, a bent hook." });

/** Which fish might bite here: by fresh or salt water, deep or shallow, the land, the hour and the weather. */
export function fishHere(sea: boolean, deep: boolean, terrain: number, when: { dawn: boolean; dusk: boolean; night: boolean; rain: boolean }) {
  return FISH.filter((f) => f.water === (sea ? "sea" : "fresh") && (!f.deep || deep) && (!f.terrains || f.terrains.includes(terrain)))
    .map((f) => ({ f, w: f.weight * (f.when && when[f.when] ? 2.5 : 1) * (deep && f.value >= 7 ? 1.6 : 1) }));
}
