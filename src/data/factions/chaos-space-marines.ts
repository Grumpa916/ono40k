import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { boltPistol, closeCombat, w } from "../weapons";

const KW_HA = ["Infantry", "Grenades", "Chaos", "Heretic Astartes"];
const KW_HA_CHAR = ["Infantry", "Character", "Grenades", "Chaos", "Heretic Astartes"];
const KW_HA_BL = ["Infantry", "Battleline", "Grenades", "Chaos", "Heretic Astartes"];
const boltgun = w("Boltgun", "ranged", 24, 2, 3, 4, 0, 1, []);
const plasmaStd = w("Plasma pistol — standard", "ranged", 12, 1, 3, 7, -2, 1, ["Pistol"]);
const plasmaSuper = w("Plasma pistol — supercharge", "ranged", 12, 1, 3, 8, -3, 2, ["Hazardous", "Pistol"]);
const accursed = w("Accursed weapon", "melee", "Melee", 4, 3, 5, -2, 1, []);
const chainsword = w("Astartes chainsword", "melee", "Melee", 4, 3, 4, -1, 1, []);

const units: UnitDef[] = [
  u("csm-chaos-lord", "Chaos Lord", "character", 90, { m: 6, t: 4, sv: 3, w: 5, ld: 6, oc: 1 }, KW_HA_CHAR, {
    inv: 4,
    r: [
      w("Plasma pistol — standard", "ranged", 12, 1, 2, 7, -2, 1, ["Pistol"]),
      w("Plasma pistol — supercharge", "ranged", 12, 1, 2, 8, -3, 2, ["Hazardous", "Pistol"]),
      boltPistol,
    ],
    m: [
      w("Accursed weapon", "melee", "Melee", 6, 2, 5, -2, 1, []),
      w("Astartes chainblade", "melee", "Melee", 7, 2, 4, -1, 1, []),
      w("Daemon hammer", "melee", "Melee", 5, 3, 8, -2, 2, ["Devastating Wounds"]),
      w("Power fist", "melee", "Melee", 5, 2, 8, -2, 2, []),
    ],
    ab: [
      a("Lord of Chaos", "Once per battle round, when a Stratagem targets this model's unit, reduce the CP cost of that use by 1CP."),
      a("Chance for Glory", "Once per battle, at the start of the Fight phase, until the end of the phase improve the Strength, Attacks, Armour Penetration and Damage of melee weapons equipped by this model by 1."),
    ],
    lead: ["csm-legionaries", "csm-chosen", "csm-havocs"],
  }),
  u("csm-master-of-possession", "Master of Possession", "character", 60, { m: 8, t: 4, sv: 3, w: 4, ld: 6, oc: 1 }, ["Infantry", "Character", "Psyker", "Chaos", "Heretic Astartes"], {
    inv: 5,
    r: [
      w("Rite of Possession — witchfire", "ranged", 18, 2, 3, 4, -3, 2, ["Anti-Psyker 2+", "Pistol", "Precision", "Psychic"]),
      w("Rite of Possession — focused", "ranged", 18, 2, 3, 6, -3, 3, ["Anti-Psyker 2+", "Hazardous", "Pistol", "Precision", "Psychic"]),
      boltPistol,
    ],
    m: [w("Staff of possession", "melee", "Melee", 4, 3, 6, -1, "D3", ["Anti-Psyker 2+", "Psychic"])],
    ab: [
      a("Daemonkin", "While this model is leading a unit, add 1 to Advance and Charge rolls made for that unit."),
      a("Sacrificial Dagger", "Once per phase, when this model is selected to shoot or fight, its unit suffers 1 mortal wound and, until the end of the phase, add 1 to the Hit roll and the Wound roll for this model's Psychic Attacks."),
    ],
    lead: ["csm-possessed", "csm-legionaries"],
  }),
  u("csm-legionaries", "Legionaries", "battleline", 90, { m: 6, t: 4, sv: 3, w: 2, ld: 6, oc: 2 }, KW_HA_BL, {
    sizes: [[5, 90], [10, 170]],
    r: [
      boltgun,
      boltPistol,
      w("Plasma gun — standard", "ranged", 24, 1, 3, 7, -2, 1, ["Rapid Fire 1"]),
      w("Plasma gun — supercharge", "ranged", 24, 1, 3, 8, -3, 2, ["Hazardous", "Rapid Fire 1"]),
      w("Meltagun", "ranged", 12, 1, 3, 9, -4, "D6", ["Melta 2"]),
      w("Lascannon", "ranged", 48, 1, 4, 12, -3, "D6+1", ["Heavy"]),
    ],
    m: [chainsword, w("Heavy melee weapon", "melee", "Melee", 3, 3, 8, -2, 2, []), accursed],
    ab: [
      a("Veterans of the Long War", "Each time a model in this unit makes a melee attack, re-roll a Wound roll of 1. If the target is within range of an objective marker, you can re-roll the Wound roll instead."),
      a("Chaos Icon", "Each time this unit takes a Leadership test for Dark Pacts, you can re-roll that test."),
    ],
  }),
  u("csm-cultist-mob", "Cultist Mob", "battleline", 50, { m: 6, t: 3, sv: 6, w: 1, ld: 7, oc: 1 }, ["Infantry", "Battleline", "Grenades", "Chaos", "Damned", "Heretic Astartes"], {
    sizes: [[10, 50], [20, 100]],
    r: [
      w("Autopistol", "ranged", 12, 1, 4, 3, 0, 1, ["Pistol"]),
      w("Bolt pistol", "ranged", 12, 1, 4, 4, 0, 1, ["Pistol"]),
    ],
    m: [w("Brutal assault weapon", "melee", "Melee", 2, 4, 3, 0, 1, [])],
    ab: [
      a("For the Dark Gods", "At the end of your Command phase, if this unit is within range of an objective marker you control, that objective marker remains under your control until your opponent's Level of Control is greater than yours at the end of a phase."),
    ],
  }),
  u("csm-chosen", "Chosen", "infantry", 135, { m: 6, t: 4, sv: 3, w: 3, ld: 6, oc: 1 }, ["Infantry", "Grenades", "Chaos", "Heretic Astartes"], {
    sizes: [[5, 135], [10, 270]],
    r: [boltPistol, boltgun, w("Combi-weapon", "ranged", 24, 1, 4, 4, 0, 1, ["Anti-Infantry 4+", "Devastating Wounds", "Rapid Fire 1"]), plasmaStd, plasmaSuper],
    m: [accursed, w("Paired accursed weapons", "melee", "Melee", 5, 3, 5, -2, 1, ["Twin-linked"]), w("Power fist", "melee", "Melee", 4, 3, 8, -2, 2, [])],
    ab: [
      a("Chosen Marauders", "This unit is eligible to shoot and declare a charge in a turn in which it Advanced or Fell Back."),
      a("Chaos Icon", "Each time this unit takes a Leadership test for Dark Pacts, you can re-roll that test."),
    ],
  }),
  u("csm-havocs", "Havocs", "infantry", 125, { m: 5, t: 5, sv: 3, w: 2, ld: 6, oc: 1 }, ["Infantry", "Chaos", "Heretic Astartes"], {
    sizes: [[5, 125]],
    r: [
      w("Havoc lascannon", "ranged", 48, 1, 3, 12, -3, "D6+1", []),
      w("Havoc autocannon", "ranged", 48, 2, 3, 9, -1, 3, []),
      w("Havoc reaper chaincannon", "ranged", 24, 8, 3, 5, 0, 1, []),
      w("Havoc heavy bolter", "ranged", 36, 3, 3, 5, -1, 2, ["Sustained Hits 1"]),
      w("Havoc missile launcher — krak", "ranged", 48, 1, 3, 9, -2, "D6", []),
      w("Havoc missile launcher — frag", "ranged", 48, "D6", 3, 4, 0, 1, ["Blast"]),
      boltgun,
    ],
    m: [closeCombat, accursed],
    ab: [
      a("Stabilisation Talons", "Each time a model in this unit makes a ranged attack, you can ignore any or all modifiers to the Hit roll and to the Ballistic Skill of that weapon."),
    ],
  }),
  u("csm-possessed", "Possessed", "infantry", 120, { m: 9, t: 6, sv: 3, w: 3, ld: 6, oc: 1 }, ["Infantry", "Daemon", "Chaos", "Heretic Astartes"], {
    inv: 5,
    sizes: [[5, 120], [10, 250]],
    m: [w("Hideous mutations", "melee", "Melee", 4, 3, 5, -1, 2, [])],
    ab: [
      a("Unholy Bloodshed", "Once per battle, when this unit makes a Dark Pact, until the end of the phase weapons equipped by models in this unit have Devastating Wounds."),
      a("Chaos Icon", "Each time this unit takes a Leadership test for Dark Pacts, you can re-roll that test."),
    ],
  }),
  u("csm-venomcrawler", "Venomcrawler", "vehicle", 120, { m: 12, t: 9, sv: 3, w: 9, ld: 6, oc: 3 }, ["Vehicle", "Walker", "Daemon", "Chaos", "Heretic Astartes"], {
    inv: 5,
    r: [w("Excruciator cannon", "ranged", 36, 6, 3, 6, -1, 2, [])],
    m: [w("Soulflayer tendrils and claws", "melee", "Melee", 6, 3, 6, -1, 2, [])],
    ab: [
      a("Soul Eater", "At the end of the Fight phase, if an attack made by this model this phase destroyed one or more enemy units, until the end of the battle add 1 to the Attacks characteristic of this model's weapons."),
    ],
  }),
  u("csm-vindicator", "Chaos Vindicator", "vehicle", 185, { m: 9, t: 11, sv: 2, w: 11, ld: 6, oc: 3 }, ["Vehicle", "Frame", "Smoke", "Chaos", "Heretic Astartes"], {
    r: [
      w("Demolisher cannon", "ranged", 24, "D6+3", 3, 14, -3, "D6", ["Blast"]),
      w("Havoc launcher", "ranged", 48, "D6", 3, 5, 0, 1, ["Blast"]),
      w("Combi-bolter", "ranged", 24, 2, 3, 4, 0, 1, ["Rapid Fire 2"]),
    ],
    m: [w("Armoured tracks", "melee", "Melee", 3, 4, 6, 0, 1, [])],
    ab: [
      a("Siege Shield", "This model can target enemy units within Engagement Range with its demolisher cannon, and it does not suffer the Hit roll penalty for shooting while within Engagement Range."),
    ],
  }),
  u("csm-helbrute", "Helbrute", "vehicle", 130, { m: 6, t: 9, sv: 2, w: 8, ld: 6, oc: 3 }, ["Vehicle", "Walker", "Chaos", "Heretic Astartes"], {
    r: [
      w("Multi-melta", "ranged", 18, 2, 3, 9, -4, "D6", ["Melta 2"]),
      w("Twin lascannon", "ranged", 48, 1, 3, 12, -3, "D6+1", ["Twin-linked"]),
      w("Missile launcher — krak", "ranged", 48, 1, 3, 9, -2, "D6", []),
      w("Missile launcher — frag", "ranged", 48, "D6", 3, 4, 0, 1, ["Blast"]),
      w("Heavy flamer", "ranged", 12, "D6", 0, 5, -1, 1, ["Ignores Cover", "Torrent"]),
    ],
    m: [w("Helbrute fist", "melee", "Melee", 5, 3, 12, -2, 3, []), w("Helbrute hammer", "melee", "Melee", 5, 4, 14, -3, "D6+1", []), closeCombat],
    ab: [
      a("Dark Ascension", "While a friendly Heretic Astartes unit is within 6\" of this model, each time that unit makes a Dark Pact, its weapons gain both Lethal Hits and Sustained Hits 1 instead of only one."),
      a("Devoted to Destruction", "If this model is equipped with two melee weapons in addition to its close combat weapon, add 2 to the Attacks characteristic of those two weapons."),
    ],
  }),
];

