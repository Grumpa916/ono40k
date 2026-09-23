import { ScoreLines } from "@/components/battle/score-lines";
import { SecondaryPanel } from "@/components/battle/secondary-panel";
import { Card } from "@/components/ui/card";
import { objectiveVp, parseObjective, type MissionInfo } from "@/data/missions";
import type { Game } from "@/data/types";
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
  const primaryPts = mission ? objectiveVp(score.primaryChecks, mission.scoring.map(parseObjective)) : score.primaryByRound.reduce((a, b) => a + b, 0);

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

