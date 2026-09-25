import type { Weapon } from "./types";

export const w = (
  name: string,
  kind: "ranged" | "melee",
  range: number | "Melee",
  attacks: number | string,
  skill: number,
  strength: number,
  ap: number,
  damage: number | string,
  keywords: string[] = [],
  choice?: string,
): Weapon => ({ name, kind, range, attacks, skill, strength, ap, damage, keywords, choice });

export const boltRifle = w("Bolt rifle", "ranged", 24, 2, 3, 4, -1, 1, ["Assault", "Heavy"]);
export const boltPistol = w("Bolt pistol", "ranged", 12, 1, 3, 4, 0, 1, ["Pistol"]);
export const heavyBoltPistol = w("Heavy bolt pistol", "ranged", 18, 1, 3, 4, -1, 1, ["Pistol"]);
export const closeCombat = w("Close combat weapon", "melee", "Melee", 3, 3, 4, 0, 1, []);
export const astartesChainsword = w("Astartes chainsword", "melee", "Melee", 4, 3, 4, -1, 1, []);
export const powerFist = w("Power fist", "melee", "Melee", 4, 3, 8, -2, 2, []);
export const powerWeapon = w("Power weapon", "melee", "Melee", 5, 2, 5, -2, 1, []);
export const thunderHammer = w("Thunder hammer", "melee", "Melee", 3, 4, 8, -2, 3, ["Devastating Wounds"]);
export const forceWeapon = w("Force weapon", "melee", "Melee", 4, 3, 6, -1, "D3", ["Psychic"]);
