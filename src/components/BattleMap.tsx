import { areaLabel, layoutMeasureLabels, layoutTerrainBadges, placementGuides, territoryGuide, terrainMeasures, type MapLayout, type TerrainMeasure } from "@/data/maps";
import { TERRAIN_MARKS } from "@/data/terrain-marks";
import { cn } from "@/lib/utils";

export function BattleMap({
  layout,
  className,
  compact = false,
  measure = false,
  activePiece = null,
  onPiece,
  sides,
  zones = false,
}: {
  layout: MapLayout;
  className?: string;
  compact?: boolean;
  measure?: boolean;
  activePiece?: number | null;
  onPiece?: (n: number) => void;
  /** Ledger map: name each player's territory and measure the deployment zones. */
  sides?: { attacker: string; defender: string };
  /** Setup map: draw deployment-zone depths while measuring terrain. */
  zones?: boolean;
}) {
  const pieces = measure ? terrainMeasures(layout.terrain, TERRAIN_MARKS[layout.id]) : [];
  const bySource = new Map(pieces.map((piece) => [piece.source, piece]));
  const labelled = pieces.filter((piece) => /^[A-Z]/.test(piece.mark));
  const badges = layoutTerrainBadges(labelled, layout.markers);
  const byN = new Map(labelled.map((piece) => [piece.n, piece]));
  const active = pieces.find((piece) => piece.n === activePiece) ?? null;
  const zoneGuide = !compact && (Boolean(sides) || zones) ? territoryGuide(layout.zones, layout.markers) : null;
  const split = zoneGuide && sides && !measure ? zoneGuide : null;

  return (
    <svg
      viewBox={measure ? "-14 -8 88 63" : "0 0 60 44"}
      className={cn("w-full overflow-visible", className)}
      role="img"
      aria-label={`${layout.name} on a ${layout.board} board`}
    >
      {measure ? <BoardRuler /> : null}
      <rect width="60" height="44" fill="var(--color-muted)" />
      {layout.zones.map((z) => (
        <polygon
          key={z.side}
          points={z.points}
          fill={z.side === "defender" ? "var(--color-steel)" : "var(--color-blood)"}
          fillOpacity="0.22"
          stroke={z.side === "defender" ? "var(--color-steel)" : "var(--color-blood)"}
          strokeWidth={compact ? 0.5 : 0.32}
          strokeOpacity="0.9"
        />
      ))}
      {layout.terrain.map((points, i) => {
        const piece = bySource.get(i);
        const dim = Boolean(active && piece && piece.n !== active.n);
        const on = Boolean(active && piece && piece.n === active.n);
        return (
          <polygon
            key={`t-${i}`}
            points={points}
            fill={on ? "var(--color-primary)" : "var(--color-foreground)"}
            fillOpacity={on ? 0.16 : dim ? 0.03 : 0.04}
            stroke={on ? "var(--color-primary)" : "var(--color-foreground)"}
            strokeWidth={compact ? 0.42 : on ? 0.4 : 0.26}
            strokeOpacity={dim ? 0.28 : on ? 1 : 0.4}
            strokeDasharray={compact || on ? undefined : "1.15 0.7"}
            className={measure && onPiece ? "cursor-pointer" : undefined}
            onClick={
              measure && onPiece && piece
                ? (event) => {
                    event.stopPropagation();
                    onPiece(piece.n);
                  }
                : undefined
            }
          />
        );
      })}
      {layout.ruins.map((points, i) => (
        <polygon
          key={`r-${i}`}
          points={points}
          fill="var(--color-background)"
          stroke="var(--color-foreground)"
          strokeWidth={compact ? 0.32 : 0.18}
          strokeOpacity="0.75"
          pointerEvents="none"
        />
      ))}
      {layout.markers.map((m, i) => (
        <g key={`m-${i}`} pointerEvents="none">
          <circle
            cx={m.x}
            cy={m.y}
            r={compact || measure ? 0.85 : 1.7}
            fill="var(--color-card)"
            stroke={m.owner === "attacker" ? "var(--color-blood)" : m.owner === "defender" ? "var(--color-steel)" : "var(--color-foreground)"}
            strokeWidth="0.35"
          />
          {compact || measure ? null : (
            <text
              x={m.x}
              y={m.y + 0.7}
              textAnchor="middle"
              fill="var(--color-foreground)"
              fontSize="2.2"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {areaLabel(m.kind)}
            </text>
          )}
        </g>
      ))}
      <rect width="60" height="44" fill="none" stroke="var(--color-border)" strokeWidth="0.5" pointerEvents="none" />
      {split && sides ? <TerritoryOverlay split={split} attacker={sides.attacker} defender={sides.defender} /> : null}
      {zones && measure && zoneGuide ? (
        <g pointerEvents="none">
          {zoneGuide.depths.map((depth) => (
            <DepthMark key={`${depth.side}-${depth.label}-${depth.x1}-${depth.y1}`} depth={depth} />
          ))}
        </g>
      ) : null}
      {measure
        ? badges.map((badge) => {
            const piece = byN.get(badge.n);
            if (!piece) return null;
            return (
              <PieceBadge
                key={`n-${badge.n}`}
                piece={piece}
                at={badge}
                active={piece.n === activePiece}
                onPick={onPiece}
              />
            );
          })
        : null}
      {active ? <MeasureGuides piece={active} /> : null}
    </svg>
  );
}

