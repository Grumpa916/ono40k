import { BattleEngine, evaluatePrimaryCheckpoint } from "./engine/index.ts";
import type { BattleCommand, BattleRuntime, PrimaryCheckpoint, PrimaryScorePreview } from "./engine/index.ts";
import type { Game, ObjectiveControlRecord } from "../data/types.ts";
import { uid } from "./utils.ts";

type BridgeRecord = {
  engine: BattleEngine;
  gameId: string;
  syncedAt: number;
  desync: string | null;
  commands: number;
};

const records = new Map<string, BridgeRecord>();

function commandId() {
  return uid("eng");
}

function hydrateObjectiveState(game: Game, record: BridgeRecord) {\n  const persisted = game.objectiveControl;\n  if (!persisted) return record;\n  const state = record.engine.getState();\n  for (const [id, objective] of Object.entries(persisted)) if (state.objectives[id]) state.objectives[id] = objective as typeof state.objectives[string];\n  return record;\n}\n\nfunction ensure(game: Game): BridgeRecord {
  const existing = records.get(game.id);
  if (existing) return existing;
  const record: BridgeRecord = { engine: new BattleEngine(game), gameId: game.id, syncedAt: Date.now(), desync: null, commands: 0 };
  records.set(game.id, record);
  return record;
}

function rebuild(game: Game, reason: string) {
  const record: BridgeRecord = { engine: new BattleEngine(game), gameId: game.id, syncedAt: Date.now(), desync: reason, commands: 0 };
  records.set(game.id, record);
  return record;
}

function dispatch(record: BridgeRecord, command: BattleCommand) {
  const result = record.engine.dispatch(command);
  if (!result.ok) return false;
  record.commands += 1;
  record.syncedAt = Date.now();
  record.desync = null;
  return true;
}

export function registerBattle(game: Game) {
  records.set(game.id, hydrateObjectiveState(game, { engine: new BattleEngine(game), gameId: game.id, syncedAt: Date.now(), desync: null, commands: 0 }));
}

export function unregisterBattle(gameId: string) {
  records.delete(gameId);
}

export function reconcileBattle(previous: Game, next: Game) {
  if (previous.id !== next.id) {
    registerBattle(next);
    return;
  }

  let record = ensure(previous);

  if (previous.myRoster.updatedAt !== next.myRoster.updatedAt || previous.opponentRoster.updatedAt !== next.opponentRoster.updatedAt || previous.preBattle?.mapId !== next.preBattle?.mapId) {
    record = rebuild(next, "Roster or pre-battle definition changed; runtime rebuilt.");
    return;
  }

  let failed = false;

  if (previous.phase !== next.phase) {
    failed ||= !dispatch(record, { id: commandId(), type: "CHANGE_PHASE", phase: next.phase });
  }

  if (previous.round !== next.round || previous.activeSide !== next.activeSide) {
    failed ||= !dispatch(record, { id: commandId(), type: "CHANGE_TURN", round: next.round, side: next.activeSide });
  }

  for (const side of ["me", "opponent"] as const) {
    if (previous.cp[side] !== next.cp[side]) {
      failed ||= !dispatch(record, { id: commandId(), type: "SET_CP", side, value: next.cp[side] });
    }
  }

  const previousVp = {
    me: previous.scores.me.primaryByRound.reduce((a, b) => a + b, 0) + previous.scores.me.tactical + previous.scores.me.painted,
    opponent: previous.scores.opponent.primaryByRound.reduce((a, b) => a + b, 0) + previous.scores.opponent.tactical + previous.scores.opponent.painted,
  };
  const nextVp = {
    me: next.scores.me.primaryByRound.reduce((a, b) => a + b, 0) + next.scores.me.tactical + next.scores.me.painted,
    opponent: next.scores.opponent.primaryByRound.reduce((a, b) => a + b, 0) + next.scores.opponent.tactical + next.scores.opponent.painted,
  };
  for (const side of ["me", "opponent"] as const) {
    if (previousVp[side] !== nextVp[side]) {
      failed ||= !dispatch(record, { id: commandId(), type: "SET_VP", side, value: nextVp[side] });
    }
  }

  const unitIds = new Set([...Object.keys(previous.unitState), ...Object.keys(next.unitState)]);
  for (const unitId of unitIds) {
    const before = previous.unitState[unitId];
    const after = next.unitState[unitId];
    if (!before || !after) {
      failed = true;
      break;
    }
    if (before.modelsRemaining !== after.modelsRemaining) {
      const delta = before.modelsRemaining - after.modelsRemaining;
      if (delta > 0) failed ||= !dispatch(record, { id: commandId(), type: "REMOVE_MODELS", unitId, count: delta });
      else if (delta < 0) failed = true;
    }
    if (before.battleShocked !== after.battleShocked) {
      failed ||= !dispatch(record, { id: commandId(), type: "SET_BATTLE_SHOCK", unitId, battleShocked: after.battleShocked });
    }
  }

  if (failed) rebuild(next, "Legacy game mutation could not be represented by an engine command; runtime rebuilt.");
}

export function updateObjectiveControl(game: Game, command: BattleCommand) {\n  const record = ensure(game);\n  const result = record.engine.dispatch(command);\n  if (result.ok) { record.commands += 1; record.syncedAt = Date.now(); record.desync = null; }\n  return result;\n}\n\nexport function getBattleRuntime(game: Game): BattleRuntime {
  return ensure(game).engine.getState();
}

export function getBattleEngineDiagnostics(gameId: string) {
  const record = records.get(gameId);
  if (!record) return { registered: false, syncedAt: null, desync: "No engine runtime registered.", commands: 0 };
  return { registered: true, syncedAt: record.syncedAt, desync: record.desync, commands: record.commands };
}

export function resetBattleEngineRegistry() {
  records.clear();
}

export function commitPrimaryScoreTransaction(
  game: Game,
  side: "me" | "opponent" = game.activeSide,
  checkpoint: PrimaryCheckpoint = game.phase === "command" ? "COMMAND" : game.phase === "end" ? "END_OF_TURN" : "END_OF_TURN",
) {
  const record = ensure(game);
  const result = record.engine.dispatch({
    id: commandId(),
    type: "SCORE_PRIMARY",
    side,
    round: game.round,
    checkpoint,
  });
  if (result.ok) {
    record.commands += 1;
    record.syncedAt = Date.now();
    record.desync = null;
  }
  return result;
}

export function getPrimaryScorePreview(
  game: Game,
  side: "me" | "opponent" = game.activeSide,
  checkpoint: PrimaryCheckpoint = game.phase === "command" ? "COMMAND" : game.phase === "end" ? "END_OF_TURN" : "END_OF_TURN",
): PrimaryScorePreview {
  const runtime = getBattleRuntime(game);
  const round = game.round;
  const primaryAlreadyAwarded = game.scores[side].primaryByRound[round - 1] ?? 0;
  return evaluatePrimaryCheckpoint(runtime, side, round, checkpoint, primaryAlreadyAwarded);
}
