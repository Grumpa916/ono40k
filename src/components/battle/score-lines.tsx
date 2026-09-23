import { Check } from "lucide-react";
import { checkCount, parseObjective } from "@/data/missions";
import { cardAward, scoreOptions } from "@/data/secondaries";
import { cn } from "@/lib/utils";

export function ScoreLines({
  lines,
  checks,
  locked,
  focusRound,
  liveRound,
  onToggle,
}: {
  lines: string[];
  checks?: Array<Array<number | boolean>>;
  locked: boolean;
  focusRound?: number;
  liveRound?: number;
  onToggle: (line: number, slot: number, max: number) => void;
}) {
  const viewed = focusRound ?? 1;
  const frontier = liveRound ?? viewed;
  return (
    <ul className="mt-2 space-y-2">
      {lines.map((line, i) => {
        const obj = parseObjective(line);
        const row = checks?.[i] ?? [];
        const max = obj.each ? Math.max(2, Math.min(4, Math.floor(15 / Math.max(1, obj.vp)))) : 1;
        return (
          <li key={`${obj.text}-${i}`} className="min-w-0 sm:flex sm:items-center sm:gap-2">
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <p className="text-xs leading-snug">{obj.text.replace(/\s*\([^)]*\)\s*$/, "")}</p>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                +{obj.vp}
                {obj.each ? " ea" : ""}
              </span>
            </div>
            {obj.once ? (
              <button
                type="button"
                disabled={locked}
                aria-pressed={checkCount(row, 0) > 0}
                onClick={() => onToggle(i, 0, 1)}
                className={cn(
                  "mt-1 flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border px-2 text-[11px] sm:mt-0 sm:w-44",
                  checkCount(row, 0) > 0 ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                )}
              >
                <span className={cn("flex size-3.5 items-center justify-center rounded-sm border", checkCount(row, 0) > 0 ? "border-ok bg-ok text-background" : "border-border")}>
                  {checkCount(row, 0) > 0 ? <Check className="size-2.5" /> : null}
                </span>
                End of battle
              </button>
            ) : (
              <div className="mt-1 grid w-full shrink-0 grid-cols-5 gap-0.5 sm:mt-0 sm:w-44">
                {[0, 1, 2, 3, 4].map((slot) => {
                  const r = slot + 1;
                  const inMission = obj.rounds.includes(r);
                  const reached = r <= frontier;
                  const canEdit = !locked && inMission && reached && r === viewed;
                  const n = checkCount(row, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!canEdit}
                      aria-pressed={n > 0}
                      aria-label={`Round ${r} ${obj.vp} VP`}
                      onClick={() => onToggle(i, slot, max)}
                      className={cn(
                        "flex h-8 items-center justify-center gap-0.5 rounded-md border text-[10px] font-medium",
                        !inMission
                          ? "cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground/40"
                          : n > 0
                            ? "border-ok/50 bg-ok/15 text-foreground"
                            : canEdit
                              ? "border-steel/70 bg-muted text-foreground"
                              : reached
                                ? "cursor-not-allowed border-border bg-muted/70 text-muted-foreground"
                                : "cursor-not-allowed border-border/50 bg-muted/40 text-muted-foreground/40",
                      )}
                    >
                      {`R${r}`}
                      {n > 1 ? <span className="font-mono">×{n}</span> : n === 1 ? <Check className="size-2.5" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function SecondaryScore({
  lines,
  value,
  locked,
  compact,
  onPick,
}: {
  lines: string[];
  value: number;
  locked: boolean;
  compact?: boolean;
  onPick: (vp: number) => void;
}) {
  const options = scoreOptions(lines);
  return (
    <div className="mt-2 space-y-2">
      {compact ? null : (
        <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
          {lines.map((line) => (
            <li key={line}>{parseObjective(line).text.replace(/\s*\([^)]*\)\s*$/, "")}</li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-1.5">
        {options.map((vp) => (
          <button
            key={vp}
            type="button"
            disabled={locked}
            aria-pressed={value === vp}
            onClick={() => onPick(value === vp ? 0 : vp)}
            className={cn(
              "h-8 min-w-12 rounded-md border px-2.5 text-xs font-medium",
              value === vp ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
            )}
          >
            {vp} VP
          </button>
        ))}
      </div>
    </div>
  );
}

export function cardScored(checks?: Array<Array<number | boolean>>): boolean {
  return cardAward(checks) > 0;
}

export function unscoredFirst<T extends string>(ids: T[], checks: Record<string, number[][]> | undefined): T[] {
  return [...ids].sort((a, b) => Number(cardScored(checks?.[a])) - Number(cardScored(checks?.[b])));
}
