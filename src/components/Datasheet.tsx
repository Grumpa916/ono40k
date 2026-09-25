import type { UnitDef, Weapon } from "@/data/types";
import { builtWeapons } from "@/data/wargear";
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
      <td className="py-1.5 pr-1 font-medium">
        <span className="block leading-tight">{w.name}</span>
        {w.keywords.length > 0 ? (
          <span className="block text-[10px] leading-tight font-normal text-muted-foreground">{w.keywords.join(", ")}</span>
        ) : null}
      </td>
      <td className="py-1.5 text-right text-muted-foreground tabular-nums whitespace-nowrap">{w.range === "Melee" ? "Melee" : `${w.range}"`}</td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{w.attacks}</td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{w.skill}+</td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{w.strength}</td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{w.ap}</td>
      <td className="py-1.5 text-right tabular-nums whitespace-nowrap">{w.damage}</td>
    </tr>
  );
}

export function Datasheet({
  unit,
  accent,
  compact,
  className,
  points,
  wargearIds,
}: {
  unit: UnitDef;
  accent?: string;
  compact?: boolean;
  className?: string;
  points?: number;
  wargearIds?: string[];
}) {
  const shownPts = points ?? unit.points;
  const weapons = wargearIds ? builtWeapons(unit, wargearIds) : { ranged: unit.ranged, melee: unit.melee };
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
          {(weapons.ranged.length > 0 || weapons.melee.length > 0) && (
            <div className="mt-3 px-4">
              <table className="w-full table-fixed text-left text-[11px]">
                <colgroup>
                  <col />
                  <col className="w-12" />
                  <col className="w-6" />
                  <col className="w-7" />
                  <col className="w-5" />
                  <col className="w-6" />
                  <col className="w-9" />
                </colgroup>
                <thead>
                  <tr className="text-[9px] tracking-wide text-muted-foreground uppercase">
                    <th className="pb-1 font-medium">Weapon</th>
                    <th className="pb-1 text-right font-medium">Rng</th>
                    <th className="pb-1 text-right font-medium">A</th>
                    <th className="pb-1 text-right font-medium">BS</th>
                    <th className="pb-1 text-right font-medium">S</th>
                    <th className="pb-1 text-right font-medium">AP</th>
                    <th className="pb-1 text-right font-medium">D</th>
                  </tr>
                </thead>
                <tbody>
                  {weapons.ranged.map((w) => (
                    <WeaponRow key={`r-${w.name}`} w={w} />
                  ))}
                  {weapons.melee.map((w) => (
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
