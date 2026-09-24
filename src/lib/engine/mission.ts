import { missionFor, parseObjective } from "../../data/missions.ts";
import type { Disposition } from "../../data/types.ts";
import type { BattleRuntime, ConditionResult, MissionCondition, ObjectiveRuntime, PrimaryCheckpoint, PrimaryScorePreview } from "./types.ts";

function rounds(text: string): number[] {
  const r = text.match(/R(\d)–R(\d)/);
  if (r) return Array.from({ length: Number(r[2]) - Number(r[1]) + 1 }, (_, i) => Number(r[1]) + i);
  const one = text.match(/R(\d)/);
  return one ? [Number(one[1])] : [1,2,3,4,5];
}

function windows(line: string): Array<{ checkpoint: PrimaryCheckpoint; rounds: number[] }> {
  const out: Array<{ checkpoint: PrimaryCheckpoint; rounds: number[] }> = [];
  const clauses = line.split(";");
  for (const clause of clauses) {
    const match = clause.match(/(R\d(?:–R\d)?)\s*,?\s*(Command|end of (?:(?:your|the) )?turn)/i);
    if (!match) continue;
    out.push({
      checkpoint: match[2]!.toLowerCase() === "command" ? "COMMAND" : "END_OF_TURN",
      rounds: rounds(match[1]!),
    });
  }
  if (/end of battle/i.test(line)) out.push({ checkpoint: "END_OF_BATTLE", rounds: [5] });
  if (!out.length && /Command/i.test(line)) out.push({ checkpoint: "COMMAND", rounds: rounds(line) });
  if (!out.length && /end of (?:(?:your|the) )?turn/i.test(line)) out.push({ checkpoint: "END_OF_TURN", rounds: rounds(line) });
  return out;
}

