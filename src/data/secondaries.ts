import { parseObjective } from "@/data/missions";

export type SecondaryCard = {
  id: string;
  name: string;
  fixed: boolean;
  blurb: string;
  fixedScoring: string[];
  tacticalScoring: string[];
};

export const SECONDARIES: SecondaryCard[] = [
  {
    id: "assassination",
    name: "Assassination",
    fixed: true,
    blurb: "Cut down the enemy's champions.",
    fixedScoring: [
      "3 VP for each enemy Character destroyed this turn. (R1–R5, end of turn)",
      "1 VP extra for each of those Characters with 4 or more Wounds. (R1–R5, end of turn)",
    ],
    tacticalScoring: ["5 VP if one or more enemy Characters were destroyed this turn, or all have already been destroyed. (R1–R5, end of turn)"],
  },
  {
    id: "bring-it-down",
    name: "Bring it Down",
    fixed: true,
    blurb: "Fell the monsters and engines.",
    fixedScoring: ["4 VP for each enemy model with 10 or more Wounds destroyed this turn. (R1–R5, end of turn)"],
    tacticalScoring: ["5 VP if one or more enemy models with 10 or more Wounds were destroyed this turn. (R1–R5, end of turn)"],
  },
  {
    id: "grievous-blow",
    name: "A Grievous Blow",
    fixed: true,
    blurb: "Cull the horde — starting strength 13+.",
    fixedScoring: ["4 VP for each enemy unit with starting strength 13+ (including attached leaders) destroyed this turn. (R1–R5, end of turn)"],
    tacticalScoring: ["5 VP if one or more enemy units with starting strength 13+ were destroyed this turn. (R1–R5, end of turn)"],
  },
  {
    id: "engage",
    name: "Engage on All Fronts",
    fixed: true,
    blurb: "Presence in table quarters, 6\" from centre, not Aircraft or Battle-shocked.",
    fixedScoring: [
      "2 VP if you have a presence in 3 table quarters. (R1–R5, end of turn)",
      "2 VP extra if you have a presence in all 4 (4 total). (R1–R5, end of turn)",
    ],
    tacticalScoring: [
      "3 VP if you have a presence in 3 table quarters. (R1–R5, end of turn)",
      "2 VP extra if you have a presence in all 4 (5 total). (R1–R5, end of turn)",
    ],
  },
  {
    id: "no-prisoners",
    name: "No Prisoners",
    fixed: false,
    blurb: "Exterminate. 2 VP per kill, max 5.",
    fixedScoring: [],
    tacticalScoring: ["2 VP for each enemy unit destroyed this turn (max 5). (R1–R5, end of turn)"],
  },
  {
    id: "overwhelming-force",
    name: "Overwhelming Force",
    fixed: false,
    blurb: "Kill units that started on objectives.",
    fixedScoring: [],
    tacticalScoring: ["3 VP for each enemy unit that started the turn on an objective and was destroyed (max 5). (R1–R5, end of turn)"],
  },
  {
    id: "plunder",
    name: "Plunder",
    fixed: false,
    blurb: "Action on terrain not in your territory. Redraw if Cleanse is active.",
    fixedScoring: [],
    tacticalScoring: ["5 VP if a terrain area was plundered this turn. (R1–R5, end of your turn)"],
  },
  {
    id: "display-of-might",
    name: "Display of Might",
    fixed: false,
    blurb: "Outnumber the foe in no man's land.",
    fixedScoring: [],
    tacticalScoring: [
      "2 VP if you have more units wholly in no man's land (not Aircraft or Battle-shocked). (R1–R5, end of any turn)",
      "3 VP extra (5 total) if this is still true at the end of the opponent's turn. (R1–R5)",
    ],
  },
  {
    id: "outflank",
    name: "Outflank",
    fixed: false,
    blurb: "Push units to opposite board edges, outside your territory.",
    fixedScoring: [],
    tacticalScoring: [
      "3 VP if a friendly unit (not Aircraft or Battle-shocked) is within 6\" of a battlefield edge and not in your territory. (R1–R5, end of turn)",
      "2 VP extra if 2+ such units are on opposite edges (5 total). (R1–R5, end of turn)",
    ],
  },
  {
    id: "beacon",
    name: "Beacon",
    fixed: false,
    blurb: "When drawn, pick a beacon unit on the battlefield or embarked.",
    fixedScoring: [],
    tacticalScoring: [
      "3 VP if your beacon unit is on the battlefield and not in your deployment zone. (R1–R5, end of turn)",
      "2 VP extra if it is wholly in the opponent's territory (5 total). (R1–R5, end of turn)",
    ],
  },
  {
    id: "cleanse",
    name: "Cleanse",
    fixed: false,
    blurb: "Action on non-home objectives you control. Redraw if Plunder is active.",
    fixedScoring: [],
    tacticalScoring: [
      "2 VP if you cleansed one objective this turn. (R1–R5, end of your turn)",
      "3 VP extra if you cleansed 2 or more (5 total). (R1–R5, end of your turn)",
    ],
  },
  {
    id: "defend-stronghold",
    name: "Defend Stronghold",
    fixed: false,
    blurb: "Hold home. Shuffle back if drawn in round 1.",
    fixedScoring: [],
    tacticalScoring: [
      "3 VP if you control your home objective. (R2–R5, end of opponent's turn)",
      "2 VP extra if no enemy units are in your deployment zone (5 total). (R2–R5)",
    ],
  },
  {
    id: "secure-nml",
    name: "Secure No Man's Land",
    fixed: false,
    blurb: "Two or more objectives in no man's land.",
    fixedScoring: [],
    tacticalScoring: ["5 VP if you control two or more objectives in no man's land. (R1–R5, end of turn)"],
  },
  {
    id: "forward-position",
    name: "Forward Position",
    fixed: false,
    blurb: "Opponent's home or both expansion objectives. Shuffle back if drawn in round 1.",
    fixedScoring: [],
    tacticalScoring: ["5 VP if you control the opponent's home objective or both expansion objectives. (R2–R5, end of turn)"],
  },
  {
    id: "centre-ground",
    name: "Centre Ground",
    fixed: false,
    blurb: "Contest the middle of the field.",
    fixedScoring: [],
    tacticalScoring: [
      "3 VP if a friendly unit (not Aircraft or Battle-shocked) is within 3\" of the centre and no enemy is within 3\". (R1–R5, end of turn)",
      "2 VP extra if no enemy is within 6\" of the centre (5 total). (R1–R5, end of turn)",
    ],
  },
  {
    id: "tempting-target",
    name: "A Tempting Target",
    fixed: false,
    blurb: "When drawn, opponent picks one no man's land objective.",
    fixedScoring: [],
    tacticalScoring: ["5 VP if you control the Tempting Target objective. (R1–R5, end of your turn)"],
  },
  {
    id: "behind-enemy-lines",
    name: "Behind Enemy Lines",
    fixed: false,
    blurb: "Units wholly in the opponent's deployment zone. Shuffle back if drawn in round 1.",
    fixedScoring: [],
    tacticalScoring: ["3 VP for each friendly unit (not Aircraft or Battle-shocked) wholly in the opponent's deployment zone (max 5). (R2–R5, end of turn)"],
  },
  {
    id: "burden-of-trust",
    name: "Burden of Trust",
    fixed: false,
    blurb: "When drawn, assign a guard unit to objectives. Score at the end of the opponent's turn.",
    fixedScoring: [],
    tacticalScoring: ["2 VP for each guarded objective you still control at the end of the opponent's turn (max 5). (R1–R5)"],
  },
];

