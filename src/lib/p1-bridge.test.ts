import test from "node:test";
import assert from "node:assert/strict";
import { SEED_LISTS } from "../data/seeds.ts";
import type { Game } from "../data/types.ts";
import { registerBattle, reconcileBattle, getBattleRuntime, getBattleEngineDiagnostics, unregisterBattle } from "./battle-engine-bridge.ts";

function fixture(): Game {
  const mine = structuredClone(SEED_LISTS[0]!);
  const theirs = structuredClone(SEED_LISTS[1] ?? SEED_LISTS[0]!);
  const firstUnit = mine.units[0]!;
  const unitState = Object.fromEntries(
    [...mine.units, ...theirs.units].map((unit) => [
      unit.id,
      { modelsRemaining: unit.models, woundsOnCurrent: 0, battleShocked: false, hidden: false, destroyed: false },
    ]),
  );
  return {
    id: "p1-bridge-fixture",
    myName: "Me",
    opponentName: "Opponent",
    myRoster: mine,
    opponentRoster: theirs,
    round: 1,
    phase: "command",
    activeSide: "me",
    viewing: "me",
    scores: {
      me: { primaryByRound: [0, 0, 0, 0, 0], primaryChecks: [], secondaryMode: null, fixedIds: [], tacticalActive: [], secondaryChecks: {}, secondaryMeta: {}, tactical: 0, painted: 0 },
      opponent: { primaryByRound: [0, 0, 0, 0, 0], primaryChecks: [], secondaryMode: null, fixedIds: [], tacticalActive: [], secondaryChecks: {}, secondaryMeta: {}, tactical: 0, painted: 0 },
    },
    cp: { me: 1, opponent: 1 },
    unitState,
    activeStrats: [],
    scoringActions: [],
    log: [],
    undoStack: [],
    notes: "",
    status: "active",
    startedAt: Date.now(),
    elapsedMs: 0,
    runningSince: null,
    turnMs: { me: 0, opponent: 0 },
    liveRound: 1,
    liveSide: "me",
    livePhase: "command",
    preBattle: undefined,
  };
}

test("P1 bridge registers an engine runtime", () => {
  const game = fixture();
  registerBattle(game);
  const runtime = getBattleRuntime(game);
  assert.equal(runtime.battleId, game.id);
  assert.equal(runtime.edition, 11);
  assert.equal(getBattleEngineDiagnostics(game.id).registered, true);
  unregisterBattle(game.id);
});

test("P1 bridge mirrors casualty and battle-shock changes", () => {
  const before = fixture();
  const after = structuredClone(before);
  const unit = after.myRoster.units[0]!;
  after.unitState[unit.id]!.modelsRemaining -= 1;
  after.unitState[unit.id]!.battleShocked = true;

  registerBattle(before);
  reconcileBattle(before, after);

  const runtime = getBattleRuntime(after);
  assert.equal(runtime.units[unit.id]!.modelsRemaining, unit.models - 1);
  assert.equal(runtime.units[unit.id]!.battleShocked, true);
  assert.equal(runtime.units[unit.id]!.destroyed, false);
  unregisterBattle(after.id);
});

test("P1 bridge mirrors phase and turn changes", () => {
  const before = fixture();
  const after = structuredClone(before);
  after.phase = "shooting";
  after.round = 2;
  after.activeSide = "opponent";

  registerBattle(before);
  reconcileBattle(before, after);

  const runtime = getBattleRuntime(after);
  assert.equal(runtime.phase, "shooting");
  assert.equal(runtime.round, 2);
  assert.equal(runtime.activeSide, "opponent");
  unregisterBattle(after.id);
});

test("P1 bridge rebuilds instead of guessing when a legacy mutation is not representable", () => {
  const before = fixture();
  const after = structuredClone(before);
  const unit = after.myRoster.units[0]!;
  after.unitState[unit.id]!.modelsRemaining += 1;

  registerBattle(before);
  reconcileBattle(before, after);

  const diagnostics = getBattleEngineDiagnostics(after.id);
  assert.equal(diagnostics.registered, true);
  assert.match(diagnostics.desync ?? "", /rebuilt/);
  assert.equal(getBattleRuntime(after).units[unit.id]!.modelsRemaining, unit.models + 1);
  unregisterBattle(after.id);
});