import { cumulativeEmissions } from "../analysis/fieldStats";
import { mdgPlan } from "../generated/dataMdg";
import { PhaseOutSchedule } from "./gameData";

/**
 * The game's mission: cut the shelf's cumulative 2025–2040 emissions at
 * least as much as MDG's phase-out plan does. One shared definition so the
 * map intro, status bar, period reports and the final result all measure
 * against the same number.
 */

let cachedGoal: number | undefined;

/** MDG's plan's cut of cumulative 2025–2040 emissions, in percent. */
export function goalCutPercent(): number {
  if (cachedGoal === undefined) {
    const baseline = cumulativeEmissions({});
    cachedGoal = Math.round(
      ((baseline - cumulativeEmissions(mdgPlan)) / baseline) * 100,
    );
  }
  return cachedGoal;
}

/** The player's current cut of cumulative 2025–2040 emissions, in percent. */
export function currentCutPercent(phaseOut: PhaseOutSchedule): number {
  const baseline = cumulativeEmissions({});
  return Math.round(
    ((baseline - cumulativeEmissions(phaseOut)) / baseline) * 100,
  );
}

export type PaceVerdict = "ahead" | "onTrack" | "behind";

/**
 * A simple pacing signal after `completedRounds` of `totalRounds` rounds:
 * is the player's cut ahead of, on, or behind a straight line toward the
 * goal? This is game feedback, not science — the label in the UI says
 * "skjema" (schedule), not anything about climate paths.
 */
export function paceVerdict(
  cutPercent: number,
  completedRounds: number,
  totalRounds: number,
): PaceVerdict {
  const expected = goalCutPercent() * (completedRounds / totalRounds);
  if (cutPercent >= expected * 1.1) return "ahead";
  if (cutPercent >= expected * 0.75) return "onTrack";
  return "behind";
}
