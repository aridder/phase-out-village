import { gameData, PhaseOutSchedule, totalProduction } from "./gameData";
import { Year } from "./types";

/**
 * Energy conversion factors for the transition view.
 *
 * All factors are rounded, well-known approximations intended for
 * communication, not energy accounting:
 *
 * - 1 Sm³ of oil equivalent contains roughly 10 MWh of chemical energy,
 *   so 1 mill. Sm³ o.e. ≈ 10 TWh. (Norway's ~246 mill. Sm³ o.e. annual
 *   production ≈ 2 460 TWh, the commonly cited figure.)
 * - A modern 15 MW offshore wind turbine produces ~60 GWh per year
 *   (≈45% capacity factor).
 * - An average Norwegian household used ~14 700 kWh of electricity in 2024
 *   (SSB) — we round to 15 000, so 1 TWh powers ~66 000 households.
 *
 * On the useful-energy factor, see {@link usefulEnergyScenarios}.
 */
export const TWH_PER_MILL_SM3_OE = 10;

/**
 * How much renewable electricity it takes to replace the *usefulness* of a
 * unit of fossil energy.
 *
 * This app used to state a single figure — 0.35 — and apply it to all
 * fossil energy. That number is right for a petrol engine and wrong for
 * almost everything else: a gas boiler delivers about 90 % of the energy in
 * the gas as heat, a modern gas power station about 55 %, and gas used as
 * feedstock for plastics or fertiliser is not being burned for energy at
 * all. Anyone who works in the industry spots that in seconds, and then
 * has no reason to believe the rest of the numbers either.
 *
 * So the factor is a choice the reader makes, not a fact we assert. The
 * scenarios below bracket the honest range, and every screen that uses one
 * says which it used.
 */
export type UsefulEnergyScenario = {
  key: "drivstoff" | "blandet" | "varme";
  label: string;
  /** Renewable TWh needed per fossil TWh replaced */
  factor: number;
  /** What this assumption means, in one sentence */
  explainer: string;
};

export const usefulEnergyScenarios: UsefulEnergyScenario[] = [
  {
    key: "drivstoff",
    label: "Alt til drivstoff",
    factor: 0.35,
    explainer:
      "Som om all oljen og gassen ble brent i motorer. Der går rundt to tredjedeler bort som spillvarme, så erstatningen blir liten.",
  },
  {
    key: "blandet",
    label: "Blandet bruk",
    factor: 0.55,
    explainer:
      "Omtrent slik Europa faktisk bruker den i dag: en blanding av drivstoff, kraftproduksjon, oppvarming og råstoff til industri.",
  },
  {
    key: "varme",
    label: "Alt til varme og råstoff",
    factor: 0.9,
    explainer:
      "Som om alt ble brukt der fossil energi utnyttes best – gasskjeler og industriråstoff. Da må nesten hver TWh erstattes én til én.",
  },
];

/** The assumption used where the reader has not chosen one. */
export const DEFAULT_USEFUL_ENERGY_SCENARIO = usefulEnergyScenarios[1];

/** Kept as a named constant so the sources block can cite the default. */
export const USEFUL_ENERGY_FACTOR = DEFAULT_USEFUL_ENERGY_SCENARIO.factor;
export const TWH_PER_TURBINE_YEAR = 0.06;
export const KWH_PER_HOUSEHOLD_YEAR = 15_000;
export const HOUSEHOLDS_PER_TWH = Math.round(
  1_000_000_000 / KWH_PER_HOUSEHOLD_YEAR,
);

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
export function transitionSeries(
  phaseOut: PhaseOutSchedule,
  usefulEnergyFactor: number = USEFUL_ENERGY_FACTOR,
): TransitionYear[] {
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
      replacementTwh: Math.round(phasedOutTwh * usefulEnergyFactor),
    };
  });
}

/**
 * Summarizes the transition in the final game year: what has been phased out,
 * and what it takes to replace it with renewable electricity.
 */
export function transitionSummary(
  phaseOut: PhaseOutSchedule,
  usefulEnergyFactor: number = USEFUL_ENERGY_FACTOR,
): TransitionSummary {
  const series = transitionSeries(phaseOut, usefulEnergyFactor);
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
