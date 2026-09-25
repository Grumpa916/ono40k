import { createServerFn } from "@tanstack/react-start";
import { CATALOGUE_REPO, FACTION_CATALOGUES } from "@/data/codex-catalogues";
import { normName, parseCatalogue, type RemoteUnit } from "@/lib/codex-catalogue";

export type CodexCheckResult = {
  factionId: string;
  units: RemoteUnit[];
  files: string[];
  source: string;
};

function revisionOf(raw: unknown): number | null {
  const revision = (raw as { catalogue?: { revision?: unknown } })?.catalogue?.revision;
  return typeof revision === "number" && Number.isFinite(revision) ? revision : null;
}

function sourceLabel(file: string, revision: number | null): string {
  const name = file.replace(/\.json$/i, "").replace(/^(Imperium|Chaos) - /, "");
  return revision == null ? name : `${name} r${revision}`;
}

export const checkCodex = createServerFn({ method: "POST" })
  .validator((factionId: string) => {
    if (typeof factionId !== "string" || !FACTION_CATALOGUES[factionId]) throw new Error("Unknown codex.");
    return factionId;
  })
  .handler(async ({ data }): Promise<CodexCheckResult> => {
    const files = FACTION_CATALOGUES[data];
    const merged = new Map<string, RemoteUnit>();
    const labels: string[] = [];
    for (const file of [...files].reverse()) {
      const url = `${CATALOGUE_REPO}/${encodeURIComponent(file)}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "ono40k-codex-check" },
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) throw new Error(`Catalogue request failed (${response.status}).`);
      const json = (await response.json()) as unknown;
      labels.unshift(sourceLabel(file, revisionOf(json)));
      for (const unit of parseCatalogue(json)) merged.set(normName(unit.name), unit);
    }
    return { factionId: data, units: [...merged.values()], files, source: labels.join(" · ") };
  });
