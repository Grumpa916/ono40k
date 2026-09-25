import type { UnitDef, WargearOption, Weapon } from "./types";

export type WargearGroup = {
  id: string;
  label: string;
  options: WargearOption[];
};

const GROUP_LABEL: Record<string, string> = {
  loadout: "Loadout",
  sergeant: "Sergeant",
  special: "Special weapon",
  extra: "Wargear",
};

function o(id: string, name: string, points: number, group: string, text?: string): WargearOption {
  return { id, name, points, group, text };
}

const HIDDEN_DEFAULTS = new Set([
  "Standard issue",
  "Listed weapons",
  "Standard biomorphs",
  "As written",
  "Sergeant: as written",
  "No special weapon",
  "No extra weapon",
  "None",
]);

export function isDefaultWargearName(name: string) {
  return HIDDEN_DEFAULTS.has(name);
}

function prefix(unit: UnitDef) {
  return unit.id.split("-")[0] ?? "";
}

function inferred(unit: UnitDef): WargearOption[] {
  const p = prefix(unit);
  const uid = unit.id;
  const epic = unit.keywords.includes("Epic Hero");
  const opts: WargearOption[] = [o(`${uid}-std`, "Standard issue", 0, "loadout", "Weapons as printed on the datasheet.")];

  if (epic) return opts;

  if (p === "sm" || p === "um" || p === "csm") {
    if (unit.role === "character") {
      opts.push(
        o(`${uid}-mc`, "Master-crafted weapon", 10, "loadout"),
        o(`${uid}-relic-w`, "Relic weapon", 15, "loadout"),
        o(`${uid}-char-pp`, "Plasma pistol", 5, "extra"),
        o(`${uid}-char-combi`, "Combi-weapon", 10, "extra"),
      );
      return opts;
    }
    if (unit.role === "battleline" || unit.role === "infantry") {
      const boltLine = /intercessor|infiltrator|scout/.test(uid);
      const sgtLine = /intercessor|legionaries|cultist|sternguard/.test(uid);
      if (boltLine && p !== "csm") {
        opts.push(o(`${uid}-abr`, "Assault bolt rifles", 0, "loadout"), o(`${uid}-hbr`, "Heavy bolt rifles", 5, "loadout"));
      }
      if (p === "csm" && /legionaries|chosen|cultist/.test(uid)) {
        opts.push(o(`${uid}-csm-bolt`, "Boltguns", 0, "loadout"), o(`${uid}-csm-accursed`, "Accursed weapons", 10, "loadout"));
      }
      if (sgtLine) {
        opts.push(
          o(`${uid}-sgt-std`, "Sergeant: as written", 0, "sergeant"),
          o(`${uid}-sgt-pw`, "Sergeant: power weapon", 5, "sergeant"),
          o(`${uid}-sgt-pf`, "Sergeant: power fist", 10, "sergeant"),
          o(`${uid}-sgt-pp`, "Sergeant: plasma pistol", 5, "sergeant"),
          o(`${uid}-sp-none`, "No special weapon", 0, "special"),
          o(`${uid}-sp-plasma`, "Plasma gun", 10, "special"),
          o(`${uid}-sp-melta`, "Meltagun", 10, "special"),
          o(`${uid}-sp-flamer`, "Flamer", 5, "special"),
        );
      }
      return opts;
    }
    if (unit.role === "vehicle" || unit.role === "transport") {
      opts.push(
        o(`${uid}-hk`, "Hunter-killer missile", 5, "extra"),
        o(`${uid}-pintle`, "Pintle storm bolter", 5, "extra"),
        o(`${uid}-onslaught`, "Onslaught gatling cannon", 10, "extra"),
      );
      return opts;
    }
    if (unit.role === "mounted") {
      opts.push(o(`${uid}-mt-plasma`, "Plasma talons", 10, "loadout"), o(`${uid}-mt-melta`, "Multi-meltas", 15, "loadout"));
    }
    return opts;
  }

  if (p === "nids") {
    if (unit.role === "character" || unit.role === "monster") {
      if (/tyrant|exocrine|tyrannofex|trygon|carnifex|maleceptor|norn|hierodule|harridan|hierophant/.test(uid)) {
        opts.push(
          o(`${uid}-hvc`, "Heavy venom cannon", 10, "loadout"),
          o(`${uid}-stc`, "Stranglethorn cannon", 5, "loadout"),
          o(`${uid}-bonesword`, "Bonesword and lash whip", 10, "loadout"),
          o(`${uid}-adrenal`, "Adrenal glands", 10, "extra"),
          o(`${uid}-toxin`, "Toxin sacs", 10, "extra"),
          o(`${uid}-regen`, "Regeneration", 15, "extra"),
        );
      } else {
        opts.push(o(`${uid}-adrenal`, "Adrenal glands", 10, "extra"), o(`${uid}-toxin`, "Toxin sacs", 10, "extra"));
      }
    } else if (/termagant|hormagaunt|gargoyle|neurogaunt/.test(uid)) {
      opts.push(
        o(`${uid}-flesh`, "Fleshborers", 0, "loadout"),
        o(`${uid}-devourer`, "Devourers", 5, "loadout"),
        o(`${uid}-spine`, "Spinefists", 0, "loadout"),
        o(`${uid}-adrenal-g`, "Adrenal glands", 10, "extra"),
        o(`${uid}-toxin-g`, "Toxin sacs", 10, "extra"),
      );
    } else if (/warriors-ranged|hive-guard/.test(uid)) {
      opts.push(
        o(`${uid}-devourer`, "Devourers", 0, "loadout"),
        o(`${uid}-deathspitter`, "Deathspitters", 5, "loadout"),
        o(`${uid}-venom`, "Venom cannon", 10, "special"),
        o(`${uid}-impaler`, "Impaler cannons", 10, "special"),
      );
    } else if (/warriors-melee|tyrant-guard|carnifex/.test(uid)) {
      opts.push(
        o(`${uid}-talons`, "Scything talons", 0, "loadout"),
        o(`${uid}-cleaver`, "Bone cleaver and lash whip", 5, "loadout"),
        o(`${uid}-crush`, "Crushing claws", 10, "loadout"),
      );
    }
    return opts;
  }


  if (p === "tau") {
    if (/crisis|coldstar|stealth/.test(uid)) {
      opts.push(
        o(`${uid}-burst`, "Burst cannon", 0, "loadout"),
        o(`${uid}-plasma-r`, "Plasma rifle", 10, "loadout"),
        o(`${uid}-fusion`, "Fusion blaster", 15, "loadout"),
        o(`${uid}-missile`, "Missile pod", 10, "loadout"),
        o(`${uid}-shield`, "Shield generator", 10, "extra"),
        o(`${uid}-sts`, "Support turret", 5, "extra"),
      );
    } else if (unit.role === "battleline") {
      opts.push(o(`${uid}-pulse`, "Pulse rifles", 0, "loadout"), o(`${uid}-carbine`, "Pulse carbines", 0, "loadout"), o(`${uid}-marker`, "Markerlight", 5, "extra"));
    }
    return opts;
  }

  if (p === "custodes") {
    if (/guard|wardens|allarus|shield-captain|blade-champion/.test(uid)) {
      opts.push(
        o(`${uid}-spear`, "Guardian spears", 0, "loadout"),
        o(`${uid}-sword`, "Sentinel blades", 0, "loadout"),
        o(`${uid}-axe`, "Castellan axes", 5, "loadout"),
        o(`${uid}-misericordia`, "Misericordia", 5, "extra"),
      );
    }
    return opts;
  }

  if (unit.role === "vehicle" || unit.role === "transport") {
    opts.push(o(`${uid}-hk`, "Hunter-killer missile", 5, "extra"), o(`${uid}-pintle`, "Pintle weapon", 5, "extra"));
  }
  return opts;
}

