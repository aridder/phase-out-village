import {
  gameData,
  oilEquivalentToBarrel,
  OilfieldName,
  totalProduction,
} from "./gameData";
import { fieldGeometry } from "../generated/fieldGeometry";
import { energyData } from "../generated/energyData";
import { TWH_PER_MILL_SM3_OE } from "./energyTransition";
import {
  POPULATION_MILLIONS,
  STATE_BUDGET_BN_NOK,
  STATE_NET_CASH_FLOW_BN_NOK,
} from "./petroleumEconomy";
import { Year } from "./types";
import { IllustrationKey } from "../components/ui/illustrations";

/**
 * Act 1 — «Norge i dag».
 *
 * Everything the opening briefing states about the shelf as it is right
 * now, derived from the same per-field dataset the game plays on, so the
 * briefing and the game can never tell different stories about the same
 * fields.
 *
 * Nothing here argues for anything. It is the board before the first move.
 */

/** The year the briefing describes. */
export const TODAY: Year = "2025";

/**
 * Norway's total greenhouse gas emissions, 44.6 mill. tonnes CO₂e in 2024
 * (SSB, final figures). Used only to put the shelf's own emissions in
 * proportion.
 */
export const NORWAY_EMISSIONS_MT = 44.6;

/**
 * Everything the briefing needs about one field, in the units a reader can
 * hold in their head.
 */
export type FieldToday = {
  field: OilfieldName;
  /** Total production this year @unit mill. Sm³ o.e. */
  production: number;
  /** Energy content of that production @unit TWh/year */
  energyTwh: number;
  /** Emissions from producing it @unit tonnes CO₂e/year */
  emission: number;
  /** Emissions per barrel produced @unit kg CO₂e/barrel o.e. */
  intensity: number;
  /** Share of the shelf's production this year (0–1) */
  productionShare: number;
  /** Share of the shelf's emissions this year (0–1) */
  emissionShare: number;
  /**
   * Rough share of Norway's petroleum revenue this field carries, assumed
   * proportional to its share of production @unit bn NOK/year
   */
  stateRevenueBnNok: number;
  /** How many times the shelf average this field emits per barrel */
  intensityVsAverage: number;
  /**
   * True when the field reports no emissions at all. That is real for
   * fields piped straight to shore (the processing emissions land in the
   * onshore accounts instead) — but it is not the same as a measured zero,
   * so the UI must never rank these as "cleanest".
   */
  noEmissionData: boolean;
  /** Last year the field still produces without any decision being made */
  lastProductionYear: Year | undefined;
  /** Share of this year's production still left in 2040 (0–1) */
  remainingIn2040: number;
} & (typeof fieldGeometry)[OilfieldName];

/** The shelf as a whole, this year. */
export type ShelfToday = {
  year: Year;
  fieldCount: number;
  /** @unit mill. Sm³ o.e./year */
  production: number;
  oilProduction: number;
  gasProduction: number;
  /** @unit TWh/year */
  energyTwh: number;
  /** @unit mill. tonnes CO₂e/year */
  emissionMt: number;
  /** The shelf's emissions as a share of Norway's total (0–1) */
  shareOfNorwayEmissions: number;
  /** Production-weighted average @unit kg CO₂e/barrel */
  averageIntensity: number;
  /** @unit bn NOK/year */
  exportValueBnNok: number;
  stateRevenueBnNok: number;
  /** State petroleum revenue per inhabitant @unit NOK/year */
  revenuePerCapitaKr: number;
  /** State petroleum revenue as a share of the national budget (0–1) */
  shareOfStateBudget: number;
  /** Electricity the platforms themselves consume @unit TWh/year */
  ownElectricityTwh: number;
  /** Share of this year's production left in 2040 with no decisions (0–1) */
  remainingIn2040: number;
  /** Every field, biggest producer first */
  fields: FieldToday[];
  /** The cleanest and dirtiest field per barrel, of those that report */
  cleanest: FieldToday;
  dirtiest: FieldToday;
  /** How many times more the dirtiest emits per barrel than the cleanest */
  intensitySpread: number;
};

function fieldValue(field: OilfieldName, year: Year) {
  return gameData.data[field]?.[year];
}

/** The last year a field still produces if nothing is decided. */
function lastProductionYear(field: OilfieldName): Year | undefined {
  const producing = gameData.gameYears.filter(
    (year) => (fieldValue(field, year)?.totalProduction?.value ?? 0) > 0,
  );
  return producing[producing.length - 1];
}

let cached: ShelfToday | undefined;

/**
 * The state of the shelf in {@link TODAY}: what it produces, what it emits,
 * what it earns, and how unlike each other the fields are.
 */
