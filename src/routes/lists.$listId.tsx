import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronDown, Plus, Save, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Datasheet } from "@/components/Datasheet";
import { RuleFold } from "@/components/RuleFold";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getDetachment, getFaction, getUnit, withCodexPatches } from "@/data/codex";
import { DISPOSITIONS, missionFor } from "@/data/missions";
import { BATTLE_SIZES, type Disposition, type UnitDef, type UnitRole } from "@/data/types";
import { isDefaultWargearName, resolvedWargearIds, rosterLoadout, setWargearGroup, wargearGroups } from "@/data/wargear";
import { encodeRoster } from "@/lib/share";
import { outgoingShares, revokeShare, shareList, type OutgoingShare } from "@/lib/list-shares";
import { useWarStore } from "@/lib/store";
import { useCodexSync } from "@/lib/codex-sync";
import { rosterDp, rosterPoints, unitTotalPoints, validateRoster } from "@/lib/validation";
import { cn, roleLabel, unitCopyMarks } from "@/lib/utils";

const ADD_UNIT_SECTIONS: { title: string; roles: UnitRole[]; epic?: boolean }[] = [
  { title: "Epic Heroes", roles: ["character"], epic: true },
  { title: "Characters", roles: ["character"], epic: false },
  { title: "Battleline", roles: ["battleline"] },
  { title: "Infantry", roles: ["infantry"] },
  { title: "Monsters", roles: ["monster"] },
  { title: "Mounted", roles: ["mounted"] },
  { title: "Vehicles", roles: ["vehicle", "transport"] },
];

export const Route = createFileRoute("/lists/$listId")({ component: ListBuilder });

