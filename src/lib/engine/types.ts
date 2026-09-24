import type { Disposition, Game, MissionEvent, PhaseId, RosterUnit, UnitDef } from "@/data/types";

export type ResolutionStatus = "RESOLVED" | "UNKNOWN" | "NOT_APPLICABLE" | "INVALID";
export type ResolutionResult<T> =
  | { status: "RESOLVED"; value: T; dependencies: string[]; provenance: string[] }
  | { status: "UNKNOWN"; dependencies: string[]; provenance: string[]; reason: string }
  | { status: "NOT_APPLICABLE"; dependencies: string[]; provenance: string[]; reason: string }
  | { status: "INVALID"; dependencies: string[]; provenance: string[]; reason: string };

export type RuleEffect = {
  id: string;
  kind: "SET" | "ADD" | "MULTIPLY" | "CAP" | "FLOOR" | "AVAILABLE" | "UNAVAILABLE" | "RESTRICTION";
  target: string;
  value?: number;
  source: string;
  scope?: "battle" | "player" | "unit" | "model" | "weapon" | "objective" | "attack" | "target";
};

export type ObjectiveDefinition = {
  id: string; layoutId: string; index: number;
  kind: "home" | "expansion" | "centre";
  owner?: "me" | "opponent";
  territory: "me" | "opponent";
  anchor: { x: number; y: number };
  terrainAreaId: string | null;
};

export type ObjectiveContribution = {
  componentId: string; unitId: string; side: "me" | "opponent";
  modelsContributing: number; effectiveOcPerModel: number | null; totalOc: number | null; updatedAt: number;
};

export type ObjectiveRuntime = {
  definition: ObjectiveDefinition;
  contributions: Record<string, ObjectiveContribution>;
  youOc: number | null; opponentOc: number | null;
  controller: "me" | "opponent" | "contested" | "unknown";
  status: "CONFIRMED" | "STALE" | "UNKNOWN";
  lastConfirmedAt: number | null; version: number;
};

export type RuntimeUnit = {
  rosterUnit: RosterUnit; definition: UnitDef; side: "me" | "opponent";
  modelsRemaining: number; woundsOnCurrent: number; battleShocked: boolean; destroyed: boolean; attachedTo?: string;
};

export type BattleRuntime = {
  battleId: string; edition: 11; rulesVersion: string;
  round: 1 | 2 | 3 | 4 | 5; activeSide: "me" | "opponent"; phase: PhaseId;
  cp: { me: number; opponent: number }; vp: { me: number; opponent: number };
  units: Record<string, RuntimeUnit>; objectives: Record<string, ObjectiveRuntime>; missionEvents?: MissionEvent[];
  mission: {
    disposition: { me: Disposition | null; opponent: Disposition | null };
    primaryId: string | null;
    scoringWindow: "COMMAND" | "END_OF_TURN" | "END_OF_BATTLE" | null;
  };
  versions: Record<string, number>;
  primaryTransactions: Record<string, PrimaryScoreTransaction>;
  primaryAwardedByRound: { me: [number, number, number, number, number]; opponent: [number, number, number, number, number] };
};

export type BattleEvent =
  | { type: "BATTLE_STARTED"; commandId: string; battleId: string }
  | { type: "PHASE_CHANGED"; commandId: string; phase: PhaseId }
  | { type: "TURN_CHANGED"; commandId: string; round: number; side: "me" | "opponent" }
  | { type: "UNIT_MOVED"; commandId: string; unitId: string }
  | { type: "MODEL_DESTROYED"; commandId: string; unitId: string; count: number }
  | { type: "UNIT_DESTROYED"; commandId: string; unitId: string }
  | { type: "UNIT_OC_CHANGED"; commandId: string; unitId: string }
  | { type: "UNIT_BATTLE_SHOCK_CHANGED"; commandId: string; unitId: string; battleShocked: boolean }
  | { type: "OBJECTIVE_CONTRIBUTION_CHANGED"; commandId: string; objectiveId: string; unitId: string }
  | { type: "OBJECTIVE_CONFIRMED"; commandId: string; objectiveId: string }
  | { type: "OBJECTIVE_STALE"; commandId: string; objectiveId: string }
  | { type: "CP_CHANGED"; commandId: string; side: "me" | "opponent" }
  | { type: "VP_CHANGED"; commandId: string; side: "me" | "opponent" }
  | { type: "PRIMARY_SCORE_COMMITTED"; commandId: string; transactionId: string; side: "me" | "opponent"; round: number; checkpoint: PrimaryCheckpoint; awardedVp: number; overscore: number };

