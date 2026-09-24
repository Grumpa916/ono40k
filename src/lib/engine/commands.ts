import { getUnit } from "@/data/codex";
import { primaryForSide } from "@/lib/validation";
import type { Game } from "@/data/types";
import { objectiveDefinitions, emptyObjective, setContribution, confirmObjective, staleObjective, findContestConflicts } from "./objective";
import type { BattleCommand, BattleEvent, BattleRuntime, CommandResult, ObjectiveContribution, RuntimeUnit } from "./types";

function bump(state: BattleRuntime, key: string) { state.versions[key] = (state.versions[key] ?? 0) + 1; }

function makeUnits(game: Game): Record<string, RuntimeUnit> {
  const out: Record<string, RuntimeUnit> = {};
  for (const side of ["me", "opponent"] as const) {
    const roster = side === "me" ? game.myRoster : game.opponentRoster;
    for (const ru of roster.units) {
      const definition = getUnit(roster.factionId, ru.unitId);
      if (!definition) continue;
      const current = game.unitState[ru.id];
      out[ru.id] = { rosterUnit: ru, definition, side, modelsRemaining: current?.modelsRemaining ?? ru.models, woundsOnCurrent: current?.woundsOnCurrent ?? 0, battleShocked: current?.battleShocked ?? false, destroyed: current?.destroyed ?? false, attachedTo: ru.attachedTo };
    }
  }
  return out;
}

export function createBattleRuntime(game: Game): BattleRuntime {
  const primary = primaryForSide(game.myRoster, game.opponentRoster);
  const definitions = objectiveDefinitions(game.preBattle?.mapId, game.preBattle?.attacker ?? undefined);
  return {
    battleId: game.id, edition: 11, rulesVersion: "11e", round: game.round, activeSide: game.activeSide, phase: game.phase,
    cp: { ...game.cp },
    vp: {
      me: game.scores.me.primaryByRound.reduce((a, b) => a + b, 0) + game.scores.me.tactical + game.scores.me.painted,
      opponent: game.scores.opponent.primaryByRound.reduce((a, b) => a + b, 0) + game.scores.opponent.tactical + game.scores.opponent.painted,
    },
    units: makeUnits(game),
    objectives: Object.fromEntries(definitions.map((d) => [d.id, emptyObjective(d)])),
    mission: { disposition: { me: primary?.mine ?? null, opponent: primary?.theirs ?? null }, primaryId: primary?.info.name ?? null, scoringWindow: null },
    versions: {},
  };
}

function validateContribution(state: BattleRuntime, contribution: ObjectiveContribution) {
  const unit = state.units[contribution.unitId];
  if (!unit) return "Unknown unit.";
  if (!Number.isInteger(contribution.modelsContributing) || contribution.modelsContributing < 0) return "Invalid contributing-model count.";
  if (contribution.modelsContributing > unit.modelsRemaining) return "Contributing models exceed models remaining.";
  if (contribution.effectiveOcPerModel != null && contribution.effectiveOcPerModel < 0) return "Effective OC cannot be negative.";
  return null;
}

function contestConflicts(state: BattleRuntime) {
  return findContestConflicts(Object.values(state.objectives).flatMap((objective) => Object.values(objective.contributions)));
}

