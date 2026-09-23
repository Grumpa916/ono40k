import type { Detachment, Faction, UnitDef } from "../types";
import { a, detPack, u } from "../helpers";
import { boltPistol, w } from "../weapons";
import { spaceMarines } from "./space-marines";

function remapId(id: string) {
  return id.replace(/^sm-/, "um-");
}

const extraLeaders: Record<string, string[]> = {
  "sm-captain": ["um-victrix", "um-wardens"],
  "sm-lieutenant": ["um-victrix", "um-wardens"],
  "sm-chaplain": ["um-victrix"],
  "sm-apothecary": ["um-victrix"],
};

const coreUnits: UnitDef[] = spaceMarines.units.map((unit) => {
  const leaderOf = [...(unit.leaderOf ?? []).map(remapId), ...(extraLeaders[unit.id] ?? [])];
  return {
    ...unit,
    id: remapId(unit.id),
    keywords: [...unit.keywords.filter((k) => k !== "Ultramarines"), "Ultramarines"],
    leaderOf: leaderOf.length ? leaderOf : undefined,
  };
});

const KW_UM_CHAR = ["Infantry", "Character", "Epic Hero", "Grenades", "Imperium", "Tacticus", "Ultramarines", "Adeptus Astartes"];
const KW_UM_INF = ["Infantry", "Grenades", "Imperium", "Tacticus", "Ultramarines", "Adeptus Astartes"];

