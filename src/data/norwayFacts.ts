/**
 * Facts about what carries the Norwegian economy beyond oil, used for the
 * cost page's "Norge står støtt" section. Every figure carries its year;
 * the UI's sources block cites where each comes from:
 *
 * - The sovereign wealth fund (Statens pensjonsfond utland) passed
 *   22 000 bn NOK in July 2026 (NBIM; 21 268 bn at the end of 2025) —
 *   more than 30 years of the state's current annual petroleum revenue
 *   is already in the bank (22 000 / 664 ≈ 33).
 * - Norwegian hydropower reservoirs can store ~87 TWh (NVE), roughly half
 *   of Europe's total reservoir storage capacity — the physical basis for
 *   the "battery of Europe" role: buy cheap wind power, sell hydropower
 *   when the wind is still.
 * - 98–99 % of Norwegian electricity production is renewable
 *   (hydro + wind + solar; SSB electricity balance).
 * - Mainland (non-petroleum) exports of GOODS were 765.6 bn NOK in 2025
 *   (SSB) — services come on top, but the goods figure is the one with a
 *   clean source, so that is the one we cite.
 */
export const OIL_FUND_BN_NOK = 22_000;
export const RESERVOIR_CAPACITY_TWH = 87;
export const RESERVOIR_SHARE_OF_EUROPE = 0.5;
export const RENEWABLE_ELECTRICITY_SHARE = 0.98;
export const MAINLAND_EXPORT_BN_NOK = 766;
