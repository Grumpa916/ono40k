import type { UnitDef, Weapon } from "@/data/types";

export function expectedDice(expr: number | string): number {
  if (typeof expr === "number") return expr;
  const s = expr.replace(/\s/g, "").toUpperCase();
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 1;
  }
  const count = m[1] ? Number(m[1]) : 1;
  const faces = Number(m[2]);
  const mod = m[3] ? Number(m[3]) : 0;
  return count * ((faces + 1) / 2) + mod;
}

export function rollExpr(expr: number | string): number {
  if (typeof expr === "number") return expr;
  const s = expr.replace(/\s/g, "").toUpperCase();
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) ? n : 1;
  }
  const count = m[1] ? Number(m[1]) : 1;
  const faces = Number(m[2]);
  const mod = m[3] ? Number(m[3]) : 0;
  let total = 0;
  for (let i = 0; i < count; i++) total += 1 + Math.floor(Math.random() * faces);
  return total + mod;
}

function d6() {
  return 1 + Math.floor(Math.random() * 6);
}

function clampChance(p: number) {
  return Math.min(1, Math.max(0, p));
}

export function hitChance(skill: number, mod: number, torrent: boolean): number {
  if (torrent) return 1;
  const needed = skill - mod;
  if (needed <= 1) return 5 / 6;
  if (needed >= 7) return 1 / 6;
  return (7 - needed) / 6;
}

export function woundOn(strength: number, toughness: number): number {
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5;
}

export function antiWoundOn(weapon: Weapon, target: UnitDef): number | null {
  let best: number | null = null;
  for (const k of weapon.keywords) {
    const m = k.match(/^Anti-(.+)\s+(\d+)\+$/i);
    if (!m) continue;
    const tag = m[1];
    if (target.keywords.some((tk) => tk === tag || tk.startsWith(tag) || tag.startsWith(tk))) {
      const n = Number(m[2]);
      best = best === null ? n : Math.min(best, n);
    }
  }
  return best;
}

export function woundChance(strength: number, toughness: number, mod: number, weapon?: Weapon, target?: UnitDef): number {
  let needed = woundOn(strength, toughness);
  if (weapon && target) {
    const anti = antiWoundOn(weapon, target);
    if (anti !== null) needed = Math.min(needed, anti);
  }
  needed -= mod;
  if (needed <= 1) return 5 / 6;
  if (needed >= 7) return 1 / 6;
  return (7 - needed) / 6;
}

/** 11th edition: Cover no longer improves the save — it is a −1 to hit. */
export function saveChance(sv: number, ap: number, invuln?: number | null): number {
  const needed = sv - ap;
  let p = needed >= 7 ? 0 : needed <= 1 ? 5 / 6 : (7 - needed) / 6;
  if (invuln) {
    const ip = invuln <= 1 ? 5 / 6 : (7 - invuln) / 6;
    p = Math.max(p, ip);
  }
  return clampChance(p);
}

export function saveNeeded(sv: number, ap: number, invuln?: number | null): { armour: number; used: number; invuln?: number } {
  const armour = sv - ap;
  if (invuln && (armour > invuln || armour > 6)) {
    return { armour, used: invuln, invuln };
  }
  return { armour, used: armour, invuln: invuln ?? undefined };
}

export type MathContext = {
  hitMod: number;
  woundMod: number;
  cover: boolean;
  plunging: boolean;
  extraAttacks: number;
  halfRangeMelta: boolean;
  targetModels: number;
  rerollHitOnes: boolean;
  rerollAllHits: boolean;
  rerollWoundOnes: boolean;
  stationary: boolean;
  /** `null` = none; omit to use the datasheet. */
  invuln?: number | null;
  fnp?: number | null;
};

export const defaultMathContext = (): MathContext => ({
  hitMod: 0,
  woundMod: 0,
  cover: false,
  plunging: false,
  extraAttacks: 0,
  halfRangeMelta: false,
  targetModels: 5,
  rerollHitOnes: false,
  rerollAllHits: false,
  rerollWoundOnes: false,
  stationary: false,
});

export type MathResult = {
  attacks: number;
  hits: number;
  wounds: number;
  unsaved: number;
  damage: number;
  modelsKilled: number;
  lethalHits: number;
  devWounds: number;
  hitModApplied: number;
  pHit: number;
  pWound: number;
  pFailSave: number;
  hitOn: number;
  woundOnValue: number;
  saveOn: number;
};

function resolveInvuln(target: UnitDef, ctx: MathContext): number | undefined {
  if (ctx.invuln === null) return undefined;
  if (typeof ctx.invuln === "number") return ctx.invuln;
  return target.invuln;
}

