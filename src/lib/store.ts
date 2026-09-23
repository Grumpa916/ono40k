import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { getFaction, getUnit } from "@/data/codex";
import { SEED_LISTS } from "@/data/seeds";
import type {
  ActiveStrat,
  BattleSize,
  Disposition,
  Game,
  GameUndoSlice,
  LedgerEvent,
  LedgerEventKind,
  PhaseId,
  PreBattle,
  Roster,
  RosterUnit,
  SideScore,
  Stratagem,
  UnitBattleState,
} from "@/data/types";
import { BATTLE_SIZES, PHASES } from "@/data/types";
import { secondaryVp } from "@/data/secondaries";
import { getMap } from "@/data/maps";
import { rosterDisposition } from "@/lib/validation";
import { battleElapsedMs, uid, unitCopyMarks } from "@/lib/utils";

const emptyScore = (): SideScore => ({
  primaryByRound: [0, 0, 0, 0, 0],
  primaryChecks: [],
  secondaryMode: null,
  fixedIds: [],
  tacticalActive: [],
  secondaryChecks: {},
  secondaryMeta: {},
  tactical: 0,
  painted: 10,
});

function snapshotRoster(r: Roster): Roster {
  const copy = JSON.parse(JSON.stringify(r)) as Roster & { owner?: unknown };
  delete copy.owner;
  copy.disposition = rosterDisposition(copy);
  copy.saved = copy.saved ?? true;
  return copy;
}

const SEED_IDS = new Set(SEED_LISTS.map((l) => l.id));

function knownFaction(factionId: string) {
  return Boolean(getFaction(factionId));
}

function mergeLists(persisted: Roster[] | undefined, current: Roster[]): Roster[] {
  const known = (l: Roster) => knownFaction(l.factionId);
  const currentKnown = current.filter(known);
  if (!persisted?.length) return currentKnown.map((l) => snapshotRoster(l));

  const currentById = new Map(currentKnown.map((l) => [l.id, l]));
  const out: Roster[] = [];
  const seen = new Set<string>();
  for (const raw of persisted) {
    if (!known(raw)) continue;
    const live = currentById.get(raw.id);
    const chosen = live && (live.updatedAt ?? 0) > (raw.updatedAt ?? 0) ? live : raw;
    out.push(snapshotRoster(chosen));
    seen.add(raw.id);
  }
  for (const live of currentKnown) {
    if (seen.has(live.id) || SEED_IDS.has(live.id)) continue;
    out.push(snapshotRoster(live));
  }
  return out.length ? out : currentKnown.map((l) => snapshotRoster(l));
}

function gameStamp(g: Game) {
  return g.log?.[0]?.at ?? g.finishedAt ?? g.startedAt ?? 0;
}

function mergeGames(persisted: Game[] | undefined, current: Game[]): Game[] {
  const known = (g: Game) => knownFaction(g.myRoster.factionId) && knownFaction(g.opponentRoster.factionId);
  const map = new Map<string, Game>();
  for (const g of current.filter(known)) map.set(g.id, g);
  for (const g of (persisted ?? []).filter(known)) {
    const prev = map.get(g.id);
    map.set(g.id, !prev || gameStamp(g) >= gameStamp(prev) ? g : prev);
  }
  return [...map.values()].map(hydrateGame);
}

export type AccountSnapshot = {
  lists: Roster[];
  games: Game[];
  activeGameId: string | null;
};

function activeIfPresent(id: string | null | undefined, games: Game[]) {
  return id && games.some((g) => g.id === id) ? id : null;
}

export function readAccountSnapshot(): AccountSnapshot {
  const s = useWarStore.getState();
  return { lists: s.lists, games: s.games, activeGameId: s.activeGameId };
}

export function applyAccountSnapshot(remote: AccountSnapshot | null, mode: "merge" | "replace") {
  const cur = useWarStore.getState();
  const lists =
    mode === "replace"
      ? remote?.lists?.length
        ? mergeLists(remote.lists, [])
        : mergeLists(undefined, SEED_LISTS)
      : mergeLists(remote?.lists, cur.lists);
  const games = mode === "replace" ? mergeGames(remote?.games, []) : mergeGames(remote?.games, cur.games);
  const activeGameId =
    mode === "replace"
      ? activeIfPresent(remote?.activeGameId, games)
      : (activeIfPresent(cur.activeGameId, games) ?? activeIfPresent(remote?.activeGameId, games));
  useWarStore.setState({ lists, games, activeGameId });
}