export function executeCommand(previous: BattleRuntime, command: BattleCommand): CommandResult {
  const state = structuredClone(previous);
  const events: BattleEvent[] = [];
  switch (command.type) {
    case "MOVE_UNIT": {
      if (!state.units[command.unitId]) return { ok: false, events, error: "Unknown unit." };
      bump(state, "unit:" + command.unitId);
      events.push({ type: "UNIT_MOVED", commandId: command.id, unitId: command.unitId });
      for (const objective of Object.values(state.objectives)) {
        if (!Object.values(objective.contributions).some((c) => c.unitId === command.unitId && c.modelsContributing > 0)) continue;
        state.objectives[objective.definition.id] = staleObjective(objective);
        events.push({ type: "OBJECTIVE_STALE", commandId: command.id, objectiveId: objective.definition.id });
      }
      break;
    }
    case "REMOVE_MODELS": {
      const unit = state.units[command.unitId];
      if (!unit) return { ok: false, events, error: "Unknown unit." };
      if (!Number.isInteger(command.count) || command.count <= 0 || command.count > unit.modelsRemaining) return { ok: false, events, error: "Invalid casualty count." };
      unit.modelsRemaining -= command.count;
      unit.destroyed = unit.modelsRemaining === 0;
      bump(state, "unit:" + command.unitId);
      events.push({ type: "MODEL_DESTROYED", commandId: command.id, unitId: command.unitId, count: command.count });
      events.push({ type: "UNIT_OC_CHANGED", commandId: command.id, unitId: command.unitId });
      if (unit.destroyed) events.push({ type: "UNIT_DESTROYED", commandId: command.id, unitId: command.unitId });
      for (const objective of Object.values(state.objectives)) {
        if (!Object.values(objective.contributions).some((c) => c.unitId === command.unitId)) continue;
        state.objectives[objective.definition.id] = staleObjective(objective);
        events.push({ type: "OBJECTIVE_STALE", commandId: command.id, objectiveId: objective.definition.id });
      }
      break;
    }
    case "SET_BATTLE_SHOCK": {
      const unit = state.units[command.unitId];
      if (!unit) return { ok: false, events, error: "Unknown unit." };
      if (unit.battleShocked === command.battleShocked) return { ok: true, state, events };
      unit.battleShocked = command.battleShocked;
      bump(state, "unit:" + command.unitId);
      events.push({ type: "UNIT_BATTLE_SHOCK_CHANGED", commandId: command.id, unitId: command.unitId, battleShocked: command.battleShocked });
      for (const objective of Object.values(state.objectives)) {
        if (!Object.values(objective.contributions).some((c) => c.unitId === command.unitId)) continue;
        state.objectives[objective.definition.id] = staleObjective(objective);
        events.push({ type: "OBJECTIVE_STALE", commandId: command.id, objectiveId: objective.definition.id });
      }
      break;
    }
    case "SET_OBJECTIVE_CONTRIBUTION": {
      const objective = state.objectives[command.objectiveId];
      if (!objective) return { ok: false, events, error: "Unknown objective." };
      const error = validateContribution(state, command.contribution);
      if (error) return { ok: false, events, error };
      state.objectives[command.objectiveId] = setContribution(objective, command.contribution);
      bump(state, "objective:" + command.objectiveId);
      events.push({ type: "OBJECTIVE_CONTRIBUTION_CHANGED", commandId: command.id, objectiveId: command.objectiveId, unitId: command.contribution.unitId });
      break;
    }
    case "CONFIRM_OBJECTIVE": {
      const objective = state.objectives[command.objectiveId];
      if (!objective) return { ok: false, events, error: "Unknown objective." };
      if (contestConflicts(state).length) return { ok: false, events, error: "A unit is assigned to multiple objectives; choose one before confirming control." };
      const next = confirmObjective(objective);
      if (next.status !== "CONFIRMED") return { ok: false, events, error: "Objective control is unknown; required contribution data is incomplete." };
      state.objectives[command.objectiveId] = next;
      bump(state, "objective:" + command.objectiveId);
      events.push({ type: "OBJECTIVE_CONFIRMED", commandId: command.id, objectiveId: command.objectiveId });
      break;
    }
    case "CHANGE_PHASE":
      if (state.phase === command.phase) return { ok: true, state, events };
      state.phase = command.phase; bump(state, "phase:" + command.phase);
      events.push({ type: "PHASE_CHANGED", commandId: command.id, phase: command.phase });
      break;
    case "CHANGE_TURN":
      state.round = command.round; state.activeSide = command.side; bump(state, "turn:" + command.round + ":" + command.side);
      events.push({ type: "TURN_CHANGED", commandId: command.id, round: command.round, side: command.side });
      break;
    case "SET_CP":
      if (!Number.isInteger(command.value) || command.value < 0) return { ok: false, events, error: "Invalid CP value." };
      state.cp[command.side] = command.value; bump(state, "battle:cp:" + command.side);
      events.push({ type: "CP_CHANGED", commandId: command.id, side: command.side });
      break;
    case "SET_VP":
      if (!Number.isInteger(command.value) || command.value < 0) return { ok: false, events, error: "Invalid VP value." };
      state.vp[command.side] = command.value; bump(state, "battle:vp:" + command.side);
      events.push({ type: "VP_CHANGED", commandId: command.id, side: command.side });
      break;
  }
  return { ok: true, state, events };
}