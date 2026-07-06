import * as fs from "fs";

/**
 * Fetches key figures about the Norwegian power system from open APIs and
 * regenerates src/generated/energyData.ts.
 *
 * Sources:
 * - SSB StatBank table 12824 "Elektrisitetsbalansen (MWh)":
 *   production, consumption, import, export and wind production per month
 * - SSB StatBank table 08801 "Utenrikshandel med varer":
 *   import/export value of electrical energy (commodity code 27160000)
 *
 * The script is defensive: each source is fetched independently, results are
 * sanity-checked against plausible ranges, and on any failure the seeded
 * fallback value is kept for that field. This makes it safe to run from CI.
 *
 * Usage: npx tsx build/fetchEnergyData.ts
 */

const OUTPUT = "src/generated/energyData.ts";

// Fallbacks: hand-seeded approximations, kept when a fetch fails
const fallback = {
  productionTwh: 157,
  consumptionTwh: 139,
  exportTwh: 28,
  importTwh: 10,
  windProductionTwh: 17,
  exportValueBnNok: 15,
  importValueBnNok: 6,
};

type JsonStat2 = {
  id: string[];
  size: number[];
  dimension: Record<
    string,
    {
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
    }
  >;
  value: (number | null)[];
};

async function queryStatbank(
  table: string,
  query: object[],
): Promise<JsonStat2> {
  const response = await fetch(`https://data.ssb.no/api/v0/no/table/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, response: { format: "json-stat2" } }),
  });
  if (!response.ok)
    throw new Error(`SSB table ${table}: HTTP ${response.status}`);
  return (await response.json()) as JsonStat2;
}

async function getStatbankMetadata(table: string): Promise<{
  variables: { code: string; values: string[]; valueTexts: string[] }[];
}> {
  const response = await fetch(`https://data.ssb.no/api/v0/no/table/${table}`);
  if (!response.ok)
    throw new Error(`SSB table ${table} metadata: HTTP ${response.status}`);
  return await response.json();
}

/** Sums the values for each category of `dimCode` across all other dims. */
function sumPerCategory(data: JsonStat2, dimCode: string): Map<string, number> {
  const dimIndex = data.id.indexOf(dimCode);
  const result = new Map<string, number>();
  const strides: number[] = new Array(data.size.length).fill(1);
  for (let i = data.size.length - 2; i >= 0; i--)
    strides[i] = strides[i + 1] * data.size[i + 1];
  const labels = data.dimension[dimCode].category.label;
  const indexOfCode = data.dimension[dimCode].category.index;
  for (const [code, categoryIndex] of Object.entries(indexOfCode)) {
    let sum = 0;
    for (let flat = 0; flat < data.value.length; flat++) {
      const catAtFlat =
        Math.floor(flat / strides[dimIndex]) % data.size[dimIndex];
      if (catAtFlat === categoryIndex) sum += data.value[flat] ?? 0;
    }
    result.set(labels[code] ?? code, sum);
  }
  return result;
}

function findByKeyword(
  sums: Map<string, number>,
  keywords: string[],
): number | undefined {
  for (const [label, value] of sums) {
    const lower = label.toLowerCase();
    if (keywords.every((k) => lower.includes(k))) return value;
  }
  return undefined;
}

function inRange(value: number | undefined, min: number, max: number) {
  return value !== undefined && value >= min && value <= max;
}

async function fetchElectricityBalance() {
  const meta = await getStatbankMetadata("12824");
  const contents = meta.variables.find((v) => v.code === "ContentsCode");
  if (!contents) throw new Error("table 12824: no ContentsCode variable");

  const data = await queryStatbank("12824", [
    {
      code: "ContentsCode",
      selection: { filter: "item", values: contents.values },
    },
    { code: "Tid", selection: { filter: "top", values: ["12"] } },
  ]);

  const timeLabels = Object.keys(data.dimension["Tid"].category.index).sort();
  const periodLabel = `siste 12 md. til ${timeLabels[timeLabels.length - 1]}`;

  const sums = sumPerCategory(data, "ContentsCode");
  console.error(
    "12824 categories (TWh):",
    [...sums.entries()]
      .map(([k, v]) => `${k}=${(v / 1e6).toFixed(1)}`)
      .join("; "),
  );

  // Table unit is MWh → TWh
  const twh = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v / 1e6);
  return {
    periodLabel,
    productionTwh: twh(findByKeyword(sums, ["produksjon i alt"])),
    consumptionTwh: twh(findByKeyword(sums, ["bruttoforbruk"])),
    exportTwh: twh(findByKeyword(sums, ["eksport"])),
    importTwh: twh(findByKeyword(sums, ["import"])),
    windProductionTwh: twh(findByKeyword(sums, ["vindkraft"])),
  };
}

