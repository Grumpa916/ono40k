import type { Disposition } from "./types";
import { DISPOSITIONS, missionFor } from "./missions";
import { GW_LAYOUTS } from "./gw-layouts";

export type MapLetter = "A" | "B" | "C";

export type MapArea = {
  id: string;
  kind: "home" | "expansion" | "centre";
  owner?: "defender" | "attacker";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MapZone = {
  side: "defender" | "attacker";
  points: string;
};

export type MapMarker = {
  kind: MapArea["kind"];
  owner?: "defender" | "attacker";
  x: number;
  y: number;
};

export type MapLayout = {
  id: string;
  letter: MapLetter;
  a: Disposition;
  b: Disposition;
  name: string;
  blurb: string;
  board: "44×60";
  /** Which table edge the deployment zones sit on. */
  edge: string;
  zones: MapZone[];
  areas: MapArea[];
  terrain: string[];
  ruins: string[];
  markers: MapMarker[];
};

function orderedPair(a: Disposition, b: Disposition): [Disposition, Disposition] {
  return DISPOSITIONS.indexOf(a) <= DISPOSITIONS.indexOf(b) ? [a, b] : [b, a];
}

function layoutMissions(a: Disposition, b: Disposition) {
  const missions = missionFor(a, b);
  return missions.me.name === missions.them.name ? missions.me.name : `${missions.me.name} · ${missions.them.name}`;
}

export const MAPS: MapLayout[] = GW_LAYOUTS.map((layout) => ({
  id: layout.id,
  letter: layout.letter,
  a: layout.a,
  b: layout.b,
  name: `Layout ${layout.letter} · ${layoutMissions(layout.a, layout.b)}`,
  blurb: `${layout.label}. Games Workshop 11th edition Event Companion layout on a 44×60 board.`,
  board: "44×60",
  edge: layout.edge,
  zones: layout.zones,
  areas: [],
  terrain: layout.terrain,
  ruins: layout.ruins,
  markers: layout.markers,
}));

export const MAP_BY_ID: Record<string, MapLayout> = Object.fromEntries(MAPS.map((m) => [m.id, m]));

export function layoutsFor(a: Disposition | null, b: Disposition | null): MapLayout[] {
  if (!a || !b) return [];
  const [left, right] = orderedPair(a, b);
  return MAPS.filter((m) => m.a === left && m.b === right);
}

export function getMap(id: string | null | undefined): MapLayout | undefined {
  if (!id) return undefined;
  return MAP_BY_ID[id];
}

export function areaLabel(kind: MapArea["kind"]) {
  if (kind === "home") return "H";
  if (kind === "expansion") return "E";
  return "C";
}

export type ZoneDepth = {
  side: "attacker" | "defender";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
};

export type TerritorySplit = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  attackerSide: "left" | "right" | "top" | "bottom";
  depths: ZoneDepth[];
};

function zonePoly(points: string): Pt[] {
  const raw = points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
  const pts: Pt[] = [];
  for (const p of raw) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.2) pts.push(p);
  }
  if (pts.length > 1 && Math.hypot(pts[0]!.x - pts[pts.length - 1]!.x, pts[0]!.y - pts[pts.length - 1]!.y) < 0.25) pts.pop();
  return pts;
}

type BoardSide = "left" | "right" | "top" | "bottom";

function borderSide(a: Pt, b: Pt): BoardSide | null {
  if (a.x <= 1.25 && b.x <= 1.25) return "left";
  if (a.x >= 58.75 && b.x >= 58.75) return "right";
  if (a.y <= 1.25 && b.y <= 1.25) return "top";
  if (a.y >= 42.75 && b.y >= 42.75) return "bottom";
  return null;
}

