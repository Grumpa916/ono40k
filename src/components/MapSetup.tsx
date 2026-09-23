import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { BattleMap } from "@/components/BattleMap";
import { Button } from "@/components/ui/button";
import { formatCorner, terrainMeasures, type MapLayout } from "@/data/maps";
import { TERRAIN_MARKS } from "@/data/terrain-marks";
import { cn } from "@/lib/utils";

export function MapSetup({
  layout,
  layouts,
  onPick,
  onClose,
}: {
  layout: MapLayout;
  layouts: MapLayout[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const pieces = terrainMeasures(layout.terrain, TERRAIN_MARKS[layout.id]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    setActive(null);
  }, [layout.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const picked = pieces.find((piece) => piece.n === active);
  const toggle = (n: number) => setActive((cur) => (cur === n ? null : n));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${layout.name} terrain placement`}
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{layout.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">44″ × 60″ · terrain placement before the battle</p>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close map">
          <X />
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3 py-2">
        {layouts.map((option) => {
          const on = option.id === layout.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onPick(option.id)}
              className={cn(
                "rounded-md border py-1.5 text-xs font-medium",
                on ? "border-primary bg-accent" : "border-border bg-card text-muted-foreground",
              )}
            >
              {option.letter}
              <span className="mt-0.5 block truncate text-[10px] font-normal">{option.name.replace(/^Layout [ABC] · /, "")}</span>
            </button>
          );
        })}
      </div>
      <div className="shrink-0 px-3">
        <BattleMap layout={layout} measure activePiece={active} onPiece={toggle} className="mx-auto max-h-[42vh] w-auto max-w-full" />
        <div className="space-y-0.5 py-2">
          {picked ? (
            <>
              <p className="text-[11px] font-medium">{picked.mark}</p>
              {picked.corners.map((corner) => (
                <p key={corner.id} className="text-[11px] leading-tight text-muted-foreground">
                  {formatCorner(corner)}
                </p>
              ))}
            </>
          ) : (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Tap a footprint. Dots mark the three corners. Measure each to the nearer board edge, to the nearest ½″.
            </p>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3">
        <div className="grid grid-cols-2 gap-1.5">
          {pieces.map((piece) => {
            const on = piece.n === active;
            return (
              <button
                key={piece.n}
                id={`terrain-piece-${piece.n}`}
                type="button"
                onClick={() => setActive(on ? null : piece.n)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-left",
                  on ? "border-primary bg-accent" : "border-border bg-card",
                )}
              >
                <p className="text-[11px] font-medium">{piece.mark}</p>
                {piece.corners.map((corner) => (
                  <p key={corner.id} className="text-[11px] leading-tight text-muted-foreground">
                    {formatCorner(corner)}
                  </p>
                ))}
              </button>
            );
          })}
        </div>
        <Button type="button" className="mt-3 w-full" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
