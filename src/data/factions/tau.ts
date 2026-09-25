import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { w } from "../weapons";

const pulsePistol = w("Pulse pistol", "ranged", 12, 1, 4, 5, 0, 1, ["Pistol"]);
const battlesuitFists = w("Battlesuit fists", "melee", "Melee", 3, 4, 5, 0, 1, []);
const armouredHull = w("Armoured hull", "melee", "Melee", 3, 5, 6, 0, 1, []);
const cc = w("Close combat weapon", "melee", "Melee", 1, 5, 3, 0, 1, []);
const seeker = w("Seeker missile", "ranged", 48, 1, 4, 14, -3, "D6+1", ["One Shot"]);
const sms = w("Smart missile system", "ranged", 30, 3, 4, 5, 0, 1, ["Indirect Fire"]);
const KW_SUIT = ["Vehicle", "Walker", "Fly", "Battlesuit", "T'au"];

const units: UnitDef[] = [
  u("tau-farsight", "Commander Farsight", "character", 70, { m: 10, t: 5, sv: 2, w: 8, ld: 6, oc: 2 }, ["Vehicle", "Walker", "Fly", "Character", "Epic Hero", "Battlesuit", "T'au"], {
    inv: 4,
    r: [w("High-intensity plasma rifle", "ranged", 24, 2, 2, 8, -3, 3, [])],
    m: [
      w("Dawn Blade — strike", "melee", "Melee", 4, 2, 10, -2, 3, []),
      w("Dawn Blade — sweep", "melee", "Melee", 8, 2, 6, -1, 1, []),
    ],
    ab: [
      a("Way of the Short Blade", "While this model is leading a unit, each time a model in that unit makes an attack that targets an enemy unit within 9\", add 1 to the Wound roll."),
      a("Puretide's Teachings", "Once per battle round, you can reduce the CP cost of a Stratagem that targets this model's unit by 1CP."),
    ],
    lead: ["tau-crisis-fireknife"],
  }),
  u("tau-coldstar", "Commander in Coldstar Battlesuit", "character", 95, { m: 12, t: 5, sv: 3, w: 6, ld: 7, oc: 2 }, ["Vehicle", "Walker", "Fly", "Character", "Battlesuit", "T'au"], {
    r: [
      w("High-output burst cannon", "ranged", 18, 8, 3, 5, 0, 1, []),
      w("Missile pod", "ranged", 30, 2, 3, 7, -1, 2, []),
      w("Plasma rifle", "ranged", 18, 1, 3, 8, -3, 3, []),
      w("Fusion blaster", "ranged", 12, 1, 3, 9, -4, "D6", ["Melta 2"]),
      w("Cyclic ion blaster — standard", "ranged", 18, 3, 3, 7, -1, 1, []),
      w("Cyclic ion blaster — overcharge", "ranged", 18, 3, 3, 8, -2, 2, ["Hazardous"]),
      w("Burst cannon", "ranged", 18, 4, 3, 5, 0, 1, []),
    ],
    m: [battlesuitFists],
    ab: [
      a("Coldstar Commander", "While this model is leading a unit, models in that unit have a Move characteristic of 12\" and ranged weapons in that unit have Assault."),
      a("Battlesuit Support System", "If equipped, the bearer is eligible to shoot in a turn in which it Fell Back."),
      a("Shield Generator", "If equipped, the bearer has a 4+ invulnerable save."),
    ],
    lead: ["tau-crisis-fireknife"],
  }),
  u("tau-shadowsun", "Commander Shadowsun", "character", 100, { m: 10, t: 4, sv: 3, w: 6, ld: 6, oc: 1 }, ["Infantry", "Fly", "Character", "Epic Hero", "Battlesuit", "T'au"], {
    inv: 5,
    r: [
      w("Flechette launcher", "ranged", 18, 5, 2, 3, 0, 1, []),
      w("High-energy fusion blaster", "ranged", 18, 1, 2, 10, -4, "D6", ["Melta 2"]),
      w("Light missile pod", "ranged", 24, 2, 2, 7, 0, 2, []),
      w("Pulse pistol", "ranged", 12, 1, 3, 5, 0, 1, ["Pistol"]),
    ],
    m: [w("Battlesuit fists", "melee", "Melee", 3, 4, 5, 0, 1, [])],
    ab: [
      a("Agile Combatant", "This model is eligible to shoot in a turn in which it Fell Back."),
      a("Hero of the Empire", "While a friendly T'au Empire unit is within 6\" of this model, each time a model in that unit makes a ranged attack, re-roll a Hit roll of 1."),
      a("Advanced Guardian Drone", "Each time a ranged attack targets this model, subtract 1 from the Wound roll."),
      a("Command-link Drone", "While a friendly T'au Empire unit is within 6\" of this model, each time you target that unit with a Stratagem, roll one D6: on a 5+, you gain 1CP."),
    ],
  }),
  u("tau-breachers", "Breacher Team", "battleline", 90, { m: 6, t: 3, sv: 4, w: 1, ld: 7, oc: 2 }, ["Infantry", "Battleline", "Grenades", "Markerlight", "T'au"], {
    sizes: [[10, 90]],
    r: [
      w("Pulse blaster", "ranged", 10, 2, 3, 6, -1, 1, ["Assault"]),
      pulsePistol,
      w("Support turret", "ranged", 30, 2, 5, 5, 0, 1, ["Indirect Fire", "Twin-linked"]),
    ],
    m: [cc],
    ab: [
      a("Breach and Clear", "Each time a model in this unit makes a ranged attack that targets an enemy unit within range of an objective marker, you can re-roll the Wound roll."),
      a("DS8 Support Turret", "In your Movement phase, if this unit Remained Stationary, until the start of your next Movement phase its Fire Warrior Shas'ui is equipped with the support turret."),
    ],
  }),
  u("tau-strike-team", "Strike Team", "battleline", 70, { m: 6, t: 3, sv: 4, w: 1, ld: 7, oc: 2 }, ["Infantry", "Battleline", "Grenades", "Markerlight", "T'au"], {
    sizes: [[10, 70]],
    r: [
      w("Pulse rifle", "ranged", 30, 1, 4, 5, 0, 1, ["Rapid Fire 1"]),
      w("Pulse carbine", "ranged", 20, 2, 4, 5, 0, 1, []),
      pulsePistol,
      w("Support turret", "ranged", 30, 2, 5, 5, 0, 1, ["Indirect Fire", "Twin-linked"]),
    ],
    m: [cc],
    ab: [
      a("Suppression Volley", "After this unit has shot, select one enemy Infantry unit hit by those attacks. Until the start of your next turn, while this unit is on the battlefield, subtract 1 from Hit rolls for that enemy unit."),
      a("DS8 Support Turret", "In your Movement phase, if this unit Remained Stationary, until the start of your next Movement phase its Fire Warrior Shas'ui is equipped with the support turret."),
    ],
  }),
  u("tau-stealth", "Stealth Battlesuits", "infantry", 100, { m: 8, t: 4, sv: 3, w: 2, ld: 7, oc: 1 }, ["Infantry", "Fly", "Battlesuit", "Grenades", "Markerlight", "T'au"], {
    sizes: [[5, 100]],
    r: [
      w("Burst cannon", "ranged", 18, 4, 4, 5, 0, 1, []),
      w("Fusion blaster", "ranged", 12, 1, 4, 9, -4, "D6", ["Melta 2"]),
      w("Pulse pistol", "ranged", 12, 1, 4, 5, 0, 1, ["Pistol"]),
    ],
    m: [w("Battlesuit fists", "melee", "Melee", 2, 5, 4, 0, 1, [])],
    ab: [
      a("Forward Observers", "Each time this unit is an Observer unit, until the end of the phase each time a model in a Guided unit makes a ranged attack that targets their Spotted unit, re-roll a Hit roll of 1 and re-roll a Wound roll of 1."),
      a("Homing Beacon", "Once per battle, you can use the Rapid Ingress Stratagem for 0CP. The target must be set up within 3\" of this unit and more than 8\" from all enemy units."),
    ],
  }),
  u("tau-crisis-fireknife", "Crisis Fireknife Battlesuits", "vehicle", 100, { m: 10, t: 5, sv: 3, w: 4, ld: 7, oc: 2 }, [...KW_SUIT, "Crisis"], {
    sizes: [[3, 100]],
    r: [w("Missile pod", "ranged", 30, 2, 4, 7, -1, 2, []), w("Plasma rifle", "ranged", 18, 1, 4, 8, -3, 3, [])],
    m: [battlesuitFists],
    ab: [
      a("Fireknife", "Each time a model in this unit makes a ranged attack, re-roll a Hit roll of 1. If that attack targets a unit at its Starting Strength, you can re-roll the Hit roll instead."),
      a("Weapon Support System", "Each time a model in this unit makes a ranged attack, you can ignore any or all modifiers to that Hit roll."),
    ],
  }),
  u("tau-broadside", "Broadside Battlesuits", "vehicle", 75, { m: 5, t: 6, sv: 2, w: 8, ld: 7, oc: 2 }, ["Vehicle", "Walker", "Battlesuit", "T'au"], {
    sizes: [[1, 75], [2, 150], [3, 255]],
    r: [
      w("Heavy rail rifle", "ranged", 60, 2, 4, 12, -4, "D6+1", ["Heavy", "Devastating Wounds"]),
      w("High-yield missile pods", "ranged", 30, 6, 4, 7, -1, 2, ["Twin-linked"]),
      sms,
      seeker,
    ],
    m: [w("Crushing bulk", "melee", "Melee", 3, 5, 6, 0, 1, [])],
    ab: [
      a("Advanced Armour", "Models in this unit have Feel No Pain 4+ against mortal wounds."),
      a("Weapon Support System", "Each time the bearer makes a ranged attack, you can ignore any or all modifiers to the Hit roll."),
    ],
  }),
  u("tau-riptide", "Riptide Battlesuit", "vehicle", 190, { m: 10, t: 9, sv: 2, w: 14, ld: 7, oc: 4 }, KW_SUIT, {
    inv: 4,
    r: [
      w("Heavy burst cannon", "ranged", 36, 12, 4, 6, -1, 2, []),
      w("Ion accelerator — standard", "ranged", 72, 6, 4, 9, -2, 3, []),
      w("Ion accelerator — supercharge", "ranged", 72, 6, 4, 10, -3, 4, ["Hazardous"]),
      w("Twin smart missile system", "ranged", 30, 3, 4, 5, 0, 1, ["Indirect Fire", "Twin-linked"]),
      w("Twin fusion blaster", "ranged", 12, 1, 4, 9, -4, "D6", ["Melta 2", "Twin-linked"]),
    ],
    m: [w("Riptide fists", "melee", "Melee", 6, 5, 6, 0, 2, [])],
    ab: [
      a("Nova Charge", "Once per battle, when this unit is selected to shoot, select one ranged weapon it is equipped with. Until the end of the phase, that weapon has Devastating Wounds."),
      a("Damaged", "While this model has 1–4 wounds remaining, subtract 1 from its Hit rolls."),
    ],
  }),
  u("tau-hammerhead", "Hammerhead Gunship", "vehicle", 150, { m: 10, t: 10, sv: 3, w: 14, ld: 7, oc: 3 }, ["Vehicle", "Fly", "Frame", "T'au"], {
    r: [
      w("Railgun", "ranged", 72, 1, 4, 20, -5, "D6+6", ["Heavy", "Devastating Wounds"]),
      w("Ion cannon — standard", "ranged", 60, "D6+3", 4, 7, -1, 2, ["Blast"]),
      w("Ion cannon — overcharge", "ranged", 60, "D6+3", 4, 8, -2, 3, ["Blast", "Hazardous"]),
      w("Accelerator burst cannon", "ranged", 18, 4, 4, 6, -1, 1, []),
      seeker,
    ],
    m: [armouredHull],
    ab: [
      a("Armour Hunter", "Each time this model makes an attack that targets a Monster or Vehicle, add 1 to the Hit roll."),
      a("Targeting Array", "Each time this model is selected to shoot, you can re-roll one Hit roll or one Wound roll."),
      a("Damaged", "While this model has 1–5 wounds remaining, subtract 1 from its Hit rolls."),
    ],
  }),
  u("tau-devilfish", "Devilfish", "transport", 75, { m: 12, t: 9, sv: 3, w: 13, ld: 7, oc: 2 }, ["Vehicle", "Transport", "Dedicated Transport", "Fly", "Frame", "T'au"], {
    r: [
      w("Accelerator burst cannon", "ranged", 18, 4, 4, 6, -1, 1, []),
      seeker,
      w("Twin pulse carbine", "ranged", 20, 2, 4, 5, 0, 1, ["Assault", "Twin-linked"]),
      sms,
    ],
    m: [armouredHull],
    ab: [
      a("Rapid Deployment", "Units can disembark from this Transport after it has Advanced."),
    ],
    transport: 12,
  }),
];

