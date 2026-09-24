import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { w } from "../weapons";

const pulsePistol = w("Pulse pistol", "ranged", 12, 1, 4, 5, 0, 1, ["Pistol"]);
const battlesuitFists = w("Battlesuit fists", "melee", "Melee", 3, 5, 5, 0, 1, []);
const armouredHull = w("Armoured hull", "melee", "Melee", 3, 5, 6, 0, 1, []);
const KW_SUIT = ["Vehicle", "Walker", "Fly", "Battlesuit", "T'au"];
const KW_INF = ["Infantry", "Battleline", "Grenades", "T'au"];
const cc = w("Close combat weapons", "melee", "Melee", 1, 5, 3, 0, 1, []);
const seeker = w("Seeker missile", "ranged", 48, 1, 4, 14, -3, "D6+1", ["One Shot"]);
const sms = w("Smart missile system", "ranged", 30, 3, 4, 5, 0, 1, ["Indirect Fire", "Twin-linked"]);

const units: UnitDef[] = [
  u("tau-coldstar", "Commander in Coldstar Battlesuit", "character", 95, { m: 12, t: 5, sv: 3, w: 7, ld: 7, oc: 2 }, ["Vehicle", "Walker", "Character", "Fly", "Battlesuit", "T'au"], {
    inv: 4,
    r: [
      w("High-output burst cannon", "ranged", 18, 8, 2, 6, -1, 1, ["Assault"]),
      w("Missile pod", "ranged", 30, 2, 2, 7, -1, 2, []),
      w("Fusion blaster", "ranged", 12, 1, 2, 9, -4, "D6", ["Melta 2"]),
    ],
    m: [battlesuitFists],
    ab: [
      a("Coldstar Array", "This model can Advance and still shoot. When it Advances, add 8\" instead of rolling."),
      a("Battlesuit Support", "Friendly Battlesuit units within 6\" of this model can re-roll Hit rolls of 1 with ranged attacks."),
    ],
  }),
  u("tau-shadowsun", "Commander Shadowsun", "character", 100, { m: 10, t: 4, sv: 3, w: 6, ld: 6, oc: 1 }, ["Infantry", "Character", "Epic Hero", "Fly", "Battlesuit", "Stealth", "T'au"], {
    inv: 5,
    r: [
      w("Flechette blasters", "ranged", 18, 6, 2, 3, 0, 1, ["Assault", "Pistol"]),
      w("High-energy fusion blaster", "ranged", 18, 1, 2, 9, -4, "D6+2", ["Melta 3"]),
    ],
    m: [w("Close combat weapons", "melee", "Melee", 4, 3, 3, 0, 1, [])],
    ab: [
      a("Advanced Stealth Field", "This model has Stealth and Lone Operative (not visible, and immune to Indirect Fire, beyond 12\"). It can be set up anywhere on the battlefield more than 9\" from enemy models."),
      a("Kauyon Master", "Once per battle, at the start of your Shooting phase, until the end of the phase friendly T'au units within 6\" have Sustained Hits 1 and can re-roll the Hit roll."),
      a("Command-link", "This model can be an Observer for For the Greater Good without forgoing its own shooting."),
    ],
  }),
  u("tau-breachers", "Breacher Team", "battleline", 90, { m: 6, t: 3, sv: 4, w: 1, ld: 7, oc: 2 }, KW_INF, {
    sizes: [[10, 90]],
    r: [w("Pulse blaster", "ranged", 10, 2, 3, 6, -1, 1, ["Assault"]), pulsePistol],
    m: [cc],
    ab: [
      a("Breach and Clear", "Each time this unit makes a ranged attack that targets a unit within range of an objective marker, add 1 to the Wound roll."),
      a("Bonded Crew", "This unit can perform Actions while within Engagement Range of enemy units."),
    ],
  }),
  u("tau-strike-team", "Strike Team", "battleline", 70, { m: 6, t: 3, sv: 4, w: 1, ld: 7, oc: 2 }, KW_INF, {
    sizes: [[10, 70]],
    r: [w("Pulse rifle", "ranged", 30, 1, 4, 5, 0, 1, ["Rapid Fire 1"]), pulsePistol],
    m: [cc],
    ab: [
      a("Steady Volley", "If this unit Remained Stationary this turn, pulse rifles in this unit have Heavy and Lethal Hits."),
      a("Fire Warrior Cadre", "If this unit is destroyed, any objective markers it controlled remain under your control until an enemy unit controls them."),
    ],
  }),
  u("tau-stealth", "Stealth Battlesuits", "infantry", 85, { m: 8, t: 4, sv: 3, w: 2, ld: 7, oc: 1 }, ["Infantry", "Fly", "Battlesuit", "Stealth", "T'au"], {
    sizes: [[3, 85], [6, 170]],
    r: [w("Burst cannon", "ranged", 18, 4, 4, 5, 0, 1, ["Assault"]), w("Fusion blaster", "ranged", 12, 1, 4, 8, -4, "D6", ["Melta 2"])],
    m: [battlesuitFists],
    ab: [
      a("Stealth Field", "Each time a ranged attack targets this unit, subtract 1 from the Hit roll. This is not cumulative with the Benefit of Cover. This unit can be set up anywhere on the battlefield more than 9\" from enemy models."),
      a("Homing Beacon", "Once per battle, in your Movement phase, one friendly Battlesuit unit arriving from Reserves can be set up more than 6\" from enemy models instead of 9\", provided it is set up within 6\" of this unit."),
    ],
  }),
  u("tau-crisis-fireknife", "Crisis Fireknife Battlesuits", "vehicle", 150, { m: 10, t: 5, sv: 3, w: 4, ld: 7, oc: 2 }, KW_SUIT, {
    sizes: [[3, 150], [6, 300]],
    r: [w("Missile pod", "ranged", 30, 2, 4, 7, -1, 2, ["Twin-linked"]), w("Plasma rifle", "ranged", 24, 1, 4, 8, -3, 3, [])],
    m: [battlesuitFists],
    ab: [
      a("Deep Strike", "This unit can make an Ingress move from Reserves more than 8\" from enemy models."),
      a("Fireknife Protocols", "Each time this unit shoots, if it is Guided, its plasma rifles have Lethal Hits and its missile pods have Sustained Hits 1."),
    ],
  }),
  u("tau-broadside", "Broadside Battlesuits", "vehicle", 90, { m: 5, t: 6, sv: 2, w: 8, ld: 7, oc: 2 }, ["Vehicle", "Walker", "Battlesuit", "T'au"], {
    sizes: [[1, 90], [2, 180], [3, 270]],
    r: [w("Heavy rail rifle", "ranged", 60, 2, 4, 12, -4, "D6+1", ["Heavy", "Devastating Wounds"]), sms, seeker],
    m: [w("Crushing bulk", "melee", "Melee", 3, 4, 6, 0, 1, [])],
    ab: [
      a("Stable Firing Platform", "Each time this unit Remains Stationary, you can re-roll Hit rolls and Wound rolls of 1 with its heavy rail rifles."),
      a("Advanced Targeting", "Ranged weapons in this unit have Heavy. Attacks with the heavy rail rifle that target a Monster or Vehicle have +1 to Wound."),
    ],
  }),
  u("tau-riptide", "Riptide Battlesuit", "vehicle", 190, { m: 10, t: 9, sv: 2, w: 14, ld: 7, oc: 4 }, KW_SUIT, {
    inv: 4,
    r: [
      w("Heavy burst cannon", "ranged", 36, 12, 4, 6, -1, 2, []),
      w("Ion accelerator — standard", "ranged", 72, "D6+1", 4, 7, -2, 3, ["Blast"]),
      w("Ion accelerator — overcharge", "ranged", 72, "D6+1", 4, 8, -3, 4, ["Blast", "Hazardous"]),
      sms,
    ],
    m: [w("Riptide fists", "melee", "Melee", 5, 4, 8, -1, 2, [])],
    ab: [
      a("Nova Reactor", "Once per battle round, at the start of your Shooting phase, this model can activate its Nova Reactor: until the end of the phase its heavy burst cannon has Sustained Hits 1 and it has a 4+ invulnerable save, then roll 2D6 — on a 2 it suffers 3 mortal wounds."),
      a("Battlesuit Shield Generator", "This model has a 4+ invulnerable save."),
    ],
  }),
  u("tau-hammerhead", "Hammerhead Gunship", "vehicle", 150, { m: 10, t: 10, sv: 3, w: 14, ld: 7, oc: 3 }, ["Vehicle", "Fly", "Smoke", "T'au"], {
    r: [w("Railgun", "ranged", 72, 1, 4, 20, -5, "D6+6", ["Heavy", "Devastating Wounds"]), w("Accelerator burst cannon", "ranged", 18, 4, 4, 6, -1, 1, []), seeker],
    m: [armouredHull],
    ab: [
      a("Targeting Array", "Each time this model makes an attack with its railgun, you can re-roll the Hit roll. If the target is a Monster or Vehicle, you can also re-roll the Wound roll."),
      a("Hover Tank", "This model can move over terrain and other models as if they were not there."),
    ],
  }),
  u("tau-devilfish", "Devilfish", "transport", 75, { m: 12, t: 9, sv: 3, w: 13, ld: 7, oc: 2 }, ["Vehicle", "Transport", "Dedicated Transport", "Fly", "Smoke", "T'au"], {
    r: [w("Accelerator burst cannon", "ranged", 18, 4, 4, 6, -1, 1, []), seeker, w("Twin pulse carbine", "ranged", 20, 2, 4, 5, 0, 1, ["Assault", "Twin-linked"])],
    m: [armouredHull],
    ab: [
      a("Assault Boat", "Units can disembark from this Transport after it has Advanced. Units that disembark this way can still shoot."),
      a("Hover Transport", "This model can move over terrain and other models as if they were not there."),
    ],
    transport: 12,
  }),
];