const detachments: Detachment[] = detPack("csm", [
  {
    id: "cabal",
    name: "Cabal of Chaos",
    dp: 1,
    disposition: "Disruption",
    tag: "cabal",
    rule: a("Empyric Wellspring", "In your Shooting phase, when a Heretic Astartes Psyker unit (excluding Daemon units) makes a Dark Pact, its ranged attacks have +1 Strength. In the Fight phase, when a Heretic Astartes Daemon Prince (excluding Khorne) makes a Dark Pact, its melee attacks have +2 Strength and +1 Armour Penetration."),
    strats: [
      { id: "csm-cabal-vigour", name: "Infernal Vigour", cp: 1, when: "Command phase", text: "One friendly Psyker or Daemon unit that is not Khorne regains D3+1 lost wounds." },
      { id: "csm-cabal-curse", name: "Fleshy Curse", cp: 1, when: "Start of your Shooting phase", text: "A Psyker makes a Psychic Attack against a visible enemy unit within 12\". On a 1 it suffers 1 mortal wound; on a 2–4, D3 mortal wounds; on a 5–6, 2D3 mortal wounds." },
    ],
    enh: [],
  },
  {
    id: "devotees",
    name: "Devotees of Destruction",
    dp: 1,
    disposition: "Priority Assets",
    tag: "devotees",
    rule: a("Rain of Ruin", "Ranged weapons equipped by Havocs and Obliterators units from your army have Heavy."),
    strats: [
      { id: "csm-dev-bounty", name: "Ruination's Bounty", cp: 1, when: "Your Shooting phase", text: "A Havocs or Obliterators unit that makes a Dark Pact has both Lethal Hits and Sustained Hits 1 on its ranged attacks." },
      { id: "csm-dev-snare", name: "Snare of Fire", cp: 1, when: "Opponent's Movement phase", text: "When an enemy unit ends a move within 8\" of an unengaged Havocs unit, that Havocs unit can make a Normal move of D3+3\"." },
    ],
    enh: [],
  },
  {
    id: "murdertalon",
    name: "Murdertalon Raiders",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "nightmare",
    rule: a("Nightmare Raid", "Each time an Infantry Fly unit from your army makes an attack that targets a unit that is Battle-shocked or Below Half-strength, re-roll a Hit roll of 1. While an enemy unit that is Battle-shocked or Below Half-strength targets a friendly Infantry Fly unit, subtract 1 from the Hit roll. This Detachment has the Nightmare tag."),
    strats: [
      { id: "csm-mur-plunge", name: "Plunging Talons", cp: 1, when: "Fight phase", text: "Melee weapons of an Infantry Fly unit that charged this turn have Lance." },
      { id: "csm-mur-rake", name: "Raking Pass", cp: 1, when: "Your Movement phase", text: "An Infantry Fly unit that Fell Back this turn is eligible to declare a charge." },
    ],
    enh: [],
  },
  {
    id: "cult",
    name: "Chaos Cult",
    dp: 2,
    disposition: "Priority Assets",
    tag: "cult",
    rule: a("Desperate Devotion", "Each time a Damned unit from your army makes a Normal move, Advances, or declares a charge, it can make a Desperate Pact. If it does, take a Leadership test: if failed, the unit suffers D3 mortal wounds. Then add 2\" to the Move characteristic of models in that unit and add 2 to Charge rolls made for it."),
    strats: [{ id: "csm-cult-glory", name: "Chosen for Glory", cp: 1, when: "Your Shooting phase or the Fight phase", text: "One Damned unit makes a Desperate Pact. It can re-roll Hit rolls, and if the Leadership test is passed it can re-roll Wound rolls as well." }],
    enh: [],
  },
  {
    id: "bile",
    name: "Creations of Bile",
    dp: 3,
    disposition: "Purge the Foe",
    tag: "bile",
    rule: a("Experimental Augmentations", "At the start of the battle, pick one result or roll 2D6 for two results. Non-Damned Infantry units from your army gain those augmentations: 1 +1 Attack on melee weapons; 2 +2\" Move; 3 +1 Weapon Skill; 4 +1 Toughness; 5 +1 Strength on melee weapons; 6 +1 Ballistic Skill. If Fabius Bile is your Warlord, you can re-roll any of those dice."),
    strats: [{ id: "csm-bile-auto", name: "Autostimulants", cp: 1, when: "Your Movement phase", text: "One Infantry unit from your army is eligible to declare a charge in a turn in which it Advanced." }],
    enh: [],
  },
  {
    id: "arkifane",
    name: "Cult of the Arkifane",
    dp: 2,
    disposition: "Priority Assets",
    tag: "arkifane",
    rule: a("Soul Forge Boons", "Heretic Astartes Vehicle units from your army gain the Daemon keyword. Those Vehicles, Vashtorr the Arkifane, and a Lord Discordant have Soul Forge. Units with Soul Forge have a 5+ invulnerable save."),
    strats: [{ id: "csm-arki-bale", name: "Balefire Boon", cp: 1, when: "Your Shooting phase or the Fight phase", text: "Improve the Armour Penetration of attacks made by one Soul Forge unit by 1." }],
    enh: [{ id: "csm-arki-font", name: "Cybinfernal Font", points: 20, text: "Non-Damned model only. The bearer's unit gains Soul Forge." }],
  },
  {
    id: "deceptors",
    name: "Deceptors",
    dp: 2,
    disposition: "Disruption",
    tag: "deceptors",
    rule: a("Masters of Misdirection", "Depending on the battle size, up to two or three Legionaries and Cultist Mob units from your army, and any non-Epic Hero Characters leading them, have Infiltrators."),
    strats: [{ id: "csm-dec-coils", name: "Coils of Deception", cp: 1, when: "Your Movement phase", text: "One unit from your army is eligible to shoot in a turn in which it Fell Back." }],
    enh: [{ id: "csm-dec-false", name: "Falsehood", points: 10, text: "Chaos Lord on foot only. In your Movement phase, if the bearer is in Reserves, you can destroy one Legionary or Chosen model and set this model up in its place, attached to that unit." }],
  },
  {
    id: "dread",
    name: "Dread Talons",
    dp: 2,
    disposition: "Disruption",
    tag: "dread",
    rule: a("Terror Descends", "In your opponent's Command phase, each enemy unit that is below its Starting Strength and within 12\" of a unit from your army must take a Battle-shock test. Subtract 1 from Battle-shock tests taken for enemy units within 12\" of a unit from your army."),
    strats: [],
    enh: [],
  },
  {
    id: "fellhammer",
    name: "Fellhammer Siege-host",
    dp: 2,
    disposition: "Take and Hold",
    tag: "fellhammer",
    rule: a("Siegecraft", "Each time an attack targets a Heretic Astartes Infantry unit from your army, if the Strength of that attack is greater than the Toughness of that unit, subtract 1 from the Wound roll."),
    strats: [],
    enh: [],
  },
  {
    id: "huron",
    name: "Huron's Marauders",
    dp: 3,
    disposition: "Disruption",
    tag: "huron",
    rule: a("Tyrannical Motivation", "In your Command phase, each Heretic Astartes Infantry unit from your army gains either +1 to Hit rolls or the ability to shoot and charge after Falling Back, until the start of your next Command phase. At the start of any phase, units within line of sight of Huron Blackheart gain both."),
    strats: [{ id: "csm-huron-tyrant", name: "At the Tyrant's Command", cp: 1, when: "Your Movement phase", text: "One unit from your army that is not a Monster or Vehicle is eligible to shoot and declare a charge in a turn in which it Advanced." }],
    enh: [{ id: "csm-huron-raid", name: "Raid Leader", points: 20, text: "Non-Damned Character only. The bearer's unit is eligible to declare a charge in a turn in which it disembarked from a Transport that moved." }],
  },
  {
    id: "pactbound",
    name: "Pactbound Zealots",
    dp: 3,
    disposition: "Priority Assets",
    tag: "pactbound",
    rule: a("Marks of Chaos", "Each unit from your army that is not an Epic Hero must be given one Mark: Khorne, Tzeentch, Nurgle, Slaanesh, or Chaos Undivided. A Character can only join, and a unit can only embark within, a unit with the same Mark. If the unit makes a Dark Pact and passes the Leadership test: Khorne scores Critical Hits on a 5+ in melee with Lethal Hits; Tzeentch does so when shooting; Slaanesh scores Critical Hits on a 5+ in melee with Sustained Hits 1; Nurgle does so when shooting; Chaos Undivided re-rolls Hit rolls of 1."),
    strats: [{ id: "csm-pact-obscure", name: "Dark Obscuration", cp: 1, when: "Opponent's Shooting phase", text: "One unit from your army has Stealth until the end of the phase. A Nurgle unit cannot be targeted unless the attacker is within 18\"." }],
    enh: [],
  },
  {
    id: "raiders",
    name: "Renegade Raiders",
    dp: 3,
    disposition: "Reconnaissance",
    tag: "raiders",
    rule: a("Raiders and Reavers", "Ranged weapons equipped by Heretic Astartes units from your army have Assault. Improve the Armour Penetration of attacks made by those units by 1 while they target a unit within range of an objective marker."),
    strats: [{ id: "csm-raid-opp", name: "Opportunistic Raiders", cp: 1, when: "End of the Fight phase", text: "One unit that was eligible to fight can make a Normal move of up to 6\" (12\" if it is Mounted). If it did not disembark this turn, it can embark if it ends within 3\" of a Transport." }],
    enh: [],
  },
  {
    id: "veterans",
    name: "Veterans of the Long War",
    dp: 2,
    disposition: "Take and Hold",
    tag: "veterans",
    rule: a("Focus of Hatred", "At the start of your Command phase, select one enemy unit to be your focus of hatred. Until the start of your next Command phase, each time a Heretic Astartes model from your army (excluding Damned models) makes an attack that targets that unit, you can re-roll the Hit roll."),
    strats: [],
    enh: [],
  },
]);

export const chaosSpaceMarines: Faction = {
  id: "csm",
  name: "Chaos Space Marines",
  short: "Heretic Astartes",
  allegiance: "Chaos",
  accent: "#8a2e2e",
  rule: a(
    "Dark Pacts",
    "Each time a unit with this ability is selected to shoot or fight, it can make a Dark Pact. If it does, take a Leadership test before the pact is resolved. If the test is failed, the unit suffers D3 mortal wounds. Then select either Lethal Hits or Sustained Hits 1 for that unit's weapons until the end of the phase.",
  ),
  detachments,
  units,
  updatedAt: "2026-09-25",
};
