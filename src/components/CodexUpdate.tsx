import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FACTIONS, withCodexPatches } from "@/data/codex";
import type { Faction, Roster } from "@/data/types";
import { reviewCatalogue, type CodexChange } from "@/lib/codex-catalogue";
import { checkCodex } from "@/lib/codex-check";
import { useCodexSync } from "@/lib/codex-sync";
import { useWarStore } from "@/lib/store";

function stamp(at: number) {
  return new Date(at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatValue(change: CodexChange, value: number) {
  if (change.kind === "points") return `${value} pts`;
  if (change.stat === "m") return `${value}"`;
  if (change.stat === "sv" || change.stat === "ld" || change.kind === "invuln") return value ? `${value}+` : "none";
  return String(value);
}

function rewriteRoster(roster: Roster, factionId: string, changes: CodexChange[]): Roster {
  if (roster.factionId !== factionId) return roster;
  let changed = false;
  const units = roster.units.map((unit) => {
    const hit = changes.find((change) => change.kind === "points" && change.unitId === unit.unitId && unit.points === change.from);
    if (!hit) return unit;
    changed = true;
    return { ...unit, points: hit.to };
  });
  return changed ? { ...roster, units, updatedAt: Date.now() } : roster;
}

type Review = { changes: CodexChange[]; skipped: string[]; partial: string[]; source: string };

export function CodexUpdate({ faction }: { faction: Faction }) {
  const last = useCodexSync((s) => s.lastCheck[faction.id]);
  const patchCount = useCodexSync((s) => Object.keys(s.patches[faction.id] ?? {}).length);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingByFaction, setPendingByFaction] = useState<Record<string, Review>>({});
  const pending = pendingByFaction[faction.id];

  async function runCheck(target: Faction) {
    const live = withCodexPatches(target);
    const result = await checkCodex({ data: target.id });
    const review = reviewCatalogue(live.units, result.units);
    const next = { ...review, source: result.source };
    useCodexSync.getState().markChecked(target.id, {
      changes: review.changes.length,
      compared: live.units.length - review.skipped.length,
      skipped: review.skipped.length,
      source: result.source,
    });
    setPendingByFaction((current) => ({ ...current, [target.id]: next }));
    return next;
  }

  async function checkOne() {
    setBusy(faction.name);
    setError(null);
    try {
      await runCheck(faction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The catalogue check failed.");
    } finally {
      setBusy(null);
    }
  }

  async function checkAll() {
    setBusy("every codex");
    setError(null);
    try {
      for (const next of FACTIONS) {
        setBusy(next.name);
        await runCheck(next);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The catalogue check failed.");
    } finally {
      setBusy(null);
    }
  }

  function apply() {
    if (!pending?.changes.length) return;
    useCodexSync.getState().apply(faction.id, pending.changes);
    useWarStore.setState((state) => ({
      lists: state.lists.map((list) => rewriteRoster(list, faction.id, pending.changes)),
      games: state.games.map((game) => ({
        ...game,
        myRoster: rewriteRoster(game.myRoster, faction.id, pending.changes),
        opponentRoster: rewriteRoster(game.opponentRoster, faction.id, pending.changes),
      })),
    }));
    setPendingByFaction((current) => ({ ...current, [faction.id]: { ...pending, changes: [] } }));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Catalogue check</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Compares profile lines and base points with the community 11th-edition catalogue. Weapons and detachment rules are left as written. 40k.app still wins if they disagree.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={busy != null} onClick={() => void checkOne()}>
            {busy === faction.name ? "Checking…" : "Check this codex"}
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy != null} onClick={() => void checkAll()}>
            {busy && busy !== faction.name ? `Checking ${busy}…` : "Check all"}
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {last
          ? `Last checked ${stamp(last.at)}${last.source ? ` against ${last.source}` : ""}. ${last.changes === 0 ? "No differences" : `${last.changes} difference${last.changes === 1 ? "" : "s"}`}${last.compared != null ? ` on ${last.compared} matched datasheet${last.compared === 1 ? "" : "s"}` : ""}.${last.skipped ? ` ${last.skipped} not in the catalogue.` : ""}`
          : "Not checked yet."}
        {patchCount > 0 ? ` ${patchCount} sheet${patchCount === 1 ? "" : "s"} updated on this device.` : ""}
      </p>
      {error ? <p className="mt-2 text-sm text-blood">{error}</p> : null}
      {pending && pending.changes.length === 0 ? (
        <p className="mt-3 text-sm">
          {pending.skipped.length === 0
            ? "This codex matches the catalogue."
            : `No differences on the matched datasheets. ${pending.skipped.length} ${pending.skipped.length === 1 ? "is" : "are"} not in the catalogue.`}
        </p>
      ) : null}
      {pending && pending.changes.length > 0 ? (
        <div className="mt-3 space-y-3">
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {pending.changes.map((change) => (
              <li key={`${change.unitId}-${change.label}`} className="text-sm">
                <span className="font-medium">{change.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {change.label} {formatValue(change, change.from)} → {formatValue(change, change.to)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Apply stores the new profile lines on this device. List points change only when a unit still has the old base cost. Weapons and rules stay as written.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={apply}>
              Apply updates
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setPendingByFaction((current) => {
                  const next = { ...current };
                  delete next[faction.id];
                  return next;
                })
              }
            >
              Ignore
            </Button>
          </div>
        </div>
      ) : null}
      {pending && pending.partial.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Points only for {pending.partial.join(", ")} — the catalogue has more than one model profile, so the stat line was left alone.
        </p>
      ) : null}
      {pending && pending.skipped.length > 0 ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            {pending.skipped.length} datasheet{pending.skipped.length === 1 ? "" : "s"} not in the catalogue
          </summary>
          <p className="mt-1 text-muted-foreground">{pending.skipped.join(", ")}</p>
        </details>
      ) : null}
      {patchCount > 0 ? (
        <Button type="button" size="sm" variant="ghost" className="mt-2 px-0" onClick={() => useCodexSync.getState().clearFaction(faction.id)}>
          Drop device updates for this codex
        </Button>
      ) : null}
    </div>
  );
}
