import type { Disposition } from "./types";

export const DISPOSITIONS: Disposition[] = [
  "Take and Hold",
  "Purge the Foe",
  "Disruption",
  "Reconnaissance",
  "Priority Assets",
];

export type MissionInfo = {
  name: string;
  blurb: string;
  scoring: string[];
};

const m = (name: string, blurb: string, scoring: string[]): MissionInfo => ({ name, blurb, scoring });

const SAME: Record<Disposition, MissionInfo> = {
  "Take and Hold": m(
    "Battlefield Dominance",
    "Mirror Take and Hold. Seize the field and dig in — home still scores. Primary is capped at 15 VP per round, 45 total.",
    [
      "2 VP if you control more objectives than your opponent. (R1–R2, end of your turn)",
      "3 VP for each objective you control. (R2–R5, Command; R5 end of turn)",
      "2 VP extra for each non-home objective if you also control your home. (R2–R5, Command; R5 end of turn)",
    ],
  ),
  "Purge the Foe": m(
    "Meatgrinder",
    "Mirror Purge. Kill more than you lose and keep a foothold off your home. Primary is capped at 15 VP per round, 45 total.",
    [
      "3 VP if one or more enemy units were destroyed this turn. (R1–R5, end of your turn)",
      "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
      "4 VP if more enemy units were destroyed this turn than friendly units in the previous turn. (R2–R5, end of your turn)",
      "5 VP if you control your opponent's home objective. (R2–R5, end of your turn)",
    ],
  ),
  Disruption: m(
    "Outmanoeuvre",
    "Mirror Disruption. Push off home and pile into their territory. Primary is capped at 15 VP per round, 45 total.",
    [
      "10 VP if you control your opponent's home objective. (R1–R5, end of your turn)",
      "4 VP for each objective you control excluding home. (R1, end of your turn)",
      "5 VP for each objective you control excluding home. (R2–R3, Command)",
      "6 VP for each objective you control excluding home. (R4–R5, end of your turn)",
    ],
  ),
  Reconnaissance: m(
    "Gather Intel",
    "Mirror Recon. Extract intelligence from the centre and plant markers. Primary is capped at 15 VP per round, 45 total.",
    [
      "6 VP if you control one or more central objectives. (R1, end of your turn)",
      "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
      "7 VP for each friendly unit that completed Extract Intelligence this turn. (R2–R5, end of your turn)",
      "5 VP if three or more of your operation markers are on the battlefield. (end of battle)",
      "5 VP extra if one of your operation markers is on the opponent's home. (end of battle)",
    ],
  ),
  "Priority Assets": m(
    "Sabotage",
    "Mirror Priority Assets. Sabotage non-home objectives, especially in their territory. Primary is capped at 15 VP per round, 45 total.",
    [
      "3 VP for each non-home objective you sabotaged this turn. (R1–R5, end of your turn)",
      "2 VP extra for each sabotaged objective in the opponent's territory. (R1–R5, end of your turn)",
      "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
    ],
  ),
};

type PairKey = `${Disposition}|${Disposition}`;

