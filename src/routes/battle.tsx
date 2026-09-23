import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronLeft, Minus, Pause, Play, Plus, Skull, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BattleMap } from "@/components/BattleMap";
import { Datasheet } from "@/components/Datasheet";
import { PreBattleForm, preBattleLine } from "@/components/PreBattle";
import { RuleFold } from "@/components/RuleFold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CORE_STRATAGEMS, stratagemPrimaryPhase, type StratPhaseKey } from "@/data/core";
import { FACTIONS, getDetachment, getFaction, getUnit } from "@/data/codex";
import { getMap } from "@/data/maps";
import { checkCount, objectiveVp, parseObjective, sideVp, type MissionInfo } from "@/data/missions";
import { FIXED_SECONDARIES, SECONDARIES, cardAward, scoreOptions, secondaryLines, secondaryVp } from "@/data/secondaries";
import { PHASES, type Detachment, type Disposition, type Game, type LedgerEvent, type LedgerEventKind, type Roster, type RosterUnit, type Stratagem, type UnitBattleState, type UnitDef } from "@/data/types";
import { useActiveGame, useWarStore } from "@/lib/store";
import { cn, battleElapsedMs, formatClock, remainingWounds, turnElapsedMs, unitCopyMarks, unitMaxWounds } from "@/lib/utils";
import { defaultDetachmentIds, tableRoster } from "@/lib/quick-roster";
import { wargearSummary } from "@/data/wargear";
import { strengthState, woundEffects } from "@/lib/wound-state";
import { primaryForSide, rosterDisposition, rosterPoints } from "@/lib/validation";

type Search = { setup?: string };

export const Route = createFileRoute("/battle")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    setup: typeof s.setup === "string" ? s.setup : undefined,
  }),
  component: BattlePage,
});

function BattlePage() {
  const game = useActiveGame();
  const { setup } = Route.useSearch();
  const leaveGame = useWarStore((s) => s.leaveGame);
  const openingNew = Boolean(setup) && (!game || game.status === "complete");
  useEffect(() => {
    if (setup && game?.status === "complete") leaveGame();
  }, [setup, game?.status, leaveGame]);
  if (!game || openingNew) return <BattleSetup presetListId={setup} />;
  return <BattleTable game={game} />;
}

type ArmySource =
  | { kind: "list"; listId: string }
  | { kind: "codex"; factionId: string; detachmentIds: string[]; disposition: Disposition | null };

function resolveArmy(source: ArmySource, lists: Roster[]): Roster | null {
  if (source.kind === "list") return lists.find((l) => l.id === source.listId) ?? null;
  return tableRoster(source.factionId, source.detachmentIds, source.disposition);
}

function sourceKey(source: ArmySource) {
  if (source.kind === "list") return `list:${source.listId}`;
  return `codex:${source.factionId}:${[...source.detachmentIds].sort().join(",")}:${source.disposition ?? ""}`;
}

function armyTitle(source: ArmySource, lists: Roster[]) {
  if (source.kind === "list") return lists.find((l) => l.id === source.listId)?.name ?? "List";
  return getFaction(source.factionId)?.name ?? "Codex army";
}

