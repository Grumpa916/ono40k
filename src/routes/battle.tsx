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
      toast(`That would be ${dp + d.dp} DP — max is 3 DP`);
      return;
    }
    const takenTags = detachmentIds.map((id) => getDetachment(factionId, id)?.uniqueTag).filter(Boolean);
    if (takenTags.includes(d.uniqueTag)) {
      toast(`Unique: ${d.uniqueTag} — already have a detachment with that tag`);
      return;
    }
    onChange({
      detachmentIds: [...detachmentIds, d.id],
      disposition: d.disposition,
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Detachments · {dp}/3 DP</p>
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
        <p className="text-xs text-muted-foreground">Force disposition · {availableDisp[0]}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Select at least one detachment (max 3 DP).</p>
      )}
    </div>
  );
}

function useSecondClock(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function BattleClock({ game, locked }: { game: Game; locked: boolean }) {
  const pauseClock = useWarStore((s) => s.pauseClock);
  const resumeClock = useWarStore((s) => s.resumeClock);
  const endGame = useWarStore((s) => s.endGame);
  const turnsRunning = !!game.runningSince && game.status === "active";
  const now = useSecondClock(!locked && game.status === "active");
  const battle = formatClock(battleElapsedMs(game, now));
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <span className="font-mono text-sm tabular-nums">{battle}</span>
      {game.status === "active" ? (
        <>
          {turnsRunning ? (
            <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={pauseClock}>
              <Pause className="size-3.5" /> Pause
            </Button>
          ) : (
            <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={resumeClock}>
              <Play className="size-3.5" /> Resume
            </Button>
          )}
          <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={endGame}>
            End battle
          </Button>
        </>
      ) : null}
    </div>
  );
}

function SideClock({ game, side }: { game: Game; side: "me" | "opponent" }) {
  const running = game.status === "active" && !!game.runningSince && game.activeSide === side;
  const now = useSecondClock(running);
  return <span className="font-mono shrink-0 text-xs tabular-nums">{formatClock(turnElapsedMs(game, side, now))}</span>;
}

function liveRoster(snap: Roster, lists: Roster[]): Roster {
  const live = lists.find((l) => l.id === snap.id);
  const base = live ? { ...snap, detachmentIds: live.detachmentIds, disposition: live.disposition } : snap;
  return { ...base, disposition: rosterDisposition(base) };
}

