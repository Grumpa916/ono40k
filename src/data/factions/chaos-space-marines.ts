import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { astartesChainsword, boltPistol, closeCombat, forceWeapon, powerWeapon, w } from "../weapons";

const KW_HA = ["Infantry", "Grenades", "Chaos", "Heretic Astartes"];
const KW_HA_CHAR = ["Infantry", "Character", "Grenades", "Chaos", "Heretic Astartes"];
const KW_HA_BL = ["Infantry", "Battleline", "Grenades", "Chaos", "Heretic Astartes"];
const boltgun = w("Boltgun", "ranged", 24, 2, 3, 4, 0, 1, ["Rapid Fire 1"]);
const plasmaPistol = w("Plasma pistol", "ranged", 12, 1, 2, 8, -3, 2, ["Pistol"]);
const krak = w("Missile launcher — krak", "ranged", 48, 1, 3, 9, -2, "D6", ["Heavy"]);

const units: UnitDef[] = [
  u("csm-chaos-lord", "Chaos Lord", "character", 90, { m: 6, t: 4, sv: 3, w: 5, ld: 6, oc: 1 }, KW_HA_CHAR, {
    inv: 4,
    r: [plasmaPistol, boltPistol],
    m: [w("Daemon hammer", "melee", "Melee", 5, 3, 8, -2, 2, ["Devastating Wounds"]), powerWeapon],
    ab: [
      a("Lord of Chaos", "While leading a unit, each time that unit makes a Dark Pact, it automatically passes the Leadership test."),
      a("Glory to the Dark Gods", "While leading a unit, weapons in that unit have Sustained Hits 1."),
    ],
    lead: ["csm-legionaries", "csm-chosen", "csm-havocs"],
  }),
  u("csm-master-of-possession", "Master of Possession", "character", 80, { m: 6, t: 4, sv: 3, w: 4, ld: 6, oc: 1 }, [
    "Infantry",
    "Character",
    "Psyker",
    "Grenades",
    "Chaos",
    "Heretic Astartes",
  ], {
    inv: 5,
    r: [w("Rite of Possession", "ranged", 18, "D6", 3, 6, -2, "D3", ["Psychic", "Devastating Wounds"]), boltPistol],
    m: [forceWeapon],
    ab: [
      a("Rite of Possession", "While leading a Possessed unit, that unit has a 5+ Feel No Pain and +1 to Advance and Charge rolls."),
      a("Pact of Flesh", "Once per turn, when a friendly Daemon or Possessed unit within 12\" is destroyed, you can return D3 destroyed models to a friendly Possessed unit within 12\"."),
    ],
    lead: ["csm-possessed", "csm-legionaries"],
  }),
  u("csm-legionaries", "Legionaries", "battleline", 90, { m: 6, t: 4, sv: 3, w: 2, ld: 6, oc: 2 }, KW_HA_BL, {
    sizes: [[5, 90], [10, 170]],
    r: [boltgun, boltPistol],
    m: [astartesChainsword, w("Heavy melee weapon", "melee", "Melee", 3, 3, 8, -2, 2, [])],
    ab: [
      a("Veterans of the Long War", "Each time this unit is targeted, if it is below its Starting Strength, it has a 5+ Feel No Pain until the end of the phase."),
      a("Objective Secured", "This unit can perform Actions while within Engagement Range of enemy units."),
    ],
  }),
  u("csm-cultist-mob", "Cultist Mob", "battleline", 50, { m: 6, t: 3, sv: 6, w: 1, ld: 7, oc: 1 }, ["Infantry", "Battleline", "Chaos", "Cultist"], {
    sizes: [[10, 50], [20, 90]],
    r: [w("Cultist firearm", "ranged", 18, 1, 4, 3, 0, 1, []), w("Autopistol", "ranged", 12, 1, 4, 3, 0, 1, ["Pistol"])],
    m: [w("Brutal assault weapon", "melee", "Melee", 2, 4, 3, 0, 1, [])],
    ab: [
      a("Cannon Fodder", "Each time a ranged attack targets this unit, if this unit is wholly on or within a terrain feature, subtract 1 from the Hit roll."),
      a("For the Dark Gods", "This unit can be set up as a screen: friendly Heretic Astartes Character units within 3\" have the Benefit of Cover."),
    ],
  }),
  u("csm-chosen", "Chosen", "infantry", 135, { m: 6, t: 4, sv: 3, w: 3, ld: 6, oc: 1 }, KW_HA, {
    sizes: [[5, 135], [10, 270]],
    r: [boltPistol, w("Plasma pistol", "ranged", 12, 1, 3, 8, -3, 2, ["Pistol"]), boltgun],
    m: [w("Accursed weapon", "melee", "Melee", 4, 3, 5, -2, 1, ["Lethal Hits"])],
    ab: [
      a("Chosen Veterans", "This unit can re-roll Advance and Charge rolls. It can Advance and charge."),
      a("Mark of Favour", "Each time this unit makes a Dark Pact, you can re-roll one Hit roll and one Wound roll."),
    ],
  }),
  u("csm-havocs", "Havocs", "infantry", 125, { m: 5, t: 5, sv: 3, w: 2, ld: 6, oc: 1 }, KW_HA, {
    sizes: [[5, 125]],
    r: [
      w("Havoc lascannon", "ranged", 48, 1, 3, 12, -3, "D6+1", []),
      w("Havoc autocannon", "ranged", 48, 2, 3, 9, -1, 3, []),
      w("Havoc reaper chaincannon", "ranged", 24, 8, 3, 5, 0, 1, []),
      w("Havoc heavy bolter", "ranged", 36, 3, 3, 5, -1, 2, ["Sustained Hits 1"]),
      krak,
    ],
    m: [closeCombat],
    ab: [
      a("Havoc Focus", "Each time this unit Remains Stationary, you can re-roll Hit rolls with its ranged weapons."),
      a("Heavy Firepower", "Ranged weapons in this unit have Heavy. If the target is a Monster or Vehicle, add 1 to the Wound roll."),
    ],
  }),
  u("csm-possessed", "Possessed", "infantry", 120, { m: 9, t: 6, sv: 3, w: 3, ld: 6, oc: 1 }, ["Infantry", "Daemon", "Chaos", "Heretic Astartes"], {
    inv: 5,
    sizes: [[5, 120], [10, 250]],
    m: [w("Hideous mutations", "melee", "Melee", 4, 3, 5, -1, 2, [])],
    ab: [
      a("Unholy Bloodshed", "Once per battle, when this unit makes a Dark Pact, its weapons have Devastating Wounds until the end of the phase."),
    ],
  }),
  u("csm-venomcrawler", "Venomcrawler", "vehicle", 120, { m: 12, t: 9, sv: 3, w: 9, ld: 6, oc: 3 }, ["Vehicle", "Walker", "Daemon", "Chaos"], {
    inv: 5,
    r: [w("Excruciator cannon", "ranged", 36, 3, 3, 9, -2, 3, ["Twin-linked"])],
    m: [w("Soulflayer tendrils", "melee", "Melee", 8, 3, 6, -1, 1, [])],
    ab: [
      a("Soul Harvest", "Each time an enemy model is destroyed by this unit, this model regains 1 lost wound (to a maximum of 3 per phase)."),
      a("Daemon Engine", "This model has a 5+ invulnerable save. Weapons equipped by this model have Lethal Hits."),
    ],
  }),
  u("csm-vindicator", "Chaos Vindicator", "vehicle", 185, { m: 9, t: 11, sv: 2, w: 11, ld: 6, oc: 3 }, ["Vehicle", "Smoke", "Chaos", "Heretic Astartes"], {
    r: [
      w("Demolisher cannon", "ranged", 24, "D6+3", 3, 14, -3, 4, ["Blast"]),
      w("Havoc launcher", "ranged", 48, "D6", 3, 5, 0, 1, ["Blast"]),
      w("Combi-bolter", "ranged", 24, 2, 3, 4, 0, 1, ["Rapid Fire 2"]),
    ],
    m: [w("Armoured tracks", "melee", "Melee", 6, 4, 7, 0, 1, [])],
    ab: [
      a("Demolish", "Each time this model makes an attack with its demolisher cannon that targets a unit within 12\", add 1 to the Damage characteristic."),
      a("Siege Shield", "This model has the Benefit of Cover against ranged attacks that target it from more than 12\" away."),
    ],
  }),
  u("csm-helbrute", "Helbrute", "vehicle", 130, { m: 6, t: 9, sv: 2, w: 8, ld: 6, oc: 3 }, ["Vehicle", "Walker", "Chaos", "Heretic Astartes"], {
    r: [
      w("Multi-melta", "ranged", 18, 2, 3, 9, -4, "D6", ["Melta 2"]),
      w("Missile launcher — krak", "ranged", 48, 1, 3, 9, -2, "D6", []),
      w("Missile launcher — frag", "ranged", 48, "D6", 3, 4, 0, 1, ["Blast"]),
      w("Heavy flamer", "ranged", 12, "D6", 0, 5, -1, 1, ["Ignores Cover", "Torrent"]),
    ],
    m: [w("Helbrute fist", "melee", "Melee", 5, 3, 12, -2, 3, [])],
    ab: [
      a("Frenzy", "Each time this model is reduced to 4 wounds remaining, until the end of the battle it has +1 Attack and +1 Strength on its melee weapons."),
      a("Helbrute Hatred", "Each time this model makes a melee attack, if it charged this turn, add 1 to the Hit roll."),
    ],
  }),
];

