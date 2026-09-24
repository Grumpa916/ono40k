import { useMemo, useState } from "react";
import type { BattleRuntime } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { useWarStore } from "@/lib/store";

export function ObjectiveControlPanel({
  runtime,
  requiredObjectiveIds = [],
}: {
  runtime: BattleRuntime;
  requiredObjectiveIds?: string[];
}) {
  const objectives = Object.values(runtime.objectives);
  const setAbsent = useWarStore((s) => s.setObjectiveSideAbsent);
  const setContribution = useWarStore((s) => s.setObjectiveContribution);
  const confirm = useWarStore((s) => s.confirmObjective);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSide, setEditSide] = useState<"me" | "opponent">("me");
  const [selected, setSelected] = useState<Record<string, number>>({});

  const unitsBySide = useMemo(() => ({
    me: Object.values(runtime.units).filter((u) => u.side === "me" && !u.destroyed && u.modelsRemaining > 0),
    opponent: Object.values(runtime.units).filter((u) => u.side === "opponent" && !u.destroyed && u.modelsRemaining > 0),
  }), [runtime.units]);

  if (!objectives.length) return null;

  const needsScoringUpdate = requiredObjectiveIds.filter((id) => runtime.objectives[id]?.status !== "CONFIRMED");
  const sharedObjectiveUnits = useMemo(() => {
    const byUnit = new Map<string, Set<string>>();
    for (const objective of objectives) {
      for (const contribution of Object.values(objective.contributions)) {
        if (contribution.modelsContributing <= 0 || contribution.componentId.startsWith("__side_absent__:")) continue;
        const ids = byUnit.get(contribution.unitId) ?? new Set<string>();
        ids.add(objective.definition.id);
        byUnit.set(contribution.unitId, ids);
      }
    }
    return [...byUnit.entries()]
      .filter(([, ids]) => ids.size > 1)
      .map(([unitId, ids]) => ({ unitId, objectives: [...ids] }));
  }, [objectives]);

  const beginEdit = (objectiveId: string, side: "me" | "opponent") => {
    const objective = runtime.objectives[objectiveId];
    const next: Record<string, number> = {};
    for (const contribution of Object.values(objective.contributions)) {
      if (contribution.side === side && !contribution.componentId.startsWith("__side_absent__:")) {
        next[contribution.unitId] = contribution.modelsContributing;
      }
    }
    setSelected(next);
    setEditSide(side);
    setEditing(objectiveId);
  };

  const saveEdit = (objectiveId: string) => {
    const units = unitsBySide[editSide];
    const hadAny = Object.values(selected).some((n) => n > 0);
    if (!hadAny) {
      setAbsent(objectiveId, editSide);
    } else {
      for (const unit of units) {
        setContribution(objectiveId, unit.rosterUnit.id, selected[unit.rosterUnit.id] ?? 0);
      }
    }
    confirm(objectiveId);
    setEditing(null);
  };

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Objective control</p>
        <p className="text-[10px] text-muted-foreground">tap only when changed</p>
      </div>

      {sharedObjectiveUnits.length > 0 ? (
        <div className="mb-2 rounded border border-warning/40 bg-warning/10 px-2 py-1.5 text-[9px] text-warning">
          Verify model placement: {sharedObjectiveUnits.map((u) => `${runtime.units[u.unitId]?.definition.name ?? u.unitId} → ${u.objectives.join(" + ")}`).join("; ")}
        </div>
      ) : null}

      {needsScoringUpdate.length > 0 ? (
        <div className="mb-2 flex items-center justify-between gap-2 rounded border border-warning/40 bg-warning/10 px-2 py-1.5">
          <span className="min-w-0 text-[9px] text-warning">
            Scoring needs {needsScoringUpdate.join(", ")}
          </span>
          <div className="flex shrink-0 gap-1">
            {needsScoringUpdate.map((id) => (
              <button
                key={id}
                type="button"
                className="h-6 rounded border border-warning/40 px-2 text-[9px] font-medium"
                onClick={() => beginEdit(id, "me")}
              >
                Update {id}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        {objectives.map((objective) => {
          const controller =
            objective.controller === "me" ? "You" :
            objective.controller === "opponent" ? "Opp" :
            objective.controller === "contested" ? "Contested" : "Unknown";
          const needsUpdate = objective.status !== "CONFIRMED";
          const isEditing = editing === objective.definition.id;

          return (
            <div key={objective.definition.id} className="rounded border border-border/70 bg-background/40 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="font-mono font-semibold">{objective.definition.id}</span>
                  <span className={cn(
                    "rounded px-1 py-0.5 uppercase tracking-wide",
                    objective.status === "CONFIRMED" ? "bg-ok/15" : "bg-muted text-muted-foreground",
                  )}>{objective.status}</span>
                </div>
                <span className="shrink-0 font-mono tabular-nums">
                  {objective.youOc == null ? "?" : objective.youOc}:{objective.opponentOc == null ? "?" : objective.opponentOc}
                  <span className="ml-1 font-sans text-muted-foreground">{controller}</span>
                </span>
              </div>

              {needsUpdate && !isEditing ? (
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  <button type="button" className="h-7 rounded border border-border text-[9px]" onClick={() => beginEdit(objective.definition.id, "me")}>My change</button>
                  <button type="button" className="h-7 rounded border border-border text-[9px]" onClick={() => beginEdit(objective.definition.id, "opponent")}>Opp change</button>
                  <button type="button" className="h-7 rounded border border-border text-[9px]" onClick={() => { setAbsent(objective.definition.id, "me"); setEditing(null); }}>My none</button>
                  <button type="button" className="h-7 rounded border border-border text-[9px]" onClick={() => { setAbsent(objective.definition.id, "opponent"); setEditing(null); }}>Opp none</button>
                </div>
              ) : objective.status === "CONFIRMED" ? (
                <div className="mt-1 flex justify-end">
                  <button type="button" className="h-6 rounded border border-border px-2 text-[9px] text-muted-foreground" onClick={() => beginEdit(objective.definition.id, "me")}>Update</button>
                </div>
              ) : null}

              {isEditing ? (
                <div className="mt-2 border-t border-border/60 pt-2">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button type="button" className={cn("h-6 rounded border px-2 text-[9px]", editSide === "me" ? "bg-muted font-medium" : "text-muted-foreground")} onClick={() => beginEdit(objective.definition.id, "me")}>You</button>
                      <button type="button" className={cn("h-6 rounded border px-2 text-[9px]", editSide === "opponent" ? "bg-muted font-medium" : "text-muted-foreground")} onClick={() => beginEdit(objective.definition.id, "opponent")}>Opp</button>
                    </div>
                    <button type="button" className="text-[9px] underline" onClick={() => setSelected({})}>None</button>
                  </div>
                  <div className="space-y-1">
                    {unitsBySide[editSide].map((unit) => {
                      const id = unit.rosterUnit.id;
                      const count = selected[id] ?? 0;
                      const max = unit.modelsRemaining;
                      return (
                        <div key={id} className="flex items-center justify-between gap-2 rounded border border-border/50 px-2 py-1">
                          <button type="button" className="min-w-0 flex-1 text-left text-[10px]" onClick={() => setSelected((s) => ({ ...s, [id]: count > 0 ? 0 : max }))}>
                            <span className={count > 0 ? "font-medium" : "text-muted-foreground"}>{unit.definition.name}</span>
                            <span className="ml-1 text-muted-foreground">{count > 0 ? count : 0}/{max}</span>
                          </button>
                          {count > 0 && (
                            <div className="flex items-center gap-1">
                              <button type="button" className="h-6 w-6 rounded border" onClick={() => setSelected((s) => ({ ...s, [id]: Math.max(0, count - 1) }))}>−</button>
                              <span className="w-4 text-center text-[10px]">{count}</span>
                              <button type="button" className="h-6 w-6 rounded border" onClick={() => setSelected((s) => ({ ...s, [id]: Math.min(max, count + 1) }))}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-end gap-1">
                    <button type="button" className="h-7 rounded border px-3 text-[9px]" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="button" className="h-7 rounded border border-ok/50 bg-ok/15 px-3 text-[9px] font-medium" onClick={() => saveEdit(objective.definition.id)}>Confirm</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
