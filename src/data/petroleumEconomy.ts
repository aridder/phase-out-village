import { PhaseOutSchedule } from "./gameData";
import { energyData } from "../generated/energyData";
import { transitionSeries } from "./energyTransition";

/**
 * Anchors for the money story that are not available through open APIs.
 * All figures are rounded approximations for communicating magnitude:
 *
 * - The state's net cash flow from petroleum (taxes, SDFI, dividends) was
 *   ~661 bn NOK in 2024 (Norsk Petroleum / the national budget).
 * - Norwegian seafood exports were ~175 bn NOK in 2024 (Norges sjømatråd) —
 *   the largest export industry after oil, gas and electricity-intensive
 *   goods, used as a "how much new industry is that?" yardstick.
 * - The structural withdrawal from the sovereign wealth fund in the state
 *   budget is ~460 bn NOK (2025).
 * - Norway has ~5.6 million inhabitants.
 */
export const STATE_NET_CASH_FLOW_BN_NOK = 661;
export const SEAFOOD_EXPORT_BN_NOK = 175;
export const FUND_WITHDRAWAL_BN_NOK = 460;
export const POPULATION_MILLIONS = 5.6;

export type EconomySummary = {
  /** Today's petroleum export value @unit bn NOK/year */
  petroleumExportValueBnNok: number;
  /** Today's state net cash flow from petroleum @unit bn NOK/year */
  stateRevenueBnNok: number;
  /**
   * Share of today's production that disappears by 2040 from natural decline
   * alone, without any phase-out (0–1)
   */
  naturalDeclineShare: number;
  /**
   * Additional share of today's production removed by the plan in 2040,
   * beyond the natural decline (0–1)
   */
  planShare: number;
  /** Export value the plan forgoes in 2040, at today's prices @unit bn NOK/year */
  lostExportValueBnNok: number;
  /** State revenue the plan forgoes in 2040, at today's prices @unit bn NOK/year */
  lostStateRevenueBnNok: number;
  /** Lost state revenue per inhabitant per year @unit NOK */
  perCapitaKr: number;
  /** Lost export value measured in units of the seafood export industry */
  seafoodMultiple: number;
  /** Lost state revenue as share of the annual fund withdrawal, in percent */
  fundWithdrawalPercent: number;
};

/**
 * Estimates what a phase-out plan means in kroner: how much annual export
 * value and state petroleum revenue is gone by 2040, measured at today's
 * prices and value-per-produced-unit.
 *
 * The estimate deliberately separates the plan's effect from the natural
 * decline: production (and therefore revenue) falls substantially by 2040
 * even without any phase-out, and the message should not credit or blame
 * the plan for that part.
 */
export function economySummary(phaseOut: PhaseOutSchedule): EconomySummary {
  const series = transitionSeries(phaseOut);
  const today = series[0]?.baselineTwh || 1;
  const last = series[series.length - 1];

  const naturalDeclineShare = Math.max(0, (today - last.baselineTwh) / today);
  const planShare = Math.max(0, (last.baselineTwh - last.planTwh) / today);

  const exportValue = energyData.trade.petroleumExportValueBnNok;
  const lostExportValueBnNok = Math.round(exportValue * planShare);
  const lostStateRevenueBnNok = Math.round(
    STATE_NET_CASH_FLOW_BN_NOK * planShare,
  );

  return {
    petroleumExportValueBnNok: exportValue,
    stateRevenueBnNok: STATE_NET_CASH_FLOW_BN_NOK,
    naturalDeclineShare,
    planShare,
    lostExportValueBnNok,
    lostStateRevenueBnNok,
    perCapitaKr:
      Math.round((lostStateRevenueBnNok * 1_000) / POPULATION_MILLIONS / 100) *
      100,
    seafoodMultiple:
      Math.round((lostExportValueBnNok / SEAFOOD_EXPORT_BN_NOK) * 10) / 10,
    fundWithdrawalPercent: Math.round(
      (lostStateRevenueBnNok / FUND_WITHDRAWAL_BN_NOK) * 100,
    ),
  };
}
