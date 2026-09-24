import { createServerFn } from "@tanstack/react-start";
import type { BattleSize, Disposition, Roster, RosterUnit } from "@/data/types";
import { authMiddleware } from "@/lib/auth/middleware";

const DISPOSITIONS: Disposition[] = ["Take and Hold", "Purge the Foe", "Disruption", "Reconnaissance", "Priority Assets"];

export type OutgoingShare = { id: string; email: string | null; createdAt: number };
export type IncomingShare = { id: string; from: string | null; createdAt: number; list: Roster };

function asRoster(input: unknown): Roster {
  if (!input || typeof input !== "object") throw new Error("bad list");
  const raw = input as Record<string, unknown>;
  const battleSize: BattleSize | null = raw.battleSize === "incursion" || raw.battleSize === "strike" ? raw.battleSize : null;
  if (!battleSize) throw new Error("bad list");
  const disposition = DISPOSITIONS.find((item) => item === raw.disposition) ?? null;
  if (!Array.isArray(raw.units)) throw new Error("bad list");
  const units: RosterUnit[] = raw.units.slice(0, 200).map((unit) => {
    if (!unit || typeof unit !== "object") throw new Error("bad list");
    const row = unit as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.unitId !== "string") throw new Error("bad list");
    return {
      id: row.id.slice(0, 80),
      unitId: row.unitId.slice(0, 80),
      models: Math.max(0, Math.min(200, Number(row.models) || 0)),
      points: Math.max(0, Math.min(10000, Number(row.points) || 0)),
      enhancementId: typeof row.enhancementId === "string" ? row.enhancementId.slice(0, 80) : undefined,
      attachedTo: typeof row.attachedTo === "string" ? row.attachedTo.slice(0, 80) : undefined,
      warlord: row.warlord === true,
      notes: typeof row.notes === "string" ? row.notes.slice(0, 500) : undefined,
      wargearIds: Array.isArray(row.wargearIds) ? row.wargearIds.filter((id): id is string => typeof id === "string").slice(0, 40) : undefined,
    };
  });
  const id = typeof raw.id === "string" ? raw.id.slice(0, 80) : "";
  const factionId = typeof raw.factionId === "string" ? raw.factionId.slice(0, 80) : "";
  if (!id || !factionId) throw new Error("bad list");
  return {
    id,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : "Shared list",
    factionId,
    battleSize,
    pointsLimit: Math.max(0, Math.min(10000, Number(raw.pointsLimit) || 0)),
    detachmentIds: Array.isArray(raw.detachmentIds) ? raw.detachmentIds.filter((item): item is string => typeof item === "string").slice(0, 8) : [],
    disposition,
    units,
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 2000) : "",
    favorite: false,
    saved: true,
    createdAt: 0,
    updatedAt: 0,
  };
}

function readRoster(value: unknown): Roster {
  if (typeof value === "string") return asRoster(JSON.parse(value));
  return asRoster(value);
}

function emailOf(value: string) {
  const email = value.trim().toLowerCase();
  if (!email.includes("@") || email.length > 200) throw new Error("bad email");
  return email;
}

export const shareList = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; list: Roster }) => ({ email: emailOf(input?.email ?? ""), list: asRoster(input?.list) }))
  .handler(async ({ context, data }): Promise<{ ok: true } | { ok: false; error: "no-account" | "self" }> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const found = await sql<{ id: string }>`select "id" from "user" where lower("email") = ${data.email} limit 1`;
    const recipientId = found[0]?.id;
    if (!recipientId) return { ok: false, error: "no-account" };
    if (recipientId === context.userId) return { ok: false, error: "self" };
    const now = Date.now();
    const body = JSON.stringify(data.list);
    await sql`
      insert into list_shares (id, owner_id, recipient_id, list_id, payload, created_at)
      values (${crypto.randomUUID()}, ${context.userId}, ${recipientId}, ${data.list.id}, ${body}::jsonb, ${now})
      on conflict (owner_id, recipient_id, list_id)
      do update set payload = excluded.payload, created_at = excluded.created_at
    `;
    return { ok: true };
  });

export const outgoingShares = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((listId: string) => {
    if (typeof listId !== "string" || !listId || listId.length > 80) throw new Error("bad list");
    return listId;
  })
  .handler(async ({ context, data }): Promise<OutgoingShare[]> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: string; email: string | null; created_at: number }>`
      select list_shares.id, "user"."email" as email, list_shares.created_at
      from list_shares
      left join "user" on "user"."id" = list_shares.recipient_id
      where list_shares.owner_id = ${context.userId} and list_shares.list_id = ${data}
      order by list_shares.created_at desc
    `;
    return rows.map((row) => ({ id: row.id, email: row.email, createdAt: Number(row.created_at) }));
  });

export const incomingShares = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<IncomingShare[]> => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ id: string; email: string | null; created_at: number; payload: unknown }>`
      select list_shares.id, "user"."email" as email, list_shares.created_at, list_shares.payload
      from list_shares
      left join "user" on "user"."id" = list_shares.owner_id
      where list_shares.recipient_id = ${context.userId}
      order by list_shares.created_at desc
    `;
    return rows.map((row) => ({
      id: row.id,
      from: row.email,
      createdAt: Number(row.created_at),
      list: readRoster(row.payload),
    }));
  });

export const revokeShare = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => {
    if (typeof id !== "string" || !id || id.length > 80) throw new Error("bad share");
    return id;
  })
  .handler(async ({ context, data }) => {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`delete from list_shares where id = ${data} and owner_id = ${context.userId}`;
    return { ok: true as const };
  });
