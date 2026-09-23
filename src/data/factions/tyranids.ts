import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { w } from "../weapons";

const fleshborer = w("Fleshborer", "ranged", 18, 1, 4, 5, 0, 1, ["Assault"]);
const devourer = w("Devourer", "ranged", 18, 5, 4, 4, 0, 1, ["Assault"]);
const clawsTeeth = w("Chitinous claws and teeth", "melee", "Melee", 1, 4, 3, 0, 1, []);
const stingerSalvo = w("Stinger salvoes", "ranged", 24, 8, 3, 5, 0, 1, []);
const heavyVenom = w("Heavy venom cannon", "ranged", 36, "D3", 2, 9, -2, 3, ["Blast"]);
const stranglethorn = w("Stranglethorn cannon", "ranged", 36, "D6+1", 2, 7, -1, 2, ["Blast"]);
const bonesword = w("Monstrous bonesword and lash whip", "melee", "Melee", 6, 2, 9, -2, 3, ["Twin-linked"]);
const lictorClaws = w("Lictor claws and talons", "melee", "Melee", 6, 2, 7, -2, 2, ["Precision"]);
const powerfulLimbs = w("Powerful limbs", "melee", "Melee", 3, 4, 7, -1, 2, []);
const scythingTalons = w("Scything talons", "melee", "Melee", 4, 3, 5, -1, 1, []);
const loneOp = a("Lone Operative", "This unit is not visible to enemy models more than 12\" away.");
const deepStrike = a("Deep Strike", "This unit can make an Ingress move from Reserves more than 8\" from enemy models.");
const infiltrate = a("Infiltrators", "Set up more than 8\" from the enemy deployment zone and all enemy units.");
const fightsFirst = a("Fights First", "This unit fights in the Fights First step.");
const stealth = a("Stealth", "Ranged attacks that target this unit have the Benefit of Cover.");
const willOfHive = a("Will of the Hive Mind", "Once per battle round, you can target this model's unit with a Stratagem for 0 CP.");
const KW_SYN = ["Monster", "Character", "Psyker", "Synapse", "Tyranids"];
const KW_VANGUARD = ["Infantry", "Great Devourer", "Tyranids", "Vanguard Invader"];
const KW_SWARM = ["Infantry", "Battleline", "Tyranids", "Endless Multitude"];
const KW_INF = ["Infantry", "Tyranids"];
const KW_MON = ["Monster", "Tyranids"];
const sizes10 = (p10: number, p20: number): Array<[number, number]> => [
  [10, p10],
  [20, p20],
];
const sizes36 = (p3: number, p6: number): Array<[number, number]> => [
  [3, p3],
  [6, p6],
];

