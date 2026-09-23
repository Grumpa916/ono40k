import { Undo2 } from "lucide-react";
import { useState } from "react";
import { useSecondClock } from "@/components/battle/clock";
import { Button } from "@/components/ui/button";
import { PHASES, type Game, type LedgerEvent, type LedgerEventKind } from "@/data/types";
import { cn, battleElapsedMs, formatClock } from "@/lib/utils";

export function TapeClock({ game }: { game: Game }) {
  const now = useSecondClock(game.status === "active");
  return <>{formatClock(battleElapsedMs(game, now))}</>;
}

export function tapeDot(kind: LedgerEventKind) {
  if (kind === "destroyed") return "bg-blood";
  if (kind === "battleShock") return "bg-steel";
  if (kind === "stratagem") return "bg-primary";
  if (kind === "prebattle") return "bg-ok";
  if (kind === "turn") return "bg-foreground";
  return "bg-muted-foreground";
}

export function tapeContext(ev: LedgerEvent, game: Game): string | null {
  if (ev.round == null && !ev.phase && !ev.turn) return null;
  const who = ev.turn ? (ev.turn === "me" ? game.myName : game.opponentName) : null;
  const round = ev.round != null ? `R${ev.round}` : null;
  const phase = ev.phase ? (PHASES.find((p) => p.id === ev.phase)?.label ?? ev.phase) : null;
  return [who, round, phase].filter(Boolean).join(" · ");
}

export function tapeClock(ev: LedgerEvent, game: Game): string {
  const ms = ev.clockMs ?? Math.max(0, ev.at - game.startedAt);
  return formatClock(ms);
}

export function LedgerTape({
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

