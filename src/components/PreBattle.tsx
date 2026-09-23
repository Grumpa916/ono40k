import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { BattleMap } from "@/components/BattleMap";
import { MapSetup } from "@/components/MapSetup";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { RuleFold } from "@/components/RuleFold";
import { getFaction } from "@/data/codex";
import { getMap, layoutsFor } from "@/data/maps";
import { FIXED_SECONDARIES } from "@/data/secondaries";
import { BATTLE_SIZES, type PreBattle, type Roster, type SideKey, type SideScore } from "@/data/types";
import { primaryForSide, rosterDisposition } from "@/lib/validation";
import { defaultPreBattle, preAbilityUnits } from "@/lib/prebattle";
import { cn, unitCopyMarks } from "@/lib/utils";

type ScoreDraft = {
  mode: "fixed" | "tactical" | null;
  fixedIds: string[];
  painted: boolean;
};

function emptyDraft(): ScoreDraft {
  return { mode: null, fixedIds: [], painted: true };
}

function toScore(draft: ScoreDraft): SideScore {
  const meta: SideScore["secondaryMeta"] = {};
  if (draft.mode === "fixed") {
    for (const id of draft.fixedIds) meta[id] = { selectedRound: 1 };
  }
  return {
    primaryByRound: [0, 0, 0, 0, 0],
    primaryChecks: [],
    secondaryMode: draft.mode,
    fixedIds: draft.mode === "fixed" ? draft.fixedIds : [],
    tacticalActive: [],
    secondaryChecks: {},
    secondaryMeta: meta,
    tactical: 0,
    painted: draft.painted ? 10 : 0,
  };
}