const units: UnitDef[] = [
  u("nids-swarmlord", "The Swarmlord", "character", 210, { m: 8, t: 10, sv: 2, w: 10, ld: 7, oc: 3 }, [...KW_SYN, "Epic Hero", "Hive Tyrant"], {
    inv: 4,
    r: [w("Synaptic pulse", "ranged", 18, "D6+3", 0, 5, -1, 2, ["Psychic", "Torrent"])],
    m: [w("Bone sabres", "melee", "Melee", 8, 2, 9, -2, 3, ["Twin-linked"])],
    ab: [
      a("Hive Commander", "At the start of your Command phase, if this model is on the battlefield, you gain 1 CP."),
      a("Malign Presence", "Once per turn, when an enemy unit within 12\" is targeted by a Stratagem, that use costs 1 CP more."),
      willOfHive,
    ],
    lead: ["nids-tyrant-guard"],
  }),
  u("nids-hive-tyrant", "Hive Tyrant", "character", 195, { m: 8, t: 10, sv: 2, w: 10, ld: 7, oc: 3 }, KW_SYN, {
    inv: 4,
    r: [heavyVenom, stranglethorn],
    m: [bonesword],
    ab: [
      willOfHive,
      a("Onslaught", "Friendly Tyranids units within 6\" have Assault and Lethal Hits on ranged weapons."),
    ],
    lead: ["nids-tyrant-guard"],
  }),
  u("nids-winged-tyrant", "Winged Hive Tyrant", "character", 185, { m: 12, t: 9, sv: 2, w: 10, ld: 7, oc: 3 }, [...KW_SYN, "Fly", "Vanguard Invader", "Hive Tyrant"], {
    inv: 4,
    r: [heavyVenom, stranglethorn],
    m: [
      bonesword,
      w("Tyrant talons", "melee", "Melee", 5, 2, 7, -2, 2, []),
      w("Monstrous scything talons", "melee", "Melee", 4, 2, 7, -2, 2, ["Extra Attacks"]),
    ],
    ab: [
      a("Will of the Hive Mind", "Once per battle round, when a friendly Tyranids unit within 12\" is targeted with a Stratagem, reduce that CP cost by 1."),
      deepStrike,
      a("Deadly Demise D3", "When this model is destroyed, on a 4+ each unit within 6\" suffers D3 mortal wounds."),
      a("Paroxysm", "At the start of the Fight phase, pick one visible enemy unit within 12\" and roll a D6. On a 1 this model suffers D3 mortal wounds. On a 2+, that unit's weapons are −1 Attacks until the end of the phase."),
    ],
  }),
  u("nids-neurotyrant", "Neurotyrant", "character", 130, { m: 6, t: 8, sv: 4, w: 9, ld: 7, oc: 3 }, ["Monster", "Character", "Fly", "Psyker", "Synapse", "Tyranids"], {
    inv: 4,
    r: [w("Psychic scream", "ranged", 18, "D6+3", 3, 6, -1, 1, ["Psychic", "Devastating Wounds"])],
    m: [w("Neurotyrant claws", "melee", "Melee", 6, 3, 5, -1, 1, [])],
    ab: [
      a("Shadow Node", "When you use Shadow in the Warp, enemy units take that Battle-shock test at −1."),
      a("Synaptic Amplification", "Two friendly Tyranids units within 12\" always count as being within Synapse Range."),
    ],
    lead: ["nids-zoanthropes", "nids-neurogaunts", "nids-tyrant-guard"],
  }),
  u("nids-tervigon", "Tervigon", "character", 160, { m: 8, t: 11, sv: 2, w: 16, ld: 7, oc: 5 }, KW_SYN, {
    r: [stingerSalvo],
    m: [w("Massive crushing claws", "melee", "Melee", 4, 4, 12, -3, "D6+1", [])],
    ab: [
      a("Spawn Termagants", "At the end of your Movement phase, set up a new 10-model Termagants unit wholly within 6\" of this model and more than 1\" from enemy models."),
      a("Brood Progenitor", "Termagants units within 6\" have Lethal Hits on ranged weapons."),
    ],
  }),
  u("nids-broodlord", "Broodlord", "character", 80, { m: 8, t: 5, sv: 4, w: 6, ld: 7, oc: 1 }, KW_VANGUARD.concat(["Character", "Psyker", "Synapse"]), {
    inv: 4,
    m: [w("Broodlord claws and talons", "melee", "Melee", 6, 2, 6, -2, 2, ["Twin-linked"])],
    ab: [
      a("Hypnotic Gaze", "While leading a unit, melee weapons in that unit have Lethal Hits. Melee attacks that target this unit are −1 to Hit."),
      infiltrate,
    ],
    lead: ["nids-genestealers"],
  }),
  u("nids-deathleaper", "Deathleaper", "character", 80, { m: 8, t: 6, sv: 3, w: 7, ld: 7, oc: 1 }, ["Infantry", "Character", "Epic Hero", "Great Devourer", "Tyranids", "Vanguard Invader", "Deathleaper"], {
    inv: 4,
    m: [lictorClaws],
    ab: [
      fightsFirst,
      infiltrate,
      loneOp,
      stealth,
      a("Feeder Tendrils", "Each time this model destroys an enemy Character model, you gain 1 CP."),
      a("Fear of the Unseen", "Enemy units within 6\" worsen Leadership by 1. In your opponent's Command phase, such a unit below Starting Strength must take a Battle-shock test."),
    ],
  }),
  u("nids-old-one-eye", "Old One Eye", "character", 140, { m: 8, t: 9, sv: 2, w: 9, ld: 8, oc: 3 }, ["Monster", "Character", "Epic Hero", "Tyranids"], {
    fnp: 5,
    m: [
      w("Claws and talons — strike", "melee", "Melee", 6, 3, 14, -3, "D6+1", []),
      w("Claws and talons — sweep", "melee", "Melee", 12, 3, 6, -1, 1, []),
    ],
    ab: [
      a("Alpha Leader", "While leading a unit, that unit can re-roll Hit rolls."),
      a("Unstoppable Monster", "At the start of each player's Command phase, this model regains up to D3 lost wounds."),
    ],
    lead: ["nids-carnifexes"],
  }),
  u("nids-red-terror", "The Red Terror", "character", 130, { m: 10, t: 8, sv: 3, w: 9, ld: 8, oc: 3 }, ["Monster", "Character", "Epic Hero", "Great Devourer", "Tyranids", "Vanguard Invader", "Burrower", "Mobile"], {
    m: [
      w("Scything talons", "melee", "Melee", 12, 2, 7, -2, 2, []),
      w("Gaping maw", "melee", "Melee", 1, 2, 5, 0, "D3+2", ["Extra Attacks", "Devastating Wounds", "Precision"]),
    ],
    ab: [
      deepStrike,
      a("Swallow Whole", "Gaping maw attacks against Infantry, Mounted, or Beasts score a Critical Wound on a successful unmodified Wound roll. Each model those attacks destroy lets this model regain up to D3+2 lost wounds."),
      a("Subterranean Hunter", "At the end of the Fight phase, if this unit is not in Engagement Range, it can be placed into Strategic Reserves."),
    ],
  }),
  u("nids-parasite", "Parasite of Mortrex", "character", 70, { m: 12, t: 5, sv: 4, w: 5, ld: 8, oc: 1 }, KW_VANGUARD.concat(["Character", "Fly", "Synapse"]), {
    m: [
      w("Clawed limbs", "melee", "Melee", 6, 2, 5, -1, 1, []),
      w("Barbed ovipositor", "melee", "Melee", 1, 2, 3, -2, 3, ["Anti-Infantry 3+", "Extra Attacks"]),
    ],
    ab: [
      loneOp,
      deepStrike,
      stealth,
      a("Parasitic Infection", "Each time the barbed ovipositor destroys an Infantry model, you can set up a Ripper Swarms unit of D3 models within 3\", including within Engagement Range of that unit."),
      a("It Itches!", "At the start of the Fight phase, one enemy unit in Engagement Range of this model must take a Battle-shock test."),
    ],
  }),
  u("nids-winged-prime", "Winged Tyranid Prime", "character", 65, { m: 12, t: 5, sv: 4, w: 6, ld: 7, oc: 1 }, ["Infantry", "Character", "Fly", "Synapse", "Tyranids", "Vanguard Invader"], {
    r: [w("Prime talons", "ranged", 12, 2, 2, 5, -1, 1, ["Assault", "Pistol"])],
    m: [w("Prime talons", "melee", "Melee", 6, 2, 6, -1, 2, [])],
    ab: [
      a("Alpha Warrior", "While leading a unit, weapons in that unit have Sustained Hits 1."),
      deepStrike,
    ],
    lead: ["nids-warriors-melee", "nids-warriors-ranged", "nids-gargoyles"],
  }),
  u("nids-prime", "Tyranid Prime with Lash Whip", "character", 75, { m: 10, t: 5, sv: 3, w: 6, ld: 7, oc: 1 }, ["Infantry", "Character", "Synapse", "Tyranids"], {
    m: [w("Bonesword and lash whip", "melee", "Melee", 6, 2, 6, -2, 2, ["Twin-linked"])],
    ab: [a("Alpha Warrior", "While leading a unit, weapons in that unit have Sustained Hits 1.")],
    lead: ["nids-warriors-melee", "nids-warriors-ranged", "nids-termagants", "nids-hormagaunts"],
  }),
  u("nids-malanthrope", "Malanthrope", "character", 75, { m: 6, t: 5, sv: 4, w: 10, ld: 7, oc: 3 }, ["Infantry", "Character", "Fly", "Synapse", "Tyranids"], {
    m: [w("Grasping tail", "melee", "Melee", 6, 3, 5, -1, 1, ["Anti-Infantry 2+"])],
    ab: [
      a("Prey Adaptation", "Venomthrope units within 6\" have Sustained Hits 1, Lance, or Lethal Hits (choose one at the start of the battle)."),
      a("Spore Cloud", "Friendly Tyranids units (excluding Monsters) within 6\" have Stealth. All friendly Tyranids units within 6\" have the Benefit of Cover."),
    ],
    lead: ["nids-venomthropes"],
  }),
  u("nids-hyper-raveners", "Hyperadapted Raveners", "character", 165, { m: 10, t: 5, sv: 4, w: 3, ld: 7, oc: 1 }, ["Infantry", "Character", "Synapse", "Tyranids", "Vanguard Invader", "Burrower"], {
    sizes: [[5, 165]],
    r: [w("Thorax web spitter", "ranged", 18, "D6+3", 0, 6, -1, 1, ["Assault", "Ignores Cover", "Torrent"])],
    m: [w("Hyperadapted claws", "melee", "Melee", 5, 3, 5, -1, 1, ["Anti-Monster 5+", "Anti-Vehicle 5+", "Sustained Hits 1"])],
    ab: [
      deepStrike,
      a("Tunnel Network", "Friendly Tyranids units can Ingress onto a Tunnel marker more than 8\" from enemy models."),
    ],
    lead: ["nids-raveners"],
  }),
  u("nids-lictor", "Lictor", "character", 60, { m: 8, t: 6, sv: 4, w: 6, ld: 7, oc: 1 }, [...KW_VANGUARD, "Lictor"], {
    m: [lictorClaws],
    ab: [
      fightsFirst,
      infiltrate,
      loneOp,
      stealth,
      a("Feeder Tendrils", "Each time this model destroys an enemy Character model, you gain 1 CP."),
      a("Pheromone Trail", "Once per battle round, this model can use Rapid Ingress for 0 CP."),
    ],
  }),
  u("nids-neurolictor", "Neurolictor", "character", 80, { m: 8, t: 5, sv: 4, w: 7, ld: 7, oc: 1 }, ["Infantry", "Great Devourer", "Synapse", "Tyranids", "Vanguard Invader", "Neurolictor"], {
    inv: 4,
    m: [w("Piercing claws and talons", "melee", "Melee", 6, 2, 6, -2, 1, ["Precision"])],
    ab: [
      infiltrate,
      loneOp,
      stealth,
      a("Feeder Tendrils", "Each time this model destroys an enemy Character model, you gain 1 CP."),
      a("Neural Disruption", "In your Command phase, one enemy unit within 12\" must take a Battle-shock test."),
      a("Psychological Saboteur", "While an enemy unit within 12\" is Battle-shocked, its attacks are −1 to Hit and friendly Tyranids attacks against it are +1 to Wound."),
    ],
  }),
  u("nids-termagants", "Termagants", "battleline", 60, { m: 6, t: 3, sv: 5, w: 1, ld: 8, oc: 2 }, KW_SWARM, {
    sizes: sizes10(60, 110),
    r: [
      fleshborer,
      w("Termagant devourer", "ranged", 18, 2, 4, 4, 0, 1, []),
      w("Termagant spinefists", "ranged", 12, 2, 4, 3, 0, 1, ["Assault", "Pistol", "Twin-linked"]),
      w("Shardlauncher", "ranged", 18, "D3", 4, 5, 0, 1, ["Blast", "Heavy"]),
      w("Spike rifle", "ranged", 24, 1, 4, 4, -1, 1, ["Heavy"]),
      w("Strangleweb", "ranged", 18, "D6", 0, 2, 0, 1, ["Assault", "Devastating Wounds", "Torrent"]),
    ],
    m: [clawsTeeth],
    ab: [a("Skulking Horrors", "In your opponent's Movement phase, if an enemy ends a move within 8\" and this unit is not in Engagement Range, it can make a Normal move of up to D6\".")],
  }),
  u("nids-hormagaunts", "Hormagaunts", "battleline", 70, { m: 10, t: 3, sv: 5, w: 1, ld: 8, oc: 2 }, KW_SWARM, {
    sizes: sizes10(70, 120),
    m: [w("Hormagaunt talons", "melee", "Melee", 3, 4, 3, -1, 1, [])],
    ab: [a("Bounding Leap", "This unit is eligible to declare a charge in a turn in which it Advanced.")],
  }),
  u("nids-gargoyles", "Gargoyles", "battleline", 80, { m: 12, t: 3, sv: 6, w: 1, ld: 8, oc: 2 }, ["Infantry", "Battleline", "Fly", "Tyranids", "Endless Multitude", "Vanguard Invader"], {
    sizes: sizes10(80, 155),
    r: [fleshborer],
    m: [w("Blinding venom", "melee", "Melee", 1, 4, 3, 0, 1, [])],
    ab: [a("Winged Swarm", "Ingress from Reserves more than 8\" from enemy models. Eligible to shoot and charge after Falling Back.")],
  }),
  u("nids-neurogaunts", "Neurogaunts", "infantry", 45, { m: 6, t: 3, sv: 6, w: 1, ld: 8, oc: 1 }, ["Infantry", "Tyranids", "Endless Multitude"], {
    sizes: [
      [11, 45],
      [22, 90],
    ],
    m: [clawsTeeth],
    ab: [a("Neurocytes", "While within Synapse Range of a friendly Tyranids unit (excluding Neurogaunts), this unit has the Synapse keyword.")],
  }),
  u("nids-genestealers", "Genestealers", "infantry", 75, { m: 8, t: 4, sv: 5, w: 2, ld: 7, oc: 1 }, KW_VANGUARD, {
    inv: 5,
    sizes: [
      [5, 75],
      [10, 140],
    ],
    m: [w("Genestealer claws and talons", "melee", "Melee", 4, 2, 4, -2, 1, [])],
    ab: [
      a("Scouts 8\"", "This unit can make a 8\" Scout move before the first turn."),
      a("Vanguard Predator", "Re-roll Hit rolls of 1. If the target is on an objective, re-roll Wound rolls of 1 as well."),
    ],
  }),
  u("nids-warriors-melee", "Tyranid Warriors with Melee Bio-weapons", "infantry", 75, { m: 6, t: 5, sv: 4, w: 3, ld: 7, oc: 2 }, ["Infantry", "Synapse", "Tyranids"], {
    sizes: sizes36(75, 150),
    m: [w("Tyranid Warrior claws and talons", "melee", "Melee", 6, 3, 5, -2, 1, ["Twin-linked"])],
    ab: [
      a("Adaptive Instincts", "Once per turn, when this unit is selected to fight or is targeted, its melee attacks are +1 Strength or it has +1 Toughness."),
    ],
  }),
  u("nids-warriors-ranged", "Tyranid Warriors with Ranged Bio-weapons", "infantry", 60, { m: 6, t: 5, sv: 4, w: 3, ld: 7, oc: 2 }, ["Infantry", "Synapse", "Tyranids"], {
    sizes: sizes36(60, 120),
    r: [
      devourer,
      w("Deathspitter", "ranged", 24, 3, 4, 5, -1, 1, []),
      w("Spinefists", "ranged", 12, 2, 4, 4, 0, 1, ["Assault", "Pistol", "Twin-linked"]),
      w("Barbed strangler", "ranged", 36, "D6+1", 4, 6, -1, 1, ["Blast"]),
      w("Venom cannon", "ranged", 36, "D3", 4, 9, -2, 2, ["Blast"]),
    ],
    m: [w("Tyranid Warrior claws and talons", "melee", "Melee", 5, 3, 5, -1, 1, [])],
    ab: [a("Adaptable Predators", "Eligible to shoot and charge after Falling Back.")],
  }),
  u("nids-raveners", "Raveners", "infantry", 125, { m: 10, t: 5, sv: 4, w: 3, ld: 8, oc: 1 }, ["Infantry", "Tyranids", "Vanguard Invader", "Burrower"], {
    sizes: [[5, 125]],
    r: [w("Thorax web spitter", "ranged", 18, "D6", 4, 4, 0, 1, ["Torrent"])],
    m: [w("Ravener claws and talons", "melee", "Melee", 5, 3, 5, -1, 1, [])],
    ab: [
      a("Death From Below", "Ingress from Reserves more than 8\" from enemy models, then place a Tunnel marker."),
      a("Tunnel Network", "Friendly Tyranids units can Ingress onto a Tunnel marker more than 8\" from enemy models."),
    ],
  }),
  u("nids-leapers", "Von Ryan's Leapers", "infantry", 55, { m: 10, t: 5, sv: 4, w: 3, ld: 8, oc: 1 }, KW_VANGUARD, {
    inv: 6,
    sizes: sizes36(55, 105),
    m: [w("Leaper's talons", "melee", "Melee", 6, 3, 5, -1, 1, [])],
    ab: [
      fightsFirst,
      infiltrate,
      stealth,
      a("Pouncing Leap", "Can Heroic Intervention for −1 CP, and that use does not stop other units using the Stratagem this phase."),
    ],
  }),
  u("nids-barbgaunts", "Barbgaunts", "infantry", 55, { m: 6, t: 4, sv: 4, w: 2, ld: 8, oc: 1 }, KW_INF, {
    sizes: [
      [5, 55],
      [10, 110],
    ],
    r: [w("Bio-cannon", "ranged", 24, 2, 4, 5, -1, 2, ["Heavy", "Blast"])],
    m: [clawsTeeth],
    ab: [a("Disruption Bombardment", "If this unit scores a hit against an Infantry unit, that unit is −2 Move and cannot Advance until your next turn.")],
  }),
  u("nids-biovores", "Biovores", "infantry", 50, { m: 5, t: 6, sv: 4, w: 4, ld: 8, oc: 1 }, KW_INF, {
    sizes: [
      [1, 50],
      [2, 90],
      [3, 130],
    ],
    r: [w("Spore mine launcher", "ranged", 48, "D3", 4, 6, -1, 2, ["Blast", "Heavy", "Indirect Fire", "Devastating Wounds"])],
    m: [clawsTeeth],
    ab: [a("Seed Spore Mines", "Instead of shooting, set up a Spore Mines unit wholly within 48\" of this unit and more than 8\" from enemy models.")],
  }),
  u("nids-hive-guard", "Hive Guard", "infantry", 80, { m: 6, t: 7, sv: 3, w: 4, ld: 8, oc: 1 }, KW_INF, {
    sizes: sizes36(80, 160),
    r: [
      w("Shockcannon", "ranged", 24, 2, 3, 7, -1, 3, ["Anti-Vehicle 2+"]),
      w("Impaler cannon", "ranged", 36, 4, 4, 5, -1, 1, ["Heavy", "Indirect Fire"]),
    ],
    m: [w("Chitinous claws and teeth", "melee", "Melee", 3, 4, 5, 0, 1, [])],
    ab: [a("Defensive Stance", "When this unit uses Fire Overwatch, hits are scored on 5+ (4+ if it is on an objective).")],
  }),
  u("nids-pyrovores", "Pyrovores", "infantry", 40, { m: 5, t: 6, sv: 3, w: 5, ld: 8, oc: 1 }, ["Infantry", "Tyranids", "Harvester"], {
    sizes: [
      [1, 40],
      [2, 70],
      [3, 100],
    ],
    r: [w("Flamespurt", "ranged", 12, "D6+1", 0, 6, -1, 1, ["Ignores Cover", "Torrent", "Twin-linked"])],
    m: [w("Chitinous claws and teeth", "melee", "Melee", 3, 4, 5, 0, 1, [])],
    ab: [a("Burning Sporecloud", "Targets of this unit's shooting do not receive the Benefit of Cover.")],
  }),
  u("nids-venomthropes", "Venomthropes", "infantry", 55, { m: 6, t: 5, sv: 4, w: 3, ld: 8, oc: 1 }, ["Infantry", "Fly", "Tyranids"], {
    sizes: sizes36(55, 110),
    m: [w("Toxic lashes", "melee", "Melee", 6, 3, 5, -1, 1, ["Anti-Infantry 2+"])],
    ab: [a("Spore Cloud", "Friendly Tyranids units (excluding Monsters) within 6\" have Stealth. All friendly Tyranids units within 6\" have the Benefit of Cover.")],
  }),
  u("nids-tyrant-guard", "Tyrant Guard", "infantry", 80, { m: 6, t: 8, sv: 3, w: 4, ld: 8, oc: 1 }, KW_INF, {
    sizes: sizes36(80, 170),
    m: [
      scythingTalons,
      w("Bone cleaver, lash whip and rending claws", "melee", "Melee", 4, 3, 7, -1, 2, ["Twin-linked"]),
      w("Crushing claws", "melee", "Melee", 3, 4, 10, -2, 3, []),
    ],
    ab: [a("Guardian Organism", "While a Character is attached, that Character has a 5+ Feel No Pain and is not an eligible target for Precision attacks.")],
  }),
  u("nids-zoanthropes", "Zoanthropes", "infantry", 90, { m: 5, t: 5, sv: 5, w: 3, ld: 7, oc: 1 }, ["Infantry", "Psyker", "Fly", "Synapse", "Tyranids"], {
    inv: 4,
    sizes: sizes36(90, 190),
    r: [
      w("Warp blast (witchfire)", "ranged", 24, "D3", 3, 7, -2, "D3", ["Blast", "Psychic"]),
      w("Warp blast (focused witchfire)", "ranged", 24, 1, 3, 12, -3, "D6+1", ["Lethal Hits", "Psychic"]),
    ],
    m: [w("Chitinous claws and teeth", "melee", "Melee", 2, 5, 3, 0, 1, [])],
    ab: [
      a(
        "Spirit Leech",
        "While an enemy unit is within 6\" of this unit, if this unit contains a Neurothrope, each time that enemy unit fails a Battle-shock test, it suffers D3 mortal wounds and one model in this unit regains up to D3 lost wounds.",
      ),
      a("Warp Field", "While a friendly Tyranids unit is within 6\" of this unit, models in that unit have a 6+ invulnerable save."),
    ],
  }),
  u("nids-ripper-swarms", "Ripper Swarms", "infantry", 30, { m: 6, t: 2, sv: 6, w: 4, ld: 8, oc: 0 }, ["Swarm", "Tyranids", "Harvester"], {
    sizes: [
      [1, 30],
      [2, 40],
      [3, 50],
    ],
    m: [clawsTeeth],
    ab: [a("Chittering Horde", "Enemy units this unit is in Engagement Range of have OC halved (rounding down).")],
  }),
  u("nids-sky-slashers", "Sky-slasher Swarms", "infantry", 60, { m: 12, t: 2, sv: 6, w: 4, ld: 8, oc: 0 }, ["Swarm", "Fly", "Tyranids"], {
    sizes: [[3, 60]],
    m: [clawsTeeth],
    ab: [deepStrike, a("Chittering Horde", "Enemy units this unit is in Engagement Range of have OC halved (rounding down).")],
  }),
  u("nids-carnifexes", "Carnifexes", "monster", 90, { m: 8, t: 9, sv: 2, w: 8, ld: 8, oc: 3 }, KW_MON, {
    sizes: [
      [1, 90],
      [2, 180],
    ],
    r: [
      heavyVenom,
      stranglethorn,
      w("Deathspitters with slimer maggots", "ranged", 18, 3, 4, 7, -1, 1, ["Assault", "Blast"]),
    ],
    m: [
      w("Scything talons", "melee", "Melee", 6, 4, 9, -2, 3, []),
      w("Crushing claws", "melee", "Melee", 4, 4, 12, -3, "D6+1", []),
    ],
    ab: [a("Blistering Assault", "After this unit is shot, it can make a Surge move of D6+2\" toward the closest enemy.")],
  }),
  u("nids-screamer-killer", "Screamer-Killer", "monster", 125, { m: 8, t: 9, sv: 2, w: 10, ld: 8, oc: 3 }, KW_MON, {
    r: [w("Bio-plasmic scream", "ranged", 18, "D6+3", 4, 8, -2, 1, ["Assault", "Blast"])],
    m: [w("Screamer-Killer talons", "melee", "Melee", 10, 3, 10, -2, 3, [])],
    ab: [a("Death Scream", "After this model shoots, one unit it hit must take a Battle-shock test at −1.")],
  }),
  u("nids-haruspex", "Haruspex", "monster", 125, { m: 8, t: 11, sv: 3, w: 14, ld: 8, oc: 4 }, ["Monster", "Tyranids", "Harvester"], {
    m: [
      w("Grazing maw", "melee", "Melee", 14, 3, 7, -2, 1, []),
      w("Raking claws", "melee", "Melee", 4, 3, 14, -2, "D6+1", ["Extra Attacks"]),
      w("Grasping tongue", "melee", "Melee", 1, 3, 7, -2, 2, ["Precision", "Extra Attacks"]),
    ],
    ab: [a("Rapacious Hunger", "Enemy units in Engagement Range of this model must take a Battle-shock test in your opponent's Command phase.")],
  }),
  u("nids-psychophage", "Psychophage", "monster", 110, { m: 8, t: 9, sv: 3, w: 10, ld: 8, oc: 3 }, ["Monster", "Tyranids", "Harvester"], {
    fnp: 5,
    r: [w("Psychoclastic torrent", "ranged", 12, "D6", 0, 6, -1, 1, ["Torrent", "Ignores Cover"])],
    m: [w("Talons and betentacled maw", "melee", "Melee", 6, 3, 6, -2, 2, ["Anti-Psyker 4+", "Devastating Wounds"])],
    ab: [a("Bio-acidic Bloom", "Friendly Tyranids units wholly within 6\" improve the AP of their melee weapons by 1.")],
  }),
  u("nids-maleceptor", "Maleceptor", "monster", 180, { m: 8, t: 11, sv: 3, w: 14, ld: 7, oc: 4 }, ["Monster", "Psyker", "Synapse", "Tyranids"], {
    inv: 4,
    r: [w("Psychic overload", "ranged", 18, "D6+3", 3, 10, -2, 3, ["Blast", "Psychic"])],
    m: [
      w("Massive scything talons — strike", "melee", "Melee", 3, 3, 9, -2, "D6+1", []),
      w("Massive scything talons — sweep", "melee", "Melee", 6, 3, 7, -1, 2, []),
    ],
    ab: [a("Psychic Overload", "Enemy units within 6\" that are Below Half-strength are −1 to Hit and −1 to Wound.")],
  }),
  u("nids-exocrine", "Exocrine", "monster", 135, { m: 8, t: 10, sv: 3, w: 14, ld: 8, oc: 4 }, KW_MON, {
    r: [w("Bio-plasmic cannon", "ranged", 36, "D6+3", 3, 9, -3, 3, ["Blast", "Heavy"])],
    m: [powerfulLimbs],
    ab: [a("Symbiotic Targeting", "If this model Remains Stationary, its bio-plasmic cannon has Ignores Cover and you can re-roll Hit rolls.")],
  }),
  u("nids-tyrannofex", "Tyrannofex", "monster", 170, { m: 8, t: 12, sv: 2, w: 16, ld: 8, oc: 4 }, KW_MON, {
    r: [
      w("Rupture cannon", "ranged", 48, 2, 3, 18, -4, "D6+6", ["Heavy"]),
      w("Acid spray", "ranged", 18, "2D6", 3, 6, -1, 2, ["Torrent", "Ignores Cover"]),
      stingerSalvo,
    ],
    m: [powerfulLimbs],
    ab: [a("Resilient Bio-hull", "Subtract 1 from the Damage of attacks allocated to this model.")],
  }),
  u("nids-trygon", "Trygon", "monster", 140, { m: 10, t: 10, sv: 3, w: 14, ld: 8, oc: 4 }, ["Monster", "Tyranids", "Vanguard Invader", "Burrower"], {
    r: [w("Bio-electric pulse", "ranged", 12, 6, 3, 5, 0, 1, ["Sustained Hits 2"])],
    m: [w("Trygon scything talons", "melee", "Melee", 6, 3, 9, -2, 3, [])],
    ab: [
      a("Death From Below", "Ingress from Reserves more than 8\" from enemy models, then place a Tunnel marker."),
      a("Subterranean Assault", "Friendly Tyranids units can Ingress onto this model's Tunnel marker more than 8\" from enemy models."),
    ],
  }),
  u("nids-mawloc", "Mawloc", "monster", 135, { m: 10, t: 10, sv: 3, w: 14, ld: 8, oc: 4 }, ["Monster", "Tyranids", "Vanguard Invader", "Burrower"], {
    m: [
      w("Distensible jaw", "melee", "Melee", 16, 3, 8, -2, 1, []),
      w("Killriders", "melee", "Melee", 4, 3, 5, 0, 3, ["Anti-Infantry 3+", "Devastating Wounds", "Extra Attacks"]),
    ],
    ab: [
      deepStrike,
      a("Terror from the Deep", "When this model is set up from Reserves, roll one D6 for each enemy unit within 12\": 2–4 that unit suffers D3 mortal wounds; 5+ it suffers 3 mortal wounds and is Battle-shocked."),
    ],
  }),
  u("nids-toxicrene", "Toxicrene", "monster", 160, { m: 8, t: 11, sv: 3, w: 14, ld: 8, oc: 4 }, KW_MON, {
    r: [w("Massive toxic lashes", "ranged", 12, "2D6", 3, 6, -1, 2, ["Anti-Infantry 2+"])],
    m: [w("Massive toxic lashes", "melee", "Melee", 12, 3, 6, -1, 2, ["Anti-Infantry 2+"])],
    ab: [
      a("Choking Spores", "Enemy units within Engagement Range cannot Fall Back on a 3+."),
      a("Acid Blood", "At the end of your Movement phase, each enemy unit within 6\" suffers 1 mortal wound on a 2+ (D3 on a 6)."),
    ],
  }),
  u("nids-norn-emissary", "Norn Emissary", "monster", 250, { m: 10, t: 11, sv: 2, w: 16, ld: 7, oc: 5 }, ["Monster", "Psyker", "Synapse", "Tyranids"], {
    inv: 4,
    fnp: 4,
    r: [
      w("Psychic tendril — blast", "ranged", 18, "D6+3", 2, 5, -1, 1, ["Blast", "Psychic"]),
      w("Psychic tendril — lance", "ranged", 24, 1, 2, 12, -3, "D6+3", ["Psychic"]),
      w("Psychic tendril — precision", "ranged", 24, 2, 2, 6, -2, 3, ["Precision", "Psychic"]),
    ],
    m: [w("Monstrous rending claws", "melee", "Melee", 6, 2, 9, -2, 3, [])],
    ab: [a("Singular Purpose", "At the start of the battle, choose an objective or an enemy unit. Against that target this model re-rolls Hit and Wound; or while within range of that objective it has a 5+ Feel No Pain and OC 15.")],
  }),
  u("nids-norn-assimilator", "Norn Assimilator", "monster", 250, { m: 10, t: 11, sv: 2, w: 16, ld: 7, oc: 5 }, ["Monster", "Synapse", "Tyranids", "Harvester"], {
    inv: 4,
    r: [w("Toxinjector harpoon", "ranged", 18, 1, 3, 14, -3, "D6+6", ["Melta 2"])],
    m: [w("Monstrous scything talons", "melee", "Melee", 8, 2, 9, -2, 3, [])],
    ab: [
      a("Singular Purpose", "At the start of the battle, choose an objective or an enemy unit. Against that target this model re-rolls Hit and Wound; or while within range of that objective it has a 5+ Feel No Pain and OC 15."),
      a("Impaling Strike", "If this model's toxinjector harpoon hit a Monster or Vehicle this turn, add 2 to its Charge rolls against that unit."),
    ],
  }),
  u("nids-harpy", "Harpy", "monster", 185, { m: "20+", t: 9, sv: 3, w: 12, ld: 8, oc: 0 }, ["Monster", "Fly", "Aircraft", "Tyranids", "Vanguard Invader"], {
    r: [
      w("Twin stranglethorn cannon", "ranged", 36, "D6+1", 3, 7, -1, 2, ["Blast", "Twin-linked"]),
      w("Twin heavy venom cannon", "ranged", 36, "D3", 3, 9, -2, 3, ["Blast", "Twin-linked"]),
    ],
    m: [w("Scything wings", "melee", "Melee", 3, 4, 6, 0, 1, [])],
    ab: [
      a("Spore Mine Cysts", "At the end of your opponent's Fight phase, either set up a Spore Mines unit more than 8\" from enemy models, or pick one visible non-Lone Operative enemy within 24\" and roll 6D6: each 3+ inflicts 1 mortal wound."),
    ],
  }),
  u("nids-hive-crone", "Hive Crone", "monster", 170, { m: "20+", t: 9, sv: 3, w: 12, ld: 8, oc: 0 }, ["Monster", "Fly", "Aircraft", "Tyranids", "Vanguard Invader"], {
    r: [
      w("Drool cannon", "ranged", 12, "2D6", 0, 6, -1, 1, ["Torrent", "Ignores Cover"]),
      w("Tentaclids", "ranged", 24, 2, 3, 7, 0, 2, ["Anti-Vehicle 4+", "Devastating Wounds"]),
      stingerSalvo,
    ],
    m: [w("Thorax spur", "melee", "Melee", 3, 4, 10, -2, "D6", ["Anti-Fly 2+"])],
    ab: [a("Airborne Predator", "Each time this model makes an attack that targets a unit that can Fly, add 1 to the Hit roll.")],
  }),
  u("nids-tyrannocyte", "Tyrannocyte", "transport", 80, { m: 8, t: 9, sv: 3, w: 10, ld: 8, oc: 2 }, ["Monster", "Fly", "Transport", "Dedicated Transport", "Tyranids", "Vanguard Invader"], {
    r: [w("Tyrannocyte bio-weapons", "ranged", 24, 5, 4, 5, 0, 1, [])],
    m: [w("Flensing whips", "melee", "Melee", 6, 4, 6, 0, 1, [])],
    ab: [deepStrike, a("Drop Organism", "Units can disembark after this Transport is set up this turn, and can still shoot and charge.")],
    transport: 20,
  }),
  u("nids-spore-mines", "Spore Mines", "infantry", 55, { m: 4, t: 1, sv: 7, w: 1, ld: 8, oc: 0 }, ["Beast", "Fly", "Tyranids"], {
    sizes: [[3, 55]],
    m: [],
    ab: [
      deepStrike,
      a("Living Bomb", "If an enemy unit ends a move within 3\", or if this unit is destroyed, roll one D6 per model: each 2+ inflicts 1 mortal wound on the closest enemy (each 6 inflicts D3). Then this unit is destroyed."),
    ],
  }),
  u("nids-mucolids", "Mucolid Spores", "infantry", 30, { m: 4, t: 4, sv: 7, w: 3, ld: 8, oc: 0 }, ["Beast", "Fly", "Tyranids"], {
    sizes: [
      [1, 30],
      [2, 60],
    ],
    m: [],
    ab: [
      deepStrike,
      a("Living Bomb", "If an enemy unit ends a move within 6\", or if this unit is destroyed, roll 3D6: each 2+ inflicts 1 mortal wound on the closest enemy (each 6 inflicts D3). Then this unit is destroyed."),
    ],
  }),
  u("nids-sporocyst", "Sporocyst", "monster", 145, { m: 0, t: 10, sv: 3, w: 12, ld: 8, oc: 0 }, KW_MON, {
    r: [w("Sporocyst bio-weapons", "ranged", 24, 5, 4, 5, 0, 1, [])],
    m: [w("Flensing whips", "melee", "Melee", 6, 4, 6, 0, 1, [])],
    ab: [a("Spore Node", "This model cannot move. In your Shooting phase it can spawn a Spore Mines unit wholly within 18\" and more than 8\" from enemy models.")],
  }),
  u("nids-barbed-hierodule", "Barbed Hierodule", "monster", 340, { m: 12, t: 10, sv: 2, w: 18, ld: 8, oc: 5 }, ["Monster", "Tyranids", "Frame"], {
    r: [w("Bio-cannon cluster", "ranged", 36, "2D6", 3, 8, -2, 2, ["Blast", "Twin-linked"])],
    m: [w("Massive scything talons", "melee", "Melee", 6, 3, 12, -2, "D6+1", [])],
    ab: [a("Titanic Bioform", "This model can move over terrain and other models as if they were not there.")],
  }),
  u("nids-scythed-hierodule", "Scythed Hierodule", "monster", 330, { m: 12, t: 12, sv: 2, w: 18, ld: 8, oc: 5 }, ["Monster", "Tyranids", "Frame"], {
    r: [w("Bio-acid spray", "ranged", 18, "2D6", 0, 8, -2, 2, ["Torrent", "Ignores Cover"])],
    m: [w("Massive scything talons", "melee", "Melee", 8, 3, 14, -3, "D6+2", [])],
    ab: [a("Titanic Bioform", "This model can move over terrain and other models as if they were not there.")],
  }),
  u("nids-dimachaeron", "Dimachaeron", "monster", 200, { m: 12, t: 10, sv: 3, w: 16, ld: 7, oc: 5 }, ["Monster", "Tyranids", "Frame"], {
    inv: 5,
    m: [
      w("Grasping talons", "melee", "Melee", 6, 2, 8, -2, 3, []),
      w("Sickle claws", "melee", "Melee", 4, 2, 12, -3, "D6+1", ["Extra Attacks"]),
    ],
    ab: [a("Alpha Predator", "This model can Advance and charge. Re-roll Charge rolls for this model.")],
  }),
  u("nids-harridan", "Harridan", "monster", 580, { m: "20+", t: 12, sv: 3, w: 20, ld: 8, oc: 0 }, ["Monster", "Fly", "Aircraft", "Titanic", "Tyranids"], {
    r: [
      w("Bio-cannon cluster", "ranged", 48, "2D6", 3, 9, -2, 3, ["Blast"]),
      w("Heavy venom cannon", "ranged", 36, "D3", 3, 9, -2, 3, ["Blast"]),
    ],
    m: [w("Scything wings", "melee", "Melee", 6, 4, 8, -1, 2, [])],
    ab: [a("Sky-hive", "This model can transport Gargoyles: Gargoyles units can start the battle embarked and disembark after this model moves.")],
    transport: 20,
  }),
  u("nids-hierophant", "Hierophant Bio-titan", "monster", 810, { m: 12, t: 14, sv: 2, w: 30, ld: 7, oc: 8 }, ["Monster", "Titanic", "Towering", "Synapse", "Tyranids"], {
    inv: 5,
    r: [
      w("Bio-cannon cluster", "ranged", 48, "3D6", 3, 10, -3, 3, ["Blast"]),
      w("Dire bio-cannon", "ranged", 72, 2, 3, 16, -4, "D6+6", ["Heavy"]),
    ],
    m: [w("Lashwhip pods", "melee", "Melee", 12, 3, 10, -2, 3, [])],
    ab: [a("Bio-titan", "This model has a 5+ invulnerable save. Subtract 1 from the Damage of attacks allocated to it. It can move over terrain and other models.")],
  }),
];

