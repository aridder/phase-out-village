import React, { useContext } from "react";
import { ApplicationContext } from "../../applicationContext";
import { BarChart } from "../charts/barChart";
import {
  gameData,
  toTimeseries,
  truncatedDataset,
  yearsInRange,
} from "../../data/gameData";
import { DataField, DatasetForSingleField, Year } from "../../data/types";
import "./production.css";

/** Values for the given years, looked up from a timeseries. */
function valuesForYears(
  dataset: DatasetForSingleField,
  field: DataField,
  years: Year[],
): (number | undefined)[] {
  const byYear = new Map(
    toTimeseries(dataset, field).map(([year, value]) => [year, value]),
  );
  return years.map((year) => byYear.get(year));
}

/**
 * Bar chart showing combined oil/condensate production and gas exports for a specific oil field,
 * including reductions compared to baseline production.
 *
 * @param props.field - The name of the oil field to display production data for.
 */
export function CombinedProductionForFieldChart({ field }: { field: string }) {
  const { phaseOut } = useContext(ApplicationContext);

  const dataset = gameData.data[field];
  const truncated = truncatedDataset(dataset, phaseOut[field]);

  // First year with any production data, so the chart skips the empty years
  const firstYear = Math.min(
    ...toTimeseries(dataset, "productionOil")
      .concat(toTimeseries(dataset, "productionGas"))
      .filter(([, value]) => value != null)
      .map(([year]) => Number(year)),
  );
  const years = yearsInRange(
    Number.isFinite(firstYear) ? firstYear : 2000,
    2040,
  );

  const planOil = valuesForYears(truncated, "productionOil", years);
  const planGas = valuesForYears(truncated, "productionGas", years);
  const baselineOil = valuesForYears(dataset, "productionOil", years);
  const baselineGas = valuesForYears(dataset, "productionGas", years);

  // The striped segments visualize what the phase-out removes
  const reductionOil = years.map((_, i) =>
    Math.max((baselineOil[i] ?? 0) - (planOil[i] ?? 0), 0),
  );
  const reductionGas = years.map((_, i) =>
    Math.max((baselineGas[i] ?? 0) - (planGas[i] ?? 0), 0),
  );

  return (
    <div className="field-production-chart">
      <BarChart
        title={`Årlig totalproduksjon fra ${field}`}
        categories={years}
        formatY={(value) =>
          value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })
        }
        yLabel="Mill. Sm³"
        tooltipLabel={(series, value) =>
          `${series.label}: ${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} mill. Sm³`
        }
        series={[
          {
            label: "Olje/Væskeproduksjon",
            color: "var(--chart-olje)",
            values: planOil,
          },
          {
            label: "Reduksjon Olje/Væske",
            color: "var(--chart-olje)",
            striped: true,
            values: reductionOil,
          },
          {
            label: "Gasseksport",
            color: "var(--chart-gass)",
            values: planGas,
          },
          {
            label: "Reduksjon Gass",
            color: "var(--chart-gass)",
            striped: true,
            values: reductionGas,
          },
        ]}
      />
    </div>
  );
}