function BattleTable({ game }: { game: Game }) {
  const setViewing = useWarStore((s) => s.setViewing);
  const endTurn = useWarStore((s) => s.endTurn);
  const prevTurn = useWarStore((s) => s.prevTurn);
  const jumpRound = useWarStore((s) => s.jumpRound);
  const undoLast = useWarStore((s) => s.undoLast);
  const dismissStrat = useWarStore((s) => s.dismissStrat);
  const endGame = useWarStore((s) => s.endGame);
  const leaveGame = useWarStore((s) => s.leaveGame);
  const reopenGame = useWarStore((s) => s.reopenGame);
  const viewing = game.viewing;
  const lists = useWarStore((s) => s.lists);
  const mine = liveRoster(game.myRoster, lists);
  const theirs = liveRoster(game.opponentRoster, lists);
  const roster = viewing === "me" ? mine : theirs;
  const faction = getFaction(roster.factionId);
  const myPrimary = primaryForSide(mine, theirs);
  const oppPrimary = primaryForSide(theirs, mine);
  const viewedPrimary = viewing === "me" ? myPrimary : oppPrimary;
  const myObjectives = myPrimary ? myPrimary.info.scoring.map(parseObjective) : null;
  const oppObjectives = oppPrimary ? oppPrimary.info.scoring.map(parseObjective) : null;
  const myTotal = sideVp(game.scores.me, myObjectives);
  const oppTotal = sideVp(game.scores.opponent, oppObjectives);
  const patchGame = useWarStore((s) => s.patchGame);
  const adjustCp = useWarStore((s) => s.adjustCp);
  const [tab, setTab] = useState("army");
  const [screen, setScreen] = useState<"score" | "units">("score");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const sheetDef = sheetId ? getUnit(roster.factionId, sheetId) : undefined;
  const locked = game.status === "complete";
  const log = game.log ?? [];
  const undoStack = game.undoStack ?? [];
  const activeStrats = game.activeStrats ?? [];

  return (
    <div className="space-y-4">
      {locked ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Closed ledger</p>
            <p className="font-display text-lg">This battle is recorded. Reopen it to keep scoring.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={leaveGame}>
              Leave ledger
            </Button>
            <Button size="sm" onClick={reopenGame}>
              Reopen
            </Button>
          </div>
        </div>
      ) : null}

      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-background px-4 py-2">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setScreen("score")}
            className={cn("h-11 rounded-md text-sm font-medium", screen === "score" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Score
          </button>
          <button
            type="button"
            onClick={() => setScreen("units")}
            className={cn("h-11 rounded-md text-sm font-medium", screen === "units" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
          >
            Units
          </button>
        </div>
      </div>

      {screen === "units" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 gap-1">
              {(["me", "opponent"] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setViewing(side)}
                  className={cn(
                    "h-10 max-w-[9.5rem] truncate rounded-md border px-3 text-sm font-medium",
                    viewing === side
                      ? side === "opponent"
                        ? "border-blood bg-blood text-primary-foreground"
                        : "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {side === "me" ? game.myName : game.opponentName}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            {faction?.name} · {roster.disposition ?? "No disposition"}
            {viewing !== game.activeSide ? " · peeking" : ""}
          </p>
          <ArmyPanel game={game} roster={roster} enemy={viewing === "me" ? theirs : mine} locked={locked} onOpen={setSheetId} />
        </div>
      ) : (
        <>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Score</p>
              <BattleClock game={game} locked={locked} />
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{game.myName}</p>
                <p className="font-mono text-4xl font-semibold tabular-nums leading-none">{myTotal}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Spend CP"
                    disabled={locked}
                    onClick={() => adjustCp("me", -1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="font-mono min-w-10 text-center text-sm tabular-nums">{game.cp.me} CP</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Gain CP"
                    disabled={locked}
                    onClick={() => adjustCp("me", 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    patchGame(game.id, {
                      scores: { ...game.scores, me: { ...game.scores.me, painted: game.scores.me.painted > 0 ? 0 : 10 } },
                    })
                  }
                  className={cn(
                    "mt-1.5 text-[11px] tracking-wide uppercase",
                    game.scores.me.painted > 0 ? "text-ok" : "text-muted-foreground",
                  )}
                >
                  {game.scores.me.painted > 0 ? "Painted +10" : "Painted army"}
                </button>
              </div>
              <p className="pt-5 text-xs text-muted-foreground">VP</p>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{game.opponentName}</p>
                <p className="font-mono text-4xl font-semibold tabular-nums leading-none text-blood">{oppTotal}</p>
                <div className="mt-2 flex items-center justify-end gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Spend opponent CP"
                    disabled={locked}
                    onClick={() => adjustCp("opponent", -1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="font-mono min-w-10 text-center text-sm tabular-nums">{game.cp.opponent} CP</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Gain opponent CP"
                    disabled={locked}
                    onClick={() => adjustCp("opponent", 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    patchGame(game.id, {
                      scores: { ...game.scores, opponent: { ...game.scores.opponent, painted: game.scores.opponent.painted > 0 ? 0 : 10 } },
                    })
                  }
                  className={cn(
                    "mt-1.5 text-[11px] tracking-wide uppercase",
                    game.scores.opponent.painted > 0 ? "text-ok" : "text-muted-foreground",
                  )}
                >
                  {game.scores.opponent.painted > 0 ? "Painted +10" : "Painted army"}
                </button>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Round {game.round} ·{" "}
                {(game.activeSide === "me" ? game.myName : game.opponentName).trim().toLowerCase() === "you"
                  ? "Your turn"
                  : `${game.activeSide === "me" ? game.myName : game.opponentName}'s turn`}
                {(game.liveRound ?? game.round) !== game.round || (game.liveSide ?? game.activeSide) !== game.activeSide
                  ? " · reviewing"
                  : ""}
              </p>
              <div className="mt-3 flex gap-1 overflow-x-auto">
                {([1, 2, 3, 4, 5] as const).map((r) => {
                  const reached = r <= (game.liveRound ?? game.round);
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={!reached}
                      onClick={() => jumpRound(r)}
                      className={cn(
                        "h-9 w-9 shrink-0 rounded-full text-xs font-medium tabular-nums",
                        game.round === r ? "bg-primary text-primary-foreground" : reached ? "bg-muted text-muted-foreground" : "bg-muted/40 text-muted-foreground/40",
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={(game.round === 1 && game.activeSide === "me")}
                  onClick={prevTurn}
                >
                  <ChevronLeft className="size-4" />
                  Previous turn
                </Button>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={locked && game.round === (game.liveRound ?? game.round) && game.activeSide === (game.liveSide ?? game.activeSide)}
                  onClick={endTurn}
                >
                  {game.round === (game.liveRound ?? game.round) && game.activeSide === (game.liveSide ?? game.activeSide)
                    ? game.round >= 5 && game.activeSide === "opponent"
                      ? "End battle"
                      : "End turn"
                    : "Next turn"}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewing("me")}
                className={cn(
                  "flex h-12 items-center justify-between gap-2 rounded-lg border px-3 text-sm font-medium",
                  game.activeSide === "me"
                    ? "border-primary bg-primary text-primary-foreground"
                    : game.viewing === "me"
                      ? "border-steel bg-accent"
                      : "border-border bg-muted",
                )}
              >
                <span className="truncate">{game.myName}</span>
                <SideClock game={game} side="me" />
              </button>
              <button
                type="button"
                onClick={() => setViewing("opponent")}
                className={cn(
                  "flex h-12 items-center justify-between gap-2 rounded-lg border px-3 text-sm font-medium",
                  game.activeSide === "opponent"
                    ? "border-blood bg-blood text-primary-foreground"
                    : game.viewing === "opponent"
                      ? "border-steel bg-accent"
                      : "border-border bg-muted",
                )}
              >
                <span className="truncate">{game.opponentName}</span>
                <SideClock game={game} side="opponent" />
              </button>
            </div>
            {game.viewing !== game.activeSide ? (
              <p className="mt-1.5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                Viewing {game.viewing === "me" ? game.myName : game.opponentName} ·{" "}
                {(game.activeSide === "me" ? game.myName : game.opponentName).trim().toLowerCase() === "you"
                  ? "your turn"
                  : `${game.activeSide === "me" ? game.myName : game.opponentName}'s turn`}
              </p>
            ) : null}
          </div>
          {game.preBattle ? (
            <RuleFold kicker="Pre-battle" title={preBattleLine(game) ?? "Muster"} text={game.preBattle.terrainNote || undefined}>
              {game.preBattle.mapId && getMap(game.preBattle.mapId) ? (
                <BattleMap
                  layout={getMap(game.preBattle.mapId)!}
                  className="mt-1"
                  sides={{
                    attacker: game.preBattle.attacker === "me" ? game.myName : game.opponentName,
                    defender: game.preBattle.attacker === "me" ? game.opponentName : game.myName,
                  }}
                />
              ) : null}
              {game.preBattle.formationNote ? <p className="text-sm text-muted-foreground">{game.preBattle.formationNote}</p> : null}
              {game.preBattle.scoutIds.length + game.preBattle.infiltrateIds.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Scout {game.preBattle.scoutIds.length} · Infiltrate {game.preBattle.infiltrateIds.length}
                </p>
              ) : null}
            </RuleFold>
          ) : null}
          <ScorePanel
            game={game}
            mission={viewedPrimary?.info ?? null}
            mineDisp={viewedPrimary?.mine ?? null}
            theirDisp={viewedPrimary?.theirs ?? null}
            locked={locked}
          />

          {activeStrats.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Active stratagems</p>
              <ul className="space-y-2">
                {activeStrats.map((s) => (
                  <li key={s.id} className="rounded-xl border border-steel/40 bg-card p-3">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-medium">{s.name}</p>
                          <Badge variant="outline">{s.cp} CP</Badge>
                          <Badge>{s.source}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.side === "me" ? game.myName : game.opponentName} · Round {s.round} · {PHASES.find((p) => p.id === s.phase)?.label}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                      </div>
                      <Button size="icon-sm" variant="ghost" aria-label="Dismiss stratagem" onClick={() => dismissStrat(s.id)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Tabs value={tab} onValueChange={setTab}>
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="min-w-0 flex-1">
                <TabsTrigger value="army">Army</TabsTrigger>
                <TabsTrigger value="strats">Strats</TabsTrigger>
              </TabsList>
              <div className="flex shrink-0 gap-1">
                {(["me", "opponent"] as const).map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setViewing(side)}
                    className={cn(
                      "h-8 rounded-md border px-2.5 text-xs font-medium",
                      viewing === side
                        ? side === "opponent"
                          ? "border-blood bg-blood text-primary-foreground"
                          : "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {side === "me" ? game.myName : game.opponentName}
                  </button>
                ))}
              </div>
            </div>
            <TabsContent value="army" className="mt-4">
              <p className="mb-2 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {faction?.name} · {roster.disposition ?? "No disposition"}
                {viewing !== game.activeSide ? " · peeking" : ""}
              </p>
              <ArmyPanel game={game} roster={roster} enemy={viewing === "me" ? theirs : mine} locked={locked} onOpen={setSheetId} />
            </TabsContent>
            <TabsContent value="strats" className="mt-4">
              <StratPanel game={game} roster={roster} locked={locked} />
            </TabsContent>
          </Tabs>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" asChild>
          <Link to="/">
            <ChevronLeft className="size-4" /> Lists
          </Link>
        </Button>
        {locked ? null : (
          <Button variant="outline" className="ml-auto" onClick={endGame}>
            Close ledger
          </Button>
        )}
      </div>

      <LedgerTape game={game} log={log} undoCount={undoStack.length} onUndo={undoLast} />
        </>
      )}

      {sheetDef ? (
        <div className="fixed inset-0 z-40 flex items-end bg-background/70 p-3 sm:items-center sm:justify-center" onClick={() => setSheetId(null)}>
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <Datasheet unit={sheetDef} accent={faction?.accent} />
            <Button className="mt-3 w-full" variant="secondary" onClick={() => setSheetId(null)}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TapeClock({ game }: { game: Game }) {
  const now = useSecondClock(game.status === "active");
  return <>{formatClock(battleElapsedMs(game, now))}</>;
}

function tapeDot(kind: LedgerEventKind) {
  if (kind === "destroyed") return "bg-blood";
  if (kind === "battleShock") return "bg-steel";
  if (kind === "stratagem") return "bg-primary";
  if (kind === "prebattle") return "bg-ok";
  if (kind === "turn") return "bg-foreground";
  return "bg-muted-foreground";
}

function tapeContext(ev: LedgerEvent, game: Game): string | null {
  if (ev.round == null && !ev.phase && !ev.turn) return null;
  const who = ev.turn ? (ev.turn === "me" ? game.myName : game.opponentName) : null;
  const round = ev.round != null ? `R${ev.round}` : null;
  const phase = ev.phase ? (PHASES.find((p) => p.id === ev.phase)?.label ?? ev.phase) : null;
  return [who, round, phase].filter(Boolean).join(" · ");
}

function tapeClock(ev: LedgerEvent, game: Game): string {
  const ms = ev.clockMs ?? Math.max(0, ev.at - game.startedAt);
  return formatClock(ms);
}

function LedgerTape({
  game,
  log,
  undoCount,
  onUndo,
}: {
  game: Game;
  log: LedgerEvent[];
  undoCount: number;
  onUndo: () => void;
}) {
  const [full, setFull] = useState(false);
  const shown = full ? log : log.slice(0, 5);
  const turnName = game.activeSide === "me" ? game.myName : game.opponentName;
  const phaseName = PHASES.find((p) => p.id === game.phase)?.label ?? game.phase;
  const turnLine = turnName.trim().toLowerCase() === "you" ? "Your turn" : `${turnName}'s turn`;
  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Ledger tape</p>
        <div className="flex items-center gap-1.5">
          {log.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setFull((v) => !v)}>
              {full ? "Last 5" : `Full ledger${log.length > 5 ? ` · ${log.length}` : ""}`}
            </Button>
          ) : null}
          <Button size="sm" variant="outline" disabled={undoCount === 0} onClick={onUndo}>
            <Undo2 className="size-4" />
            Undo{undoCount ? ` · ${undoCount}` : ""}
          </Button>
        </div>
      </div>
      <div className="mb-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {game.status === "complete" ? "Closed" : "Live"}
          </p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            <TapeClock game={game} />
          </p>
        </div>
        <p className="mt-0.5 text-sm">
          <span className="font-medium">{turnLine}</span>
          <span className="text-muted-foreground">
            {" "}
            · Round {game.round} · {phaseName}
          </span>
        </p>
      </div>
      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground">Phase, turn, Battle-shock, destroyed, and stratagems land here.</p>
      ) : (
        <ol className={cn("space-y-1.5", full && "max-h-80 overflow-y-auto")}>
          {shown.map((ev) => {
            const ctx = tapeContext(ev, game);
            return (
              <li key={ev.id} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tapeDot(ev.kind))} />
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">{ev.summary}</span>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{tapeClock(ev, game)}</span>
                  </div>
                  {ctx ? <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{ctx}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function patchWounds(
  ru: RosterUnit,
  def: UnitDef,
  st: UnitBattleState,
  delta: number,
): Partial<UnitBattleState> {
  const max = unitMaxWounds(def.stats.w);
  let models = st.destroyed ? 0 : st.modelsRemaining;
  let remaining = remainingWounds(st, max);
  if (delta > 0) {
    if (models <= 0) {
      models = 1;
      remaining = 1;
    } else if (remaining < max) {
      remaining += 1;
    } else if (models < ru.models) {
      models += 1;
      remaining = max;
    } else {
      remaining = max;
    }
    return { modelsRemaining: models, woundsOnCurrent: remaining, destroyed: false };
  }
  if (models <= 0) return { modelsRemaining: 0, woundsOnCurrent: 0, destroyed: true };
  remaining -= 1;
  if (remaining > 0) return { woundsOnCurrent: remaining, destroyed: false, modelsRemaining: models };
  models -= 1;
  if (models <= 0) return { modelsRemaining: 0, woundsOnCurrent: 0, destroyed: true };
  return { modelsRemaining: models, woundsOnCurrent: max, destroyed: false };
}

function WoundStepper({
  value,
  max,
  locked,
  alert,
  onDec,
  onInc,
}: {
  value: number;
  max: number;
  locked: boolean;
  alert?: boolean;
  onDec: () => void;
  onInc: () => void;
}) {
  const empty = value <= 0;
  const full = value >= max;
  return (
    <div className="ml-auto flex shrink-0 items-center gap-0.5">
      <Button
        size="icon-sm"
        className="size-7"
        variant="outline"
        aria-label="Remove wound"
        disabled={locked || empty}
        onClick={onDec}
      >
        <Minus className="size-3.5" />
      </Button>
      <span
        className={cn(
          "w-14 text-center font-mono text-xs tabular-nums",
          empty || alert ? "text-blood" : "text-foreground",
        )}
      >
        {value}/{max}
      </span>
      <Button
        size="icon-sm"
        className="size-7"
        variant="outline"
        aria-label="Add wound"
        disabled={locked || full}
        onClick={onInc}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function ArmyPanel({
  game,
  roster,
  enemy,
  locked,
  onOpen,
}: {
  game: Game;
  roster: Roster;
  enemy: Roster;
  locked: boolean;
  onOpen: (unitId: string) => void;
}) {
  const setUnitState = useWarStore((s) => s.setUnitState);
  const ordered = useMemo(() => {
    const rank = (id: string) => {
      const st = game.unitState[id];
      if (!st) return 1;
      if (st.destroyed) return 2;
      if (st.battleShocked) return 0;
      return 1;
    };
    return [...roster.units].sort((a, b) => rank(a.id) - rank(b.id));
  }, [roster.units, game.unitState]);
  const copies = useMemo(() => unitCopyMarks(roster.units), [roster.units]);

  return (
    <ul className="space-y-2">
      {ordered.map((ru) => {
        const def = getUnit(roster.factionId, ru.unitId);
        const st = game.unitState[ru.id];
        if (!def || !st) return null;
        const maxW = unitMaxWounds(def.stats.w);
        const wounds = remainingWounds(st, maxW);
        const applyWounds = (delta: number) => setUnitState(ru.id, patchWounds(ru, def, st, delta));
        const ranged = [...new Set(def.ranged.map((w) => w.name))].join(" · ");
        const melee = [...new Set(def.melee.map((w) => w.name))].join(" · ");
        const extras = wargearSummary(def, ru.wargearIds)
          .map((g) => g.name)
          .join(" · ");
        const level = strengthState({
          modelsStart: ru.models,
          modelsNow: st.destroyed ? 0 : st.modelsRemaining,
          woundsMax: maxW,
          woundsNow: wounds,
          destroyed: st.destroyed,
        });
        const effects = woundEffects({
          unit: def,
          roster,
          enemy,
          unitState: game.unitState,
          enhancementId: ru.enhancementId,
          state: level,
          woundsNow: wounds,
          battleShocked: st.battleShocked,
        });
        const penalised = effects.some((e) => e.kind === "penalty");
        const buffed = effects.some((e) => e.kind === "buff");
        return (
          <li
            key={ru.id}
            className={cn(
              "army-row rounded-lg border border-border bg-card px-2.5 py-1.5",
              st.destroyed && "opacity-50",
              !st.destroyed && st.battleShocked && "border-blood/50 bg-blood/10",
              !st.destroyed && !st.battleShocked && penalised && "border-blood/40 bg-blood/10",
              !st.destroyed && !penalised && buffed && "border-ok/50 bg-ok/10",
            )}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <button type="button" className="min-w-0 truncate text-left text-sm font-medium leading-5" onClick={() => onOpen(def.id)}>
                {def.name}
                {copies[ru.id] ? <span className="ml-1.5 text-[10px] tracking-widest text-steel">[{copies[ru.id]}]</span> : null}
                {ru.warlord ? <span className="ml-1.5 text-[10px] tracking-widest uppercase text-steel">WL</span> : null}
              </button>
              <Button
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                variant={st.battleShocked ? "blood" : "outline"}
                disabled={locked}
                onClick={() => setUnitState(ru.id, { battleShocked: !st.battleShocked })}
              >
                BS
              </Button>
              <Button
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px]"
                variant={st.destroyed ? "secondary" : "outline"}
                disabled={locked}
                aria-label="Destroyed"
                onClick={() =>
                  setUnitState(
                    ru.id,
                    st.destroyed
                      ? { destroyed: false, modelsRemaining: ru.models, woundsOnCurrent: maxW }
                      : { destroyed: true, modelsRemaining: 0, woundsOnCurrent: 0 },
                  )
                }
              >
                <Skull className="size-3.5" />
              </Button>
              {ru.models > 1 ? (
                <div className="ml-auto flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon-sm"
                    className="size-7"
                    variant="outline"
                    aria-label="Remove model"
                    disabled={locked || st.destroyed || st.modelsRemaining <= 0}
                    onClick={() => {
                      const next = Math.max(0, st.modelsRemaining - 1);
                      setUnitState(ru.id, {
                        modelsRemaining: next,
                        destroyed: next === 0,
                        woundsOnCurrent: next === 0 ? 0 : maxW,
                      });
                    }}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-8 text-center font-mono text-xs tabular-nums">
                    {st.destroyed ? 0 : st.modelsRemaining}/{ru.models}
                  </span>
                  <Button
                    size="icon-sm"
                    className="size-7"
                    variant="outline"
                    aria-label="Add model"
                    disabled={locked || (!st.destroyed && st.modelsRemaining >= ru.models)}
                    onClick={() =>
                      setUnitState(ru.id, {
                        modelsRemaining: Math.min(ru.models, Math.max(st.modelsRemaining, 0) + 1),
                        destroyed: false,
                        woundsOnCurrent: st.destroyed ? maxW : remainingWounds(st, maxW),
                      })
                    }
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(def.id)}>
                <p className="truncate text-xs leading-4 text-muted-foreground">
                  {`M${typeof def.stats.m === "number" ? `${def.stats.m}"` : def.stats.m} T${def.stats.t} Sv${def.stats.sv}+ W${def.stats.w}${def.invuln ? ` ${def.invuln}++` : ""} OC${def.stats.oc} · ${ru.points} pts`}
                </p>
              </button>
              <WoundStepper
                value={wounds}
                max={maxW}
                locked={locked}
                alert={penalised}
                onDec={() => applyWounds(-1)}
                onInc={() => applyWounds(1)}
              />
            </div>
            {ranged || melee || extras || ru.notes ? (
                <button type="button" className="mt-0.5 w-full min-w-0 text-left" onClick={() => onOpen(def.id)}>
                  {ranged ? (
                    <p className="truncate text-xs leading-4 text-muted-foreground">
                      <span className="text-[10px] tracking-[0.12em] text-muted-foreground/80 uppercase">R </span>
                      {ranged}
                    </p>
                  ) : null}
                  {melee ? (
                    <p className="truncate text-xs leading-4 text-muted-foreground">
                      <span className="text-[10px] tracking-[0.12em] text-muted-foreground/80 uppercase">M </span>
                      {melee}
                    </p>
                  ) : null}
                  {extras ? <p className="truncate text-xs leading-4 text-muted-foreground">{extras}</p> : null}
                  {ru.notes ? <p className="truncate text-xs leading-4 text-muted-foreground">{ru.notes}</p> : null}
                </button>
              ) : null}
            {effects.length > 0 ? (
              <p className={cn("mt-1 text-xs leading-4", penalised ? "text-blood" : "text-ok")}>
                {effects.map((e) => `${e.name}: ${e.text}`).join(" · ")}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ScoreLines({
  lines,
  checks,
  locked,
  focusRound,
  liveRound,
  onToggle,
}: {
  lines: string[];
  checks?: Array<Array<number | boolean>>;
  locked: boolean;
  focusRound?: number;
  liveRound?: number;
  onToggle: (line: number, slot: number, max: number) => void;
}) {
  const viewed = focusRound ?? 1;
  const frontier = liveRound ?? viewed;
  return (
    <ul className="mt-2 space-y-2">
      {lines.map((line, i) => {
        const obj = parseObjective(line);
        const row = checks?.[i] ?? [];
        const max = obj.each ? Math.max(2, Math.min(4, Math.floor(15 / Math.max(1, obj.vp)))) : 1;
        return (
          <li key={`${obj.text}-${i}`} className="min-w-0 sm:flex sm:items-center sm:gap-2">
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <p className="text-xs leading-snug">{obj.text.replace(/\s*\([^)]*\)\s*$/, "")}</p>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                +{obj.vp}
                {obj.each ? " ea" : ""}
              </span>
            </div>
            {obj.once ? (
              <button
                type="button"
                disabled={locked}
                aria-pressed={checkCount(row, 0) > 0}
                onClick={() => onToggle(i, 0, 1)}
                className={cn(
                  "mt-1 flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] sm:mt-0 sm:w-44",
                  checkCount(row, 0) > 0 ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                )}
              >
                <span className={cn("flex size-3.5 items-center justify-center rounded-sm border", checkCount(row, 0) > 0 ? "border-ok bg-ok text-background" : "border-border")}>
                  {checkCount(row, 0) > 0 ? <Check className="size-2.5" /> : null}
                </span>
                End of battle
              </button>
            ) : (
              <div className="mt-1 grid w-full shrink-0 grid-cols-5 gap-0.5 sm:mt-0 sm:w-44">
                {[0, 1, 2, 3, 4].map((slot) => {
                  const r = slot + 1;
                  const inMission = obj.rounds.includes(r);
                  const reached = r <= frontier;
                  const canEdit = !locked && inMission && reached && r === viewed;
                  const n = checkCount(row, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!canEdit}
                      aria-pressed={n > 0}
                      aria-label={`Round ${r} ${obj.vp} VP`}
                      onClick={() => onToggle(i, slot, max)}
                      className={cn(
                        "flex h-8 items-center justify-center gap-0.5 rounded-md border text-[10px] font-medium",
                        !inMission
                          ? "cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground/40"
                          : n > 0
                            ? "border-ok/50 bg-ok/15 text-foreground"
                            : canEdit
                              ? "border-steel/70 bg-muted text-foreground"
                              : reached
                                ? "cursor-not-allowed border-border bg-muted/70 text-muted-foreground"
                                : "cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground/40",
                      )}
                    >
                      {`R${r}`}
                      {n > 1 ? <span className="font-mono">×{n}</span> : n === 1 ? <Check className="size-2.5" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SecondaryScore({
  lines,
  value,
  locked,
  compact,
  onPick,
}: {
  lines: string[];
  value: number;
  locked: boolean;
  compact?: boolean;
  onPick: (vp: number) => void;
}) {
  const options = scoreOptions(lines);
  return (
    <div className="mt-2 space-y-2">
      {compact ? null : (
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>{parseObjective(line).text.replace(/\s*\([^)]*\)\s*$/, "")}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((vp) => (
          <button
            key={vp}
            type="button"
            disabled={locked}
            aria-pressed={value === vp}
            onClick={() => onPick(value === vp ? 0 : vp)}
            className={cn(
              "h-8 min-w-12 rounded-md border px-2.5 text-xs font-medium",
              value === vp ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
            )}
          >
            {vp} VP
          </button>
        ))}
      </div>
    </div>
  );
}

function cardScored(checks?: Array<Array<number | boolean>>): boolean {
  return cardAward(checks) > 0;
}

function unscoredFirst<T extends string>(ids: T[], checks: Record<string, number[][]> | undefined): T[] {
  return [...ids].sort((a, b) => Number(cardScored(checks?.[a])) - Number(cardScored(checks?.[b])));
}

function SecondaryPanel({ game, locked }: { game: Game; locked: boolean }) {
  const side = game.viewing;
  const score = game.scores[side];
  const setSecondaryMode = useWarStore((s) => s.setSecondaryMode);
  const toggleFixedSecondary = useWarStore((s) => s.toggleFixedSecondary);
  const toggleTacticalActive = useWarStore((s) => s.toggleTacticalActive);
  const setSecondaryScore = useWarStore((s) => s.setSecondaryScore);
  const ensureSecondaryMeta = useWarStore((s) => s.ensureSecondaryMeta);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const mode = score.secondaryMode ?? null;
  const fixedIds = score.fixedIds ?? [];
  const active = score.tacticalActive ?? [];
  const ids = mode === "fixed" ? fixedIds : mode === "tactical" ? active : [];
  const pts = secondaryVp(mode, ids, score.secondaryChecks);
  useEffect(() => {
    ensureSecondaryMeta(side);
  }, [ensureSecondaryMeta, side, ids.join("|")]);

  const selectedCard = (id: string, discard?: boolean) => {
    const card = (mode === "fixed" ? FIXED_SECONDARIES : SECONDARIES).find((c) => c.id === id);
    if (!card) return null;
    const scored = cardScored(score.secondaryChecks?.[id]);
    const open = !!openIds[id];
    const award = cardAward(score.secondaryChecks?.[id]);
    const stamp = score.secondaryMeta?.[id];
    return (
      <div key={id} className={cn("min-w-0 rounded-lg border border-border px-2.5 py-1.5", open && "p-3", scored && "opacity-70")}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm font-medium"
            onClick={() => setOpenIds((m) => ({ ...m, [id]: !m[id] }))}
          >
            {card.name}
            <span className="ml-1.5 font-mono text-xs font-normal tabular-nums text-muted-foreground">{award} VP</span>
          </button>
          {discard ? (
            <Button size="sm" className="h-7 px-2 text-[11px]" variant="ghost" disabled={locked} onClick={() => toggleTacticalActive(side, id)}>
              Discard
            </Button>
          ) : null}
        </div>
        {stamp ? (
          <p className="mt-0.5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            Selected R{stamp.selectedRound}
            {stamp.completedRound != null ? ` · Completed R${stamp.completedRound}` : ""}
          </p>
        ) : null}
        {open ? <p className="mt-1 text-xs text-muted-foreground">{card.blurb}</p> : null}
        <SecondaryScore
          lines={secondaryLines(card, mode === "fixed" ? "fixed" : "tactical")}
          value={award}
          locked={locked}
          compact={!open}
          onPick={(vp) => setSecondaryScore(side, id, vp)}
        />
      </div>
    );
  };

  return (
    <Card className="p-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        Secondary · {side === "me" ? game.myName : game.opponentName}
      </p>
      <p className="mt-2 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        {mode === "fixed" ? "20 VP / card · 40 cap" : "15 VP / round · 45 cap"} · {pts} VP
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => setSecondaryMode(side, "fixed")}
          className={cn(
            "h-10 rounded-lg border text-sm font-medium",
            mode === "fixed" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted",
          )}
        >
          Fixed
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => setSecondaryMode(side, "tactical")}
          className={cn(
            "h-10 rounded-lg border text-sm font-medium",
            mode === "tactical" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted",
          )}
        >
          Tactical
        </button>
      </div>
      {mode === "fixed" ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Pick two. They stay active all game.</p>
          <div className="flex flex-wrap gap-1.5">
            {unscoredFirst(FIXED_SECONDARIES.map((c) => c.id), score.secondaryChecks).map((id) => {
              const card = FIXED_SECONDARIES.find((c) => c.id === id);
              if (!card) return null;
              const on = fixedIds.includes(card.id);
              const scored = cardScored(score.secondaryChecks?.[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={locked || (!on && fixedIds.length >= 2)}
                  onClick={() => toggleFixedSecondary(side, card.id)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium",
                    on ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                    scored && "opacity-60",
                  )}
                >
                  {card.name}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 items-start gap-1.5">
            {unscoredFirst(fixedIds, score.secondaryChecks).map((id) => selectedCard(id))}
          </div>
        </div>
      ) : null}
      {mode === "tactical" ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Draw two each Command phase. Tap a card when you draw it. Score it once, then it drops to the bottom.</p>
          <div className="flex flex-wrap gap-1.5">
            {unscoredFirst(SECONDARIES.map((c) => c.id), score.secondaryChecks).map((id) => {
              const card = SECONDARIES.find((c) => c.id === id);
              if (!card) return null;
              const on = active.includes(card.id);
              const scored = cardScored(score.secondaryChecks?.[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleTacticalActive(side, card.id)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium",
                    on ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                    scored && "opacity-60",
                  )}
                >
                  {card.name}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 items-start gap-1.5">
            {unscoredFirst(active, score.secondaryChecks).map((id) => selectedCard(id, true))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function ScorePanel({
  game,
  mission,
  mineDisp,
  theirDisp,
  locked,
}: {
  game: Game;
  mission: MissionInfo | null;
  mineDisp: string | null;
  theirDisp: string | null;
  locked: boolean;
}) {
  const side = game.viewing;
  const score = game.scores[side];
  const togglePrimaryCheck = useWarStore((s) => s.togglePrimaryCheck);
  const primaryPts = mission ? objectiveVp(score.primaryChecks, mission.scoring.map(parseObjective)) : score.primaryByRound.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {mission ? (
        <Card className="p-4">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Primary · 11th edition · {side === "me" ? game.myName : game.opponentName}
          </p>
          <h3 className="font-display mt-1 text-xl">{mission.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {mineDisp} vs {theirDisp}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{mission.blurb}</p>
          <p className="mt-2 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            15 VP / round · 45 primary max · {primaryPts} VP
          </p>
          <ScoreLines
            lines={mission.scoring}
            checks={score.primaryChecks}
            locked={locked}
            focusRound={game.round}
            liveRound={game.liveRound ?? game.round}
            onToggle={(line, slot, max) => togglePrimaryCheck(side, line, slot, max)}
          />
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Set dispositions on both lists to generate a primary mission.</p>
      )}
      <SecondaryPanel game={game} locked={locked} />
    </div>
  );
}

function StratPanel({
  game,
  roster,
  locked,
}: {
  game: Game;
  roster: Roster;
  locked: boolean;
}) {
  const side = game.viewing;
  const playStratagem = useWarStore((s) => s.playStratagem);
  const [fullByPhase, setFullByPhase] = useState<Record<string, boolean>>({});
  const dets = roster.detachmentIds.map((id) => getDetachment(roster.factionId, id)).filter(Boolean);
  const faction = getFaction(roster.factionId);
  const active = game.activeStrats ?? [];
  const list: Array<Stratagem & { source: string }> = [
    ...dets.flatMap((d) => d!.stratagems.map((s) => ({ ...s, source: d!.name }))),
    ...CORE_STRATAGEMS.map((s) => ({ ...s, source: "Core" })),
  ];
  const grouped = useMemo(() => {
    const map = new Map<StratPhaseKey, typeof list>();
    for (const s of list) {
      const key = stratagemPrimaryPhase(s.when);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => Number(a.source === "Core") - Number(b.source === "Core") || a.name.localeCompare(b.name));
    }
    const order: StratPhaseKey[] = ["any", ...PHASES.map((p) => p.id)];
    return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [list]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Tap a stratagem to play it and spend the CP.</p>
      {grouped.map(([phase, strats]) => {
        const compact = !fullByPhase[phase];
        const label = phase === "any" ? "Any phase" : (PHASES.find((p) => p.id === phase)?.label ?? phase);
        return (
          <section key={phase}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{label}</h3>
              <button
                type="button"
                className="text-[11px] tracking-wide text-muted-foreground uppercase"
                onClick={() => setFullByPhase((m) => ({ ...m, [phase]: !m[phase] }))}
              >
                {compact ? "Full text" : "1 line"}
              </button>
            </div>
            <ul className="space-y-2">
              {strats.map((s) => {
                const playCount = active.filter((a) => a.stratId === s.id && a.side === side).length;
                const showFull = !compact;
                const unaffordable = locked || game.cp[side] < s.cp;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={unaffordable}
                      onClick={() => playStratagem(side, s, s.source)}
                      className={cn(
                        "w-full rounded-lg border bg-card text-left",
                        playCount > 0 ? "border-steel/50" : "border-border",
                        showFull ? "p-3" : "px-2 py-1.5",
                        unaffordable && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          {showFull ? (
                            <div>
                              <p className="font-medium">
                                {s.name}
                                {playCount > 1 ? <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">×{playCount}</span> : null}
                              </p>
                              <p className="text-xs text-muted-foreground">{s.when}</p>
                            </div>
                          ) : (
                            <p className="truncate text-sm font-medium">
                              {s.name}
                              <span className="ml-1.5 font-normal text-muted-foreground">
                                · {s.when}
                                {s.source !== "Core" ? ` · ${s.source}` : ""}
                              </span>
                              {playCount > 1 ? <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">×{playCount}</span> : null}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{s.cp} CP</span>
                      </div>
                      {showFull ? <p className="mt-2 text-sm text-muted-foreground">{s.text}</p> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {faction ? <RuleFold kicker="Army rule" title={faction.rule.name} text={faction.rule.text} /> : null}
      {dets.map((d) => (
        <RuleFold
          key={d!.id}
          kicker="Detachment"
          title={d!.name}
          text={`${d!.rule.name}. ${d!.rule.text}`}
          badges={<Badge variant="outline">{d!.disposition}</Badge>}
        />
      ))}
    </div>
  );
}
