import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SAMPLE_LEDGERS } from "@/data/sample-ledgers";
import type { Game } from "@/data/types";
import { closedGames, factionName, resultOf, sideScore, summarize } from "@/lib/analytics";
import { useWarStore } from "@/lib/store";
import { battleElapsedMs, cn, formatClock } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({ component: AnnalsPage });

function AnnalsPage() {
  const stored = useWarStore((s) => s.games);
  const resumeGame = useWarStore((s) => s.resumeGame);
  const navigate = useNavigate();
  const real = useMemo(() => closedGames(stored), [stored]);
  const [useSample, setUseSample] = useState(false);
  const showingSample = real.length === 0 || useSample;
  const source = showingSample ? SAMPLE_LEDGERS : real;
  const stats = useMemo(() => summarize(source), [source]);
  const [openId, setOpenId] = useState<string | null>(source[0]?.id ?? null);
  const open = source.find((g) => g.id === openId) ?? source[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">War Journal</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide">Annals</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            After-action from closed ledgers: score, pace, matchups, and what the tape recorded.
          </p>
        </div>
        {real.length > 0 ? (
          <Button variant={useSample ? "secondary" : "outline"} onClick={() => setUseSample((v) => !v)}>
            {useSample ? "Your ledgers" : "Sample record"}
          </Button>
        ) : null}
      </div>

      {real.length === 0 ? (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Sample record</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Close a battle to replace this with your own games.</p>
          </div>
          <Button asChild>
            <Link to="/battle">Open the ledger</Link>
          </Button>
        </Card>
      ) : null}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Battles" value={String(stats.played)} />
        <Stat label="Record" value={`${stats.wins}–${stats.losses}${stats.draws ? `–${stats.draws}` : ""}`} hint="W–L–D" />
        <Stat label="Avg score" value={`${stats.avgMe}–${stats.avgThem}`} />
        <Stat label="Avg length" value={formatClock(stats.avgMs)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Primary by round</p>
          <p className="mt-1 text-sm text-muted-foreground">Average VP scored in each battle round.</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.roundAvg} barGap={4}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="round" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "color-mix(in oklab, var(--color-foreground) 6%, transparent)" }} />
                <Bar dataKey="me" name="You" fill="var(--color-steel)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                <Bar dataKey="them" name="Opponent" fill="var(--color-blood)" radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Score split</p>
          <p className="mt-1 text-sm text-muted-foreground">Where the points actually came from.</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.split} barGap={4}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTip />} cursor={{ fill: "color-mix(in oklab, var(--color-foreground) 6%, transparent)" }} />
                <Bar dataKey="me" name="You" fill="var(--color-steel)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="them" name="Opponent" fill="var(--color-blood)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-1">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Matchups</p>
          {stats.matchups.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No closed games yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.matchups.map((m) => (
                <li key={m.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {m.me} <span className="text-muted-foreground">vs</span> {m.them}
                  </span>
                  <span className="font-mono shrink-0 tabular-nums text-muted-foreground">
                    {m.wins}/{m.n}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Stratagems played</p>
          <RankList items={stats.strats} empty="No stratagems on the tape." />
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Units destroyed</p>
          <RankList items={stats.kills} empty="No kills recorded on the tape." />
        </Card>
      </section>

      {stats.pace.me + stats.pace.them > 0 ? (
        <p className="text-sm text-muted-foreground">
          Clock on the table: you {formatClock(stats.pace.me)} per game, opponent {formatClock(stats.pace.them)}.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold tracking-wide">Closed ledgers</h2>
        <ul className="space-y-2">
          {source.map((g) => {
            const on = open?.id === g.id;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(g.id)}
                  className={cn(
                    "flex w-full min-h-11 items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left",
                    on ? "border-primary bg-accent" : "border-border bg-card",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {g.myName} vs {g.opponentName}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {factionName(g.myRoster.factionId)} vs {factionName(g.opponentRoster.factionId)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <ResultMark game={g} />
                    <span className="font-mono text-sm tabular-nums">
                      {sideScore(g, "me")}–{sideScore(g, "opponent")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {open ? (
          <AfterAction
            game={open}
            sample={showingSample}
            onOpen={() => {
              if (showingSample && real.every((g) => g.id !== open.id)) return;
              resumeGame(open.id);
              void navigate({ to: "/battle" });
            }}
          />
        ) : null}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{label}</p>
      <p className="font-display mt-2 text-2xl font-semibold tracking-wide">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

function RankList({ items, empty }: { items: { name: string; n: number }[]; empty: string }) {
  if (!items.length) return <p className="mt-3 text-sm text-muted-foreground">{empty}</p>;
  const max = items[0]?.n ?? 1;
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item.name}>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{item.name}</span>
            <span className="font-mono shrink-0 tabular-nums text-muted-foreground">{item.n}</span>
          </div>
          <div className="mt-1 h-1 rounded-full bg-muted">
            <div className="h-1 rounded-full bg-steel" style={{ width: `${Math.round((item.n / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ResultMark({ game }: { game: Game }) {
  const r = resultOf(game);
  return (
    <Badge variant={r === "win" ? "ok" : r === "loss" ? "blood" : "outline"}>
      {r === "win" ? "Win" : r === "loss" ? "Loss" : "Draw"}
    </Badge>
  );
}

function AfterAction({ game, sample, onOpen }: { game: Game; sample: boolean; onOpen: () => void }) {
  const me = sideScore(game, "me");
  const them = sideScore(game, "opponent");
  const rounds = [1, 2, 3, 4, 5].map((r) => ({
    round: `R${r}`,
    me: game.scores.me.primaryByRound[r - 1] ?? 0,
    them: game.scores.opponent.primaryByRound[r - 1] ?? 0,
  }));
  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">After-action</p>
          <h3 className="font-display mt-1 text-xl">
            {game.myName} vs {game.opponentName}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {factionName(game.myRoster.factionId)} vs {factionName(game.opponentRoster.factionId)} · {formatClock(battleElapsedMs(game))}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-semibold tabular-nums leading-none">
            {me}–{them}
          </p>
          <p className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">
            Primary {game.scores.me.primaryByRound.reduce((a, b) => a + b, 0)} · Sec {game.scores.me.tactical} · Paint {game.scores.me.painted}
          </p>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rounds} barGap={3}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="round" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "color-mix(in oklab, var(--color-foreground) 6%, transparent)" }} />
            <Bar dataKey="me" name="You" fill="var(--color-steel)" radius={[3, 3, 0, 0]} maxBarSize={16} />
            <Bar dataKey="them" name="Opponent" fill="var(--color-blood)" radius={[3, 3, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(game.log ?? []).filter((e) => e.kind === "stratagem" || e.kind === "destroyed").length > 0 ? (
        <ul className="space-y-1.5">
          {(game.log ?? [])
            .filter((e) => e.kind === "stratagem" || e.kind === "destroyed")
            .slice(0, 8)
            .map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{e.summary}</span>
                <span className="font-mono shrink-0 text-[11px] tabular-nums text-muted-foreground">R{e.round}</span>
              </li>
            ))}
        </ul>
      ) : null}
      <Button className="w-full" variant="outline" disabled={sample} onClick={onOpen}>
        <ScrollText className="size-4" />
        {sample ? "Sample — close a real ledger to reopen" : "Open this ledger"}
      </Button>
    </Card>
  );
}

function ChartTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-0.5 tabular-nums">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}
