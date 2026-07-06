import React, { Dispatch, SetStateAction } from "react";
import { Year } from "./data/types";
import { PhaseOutSchedule } from "./data/gameData";

/**
 * The decision the player just committed: which fields were retired in
 * which period. Written by commitDraft() and read by the period report.
 */
export type PeriodDecision = {
  /** The round that was just played (1-based) */
  round: number;
  /** First year of the period the decision was made for */
  fromYear: Year;
  /** Last year of the period / first year of the next */
  toYear: number;
  /** Fields given an end date this period */
  fields: string[];
};

/**
 * React context holding the global state of the application.
 *
 * Provides:
 * - `year`: the current in-game year
 * - `proceed()`: advance to the next period
 * - `commitDraft()`: retire the drafted fields, advance, and go to the
 *   period report (or the summary after the final round)
 * - `restart()`: reset the simulation
 * - `phaseOut` / `setPhaseOut`: current committed phase-out schedule
 * - `phaseOutDraft` / `setPhaseOutDraft`: draft selections not yet committed
 * - `lastDecision`: what the player committed most recently (for the report)
 * - `getCurrentRound()`: current round index (1-based)
 * - `getTotalRounds()`: total number of simulation rounds
 * - `startYear`, `endYear`, `yearStep`: configuration for the simulation timeline
 */
export const ApplicationContext = React.createContext<{
  year: Year;
  proceed(): void;
  commitDraft(): void;
  restart(): void;
  phaseOut: PhaseOutSchedule;
  setPhaseOut: Dispatch<SetStateAction<PhaseOutSchedule>>;
  /** Draft phase-out selections for the current period (not yet committed) */
  phaseOutDraft: PhaseOutSchedule;
  setPhaseOutDraft: Dispatch<SetStateAction<PhaseOutSchedule>>;
  /** The most recently committed period decision, if any */
  lastDecision: PeriodDecision | null;
  /** Returns the current simulation round (1-based) */
  getCurrentRound(): number;
  /** Returns the total number of simulation rounds */
  getTotalRounds(): number;
  /** Starting year of the simulation */
  startYear: number;
  /** Ending year of the simulation */
  endYear: number;
  /** Step in years between simulation periods */
  yearStep: number;
  getEndOfTermYear(): number;
}>({
  // Default context values
  year: "2025",
  proceed: () => {},
  commitDraft: () => {},
  restart: () => {},
  phaseOut: {},
  setPhaseOut: () => {},
  phaseOutDraft: {},
  setPhaseOutDraft: () => {},
  lastDecision: null,
  getCurrentRound: () => 1,
  getTotalRounds: () => 5,
  startYear: 2025,
  endYear: 2040,
  yearStep: 4,
  getEndOfTermYear: () => 2028,
});