/** Deployment depth from the back edge, plus the line that splits the two territories. */
export function territoryGuide(zones: MapZone[], markers: { x: number; y: number }[] = []): TerritorySplit | null {
  const attacker = zones.find((zone) => zone.side === "attacker");
  const defender = zones.find((zone) => zone.side === "defender");
  if (!attacker || !defender) return null;
  const poly = zonePoly(attacker.points);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let cx = 0;
  let cy = 0;
  for (const p of poly) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    cx += p.x;
    cy += p.y;
  }
  cx /= poly.length || 1;
  cy /= poly.length || 1;
  const spansWidth = maxX - minX > 45;
  const spansHeight = maxY - minY > 36;
  const horizontal = spansWidth || (!spansHeight && (minY > 16 || maxY < 28));
  const attackerSide: TerritorySplit["attackerSide"] = horizontal ? (cy < 22 ? "top" : "bottom") : cx < 30 ? "left" : "right";
  return {
    x1: horizontal ? 0 : 30,
    y1: horizontal ? 22 : 0,
    x2: horizontal ? 60 : 30,
    y2: horizontal ? 22 : 44,
    attackerSide,
    depths: zones.flatMap((zone) => zoneDepths(zone, markers)),
  };
}

function zoneDepths(zone: MapZone, markers: { x: number; y: number }[]): ZoneDepth[] {
  const pts = zonePoly(zone.points);
  if (pts.length < 3) return [];
  const contact: Record<BoardSide, number> = { left: 0, right: 0, top: 0, bottom: 0 };
  const edges: { a: Pt; b: Pt; border: BoardSide | null }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    const border = borderSide(a, b);
    const len = Math.hypot(a.x - b.x, a.y - b.y);
    if (border) contact[border] += len;
    edges.push({ a, b, border });
  }
  const back = (Object.entries(contact) as [BoardSide, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!back || contact[back] < 8) return [];
  const vertical = back === "left" || back === "right";
  type Run = { depth: number; at: number; lo: number; hi: number };
  const runs: Run[] = [];
  for (const edge of edges) {
    if (edge.border) continue;
    const dx = Math.abs(edge.a.x - edge.b.x);
    const dy = Math.abs(edge.a.y - edge.b.y);
    if (vertical) {
      if (dx > 0.9 || dy < 6) continue;
      const at = (edge.a.x + edge.b.x) / 2;
      const depth = back === "left" ? at : 60 - at;
      runs.push({ depth, at, lo: Math.min(edge.a.y, edge.b.y), hi: Math.max(edge.a.y, edge.b.y) });
    } else {
      if (dy > 0.9 || dx < 6) continue;
      const at = (edge.a.y + edge.b.y) / 2;
      const depth = back === "top" ? at : 44 - at;
      runs.push({ depth, at, lo: Math.min(edge.a.x, edge.b.x), hi: Math.max(edge.a.x, edge.b.x) });
    }
  }
  if (runs.length === 0) return diagonalDepth(zone.side, pts, back);
  const groups: Run[][] = [];
  for (const run of runs) {
    const group = groups.find((item) => Math.abs(snapHalf(item[0]!.depth) - snapHalf(run.depth)) < 0.1);
    if (group) group.push(run);
    else groups.push([run]);
  }
  return groups.map((group) => {
    const depth = snapHalf(group.reduce((sum, run) => sum + run.depth, 0) / group.length);
    const at = group.reduce((sum, run) => sum + run.at, 0) / group.length;
    const lo = Math.min(...group.map((run) => run.lo));
    const hi = Math.max(...group.map((run) => run.hi));
    const mid = clearOf(lo, hi, markers, vertical ? "y" : "x", vertical ? at : at);
    return depthLine(zone.side, back, at, mid, depth);
  });
}

function clearOf(lo: number, hi: number, markers: { x: number; y: number }[], axis: "x" | "y", fixed: number) {
  const span = hi - lo;
  const inset = span > 10 ? 4 : span / 4;
  const a = lo + inset;
  const b = hi - inset;
  if (b <= a) return (lo + hi) / 2;
  const mid = (a + b) / 2;
  let best = mid;
  let bestScore = -Infinity;
  for (let t = 0; t <= 8; t++) {
    const at = a + ((b - a) * t) / 8;
    let dist = 99;
    for (const marker of markers) {
      const along = axis === "y" ? marker.y : marker.x;
      const across = axis === "y" ? marker.x : marker.y;
      dist = Math.min(dist, Math.hypot(along - at, across - fixed));
    }
    const score = dist - Math.abs(at - mid) * 0.2;
    if (score > bestScore) {
      bestScore = score;
      best = at;
    }
  }
  return best;
}

