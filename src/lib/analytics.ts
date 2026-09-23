import { totalScore } from "@/data/missions";
import { getFaction } from "@/data/codex";
import type { Game } from "@/data/types";
import { battleElapsedMs } from "@/lib/utils";

export type GameResult = "win" | "loss" | "draw";

export function sideScore(game: Game, side: "me" | "opponent") {
  const s = game.scores[side];
  return totalScore(s.primaryByRound ?? [0, 0, 0, 0, 0], s.tactical ?? 0, s.painted ?? 0);
}

export function resultOf(game: Game): GameResult {
  const me = sideScore(game, "me");
  const them = sideScore(game, "opponent");
  if (me > them) return "win";
  if (me < them) return "loss";
  return "draw";
}

export function factionName(id: string) {
  return getFaction(id)?.name ?? id;
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function tally(items: string[], limit = 6) {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, n]) => ({ name, n }));
}

function stratLabel(summary: string) {
  const cut = summary.split(" · ").slice(1).join(" · ");
  return (cut.replace(/\s*\(\d+\s*CP\)\s*$/i, "").trim() || summary).trim();
}

function killLabel(summary: string) {
  return summary.replace(/\s+destroyed$/i, "").replace(/^.*?·\s*/, "").trim() || summary;
}

export type Annals = {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  avgMe: number;
  avgThem: number;
  avgMs: number;
  roundAvg: { round: string; me: number; them: number }[];
  split: { name: string; me: number; them: number }[];
  matchups: { key: string; me: string; them: string; n: number; wins: number }[];
  strats: { name: string; n: number }[];
  kills: { name: string; n: number }[];
  pace: { me: number; them: number };
};

export function closedGames(games: Game[]) {
  return games.filter((g) => g.status === "complete").slice().sort((a, b) => (b.finishedAt ?? b.startedAt) - (a.finishedAt ?? a.startedAt));
}

export function summarize(games: Game[]): Annals {
  const played = games.length;
  const results = games.map(resultOf);
  const wins = results.filter((r) => r === "win").length;
  const losses = results.filter((r) => r === "loss").length;
  const draws = results.filter((r) => r === "draw").length;
  const roundAvg = [1, 2, 3, 4, 5].map((r) => ({
    round: `R${r}`,
    me: Math.round(avg(games.map((g) => g.scores.me.primaryByRound[r - 1] ?? 0)) * 10) / 10,
    them: Math.round(avg(games.map((g) => g.scores.opponent.primaryByRound[r - 1] ?? 0)) * 10) / 10,
  }));
  const split = [
    {
      name: "Primary",
      me: Math.round(avg(games.map((g) => (g.scores.me.primaryByRound ?? []).reduce((a, b) => a + b, 0)))),
      them: Math.round(avg(games.map((g) => (g.scores.opponent.primaryByRound ?? []).reduce((a, b) => a + b, 0)))),
    },
    {
      name: "Secondaries",
      me: Math.round(avg(games.map((g) => g.scores.me.tactical ?? 0))),
      them: Math.round(avg(games.map((g) => g.scores.opponent.tactical ?? 0))),
    },
    {
      name: "Painted",
      me: Math.round(avg(games.map((g) => g.scores.me.painted ?? 0))),
      them: Math.round(avg(games.map((g) => g.scores.opponent.painted ?? 0))),
    },
  ];
  const matchMap = new Map<string, { me: string; them: string; n: number; wins: number }>();
  for (const g of games) {
    const me = factionName(g.myRoster.factionId);
    const them = factionName(g.opponentRoster.factionId);
    const key = `${me} vs ${them}`;
    const cur = matchMap.get(key) ?? { me, them, n: 0, wins: 0 };
    cur.n += 1;
    if (resultOf(g) === "win") cur.wins += 1;
    matchMap.set(key, cur);
  }
  const strats = tally(
    games.flatMap((g) => (g.log ?? []).filter((e) => e.kind === "stratagem").map((e) => stratLabel(e.summary))),
  );
  const kills = tally(
    games.flatMap((g) => (g.log ?? []).filter((e) => e.kind === "destroyed" && /destroyed$/i.test(e.summary)).map((e) => killLabel(e.summary))),
  );
  const pace = {
    me: Math.round(avg(games.map((g) => g.turnMs?.me ?? 0))),
    them: Math.round(avg(games.map((g) => g.turnMs?.opponent ?? 0))),
  };
  return {
    played,
    wins,
    losses,
    draws,
    avgMe: Math.round(avg(games.map((g) => sideScore(g, "me")))),
    avgThem: Math.round(avg(games.map((g) => sideScore(g, "opponent")))),
    avgMs: Math.round(avg(games.map((g) => battleElapsedMs(g)))),
    roundAvg,
    split,
    matchups: [...matchMap.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.n - a.n),
    strats,
    kills,
    pace,
  };
}
