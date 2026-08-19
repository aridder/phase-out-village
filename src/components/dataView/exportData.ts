import { gameData } from "../../data/gameData";
import { fromEntries } from "../../data/fromEntries";

/**
 * Converts a single data field (oil production, gas production, or emission) for all oil fields
 * into rows for CSV export.
 *
 * @param dataField - The field to export. Must be one of:
 *   - `"productionOil"`: Oil production
 *   - `"productionGas"`: Gas production
 *   - `"emission"`: CO2e emissions
 *
 * @returns An array of objects, each representing one year of data.
 * Each object has the following properties:
 *   - `År`: The year (string)
 *   - One property for each oil field, containing the value for the given dataField that year
 *     (or `undefined` if missing)
 *
 * @example
 * ```ts
 * dataFieldRows("productionOil");
 * // [
 * //   { År: "2025", Ekofisk: 500, Oseberg: 320, ... },
 * //   { År: "2026", Ekofisk: 510, Oseberg: 315, ... },
 * //   ...
 * // ]
 * ```
 */
export function dataFieldRows(
  dataField: "productionOil" | "productionGas" | "emission",
) {
  // Map over all years in the dataset
  return gameData.allYears.map((year) => ({
    År: year, // Set the year property

    // Use fromEntries to construct an object with all oil fields for this year
    ...fromEntries(
      // Iterate over each oil field and its dataset
      Object.entries(gameData.data).map(([field, data]) => [
        field, // Key: oil field name

        // Value: the selected dataField for this year, or undefined if missing
        data?.[year]?.[dataField]?.value || undefined,
      ]),
    ),
  }));
}

/**
 * Converts the data of a single oil field into rows for CSV export.
 *
 * @param field - The name of the oil field to export.
 * @returns An array of objects, each representing a year of data for the given field.
 * Each object has the following properties:
 *   - `year`: The year as a string (e.g., "2025")
 *   - `Olje`: Oil production for that year (or `undefined` if missing)
 *   - `Gass`: Gas production for that year (or `undefined` if missing)
 *   - `Utslipp`: Emissions for that year (or `undefined` if missing)
 *   - `Utslippsintensitet`: Emission intensity for that year (or `undefined` if missing)
 *
 * @example
 * ```ts
 * oilFieldRows("Ekofisk");
 * // [
 * //   { year: "2025", Olje: 500, Gass: 1200, Utslipp: 300, Utslippsintensitet: 15 },
 * //   { year: "2026", Olje: 510, Gass: 1180, Utslipp: 290, Utslippsintensitet: 14.8 },
 * //   ...
 * // ]
 * ```
 */
export function oilFieldRows(field: string) {
  // Convert the object of yearly data into an array of [year, data] pairs
  return Object.entries(gameData.data[field]).map(([year, data]) => ({
    År: year, // Current year
    Olje: data.productionOil?.value || undefined,
    Gass: data.productionGas?.value || undefined,
    Utslipp: data.emission?.value || undefined,
    Utslippsintensitet: data.emissionIntensity?.value || undefined,
  }));
}

/**
 * Every number in the dataset as one long-format table: one row per field
 * and year, one column per metric.
 *
 * This replaced the two "export everything" buttons, which used to produce a
 * three-sheet workbook and a thirty-four-sheet workbook of the same numbers.
 * A single tidy table is both what a spreadsheet pivot wants and what pandas
 * or R would ask for, and it is one file instead of two.
 */
export function allDataToCsv() {
  const rows = [];
  for (const [field, years] of Object.entries(gameData.data)) {
    for (const [year, data] of Object.entries(years)) {
      rows.push({
        Felt: field,
        År: year,
        Olje: data.productionOil?.value,
        Gass: data.productionGas?.value,
        Utslipp: data.emission?.value,
        Utslippsintensitet: data.emissionIntensity?.value,
        // The dataset marks projected years; without this column an estimate
        // is indistinguishable from a measurement once it leaves the app
        // "ja" when ANY of the four is projected rather than measured.
        // Reading only productionOil's flag mislabelled the gas fields,
        // which have no oil row to carry it.
        Anslag: [
          data.productionOil,
          data.productionGas,
          data.emission,
          data.emissionIntensity,
        ].some((v) => v?.estimate)
          ? "ja"
          : "nei",
      });
    }
  }
  return rows;
}
