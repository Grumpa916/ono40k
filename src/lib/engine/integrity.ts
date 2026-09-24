import { FACTIONS, getFaction, getUnit } from "../../data/codex.ts";
import type { Faction, UnitDef, Weapon } from "../../data/types.ts";
import type { CatalogueAudit } from "./types.ts";

const LEGACY_FIELDS = new Set([
  "objectiveRadius",
  "markerDiameter",
  "objectiveMarkerRadius",
  "objectiveMarkerDiameter",
  "objectiveCenterControl",
  "objectiveCenterPoint",
]);

function scanLegacy(value: unknown, path = ""): string[] {
  if (!value || typeof value !== "object") return [];
  const out: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (LEGACY_FIELDS.has(key)) out.push(path + key);
    out.push(...scanLegacy(child, path + key + "."));
  }
  return out;
}

export function validateWeapon(unit: UnitDef, weapon: Weapon, factionId: string) {
  const errors: string[] = [];
  if (!weapon.name.trim()) errors.push(factionId + "/" + unit.id + ": weapon has no name");
  if (weapon.kind === "ranged" && (typeof weapon.range !== "number" || !Number.isFinite(weapon.range) || weapon.range <= 0)) {
    errors.push(factionId + "/" + unit.id + "/" + weapon.name + ": ranged weapon has invalid range");
  }
  if (weapon.kind === "melee" && weapon.range !== "Melee") {
    errors.push(factionId + "/" + unit.id + "/" + weapon.name + ": melee weapon must use Melee range");
  }
  if (!Array.isArray(weapon.keywords)) errors.push(factionId + "/" + unit.id + "/" + weapon.name + ": keywords missing");
  return errors;
}

export function validateUnit(faction: Faction, unit: UnitDef) {
  const errors: string[] = [];
  if (!unit.id || !unit.name) errors.push(faction.id + ": unit has missing identity");
  const oc = typeof unit.stats.oc === "number" ? unit.stats.oc : Number(unit.stats.oc);
  if (!Number.isFinite(oc) || oc < 0) errors.push(faction.id + "/" + unit.id + ": invalid OC");
  if (!Number.isFinite(unit.stats.w) || unit.stats.w <= 0) errors.push(faction.id + "/" + unit.id + ": invalid wounds");

  const weapons = [...unit.ranged, ...unit.melee];
  const names = new Set<string>();
  for (const weapon of weapons) {
    errors.push(...validateWeapon(unit, weapon, faction.id));
    if (names.has(weapon.name)) errors.push(faction.id + "/" + unit.id + ": duplicate weapon " + weapon.name);
    names.add(weapon.name);
  }
  for (const id of unit.leaderOf ?? []) {
    if (!faction.units.some((candidate) => candidate.id === id)) errors.push(faction.id + "/" + unit.id + ": leader target " + id + " does not exist");
  }
  return errors;
}

export function validateCanonicalCatalogue(): CatalogueAudit {
  const errors: string[] = [];
  const warnings: string[] = [];
  let units = 0;
  let weapons = 0;
  for (const faction of FACTIONS) {
    units += faction.units.length;
    for (const unit of faction.units) {
      errors.push(...validateUnit(faction, unit));
      weapons += unit.ranged.length + unit.melee.length;
    }
  }
  errors.push(...scanLegacy(FACTIONS).map((field) => "Legacy objective field detected: " + field));
  return { edition: 11, valid: errors.length === 0, errors, warnings, checkedFactions: FACTIONS.length, checkedUnits: units, checkedWeapons: weapons };
}

export function assertCanonicalCatalogue() {
  const audit = validateCanonicalCatalogue();
  if (!audit.valid) throw new Error("Canonical catalogue invalid: " + audit.errors.join("; "));
  return audit;
}

export function validateUnitReference(factionId: string, unitId: string) {
  return getFaction(factionId) && getUnit(factionId, unitId) ? null : "Unknown unit reference " + factionId + "/" + unitId;
}