function choiceLoadouts(unit: UnitDef): WargearOption[] {
  const groups = new Map<string, Weapon[]>();
  for (const weapon of [...unit.ranged, ...unit.melee]) {
    if (!weapon.choice) continue;
    const list = groups.get(weapon.choice) ?? [];
    list.push(weapon);
    groups.set(weapon.choice, list);
  }
  const opts: WargearOption[] = [];
  for (const [group, weapons] of groups) {
    weapons.forEach((weapon, index) => opts.push(o(`${unit.id}-${group}-${index}`, weapon.name, 0, "loadout")));
  }
  return opts;
}

export function wargearGroups(unit: UnitDef): WargearGroup[] {
  const choices = choiceLoadouts(unit);
  const extra = inferred(unit).filter((opt) => choices.length === 0 || opt.group !== "loadout");
  const all = [...choices, ...extra, ...(unit.wargear ?? [])];
  const map = new Map<string, WargearOption[]>();
  for (const opt of all) {
    const arr = map.get(opt.group) ?? [];
    if (!arr.some((x) => x.id === opt.id)) arr.push(opt);
    map.set(opt.group, arr);
  }
  return [...map.entries()]
    .map(([id, options]) => {
      const list = options.some((opt) => opt.points === 0) ? options : [o(`${unit.id}-${id}-none`, "None", 0, id), ...options];
      return { id, label: GROUP_LABEL[id] ?? id, options: list };
    })
    .filter((g) => g.options.length > 0);
}

