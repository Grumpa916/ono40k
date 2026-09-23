import type { Ability, Detachment, UnitDef, UnitRole, WargearOption, Weapon } from "./types";

export const a = (name: string, text: string): Ability => ({ name, text });

export function det(
  id: string,
  name: string,
  dp: 1 | 2 | 3,
  disposition: Detachment["disposition"],
  uniqueTag: string,
  rule: Ability,
  extras: Partial<Pick<Detachment, "stratagems" | "enhancements">> = {},
): Detachment {
  return {
    id,
    name,
    dp,
    disposition,
    uniqueTag,
    rule,
    stratagems: extras.stratagems ?? [],
    enhancements: extras.enhancements ?? [],
  };
}

export function detPack(
  prefix: string,
  items: Array<{
    id: string;
    name: string;
    dp: 1 | 2 | 3;
    disposition: Detachment["disposition"];
    tag: string;
    rule: Ability;
    strats?: Detachment["stratagems"];
    enh?: Detachment["enhancements"];
  }>,
): Detachment[] {
  return items.map((d) =>
    det(`${prefix}-${d.id}`, d.name, d.dp, d.disposition, d.tag, d.rule, {
      stratagems: d.strats,
      enhancements: d.enh,
    }),
  );
}

type SheetExtra = {
  sizes?: Array<[number, number]>;
  inv?: number;
  fnp?: number;
  r?: Weapon[];
  m?: Weapon[];
  ab?: Ability[];
  lead?: string[];
  transport?: number;
  wargear?: WargearOption[];
};

export function u(
  id: string,
  name: string,
  role: UnitRole,
  points: number,
  stats: UnitDef["stats"],
  keywords: string[],
  extra: SheetExtra = {},
): UnitDef {
  return {
    id,
    name,
    role,
    points,
    stats,
    keywords,
    ranged: extra.r ?? [],
    melee: extra.m ?? [],
    abilities: extra.ab ?? [],
    invuln: extra.inv,
    fnp: extra.fnp,
    leaderOf: extra.lead,
    transport: extra.transport,
    wargear: extra.wargear,
    sizes: extra.sizes?.map(([models, pts]) => ({ models, points: pts })),
  };
}