function idbStorage(): StateStorage {
  const DB = "ono40k";
  const STORE = "kv";
  let opened: Promise<IDBDatabase> | null = null;
  const withTimeout = <T,>(p: Promise<T>, ms: number) =>
    new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("idb-timeout")), ms);
      p.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        },
      );
    });
  const open = () => {
    if (typeof indexedDB === "undefined") return Promise.reject(new Error("no indexedDB"));
    opened ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return withTimeout(opened, 800).catch((err) => {
      opened = null;
      throw err;
    });
  };
  let writes = Promise.resolve();
  let pending: { name: string; value: string } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const job = pending;
    pending = null;
    if (!job) return writes;
    const write = async () => {
      try {
        const db = await open();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put(job.value, job.name);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        try {
          localStorage.setItem(job.name, job.value);
        } catch {
          /* quota */
        }
      }
    };
    writes = writes.then(write, write);
    return writes;
  };
  if (typeof window !== "undefined") {
    const hide = () => {
      void flush();
    };
    window.addEventListener("pagehide", hide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") hide();
    });
  }
  return {
    getItem: async (name) => {
      try {
        const db = await open();
        const fromIdb = await new Promise<string | null>((resolve, reject) => {
          const r = db.transaction(STORE, "readonly").objectStore(STORE).get(name);
          r.onsuccess = () => resolve((r.result as string | undefined) ?? null);
          r.onerror = () => reject(r.error);
        });
        if (fromIdb != null) return fromIdb;
      } catch {
        /* fall through to localStorage */
      }
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      pending = { name, value };
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void flush();
      }, 400);
      return writes;
    },
    removeItem: async (name) => {
      try {
        const db = await open();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(name);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        try {
          localStorage.removeItem(name);
        } catch {
          /* */
        }
      }
    },
  };
}