function depthLine(side: "attacker" | "defender", back: BoardSide, front: number, mid: number, depth: number): ZoneDepth {
  const label = formatInches(depth);
  if (back === "left") return { side, x1: 0, y1: mid, x2: front, y2: mid, label };
  if (back === "right") return { side, x1: 60, y1: mid, x2: front, y2: mid, label };
  if (back === "top") return { side, x1: mid, y1: 0, x2: mid, y2: front, label };
  return { side, x1: mid, y1: 44, x2: mid, y2: front, label };
}

function diagonalDepth(side: "attacker" | "defender", pts: Pt[], back: BoardSide): ZoneDepth[] {
  let far = pts[0]!;
  let depth = -1;
  for (const p of pts) {
    const d = back === "left" ? p.x : back === "right" ? 60 - p.x : back === "top" ? p.y : 44 - p.y;
    if (d > depth) {
      depth = d;
      far = p;
    }
  }
  const snapped = snapHalf(depth);
  if (snapped < 1) return [];
  if (back === "left" || back === "right") {
    const inward = pts.reduce((sum, p) => sum + p.y, 0) / pts.length < far.y ? -1.4 : 1.4;
    const y = Math.min(42.6, Math.max(1.4, far.y + inward));
    return [depthLine(side, back, back === "left" ? snapped : 60 - snapped, y, snapped)];
  }
  const inward = pts.reduce((sum, p) => sum + p.x, 0) / pts.length < far.x ? -1.4 : 1.4;
  const x = Math.min(58.6, Math.max(1.4, far.x + inward));
  return [depthLine(side, back, back === "top" ? snapped : 44 - snapped, x, snapped)];
}

export type TerrainCorner = {
  id: "A" | "B" | "C";
  /** Inches to the nearer vertical edge. */
  across: number;
  acrossEdge: "left" | "right";
  /** Inches to the nearer horizontal edge. */
  down: number;
  downEdge: "top" | "bottom";
  x: number;
  y: number;
};

