import React from "react";
import { BarChart } from "../charts/barChart";
import {
  gameData,
  numberSeries,
  PhaseOutSchedule,
  totalProduction,
} from "../../data/gameData";

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
  const userData = numberSeries(totalProduction(phaseOut), "emission");
  const reductionData = numberSeries(totalProduction(), "emission").map(
    (base, i) => Math.max((base ?? 0) - (userData[i] ?? 0), 0),
  );

  return (
    <BarChart
      title="Total årlig utslipp med reduksjon markert"
      categories={gameData.gameYears}
      xLabel="År"
      yLabel="CO₂-utslipp (mill. tonn)"
      formatY={(value) =>
        (value / 1_000_000).toLocaleString("nb-NO", {
          maximumFractionDigits: 0,
        })
      }
      tooltipLabel={(series, value) =>
        `${series.label}: ${(value / 1_000_000).toLocaleString("nb-NO", {
          maximumFractionDigits: 1,
        })} mill. tonn CO₂`
      }
      series={[
        {
          label: "Utfasingsplan",
          color: "var(--chart-plan)",
          values: userData,
        },
        {
          // Striped = avoided, same visual language as the production
          // chart's reduction segments; a solid fill here read as "more
          // emissions" when it means the opposite
          label: "Unngått utslipp",
          color: "var(--chart-plan)",
          striped: true,
          values: reductionData,
        },
      ]}
    />
  );
}
