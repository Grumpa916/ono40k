import { useEffect, useSyncExternalStore } from "react";
import { loadAccountSave, pushAccountSave, type AccountSnapshot } from "@/lib/account-save";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { applyAccountSnapshot, hydrateWarStore, readAccountSnapshot, useWarStore } from "@/lib/store";
import { loadSupabaseSave, pushSupabaseSave, type SavePushResult } from "@/lib/supabase-save";
import { useSupabaseConfig, useSupabaseSession } from "@/lib/use-supabase-session";

type SyncPhase = "idle" | "saving" | "saved" | "error";

let phase: SyncPhase = "idle";
let detail = "";
const listeners = new Set<() => void>();

function setPhase(next: SyncPhase, nextDetail = "") {
  const message = next === "error" ? nextDetail : "";
  if (phase === next && detail === message) return;
  phase = next;
  detail = message;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSavePhase() {
  return useSyncExternalStore(subscribe, () => phase, () => "idle");
}

export function useSaveDetail() {
  return useSyncExternalStore(subscribe, () => detail, () => "");
}

export function retrySave() {
  lastJson = "";
  void pushNow();
}

let generation = 0;
let boundUser: string | null = null;
let backend: "supabase" | "server" = "server";
let baseUpdatedAt = 0;
let lastJson = "";
let applying = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let queued = false;

function snapshotJson(snap: AccountSnapshot) {
  return JSON.stringify(snap);
}

async function pushRemote(snap: AccountSnapshot, base: number): Promise<SavePushResult> {
  if (backend === "supabase") return pushSupabaseSave(snap, base);
  return pushAccountSave({ data: { payload: snap, baseUpdatedAt: base } });
}

async function pushNow() {
  if (!boundUser || applying) return;
  const snap = readAccountSnapshot();
  const json = snapshotJson(snap);
  if (json === lastJson) {
    setPhase("saved");
    return;
  }
  if (pushing) {
    queued = true;
    return;
  }
  pushing = true;
  setPhase("saving");
  const base = baseUpdatedAt;
  try {
    const result = await pushRemote(snap, base);
    if (!result.ok) {
      applying = true;
      applyAccountSnapshot(result.payload, "merge");
      applying = false;
      baseUpdatedAt = result.updatedAt;
      lastJson = snapshotJson(readAccountSnapshot());
      queued = true;
    } else {
      baseUpdatedAt = result.updatedAt;
      lastJson = json;
      setPhase("saved");
    }
  } catch (err) {
    setPhase("error", err instanceof Error ? err.message : "Could not save");
  } finally {
    pushing = false;
    if (queued) {
      queued = false;
      schedulePush();
    }
  }
}

function schedulePush() {
  if (!boundUser || applying) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void pushNow();
  }, 700);
}

let subscribed = false;
function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  useWarStore.subscribe(() => {
    if (applying || !boundUser) return;
    schedulePush();
  });
  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        void pushNow();
      }
    });
  }
}

export function AccountSync() {
  const { user, isPending } = useCurrentUserState();
  const supabaseConfig = useSupabaseConfig();
  const supabaseSession = useSupabaseSession();
  const usingSupabase = Boolean(supabaseConfig);
  const pending = usingSupabase ? supabaseSession.pending : isPending;
  const userId = usingSupabase ? supabaseSession.userId : (user?.id ?? null);

  useEffect(() => {
    if (pending) return;
    ensureSubscribed();
    if (!userId) {
      boundUser = null;
      applying = false;
      baseUpdatedAt = 0;
      lastJson = "";
      setPhase("idle");
      return;
    }
    let cancelled = false;
    void (async () => {
      await hydrateWarStore();
      if (cancelled) return;
      const switching = boundUser !== null && boundUser !== userId;
      const gen = ++generation;
      boundUser = userId;
      backend = usingSupabase ? "supabase" : "server";
      applying = true;
      try {
        const remote = usingSupabase ? await loadSupabaseSave() : await loadAccountSave();
        if (gen !== generation) return;
        if (cancelled) {
          applying = false;
          return;
        }
        applyAccountSnapshot(remote?.payload ?? null, switching ? "replace" : "merge");
        baseUpdatedAt = remote?.updatedAt ?? 0;
        const snap = readAccountSnapshot();
        const json = snapshotJson(snap);
        const remoteJson = remote ? snapshotJson(remote.payload) : "";
        if (!remote || json !== remoteJson) {
          lastJson = "";
          applying = false;
          void pushNow();
        } else {
          lastJson = json;
          applying = false;
          setPhase("saved");
        }
      } catch (err) {
        if (gen === generation) {
          applying = false;
          if (!cancelled) setPhase("error", err instanceof Error ? err.message : "Could not save");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pending, userId, usingSupabase]);

  return null;
}
