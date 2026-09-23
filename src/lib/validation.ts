import { getDetachment, getFaction, getUnit } from "@/data/codex";
import { missionFor } from "@/data/missions";
import { BATTLE_SIZES, type Disposition, type Roster, type RosterUnit, type UnitDef } from "@/data/types";
import { wargearPoints } from "@/data/wargear";

export type Issue = { level: "error" | "warn"; text: string };

export function unitTotalPoints(roster: Roster, ru: RosterUnit): number {
  const faction = getFaction(roster.factionId);
  const def = getUnit(roster.factionId, ru.unitId);
  const enh = ru.enhancementId
    ? faction?.detachments.flatMap((d) => d.enhancements).find((e) => e.id === ru.enhancementId)
    : undefined;
  return ru.points + (enh?.points ?? 0) + (def ? wargearPoints(def, ru.wargearIds) : 0);
}

export function rosterPoints(roster: Roster): number {
  return roster.units.reduce((sum, ru) => sum + unitTotalPoints(roster, ru), 0);
}

export function rosterDp(roster: Roster): number {
  return roster.detachmentIds.reduce((sum, id) => {
    const d = getDetachment(roster.factionId, id);
    return sum + (d?.dp ?? 0);
  }, 0);
}

export function rosterDisposition(roster: Roster): Disposition | null {
  const fromDets = roster.detachmentIds
    .map((id) => getDetachment(roster.factionId, id)?.disposition)
    .filter(Boolean) as Disposition[];
  if (roster.disposition && (fromDets.length === 0 || fromDets.includes(roster.disposition))) {
    return roster.disposition;
  }
  return fromDets[0] ?? roster.disposition ?? null;
}

export function primaryForSide(side: Roster, other: Roster) {
  const a = rosterDisposition(side);
  const b = rosterDisposition(other);
  if (!a || !b) return null;
  return { info: missionFor(a, b).me, mine: a, theirs: b };
}

export function warlord(roster: Roster) {
  return roster.units.find((u) => u.warlord);
}

export function validateRoster(roster: Roster): Issue[] {
  const issues: Issue[] = [];
  const size = BATTLE_SIZES[roster.battleSize];
  const faction = getFaction(roster.factionId);
  if (!faction) {
    issues.push({ level: "error", text: "Unknown faction." });
    return issues;
  }

  const pts = rosterPoints(roster);
  if (pts > size.points) issues.push({ level: "error", text: `${pts} pts exceeds ${size.points} pts limit.` });
  if (pts === 0) issues.push({ level: "warn", text: "List is empty." });

  const dp = rosterDp(roster);
  if (roster.detachmentIds.length === 0) issues.push({ level: "error", text: "Select at least one detachment." });
  if (dp > size.dp) issues.push({ level: "error", text: `${dp} DP spent — budget is ${size.dp}.` });
  if (dp > 3) issues.push({ level: "error", text: `${dp} DP spent — maximum is 3 DP.` });

  const tags = roster.detachmentIds
    .map((id) => getDetachment(roster.factionId, id)?.uniqueTag)
    .filter(Boolean) as string[];
  const dupTag = tags.find((t, i) => tags.indexOf(t) !== i);
  if (dupTag) issues.push({ level: "error", text: `Two detachments share the unique tag “${dupTag}”.` });

  const counts = new Map<string, { n: number; def?: UnitDef }>();
  for (const ru of roster.units) {
    const def = getUnit(roster.factionId, ru.unitId);
    const cur = counts.get(ru.unitId) ?? { n: 0, def };
    cur.n += 1;
    counts.set(ru.unitId, cur);
  }
  for (const [id, { n, def }] of counts) {
    const cap = def?.role === "battleline" ? size.battlelineCopies : size.copies;
    if (n > cap) issues.push({ level: "error", text: `${def?.name ?? id}: ${n} copies (max ${cap}).` });
  }

  const enhCount = roster.units.filter((u) => u.enhancementId).length;
  if (enhCount > size.enhancements) {
    issues.push({ level: "error", text: `${enhCount} enhancements (max ${size.enhancements}).` });
  }

  if (!warlord(roster)) issues.push({ level: "error", text: "Assign a Warlord (a Character)." });

  const detDisps = roster.detachmentIds
    .map((id) => getDetachment(roster.factionId, id)?.disposition)
    .filter(Boolean);
  if (!roster.disposition) issues.push({ level: "warn", text: "Pick a Force Disposition from your detachments before you play." });
  else if (!detDisps.includes(roster.disposition)) {
    issues.push({ level: "error", text: "Force Disposition must come from a selected detachment." });
  }

  return issues;
}
