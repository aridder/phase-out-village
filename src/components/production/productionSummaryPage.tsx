import React, { useContext } from "react";
import { YearlyTotalProductionChart } from "./yearlyTotalProductionChart";
import { ProductionReductionChart } from "./productionReductionChart";
import { ApplicationContext } from "../../applicationContext";

/**
 * Displays the main production summary page.
 * Contains:
 * - Yearly total production chart
 * - Production reduction chart
 */
export function ProductionSummaryPage() {
  const { phaseOut } = useContext(ApplicationContext);
  return (
    <div className="charts roomy">
      <div className="chart-frame">
        <YearlyTotalProductionChart />
      </div>
      <div className="chart-frame">
        <ProductionReductionChart phaseOut={phaseOut} />
      </div>
    </div>
  );
}
