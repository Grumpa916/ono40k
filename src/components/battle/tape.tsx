import { Undo2 } from "lucide-react";
import { useState } from "react";
import { useSecondClock } from "@/components/battle/clock";
import { Button } from "@/components/ui/button";
import { type Game, type LedgerEvent, type LedgerEventKind } from "@/data/types";
import { cn, battleElapsedMs, formatClock } from "@/lib/utils";

export function TapeClock({ game }: { game: Game }) {
  const now = useSecondClock(game.status === "active");
  return <>{formatClock(battleElapsedMs(game, now))}</>;
}

export function tapeDot(kind: LedgerEventKind) {
  if (kind === "destroyed") return "bg-blood";
  if (kind === "battleShock") return "bg-steel";
  if (kind === "stratagem") return "bg-primary";
  if (kind === "action") return "bg-ok";
  if (kind === "score") return "bg-ok";
  if (kind === "prebattle") return "bg-ok";
  if (kind === "turn") return "bg-foreground";
  return "bg-muted-foreground";
}

export function tapeContext(ev: LedgerEvent): string | null {
  if (ev.round == null) return null;
  return `R${ev.round}`;
}

function possessiveTurn(name: string): string {
  return name.trim().toLowerCase() === "you" ? "Your turn begins." : `${name}'s turn begins.`;
}

function playVerb(name: string): string {
  return name.trim().toLowerCase() === "you" ? "You play" : `${name} plays`;
}

function countShift(from: number, to: number, noun: string): string {
  const n = Math.abs(to - from);
  const word = n === 1 ? noun : `${noun}s`;
  if (noun === "wound") {
    return to < from ? `takes ${n} ${word} (${to} left)` : `regains ${n} ${word} (${to} left)`;
  }
  return to < from ? `loses ${n} ${word} (${to} left)` : `recovers ${n} ${word} (${to} left)`;
}

function shiftClause(clause: string): string | null {
  const models = clause.match(/^models (\d+) → (\d+)$/);
  if (models) return countShift(Number(models[1]), Number(models[2]), "model");
  const wounds = clause.match(/^wounds (\d+) → (\d+)$/);
  if (wounds) return countShift(Number(wounds[1]), Number(wounds[2]), "wound");
  if (clause === "hidden") return "hides";
  if (clause === "revealed") return "is revealed";
  if (clause === "destroyed") return "is destroyed";
  if (clause === "restored") return "returns to the fight";
  if (clause === "Battle-shocked") return "fails a Battle-shock test";
  if (clause === "rallied") return "rallies";
  return null;
}

function unitLine(summary: string): string | null {
  const split = summary.match(/^.*? · (.+)$/);
  if (!split) return null;
  const bits = split[1].split(" · ");
  const head = bits[0] ?? "";
  const known = head.match(/^(.*) (destroyed|restored|Battle-shocked|rallied|hidden|revealed|models \d+ → \d+|wounds \d+ → \d+)$/);
  if (!known) return null;
  const name = known[1];
  const clauses = [known[2], ...bits.slice(1)];
  const modelLoss = clauses.some((clause) => {
    const models = clause.match(/^models (\d+) → (\d+)$/);
    return models ? Number(models[2]) < Number(models[1]) : false;
  });
  const shown = modelLoss ? clauses.filter((clause) => !clause.startsWith("wounds ")) : clauses;
  const actions = shown.map(shiftClause).filter((part): part is string => Boolean(part));
  if (actions.length === 0) return null;
  const [first, ...rest] = actions;
  const sentence = rest.length === 0 ? first : `${first} and ${rest.join(" and ")}`;
  return `${name} ${sentence}.`;
}

export function tapeLine(ev: LedgerEvent): string {
  if (ev.kind === "turn") {
    const handoff = ev.summary.match(/^Turn ended · (.+)'s turn$/);
    if (handoff) return possessiveTurn(handoff[1]);
    const round = ev.summary.match(/^Turn ended · Round (\d+), (.+)$/);
    if (round) {
      const who = round[2].trim().toLowerCase() === "you" ? "Your turn." : `${round[2]}'s turn.`;
      return `Round ${round[1]} begins. ${who}`;
    }
    if (/^Battle ended/i.test(ev.summary)) return "The battle ends.";
  }
  if (ev.kind === "stratagem") {
    const played = ev.summary.match(/^(.*?) · (.+?)(?: \((\d+) CP\))?$/);
    if (played) {
      const cost = played[3] ? ` for ${played[3]} CP` : "";
      return `${playVerb(played[1])} ${played[2]}${cost}.`;
    }
  }
  if (ev.kind === "action") {
    const act = ev.summary.match(/^.*? · (.+?) (starts|completes|fails) (.+)$/);
    if (act) {
      if (act[2] === "starts") return `${act[1]} starts the ${act[3]} action.`;
      if (act[2] === "completes") return `${act[1]} completes ${act[3]}.`;
      return `${act[1]} fails ${act[3]}.`;
    }
  }
  if (ev.kind === "destroyed" || ev.kind === "battleShock" || ev.kind === "unit") {
    const line = unitLine(ev.summary);
    if (line) return line;
  }
  return ev.summary.endsWith(".") ? ev.summary : ev.summary;
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
  const visible = log.filter((ev) => ev.kind !== "phase");
  const shown = full ? visible : visible.slice(0, 5);
  const turnName = game.activeSide === "me" ? game.myName : game.opponentName;
  const turnLine = turnName.trim().toLowerCase() === "you" ? "Your turn" : `${turnName}'s turn`;
  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Ledger tape</p>
        <div className="flex items-center gap-1.5">
          {visible.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => setFull((v) => !v)}>
              {full ? "Last 5" : `Full ledger${visible.length > 5 ? ` · ${visible.length}` : ""}`}
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
            Round {game.round} · {game.status === "complete" ? "Closed" : "Live"}
          </p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            <TapeClock game={game} />
          </p>
        </div>
        <p className="mt-0.5 text-sm font-medium">{turnLine}</p>
      </div>
      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Turns, unit status, scoring, stratagems, and actions land here.</p>
      ) : (
        <ol className={cn("space-y-1.5", full && "max-h-80 overflow-y-auto")}>
          {shown.map((ev) => {
            const ctx = tapeContext(ev);
            return (
              <li key={ev.id} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", tapeDot(ev.kind))} />
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">{tapeLine(ev)}</span>
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

