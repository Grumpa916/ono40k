import { getUnit } from "../../data/codex.ts";
import { getMap, territoryGuide } from "../../data/maps.ts";
import type { RosterUnit } from "../../data/types.ts";
import { resolveModelOc } from "./resolution.ts";
import type { ObjectiveContribution, ObjectiveDefinition, ObjectiveRuntime, RuntimeUnit } from "./types.ts";

function pointTerritory(layout: NonNullable<ReturnType<typeof getMap>>, x: number, y: number, attackerSide?: "me" | "opponent"): "me" | "opponent" {
  const guide = territoryGuide(layout.zones, layout.markers);
  const attackerTerritory = guide?.attackerSide;
  if (!attackerSide || !attackerTerritory) return "me";
  const inAttackerTerritory =
    attackerTerritory === "top" ? y <= 22 :
    attackerTerritory === "bottom" ? y >= 22 :
    attackerTerritory === "left" ? x <= 30 : x >= 30;
  const attacker = attackerSide;
  return inAttackerTerritory ? attacker : attacker === "me" ? "opponent" : "me";
}

export function objectiveDefinitions(layoutId: string | null | undefined, attackerSide?: "me" | "opponent"): ObjectiveDefinition[] {
  const layout = getMap(layoutId);
  if (!layout) return [];
  return layout.markers.map((marker, index) => ({
    id: "O" + (index + 1),
    layoutId: layout.id,
    index: index + 1,
    kind: marker.kind,
    owner: marker.owner && attackerSide ? marker.owner === "attacker" ? attackerSide : attackerSide === "me" ? "opponent" : "me" : undefined,
    territory: pointTerritory(layout, marker.x, marker.y, attackerSide),
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

/** Record a one-tap "no contributing models" observation for a side.
 * This is intentionally a contribution record rather than an implicit zero:
 * zero is known only when the player has explicitly observed that side.
 * Existing unit contributions for the other side remain untouched.
 */
export function setSideAbsent(runtime: ObjectiveRuntime, side: "me" | "opponent", updatedAt = Date.now()): ObjectiveRuntime {
  const componentId = `__side_absent__:${side}`;
  const contribution: ObjectiveContribution = {
    componentId,
    unitId: componentId,
    side,
    modelsContributing: 0,
    effectiveOcPerModel: 0,
    totalOc: 0,
    updatedAt,
  };
  const contributions = Object.fromEntries(
    Object.entries(runtime.contributions).filter(([id, existing]) =>
      existing.side !== side || id === componentId
    ),
  );
  return recalculate({
    ...runtime,
    contributions: { ...contributions, [componentId]: contribution },
    status: "STALE",
  });
}

export function setContribution(runtime: ObjectiveRuntime, contribution: ObjectiveContribution): ObjectiveRuntime {
  const models = Math.max(0, contribution.modelsContributing);
  const totalOc = contribution.effectiveOcPerModel == null ? null : models * Math.max(0, contribution.effectiveOcPerModel);
  const absentId = `__side_absent__:${contribution.side}`;
  const contributions = Object.fromEntries(
    Object.entries(runtime.contributions).filter(([id]) => id !== absentId),
  );
  return recalculate({
    ...runtime,
    contributions: {
      ...contributions,
      [contribution.componentId]: { ...contribution, modelsContributing: models, totalOc, updatedAt: Date.now() },
    },
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

export function objectiveContributionFromRosterUnit(factionId: string, rosterUnit: RosterUnit, side: "me" | "opponent") {
  const definition = getUnit(factionId, rosterUnit.unitId);
  if (!definition) return null;
  const runtime: RuntimeUnit = { rosterUnit, definition, side, modelsRemaining: rosterUnit.models, woundsOnCurrent: 0, battleShocked: false, destroyed: false, attachedTo: rosterUnit.attachedTo };
  return contributionFromUnit(runtime, side, rosterUnit.models);
}