const detachments: Detachment[] = detPack("tau", [
  {
    id: "montka",
    name: "Mont'ka",
    dp: 3,
    disposition: "Purge the Foe",
    tag: "montka",
    rule: a("Killing Blow", "During the first, second and third battle rounds, ranged weapons equipped by T'au Empire units from your army have Assault. Guided units also have Lethal Hits on their ranged weapons."),
    strats: [
      { id: "tau-mk-focus", name: "Focused Fire", cp: 1, when: "Your Shooting phase, rounds 1–3", text: "Two units from your army improve the Armour Penetration of their ranged weapons by 1 against one enemy unit. They must target that unit with all of their attacks." },
      { id: "tau-mk-pulse", name: "Pulse Onslaught", cp: 2, when: "Your Shooting phase", text: "After a non-Kroot Infantry unit shoots a unit that is not a Monster or Vehicle, until the end of the turn subtract 2 from that enemy unit's Move characteristic and from Advance and Charge rolls made for it." },
    ],
    enh: [
      { id: "tau-mk-exemplar", name: "Exemplar of the Mont'ka", points: 10, text: "The bearer's unit benefits from Killing Blow in the fourth battle round as well." },
      { id: "tau-mk-swift", name: "Strike Swiftly", points: 45, text: "In the Resolve Pre-battle Abilities step, up to two friendly T'au Empire units within 6\" of this model that do not have Scouts gain Scouts 6\"." },
    ],
  },
  {
    id: "kauyon",
    name: "Kauyon",
    dp: 2,
    disposition: "Priority Assets",
    tag: "kauyon",
    rule: a("Patient Hunter", "From the third battle round onwards, ranged weapons equipped by units from your army have Sustained Hits 1. While a unit is Guided, it can ignore modifiers to the Ballistic Skill characteristic and to the Hit roll."),
    strats: [
      { id: "tau-kau-photon", name: "Photon Grenades", cp: 1, when: "Just after an enemy unit is selected as a charge target", text: "That enemy unit must take a Battle-shock test and subtract 2 from the Charge roll." },
      { id: "tau-kau-coord", name: "Coordinate to Engage", cp: 1, when: "Your Shooting phase", text: "An Observer unit also benefits from For the Greater Good against the Spotted unit." },
    ],
    enh: [
      { id: "tau-kau-precision", name: "Precision of the Patient Hunter", points: 15, text: "Add 1 to Hit rolls for the bearer's ranged attacks. From the third battle round onwards, also add 1 to Wound rolls." },
      { id: "tau-kau-unity", name: "Through Unity, Devastation", points: 30, text: "While the bearer's unit is an Observer unit, ranged weapons of a Guided unit have Lethal Hits while targeting their Spotted unit." },
    ],
  },
  {
    id: "retaliation",
    name: "Retaliation Cadre",
    dp: 2,
    disposition: "Purge the Foe",
    tag: "retaliation",
    rule: a("Bonded Heroes", "Each time a Battlesuit model from your army makes a ranged attack that targets a unit within 12\", add 1 to the Strength of that attack. If the target is within 9\", improve the Armour Penetration of that attack by 1 as well."),
    strats: [
      { id: "tau-ret-blade", name: "The Shortened Blade", cp: 2, when: "Your Movement phase", text: "One Battlesuit unit can be set up from Reserves more than 6\" from all enemy units." },
      { id: "tau-ret-torch", name: "The Torchstar Gambit", cp: 1, when: "Your Shooting phase", text: "After a Fly Battlesuit unit has shot, if it is not within Engagement Range, it can make a Normal move." },
    ],
    enh: [{ id: "tau-ret-proto", name: "Prototype Weapon System", points: 15, text: "Battlesuit model only. Each time the bearer is selected to shoot, its ranged weapons have either Lethal Hits or Sustained Hits 1." }],
  },
  {
    id: "kroot",
    name: "Kroot Hunting Pack",
    dp: 2,
    disposition: "Take and Hold",
    tag: "kroot",
    rule: a("Hunter's Instincts", "Each time a Kroot model from your army makes an attack that targets a unit below its Starting Strength, add 1 to the Hit roll. If the target is Below Half-strength, add 1 to the Wound roll as well. Kroot models have a 6+ invulnerable save against melee attacks and a 5+ invulnerable save against ranged attacks."),
    strats: [],
    enh: [],
  },
  {
    id: "acquisition",
    name: "Advanced Acquisition Cadre",
    dp: 1,
    disposition: "Reconnaissance",
    tag: "acquisition",
    rule: a("Expert Fieldcraft", "Pathfinder and Stealth Battlesuit units from your army can shoot and still remain Hidden."),
    strats: [
      { id: "tau-acq-beacon", name: "Marker Beacon", cp: 1, when: "End of your Movement phase", text: "A Pathfinder or Stealth Battlesuit unit that controls an objective marker secures it." },
      { id: "tau-acq-camo", name: "Autoreactive Camouflage", cp: 1, when: "Opponent's Shooting phase", text: "A Hidden Pathfinder or Stealth Battlesuit unit has a +1 bonus to its Save characteristic until the end of the phase." },
    ],
    enh: [
      { id: "tau-acq-negation", name: "Negation Emitters", points: 15, text: "Stealth Battlesuits. Enemy Detection Range against the bearer's unit is reduced by 3\"." },
      { id: "tau-acq-unmask", name: "Unmasking Suite", points: 15, text: "When the bearer's unit shoots, pick one enemy unit within 24\". That volley uses a Detection Range 9\" longer against that unit." },
    ],
  },
  {
    id: "auxiliary",
    name: "Auxiliary Cadre",
    dp: 1,
    disposition: "Disruption",
    tag: "auxiliaries",
    rule: a("Integrated Command Structure", "In your Shooting phase, each Kroot or Vespid unit from your army can mark one visible enemy unit within 12\". Add 3\" to Detection Range against a marked unit. When a Ghostkeel or Stealth Battlesuit unit shoots an enemy unit within 6\" of a Kroot or Vespid unit, that Kroot or Vespid unit remains Hidden."),
    strats: [
      { id: "tau-aux-mods", name: "Experimental Modifications", cp: 1, when: "Your Shooting phase or the Fight phase", text: "Improve the Armour Penetration of attacks made by a Kroot or Vespid unit by 1." },
      { id: "tau-aux-guided", name: "Guided by Unity", cp: 1, when: "Your Shooting phase", text: "A unit that is not Kroot or Vespid has Lethal Hits when it shoots a target within 9\" of a Kroot or Vespid unit." },
    ],
    enh: [],
  },
  {
    id: "experimental",
    name: "Experimental Prototype Cadre",
    dp: 1,
    disposition: "Purge the Foe",
    tag: "retaliation",
    rule: a("Superior Craftsmanship", "Add 6\" to the Range characteristic of ranged weapons equipped by Battlesuit Character units from your army. This Detachment has the Retaliation tag and cannot be taken with another Retaliation detachment."),
    strats: [{ id: "tau-exp-ammo", name: "Experimental Ammunition", cp: 1, when: "Your Shooting phase", text: "A Battlesuit Character's ranged attacks have +1 Strength, or +1 Strength and +1 Armour Penetration and Hazardous." }],
    enh: [],
  },
]);

export const tauEmpire: Faction = {
  id: "tau",
  name: "T'au Empire",
  short: "T'au",
  allegiance: "Xenos",
  accent: "#c4a574",
  rule: a(
    "For the Greater Good",
    "At the start of your Shooting phase, select units with this ability to be Observer units. For each Observer unit that has not been selected to shoot, is eligible to shoot, and is not Battle-shocked, select one visible enemy unit to be its Spotted unit. Each enemy unit can be Spotted only once per phase. Other units with this ability are Guided while they target a Spotted unit. Until the end of the phase, improve the Ballistic Skill of a Guided unit's attacks against a Spotted unit by 1. If the Observer unit has the Markerlight keyword, those attacks also have Ignores Cover.",
  ),
  detachments,
  units,
  updatedAt: "2026-09-24",
};