function TerritoryOverlay({
  split,
  attacker,
  defender,
}: {
  split: NonNullable<ReturnType<typeof territoryGuide>>;
  attacker: string;
  defender: string;
}) {
  const names = {
    attacker: (attacker.trim() || "Attacker").slice(0, 14),
    defender: (defender.trim() || "Defender").slice(0, 14),
  };
  const spot =
    split.attackerSide === "bottom" || split.attackerSide === "top"
      ? {
          attacker: { x: 46, y: split.attackerSide === "bottom" ? 24.6 : 20.2 },
          defender: { x: 46, y: split.attackerSide === "bottom" ? 20.2 : 24.6 },
          anchor: "start" as const,
        }
      : {
          attacker: { x: split.attackerSide === "left" ? 26.6 : 33.4, y: 22.6 },
          defender: { x: split.attackerSide === "left" ? 33.4 : 26.6, y: 22.6 },
          anchor: null,
        };
  return (
    <g pointerEvents="none" fontFamily="ui-sans-serif, system-ui, sans-serif">
      <line
        x1={split.x1}
        y1={split.y1}
        x2={split.x2}
        y2={split.y2}
        stroke="var(--color-foreground)"
        strokeWidth="0.32"
        strokeDasharray="1.15 0.75"
        strokeOpacity="0.9"
      />
      <NamedSide
        x={spot.attacker.x}
        y={spot.attacker.y}
        name={names.attacker}
        anchor={spot.anchor ?? (split.attackerSide === "left" ? "end" : "start")}
        color="var(--color-blood)"
      />
      <NamedSide
        x={spot.defender.x}
        y={spot.defender.y}
        name={names.defender}
        anchor={spot.anchor ?? (split.attackerSide === "left" ? "start" : "end")}
        color="var(--color-steel)"
      />
      {split.depths.map((depth) => (
        <DepthMark key={`${depth.side}-${depth.label}-${depth.x1}-${depth.y1}`} depth={depth} />
      ))}
    </g>
  );
}

function NamedSide({
  x,
  y,
  name,
  anchor,
  color,
}: {
  x: number;
  y: number;
  name: string;
  anchor: "start" | "end";
  color: string;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      stroke="var(--color-background)"
      strokeWidth="0.45"
      paintOrder="stroke"
      fontSize="2"
    >
      {name}
    </text>
  );
}

function DepthMark({ depth }: { depth: { x1: number; y1: number; x2: number; y2: number; label: string; side: string } }) {
  const dx = depth.x2 - depth.x1;
  const dy = depth.y2 - depth.y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const tick = 0.85;
  const mx = (depth.x1 + depth.x2) / 2;
  const my = (depth.y1 + depth.y2) / 2;
  const color = depth.side === "attacker" ? "var(--color-blood)" : "var(--color-steel)";
  const w = Math.max(4.4, depth.label.length * 1.2 + 1.3);
  return (
    <g>
      <line x1={depth.x1} y1={depth.y1} x2={depth.x2} y2={depth.y2} stroke={color} strokeWidth="0.22" />
      <line x1={depth.x1 - px * tick} y1={depth.y1 - py * tick} x2={depth.x1 + px * tick} y2={depth.y1 + py * tick} stroke={color} strokeWidth="0.22" />
      <line x1={depth.x2 - px * tick} y1={depth.y2 - py * tick} x2={depth.x2 + px * tick} y2={depth.y2 + py * tick} stroke={color} strokeWidth="0.22" />
      <rect x={mx - w / 2} y={my - 1.15} width={w} height={2.3} rx="0.35" fill="var(--color-card)" stroke={color} strokeWidth="0.18" />
      <text x={mx} y={my + 0.5} textAnchor="middle" fill="var(--color-foreground)" fontSize="1.7">
        {depth.label}
      </text>
    </g>
  );
}

function BoardRuler() {
  const xs = [0, 12, 24, 36, 48, 60];
  const ys = [0, 12, 24, 36, 44];
  return (
    <g fill="var(--color-muted-foreground)" stroke="var(--color-muted-foreground)" fontFamily="ui-sans-serif, system-ui, sans-serif">
      {xs.map((x) => (
        <g key={`x-${x}`}>
          <line x1={x} y1={-0.35} x2={x} y2={-1.7} strokeWidth="0.25" />
          <text x={x} y={-2.35} textAnchor="middle" stroke="none" fontSize="2.15">
            {x}
          </text>
        </g>
      ))}
      {ys.map((y) => (
        <g key={`y-${y}`}>
          <line x1={-0.35} y1={y} x2={-1.7} y2={y} strokeWidth="0.25" />
          <text x={-2.15} y={y + 0.7} textAnchor="end" stroke="none" fontSize="2.15">
            {y}
          </text>
        </g>
      ))}
    </g>
  );
}

