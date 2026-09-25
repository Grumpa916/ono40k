import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import {
  astartesChainsword,
  boltPistol,
  boltRifle,
  closeCombat,
  forceWeapon,
  heavyBoltPistol,
  powerFist,
  powerWeapon,
  w,
} from "../weapons";

const AA = "Adeptus Astartes";
const KW_CHAR_TAC = ["Infantry", "Character", "Grenades", "Imperium", "Tacticus", AA];
const KW_BL_TAC = ["Infantry", "Battleline", "Grenades", "Imperium", "Tacticus", AA];
const KW_INF_TAC = ["Infantry", "Grenades", "Imperium", "Tacticus", AA];
const KW_GRAVIS = ["Infantry", "Grenades", "Imperium", "Gravis", AA];
const KW_PHOBOS_BL = ["Infantry", "Battleline", "Grenades", "Imperium", "Phobos", "Smoke", AA];
const KW_PHOBOS = ["Infantry", "Grenades", "Imperium", "Phobos", AA];
const KW_WALKER = ["Vehicle", "Walker", "Smoke", "Imperium", AA];
const KW_VEH = ["Vehicle", "Smoke", "Imperium", AA];

const deepStrike = a("Deep Strike", "This unit can make an Ingress move from Reserves more than 8\" from enemy models.");
const infiltrate = a("Infiltrators", "This unit can be set up anywhere on the battlefield more than 9\" from enemy models.");
const support = a("Support", "This model can be attached to a unit that already has a Leader.");
const objSec = a("Objective Secured", "This unit can perform Actions while within Engagement Range of enemy units.");

const stormBolter = w("Storm bolter", "ranged", 24, 2, 3, 4, 0, 1, ["Rapid Fire 2"]);
const armouredHull = w("Armoured hull", "melee", "Melee", 3, 4, 6, 0, 1, []);
const fragstorm = w("Fragstorm grenade launcher", "ranged", 18, "D6", 3, 4, 0, 1, ["Blast"]);
const ironhail = w("Ironhail heavy stubber", "ranged", 36, 3, 3, 4, 0, 1, ["Rapid Fire 3"]);
const mcBoltRifle = w("Master-crafted bolt rifle", "ranged", 24, 2, 2, 4, -1, 2, ["Assault", "Heavy"]);

const tacticusLeaders = [
  "sm-intercessors",
  "sm-assault-intercessors",
  "sm-jump-intercessors",
  "sm-sternguard",
  "sm-hellblasters",
  "sm-infernus",
  "sm-bladeguard",
  "sm-company-heroes",
];

const s = { m: 6, t: 4, sv: 3, w: 2, ld: 6, oc: 1 };
const sChar = { m: 6, t: 4, sv: 3, w: 4, ld: 6, oc: 1 };
const sGravis = { m: 5, t: 6, sv: 3, w: 3, ld: 6, oc: 1 };