export type BattleCommand =
  | { id: string; type: "MOVE_UNIT"; unitId: string }
  | { id: string; type: "REMOVE_MODELS"; unitId: string; count: number }
  | { id: string; type: "SET_BATTLE_SHOCK"; unitId: string; battleShocked: boolean }
  | { id: string; type: "SET_OBJECTIVE_CONTRIBUTION"; objectiveId: string; contribution: ObjectiveContribution }
  | { id: string; type: "SET_OBJECTIVE_SIDE_ABSENT"; objectiveId: string; side: "me" | "opponent" }
  | { id: string; type: "CONFIRM_OBJECTIVE"; objectiveId: string }
  | { id: string; type: "CHANGE_PHASE"; phase: PhaseId }
  | { id: string; type: "CHANGE_TURN"; round: 1 | 2 | 3 | 4 | 5; side: "me" | "opponent" }
  | { id: string; type: "SET_CP"; side: "me" | "opponent"; value: number }
  | { id: string; type: "SET_VP"; side: "me" | "opponent"; value: number }
  | { id: string; type: "SCORE_PRIMARY"; side: "me" | "opponent"; round: 1 | 2 | 3 | 4 | 5; checkpoint: PrimaryCheckpoint };

export type PrimaryCheckpoint = "COMMAND" | "END_OF_TURN" | "END_OF_BATTLE";

export type PrimaryScoreTransaction = { transactionId: string; side: "me" | "opponent"; round: number; checkpoint: PrimaryCheckpoint; missionId: string | null; eligibleVp: number; awardedVp: number; overscore: number; conditionIds: string[]; committedAt: number; };
export type MissionConditionKind =
  | "CONTROL_OBJECTIVE"
  | "CONTROL_OBJECTIVE_COUNT"
  | "CONTROL_OBJECTIVE_IN_ZONE"
  | "CONTROL_ANY_OBJECTIVE"
  | "CONTROL_MORE_OBJECTIVES"
  | "DESTROY_UNIT"
  | "DESTROYED_DURING_WINDOW"
  | "ACTION_COMPLETED"
  | "OPERATION_MARKER_COUNT"
  | "ALL"
  | "ANY"
  | "AT_LEAST_N"
  | "UNSUPPORTED";

export type MissionCondition = {
  id: string;
  kind: MissionConditionKind;
  objectiveId?: string;
  objectiveKind?: ObjectiveDefinition["kind"];
  excludeHome?: boolean;
  territory?: "me" | "opponent";
  requiresHomeControl?: boolean;
  count?: number;
  actionName?: string;
  markerLocation?: "battlefield" | "opponentHome" | "myHome" | "centreObjective";
  targetSide?: "me" | "opponent";
  comparePreviousTurn?: boolean;
  children?: MissionCondition[];
  vp: number;
  each?: boolean;
  rounds: number[];
  checkpoints: PrimaryCheckpoint[];
  sourceText: string;
  windows: Array<{ checkpoint: PrimaryCheckpoint; rounds: number[] }>;
};

export type ConditionResult = {
  status: "PASS" | "FAIL" | "UNKNOWN";
  value?: number;
  dependencies: string[];
  reason?: string;
};

export type PrimaryScoreItem = {
  conditionId: string;
  sourceText: string;
  eligibleVp: number;
  awardedVp: number;
  overscore: number;
  status: ConditionResult["status"];
  dependencies: string[];
};

export type PrimaryScorePreview = {
  side: "me" | "opponent";
  round: number;
  checkpoint: PrimaryCheckpoint;
  missionId: string | null;
  items: PrimaryScoreItem[];
  eligibleVp: number;
  remainingRoundCap: number;
  awardedVp: number;
  overscore: number;
  unresolved: string[];
  requiredObjectiveIds: string[];
};

export type CommandResult = { ok: boolean; state?: BattleRuntime; events: BattleEvent[]; error?: string };
export type CatalogueAudit = { edition: 11; valid: boolean; errors: string[]; warnings: string[]; checkedFactions: number; checkedUnits: number; checkedWeapons: number };
export type DerivedRecord<T = unknown> = { key: string; value: T; dependencies: string[]; versions: Record<string, number>; calculatedAt: number };
export type EngineSnapshot = Pick<Game, "id" | "round" | "phase" | "activeSide">;