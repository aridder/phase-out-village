import { gameData, PhaseOutSchedule, totalProduction } from "./gameData";
import { Year } from "./types";

/**
 * Energy conversion factors for the transition view.
 *
 * All factors are rounded, well-known approximations intended for
 * communication, not energy accounting:
 *
 * - 1 Sm³ of oil equivalent contains roughly 10 MWh of chemical energy,
 *   so 1 mill. Sm³ o.e. ≈ 10 TWh. (Norway's ~240 mill. Sm³ o.e. annual
 *   production ≈ 2 400 TWh, the commonly cited figure.)
 * - Only ~35% of the energy in oil becomes useful work when burned in
 *   engines and power plants — the rest is lost as waste heat. Electricity
 *   is used almost without conversion loss, so replacing the *usefulness*
 *   of 1 TWh of oil takes roughly 0.35 TWh of renewable power.
 *   (IEA and others use 30–40% for the fossil-to-useful-energy ratio.)
 * - A modern 15 MW offshore wind turbine produces ~60 GWh per year
 *   (≈45% capacity factor).
 * - An average Norwegian household uses ~20 000 kWh per year, so
 *   1 TWh powers ~50 000 households.
 */
export const TWH_PER_MILL_SM3_OE = 10;
export const USEFUL_ENERGY_FACTOR = 0.35;
export const TWH_PER_TURBINE_YEAR = 0.06;
export const HOUSEHOLDS_PER_TWH = 50_000;

/** One year in the energy transition series. */
export type TransitionYear = {
  year: Year;
  /** Fossil energy produced without any phase-out @unit TWh */
  baselineTwh: number;
  /** Fossil energy produced under the given plan @unit TWh */
  planTwh: number;
  /** Fossil energy phased out this year (baseline − plan) @unit TWh */
  phasedOutTwh: number;
  /**
   * Renewable electricity needed to replace the *useful* energy of what was
   * phased out @unit TWh
   */
  replacementTwh: number;
};

/** Summary of the transition in the final game year (2040). */
export type TransitionSummary = {
  /** Fossil energy phased out per year by 2040 @unit TWh */
  phasedOutTwh: number;
  /** Renewable electricity needed per year to replace the usefulness @unit TWh */
  replacementTwh: number;
  /** Number of 15 MW offshore wind turbines producing that electricity */
  turbines: number;
  /** Number of Norwegian households that electricity could power */
  households: number;
  /** Phased-out share of the 2040 baseline, in percent */
  phasedOutPercent: number;
};

/**
 * Computes the yearly energy series for a phase-out plan: how much fossil
 * energy disappears, and how much renewable electricity is needed to replace
 * its usefulness.
 */
export function transitionSeries(phaseOut: PhaseOutSchedule): TransitionYear[] {
  const baseline = totalProduction({});
  const plan = totalProduction(phaseOut);
  return gameData.gameYears.map((year) => {
    const baselineTwh =
      (baseline[year]?.totalProduction?.value || 0) * TWH_PER_MILL_SM3_OE;
    const planTwh =
      (plan[year]?.totalProduction?.value || 0) * TWH_PER_MILL_SM3_OE;
    const phasedOutTwh = Math.max(baselineTwh - planTwh, 0);
    return {
      year,
      baselineTwh: Math.round(baselineTwh),
      planTwh: Math.round(planTwh),
      phasedOutTwh: Math.round(phasedOutTwh),
      replacementTwh: Math.round(phasedOutTwh * USEFUL_ENERGY_FACTOR),
    };
  });
}

/**
 * Summarizes the transition in the final game year: what has been phased out,
 * and what it takes to replace it with renewable electricity.
 */
export function transitionSummary(
  phaseOut: PhaseOutSchedule,
): TransitionSummary {
  const series = transitionSeries(phaseOut);
  const last = series[series.length - 1];
  return {
    phasedOutTwh: last.phasedOutTwh,
    replacementTwh: last.replacementTwh,
    turbines: Math.round(last.replacementTwh / TWH_PER_TURBINE_YEAR),
    households: last.replacementTwh * HOUSEHOLDS_PER_TWH,
    phasedOutPercent:
      last.baselineTwh > 0
        ? Math.round((last.phasedOutTwh / last.baselineTwh) * 100)
        : 0,
  };
}

/**
 * A phase-out schedule that closes every field in a given year — used for the
 * "full utfasing" scenario in the transition view.
 */
export function fullPhaseOut(year: Year): PhaseOutSchedule {
  const schedule: PhaseOutSchedule = {};
  for (const field of gameData.allFields) schedule[field] = year;
  return schedule;
}
