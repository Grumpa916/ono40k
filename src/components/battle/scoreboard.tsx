import { ChevronLeft, Minus, Plus } from "lucide-react";
import { BattleClock, SideClock } from "@/components/battle/clock";
import { Button } from "@/components/ui/button";
import type { Game } from "@/data/types";
import { useWarStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function Scoreboard({
  game,
  locked,
  myTotal,
  oppTotal,
}: {
  game: Game;
  locked: boolean;
  myTotal: number;
  oppTotal: number;
}) {
  const setPainted = useWarStore((s) => s.setPainted);
  const adjustCp = useWarStore((s) => s.adjustCp);
  const setViewing = useWarStore((s) => s.setViewing);
  const endTurn = useWarStore((s) => s.endTurn);
  const prevTurn = useWarStore((s) => s.prevTurn);
  const jumpRound = useWarStore((s) => s.jumpRound);
  return (
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
                  onClick={() => setPainted("me", game.scores.me.painted <= 0)}
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
                  onClick={() => setPainted("opponent", game.scores.opponent.painted <= 0)}
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
  );
}
