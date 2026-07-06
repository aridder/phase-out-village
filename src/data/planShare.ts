import { gameData, OilfieldName, PhaseOutSchedule } from "./gameData";
import { Year } from "./types";

/**
 * Encodes a phase-out schedule as a compact URL-safe string.
 *
 * Each phased-out field is encoded as `<field index>.<two digit year>`, and
 * the entries are joined with `-`. Field indexes refer to the alphabetical
 * order of `gameData.allFields`, so links remain stable as long as the field
 * list is stable.
 *
 * @example
 * encodePlan({ Brage: "2027", Troll: "2040" }) // → "3.27-27.40"
 */
export function encodePlan(phaseOut: PhaseOutSchedule): string {
  return Object.entries(phaseOut)
    .map(([field, year]) => {
      const index = gameData.allFields.indexOf(field as OilfieldName);
      if (index < 0 || !year) return undefined;
      return `${index}.${year.slice(2)}`;
    })
    .filter(Boolean)
    .join("-");
}

/**
 * Decodes a string produced by {@link encodePlan} back into a phase-out
 * schedule. Invalid entries are silently skipped, so a mangled link
 * degrades gracefully instead of crashing.
 */
export function decodePlan(encoded: string): PhaseOutSchedule {
  const schedule: PhaseOutSchedule = {};
  for (const entry of encoded.split("-")) {
    const [indexPart, yearPart] = entry.split(".");
    const index = parseInt(indexPart);
    const yearDigits = parseInt(yearPart);
    if (isNaN(index) || isNaN(yearDigits)) continue;
    const field = gameData.allFields[index];
    if (!field || yearDigits < 20 || yearDigits > 40) continue;
    schedule[field] = `20${yearPart}` as Year;
  }
  return schedule;
}

/** Builds a shareable absolute URL for a phase-out plan. */
export function planShareUrl(phaseOut: PhaseOutSchedule): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/plan?delt=${encodePlan(phaseOut)}`;
}
