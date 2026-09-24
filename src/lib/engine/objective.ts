import { getUnit } from "../../data/codex.ts";
import { getMap } from "../../data/maps.ts";
import type { RosterUnit } from "../../data/types.ts";
import { resolveModelOc } from "./resolution.ts";
import type { ObjectiveContribution, ObjectiveDefinition, ObjectiveRuntime, RuntimeUnit } from "./types.ts";

export function objectiveDefinitions(layoutId: string | null | undefined, attackerSide?: "me" | "opponent"): ObjectiveDefinition[] {
  const layout = getMap(layoutId);
  if (!layout) return [];
  return layout.markers.map((marker, index) => ({
    id: "O" + (index + 1),
    layoutId: layout.id,
    index: index + 1,
    kind: marker.kind,
    owner: marker.owner && attackerSide ? marker.owner === "attacker" ? attackerSide : attackerSide === "me" ? "opponent" : "me" : undefined,
    anchor: { x: marker.x, y: marker.y },
    terrainAreaId: null,
  }));
}

export function emptyObjective(definition: ObjectiveDefinition): ObjectiveRuntime {
  return { definition, contributions: {}, youOc: null, opponentOc: null, controller: "unknown", status: "UNKNOWN", lastConfirmedAt: null, version: 0 };
}

function recalculate(runtime: ObjectiveRuntime): ObjectiveRuntime {
  const totals = { me: 0, opponent: 0 };
  const knownSides = { me: false, opponent: false };
  let unknown = false;
  for (const contribution of Object.values(runtime.contributions)) {
    knownSides[contribution.side] = true;
    if (contribution.effectiveOcPerModel == null || contribution.totalOc == null) {
      unknown = true;
      continue;
    }
    totals[contribution.side] += contribution.totalOc;
  }
  const bothSidesKnown = knownSides.me && knownSides.opponent;
  const controlUnknown = !bothSidesKnown || unknown;
  const controller = controlUnknown ? "unknown" : totals.me > totals.opponent ? "me" : totals.opponent > totals.me ? "opponent" : "contested";
  return { ...runtime, youOc: totals.me, opponentOc: totals.opponent, controller, status: controlUnknown ? "UNKNOWN" : runtime.status, version: runtime.version + 1 };
}

export function setContribution(runtime: ObjectiveRuntime, contribution: ObjectiveContribution): ObjectiveRuntime {
  const models = Math.max(0, contribution.modelsContributing);
  const totalOc = contribution.effectiveOcPerModel == null ? null : models * Math.max(0, contribution.effectiveOcPerModel);
  return recalculate({
    ...runtime,
    contributions: { ...runtime.contributions, [contribution.componentId]: { ...contribution, modelsContributing: models, totalOc, updatedAt: Date.now() } },
    status: "STALE",
  });
}

export function confirmObjective(runtime: ObjectiveRuntime, confirmedAt = Date.now()): ObjectiveRuntime {
  const next = recalculate(runtime);
  if (next.youOc == null || next.opponentOc == null || next.controller === "unknown") return { ...next, status: "UNKNOWN" };
  return { ...next, status: "CONFIRMED", lastConfirmedAt: confirmedAt };
}

export function staleObjective(runtime: ObjectiveRuntime) {
  return { ...runtime, status: "STALE" as const, version: runtime.version + 1 };
}

export function maxContributingModels(unit: RuntimeUnit) {
  return Math.min(unit.modelsRemaining, Math.max(0, unit.rosterUnit.models));
}

export function contributionFromUnit(unit: RuntimeUnit, side: "me" | "opponent", modelsContributing: number): ObjectiveContribution {
  const resolved = resolveModelOc(unit);
  const count = Math.min(Math.max(0, modelsContributing), unit.modelsRemaining);
  const oc = resolved.status === "RESOLVED" ? resolved.value : null;
  return { componentId: unit.rosterUnit.id, unitId: unit.rosterUnit.id, side, modelsContributing: count, effectiveOcPerModel: oc, totalOc: oc == null ? null : oc * count, updatedAt: Date.now() };
}

export function attachedUnitComponents(units: RuntimeUnit[], unitId: string) {
  const root = units.find((unit) => unit.rosterUnit.id === unitId);
  if (!root) return [];
  return [root, ...units.filter((unit) => unit.attachedTo === unitId)];
}

/** 11e control rule: a unit can contest only one objective when control is determined. */
export function findContestConflicts(contributions: ObjectiveContribution[]) {
  const seen = new Set<string>();
  const conflicts = new Set<string>();
  for (const contribution of contributions) {
    if (contribution.modelsContributing <= 0) continue;
    if (seen.has(contribution.unitId)) conflicts.add(contribution.unitId);
    seen.add(contribution.unitId);
  }
  return [...conflicts];
}

export function objectiveContributionFromRosterUnit(factionId: string, rosterUnit: RosterUnit, side: "me" | "opponent") {
  const definition = getUnit(factionId, rosterUnit.unitId);
  if (!definition) return null;
  const runtime: RuntimeUnit = { rosterUnit, definition, side, modelsRemaining: rosterUnit.models, woundsOnCurrent: 0, battleShocked: false, destroyed: false, attachedTo: rosterUnit.attachedTo };
  return contributionFromUnit(runtime, side, rosterUnit.models);
}