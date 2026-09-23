import { useEffect, useState } from "react";
import { cardScored, unscoredFirst, SecondaryScore } from "@/components/battle/score-lines";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FIXED_SECONDARIES, SECONDARIES, cardAward, secondaryLines, secondaryVp } from "@/data/secondaries";
import type { Game } from "@/data/types";
import { useWarStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SecondaryPanel({ game, locked }: { game: Game; locked: boolean }) {
  const side = game.viewing;
  const score = game.scores[side];
  const toggleFixedSecondary = useWarStore((s) => s.toggleFixedSecondary);
  const toggleTacticalActive = useWarStore((s) => s.toggleTacticalActive);
  const setSecondaryScore = useWarStore((s) => s.setSecondaryScore);
  const ensureSecondaryMeta = useWarStore((s) => s.ensureSecondaryMeta);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const mode = score.secondaryMode ?? null;
  const fixedIds = score.fixedIds ?? [];
  const active = score.tacticalActive ?? [];
  const ids = mode === "fixed" ? fixedIds : mode === "tactical" ? active : [];
  const pts = secondaryVp(mode, ids, score.secondaryChecks);
  useEffect(() => {
    ensureSecondaryMeta(side);
  }, [ensureSecondaryMeta, side, ids.join("|")]);

  const selectedCard = (id: string, discard?: boolean) => {
    const card = (mode === "fixed" ? FIXED_SECONDARIES : SECONDARIES).find((c) => c.id === id);
    if (!card) return null;
    const scored = cardScored(score.secondaryChecks?.[id]);
    const open = !!openIds[id];
    const award = cardAward(score.secondaryChecks?.[id]);
    const stamp = score.secondaryMeta?.[id];
    return (
      <div key={id} className={cn("min-w-0 rounded-lg border border-border px-2.5 py-1.5", open && "p-3", scored && "opacity-70")}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left text-sm font-medium"
            onClick={() => setOpenIds((m) => ({ ...m, [id]: !m[id] }))}
          >
            {card.name}
            <span className="ml-1.5 font-mono text-xs font-normal tabular-nums text-muted-foreground">{award} VP</span>
          </button>
          {discard ? (
            <Button size="sm" className="h-7 px-2 text-[11px]" variant="ghost" disabled={locked} onClick={() => toggleTacticalActive(side, id)}>
              Discard
            </Button>
          ) : null}
        </div>
        {stamp ? (
          <p className="mt-0.5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            Selected R{stamp.selectedRound}
            {stamp.completedRound != null ? ` · Completed R${stamp.completedRound}` : ""}
          </p>
        ) : null}
        {open ? <p className="mt-1 text-xs text-muted-foreground">{card.blurb}</p> : null}
        <SecondaryScore
          lines={secondaryLines(card, mode === "fixed" ? "fixed" : "tactical")}
          value={award}
          locked={locked}
          compact={!open}
          onPick={(vp) => setSecondaryScore(side, id, vp)}
        />
      </div>
    );
  };

  return (
    <Card className="p-4">
      <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
        Secondary{mode === "fixed" ? " · Fixed" : mode === "tactical" ? " · Tactical" : ""} · {side === "me" ? game.myName : game.opponentName}
      </p>
      <p className="mt-2 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        {mode === "fixed" ? "20 VP / card · 40 cap" : "15 VP / round · 45 cap"} · {pts} VP
      </p>
      {mode == null ? (
        <p className="mt-3 text-xs text-muted-foreground">Secondary type was not set on Setup.</p>
      ) : null}
      {mode === "fixed" ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Pick two. They stay active all game.</p>
          <div className="flex flex-wrap gap-1.5">
            {unscoredFirst(FIXED_SECONDARIES.map((c) => c.id), score.secondaryChecks).map((id) => {
              const card = FIXED_SECONDARIES.find((c) => c.id === id);
              if (!card) return null;
              const on = fixedIds.includes(card.id);
              const scored = cardScored(score.secondaryChecks?.[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={locked || (!on && fixedIds.length >= 2)}
                  onClick={() => toggleFixedSecondary(side, card.id)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium",
                    on ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                    scored && "opacity-60",
                  )}
                >
                  {card.name}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 items-start gap-1.5">
            {unscoredFirst(fixedIds, score.secondaryChecks).map((id) => selectedCard(id))}
          </div>
        </div>
      ) : null}
      {mode === "tactical" ? (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Draw two each Command phase. Tap a card when you draw it. Score it once, then it drops to the bottom.</p>
          <div className="flex flex-wrap gap-1.5">
            {unscoredFirst(SECONDARIES.map((c) => c.id), score.secondaryChecks).map((id) => {
              const card = SECONDARIES.find((c) => c.id === id);
              if (!card) return null;
              const on = active.includes(card.id);
              const scored = cardScored(score.secondaryChecks?.[card.id]);
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={locked}
                  onClick={() => toggleTacticalActive(side, card.id)}
                  className={cn(
                    "h-8 rounded-md border px-2.5 text-xs font-medium",
                    on ? "border-ok/50 bg-ok/15 text-foreground" : "border-border bg-muted text-muted-foreground",
                    scored && "opacity-60",
                  )}
                >
                  {card.name}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 items-start gap-1.5">
            {unscoredFirst(active, score.secondaryChecks).map((id) => selectedCard(id, true))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