const detachments: Detachment[] = detPack("tau", [
  {
    id: "retaliation",
    name: "Retaliation Cadre",
    dp: 1,
    disposition: "Disruption",
    tag: "retaliation",
    rule: a("Close-range Cadre", "Battlesuit units in this army have +2\" to their Move characteristic. Each time a Battlesuit unit shoots at a target within 12\", add 1 to the Strength of those attacks."),
    strats: [{ id: "tau-ret-volley", name: "Point-Blank Volley", cp: 1, when: "Your shooting", text: "A Battlesuit unit's ranged weapons have Assault and Pistol until the end of the phase. If the target is within 9\", those weapons also have Lethal Hits." }],
    enh: [{ id: "tau-ret-stim", name: "Onager Gauntlet", points: 15, text: "The bearer has a melee weapon: Onager gauntlet, Melee, A4, WS3, S12, AP−3, D3. Its unit can charge after Advancing." }],
  },
  {
    id: "montka",
    name: "Mont'ka",
    dp: 2,
    disposition: "Purge the Foe",
    tag: "montka",
    rule: a("Killing Blow", "During the first three battle rounds, ranged weapons equipped by T'au units in this army have Assault and Lethal Hits, and T'au units can Advance and still shoot."),
    strats: [
      { id: "tau-mk-coord", name: "Coordinate to Fire", cp: 1, when: "Your shooting", text: "Select one enemy unit. Until the end of the phase, each time a T'au unit shoots at that target, it counts as Guided even if no Observer was selected." },
      { id: "tau-mk-strike", name: "Pulse Onslaught", cp: 2, when: "Your shooting", text: "A T'au unit that Advanced this turn can re-roll Hit rolls and Wound rolls of 1. Pulse weapons in that unit have Sustained Hits 1." },
    ],
    enh: [
      { id: "tau-mk-exemplar", name: "Exemplar of the Mont'ka", points: 20, text: "Once per battle, at the start of your Shooting phase, friendly T'au units within 9\" of the bearer have +1 to Hit until the end of the phase." },
      { id: "tau-mk-fusion", name: "Thermoneutronic Projector", points: 15, text: "The bearer's ranged weapons have the Melta 2 keyword (or improve existing Melta by 1) and Ignores Cover." },
    ],
  },
  {
    id: "kauyon",
    name: "Kauyon",
    dp: 3,
    disposition: "Take and Hold",
    tag: "kauyon",
    rule: a("Patient Hunter", "From the third battle round onwards, ranged weapons equipped by T'au units in this army have Sustained Hits 1 and you can re-roll Hit rolls of 1. T'au Infantry units have Stealth while they are within range of an objective marker you control."),
    strats: [
      { id: "tau-kau-ambush", name: "Patient Ambush", cp: 1, when: "Opponent movement", text: "When an enemy unit ends a move within 9\" of a T'au unit that is wholly within 3\" of a terrain feature, that T'au unit can shoot at it as if it were your Shooting phase (it still counts as Overwatch, but hits on 5+)." },
      { id: "tau-kau-hold", name: "Hold What You Have Taken", cp: 1, when: "Opponent shooting", text: "A T'au Infantry unit on an objective marker is −1 to be Hit and has a 5+ Feel No Pain until the end of the phase." },
      { id: "tau-kau-guide", name: "Focused Fire", cp: 1, when: "Your shooting", text: "A Guided unit's ranged weapons have Ignores Cover and Lethal Hits until the end of the phase." },
    ],
    enh: [
      { id: "tau-kau-puretide", name: "Puretide Engram Neurochip", points: 15, text: "Once per battle round, the bearer's unit can be the target of a Stratagem for 0 CP." },
      { id: "tau-kau-shield", name: "Shield Generator", points: 20, text: "The bearer has a 4+ invulnerable save. Models in the bearer's unit have a 5+ invulnerable save." },
      { id: "tau-kau-marker", name: "Precision of the Hunter", points: 10, text: "The bearer's unit can be an Observer without forgoing its own shooting. Ranged weapons in that unit have Precision." },
    ],
  },
]);

export const tauEmpire: Faction = {
  id: "tau",
  name: "T'au Empire",
  short: "T'au",
  allegiance: "Xenos",
  accent: "#c4a574",
  rule: a("For the Greater Good", "In your Shooting phase, T'au units can act as Observers or become Guided. Select one Observer unit that is eligible to shoot and one Guided unit. Until the end of the phase, the Guided unit's ranged weapons have +1 to Hit and Ignores Cover against a target visible to the Observer, but the Observer cannot shoot this phase. A unit can only be Guided once per phase."),
  detachments,
  units,
};
