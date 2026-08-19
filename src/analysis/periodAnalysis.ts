import {
  gameData,
  isPhasedOut,
  oilEquivalentToBarrel,
  OilfieldName,
  PhaseOutSchedule,
  totalProduction,
} from "../data/gameData";
import { Year } from "../data/types";
import { Period, PeriodLens } from "../data/periods";
import { STATE_NET_CASH_FLOW_BN_NOK } from "../data/petroleumEconomy";

/**
 * The numbers behind Act 2.
 *
 * Each period asks a different question, so each period needs a different
 * number to answer it. This module produces all four, plus the one piece of
 * feedback the old game never gave: what the best available choice would
 * have been, under the same constraint the player was actually under.
 *
 * Without that, a player has no way to tell a good round from a lucky one,
 * and nothing they learn in round 1 changes what they do in round 2.
 */

/** Rough share of the state's petroleum revenue a field carries in a year. */
function revenueShare(field: OilfieldName, year: Year): number {
  const shelf = totalProduction({}, [year])[year]?.totalProduction?.value ?? 0;
  const own = gameData.data[field]?.[year]?.totalProduction?.value ?? 0;
  return shelf > 0 ? own / shelf : 0;
}

/** What closing one field in a given year would do, from that year to 2040. */
export type FieldOutlook = {
  field: OilfieldName;
  /** Emissions never released because the field closed @unit tonnes CO₂e */
  avoidedEmission: number;
  /** Production given up @unit mill. Sm³ o.e. */
  forgoneProduction: number;
  /** State revenue given up, at today's prices @unit bn NOK */
  forgoneRevenueBnNok: number;
  /** Emissions per barrel at the moment of the decision @unit kg/barrel */
  intensity: number;
  /** The last year the field produces if left alone */
  lastProductionYear: Year | undefined;
  /** How many more years the field would have run */
  yearsRemaining: number;
  /** Emissions released during this period alone if left running @unit tonnes */
  emissionThisPeriod: number;
};

export function fieldOutlook(
  field: OilfieldName,
  fromYear: Year,
  toYear: Year,
): FieldOutlook {
  const dataset = gameData.data[field];
  const from = parseInt(fromYear);
  const to = parseInt(toYear);
  const years = gameData.gameYears.filter((y) => parseInt(y) >= from);

  const avoidedEmission = years.reduce(
    (sum, y) => sum + (dataset[y]?.emission?.value ?? 0),
    0,
  );
  const forgoneProduction = years.reduce(
    (sum, y) => sum + (dataset[y]?.totalProduction?.value ?? 0),
    0,
  );
  const forgoneRevenueBnNok = years.reduce(
    (sum, y) => sum + revenueShare(field, y) * STATE_NET_CASH_FLOW_BN_NOK,
    0,
  );
  const emissionThisPeriod = gameData.gameYears
    .filter((y) => parseInt(y) >= from && parseInt(y) <= to)
    .reduce((sum, y) => sum + (dataset[y]?.emission?.value ?? 0), 0);

  const producing = years.filter(
    (y) => (dataset[y]?.totalProduction?.value ?? 0) > 0,
  );
  const lastProductionYear = producing[producing.length - 1];

  return {
    field,
    avoidedEmission,
    forgoneProduction,
    forgoneRevenueBnNok,
    intensity: dataset[fromYear]?.emissionIntensity?.value ?? 0,
    lastProductionYear,
    yearsRemaining: lastProductionYear
      ? parseInt(lastProductionYear) - from + 1
      : 0,
    emissionThisPeriod,
  };
}

/** Every field still available to close at the start of a period. */
export function availableFields(
  phaseOut: PhaseOutSchedule,
  period: Period,
): FieldOutlook[] {
  return gameData.allFields
    .filter((field) => !phaseOut[field])
    .map((field) => fieldOutlook(field, period.fromYear, period.toYear))
    .filter((outlook) => outlook.forgoneProduction > 0)
    .sort((a, b) => b.avoidedEmission - a.avoidedEmission);
}

/**
 * How good a set of closures is, measured the way THIS period measures.
 *
 * Returned as a plain number plus the text needed to render it, so the
 * report does not have to know which lens it is showing.
 */
export type PeriodScore = {
  lens: PeriodLens;
  /** The measure itself */
  value: number;
  /** Formatted for display, e.g. "18,4" */
  display: string;
  unit: string;
  /** Higher is better for every lens, so comparisons read the same way */
  higherIsBetter: true;
};

