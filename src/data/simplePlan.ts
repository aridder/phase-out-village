import { gameData, PhaseOutSchedule } from "./gameData";
import { computeFieldStats } from "../ai/fieldStats";
import { Year } from "./types";

/**
 * Builds a phase-out schedule from a single, understandable parameter: the
 * year the last field closes.
 *
 * Fields are ordered by emission intensity (dirtiest per barrel first) and
 * spread evenly from next year until the chosen end year — the same logic a
 * sensible plan would follow, without asking the user to know any field
 * names. With end year 2040 the result closely tracks MDG's plan.
 */
export function planForEndYear(endYear: number): PhaseOutSchedule {
  const startYear = gameData.gameYears[0];
  const first = Math.max(parseInt(startYear) + 1, 2026);
  const last = Math.max(first, endYear);
  const ordered = computeFieldStats().map((s) => s.field);

  const schedule: PhaseOutSchedule = {};
  ordered.forEach((field, index) => {
    const progress = ordered.length > 1 ? index / (ordered.length - 1) : 0;
    const year = Math.round(first + progress * (last - first));
    schedule[field] = String(Math.min(year, 2040)) as Year;
  });
  return schedule;
}
