import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Game, Roster } from "@/data/types";
import { useWarStore } from "@/lib/store";
import { battleElapsedMs, formatClock, turnElapsedMs } from "@/lib/utils";
import { rosterDisposition } from "@/lib/validation";

export function useSecondClock(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

export function BattleClock({ game, locked }: { game: Game; locked: boolean }) {
  const pauseClock = useWarStore((s) => s.pauseClock);
  const resumeClock = useWarStore((s) => s.resumeClock);
  const stopClocks = useWarStore((s) => s.stopClocks);
  const resumeClocks = useWarStore((s) => s.resumeClocks);
  const turnsRunning = !!game.runningSince && game.status === "active";
  const clocksStopped = game.status === "active" && game.battleRunningSince === null;
  const now = useSecondClock(!locked && game.status === "active" && !clocksStopped);
  const battle = formatClock(battleElapsedMs(game, now));
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
      <span className="font-mono text-sm tabular-nums">{battle}</span>
      {game.status === "active" ? (
        clocksStopped ? (
          <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={resumeClocks}>
            <Play className="size-3.5" /> Resume game
          </Button>
        ) : (
          <>
            {turnsRunning ? (
              <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={pauseClock}>
                <Pause className="size-3.5" /> Pause current turn
              </Button>
            ) : (
              <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={resumeClock}>
                <Play className="size-3.5" /> Resume
              </Button>
            )}
            <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={stopClocks}>
              Stop game
            </Button>
          </>
        )
      ) : null}
    </div>
  );
}

export function SideClock({ game, side }: { game: Game; side: "me" | "opponent" }) {
  const running = game.status === "active" && !!game.runningSince && game.activeSide === side;
  const now = useSecondClock(running);
  return <span className="font-mono shrink-0 text-xs tabular-nums">{formatClock(turnElapsedMs(game, side, now))}</span>;
}

export function liveRoster(snap: Roster, lists: Roster[]): Roster {
  const live = lists.find((l) => l.id === snap.id);
  const base = live ? { ...snap, detachmentIds: live.detachmentIds, disposition: live.disposition } : snap;
  return { ...base, disposition: rosterDisposition(base) };
}