export type TerrainMeasure = {
  n: number;
  /** Event Companion feature code (AB, CD, EF, GH) or footprint size. */
  mark: string;
  source: number;
  corners: TerrainCorner[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Pt = { x: number; y: number };

const BOARD_CORNERS: Pt[] = [
  { x: 0, y: 0 },
  { x: 60, y: 0 },
  { x: 0, y: 44 },
  { x: 60, y: 44 },
];

function snapHalf(n: number) {
  return Math.round(n * 2) / 2;
}

function parsePoly(points: string): Pt[] {
  const out: Pt[] = [];
  for (const pair of points.trim().split(/\s+/)) {
    const [x, y] = pair.split(",").map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) out.push({ x, y });
  }
  return out;
}

function dist(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function convexHull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  const hull = lower.concat(upper);
  return hull.length ? hull : pts;
}

function lineDist(p: Pt, a: Pt, b: Pt) {
  const len = dist(a, b);
  if (len < 1e-6) return dist(p, a);
  return Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / len;
}

function toCorner(id: TerrainCorner["id"], p: Pt): TerrainCorner {
  const left = snapHalf(p.x);
  const right = snapHalf(60 - p.x);
  const top = snapHalf(p.y);
  const bottom = snapHalf(44 - p.y);
  const fromLeft = left <= right;
  const fromTop = top <= bottom;
  return {
    id,
    across: fromLeft ? left : right,
    acrossEdge: fromLeft ? "left" : "right",
    down: fromTop ? top : bottom,
    downEdge: fromTop ? "top" : "bottom",
    x: p.x,
    y: p.y,
  };
}

/** Three real footprint corners. A is nearest a table corner, B is opposite, C sets the angle. */
function placementCorners(points: Pt[]): TerrainCorner[] {
  const hull = convexHull(points);
  let A = hull[0]!;
  let aBest = Infinity;
  for (const p of hull) {
    const d = Math.min(...BOARD_CORNERS.map((c) => dist(p, c)));
    const nearer = d < aBest - 1e-6 || (Math.abs(d - aBest) <= 1e-6 && (p.x < A.x || (p.x === A.x && p.y < A.y)));
    if (nearer) {
      aBest = d;
      A = p;
    }
  }
  let B = hull[0]!;
  let bBest = -1;
  for (const p of hull) {
    const d = dist(p, A);
    if (d > bBest) {
      bBest = d;
      B = p;
    }
  }
  let C = hull.find((p) => p !== A && p !== B) ?? A;
  let cBest = -1;
  for (const p of hull) {
    if (p === A || p === B) continue;
    const d = lineDist(p, A, B);
    if (d > cBest) {
      cBest = d;
      C = p;
    }
  }
  return [toCorner("A", A), toCorner("B", B), toCorner("C", C)];
}

export function terrainMeasures(terrain: string[], marks: string[] = []): TerrainMeasure[] {
  const boxes = terrain.map((points, source) => {
    const poly = parsePoly(points);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of poly) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { source, mark: marks[source] ?? "", corners: placementCorners(poly), minX, minY, maxX, maxY };
  });
  boxes.sort((a, b) => a.minY - b.minY || a.minX - b.minX || a.source - b.source);
  return boxes.map((box, i) => ({ n: i + 1, ...box, mark: box.mark || String(i + 1) }));
}

export function formatInches(n: number) {
  return Number.isInteger(n) ? `${n}"` : `${n.toFixed(1)}"`;
}

export function formatCorner(corner: TerrainCorner) {
  return `${corner.id} ${formatInches(corner.across)} ${corner.acrossEdge} · ${formatInches(corner.down)} ${corner.downEdge}`;
}

const TAG_H = 2.15;
const TAG_GAP = 0.85;

export function measureTagWidth(label: string) {
  return Math.max(label.length * 1.15 + 1.35, 3.8);
}

export type PlacedMeasure = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
};

/** Inch tags sit in the outer gutters so they cannot cover each other or the terrain. */
export function layoutMeasureLabels(piece: TerrainMeasure): PlacedMeasure[] {
  const groups: Record<"left" | "right" | "top" | "bottom", PlacedMeasure[]> = {
    left: [],
    right: [],
    top: [],
    bottom: [],
  };
  const seenAcross = new Set<string>();
  const seenDown = new Set<string>();
  for (const corner of piece.corners) {
    const acrossKey = `${corner.acrossEdge}-${corner.across}`;
    const downKey = `${corner.downEdge}-${corner.down}`;
    if (!seenAcross.has(acrossKey)) {
      seenAcross.add(acrossKey);
      const label = formatInches(corner.across);
      const w = measureTagWidth(label);
      const edge = corner.acrossEdge === "left" ? 0 : 60;
      const x = corner.acrossEdge === "left" ? -5.7 - w / 2 : 65.7 + w / 2;
      groups[corner.acrossEdge].push({
        label,
        w,
        h: TAG_H,
        x,
        y: corner.y,
        anchorX: edge,
        anchorY: corner.y,
      });
    }
    if (!seenDown.has(downKey)) {
      seenDown.add(downKey);
      const label = formatInches(corner.down);
      const w = measureTagWidth(label);
      const edge = corner.downEdge === "top" ? 0 : 44;
      const y = corner.downEdge === "top" ? -4.8 - TAG_H / 2 : 48.8 + TAG_H / 2;
      groups[corner.downEdge].push({
        label,
        w,
        h: TAG_H,
        x: corner.x,
        y,
        anchorX: corner.x,
        anchorY: edge,
      });
    }
  }
  pack(groups.left, "y", 1, 43);
  pack(groups.right, "y", 1, 43);
  pack(groups.top, "x", 2, 58);
  pack(groups.bottom, "x", 2, 58);
  return [...groups.left, ...groups.right, ...groups.top, ...groups.bottom];
}

