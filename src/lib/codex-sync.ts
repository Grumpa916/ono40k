import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CodexChange } from "@/lib/codex-catalogue";
import type { UnitDef } from "@/data/types";

export type UnitPatch = {
  points?: number;
  invuln?: number | null;
  stats?: Partial<Pick<UnitDef["stats"], "m" | "t" | "sv" | "w" | "ld" | "oc">>;
};

type CodexSyncState = {
  patches: Record<string, Record<string, UnitPatch>>;
  lastCheck: Record<string, { at: number; changes: number; compared?: number; skipped?: number; source?: string }>;
  revision: number;
  apply: (factionId: string, changes: CodexChange[]) => void;
  markChecked: (factionId: string, summary: { changes: number; compared: number; skipped: number; source: string }) => void;
  clearFaction: (factionId: string) => void;
};

export const useCodexSync = create<CodexSyncState>()(
  persist(
    (set) => ({
      patches: {},
      lastCheck: {},
      revision: 0,
      markChecked: (factionId, summary) =>
        set((state) => ({
          lastCheck: { ...state.lastCheck, [factionId]: { at: Date.now(), ...summary } },
        })),
      clearFaction: (factionId) =>
        set((state) => {
          const patches = { ...state.patches };
          delete patches[factionId];
          return { patches, revision: state.revision + 1 };
        }),
      apply: (factionId, changes) =>
        set((state) => {
          const bag = { ...(state.patches[factionId] ?? {}) };
          for (const change of changes) {
            const current = bag[change.unitId] ?? {};
            if (change.kind === "points") bag[change.unitId] = { ...current, points: change.to };
            else if (change.kind === "invuln") bag[change.unitId] = { ...current, invuln: change.to || null };
            else if (change.kind === "stat" && change.stat) {
              bag[change.unitId] = { ...current, stats: { ...current.stats, [change.stat]: change.to } };
            }
          }
          return {
            patches: { ...state.patches, [factionId]: bag },
            lastCheck: {
              ...state.lastCheck,
              [factionId]: { ...state.lastCheck[factionId], at: Date.now(), changes: 0 },
            },
            revision: state.revision + 1,
          };
        }),
    }),
    { name: "ono40k-codex-sync", partialize: (state) => ({ patches: state.patches, lastCheck: state.lastCheck }) },
  ),
);

export function applyUnitPatch(unit: UnitDef, patch: UnitPatch | undefined): UnitDef {
  if (!patch) return unit;
  const points = patch.points ?? unit.points;
  const stats = patch.stats ? { ...unit.stats, ...patch.stats } : unit.stats;
  const invuln = patch.invuln === null ? undefined : (patch.invuln ?? unit.invuln);
  const sizes = unit.sizes?.map((size) => (patch.points != null && size.points === unit.points ? { ...size, points } : size));
  return { ...unit, points, stats, invuln, sizes };
}
