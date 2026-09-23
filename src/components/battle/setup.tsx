import { Check, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GameSetup } from "@/components/battle/game-setup";
import { CodexDraft } from "@/components/battle/codex-draft";
import { armyMeta, armyTitle, resolveArmy, sourceKey, type ArmySource, defaultCodex } from "@/components/battle/army-source";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFaction } from "@/data/codex";
import { useWarStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BattleSetup({ presetListId }: { presetListId?: string }) {
  const lists = useWarStore((s) => s.lists);
  const [step, setStep] = useState<"pool" | "briefing">("pool");
  const [myName, setMyName] = useState("Grumpa");
  const [oppName, setOppName] = useState("Jared");
  const [pool, setPool] = useState<ArmySource[]>([]);
  const [draft, setDraft] = useState<Extract<ArmySource, { kind: "codex" }>>(() => defaultCodex("um"));
  const [codexArmed, setCodexArmed] = useState(false);

  useEffect(() => {
    if (!presetListId || !lists.some((l) => l.id === presetListId)) return;
    setPool((prev) => (prev.some((s) => s.kind === "list" && s.listId === presetListId) ? prev : [{ kind: "list", listId: presetListId }, ...prev]));
  }, [presetListId, lists]);

  const you = pool[0] ?? null;
  const them = pool[1] ?? null;
  const myRoster = you ? resolveArmy(you, lists) : null;
  const oppRoster = them ? resolveArmy(them, lists) : null;

  const codexQuiet = pool.length >= 2;

  const toggleList = (listId: string) => {
    const on = pool.some((s) => s.kind === "list" && s.listId === listId);
    if (on) {
      setPool(pool.filter((s) => !(s.kind === "list" && s.listId === listId)));
      return;
    }
    if (pool.length >= 2) {
      toast("Only two armies. Untick one first.");
      return;
    }
    setPool([...pool, { kind: "list", listId }]);
  };
  const addDraft = () => {
    if (pool.length >= 2) {
      toast("Only two armies. Untick one first.");
      return;
    }
    if (draft.detachmentIds.length === 0) {
      toast("Select at least one detachment");
      return;
    }
    const key = sourceKey(draft);
    setPool((prev) => (prev.some((s) => sourceKey(s) === key) ? prev : [...prev, draft]));
  };
  const removeFromPool = (key: string) => {
    setPool((prev) => prev.filter((s) => sourceKey(s) !== key));
  };

  const presetSource: ArmySource | null =
    presetListId && lists.some((l) => l.id === presetListId) ? { kind: "list", listId: presetListId } : null;

  if (presetSource) {
    return <GameSetup initialMine={presetSource} initialTheirs={null} />;
  }

  if (step === "briefing" && you && them) {
    return <GameSetup initialMine={you} initialTheirs={them} names={{ me: myName, opponent: oppName }} onBack={() => setStep("pool")} />;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">War Journal · Armies</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Pick armies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tick the two lists for this game, or add a faction from the codex with up to 3 DP of detachments.
        </p>
      </div>

      {lists.length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Saved lists</p>
          <ul className="grid grid-cols-2 gap-1.5">
            {lists.map((l) => {
              const on = pool.some((s) => s.kind === "list" && s.listId === l.id);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => toggleList(l.id)}
                    className={cn(
                      "flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border px-2.5 py-2 text-left",
                      on ? "border-primary bg-accent" : "border-border bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on ? <Check className="size-2.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-medium">{l.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{getFaction(l.factionId)?.name}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <CodexDraft
        source={draft}
        quiet={codexQuiet}
        open={codexArmed && !codexQuiet}
        onSource={(next) => {
          setCodexArmed(true);
          setDraft(next);
        }}
      />
      {codexArmed && !codexQuiet ? (
        <Button variant="outline" className="w-full" disabled={draft.detachmentIds.length === 0} onClick={addDraft}>
          <Plus className="size-4" />
          Add to this game
        </Button>
      ) : null}

      {pool.filter((s) => s.kind === "codex").length > 0 ? (
        <section className="space-y-2">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Codex armies added</p>
          <ul className="space-y-1.5">
            {pool
              .filter((s) => s.kind === "codex")
              .map((s) => (
                <li key={sourceKey(s)} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{armyTitle(s, lists)}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{armyMeta(s, lists)}</span>
                  </span>
                  <Button size="icon-sm" variant="ghost" aria-label="Remove army" onClick={() => removeFromPool(sourceKey(s))}>
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {pool.length === 2 && you && them ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>You</Label>
            <Input value={myName} onChange={(e) => setMyName(e.target.value)} />
            <p className="truncate text-[11px] text-muted-foreground">{armyTitle(you, lists)}</p>
          </div>
          <div className="space-y-1">
            <Label>Opponent</Label>
            <Input value={oppName} onChange={(e) => setOppName(e.target.value)} />
            <p className="truncate text-[11px] text-muted-foreground">{armyTitle(them, lists)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          disabled={pool.length !== 2}
          onClick={() => setPool((prev) => (prev.length === 2 ? [prev[1], prev[0]] : prev))}
        >
          Swap sides
        </Button>
        <Button className="w-full" disabled={pool.length < 2 || !myRoster || !oppRoster} onClick={() => setStep("briefing")}>
          Battle setup
        </Button>
      </div>
      {pool.length < 2 ? <p className="text-center text-sm text-muted-foreground">Add at least two armies to continue.</p> : null}
    </div>
  );
}