export const FIXED_SECONDARIES = SECONDARIES.filter((s) => s.fixed);

export function getSecondary(id: string): SecondaryCard | undefined {
  return SECONDARIES.find((s) => s.id === id);
}

export function secondaryLines(card: SecondaryCard, mode: "fixed" | "tactical"): string[] {
  return mode === "fixed" ? card.fixedScoring : card.tacticalScoring;
}

export function scoreOptions(lines: string[]): number[] {
  const parsed = lines.map(parseObjective);
  const vps = new Set<number>();
  for (const p of parsed) {
    if (p.each) {
      const capMatch = p.text.match(/max (\d+)/i);
      const cap = capMatch ? Number(capMatch[1]) : p.vp * 3;
      for (let n = 1; n * p.vp <= cap; n++) vps.add(n * p.vp);
      if (cap > p.vp) vps.add(cap);
    } else {
      vps.add(p.vp);
    }
  }
  if (parsed.length >= 2 && parsed.every((p) => !p.each)) {
    vps.add(parsed.reduce((sum, p) => sum + p.vp, 0));
  }
  if (parsed.length >= 2 && parsed.every((p) => p.each)) {
    const base = parsed[0].vp;
    const extra = parsed[1].vp;
    for (let n = 1; n <= 3; n++) {
      vps.add(n * base);
      vps.add(n * (base + extra));
    }
  }
  return [...vps].filter((v) => v > 0).sort((a, b) => a - b);
}

export function cardAward(checks?: Array<Array<number | boolean>>): number {
  return Number(checks?.[0]?.[0] || 0);
}

export function secondaryVp(
  mode: "fixed" | "tactical" | null | undefined,
  cardIds: string[],
  checks: Record<string, number[][]> | undefined,
): number {
  if (!mode || cardIds.length === 0) return 0;
  let sum = 0;
  for (const id of cardIds) {
    const award = cardAward(checks?.[id]);
    sum += mode === "fixed" ? Math.min(20, award) : award;
  }
  return Math.min(45, mode === "fixed" ? Math.min(40, sum) : sum);
}
