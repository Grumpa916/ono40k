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
import { Button } from "@/components/ui/button";
import { getFaction, getUnit } from "@/data/codex";
import { getMap } from "@/data/maps";
import { parseObjective, sideVp } from "@/data/missions";
import { type Game } from "@/data/types";
import { stratsOnTurn, useActiveGame, useWarStore } from "@/lib/store";
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
  const resolveScoringAction = useWarStore((s) => s.resolveScoringAction);
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
  const [screen, setScreen] = useState<"score" | "units">("score");
  const [sheetId, setSheetId] = useState<string | null>(null);
  const sheetRu = sheetId ? roster.units.find((unit) => unit.id === sheetId) : undefined;
  const sheetDef = sheetRu ? getUnit(roster.factionId, sheetRu.unitId) : undefined;
  const locked = game.status === "complete";
  const log = game.log ?? [];
  const undoStack = game.undoStack ?? [];
  const { reviewing, strats: shownStrats } = stratsOnTurn(game);
  const scoringActions = game.scoringActions ?? [];

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
              End game
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
          {shownStrats.length > 0 ? (
            <div className="space-y-1">
              {reviewing ? <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Stratagems this turn</p> : null}
              <ul className="space-y-1">
                {shownStrats.map((s) => (
                  <li key={s.id}>
                    {reviewing ? (
                      <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-steel/40 bg-card px-3 text-sm">
                        <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{s.side === "me" ? game.myName : game.opponentName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{s.cp} CP</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => dismissStrat(s.id)}
                        className="flex h-10 w-full items-center gap-2 rounded-lg border border-steel/40 bg-card px-3 text-left text-sm"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">{s.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{s.cp} CP</span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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

          {scoringActions.length > 0 ? (
            <section className="space-y-2">
              <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Scoring actions</p>
              <ul className="space-y-2">
                {scoringActions.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-xl border border-ok/40 bg-card px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.name}
                        <span className="ml-1.5 font-normal text-muted-foreground">{a.unitName}</span>
                      </p>
                      <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                        {a.side === "me" ? game.myName : game.opponentName} · Round {a.round}
                      </p>
                    </div>
                    <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={() => resolveScoringAction(a.id, "complete")}>
                      Done
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-[11px]" variant="ghost" disabled={locked} onClick={() => resolveScoringAction(a.id, "fail")}>
                      Fail
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <RuleFold kicker="Stratagems" title="Open stratagems">
            <div className="px-3 pb-3">
              <StratPanel game={game} roster={roster} locked={locked} />
            </div>
          </RuleFold>

      <LedgerTape game={game} log={log} undoCount={undoStack.length} onUndo={undoLast} />
        </>
      )}

      {sheetDef ? (
        <div className="fixed inset-0 z-40 flex items-end bg-background/70 p-3 sm:items-center sm:justify-center" onClick={() => setSheetId(null)}>
          <div className="max-h-[88vh] w-full max-w-2xl cursor-pointer overflow-y-auto">
            <Datasheet unit={sheetDef} accent={faction?.accent} wargearIds={sheetRu?.wargearIds ?? []} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

