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
  ScoringAction,
  Stratagem,
  UnitBattleState,
} from "@/data/types";
import { BATTLE_SIZES, PHASES } from "@/data/types";
import { cardAward, getSecondary, secondaryVp } from "@/data/secondaries";
import { parseObjective } from "@/data/missions";
import { getMap } from "@/data/maps";
import { primaryForSide, rosterDisposition } from "@/lib/validation";
import { battleElapsedMs, uid, unitCopyMarks } from "@/lib/utils";
import { reconcileBattle, registerBattle, unregisterBattle } from "@/lib/battle-engine-bridge";

const emptyScore = (): SideScore => ({