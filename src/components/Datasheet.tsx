import type { UnitDef, Weapon } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { cn, roleLabel } from "@/lib/utils";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex min-w-10 flex-col items-center gap-0.5 rounded-md bg-muted px-2 py-1.5">
      <span className="text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function WeaponRow({ w }: { w: Weapon }) {
  return (
    <tr className="border-t border-border/70">
      <td className="py-1.5 pr-2 font-medium">{w.name}</td>
      <td className="py-1.5 pr-2 text-muted-foreground tabular-nums">{w.range === "Melee" ? "Melee" : `${w.range}"`}</td>
      <td className="py-1.5 pr-2 tabular-nums">{w.attacks}</td>
      <td className="py-1.5 pr-2 tabular-nums">{w.skill}+</td>
      <td className="py-1.5 pr-2 tabular-nums">{w.strength}</td>
      <td className="py-1.5 pr-2 tabular-nums">{w.ap}</td>
      <td className="py-1.5 pr-2 tabular-nums">{w.damage}</td>
      <td className="py-1.5 text-[11px] text-muted-foreground">{w.keywords.join(", ") || "—"}</td>
    </tr>
  );
}

export function Datasheet({
  unit,
  accent,
  compact,
  className,
  points,
}: {
  unit: UnitDef;
  accent?: string;
  compact?: boolean;
  className?: string;
  points?: number;
}) {
  const shownPts = points ?? unit.points;
  return (
    <article
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      style={accent ? { borderLeftColor: accent, borderLeftWidth: 3 } : undefined}
    >
      <header className="flex items-start justify-between gap-3 p-4 pb-3">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-wide">{unit.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge variant="outline">{roleLabel(unit.role)}</Badge>
            {unit.invuln ? <Badge>{unit.invuln}+ invuln</Badge> : null}
            {unit.fnp ? <Badge>{unit.fnp}+ FNP</Badge> : null}
            <Badge variant="outline">{shownPts} pts</Badge>
          </div>
        </div>
      </header>
      <div className="flex flex-wrap gap-1.5 px-4">
        <Stat label="M" value={typeof unit.stats.m === "number" ? `${unit.stats.m}"` : unit.stats.m} />
        <Stat label="T" value={unit.stats.t} />
        <Stat label="SV" value={`${unit.stats.sv}+`} />
        <Stat label="W" value={unit.stats.w} />
        <Stat label="LD" value={`${unit.stats.ld}+`} />
        <Stat label="OC" value={unit.stats.oc} />
      </div>
      {!compact && (
        <>
          {(unit.ranged.length > 0 || unit.melee.length > 0) && (
            <div className="mt-3 overflow-x-auto px-4">
              <table className="w-full min-w-[540px] text-left text-xs">
                <thead>
                  <tr className="text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
                    <th className="pb-1 font-medium">Weapon</th>
                    <th className="pb-1 font-medium">Rng</th>
                    <th className="pb-1 font-medium">A</th>
                    <th className="pb-1 font-medium">BS/WS</th>
                    <th className="pb-1 font-medium">S</th>
                    <th className="pb-1 font-medium">AP</th>
                    <th className="pb-1 font-medium">D</th>
                    <th className="pb-1 font-medium">Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {unit.ranged.map((w) => (
                    <WeaponRow key={`r-${w.name}`} w={w} />
                  ))}
                  {unit.melee.map((w) => (
                    <WeaponRow key={`m-${w.name}`} w={w} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="space-y-2 p-4">
            {unit.abilities.length > 0 ? (
              <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed">
                {unit.abilities.map((ab) => (
                  <li key={ab.name}>
                    <span className="font-medium text-steel">{ab.name}. </span>
                    <span className="text-muted-foreground">{ab.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-[11px] text-muted-foreground">{unit.keywords.join(" · ")}</p>
          </div>
        </>
      )}
    </article>
  );
}
