import { getDetachment, getUnit } from "@/data/codex";
import type { Roster, UnitBattleState, UnitDef } from "@/data/types";

export type StrengthState = {
  belowStarting: boolean;
  atHalf: boolean;
  belowHalf: boolean;
  atOrBelowHalf: boolean;
};

export type WoundEffect = {
  name: string;
  text: string;
  kind: "penalty" | "buff";
};

/** 11th edition: one model uses wounds; a unit uses model count. Odd totals cannot be exactly half. */
export function strengthState(input: {
  modelsStart: number;
  modelsNow: number;
  woundsMax: number;
  woundsNow: number;
  destroyed: boolean;
}): StrengthState {
  if (input.destroyed || input.modelsNow <= 0 || input.woundsNow <= 0) {
    return { belowStarting: false, atHalf: false, belowHalf: false, atOrBelowHalf: false };
  }
  const single = input.modelsStart <= 1;
  const start = single ? input.woundsMax : input.modelsStart;
  const now = single ? input.woundsNow : input.modelsNow;
  const belowStarting = now < start;
  const atHalf = start % 2 === 0 && now === start / 2;
  const belowHalf = now < start / 2;
  return { belowStarting, atHalf, belowHalf, atOrBelowHalf: atHalf || belowHalf };
}

function kindOf(text: string): WoundEffect["kind"] {
  return /−\d|subtract\s+1|-\d to/i.test(text) ? "penalty" : "buff";
}

function shortEffect(text: string): string {
  const has = text.match(/it has ([^.]+)/i)?.[1];
  if (has) return has.replace(/^a /i, "").replace(/\.$/, "");
  const fnp = text.match(/(\d\+\s+Feel No Pain(?:[^.]*)?)/i)?.[1];
  if (fnp) return fnp.replace(/\.$/, "").replace(/\s+while it is below starting strength/i, "");
  const penalty = text.match(/(−\d[^.]*)/)?.[1];
  if (penalty) return penalty.replace(/\.$/, "");
  return text.replace(/\s+/g, " ").slice(0, 90);
}

export function woundEffects(input: {
  unit: UnitDef;
  roster: Roster;
  enemy: Roster | null;
  unitState: Record<string, UnitBattleState>;
  enhancementId?: string;
  state: StrengthState;
  woundsNow: number;
  battleShocked: boolean;
}): WoundEffect[] {
  const { state, unit, woundsNow } = input;
  if (woundsNow <= 0) return [];
  const effects: WoundEffect[] = [];

  if (input.battleShocked) {
    effects.push({ name: "Battle-shock", text: "OC 0 · Stratagems cannot affect this unit", kind: "penalty" });
  } else if (state.atOrBelowHalf) {
    effects.push({ name: "Half-strength", text: "Test Battle-shock", kind: "penalty" });
  }

  for (const ability of unit.abilities) {
    if (/enemy units/i.test(ability.text)) continue;
    const at = ability.text.match(/reduced to (\d+) wounds remaining/i);
    if (at) {
      if (woundsNow <= Number(at[1])) {
        const text = shortEffect(ability.text);
        effects.push({ name: ability.name, text, kind: kindOf(text) });
      }
      continue;
    }
    if (/below half-strength/i.test(ability.text) && state.belowHalf) {
      const text = shortEffect(ability.text);
      effects.push({ name: ability.name, text, kind: kindOf(text) });
    } else if (/below (its |the )?starting strength/i.test(ability.text) && state.belowStarting) {
      const text = shortEffect(ability.text);
      effects.push({ name: ability.name, text, kind: kindOf(text) });
    }
  }

  for (const id of input.roster.detachmentIds) {
    const det = getDetachment(input.roster.factionId, id);
    if (!det) continue;
    const rule = det.rule.text;
    const woundRule = /below (its |the )?starting strength|below half-strength/i.test(rule);
    if (woundRule) {
      const monsterOnly = /monster/i.test(rule);
      const vehicleOnly = /vehicle/i.test(rule) && !monsterOnly;
      const keywordOk =
        (!monsterOnly || unit.keywords.some((k) => k.toLowerCase() === "monster")) &&
        (!vehicleOnly || unit.keywords.some((k) => k.toLowerCase() === "vehicle"));
      if (keywordOk && state.belowStarting && /below (its |the )?starting strength/i.test(rule)) {
        const parts: string[] = [];
        if (/\+1 to Hit/i.test(rule)) parts.push("+1 to Hit");
        if (/\+1 to Wound/i.test(rule)) parts.push("+1 to Wound");
        if (state.belowHalf && /\+1 Attack/i.test(rule)) parts.push("+1 Attack");
        const text = parts.length > 0 ? parts.join(", ") : shortEffect(rule);
        effects.push({ name: det.rule.name, text, kind: kindOf(text) });
      }
    }
    const enh = input.enhancementId ? det.enhancements.find((e) => e.id === input.enhancementId) : undefined;
    if (!enh) continue;
    if (/below (its |the )?starting strength/i.test(enh.text) && state.belowStarting) {
      const text = shortEffect(enh.text);
      effects.push({ name: enh.name, text, kind: kindOf(text) });
    } else if (/below half-strength/i.test(enh.text) && state.belowHalf) {
      const text = shortEffect(enh.text);
      effects.push({ name: enh.name, text, kind: kindOf(text) });
    }
  }

  if (input.enemy && state.belowHalf) {
    const seen = new Set<string>();
    for (const ru of input.enemy.units) {
      if (seen.has(ru.unitId)) continue;
      const st = input.unitState[ru.id];
      if (!st || st.destroyed || st.modelsRemaining <= 0) continue;
      seen.add(ru.unitId);
      const sheet = getUnit(input.enemy.factionId, ru.unitId);
      if (!sheet) continue;
      for (const ability of sheet.abilities) {
        if (!/enemy units/i.test(ability.text) || !/below half-strength/i.test(ability.text)) continue;
        const text = shortEffect(ability.text);
        effects.push({ name: ability.name, text: `${text} if within 6"`, kind: "penalty" });
      }
    }
  }

  return effects;
}
