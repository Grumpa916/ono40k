import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { Game, Roster } from "@/data/types";

export type AccountSnapshot = {
  lists: Roster[];
  games: Game[];
  activeGameId: string | null;
};

const MAX_SAVE_CHARS = 1_500_000;

function asSnapshot(value: unknown): AccountSnapshot {
  if (!value || typeof value !== "object") throw new Error("bad save");
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.lists) || !Array.isArray(raw.games)) throw new Error("bad save");
  const text = JSON.stringify({ lists: raw.lists, games: raw.games, activeGameId: raw.activeGameId ?? null });
  if (text.length > MAX_SAVE_CHARS) throw new Error("save too large");
  return {
    lists: raw.lists as Roster[],
    games: raw.games as Game[],
    activeGameId: typeof raw.activeGameId === "string" ? raw.activeGameId : null,
  };
}

function parsePayload(value: unknown): AccountSnapshot {
  if (typeof value === "string") return asSnapshot(JSON.parse(value));
  return asSnapshot(value);
}

export const loadAccountSave = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ payload: unknown; updated_at: number }>`
      select payload, updated_at from account_saves where user_id = ${context.userId}
    `;
    const row = rows[0];
    if (!row) return null;
    return { payload: parsePayload(row.payload), updatedAt: Number(row.updated_at) };
  });

export const pushAccountSave = createServerFn({ method: "POST" })
  .validator((input: { payload: AccountSnapshot; baseUpdatedAt: number }) => {
    const payload = asSnapshot(input?.payload);
    const baseUpdatedAt = Number(input?.baseUpdatedAt);
    if (!Number.isFinite(baseUpdatedAt) || baseUpdatedAt < 0) throw new Error("bad save");
    return { payload, baseUpdatedAt };
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const now = Date.now();
    const body = JSON.stringify(data.payload);
    const updated = await sql<{ updated_at: number }>`
      insert into account_saves (user_id, payload, updated_at)
      values (${context.userId}, ${body}::jsonb, ${now})
      on conflict (user_id) do update
        set payload = excluded.payload, updated_at = excluded.updated_at
        where account_saves.updated_at <= ${data.baseUpdatedAt}
      returning updated_at
    `;
    if (updated[0]) return { ok: true as const, updatedAt: Number(updated[0].updated_at) };
    const current = await sql<{ payload: unknown; updated_at: number }>`
      select payload, updated_at from account_saves where user_id = ${context.userId}
    `;
    const row = current[0];
    if (!row) return { ok: true as const, updatedAt: now };
    return {
      ok: false as const,
      conflict: true as const,
      payload: parsePayload(row.payload),
      updatedAt: Number(row.updated_at),
    };
  });
