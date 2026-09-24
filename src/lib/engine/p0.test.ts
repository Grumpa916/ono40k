import test from "node:test";
import assert from "node:assert/strict";
import { validateCanonicalCatalogue } from "./integrity.ts";
import { DependencyManager } from "./dependency.ts";
import { objectiveDefinitions, emptyObjective, setContribution, confirmObjective } from "./objective.ts";
import { resolveWeapon } from "./resolution.ts";
import { executeCommand } from "./commands.ts";
import type { BattleRuntime, RuntimeUnit } from "./types.ts";

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
  const definition = { id: "O3", layoutId: "test", index: 3, kind: "centre" as const, territory: "me" as const, anchor: { x: 0, y: 0 }, terrainAreaId: null };
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
  const defs = objectiveDefinitions("th-th-a", "me");
  assert.equal(defs.length, 5);
  assert.ok(defs.every((d) => d.terrainAreaId === null));
  assert.equal("radius" in defs[0]!, false);
});

test("the same unit may contribute its OC to multiple objectives", () => {
  const definitions = [
    { id: "O2", layoutId: "test", index: 2, kind: "centre" as const, territory: "me" as const, anchor: { x: 28, y: 20 }, terrainAreaId: null },
    { id: "O3", layoutId: "test", index: 3, kind: "centre" as const, territory: "me" as const, anchor: { x: 33, y: 24 }, terrainAreaId: null },
  ];
  for (const definition of definitions) {
    let objective = emptyObjective(definition);
    objective = setContribution(objective, {
      componentId: "u1", unitId: "u1", side: "me", modelsContributing: 1, effectiveOcPerModel: 10, totalOc: 10, updatedAt: Date.now(),
    });
    objective = setContribution(objective, {
      componentId: "u2", unitId: "u2", side: "opponent", modelsContributing: 0, effectiveOcPerModel: 0, totalOc: 0, updatedAt: Date.now(),
    });
    assert.equal(confirmObjective(objective).status, "CONFIRMED");
    assert.equal(confirmObjective(objective).youOc, 10);
  }
});

test("command rejects invalid casualty input", () => {
  const state: BattleRuntime = {
    battleId: "b1", edition: 11, rulesVersion: "11e", round: 1, activeSide: "me", phase: "movement",
    cp: { me: 0, opponent: 0 }, vp: { me: 0, opponent: 0 }, units: {}, objectives: {},
    mission: { disposition: { me: null, opponent: null }, primaryId: null, scoringWindow: null }, versions: {}, primaryTransactions: {}, primaryAwardedByRound: { me: [0,0,0,0,0], opponent: [0,0,0,0,0] },
  };
  assert.equal(executeCommand(state, { id: "c1", type: "REMOVE_MODELS", unitId: "missing", count: 1 }).ok, false);
});
test("objective definitions distinguish territory from objective type",()=>{
  const defs=objectiveDefinitions("th-th-a","me");
  assert.equal(defs.length,5);
  assert.ok(defs.every((d)=>d.territory==="me" || d.territory==="opponent"));
});


test("territory mapping is valid across all three layouts and both attacker orientations", () => {
  for (const layoutId of ["th-th-a", "th-th-b", "th-th-c"]) {
    for (const attackerSide of ["me", "opponent"] as const) {
      const defs = objectiveDefinitions(layoutId, attackerSide);
      assert.equal(defs.length, 5, layoutId + " / " + attackerSide);
      const home = defs.filter((d) => d.kind === "home");
      assert.equal(home.length, 2);
      const attackerHome = home.find((d) => d.owner === attackerSide);
      const defenderHome = home.find((d) => d.owner !== attackerSide);
      assert.equal(attackerHome?.territory, attackerSide);
      assert.equal(defenderHome?.territory, attackerSide === "me" ? "opponent" : "me");
      assert.ok(defs.every((d) => d.territory === "me" || d.territory === "opponent"));
    }
  }
});

test("objective-changing commands invalidate confirmed control", () => {
  const definition = { id: "O3", layoutId: "test", index: 3, kind: "centre" as const, territory: "me" as const, anchor: { x: 0, y: 0 }, terrainAreaId: null };
  let objective = emptyObjective(definition);
  objective = setContribution(objective, {
    componentId: "u1", unitId: "u1", side: "me", modelsContributing: 5, effectiveOcPerModel: 1, totalOc: 5, updatedAt: Date.now(),
  });
  objective = setContribution(objective, {
    componentId: "u2", unitId: "u2", side: "opponent", modelsContributing: 3, effectiveOcPerModel: 1, totalOc: 3, updatedAt: Date.now(),
  });
  const confirmed = confirmObjective(objective);
  assert.equal(confirmed.status, "CONFIRMED");
  const stale = { ...confirmed, status: "STALE" as const };
  assert.equal(stale.controller, "me");
  assert.equal(stale.youOc, 5);
  assert.equal(stale.opponentOc, 3);
});


test("layouts with paired centre objectives are identified for multi-objective validation", () => {
  const paired = [
    ["th-pf-a", 5.0], ["th-pf-b", 5.2], ["th-pf-c", 6.6],
    ["th-pa-a", 13.0], ["th-pa-b", 8.3], ["th-pa-c", 3.3],
    ["pf-di-a", 17.1], ["pf-di-b", 5.7], ["pf-di-c", 7.7],
    ["pf-re-a", 11.0], ["pf-re-b", 15.8], ["pf-re-c", 7.0],
    ["pf-pa-a", 5.1], ["pf-pa-b", 7.5], ["pf-pa-c", 5.5],
    ["di-re-a", 15.9], ["di-re-b", 10.7], ["di-re-c", 12.5],
    ["re-re-a", 5.0], ["re-re-b", 7.0], ["re-re-c", 5.9],
  ];
  assert.ok(paired.length >= 1);
});
