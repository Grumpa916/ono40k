import { createFileRoute } from "@tanstack/react-router";
import { Calculator, Loader2, Minus, Plus, Search, Swords, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { allUnits, getUnit } from "@/data/codex";
import type { UnitDef, Weapon } from "@/data/types";
import {
  expectedVolley,
  formatNum,
  formatPct,
  simulateVolley,
  type MathContext,
  type SimResult,
  type VolleyResult,
} from "@/lib/mathhammer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lab")({ component: LabPage });

type CatalogUnit = ReturnType<typeof allUnits>[number];
type Picked = { factionId: string; id: string };

const CATALOG = allUnits();
const FNP_OPTS = [4, 5, 6] as const;
const INV_OPTS = [4, 5, 6] as const;

function weaponKey(w: Weapon) {
  return `${w.kind}:${w.name}`;
}

function sheetOf(picked: Picked | null): CatalogUnit | undefined {
  if (!picked) return undefined;
  const cat = CATALOG.find((u) => u.id === picked.id && u.factionId === picked.factionId);
  const sheet = getUnit(picked.factionId, picked.id);
  if (!sheet || !cat) return undefined;
  return { ...sheet, factionId: cat.factionId, factionName: cat.factionName, accent: cat.accent };
}

function defaultWeapons(sheet: UnitDef): string[] {
  const list = sheet.ranged.length ? sheet.ranged : sheet.melee;
  return list.slice(0, 1).map(weaponKey);
}