const units: UnitDef[] = [
  u("sm-captain", "Captain", "character", 80, { m: 6, t: 4, sv: 3, w: 5, ld: 6, oc: 1 }, KW_CHAR_TAC, {
    inv: 4,
    r: [mcBoltRifle, heavyBoltPistol],
    m: [powerFist],
    ab: [
      a("Rites of Battle", "While leading a unit, weapons in that unit have Sustained Hits 1."),
      a("Transhuman Strategist", "If this model is your Warlord and on the battlefield, you gain 1 CP at the start of your Command phase."),
      a("Doctrinal Authority", "Once per battle round, in your Command phase, select one Combat Doctrine. It is active for this model's unit until your next Command phase, in addition to the army Doctrine."),
    ],
    lead: tacticusLeaders,
  }),
  u("sm-lieutenant", "Lieutenant", "character", 45, sChar, KW_CHAR_TAC, {
    r: [w("Master-crafted bolter", "ranged", 24, 2, 2, 5, -1, 2, []), heavyBoltPistol],
    m: [powerWeapon],
    ab: [a("Tactical Precision", "While leading a unit, weapons in that unit have Lethal Hits."), support],
    lead: ["sm-intercessors", "sm-assault-intercessors", "sm-sternguard", "sm-hellblasters", "sm-bladeguard"],
  }),
  u("sm-librarian", "Librarian", "character", 70, sChar, ["Infantry", "Character", "Psyker", "Grenades", "Imperium", AA], {
    r: [w("Smite", "ranged", 24, "D6", 3, 5, -1, "D3", ["Psychic"])],
    m: [forceWeapon],
    ab: [
      a("Psyker Level 1", "Once per turn, use Veil of Time (this unit is eligible to shoot and charge after Advancing) or Force Dome (+1 to this unit's Save). On a 1 when you do, this unit is Battle-shocked."),
      a("Mental Fortress", "This unit has a 4+ invulnerable save against Psychic attacks."),
    ],
    lead: ["sm-intercessors", "sm-sternguard", "sm-hellblasters"],
  }),
  u("sm-chaplain", "Chaplain", "character", 60, { m: 6, t: 4, sv: 3, w: 4, ld: 5, oc: 1 }, KW_CHAR_TAC, {
    inv: 4,
    r: [w("Absolvor bolt pistol", "ranged", 18, 1, 3, 5, -1, 2, ["Pistol"])],
    m: [w("Crozius arcanum", "melee", "Melee", 5, 2, 6, -1, 2, [])],
    ab: [
      a("Litany of Hate", "While leading a unit, melee weapons in that unit have +1 to Wound."),
      a("Spiritual Leader", "This unit can re-roll Battle-shock tests."),
    ],
    lead: ["sm-assault-intercessors", "sm-bladeguard", "sm-jump-intercessors"],
  }),
  u("sm-apothecary", "Apothecary", "character", 40, sChar, KW_CHAR_TAC, {
    r: [boltPistol],
    m: [closeCombat],
    ab: [
      a("Narthecium", "At the end of your Movement phase, return one destroyed model (excluding Characters) to this unit with its full wounds remaining."),
      support,
    ],
    lead: ["sm-intercessors", "sm-hellblasters", "sm-sternguard", "sm-assault-intercessors"],
  }),
  u("sm-intercessors", "Intercessor Squad", "battleline", 80, { ...s, oc: 2 }, KW_BL_TAC, {
    sizes: [[5, 80], [10, 150]],
    r: [
      boltRifle,
      w("Bolt pistol", "ranged", 12, 1, 3, 5, -1, 1, ["Pistol"]),
      w("Sergeant's bolt rifle", "ranged", 24, 1, 3, 10, -2, 3, ["Rapid Fire 1"]),
    ],
    m: [closeCombat],
    ab: [a("Tactical Mainstay", "This unit can perform Actions while it is shooting, charging, fighting, Battle-shocked, or within Engagement Range.")],
  }),
  u("sm-assault-intercessors", "Assault Intercessor Squad", "battleline", 75, { ...s, oc: 2 }, KW_BL_TAC, {
    sizes: [[5, 75], [10, 150]],
    r: [heavyBoltPistol],
    m: [w("Astartes chainsword", "melee", "Melee", 4, 3, 5, -1, 1, [])],
    ab: [
      a("Shock Assault", "Each time this unit piles in, it can move an extra 3\"."),
      a("On the Charge", "If this unit charged this turn, until the end of the Fight phase add 1 to the Strength and AP of melee weapons in this unit (including attached Characters)."),
    ],
  }),
  u("sm-jump-intercessors", "Jump Pack Intercessor Squad", "infantry", 85, { m: 12, t: 4, sv: 3, w: 2, ld: 6, oc: 1 }, [
    "Infantry",
    "Jump Pack",
    "Fly",
    "Grenades",
    "Imperium",
    "Tacticus",
    AA,
  ], {
    sizes: [[5, 85], [10, 160]],
    r: [heavyBoltPistol],
    m: [astartesChainsword],
    ab: [
      a("Hammer of Wrath", "After this unit ends a Charge move, roll one D6 for each model in it: each 4+ inflicts 1 mortal wound on one engaged enemy."),
      deepStrike,
    ],
  }),
  u("sm-infiltrators", "Infiltrator Squad", "battleline", 110, { m: 6, t: 4, sv: 3, w: 2, ld: 6, oc: 1 }, KW_PHOBOS_BL, {
    sizes: [[5, 110], [10, 180]],
    r: [w("Marksman bolt carbine", "ranged", 24, 2, 3, 4, 0, 1, [])],
    m: [closeCombat],
    ab: [a("Omni-scrambler", "Enemy units that set up as Reinforcements cannot be set up within 12\" of this unit."), infiltrate],
  }),
  u("sm-heavy-intercessors", "Heavy Intercessor Squad", "battleline", 100, { ...sGravis, oc: 2 }, [
    "Infantry",
    "Battleline",
    "Grenades",
    "Imperium",
    "Gravis",
    AA,
  ], {
    sizes: [[5, 100], [10, 220]],
    r: [w("Heavy bolt rifle", "ranged", 30, 2, 3, 5, -1, 2, ["Assault", "Heavy", "Rapid Fire 1"])],
    m: [closeCombat],
    ab: [a("Unyielding", "While this unit is within range of an objective you control, add 1 to its Save characteristic.")],
  }),
  u("sm-scouts", "Scout Squad", "infantry", 65, { m: 6, t: 4, sv: 4, w: 2, ld: 6, oc: 1 }, [
    "Infantry",
    "Grenades",
    "Imperium",
    "Scout",
    "Smoke",
    AA,
  ], {
    sizes: [[5, 65], [10, 120]],
    r: [w("Boltgun", "ranged", 24, 2, 3, 4, 0, 1, ["Rapid Fire 1"]), boltPistol],
    m: [closeCombat],
    ab: [infiltrate, a("Guerrilla Tactics", "This unit is eligible to perform Actions in a turn in which it Advanced or Fell Back.")],
  }),
  u("sm-terminators", "Terminator Squad", "infantry", 160, { m: 5, t: 5, sv: 2, w: 3, ld: 6, oc: 1 }, [
    "Infantry",
    "Imperium",
    "Terminator",
    AA,
  ], {
    inv: 4,
    sizes: [[5, 160], [10, 320]],
    r: [w("Storm bolter", "ranged", 24, 2, 3, 5, -1, 1, ["Rapid Fire 2"])],
    m: [powerFist],
    ab: [
      a("Fury of the First", "Each time a model in this unit makes an attack that targets a unit within 9\", improve the AP of that attack by 1."),
      deepStrike,
    ],
  }),
  u("sm-sternguard", "Sternguard Veteran Squad", "infantry", 100, s, KW_INF_TAC, {
    sizes: [[5, 100], [10, 200]],
    r: [
      w("Artificer firearms — anti-infantry", "ranged", 24, 2, 3, 5, -1, 2, ["Lethal Hits", "Devastating Wounds"]),
      w("Artificer firearms — anti-vehicle", "ranged", 24, 2, 3, 8, -2, 2, ["Heavy", "Anti-Vehicle 4+", "Anti-Monster 4+"]),
    ],
    m: [closeCombat],
    ab: [a("Bolter Drill", "Unmodified Hit rolls of 6 with ranged attacks score one additional hit.")],
  }),
  u("sm-hellblasters", "Hellblaster Squad", "infantry", 110, s, KW_INF_TAC, {
    sizes: [[5, 110], [10, 220]],
    r: [
      w("Plasma incinerator", "ranged", 24, 2, 3, 7, -2, 1, ["Assault", "Heavy", "Rapid Fire 1"]),
      w("Plasma incinerator — supercharge", "ranged", 24, 2, 3, 8, -3, 2, ["Assault", "Heavy", "Hazardous", "Rapid Fire 1"]),
    ],
    m: [closeCombat],
    ab: [a("Plasma Discipline", "Add 1 to Hazardous tests made for plasma weapons in this unit.")],
  }),
  u("sm-eradicators", "Eradicator Squad", "infantry", 90, sGravis, KW_GRAVIS, {
    sizes: [[3, 90], [6, 180]],
    r: [w("Melta rifle", "ranged", 18, 1, 3, 9, -4, "D6", ["Heavy", "Melta 2"])],
    m: [closeCombat],
    ab: [a("Total Obliteration", "Each time this unit targets a Monster or Vehicle, add 1 to the Hit roll, treat the weapon's Strength as 12, and you can re-roll the Damage roll.")],
  }),
  u("sm-aggressors", "Aggressor Squad", "infantry", 80, sGravis, KW_GRAVIS, {
    sizes: [[3, 80], [6, 165]],
    r: [
      w("Auto boltstorm gauntlets", "ranged", 18, 3, 3, 5, -1, 1, ["Twin-linked", "Pistol"], "fists"),
      w("Flamestorm gauntlets", "ranged", 12, 3, 0, 4, 0, 1, ["Torrent", "Ignores Cover", "Blast 2"], "fists"),
      fragstorm,
    ],
    m: [w("Power fists", "melee", "Melee", 3, 3, 8, -2, 2, ["Twin-linked"])],
    ab: [
      a("Close-quarters Firepower", "Ranged weapons in this unit have Assault while targets are within 12\"."),
      a("Point-blank", "Add 1 to the Strength of ranged attacks that target the closest eligible enemy within 9\"."),
    ],
  }),
  u("sm-infernus", "Infernus Squad", "infantry", 85, s, KW_INF_TAC, {
    sizes: [[5, 85], [10, 180]],
    r: [w("Pyreblaster", "ranged", 12, "D6", 0, 5, -1, 1, ["Ignores Cover", "Torrent"])],
    m: [closeCombat],
    ab: [a("Incinerate", "Targets of this unit's shooting do not receive the Benefit of Cover.")],
  }),
  u("sm-inceptors", "Inceptor Squad", "infantry", 125, { m: 10, t: 6, sv: 3, w: 3, ld: 6, oc: 1 }, [
    "Infantry",
    "Fly",
    "Jump Pack",
    "Imperium",
    "Gravis",
    AA,
  ], {
    sizes: [[3, 125], [6, 250]],
    r: [w("Assault bolters", "ranged", 18, 3, 3, 5, -1, 2, ["Assault", "Twin-linked"])],
    m: [closeCombat],
    ab: [
      a("Meteoric Descent", "This unit can make an Ingress move from Reserves more than 8\" from enemy models. The first time it shoots after doing so, add 1 to Hit rolls."),
      a("Drop Back", "At the end of your opponent's Fight phase, if this unit is not engaged it can be placed into Strategic Reserves."),
    ],
  }),
  u("sm-bladeguard", "Bladeguard Veteran Squad", "infantry", 80, { m: 6, t: 4, sv: 3, w: 3, ld: 6, oc: 1 }, KW_INF_TAC, {
    inv: 4,
    sizes: [[3, 80], [6, 160]],
    r: [heavyBoltPistol],
    m: [w("Master-crafted power weapon", "melee", "Melee", 4, 3, 5, -2, 2, [])],
    ab: [a("Bladeguard", "This unit has a 4+ invulnerable save. Subtract 1 from the Attacks characteristic of melee weapons that target this unit.")],
  }),
  u("sm-company-heroes", "Company Heroes", "infantry", 105, { m: 6, t: 4, sv: 3, w: 4, ld: 6, oc: 1 }, KW_INF_TAC, {
    sizes: [[4, 105]],
    r: [
      w("Master-crafted bolt rifle", "ranged", 24, 2, 3, 5, -1, 2, ["Assault", "Heavy"]),
      w("Heavy bolter", "ranged", 36, 3, 3, 5, -1, 2, ["Heavy", "Sustained Hits 1", "Rapid Fire 2"]),
    ],
    m: [powerWeapon, closeCombat],
    ab: [
      a("Honour Guard", "Each time an attack targets this unit, subtract 1 from the Wound roll."),
      a("Company Ancient", "At the end of your Movement phase, if this unit is within range of an objective you do not control, you take control of it."),
    ],
  }),
  u("sm-eliminators", "Eliminator Squad", "infantry", 75, { m: 6, t: 4, sv: 3, w: 2, ld: 6, oc: 1 }, KW_PHOBOS, {
    sizes: [[3, 75]],
    r: [w("Bolt sniper rifle", "ranged", 36, 1, 3, 5, -2, 3, ["Heavy", "Precision"])],
    m: [closeCombat],
    ab: [
      a("Stealth", "Each time a ranged attack targets this unit, subtract 1 from the Hit roll. This is not cumulative with the Benefit of Cover."),
      infiltrate,
    ],
  }),
  u("sm-outriders", "Outrider Squad", "mounted", 70, { m: 12, t: 5, sv: 3, w: 4, ld: 6, oc: 2 }, ["Mounted", "Grenades", "Imperium", AA], {
    sizes: [[3, 70], [6, 160]],
    r: [w("Twin bolt rifle", "ranged", 24, 2, 3, 5, -1, 1, ["Twin-linked"]), heavyBoltPistol],
    m: [
      w("Astartes chainsword", "melee", "Melee", 4, 3, 5, -1, 1, []),
      w("Sergeant's thunder hammer", "melee", "Melee", 3, 4, 8, -2, 3, ["Devastating Wounds"]),
    ],
    ab: [
      a("Turbo-boost", "When this unit Advances, add 6\" instead of rolling."),
      a("Shock Cavalry", "If this unit charged this turn, its melee weapons have Sustained Hits 1 and +1 Damage. The Sergeant's thunder hammer is +1 to Hit instead of +1 Damage."),
    ],
  }),
  u("sm-redemptor", "Redemptor Dreadnought", "vehicle", 195, { m: 8, t: 10, sv: 2, w: 12, ld: 6, oc: 4 }, KW_WALKER, {
    r: [
      w("Macro plasma incinerator", "ranged", 36, "D6+1", 3, 8, -3, 2, ["Blast"]),
      w("Onslaught gatling cannon", "ranged", 24, 8, 3, 5, 0, 1, []),
      w("Icarus rocket pod", "ranged", 24, "D3", 3, 8, -1, 2, ["Anti-Fly 2+"]),
    ],
    m: [w("Redemptor fist", "melee", "Melee", 5, 3, 12, -2, 3, [])],
    ab: [a("Duty Eternal", "Each time an attack is allocated to this model, subtract 1 from the Damage.")],
  }),
  u("sm-ballistus", "Ballistus Dreadnought", "vehicle", 150, { m: 8, t: 10, sv: 2, w: 12, ld: 6, oc: 4 }, KW_WALKER, {
    r: [
      w("Ballistus lascannon", "ranged", 48, 2, 3, 12, -3, "D6+1", []),
      w("Ballistus missile launcher — krak", "ranged", 48, 2, 3, 10, -2, "D6", []),
      w("Ballistus missile launcher — frag", "ranged", 48, "2D6", 3, 5, 0, 1, ["Blast"]),
    ],
    m: [w("Armoured feet", "melee", "Melee", 5, 3, 7, 0, 1, [])],
    ab: [a("Ballistus Targeting", "Re-roll Hit rolls with ranged attacks that target a Monster or Vehicle.")],
  }),
  u("sm-gladiator-lancer", "Gladiator Lancer", "vehicle", 160, { m: 10, t: 10, sv: 3, w: 12, ld: 6, oc: 3 }, KW_VEH, {
    r: [
      w("Lancer laser destroyer", "ranged", 72, 2, 3, 14, -4, "D6+3", ["Heavy"]),
      fragstorm,
      ironhail,
    ],
    m: [armouredHull],
    ab: [a("Aquilon Optics", "Re-roll Hit rolls with the Lancer laser destroyer.")],
  }),
  u("sm-impulsor", "Impulsor", "transport", 70, { m: 12, t: 9, sv: 3, w: 11, ld: 6, oc: 2 }, [
    "Vehicle",
    "Transport",
    "Dedicated Transport",
    "Smoke",
    "Imperium",
    AA,
  ], {
    r: [stormBolter, ironhail],
    m: [armouredHull],
    ab: [
      a("Assault Vehicle", "Units can disembark after this Transport has Advanced."),
      a("Orbital Array", "This model has Scouts 6\". It can transport 6 Tacticus models or 3 Gravis models."),
    ],
    transport: 6,
  }),
];