function pack(labels: PlacedMeasure[], axis: "x" | "y", lo: number, hi: number) {
  const sorted = [...labels].sort((a, b) => a[axis] - b[axis]);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const minPos = prev[axis] + (prev[axis === "x" ? "w" : "h"] + cur[axis === "x" ? "w" : "h"]) / 2 + TAG_GAP;
    if (cur[axis] < minPos) cur[axis] = minPos;
  }
  const last = sorted[sorted.length - 1];
  const first = sorted[0];
  if (last) {
    const size = last[axis === "x" ? "w" : "h"];
    const overflow = last[axis] + size / 2 + 0.2 - hi;
    if (overflow > 0) for (const label of sorted) label[axis] -= overflow;
  }
  if (first) {
    const size = first[axis === "x" ? "w" : "h"];
    const underflow = lo + size / 2 + 0.2 - first[axis];
    if (underflow > 0) for (const label of sorted) label[axis] += underflow;
  }
}

const BADGE_H = 2.3;

function badgeWidth(mark: string) {
  return Math.max(3.6, mark.length * 1.02 + 1.15);
}

function boxesTouch(a: TerrainMeasure, b: TerrainMeasure) {
  const gapX = Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX);
  const gapY = Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY);
  return gapX < 1 && gapY < 1;
}

/** One companion code per feature. Split footprints that share a code collapse to a single badge. */
export function layoutTerrainBadges(pieces: TerrainMeasure[], markers: { x: number; y: number }[] = []) {
  const parent = pieces.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      const a = pieces[i]!;
      const b = pieces[j]!;
      if (a.mark === b.mark && boxesTouch(a, b)) parent[find(j)] = find(i);
    }
  }
  const groups = new Map<number, TerrainMeasure[]>();
  pieces.forEach((piece, i) => {
    const root = find(i);
    const group = groups.get(root);
    if (group) group.push(piece);
    else groups.set(root, [piece]);
  });

  const placed: { n: number; x: number; y: number; w: number }[] = [];
  for (const group of groups.values()) {
    const mark = group[0]!.mark;
    const w = badgeWidth(mark);
    const minX = Math.min(...group.map((piece) => piece.minX));
    const maxX = Math.max(...group.map((piece) => piece.maxX));
    const minY = Math.min(...group.map((piece) => piece.minY));
    const maxY = Math.max(...group.map((piece) => piece.maxY));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const insetX = Math.min(w / 2, (maxX - minX) / 2);
    const insetY = Math.min(BADGE_H / 2, (maxY - minY) / 2);
    let best = { x: cx, y: cy, score: -Infinity };
    for (let ix = 0; ix <= 4; ix++) {
      for (let iy = 0; iy <= 4; iy++) {
        const x = minX + insetX + ((maxX - minX - insetX * 2) * ix) / 4;
        const y = minY + insetY + ((maxY - minY - insetY * 2) * iy) / 4;
        let clear = 99;
        for (const marker of markers) {
          const dx = Math.abs(x - marker.x) - w / 2 - 1.7;
          const dy = Math.abs(y - marker.y) - BADGE_H / 2 - 1.7;
          clear = Math.min(clear, Math.max(dx, dy));
        }
        for (const other of placed) {
          const dx = Math.abs(x - other.x) - (w + other.w) / 2 - 0.35;
          const dy = Math.abs(y - other.y) - BADGE_H - 0.3;
          clear = Math.min(clear, Math.max(dx, dy));
        }
        const score = clear * 8 - Math.hypot(x - cx, y - cy) * 0.15;
        if (score > best.score) best = { x, y, score };
      }
    }
    placed.push({ n: group[0]!.n, x: best.x, y: best.y, w });
  }
  return placed;
}
