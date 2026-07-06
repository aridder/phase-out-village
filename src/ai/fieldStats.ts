import {
  gameData,
  oilEquivalentToBarrel,
  OilfieldName,
  PhaseOutSchedule,
} from "../data/gameData";
import { Year } from "../data/types";

/**
 * Aggregated statistics for a single oil field over the game years (2025–2040).
 *
 * Used by the AI advisor and the plan optimizer to reason about which fields
 * contribute most to emissions relative to their production.
 */
export type FieldStat = {
  field: OilfieldName;
  /** Cumulative projected emissions 2025–2040 without phase-out @unit tCO₂e */
  totalEmission: number;
  /** Cumulative projected production 2025–2040 without phase-out @unit mill. Sm³ o.e. */
  totalProduction: number;
  /** Average projected emission intensity @unit kg CO₂e per barrel o.e. */
  avgIntensity: number;
  /** The last year the field has projected production (may be before 2040) */
  lastProductionYear: Year | undefined;
};

/**
 * Returns the cumulative emissions for a field from a given year (inclusive)
 * through 2040, i.e. the emissions that would be avoided by phasing the field
 * out in that year.
 *
 * @unit tCO₂e
 */
export function emissionsFromYear(field: OilfieldName, fromYear: Year): number {
  const dataset = gameData.data[field];
  return gameData.gameYears
    .filter((year) => parseInt(year) >= parseInt(fromYear))
    .map((year) => dataset[year]?.emission?.value || 0)
    .reduce((a, b) => a + b, 0);
}

/**
 * Returns the cumulative production for a field from a given year (inclusive)
 * through 2040, i.e. the production that would be forgone by phasing the
 * field out in that year.
 *
 * @unit mill. Sm³ o.e.
 */
export function productionFromYear(
  field: OilfieldName,
  fromYear: Year,
): number {
  const dataset = gameData.data[field];
  return gameData.gameYears
    .filter((year) => parseInt(year) >= parseInt(fromYear))
    .map((year) => dataset[year]?.totalProduction?.value || 0)
    .reduce((a, b) => a + b, 0);
}

/**
 * Computes aggregated statistics for every oil field over the game years.
 *
 * The result is sorted by average emission intensity (dirtiest first), so the
 * first entries are the fields with the worst climate footprint per barrel.
 */
export function computeFieldStats(): FieldStat[] {
  const firstGameYear = gameData.gameYears[0];
  return gameData.allFields
    .map((field) => {
      const dataset = gameData.data[field];
      const totalEmission = emissionsFromYear(field, firstGameYear);
      const totalProduction = productionFromYear(field, firstGameYear);
      const avgIntensity =
        totalProduction > 0
          ? (totalEmission * 1000) /
            (totalProduction * oilEquivalentToBarrel * 1_000_000)
          : 0;
      const productionYears = gameData.gameYears.filter(
        (year) => (dataset[year]?.totalProduction?.value || 0) > 0,
      );
      return {
        field,
        totalEmission,
        totalProduction,
        avgIntensity: Math.round(avgIntensity * 100) / 100,
        lastProductionYear: productionYears[productionYears.length - 1],
      };
    })
    .filter((stat) => stat.totalProduction > 0 || stat.totalEmission > 0)
    .sort((a, b) => b.avgIntensity - a.avgIntensity);
}

/**
 * Cumulative emissions 2025–2040 for the whole shelf under a given phase-out
 * schedule.
 *
 * @unit tCO₂e
 */
export function cumulativeEmissions(phaseOut: PhaseOutSchedule): number {
  return computeFieldStats()
    .map((stat) => {
      const phaseOutYear = phaseOut[stat.field];
      if (!phaseOutYear) return stat.totalEmission;
      return stat.totalEmission - emissionsFromYear(stat.field, phaseOutYear);
    })
    .reduce((a, b) => a + b, 0);
}