export function PreBattleForm({
  myName,
  oppName,
  mine,
  theirs,
  onBack,
  onStart,
}: {
  myName: string;
  oppName: string;
  mine: Roster;
  theirs: Roster;
  onBack: () => void;
  onStart: (briefing: PreBattle, scores: { me: SideScore; opponent: SideScore }) => void;
}) {
  const [brief, setBrief] = useState<PreBattle>(defaultPreBattle);
  const [mapOpen, setMapOpen] = useState(false);
  const [meScore, setMeScore] = useState<ScoreDraft>(emptyDraft);
  const [themScore, setThemScore] = useState<ScoreDraft>(emptyDraft);

  const myPrimary = primaryForSide(mine, theirs);
  const theirPrimary = primaryForSide(theirs, mine);
  const sizeMismatch = mine.battleSize !== theirs.battleSize;
  const myAbilities = useMemo(() => preAbilityUnits(mine), [mine]);
  const theirAbilities = useMemo(() => preAbilityUnits(theirs), [theirs]);
  const myCopies = useMemo(() => unitCopyMarks(mine.units), [mine.units]);
  const theirCopies = useMemo(() => unitCopyMarks(theirs.units), [theirs.units]);

  const maps = layoutsFor(rosterDisposition(mine), rosterDisposition(theirs));
  const selectedMap = getMap(brief.mapId);
  const secondariesReady = (d: ScoreDraft) =>
    d.mode === "tactical" || (d.mode === "fixed" && d.fixedIds.length === 2);
  const ready = secondariesReady(meScore) && secondariesReady(themScore) && Boolean(brief.mapId || maps.length === 0);

  const toggleFixed = (which: "me" | "them", id: string) => {
    const set = which === "me" ? setMeScore : setThemScore;
    set((prev) => {
      const on = prev.fixedIds.includes(id);
      const next = on ? prev.fixedIds.filter((x) => x !== id) : prev.fixedIds.length >= 2 ? prev.fixedIds : [...prev.fixedIds, id];
      return { ...prev, mode: "fixed", fixedIds: next };
    });
  };

  const toggleAbility = (kind: "scout" | "infiltrate", unitId: string) => {
    setBrief((prev) => {
      const key = kind === "scout" ? "scoutIds" : "infiltrateIds";
      const other = kind === "scout" ? "infiltrateIds" : "scoutIds";
      const on = prev[key].includes(unitId);
      return {
        ...prev,
        [key]: on ? prev[key].filter((id) => id !== unitId) : [...prev[key], unitId],
        [other]: prev[other].filter((id) => id !== unitId),
      };
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">War Journal · Pre-battle</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">11th edition muster</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mission, secondaries, and Scout / Infiltrate. Attacker and first turn are set on Setup.
        </p>
      </div>

      <section className="space-y-2">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">1 · Mission</p>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm">
            {getFaction(mine.factionId)?.name} · {BATTLE_SIZES[mine.battleSize].label} · {rosterDisposition(mine) ?? "no disposition"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            vs {getFaction(theirs.factionId)?.name} · {BATTLE_SIZES[theirs.battleSize].label} · {rosterDisposition(theirs) ?? "no disposition"}
          </p>
          {sizeMismatch ? (
            <p className="mt-2 text-sm text-blood">Battle sizes differ. Play to the lower limit, or swap a list.</p>
          ) : null}
        </div>
        {myPrimary ? (
          <RuleFold kicker={`${myName} · primary`} title={myPrimary.info.name} text={myPrimary.info.blurb}>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {myPrimary.info.scoring.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </RuleFold>
        ) : (
          <p className="text-sm text-muted-foreground">Set a force disposition on both lists to generate a primary.</p>
        )}
        {theirPrimary ? (
          <RuleFold kicker={`${oppName} · primary`} title={theirPrimary.info.name} text={theirPrimary.info.blurb}>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {theirPrimary.info.scoring.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </RuleFold>
        ) : null}
        <p className="text-xs text-muted-foreground">
          11th edition scores terrain areas, not 40mm markers. Place home, expansions, and centre as terrain features.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">2 · Secondaries</p>
        <p className="text-sm text-muted-foreground">Pick Fixed (two cards) or Tactical for both players.</p>
        <SecondaryDraft name={myName} draft={meScore} onChange={setMeScore} onToggleFixed={(id) => toggleFixed("me", id)} />
        <SecondaryDraft name={oppName} draft={themScore} onChange={setThemScore} onToggleFixed={(id) => toggleFixed("them", id)} />
        {!secondariesReady(meScore) || !secondariesReady(themScore) ? (
          <p className="text-sm text-blood">
            {!secondariesReady(meScore) && !secondariesReady(themScore)
              ? "Both players still need a secondary mode."
              : !secondariesReady(meScore)
                ? `${myName}: pick Fixed (two cards) or Tactical.`
                : `${oppName}: pick Fixed (two cards) or Tactical.`}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">3 · Battlefield</p>
        {maps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Set force dispositions on both lists to load the three Event Companion maps for this pairing.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {rosterDisposition(mine)} vs {rosterDisposition(theirs)} · 44×60 · pick Layout A, B, or C. Roll D3 if the organiser has not locked one.
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {maps.map((layout) => {
                const on = brief.mapId === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setBrief((p) => ({ ...p, mapId: layout.id }))}
                    className={cn(
                      "min-w-0 rounded-lg border p-1.5 text-left",
                      on ? "border-primary bg-accent" : "border-border bg-card",
                    )}
                  >
                    <BattleMap layout={layout} compact />
                    <p className="mt-1 truncate text-[11px] font-medium leading-tight">{layout.letter}</p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">{layout.name.replace(/^Layout [ABC] · /, "")}</p>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const pick = maps[Math.floor(Math.random() * maps.length)];
                  if (pick) setBrief((p) => ({ ...p, mapId: pick.id }));
                }}
              >
                Roll D3
              </Button>
              <Button type="button" variant="outline" disabled={!selectedMap} onClick={() => setMapOpen(true)}>
                Full map
              </Button>
            </div>
            {selectedMap ? (
              <p className="text-[11px] text-muted-foreground">
                {selectedMap.name}. Open the full map to measure terrain before you start.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Select a map to continue.</p>
            )}
            {mapOpen && selectedMap ? (
              <MapSetup
                layout={selectedMap}
                layouts={maps}
                onPick={(id) => setBrief((p) => ({ ...p, mapId: id }))}
                onClose={() => setMapOpen(false)}
              />
            ) : null}
          </>
        )}
        <Input
          value={brief.terrainNote}
          onChange={(e) => setBrief((p) => ({ ...p, terrainNote: e.target.value }))}
          placeholder="House terrain notes (optional)"
        />
        <Textarea
          value={brief.formationNote}
          onChange={(e) => setBrief((p) => ({ ...p, formationNote: e.target.value }))}
          placeholder="Reserves, embarked units, assigned transports…"
        />
      </section>

      <section className="space-y-2">
        <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">4 · Scout and Infiltrate</p>
        <p className="text-xs text-muted-foreground">A unit cannot use both in the same battle. Tick what you actually used.</p>
        <AbilityList
          label={myName}
          units={myAbilities}
          copies={myCopies}
          scoutIds={brief.scoutIds}
          infiltrateIds={brief.infiltrateIds}
          onToggle={toggleAbility}
        />
        <AbilityList
          label={oppName}
          units={theirAbilities}
          copies={theirCopies}
          scoutIds={brief.scoutIds}
          infiltrateIds={brief.infiltrateIds}
          onToggle={toggleAbility}
        />
      </section>

      <div className="grid grid-cols-2 gap-2 pb-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="size-4" />
          Armies
        </Button>
        <Button
          disabled={!ready}
          onClick={() =>
            onStart(brief, {
              me: toScore(meScore),
              opponent: toScore(themScore),
            })
          }
        >
          Open the ledger
        </Button>
      </div>
    </div>
  );
}

export function SidePair({
  a,
  b,
  value,
  onChange,
  disabled,
}: {
  a: string;
  b: string;
  value: SideKey | null;
  onChange: (side: SideKey) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {(["me", "opponent"] as const).map((side) => (
        <button
          key={side}
          type="button"
          disabled={disabled}
          onClick={() => onChange(side)}
          className={cn(
            "min-h-11 rounded-md border px-2 text-sm font-medium",
            value === side ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
            disabled && "opacity-60",
          )}
        >
          {side === "me" ? a : b}
        </button>
      ))}
    </div>
  );
}

function SecondaryDraft({
  name,
  draft,
  onChange,
  onToggleFixed,
}: {
  name: string;
  draft: ScoreDraft;
  onChange: (next: ScoreDraft) => void;
  onToggleFixed: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium">{name}</p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange({ ...draft, mode: "fixed" })}
          className={cn(
            "min-h-11 rounded-md border text-sm font-medium",
            draft.mode === "fixed" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
          )}
        >
          Fixed
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...draft, mode: "tactical", fixedIds: [] })}
          className={cn(
            "min-h-11 rounded-md border text-sm font-medium",
            draft.mode === "tactical" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
          )}
        >
          Tactical
        </button>
      </div>
      {draft.mode === "fixed" ? (
        <div className="grid grid-cols-2 gap-1.5">
          {FIXED_SECONDARIES.map((c) => {
            const on = draft.fixedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!on && draft.fixedIds.length >= 2}
                onClick={() => onToggleFixed(c.id)}
                className={cn(
                  "min-h-11 rounded-md border px-2 py-1.5 text-left text-xs font-medium",
                  on ? "border-primary bg-accent" : "border-border bg-muted text-muted-foreground",
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      ) : draft.mode === "tactical" ? (
        <p className="text-xs text-muted-foreground">Draw two at the start of your turn. Score or discard during the game.</p>
      ) : (
        <p className="text-xs text-muted-foreground">Fixed: pick two for the whole game. Tactical: draw each turn.</p>
      )}
      <button
        type="button"
        onClick={() => onChange({ ...draft, painted: !draft.painted })}
        className={cn("text-[11px] tracking-wide uppercase", draft.painted ? "text-ok" : "text-muted-foreground")}
      >
        {draft.painted ? "Painted +10" : "Unpainted"}
      </button>
    </div>
  );
}

function AbilityList({
  label,
  units,
  copies,
  scoutIds,
  infiltrateIds,
  onToggle,
}: {
  label: string;
  units: ReturnType<typeof preAbilityUnits>;
  copies: Record<string, string>;
  scoutIds: string[];
  infiltrateIds: string[];
  onToggle: (kind: "scout" | "infiltrate", id: string) => void;
}) {
  if (!units.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {label}: no Scout or Infiltrate units on this list.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-2">
      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <ul className="space-y-2">
        {units.map((u) => (
          <li key={u.ru.id} className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-sm">
              {u.def.name}
              {copies[u.ru.id] ? <span className="ml-1 text-[10px] tracking-widest text-steel">[{copies[u.ru.id]}]</span> : null}
            </span>
            {u.infiltrate ? (
              <button
                type="button"
                onClick={() => onToggle("infiltrate", u.ru.id)}
                className={cn(
                  "h-8 rounded-md border px-2 text-[11px] uppercase",
                  infiltrateIds.includes(u.ru.id) ? "border-primary bg-accent" : "border-border text-muted-foreground",
                )}
              >
                Infiltrate
              </button>
            ) : null}
            {u.scout ? (
              <button
                type="button"
                onClick={() => onToggle("scout", u.ru.id)}
                className={cn(
                  "h-8 rounded-md border px-2 text-[11px] uppercase",
                  scoutIds.includes(u.ru.id) ? "border-primary bg-accent" : "border-border text-muted-foreground",
                )}
              >
                Scout
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function preBattleLine(game: { myName: string; opponentName: string; preBattle?: PreBattle; scores: { me: SideScore; opponent: SideScore } }) {
  const b = game.preBattle;
  if (!b) return null;
  const who = (s: SideKey | null) => (s === "me" ? game.myName : s === "opponent" ? game.opponentName : null);
  const mode = (s: SideScore) => (s.secondaryMode === "fixed" ? "Fixed" : s.secondaryMode === "tactical" ? "Tactical" : "—");
  const map = getMap(b.mapId);
  const bits = [
    b.attacker ? `Attacker ${who(b.attacker)}` : null,
    b.firstTurn ? `first ${who(b.firstTurn)}` : null,
    `${mode(game.scores.me)} / ${mode(game.scores.opponent)}`,
    map?.name ?? null,
  ].filter(Boolean);
  return bits.join(" · ");
}
