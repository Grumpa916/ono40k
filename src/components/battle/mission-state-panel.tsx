import { useMemo } from "react";
import type { MissionInfo } from "@/data/missions";
import { missionConditions } from "@/lib/engine/mission";
import { useWarStore } from "@/lib/store";
import type { Game } from "@/data/types";
import type { Disposition } from "@/data/types";

export function MissionStatePanel({
  game,
  mission,
  mineDisp,
  theirDisp,
}: {
  game: Game;
  mission: MissionInfo | null;
  mineDisp: string | null;
  theirDisp: string | null;
}) {
  const completeAction = useWarStore((s) => s.completeMissionAction);
  const addMarker = useWarStore((s) => s.addOperationMarker);
  const removeMarker = useWarStore((s) => s.removeOperationMarker);

  const conditions = useMemo(() => {
    if (!mission || !mineDisp || !theirDisp) return [];
    return missionConditions(mineDisp as Disposition, theirDisp as Disposition);
  }, [mission, mineDisp, theirDisp]);

  const needsActions = conditions.some((c) => c.kind === "ACTION_COMPLETED");
  const needsMarkers = conditions.some((c) => c.kind === "OPERATION_MARKER_COUNT");
  const needsDestruction = conditions.some((c) => c.kind === "DESTROYED_DURING_WINDOW");

  const currentTurnEvents = (game.missionEvents ?? []).filter(
    (e) => e.round === game.round && e.turn === game.activeSide,
  );
  const destroyed = currentTurnEvents.filter((e) => e.kind === "unitDestroyed");
  const completed = currentTurnEvents.filter((e) => e.kind === "actionCompleted");
  const markers = (game.missionEvents ?? []).filter((e) => e.kind === "operationMarker");

  const actionNames = [...new Set(
    conditions
      .filter((c) => c.kind === "ACTION_COMPLETED" && c.actionName)
      .map((c) => c.actionName!),
  )];

  if (!needsActions && !needsMarkers && !needsDestruction) return null;

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/10 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Mission state</p>
        <span className="text-[9px] text-muted-foreground">turn {game.round} · {game.activeSide === "me" ? "You" : "Opp"}</span>
      </div>

      {needsDestruction ? (
        <div className="mb-1.5 flex items-center justify-between rounded border border-border/70 px-2 py-1.5 text-[10px]">
          <span>Units destroyed this turn</span>
          <span className="font-mono font-semibold">{destroyed.length}</span>
        </div>
      ) : null}

      {needsActions ? (
        <div className="mb-1.5 rounded border border-border/70 p-2">
          <div className="mb-1 text-[9px] uppercase tracking-wide text-muted-foreground">Actions</div>
          <div className="space-y-1">
            {actionNames.map((name) => {
              const done = completed.some((e) => e.actionName?.toLowerCase() === name.toLowerCase() && e.side === game.activeSide);
              return (
                <div key={name} className="flex items-center justify-between gap-2">
                  <span className={done ? "text-ok" : "text-foreground"}>{name}</span>
                  <button
                    type="button"
                    disabled={done || game.status === "complete"}
                    onClick={() => completeAction(name)}
                    className="h-6 rounded border px-2 text-[9px] font-medium disabled:opacity-40"
                  >
                    {done ? "Done" : "Complete"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {needsMarkers ? (
        <div className="rounded border border-border/70 p-2">
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-wide text-muted-foreground">
            <span>Operation markers</span>
            <span className="font-mono">{markers.filter((m) => m.side === game.activeSide).length}</span>
          </div>
          <div className="mb-1.5 grid grid-cols-2 gap-1">
            <button type="button" onClick={() => addMarker()} className="h-7 rounded border text-[9px]">+ Battlefield</button>
            <button type="button" onClick={() => addMarker(undefined, "opponentHome")} className="h-7 rounded border text-[9px]">+ Opp Home</button>
            <button type="button" onClick={() => addMarker(undefined, "myHome")} className="h-7 rounded border text-[9px]">+ My Home</button>
            <button type="button" onClick={() => addMarker(undefined, "centreObjective")} className="h-7 rounded border text-[9px]">+ Centre Obj</button>
          </div>
          {markers.filter((m) => m.side === game.activeSide).map((marker) => (
            <div key={marker.id} className="flex items-center justify-between border-t border-border/50 py-1 text-[9px]">
              <span>{marker.markerLocation ?? "battlefield"}</span>
              <button type="button" onClick={() => removeMarker(marker.markerId!)} className="underline text-muted-foreground">remove</button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
