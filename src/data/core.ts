import type { PhaseId, Stratagem } from "./types";

export type CoreRule = {
  id: string;
  name: string;
  group: "Terrain" | "Movement" | "Combat" | "Command" | "Army";
  text: string;
};

export const CORE_STRATAGEMS: Stratagem[] = [
  {
    id: "core-reroll",
    name: "Command Re-roll",
    cp: 1,
    when: "Any phase",
    text: "Re-roll one Advance, Charge, Damage, Hazard, Hit, Save, Wound, or attacks-generated roll you just made. Charge rolls are re-rolled in full. A unit can only be affected by one Stratagem per phase.",
  },
  {
    id: "core-insane",
    name: "Insane Bravery",
    cp: 1,
    when: "Your Command phase · once per battle",
    text: "Just before one of your units makes a Battle-shock test this phase, the test is passed automatically.",
  },
  {
    id: "core-overwatch",
    name: "Fire Overwatch",
    cp: 1,
    when: "End of opponent's Movement phase",
    text: "One friendly unengaged, non-Titanic unit uses Snap Shooting against one visible eligible enemy within 24\". Attacks hit only on unmodified 6s and Hit rolls cannot be re-rolled.",
  },
  {
    id: "core-ingress",
    name: "Rapid Ingress",
    cp: 1,
    when: "End of opponent's Movement phase",
    text: "One friendly non-Aircraft unit in Strategic Reserves makes an Ingress move (set up more than 8\" from enemy models). Cannot be used in battle round 1.",
  },
  {
    id: "core-explosives",
    name: "Explosives",
    cp: 1,
    when: "Your shooting phase",
    text: "One eligible, unengaged Explosives or Grenades unit that did not Advance selects a visible, unengaged enemy within 8\". Roll 6 D6; each 4+ inflicts 1 mortal wound.",
  },
  {
    id: "core-crushing",
    name: "Crushing Impact",
    cp: 1,
    when: "Your charge phase",
    text: "After a Monster or Vehicle ends a Charge move, pick an engaged enemy and one engaged model in your unit. Roll dice equal to that model's Toughness: each 1 inflicts 1 mortal wound on your unit; each 5+ inflicts 1 on the enemy, to a maximum of 6.",
  },
  {
    id: "core-heroic",
    name: "Heroic Intervention",
    cp: 1,
    when: "End of opponent's Charge phase",
    text: "Leap to Defend (1 CP): an unengaged unit within 12\" charges an enemy that charged this phase. Into the Fray (2 CP): charge any enemy within 6\"; the Charge roll is capped at 6. Vehicles must be Characters or Walkers.",
  },
  {
    id: "core-counter",
    name: "Counter-offensive",
    cp: 2,
    when: "Opponent's Fight phase",
    text: "Just after an enemy unit finishes its attacks, one of your units eligible to fight gains Fights First and must be your next unit selected to fight.",
  },
  {
    id: "core-smoke",
    name: "Smokescreen",
    cp: 1,
    when: "Start of opponent's Shooting phase",
    text: "One friendly Smoke unit, and any friendly units obscured by it, have the Benefit of Cover when targeted until the end of the phase. Cover is −1 to hit and does not stack with Stealth.",
  },
  {
    id: "core-epic",
    name: "Epic Challenge",
    cp: 1,
    when: "Fight phase",
    text: "Just after a friendly Character unit is selected to fight, one Character model in it gains Precision on its melee weapons until the end of the phase.",
  },
];

export function stratagemInPhase(when: string, phase: PhaseId, isActivePlayer: boolean): boolean {
  const w = when.toLowerCase();
  if (w.includes("any phase") || w.trim() === "any") return true;

  const wantsOpp = /\bopponent/.test(w);
  const wantsYou = /\byour\b/.test(w);
  const hasCommand = /command/.test(w);
  const hasMove = /movement/.test(w);
  const hasShoot = /shoot/.test(w);
  const hasCharge = /charge/.test(w);
  const hasFight = /fight/.test(w);
  const hasEndPhase = /\bend phase\b/.test(w) || /end of opponent turn/.test(w) || /end of (the )?turn/.test(w);

  if (wantsOpp && !wantsYou && isActivePlayer) return false;
  if (wantsYou && !wantsOpp && !isActivePlayer) return false;
  if (!wantsOpp && !wantsYou && !hasFight && !hasCharge && !isActivePlayer) return false;

  const phases: PhaseId[] = [];
  if (hasCommand) phases.push("command");
  if (hasMove) phases.push("movement");
  if (hasShoot) phases.push("shooting");
  if (hasCharge) phases.push("charge");
  if (hasFight) phases.push("fight");
  if (hasEndPhase) phases.push("end");
  if (phases.length === 0) return true;
  return phases.includes(phase);
}

export type StratPhaseKey = PhaseId | "any";

export function stratagemPrimaryPhase(when: string): StratPhaseKey {
  const w = when.toLowerCase();
  if (w.includes("any phase") || w.trim() === "any") return "any";
  if (/command/.test(w)) return "command";
  if (/movement/.test(w)) return "movement";
  if (/shoot/.test(w)) return "shooting";
  if (/charge/.test(w)) return "charge";
  if (/fight/.test(w)) return "fight";
  if (/\bend phase\b/.test(w) || /end of opponent turn/.test(w) || /end of (the )?turn/.test(w)) return "end";
  return "any";
}

