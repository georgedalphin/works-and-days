/**
 * Festivals, on the Attic calendar: each falls when it historically did. Every village keeps the great ones of the year;
 * beyond those, a village keeps the festivals of the gods its households honor. On the day, the square is decked out,
 * offerings to the festival's god count double, the feast takes what you bring, and there may be an agon with prizes.
 */
import { MONTHS } from "./data";

export type AgonKind = "race" | "wrestle" | "song" | "dance" | "craft" | "drink" | "archery" | "hop";
export interface Agon { kind: AgonKind; name: string; aretai: string; help: string; prize: [string, number][]; prizeName: string }
export interface FestivalDef {
  id: string; name: string; month: number; day: number; god: string;
  /** Always kept, or kept by a village whose households honor its god. */
  core?: boolean;
  desc: string; rite: string;
  /** What is best brought to the feast (items or dishes), and what the villagers say of it. */
  feast: string[]; feastWord: string;
  agon?: Agon;
  /** The dead walk in the village that night. */
  ghosts?: boolean;
}

export const FESTIVALS: FestivalDef[] = [
  { id: "aphrodisia", name: "Aphrodisia", month: 0, day: 4, god: "Aphrodite", desc: "Aphrodite's feast: her altar is purified with a dove's blood, and her image washed and garlanded.", rite: "Doves circle the altar; garlands are hung on every door.",
    feast: ["dish_melon", "Melon", "Honey", "Plum"], feastWord: "something sweet", agon: { kind: "dance", name: "the dance for the goddess", aretai: "Phoenix", help: "Keep the steps on the beat (Space).", prize: [["Garland", 1], ["Honey", 2]], prizeName: "a garland and honey" } },
  { id: "kronia", name: "Kronia", month: 0, day: 12, god: "Demeter", core: true, desc: "The harvest is in. For a day, as in the Golden Age of Kronos, masters serve their servants and everyone feasts together.", rite: "Tables are set in the square, and masters serve servants.",
    feast: ["Millet", "Chickpeas", "Melon", "meal_Oikos", "dish_kykeon"], feastWord: "the fruits of the harvest", agon: { kind: "wrestle", name: "the harvest wrestling", aretai: "Kratos", help: "Throw your weight with the beat (Space).", prize: [["Amphora", 1], ["Millet", 6]], prizeName: "a jar and a sack of grain" } },
  { id: "athenaia", name: "Athenaia", month: 0, day: 28, god: "Athena", desc: "Athena's birthday, kept in the villages as the city keeps its Panathenaia: a new robe for her image, and games.", rite: "A new robe is carried to Athena's little image in procession.",
    feast: ["OliveOil", "Olives", "dish_relish"], feastWord: "Athena's olive", agon: { kind: "race", name: "the footrace", aretai: "Aiolos", help: "Keep your stride on the beat (Space).", prize: [["OliveOil", 3], ["Amphora", 1]], prizeName: "a prize amphora of olive oil" } },
  { id: "genesia", name: "Genesia", month: 2, day: 5, god: "Hades", desc: "The day of the dead parents: graves are tended and offerings poured. That night they walk.", rite: "Families go out to tend the graves of their dead.",
    feast: ["dish_melikraton", "Honey", "Milk", "Wine"], feastWord: "a libation for the dead", ghosts: true },
  { id: "eleusinia", name: "Eleusinia", month: 2, day: 15, god: "Demeter", desc: "The Mysteries of Demeter and her Daughter. What is shown to the initiates is never told; but all break the fast on kykeon.", rite: "Those who will be initiated bathe, and fast, and keep silence.",
    feast: ["dish_kykeon"], feastWord: "kykeon, to break the fast" },
  { id: "pyanepsia", name: "Pyanepsia", month: 3, day: 7, god: "Apollo", core: true, desc: "The bean-boiling: a stew of every pulse and grain for Apollo, and the eiresione, an olive branch hung with wool and fruits, carried by children and nailed above the door.", rite: "Children carry the eiresione from door to door, singing.",
    feast: ["Chickpeas", "meal_Oikos", "Millet", "Olives"], feastWord: "a pot of pulses and grain", agon: { kind: "song", name: "the song for Apollo", aretai: "Ourania", help: "Keep the song on the beat (Space). An instrument and a song of Apollo help.", prize: [["Lyre", 1]], prizeName: "a lyre" } },
  { id: "chalkeia", name: "Chalkeia", month: 3, day: 29, god: "Hephaestus", desc: "The smiths' festival, for Hephaestus and Athena of the crafts: the loom is warped for Athena's new robe, and craftsmen show their work.", rite: "The smithy is hung with garlands; every craftsman shows a piece.",
    feast: ["Meat", "meal_Techne", "dish_fennelroast"], feastWord: "meat for the smiths", agon: { kind: "craft", name: "the craftsmen's contest", aretai: "Techne", help: "Strike with the hammer on the beat (Space).", prize: [["Copper", 2], ["Fibula", 1]], prizeName: "copper and a bronze pin" } },
  { id: "dionysia", name: "Rural Dionysia", month: 5, day: 8, god: "Dionysus", desc: "The country Dionysia: a procession with the god's emblem, songs, and the askoliasmos, hopping on a greased wineskin.", rite: "A procession winds through the village with songs and wine.",
    feast: ["Wine", "Grapes", "WildGrapes", "dish_plums"], feastWord: "wine for the god", agon: { kind: "hop", name: "the askoliasmos (hopping on a greased wineskin)", aretai: "Aiolos", help: "Keep your balance on the beat (Space).", prize: [["Wine", 3]], prizeName: "the wineskin itself, full" } },
  { id: "haloa", name: "Haloa", month: 5, day: 26, god: "Demeter", core: true, desc: "The threshing-floor feast for Demeter and Dionysus: the women feast and jest, and the first wine is tasted.", rite: "A feast is laid out on the threshing floor.",
    feast: ["Wine", "Millet", "Chickpeas", "dish_kykeon", "Honey"], feastWord: "grain and wine" },
  { id: "lenaia", name: "Lenaia", month: 6, day: 12, god: "Dionysus", desc: "The festival of the wine-press women: songs and mockery in the god's honor.", rite: "Mocking songs are sung from carts.",
    feast: ["Wine", "dish_plums"], feastWord: "wine", agon: { kind: "song", name: "the mocking-song contest", aretai: "Ourania", help: "Keep the song on the beat (Space). An instrument and a song of Dionysus help.", prize: [["Aulos", 1]], prizeName: "an aulos" } },
  { id: "theogamia", name: "Theogamia", month: 6, day: 27, god: "Hera", core: true, desc: "The sacred marriage of Zeus and Hera, in the month of weddings: everyone eats wedding cake.", rite: "Hera's image is dressed as a bride.",
    feast: ["dish_weddingcake", "Honey", "Milk"], feastWord: "wedding cake", agon: { kind: "dance", name: "the wedding dance", aretai: "Phoenix", help: "Keep the steps on the beat (Space).", prize: [["Garland", 2], ["Honey", 2]], prizeName: "garlands and honey" } },
  { id: "anthesteria", name: "Anthesteria", month: 7, day: 12, god: "Dionysus", core: true, desc: "The festival of flowers: the new wine is opened, there is a drinking contest from the chous, and on the last night the spirits of the dead roam until they are sent away.", rite: "The new wine jars are opened; even children get a little cup.",
    feast: ["Wine", "Flowers", "dish_plums"], feastWord: "wine and flowers", agon: { kind: "drink", name: "the Choes (who empties the chous first)", aretai: "Pneuma", help: "Drink on the beat (Space).", prize: [["Wine", 2], ["Garland", 1]], prizeName: "a garland and a skin of wine" }, ghosts: true },
  { id: "elaphebolia", name: "Elaphebolia", month: 8, day: 6, god: "Artemis", desc: "Artemis the deer-shooter's feast: cakes shaped like deer, of dough, honey and sesame.", rite: "Cakes shaped like deer are offered.",
    feast: ["Honey", "Meat", "dish_venison"], feastWord: "honey cakes", agon: { kind: "archery", name: "the archery contest", aretai: "Ourania", help: "Loose on the beat (Space).", prize: [["Arrow", 12], ["Antler", 1]], prizeName: "a quiver of arrows" } },
  { id: "hermaia", name: "Hermaia", month: 9, day: 4, god: "Hermes", desc: "Hermes' birthday, kept with games for the young: wrestling and running.", rite: "The young strip and oil themselves for the games.",
    feast: ["Meat", "dish_roadbread", "Milk"], feastWord: "something for the young athletes", agon: { kind: "wrestle", name: "the boys' and men's wrestling", aretai: "Kratos", help: "Throw your weight with the beat (Space).", prize: [["OliveOil", 2], ["Syrinx", 1]], prizeName: "oil and reed pipes" } },
  { id: "mounichia", name: "Mounichia", month: 9, day: 16, god: "Artemis", desc: "At the full moon, round cakes ringed with little torches are carried to Artemis.", rite: "Cakes lit with tiny torches are carried in the moonlight.",
    feast: ["Honey", "Millet"], feastWord: "moon-cakes" },
  { id: "thargelia", name: "Thargelia", month: 10, day: 6, god: "Apollo", core: true, desc: "The first fruits: a pot of the first grain is boiled for Apollo, and the village is purified.", rite: "The thargelos, a pot of the first grain, is boiled for Apollo.",
    feast: ["Millet", "Chickpeas", "Mint", "meal_Oikos", "dish_tisane"], feastWord: "the first fruits", agon: { kind: "song", name: "the choral contest", aretai: "Ourania", help: "Keep the song on the beat (Space). An instrument and a song of Apollo help.", prize: [["Lyre", 1]], prizeName: "the victor's lyre" } },
  { id: "dipolieia", name: "Dipolieia", month: 11, day: 14, god: "Zeus", desc: "Zeus of the city: the ox-slaying, after which the axe is put on trial and found guilty.", rite: "An ox eats the grain on Zeus' altar, and is slain; then the axe is tried.",
    feast: ["Meat", "dish_oulochytai"], feastWord: "meat for the sacrifice" },
];
export const festival = (id: string) => FESTIVALS.find((f) => f.id === id)!;

/** The festivals your village keeps: the great ones of the year, and those of the gods its households honor. */
export function villageFestivals(patrons: string[]): FestivalDef[] {
  return FESTIVALS.filter((f) => f.core || patrons.includes(f.god) || (f.god === "Hades" && patrons.includes("Demeter")));
}

/** Days from one (month, day) to another, forward through the year. */
export function daysUntil(fromMonth: number, fromDay: number, toMonth: number, toDay: number): number {
  let d = 0, m = fromMonth, day = fromDay;
  for (let i = 0; i < 400; i++) {
    if (m === toMonth && day === toDay) return d;
    day++; d++; if (day > MONTHS[m].days) { day = 1; m = (m + 1) % 12; }
  }
  return 999;
}
