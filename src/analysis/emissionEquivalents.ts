/**
 * Translates an amount of CO₂ into quantities that are easier to relate to.
 *
 * All factors are deliberately rounded approximations intended for
 * communication, not accounting:
 * - An average Norwegian petrol car emits roughly 2 tonnes CO₂ per year.
 * - A round trip flight Oslo–New York emits roughly 1 tonne CO₂ per passenger.
 * - Norway's total territorial emissions are roughly 47 million tonnes CO₂e
 *   per year (2023, Statistics Norway).
 * - A spruce tree binds roughly 0.5 tonnes CO₂ over its first 100 years.
 */

const TONNES_PER_CAR_YEAR = 2;
const TONNES_PER_OSLO_NY_ROUND_TRIP = 1;
const NORWAY_ANNUAL_EMISSIONS_TONNES = 47_000_000;
const TONNES_PER_TREE_LIFETIME = 0.5;

export type EmissionEquivalent = {
  emoji: string;
  /** Formatted quantity, e.g. "1,2 millioner" */
  amount: string;
  /** Norwegian description, e.g. "bensinbiler av veien i ett år" */
  label: string;
};

/** Formats a large number as a compact Norwegian string. */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000)
    return `${formatDecimal(value / 1_000_000_000)} milliarder`;
  if (value >= 1_000_000)
    return `${formatDecimal(value / 1_000_000)} millioner`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} 000`;
  return `${Math.round(value)}`;
}

function formatDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded.toLocaleString("nb-NO");
}

/**
 * Returns relatable equivalents for an amount of avoided CO₂ emissions.
 *
 * @param tonnesCo2 - Avoided emissions in tonnes CO₂e.
 */
export function emissionEquivalents(tonnesCo2: number): EmissionEquivalent[] {
  if (tonnesCo2 <= 0) return [];
  return [
    {
      emoji: "🚗",
      amount: formatCompactNumber(tonnesCo2 / TONNES_PER_CAR_YEAR),
      label: "bensinbiler tatt av veien i ett år",
    },
    {
      emoji: "✈️",
      amount: formatCompactNumber(tonnesCo2 / TONNES_PER_OSLO_NY_ROUND_TRIP),
      label: "flyreiser tur/retur Oslo–New York",
    },
    {
      emoji: "🇳🇴",
      amount: formatDecimal(tonnesCo2 / NORWAY_ANNUAL_EMISSIONS_TONNES),
      label: "år med Norges totale utslipp",
    },
    {
      emoji: "🌲",
      amount: formatCompactNumber(tonnesCo2 / TONNES_PER_TREE_LIFETIME),
      label: "grantrær som vokser i 100 år",
    },
    // A small plan makes some quantities round to zero ("0 år med Norges
    // totale utslipp") — an equivalent that shows nothing says nothing
  ].filter((equivalent) => equivalent.amount !== "0");
}