function parseLine(text: string, index: number): MissionCondition {
  const parsed = parseObjective(text);
  const ws = windows(text);
  const base = { id: "primary:" + index, vp: parsed.vp, each: false, rounds: parsed.rounds, checkpoints: ws.map(w => w.checkpoint), sourceText: text, windows: ws };
  if (/^\d+ VP if one or more enemy units were destroyed this turn\./i.test(text)) {
    return { ...base, kind: "DESTROYED_DURING_WINDOW", count: 1 };
  }
  if (/one or more enemy units were destroyed this turn\./i.test(text) && !/trapped|started the turn|by a unit on an objective/i.test(text)) {
    return { ...base, kind: "DESTROYED_DURING_WINDOW", count: 1 };
  }
  if (/for each enemy unit destroyed this turn/i.test(text) && !/started the turn|trapped|terrain area/i.test(text)) {
    return { ...base, kind: "DESTROYED_DURING_WINDOW", count: 1, each: true };
  }
  if (/more enemy units were destroyed this turn than (?:friendly units|they destroyed) in (?:the )?previous turn/i.test(text)) {
    return { ...base, kind: "DESTROYED_DURING_WINDOW", count: 1, comparePreviousTurn: true };
  }
  const action = text.match(/completed the ([^".]+?) action/i);
  if (action && !/operation|vanguard/i.test(action[1]!)) {
    return { ...base, kind: "ACTION_COMPLETED", actionName: action[1]!.trim() };
  }
  const op = text.match(/(three or more|one or more|only one|none of the opponent'?s) (?:of your |of the opponent'?s )?operation markers?/i);
  if (op && !/only one operation marker remains and|you control|contest that terrain/i.test(text)) {
    const phrase = op[1]!.toLowerCase();
    const count = phrase === "three or more" ? 3 : phrase === "none of the opponent's" ? 0 : 1;
    return { ...base, kind: "OPERATION_MARKER_COUNT", count, markerLocation: /opponent'?s home/i.test(text) ? "opponentHome" : /central objective/i.test(text) ? "centreObjective" : "battlefield" };
  }
  if (/control more objectives than (?:your )?opponent/i.test(text)) return { ...base, kind: "CONTROL_MORE_OBJECTIVES" };
  if (/control (?:your opponent'?s|opponent'?s) home objective/i.test(text)) return { ...base, kind: "CONTROL_OBJECTIVE", objectiveKind: "home", objectiveId: "OPPONENT_HOME" };
  if (/control your home objective/i.test(text)) return { ...base, kind: "CONTROL_OBJECTIVE", objectiveKind: "home", objectiveId: "MY_HOME" };
  if (/control (?:one or more )?central objectives?/i.test(text)) return { ...base, kind: "CONTROL_OBJECTIVE_IN_ZONE", objectiveKind: "centre", count: 1 };
  const n = text.match(/control (two|three|four|five|[2-5]) or more objectives?/i);
  if (n) {
    const key = n[1].toLowerCase();
    const count = ({two:2,three:3,four:4,five:5} as Record<string,number>)[key] ?? Number(key);
    return { ...base, kind: "CONTROL_OBJECTIVE_COUNT", count };
  }
  if (/each of those objectives? (?:that is )?within (?:your )?opponent'?s territory|each (?:non-home )?objective.*(?:within|in) (?:your )?opponent'?s territory/i.test(text)) {
    return { ...base, kind: "CONTROL_OBJECTIVE_IN_ZONE", excludeHome: true, territory: "opponent", count: undefined, each: true };
  }
  if (/each non-home objective if you also control (?:your )?home/i.test(text)) {
    return { ...base, kind: "CONTROL_OBJECTIVE_IN_ZONE", excludeHome: true, count: undefined, each: true, requiresHomeControl: true };
  }
  if (/objectives? you control excluding (?:your )?home|control (?:one or more )?objectives? excluding (?:your )?home/i.test(text)) {
    const each = /for each|per (?:objective|non-home)/i.test(text);
    return { ...base, kind: "CONTROL_OBJECTIVE_IN_ZONE", excludeHome: true, count: each ? undefined : 1, each };
  }
  if (/objectives? you control|control (?:one or more )?objectives?/i.test(text)) {
    const each = /for each|per objective/i.test(text);
    return { ...base, kind: "CONTROL_ANY_OBJECTIVE", count: each ? undefined : 1, each };
  }
  return { ...base, kind: "UNSUPPORTED" };
}

export function missionConditions(me: Disposition, them: Disposition): MissionCondition[] {
  return missionFor(me, them).me.scoring.map((line, i) => parseLine(line, i));
}

function controlled(runtime: BattleRuntime, side: "me"|"opponent"): ObjectiveRuntime[] {
  return Object.values(runtime.objectives).filter(o => o.status === "CONFIRMED" && o.controller === side);
}

function evaluate(runtime: BattleRuntime, side: "me"|"opponent", c: MissionCondition): ConditionResult {
  const deps = Object.keys(runtime.objectives).map(id => "objective:" + id);
  const turnEvents = runtime.missionEvents.filter(e => e.round === runtime.round && e.turn === runtime.activeSide);
  const previousTurn = runtime.activeSide === "me" ? "opponent" : "me";
  const previousEvents = runtime.missionEvents.filter(e => e.round === runtime.round && e.turn === previousTurn);
  if (c.kind === "UNSUPPORTED") return { status:"UNKNOWN", dependencies:deps, reason:"Mission condition is not represented by the engine yet." };
  if (c.kind === "DESTROYED_DURING_WINDOW") {
    const destroyed = turnEvents.filter(e => e.kind === "unitDestroyed" && e.side === side);
    if (c.comparePreviousTurn) {
      const previousDestroyed = previousEvents.filter(e => e.kind === "unitDestroyed" && e.side !== side);
      if (destroyed.length > previousDestroyed.length) return { status:"PASS", value:destroyed.length, dependencies:["mission:destroyed:current","mission:destroyed:previous"] };
      return { status:"FAIL", value:destroyed.length, dependencies:["mission:destroyed:current","mission:destroyed:previous"] };
    }
    const value = destroyed.length;
    if (c.each) return { status: value > 0 ? "PASS" : "FAIL", value, dependencies:["mission:destroyed:current"] };
    return { status: value >= (c.count ?? 1) ? "PASS" : "FAIL", value, dependencies:["mission:destroyed:current"] };
  }
  if (c.kind === "ACTION_COMPLETED") {
    const matches = turnEvents.filter(e => e.kind === "actionCompleted" && e.side === side && (!c.actionName || e.actionName?.toLowerCase() === c.actionName.toLowerCase()));
    return { status: matches.length ? "PASS" : "FAIL", value: matches.length, dependencies:["mission:action:"+String(c.actionName ?? "any").toLowerCase()] };
  }
  if (c.kind === "OPERATION_MARKER_COUNT") {
    const matches = runtime.missionEvents.filter(e => e.kind === "operationMarker" && e.side === side && (!c.markerLocation || e.markerLocation === c.markerLocation));
    const value = matches.length;
    return { status: value >= (c.count ?? 1) ? "PASS" : "FAIL", value, dependencies:["mission:operation-markers"] };
  }
  const mine = controlled(runtime, side);
  if (c.kind === "CONTROL_MORE_OBJECTIVES") {
    if (Object.values(runtime.objectives).some(o => o.status !== "CONFIRMED")) return { status:"UNKNOWN", dependencies:deps, reason:"Objective control is not confirmed for the comparison." };
    const theirs = controlled(runtime, side === "me" ? "opponent" : "me");
    return { status: mine.length > theirs.length ? "PASS" : "FAIL", value: mine.length, dependencies:deps };
  }
  if (c.kind === "CONTROL_OBJECTIVE" && c.objectiveId) {
    const target = Object.values(runtime.objectives).find(o =>
      c.objectiveId === "MY_HOME" ? o.definition.kind === "home" && o.definition.owner === side :
      c.objectiveId === "OPPONENT_HOME" ? o.definition.kind === "home" && o.definition.owner !== side :
      o.definition.id === c.objectiveId);
    if (!target) return { status:"UNKNOWN", dependencies:deps, reason:"Required objective does not exist." };
    if (target.status !== "CONFIRMED") return { status:"UNKNOWN", dependencies:["objective:"+target.definition.id], reason:"Required objective control is not confirmed." };
    return { status:target.controller === side ? "PASS":"FAIL", value:target.controller === side ? 1:0, dependencies:["objective:"+target.definition.id] };
  }
  if (c.requiresHomeControl) {
    const home = Object.values(runtime.objectives).find(o => o.definition.kind === "home" && o.definition.owner === side);
    if (!home || home.status !== "CONFIRMED") return { status:"UNKNOWN", dependencies: home ? ["objective:"+home.definition.id] : deps, reason:"Required home-objective control is not confirmed." };
    if (home.controller !== side) return { status:"FAIL", value:0, dependencies:["objective:"+home.definition.id], reason:"Home objective is not controlled." };
  }
  const relevant = Object.values(runtime.objectives).filter(o => {
    if (c.excludeHome && o.definition.kind === "home" && o.definition.owner === side) return false;
    if (c.territory && o.definition.territory !== (c.territory === "opponent" ? (side === "me" ? "opponent" : "me") : side)) return false;
    return !c.objectiveKind || o.definition.kind === c.objectiveKind;
  });
  const matching = relevant.filter(o => o.status === "CONFIRMED" && o.controller === side);
  const unknown = relevant.filter(o => o.status !== "CONFIRMED");

  // "Each" conditions need the complete relevant set because an unknown
  // objective could increase the VP amount even when a confirmed match exists.
  if (c.each) {
    if (unknown.length) {
      return { status:"UNKNOWN", value:matching.length, dependencies:unknown.map(o => "objective:"+o.definition.id), reason:"Additional objective control data could change the VP amount." };
    }
    return { status:"PASS", value:matching.length, dependencies:relevant.map(o => "objective:"+o.definition.id) };
  }

  const requiredCount = c.count ?? 1;
  if (matching.length >= requiredCount) {
    return { status:"PASS", value:matching.length, dependencies:matching.map(o => "objective:"+o.definition.id) };
  }

  const confirmed = relevant.filter(o => o.status === "CONFIRMED");
  if (c.count != null && confirmed.length >= requiredCount) {
    return { status:"FAIL", value:matching.length, dependencies:confirmed.map(o => "objective:"+o.definition.id) };
  }

  if (unknown.length) {
    return { status:"UNKNOWN", value:matching.length, dependencies:unknown.map(o => "objective:"+o.definition.id), reason:"Additional objective control data could change this result." };
  }

  return { status:"FAIL", value:matching.length, dependencies:relevant.map(o => "objective:"+o.definition.id) };
}

export function evaluateMissionCondition(runtime: BattleRuntime, side: "me"|"opponent", c: MissionCondition, round=runtime.round, checkpoint:PrimaryCheckpoint="END_OF_TURN"): ConditionResult {
  if (!c.windows.some(w => w.checkpoint === checkpoint && w.rounds.includes(round))) return { status:"FAIL", dependencies:[], reason:"Condition does not score at this checkpoint." };
  return evaluate(runtime, side, c);
}

export function evaluatePrimaryCheckpoint(runtime: BattleRuntime, side:"me"|"opponent", round=runtime.round, checkpoint:PrimaryCheckpoint="END_OF_TURN", alreadyAwardedThisRound=0): PrimaryScorePreview {
  const me = runtime.mission.disposition.me;
  const them = runtime.mission.disposition.opponent;
  const conditions = me && them ? missionConditions(side === "me" ? me : them, side === "me" ? them : me) : [];
  const items = conditions.filter(c => c.windows.some(w => w.checkpoint === checkpoint && w.rounds.includes(round))).map(c => {
    const result = evaluateMissionCondition(runtime, side, c, round, checkpoint);
    const eligibleVp = result.status === "PASS" ? (c.each ? (result.value ?? 0) * c.vp : c.vp) : 0;
    return { conditionId:c.id, sourceText:c.sourceText, eligibleVp, awardedVp:0, overscore:0, status:result.status, dependencies:result.dependencies };
  });
  const requiredObjectiveIds = [...new Set(items.flatMap(i => i.dependencies.filter(d => d.startsWith("objective:")).map(d => d.slice("objective:".length))))];
  const eligibleVp = items.reduce((n,i) => n+i.eligibleVp,0);
  const remainingRoundCap = Math.max(0,15-alreadyAwardedThisRound);
  const awardedVp = Math.min(eligibleVp, remainingRoundCap);
  let remaining = awardedVp;
  const resolved = items.map(i => { const awarded=Math.min(i.eligibleVp,remaining); remaining-=awarded; return {...i,awardedVp:awarded,overscore:i.eligibleVp-awarded}; });
  return { side, round, checkpoint, missionId:runtime.mission.primaryId, items:resolved, eligibleVp, remainingRoundCap, awardedVp, overscore:eligibleVp-awardedVp, unresolved:items.filter(i=>i.status==="UNKNOWN").map(i=>i.sourceText), requiredObjectiveIds };
}
