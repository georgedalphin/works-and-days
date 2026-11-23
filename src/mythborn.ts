/**
 * Mythborn neighbors: the Naiad of a spring and a satyr band (Village & People, Character Systems).
 * Befriending climbs the rungs from appeasement: Appeased, Familiar, Trusted, Ally. Each rung needs
 * appeasements on more separate days. Ally is the exchange that would unlock a kind as playable.
 */
export const RUNGS = ["Wary", "Appeased", "Familiar", "Trusted", "Ally"];
export const RUNG_DAYS = [0, 1, 3, 6, 10]; // separate days appeased to reach each rung

export interface MythDef {
  id: string; kind: string; god: string;
  offers: string[]; // what it accepts as appeasement (its Terata Appeasements, as the game has them so far)
  check: { aretai: string; label: string }; // the other way to appease it
  lines: string[][]; // by rung
}

export const MYTH: Record<string, MythDef> = {
  naiad: {
    id: "naiad", kind: "Naiad", god: "Artemis",
    offers: ["Honey", "Milk", "Flowers", "Thyme"],
    check: { aretai: "Pneuma", label: "Sit by the water and pray quietly with her (Pneuma)" },
    lines: [
      ["She watches you from the edge of the pool, ready to slip beneath. Her eyes are the color of deep water.",
        "A woman made of light on water. She says nothing, only waits to see what you will do."],
      ["\"You came back. Most mortals only want my water.\"", "\"The spring remembers kindness. So do I.\""],
      ["\"The rains will come late this year. Water your fields at dusk, when the earth drinks deepest.\"",
        "\"Artemis bathed here once, long ago. The water has never forgotten.\""],
      ["\"Drink, and be well. Bathe, if you are weary. You are welcome here now.\"", "\"Take my water to your fields. It will make them glad.\""],
      ["\"You are a friend of the spring for as long as it runs. If ever one of your line would live among the nymphs, they will be welcome.\""],
    ],
  },
  satyrs: {
    id: "satyrs", kind: "Satyrs", god: "Dionysus",
    offers: ["Grapes", "WildGrapes", "Honey", "Milk"],
    check: { aretai: "Aiolos", label: "Join the dance (Aiolos)" },
    lines: [
      ["Three satyrs caper round a jar, goat-legged and garlanded, singing badly. They eye your pack with interest.",
        "The satyrs stop mid-step and look you over, grinning. One sniffs the air in your direction."],
      ["\"Grapes! Not wine, no, but grapes are wine that hasn't happened yet!\"", "\"You again! Stay, stay, we've nearly finished the song.\""],
      ["\"Old Silenus says the god walks these valleys at the vintage. Bring wine then, and he may dance with you himself!\"",
        "\"The nymph at the spring? Ah, she won't dance with us. She says we're too loud. We are too loud!\""],
      ["\"Friend! Here, take this, we found it, or it found us.\"", "\"Sit, eat, sing! You are one of the revel now.\""],
      ["\"You're one of us now, near enough. If any child of yours grows horns, send them to us!\""],
    ],
  },
};

export const NAIAD_NAMES = ["Kallirrhoe", "Pegaia", "Krenaia", "Hagno", "Nais"];
export const SATYR_NAMES = ["Komos", "Marsyas", "Skirtos", "Oinos"];
/** Where the spring may lie: a near anchor, chosen once per world from the seed. */
export const SPRING_SITES: [number, number][] = [[2, 0], [1, -1], [2, -1], [1, 1], [2, 1]];
