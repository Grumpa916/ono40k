import { SEED_LISTS } from "./seeds";
import type { Game, LedgerEvent, SideScore } from "./types";

const empty: SideScore = {
  primaryByRound: [0, 0, 0, 0, 0],
  primaryChecks: [],
  secondaryMode: "tactical",
  fixedIds: [],
  tacticalActive: [],
  secondaryChecks: {},
  secondaryMeta: {},
  tactical: 0,
  painted: 10,
};

function score(primary: [number, number, number, number, number], tactical: number, painted = 10): SideScore {
  return { ...empty, primaryByRound: primary, tactical, painted };
}

function ev(id: string, kind: LedgerEvent["kind"], summary: string, round: 1 | 2 | 3 | 4 | 5, clockMs: number): LedgerEvent {
  return { id, at: 1, kind, summary, round, phase: "shooting", turn: "me", clockMs };
}

function list(id: string) {
  const found = SEED_LISTS.find((l) => l.id === id);
  if (!found) throw new Error(`missing seed ${id}`);
  return found;
}

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 8, 20);

function game(partial: Omit<Game, "round" | "phase" | "activeSide" | "viewing" | "cp" | "unitState" | "activeStrats" | "undoStack" | "notes" | "status" | "liveRound" | "liveSide" | "livePhase"> & Partial<Game>): Game {
  return {
    round: 5,
    phase: "end",
    activeSide: "opponent",
    viewing: "me",
    cp: { me: 1, opponent: 0 },
    unitState: {},
    activeStrats: [],
    undoStack: [],
    notes: "",
    status: "complete",
    liveRound: 5,
    liveSide: "opponent",
    livePhase: "end",
    ...partial,
  };
}

export const SAMPLE_LEDGERS: Game[] = [
  game({
    id: "sample-um-nids",
    myName: "You",
    opponentName: "Marcus",
    myRoster: list("seed-um-blade"),
    opponentRoster: list("seed-nids-vanguard"),
    scores: {
      me: score([8, 12, 15, 10, 8], 25),
      opponent: score([5, 8, 10, 12, 15], 20),
    },
    startedAt: now - 6 * DAY,
    finishedAt: now - 6 * DAY + 2.6 * 60 * 60 * 1000,
    elapsedMs: 2.6 * 60 * 60 * 1000,
    turnMs: { me: 78 * 60 * 1000, opponent: 71 * 60 * 1000 },
    log: [
      ev("a1", "stratagem", "You · Fire Overwatch (1 CP)", 1, 12 * 60 * 1000),
      ev("a2", "destroyed", "Marcus · Hormagaunts destroyed", 2, 40 * 60 * 1000),
      ev("a3", "stratagem", "You · Armour of Contempt (1 CP)", 2, 48 * 60 * 1000),
      ev("a4", "destroyed", "You · Termagants destroyed", 3, 80 * 60 * 1000),
      ev("a5", "stratagem", "Marcus · Insane Bravery (1 CP)", 3, 92 * 60 * 1000),
      ev("a6", "destroyed", "Marcus · Redemptor Dreadnought destroyed", 4, 130 * 60 * 1000),
      ev("a7", "stratagem", "You · Command Re-roll (1 CP)", 5, 150 * 60 * 1000),
    ],
  }),
  game({
    id: "sample-sm-tau",
    myName: "You",
    opponentName: "Priya",
    myRoster: list("seed-sm-gladius"),
    opponentRoster: {
      ...list("seed-um-blade"),
      id: "sample-tau-proxy",
      name: "Kauyon Cadre",
      factionId: "tau",
      detachmentIds: [],
      disposition: "Take and Hold",
    },
    scores: {
      me: score([5, 8, 10, 8, 12], 18),
      opponent: score([8, 10, 12, 15, 8], 22),
    },
    startedAt: now - 13 * DAY,
    finishedAt: now - 13 * DAY + 2.9 * 60 * 60 * 1000,
    elapsedMs: 2.9 * 60 * 60 * 1000,
    turnMs: { me: 82 * 60 * 1000, opponent: 88 * 60 * 1000 },
    log: [
      ev("b1", "stratagem", "You · Go to Ground (1 CP)", 1, 18 * 60 * 1000),
      ev("b2", "destroyed", "Priya · Intercessor Squad destroyed", 2, 55 * 60 * 1000),
      ev("b3", "stratagem", "Priya · Fire Overwatch (1 CP)", 2, 61 * 60 * 1000),
      ev("b4", "stratagem", "You · Command Re-roll (1 CP)", 3, 95 * 60 * 1000),
      ev("b5", "destroyed", "You · Crisis Battlesuits destroyed", 4, 140 * 60 * 1000),
    ],
  }),
  game({
    id: "sample-nids-um",
    myName: "You",
    opponentName: "Diego",
    myRoster: list("seed-nids-vanguard"),
    opponentRoster: list("seed-um-blade"),
    scores: {
      me: score([10, 15, 12, 8, 5], 30),
      opponent: score([8, 8, 10, 12, 10], 15),
    },
    startedAt: now - 20 * DAY,
    finishedAt: now - 20 * DAY + 2.2 * 60 * 60 * 1000,
    elapsedMs: 2.2 * 60 * 60 * 1000,
    turnMs: { me: 64 * 60 * 1000, opponent: 70 * 60 * 1000 },
    log: [
      ev("c1", "stratagem", "You · Insane Bravery (1 CP)", 1, 8 * 60 * 1000),
      ev("c2", "destroyed", "Diego · Infiltrator Squad destroyed", 1, 22 * 60 * 1000),
      ev("c3", "destroyed", "You · Bladeguard Veterans destroyed", 2, 50 * 60 * 1000),
      ev("c4", "stratagem", "You · Command Re-roll (1 CP)", 3, 88 * 60 * 1000),
      ev("c5", "stratagem", "Diego · Armour of Contempt (1 CP)", 4, 120 * 60 * 1000),
      ev("c6", "destroyed", "Diego · Hive Tyrant destroyed", 5, 148 * 60 * 1000),
    ],
  }),
  game({
    id: "sample-um-sm",
    myName: "You",
    opponentName: "Chris",
    myRoster: list("seed-um-blade"),
    opponentRoster: list("seed-sm-gladius"),
    scores: {
      me: score([8, 10, 10, 10, 8], 20),
      opponent: score([8, 10, 10, 10, 8], 20),
    },
    startedAt: now - 27 * DAY,
    finishedAt: now - 27 * DAY + 3.1 * 60 * 60 * 1000,
    elapsedMs: 3.1 * 60 * 60 * 1000,
    turnMs: { me: 90 * 60 * 1000, opponent: 86 * 60 * 1000 },
    log: [
      ev("d1", "stratagem", "You · Command Re-roll (1 CP)", 2, 40 * 60 * 1000),
      ev("d2", "stratagem", "Chris · Command Re-roll (1 CP)", 2, 44 * 60 * 1000),
      ev("d3", "destroyed", "Chris · Hellblaster Squad destroyed", 3, 95 * 60 * 1000),
      ev("d4", "destroyed", "You · Eradicator Squad destroyed", 4, 128 * 60 * 1000),
    ],
  }),
];
