/**
 * Forage: wild plants and deposits that bear something worth gathering.
 * You can see the plant itself from the start, but not whether it bears anything good:
 * that takes at least Basics understanding of its kind (investigate it with Q).
 * Data from the Flora & Fauna sheet; months are 0 = Hekatombaion … 11 = Skirophorion.
 */
export interface ForageDef {
  id: string; // also its lore id
  item: string; // what you gather
  qty: number;
  regrow: number; // days until it bears again after gathering
  months: number[]; // when it bears
  terrains: number[]; // wheel terrains where it grows (3 includes the homestead)
  bearsWhen: string; // said when known but out of season
  weight: number; // how common, for placement
}

const SUMMER = [0, 1, 2], ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const FORAGE: Record<string, ForageDef> = {
  wildgrape: { id: "wildgrape", item: "WildGrapes", qty: 3, regrow: 60, months: [1], terrains: [1, 2], bearsWhen: "late summer (Metageitnion)", weight: 2 },
  plum: { id: "plum", item: "Plum", qty: 3, regrow: 4, months: SUMMER.slice(0, 2), terrains: [2, 3], bearsWhen: "summer", weight: 2 },
  cornel: { id: "cornel", item: "Cornel", qty: 3, regrow: 5, months: [1], terrains: [2], bearsWhen: "late summer (Metageitnion)", weight: 2 },
  purslane: { id: "purslane", item: "Purslane", qty: 2, regrow: 3, months: SUMMER, terrains: [3, 1], bearsWhen: "summer", weight: 3 },
  oats: { id: "oats", item: "Oats", qty: 2, regrow: 3, months: SUMMER.slice(0, 2), terrains: [3], bearsWhen: "summer", weight: 2 },
  thyme: { id: "thyme", item: "Thyme", qty: 2, regrow: 3, months: [10, 11, 0, 1], terrains: [4, 1], bearsWhen: "spring and summer", weight: 3 },
  caper: { id: "caper", item: "Capers", qty: 2, regrow: 4, months: SUMMER.slice(0, 2), terrains: [4], bearsWhen: "summer", weight: 2 },
  clay: { id: "clay", item: "Clay", qty: 2, regrow: 5, months: ALL, terrains: [4], bearsWhen: "any time", weight: 2 },
  ochre: { id: "ochre", item: "Ochre", qty: 1, regrow: 6, months: ALL, terrains: [4], bearsWhen: "any time", weight: 1 },
  mushrooms: { id: "mushrooms", item: "Mushrooms", qty: 2, regrow: 3, months: [3, 4, 5], terrains: [2], bearsWhen: "autumn, after rain", weight: 2 },
};

/** Is this spot bearing today? */
export function bearing(def: ForageDef, month: number, day: number, pickedDay: number | undefined) {
  return def.months.includes(month) && (pickedDay === undefined || day - pickedDay >= def.regrow);
}
