import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FACTIONS, getDetachment, getFaction } from "@/data/codex";
import type { Detachment, Disposition } from "@/data/types";
import { cn } from "@/lib/utils";
import { type ArmySource, defaultCodex } from "@/components/battle/army-source";

export function CodexDraft({
  source,
  quiet,
  open,
  onSource,
}: {
  source: Extract<ArmySource, { kind: "codex" }>;
  quiet?: boolean;
  open: boolean;
  onSource: (v: Extract<ArmySource, { kind: "codex" }>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Add a codex army</p>
      {quiet ? (
        <p className="text-xs text-muted-foreground">Two armies are selected. Untick one to use the codex.</p>
      ) : null}
      <div className="grid grid-cols-2 gap-1.5">
        {FACTIONS.map((f) => {
          const on = open && source.factionId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                if (quiet) {
                  toast("Two armies are already selected. Untick one first.");
                  return;
                }
                onSource(defaultCodex(f.id));
              }}
              className={cn(
                "min-h-11 rounded-md border px-2 py-1.5 text-left text-xs font-medium",
                on ? "border-primary bg-accent" : "border-border bg-muted text-muted-foreground",
              )}
            >
              {f.name}
            </button>
          );
        })}
      </div>
      {open ? (
        <CodexDetachmentPicker
          factionId={source.factionId}
          detachmentIds={source.detachmentIds}
          disposition={source.disposition}
          onChange={(next) => onSource({ kind: "codex", factionId: source.factionId, ...next })}
        />
      ) : null}
    </div>
  );
}

export function CodexDetachmentPicker({
  factionId,
  detachmentIds,
  disposition,
  onChange,
}: {
  factionId: string;
  detachmentIds: string[];
  disposition: Disposition | null;
  onChange: (next: { detachmentIds: string[]; disposition: Disposition | null }) => void;
}) {
  const faction = getFaction(factionId);
  if (!faction) return null;
  const dp = detachmentIds.reduce((sum, id) => sum + (getDetachment(factionId, id)?.dp ?? 0), 0);
  const availableDisp = [
    ...new Set(detachmentIds.map((id) => getDetachment(factionId, id)?.disposition).filter(Boolean)),
  ] as Disposition[];
  const current = disposition && availableDisp.includes(disposition) ? disposition : (availableDisp[0] ?? null);

  const toggle = (d: Detachment) => {
    const on = detachmentIds.includes(d.id);
    if (on) {
      const next = detachmentIds.filter((id) => id !== d.id);
      const disps = next.map((id) => getDetachment(factionId, id)?.disposition).filter(Boolean) as Disposition[];
      onChange({
        detachmentIds: next,
        disposition: current && disps.includes(current) ? current : (disps[0] ?? null),
      });
      return;
    }
    if (dp + d.dp > 3) {
      toast(`That would be ${dp + d.dp} DP — max is 3 DP`);
      return;
    }
    const takenTags = detachmentIds.map((id) => getDetachment(factionId, id)?.uniqueTag).filter(Boolean);
    if (takenTags.includes(d.uniqueTag)) {
      toast(`Unique: ${d.uniqueTag} — already have a detachment with that tag`);
      return;
    }
    onChange({
      detachmentIds: [...detachmentIds, d.id],
      disposition: d.disposition,
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Detachments · {dp}/3 DP</p>
      <ul className="grid max-h-64 grid-cols-2 items-start gap-1 overflow-y-auto">
        {faction.detachments.map((d) => {
          const on = detachmentIds.includes(d.id);
          const over = !on && dp + d.dp > 3;
          return (
            <li key={d.id} className={cn("min-w-0 rounded-md border", on ? "border-primary bg-accent" : "border-border bg-card", over && "opacity-50")}>
              <button
                type="button"
                aria-label={on ? `Remove ${d.name}` : `Add ${d.name}`}
                onClick={() => toggle(d)}
                className="flex min-h-11 w-full min-w-0 items-center gap-1.5 px-2 py-1.5 text-left"
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on ? <Check className="size-2.5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{d.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{d.disposition}</span>
                </span>
                <Badge className="h-4 shrink-0 px-1.5 py-0 text-[10px] tracking-wider">{d.dp} DP</Badge>
              </button>
            </li>
          );
        })}
      </ul>
      {availableDisp.length > 1 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">Force disposition</p>
          <div className="flex flex-wrap gap-1.5">
            {availableDisp.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ detachmentIds, disposition: d })}
                className={cn(
                  "h-8 rounded-md border px-2.5 text-xs font-medium",
                  current === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : availableDisp.length === 1 ? (
        <p className="text-xs text-muted-foreground">Force disposition · {availableDisp[0]}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Select at least one detachment (max 3 DP).</p>
      )}
    </div>
  );
}