function resolveFnp(target: UnitDef, ctx: MathContext): number | undefined {
  if (ctx.fnp === null) return undefined;
  if (typeof ctx.fnp === "number") return ctx.fnp;
  return target.fnp;
}

function weaponHitMod(weapon: Weapon, ctx: MathContext): number {
  let hitMod = ctx.hitMod;
  if (weapon.kind === "ranged") {
    const ignoresCover = weapon.keywords.includes("Ignores Cover");
    if (ctx.cover && !ignoresCover) hitMod -= 1;
    if (ctx.plunging) hitMod += 1;
  }
  if (ctx.stationary && weapon.keywords.includes("Heavy")) hitMod += 1;
  return hitMod;
}

function attacksFor(weapon: Weapon, models: number, ctx: MathContext): number {
  let attacks = expectedDice(weapon.attacks) * models + ctx.extraAttacks;
  if (weapon.keywords.includes("Blast")) attacks += Math.floor(ctx.targetModels / 5);
  const rapid = weapon.keywords.find((k) => k.startsWith("Rapid Fire"));
  if (rapid && ctx.halfRangeMelta) {
    const extra = rapid.replace("Rapid Fire", "").trim();
    attacks += extra ? expectedDice(Number(extra) || extra) * models : expectedDice(weapon.attacks) * models;
  }
  return attacks;
}

function applyHitReroll(pHit: number, skill: number, hitMod: number, torrent: boolean, ctx: MathContext): number {
  if (torrent) return pHit;
  if (ctx.rerollAllHits) return 1 - (1 - pHit) * (1 - pHit);
  if (ctx.rerollHitOnes) return pHit + (1 / 6) * hitChance(skill, hitMod, false);
  return pHit;
}

function applyWoundReroll(pWound: number, ctx: MathContext, twin: boolean): number {
  let p = pWound;
  if (ctx.rerollWoundOnes) p = p + (1 / 6) * pWound;
  if (twin) p = 1 - (1 - p) * (1 - p);
  return clampChance(p);
}

export function expectedDamage(weapon: Weapon, models: number, target: UnitDef, ctx: MathContext): MathResult {
  const torrent = weapon.keywords.some((k) => k === "Torrent");
  const lethal = weapon.keywords.some((k) => k.startsWith("Lethal"));
  const sustained = weapon.keywords.find((k) => k.startsWith("Sustained Hits"));
  const sustainedN = sustained ? Number(sustained.replace(/[^\d]/g, "") || "1") : 0;
  const twin = weapon.keywords.includes("Twin-linked");
  const dev = weapon.keywords.includes("Devastating Wounds");
  const melta = weapon.keywords.find((k) => k.startsWith("Melta"));
  const invuln = resolveInvuln(target, ctx);
  const fnp = resolveFnp(target, ctx);

  const attacks = attacksFor(weapon, models, ctx);
  const hitMod = weaponHitMod(weapon, ctx);
  const pHit = applyHitReroll(hitChance(weapon.skill, hitMod, torrent), weapon.skill, hitMod, torrent, ctx);

  let hits = attacks * pHit;
  if (sustainedN) hits += attacks * (1 / 6) * sustainedN;
  const sixes = attacks * (1 / 6);
  const lethalHits = lethal ? sixes : 0;
  const toWoundHits = Math.max(0, hits - lethalHits);

  const neededWound = (() => {
    let n = woundOn(weapon.strength, target.stats.t);
    const anti = antiWoundOn(weapon, target);
    if (anti !== null) n = Math.min(n, anti);
    return n - ctx.woundMod;
  })();

  const pWound = applyWoundReroll(woundChance(weapon.strength, target.stats.t, ctx.woundMod, weapon, target), ctx, twin);
  const wounds = toWoundHits * pWound + lethalHits;

  const save = saveNeeded(target.stats.sv, weapon.ap, invuln);
  const pSave = saveChance(target.stats.sv, weapon.ap, invuln);
  let unsaved = wounds * (1 - pSave);
  const critWounds = dev ? toWoundHits * pWound * (1 / 6) : 0;
  if (dev) unsaved = (wounds - critWounds) * (1 - pSave) + critWounds;

  if (fnp) {
    const pFnp = (7 - fnp) / 6;
    unsaved *= 1 - pFnp;
  }

  let dmg = expectedDice(weapon.damage);
  if (melta && ctx.halfRangeMelta) {
    const extra = Number(melta.replace(/[^\d]/g, "") || "2");
    dmg += extra;
  }
  const damage = unsaved * dmg;
  const woundsPerModel = typeof target.stats.w === "number" ? target.stats.w : 1;
  const modelsKilled = damage / Math.max(1, woundsPerModel);

  const hitOn = torrent ? 0 : Math.max(2, Math.min(6, weapon.skill - hitMod));

  return {
    attacks,
    hits,
    wounds,
    unsaved,
    damage,
    modelsKilled,
    lethalHits,
    devWounds: critWounds,
    hitModApplied: hitMod,
    pHit,
    pWound,
    pFailSave: 1 - pSave,
    hitOn,
    woundOnValue: Math.max(2, Math.min(6, neededWound)),
    saveOn: save.used,
  };
}