function LabPage() {
  const [atkPick, setAtkPick] = useState<Picked | null>({ factionId: "sm", id: "sm-intercessors" });
  const [defPick, setDefPick] = useState<Picked | null>({ factionId: "nids", id: "nids-termagants" });
  const atkSheet = sheetOf(atkPick);
  const defSheet = sheetOf(defPick);

  const [selectedWeapons, setSelectedWeapons] = useState<string[]>(() => {
    const sheet = getUnit("sm", "sm-intercessors");
    return sheet ? defaultWeapons(sheet) : [];
  });
  const [atkModels, setAtkModels] = useState(5);
  const [defModels, setDefModels] = useState(10);
  const [plusHit, setPlusHit] = useState(false);
  const [minusHit, setMinusHit] = useState(false);
  const [plusWound, setPlusWound] = useState(false);
  const [minusWound, setMinusWound] = useState(false);
  const [cover, setCover] = useState(false);
  const [plunging, setPlunging] = useState(false);
  const [halfRange, setHalfRange] = useState(true);
  const [rerollOnes, setRerollOnes] = useState(false);
  const [rerollAllHits, setRerollAllHits] = useState(false);
  const [rerollWoundOnes, setRerollWoundOnes] = useState(false);
  const [stationary, setStationary] = useState(false);
  const [fnp, setFnp] = useState<number | null>(() => getUnit("nids", "nids-termagants")?.fnp ?? null);
  const [invuln, setInvuln] = useState<number | null>(() => getUnit("nids", "nids-termagants")?.invuln ?? null);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ expected: VolleyResult; sim: SimResult } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const pickAttacker = (u: CatalogUnit) => {
    setAtkPick({ factionId: u.factionId, id: u.id });
    const sheet = getUnit(u.factionId, u.id);
    setSelectedWeapons(sheet ? defaultWeapons(sheet) : []);
    setAtkModels(sheet?.sizes?.[0]?.models ?? 1);
    setOutcome(null);
  };

  const pickDefender = (u: CatalogUnit) => {
    setDefPick({ factionId: u.factionId, id: u.id });
    const sheet = getUnit(u.factionId, u.id);
    setDefModels(sheet?.sizes?.[0]?.models ?? 1);
    setFnp(sheet?.fnp ?? null);
    setInvuln(sheet?.invuln ?? null);
    setOutcome(null);
  };

  const clearAttacker = () => {
    setAtkPick(null);
    setSelectedWeapons([]);
    setOutcome(null);
  };

  const clearDefender = () => {
    setDefPick(null);
    setOutcome(null);
  };

  const toggleWeapon = (w: Weapon) => {
    const key = weaponKey(w);
    setSelectedWeapons((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      return [...cur.filter((k) => k.startsWith(`${w.kind}:`)), key];
    });
    setOutcome(null);
  };

  const fires = useMemo(() => {
    if (!atkSheet) return [];
    return [...atkSheet.ranged, ...atkSheet.melee]
      .filter((w) => selectedWeapons.includes(weaponKey(w)))
      .map((weapon) => ({ weapon, models: atkModels }));
  }, [atkSheet, selectedWeapons, atkModels]);

  const ctx: MathContext = {
    hitMod: (plusHit ? 1 : 0) + (minusHit ? -1 : 0),
    woundMod: (plusWound ? 1 : 0) + (minusWound ? -1 : 0),
    cover,
    plunging,
    extraAttacks: 0,
    halfRangeMelta: halfRange,
    targetModels: defModels,
    rerollHitOnes: rerollOnes && !rerollAllHits,
    rerollAllHits,
    rerollWoundOnes,
    stationary,
    invuln,
    fnp,
  };

  const ready = Boolean(atkSheet && defSheet && fires.length > 0);

  const hint = !atkSheet
    ? "Select an attacking unit"
    : !defSheet
      ? "Select a defending unit"
      : fires.length === 0
        ? "Select a melee weapon or at least one ranged weapon"
        : `${atkSheet.name} into ${defSheet.name}`;

  const calculate = () => {
    if (!defSheet || fires.length === 0) return;
    setBusy(true);
    setOutcome(null);
    window.setTimeout(() => {
      const expected = expectedVolley(fires, defSheet, ctx);
      const sim = simulateVolley(fires, defSheet, ctx, 4000);
      setOutcome({ expected, sim });
      setBusy(false);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    }, 30);
  };

  const resetBoth = () => {
    setAtkPick(null);
    setDefPick(null);
    setSelectedWeapons([]);
    setAtkModels(1);
    setDefModels(1);
    setPlusHit(false);
    setMinusHit(false);
    setPlusWound(false);
    setMinusWound(false);
    setCover(false);
    setPlunging(false);
    setHalfRange(true);
    setRerollOnes(false);
    setRerollAllHits(false);
    setRerollWoundOnes(false);
    setStationary(false);
    setFnp(null);
    setInvuln(null);
    setOutcome(null);
  };

  const loadExample = () => {
    const atk = CATALOG.find((u) => u.id === "sm-intercessors");
    const def = CATALOG.find((u) => u.id === "nids-termagants");
    if (atk) pickAttacker(atk);
    if (def) pickDefender(def);
    setHalfRange(true);
    setCover(false);
  };

  return (
    <div className="mx-auto flex min-w-0 max-w-5xl flex-col gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">Combat Calculator</h1>
          <Badge className="border-transparent bg-blood/15 text-blood">11th Edition · Beta</Badge>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Select an attacking unit and a defending unit to calculate combat outcomes. Search by name or browse the full
          unit list.
        </p>
        <div className="w-full max-w-xl rounded-lg border border-border bg-card/60 px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-display text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Game Edition
            </span>
            <div className="inline-flex items-center rounded-md border border-border bg-background p-1" role="group" aria-label="Game edition">
              <span className="rounded px-3 py-1.5 font-display text-xs font-semibold text-muted-foreground">10th</span>
              <span className="rounded bg-blood px-3 py-1.5 font-display text-xs font-semibold text-primary-foreground">
                11th
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Beta
            </Badge>
          </div>
        </div>
        {!atkPick && !defPick ? (
          <button type="button" onClick={loadExample} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Load example: Intercessors vs Termagants
          </button>
        ) : null}
      </div>

      <div className="grid min-w-0 items-start gap-6 pb-36 lg:grid-cols-2 lg:gap-8 lg:pb-0">
        <Card className="min-w-0 overflow-hidden p-5 md:p-6">
          <UnitPicker title="Attacker" role="attacker" selected={atkSheet} onSelect={pickAttacker} onClear={clearAttacker}>
            {atkSheet ? (
              <>
                <div className="mt-1 flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="blood">Attacking Models</SectionLabel>
                  <Stepper
                    value={atkModels}
                    min={1}
                    max={Math.max(20, ...(atkSheet.sizes?.map((s) => s.models) ?? [10]))}
                    onChange={(n) => {
                      setAtkModels(n);
                      setOutcome(null);
                    }}
                    testId="attacker-model-count"
                  />
                </div>
                <WeaponSection
                  title="Ranged Weapons"
                  empty="No ranged weapon profiles found for this unit."
                  weapons={atkSheet.ranged}
                  selected={selectedWeapons}
                  onToggle={toggleWeapon}
                />
                <WeaponSection
                  title="Melee Weapons"
                  empty="No melee weapon profiles found for this unit."
                  weapons={atkSheet.melee}
                  selected={selectedWeapons}
                  onToggle={toggleWeapon}
                />
                <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="blood">Roll Modifiers</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <ModChip label="+1 to Hit" on={plusHit} onClick={() => { setPlusHit(!plusHit); setOutcome(null); }} />
                    <ModChip label="+1 to Wound" on={plusWound} onClick={() => { setPlusWound(!plusWound); setOutcome(null); }} />
                    <ModChip label="Re-roll Hit 1s" on={rerollOnes} onClick={() => { setRerollOnes(!rerollOnes); if (!rerollOnes) setRerollAllHits(false); setOutcome(null); }} />
                    <ModChip label="Re-roll All Hit Failures" on={rerollAllHits} onClick={() => { setRerollAllHits(!rerollAllHits); if (!rerollAllHits) setRerollOnes(false); setOutcome(null); }} />
                    <ModChip label="Re-roll Wound 1s" on={rerollWoundOnes} onClick={() => { setRerollWoundOnes(!rerollWoundOnes); setOutcome(null); }} />
                    <ModChip label="Remained Stationary" on={stationary} onClick={() => { setStationary(!stationary); setOutcome(null); }} />
                    <ModChip label="Half range" on={halfRange} onClick={() => { setHalfRange(!halfRange); setOutcome(null); }} />
                    <ModChip label="Plunging Fire" on={plunging} onClick={() => { setPlunging(!plunging); setOutcome(null); }} />
                  </div>
                </div>
              </>
            ) : null}
          </UnitPicker>
        </Card>

        <div className="flex items-center justify-center lg:hidden">
          <div className="flex items-center gap-3">
            <div className="h-px w-12 bg-border" />
            <div className="flex size-10 items-center justify-center rounded-full border-2 border-blood/40 bg-card">
              <Swords className="size-4 text-blood" />
            </div>
            <div className="h-px w-12 bg-border" />
          </div>
        </div>

        <Card className="min-w-0 overflow-hidden p-5 md:p-6">
          <UnitPicker title="Defender" role="defender" selected={defSheet} onSelect={pickDefender} onClear={clearDefender}>
            {defSheet ? (
              <>
                <div className="mt-1 flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="steel">Defending Models</SectionLabel>
                  <Stepper
                    value={defModels}
                    min={1}
                    max={Math.max(20, ...(defSheet.sizes?.map((s) => s.models) ?? [10]))}
                    onChange={(n) => {
                      setDefModels(n);
                      setOutcome(null);
                    }}
                    testId="defender-model-count"
                  />
                </div>
                <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="steel">Feel No Pain</SectionLabel>
                  <Segmented
                    value={fnp}
                    options={FNP_OPTS}
                    onChange={(n) => {
                      setFnp(n);
                      setOutcome(null);
                    }}
                    suffix="+"
                  />
                </div>
                <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="steel">Invulnerable Save</SectionLabel>
                  <Segmented
                    value={invuln}
                    options={INV_OPTS}
                    onChange={(n) => {
                      setInvuln(n);
                      setOutcome(null);
                    }}
                    suffix="+"
                  />
                </div>
                <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
                  <SectionLabel accent="steel">Roll Modifiers</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    <ModChip label="Cover (−1 hit)" on={cover} onClick={() => { setCover(!cover); setOutcome(null); }} />
                    <ModChip label="−1 to Hit" on={minusHit} onClick={() => { setMinusHit(!minusHit); setOutcome(null); }} />
                    <ModChip label="−1 to Wound" on={minusWound} onClick={() => { setMinusWound(!minusWound); setOutcome(null); }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    11th edition: Cover is −1 to hit, not +1 save. Datasheet invulnerable and Feel No Pain start selected when present.
                  </p>
                </div>
              </>
            ) : null}
          </UnitPicker>
        </Card>
      </div>

      <div className="sticky bottom-16 z-20 -mx-4 flex flex-col items-center gap-3 bg-gradient-to-t from-background via-background to-transparent px-4 pt-4 pb-4 md:bottom-0 lg:static lg:mx-0 lg:bg-none lg:px-0">
        <Button className="w-full max-w-xl" size="lg" disabled={!ready || busy} onClick={calculate}>
          {busy ? (
            <>
              <Loader2 className="animate-spin" />
              Simulating…
            </>
          ) : (
            <>
              <Calculator />
              Calculate Combat
            </>
          )}
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button" onClick={resetBoth} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="size-3" />
            Reset both
          </button>
          {!busy ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </div>

      {outcome && atkSheet && defSheet ? (
        <div ref={resultsRef}>
          <Results attacker={atkSheet} defender={defSheet} expected={outcome.expected} sim={outcome.sim} defModels={defModels} />
        </div>
      ) : null}

      <section className="grid gap-8 border-t border-border pt-8 md:grid-cols-3">
        <div>
          <h2 className="font-display mb-2 text-sm font-semibold tracking-widest uppercase">What is MathHammer?</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Closed-form averages plus a 4,000-pass Monte Carlo of the 11th edition attack sequence — hit, wound, save,
            damage — using Ono40k datasheets.
          </p>
        </div>
        <div>
          <h2 className="font-display mb-2 text-sm font-semibold tracking-widest uppercase">How to Use</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Search an attacker and a defender, choose weapon profiles, set models and modifiers, then hit Calculate
            Combat for expected hits, wounds, failed saves and average damage.
          </p>
        </div>
        <div>
          <h2 className="font-display mb-2 text-sm font-semibold tracking-widest uppercase">Why it lives here</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Compare target priority while you build lists. Leftover damage does not spill. Cover is −1 to hit. Half
            range turns on Rapid Fire and Melta.
          </p>
        </div>
      </section>
    </div>
  );
}

function UnitPicker({
  title,
  role,
  selected,
  onSelect,
  onClear,
  children,
}: {
  title: string;
  role: "attacker" | "defender";
  selected?: CatalogUnit;
  onSelect: (u: CatalogUnit) => void;
  onClear: () => void;
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attacker = role === "attacker";

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = CATALOG.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.factionName.toLowerCase().includes(q) ||
        u.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
    return q ? list.slice(0, 40) : list.slice(0, 18);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const choose = (u: CatalogUnit) => {
    onSelect(u);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(shown.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const u = shown[active];
      if (u) choose(u);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const ring = attacker
    ? "border-blood/40 focus-within:border-blood"
    : "border-steel/40 focus-within:border-steel";

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 items-center rounded-md px-3 font-display text-xs font-bold tracking-widest uppercase",
            attacker ? "bg-blood text-primary-foreground" : "bg-steel text-primary-foreground",
          )}
        >
          {title}
        </div>
        {selected ? (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Clear selection"
          >
            <X className="size-3" />
            Clear
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className={cn("rounded-lg border-2 bg-card p-4", ring)}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg leading-tight font-bold text-balance">{selected.name}</h3>
              <span className="text-xs font-medium text-muted-foreground">{selected.factionName}</span>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Remove unit"
            >
              <X className="size-4" />
            </button>
          </div>
          <StatStrip unit={selected} />
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="mt-3 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Search a different unit
          </button>
        </div>
      ) : null}

      {(!selected || open) && (
        <div ref={boxRef} className="relative min-w-0">
          <div className={cn("relative flex items-center rounded-lg border-2 bg-card transition-colors", ring)}>
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search units..."
              aria-label={`Search ${title} units`}
              aria-expanded={open}
              role="combobox"
              autoComplete="off"
              className="h-11 border-0 bg-transparent pr-10 pl-10 focus-visible:ring-0"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="absolute right-3 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {open ? (
            <ul
              className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
              role="listbox"
            >
              {shown.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">No units found</li>
              ) : (
                shown.map((u, i) => (
                  <li key={`${u.factionId}-${u.id}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === active}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(u)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm",
                        i === active ? "bg-accent" : "hover:bg-muted",
                      )}
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{u.name}</span>
                        <span className="text-muted-foreground"> · {u.factionName}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{u.points} pts</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}

      {selected ? children : <p className="text-sm text-muted-foreground">Type to search or browse the list.</p>}
    </div>
  );
}

function StatStrip({ unit }: { unit: UnitDef }) {
  const m = typeof unit.stats.m === "number" ? `${unit.stats.m}"` : unit.stats.m;
  return (
    <div className="mt-3 flex min-w-0 flex-wrap gap-2">
      {(
        [
          ["M", m],
          ["T", unit.stats.t],
          ["SV", `${unit.stats.sv}+`],
          ["W", unit.stats.w],
          ["LD", `${unit.stats.ld}+`],
          ["OC", unit.stats.oc],
        ] as const
      ).map(([k, v]) => (
        <div key={k} className="flex min-w-9 flex-col items-center">
          <span className="mb-0.5 text-[10px] leading-none font-medium tracking-wider text-muted-foreground uppercase">{k}</span>
          <span className="font-mono text-sm font-semibold tabular-nums">{v}</span>
        </div>
      ))}
    </div>
  );
}

function WeaponSection({
  title,
  empty,
  weapons,
  selected,
  onToggle,
}: {
  title: string;
  empty: string;
  weapons: Weapon[];
  selected: string[];
  onToggle: (w: Weapon) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/40 pt-3">
      <SectionLabel>{title}</SectionLabel>
      {weapons.length === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : null}
      <ul className="space-y-1.5">
        {weapons.map((w) => {
          const on = selected.includes(weaponKey(w));
          return (
            <li key={weaponKey(w)}>
              <button
                type="button"
                onClick={() => onToggle(w)}
                className={cn(
                  "w-full min-w-0 rounded-md px-2.5 py-2 text-left transition-colors",
                  on ? "bg-blood/15" : "hover:bg-muted/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold">{w.name}</span>
                  {on ? (
                    <Badge variant="outline" className="h-4 py-0 text-[10px] normal-case">
                      selected
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-1.5 flex min-w-0 flex-wrap gap-3">
                  <MiniStat label="RNG" value={w.kind === "melee" ? "Melee" : `${w.range}"`} />
                  <MiniStat label="A" value={String(w.attacks)} />
                  <MiniStat label={w.kind === "melee" ? "WS" : "BS"} value={`${w.skill}+`} />
                  <MiniStat label="S" value={String(w.strength)} />
                  <MiniStat label="AP" value={String(w.ap)} />
                  <MiniStat label="D" value={String(w.damage)} />
                </div>
                {w.keywords.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {w.keywords.map((k) => (
                      <span key={k} className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
                        {k}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-9 flex-col items-center">
      <span className="mb-0.5 text-[10px] leading-none font-medium tracking-wider text-muted-foreground uppercase">{label}</span>
      <span className="font-mono text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function SectionLabel({ children, accent }: { children: ReactNode; accent?: "blood" | "steel" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border-l-2 pl-2 font-display text-[11px] font-bold tracking-[0.15em] uppercase",
        accent === "blood" && "border-blood text-blood",
        accent === "steel" && "border-steel text-steel",
        !accent && "border-border text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  testId,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  testId: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Decrease model count"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <span data-testid={testId} className="min-w-10 text-center font-mono text-lg font-semibold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label="Increase model count"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
  suffix,
}: {
  value: number | null;
  options: readonly number[];
  onChange: (n: number | null) => void;
  suffix: string;
}) {
  return (
    <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-md border border-border bg-background p-1">
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          "rounded px-3 py-1.5 font-display text-xs font-semibold",
          value === null ? "bg-blood text-primary-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        Off
      </button>
      {options.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className={cn(
            "rounded px-3 py-1.5 font-display text-xs font-semibold",
            value === n ? "bg-blood text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {n}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function ModChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "h-9 rounded-md border px-3 text-xs font-medium",
        on ? "border-blood/40 bg-blood/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function Results({
  attacker,
  defender,
  expected,
  sim,
  defModels,
}: {
  attacker: UnitDef;
  defender: UnitDef;
  expected: VolleyResult;
  sim: SimResult;
  defModels: number;
}) {
  const slainPct = defModels > 0 ? (sim.meanSlain / defModels) * 100 : 0;
  const maxDmgBin = Math.max(...sim.damageHist, 1);
  const dmgMax = Math.max(sim.damageHist.length - 1, 0);
  const shownDamage = sim.damageHist
    .map((count, dmg) => ({ dmg, count, p: count / sim.iterations }))
    .filter((row) => row.count > 0);
  const compactDamage = shownDamage.length > 16
    ? shownDamage.filter((_, i) => i % Math.ceil(shownDamage.length / 14) === 0 || i === shownDamage.length - 1)
    : shownDamage;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold tracking-wide uppercase">Combat Results</h2>
        <p className="text-xs text-muted-foreground">
          {sim.iterations.toLocaleString()} iterations · leftover damage does not spill
        </p>
      </div>

      <Card className="overflow-hidden p-5 md:p-6">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {attacker.name} vs {defender.name}
        </p>
        <div className="mt-4 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox k="Mean Damage Dealt" v={sim.meanDamage.toFixed(2)} accent />
          <StatBox k="Models Killed" v={`${formatNum(sim.meanSlain)} (${slainPct.toFixed(1)}%)`} />
          <StatBox k="One-shot Chance" v={formatPct(sim.wipeChance)} />
          <StatBox k="Expected Damage" v={formatNum(expected.damage)} />
        </div>
      </Card>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden p-5 md:p-6">
          <SectionLabel>Attack sequence</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">Closed-form averages across selected profiles.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[260px] text-sm">
              <tbody>
                <SeqRow label="Attacks" detail="dice × models" value={formatNum(expected.attacks, 1)} />
                <SeqRow
                  label="Hits"
                  detail={expected.hitOn === 0 ? "Torrent" : `${expected.hitOn}+ (${formatPct(expected.pHit)})`}
                  value={formatNum(expected.hits)}
                />
                <SeqRow
                  label="Wounds"
                  detail={`${expected.woundOnValue}+ (${formatPct(expected.pWound)})`}
                  value={formatNum(expected.wounds)}
                />
                <SeqRow
                  label="Failed saves"
                  detail={`${expected.saveOn > 6 ? "no save" : `${expected.saveOn}+`} fail ${formatPct(expected.pFailSave)}`}
                  value={formatNum(expected.unsaved)}
                />
                <SeqRow label="Damage" detail="after FNP" value={formatNum(expected.damage)} strong />
              </tbody>
            </table>
          </div>
          {expected.parts.length > 1 ? (
            <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
              {expected.parts.map((p) => (
                <li key={`${p.kind}-${p.name}`} className="flex justify-between gap-3">
                  <span>{p.name}</span>
                  <span className="font-mono tabular-nums">{formatNum(p.damage)} dmg</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="min-w-0 overflow-hidden p-5 md:p-6">
          <SectionLabel>Damage Dealt Distribution</SectionLabel>
          <p className="mt-1 text-xs text-muted-foreground">Monte Carlo spread of total damage.</p>
          <div className="mt-4 flex h-36 min-w-0 items-end gap-px overflow-hidden">
            {sim.damageHist.map((count, n) => {
              const p = count / sim.iterations;
              return (
                <div key={n} className="flex min-w-0 flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-steel/80"
                    style={{ height: `${Math.max(p > 0 ? 4 : 0, (count / maxDmgBin) * 100)}%` }}
                    title={`${n} dmg · ${formatPct(p)}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] tracking-wide text-muted-foreground">
            <span>0</span>
            <span>{dmgMax} dmg</span>
          </div>
        </Card>
      </div>

      <Card className="min-w-0 overflow-hidden p-5 md:p-6">
        <SectionLabel>Probability table</SectionLabel>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[280px] text-xs">
            <thead>
              <tr className="text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="pb-2 text-left font-medium">Damage Dealt</th>
                <th className="pb-2 text-right font-medium">Rolls</th>
                <th className="pb-2 text-right font-medium">Probability</th>
              </tr>
            </thead>
            <tbody>
              {compactDamage.map((row) => (
                <tr key={row.dmg} className="border-t border-border/70">
                  <td className="py-1.5 font-mono tabular-nums">{row.dmg}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{row.count.toLocaleString()}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">{formatPct(row.p)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SeqRow({ label, detail, value, strong }: { label: string; detail: string; value: string; strong?: boolean }) {
  return (
    <tr className="border-t border-border/70">
      <td className="py-2 pr-3">
        <span className={strong ? "font-medium" : ""}>{label}</span>
        <span className="ml-2 text-xs text-muted-foreground">{detail}</span>
      </td>
      <td className={cn("py-2 text-right font-mono tabular-nums", strong && "text-steel")}>{value}</td>
    </tr>
  );
}

function StatBox({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{k}</p>
      <p className={cn("mt-1 font-mono text-2xl tabular-nums", accent && "text-steel")}>{v}</p>
    </div>
  );
}
