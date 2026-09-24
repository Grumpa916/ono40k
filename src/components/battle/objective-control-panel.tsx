import type { BattleRuntime } from "@/lib/engine/types";
import { cn } from "@/lib/utils";

export function ObjectiveControlPanel({ runtime }: { runtime: BattleRuntime }) {
  const objectives = Object.values(runtime.objectives);
  if (!objectives.length) return null;

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Objective control</p>
        <p className="text-[10px] text-muted-foreground">live snapshot</p>
      </div>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {objectives.map((objective) => {
          const status = objective.status;
          const controller =
            objective.controller === "me"
              ? "You"
              : objective.controller === "opponent"
                ? "Opp"
                : objective.controller === "contested"
                  ? "Contested"
                  : "Unknown";
          return (
            <div key={objective.definition.id} className="flex items-center justify-between rounded border border-border/70 bg-background/40 px-2 py-1.5 text-[10px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="font-mono font-semibold">{objective.definition.id}</span>
                <span className={cn(
                  "rounded px-1 py-0.5 uppercase tracking-wide",
                  status === "CONFIRMED" ? "bg-ok/15 text-foreground" : status === "STALE" ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {status}
                </span>
              </div>
              <div className="shrink-0 text-right">
                <span className="font-mono tabular-nums">
                  {objective.youOc == null ? "?" : objective.youOc}:{objective.opponentOc == null ? "?" : objective.opponentOc}
                </span>
                <span className="ml-1 text-muted-foreground">{controller}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
