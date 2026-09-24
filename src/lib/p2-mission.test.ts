// CI refresh: validate corrected engine syntax and current scoring tests.
import test from "node:test";
import assert from "node:assert/strict";
import { missionConditions, evaluatePrimaryCheckpoint } from "./engine/mission.ts";
import { setContribution, setSideAbsent, confirmObjective } from "./engine/objective.ts";
import { executeCommand } from "./engine/commands.ts";
import type { BattleRuntime } from "./engine/types.ts";

function runtime(): BattleRuntime {
  return {
    battleId:"test", edition:11, rulesVersion:"11e", round:2, activeSide:"me", phase:"command",
    cp:{me:0,opponent:0}, vp:{me:0,opponent:0}, units:{},
    objectives:{
      O1:{definition:{id:"O1",layoutId:"test",index:1,kind:"home",owner:"me",territory:"me",anchor:{x:0,y:0},terrainAreaId:"A"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O2:{definition:{id:"O2",layoutId:"test",index:2,kind:"expansion",owner:"opponent",territory:"me",anchor:{x:0,y:0},terrainAreaId:"B"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O3:{definition:{id:"O3",layoutId:"test",index:3,kind:"centre",territory:"me",anchor:{x:0,y:0},terrainAreaId:"C"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
    },
    mission:{disposition:{me:"Take and Hold",opponent:"Take and Hold"},primaryId:"test",scoringWindow:null},versions:{},
    primaryTransactions:{},
    primaryAwardedByRound:{me:[0,0,0,0,0],opponent:[0,0,0,0,0]}
  };
}


test("P2 preserves command vs end-of-turn windows",()=>{
    const cs=missionConditions("Take and Hold","Take and Hold");
    const command=cs.find(c=>c.sourceText.includes("3 VP for each objective you control"))!;
    assert.deepEqual(command?.windows,[{checkpoint:"COMMAND",rounds:[2,3,4,5]},{checkpoint:"END_OF_TURN",rounds:[5]}]);
});

test("P2 calculates objective-count VP and applies the 15VP round cap",()=>{
    const preview=evaluatePrimaryCheckpoint(runtime(),"me",2,"COMMAND",14);
    assert.equal(preview.items[0]?.status, "PASS");
    assert.deepEqual(preview.requiredObjectiveIds.sort(), ["O1","O2","O3"]);
    assert.ok(preview.items[0]?.eligibleVp > 0);
    assert.ok(preview.eligibleVp > 0);
    assert.ok(preview.awardedVp <= 1);
    assert.ok(preview.overscore >= 0);
});
test("P2 can confirm an objective with a one-tap absent-side observation",()=>{
    const r=runtime();
    r.objectives.O1 = {
      ...r.objectives.O1,
      youOc: null,
      opponentOc: null,
      controller:"unknown",
      status:"UNKNOWN",
      contributions:{}
    };
    const withOpponentAbsent = setSideAbsent(r.objectives.O1,"opponent",2);
    const withMe = setContribution(withOpponentAbsent,{
      componentId:"me-unit",
      unitId:"me-unit",
      side:"me",
      modelsContributing:5,
      effectiveOcPerModel:2,
      totalOc:10,
      updatedAt:3
    });
    const confirmed = confirmObjective(withMe,4);
    assert.equal(confirmed.controller,"me");
    assert.equal(confirmed.youOc,10);
    assert.equal(confirmed.opponentOc,0);
    assert.equal(confirmed.status,"CONFIRMED");
});

test("P2 does not score from stale objective data",()=>{
    const r=runtime();
    r.objectives.O2.status="STALE";
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    assert.ok(preview.unresolved.length > 0);
});


test("P2 absent-side observation replaces prior contributors for that side",()=>{
    const r=runtime();
    const withOpponent = setContribution(r.objectives.O1,{
      componentId:"opp-unit",
      unitId:"opp-unit",
      side:"opponent",
      modelsContributing:2,
      effectiveOcPerModel:2,
      totalOc:4,
      updatedAt:2
    });
    const absent = setSideAbsent(withOpponent,"opponent",3);
    assert.equal(absent.opponentOc,0);
    assert.equal(absent.contributions["opp-unit"],undefined);
    assert.equal(absent.contributions["__side_absent__:opponent"]?.totalOc,0);
});

test("P2 home-control bonus requires confirmed home control",()=>{
    const r=runtime();
    r.objectives.O1 = {...r.objectives.O1, controller:"opponent"};
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    const bonus=preview.items.find(i=>i.sourceText.includes("2 VP extra for each non-home objective"));
    assert.equal(bonus?.status,"FAIL");
    assert.equal(bonus?.awardedVp,0);
});

test("P2 home-control bonus stays unresolved when home data is stale",()=>{
    const r=runtime();
    r.objectives.O1 = {...r.objectives.O1, status:"STALE"};
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    const bonus=preview.items.find(i=>i.sourceText.includes("2 VP extra for each non-home objective"));
    assert.equal(bonus?.status,"UNKNOWN");
    assert.ok(bonus?.dependencies.includes("objective:O1"));
    assert.ok(preview.unresolved.some(text=>text.includes("2 VP extra for each non-home objective")));
});

test("P2 commits primary scoring once and records overscore",()=>{
    const r=runtime();
    r.primaryAwardedByRound.me[1] = 5;
    const first=executeCommand(r,{id:"score-1",type:"SCORE_PRIMARY",side:"me",round:2,checkpoint:"COMMAND"});
    assert.equal(first.ok,true, first.error ?? "primary scoring rejected");
    assert.equal(first.state?.primaryAwardedByRound.me[1],15);
    assert.equal(first.state?.primaryTransactions["primary:me:2:COMMAND"]?.awardedVp,10);
    const duplicate=executeCommand(first.state!,{id:"score-2",type:"SCORE_PRIMARY",side:"me",round:2,checkpoint:"COMMAND"});
    assert.equal(duplicate.ok,false);
});

test("P2 applies opponent-territory filtering to territory bonus scoring",()=>{
    const r=runtime();
    r.objectives.O1 = {...r.objectives.O1, definition:{...r.objectives.O1.definition, territory:"me"}};
    r.objectives.O2 = {...r.objectives.O2, definition:{...r.objectives.O2.definition, territory:"opponent"}};
    r.objectives.O3 = {...r.objectives.O3, definition:{...r.objectives.O3.definition, territory:"opponent"}};
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    const bonus=preview.items.find(i=>i.sourceText.includes("2 VP extra for each non-home objective"));
    assert.equal(bonus?.status,"PASS");
    assert.equal(bonus?.eligibleVp,4);
});


test("P2 allows the same unit to contribute to two objectives independently",()=>{
    const r=runtime();
    r.units["shared"] = {
      rosterUnit:{id:"shared",unitId:"test",models:6},
      definition:{id:"test",name:"Shared Unit",models:6,oc:2},
      side:"me",
      modelsRemaining:6,
      woundsOnCurrent:0,
      battleShocked:false,
      destroyed:false,
    } as any;
    r.objectives.O2 = setContribution(r.objectives.O2,{
      componentId:"shared",
      unitId:"shared",
      side:"me",
      modelsContributing:6,
      effectiveOcPerModel:2,
      totalOc:12,
      updatedAt:1
    });
    r.objectives.O3 = setContribution(r.objectives.O3,{
      componentId:"shared",
      unitId:"shared",
      side:"me",
      modelsContributing:3,
      effectiveOcPerModel:2,
      totalOc:6,
      updatedAt:1
    });
    assert.equal(r.objectives.O2.youOc,12);
    assert.equal(r.objectives.O3.youOc,6);
});

test("P2 does not require unrelated stale objectives for a one-or-more condition",()=>{
    const r=runtime();
    r.objectives.O3.status="STALE";
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    const oneOrMore=preview.items.find(i=>i.sourceText.includes("2 VP extra for each non-home objective"));
    assert.equal(oneOrMore?.status,"UNKNOWN");
    const objectiveCount=preview.items.find(i=>i.sourceText.includes("3 VP for each objective you control"));
    assert.equal(objectiveCount?.status,"UNKNOWN");
});


test("P2 rejects primary scoring at the wrong live checkpoint",()=>{
    const r=runtime();
    r.phase="shooting";
    const result=executeCommand(r,{id:"score-wrong-phase",type:"SCORE_PRIMARY",side:"me",round:2,checkpoint:"END_OF_TURN"});
    assert.equal(result.ok,false);
    assert.match(result.error ?? "",/end of the turn/i);
});


test("P2 evaluates destroyed-this-turn conditions from structured mission events",()=>{
  const r=runtime();
  r.activeSide="me";
  r.missionEvents=[{
    id:"destroy-1",kind:"unitDestroyed",at:10,round:2,turn:"me",phase:"shooting",side:"me",unitId:"enemy-1"
  }];
  const c=missionConditions("Purge the Foe","Take and Hold").find(x=>x.kind==="DESTROYED_DURING_WINDOW");
  assert.ok(c);
  const result = evaluatePrimaryCheckpoint(r,"me",2,"END_OF_TURN",0);
  const item = result.items.find(x=>x.conditionId===c!.id);
  assert.equal(item?.status,"PASS");
});

test("P2 evaluates completed mission actions from structured state",()=>{
  const r=runtime();
  r.activeSide="me";
  r.missionEvents=[{
    id:"action-1",kind:"actionCompleted",at:10,round:2,turn:"me",phase:"end",side:"me",actionName:"Secure Asset"
  }];
  const c=missionConditions("Priority Assets","Take and Hold").find(x=>x.kind==="ACTION_COMPLETED");
  assert.ok(c);
  const result = evaluatePrimaryCheckpoint(r,"me",2,"END_OF_TURN",0);
  const item = result.items.find(x=>x.conditionId===c!.id);
  assert.equal(item?.status,"PASS");
});


test("P2 evaluates opponent operation-marker conditions from the opponent side",()=>{
  const r=runtime();
  r.activeSide="me";
  r.missionEvents=[{
    id:"marker-1",kind:"operationMarker",at:10,round:2,turn:"opponent",phase:"movement",side:"opponent",markerId:"m1",markerLocation:"battlefield"
  }];
  const c=missionConditions("Surveil the Foe","Smoke and Mirrors").find(x=>x.kind==="OPERATION_MARKER_COUNT");
  assert.ok(c);
  const result = evaluatePrimaryCheckpoint(r,"me",2,"END_OF_TURN",0);
  const item = result.items.find(x=>x.conditionId===c!.id);
  assert.equal(item?.status,"FAIL");
});
