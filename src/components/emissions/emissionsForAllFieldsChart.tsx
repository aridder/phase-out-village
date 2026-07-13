import React from "react";
import { LineChart, LinePoint } from "../charts/lineChart";
import {
  PhaseOutSchedule,
  totalProduction,
  xyDataSeries,
} from "../../data/gameData";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";

/** Years after the last measured data are projections and drawn dashed. */
const LAST_MEASURED_YEAR = 2022;

function toPoints(schedule?: PhaseOutSchedule): LinePoint[] {
  return xyDataSeries(totalProduction(schedule), "emission").map((point) => ({
    x: Number(point.x),
    y: point.y,
    estimated: Number(point.x) > LAST_MEASURED_YEAR,
  }));
}

/**
 * Line chart showing total annual emissions for all fields.
 *
 * @param props.phaseOut - Object describing phased-out fields.
 */
export function EmissionForAllFieldsChart({
  phaseOut,
}: {
  phaseOut: PhaseOutSchedule;
}) {
  const isSmallScreen = useIsSmallScreen();
  const formatY = (value: number) => {
    if (isSmallScreen) {
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)} M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`;
    }
    return value.toLocaleString("nb-NO");
  };

  return (
    <LineChart
      title="Totalt årlig utslipp fra alle oljefelt"
      xLabel="År"
      yLabel="Tonn Co2"
      formatY={formatY}
      tooltipLabel={(series, point) =>
        `${series.label}: ${point.y.toLocaleString("nb-NO")} tonn`
      }
      series={[
        {
          label: "Din plan",
          color: "var(--chart-plan)",
          fill: "var(--chart-plan)",
          points: toPoints(phaseOut),
        },
        {
          label: "Referanse (uten tiltak)",
          color: "var(--chart-referanse)",
          fill: "var(--chart-referanse)",
          points: toPoints(),
        },
      ]}
    />
  );
}
