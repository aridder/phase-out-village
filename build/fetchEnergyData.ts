import * as fs from "fs";

/**
 * Fetches key figures about the Norwegian power system from SSB's open
 * StatBank API and regenerates src/generated/energyData.ts.
 *
 * Sources:
 * - The electricity balance ("elektrisitetsbalanse"): production, consumption,
 *   import, export and wind production per month. The table is FOUND VIA
 *   SEARCH rather than hardcoded, because SSB regularly discontinues tables
 *   and publishes successors (12824 stopped at 2023M12, for example).
 * - "Utenrikshandel med varer" (table 08801): import/export value of
 *   electrical energy (commodity code 27160000). The query is built from the
 *   table's own metadata so variable codes are never guessed.
 *
 * The script is defensive: each source is fetched independently, results are
 * sanity-checked against plausible ranges, and on any failure the seeded
 * fallback value is kept for that field. It also prints the categories it
 * found to stderr, so a CI log is enough to diagnose schema drift.
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

type StatbankMetadata = {
  title: string;
  variables: {
    code: string;
    text: string;
    values: string[];
    valueTexts: string[];
    time?: boolean;
    elimination?: boolean;
  }[];
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
    throw new Error(
      `SSB table ${table}: HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  return (await response.json()) as JsonStat2;
}

async function getStatbankMetadata(table: string): Promise<StatbankMetadata> {
  const response = await fetch(`https://data.ssb.no/api/v0/no/table/${table}`);
  if (!response.ok)
    throw new Error(`SSB table ${table} metadata: HTTP ${response.status}`);
  return await response.json();
}

async function searchStatbankTables(
  query: string,
): Promise<{ id: string; title: string }[]> {
  const response = await fetch(
    `https://data.ssb.no/api/v0/no/table/?query=${encodeURIComponent(query)}`,
  );
  if (!response.ok)
    throw new Error(`SSB table search "${query}": HTTP ${response.status}`);
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

/**
 * Searches every non-time dimension of a json-stat2 response for a category
 * whose label contains all keywords, and returns its total.
 */
function findAcrossDimensions(
  data: JsonStat2,
  keywords: string[],
): number | undefined {
  for (const dimCode of data.id) {
    if (dimCode === "Tid") continue;
    for (const [label, value] of sumPerCategory(data, dimCode)) {
      const lower = label.toLowerCase();
      if (keywords.every((k) => lower.includes(k))) return value;
    }
  }
  return undefined;
}

function inRange(value: number | undefined, min: number, max: number) {
  return value !== undefined && value >= min && value <= max;
}

const BALANCE_KEYWORDS = [
  ["produksjon"],
  ["bruttoforbruk"],
  ["eksport"],
  ["import"],
  ["vindkraft"],
];

/**
 * Finds the current (non-discontinued) monthly electricity balance table by
 * searching StatBank, then verifies from metadata that it actually contains
 * the balance categories and recent months before using it.
 */
async function findBalanceTable(): Promise<{
  table: string;
  meta: StatbankMetadata;
}> {
  const candidates = await searchStatbankTables("elektrisitetsbalanse");
  console.error(
    "Balance table candidates:",
    candidates.map((c) => `${c.id}: ${c.title}`).join(" | "),
  );
  const currentYear = new Date().getFullYear();
  for (const candidate of candidates) {
    if (candidate.title.toLowerCase().includes("opphørt")) continue;
    try {
      const meta = await getStatbankMetadata(candidate.id);
      const time = meta.variables.find((v) => v.time || v.code === "Tid");
      const lastPeriod = time?.values[time.values.length - 1] ?? "";
      if (parseInt(lastPeriod.slice(0, 4)) < currentYear - 1) continue;
      const labels = meta.variables
        .flatMap((v) => v.valueTexts)
        .map((t) => t.toLowerCase());
      const hasCategories = BALANCE_KEYWORDS.every((keywords) =>
        labels.some((label) => keywords.every((k) => label.includes(k))),
      );
      if (hasCategories) return { table: candidate.id, meta };
    } catch (error) {
      console.error(`Skipping candidate ${candidate.id}:`, error);
    }
  }
  throw new Error("no usable electricity balance table found");
}

