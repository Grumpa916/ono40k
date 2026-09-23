import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "ono40k-supabase";
const SKIP_BUILTIN_KEY = "ono40k-supabase-skip-builtin";

/** Public project. The publishable key is safe in the client; RLS still scopes each account. */
const BUILTIN_URL = "https://obeesadkiuufhkaieacj.supabase.co";
const BUILTIN_KEY = "sb_publishable_iHv3b-VVSmXnu-hVQWn3TQ_DG9QqUfg";

export type SupabaseConfig = { url: string; anonKey: string };

export const SUPABASE_SCHEMA = `create table if not exists public.account_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at bigint not null
);

alter table public.account_saves enable row level security;

grant select, insert, update, delete on table public.account_saves to authenticated;

drop policy if exists "account_saves_own" on public.account_saves;
create policy "account_saves_own"
  on public.account_saves
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`;

function clean(url: string, anonKey: string): SupabaseConfig | null {
  const trimmedUrl = url.trim().replace(/\/$/, "");
  const key = anonKey.trim();
  if (!trimmedUrl || !key) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (key.length < 20 || /\s/.test(key)) return null;
  return { url: trimmedUrl, anonKey: key };
}

let cachedRaw = "\0";
let cached: SupabaseConfig | null = null;

function skipBuiltin() {
  return typeof localStorage !== "undefined" && localStorage.getItem(SKIP_BUILTIN_KEY) === "1";
}

export function readSupabaseConfig(): SupabaseConfig | null {
  const envUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "");
  const envKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY ?? "");
  const stored = typeof localStorage === "undefined" ? "" : (localStorage.getItem(STORAGE_KEY) ?? "");
  const skip = skipBuiltin() ? "1" : "0";
  const raw = `${envUrl}\n${envKey}\n${stored}\n${skip}`;
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  const fromEnv = clean(envUrl, envKey);
  if (fromEnv) {
    cached = fromEnv;
    return cached;
  }
  try {
    const parsed = stored ? (JSON.parse(stored) as Partial<SupabaseConfig>) : null;
    const fromStored = parsed ? clean(parsed.url ?? "", parsed.anonKey ?? "") : null;
    if (fromStored) {
      cached = fromStored;
      return cached;
    }
  } catch {
    cached = null;
  }
  cached = skip === "1" ? null : clean(BUILTIN_URL, BUILTIN_KEY);
  return cached;
}

let client: SupabaseClient | null = null;
let clientKey = "";

export function getSupabase(): SupabaseClient | null {
  const cfg = readSupabaseConfig();
  if (!cfg) {
    client = null;
    clientKey = "";
    return null;
  }
  const key = `${cfg.url}\n${cfg.anonKey}`;
  if (client && clientKey === key) return client;
  client = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  clientKey = key;
  return client;
}

const listeners = new Set<() => void>();

export function subscribeSupabaseConfig(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitConfig() {
  client = null;
  clientKey = "";
  for (const listener of listeners) listener();
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  const cfg = clean(url, anonKey);
  if (!cfg) throw new Error("Use the https project URL and the anon key.");
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  localStorage.removeItem(SKIP_BUILTIN_KEY);
  emitConfig();
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(SKIP_BUILTIN_KEY, "1");
  emitConfig();
}

export function useBuiltinSupabase() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SKIP_BUILTIN_KEY);
  emitConfig();
}

export function supabaseConfigured() {
  return readSupabaseConfig() !== null;
}
