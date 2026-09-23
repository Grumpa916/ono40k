import { getFaction } from "@/data/codex";
import { BATTLE_SIZES, type Disposition, type Roster, type RosterUnit, type UnitRole } from "@/data/types";
import { rosterDisposition } from "@/lib/validation";
import { uid } from "@/lib/utils";

const ROLE_RANK: Record<UnitRole, number> = {
  character: 0,
  battleline: 1,
  infantry: 2,
  mounted: 3,
  monster: 4,
  vehicle: 5,
  transport: 6,
};

export function defaultDetachmentIds(factionId: string): string[] {
  const faction = getFaction(factionId);
  const first = faction?.detachments[0];
  return first ? [first.id] : [];
}

export function tableRoster(factionId: string, detachmentIds: string[], disposition?: Disposition | null): Roster | null {
  const faction = getFaction(factionId);
  if (!faction) return null;
  const dets = detachmentIds.length ? detachmentIds : defaultDetachmentIds(factionId);
  const units: RosterUnit[] = [...faction.units]
    .sort((a, b) => {
      const ra = ROLE_RANK[a.role] - ROLE_RANK[b.role];
      if (ra) return ra;
      return a.name.localeCompare(b.name);
    })
    .map((u) => {
      const size = u.sizes?.[0];
      return {
        id: uid("u"),
        unitId: u.id,
        models: size?.models ?? 1,
        points: size?.points ?? u.points,
      };
    });
  const warlord =
    units.find((ru) => faction.units.find((u) => u.id === ru.unitId)?.keywords.includes("Epic Hero")) ??
    units.find((ru) => faction.units.find((u) => u.id === ru.unitId)?.role === "character");
  if (warlord) warlord.warlord = true;
  const now = Date.now();
  const roster: Roster = {
    id: uid("tbl"),
    name: faction.name,
    factionId,
    battleSize: "strike",
    pointsLimit: BATTLE_SIZES.strike.points,
    detachmentIds: dets,
    disposition: disposition ?? null,
    units,
    notes: "Table army — full codex, not a built list.",
    favorite: false,
    saved: false,
    createdAt: now,
    updatedAt: now,
  };
  roster.disposition = rosterDisposition(roster);
  return roster;
}