const detachments: Detachment[] = detPack("nids", [
  {
    id: "invasion-fleet",
    name: "Invasion Fleet",
    dp: 3,
    disposition: "Take and Hold",
    tag: "invasion-fleet",
    rule: a("Hyper-adaptations", "At the start of the battle, choose one: Swarming (Lethal Hits against Infantry), Synaptic (Cover within 6\" of Synapse), or Apex (+1 AP in melee against Monsters and Vehicles)."),
    strats: [
      { id: "nids-if-adrenals", name: "Adrenal Surge", cp: 1, when: "Fight phase", text: "A unit that charged this turn has +1 to Wound with melee until the end of the phase." },
      { id: "nids-if-endless", name: "Endless Swarm", cp: 1, when: "Your command", text: "A Battleline Endless Multitude unit returns D6 destroyed models." },
    ],
    enh: [
      { id: "nids-if-adaptive", name: "Adaptive Biology", points: 25, text: "Bearer has a 5+ Feel No Pain. The first time it is destroyed, on a 2+ set it back up unengaged with 3 wounds." },
      { id: "nids-if-synapse", name: "Synaptic Linchpin", points: 20, text: "Add 3\" to the bearer's Synapse range. Friendly units in that range have OC +1." },
    ],
  },
  {
    id: "subterranean",
    name: "Subterranean Assault",
    dp: 3,
    disposition: "Disruption",
    tag: "subterranean",
    rule: a("Surprise Assault", "Burrower units can Ingress more than 8\" from enemy models. Each time a Tyranids model from this army makes an attack, re-roll a Hit roll of 1 if it was set up this turn."),
    strats: [
      { id: "nids-sa-tunnel", name: "Tunnel Network", cp: 1, when: "Your movement", text: "A Burrower unit that arrived this turn places a Tunnel marker. One friendly unit in Strategic Reserves can Ingress onto it more than 8\" from enemies." },
      { id: "nids-sa-enfilade", name: "Enfilading Emergence", cp: 1, when: "Your shooting", text: "A unit set up this turn has Lethal Hits and Ignores Cover until the end of the phase." },
    ],
    enh: [
      { id: "nids-sa-trygon", name: "Trygon Prime", points: 20, text: "Trygon or Mawloc only. The bearer has Synapse. Friendly units that Ingress onto its Tunnel marker can charge this turn." },
    ],
  },
  {
    id: "crusher",
    name: "Crusher Stampede",
    dp: 2,
    disposition: "Purge the Foe",
    tag: "crusher",
    rule: a("Enraged Behemoths", "Monster units from this army are +1 to Hit and +1 to Wound while they are Below Starting Strength (and +1 Attack as well while Below Half-strength)."),
    strats: [
      { id: "nids-cs-impact", name: "Massive Impact", cp: 1, when: "Your charge", text: "After a Monster ends a Charge, roll 6 D6: each 4+ inflicts 1 mortal wound on one engaged enemy." },
      { id: "nids-cs-roar", name: "Savage Roar", cp: 1, when: "Fight phase", text: "A Monster unit that charged this turn has Lance until the end of the phase." },
    ],
    enh: [
      { id: "nids-cs-nemesis", name: "Monstrous Nemesis", points: 25, text: "Monster Character only. The bearer's melee weapons have +1 Strength and +1 Damage." },
    ],
  },
  {
    id: "assimilation",
    name: "Assimilation Swarm",
    dp: 2,
    disposition: "Take and Hold",
    tag: "assimilation",
    rule: a("Feed the Swarm", "Harvester units regain D3 lost wounds in your Command phase. When a Harvester destroys an enemy unit, one friendly unit within 6\" returns D3 destroyed models or regains D3 wounds."),
    strats: [
      { id: "nids-as-reclaim", name: "Reclaim Biomass", cp: 1, when: "Your command", text: "A Harvester unit wholly within 6\" of an objective you control regains D3+3 lost wounds, or you return one destroyed model to it." },
      { id: "nids-as-hunger", name: "Rapacious Hunger", cp: 1, when: "Fight phase", text: "A Harvester unit has Sustained Hits 1 and +1 to Wound until the end of the phase." },
    ],
    enh: [
      { id: "nids-as-regen", name: "Regenerating Monstrosity", points: 20, text: "The bearer has a 5+ Feel No Pain. It regains 1 lost wound at the start of each player's Command phase." },
      { id: "nids-as-flow", name: "Biophagic Flow", points: 10, text: "Aura. Harvester units within 6\" of the bearer have OC +1 and can shoot after Advancing." },
    ],
  },
  {
    id: "synaptic-nexus",
    name: "Synaptic Nexus",
    dp: 2,
    disposition: "Priority Assets",
    tag: "synaptic",
    rule: a("Synaptic Imperatives", "At the start of your Command phase, select one until your next Command phase: Synapse Range is 9\", or Synapse units have a 5+ invulnerable save, or friendly units within Synapse Range have OC +1."),
    strats: [
      { id: "nids-sn-node", name: "Reinforced Hive Node", cp: 1, when: "Opponent shooting or Fight", text: "A Synapse unit has a 4+ invulnerable save against the next volley of attacks allocated to it." },
      { id: "nids-sn-will", name: "Irresistible Will", cp: 1, when: "Your shooting or Fight", text: "A unit within Synapse Range re-rolls Hit rolls of 1 and Wound rolls of 1 until the end of the phase." },
    ],
    enh: [
      { id: "nids-sn-control", name: "Synaptic Control", points: 20, text: "The bearer has a 12\" Synapse Range. Friendly units in that range can ignore Battle-shock." },
    ],
  },
  {
    id: "vanguard-onslaught",
    name: "Vanguard Onslaught",
    dp: 2,
    disposition: "Reconnaissance",
    tag: "vanguard-onslaught",
    rule: a("Vanguard Organisms", "Vanguard Invader units can charge after Advancing and add 1 to Charge rolls. Infantry Vanguard Invaders can deploy more than 9\" from enemy models."),
    strats: [
      { id: "nids-vo-strike", name: "Unseen Lurkers", cp: 1, when: "Your movement", text: "A Vanguard Invader more than 12\" from all enemies can make a 6\" Normal move but cannot charge this turn." },
      { id: "nids-vo-pounce", name: "Surprise Assault", cp: 1, when: "Your charge", text: "A unit set up this turn re-rolls Charge. If the charge succeeds, its melee has Lethal Hits this turn." },
      { id: "nids-vo-withdraw", name: "Vanish into the Swarm", cp: 1, when: "End of opponent's Fight phase", text: "Place one unengaged Vanguard Invader into Strategic Reserves." },
    ],
    enh: [
      { id: "nids-vo-chameleonic", name: "Chameleonic Mutation", points: 15, text: "Bearer's unit has Stealth and Lone Operative while more than 9\" from all enemies." },
      { id: "nids-vo-adrenal", name: "Adrenal Override", points: 10, text: "Add 2\" Move. The bearer's unit can shoot and charge after Advancing." },
    ],
  },
  {
    id: "unending",
    name: "Unending Swarm",
    dp: 2,
    disposition: "Take and Hold",
    tag: "unending",
    rule: a("Insurmountable Odds", "Endless Multitude units can Surge D6\" toward the closest enemy after they are shot. When one is destroyed, on a 4+ add a 10-model copy to Strategic Reserves."),
    strats: [
      { id: "nids-us-tide", name: "Bounding Tide", cp: 1, when: "Your movement", text: "An Endless Multitude unit can Advance and still charge. Add 2\" to that Advance." },
      { id: "nids-us-bodies", name: "A Sea of Bodies", cp: 1, when: "Opponent shooting", text: "An Endless Multitude unit has a 5+ Feel No Pain until the end of the phase." },
    ],
    enh: [{ id: "nids-us-progenitor", name: "Brood Progenitor", points: 15, text: "Endless Multitude units within 9\" of the bearer have OC +1 and can shoot after Advancing." }],
  },
  {
    id: "ambush",
    name: "Ambush Predators",
    dp: 1,
    disposition: "Disruption",
    tag: "ambush",
    rule: a("Mindhunger", "Lictor, Neurolictor, and Deathleaper units can Ingress more than 8\" from enemy models. Their attacks that target a Character re-roll Hit rolls of 1."),
    strats: [
      { id: "nids-ap-counter", name: "Counterpredation", cp: 1, when: "Fight phase", text: "A Lictor, Neurolictor, Deathleaper, or Leapers unit fighting a Hidden unit has +1 Strength and +1 AP." },
      { id: "nids-ap-ghost", name: "Scanner Gheist", cp: 1, when: "End of opponent's Fight phase", text: "Place one unengaged Lictor, Neurolictor, Deathleaper, or Leapers unit into Strategic Reserves." },
    ],
    enh: [{ id: "nids-ap-encircle", name: "Encircling Horrors", points: 20, upgrade: true, text: "Neurolictor, Lictor, or Leapers only. When an enemy ends a move within 8\", this unit can make a D3+3\" Normal move." }],
  },
  {
    id: "norn-talons",
    name: "Talons of the Norn Queen",
    dp: 1,
    disposition: "Priority Assets",
    tag: "norn",
    rule: a("Higher Imperatives", "Norn Emissary and Norn Assimilator units have a 4+ invulnerable save. Once per battle round, one of those units can be targeted with a Stratagem for 0 CP."),
    strats: [
      { id: "nids-nt-lesser", name: "Lesser Prey", cp: 1, when: "Your shooting or Fight", text: "A Norn unit's attacks have Lethal Hits against non-Monster, non-Vehicle targets until the end of the phase." },
      { id: "nids-nt-catalytic", name: "Catalytic Biofortification", cp: 1, when: "Opponent shooting or Fight", text: "A Norn unit has Feel No Pain 5+ until the end of the phase." },
    ],
    enh: [{ id: "nids-nt-synapto", name: "Synaptoprescience", points: 30, upgrade: true, text: "Norn only. The bearer has a 4+ invulnerable save and can re-roll one Hit, Wound, or Save each phase." }],
  },
  {
    id: "warrior-bioform",
    name: "Warrior Bioform Onslaught",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "warriors",
    rule: a("Synapse Brood", "Tyranid Warriors and Tyranid Prime units have OC +1 and a 6+ Feel No Pain. While a Prime leads a Warrior unit, that unit's weapons have Lethal Hits."),
    strats: [
      { id: "nids-wb-phys", name: "Alien Physiology", cp: 1, when: "Opponent shooting or Fight", text: "A Warrior or Prime unit has a 5+ Feel No Pain until the end of the phase." },
      { id: "nids-wb-payload", name: "Parasitic Payload", cp: 1, when: "Your shooting", text: "Ranged weapons in a Warrior unit have Anti-Infantry 4+ and Ignores Cover until the end of the phase." },
    ],
    enh: [{ id: "nids-wb-might", name: "Elevated Might", points: 30, text: "Tyranid Prime only. Add 1 to the Attacks, Strength, and Damage of the bearer's melee weapons." }],
  },
]);

export const tyranids: Faction = {
  id: "nids",
  name: "Tyranids",
  short: "Hive Mind",
  allegiance: "Xenos",
  accent: "#6b3d7a",
  rule: a(
    "Synapse / Shadow in the Warp",
    "Friendly Tyranid units within 6\" of a Synapse model take Battle-shock tests on 3D6, discarding the highest, and add 1 to melee Strength. Once per battle, in your Command phase, every enemy unit takes a Battle-shock test (−1 if within 6\" of Synapse).",
  ),
  detachments,
  units,
  updatedAt: "2026-09-20",
};
