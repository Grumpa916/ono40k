import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/** α, β, γ… for duplicate datasheets, assigned in roster order. Empty if that sheet appears once. */
const GREEK = "αβγδεζηθικλμνξοπρστυφχψω";

export function unitCopyMarks(units: Array<{ id: string; unitId: string }>): Record<string, string> {
  const totals = new Map<string, number>();
  for (const u of units) totals.set(u.unitId, (totals.get(u.unitId) ?? 0) + 1);
  const seen = new Map<string, number>();
  const marks: Record<string, string> = {};
  for (const u of units) {
    if ((totals.get(u.unitId) ?? 0) < 2) continue;
    const n = seen.get(u.unitId) ?? 0;
    seen.set(u.unitId, n + 1);
    marks[u.id] = n < GREEK.length ? GREEK[n]! : String(n + 1);
  }
  return marks;
}

export function unitMaxWounds(w: number): number {
  return Math.max(1, w);
}

/** Remaining wounds on the current model. 0 and not destroyed = undamaged (legacy / start of game). */
export function remainingWounds(
  st: { destroyed: boolean; modelsRemaining: number; woundsOnCurrent: number },
  maxW: number,
): number {
  if (st.destroyed || st.modelsRemaining <= 0) return 0;
  if (st.woundsOnCurrent <= 0) return maxW;
  return Math.min(maxW, st.woundsOnCurrent);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function battleElapsedMs(
  game: {
    startedAt: number;
    finishedAt?: number;
    status: string;
    elapsedMs?: number;
    battleRunningSince?: number | null;
  },
  now = Date.now(),
): number {
  if (game.status === "complete") {
    if (game.elapsedMs != null) return Math.max(0, game.elapsedMs);
    return Math.max(0, (game.finishedAt ?? now) - game.startedAt);
  }
  if (game.battleRunningSince === null) return Math.max(0, game.elapsedMs ?? 0);
  if (typeof game.battleRunningSince === "number") {
    return Math.max(0, (game.elapsedMs ?? 0) + (now - game.battleRunningSince));
  }
  return Math.max(0, now - game.startedAt);
}

export function turnElapsedMs(
  game: {
    activeSide: "me" | "opponent";
    status: string;
    runningSince?: number | null;
    turnMs?: { me: number; opponent: number };
  },
  side: "me" | "opponent",
  now = Date.now(),
): number {
  const base = game.turnMs?.[side] ?? 0;
  if (game.runningSince && game.status === "active" && game.activeSide === side) {
    return Math.max(0, base + (now - game.runningSince));
  }
  return Math.max(0, base);
}
