import { useEffect, useMemo, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { DispositionLayouts } from "@/components/DispositionLayouts";
import { sourceKey, resolveArmy, type ArmySource } from "@/components/battle/army-source";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { getFaction } from "@/data/codex";
import { layoutsFor } from "@/data/maps";
import { FIXED_SECONDARIES } from "@/data/secondaries";
import { BATTLE_SIZES, type BattleSize, type PreBattle, type Roster, type SideKey, type SideScore } from "@/data/types";
import { defaultPreBattle, otherSide, preAbilityUnits } from "@/lib/prebattle";
import { useWarStore } from "@/lib/store";
import { cn, unitCopyMarks } from "@/lib/utils";
import { primaryForSide, rosterDisposition, rosterDp, rosterPoints } from "@/lib/validation";

type Mode = "" | "fixed" | "tactical";

function stamp(ts?: number) {
  if (!ts) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

function rosterOption(roster: Roster) {
  const faction = getFaction(roster.factionId)?.name ?? "Unknown";
  return [roster.name, stamp(roster.updatedAt), faction, `${rosterDp(roster)} DP`].filter(Boolean).join(" • ");
}

function activeLine(roster: Roster, limit: number) {
  const faction = getFaction(roster.factionId)?.name ?? "Unknown";
  const pts = rosterPoints(roster);
  return `Active Roster: ${[roster.name, stamp(roster.updatedAt), faction].filter(Boolean).join(" • ")} • ${pts} / ${limit.toLocaleString("en-US")} pts`;
}

function toScore(mode: Mode, fixedIds: string[], painted: boolean): SideScore {
  const meta: SideScore["secondaryMeta"] = {};
  if (mode === "fixed") {
    for (const id of fixedIds) meta[id] = { selectedRound: 1 };
  }
  return {
    primaryByRound: [0, 0, 0, 0, 0],
    primaryChecks: [],
    secondaryMode: mode || null,
    fixedIds: mode === "fixed" ? fixedIds : [],
    tacticalActive: [],
    secondaryChecks: {},
    secondaryMeta: meta,
    tactical: 0,
    painted: painted ? 10 : 0,
  };
}

function modesReady(mode: Mode, ids: string[]) {
  return mode === "tactical" || (mode === "fixed" && ids.length === 2);
}

function SetupSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
        props.className,
      )}
    />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function GameSetup({
  initialMine,
  initialTheirs,
  names,
  onBack,
}: {
  initialMine: ArmySource | null;
  initialTheirs: ArmySource | null;
  names?: { me: string; opponent: string };
  onBack?: () => void;
}) {
  const lists = useWarStore((s) => s.lists);
  const hydrated = useWarStore((s) => s.hydrated);
  const [loadGaveUp, setLoadGaveUp] = useState(false);
  const startGame = useWarStore((s) => s.startGame);
  const navigate = useNavigate();
  const codexCache = useRef(new Map<string, Roster>());

  const options = useMemo(() => {
    const sources: ArmySource[] = lists.map((l) => ({ kind: "list", listId: l.id }));
    for (const source of [initialMine, initialTheirs]) {
      if (source?.kind === "codex" && !sources.some((s) => sourceKey(s) === sourceKey(source))) sources.push(source);
    }
    return sources;
  }, [lists, initialMine, initialTheirs]);

  const resolve = (source: ArmySource | null): Roster | null => {
    if (!source) return null;
    if (source.kind === "list") return lists.find((l) => l.id === source.listId) ?? null;
    const key = sourceKey(source);
    const hit = codexCache.current.get(key);
    if (hit) return hit;
    const built = resolveArmy(source, lists);
    if (built) codexCache.current.set(key, built);
    return built;
  };

  const [mineKey, setMineKey] = useState(() => (initialMine ? sourceKey(initialMine) : ""));
  const [theirsKey, setTheirsKey] = useState(() => (initialTheirs ? sourceKey(initialTheirs) : ""));
  const [sizeTouched, setSizeTouched] = useState(false);
  const [battleSize, setBattleSize] = useState<BattleSize>("strike");
  const [readyMe, setReadyMe] = useState(false);
  const [readyThem, setReadyThem] = useState(false);
  const [attacker, setAttacker] = useState<SideKey | null>(null);
  const [firstTurn, setFirstTurn] = useState<SideKey | null>(null);
  const [meMode, setMeMode] = useState<Mode>("tactical");
  const [themMode, setThemMode] = useState<Mode>("tactical");
  const [meFixed, setMeFixed] = useState<string[]>([]);
  const [themFixed, setThemFixed] = useState<string[]>([]);
  const [brief, setBrief] = useState<PreBattle>(defaultPreBattle);

  const mineSource = options.find((s) => sourceKey(s) === mineKey) ?? null;
  const theirsSource = options.find((s) => sourceKey(s) === theirsKey) ?? null;

  useEffect(() => {
    if (hydrated) return;
    const t = window.setTimeout(() => setLoadGaveUp(true), 1500);
    return () => window.clearTimeout(t);
  }, [hydrated]);
  const listsReady = hydrated || loadGaveUp;

  useEffect(() => {
    if (!hydrated) return;
    const keys = new Set(options.map(sourceKey));
    if (mineKey && !keys.has(mineKey)) setMineKey("");
    if (theirsKey && !keys.has(theirsKey)) setTheirsKey("");
  }, [hydrated, options, mineKey, theirsKey]);
  const myRoster = resolve(mineSource);
  const oppRoster = resolve(theirsSource);
  const size: BattleSize = sizeTouched ? battleSize : (myRoster?.battleSize ?? "strike");
  const limit = BATTLE_SIZES[size].points;
  const myPrimary = myRoster && oppRoster ? primaryForSide(myRoster, oppRoster) : null;
  const theirPrimary = myRoster && oppRoster ? primaryForSide(oppRoster, myRoster) : null;
  const myLabel = (names?.me || myRoster?.name || "My roster").trim() || "My roster";
  const oppLabel = (names?.opponent || oppRoster?.name || "Opponent").trim() || "Opponent";
  const defenderName = attacker === "me" ? oppLabel : attacker === "opponent" ? myLabel : null;
  const maps = layoutsFor(myRoster ? rosterDisposition(myRoster) : null, oppRoster ? rosterDisposition(oppRoster) : null);
  const mapKey = maps.map((layout) => layout.id).join("|");
  useEffect(() => {
    setBrief((prev) => (prev.mapId && !mapKey.split("|").includes(prev.mapId) ? { ...prev, mapId: null } : prev));
  }, [mapKey]);
  const myAbilities = useMemo(() => (myRoster ? preAbilityUnits(myRoster) : []), [myRoster]);
  const theirAbilities = useMemo(() => (oppRoster ? preAbilityUnits(oppRoster) : []), [oppRoster]);
  const myCopies = useMemo(() => unitCopyMarks(myRoster?.units ?? []), [myRoster]);
  const theirCopies = useMemo(() => unitCopyMarks(oppRoster?.units ?? []), [oppRoster]);

  const pickSide = (key: string, which: "mine" | "theirs") => {
    if (which === "mine") {
      setMineKey(key);
      if (key && key === theirsKey) setTheirsKey("");
    } else {
      setTheirsKey(key);
      if (key && key === mineKey) setMineKey("");
    }
    setAttacker(null);
    setFirstTurn(null);
  };

  const toggleFixed = (which: "me" | "them", id: string) => {
    const set = which === "me" ? setMeFixed : setThemFixed;
    set((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
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

  const resetChoices = () => {
    setReadyMe(false);
    setReadyThem(false);
    setAttacker(null);
    setFirstTurn(null);
    setMeMode("tactical");
    setThemMode("tactical");
    setMeFixed([]);
    setThemFixed([]);
    setSizeTouched(false);
    setBrief(defaultPreBattle());
  };

  const start = () => {
    if (!myRoster || !oppRoster || !mineSource || !theirsSource || mineKey === theirsKey) {
      toast("Select a different saved roster for each side.");
      return;
    }
    if (!attacker || !firstTurn) {
      toast("Choose the attacker and who goes first. Neither is filled in for you.");
      return;
    }
    if (!modesReady(meMode, meFixed) || !modesReady(themMode, themFixed)) {
      toast("Choose Fixed (two cards) or Tactical for each army.");
      return;
    }
    const sized = (roster: Roster): Roster => ({ ...roster, battleSize: size, pointsLimit: limit });
    const briefing: PreBattle = {
      ...brief,
      attacker,
      deploysFirst: otherSide(attacker),
      firstTurn,
    };
    const id = startGame({
      myName: names?.me?.trim() || myRoster.name || "Grumpa",
      opponentName: names?.opponent?.trim() || oppRoster.name || "Jared",
      mine: sized(myRoster),
      theirs: sized(oppRoster),
      briefing,
      scores: {
        me: toScore(meMode, meFixed, readyMe),
        opponent: toScore(themMode, themFixed, readyThem),
      },
    });
    if (id) void navigate({ to: "/battle", search: {} });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-8 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-start lg:gap-4">
      <div className="contents lg:col-start-2 lg:row-start-1 lg:flex lg:max-h-[calc(100dvh-8rem)] lg:flex-col lg:gap-4 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      <div className="order-1 lg:order-none">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-xs text-muted-foreground">
            Back to armies
          </button>
        ) : null}
        <h1 className="font-display text-3xl font-semibold">Battle Setup</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a saved roster for each side, configure the battle conditions and secondary missions, then start the battle.
        </p>
      </div>

      {!listsReady ? (
        <p className="order-2 rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground lg:order-none">Loading saved lists…</p>
      ) : (
      <>
      <div className="order-2 grid gap-3 sm:grid-cols-2 lg:order-none">
        <RosterCard
          title="My Roster"
          value={mineKey}
          exclude={theirsKey}
          options={options}
          resolve={resolve}
          active={myRoster ? activeLine(myRoster, limit) : null}
          over={myRoster ? rosterPoints(myRoster) > limit : false}
          onChange={(key) => pickSide(key, "mine")}
        />
        <RosterCard
          title="Opponent Roster"
          value={theirsKey}
          exclude={mineKey}
          options={options}
          resolve={resolve}
          active={oppRoster ? activeLine(oppRoster, limit) : null}
          over={oppRoster ? rosterPoints(oppRoster) > limit : false}
          onChange={(key) => pickSide(key, "theirs")}
        />
      </div>

      <section className="order-3 space-y-3 rounded-xl border border-steel/40 bg-card p-4 lg:order-none">
        <div>
          <h2 className="text-sm font-medium">Primary Mission</h2>
          <p className="mt-1 text-xs text-muted-foreground">Primary scoring is tracked during Battle Mode.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MissionCard
            roster={myRoster}
            mission={myPrimary?.info.name ?? null}
            pairing={myRoster && oppRoster ? `${rosterDisposition(myRoster) ?? "—"} vs ${rosterDisposition(oppRoster) ?? "—"}` : null}
          />
          <MissionCard
            roster={oppRoster}
            mission={theirPrimary?.info.name ?? null}
            pairing={myRoster && oppRoster ? `${rosterDisposition(oppRoster) ?? "—"} vs ${rosterDisposition(myRoster) ?? "—"}` : null}
          />
        </div>
      </section>

      <section className="order-5 space-y-3 rounded-xl border border-border bg-card p-4 lg:order-none">
        <h2 className="text-sm font-medium">Battle Options</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="My Army Battle Ready">
            <SetupSelect value={readyMe ? "yes" : "no"} onChange={(e) => setReadyMe(e.target.value === "yes")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </SetupSelect>
          </Field>
          <Field label="Opponent Army Battle Ready">
            <SetupSelect value={readyThem ? "yes" : "no"} onChange={(e) => setReadyThem(e.target.value === "yes")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </SetupSelect>
          </Field>
        </div>
        <Field label="Battle Size">
          <SetupSelect
            value={size}
            onChange={(e) => {
              setSizeTouched(true);
              setBattleSize(e.target.value as BattleSize);
            }}
          >
            {(Object.keys(BATTLE_SIZES) as BattleSize[]).map((id) => (
              <option key={id} value={id}>
                {BATTLE_SIZES[id].label} — {BATTLE_SIZES[id].points.toLocaleString("en-US")} pts
              </option>
            ))}
          </SetupSelect>
        </Field>
        <p className="text-xs text-muted-foreground">Battle Ready is +10 VP if that army is fully painted. It starts at No.</p>
      </section>

      <section className="order-6 space-y-3 rounded-xl border border-border bg-card p-4 lg:order-none">
        <h2 className="text-sm font-medium">Battle Roles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Field label="Attacker">
              <SetupSelect value={attacker ?? ""} onChange={(e) => setAttacker((e.target.value || null) as SideKey | null)}>
                <option value="">Select</option>
                <option value="me" disabled={!myRoster}>
                  {myLabel}
                </option>
                <option value="opponent" disabled={!oppRoster}>
                  {oppLabel}
                </option>
              </SetupSelect>
            </Field>
            <Field label="Who Goes First?">
              <SetupSelect value={firstTurn ?? ""} onChange={(e) => setFirstTurn((e.target.value || null) as SideKey | null)}>
                <option value="">Select</option>
                <option value="me" disabled={!myRoster}>
                  {myLabel}
                </option>
                <option value="opponent" disabled={!oppRoster}>
                  {oppLabel}
                </option>
              </SetupSelect>
            </Field>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Defender</p>
            <p className="mt-2 text-base font-semibold">{defenderName ?? "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The other army. Defender deploys first, then the Attacker. First turn is chosen after both are set down.
            </p>
          </div>
        </div>
      </section>

      <section className="order-7 space-y-3 rounded-xl border border-border bg-card p-4 lg:order-none">
        <div>
          <h2 className="text-sm font-medium">Secondary Missions — 11th Edition</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose Fixed or Tactical for each army. Fixed uses two selected cards, Tactical begins with two drawn cards and replenishes during Command phases.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SecondaryCard
            name={myLabel}
            mode={meMode}
            fixedIds={meFixed}
            onMode={(mode) => {
              setMeMode(mode);
              if (mode !== "fixed") setMeFixed([]);
            }}
            onToggle={(id) => toggleFixed("me", id)}
          />
          <SecondaryCard
            name={oppLabel}
            mode={themMode}
            fixedIds={themFixed}
            onMode={(mode) => {
              setThemMode(mode);
              if (mode !== "fixed") setThemFixed([]);
            }}
            onToggle={(id) => toggleFixed("them", id)}
          />
        </div>
      </section>

      <details className="order-8 rounded-xl border border-border bg-card p-4 lg:order-none">
        <summary className="cursor-pointer text-sm font-medium">Scout, Infiltrate, and notes</summary>
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted-foreground">Tick any Scout or Infiltrate you will actually use. A unit cannot use both.</p>
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
          <AbilityBlock label={myRoster?.name ?? "My army"} units={myAbilities} copies={myCopies} brief={brief} onToggle={toggleAbility} />
          <AbilityBlock label={oppRoster?.name ?? "Opponent"} units={theirAbilities} copies={theirCopies} brief={brief} onToggle={toggleAbility} />
        </div>
      </details>

      <div className="order-9 flex flex-wrap items-center gap-2 lg:order-none">
        <Button type="button" onClick={start}>
          Start / Reset Battle
        </Button>
        <Button type="button" variant="outline" onClick={resetChoices}>
          Reset choices
        </Button>
      </div>
      </>
      )}
      </div>
      {listsReady ? (
        <section className="order-4 space-y-3 rounded-xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:order-none lg:col-start-1 lg:row-start-1">
          <h2 className="text-sm font-medium">Create the Battlefield</h2>
          <DispositionLayouts
            layouts={maps}
            mapId={brief.mapId}
            pairing={myRoster && oppRoster ? `${rosterDisposition(myRoster) ?? "—"} vs ${rosterDisposition(oppRoster) ?? "—"}` : null}
            onPick={(id) => setBrief((prev) => ({ ...prev, mapId: id }))}
          />
        </section>
      ) : null}
    </div>
  );
}

function RosterCard({
  title,
  value,
  exclude,
  options,
  resolve,
  active,
  over,
  onChange,
}: {
  title: string;
  value: string;
  exclude: string;
  options: ArmySource[];
  resolve: (source: ArmySource | null) => Roster | null;
  active: string | null;
  over: boolean;
  onChange: (key: string) => void;
}) {
  return (
    <section className="space-y-2 rounded-xl border border-border bg-card p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      <Field label="Roster">
        <SetupSelect value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select a roster</option>
          {options
            .filter((source) => sourceKey(source) !== exclude)
            .map((source) => {
              const roster = resolve(source);
              const key = sourceKey(source);
              return (
                <option key={key} value={key}>
                  {roster ? rosterOption(roster) : source.kind === "list" ? "Missing list" : "Codex army"}
                </option>
              );
            })}
        </SetupSelect>
      </Field>
      <p className={cn("rounded-md border border-border bg-muted px-3 py-2 text-xs", over ? "text-blood" : "text-muted-foreground")}>
        {active ?? "Active Roster: none selected"}
        {over ? " — over the selected battle size" : ""}
      </p>
      {options.filter((source) => sourceKey(source) !== exclude).length === 0 ? (
        <p className="text-xs text-muted-foreground">Save another list to choose a second roster.</p>
      ) : null}
    </section>
  );
}

function MissionCard({ roster, mission, pairing }: { roster: Roster | null; mission: string | null; pairing: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{roster ? `${roster.name}${stamp(roster.updatedAt) ? ` • ${stamp(roster.updatedAt)}` : ""}` : "No roster"}</p>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">Primary Mission</span>
      </div>
      <div className="mt-2 rounded-lg border border-border bg-background px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Primary Mission</p>
        <p className="font-medium">{mission ?? "Not set"}</p>
        <p className="text-xs text-muted-foreground">{mission ? pairing : "Pick a force disposition on both rosters."}</p>
      </div>
    </div>
  );
}

function SecondaryCard({
  name,
  mode,
  fixedIds,
  onMode,
  onToggle,
}: {
  name: string;
  mode: Mode;
  fixedIds: string[];
  onMode: (mode: Mode) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/40 p-3">
      <p className="truncate text-sm font-medium">{name}</p>
      <Field label="Mission Type">
        <SetupSelect value={mode} onChange={(e) => onMode(e.target.value as Mode)}>
          <option value="">Select</option>
          <option value="fixed">Fixed</option>
          <option value="tactical">Tactical</option>
        </SetupSelect>
      </Field>
      {mode === "fixed" ? (
        <div className="grid grid-cols-2 gap-1.5">
          {FIXED_SECONDARIES.map((c) => {
            const on = fixedIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!on && fixedIds.length >= 2}
                onClick={() => onToggle(c.id)}
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
      ) : mode === "tactical" ? (
        <p className="text-xs text-muted-foreground">Draw two at the start of your Command phase. Score or discard during the game.</p>
      ) : (
        <p className="text-xs text-muted-foreground">Fixed locks two cards for the battle. Tactical draws each Command phase.</p>
      )}
    </div>
  );
}

function AbilityBlock({
  label,
  units,
  copies,
  brief,
  onToggle,
}: {
  label: string;
  units: ReturnType<typeof preAbilityUnits>;
  copies: Record<string, string>;
  brief: PreBattle;
  onToggle: (kind: "scout" | "infiltrate", id: string) => void;
}) {
  if (!units.length) return <p className="text-xs text-muted-foreground">{label}: no Scout or Infiltrate units.</p>;
  return (
    <div className="space-y-2">
      <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <ul className="space-y-1.5">
        {units.map((u) => (
          <li key={u.ru.id} className="flex flex-wrap items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-sm">
              {u.def.name}
              {copies[u.ru.id] ? <span className="ml-1 text-[10px] tracking-widest text-steel">[{copies[u.ru.id]}]</span> : null}
            </span>
            {u.scout ? (
              <button
                type="button"
                onClick={() => onToggle("scout", u.ru.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px]",
                  brief.scoutIds.includes(u.ru.id) ? "border-primary bg-accent" : "border-border text-muted-foreground",
                )}
              >
                Scout
              </button>
            ) : null}
            {u.infiltrate ? (
              <button
                type="button"
                onClick={() => onToggle("infiltrate", u.ru.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px]",
                  brief.infiltrateIds.includes(u.ru.id) ? "border-primary bg-accent" : "border-border text-muted-foreground",
                )}
              >
                Infiltrate
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
