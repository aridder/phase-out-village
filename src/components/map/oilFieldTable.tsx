import React from "react";
import { slugify } from "../../data/slugify";
import { oilFieldRows } from "../dataView/exportData";
import { downloadCsv } from "../dataView/downloadCsv";
import { DataLegend } from "../dataView/dataLegend";
import { gameData } from "../../data/gameData";

/**
 * Component that renders a table with yearly data for a specific oil field.
 * Includes columns for oil production, gas production, emissions, and emission intensity.
 * Provides a button to download the table as CSV.
 */
export function OilFieldTable({ field }: { field: string }) {
  /** Downloads this field's yearly numbers as CSV */
  function handleExportClick() {
    downloadCsv(`oljespillet-${slugify(field)}.csv`, oilFieldRows(field));
  }

  return (
    <div>
      <div className="data-actions">
        <button onClick={handleExportClick}>Last ned som CSV</button>
      </div>
      <DataLegend />
      <table border={1}>
        <thead>
          <tr>
            <th>År</th>
            <th>Olje</th>
            <th>Gass</th>
            <th>Utslipp</th>
            <th>Utslippsintensitet</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(gameData.data[field]).map(([year, fieldValues]) => (
            <tr key={year}>
              <th>{year}</th>
              {(
                [
                  "productionOil",
                  "productionGas",
                  "emission",
                  "emissionIntensity",
                ] as const
              )
                .map((dataField) => ({
                  dataField,
                  data: fieldValues[dataField] || undefined,
                }))
                .map(({ dataField, data }) => (
                  <td
                    key={dataField}
                    className={data?.estimate ? "estimate" : undefined}
                  >
                    {data?.value}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