function PieceBadge({
  piece,
  at,
  active,
  onPick,
}: {
  piece: TerrainMeasure;
  at?: { x: number; y: number };
  active: boolean;
  onPick?: (n: number) => void;
}) {
  const cx = at?.x ?? (piece.minX + piece.maxX) / 2;
  const cy = at?.y ?? (piece.minY + piece.maxY) / 2;
  const w = Math.max(3.6, piece.mark.length * 1.02 + 1.15);
  const h = 2.25;
  return (
    <g className={onPick ? "cursor-pointer" : undefined} onClick={onPick ? () => onPick(piece.n) : undefined}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx="0.4" fill="transparent" />
      <rect
        x={cx - w / 2}
        y={cy - h / 2}
        width={w}
        height={h}
        rx="0.4"
        fill={active ? "var(--color-primary)" : "var(--color-card)"}
        stroke="var(--color-foreground)"
        strokeWidth="0.28"
        pointerEvents="none"
      />
      <text
        x={cx}
        y={cy + 0.48}
        textAnchor="middle"
        fill={active ? "var(--color-primary-foreground)" : "var(--color-foreground)"}
        fontSize={piece.mark.length > 3 ? 1.2 : 1.45}
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        pointerEvents="none"
      >
        {piece.mark}
      </text>
    </g>
  );
}

function MeasureGuides({ piece }: { piece: TerrainMeasure }) {
  const guides = placementGuides(piece);
  const labels = layoutMeasureLabels(piece);
  const cx = (piece.minX + piece.maxX) / 2;
  const cy = (piece.minY + piece.maxY) / 2;
  const marked = new Set(guides.map((guide) => guide.cornerId));
  return (
    <g pointerEvents="none" fontFamily="ui-sans-serif, system-ui, sans-serif">
      {guides.map((guide) => {
        const x1 = guide.kind === "down" ? guide.x : guide.edge === "left" ? 0 : 60;
        const y1 = guide.kind === "down" ? (guide.edge === "top" ? 0 : 44) : guide.y;
        return <DimLine key={`${guide.cornerId}-${guide.kind}`} x1={x1} y1={y1} x2={guide.x} y2={guide.y} />;
      })}
      {piece.corners
        .filter((corner) => marked.has(corner.id))
        .map((corner) => {
          const dx = corner.x - cx;
          const dy = corner.y - cy;
          const len = Math.hypot(dx, dy) || 1;
          return (
            <g key={corner.id}>
              <circle cx={corner.x} cy={corner.y} r="0.85" fill="var(--color-primary)" stroke="var(--color-background)" strokeWidth="0.2" />
              <text
                x={corner.x + (dx / len) * 1.85}
                y={corner.y + (dy / len) * 1.85 + 0.45}
                textAnchor="middle"
                fill="var(--color-foreground)"
                stroke="var(--color-background)"
                strokeWidth="0.35"
                paintOrder="stroke"
                fontSize="1.55"
                fontWeight="700"
              >
                {corner.id}
              </text>
            </g>
          );
        })}
      {labels.map((label, i) => {
        const off = label.axis === "y" ? label.x - label.anchorX : label.y - label.anchorY;
        const stub = Math.abs(off) > 1.1;
        return (
          <g key={`${label.label}-${i}`}>
            {stub ? (
              <line
                x1={label.axis === "y" ? label.anchorX : label.x}
                y1={label.axis === "y" ? label.y : label.anchorY}
                x2={label.x}
                y2={label.y}
                stroke="var(--color-primary)"
                strokeWidth="0.16"
              />
            ) : null}
            <MeasureTag x={label.x} y={label.y} w={label.w} h={label.h} label={label.label} />
          </g>
        );
      })}
    </g>
  );
}

function DimLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const tick = 0.7;
  return (
    <g stroke="var(--color-primary)" strokeWidth="0.22">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="0.55 0.38" />
      <line x1={x1 - px * tick} y1={y1 - py * tick} x2={x1 + px * tick} y2={y1 + py * tick} />
      <line x1={x2 - px * tick} y1={y2 - py * tick} x2={x2 + px * tick} y2={y2 + py * tick} />
    </g>
  );
}

function MeasureTag({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx="0.3"
        fill="var(--color-card)"
        stroke="var(--color-primary)"
        strokeWidth="0.2"
      />
      <text x={x} y={y + 0.48} textAnchor="middle" fill="var(--color-foreground)" fontSize="1.55">
        {label}
      </text>
    </g>
  );
}