const PAIR: Partial<Record<PairKey, { me: MissionInfo; them: MissionInfo }>> = {
  "Take and Hold|Purge the Foe": {
    me: m(
      "Immovable Object",
      "Take and Hold vs Purge. Hold the centre through their turn — they score by killing and retaking.",
      [
        "3 VP if you control one or more central objectives. (R1–R5, end of your turn)",
        "5 VP for each objective you control excluding your home. (R2–R4, Command)",
        "5 VP for each objective you control excluding your home. (R5, end of your turn)",
      ],
    ),
    them: m(
      "Unstoppable Force",
      "Purge vs Take and Hold. Kill, hold off home, and retake ground. Centre is an end-of-battle bonus.",
      [
        "3 VP if one or more enemy units were destroyed this turn. (R1–R5, end of your turn)",
        "4 VP for each objective you control excluding your home. (R2–R5, Command; R5 end of turn)",
        "3 VP if you control one or more objectives you did not control at the start of the turn, excluding home. (R2–R5, end of your turn)",
        "5 VP if you control one or more central objectives. (end of battle)",
      ],
    ),
  },
  "Take and Hold|Disruption": {
    me: m(
      "Determined Acquisition",
      "Take and Hold vs Disruption. Flip markers and pile into their territory — the centre is in their territory.",
      [
        "2 VP for each objective you control that you did not control at the start of the turn, excluding home. (R1–R5, end of your turn)",
        "3 VP for each objective you control. (R2–R5, Command; R5 end of turn)",
        "3 VP extra for each of those in the opponent's territory. (R2–R5, Command; R5 end of turn)",
      ],
    ),
    them: m(
      "Death Trap",
      "Disruption vs Take and Hold. Trap terrain, then kill inside the trap. Home does not score.",
      [
        "2 VP for each terrain area trapped this turn. (R1–R5, end of your turn)",
        "3 VP extra per trapped terrain area that is also an objective. (R1–R5, end of your turn)",
        "3 VP if one or more enemy units were destroyed in a trapped area this turn. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
      ],
    ),
  },
  "Take and Hold|Reconnaissance": {
    me: m(
      "Purge and Secure",
      "Take and Hold vs Recon. Kill on the markers, hold off home, and retake ground.",
      [
        "3 VP if an enemy unit was destroyed this turn by a unit on an objective, or an enemy that started on an objective was destroyed. (R1–R5, end of your turn)",
        "4 VP for each objective you control excluding your home. (R2–R5, Command; R5 end of turn)",
        "3 VP if you control one or more objectives you did not control at the start of the turn, excluding home. (R2–R5, end of your turn)",
      ],
    ),
    them: m(
      "Reconnaissance Sweep",
      "Recon vs Take and Hold. Spread into table quarters and pick off units.",
      [
        "3 VP if friendly units occupy 3 different table quarters and are more than 6\" from the centre. (R1–R5, end of your turn)",
        "3 VP extra if they occupy 4 quarters (6 total). (R1–R5, end of your turn)",
        "1 VP for each enemy unit destroyed this turn. (R1–R5, end of your turn)",
        "3 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
      ],
    ),
  },
  "Take and Hold|Priority Assets": {
    me: m(
      "Inescapable Dominion",
      "Take and Hold vs Priority Assets. Blanket the board. Home still counts toward 2+ / 3+.",
      [
        "4 VP if you control three or more objectives. (R1–R5, end of your turn)",
        "5 VP if you control two or more objectives. (R2–R5, Command; R5 end of turn)",
        "4 VP if you control more objectives than your opponent. (R2–R5, Command; R5 end of turn)",
        "5 VP if you control the enemy's home objective. (end of battle)",
      ],
    ),
    them: m(
      "Secure Asset",
      "Priority Assets vs Take and Hold. Action on a non-home objective, then hold the board.",
      [
        "4 VP if you completed the Secure Asset action on a non-home objective. (R1–R5, end of your turn)",
        "2 VP if one or more enemy units on a central objective were destroyed this turn. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "4 VP if you control three or more objectives (home counts). (R2–R5, Command; R5 end of turn)",
      ],
    ),
  },
  "Purge the Foe|Disruption": {
    me: m(
      "Punishment",
      "Purge vs Disruption. Condemn units that killed you or sit on markers; they score when they leave the table.",
      [
        "5 VP if one or more Condemned enemy units left the battlefield this turn. (R1–R5, end of turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "5 VP if you control more objectives than your opponent. (R2–R5, Command; R5 end of turn)",
        "8 VP if you control your opponent's home objective. (end of battle)",
      ],
    ),
    them: m(
      "Delaying Action",
      "Disruption vs Purge. Kill for VP each, then hold a centre and an expansion.",
      [
        "2 VP for each enemy unit destroyed this turn. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "3 VP if you control one or more central and one or more expansion objectives. (R2–R5, end of your turn)",
      ],
    ),
  },
  "Purge the Foe|Reconnaissance": {
    me: m(
      "Consecrate",
      "Purge vs Recon. Units that destroy the foe become Consecration units; they consecrate non-home objectives they end on.",
      [
        "3 VP if 1–2 objectives are consecrated. (R1–R5, end of your turn)",
        "3 VP extra if 3 or more are consecrated (6 total). (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "4 VP if you control more objectives than your opponent. (R2–R5, Command; R5 end of turn)",
        "5 VP if you consecrated the opponent's home objective. (end of battle)",
      ],
    ),
    them: m(
      "Triangulation",
      "Recon vs Purge. Action to triangulate non-home objectives — it sticks. Deny a second and third action.",
      [
        "3 VP if 1 objective is triangulated. (R2–R5, end of your turn)",
        "3 VP extra if 2 are triangulated (6 total). (R2–R5, end of your turn)",
        "4 VP extra if 3 or more are triangulated (10 total). (R2–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "10 VP if you control four or more objectives. (end of battle)",
      ],
    ),
  },
  "Purge the Foe|Priority Assets": {
    me: m(
      "Destroyer's Wrath",
      "Purge vs Priority Assets. Kill, hold off home, and out-kill them. Their chaff is your fuel.",
      [
        "3 VP if one or more enemy units were destroyed this turn. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "4 VP if you control more objectives than your opponent. (R2–R5, Command; R5 end of turn)",
        "5 VP if more enemy units were destroyed this turn than they destroyed in their previous turn. (R2–R5, end of your turn)",
      ],
    ),
    them: m(
      "Vital Link",
      "Priority Assets vs Purge. Action to plant operation markers on central objectives, then sit on them.",
      [
        "2 VP if you control one or more central objectives. (R1–R5, end of your turn)",
        "1 VP for each operation marker on a central objective you control. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "4 VP if you control a central objective. (R2–R5, Command; R5 end of turn)",
        "10 VP if you control the opponent's home objective. (end of battle)",
      ],
    ),
  },
  "Disruption|Reconnaissance": {
    me: m(
      "Smoke and Mirrors",
      "Disruption vs Recon. Decoy objectives, especially in their territory.",
      [
        "2 VP for each decoyed objective. (R1–R5, end of your turn)",
        "2 VP extra for each decoyed objective in the opponent's territory. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "10 VP if four or more objectives are decoyed. (end of battle)",
      ],
    ),
    them: m(
      "Surveil the Foe",
      "Recon vs Disruption. Surveil enemy units that are not sitting on a decoyed marker.",
      [
        "4 VP if one or more enemy units were surveilled this turn and are not on a decoyed objective. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "5 VP if none of the opponent's operation markers are on the battlefield. (R1–R5, end of your turn)",
      ],
    ),
  },
  "Disruption|Priority Assets": {
    me: m(
      "Locate and Deny",
      "Disruption vs Priority Assets. Kill on the markers and contest the last relic.",
      [
        "4 VP if one or more enemy units that started the turn on an objective were destroyed. (R1–R5, end of your turn)",
        "4 VP if only one operation marker remains and you contest that terrain with no enemy in it. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "5 VP if you control the relic and no enemy units are within it. (end of battle)",
      ],
    ),
    them: m(
      "Extract Relic",
      "Priority Assets vs Disruption. Sensor Sweep to strip their markers, then sit on the last one.",
      [
        "4 VP if you completed a Sensor Sweep this turn. (R1–R5, end of your turn)",
        "3 VP if an enemy unit that started the turn on an objective was destroyed. (R1–R5, end of your turn)",
        "4 VP if only one opponent marker remains and you contest that terrain with no enemy in it. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "5 VP if only one opponent marker remains and you contest that terrain with no enemy in it. (end of battle)",
      ],
    ),
  },
  "Reconnaissance|Priority Assets": {
    me: m(
      "Search and Scour",
      "Recon vs Priority Assets. Hold the centre, clear terrain, and keep them out of your zone.",
      [
        "3 VP if you control one or more central objectives. (R1–R5, end of your turn)",
        "2 VP if one or more enemy units that started the turn in a terrain area were destroyed. (R1–R5, end of your turn)",
        "4 VP for each objective you control excluding your home. (R2–R5, Command; R5 end of turn)",
        "5 VP if no enemy units are wholly within your deployment zone. (end of battle)",
      ],
    ),
    them: m(
      "Vanguard Operation",
      "Priority Assets vs Recon. Action in their territory, pick off units, then steal home.",
      [
        "4 VP if you completed the Vanguard Operation action this turn. (R1–R5, end of your turn)",
        "2 VP if one or more enemy units were destroyed this turn. (R1–R5, end of your turn)",
        "4 VP if you control one or more objectives excluding your home. (R2–R5, Command; R5 end of turn)",
        "10 VP if you control the opponent's home objective. (end of battle)",
      ],
    ),
  },
};

