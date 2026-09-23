import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, Copy, Import, Plus, Star, Swords, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { FACTIONS, getFaction } from "@/data/codex";
import { BATTLE_SIZES, type BattleSize, type Roster } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { totalScore } from "@/data/missions";
import { decodeRoster } from "@/lib/share";
import { useWarStore } from "@/lib/store";
import { useSupabaseConfig } from "@/lib/use-supabase-session";
import { rosterPoints } from "@/lib/validation";
import { cn, battleElapsedMs, formatClock } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const lists = useWarStore((s) => s.lists);
  const games = useWarStore((s) => s.games);
  const toggleFavorite = useWarStore((s) => s.toggleFavorite);
  const duplicateList = useWarStore((s) => s.duplicateList);
  const deleteList = useWarStore((s) => s.deleteList);
  const importList = useWarStore((s) => s.importList);
  const activeGameId = useWarStore((s) => s.activeGameId);
  const resumeGame = useWarStore((s) => s.resumeGame);
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const shown = useMemo(() => {
    return lists.slice().sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt);
  }, [lists]);
  const saved = shown.filter((l) => l.saved !== false);
  const drafts = shown.filter((l) => l.saved === false);

  const history = games.filter((g) => g.status === "complete").slice(0, 6);
  const supabaseReady = Boolean(useSupabaseConfig());

  return (
    <div className="min-w-0 space-y-8">
      {mounted && !supabaseReady ? (
        <Link
          to="/login"
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted px-4 py-3"
        >
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Cloud save</p>
            <p className="font-display text-lg">Connect Supabase</p>
          </div>
        </Link>
      ) : null}
      {activeGameId ? (
        <Link
          to="/battle"
          className="flex items-center justify-between gap-3 rounded-xl border border-blood/40 bg-blood/10 px-4 py-3"
        >
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-blood uppercase">Active battle</p>
            <p className="font-display text-lg">View ledger</p>
          </div>
          <Swords className="size-5 text-blood" />
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">Muster</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-wide">
            Army Lists
            {lists.length ? <span className="ml-2 font-mono text-base font-normal tabular-nums text-muted-foreground">{lists.length}</span> : null}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Build as many 11th edition strike forces as you need, then open a battle with two lists on the table.
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button variant="outline" className="col-span-2 sm:col-span-1" asChild>
            <Link to="/battle">
              <BookOpen className="size-4" /> View ledger
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Import className="size-4" /> Import
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New list
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-xl">No lists yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Muster your first strike force, then tap Save to pin it here.
          </p>
          <Button className="mt-5" onClick={() => setCreateOpen(true)}>
            Create list
          </Button>
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-wide">
                Saved armies
                {saved.length ? <span className="ml-2 font-mono text-sm font-normal tabular-nums text-muted-foreground">{saved.length}</span> : null}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Pinned lists from Save in the builder. They stay on this device.</p>
            </div>
            {saved.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No saved armies yet. Open a list and tap Save.</p>
              </Card>
            ) : (
              <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
                {saved.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onFavorite={() => toggleFavorite(list.id)}
                    onDuplicate={() => {
                      const id = duplicateList(list.id);
                      if (id) toast("List duplicated");
                    }}
                    onDelete={() => {
                      deleteList(list.id);
                      toast("List deleted");
                    }}
                  />
                ))}
              </ul>
            )}
          </section>
          {drafts.length > 0 ? (
            <section className="space-y-3">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-wide">
                  Drafts
                  <span className="ml-2 font-mono text-sm font-normal tabular-nums text-muted-foreground">{drafts.length}</span>
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Working lists that have not been saved yet.</p>
              </div>
              <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
                {drafts.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    onFavorite={() => toggleFavorite(list.id)}
                    onDuplicate={() => {
                      const id = duplicateList(list.id);
                      if (id) toast("List duplicated");
                    }}
                    onDelete={() => {
                      deleteList(list.id);
                      toast("List deleted");
                    }}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">War Journal</p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-wide">Annals</h2>
            <p className="mt-1 text-sm text-muted-foreground">Wins, VP by round, matchups, and the tape from closed ledgers.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/analytics">Open</Link>
          </Button>
        </div>
      </section>

      {history.length > 0 ? (
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-wide">Closed ledgers</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/analytics">Annals</Link>
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {history.map((g) => {
              const me = totalScore(g.scores.me.primaryByRound, g.scores.me.tactical, g.scores.me.painted);
              const them = totalScore(g.scores.opponent.primaryByRound, g.scores.opponent.tactical, g.scores.opponent.painted);
              return (
                <li key={g.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  <span className="min-w-0 truncate">
                    {g.myName} vs {g.opponentName}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">{formatClock(battleElapsedMs(g))}</span>
                    <span className="font-mono tabular-nums">
                      {me} – {them}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        resumeGame(g.id);
                        void navigate({ to: "/battle" });
                      }}
                    >
                      View ledger
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <CreateListDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import share code</DialogTitle>
            <DialogDescription>Paste a WL1 share code from another Ono40k list.</DialogDescription>
          </DialogHeader>
          <Textarea value={importCode} onChange={(e) => setImportCode(e.target.value)} placeholder="WL1.…" />
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const decoded = decodeRoster(importCode);
              if (!decoded) {
                toast.error("Could not read that code");
                return;
              }
              const id = importList(decoded);
              setImportOpen(false);
              setImportCode("");
              toast("List imported");
              void navigate({ to: "/lists/$listId", params: { listId: id } });
            }}
          >
            Import
          </Button>
        </DialogContent>
      </Dialog>
      <p className="pb-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        Unofficial fan companion. Not affiliated with Games Workshop. Points and rules are a table reference, not a substitute for the current Munitorum Field Manual.
      </p>
    </div>
  );
}

function ListCard({
  list,
  onFavorite,
  onDuplicate,
  onDelete,
}: {
  list: Roster;
  onFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const faction = getFaction(list.factionId);
  const pts = rosterPoints(list);
  return (
    <li className="min-w-0">
      <Card className="flex h-full min-w-0 flex-col overflow-hidden p-4" style={{ borderLeftWidth: 3, borderLeftColor: faction?.accent }}>
        <div className="flex items-start justify-between gap-3">
          <Link to="/lists/$listId" params={{ listId: list.id }} className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{faction?.name}</p>
            <h2 className="font-display mt-0.5 truncate text-lg font-semibold">{list.name}</h2>
          </Link>
          <button
            type="button"
            aria-label="Favorite"
            onClick={onFavorite}
            className={cn("rounded-md p-2", list.favorite ? "text-steel" : "text-muted-foreground")}
          >
            <Star className={cn("size-4", list.favorite && "fill-current")} />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="outline">{BATTLE_SIZES[list.battleSize].label}</Badge>
          <Badge className="tabular-nums">
            {pts}/{list.pointsLimit}
          </Badge>
          {list.disposition ? <Badge>{list.disposition}</Badge> : null}
          <Badge variant="outline">{list.units.length} units</Badge>
          {list.saved === false ? <Badge variant="outline">Draft</Badge> : null}
        </div>
        <div className="mt-4 flex items-center gap-1">
          <Button size="sm" variant="secondary" asChild>
            <Link to="/lists/$listId" params={{ listId: list.id }}>
              Edit
            </Link>
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Duplicate" onClick={onDuplicate}>
            <Copy className="size-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </Card>
    </li>
  );
}

function CreateListDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createList = useWarStore((s) => s.createList);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [factionId, setFactionId] = useState("um");
  const [battleSize, setBattleSize] = useState<BattleSize>("strike");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New army list</DialogTitle>
          <DialogDescription>Pick a faction and battle size, then muster the roster.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="list-name">Name</Label>
            <Input id="list-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="III Company" />
          </div>
          <div className="space-y-1.5">
            <Label>Faction</Label>
            <Select value={factionId} onValueChange={setFactionId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACTIONS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                    {f.short ? ` · ${f.short}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Battle size</Label>
            <Select value={battleSize} onValueChange={(v) => setBattleSize(v as BattleSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incursion">Incursion · 1000 pts · 2 DP</SelectItem>
                <SelectItem value="strike">Strike Force · 2000 pts · 3 DP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              const id = createList({
                name: name.trim() || "Untitled list",
                factionId,
                battleSize,
              });
              onOpenChange(false);
              setName("");
              void navigate({ to: "/lists/$listId", params: { listId: id } });
            }}
          >
            Open builder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
