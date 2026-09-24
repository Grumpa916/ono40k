import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { w } from "../weapons";

const guardianSpearRanged = w("Guardian spear", "ranged", 24, 2, 2, 4, -1, 2, ["Assault"]);
const guardianSpearMelee = w("Guardian spear", "melee", "Melee", 5, 2, 7, -2, 2, []);
const castellanAxeRanged = w("Castellan axe", "ranged", 24, 2, 2, 4, -1, 2, ["Assault"]);
const castellanAxeMelee = w("Castellan axe", "melee", "Melee", 4, 2, 9, -1, 3, []);
const sentinelBladeRanged = w("Sentinel blade", "ranged", 12, 2, 2, 4, -1, 2, ["Assault", "Pistol"]);
const KW_CUST = ["Infantry", "Imperium", "Adeptus Custodes"];
const KW_CHAR = ["Infantry", "Character", "Imperium", "Adeptus Custodes"];
const leadGuard = ["custodes-guard", "custodes-wardens"];

const units: UnitDef[] = [
  u("custodes-trajann", "Trajann Valoris", "character", 135, { m: 6, t: 6, sv: 2, w: 7, ld: 5, oc: 2 }, ["Infantry", "Character", "Epic Hero", "Imperium", "Adeptus Custodes"], {
    inv: 4,
    fnp: 5,
    r: [w("Eagle's Scream", "ranged", 24, 2, 2, 5, -2, 3, ["Assault"])],
    m: [w("Watcher's Axe", "melee", "Melee", 6, 2, 10, -2, 3, [])],
    ab: [
      a("Captain-General", "While leading a unit, models in that unit ignore modifiers to Ballistic Skill, Weapon Skill, and Hit rolls."),
      a("Moment Shackle", "Once per battle, at the start of the Fight phase: Watcher's Axe has Attacks 12, or this model has a 2+ invulnerable save."),
      a("Supreme Commander", "If this model is in your army, it must be your Warlord."),
    ],
    lead: leadGuard,
  }),
  u("custodes-blade-champion", "Blade Champion", "character", 110, { m: 6, t: 6, sv: 2, w: 6, ld: 6, oc: 2 }, KW_CHAR, {
    inv: 4,
    m: [
      w("Vaultswords — Behemor", "melee", "Melee", 6, 2, 7, -2, 2, ["Precision"]),
      w("Vaultswords — Hurricanus", "melee", "Melee", 9, 2, 5, -1, 1, ["Sustained Hits 1"]),
      w("Vaultswords — Victus", "melee", "Melee", 5, 2, 6, -3, 3, ["Devastating Wounds"]),
    ],
    ab: [
      a("Swift Onslaught", "While leading a unit, you can re-roll Charge rolls for that unit."),
      a("Martial Inspiration", "Once per battle, this model's unit can charge after Advancing."),
    ],
    lead: leadGuard,
  }),
  u("custodes-shield-captain", "Shield-Captain", "character", 110, { m: 6, t: 6, sv: 2, w: 6, ld: 6, oc: 2 }, KW_CHAR, {
    inv: 4,
    r: [guardianSpearRanged, castellanAxeRanged, sentinelBladeRanged],
    m: [
      w("Guardian spear", "melee", "Melee", 7, 2, 7, -2, 2, []),
      w("Castellan axe", "melee", "Melee", 6, 2, 9, -1, 3, []),
      w("Sentinel blade", "melee", "Melee", 7, 2, 6, -2, 1, []),
    ],
    ab: [
      a("Master of the Stances", "Once per battle, when this unit fights, both Ka'tah Stances are active for it."),
      a("Strategic Mastery", "Once per battle round, target this unit with a Stratagem for 1 CP less (minimum 0)."),
    ],
    lead: leadGuard,
  }),
  u("custodes-guard", "Custodian Guard", "battleline", 170, { m: 6, t: 6, sv: 2, w: 3, ld: 6, oc: 2 }, ["Infantry", "Battleline", "Imperium", "Adeptus Custodes"], {
    inv: 4,
    sizes: [[4, 170], [5, 215]],
    r: [guardianSpearRanged, sentinelBladeRanged],
    m: [guardianSpearMelee, w("Sentinel blade", "melee", "Melee", 5, 2, 6, -2, 1, [])],
    ab: [
      a("Stand Vigil", "Re-roll Wound rolls of 1. While on an objective you control, re-roll the Wound roll instead."),
      a("Sentinel Storm", "Once per battle, after this unit shoots, it can shoot again."),
    ],
  }),
  u("custodes-wardens", "Custodian Wardens", "infantry", 200, { m: 6, t: 6, sv: 2, w: 3, ld: 6, oc: 2 }, KW_CUST, {
    inv: 4,
    sizes: [[4, 200], [5, 250]],
    r: [guardianSpearRanged, castellanAxeRanged],
    m: [guardianSpearMelee, castellanAxeMelee],
    ab: [
      a("Resolute Will", "While a Character leads this unit, attacks with Strength greater than this unit's Toughness are −1 to Wound."),
      a("Living Fortress", "Once per battle, at the start of any phase, this unit has Feel No Pain 4+ until the end of the phase."),
    ],
  }),
  u("custodes-allarus", "Allarus Custodians", "infantry", 110, { m: 5, t: 7, sv: 2, w: 4, ld: 6, oc: 2 }, ["Infantry", "Terminator", "Imperium", "Adeptus Custodes"], {
    inv: 4,
    sizes: [[2, 110], [3, 165], [5, 280], [6, 340]],
    r: [w("Balistus grenade launcher", "ranged", 18, "D6", 2, 4, -1, 1, ["Blast"]), guardianSpearRanged, castellanAxeRanged],
    m: [guardianSpearMelee, castellanAxeMelee],
    ab: [
      a("Slayers of Tyrants", "Re-roll Wound rolls against Character, Monster, or Vehicle units."),
      a("From Golden Light", "Once per battle, at the end of your opponent's turn, if unengaged, place this unit into Strategic Reserves."),
    ],
  }),
  u("custodes-prosecutors", "Prosecutors", "infantry", 45, { m: 6, t: 3, sv: 3, w: 1, ld: 6, oc: 2 }, ["Infantry", "Imperium", "Anathema Psykana", "Sisters of Silence"], {
    sizes: [[4, 45], [5, 50], [9, 75], [10, 85]],
    r: [w("Boltgun", "ranged", 24, 1, 3, 4, 0, 1, ["Rapid Fire 1"])],
    m: [w("Close combat weapon", "melee", "Melee", 2, 3, 3, 0, 1, [])],
    ab: [
      a("Daughters of the Abyss", "Feel No Pain 3+ against Psychic attacks and mortal wounds."),
      a("Purity of Execution", "Ranged attacks that target a Psyker have Precision and Devastating Wounds."),
    ],
  }),
  u("custodes-vertus", "Vertus Praetors", "mounted", 145, { m: 12, t: 7, sv: 2, w: 5, ld: 6, oc: 2 }, ["Mounted", "Fly", "Imperium", "Adeptus Custodes"], {
    inv: 4,
    sizes: [[2, 145], [3, 215]],
    r: [
      w("Salvo launcher", "ranged", 24, 1, 2, 10, -3, "D6+1", ["Twin-linked"]),
      w("Vertus hurricane bolter", "ranged", 18, 3, 2, 4, -1, 2, ["Rapid Fire 3", "Twin-linked"]),
    ],
    m: [w("Interceptor lance", "melee", "Melee", 5, 2, 7, -2, 2, ["Lance"])],
    ab: [
      a("Turbo-boost", "When this unit Advances, add 6\" instead of rolling."),
      a("Quicksilver Execution", "Once per battle, after a Normal or Advance move, pick one Infantry unit it moved over. Roll one D6 per model: each 2+ inflicts 2 mortal wounds."),
    ],
  }),
  u("custodes-caladius", "Caladius Grav-tank", "vehicle", 210, { m: 10, t: 11, sv: 2, w: 14, ld: 6, oc: 4 }, ["Vehicle", "Fly", "Frame", "Imperium", "Adeptus Custodes"], {
    inv: 5,
    r: [
      w("Twin iliastus accelerator cannon", "ranged", 48, 4, 2, 10, -1, 3, ["Rapid Fire 4", "Twin-linked"]),
      w("Twin arachnus heavy blaze cannon", "ranged", 48, 4, 2, 12, -3, "D6+2", ["Twin-linked"]),
    ],
    m: [w("Armoured hull", "melee", "Melee", 4, 4, 6, 0, 1, [])],
    ab: [a("Advanced Firepower", "Iliastus attacks against non-Monster, non-Vehicle units have Lethal Hits. Arachnus attacks against Monsters or Vehicles have Lethal Hits.")],
  }),
];

