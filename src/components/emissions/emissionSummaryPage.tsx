import React, { useContext } from "react";
import { EmissionStackedBarChart } from "./emissionStackedBarChart";
import { EmissionIntensityChart } from "./emissionIntensityChart";
import { ApplicationContext } from "../../applicationContext";
import { PhaseOutSchedule } from "../../data/gameData";

export function EmissionSummaryPage({
  phaseOut,
}: {
  phaseOut: PhaseOutSchedule;
}) {
  const { year } = useContext(ApplicationContext);
  return (
    <div className="charts roomy">
      <div className="chart-frame">
        <EmissionStackedBarChart phaseOut={phaseOut} />
      </div>
      <div className="chart-frame">
        <EmissionIntensityChart year={year} phaseOut={phaseOut} />
      </div>
    </div>
  );
}
