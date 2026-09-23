import { getDetachment, getFaction } from "@/data/codex";
import type { Disposition, Roster } from "@/data/types";
import { defaultDetachmentIds, tableRoster } from "@/lib/quick-roster";
import { rosterPoints } from "@/lib/validation";

export type ArmySource =
  | { kind: "list"; listId: string }
  | { kind: "codex"; factionId: string; detachmentIds: string[]; disposition: Disposition | null };

export function resolveArmy(source: ArmySource, lists: Roster[]): Roster | null {
  if (source.kind === "list") return lists.find((l) => l.id === source.listId) ?? null;
  return tableRoster(source.factionId, source.detachmentIds, source.disposition);
}

export function sourceKey(source: ArmySource) {
  if (source.kind === "list") return `list:${source.listId}`;
  return `codex:${source.factionId}:${[...source.detachmentIds].sort().join(",")}:${source.disposition ?? ""}`;
}

export function armyTitle(source: ArmySource, lists: Roster[]) {
  if (source.kind === "list") return lists.find((l) => l.id === source.listId)?.name ?? "List";
  return getFaction(source.factionId)?.name ?? "Codex army";
}

export function armyMeta(source: ArmySource, lists: Roster[]) {
  if (source.kind === "list") {
    const roster = lists.find((l) => l.id === source.listId);
    if (!roster) return "";
    const faction = getFaction(roster.factionId)?.name;
    const dets = roster.detachmentIds
      .map((id) => getDetachment(roster.factionId, id)?.name)
      .filter(Boolean)
      .join(" · ");
    return [faction, dets, `${rosterPoints(roster)} pts`].filter(Boolean).join(" · ");
  }
  const faction = getFaction(source.factionId)?.name;
  const dets = source.detachmentIds
    .map((id) => getDetachment(source.factionId, id)?.name)
    .filter(Boolean)
    .join(" · ");
  const disp = source.disposition ?? getDetachment(source.factionId, source.detachmentIds[0] ?? "")?.disposition ?? null;
  return [faction, dets, disp, "Codex"].filter(Boolean).join(" · ");
}

export function defaultCodex(factionId: string): Extract<ArmySource, { kind: "codex" }> {
  const ids = defaultDetachmentIds(factionId);
  const disp = getDetachment(factionId, ids[0] ?? "")?.disposition ?? null;
  return { kind: "codex", factionId, detachmentIds: ids, disposition: disp };
}

