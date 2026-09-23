import { ChevronLeft, X } from "lucide-react";
import { useState } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArmyPanel } from "@/components/battle/army-panel";
import { liveRoster } from "@/components/battle/clock";
import { Scoreboard } from "@/components/battle/scoreboard";
import { ScorePanel } from "@/components/battle/score-panel";
import { StratPanel } from "@/components/battle/strat-panel";
import { LedgerTape } from "@/components/battle/tape";
import { BattleMap } from "@/components/BattleMap";
import { Datasheet } from "@/components/Datasheet";
import { preBattleLine } from "@/components/PreBattle";
import { RuleFold } from "@/components/RuleFold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFaction, getUnit } from "@/data/codex";
import { getMap } from "@/data/maps";
import { parseObjective, sideVp } from "@/data/missions";
import { PHASES, type Game } from "@/data/types";
import { useActiveGame, useWarStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { primaryForSide } from "@/lib/validation";

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
  if (setup) return <Navigate to="/setup" search={{ list: setup }} replace />;
  if (!game) return <LedgerEmpty />;
  return <BattleTable game={game} />;
}

function LedgerEmpty() {
  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">War Journal</p>
      <h1 className="font-display text-3xl font-semibold">No open ledger</h1>
      <p className="text-sm text-muted-foreground">Choose the rosters and mission on Setup, then start the battle.</p>
      <Button asChild>
        <Link to="/setup">Open setup</Link>
      </Button>
    </div>
  );
}

function BattleTable({ game }: { game: Game }) {
  const setViewing = useWarStore((s) => s.setViewing);
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
          <Scoreboard game={game} locked={locked} myTotal={myTotal} oppTotal={oppTotal} />
          {game.preBattle ? (
            <RuleFold kicker="Pre-battle" title={preBattleLine(game) ?? "Muster"} text={game.preBattle.terrainNote || undefined}>
              {game.preBattle.mapId && getMap(game.preBattle.mapId) ? (
                <BattleMap
                  layout={getMap(game.preBattle.mapId)!}
                  className="mt-1"
                  sides={
                    game.preBattle.attacker
                      ? {
                          attacker: game.preBattle.attacker === "me" ? game.myName : game.opponentName,
                          defender: game.preBattle.attacker === "me" ? game.opponentName : game.myName,
                        }
                      : undefined
                  }
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

