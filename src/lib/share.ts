import type { Roster } from "@/data/types";

export function encodeRoster(roster: Roster): string {
  const slim = {
    n: roster.name,
    f: roster.factionId,
    b: roster.battleSize,
    p: roster.pointsLimit,
    d: roster.detachmentIds,
    s: roster.disposition,
    u: roster.units.map((u) => [
      u.unitId,
      u.models,
      u.points,
      u.enhancementId ?? "",
      u.attachedTo ?? "",
      u.warlord ? 1 : 0,
      u.notes ?? "",
      u.wargearIds ?? [],
    ]),
    t: roster.notes,
  };
  const json = JSON.stringify(slim);
  const b64 = btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `WL1.${b64}`;
}

export function decodeRoster(code: string): Omit<Roster, "id" | "createdAt" | "updatedAt" | "favorite"> | null {
  const raw = code.trim();
  if (!raw.startsWith("WL1.")) return null;
  try {
    const b64 = raw
      .slice(4)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(escape(atob(pad)));
    const slim = JSON.parse(json) as {
      n: string;
      f: string;
      b: Roster["battleSize"];
      p: number;
      d: string[];
      s: Roster["disposition"];
      u: Array<[string, number, number, string, string, number, string?, string[]?]>;
      t: string;
    };
    return {
      name: slim.n,
      factionId: slim.f,
      battleSize: slim.b,
      pointsLimit: slim.p,
      detachmentIds: slim.d ?? [],
      disposition: slim.s ?? null,
      units: (slim.u ?? []).map((row) => ({
        id: `imp_${Math.random().toString(36).slice(2, 8)}`,
        unitId: row[0],
        models: row[1],
        points: row[2],
        enhancementId: row[3] || undefined,
        attachedTo: row[4] || undefined,
        warlord: row[5] === 1,
        notes: row[6] || undefined,
        wargearIds: Array.isArray(row[7]) && row[7].length ? row[7] : undefined,
      })),
      notes: slim.t ?? "",
    };
  } catch {
    return null;
  }
}

export function rosterText(roster: Roster, factionName: string, points: number, dets: string[]): string {
  const lines = [
    roster.name,
    `${factionName} · ${roster.battleSize === "strike" ? "Strike Force 2000" : "Incursion 1000"}`,
    `Detachments: ${dets.join(", ") || "—"}`,
    `Disposition: ${roster.disposition ?? "—"}`,
    `Points: ${points}/${roster.pointsLimit}`,
    "",
  ];
  for (const u of roster.units) {
    const w = u.warlord ? " [Warlord]" : "";
    const e = u.enhancementId ? " +" : "";
    const wargear = u.wargearIds?.length ? ` [${u.wargearIds.length} wargear]` : "";
    const note = u.notes ? ` — ${u.notes}` : "";
    lines.push(`• ${u.models} ${u.unitId}${w}${e}${wargear}  ${u.points} pts${note}`);
  }
  if (roster.notes) {
    lines.push("", roster.notes);
  }
  lines.push("", "Shared from Ono40k (unofficial fan companion).");
  return lines.join("\n");
}