const detachments: Detachment[] = detPack("custodes", [
  {
    id: "talons",
    name: "Talons of the Emperor",
    dp: 3,
    disposition: "Take and Hold",
    tag: "talons",
    rule: a("Revered Companions", "Anathema Psykana units grant Adeptus Custodes within 6\" Feel No Pain 5+ against Psychic attacks and mortal wounds. Adeptus Custodes grant Anathema Psykana within 6\" +1 to Hit."),
    strats: [
      { id: "custodes-tal-hunt", name: "Hunt as One", cp: 1, when: "Your movement", text: "Up to two Adeptus Custodes units can shoot and charge after Falling Back (the second must be Anathema Psykana within 6\")." },
      { id: "custodes-tal-sever", name: "Empyric Severance", cp: 1, when: "Opponent shooting or Fight", text: "One Adeptus Custodes unit and one Anathema Psykana unit within 6\" have Feel No Pain 4+ against Psychic attacks and mortal wounds." },
    ],
    enh: [
      { id: "custodes-tal-gift", name: "Gift of Terran Artifice", points: 15, text: "Add 1 to the Wound roll for the bearer's melee attacks." },
      { id: "custodes-tal-aegis", name: "Aegis Projector", points: 20, text: "Once per turn, the first failed save for the bearer's unit changes that attack's Damage to 0." },
    ],
  },
  {
    id: "shield",
    name: "Shield Host",
    dp: 2,
    disposition: "Purge the Foe",
    tag: "shield",
    rule: a("Martial Mastery", "At the start of each battle round, choose one until the next: Adeptus Custodes melee scores Critical Hits on 5+, or improve the AP of those melee weapons by 1."),
    strats: [
      { id: "custodes-sh-alchemy", name: "Arcane Genetic Alchemy", cp: 1, when: "Any phase", text: "After a mortal wound is allocated to an Adeptus Custodes model, that unit has Feel No Pain 4+ against mortal wounds this phase." },
      { id: "custodes-sh-avenge", name: "Avenge the Fallen", cp: 1, when: "Fight phase", text: "An Adeptus Custodes unit below Starting Strength adds 1 to melee Attacks (2 if Below Half-strength)." },
    ],
    enh: [
      { id: "custodes-sh-mantle", name: "Auric Mantle", points: 15, text: "Shield-Captain or Blade Champion only. Add 2 to the bearer's Wounds." },
      { id: "custodes-sh-armouries", name: "From the Hall of Armouries", points: 20, text: "Shield-Captain only. Add 1 to the Strength and Damage of the bearer's melee weapons." },
    ],
  },
  {
    id: "lions",
    name: "Lions of the Emperor",
    dp: 2,
    disposition: "Disruption",
    tag: "lions",
    rule: a("Against All Odds", "Adeptus Custodes units (excluding Vehicles) add 1 to Hit and Wound while no other friendly unit is within 6\"."),
    strats: [
      { id: "custodes-li-unleash", name: "Unleash the Lions", cp: 1, when: "Your command", text: "Split one Allarus Custodians unit on the battlefield into separate 1-model units." },
      { id: "custodes-li-eagle", name: "Swift as the Eagle", cp: 1, when: "Opponent shooting", text: "After an enemy unit shoots, one targeted Adeptus Custodes unit (excluding Vehicles) can make a D6\" Normal move." },
    ],
    enh: [
      { id: "custodes-li-praes", name: "Praesidius", points: 25, text: "The bearer has Lone Operative and Stealth." },
      { id: "custodes-li-super", name: "Superior Creation", points: 25, text: "The first time the bearer is destroyed, on a 2+ set it back up unengaged with full wounds." },
    ],
  },
  {
    id: "auric",
    name: "Auric Champions",
    dp: 2,
    disposition: "Priority Assets",
    tag: "auric",
    rule: a("Assemblage of Might", "At the start of your Command phase, select one enemy unit. Adeptus Custodes Character models add 1 to Wound rolls against that unit until your next Command phase."),
    strats: [
      { id: "custodes-au-slayer", name: "Slayer of Champions", cp: 1, when: "Any phase", text: "After a Character unit destroys the Assemblage target, select a new target. If the destroyed unit was a Character, gain 1 CP." },
      { id: "custodes-au-auspice", name: "The Emperor's Auspice", cp: 1, when: "Opponent shooting or Fight", text: "Character models in a targeted Adeptus Custodes Character unit have Feel No Pain 4+ this phase." },
    ],
    enh: [
      { id: "custodes-au-blade", name: "Blade Imperator", points: 25, text: "After the bearer's unit ends a Charge, roll one D6 for one engaged enemy: 4+ inflicts D3 mortal wounds." },
      { id: "custodes-au-phil", name: "Martial Philosopher", points: 30, text: "The bearer's unit can shoot and charge after Falling Back." },
    ],
  },
]);

export const custodes: Faction = {
  id: "custodes",
  name: "Adeptus Custodes",
  short: "The Ten Thousand",
  allegiance: "Imperium",
  accent: "#c9a227",
  rule: a(
    "Martial Ka'tah",
    "At the start of the Fight phase, select one stance until the end of the phase: Kaptaris (−1 to Hit melee attacks that target your Adeptus Custodes units) or Dacatarai (Adeptus Custodes melee weapons have Sustained Hits 1).",
  ),
  detachments,
  units,
};
