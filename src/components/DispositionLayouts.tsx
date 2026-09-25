import { useEffect, useState } from "react";
import { BattleMap } from "@/components/BattleMap";
import { MapSetup } from "@/components/MapSetup";
import { Button } from "@/components/ui/button";
import { formatInches, placementGuides, terrainMeasures, type MapLayout } from "@/data/maps";
import { TERRAIN_MARKS } from "@/data/terrain-marks";
import { cn } from "@/lib/utils";

export function DispositionLayouts({
  layouts,
  mapId,
  onPick,
  pairing,
}: {
  layouts: MapLayout[];
  mapId: string | null;
  onPick: (id: string) => void;
  pairing: string | null;
}) {
  const selected = layouts.find((layout) => layout.id === mapId) ?? null;
  const [active, setActive] = useState<number | null>(null);
  const [guide, setGuide] = useState(false);
  const pieces = selected ? terrainMeasures(selected.terrain, TERRAIN_MARKS[selected.id]) : [];
  const picked = pieces.find((piece) => piece.n === active) ?? null;

  useEffect(() => {
    setActive(null);
    setGuide(false);
  }, [selected?.id]);

  if (layouts.length === 0) {
    return <p className="text-sm text-muted-foreground">Set a force disposition on both armies to load the three Event Companion maps for this pairing.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {pairing ? `${pairing} · ` : ""}
        Event Companion v1.1 · 44″ × 60″. Pick Layout A, B, or C, or roll a D3.
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {layouts.map((layout) => {
          const on = layout.id === selected?.id;
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onPick(layout.id)}
              className={cn("min-w-0 rounded-lg border p-1.5 text-left", on ? "border-primary bg-accent" : "border-border bg-background")}
            >
              <BattleMap layout={layout} compact />
              <p className="mt-1 text-[11px] font-medium leading-tight">Layout {layout.letter}</p>
              <p className="truncate text-[10px] leading-tight text-muted-foreground">{layout.edge}</p>
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          const pick = layouts[Math.floor(Math.random() * layouts.length)];
          if (pick) onPick(pick.id);
        }}
      >
        Roll D3
      </Button>
      {selected ? (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">
              Layout {selected.letter} · {selected.edge}
            </p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Red deploys as the Attacker, blue as the Defender. Zone depths are from the back edge. Tap a footprint. Each number is the distance from that corner to the nearer board edge. The far side is left off when it is only the piece’s own width or depth.
            </p>
          </div>
          <BattleMap
            layout={selected}
            measure
            zones
            activePiece={active}
            onPiece={(n) => setActive((cur) => (cur === n ? null : n))}
            className="mx-auto w-full"
          />
          {picked ? (
            <div className="rounded-lg border border-primary bg-accent px-2.5 py-2">
              <p className="text-[11px] font-medium">{picked.mark}</p>
              {placementGuides(picked).map((guide) => (
                <p key={`${guide.cornerId}-${guide.kind}`} className="text-[11px] leading-tight text-muted-foreground">
                  {guide.cornerId} {formatInches(guide.value)} {guide.edge}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-[11px] leading-snug text-muted-foreground">
              Footprints are 6″×4″, 10″×2½″, 6″×2″, 7″×11½″, and an 8″×11½″ polygon. GH, EF, CD, and AB are the Armageddon terrain features on those areas.
            </p>
          )}
          <Button type="button" variant="outline" className="w-full" onClick={() => setGuide(true)}>
            Placement list
          </Button>
          {guide ? (
            <MapSetup layout={selected} layouts={layouts} onPick={onPick} onClose={() => setGuide(false)} />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a layout to see deployment depths and terrain measurements.</p>
      )}
    </div>
  );
}