function ListBuilder() {
  const { listId } = Route.useParams();
  const list = useWarStore((s) => s.lists.find((l) => l.id === listId));
  const updateList = useWarStore((s) => s.updateList);
  const saveList = useWarStore((s) => s.saveList);
  const addUnit = useWarStore((s) => s.addUnit);
  const updateUnit = useWarStore((s) => s.updateUnit);
  const removeUnit = useWarStore((s) => s.removeUnit);
  const toggleFavorite = useWarStore((s) => s.toggleFavorite);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [detOpen, setDetOpen] = useState<Record<string, boolean>>({});
  const [detsOpen, setDetsOpen] = useState(false);
  const [oppDisp, setOppDisp] = useState<Disposition | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [outgoing, setOutgoing] = useState<OutgoingShare[]>([]);
  const revision = useCodexSync((s) => s.revision);
  const faction = useMemo(() => {
    const base = list ? getFaction(list.factionId) : undefined;
    return base ? withCodexPatches(base) : undefined;
  }, [list, revision]);
  const copies = useMemo(() => (list ? unitCopyMarks(list.units) : {}), [list]);

  const catalogSections = useMemo(() => {
    if (!faction) return [];
    const q = query.trim().toLowerCase();
    const matches = (u: UnitDef) =>
      !q || u.name.toLowerCase().includes(q) || u.keywords.some((k) => k.toLowerCase().includes(q));
    return ADD_UNIT_SECTIONS.map((section) => ({
      ...section,
      units: faction.units
        .filter((u) => {
          if (!section.roles.includes(u.role) || !matches(u)) return false;
          const epic = u.keywords.includes("Epic Hero");
          if (section.epic === true) return epic;
          if (section.epic === false) return !epic;
          return true;
        })
        .slice()
        .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name)),
    })).filter((section) => section.units.length > 0);
  }, [faction, query]);

  useEffect(() => {
    if (!list) return;
    let cancelled = false;
    outgoingShares({ data: list.id })
      .then((rows) => {
        if (!cancelled) setOutgoing(rows);
      })
      .catch(() => {
        if (!cancelled) setOutgoing([]);
      });
    return () => {
      cancelled = true;
    };
  }, [list?.id]);

  if (!list) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-xl">List not found</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to lists</Link>
        </Button>
      </div>
    );
  }

  if (!faction) return null;

  const pts = rosterPoints(list);
  const dp = rosterDp(list);
  const size = BATTLE_SIZES[list.battleSize];
  const issues = validateRoster(list);
  const errors = issues.filter((i) => i.level === "error");
  const selectedDets = list.detachmentIds.map((id) => getDetachment(list.factionId, id)).filter(Boolean);
  const availableDisp = [...new Set(selectedDets.map((d) => d!.disposition))];
  const myDisp = list.disposition && availableDisp.includes(list.disposition) ? list.disposition : (availableDisp[0] ?? list.disposition);
  const vsDisp = oppDisp ?? DISPOSITIONS.find((d) => d !== myDisp) ?? DISPOSITIONS[0];
  const paired = myDisp ? { info: missionFor(myDisp, vsDisp).me, mine: myDisp, theirs: vsDisp } : null;
  const enhancements = selectedDets.flatMap((d) => d!.enhancements);
  const inspectRu = inspectId ? list.units.find((u) => u.id === inspectId) : undefined;
  const inspectUnit = inspectRu ? getUnit(list.factionId, inspectRu.unitId) : undefined;
  const gearGroups = inspectUnit
    ? wargearGroups(inspectUnit).filter((group) => group.id !== "loadout" || group.options.some((opt) => !isDefaultWargearName(opt.name)))
    : [];

  const unitCard = (ru: (typeof list.units)[number]) => {
    const def = getUnit(list.factionId, ru.unitId);
    if (!def) return null;
    const total = unitTotalPoints(list, ru);
    const loadout = rosterLoadout(def, ru.wargearIds);
    const enh = ru.enhancementId ? enhancements.find((e) => e.id === ru.enhancementId) : undefined;
    const facts = [ru.models > 1 ? `${ru.models} models` : null, enh?.name, loadout, ru.notes].filter(Boolean).join(" · ");
    const leader = list.units.find((other) => other.attachedTo === ru.id);
    return (
      <div className="min-w-0 rounded-lg border border-border bg-card px-2.5 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-medium leading-5" onClick={() => setInspectId(ru.id)}>
            {def.name}
            {copies[ru.id] ? <span className="ml-1.5 text-[10px] tracking-widest text-steel">[{copies[ru.id]}]</span> : null}
          </button>
          {def.role === "character" ? (
            <Button
              size="sm"
              variant={ru.warlord ? "default" : "outline"}
              className="h-7 shrink-0 px-2 text-[11px]"
              aria-pressed={ru.warlord === true}
              aria-label={ru.warlord ? "Warlord" : "Make warlord"}
              onClick={() => {
                useWarStore.setState({
                  lists: useWarStore.getState().lists.map((l) =>
                    l.id === list.id
                      ? { ...l, units: l.units.map((u) => ({ ...u, warlord: u.id === ru.id })), updatedAt: Date.now() }
                      : l,
                  ),
                });
              }}
            >
              WL
            </Button>
          ) : null}
          <span className="w-12 shrink-0 text-right font-mono text-sm tabular-nums leading-5">{total}</span>
          <Button size="icon-sm" variant="ghost" className="shrink-0" aria-label="Remove" onClick={() => removeUnit(list.id, ru.id)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
        {facts ? (
          <button type="button" className="mt-0.5 block w-full min-w-0 truncate text-left text-xs leading-4 text-muted-foreground" onClick={() => setInspectId(ru.id)}>
            {facts}
          </button>
        ) : null}
        {leader ? (
          <button
            type="button"
            className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase"
            onClick={() => updateUnit(list.id, leader.id, { attachedTo: undefined })}
          >
            Detach
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/" className="text-xs tracking-[0.16em] text-muted-foreground uppercase hover:text-foreground">
            Lists
          </Link>
          <ListTitle listId={list.id} name={list.name} />
          <p className="text-sm text-muted-foreground">
            {faction.name}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          <Button size="icon" variant="ghost" onClick={() => toggleFavorite(list.id)} aria-label="Favorite">
            <Star className={cn("size-4", list.favorite && "fill-current text-steel")} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              saveList(list.id);
              toast.success("List saved", { description: list.name });
            }}
          >
            <Save className="size-4" /> Save
          </Button>
        </div>
      </div>

      <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <p className={cn("min-w-0 flex-1 truncate font-mono text-sm tabular-nums", errors.length > 0 && "text-blood")}>
            {pts}/{size.points} · {dp}/{size.dp} DP · {errors[0]?.text ?? "Legal"}
          </p>
          <Select
            value={list.battleSize}
            onValueChange={(v) =>
              updateList(list.id, {
                battleSize: v as "incursion" | "strike",
                pointsLimit: BATTLE_SIZES[v as "incursion" | "strike"].points,
              })
            }
          >
            <SelectTrigger className="h-8 w-[7.5rem] shrink-0 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="incursion">1000</SelectItem>
              <SelectItem value="strike">2000</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RuleFold kicker="Share" title="Copy a code or send this list">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            const code = encodeRoster(list);
            await navigator.clipboard.writeText(code);
            toast("Share code copied");
          }}
        >
          Copy code
        </Button>
        <p className="text-xs text-muted-foreground">They must already have an Ono40k account. They receive this list only.</p>
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setShareBusy(true);
            try {
              const result = await shareList({ data: { email: shareEmail, list } });
              if (!result.ok) {
                toast.error(result.error === "self" ? "That is your own email." : "No account uses that email.");
                return;
              }
              setShareEmail("");
              setOutgoing(await outgoingShares({ data: list.id }));
              toast.success("List shared");
            } catch {
              toast.error("Sign in to share a list.");
            } finally {
              setShareBusy(false);
            }
          }}
        >
          <Input
            type="email"
            value={shareEmail}
            onChange={(event) => setShareEmail(event.target.value)}
            placeholder="player@email"
            className="h-8 w-56 text-xs"
            required
          />
          <Button type="submit" size="sm" disabled={shareBusy}>
            Share
          </Button>
        </form>
        {outgoing.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {outgoing.map((share) => (
              <li key={share.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{share.email ?? "Account"}</span>
                <button
                  type="button"
                  className="shrink-0 uppercase tracking-wide"
                  onClick={async () => {
                    await revokeShare({ data: share.id });
                    setOutgoing((rows) => rows.filter((row) => row.id !== share.id));
                  }}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </RuleFold>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Detachments</h2>
          {selectedDets.length > 0 ? (
            <Button size="sm" variant="outline" onClick={() => setDetsOpen((open) => !open)}>
              {detsOpen ? "Show selected" : "Add detachment"}
            </Button>
          ) : null}
        </div>
        <RuleFold kicker="Rules" title={faction.rule.name} text={faction.rule.text}>
          {selectedDets.map((d) => (
            <p key={`rule-${d!.id}`} className="text-sm leading-relaxed">
              <span className="font-medium">{d!.rule.name}. </span>
              <span className="text-muted-foreground">{d!.rule.text}</span>
            </p>
          ))}
        </RuleFold>
        <ul className="mt-2 grid grid-cols-2 items-start gap-1">
          {faction.detachments
            .filter((d) => detsOpen || selectedDets.length === 0 || list.detachmentIds.includes(d.id))
            .map((d) => {
            const on = list.detachmentIds.includes(d.id);
            const expanded = detOpen[d.id] === true;
            const over = !on && dp + d.dp > size.dp;
            return (
              <li key={d.id} className={cn("min-w-0 rounded-md border", on ? "border-primary bg-accent" : "border-border bg-card", over && "opacity-50")}>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={on ? `Remove ${d.name}` : `Add ${d.name}`}
                    onClick={() => {
                      if (on) {
                        const next = list.detachmentIds.filter((id) => id !== d.id);
                        const disp = next
                          .map((id) => getDetachment(list.factionId, id)?.disposition)
                          .filter(Boolean) as Disposition[];
                        updateList(list.id, {
                          detachmentIds: next,
                          disposition: list.disposition && disp.includes(list.disposition) ? list.disposition : (disp[0] ?? null),
                        });
                        return;
                      }
                      if (dp + d.dp > size.dp) {
                        toast(`That would be ${dp + d.dp} DP — max is ${size.dp} DP`);
                        return;
                      }
                      const takenTags = list.detachmentIds
                        .map((id) => getDetachment(list.factionId, id)?.uniqueTag)
                        .filter(Boolean);
                      if (takenTags.includes(d.uniqueTag)) {
                        toast(`Unique: ${d.uniqueTag} — already have a detachment with that tag`);
                        return;
                      }
                      updateList(list.id, {
                        detachmentIds: [...list.detachmentIds, d.id],
                        disposition: d.disposition,
                      });
                    }}
                    className="flex size-11 shrink-0 items-center justify-center"
                  >
                    <span
                      className={cn(
                        "flex size-3.5 items-center justify-center rounded-sm border",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {on ? <Check className="size-2.5" /> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setDetOpen((prev) => ({ ...prev, [d.id]: !expanded }))}
                    className="min-h-11 min-w-0 flex-1 py-1.5 pr-2 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="min-w-0 truncate text-xs font-medium">{d.name}</span>
                      <Badge className="h-4 shrink-0 px-1.5 py-0 text-[10px] tracking-wider">{d.dp} DP</Badge>
                      <Badge variant="outline" className="hidden h-4 max-w-[7rem] shrink truncate px-1.5 py-0 text-[10px] tracking-wider sm:inline-flex">
                        {d.disposition}
                      </Badge>
                      <ChevronDown className={cn("ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                    </div>
                    {expanded ? (
                      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-snug text-muted-foreground">
                        <li>
                          <span className="text-foreground">{d.rule.name}. </span>
                          {d.rule.text}
                        </li>
                        <li>Unique tag: {d.uniqueTag}</li>
                      </ul>
                    ) : null}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {availableDisp.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Force disposition · from detachments
            </p>
            {availableDisp.length === 1 ? (
              <p className="text-sm">
                {availableDisp[0]}
                <span className="text-muted-foreground"> · {selectedDets.find((d) => d!.disposition === availableDisp[0])?.name}</span>
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {availableDisp.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateList(list.id, { disposition: d })}
                    className={cn(
                      "h-8 rounded-md border px-2.5 text-xs font-medium",
                      (list.disposition ?? availableDisp[0]) === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-muted-foreground",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            {paired ? (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">Primary mission</p>
                <Select value={vsDisp} onValueChange={(v) => setOppDisp(v as Disposition)}>
                  <SelectTrigger className="mt-2 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISPOSITIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        vs {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <h3 className="font-display mt-2 text-base font-semibold">{paired.info.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {paired.mine} vs {paired.theirs}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{paired.info.blurb}</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-snug">
                  {paired.info.scoring.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display flex items-baseline gap-2 text-lg font-semibold">
            Roster
            <span className={cn("font-mono text-sm font-normal tabular-nums", pts > size.points && "text-blood")}>
              {pts}
              <span className="text-muted-foreground">/{size.points}</span>
            </span>
          </h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Add unit
          </Button>
        </div>
        {list.units.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">No units yet. Add from the catalog.</Card>
        ) : (
          <ul className="space-y-1">
            {(() => {
              const hosted = new Set(list.units.map((u) => u.attachedTo).filter((id): id is string => Boolean(id)));
              const placed = new Set<string>();
              const rank = (ru: (typeof list.units)[number]) => {
                if (ru.warlord) return 0;
                return getUnit(list.factionId, ru.unitId)?.role === "character" ? 1 : 2;
              };
              return [...list.units]
                .filter((ru) => !hosted.has(ru.id))
                .sort((a, b) => {
                  const byRank = rank(a) - rank(b);
                  if (byRank !== 0) return byRank;
                  const na = getUnit(list.factionId, a.unitId)?.name ?? "";
                  const nb = getUnit(list.factionId, b.unitId)?.name ?? "";
                  const byName = na.localeCompare(nb);
                  if (byName !== 0) return byName;
                  return (copies[a.id] ?? "").localeCompare(copies[b.id] ?? "");
                })
                .map((ru) => {
                  const host = ru.attachedTo ? list.units.find((u) => u.id === ru.attachedTo && !placed.has(u.id)) : undefined;
                  if (host) placed.add(host.id);
                  return (
                    <li key={ru.id} className="min-w-0 space-y-1">
                      {unitCard(ru)}
                      {host ? <div className="w-4/5">{unitCard(host)}</div> : null}
                    </li>
                  );
                });
            })()}
          </ul>
        )}
      </section>

      {issues.length > 0 ? (
        <ul className="space-y-1 text-sm">
          {issues.map((i) => (
            <li key={i.text} className={i.level === "error" ? "text-blood" : "text-muted-foreground"}>
              {i.level === "error" ? "Error · " : "Note · "}
              {i.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ok">List is legal for {size.label}.</p>
      )}

      {errors.length === 0 ? (
        <Button asChild className="w-full sm:w-auto">
          <Link to="/setup" search={{ list: list.id }}>
            Start battle with this list
          </Link>
        </Button>
      ) : null}

      <Sheet
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setQuery("");
        }}
      >
        <SheetContent side="bottom" className="h-[88vh]">
          <SheetHeader>
            <SheetTitle>Add unit</SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-2 px-5 py-3">
            <Search className="size-4 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search datasheets" className="h-10" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
            {catalogSections.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No datasheets match.</p>
            ) : (
              catalogSections.map((section) => (
                <section key={section.title} className="mb-5">
                  <h3 className="sticky top-0 z-10 -mx-5 mb-2 border-b border-border/70 bg-card px-5 py-2 font-display text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    {section.title}
                    <span className="ml-2 font-mono text-[11px] font-normal tracking-normal tabular-nums">{section.units.length}</span>
                  </h3>
                  <ul className="space-y-2">
                    {section.units.map((u) => {
                      const epic = u.keywords.includes("Epic Hero");
                      const owned = list.units.filter((ru) => ru.unitId === u.id).length;
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2 py-2 text-left"
                            onClick={() => {
                              if (epic && owned >= 1) {
                                toast("Only one copy of an Epic Hero.");
                                return;
                              }
                              addSized(u, list.id, addUnit);
                            }}
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{u.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {u.sizes && u.sizes.length > 1
                                  ? `${u.sizes[0].models}–${u.sizes[u.sizes.length - 1].models} models`
                                  : roleLabel(u.role)}
                              </span>
                            </span>
                            <span className="shrink-0 font-mono text-sm tabular-nums">{u.points}</span>
                            <Plus className="size-4 shrink-0 text-muted-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!inspectUnit && !!inspectRu} onOpenChange={(o) => !o && setInspectId(null)}>
        <SheetContent side="bottom" className="h-[88vh]">
          <SheetHeader>
            <SheetTitle>Datasheet</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {inspectUnit && inspectRu ? (
              <>
                <Datasheet unit={inspectUnit} accent={faction.accent} points={unitTotalPoints(list, inspectRu)} wargearIds={inspectRu.wargearIds ?? []} />
                {(() => {
                  const hosts =
                    inspectUnit.role === "character" && !inspectRu.attachedTo
                      ? list.units.filter((other) => other.id !== inspectRu.id && inspectUnit.leaderOf?.includes(other.unitId))
                      : [];
                  const showOptions =
                    (enhancements.length > 0 && inspectUnit.role === "character") ||
                    (inspectUnit.sizes?.length ?? 0) > 1 ||
                    hosts.length > 0;
                  if (!showOptions) return null;
                  return (
                <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                  {enhancements.length > 0 && inspectUnit.role === "character" ? (
                    <div className="space-y-1.5">
                      <Label>Enhancement</Label>
                      <Select
                        value={inspectRu.enhancementId ?? "none"}
                        onValueChange={(v) => updateUnit(list.id, inspectRu.id, { enhancementId: v === "none" ? undefined : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Enhancement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No enhancement</SelectItem>
                          {enhancements.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name} +{e.points}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {inspectUnit.sizes && inspectUnit.sizes.length > 1 ? (
                    <div className="space-y-1.5">
                      <Label>Squad size</Label>
                      <Select
                        value={String(inspectRu.models)}
                        onValueChange={(v) => {
                          const sizeOpt = inspectUnit.sizes!.find((s) => s.models === Number(v));
                          if (sizeOpt) updateUnit(list.id, inspectRu.id, { models: sizeOpt.models, points: sizeOpt.points });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {inspectUnit.sizes.map((s) => (
                            <SelectItem key={s.models} value={String(s.models)}>
                              {s.models} models · {s.points}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {hosts.length > 0 ? (
                          <div className="space-y-1.5">
                            <Label>Bodyguard</Label>
                            <Select onValueChange={(v) => updateUnit(list.id, inspectRu.id, { attachedTo: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Attach a bodyguard" />
                              </SelectTrigger>
                              <SelectContent>
                                {hosts.map((host) => (
                                  <SelectItem key={host.id} value={host.id}>
                                    {getUnit(list.factionId, host.unitId)?.name ?? "Unit"}
                                    {copies[host.id] ? ` [${copies[host.id]}]` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : null}
                </div>
                  );
                })()}
                {gearGroups.length > 0 ? (
                  <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                    <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Wargear</p>
                    {gearGroups.map((group) => {
                      const current = resolvedWargearIds(inspectUnit, inspectRu.wargearIds).find((id) =>
                        group.options.some((opt) => opt.id === id),
                      );
                      return (
                        <div key={group.id} className="space-y-1.5">
                          <Label>{group.label}</Label>
                          <Select
                            value={current ?? group.options[0]?.id}
                            onValueChange={(v) =>
                              updateUnit(list.id, inspectRu.id, {
                                wargearIds: setWargearGroup(inspectUnit, inspectRu.wargearIds, group.id, v),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {group.options.map((opt) => (
                                <SelectItem key={opt.id} value={opt.id}>
                                  {opt.name}
                                  {opt.points ? ` +${opt.points}` : " · 0 pts"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                <div className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                  <Label htmlFor="unit-notes">Notes</Label>
                  <Textarea
                    id="unit-notes"
                    value={inspectRu.notes ?? ""}
                    placeholder="Deployment, target priority, house rules…"
                    onChange={(e) => updateUnit(list.id, inspectRu.id, { notes: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Shown under this unit on the list.</p>
                </div>
              </>
            ) : null}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Button
              className="flex-1"
              onClick={() => {
                saveList(list.id);
                toast.success("List saved", { description: list.name });
              }}
            >
              <Save className="size-4" /> Save
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setInspectId(null)}>
              Return to list
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ListTitle({ listId, name }: { listId: string; name: string }) {
  const updateList = useWarStore((s) => s.updateList);
  const [value, setValue] = useState(name);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setValue(name);
  }, [name, listId]);
  const commit = (next: string) => {
    if (next !== name) updateList(listId, { name: next });
  };
  return (
    <input
      value={value}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        commit(value);
      }}
      onChange={(e) => setValue(e.target.value)}
      className="font-display mt-1 block w-full bg-transparent text-3xl font-semibold tracking-wide outline-none"
    />
  );
}

function addSized(u: UnitDef, listId: string, addUnit: (listId: string, unit: { unitId: string; models: number; points: number }) => void) {
  const size = u.sizes?.[0];
  addUnit(listId, {
    unitId: u.id,
    models: size?.models ?? 1,
    points: size?.points ?? u.points,
  });
}