export function shelfToday(): ShelfToday {
  if (cached) return cached;

  const year = TODAY;
  const totals = totalProduction({}, [year])[year]!;
  const production = totals.totalProduction?.value ?? 0;
  const emission = totals.emission?.value ?? 0;
  const exportValueBnNok = energyData.trade.petroleumExportValueBnNok;

  const fields: FieldToday[] = gameData.allFields
    .map((field) => {
      const values = fieldValue(field, year);
      const fieldProduction = values?.totalProduction?.value ?? 0;
      const fieldEmission = values?.emission?.value ?? 0;
      const productionShare = production > 0 ? fieldProduction / production : 0;
      const barrels = fieldProduction * oilEquivalentToBarrel * 1_000_000;
      const intensity = barrels > 0 ? (fieldEmission * 1000) / barrels : 0;
      const last = lastProductionYear(field);
      const production2040 =
        fieldValue(field, "2040")?.totalProduction?.value ?? 0;

      return {
        ...fieldGeometry[field],
        field,
        production: Math.round(fieldProduction * 100) / 100,
        energyTwh: Math.round(fieldProduction * TWH_PER_MILL_SM3_OE),
        emission: fieldEmission,
        intensity: Math.round(intensity * 100) / 100,
        productionShare,
        emissionShare: emission > 0 ? fieldEmission / emission : 0,
        stateRevenueBnNok:
          Math.round(STATE_NET_CASH_FLOW_BN_NOK * productionShare * 10) / 10,
        intensityVsAverage: 0, // filled in below, once the average is known
        noEmissionData: !values?.emission?.value,
        lastProductionYear: last,
        remainingIn2040:
          fieldProduction > 0 ? production2040 / fieldProduction : 0,
      };
    })
    // Fields that produce nothing this year (Yggdrasil starts later) are not
    // part of the picture of today
    .filter((f) => f.production > 0)
    .sort((a, b) => b.production - a.production);

  const barrels = production * oilEquivalentToBarrel * 1_000_000;
  const averageIntensity =
    barrels > 0 ? Math.round(((emission * 1000) / barrels) * 100) / 100 : 0;
  for (const field of fields) {
    // Not rounded here: callers that invert this (to say "N times lower")
    // divided by a rounded-to-zero value and got Infinity
    field.intensityVsAverage =
      averageIntensity > 0 ? field.intensity / averageIntensity : 0;
  }

  const reporting = fields.filter((f) => !f.noEmissionData);
  const byIntensity = [...reporting].sort((a, b) => a.intensity - b.intensity);
  const cleanest = byIntensity[0];
  const dirtiest = byIntensity[byIntensity.length - 1];

  const production2040 =
    totalProduction({}, ["2040"])["2040"]?.totalProduction?.value ?? 0;

  cached = {
    year,
    fieldCount: fields.length,
    production: Math.round(production),
    oilProduction: Math.round(totals.productionOil?.value ?? 0),
    gasProduction: Math.round(totals.productionGas?.value ?? 0),
    energyTwh: Math.round(production * TWH_PER_MILL_SM3_OE),
    emissionMt: Math.round((emission / 1_000_000) * 10) / 10,
    shareOfNorwayEmissions: emission / 1_000_000 / NORWAY_EMISSIONS_MT,
    averageIntensity,
    exportValueBnNok,
    stateRevenueBnNok: STATE_NET_CASH_FLOW_BN_NOK,
    revenuePerCapitaKr:
      Math.round(
        (STATE_NET_CASH_FLOW_BN_NOK * 1_000_000_000) /
          (POPULATION_MILLIONS * 1_000_000) /
          100,
      ) * 100,
    shareOfStateBudget: STATE_NET_CASH_FLOW_BN_NOK / STATE_BUDGET_BN_NOK,
    ownElectricityTwh: energyData.electricity.oilGasConsumptionTwh,
    remainingIn2040: production > 0 ? production2040 / production : 0,
    fields,
    cleanest,
    dirtiest,
    intensitySpread:
      cleanest.intensity > 0
        ? Math.round(dirtiest.intensity / cleanest.intensity)
        : 0,
  };
  return cached;
}

/**
 * Why two fields producing the same barrel can emit 500 times differently.
 * These are the real, physical reasons — the briefing states them so the
 * intensity spread reads as engineering, not as a moral ranking of
 * operators.
 */
export const intensityReasons: {
  illustration: IllustrationKey;
  title: string;
  text: string;
}[] = [
  {
    illustration: "kraftnett",
    title: "Strøm fra land",
    text: "Noen felt får strømmen sin fra kraftnettet på land. Da står gassturbinene stille, og utslippene per fat faller nesten til null.",
  },
  {
    illustration: "gassturbin",
    title: "Egne gassturbiner",
    text: "De fleste eldre plattformer lager sin egen strøm ved å brenne gass ute i havet. Det er den største utslippskilden på sokkelen.",
  },
  {
    illustration: "modentFelt",
    title: "Alderen på feltet",
    text: "Et gammelt felt gir mest vann og lite olje. Energien går med til å pumpe og skille vann – utslippene per fat stiger år for år.",
  },
  {
    illustration: "havbunnTilLand",
    title: "Havbunn til land",
    text: "Felt uten plattform sender brønnstrømmen rett til et anlegg på land. Utslippene fra prosesseringen havner da i fastlandsregnskapet, ikke sokkelens.",
  },
];