export function missionFor(me: Disposition, them: Disposition): { me: MissionInfo; them: MissionInfo } {
  if (me === them) {
    const info = SAME[me];
    return { me: info, them: info };
  }
  const forward = PAIR[`${me}|${them}` as PairKey];
  if (forward) return forward;
  const reverse = PAIR[`${them}|${me}` as PairKey];
  if (reverse) return { me: reverse.them, them: reverse.me };
  return { me: SAME[me], them: SAME[them] };
}

export function primaryDeck(me: Disposition): { vs: Disposition; name: string }[] {
  return DISPOSITIONS.map((them) => ({ vs: them, name: missionFor(me, them).me.name }));
}

export function totalScore(primaryByRound: number[], tactical: number, painted: number) {
  return primaryByRound.reduce((a, b) => a + b, 0) + tactical + painted;
}

export type PrimaryObjective = {
  text: string;
  vp: number;
  once: boolean;
  each: boolean;
  rounds: number[];
};

export function parseObjective(line: string): PrimaryObjective {
  const m = line.match(/(\d+)\s*VP/i);
  const once = /end of battle/i.test(line);
  return {
    text: line,
    vp: m ? Number(m[1]) : 0,
    once,
    each: /for each|per (trapped|decoyed|enemy|friendly)|each (non-home|objective|enemy|terrain|operation)/i.test(line),
    rounds: parseRounds(line, once),
  };
}