export type WeaponFire = { weapon: Weapon; models: number };

export type VolleyResult = MathResult & {
  parts: Array<MathResult & { name: string; kind: Weapon["kind"] }>;
};

export function expectedVolley(fires: WeaponFire[], target: UnitDef, ctx: MathContext): VolleyResult {
  const parts = fires.map((f) => ({
    name: f.weapon.name,
    kind: f.weapon.kind,
    ...expectedDamage(f.weapon, f.models, target, ctx),
  }));
  const sum = (key: keyof MathResult) => parts.reduce((n, p) => n + (p[key] as number), 0);
  const first = parts[0];
  return {
    attacks: sum("attacks"),
    hits: sum("hits"),
    wounds: sum("wounds"),
    unsaved: sum("unsaved"),
    damage: sum("damage"),
    modelsKilled: sum("modelsKilled"),
    lethalHits: sum("lethalHits"),
    devWounds: sum("devWounds"),
    hitModApplied: first?.hitModApplied ?? 0,
    pHit: first?.pHit ?? 0,
    pWound: first?.pWound ?? 0,
    pFailSave: first?.pFailSave ?? 0,
    hitOn: first?.hitOn ?? 0,
    woundOnValue: first?.woundOnValue ?? 0,
    saveOn: first?.saveOn ?? 0,
    parts,
  };
}

export type SimResult = {
  meanDamage: number;
  meanSlain: number;
  wipeChance: number;
  slainHist: number[];
  damageHist: number[];
  iterations: number;
};

function hitSucceeds(roll: number, needed: number, torrent: boolean): boolean {
  if (torrent) return true;
  if (roll === 1) return false;
  if (roll === 6) return true;
  return roll >= needed;
}

function woundSucceeds(roll: number, needed: number): boolean {
  if (roll === 1) return false;
  if (roll === 6) return true;
  return roll >= needed;
}

function saveSucceeds(roll: number, needed: number): boolean {
  if (needed > 6) return false;
  if (roll === 1) return false;
  return roll >= needed;
}

type SimState = { modelsLeft: number; woundsOnCurrent: number; rawDamage: number };

function rollHit(needed: number, torrent: boolean, ctx: MathContext): { hit: boolean; crit: boolean } {
  if (torrent) return { hit: true, crit: false };
  let roll = d6();
  const miss = !hitSucceeds(roll, needed, false);
  if (miss) {
    if (ctx.rerollAllHits || (ctx.rerollHitOnes && roll === 1)) {
      roll = d6();
      if (!hitSucceeds(roll, needed, false)) return { hit: false, crit: false };
    } else {
      return { hit: false, crit: false };
    }
  }
  return { hit: true, crit: roll === 6 };
}

function rollWound(needed: number, twin: boolean, ctx: MathContext): { wound: boolean; crit: boolean } {
  const tryOnce = (): { ok: boolean; roll: number } => {
    let roll = d6();
    if (!woundSucceeds(roll, needed) && ctx.rerollWoundOnes && roll === 1) roll = d6();
    return { ok: woundSucceeds(roll, needed), roll };
  };
  let attempt = tryOnce();
  if (!attempt.ok && twin) attempt = tryOnce();
  return { wound: attempt.ok, crit: attempt.ok && attempt.roll === 6 };
}

