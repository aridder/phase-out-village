import { Link } from "react-router-dom";
import { slugify } from "../../data/slugify";
import React from "react";
import { dataFieldRows } from "./exportData";
import { DataLegend } from "./dataLegend";
import { downloadCsv } from "./downloadCsv";
import { gameData, yearsInRange } from "../../data/gameData";

/**
 * Table showing data for a specific data field (productionOil, productionGas, emission)
 * and allows downloading that data as CSV.
 */
export function DataFieldTable({
  dataField,
}: {
  dataField: "productionOil" | "productionGas" | "emission";
}) {
  /** Downloads exactly the table below, as CSV */
  function handleExportClick() {
    downloadCsv(`oljespillet-${dataField}.csv`, dataFieldRows(dataField));
  }

  return (
    <>
      <div className="data-actions">
        <Link to={"/data"}>← Tilbake</Link>
        <button onClick={handleExportClick}>Last ned som CSV</button>
      </div>
      <DataLegend />
      <table border={1}>
        <thead>
          <tr>
            <th className="rowHeader">År</th>
            {Object.keys(gameData.data).map((field) => (
              <th key={field}>
                <Link to={`/data/${slugify(field)}`}>{field}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yearsInRange(2000, 2040).map((year) => (
            <tr key={year}>
              <th className="rowHeader">{year}</th>
              {Object.entries(gameData.data)
                .map(([field, values]) => ({
                  field,
                  data: values?.[year]?.[dataField] || undefined,
                }))
                .map(({ field, data }) => (
                  <td
                    key={field}
                    className={data?.estimate ? "estimate" : undefined}
                  >
                    {data?.value}
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
