import React from "react";
import { BarChart } from "../charts/barChart";
import {
  gameData,
  numberSeries,
  PhaseOutSchedule,
  totalProduction,
} from "../../data/gameData";

/**
 * Displays a stacked bar chart showing total production and reduction per year for all fields.
 * - Shows remaining oil and gas production from the user's plan.
 * - Shows reduction compared to baseline production.
 *
 * @param phaseOut - The phase-out schedule to calculate user plan reductions.
 */
export function ProductionReductionChart({
  phaseOut,
}: {
  phaseOut: PhaseOutSchedule;
}) {
  const userPlan = totalProduction(phaseOut); // User's plan production
  const baseline = totalProduction(); // Baseline production without any reductions

  // Extract numerical series for oil and gas from user plan
  const remainingOil = numberSeries(userPlan, "productionOil");
  const remainingGas = numberSeries(userPlan, "productionGas");

  // Calculate reductions compared to baseline
  const reductionOil = numberSeries(baseline, "productionOil").map((base, i) =>
    Math.max((base ?? 0) - (remainingOil[i] ?? 0), 0),
  );
  const reductionGas = numberSeries(baseline, "productionGas").map((base, i) =>
    Math.max((base ?? 0) - (remainingGas[i] ?? 0), 0),
  );

  return (
    <BarChart
      title="Total produksjon fra alle felter"
      categories={gameData.gameYears}
      xLabel="År"
      yLabel="Mill. Sm³ o.e."
      tooltipLabel={(series, value) =>
        `${series.label}: ${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mill. Sm³`
      }
      series={[
        {
          label: "Gjenværende oljeprod.",
          color: "var(--chart-olje)",
          values: remainingOil,
        },
        {
          label: "Gjenværende gasseksport",
          color: "var(--chart-gass)",
          values: remainingGas,
        },
        {
          label: "Reduksjon olje",
          color: "var(--chart-olje)",
          striped: true,
          values: reductionOil,
        },
        {
          label: "Reduksjon gass",
          color: "var(--chart-gass)",
          striped: true,
          values: reductionGas,
        },
      ]}
    />
  );
}
