import React, { useContext, useState } from "react";
import { ApplicationContext } from "../../applicationContext";
import { NavLink } from "react-router-dom";
import { LineChart, LineSeries } from "../charts/lineChart";
import { gameData, truncatedDataset, xyDataSeries } from "../../data/gameData";
import { ProductionTable } from "./productionTable";
import "./production.css";

/**
 * Page component that renders a line chart of oil production per field.
 * Allows clicking legend items to focus on a single field and displays a
 * table for that field.
 */
export function ProductionPerFieldPage() {
  const [visibleField, setVisibleField] = useState<string | undefined>();

  const { phaseOut } = useContext(ApplicationContext);

  // One series per field; when a field is focused the others are hidden
  const series: LineSeries[] = Object.entries(gameData.data).map(
    ([field, data]) => ({
      label: field,
      color: colorFromLabel(field),
      hidden: !!visibleField && field !== visibleField,
      spanGaps: true,
      points: xyDataSeries(
        truncatedDataset(data, phaseOut[field]),
        "productionOil",
      ).map((point) => ({
        x: Number(point.x),
        y: point.y,
        estimated: point.estimated,
      })),
    }),
  );

  return (
    <>
      <nav className="production-nav">
        <NavLink end to={"/production/"}>
          Din plan
        </NavLink>
        <NavLink to={"/production/composition"}>Inndeling produksjon</NavLink>
        <NavLink to={"/production/oilPerField"}>Produksjon per felt</NavLink>
      </nav>
      <div className="production-chart">
        <LineChart
          title="Produksjon per oljefelt"
          xLabel="År"
          yLabel="Produksjon (mill. Sm³)"
          xMin={2000}
          xMax={2040}
          tooltipMode="point"
          tooltipLabel={(s, point) =>
            `${s.label} – ${point.x}: ${point.y.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mill. Sm³ (${point.estimated ? "Estimert" : "Målt"})`
          }
          // Clicking a field focuses it; clicking the focused field shows all
          onLegendClick={(label) =>
            setVisibleField((current) =>
              current === label ? undefined : label,
            )
          }
          series={series}
        />

        {/* Show production table if a field is selected */}
        {visibleField && (
          <ProductionTable
            field={visibleField}
            dataseries={gameData.data[visibleField]}
          />
        )}
      </div>
    </>
  );
}

/**
 * Generates a deterministic HSL color from a string label.
 * Used for consistent coloring of fields in charts.
 *
 * @param label - The string to convert to a color
 * @returns HSL color string
 */
function colorFromLabel(label: string): string {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use hash to get hue (0–360), keep saturation and lightness constant
  const hue = Math.abs(hash) % 360;
  const saturation = 65; // %
  const lightness = 50; // %

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