function armyMeta(source: ArmySource, lists: Roster[]) {
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

function defaultCodex(factionId: string): Extract<ArmySource, { kind: "codex" }> {
  const ids = defaultDetachmentIds(factionId);
  const disp = getDetachment(factionId, ids[0] ?? "")?.disposition ?? null;
  return { kind: "codex", factionId, detachmentIds: ids, disposition: disp };
}

function BattleSetup({ presetListId }: { presetListId?: string }) {
  const lists = useWarStore((s) => s.lists);
  const startGame = useWarStore((s) => s.startGame);
  const navigate = useNavigate();
  const [step, setStep] = useState<"pool" | "briefing">("pool");
  const [myName, setMyName] = useState("Grumpa");
  const [oppName, setOppName] = useState("Jared");
  const [pool, setPool] = useState<ArmySource[]>([]);
  const [draft, setDraft] = useState<Extract<ArmySource, { kind: "codex" }>>(() => defaultCodex("um"));
  const [codexArmed, setCodexArmed] = useState(false);

  useEffect(() => {
    if (!presetListId || !lists.some((l) => l.id === presetListId)) return;
    setPool((prev) => (prev.some((s) => s.kind === "list" && s.listId === presetListId) ? prev : [{ kind: "list", listId: presetListId }, ...prev]));
  }, [presetListId, lists]);

  const you = pool[0] ?? null;
  const them = pool[1] ?? null;
  const myRoster = you ? resolveArmy(you, lists) : null;
  const oppRoster = them ? resolveArmy(them, lists) : null;

  const codexQuiet = pool.length >= 2;

  const toggleList = (listId: string) => {
    const on = pool.some((s) => s.kind === "list" && s.listId === listId);
    if (on) {
      setPool(pool.filter((s) => !(s.kind === "list" && s.listId === listId)));
      return;
    }
    if (pool.length >= 2) {
      toast("Only two armies. Untick one first.");
      return;
    }
    setPool([...pool, { kind: "list", listId }]);
  };
  const addDraft = () => {
    if (pool.length >= 2) {
      toast("Only two armies. Untick one first.");
      return;
    }
    if (draft.detachmentIds.length === 0) {
      toast("Select at least one detachment");
      return;
    }
    const key = sourceKey(draft);
    setPool((prev) => (prev.some((s) => sourceKey(s) === key) ? prev : [...prev, draft]));
  };
  const removeFromPool = (key: string) => {
    setPool((prev) => prev.filter((s) => sourceKey(s) !== key));
  };

  if (step === "briefing" && myRoster && oppRoster) {
    return (
      <PreBattleForm
        myName={myName}
        oppName={oppName}
        mine={myRoster}
        theirs={oppRoster}
        onBack={() => setStep("pool")}
        onStart={(briefing, scores) => {
          const id = startGame({ mine: myRoster, theirs: oppRoster, myName, opponentName: oppName, briefing, scores });
          if (id) void navigate({ to: "/battle" });
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">War Journal · Armies</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Pick armies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick the two lists for this game, or add a faction from the codex with up to 3 DP of detachments.
        </p>
      </div>

      {lists.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Saved lists</p>
          <ul className="grid grid-cols-2 gap-1.5">
            {lists.map((l) => {
              const on = pool.some((s) => s.kind === "list" && s.listId === l.id);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => toggleList(l.id)}
                    className={cn(
                      "flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-left",
                      on ? "border-primary bg-accent" : "border-border bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on ? <Check className="size-2.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{l.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{getFaction(l.factionId)?.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <CodexDraft
        source={draft}
        quiet={codexQuiet}
        open={codexArmed && !codexQuiet}
        onSource={(next) => {
          setCodexArmed(true);
          setDraft(next);
        }}
      />
      {codexArmed && !codexQuiet ? (
        <Button variant="outline" className="w-full" disabled={draft.detachmentIds.length === 0} onClick={addDraft}>
          <Plus className="size-4" />
          Add to this game
        </Button>
      ) : null}

      {pool.filter((s) => s.kind === "codex").length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Codex armies added</p>
          <ul className="space-y-1.5">
            {pool
              .filter((s) => s.kind === "codex")
              .map((s) => (
                <li key={sourceKey(s)} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{armyTitle(s, lists)}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{armyMeta(s, lists)}</span>
                  </span>
                  <Button size="icon-sm" variant="ghost" aria-label="Remove army" onClick={() => removeFromPool(sourceKey(s))}>
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {pool.length === 2 && you && them ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>You</Label>
            <Input value={myName} onChange={(e) => setMyName(e.target.value)} />
            <p className="truncate text-[11px] text-muted-foreground">{armyTitle(you, lists)}</p>
          </div>
          <div className="space-y-1">
            <Label>Opponent</Label>
            <Input value={oppName} onChange={(e) => setOppName(e.target.value)} />
            <p className="truncate text-[11px] text-muted-foreground">{armyTitle(them, lists)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={pool.length !== 2}
          onClick={() => setPool((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev))}
        >
          Swap sides
        </Button>
        <Button className="w-full" disabled={pool.length < 2 || !myRoster || !oppRoster} onClick={() => setStep("briefing")}>
          Pre-battle
        </Button>
      </div>
      {pool.length < 2 ? <p className="text-center text-sm text-muted-foreground">Add at least two armies to continue.</p> : null}
    </div>
  );
}

function CodexDraft({
  source,
  quiet,
  open,
  onSource,
}: {
  source: Extract<ArmySource, { kind: "codex" }>;
  quiet?: boolean;
  open: boolean;
  onSource: (v: Extract<ArmySource, { kind: "codex" }>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Add a codex army</p>
      {quiet ? (
        <p className="text-xs text-muted-foreground">Two armies are selected. Untick one to use the codex.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5">
        {FACTIONS.map((f) => {
          const on = open && source.factionId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                if (quiet) {
                  toast("Two armies are already selected. Untick one first.");
                  return;
                }
                onSource(defaultCodex(f.id));
              }}
              className={cn(
                "min-h-11 rounded-md border px-2 py-1.5 text-left text-xs font-medium",
                on ? "border-primary bg-accent" : "border-border bg-muted text-muted-foreground",
              )}
            >
              {f.name}
            </button>
          );
        })}
      </div>
      {open ? (
        <CodexDetachmentPicker
          factionId={source.factionId}
          detachmentIds={source.detachmentIds}
          disposition={source.disposition}
          onChange={(next) => onSource({ kind: "codex", factionId: source.factionId, ...next })}
        />
      ) : null}
    </div>
  );
}

function CodexDetachmentPicker({
  factionId,
  detachmentIds,
  disposition,
  onChange,
}: {
  factionId: string;
  detachmentIds: string[];
  disposition: Disposition | null;
  onChange: (next: { detachmentIds: string[]; disposition: Disposition | null }) => void;
}) {
  const faction = getFaction(factionId);
  if (!faction) return null;
  const dp = detachmentIds.reduce((sum, id) => sum + (getDetachment(factionId, id)?.dp ?? 0), 0);
  const availableDisp = [
    ...new Set(detachmentIds.map((id) => getDetachment(factionId, id)?.disposition).filter(Boolean)),
  ] as Disposition[];
  const current = disposition && availableDisp.includes(disposition) ? disposition : (availableDisp[0] ?? null);

  const toggle = (d: Detachment) => {
    const on = detachmentIds.includes(d.id);
    if (on) {
      const next = detachmentIds.filter((id) => id !== d.id);
      const disps = next.map((id) => getDetachment(factionId, id)?.disposition).filter(Boolean) as Disposition[];
      onChange({
        detachmentIds: next,
        disposition: current && disps.includes(current) ? current : (disps[0] ?? null),
      });
      return;
    }
    if (dp + d.dp > 3) {
      toast(`That would be ${dp + d.dp} DP \u2014 max is 3 DP`);
      return;
    }
    const takenTags = detachmentIds.map((id) => getDetachment(factionId, id)?.uniqueTag).filter(Boolean);
    if (takenTags.includes(d.uniqueTag)) {
      toast(`Unique: ${d.uniqueTag} \u2014 already have a detachment with that tag`);
      return;
    }
    onChange({
      detachmentIds: [...detachmentIds, d.id],
      disposition: d.disposition,
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Detachments \u00b7 {dp}/3 DP</p>
      <ul className="grid max-h-64 grid-cols-2 items-start gap-1 overflow-y-auto">
        {faction.detachments.map((d) => {
          const on = detachmentIds.includes(d.id);
          const over = !on && dp + d.dp > 3;
          return (
            <li key={d.id} className={cn("min-w-0 rounded-md border", on ? "border-primary bg-accent" : "border-border bg-card", over && "opacity-50")}>
              <button
                type="button"
                aria-label={on ? `Remove ${d.name}` : `Add ${d.name}`}
                onClick={() => toggle(d)}
                className="flex min-h-11 w-full min-w-0 items-center gap-1.5 px-2 py-1.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on ? <Check className="size-2.5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{d.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{d.disposition}</span>
                </span>
                <Badge className="h-4 shrink-0 px-1.5 py-0 text-[10px] tracking-wider">{d.dp} DP</Badge>
              </button>
            </li>
          );
        })}
      </ul>
      {availableDisp.length > 1 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Force disposition</p>
          <div className="flex flex-wrap gap-1.5">
            {availableDisp.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ detachmentIds, disposition: d })}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-xs font-medium",
                  current === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : availableDisp.length === 1 ? (
        <p className="text-xs text-muted-foreground">Force disposition \u00b7 {availableDisp[0]}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Select at least one detachment (max 3 DP).</p>
      )}
    </div>
  );
}