function initUnitState(roster: Roster, other: Roster): Record<string, UnitBattleState> {
  const state: Record<string, UnitBattleState> = {};
  for (const ru of [...roster.units, ...other.units]) {
    state[ru.id] = {
      modelsRemaining: ru.models,
      woundsOnCurrent: 0,
      battleShocked: false,
      hidden: false,
      destroyed: false,
    };
  }
  return state;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function patchScore(g: Game, side: "me" | "opponent", patch: Partial<SideScore>): Game {
  const score = { ...g.scores[side], ...patch };
  const mode = score.secondaryMode ?? null;
  const ids = mode === "fixed" ? (score.fixedIds ?? []) : mode === "tactical" ? (score.tacticalActive ?? []) : [];
  score.tactical = secondaryVp(mode, ids, score.secondaryChecks);
  return { ...g, scores: { ...g.scores, [side]: score } };
}

function hydrateGame(g: Game): Game {
  const complete = g.status === "complete";
  const elapsedMs = g.elapsedMs ?? (complete ? Math.max(0, (g.finishedAt ?? g.startedAt) - g.startedAt) : 0);
  const runningSince =
    g.runningSince === undefined ? (complete ? null : g.startedAt) : g.runningSince;
  return {
    ...g,
    log: g.log ?? [],
    activeStrats: g.activeStrats ?? [],
    undoStack: g.undoStack ?? [],
    elapsedMs,
    runningSince,
    turnMs: g.turnMs ?? { me: 0, opponent: 0 },
    liveRound: g.liveRound ?? g.round,
    liveSide: g.liveSide ?? g.activeSide,
    livePhase: g.livePhase ?? g.phase,
  };
}

function turnRank(round: number, side: "me" | "opponent"): number {
  return (round - 1) * 2 + (side === "opponent" ? 1 : 0);
}

function turnFromRank(rank: number): { round: 1 | 2 | 3 | 4 | 5; side: "me" | "opponent" } {
  const clamped = Math.min(9, Math.max(0, rank));
  return {
    round: (Math.floor(clamped / 2) + 1) as 1 | 2 | 3 | 4 | 5,
    side: clamped % 2 === 1 ? "opponent" : "me",
  };
}

function browseTurn(g: Game, round: 1 | 2 | 3 | 4 | 5, side: "me" | "opponent", phase: PhaseId): Game {
  const liveR = g.liveRound ?? g.round;
  const liveS = g.liveSide ?? g.activeSide;
  const leavingLive = g.round === liveR && g.activeSide === liveS && (round !== liveR || side !== liveS);
  return {
    ...g,
    round,
    activeSide: side,
    viewing: side,
    phase,
    liveRound: liveR,
    liveSide: liveS,
    livePhase: leavingLive ? g.phase : (g.livePhase ?? g.phase),
  };
}

function freezeTurns(g: Game, now = Date.now()): { runningSince: null; turnMs: { me: number; opponent: number } } {
  const extra = g.runningSince ? now - g.runningSince : 0;
  const turnMs = { me: g.turnMs?.me ?? 0, opponent: g.turnMs?.opponent ?? 0 };
  if (extra) turnMs[g.activeSide] += extra;
  return { runningSince: null, turnMs };
}

function stopAllClocks(g: Game, now = Date.now()) {
  const turns = freezeTurns(g, now);
  return {
    ...turns,
    elapsedMs: now - g.startedAt,
    finishedAt: now,
    status: "complete" as const,
  };
}

function rollTurnClock(g: Game, next: "me" | "opponent", now = Date.now()) {
  const extra = g.runningSince ? now - g.runningSince : 0;
  const turnMs = { me: g.turnMs?.me ?? 0, opponent: g.turnMs?.opponent ?? 0 };
  turnMs[g.activeSide] += extra;
  turnMs[next] = 0;
  return {
    turnMs,
    runningSince: g.runningSince ? now : g.runningSince,
  };
}

function snapshotUndo(g: Game): GameUndoSlice {
  return {
    round: g.round,
    phase: g.phase,
    activeSide: g.activeSide,
    viewing: g.viewing,
    cp: clone(g.cp),
    unitState: clone(g.unitState),
    activeStrats: clone(g.activeStrats ?? []),
    status: g.status,
    finishedAt: g.finishedAt,
  };
}

function phaseLabel(id: PhaseId) {
  return PHASES.find((p) => p.id === id)?.label ?? id;
}

function findRosterUnit(game: Game, unitId: string) {
  const mine = game.myRoster.units.find((u) => u.id === unitId);
  if (mine) return { ru: mine, factionId: game.myRoster.factionId, side: "me" as const };
  const theirs = game.opponentRoster.units.find((u) => u.id === unitId);
  if (theirs) return { ru: theirs, factionId: game.opponentRoster.factionId, side: "opponent" as const };
  return null;
}

function unitLabel(game: Game, unitId: string) {
  const found = findRosterUnit(game, unitId);
  if (!found) return "Unit";
  const name = getUnit(found.factionId, found.ru.unitId)?.name ?? "Unit";
  const roster = found.side === "me" ? game.myRoster : game.opponentRoster;
  const mark = unitCopyMarks(roster.units)[found.ru.id];
  return mark ? `${name} [${mark}]` : name;
}

function sideName(game: Game, side: "me" | "opponent") {
  return side === "me" ? game.myName : game.opponentName;
}

function applyTracked(
  get: () => State,
  set: (partial: { games: Game[] }) => void,
  kind: LedgerEventKind,
  summary: string,
  mutator: (g: Game) => Game,
) {
  const id = get().activeGameId;
  const raw = get().games.find((g) => g.id === id);
  if (!id || !raw) return;
  const game = hydrateGame(raw);
  const prepared: Game = {
    ...game,
    undoStack: [snapshotUndo(game), ...game.undoStack].slice(0, 5),
  };
  const next = mutator(prepared);
  const stampedAt = Date.now();
  const event: LedgerEvent = {
    id: uid("ev"),
    at: stampedAt,
    kind,
    summary,
    round: next.round,
    phase: next.phase,
    turn: next.activeSide,
    clockMs: battleElapsedMs(next, stampedAt),
  };
  set({
    games: get().games.map((g) =>
      g.id === id ? { ...next, log: [event, ...(game.log ?? [])].slice(0, 50) } : g,
    ),
  });
}

type State = {
  hydrated: boolean;
  lists: Roster[];
  games: Game[];
  activeGameId: string | null;
  setHydrated: () => void;
  createList: (input: { name: string; factionId: string; battleSize: BattleSize }) => string;
  updateList: (id: string, patch: Partial<Roster>) => void;
  deleteList: (id: string) => void;
  duplicateList: (id: string) => string | null;
  toggleFavorite: (id: string) => void;
  addUnit: (listId: string, unit: Omit<RosterUnit, "id">) => void;
  updateUnit: (listId: string, unitId: string, patch: Partial<RosterUnit>) => void;
  removeUnit: (listId: string, unitId: string) => void;
  importList: (roster: Omit<Roster, "id" | "createdAt" | "updatedAt" | "favorite">) => string;
  saveList: (id: string) => void;
  startGame: (input: {
    myName: string;
    opponentName: string;
    mine: Roster;
    theirs: Roster;
    briefing?: PreBattle;
    scores?: { me: SideScore; opponent: SideScore };
  }) => string | null;
  patchGame: (id: string, patch: Partial<Game>) => void;
  setViewing: (side: "me" | "opponent") => void;
  setPhase: (phase: PhaseId) => void;
  endTurn: () => void;
  prevTurn: () => void;
  jumpRound: (round: 1 | 2 | 3 | 4 | 5) => void;
  adjustPrimary: (side: "me" | "opponent", round: number, delta: number) => void;
  setPrimary: (side: "me" | "opponent", round: number, value: number) => void;
  togglePrimaryCheck: (side: "me" | "opponent", objIndex: number, slot: number, max?: number) => void;
  setSecondaryMode: (side: "me" | "opponent", mode: "fixed" | "tactical") => void;
  toggleFixedSecondary: (side: "me" | "opponent", id: string) => void;
  toggleTacticalActive: (side: "me" | "opponent", id: string) => void;
  setSecondaryScore: (side: "me" | "opponent", cardId: string, vp: number) => void;
  ensureSecondaryMeta: (side: "me" | "opponent") => void;
  adjustTactical: (side: "me" | "opponent", delta: number) => void;
  adjustCp: (side: "me" | "opponent", delta: number) => void;
  setUnitState: (unitId: string, patch: Partial<UnitBattleState>) => void;
  playStratagem: (side: "me" | "opponent", strat: Stratagem, source: string) => void;
  playStratagems: (side: "me" | "opponent", items: Array<{ strat: Stratagem; source: string }>) => void;
  dismissStrat: (activeId: string) => void;
  undoLast: () => void;
  pauseClock: () => void;
  resumeClock: () => void;
  endGame: () => void;
  leaveGame: () => void;
  resumeGame: (id: string) => void;
  reopenGame: () => void;
};

export const useWarStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      lists: SEED_LISTS,
      games: [],
      activeGameId: null,
      setHydrated: () => set({ hydrated: true }),
      createList: ({ name, factionId, battleSize }) => {
        const id = uid("list");
        const now = Date.now();
        const list: Roster = {
          id,
          name,
          factionId,
          battleSize,
          pointsLimit: BATTLE_SIZES[battleSize].points,
          detachmentIds: [],
          disposition: null,
          units: [],
          notes: "",
          favorite: false,
          saved: false,
          createdAt: now,
          updatedAt: now,
        };
        set({ lists: [list, ...get().lists] });
        return id;
      },
      updateList: (id, patch) =>
        set({
          lists: get().lists.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: Date.now() } : l)),
        }),
      deleteList: (id) => set({ lists: get().lists.filter((l) => l.id !== id) }),
      duplicateList: (id) => {
        const src = get().lists.find((l) => l.id === id);
        if (!src) return null;
        const copy: Roster = {
          ...snapshotRoster(src),
          id: uid("list"),
          name: `${src.name} (copy)`,
          favorite: false,
          saved: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          units: src.units.map((u) => ({ ...u, id: uid("u") })),
        };
        set({ lists: [copy, ...get().lists] });
        return copy.id;
      },
      toggleFavorite: (id) =>
        set({
          lists: get().lists.map((l) => (l.id === id ? { ...l, favorite: !l.favorite } : l)),
        }),
      saveList: (id) =>
        set({
          lists: get().lists.map((l) =>
            l.id === id ? { ...l, saved: true, savedAt: Date.now(), updatedAt: Date.now() } : l,
          ),
        }),
      addUnit: (listId, unit) => {
        const ru: RosterUnit = { ...unit, id: uid("u") };
        set({
          lists: get().lists.map((l) =>
            l.id === listId ? { ...l, units: [...l.units, ru], updatedAt: Date.now() } : l,
          ),
        });
      },
      updateUnit: (listId, unitId, patch) =>
        set({
          lists: get().lists.map((l) =>
            l.id === listId
              ? { ...l, units: l.units.map((u) => (u.id === unitId ? { ...u, ...patch } : u)), updatedAt: Date.now() }
              : l,
          ),
        }),
      removeUnit: (listId, unitId) =>
        set({
          lists: get().lists.map((l) =>
            l.id === listId ? { ...l, units: l.units.filter((u) => u.id !== unitId), updatedAt: Date.now() } : l,
          ),
        }),
      importList: (roster) => {
        const id = uid("list");
        const now = Date.now();
        const list: Roster = { ...roster, id, favorite: false, saved: true, savedAt: now, createdAt: now, updatedAt: now };
        set({ lists: [list, ...get().lists] });
        return id;
      },
      startGame: ({ myName, opponentName, mine, theirs, briefing, scores }) => {
        if (!mine || !theirs) return null;
        const myRoster = snapshotRoster({ ...mine, id: mine.id || uid("tbl") });
        const opponentRoster = snapshotRoster({ ...theirs, id: theirs.id || uid("tbl") });
        const id = uid("game");
        const first = briefing?.firstTurn ?? "me";
        const attacker = briefing?.attacker ?? "me";
        const now = Date.now();
        const mapName = briefing?.mapId ? getMap(briefing.mapId)?.name : undefined;
        const game: Game = {
          id,
          myName: myName || "Grumpa",
          opponentName: opponentName || "Jared",
          myRoster,
          opponentRoster,
          round: 1,
          phase: "command",
          activeSide: first,
          viewing: first,
          scores: {
            me: scores?.me ?? emptyScore(),
            opponent: scores?.opponent ?? emptyScore(),
          },
          cp: { me: 1, opponent: 1 },
          unitState: initUnitState(myRoster, opponentRoster),
          activeStrats: [],
          log: briefing
            ? [
                {
                  id: uid("ev"),
                  at: now,
                  kind: "prebattle",
                  summary: `Attacker ${attacker === "me" ? myName || "Grumpa" : opponentName || "Jared"} · first ${first === "me" ? myName || "Grumpa" : opponentName || "Jared"}${mapName ? ` · ${mapName}` : ""}`,
                  round: 1,
                  phase: "command",
                  turn: first,
                  clockMs: 0,
                },
              ]
            : [],
          undoStack: [],
          notes: [briefing?.terrainNote, briefing?.formationNote].filter(Boolean).join(" · "),
          status: "active",
          startedAt: now,
          elapsedMs: 0,
          runningSince: now,
          turnMs: { me: 0, opponent: 0 },
          liveRound: 1,
          liveSide: first,
          livePhase: "command",
          preBattle: briefing,
        };
        set({ games: [game, ...get().games], activeGameId: id });
        return id;
      },
      patchGame: (id, patch) =>
        set({
          games: get().games.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }),
      setViewing: (side) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => (g.id === id ? { ...g, viewing: side } : g)),
        });
      },
      setPhase: (phase) => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw || raw.phase === phase) return;
        applyTracked(get, set, "phase", `Phase → ${phaseLabel(phase)}`, (g) => {
          const liveR = g.liveRound ?? g.round;
          const liveS = g.liveSide ?? g.activeSide;
          const atLive = g.round === liveR && g.activeSide === liveS;
          return { ...g, phase, ...(atLive ? { livePhase: phase } : {}) };
        });
      },
      prevTurn: () => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const game = hydrateGame(raw);
        const rank = turnRank(game.round, game.activeSide);
        if (rank <= 0) return;
        const next = turnFromRank(rank - 1);
        set({
          games: get().games.map((g) => (g.id === id ? browseTurn(hydrateGame(g), next.round, next.side, "command") : g)),
        });
      },
      jumpRound: (round) => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const game = hydrateGame(raw);
        const liveR = game.liveRound ?? game.round;
        const liveS = game.liveSide ?? game.activeSide;
        if (round > liveR) return;
        const side = round === liveR ? liveS : "me";
        const phase = round === liveR && side === liveS ? (game.livePhase ?? "command") : "command";
        set({
          games: get().games.map((g) => (g.id === id ? browseTurn(hydrateGame(g), round, side, phase) : g)),
        });
      },
      endTurn: () => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const game = hydrateGame(raw);
        const liveR = game.liveRound ?? game.round;
        const liveS = game.liveSide ?? game.activeSide;
        const cur = turnRank(game.round, game.activeSide);
        const live = turnRank(liveR, liveS);
        if (cur < live) {
          const next = turnFromRank(cur + 1);
          const backToLive = cur + 1 === live;
          set({
            games: get().games.map((g) =>
              g.id === id
                ? browseTurn(
                    hydrateGame(g),
                    next.round,
                    next.side,
                    backToLive ? (hydrateGame(g).livePhase ?? "command") : "command",
                  )
                : g,
            ),
          });
          return;
        }
        if (game.status === "complete") return;
        if (game.activeSide === "me") {
          applyTracked(get, set, "turn", `Turn ended · ${game.opponentName}'s turn`, (g) => ({
            ...g,
            ...rollTurnClock(g, "opponent"),
            activeSide: "opponent",
            phase: "command",
            viewing: "opponent",
            cp: { ...g.cp, opponent: g.cp.opponent + 1 },
            liveRound: g.round,
            liveSide: "opponent",
            livePhase: "command",
          }));
          return;
        }
        const done = game.round >= 5;
        const nextRound = (done ? game.round : Math.min(5, game.round + 1)) as 1 | 2 | 3 | 4 | 5;
        applyTracked(
          get,
          set,
          "turn",
          done ? `Battle ended · Round ${game.round}` : `Turn ended · Round ${nextRound}, ${game.myName}`,
          (g) => {
            const clock = done ? stopAllClocks(g) : rollTurnClock(g, "me");
            return {
              ...g,
              ...clock,
              round: nextRound,
              phase: "command",
              activeSide: "me",
              viewing: "me",
              cp: { ...g.cp, me: g.cp.me + 1 },
              status: done ? "complete" : "active",
              finishedAt: done ? Date.now() : g.finishedAt,
              liveRound: nextRound,
              liveSide: "me",
              livePhase: "command",
            };
          },
        );
      },
      adjustPrimary: (side, round, delta) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const score = { ...g.scores[side] };
            const arr = [...score.primaryByRound] as SideScore["primaryByRound"];
            const i = round - 1;
            arr[i] = Math.max(0, Math.min(20, arr[i] + delta));
            score.primaryByRound = arr;
            return { ...g, scores: { ...g.scores, [side]: score } };
          }),
        });
      },
      setPrimary: (side, round, value) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const score = { ...g.scores[side] };
            const arr = [...score.primaryByRound] as SideScore["primaryByRound"];
            arr[round - 1] = Math.max(0, Math.min(20, value));
            score.primaryByRound = arr;
            return { ...g, scores: { ...g.scores, [side]: score } };
          }),
        });
      },
      togglePrimaryCheck: (side, objIndex, slot, max = 1) => {
        const id = get().activeGameId;
        if (!id) return;
        const cap = Math.max(1, max);
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const score = { ...g.scores[side] };
            const checks = (score.primaryChecks ?? []).map((row) => [...row]);
            while (checks.length <= objIndex) checks.push([]);
            const row = [...(checks[objIndex] ?? [])];
            while (row.length <= slot) row.push(0);
            const cur = Number(row[slot] || 0);
            row[slot] = (cur + 1) % (cap + 1);
            checks[objIndex] = row;
            return { ...g, scores: { ...g.scores, [side]: { ...score, primaryChecks: checks } } };
          }),
        });
      },
      setSecondaryMode: (side, mode) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            return patchScore(g, side, { secondaryMode: mode });
          }),
        });
      },
      toggleFixedSecondary: (side, cardId) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const cur = g.scores[side].fixedIds ?? [];
            const adding = !cur.includes(cardId);
            const next = adding ? (cur.length >= 2 ? cur : [...cur, cardId]) : cur.filter((x) => x !== cardId);
            const meta = { ...(g.scores[side].secondaryMeta ?? {}) };
            if (adding && next.includes(cardId)) {
              meta[cardId] = { selectedRound: g.round };
            }
            return patchScore(g, side, { secondaryMode: "fixed", fixedIds: next, secondaryMeta: meta });
          }),
        });
      },
      toggleTacticalActive: (side, cardId) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const cur = g.scores[side].tacticalActive ?? [];
            const adding = !cur.includes(cardId);
            const next = adding ? [...cur, cardId] : cur.filter((x) => x !== cardId);
            const meta = { ...(g.scores[side].secondaryMeta ?? {}) };
            if (adding) {
              meta[cardId] = { selectedRound: g.round };
            }
            return patchScore(g, side, { secondaryMode: "tactical", tacticalActive: next, secondaryMeta: meta });
          }),
        });
      },
      setSecondaryScore: (side, cardId, vp) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const prev = g.scores[side].secondaryChecks ?? {};
            const meta = { ...(g.scores[side].secondaryMeta ?? {}) };
            const stamp = meta[cardId] ?? { selectedRound: g.round };
            if (vp > 0) {
              meta[cardId] = { ...stamp, selectedRound: stamp.selectedRound ?? g.round, completedRound: g.round };
            } else {
              meta[cardId] = { selectedRound: stamp.selectedRound ?? g.round };
            }
            return patchScore(g, side, {
              secondaryChecks: { ...prev, [cardId]: [[Math.max(0, vp)]] },
              secondaryMeta: meta,
            });
          }),
        });
      },
      ensureSecondaryMeta: (side) => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const g = hydrateGame(raw);
        const score = g.scores[side];
        const ids = score.secondaryMode === "fixed" ? (score.fixedIds ?? []) : score.secondaryMode === "tactical" ? (score.tacticalActive ?? []) : [];
        const meta = { ...(score.secondaryMeta ?? {}) };
        let changed = false;
        for (const cardId of ids) {
          if (!meta[cardId]) {
            meta[cardId] = { selectedRound: g.round };
            changed = true;
          }
        }
        if (!changed) return;
        set({
          games: get().games.map((game) => (game.id === id ? patchScore(hydrateGame(game), side, { secondaryMeta: meta }) : game)),
        });
      },
      adjustTactical: (side, delta) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const score = { ...g.scores[side], tactical: Math.max(0, g.scores[side].tactical + delta) };
            return { ...g, scores: { ...g.scores, [side]: score } };
          }),
        });
      },
      adjustCp: (side, delta) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) =>
            g.id === id ? { ...g, cp: { ...g.cp, [side]: Math.max(0, g.cp[side] + delta) } } : g,
          ),
        });
      },
      setUnitState: (unitId, patch) => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const game = hydrateGame(raw);
        const prev = game.unitState[unitId];
        if (!prev) return;
        const next = { ...prev, ...patch };
        const found = findRosterUnit(game, unitId);
        const name = unitLabel(game, unitId);
        const who = found ? sideName(game, found.side) : "";
        const apply = (g: Game): Game => ({
          ...g,
          unitState: { ...g.unitState, [unitId]: next },
        });
        if (next.destroyed !== prev.destroyed) {
          applyTracked(
            get,
            set,
            "destroyed",
            `${who} · ${name} ${next.destroyed ? "destroyed" : "restored"}`,
            apply,
          );
          return;
        }
        if (next.battleShocked !== prev.battleShocked) {
          applyTracked(
            get,
            set,
            "battleShock",
            `${who} · ${name} ${next.battleShocked ? "Battle-shocked" : "rallied"}`,
            apply,
          );
          return;
        }
        set({
          games: get().games.map((g) => (g.id === id ? apply(hydrateGame(g)) : g)),
        });
      },
      playStratagem: (side, strat, source) => {
        get().playStratagems(side, [{ strat, source }]);
      },
      playStratagems: (side, items) => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw || raw.status === "complete" || items.length === 0) return;
        const game = hydrateGame(raw);
        const total = items.reduce((n, i) => n + i.strat.cp, 0);
        if (game.cp[side] < total) return;
        const actives: ActiveStrat[] = items.map(({ strat, source }) => ({
          id: uid("as"),
          stratId: strat.id,
          name: strat.name,
          cp: strat.cp,
          when: strat.when,
          text: strat.text,
          source,
          side,
          round: game.round,
          phase: game.phase,
        }));
        const names = items.map((i) => i.strat.name);
        const label =
          names.length === 1
            ? names[0]
            : names.length <= 3
              ? names.join(" + ")
              : `${names[0]} + ${names.length - 1} more`;
        applyTracked(
          get,
          set,
          "stratagem",
          `${sideName(game, side)} · ${label} (${total} CP)`,
          (g) => ({
            ...g,
            cp: { ...g.cp, [side]: Math.max(0, g.cp[side] - total) },
            activeStrats: [...actives, ...g.activeStrats],
          }),
        );
      },
      dismissStrat: (activeId) => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) =>
            g.id === id ? { ...hydrateGame(g), activeStrats: (g.activeStrats ?? []).filter((s) => s.id !== activeId) } : g,
          ),
        });
      },
      undoLast: () => {
        const id = get().activeGameId;
        const raw = get().games.find((g) => g.id === id);
        if (!id || !raw) return;
        const game = hydrateGame(raw);
        const slice = game.undoStack[0];
        if (!slice) return;
        set({
          games: get().games.map((g) =>
            g.id === id
              ? {
                  ...hydrateGame(g),
                  round: slice.round,
                  phase: slice.phase,
                  activeSide: slice.activeSide,
                  viewing: slice.viewing ?? g.viewing,
                  cp: clone(slice.cp),
                  unitState: clone(slice.unitState),
                  activeStrats: clone(slice.activeStrats),
                  status: slice.status,
                  finishedAt: slice.finishedAt,
                  log: game.log.slice(1),
                  undoStack: game.undoStack.slice(1),
                }
              : g,
          ),
        });
      },
      pauseClock: () => {
        const id = get().activeGameId;
        if (!id) return;
        set({
          games: get().games.map((g) => (g.id === id && g.runningSince ? { ...g, ...freezeTurns(g) } : g)),
        });
      },
      resumeClock: () => {
        const id = get().activeGameId;
        if (!id) return;
        const now = Date.now();
        set({
          games: get().games.map((g) =>
            g.id === id && !g.runningSince && g.status === "active" ? { ...g, runningSince: now } : g,
          ),
        });
      },
      endGame: () => {
        const id = get().activeGameId;
        if (!id) return;
        const now = Date.now();
        set({
          games: get().games.map((g) =>
            g.id === id ? { ...g, ...stopAllClocks(g, now) } : g,
          ),
        });
      },
      leaveGame: () => set({ activeGameId: null }),
      resumeGame: (id) => set({ activeGameId: id }),
      reopenGame: () => {
        const id = get().activeGameId;
        if (!id) return;
        const now = Date.now();
        set({
          games: get().games.map((g) => {
            if (g.id !== id) return g;
            const frozen = g.elapsedMs ?? (g.finishedAt ? g.finishedAt - g.startedAt : 0);
            return {
              ...g,
              status: "active" as const,
              finishedAt: undefined,
              startedAt: now - frozen,
              runningSince: now,
            };
          }),
        });
      },
    }),
    {
      name: "war-ledger",
      skipHydration: true,
      storage: createJSONStorage(() => idbStorage()),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<State>;
        const lists = mergeLists(persisted.lists, currentState.lists);
        const games = mergeGames(persisted.games, currentState.games);
        const currentActive =
          currentState.activeGameId && games.some((g) => g.id === currentState.activeGameId)
            ? currentState.activeGameId
            : null;
        const persistedActive =
          persisted.activeGameId && games.some((g) => g.id === persisted.activeGameId) ? persisted.activeGameId : null;
        return {
          ...currentState,
          lists,
          games,
          activeGameId: currentActive ?? persistedActive,
        };
      },
      partialize: (s) => ({
        lists: s.lists,
        games: s.games,
        activeGameId: s.activeGameId,
      }),
    },
  ),
);

export function useActiveGame(): Game | undefined {
  return useWarStore((s) => s.games.find((g) => g.id === s.activeGameId));
}

let hydrateOnce: Promise<void> | null = null;

export function hydrateWarStore() {
  if (hydrateOnce) return hydrateOnce;
  hydrateOnce = Promise.resolve(useWarStore.persist.rehydrate())
    .catch(() => undefined)
    .finally(() => {
      useWarStore.getState().setHydrated();
    });
  return hydrateOnce;
}

export type { Disposition };
