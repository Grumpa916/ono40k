import type { AccountSnapshot } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";

export type SavePushResult =
  | { ok: true; updatedAt: number }
  | { ok: false; conflict: true; payload: AccountSnapshot; updatedAt: number };

type SaveRow = { payload: AccountSnapshot; updated_at: number };

function asSnapshot(value: unknown): AccountSnapshot {
  if (!value || typeof value !== "object") throw new Error("Saved data was not readable.");
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.games)) throw new Error("Saved data was not readable.");
  return {
    lists: raw.lists as AccountSnapshot["lists"],
    games: raw.games as AccountSnapshot["games"],
    activeGameId: typeof raw.activeGameId === "string" ? raw.activeGameId : null,
  };
}

async function userId() {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not connected.");
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sign in to save.");
  return { supabase, userId: data.user.id };
}

export async function loadSupabaseSave(): Promise<{ payload: AccountSnapshot; updatedAt: number } | null> {
  const { supabase, userId: id } = await userId();
  const { data, error } = await supabase.from("account_saves").select("payload, updated_at").eq("user_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as SaveRow;
  return { payload: asSnapshot(row.payload), updatedAt: Number(row.updated_at) };
}

export async function pushSupabaseSave(payload: AccountSnapshot, baseUpdatedAt: number): Promise<SavePushResult> {
  const { supabase, userId: id } = await userId();
  const { data, error } = await supabase.from("account_saves").select("payload, updated_at").eq("user_id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (data && Number((data as SaveRow).updated_at) > baseUpdatedAt) {
    const row = data as SaveRow;
    return { ok: false, conflict: true, payload: asSnapshot(row.payload), updatedAt: Number(row.updated_at) };
  }
  const updatedAt = Date.now();
  const { error: writeError } = await supabase.from("account_saves").upsert({
    user_id: id,
    payload,
    updated_at: updatedAt,
  });
  if (writeError) throw new Error(writeError.message);
  return { ok: true, updatedAt };
}