const detachments: Detachment[] = detPack("csm", [
  {
    id: "veterans",
    name: "Veterans of the Long War",
    dp: 1,
    disposition: "Priority Assets",
    tag: "veterans",
    rule: a("Bitter Veterans", "Each time a unit from this army makes an attack that targets a unit on an objective marker, add 1 to the Wound roll. Heretic Astartes Infantry units have OC +1."),
    strats: [{ id: "csm-vet-spite", name: "Veterans' Spite", cp: 1, when: "Your shooting", text: "A Heretic Astartes unit's weapons have Devastating Wounds against a target on an objective marker until the end of the phase." }],
    enh: [{ id: "csm-vet-icon", name: "Icon of Excess", points: 15, text: "The bearer's unit can re-roll Hit rolls of 1. If it made a Dark Pact this phase, re-roll any Hit roll." }],
  },
  {
    id: "pactbound",
    name: "Pactbound Zealots",
    dp: 2,
    disposition: "Take and Hold",
    tag: "pactbound",
    rule: a("Profane Zeal", "Each time a unit from this army makes a Dark Pact, it has both Lethal Hits and Sustained Hits 1. If it fails the subsequent Leadership test, it suffers D3+1 mortal wounds instead of D3."),
    strats: [
      { id: "csm-pact-apoth", name: "Dark Apotheosis", cp: 1, when: "Fight phase", text: "When a Character in this army is destroyed, roll one D6: on a 2+, you can set it back up with D3 wounds remaining more than 3\" from enemy models." },
      { id: "csm-pact-focus", name: "Focus of Hatred", cp: 1, when: "Your shooting", text: "A unit that made a Dark Pact this phase can re-roll the Wound roll against the closest eligible target." },
    ],
    enh: [
      { id: "csm-pact-talisman", name: "Talisman of Burning Blood", points: 15, text: "The bearer's melee weapons have +1 Strength and +1 Attack. The bearer's unit can Advance and charge." },
      { id: "csm-pact-eye", name: "Eye of Tzeentch", points: 20, text: "The bearer has a 4+ invulnerable save. Once per battle, after making a Dark Pact, do not take the Leadership test." },
    ],
  },
  {
    id: "slaves",
    name: "Slaves to Darkness",
    dp: 3,
    disposition: "Purge the Foe",
    tag: "slaves",
    rule: a("Marks of Chaos", "At the start of the battle, select one Mark of Chaos for your army. Khorne: melee weapons have +1 Strength. Tzeentch: ranged weapons have Lethal Hits. Nurgle: models have a 6+ Feel No Pain. Slaanesh: add 1 to Advance and Charge rolls. Chaos Undivided: re-roll Hit rolls of 1."),
    strats: [
      { id: "csm-slv-hate", name: "Eternal Hate", cp: 1, when: "Fight phase", text: "When a model in a Heretic Astartes unit is destroyed, it can fight before being removed. If it made a Dark Pact this phase, it can also shoot before being removed if it is your Shooting phase." },
      { id: "csm-slv-gift", name: "Unholy Bloodshed", cp: 1, when: "Fight phase", text: "A unit that charged this turn has +1 to Wound with melee attacks until the end of the phase." },
      { id: "csm-slv-pact", name: "Skinshift Pact", cp: 2, when: "Command phase", text: "A Heretic Astartes Infantry unit recovers D3 lost wounds, or you can return one destroyed model (excluding Characters) to it." },
    ],
    enh: [
      { id: "csm-slv-cloak", name: "Intoxicating Elixir", points: 10, text: "The bearer's unit has a 5+ Feel No Pain." },
      { id: "csm-slv-blade", name: "Blade of the Relentless", points: 20, text: "Add 1 to the Attacks, Strength, and Damage of the bearer's melee weapons." },
      { id: "csm-slv-crown", name: "Crown of the Crimson King", points: 15, text: "While the bearer is leading a unit, that unit has Fight First." },
    ],
  },
]);

export const chaosSpaceMarines: Faction = {
  id: "csm",
  name: "Chaos Space Marines",
  short: "Heretic Astartes",
  allegiance: "Chaos",
  accent: "#8a2e2e",
  rule: a("Dark Pacts", "Each time a Heretic Astartes unit from your army is selected to shoot or fight, it can make a Dark Pact. If it does, until the end of the phase its weapons have either Lethal Hits or Sustained Hits 1 (declare before rolling). After the unit has resolved those attacks, it must take a Leadership test: if failed, it suffers D3 mortal wounds."),
  detachments,
  units,
};
