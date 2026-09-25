import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Datasheet } from "@/components/Datasheet";
import { CodexUpdate } from "@/components/CodexUpdate";
import { RuleFold } from "@/components/RuleFold";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FACTIONS, withCodexPatches } from "@/data/codex";
import { CORE_RULES, CORE_STRATAGEMS } from "@/data/core";
import { RULE_SOURCES } from "@/data/sources";
import { useCodexSync } from "@/lib/codex-sync";

export const Route = createFileRoute("/codex")({ component: CodexPage });

function formatCodexDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CodexPage() {
  const [factionId, setFactionId] = useState(FACTIONS[0]?.id ?? "sm");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("sheets");
  const revision = useCodexSync((s) => s.revision);
  const faction = useMemo(() => {
    const base = FACTIONS.find((f) => f.id === factionId) ?? FACTIONS[0];
    return withCodexPatches(base);
  }, [factionId, revision]);
  const units = useMemo(() => {
    const query = q.trim().toLowerCase();
    return faction.units.filter((u) => {
      if (!query) return true;
      if (u.name.toLowerCase().includes(query)) return true;
      if (u.keywords.some((k) => k.toLowerCase().includes(query))) return true;
      return u.abilities.some((ab) => ab.name.toLowerCase().includes(query) || ab.text.toLowerCase().includes(query));
    });
  }, [faction, q]);

  const rulesByGroup = useMemo(() => {
    const map = new Map<string, typeof CORE_RULES>();
    for (const rule of CORE_RULES) {
      const arr = map.get(rule.group) ?? [];
      arr.push(rule);
      map.set(rule.group, arr);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">Reference</p>
        <h1 className="font-display mt-1 text-3xl font-semibold">Codex</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unofficial 11th edition fan reference — datasheets, modular detachments, and the core rules that changed from 10th.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Sources:{" "}
          {RULE_SOURCES.map((source, i) => (
            <span key={source.href}>
              {i > 0 ? " · " : null}
              <a href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {source.name}
              </a>
              {source.primary ? " (primary)" : null}
            </span>
          ))}
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FACTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFactionId(f.id)}
            className="h-10 shrink-0 rounded-full border px-3 text-sm"
            style={{
              borderColor: factionId === f.id ? f.accent : undefined,
              background: factionId === f.id ? `${f.accent}22` : undefined,
            }}
          >
            {f.name}
          </button>
        ))}
      </div>
      {faction ? (
        <>
          <section className="space-y-2">
            <div className="rounded-xl border border-border bg-card p-4" style={{ borderLeftWidth: 3, borderLeftColor: faction.accent }}>
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{faction.allegiance}</p>
              <p className="mt-2 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {faction.units.length} datasheets · {faction.detachments.length} detachments
                {faction.updatedAt ? ` · updated ${formatCodexDate(faction.updatedAt)}` : ""}
              </p>
            </div>
            <RuleFold kicker="Army rule" title={faction.rule.name} text={faction.rule.text} />
            <CodexUpdate faction={FACTIONS.find((f) => f.id === faction.id) ?? faction} />
          </section>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="sheets">Datasheets</TabsTrigger>
              <TabsTrigger value="dets">Detachments</TabsTrigger>
              <TabsTrigger value="core">Core</TabsTrigger>
            </TabsList>
            <TabsContent value="sheets" className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search units" className="pl-9" />
              </div>
              {units.map((u) => (
                <Datasheet key={u.id} unit={u} accent={faction.accent} />
              ))}
            </TabsContent>
            <TabsContent value="dets" className="mt-4 space-y-2">
              {faction.detachments.map((d) => (
                <RuleFold
                  key={d.id}
                  kicker="Detachment"
                  title={d.name}
                  text={`${d.rule.name}. ${d.rule.text}`}
                  badges={
                    <>
                      <Badge>{d.dp} DP</Badge>
                      <Badge variant="outline">{d.disposition}</Badge>
                    </>
                  }
                >
                  {d.stratagems.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {d.stratagems.map((s) => (
                        <li key={s.id}>
                          <span className="font-medium text-foreground">{s.name}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            · {s.cp} CP · {s.when}
                          </span>
                          <p className="text-muted-foreground">{s.text}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {d.enhancements.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {d.enhancements.map((e) => (
                        <li key={e.id}>
                          <span className="font-medium text-foreground">{e.name}</span>
                          <span className="text-muted-foreground"> · {e.points} pts</span>
                          <p className="text-muted-foreground">{e.text}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </RuleFold>
              ))}
            </TabsContent>
            <TabsContent value="core" className="mt-4 space-y-6">
              {rulesByGroup.map(([group, rules]) => (
                <section key={group} className="space-y-2">
                  <h2 className="font-display text-lg">{group}</h2>
                  {rules.map((rule) => (
                    <article key={rule.id} className="rounded-xl border border-border bg-card p-4">
                      <h3 className="font-medium">{rule.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{rule.text}</p>
                    </article>
                  ))}
                </section>
              ))}
              <section className="space-y-2">
                <h2 className="font-display text-lg">Core stratagems</h2>
                <p className="text-sm text-muted-foreground">
                  Ten shared Stratagems. Play as many as you need in a phase; a given unit can only be affected by one.
                </p>
                <ul className="space-y-2">
                  {CORE_STRATAGEMS.map((s) => (
                    <li key={s.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex justify-between gap-3">
                        <p className="font-medium">{s.name}</p>
                        <Badge>{s.cp} CP</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.when}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
