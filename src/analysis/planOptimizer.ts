import { PhaseOutSchedule } from "../data/gameData";
import { Year } from "../data/types";
import {
  computeFieldStats,
  cumulativeEmissions,
  emissionsFromYear,
  productionFromYear,
} from "./fieldStats";

/**
 * Strategy for the plan optimizer:
 * - `intensity`: phase out the fields with the highest emissions per barrel
 *   first — maximizes climate effect per barrel of forgone production.
 * - `volume`: phase out the fields with the highest total emissions first —
 *   reaches the target with the fewest possible fields.
 */
export type OptimizerStrategy = "intensity" | "volume";

export type OptimizedPlan = {
  schedule: PhaseOutSchedule;
  /** Cumulative avoided emissions 2025–2040 @unit tCO₂e */
  avoidedEmission: number;
  /** Avoided emissions as percentage of baseline */
  reductionPercent: number;
  /** Forgone production as percentage of baseline */
  productionLossPercent: number;
  /** Whether the requested target was actually reachable */
  targetReached: boolean;
  fieldCount: number;
};

/**
 * Generates a phase-out plan that reaches a given emission reduction target.
 *
 * The optimizer works greedily: fields are ranked according to the chosen
 * strategy and assigned the earliest possible phase-out year until the
 * cumulative avoided emissions reach the target. This is a classic greedy
 * approximation to the knapsack problem — simple, transparent and fast enough
 * to run on every slider change.
 *
 * @param targetReductionPercent - Desired reduction of cumulative 2025–2040
 *   emissions, in percent of the do-nothing baseline (0–100).
 * @param earliestYear - The earliest year fields can be phased out
 *   (typically the current in-game year).
 * @param strategy - Ranking strategy, see {@link OptimizerStrategy}.
 */
export function optimizePlan(
  targetReductionPercent: number,
  earliestYear: Year,
  strategy: OptimizerStrategy = "intensity",
): OptimizedPlan {
  const stats = computeFieldStats();
  const baselineEmission = cumulativeEmissions({});
  const baselineProduction = stats.reduce(
    (sum, s) => sum + s.totalProduction,
    0,
  );
  const targetTonnes = (targetReductionPercent / 100) * baselineEmission;

  const ranked = [...stats].sort((a, b) =>
    strategy === "intensity"
      ? b.avgIntensity - a.avgIntensity
      : b.totalEmission - a.totalEmission,
  );

  const schedule: PhaseOutSchedule = {};
  let avoided = 0;

  // Phase 1 — greedy selection: phase out the highest ranked fields at the
  // earliest possible year until the target is reached.
  for (const stat of ranked) {
    if (avoided >= targetTonnes) break;
    const gain = emissionsFromYear(stat.field, earliestYear);
    if (gain <= 0) continue;
    schedule[stat.field] = earliestYear;
    avoided += gain;
  }

  // Phase 2 — relaxation: walk the selected fields from the least valuable
  // (last picked) and push each phase-out year as late as possible without
  // dropping below the target. This preserves production where it does not
  // cost the climate goal, producing a staggered, more realistic plan.
  const selected = Object.keys(
    schedule,
  ).reverse() as (keyof PhaseOutSchedule)[];
  for (const field of selected) {
    const gainAtEarliest = emissionsFromYear(field, earliestYear);
    for (let y = 2040; y > parseInt(earliestYear); y--) {
      const year = y.toString() as Year;
      const loss = gainAtEarliest - emissionsFromYear(field, year);
      if (avoided - loss >= targetTonnes) {
        schedule[field] = year;
        avoided -= loss;
        break;
      }
    }
  }

  const forgoneProduction = selected
    .map((field) => productionFromYear(field, schedule[field]!))
    .reduce((a, b) => a + b, 0);

  return {
    schedule,
    avoidedEmission: avoided,
    reductionPercent: Math.round((avoided / baselineEmission) * 100),
    productionLossPercent: Math.round(
      (forgoneProduction / baselineProduction) * 100,
    ),
    targetReached: avoided >= targetTonnes,
    fieldCount: Object.keys(schedule).length,
  };
}
