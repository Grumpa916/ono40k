import type { BattleEvent, DerivedRecord } from "./types";

export class DependencyManager {
  private readonly reverse = new Map<string, Set<string>>();
  private readonly dependencies = new Map<string, Set<string>>();
  private readonly dirty = new Set<string>();

  register(key: string, dependencies: string[]) {
    this.unregister(key);
    const deps = new Set(dependencies);
    this.dependencies.set(key, deps);
    for (const dep of deps) {
      const set = this.reverse.get(dep) ?? new Set<string>();
      set.add(key);
      this.reverse.set(dep, set);
    }
    this.dirty.delete(key);
  }

  unregister(key: string) {
    const deps = this.dependencies.get(key);
    if (!deps) return;
    for (const dep of deps) {
      const set = this.reverse.get(dep);
      set?.delete(key);
      if (set && set.size === 0) this.reverse.delete(dep);
    }
    this.dependencies.delete(key);
    this.dirty.delete(key);
  }

  invalidateDependencies(dependencies: string[]) {
    const out = new Set<string>();
    for (const dep of dependencies) {
      for (const key of this.reverse.get(dep) ?? []) {
        this.dirty.add(key);
        out.add(key);
      }
    }
    return [...out];
  }

  invalidateEvents(events: BattleEvent[]) {
    const deps = new Set<string>();
    for (const event of events) {
      deps.add("event:" + event.type);
      if ("unitId" in event) deps.add("unit:" + event.unitId);
      if ("objectiveId" in event) deps.add("objective:" + event.objectiveId);
      if (event.type === "PHASE_CHANGED") deps.add("phase:" + event.phase);
      if (event.type === "TURN_CHANGED") deps.add("turn:" + event.round + ":" + event.side);
      if (event.type === "CP_CHANGED") deps.add("battle:cp:" + event.side);
      if (event.type === "VP_CHANGED") deps.add("battle:vp:" + event.side);
    }
    return this.invalidateDependencies([...deps]);
  }

  isDirty(key: string) { return this.dirty.has(key); }
  markDirty(key: string) { this.dirty.add(key); }
  consume(key: string) { this.dirty.delete(key); }
  clear() { this.reverse.clear(); this.dependencies.clear(); this.dirty.clear(); }
}

export class DerivedCache {
  private readonly values = new Map<string, DerivedRecord>();

  get<T>(key: string) { return this.values.get(key) as DerivedRecord<T> | undefined; }
  set<T>(record: DerivedRecord<T>) { this.values.set(record.key, record); return record; }
  delete(key: string) { this.values.delete(key); }
  invalidate(keys: string[]) { for (const key of keys) this.values.delete(key); }
  clear() { this.values.clear(); }
}