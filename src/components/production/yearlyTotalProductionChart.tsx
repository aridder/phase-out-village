import React, { useContext } from "react";
import { BarChart } from "../charts/barChart";
import { ApplicationContext } from "../../applicationContext";
import { numberSeries, totalProduction } from "../../data/gameData";
import { Year } from "../../data/types";

/**
 * Renders a stacked bar chart showing yearly total oil and gas production.
 * Uses the phase-out plan from context.
 */
export function YearlyTotalProductionChart() {
  const { phaseOut } = useContext(ApplicationContext);

  // Calculate total production (oil and gas) per year based on the phase-out schedule
  const production = totalProduction(phaseOut);
  const years = Object.keys(production) as Year[];

  return (
    <BarChart
      title="Inndeling av olje og gass"
      categories={years}
      xLabel="År"
      yLabel="Millioner Sm3 o.e."
      series={[
        {
          label: "Olje/væskeproduksjon",
          color: "var(--chart-olje)",
          values: numberSeries(production, "productionOil"),
        },
        {
          label: "Gasseksport",
          color: "var(--chart-gass)",
          values: numberSeries(production, "productionGas"),
        },
      ]}
    />
  );
}
