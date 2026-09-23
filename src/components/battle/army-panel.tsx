import { Minus, Plus, Skull } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { wargearSummary } from "@/data/wargear";
import { actionCards } from "@/data/secondaries";
import { getUnit } from "@/data/codex";
import type { Game, Roster, RosterUnit, UnitBattleState, UnitDef } from "@/data/types";
import { useWarStore } from "@/lib/store";
import { cn, remainingWounds, unitCopyMarks, unitMaxWounds } from "@/lib/utils";
import { strengthState, woundEffects } from "@/lib/wound-state";

export function patchWounds(
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

export function WoundStepper({
  value,
  max,
  locked,
  alert,
  label,
  onDec,
  onInc,
}: {
  value: number;
  max: number;
  locked: boolean;
  alert?: boolean;
  label?: string;
  onDec: () => void;
  onInc: () => void;
}) {
  const empty = value <= 0;
  const full = value >= max;
  return (
    <div className="flex w-max shrink-0 items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
      {label ? <span className="mr-0.5 text-[9px] tracking-wide text-muted-foreground uppercase">{label}</span> : null}
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

function UnitStat({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center rounded bg-muted px-0.5 py-px">
      <span className="text-[8px] leading-none tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={cn("font-mono text-[11px] leading-tight font-semibold tabular-nums", alert && "text-blood")}>{value}</span>
    </div>
  );
}

export function ArmyPanel({
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
  const startScoringAction = useWarStore((s) => s.startScoringAction);
  const resolveScoringAction = useWarStore((s) => s.resolveScoringAction);
  const score = game.scores[game.viewing];
  const actionOptions = useMemo(() => {
    const ids =
      score.secondaryMode === "fixed" ? (score.fixedIds ?? []) : score.secondaryMode === "tactical" ? (score.tacticalActive ?? []) : [];
    return actionCards(ids);
  }, [score.secondaryMode, score.fixedIds, score.tacticalActive]);
  const ordered = useMemo(() => {
    const rank = (ru: (typeof roster.units)[number]) => {
      const st = game.unitState[ru.id];
      if (!st || st.destroyed) return 3;
      if (st.battleShocked) return 0;
      const def = getUnit(roster.factionId, ru.unitId);
      if (!def) return 2;
      const maxW = unitMaxWounds(def.stats.w);
      const wounds = remainingWounds(st, maxW);
      const level = strengthState({
        modelsStart: ru.models,
        modelsNow: st.modelsRemaining,
        woundsMax: maxW,
        woundsNow: wounds,
        destroyed: false,
      });
      return level.belowHalf ? 1 : 2;
    };
    const nameOf = (ru: (typeof roster.units)[number]) => getUnit(roster.factionId, ru.unitId)?.name ?? "";
    return [...roster.units].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return nameOf(a).localeCompare(nameOf(b));
    });
  }, [roster.units, roster.factionId, game.unitState]);
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
        const running = (game.scoringActions ?? []).find((a) => a.unitId === ru.id);
        return (
          <li
            key={ru.id}
            onClick={() => onOpen(def.id)}
            className={cn(
              "army-row cursor-pointer rounded-lg border border-border bg-card px-2.5 py-1.5",
              st.destroyed && "opacity-50",
              !st.destroyed && st.battleShocked && "border-blood/50 bg-blood/10",
              !st.destroyed && !st.battleShocked && penalised && "border-blood/40 bg-blood/10",
              !st.destroyed && !penalised && buffed && "border-ok/50 bg-ok/10",
            )}
          >
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-4 flex min-w-0 items-center gap-1.5">
                <span className="min-w-0 truncate text-left text-sm font-medium leading-5">
                  {def.name}
                  {copies[ru.id] ? <span className="ml-1.5 text-[10px] tracking-widest text-steel">[{copies[ru.id]}]</span> : null}
                  {ru.warlord ? <span className="ml-1.5 text-[10px] tracking-widest uppercase text-steel">WL</span> : null}
                </span>
                <Button
                  size="sm"
                  className="h-7 shrink-0 px-2 text-[11px]"
                  variant={st.battleShocked ? "blood" : "outline"}
                  disabled={locked}
                  onClick={(event) => {
                    event.stopPropagation();
                    setUnitState(ru.id, { battleShocked: !st.battleShocked });
                  }}
                >
                  BS
                </Button>
                <Button
                  size="sm"
                  className="h-7 shrink-0 px-2 text-[11px]"
                  variant={st.destroyed ? "secondary" : "outline"}
                  disabled={locked}
                  aria-label="Destroyed"
                  onClick={(event) => {
                    event.stopPropagation();
                    setUnitState(
                      ru.id,
                      st.destroyed
                        ? { destroyed: false, modelsRemaining: ru.models, woundsOnCurrent: maxW }
                        : { destroyed: true, modelsRemaining: 0, woundsOnCurrent: 0 },
                    );
                  }}
                >
                  <Skull className="size-3.5" />
                </Button>
              </div>
              <div className="col-span-8 col-start-5 flex min-w-0 items-center gap-1.5">
                <WoundStepper
                  value={wounds}
                  max={maxW}
                  locked={locked}
                  alert={penalised}
                  label="Wounds"
                  onDec={() => applyWounds(-1)}
                  onInc={() => applyWounds(1)}
                />
                {ru.models > 1 ? (
                  <div className="flex shrink-0 items-center gap-0.5" onClick={(event) => event.stopPropagation()}>
                    <span className="mr-0.5 text-[9px] tracking-wide text-muted-foreground uppercase">Models</span>
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
            </div>
            <div className="mt-1 grid w-1/2 min-w-0 grid-cols-6 gap-0.5">
              <UnitStat label="M" value={typeof def.stats.m === "number" ? `${def.stats.m}"` : def.stats.m} />
              <UnitStat label="T" value={def.stats.t} />
              <UnitStat label="SV" value={`${def.stats.sv}+`} />
              <UnitStat label="W" value={wounds} alert={wounds < maxW} />
              <UnitStat label="LD" value={`${def.stats.ld}+`} />
              <UnitStat label="OC" value={def.stats.oc} />
            </div>
            {running || (actionOptions.length > 0 && !st.destroyed) ? (
              <div className="mt-1 flex flex-wrap items-center gap-1" onClick={(event) => event.stopPropagation()}>
                <span className="text-[9px] tracking-wide text-muted-foreground uppercase">{running ? running.name : "Action"}</span>
                {running ? (
                  <>
                    <Button size="sm" className="h-7 px-2 text-[11px]" variant="outline" disabled={locked} onClick={() => resolveScoringAction(running.id, "complete")}>
                      Done
                    </Button>
                    <Button size="sm" className="h-7 px-2 text-[11px]" variant="ghost" disabled={locked} onClick={() => resolveScoringAction(running.id, "fail")}>
                      Fail
                    </Button>
                  </>
                ) : (
                  actionOptions.map((card) => (
                    <Button
                      key={card.id}
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      variant="outline"
                      disabled={locked}
                      onClick={() => startScoringAction(ru.id, card.id)}
                    >
                      {card.name}
                    </Button>
                  ))
                )}
              </div>
            ) : null}
            {extras || ru.notes ? (
              <div className="mt-1 space-y-1">
                {extras ? <p className="truncate text-xs leading-4 text-muted-foreground">{extras}</p> : null}
                {ru.notes ? <p className="truncate text-xs leading-4 text-muted-foreground">{ru.notes}</p> : null}
              </div>
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