async function fetchElectricityBalance() {
  const { table, meta } = await findBalanceTable();
  console.error(`Using balance table ${table}: ${meta.title}`);

  // Include every variable: matched category codes where we can match,
  // everything for the rest ("Tid" limited to the last 12 months)
  const query = meta.variables.map((variable) => {
    if (variable.time || variable.code === "Tid")
      return {
        code: variable.code,
        selection: { filter: "top", values: ["12"] },
      };
    return {
      code: variable.code,
      selection: { filter: "item", values: variable.values },
    };
  });
  const data = await queryStatbank(table, query);

  const timeLabels = Object.keys(data.dimension["Tid"].category.index).sort();
  const periodLabel = `siste 12 md. til ${timeLabels[timeLabels.length - 1]}`;

  for (const dimCode of data.id) {
    if (dimCode === "Tid") continue;
    console.error(
      `${table} dim ${dimCode} (TWh):`,
      [...sumPerCategory(data, dimCode)]
        .map(([k, v]) => `${k}=${(v / 1e6).toFixed(1)}`)
        .join("; "),
    );
  }

  // Balance tables are published in MWh (older) or GWh (newer) — detect by
  // magnitude: annual production must land between 100 and 250 TWh.
  const rawProduction = findAcrossDimensions(data, ["produksjon"]);
  if (!rawProduction) throw new Error("production category not found");
  const divisor = rawProduction > 1e7 ? 1e6 : 1e3; // MWh vs GWh → TWh
  const twh = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v / divisor);

  return {
    periodLabel,
    productionTwh: twh(rawProduction),
    consumptionTwh: twh(findAcrossDimensions(data, ["bruttoforbruk"])),
    exportTwh: twh(findAcrossDimensions(data, ["eksport"])),
    importTwh: twh(findAcrossDimensions(data, ["import"])),
    windProductionTwh: twh(findAcrossDimensions(data, ["vindkraft"])),
  };
}

async function fetchElectricityTradeValue() {
  const table = "08801";
  const meta = await getStatbankMetadata(table);
  console.error(
    `Trade table ${table} variables:`,
    meta.variables.map((v) => `${v.code} (${v.text})`).join("; "),
  );

  // Build the query from metadata: find the commodity code for electrical
  // energy, the import/export variable and the value ContentsCode
  const query = meta.variables.map((variable) => {
    const isTime = variable.time || variable.code === "Tid";
    if (isTime)
      return {
        code: variable.code,
        selection: { filter: "top", values: ["12"] },
      };
    const commodityIndex = variable.values.indexOf("27160000");
    if (commodityIndex >= 0)
      return {
        code: variable.code,
        selection: { filter: "item", values: ["27160000"] },
      };
    if (variable.code === "ContentsCode") {
      const valueIndex = variable.valueTexts.findIndex((t) =>
        t.toLowerCase().includes("verdi"),
      );
      return {
        code: variable.code,
        selection: {
          filter: "item",
          values: [variable.values[valueIndex >= 0 ? valueIndex : 0]],
        },
      };
    }
    return {
      code: variable.code,
      selection: { filter: "item", values: variable.values },
    };
  });
  const data = await queryStatbank(table, query);

  for (const dimCode of data.id) {
    if (dimCode === "Tid") continue;
    console.error(
      `${table} dim ${dimCode} (bn NOK):`,
      [...sumPerCategory(data, dimCode)]
        .map(([k, v]) => `${k}=${(v / 1e9).toFixed(1)}`)
        .join("; "),
    );
  }

  const bn = (v: number | undefined) =>
    v === undefined ? undefined : Math.round(v / 1e8) / 10;
  return {
    exportValueBnNok: bn(findAcrossDimensions(data, ["eksport"])),
    importValueBnNok: bn(findAcrossDimensions(data, ["import"])),
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
}

main();
