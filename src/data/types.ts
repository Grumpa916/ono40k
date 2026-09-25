export type Allegiance = "Imperium" | "Chaos" | "Xenos";

export type Disposition =
  | "Take and Hold"
  | "Purge the Foe"
  | "Disruption"
  | "Reconnaissance"
  | "Priority Assets";

export type BattleSize = "incursion" | "strike";

export type UnitRole =
  | "character"
  | "battleline"
  | "infantry"
  | "mounted"
  | "vehicle"
  | "monster"
  | "transport";

export type PhaseId =
  | "command"
  | "movement"
  | "shooting"
  | "charge"
  | "fight"
  | "end";

export type Weapon = {
  name: string;
  kind: "ranged" | "melee";
  range: number | "Melee";
  attacks: number | string;
  skill: number;
  strength: number;
  ap: number;
  damage: number | string;
  keywords: string[];
  /** Mutually exclusive armament. Weapons that share a choice are one build, not all equipped. */
  choice?: string;
};

export type Ability = {
  name: string;
  text: string;
};

export type WargearOption = {
  id: string;
  name: string;
  points: number;
  group: string;
  text?: string;
};

export type Stratagem = {
  id: string;
  name: string;
  cp: number;
  when: string;
  text: string;
};

export type Enhancement = {
  id: string;
  name: string;
  points: number;
  text: string;
  upgrade?: boolean;
};

export type Detachment = {
  id: string;
  name: string;
  dp: 1 | 2 | 3;
  disposition: Disposition;
  uniqueTag: string;
  rule: Ability;
  stratagems: Stratagem[];
  enhancements: Enhancement[];
};

export type UnitSize = {
  models: number;
  points: number;
};

export type UnitDef = {
  id: string;
  name: string;
  role: UnitRole;
  points: number;
  sizes?: UnitSize[];
  stats: {
    m: number | string;
    t: number;
    sv: number;
    w: number;
    ld: number;
    oc: number | string;
  };
  invuln?: number;
  fnp?: number;
  keywords: string[];
  ranged: Weapon[];
  melee: Weapon[];
  abilities: Ability[];
  wargear?: WargearOption[];
  leaderOf?: string[];
  transport?: number;
};

export type Faction = {
  id: string;
  name: string;
  short: string;
  allegiance: Allegiance;
  accent: string;
  rule: Ability;
  detachments: Detachment[];
  units: UnitDef[];
  updatedAt?: string;
};

export type RosterUnit = {
  id: string;
  unitId: string;
  models: number;
  points: number;
  enhancementId?: string;
  attachedTo?: string;
  warlord?: boolean;
  notes?: string;
  wargearIds?: string[];
};

export type Roster = {
  id: string;
  name: string;
  factionId: string;
  battleSize: BattleSize;
  pointsLimit: number;
  detachmentIds: string[];
  disposition: Disposition | null;
  units: RosterUnit[];
  notes: string;
  favorite: boolean;
  saved?: boolean;
  savedAt?: number;
  createdAt: number;
  updatedAt: number;
};

export type UnitBattleState = {
  modelsRemaining: number;
  woundsOnCurrent: number;
  battleShocked: boolean;
  hidden: boolean;
  destroyed: boolean;
};

export type LedgerEventKind = "phase" | "turn" | "destroyed" | "battleShock" | "stratagem" | "prebattle" | "action" | "unit" | "score" | "cp";

export type LedgerEvent = {
  id: string;
  at: number;
  kind: LedgerEventKind;
  summary: string;
  round?: 1 | 2 | 3 | 4 | 5;
  phase?: PhaseId;
  turn?: "me" | "opponent";
  clockMs?: number;
};

export type ActiveStrat = {
  id: string;
  stratId: string;
  name: string;
  cp: number;
  when: string;
  text: string;
  source: string;
  side: "me" | "opponent";
  round: number;
  phase: PhaseId;
};

