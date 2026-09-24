import type { Game } from "../../data/types.ts";
import { DependencyManager, DerivedCache } from "./dependency.ts";
import { createBattleRuntime, executeCommand } from "./commands.ts";
import type { BattleCommand, BattleEvent, BattleRuntime, CommandResult, DerivedRecord } from "./types.ts";

export class BattleEngine {
  private state: BattleRuntime;
  private readonly dependencies = new DependencyManager();
  private readonly cache = new DerivedCache();
  private readonly committedCommands = new Set<string>();
  private lastInvalidated: string[] = [];

  constructor(game: Game) {
    this.state = createBattleRuntime(game);
  }

  getState() {
    return structuredClone(this.state);
  }

  getDependencyManager() {
    return this.dependencies;
  }

  getCache() {
    return this.cache;
  }

  getLastInvalidated() {
    return [...this.lastInvalidated];
  }

  registerDerived(key: string, dependencies: string[]) {
    this.dependencies.register(key, dependencies);
  }

  setDerived<T>(key: string, value: T, dependencies: string[]) {
    const versions: Record<string, number> = {};
    for (const dependency of dependencies) versions[dependency] = this.state.versions[dependency] ?? 0;
    this.dependencies.register(key, dependencies);
    return this.cache.set<T>({ key, value, dependencies, versions, calculatedAt: Date.now() });
  }

  getDerived<T>(key: string): DerivedRecord<T> | undefined {
    if (this.dependencies.isDirty(key)) return undefined;
    const record = this.cache.get<T>(key);
    if (!record) return undefined;
    for (const dependency of record.dependencies) {
      if ((this.state.versions[dependency] ?? 0) !== (record.versions[dependency] ?? 0)) return undefined;
    }
    return record;
  }

  dispatch(command: BattleCommand): CommandResult {
    if (this.committedCommands.has(command.id)) {
      return { ok: false, events: [], error: "Duplicate command: " + command.id };
    }

    const result = executeCommand(this.state, command);
    if (!result.ok || !result.state) return result;

    this.state = result.state;
    this.committedCommands.add(command.id);
    this.lastInvalidated = this.dependencies.invalidateEvents(result.events);
    this.cache.invalidate(this.lastInvalidated);
    return result;
  }

  consumeInvalidations() {
    const out = [...this.lastInvalidated];
    for (const key of out) this.dependencies.consume(key);
    this.lastInvalidated = [];
    return out;
  }

  resetDerivedState() {
    this.cache.clear();
    for (const key of this.lastInvalidated) this.dependencies.markDirty(key);
  }
}