const detachments: Detachment[] = detPack("sm", [
  {
    id: "gladius",
    name: "Gladius Task Force",
    dp: 3,
    disposition: "Priority Assets",
    tag: "gladius",
    rule: a("Codex Flexibility", "You can select one Combat Doctrine a second time this battle. Captains in this Detachment can activate an additional Doctrine for their unit in your Command phase."),
    strats: [
      { id: "sm-gla-armour", name: "Armour of Contempt", cp: 1, when: "Opponent shooting or Fight", text: "Until the end of the phase, worsen the AP of attacks that target one Adeptus Astartes unit by 1." },
      { id: "sm-gla-squad", name: "Squad Tactics", cp: 1, when: "Your movement", text: "One Adeptus Astartes unit can Fall Back and still shoot and charge this turn." },
      { id: "sm-gla-honour", name: "Honour the Chapter", cp: 1, when: "Fight phase", text: "A unit that charged this turn has +1 to Wound with melee attacks until the end of the phase." },
    ],
    enh: [
      { id: "sm-gla-artificer", name: "Artificer Armour", points: 10, text: "Bearer has a 2+ Save and a 4+ invulnerable save." },
      { id: "sm-gla-relic", name: "Relic of the Chapter", points: 20, text: "Once per battle, the bearer can use a Stratagem for 0 CP." },
      { id: "sm-gla-blade", name: "The Honour Vehement", points: 15, text: "Add 1 to the Attacks and Strength of the bearer's melee weapons (add 1 AP as well while Assault Doctrine is active)." },
      { id: "sm-gla-ancient", name: "Chapter Ancient", points: 15, text: "Upgrade. Add 1 to the Attacks of melee weapons in the bearer's unit.", upgrade: true },
    ],
  },
  {
    id: "assault-brethren",
    name: "Assault Brethren",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "Doctrines",
    rule: a("Second Assault", "You can select the Assault Combat Doctrine one additional time this battle. While Assault Doctrine is active for an Adeptus Astartes unit, its melee weapons have Lance and improve AP by 1."),
    strats: [{ id: "sm-ab-death", name: "Only in Death", cp: 1, when: "Fight phase", text: "When a model in one Adeptus Astartes unit is destroyed, it can fight before being removed." }],
    enh: [{ id: "sm-ab-sustained", name: "Fury of Guilliman", points: 20, text: "While leading an Infantry unit, melee weapons in that unit have Sustained Hits 1 against non-Monster, non-Vehicle targets." }],
  },
  {
    id: "tactical-brethren",
    name: "Tactical Brethren",
    dp: 1,
    disposition: "Take and Hold",
    tag: "Doctrines",
    rule: a("Second Tactical", "You can select the Tactical Combat Doctrine one additional time this battle. While Tactical Doctrine is active for an Adeptus Astartes Infantry unit, it can make a 6\" reactive move when an enemy ends a move within 9\"."),
    strats: [{ id: "sm-tb-suppress", name: "Suppressing Fire", cp: 1, when: "Your shooting", text: "After one Adeptus Astartes unit shoots, one target is −1 to Hit until the start of your next turn." }],
    enh: [{ id: "sm-tb-student", name: "Student of the Codex", points: 20, text: "Captain model only. The Tactical Doctrine is always active for the bearer's unit in addition to any other Doctrine." }],
  },
  {
    id: "devastator-brethren",
    name: "Devastator Brethren",
    dp: 1,
    disposition: "Disruption",
    tag: "Doctrines",
    rule: a("Second Devastator", "You can select the Devastator Combat Doctrine one additional time this battle. While Devastator Doctrine is active for an Adeptus Astartes unit, its ranged weapons have Ignores Cover and improve AP by 1."),
    strats: [{ id: "sm-db-return", name: "Return Fire", cp: 1, when: "Opponent shooting", text: "After an enemy unit destroys one model in an Adeptus Astartes unit, that unit can shoot as if it were your Shooting phase (it can only target that enemy)." }],
    enh: [{ id: "sm-db-behemoth", name: "Veteran of Behemoth", points: 25, text: "While leading a unit, ranged weapons in that unit have Lethal Hits. Re-roll Advance rolls for that unit while Devastator Doctrine is active." }],
  },
  {
    id: "tacticus-attack",
    name: "Tacticus Attack Force",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "Tacticus",
    rule: a("Shock Doctrine", "Tacticus units from your army are eligible to shoot and charge in a turn in which they Advanced. Assault Intercessor Squads add 1 to Charge rolls."),
    strats: [{ id: "sm-ta-push", name: "Forward Push", cp: 1, when: "Your movement", text: "One Tacticus unit can Advance 6\" instead of rolling." }],
    enh: [{ id: "sm-ta-champion", name: "Linebreaker", points: 15, text: "Add 2 to the Attacks of the bearer's melee weapons." }],
  },
  {
    id: "tacticus-firestorm",
    name: "Tacticus Firestorm Force",
    dp: 1,
    disposition: "Priority Assets",
    tag: "Tacticus",
    rule: a("Sustained Volley", "Rapid Fire weapons equipped by Tacticus units from your army are treated as having Rapid Fire at their full range, not half range."),
    strats: [{ id: "sm-tf-cqb", name: "Close-quarters Bolters", cp: 1, when: "Your shooting", text: "Non-Blast ranged weapons in one Tacticus unit have Ignores Cover and, if the target is within 12\", Lethal Hits." }],
    enh: [{ id: "sm-tf-redeploy", name: "Drop Beacon", points: 20, text: "After both sides deploy, redeploy the bearer's unit (and this model)." }],
  },
  {
    id: "phobos-shadow",
    name: "Phobos Shadow Force",
    dp: 1,
    disposition: "Reconnaissance",
    tag: "Phobos",
    rule: a("Shadow Doctrine", "Phobos units from your army have Stealth. Once per turn, one Phobos unit can make a Normal move of D6\" after it shoots, remaining eligible to be Hidden."),
    strats: [{ id: "sm-ps-ghost", name: "Ghost Tactics", cp: 1, when: "Your shooting", text: "One Phobos unit can shoot while Hidden without revealing itself." }],
    enh: [{ id: "sm-ps-shroud", name: "Shroud Halo", points: 15, text: "The bearer's unit is always eligible to be Hidden, even after shooting." }],
  },
  {
    id: "phobos-shock",
    name: "Phobos Shock Force",
    dp: 1,
    disposition: "Disruption",
    tag: "Phobos",
    rule: a("From the Shadows", "The first time a Phobos unit from your army is selected to shoot or fight in a turn in which it started Hidden, re-roll Wound rolls for those attacks."),
    strats: [{ id: "sm-pk-ambush", name: "Ambush Strike", cp: 1, when: "Your shooting or Fight", text: "One Phobos unit that was Hidden this turn has +1 Strength and Lethal Hits until the end of the phase." }],
    enh: [{ id: "sm-pk-react", name: "Prey-sight", points: 15, text: "When an enemy ends a move within 9\" of the bearer, the bearer's unit can make a 6\" Normal move." }],
  },
  {
    id: "gravis-line",
    name: "Gravis Linebreaker Force",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "Gravis",
    rule: a("Unstoppable Advance", "Gravis units from your army can Advance and still shoot. Add 1 to Advance and Charge rolls made for Gravis units."),
    strats: [{ id: "sm-gl-crash", name: "Armoured Onslaught", cp: 1, when: "Your charge", text: "After a Gravis unit ends a Charge move, roll 6 D6: each 4+ inflicts 1 mortal wound on one engaged enemy." }],
    enh: [{ id: "sm-gl-bulk", name: "Indomitable", points: 20, text: "The bearer's unit has a 5+ Feel No Pain while it is below Starting Strength." }],
  },
  {
    id: "gravis-siege",
    name: "Gravis Siege Force",
    dp: 1,
    disposition: "Take and Hold",
    tag: "Gravis",
    rule: a("Living Bastion", "Each time an attack targets a Gravis unit from your army that is within range of an objective you control, subtract 1 from the Wound roll. That unit has OC +1."),
    strats: [{ id: "sm-gs-hold", name: "Hold the Line", cp: 1, when: "Opponent shooting or Fight", text: "A Gravis unit on an objective has a 5+ Feel No Pain until the end of the phase." }],
    enh: [{ id: "sm-gs-fort", name: "Siege Plate", points: 15, text: "The bearer has a 2+ Save. The bearer's unit can shoot while performing an Action." }],
  },
  {
    id: "terminator-storm",
    name: "Terminator Storm Force",
    dp: 1,
    disposition: "Take and Hold",
    tag: "terminator",
    rule: a("First Company", "Terminator units from your army have Deep Strike. Each time a Terminator unit is set up on the battlefield from Reserves, until the end of the turn it has Lethal Hits."),
    strats: [{ id: "sm-ts-tele", name: "Teleport Homer", cp: 1, when: "Your movement", text: "One Terminator unit can be placed into Strategic Reserves, even if engaged (roll a D6: on a 1 it suffers 3 mortal wounds)." }],
    enh: [{ id: "sm-ts-crux", name: "Crux Terminatus", points: 20, text: "The bearer has a 4+ Feel No Pain. Terminator only." }],
  },
  {
    id: "stormlance",
    name: "Stormlance Task Force",
    dp: 1,
    disposition: "Reconnaissance",
    tag: "stormlance",
    rule: a("Lightning Assault", "Mounted and Vehicle units from your army with the Fly or Speeder keyword add 2\" to their Move. Mounted units can Advance and charge."),
    strats: [{ id: "sm-sl-boost", name: "Full Throttle", cp: 1, when: "Your movement", text: "One Mounted unit Advances 6\" instead of rolling and is −1 to Hit against ranged attacks until your next turn." }],
    enh: [{ id: "sm-sl-hunt", name: "Hunter's Eye", points: 15, text: "The bearer's unit has Scouts 9\"." }],
  },
  {
    id: "ironclad",
    name: "Ironclad Champions",
    dp: 1,
    disposition: "Priority Assets",
    tag: "ironclad",
    rule: a("Ancient Wrath", "Walker units from your army have a 5+ invulnerable save. Each time a Walker is targeted, if the attack's Damage is greater than 1, subtract 1 from that Damage."),
    strats: [{ id: "sm-ic-duty", name: "Duty Eternal", cp: 1, when: "Any phase", text: "Until the end of the phase, one Walker has a 2+ Save against Damage 1 attacks and Feel No Pain 5+ against all other attacks." }],
    enh: [{ id: "sm-ic-machine", name: "Machine Empathy", points: 15, text: "Techmarine only. One friendly Walker within 3\" regains 3 lost wounds in your Command phase instead of 1." }],
  },
  {
    id: "gauntlet",
    name: "Gauntlet Task Force",
    dp: 1,
    disposition: "Disruption",
    tag: "gauntlet",
    rule: a("Armoured Spearhead", "After a Transport from your army shoots, select one enemy it hit. Until the end of the turn, Adeptus Astartes units that disembarked from that Transport this turn have Sustained Hits 1 against that enemy."),
    strats: [{ id: "sm-ga-disembark", name: "Shock Disembarkation", cp: 1, when: "Your movement", text: "A unit that disembarked this phase can still charge, even if its Transport Advanced." }],
    enh: [{ id: "sm-ga-pilot", name: "Tank Ace", points: 20, text: "The bearer (or their Transport, if embarked) re-rolls one Hit and one Wound roll with ranged attacks each time it shoots." }],
  },
  {
    id: "ironstorm",
    name: "Ironstorm Spearhead",
    dp: 1,
    disposition: "Priority Assets",
    tag: "ironstorm",
    rule: a("Targeting Augurs", "Each time a non-Walker Vehicle from your army is selected to shoot, you can re-roll one Hit roll and one Wound roll."),
    strats: [{ id: "sm-is-salvo", name: "Mercy is Weakness", cp: 1, when: "Your shooting", text: "One Vehicle's ranged weapons have Lethal Hits and Ignores Cover until the end of the phase." }],
    enh: [
      { id: "sm-is-heavy", name: "Targeter Optics", points: 15, text: "Ranged weapons equipped by the bearer's unit have Heavy." },
      { id: "sm-is-ion", name: "Ion Shielding", points: 25, text: "Vehicle model only. The bearer has a 5+ invulnerable save and regains 1 lost wound in each of your Command phases." },
    ],
  },
]);

export const spaceMarines: Faction = {
  id: "sm",
  name: "Space Marines",
  short: "Adeptus Astartes",
  allegiance: "Imperium",
  accent: "#3b6ea5",
  rule: a(
    "Combat Doctrines",
    "At the start of your Command phase, select one Combat Doctrine. Until your next Command phase it applies to all Adeptus Astartes units from your army. Devastator: ranged weapons have Assault. Tactical: eligible to shoot and charge after Falling Back. Assault: eligible to charge after Advancing. You can select each Doctrine once per battle (a second time if a rule allows it). A unit can only have one Doctrine active unless a rule says otherwise.",
  ),
  detachments,
  units,
  updatedAt: "2026-09-25",
};