export function scoreDecision(
  outlooks: FieldOutlook[],
  period: Period,
): PeriodScore {
  const emission = outlooks.reduce((s, o) => s + o.avoidedEmission, 0);
  const production = outlooks.reduce((s, o) => s + o.forgoneProduction, 0);
  const revenue = outlooks.reduce((s, o) => s + o.forgoneRevenueBnNok, 0);

  switch (period.lens) {
    case "economy": {
      // Thousand tonnes of CO₂ avoided per billion kroner given up
      const value = revenue > 0 ? emission / 1000 / revenue : 0;
      return {
        lens: period.lens,
        value,
        display: value.toLocaleString("nb-NO", { maximumFractionDigits: 0 }),
        unit: "kt CO₂ per mrd kr",
        higherIsBetter: true,
      };
    }
    case "additionality": {
      // Average number of years of emissions each closure actually removes
      const value =
        outlooks.length > 0
          ? outlooks.reduce((s, o) => s + o.yearsRemaining, 0) / outlooks.length
          : 0;
      return {
        lens: period.lens,
        value,
        display: value.toLocaleString("nb-NO", { maximumFractionDigits: 1 }),
        unit: "år med kutt per felt",
        higherIsBetter: true,
      };
    }
    case "legacy": {
      const value = emission / 1_000_000;
      return {
        lens: period.lens,
        value,
        display: value.toLocaleString("nb-NO", { maximumFractionDigits: 1 }),
        unit: "mill. tonn CO₂ unngått",
        higherIsBetter: true,
      };
    }
    default: {
      // Kilos of CO₂ avoided per barrel of production given up
      const barrels = production * oilEquivalentToBarrel * 1_000_000;
      const value = barrels > 0 ? (emission * 1000) / barrels : 0;
      return {
        lens: period.lens,
        value,
        display: value.toLocaleString("nb-NO", { maximumFractionDigits: 1 }),
        unit: "kg CO₂ per tapt fat",
        higherIsBetter: true,
      };
    }
  }
}

/**
 * The best score reachable this period, given the same capacity limit the
 * player had.
 *
 * Greedy rather than exhaustive: for every lens here the measure is a ratio
 * or an average over the chosen set, so picking the individually best
 * fields is either optimal or within a hair of it — and it runs instantly
 * on every render, which an exact search over 34 choose 10 would not.
 */
export function bestAvailable(
  phaseOut: PhaseOutSchedule,
  period: Period,
  count: number,
): { outlooks: FieldOutlook[]; score: PeriodScore } {
  const available = availableFields(phaseOut, period);
  const take = Math.min(count, available.length, period.capacity);

  const ranked = [...available].sort((a, b) => {
    switch (period.lens) {
      case "economy":
        return (
          b.avoidedEmission / Math.max(b.forgoneRevenueBnNok, 0.001) -
          a.avoidedEmission / Math.max(a.forgoneRevenueBnNok, 0.001)
        );
      case "additionality":
        return b.yearsRemaining - a.yearsRemaining;
      case "legacy":
        return b.avoidedEmission - a.avoidedEmission;
      default:
        return (
          b.avoidedEmission / Math.max(b.forgoneProduction, 0.001) -
          a.avoidedEmission / Math.max(a.forgoneProduction, 0.001)
        );
    }
  });

  const outlooks = ranked.slice(0, take);
  return { outlooks, score: scoreDecision(outlooks, period) };
}

/**
 * What leaving the remaining fields running costs during the NEXT period.
 *
 * This is the number that makes an early period worth more than a late one,
 * and the old game never showed it anywhere.
 *
 * @unit tonnes CO₂e
 */
export function costOfWaiting(
  phaseOut: PhaseOutSchedule,
  nextPeriod: Period,
): number {
  return gameData.allFields
    .filter((field) => !isPhasedOut(field, phaseOut, nextPeriod.fromYear))
    .filter((field) => !phaseOut[field])
    .reduce(
      (sum, field) =>
        sum +
        fieldOutlook(field, nextPeriod.fromYear, nextPeriod.toYear)
          .emissionThisPeriod,
      0,
    );
}

/** Share of the shelf's 2025 production that has been given an end date. */
export function scheduledShare(phaseOut: PhaseOutSchedule): number {
  const first = gameData.gameYears[0];
  const total =
    totalProduction({}, [first])[first]?.totalProduction?.value ?? 0;
  if (total === 0) return 0;
  const scheduled = gameData.allFields
    .filter((field) => phaseOut[field])
    .reduce(
      (sum, field) =>
        sum + (gameData.data[field]?.[first]?.totalProduction?.value ?? 0),
      0,
    );
  return scheduled / total;
}