async function fetchElectricityTradeValue() {
  const data = await queryStatbank("08801", [
    {
      code: "Varekoder",
      selection: { filter: "item", values: ["27160000"] },
    },
    { code: "Tid", selection: { filter: "top", values: ["12"] } },
  ]);
  const sums = sumPerCategory(data, "ImpEks");
  console.error(
    "08801 categories (bn NOK):",
    [...sums.entries()]
      .map(([k, v]) => `${k}=${(v / 1e9).toFixed(1)}`)
      .join("; "),
  );
  const bn = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v / 1e8) / 10;
  return {
    exportValueBnNok: bn(findByKeyword(sums, ["eksport"])),
    importValueBnNok: bn(findByKeyword(sums, ["import"])),
  };
}

async function main() {
  let verified = true;
  let periodLabel = "2024";
  const result = { ...fallback };

  try {
    const balance = await fetchElectricityBalance();
    if (inRange(balance.productionTwh, 100, 250))
      result.productionTwh = balance.productionTwh!;
    else verified = false;
    if (inRange(balance.consumptionTwh, 100, 250))
      result.consumptionTwh = balance.consumptionTwh!;
    else verified = false;
    if (inRange(balance.exportTwh, 5, 60))
      result.exportTwh = balance.exportTwh!;
    else verified = false;
    if (inRange(balance.importTwh, 1, 60))
      result.importTwh = balance.importTwh!;
    else verified = false;
    if (inRange(balance.windProductionTwh, 5, 60))
      result.windProductionTwh = balance.windProductionTwh!;
    else verified = false;
    periodLabel = balance.periodLabel;
  } catch (error) {
    console.error("Electricity balance fetch failed:", error);
    verified = false;
  }

  try {
    const trade = await fetchElectricityTradeValue();
    if (inRange(trade.exportValueBnNok, 1, 100))
      result.exportValueBnNok = trade.exportValueBnNok!;
    else verified = false;
    if (inRange(trade.importValueBnNok, 0.1, 100))
      result.importValueBnNok = trade.importValueBnNok!;
    else verified = false;
  } catch (error) {
    console.error("Trade value fetch failed:", error);
    verified = false;
  }

  const file = `// Generated by build/fetchEnergyData.ts — do not edit by hand.
// Run \`npm run data:energy\` (or the "Update energy data" GitHub Actions
// workflow) to refresh from the open APIs of SSB and NVE.

/**
 * Key figures about the Norwegian power system, used to anchor the game's
 * messaging in real numbers.
 *
 * \`verified: false\` means the values are hand-seeded approximations from
 * public statistics and have not yet been regenerated against the live APIs.
 */
export const energyData = {
  /** ISO date the data was last fetched, or null for the seeded values */
  updatedAt: ${JSON.stringify(new Date().toISOString().slice(0, 10))} as string | null,
  /** True when generated against the live SSB/NVE APIs */
  verified: ${verified},
  /** Last 12 months with complete statistics */
  referenceYear: ${JSON.stringify(periodLabel)},
  electricity: {
    /** Total electricity production @unit TWh/year (SSB elektrisitetsbalansen) */
    productionTwh: ${result.productionTwh},
    /** Gross domestic consumption @unit TWh/year */
    consumptionTwh: ${result.consumptionTwh},
    /** Physical export @unit TWh/year */
    exportTwh: ${result.exportTwh},
    /** Physical import @unit TWh/year */
    importTwh: ${result.importTwh},
    /** Wind power production @unit TWh/year */
    windProductionTwh: ${result.windProductionTwh},
  },
  trade: {
    /** Export value of electricity @unit billion NOK/year (SSB utenrikshandel) */
    exportValueBnNok: ${result.exportValueBnNok},
    /** Import value of electricity @unit billion NOK/year */
    importValueBnNok: ${result.importValueBnNok},
  },
};
`;

  fs.writeFileSync(OUTPUT, file);
  console.error(
    `Wrote ${OUTPUT} (verified=${verified}, period=${periodLabel})`,
  );
  if (!verified) process.exitCode = 0; // partial data is fine; fallbacks kept
}

main();
