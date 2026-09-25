import type { Detachment, Faction, UnitDef } from "./types";
import { chaosSpaceMarines } from "./factions/chaos-space-marines";
import { custodes } from "./factions/custodes";
import { spaceMarines } from "./factions/space-marines";
import { tauEmpire } from "./factions/tau";
import { tyranids } from "./factions/tyranids";
import { ultramarines } from "./factions/ultramarines";
import { applyUnitPatch, useCodexSync } from "@/lib/codex-sync";

export const FACTIONS: Faction[] = [
  spaceMarines,
  ultramarines,
  custodes,
  chaosSpaceMarines,
  tyranids,
  tauEmpire,
];

export const FACTION_BY_ID: Record<string, Faction> = Object.fromEntries(FACTIONS.map((f) => [f.id, f]));

const UNIT_BY_KEY = new Map<string, UnitDef>();
const DET_BY_KEY = new Map<string, Detachment>();
for (const faction of FACTIONS) {
  for (const unit of faction.units) UNIT_BY_KEY.set(`${faction.id}:${unit.id}`, unit);
  for (const det of faction.detachments) DET_BY_KEY.set(`${faction.id}:${det.id}`, det);
}

export function getFaction(id: string): Faction | undefined {
  return FACTION_BY_ID[id];
}

export function getUnit(factionId: string, unitId: string): UnitDef | undefined {
  const unit = UNIT_BY_KEY.get(`${factionId}:${unitId}`);
  if (!unit) return undefined;
  return applyUnitPatch(unit, useCodexSync.getState().patches[factionId]?.[unitId]);
}

export function withCodexPatches(faction: Faction): Faction {
  const bag = useCodexSync.getState().patches[faction.id];
  if (!bag) return faction;
  return { ...faction, units: faction.units.map((unit) => applyUnitPatch(unit, bag[unit.id])) };
}

export function getDetachment(factionId: string, detId: string): Detachment | undefined {
  return DET_BY_KEY.get(`${factionId}:${detId}`);
}

export function allUnits(): Array<UnitDef & { factionId: string; factionName: string; accent: string }> {
  return FACTIONS.flatMap((f) => f.units.map((u) => ({ ...u, factionId: f.id, factionName: f.name, accent: f.accent })));
}
