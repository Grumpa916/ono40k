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
      O1:{definition:{id:"O1",layoutId:"test",index:1,kind:"home",owner:"me",anchor:{x:0,y:0},terrainAreaId:"A"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O2:{definition:{id:"O2",layoutId:"test",index:2,kind:"expansion",owner:"opponent",anchor:{x:0,y:0},terrainAreaId:"B"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O3:{definition:{id:"O3",layoutId:"test",index:3,kind:"centre",anchor:{x:0,y:0},terrainAreaId:"C"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
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


test("P2 commits primary scoring once and records overscore",()=>{
    const r=runtime();
    const first=executeCommand(r,{id:"score-1",type:"SCORE_PRIMARY",side:"me",round:2,checkpoint:"COMMAND"});
    assert.equal(first.ok,true, first.error ?? "primary scoring rejected");
    assert.equal(first.state?.primaryAwardedByRound.me[1],9);
    assert.equal(first.state?.primaryTransactions["primary:me:2:COMMAND"]?.awardedVp,9);
    const duplicate=executeCommand(first.state!,{id:"score-2",type:"SCORE_PRIMARY",side:"me",round:2,checkpoint:"COMMAND"});
    assert.equal(duplicate.ok,false);
});
