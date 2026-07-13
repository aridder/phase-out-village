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

  // Dynamic x range: with a hardcoded 100 the biggest fields (Johan
  // Sverdrup, Troll produce > 100M barrels) silently vanished from a chart
  // that claims to show all fields
  const xMax =
    Math.ceil(Math.max(100, ...points.map((point) => point.x)) / 50) * 50;

  return (
    <ScatterChart
      title={`Utslippsintensitet vs produksjon i ${year}`}
      points={points}
      xMax={xMax}
      yMax={100}
      xLabel="Millioner fat produsert"
      yLabel="Utslippsintensitet (kg CO₂e per fat)"
      legend={[
        { label: "I drift", color: "var(--chart-plan)" },
        { label: "Avviklet i planen", color: "var(--chart-avviklet)" },
      ]}
      tooltipLabel={(point) => {
        const phasedOut = point.label in phaseOut;
        const production = Math.round(point.x).toLocaleString("nb-NO");
        return `${point.label}${phasedOut ? " (Avviklet)" : ""}: ${point.y.toFixed(1).replace(".", ",")} kg/fat${phasedOut ? "" : `, ${production} mill. fat`}`;
      }}
      annotation={{
        yMin: 15,
        yMax: 20,
        label: "Verdensgjennomsnitt",
        fill: "rgba(255, 165, 0, 0.25)",
        stroke: "orange",
      }}
    />
  );
}
