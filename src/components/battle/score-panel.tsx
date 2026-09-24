import { ScoreLines } from "@/components/battle/score-lines";
import { ObjectiveControlPanel } from "@/components/battle/objective-control-panel";
import { SecondaryPanel } from "@/components/battle/secondary-panel";
import { Card } from "@/components/ui/card";
import { objectiveVp, parseObjective, type MissionInfo } from "@/data/missions";
import type { Game } from "@/data/types";
import { getBattleRuntime, getPrimaryScorePreview } from "@/lib/battle-engine-bridge";
import { useWarStore } from "@/lib/store";

export function ScorePanel({
  game,
  mission,
  mineDisp,
  theirDisp,
  locked,
}: {
  game: Game;
  mission: MissionInfo | null;
  mineDisp: string | null;
  theirDisp: string | null;
  locked: boolean;
}) {
  const side = game.viewing;
  const score = game.scores[side];
  const togglePrimaryCheck = useWarStore((s) => s.togglePrimaryCheck);
  const commitPrimaryScore = useWarStore((s) => s.commitPrimaryScore);
  const runtime = getBattleRuntime(game);
  const checkpoint = game.phase === "command" ? "COMMAND" : game.phase === "end" ? "END_OF_TURN" : "END_OF_TURN";
  const checkpointAvailable = game.phase === "command" || game.phase === "end";
  const preview = getPrimaryScorePreview(game, side, checkpoint);
  const primaryPts = mission ? objectiveVp(score.primaryChecks, mission.scoring.map(parseObjective)) : score.primaryByRound.reduce((a, b) => a + b, 0);
  const scoringBlockedObjectives = preview.requiredObjectiveIds.filter(
    (id) => runtime.objectives[id]?.status !== "CONFIRMED",
  );

  return (
    <div className="space-y-4">
      {mission ? (
        <Card className="p-4">
          <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            Primary · 11th edition · {side === "me" ? game.myName : game.opponentName}
          </p>
          <h3 className="font-display mt-1 text-xl">{mission.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {mineDisp} vs {theirDisp}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{mission.blurb}</p>
          <p className="mt-2 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
            15 VP / round · 45 primary max · {primaryPts} VP
          </p>
          <ObjectiveControlPanel runtime={runtime} requiredObjectiveIds={preview.requiredObjectiveIds} />
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-medium">Engine scoring</p>
              <p className="text-[10px] text-muted-foreground">
                {!checkpointAvailable
                  ? "Primary scoring becomes available in the Command phase or at end of turn."
                  : preview.unresolved.length
                  ? `${preview.unresolved.length} input${preview.unresolved.length === 1 ? "" : "s"} unresolved · ${scoringBlockedObjectives.length ? `update ${scoringBlockedObjectives.join(", ")}` : "check mission inputs"}`
                  : `${preview.awardedVp} VP now · ${preview.overscore} capped`}
              </p>
            </div>
            <button type="button" disabled={locked || !checkpointAvailable || preview.unresolved.length > 0 || preview.awardedVp <= 0} onClick={() => commitPrimaryScore(side, checkpoint)} className="h-8 shrink-0 rounded-md border border-ok/50 bg-ok/15 px-3 text-[11px] font-medium disabled:cursor-not-allowed disabled:opacity-40">
              Score {preview.awardedVp} VP
            </button>
          </div>
          <ScoreLines
            lines={mission.scoring}
            checks={score.primaryChecks}
            locked={locked}
            focusRound={game.round}
            liveRound={game.liveRound ?? game.round}
            onToggle={(line, slot, max) => togglePrimaryCheck(side, line, slot, max)}
          />
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Set dispositions on both lists to generate a primary mission.</p>
      )}
      <SecondaryPanel game={game} locked={locked} />
    </div>
  );
}