const uniqueUnits: UnitDef[] = [
  u(
    "um-guilliman",
    "Roboute Guilliman",
    "character",
    415,
    { m: 8, t: 10, sv: 2, w: 16, ld: 5, oc: 4 },
    ["Monster", "Character", "Epic Hero", "Imperium", "Primarch", "Mobile", "Ultramarines", "Adeptus Astartes"],
    {
      inv: 4,
      fnp: 5,
      r: [w("Hand of Dominion", "ranged", 24, 4, 2, 8, -2, 2, ["Rapid Fire 2"])],
      m: [
        w("Emperor's Sword", "melee", "Melee", 10, 2, 10, -3, 2, ["Devastating Wounds", "Cleave 2"]),
        w("Hand of Dominion", "melee", "Melee", 6, 2, 14, -4, 4, ["Lethal Hits"]),
      ],
      ab: [
        a("Avenging Son", "This model always has the Devastator, Tactical, and Assault Combat Doctrines active. It can Advance, Fall Back, shoot, and charge in the same turn."),
        a("Author of the Codex", "Once per turn, in your Movement phase, select one friendly Adeptus Astartes unit within 6\". Until your next Command phase, one additional Combat Doctrine of your choice is active for that unit."),
        a("Primarch of the XIII", "Friendly Adeptus Astartes units within 6\" can re-roll Hit rolls of 1 and Wound rolls of 1."),
        a("Ultramarines Bodyguard", "While this model is within 3\" of a friendly Adeptus Astartes Infantry unit, it is Mobile and has Lone Operative."),
        a("Supreme Commander", "If this model is your Warlord and on the battlefield, you gain 1 CP at the start of your Command phase."),
      ],
    },
  ),
  u(
    "um-calgar",
    "Marneus Calgar",
    "character",
    180,
    { m: 5, t: 6, sv: 2, w: 7, ld: 5, oc: 2 },
    ["Infantry", "Character", "Epic Hero", "Terminator", "Chapter Master", "Imperium", "Ultramarines", "Adeptus Astartes"],
    {
      inv: 4,
      r: [w("Gauntlets of Ultramar", "ranged", 18, 4, 2, 4, -1, 2, ["Pistol", "Twin-linked"])],
      m: [w("Gauntlets of Ultramar", "melee", "Melee", 6, 2, 8, -3, 3, ["Twin-linked"])],
      ab: [
        a("Master Tactician", "At the start of your Command phase, if this model is your Warlord and on the battlefield, you gain 1 CP."),
        a("Inspiring Leader", "This model's unit always has the Devastator, Tactical, and Assault Combat Doctrines active. It is eligible to shoot and charge in a turn in which it Advanced or Fell Back."),
        a("Chapter Master", "Once per battle round you can target this model's unit with a Stratagem for 0 CP. Once per Movement phase, select one friendly Adeptus Astartes unit within 12\"; replace its active Doctrine with one of your choice until your next Command phase."),
        a("Orbital Insertion", "At the start of the battle, one friendly Gravis, Phobos, or Tacticus unit gains Deep Strike."),
        a("Deep Strike", "This unit can make an Ingress move from Reserves more than 8\" from enemy models."),
      ],
      lead: [
        "um-victrix",
        "um-wardens",
        "um-terminators",
        "um-intercessors",
        "um-assault-intercessors",
        "um-sternguard",
        "um-hellblasters",
        "um-aggressors",
        "um-heavy-intercessors",
        "um-bladeguard",
        "um-company-heroes",
      ],
    },
  ),
  u(
    "um-tigurius",
    "Chief Librarian Tigurius",
    "character",
    115,
    { m: 6, t: 5, sv: 3, w: 4, ld: 5, oc: 1 },
    ["Infantry", "Character", "Epic Hero", "Psyker", "Grenades", "Imperium", "Tacticus", "Ultramarines", "Adeptus Astartes"],
    {
      inv: 4,
      r: [boltPistol, w("Storm of the Emperor's Wrath", "ranged", 18, "D3+6", 2, 6, -2, 2, ["Blast", "Psychic"])],
      m: [w("Rod of Tigurius", "melee", "Melee", 5, 2, 7, -2, "D3", ["Psychic"])],
      ab: [
        a("Psyker Level 3", "Once per turn you can use one Level 1 psychic ability and one Level 2 psychic ability. On a 1 when you do, this unit is Battle-shocked."),
        a("Prescience", "Level 2 — Movement phase: until the start of your next turn, add 1 to this unit's Save characteristic."),
        a("Telepathic Assault", "Level 2 — Shooting phase: one visible enemy within 24\" suffers 2D3 mortal wounds."),
        a("Hood of Hellfire", "While leading a unit, models in that unit have Feel No Pain 4+ against Psychic attacks and mortal wounds."),
        a("Master of Prescience", "This unit has Stealth. Melee attacks that target it are −1 to Hit."),
      ],
      lead: ["um-intercessors", "um-assault-intercessors", "um-sternguard", "um-hellblasters", "um-company-heroes"],
    },
  ),
  u(
    "um-sicarius",
    "Cato Sicarius",
    "character",
    115,
    { m: 6, t: 5, sv: 2, w: 5, ld: 6, oc: 1 },
    [...KW_UM_CHAR.slice(0, 4), "Captain", ...KW_UM_CHAR.slice(4)],
    {
      inv: 4,
      r: [w("Artisan plasma pistol", "ranged", 12, 1, 2, 8, -3, 2, ["Pistol"])],
      m: [
        w("Talassarian Tempest Blade — strike", "melee", "Melee", 4, 2, 6, -3, 3, ["Devastating Wounds"]),
        w("Talassarian Tempest Blade — sweep", "melee", "Melee", 9, 2, 5, -2, 1, ["Sustained Hits 1"]),
        w("Talassarian Tempest Blade — coup de grâce", "melee", "Melee", 6, 2, 5, -2, 2, ["Precision"]),
      ],
      ab: [
        a("Knight Champion of Macragge", "In your opponent's Movement phase, if an enemy unit ends a move within 8\" of this unengaged unit, this unit can make a Normal move of up to 6\"."),
        a("Honour or Death", "You can target this unit with Heroic Intervention even if you have already used that Stratagem this phase, and that use is 1 CP less."),
        a("Support", "This model can be attached to a unit that already has a Leader. He can only lead Victrix Honour Guard."),
      ],
      lead: ["um-victrix"],
    },
  ),
  u("um-titus", "Captain Titus", "character", 90, { m: 6, t: 5, sv: 3, w: 5, ld: 6, oc: 1 }, [...KW_UM_CHAR.slice(0, 4), "Captain", ...KW_UM_CHAR.slice(4)], {
    inv: 4,
    fnp: 6,
    r: [w("Boltstorm gauntlets", "ranged", 12, 4, 2, 5, -1, 1, ["Pistol", "Twin-linked"])],
    m: [w("Power fists", "melee", "Melee", 5, 2, 8, -2, 2, ["Twin-linked"]), w("Chainsword", "melee", "Melee", 6, 2, 5, -1, 1, [])],
    ab: [
      a("Press the Attack", "While leading a unit, melee weapons in that unit have Sustained Hits 1 against non-Monster, non-Vehicle targets (against any target while Assault Doctrine is active for it)."),
      a("Righteous Fury", "Once per battle, until the end of the Fight phase add 1 to the Strength of this model's melee weapons. After it fights, it regains D3 lost wounds, or 2D3 if it destroyed one or more enemy models this phase."),
      a("Honour of Ultramar", "The first time a model in this unit is destroyed, roll one D6: on a 2+ that model can fight before being removed."),
    ],
    lead: ["um-intercessors", "um-assault-intercessors", "um-bladeguard", "um-sternguard", "um-company-heroes", "um-wardens"],
  }),
  u("um-kaius", "Kaius Konorius", "character", 100, { m: 6, t: 5, sv: 2, w: 5, ld: 6, oc: 1 }, KW_UM_CHAR, {
    inv: 4,
    r: [boltPistol],
    m: [
      w("Konorius warblade — strike", "melee", "Melee", 5, 2, 10, -3, 3, ["Precision"]),
      w("Konorius warblade — sweep", "melee", "Melee", 6, 2, 6, -3, 2, ["Cleave 2"]),
    ],
    ab: [
      a("Duelist of Macragge", "Each time this model makes a melee attack that targets a Character unit, you can re-roll the Hit roll and the Wound roll of 1."),
      a("Bodyguard", "Other Character models in this unit have Feel No Pain 4+."),
      a("Support", "This model can be attached to a unit that already has a Leader."),
    ],
    lead: ["um-victrix", "um-assault-intercessors", "um-bladeguard", "um-sternguard"],
  }),
  u("um-victrix", "Victrix Honour Guard", "infantry", 110, { m: 6, t: 5, sv: 2, w: 3, ld: 6, oc: 2 }, KW_UM_INF, {
    sizes: [[3, 110], [6, 220]],
    r: [w("Master-crafted bolt carbine", "ranged", 24, 2, 2, 5, -1, 2, [])],
    m: [
      w("Master-crafted power weapon", "melee", "Melee", 5, 2, 5, -2, 2, []),
      w("Blades of honour", "melee", "Melee", 6, 2, 5, -2, 2, ["Precision", "Twin-linked"]),
    ],
    ab: [
      a("Ultramarines Honour Guard", "Each time an attack targets this unit, subtract 1 from the Wound roll."),
      a("Banner of Macragge", "If equipped, this unit has Objective Secured. Once per battle at the start of the Fight phase add 1 to Strength and Attacks of melee weapons in this unit until the end of the phase."),
    ],
    wargear: [
      { id: "um-victrix-banner", name: "Chapter Ancient — Banner of Macragge", points: 15, group: "extra", text: "Objective Secured. Once-per-battle +1 Strength and Attacks in the Fight phase." },
      { id: "um-victrix-blades", name: "Chapter Champion — Blades of honour", points: 10, group: "extra", text: "One model replaces its bolt carbine with Blades of honour." },
    ],
  }),
  u("um-wardens", "Wardens of Ultramar", "infantry", 90, { m: 6, t: 5, sv: 3, w: 3, ld: 6, oc: 2 }, [
    "Infantry",
    "Epic Hero",
    "Grenades",
    "Imperium",
    "Tacticus",
    "Ultramarines",
    "Adeptus Astartes",
  ], {
    sizes: [[6, 90]],
    r: [
      w("Bolt rifle", "ranged", 24, 2, 3, 5, -1, 1, ["Assault", "Rapid Fire 1"]),
      w("Astropathic blast", "ranged", 18, "D6", 3, 5, -1, 1, ["Blast", "Psychic"]),
    ],
    m: [w("Close combat weapon", "melee", "Melee", 3, 3, 5, 0, 1, []), w("Force stave", "melee", "Melee", 4, 3, 6, -1, "D3", ["Psychic"])],
    ab: [
      a("Support", "This unit must be attached to a Character's unit. It cannot be selected as an independent unit in your army."),
      a("Strategium Command", "After both sides have deployed, you can redeploy up to three Adeptus Astartes units from your army (including this one)."),
      a("Raise the Banner", "At the end of your Movement phase, if Ancient Gadriel is in this unit and the unit is within range of an objective you do not control, you take control of it."),
    ],
  }),
];

