import { useMemo, useState } from "react";
import { RuleFold } from "@/components/RuleFold";
import { Badge } from "@/components/ui/badge";
import { getDetachment, getFaction } from "@/data/codex";
import { CORE_STRATAGEMS, stratagemPrimaryPhase, type StratPhaseKey } from "@/data/core";
import { PHASES, type Game, type Roster, type Stratagem } from "@/data/types";
import { useWarStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StratPanel({
  game,
  roster,
  locked,
}: {
  game: Game;
  roster: Roster;
  locked: boolean;
}) {
  const side = game.viewing;
  const playStratagem = useWarStore((s) => s.playStratagem);
  const [fullByPhase, setFullByPhase] = useState<Record<string, boolean>>({});
  const dets = roster.detachmentIds.map((id) => getDetachment(roster.factionId, id)).filter(Boolean);
  const faction = getFaction(roster.factionId);
  const active = game.activeStrats ?? [];
  const list: Array<Stratagem & { source: string }> = [
    ...dets.flatMap((d) => d!.stratagems.map((s) => ({ ...s, source: d!.name }))),
    ...CORE_STRATAGEMS.map((s) => ({ ...s, source: "Core" })),
  ];
  const grouped = useMemo(() => {
    const map = new Map<StratPhaseKey, typeof list>();
    for (const s of list) {
      const key = stratagemPrimaryPhase(s.when);
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => Number(a.source === "Core") - Number(b.source === "Core") || a.name.localeCompare(b.name));
    }
    const order: StratPhaseKey[] = ["any", ...PHASES.map((p) => p.id)];
    return order.filter((k) => map.has(k)).map((k) => [k, map.get(k)!] as const);
  }, [list]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Tap a stratagem to play it and spend the CP.</p>
      {grouped.map(([phase, strats]) => {
        const compact = !fullByPhase[phase];
        const label = phase === "any" ? "Any phase" : (PHASES.find((p) => p.id === phase)?.label ?? phase);
        return (
          <section key={phase}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{label}</h3>
              <button
                type="button"
                className="text-[11px] tracking-wide text-muted-foreground uppercase"
                onClick={() => setFullByPhase((m) => ({ ...m, [phase]: !m[phase] }))}
              >
                {compact ? "Full text" : "1 line"}
              </button>
            </div>
            <ul className="space-y-2">
              {strats.map((s) => {
                const playCount = active.filter((a) => a.stratId === s.id && a.side === side).length;
                const showFull = !compact;
                const unaffordable = locked || game.cp[side] < s.cp;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={unaffordable}
                      onClick={() => playStratagem(side, s, s.source)}
                      className={cn(
                        "w-full rounded-lg border bg-card text-left",
                        playCount > 0 ? "border-steel/50" : "border-border",
                        showFull ? "p-3" : "px-2 py-1.5",
                        unaffordable && "opacity-50",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          {showFull ? (
                            <div>
                              <p className="font-medium">
                                {s.name}
                                {playCount > 1 ? <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">×{playCount}</span> : null}
                              </p>
                              <p className="text-xs text-muted-foreground">{s.when}</p>
                            </div>
                          ) : (
                            <p className="truncate text-sm font-medium">
                              {s.name}
                              <span className="ml-1.5 font-normal text-muted-foreground">
                                · {s.when}
                                {s.source !== "Core" ? ` · ${s.source}` : ""}
                              </span>
                              {playCount > 1 ? <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">×{playCount}</span> : null}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{s.cp} CP</span>
                      </div>
                      {showFull ? <p className="mt-2 text-sm text-muted-foreground">{s.text}</p> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {faction ? <RuleFold kicker="Army rule" title={faction.rule.name} text={faction.rule.text} /> : null}
      {dets.map((d) => (
        <RuleFold
          key={d!.id}
          kicker="Detachment"
          title={d!.name}
          text={`${d!.rule.name}. ${d!.rule.text}`}
          badges={<Badge variant="outline">{d!.disposition}</Badge>}
        />
      ))}
    </div>
  );
}
