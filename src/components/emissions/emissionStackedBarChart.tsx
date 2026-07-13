import React from "react";
import { BarChart } from "../charts/barChart";
import {
  gameData,
  numberSeries,
  PhaseOutSchedule,
  totalProduction,
} from "../../data/gameData";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";

/**
 * Stacked bar chart showing total annual emissions and reductions.
 *
 * @param props.phaseOut - Object describing phased-out fields.
 */
export function EmissionStackedBarChart({
  phaseOut,
}: {
  phaseOut: PhaseOutSchedule;
}) {
  const isSmallScreen = useIsSmallScreen();

  const userData = numberSeries(totalProduction(phaseOut), "emission");
  const reductionData = numberSeries(totalProduction(), "emission").map(
    (base, i) => Math.max((base ?? 0) - (userData[i] ?? 0), 0),
  );

  return (
    <BarChart
      title="Total årlig utslipp med reduksjon markert"
      categories={gameData.gameYears}
      xLabel="År"
      yLabel="CO₂-utslipp (tonn)"
      formatY={(value) =>
        isSmallScreen
          ? `${(value / 1_000_000).toFixed(0)}M`
          : value.toLocaleString("nb-NO")
      }
      tooltipLabel={(series, value) =>
        `${series.label}: ${value.toLocaleString("nb-NO")} tonn`
      }
      series={[
        {
          label: "Utfasingsplan",
          color: "var(--chart-plan)",
          values: userData,
        },
        {
          label: "Reduksjon",
          color: "var(--chart-reduksjon)",
          fillOpacity: 0.3,
          stroke: "var(--chart-reduksjon)",
          values: reductionData,
        },
      ]}
    />
  );
}
