import { getUnit } from "@/data/codex";
import type { PreBattle, Roster, RosterUnit, SideKey, UnitDef } from "@/data/types";

export function defaultPreBattle(): PreBattle {
  return {
    rollOff: null,
    attacker: null,
    deploysFirst: null,
    firstTurn: null,
    mapId: null,
    terrainNote: "",
    formationNote: "",
    scoutIds: [],
    infiltrateIds: [],
  };
}

export type PreAbilityUnit = {
  ru: RosterUnit;
  def: UnitDef;
  scout: boolean;
  infiltrate: boolean;
};

function hasScout(def: UnitDef) {
  return def.keywords.some((k) => /scout/i.test(k)) || def.abilities.some((a) => /scout/i.test(a.name));
}

function hasInfiltrate(def: UnitDef) {
  return def.keywords.some((k) => /infiltrate/i.test(k)) || def.abilities.some((a) => /infiltrate/i.test(a.name));
}

export function preAbilityUnits(roster: Roster): PreAbilityUnit[] {
  const out: PreAbilityUnit[] = [];
  for (const ru of roster.units) {
    const def = getUnit(roster.factionId, ru.unitId);
    if (!def) continue;
    const scout = hasScout(def);
    const infiltrate = hasInfiltrate(def);
    if (scout || infiltrate) out.push({ ru, def, scout, infiltrate });
  }
  return out;
}

export function otherSide(side: SideKey): SideKey {
  return side === "me" ? "opponent" : "me";
}

export function pickAttacker(prev: PreBattle, attacker: SideKey): PreBattle {
  return {
    ...prev,
    attacker,
    deploysFirst: otherSide(attacker),
  };
}
