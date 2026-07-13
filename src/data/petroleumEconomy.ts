import { PhaseOutSchedule } from "./gameData";
import { energyData } from "../generated/energyData";
import { transitionSeries } from "./energyTransition";

/**
 * Anchors for the money story that are not available through open APIs.
 * Every figure carries the year it belongs to, and the sources block in the
 * UI (sourcesNote.tsx) cites where each one comes from:
 *
 * - The state's net cash flow from petroleum (taxes, SDFI, dividends) was
 *   ~664 bn NOK in 2025; the 2026 national budget estimates ~686 bn
 *   (regjeringen.no / Norsk Petroleum).
 * - Norwegian seafood exports set a record of 181.5 bn NOK in 2025
 *   (Norges sjømatråd) — used as a "how much new industry is that?"
 *   yardstick.
 * - The structural non-oil deficit (the fund withdrawal) in the 2026
 *   national budget is 579.4 bn NOK.
 * - Norway has ~5.6 million inhabitants (SSB, 2026).
 */
export const STATE_NET_CASH_FLOW_BN_NOK = 664;
export const SEAFOOD_EXPORT_BN_NOK = 181.5;
export const FUND_WITHDRAWAL_BN_NOK = 579;
export const POPULATION_MILLIONS = 5.6;
/**
 * Total expenses in the national budget for 2026: 2 201 bn NOK including
 * the petroleum sector's expenses (2 164 bn without), rounded to 2 200.
 * (This constant used to say 2 900 — that figure was simply wrong, and it
 * made the headline "X statsbudsjett" undercount by a third.)
 */
export const STATE_BUDGET_BN_NOK = 2200;
/**
 * The defence budget 2026: ~112 bn NOK excluding the Ukraine support
 * (~180 bn including the Nansen programme)
 */
export const DEFENSE_BUDGET_BN_NOK = 112;

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
  /**
   * Total state revenue forgone by the plan over the whole game period
   * 2025–2040, at today's prices @unit bn NOK
   */
  cumulativeLostStateRevenueBnNok: number;
  /** The cumulative loss measured in national budgets (~2 200 bn) */
  stateBudgetMultiple: number;
  /** The 2040 annual loss measured in defence budgets (~112 bn/year) */
  defenseBudgetMultiple: number;
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

  // Sum the plan's yearly production share loss over the whole period —
  // the plan removes little early on and more toward 2040
  const cumulativeLostStateRevenueBnNok = Math.round(
    series
      .map((s) => Math.max(0, (s.baselineTwh - s.planTwh) / today))
      .reduce((sum, share) => sum + share * STATE_NET_CASH_FLOW_BN_NOK, 0),
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
    cumulativeLostStateRevenueBnNok,
    stateBudgetMultiple:
      Math.round((cumulativeLostStateRevenueBnNok / STATE_BUDGET_BN_NOK) * 10) /
      10,
    defenseBudgetMultiple:
      Math.round((lostStateRevenueBnNok / DEFENSE_BUDGET_BN_NOK) * 10) / 10,
  };
}
