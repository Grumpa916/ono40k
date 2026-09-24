import test from "node:test";
import assert from "node:assert/strict";
import { validateCanonicalCatalogue } from "./integrity";
import { DependencyManager } from "./dependency";
import { objectiveDefinitions, emptyObjective, setContribution, confirmObjective, enforceSingleObjectiveContest } from "./objective";
import { resolveWeapon } from "./resolution";
import { executeCommand } from "./commands";
import type { BattleRuntime, RuntimeUnit } from "./types";

test("canonical catalogue validates", () => {
  const audit = validateCanonicalCatalogue();
  assert.equal(audit.edition, 11);
  assert.equal(audit.valid, true, audit.errors.join("\n"));
  assert.ok(audit.checkedUnits > 0);
  assert.ok(audit.checkedWeapons > 0);
});

test("dependency invalidation is targeted", () => {
  const deps = new DependencyManager();
  deps.register("primary:P1", ["objective:O3"]);
  deps.register("primary:P2", ["objective:O4"]);
  assert.deepEqual(deps.invalidateDependencies(["objective:O3"]), ["primary:P1"]);
  assert.equal(deps.isDirty("primary:P2"), false);
});

test("objective stays unknown until both sides are known", () => {
  const definition = { id: "O3", layoutId: "test", index: 3, kind: "centre" as const, anchor: { x: 0, y: 0 }, terrainAreaId: null };
  let objective = emptyObjective(definition);
  objective = setContribution(objective, {
    componentId: "u1", unitId: "u1", side: "me", modelsContributing: 5, effectiveOcPerModel: 1, totalOc: 5, updatedAt: Date.now(),
  });
  assert.equal(confirmObjective(objective).status, "UNKNOWN");
  objective = setContribution(objective, {
    componentId: "u2", unitId: "u2", side: "opponent", modelsContributing: 3, effectiveOcPerModel: 1, totalOc: 3, updatedAt: Date.now(),
  });
  const confirmed = confirmObjective(objective);
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.controller, "me");
});

test("resolver never invents ranged weapon range", () => {
  const unit = {
    rosterUnit: { id: "u1", unitId: "x", models: 1, points: 0 },
    definition: {
      id: "x", name: "Test", role: "infantry", points: 0,
      stats: { m: 6, t: 4, sv: 4, w: 1, ld: 6, oc: 1 },
      keywords: [], ranged: [{ name: "Gun", kind: "ranged", range: "Melee", attacks: 1, skill: 4, strength: 4, ap: 0, damage: 1, keywords: [] }],
      melee: [], abilities: [],
    },
    side: "me", modelsRemaining: 1, woundsOnCurrent: 0, battleShocked: false, destroyed: false,
  } as unknown as RuntimeUnit;
  assert.equal(resolveWeapon(unit, "Gun").status, "UNKNOWN");
});

test("objective definitions have no circular-radius field", () => {
  const defs = objectiveDefinitions("th-th-a");
  assert.equal(defs.length, 5);
  assert.ok(defs.every((d) => d.terrainAreaId === null));
  assert.equal("radius" in defs[0]!, false);
});

test("a unit cannot be credited to two objectives at control time", () => {
  const input = [
    { componentId: "u1", unitId: "u1", side: "me" as const, modelsContributing: 5, effectiveOcPerModel: 1, totalOc: 5, updatedAt: Date.now() },
    { componentId: "u1", unitId: "u1", side: "me" as const, modelsContributing: 5, effectiveOcPerModel: 1, totalOc: 5, updatedAt: Date.now() },
  ];
  const result = enforceSingleObjectiveContest(input);
  assert.equal(result[0]?.modelsContributing, 5);
  assert.equal(result[1]?.modelsContributing, 0);
});

test("command rejects invalid casualty input", () => {
  const state: BattleRuntime = {
    battleId: "b1", edition: 11, rulesVersion: "11e", round: 1, activeSide: "me", phase: "movement",
    cp: { me: 0, opponent: 0 }, vp: { me: 0, opponent: 0 }, units: {}, objectives: {},
    mission: { disposition: { me: null, opponent: null }, primaryId: null, scoringWindow: null }, versions: {},
  };
  assert.equal(executeCommand(state, { id: "c1", type: "REMOVE_MODELS", unitId: "missing", count: 1 }).ok, false);
});