const uniqueDets: Detachment[] = detPack("um", [
  {
    id: "blade",
    name: "Blade of Ultramar",
    dp: 3,
    disposition: "Priority Assets",
    tag: "blade",
    rule: a(
      "Mastered Doctrines",
      "At the start of your Command phase you can select one Combat Doctrine (Devastator: ranged weapons have Assault; Tactical: shoot and charge after Fall Back; Assault: charge after Advance). You can select each Doctrine once per battle, or twice if a friendly Marneus Calgar or Roboute Guilliman model is on the battlefield.",
    ),
    strats: [
      { id: "um-blade-foresight", name: "Tactical Foresight", cp: 1, when: "Opponent shooting or Fight", text: "Until the end of the phase, each time an attack targets one Adeptus Astartes unit, if the attack's Strength is greater than or equal to that unit's Toughness, subtract 1 from the Wound roll." },
      { id: "um-blade-honour", name: "Courage and Honour!", cp: 1, when: "Fight phase", text: "Melee weapons in one Adeptus Astartes unit have Lance. If Assault Doctrine is active for it, also improve those weapons' AP by 1." },
      { id: "um-blade-adapt", name: "Ultramarian Adaptivity", cp: 1, when: "Your command", text: "Select Devastator, Tactical, or Assault Doctrine. Until your next Command phase that Doctrine is active for one Adeptus Astartes unit instead of the army Doctrine, even if already selected this battle." },
      { id: "um-blade-vigil", name: "Exemplary Vigilance", cp: 1, when: "Your shooting", text: "Ranged weapons in one Adeptus Astartes unit have Ignores Cover. If Devastator Doctrine is active for it, also improve those weapons' AP by 1." },
      { id: "um-blade-practical", name: "Practical Tactics", cp: 1, when: "Opponent movement", text: "After an enemy unit ends a move, one unengaged Adeptus Astartes Infantry or Mounted unit within 8\" can make a Normal move of D6\" (6\" if Tactical Doctrine is active for it)." },
    ],
    enh: [
      { id: "um-blade-antoninus", name: "Armour of Antoninus", points: 15, text: "The bearer has a 2+ Save and Feel No Pain 5+." },
      { id: "um-blade-macragge", name: "Oath of Macragge", points: 20, text: "Add 1 to Attacks and Strength of the bearer's melee weapons (add 2 instead while Assault Doctrine is active for the bearer)." },
      { id: "um-blade-student", name: "Student of the Codex", points: 20, text: "Captain model only. The Tactical Doctrine is always active for the bearer's unit in addition to any other Doctrine." },
      { id: "um-blade-behemoth", name: "Veteran of Behemoth", points: 25, text: "While leading a unit, ranged weapons in that unit have Sustained Hits 1. Re-roll Advance rolls for that unit while Devastator Doctrine is active." },
    ],
  },
  {
    id: "reclamation",
    name: "Reclamation Force",
    dp: 2,
    disposition: "Take and Hold",
    tag: "reclamation",
    rule: a(
      "Oath of Reclamation",
      "Each time an Adeptus Astartes model makes a melee attack that targets a unit within range of an objective marker, improve the AP of that attack by 1. Each time an attack targets an Adeptus Astartes unit from your army that is on an objective you controlled at the start of the phase, if the attack's Strength is greater than that unit's Toughness, subtract 1 from the Wound roll.",
    ),
    strats: [
      { id: "um-rec-conquer", name: "Crusading Conquerors", cp: 1, when: "Your command", text: "Until the start of the next Command phase, add 1 to the OC of models in one Adeptus Astartes unit." },
      { id: "um-rec-ground", name: "Reclaim the Ground", cp: 1, when: "Your command", text: "One Ultramarines unit within range of an objective is eligible to shoot and charge in a turn in which it Advanced or Fell Back." },
    ],
    enh: [{ id: "um-rec-scroll", name: "Scroll of Proclamation", points: 15, text: "Add 2\" to the Move of the bearer's unit. Once per battle that unit can Advance and charge." }],
  },
]);

const coreDets: Detachment[] = spaceMarines.detachments.map((d) => ({
  ...d,
  id: remapId(d.id),
  stratagems: d.stratagems.map((s) => ({ ...s, id: remapId(s.id) })),
  enhancements: d.enhancements.map((e) => ({ ...e, id: remapId(e.id) })),
}));

export const ultramarines: Faction = {
  id: "um",
  name: "Ultramarines",
  short: "XIII Legion",
  allegiance: "Imperium",
  accent: "#0038a8",
  rule: a(
    "Combat Doctrines",
    "At the start of your Command phase, select one Combat Doctrine. Until your next Command phase it applies to all Adeptus Astartes units from your army. Devastator: ranged weapons have Assault. Tactical: eligible to shoot and charge after Falling Back. Assault: eligible to charge after Advancing. You can select each Doctrine once per battle (twice if a friendly Marneus Calgar or Roboute Guilliman model is on the battlefield). A unit can only have one Doctrine active unless a rule says otherwise.",
  ),
  detachments: [...uniqueDets, ...coreDets],
  units: [...uniqueUnits, ...coreUnits],
};