export const CORE_RULES: CoreRule[] = [
  {
    id: "cover",
    name: "Benefit of Cover",
    group: "Terrain",
    text: "Ranged attacks against a unit with Cover are −1 Ballistic Skill (effectively −1 to hit). Infantry, Beasts, and Swarms get Cover while in a terrain area; other units get it when not fully visible. Cover does not stack with Stealth. Ignores Cover weapons skip the penalty.",
  },
  {
    id: "plunging",
    name: "Plunging Fire",
    group: "Terrain",
    text: "If a model is on a terrain feature more than 3\" tall and shoots a visible target at ground level, those attacks are +1 Ballistic Skill. This cancels Cover, or makes open-ground targets easier to hit.",
  },
  {
    id: "hidden",
    name: "Hidden",
    group: "Terrain",
    text: "An Infantry, Beast, or Swarm model in a terrain area with a light or dense feature is Hidden if its unit did not make a ranged attack this turn or last turn. Hidden models are not visible to enemies outside 15\" detection range.",
  },
  {
    id: "gtg",
    name: "Gone to Ground",
    group: "Terrain",
    text: "A Hidden model that is not fully visible because of intervening solid terrain has Gone to Ground: subtract 3\" from its detection range (typically 12\"). Units that shot this or last turn cannot Go to Ground.",
  },
  {
    id: "objectives",
    name: "Terrain objectives",
    group: "Terrain",
    text: "There are no 40mm objective circles. Missions score control of terrain areas — bunkers, shrines, wrecks — not markers.",
  },
  {
    id: "move",
    name: "Movement",
    group: "Movement",
    text: "Pivoting is free and does not cost movement. Models can move through friendly units. You may move through Engagement Range so long as you do not end the move inside it.",
  },
  {
    id: "coherency",
    name: "Coherency",
    group: "Movement",
    text: "Every model must be within 2\" of another model in the unit, and every model must be wholly within 9\" of all other models in the unit.",
  },
  {
    id: "ingress",
    name: "Ingress",
    group: "Movement",
    text: "Reserves arrive with an Ingress move, set up more than 8\" from enemy models (a 7\" charge into 2\" engagement). Rapid Ingress cannot be used in round 1.",
  },
  {
    id: "engage",
    name: "Engagement range",
    group: "Combat",
    text: "Engagement range is 2\" horizontally. Charge: roll 2D6 first, then pick a target you can actually reach. End in engagement, and in base contact if possible.",
  },
  {
    id: "fight",
    name: "Fight sequence",
    group: "Combat",
    text: "Pile in with the whole army at the start of the Fight phase (active player first). Fights First units — including chargers — activate before anyone else; on your turn you pick first, even against an opponent's Fights First. After the last Fights First unit, the opponent picks the first remaining unit. Consolidate the whole army at the end. Overrun: if your charge target is destroyed before you fight, you may pile in +3\" to reach a new enemy.",
  },
  {
    id: "disembark",
    name: "Combat Disembarkation",
    group: "Combat",
    text: "If a Transport is engaged, models on board can disembark directly into combat with that enemy.",
  },
  {
    id: "shock",
    name: "Battle-shock",
    group: "Command",
    text: "A failed Battle-shock test is sticky — the unit stays Battle-shocked until it passes a test in its Command phase, even if it is above half-strength. Battle-shocked units have OC 0 and cannot be affected by Stratagems.",
  },
  {
    id: "strats",
    name: "Stratagem stacking",
    group: "Command",
    text: "Each Stratagem can be used once per phase. You may play several Stratagems in the same phase, typically on different units. A unit can only be affected by one Stratagem per phase — Command Re-roll does not stack with another buff on the same unit.",
  },
  {
    id: "leaders",
    name: "Leaders",
    group: "Army",
    text: "A Leader's abilities remain active even after its Bodyguard unit is destroyed. Infiltrate and Scout cannot both be used on the same unit in the same battle.",
  },
  {
    id: "saves",
    name: "Save allocation",
    group: "Army",
    text: "Before rolling saves, the defender groups models. Roll all saves together; failed saves are applied starting with the lowest rolls against the chosen groups.",
  },
];

export const PHASE_TIPS: Record<PhaseId, string> = {
  command:
    "Battle-shock is sticky: a failed test lasts until the unit passes one in its Command phase, even above half-strength. Gain 1 CP now.",
  movement:
    "Pivoting is free. Models can move through friends. Ingress from reserves is more than 8\" from the enemy. Rapid Ingress cannot be used in round 1.",
  shooting:
    "Cover is −1 to hit, not +1 save, and does not stack with Stealth. Hidden Infantry/Beasts/Swarms in terrain that did not shoot are not visible beyond 15\" (12\" if Gone to Ground). Plunging Fire: +1 to hit from >3\" elevation.",
  charge:
    "Roll 2D6 first, then declare a target you can reach. Engagement range is 2\". Crushing Impact on a Monster or Vehicle charge — 1s deal mortal wounds back to you.",
  fight:
    "Pile in with every eligible unit first (you, then opponent). Your Fights First units go before the opponent's, even if they charged you. One Stratagem per unit this phase. Consolidate at the end.",
  end: "Score your Force Disposition primary off terrain areas, not markers. Battle-shock persists into the next turn until the unit passes a test.",
};