function sameName(a: string, b: string) {
  const left = a.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const right = b.toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (left.length < 4 || right.length < 4) return false;
  return left.includes(right) || right.includes(left);
}

/** Weapons this roster entry is actually carrying. Codex sheets omit wargearIds and keep every profile. */
export function builtWeapons(unit: UnitDef, wargearIds: string[] | undefined): { ranged: Weapon[]; melee: Weapon[] } {
  const selected = new Set(selectedWargear(unit, wargearIds).map((opt) => opt.name));
  const loadoutNames = wargearGroups(unit)
    .filter((group) => group.id === "loadout")
    .flatMap((group) => group.options.map((opt) => opt.name))
    .filter((name) => !isDefaultWargearName(name));
  const keep = (weapon: Weapon, siblings: Weapon[]) => {
    if (weapon.choice) {
      const options = siblings.filter((other) => other.choice === weapon.choice);
      const picked = options.find((other) => [...selected].some((name) => sameName(name, other.name)));
      return (picked ?? options[0]) === weapon;
    }
    const named = loadoutNames.filter((name) => sameName(name, weapon.name));
    if (named.length === 0) return true;
    const active = [...selected].find((name) => named.some((option) => sameName(name, option)));
    if (active) return sameName(active, weapon.name);
    return sameName(named[0], weapon.name);
  };
  return {
    ranged: unit.ranged.filter((weapon) => keep(weapon, unit.ranged)),
    melee: unit.melee.filter((weapon) => keep(weapon, unit.melee)),
  };
}

export function resolvedWargearIds(unit: UnitDef, ids?: string[]): string[] {
  const set = new Set(ids ?? []);
  return wargearGroups(unit).map((g) => {
    const hit = g.options.find((opt) => set.has(opt.id));
    if (hit) return hit.id;
    return (g.options.find((opt) => opt.points === 0) ?? g.options[0]).id;
  });
}

export function selectedWargear(unit: UnitDef, ids?: string[]): WargearOption[] {
  const set = new Set(resolvedWargearIds(unit, ids));
  return wargearGroups(unit).flatMap((g) => g.options.filter((opt) => set.has(opt.id)));
}

export function wargearPoints(unit: UnitDef, ids?: string[]): number {
  return selectedWargear(unit, ids).reduce((sum, opt) => sum + opt.points, 0);
}

export function wargearSummary(unit: UnitDef, ids?: string[]): WargearOption[] {
  return selectedWargear(unit, ids).filter((opt) => !isDefaultWargearName(opt.name));
}

export function rosterLoadout(unit: UnitDef, ids?: string[]): string {
  const equipped = builtWeapons(unit, ids ?? []);
  const weapons = [...equipped.ranged, ...equipped.melee].map((wpn) => wpn.name);
  const extras = wargearSummary(unit, ids).map((g) => (g.points ? `${g.name} +${g.points}` : g.name));
  return [...weapons, ...extras].filter(Boolean).join(" · ");
}

export function setWargearGroup(unit: UnitDef, current: string[] | undefined, groupId: string, optionId: string): string[] {
  const groups = wargearGroups(unit);
  const group = groups.find((g) => g.id === groupId);
  const resolved = resolvedWargearIds(unit, current);
  const next = resolved.filter((id) => !group?.options.some((opt) => opt.id === id));
  next.push(optionId);
  return next;
}

const SPEND_ORDER = ["special", "loadout", "extra", "sergeant"];

export type LoadoutStrategy = "stock" | "leftover" | "maxed";

export function optimizeLoadout(unit: UnitDef, budget: number, strategy: LoadoutStrategy): string[] {
  const groups = [...wargearGroups(unit)].sort((a, b) => {
    const ia = SPEND_ORDER.indexOf(a.id);
    const ib = SPEND_ORDER.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  const picks: string[] = [];
  let left = Math.max(0, budget);
  for (const g of groups) {
    const zero = g.options.find((opt) => opt.points === 0) ?? g.options[0];
    let pick = zero;
    if (strategy === "maxed") {
      pick = g.options.reduce((best, opt) => (opt.points > best.points ? opt : best), zero);
    } else if (strategy === "leftover") {
      const affordable = g.options.filter((opt) => opt.points <= left);
      if (affordable.length) {
        pick = affordable.reduce((best, opt) => (opt.points > best.points ? opt : best), affordable[0]);
      }
    }
    picks.push(pick.id);
    if (strategy !== "maxed") left -= pick.points;
  }
  return picks;
}
