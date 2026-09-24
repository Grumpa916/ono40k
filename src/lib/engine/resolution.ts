import type { UnitDef, Weapon } from "@/data/types";
import type { ResolutionResult, RuleEffect, RuntimeUnit } from "./types";

function numeric(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function unknown(reason: string, dependencies: string[], provenance: string[]): ResolutionResult<never> {
  return { status: "UNKNOWN", dependencies, provenance, reason };
}

export function resolveEffectiveNumber(base: number | string | undefined, dependencyKey: string, effects: RuleEffect[] = []): ResolutionResult<number> {
  const n = numeric(base);
  const dependencies = [dependencyKey, ...effects.map((e) => "effect:" + e.id)];
  if (n == null) return unknown("Base value is missing or non-numeric.", dependencies, ["base profile"]);
  const relevant = effects.filter((e) => e.target === dependencyKey || e.target === "*");
  let value = n;
  const provenance = ["base=" + n];
  for (const effect of relevant) if (effect.kind === "SET" && effect.value !== undefined) value = effect.value;
  for (const effect of relevant) {
    if (effect.kind === "ADD" && effect.value !== undefined) value += effect.value;
    if (effect.kind === "MULTIPLY" && effect.value !== undefined) value *= effect.value;
    if (effect.kind === "CAP" && effect.value !== undefined) value = Math.min(value, effect.value);
    if (effect.kind === "FLOOR" && effect.value !== undefined) value = Math.max(value, effect.value);
  }
  provenance.push("effective=" + value);
  return { status: "RESOLVED", value, dependencies, provenance };
}

export function resolveModelOc(unit: RuntimeUnit, effects: RuleEffect[] = []) {
  const baseDependencies = ["unit:" + unit.rosterUnit.id + ":oc", "unit:" + unit.rosterUnit.id + ":battle-shocked"];
  if (unit.battleShocked) {
    return { status: "RESOLVED" as const, value: 0, dependencies: baseDependencies, provenance: ["battle-shocked => OC 0"] };
  }
  const result = resolveEffectiveNumber(unit.definition.stats.oc, baseDependencies[0]!, effects);
  return { ...result, dependencies: [...new Set([...result.dependencies, ...baseDependencies.slice(1)])] };
}

export function resolveWeapon(unit: RuntimeUnit, weaponName: string, effects: RuleEffect[] = []): ResolutionResult<Weapon> {
  const weapon = [...unit.definition.ranged, ...unit.definition.melee].find((item) => item.name === weaponName);
  const dependencies = ["unit:" + unit.rosterUnit.id, "catalogue:weapon:" + unit.definition.id + ":" + weaponName];
  if (!weapon) return unknown("Weapon is not present in the canonical unit profile.", dependencies, ["canonical weapon registry"]);
  const relevant = effects.filter((e) => e.target === "weapon:" + weaponName || e.target === "*");
  if (relevant.some((e) => e.kind === "UNAVAILABLE" || e.kind === "RESTRICTION")) {
    return unknown("Weapon availability is restricted by an active rule.", dependencies, ["canonical weapon registry"]);
  }
  if (weapon.kind === "ranged" && typeof weapon.range !== "number") {
    return unknown("Ranged weapon has no numeric range in canonical data.", dependencies, ["canonical weapon registry"]);
  }
  return { status: "RESOLVED", value: weapon, dependencies, provenance: ["canonical weapon registry"] };
}

export function resolveAvailableRangedWeapons(unit: RuntimeUnit, effects: RuleEffect[] = []) {
  return unit.definition.ranged
    .map((weapon) => resolveWeapon(unit, weapon.name, effects))
    .filter((result): result is Extract<ResolutionResult<Weapon>, { status: "RESOLVED" }> => result.status === "RESOLVED");
}

export function resolveUnitComponents(units: RuntimeUnit[]) {
  return units.map((unit) => ({ unitId: unit.rosterUnit.id, attachedTo: unit.attachedTo ?? null, modelsRemaining: unit.modelsRemaining, definitionId: unit.definition.id }));
}

export type CanonicalWeaponCheck = Pick<Weapon, "name" | "kind" | "range"> & { unitId: string };
export function canonicalWeaponChecks(unit: UnitDef): CanonicalWeaponCheck[] {
  return [...unit.ranged, ...unit.melee].map((weapon) => ({ unitId: unit.id, name: weapon.name, kind: weapon.kind, range: weapon.range }));
}