function simulateWeapon(weapon: Weapon, models: number, target: UnitDef, ctx: MathContext, state: SimState) {
  const torrent = weapon.keywords.some((k) => k === "Torrent");
  const lethal = weapon.keywords.some((k) => k.startsWith("Lethal"));
  const sustained = weapon.keywords.find((k) => k.startsWith("Sustained Hits"));
  const sustainedN = sustained ? Number(sustained.replace(/[^\d]/g, "") || "1") : 0;
  const twin = weapon.keywords.includes("Twin-linked");
  const dev = weapon.keywords.includes("Devastating Wounds");
  const melta = weapon.keywords.find((k) => k.startsWith("Melta"));
  const hitMod = weaponHitMod(weapon, ctx);
  const neededHit = weapon.skill - hitMod;
  let neededWound = woundOn(weapon.strength, target.stats.t);
  const anti = antiWoundOn(weapon, target);
  if (anti !== null) neededWound = Math.min(neededWound, anti);
  neededWound -= ctx.woundMod;
  const invuln = resolveInvuln(target, ctx);
  const fnpNeeded = resolveFnp(target, ctx);
  const save = saveNeeded(target.stats.sv, weapon.ap, invuln);

  let attacks = rollExpr(weapon.attacks) * models + ctx.extraAttacks;
  if (weapon.keywords.includes("Blast")) attacks += Math.floor(ctx.targetModels / 5);
  const rapid = weapon.keywords.find((k) => k.startsWith("Rapid Fire"));
  if (rapid && ctx.halfRangeMelta) {
    const extra = rapid.replace("Rapid Fire", "").trim();
    attacks += extra ? rollExpr(Number(extra) || extra) * models : rollExpr(weapon.attacks) * models;
  }

  const woundsPerModel = typeof target.stats.w === "number" ? target.stats.w : 1;

  const applyDamage = (pts: number) => {
    let remaining = pts;
    if (fnpNeeded) {
      let kept = 0;
      for (let i = 0; i < remaining; i++) if (d6() < fnpNeeded) kept += 1;
      remaining = kept;
    }
    state.rawDamage += remaining;
    while (remaining > 0 && state.modelsLeft > 0) {
      const taken = Math.min(remaining, state.woundsOnCurrent);
      state.woundsOnCurrent -= taken;
      remaining -= taken;
      if (state.woundsOnCurrent <= 0) {
        state.modelsLeft -= 1;
        remaining = 0;
        state.woundsOnCurrent = woundsPerModel;
      }
    }
  };

  for (let a = 0; a < attacks; a++) {
    if (state.modelsLeft <= 0) return;
    const { hit, crit } = rollHit(neededHit, torrent, ctx);
    if (!hit) continue;
    const extraHits = crit && sustainedN ? sustainedN : 0;

    const resolveHit = (autoWound: boolean) => {
      if (state.modelsLeft <= 0) return;
      if (!autoWound) {
        const { wound, crit: critWound } = rollWound(neededWound, twin, ctx);
        if (!wound) return;
        if (dev && critWound) {
          let dmg = rollExpr(weapon.damage);
          if (melta && ctx.halfRangeMelta) dmg += Number(melta.replace(/[^\d]/g, "") || "2");
          applyDamage(dmg);
          return;
        }
      }
      if (saveSucceeds(d6(), save.used)) return;
      let dmg = rollExpr(weapon.damage);
      if (melta && ctx.halfRangeMelta) dmg += Number(melta.replace(/[^\d]/g, "") || "2");
      applyDamage(dmg);
    };

    resolveHit(Boolean(lethal && crit));
    for (let e = 0; e < extraHits; e++) resolveHit(false);
  }
}

export function simulateVolley(fires: WeaponFire[], target: UnitDef, ctx: MathContext, iterations = 4000): SimResult {
  const startModels = Math.max(1, ctx.targetModels);
  const woundsPerModel = typeof target.stats.w === "number" ? target.stats.w : 1;
  const slainHist = Array.from({ length: startModels + 1 }, () => 0);
  const damageCounts = new Map<number, number>();
  let totalDamage = 0;
  let totalSlain = 0;
  let wipes = 0;

  for (let i = 0; i < iterations; i++) {
    const state: SimState = { modelsLeft: startModels, woundsOnCurrent: woundsPerModel, rawDamage: 0 };
    for (const fire of fires) simulateWeapon(fire.weapon, fire.models, target, ctx, state);
    const slain = startModels - state.modelsLeft;
    slainHist[slain] += 1;
    damageCounts.set(state.rawDamage, (damageCounts.get(state.rawDamage) ?? 0) + 1);
    totalDamage += state.rawDamage;
    totalSlain += slain;
    if (state.modelsLeft <= 0) wipes += 1;
  }

  const maxDmg = damageCounts.size ? Math.max(...damageCounts.keys()) : 0;
  const damageHist = Array.from({ length: maxDmg + 1 }, (_, n) => damageCounts.get(n) ?? 0);

  return {
    meanDamage: totalDamage / iterations,
    meanSlain: totalSlain / iterations,
    wipeChance: wipes / iterations,
    slainHist,
    damageHist,
    iterations,
  };
}

export function formatNum(n: number, digits = 2) {
  if (!Number.isFinite(n)) return "–";
  return n.toFixed(digits).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function formatPct(n: number) {
  if (!Number.isFinite(n)) return "–";
  return `${(n * 100).toFixed(n >= 0.1 ? 0 : 1)}%`;
}
