import React from "react";
import { ScatterChart } from "../charts/scatterChart";
import { Year } from "../../data/types";
import {
  gameData,
  isPhasedOut,
  oilEquivalentToBarrel,
  PhaseOutSchedule,
} from "../../data/gameData";

/**
 * Scatter chart showing emission intensity versus production for all fields in a given year.
 *
 * @param props.year - The year to display data for.
 * @param props.phaseOut - Object describing which fields are phased out and when.
 */
export function EmissionIntensityChart({
  phaseOut,
  year,
}: {
  year: Year;
  phaseOut: PhaseOutSchedule;
}) {
  const points = Object.entries(gameData.data)
    .filter(([, data]) => data?.[year]?.totalProduction)
    .map(([field, data]) => ({
      label: field,
      x: data[year]!.totalProduction!.value * oilEquivalentToBarrel,
      y: data[year]?.emissionIntensity?.value,
      color: isPhasedOut(field, phaseOut, year)
        ? "var(--chart-avviklet)"
        : "var(--chart-plan)",
    }));

  return (
    <ScatterChart
      title={`Utslippsintensitet vs Produksjon i ${year}`}
      points={points}
      xMax={100}
      yMax={100}
      xLabel="Millioner fat produsert"
      yLabel="Utslippsintensitet (kg CO2e/BOE)"
      tooltipLabel={(point) => {
        const phasedOut = point.label in phaseOut;
        const production = Math.round(point.x).toLocaleString("nb-NO");
        return `${point.label}${phasedOut ? " (Avviklet)" : ""}: ${point.y.toFixed(1)} kg/BOE${phasedOut ? "" : `, ${production}M fat`}`;
      }}
      annotation={{
        yMin: 15,
        yMax: 20,
        label: "Verdensgjennomsnitt",
        fill: "rgba(199, 116, 0, 0.18)",
        stroke: "var(--chart-referanse)",
      }}
    />
  );
}
