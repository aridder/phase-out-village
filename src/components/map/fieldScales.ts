import { fieldGeometry } from "../../generated/fieldGeometry";
import {
  gameData,
  isPhasedOut,
  OilfieldName,
  PhaseOutSchedule,
} from "../../data/gameData";
import { Year } from "../../data/types";

/**
 * The map's visual language, defined once.
 *
 * The map draws on a canvas, so it needs literal colour values rather than
 * CSS variables — and the legend, the field list and the bubbles must
 * agree exactly or the legend lies. So the palette lives here, in TypeScript,
 * and every surface reads it from here.
 *
 * Two encodings, both meaningful:
 *   - bubble AREA  = how much the field produces
 *   - bubble COLOUR = how much CO₂ it takes to produce a barrel of it
 *
 * That is the whole point of the map: you can see at a glance that the
 * biggest circles are not the darkest ones.
 */

/* ------------------------------------------------------------------ colour */

/**
 * Emission intensity in four classes rather than a continuous ramp: a
 * player needs thresholds they can act on, not a gradient they have to
 * interpolate by eye.
 *
 * The two palettes are separate because no single ramp reads correctly on
 * both the light (#eef6dd) and the dark (#0e2405) surface. Both run
 * monotonically from light to dark, so the *order* survives red–green
 * colour blindness even where the hue does not.
 */
export type IntensityClass = {
  /** Lower bound of the class @unit kg CO₂e per barrel */
  from: number;
  /** Upper bound, or Infinity for the top class */
  to: number;
  label: string;
  light: string;
  dark: string;
};

export const intensityClasses: IntensityClass[] = [
  { from: 0, to: 4, label: "Lavt", light: "#ffd166", dark: "#ffe08a" },
  { from: 4, to: 9, label: "Rundt snittet", light: "#f4a261", dark: "#f7b267" },
  { from: 9, to: 18, label: "Høyt", light: "#e1663f", dark: "#f07b54" },
  {
    from: 18,
    to: Infinity,
    label: "Svært høyt",
    light: "#b03a2e",
    dark: "#d9534f",
  },
];

/** Colour of a field with no reported emissions — absence, not zero. */
export const NO_DATA_COLOR = { light: "#b9c4ad", dark: "#5d6b52" };
/** A field whose end date has passed. */
export const RETIRED_COLOR = { light: "#8c9a8e", dark: "#7b8a7d" };
/** The currently selected field's ring. */
export const SELECTED_COLOR = { light: "#2f6fe4", dark: "#7fb3ff" };
/** Outline drawn around every bubble so the pale end stays visible. */
export const RING_COLOR = { light: "#12300a", dark: "#0e2405" };

export function intensityClassFor(intensity: number): IntensityClass {
  return (
    intensityClasses.find((c) => intensity >= c.from && intensity < c.to) ??
    intensityClasses[intensityClasses.length - 1]
  );
}

/** The fill for a field, given its state and the active theme. */
export function fieldColor(
  intensity: number,
  hasEmissionData: boolean,
  state: FieldState,
  dark: boolean,
): string {
  const theme = dark ? "dark" : "light";
  if (state === "retired") return RETIRED_COLOR[theme];
  if (!hasEmissionData) return NO_DATA_COLOR[theme];
  return intensityClassFor(intensity)[theme];
}

/* ------------------------------------------------------------------- size */

/**
 * Bubble radius in pixels. Area is proportional to production, so the eye
 * compares production and not its square root.
 *
 * The floor of 5 px breaks that proportionality for the four smallest
 * fields — it is there so they stay tappable, and the legend says so.
 *
 * Must stay in sync with `radiusPx()` in build/generateFieldGeometry.ts,
 * which solves the bubble packing against these same radii.
 */
export function bubbleRadius(production: number, zoom: number): number {
  const base = Math.min(26, Math.max(5, 3.9 * Math.sqrt(production)));
  const zoomBoost = Math.min(1.8, Math.max(1, 1 + 0.15 * (zoom - 5)));
  return base * zoomBoost;
}

/* --------------------------------------------------------------- position */

/** The zoom at which bubbles start moving back to their true centres. */
const SPREAD_UNTIL_ZOOM = 5.5;
/** The zoom by which they have fully arrived. */
const TRUE_FROM_ZOOM = 8;

/**
 * Where to draw a field at a given zoom.
 *
 * Zoomed out the North Sea fields are a few pixels apart and overlap no
 * matter how small the bubbles get, so we use the pre-solved spread
 * positions. Zoomed in there is room, so we use the real centres. In
 * between we interpolate, and the map draws a leader line to the true
 * position whenever a bubble has been moved noticeably.
 */
export function positionFor(
  field: OilfieldName,
  zoom: number,
): [number, number] {
  const geometry = fieldGeometry[field];
  if (!geometry) return [0, 0];
  const t = Math.min(
    1,
    Math.max(
      0,
      (zoom - SPREAD_UNTIL_ZOOM) / (TRUE_FROM_ZOOM - SPREAD_UNTIL_ZOOM),
    ),
  );
  return [
    geometry.spread[0] + (geometry.lon - geometry.spread[0]) * t,
    geometry.spread[1] + (geometry.lat - geometry.spread[1]) * t,
  ];
}

/* ------------------------------------------------------------------ state */

/**
 * Three states, not two. The old map went grey the instant a field was
 * added to the plan, which made a decision for 2040 look like it had
 * already happened in 2025 — and left the player with no way to see the
 * difference between "decided" and "done".
 */
export type FieldState =
  /** Producing, no end date set */
  | "active"
  /** Has an end date, still producing until it arrives */
  | "scheduled"
  /** The end date has passed */
  | "retired";

export function fieldState(
  field: OilfieldName,
  phaseOut: PhaseOutSchedule,
  year: Year,
): FieldState {
  if (isPhasedOut(field, phaseOut, year)) return "retired";
  return phaseOut[field] ? "scheduled" : "active";
}

/* ------------------------------------------------------------------- data */

/** Everything the map and the field list need about one field, one year. */
export type FieldMapDatum = {
  field: OilfieldName;
  /** @unit mill. Sm³ o.e./year */
  production: number;
  /** @unit tonnes CO₂e/year */
  emission: number;
  /** @unit kg CO₂e/barrel */
  intensity: number;
  hasEmissionData: boolean;
  state: FieldState;
  /** The year this field's end date falls, if one has been set */
  endYear: Year | undefined;
  sea: string;
};

/**
 * The map's view of the shelf in a given year.
 *
 * Retired fields keep their last producing figures so their bubble can
 * still be drawn as a ghost of what it was — that accumulating record of
 * removed production is the clearest sign of progress the map can give.
 */
export function fieldMapData(
  phaseOut: PhaseOutSchedule,
  year: Year,
): FieldMapDatum[] {
  return gameData.allFields
    .map((field) => {
      const state = fieldState(field, phaseOut, year);
      // For a retired field, read the last year it actually produced
      const readYear = state === "retired" ? (phaseOut[field] ?? year) : year;
      const values =
        gameData.data[field]?.[readYear] ?? gameData.data[field]?.[year];
      return {
        field,
        production: values?.totalProduction?.value ?? 0,
        emission: values?.emission?.value ?? 0,
        intensity: values?.emissionIntensity?.value ?? 0,
        hasEmissionData: !!values?.emission?.value,
        state,
        endYear: phaseOut[field],
        sea: fieldGeometry[field]?.sea ?? "",
      };
    })
    .filter((d) => d.production > 0)
    .sort((a, b) => b.production - a.production);
}
