import type { UnitDef } from "@/data/types";

export type RemoteUnit = {
  name: string;
  points: number | null;
  /** False when the catalogue has several disagreeing profiles and none is clearly this datasheet. */
  statsKnown: boolean;
  m: number | null;
  t: number | null;
  sv: number | null;
  w: number | null;
  ld: number | null;
  oc: number | null;
  inv: number | null;
};

export type CodexChange = {
  unitId: string;
  name: string;
  kind: "stat" | "points" | "invuln";
  stat?: "m" | "t" | "sv" | "w" | "ld" | "oc";
  label: string;
  from: number;
  to: number;
};

export type CodexReview = {
  changes: CodexChange[];
  skipped: string[];
  /** Matched, but the catalogue has disagreeing model profiles, so only points were compared. */
  partial: string[];
};

type CharLike = { name?: string; $text?: string; text?: string };
type FoundProfile = { name: string; characteristics: CharLike[] };

/** Catalogue renamed these sheets. Keys and targets are already normalized. */
const NAME_ALIASES: Record<string, string> = {
  "jump pack intercessor squad": "assault intercessors with jump packs",
  "hierophant bio titan": "hierophant",
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function charText(chars: CharLike[] | undefined, name: string): string {
  const found = asArray(chars).find((c) => c?.name === name);
  if (!found) return "";
  return String(found.$text ?? found.text ?? "").trim();
}

function leadingNumber(raw: string): number | null {
  const match = raw.match(/-?\d+/);
  return match ? Number(match[0]) : null;
}

function statSignature(chars: CharLike[]): string {
  return ["M", "T", "Sv", "W", "LD", "OC", "InSv"].map((name) => charText(chars, name)).join("|");
}

function nameScore(profileName: string, entryName: string): number {
  const profile = normName(profileName);
  const entry = normName(entryName);
  if (!profile || !entry) return 0;
  if (profile === entry) return 100;
  const strip = (value: string) => value.replace(/\bsquads?\b/g, " ").replace(/\s+/g, " ").trim();
  const strippedProfile = strip(profile);
  const strippedEntry = strip(entry);
  if (strippedProfile && strippedProfile === strippedEntry) return 90;
  return 0;
}

function readStats(chars: CharLike[]) {
  return {
    m: leadingNumber(charText(chars, "M")),
    t: leadingNumber(charText(chars, "T")),
    sv: leadingNumber(charText(chars, "Sv")),
    w: leadingNumber(charText(chars, "W")),
    ld: leadingNumber(charText(chars, "LD")),
    oc: leadingNumber(charText(chars, "OC")),
    inv: leadingNumber(charText(chars, "InSv")),
  };
}

function pickProfile(entryName: string, found: FoundProfile[]): CharLike[] | null {
  if (!found.length) return null;
  let best = 0;
  for (const profile of found) best = Math.max(best, nameScore(profile.name, entryName));
  const pool = best > 0 ? found.filter((profile) => nameScore(profile.name, entryName) === best) : found;
  const signatures = new Set(pool.map((profile) => statSignature(profile.characteristics)));
  if (signatures.size === 1) return pool[0].characteristics;
  return null;
}

function collectProfiles(entry: Record<string, unknown>, shared: Map<string, FoundProfile>): FoundProfile[] {
  const found: FoundProfile[] = [];
  const walk = (node: unknown) => {
    if (node == null) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    if (record.typeName === "Unit" && record.characteristics != null) {
      const characteristics = asArray(record.characteristics as CharLike[]);
      if (characteristics.length) found.push({ name: String(record.name ?? ""), characteristics });
    }
    if (record.type === "profile" && typeof record.targetId === "string") {
      const linked = shared.get(record.targetId);
      if (linked) found.push(linked);
    }
    for (const [key, value] of Object.entries(record)) {
      if (key === "entryLinks" || key === "catalogueLinks" || key === "categoryLinks") continue;
      walk(value);
    }
  };
  walk(entry);
  return found;
}

function sharedProfiles(catalogue: Record<string, unknown>): Map<string, FoundProfile> {
  const map = new Map<string, FoundProfile>();
  for (const profile of asArray(catalogue.sharedProfiles as Record<string, unknown>[])) {
    if (!profile || profile.typeName !== "Unit" || profile.hidden === true || profile.id == null) continue;
    const characteristics = asArray(profile.characteristics as CharLike[]);
    if (!characteristics.length) continue;
    map.set(String(profile.id), { name: String(profile.name ?? ""), characteristics });
  }
  return map;
}

function pointsOf(entry: Record<string, unknown>): number | null {
  const cost = asArray(entry.costs as { name?: string; value?: number }[]).find((c) => c?.name === "pts");
  if (!cost || cost.value == null || Number.isNaN(Number(cost.value))) return null;
  const points = Number(cost.value);
  return points > 0 ? points : null;
}

export function parseCatalogue(raw: unknown): RemoteUnit[] {
  const catalogue = (raw as { catalogue?: Record<string, unknown> })?.catalogue;
  if (!catalogue) return [];
  const shared = sharedProfiles(catalogue);
  const entries = asArray(catalogue.sharedSelectionEntries as Record<string, unknown>[]);
  const units: RemoteUnit[] = [];
  for (const entry of entries) {
    if ((entry?.type !== "unit" && entry?.type !== "model") || entry.hidden === true) continue;
    const name = String(entry.name ?? "").trim();
    if (!name || /legend/i.test(name)) continue;
    const chars = pickProfile(name, collectProfiles(entry, shared));
    const stats = chars ? readStats(chars) : null;
    units.push({
      name,
      points: pointsOf(entry),
      statsKnown: stats != null,
      m: stats?.m ?? null,
      t: stats?.t ?? null,
      sv: stats?.sv ?? null,
      w: stats?.w ?? null,
      ld: stats?.ld ?? null,
      oc: stats?.oc ?? null,
      inv: stats?.inv ?? null,
    });
  }
  return units;
}

function localNumber(value: number | string | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return leadingNumber(value);
  return null;
}

function indexRemote(remote: RemoteUnit[]): Map<string, RemoteUnit[]> {
  const byName = new Map<string, RemoteUnit[]>();
  for (const unit of remote) {
    const key = normName(unit.name);
    const list = byName.get(key) ?? [];
    list.push(unit);
    byName.set(key, list);
  }
  return byName;
}

function matchesFor(byName: Map<string, RemoteUnit[]>, localName: string): RemoteUnit[] | undefined {
  const direct = byName.get(normName(localName));
  if (direct?.length) return direct;
  const alias = NAME_ALIASES[normName(localName)];
  return alias ? byName.get(alias) : undefined;
}

export function reviewCatalogue(units: UnitDef[], remote: RemoteUnit[]): CodexReview {
  const byName = indexRemote(remote);
  const changes: CodexChange[] = [];
  const skipped: string[] = [];
  const partial: string[] = [];
  for (const unit of units) {
    const matches = matchesFor(byName, unit.name);
    if (!matches || matches.length !== 1) {
      skipped.push(unit.name);
      continue;
    }
    const live = matches[0];
    if (!live.statsKnown) partial.push(unit.name);
    if (live.statsKnown) {
      const stats = [
        ["m", "Move", unit.stats.m, live.m],
        ["t", "Toughness", unit.stats.t, live.t],
        ["sv", "Save", unit.stats.sv, live.sv],
        ["w", "Wounds", unit.stats.w, live.w],
        ["ld", "Leadership", unit.stats.ld, live.ld],
        ["oc", "OC", unit.stats.oc, live.oc],
      ] as const;
      for (const [stat, label, local, next] of stats) {
        const from = localNumber(local);
        if (from == null || next == null || from === next) continue;
        changes.push({ unitId: unit.id, name: unit.name, kind: "stat", stat, label, from, to: next });
      }
      const localInv = unit.invuln ?? null;
      if (live.inv !== localInv && (live.inv != null || localInv != null)) {
        changes.push({
          unitId: unit.id,
          name: unit.name,
          kind: "invuln",
          label: "Invulnerable",
          from: localInv ?? 0,
          to: live.inv ?? 0,
        });
      }
    }
    if (live.points != null && live.points !== unit.points) {
      changes.push({ unitId: unit.id, name: unit.name, kind: "points", label: "Points", from: unit.points, to: live.points });
    }
  }
  return { changes, skipped, partial };
}

export function diffCatalogue(units: UnitDef[], remote: RemoteUnit[]): CodexChange[] {
  return reviewCatalogue(units, remote).changes;
}
