import React, { useContext } from "react";
import { ApplicationContext } from "../../applicationContext";
import { LineChart, LinePoint } from "../charts/lineChart";
import {
  gameData,
  toTimeseries,
  truncatedDataset,
  yearsInRange,
} from "../../data/gameData";
import { DataField, DatasetForSingleField, Year } from "../../data/types";
import "./emissions.css";

function toPoints(
  dataset: DatasetForSingleField,
  field: DataField,
  years: Year[],
): LinePoint[] {
  return toTimeseries(dataset, field, years).map(
    ([year, value, estimated]) => ({
      x: Number(year),
      y: value,
      estimated: !!estimated,
    }),
  );
}

/**
 * Line chart showing annual emissions for a specific oil field.
 *
 * @param props.field - Name of the oil field.
 */
export function EmissionsForFieldChart({ field }: { field: string }) {
  const { phaseOut } = useContext(ApplicationContext);

  const fieldDataset = gameData.data[field];
  const years = yearsInRange(2012, 2040);

  return (
    <div className="field-emission-chart">
      <LineChart
        title={`Årlig utslipp fra ${field}`}
        yLabel="Tonn CO₂"
        tooltipLabel={(series, point) =>
          `${series.label}: ${point.y.toLocaleString("nb-NO")} tonn CO₂`
        }
        series={[
          {
            label: "Din plan",
            color: "var(--chart-plan)",
            fill: "var(--chart-plan)",
            points: toPoints(
              truncatedDataset(fieldDataset, phaseOut[field]),
              "emission",
              years,
            ),
          },
          {
            label: "Referanse",
            color: "var(--chart-referanse)",
            fill: "var(--chart-referanse)",
            fillOpacity: 0.15,
            points: toPoints(fieldDataset, "emission", years),
          },
        ]}
      />
    </div>
  );
}
