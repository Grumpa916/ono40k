import { describe, expect, it } from "vitest";
import { missionConditions, evaluatePrimaryCheckpoint } from "@/lib/engine/mission";
import type { BattleRuntime } from "@/lib/engine/types";

function runtime(): BattleRuntime {
  return {
    battleId:"test", edition:11, rulesVersion:"11e", round:2, activeSide:"me", phase:"command",
    cp:{me:0,opponent:0}, vp:{me:0,opponent:0}, units:{},
    objectives:{
      O1:{definition:{id:"O1",layoutId:"test",index:1,kind:"home",owner:"me",anchor:{x:0,y:0},terrainAreaId:"A"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O2:{definition:{id:"O2",layoutId:"test",index:2,kind:"expansion",owner:"opponent",anchor:{x:0,y:0},terrainAreaId:"B"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
      O3:{definition:{id:"O3",layoutId:"test",index:3,kind:"centre",anchor:{x:0,y:0},terrainAreaId:"C"},contributions:{},youOc:10,opponentOc:0,controller:"me",status:"CONFIRMED",lastConfirmedAt:1,version:1},
    },
    mission:{disposition:{me:"Take and Hold",opponent:"Purge the Foe"},primaryId:"test",scoringWindow:null},versions:{}
  };
}

describe("P2 mission scoring",()=>{
  it("preserves command vs end-of-turn windows",()=>{
    const cs=missionConditions("Take and Hold","Purge the Foe");
    const command=cs.find(c=>c.sourceText.includes("3 VP for each objective you control"))!;
    expect(command.windows).toEqual([{checkpoint:"COMMAND",rounds:[2,3,4,5]},{checkpoint:"END_OF_TURN",rounds:[5]}]);
  });
  it("calculates objective-count VP and applies the 15VP round cap",()=>{
    const preview=evaluatePrimaryCheckpoint(runtime(),"me",2,"COMMAND",14);
    expect(preview.eligibleVp).toBeGreaterThan(0);
    expect(preview.awardedVp).toBeLessThanOrEqual(1);
    expect(preview.overscore).toBeGreaterThanOrEqual(0);
  });
  it("does not score from stale objective data",()=>{
    const r=runtime();
    r.objectives.O2.status="STALE";
    const preview=evaluatePrimaryCheckpoint(r,"me",2,"COMMAND",0);
    expect(preview.unresolved.length).toBeGreaterThan(0);
  });
});