export type ScoringAction = {
  id: string;
  unitId: string;
  unitName: string;
  cardId: string;
  name: string;
  side: "me" | "opponent";
  round: 1 | 2 | 3 | 4 | 5;
};

export type GameUndoSlice = {
  round: 1 | 2 | 3 | 4 | 5;
  phase: PhaseId;
  activeSide: "me" | "opponent";
  viewing: "me" | "opponent";
  cp: { me: number; opponent: number };
  cpHistory?: Record<string, { me: number; opponent: number }>;
  stratHistory?: Record<string, ActiveStrat[]>;
  unitState: Record<string, UnitBattleState>;
  activeStrats: ActiveStrat[];
  status: "active" | "complete";
  finishedAt?: number;
  scoringActions?: ScoringAction[];
  scores?: { me: SideScore; opponent: SideScore };
};

export type SecondaryStamp = {
  selectedRound: 1 | 2 | 3 | 4 | 5;
  completedRound?: 1 | 2 | 3 | 4 | 5;
};

export type SideScore = {
  primaryByRound: [number, number, number, number, number];
  primaryChecks?: number[][];
  secondaryMode?: "fixed" | "tactical" | null;
  fixedIds?: string[];
  tacticalActive?: string[];
  secondaryChecks?: Record<string, number[][]>;
  secondaryMeta?: Record<string, SecondaryStamp>;
  tactical: number;
  painted: number;
};

export type SideKey = "me" | "opponent";

export type PreBattle = {
  rollOff: SideKey | null;
  attacker: SideKey | null;
  deploysFirst: SideKey | null;
  firstTurn: SideKey | null;
  mapId: string | null;
  terrainNote: string;
  formationNote: string;
  scoutIds: string[];
  infiltrateIds: string[];
};

export type Game = {
  id: string;
  myName: string;
  opponentName: string;
  myRoster: Roster;
  opponentRoster: Roster;
  round: 1 | 2 | 3 | 4 | 5;
  phase: PhaseId;
  activeSide: "me" | "opponent";
  viewing: "me" | "opponent";
  scores: { me: SideScore; opponent: SideScore };
  cp: { me: number; opponent: number };
  cpHistory?: Record<string, { me: number; opponent: number }>;
  stratHistory?: Record<string, ActiveStrat[]>;
  unitState: Record<string, UnitBattleState>;
  activeStrats: ActiveStrat[];
  scoringActions?: ScoringAction[];
  log: LedgerEvent[];
  undoStack: GameUndoSlice[];
  notes: string;
  status: "active" | "complete";
  startedAt: number;
  finishedAt?: number;
  elapsedMs?: number;
  /** Undefined: battle clock runs from startedAt. Null: battle clock is stopped. */
  battleRunningSince?: number | null;
  runningSince?: number | null;
  turnMs?: { me: number; opponent: number };
  liveRound?: 1 | 2 | 3 | 4 | 5;
  liveSide?: "me" | "opponent";
  livePhase?: PhaseId;
  preBattle?: PreBattle;
};

export const BATTLE_SIZES: Record<
  BattleSize,
  { label: string; points: number; dp: number; enhancements: number; copies: number; battlelineCopies: number }
> = {
  incursion: {
    label: "Incursion",
    points: 1000,
    dp: 3,
    enhancements: 2,
    copies: 2,
    battlelineCopies: 4,
  },
  strike: {
    label: "Strike Force",
    points: 2000,
    dp: 3,
    enhancements: 4,
    copies: 3,
    battlelineCopies: 6,
  },
};

export const PHASES: { id: PhaseId; label: string }[] = [
  { id: "command", label: "Command" },
  { id: "movement", label: "Movement" },
  { id: "shooting", label: "Shooting" },
  { id: "charge", label: "Charge" },
  { id: "fight", label: "Fight" },
  { id: "end", label: "End" },
];

export function canBeHidden(unit: UnitDef): boolean {
  return unit.keywords.some((k) => k === "Infantry" || k === "Beast" || k === "Beasts" || k === "Swarm" || k === "Swarms");
}