function parseRounds(line: string, once: boolean): number[] {
  if (once) return [];
  const range = line.match(/\(R(\d)–R(\d)/);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    return Array.from({ length: b - a + 1 }, (_, i) => a + i);
  }
  const one = line.match(/\(R(\d)[,)]/);
  if (one) return [Number(one[1])];
  return [1, 2, 3, 4, 5];
}

export function checkCount(row: Array<number | boolean> | undefined, slot: number): number {
  const v = row?.[slot];
  if (typeof v === "boolean") return v ? 1 : 0;
  return Number(v || 0);
}

export function objectiveVp(checks: Array<Array<number | boolean>> | undefined, objectives: PrimaryObjective[]): number {
  const byRound = [0, 0, 0, 0, 0];
  let bonus = 0;
  objectives.forEach((obj, i) => {
    const row = checks?.[i] ?? [];
    if (obj.once) {
      bonus += checkCount(row, 0) * obj.vp;
      return;
    }
    for (let r = 0; r < 5; r++) byRound[r] += checkCount(row, r) * obj.vp;
  });
  const capped = byRound.reduce((sum, v) => sum + Math.min(15, v), 0);
  return Math.min(45, capped + bonus);
}

export function sideVp(
  score: { primaryByRound: number[]; primaryChecks?: Array<Array<number | boolean>>; tactical: number; painted: number },
  objectives: PrimaryObjective[] | null,
): number {
  const primary =
    objectives && score.primaryChecks
      ? objectiveVp(score.primaryChecks, objectives)
      : score.primaryByRound.reduce((a, b) => a + b, 0);
  return primary + score.tactical + score.painted;
}
