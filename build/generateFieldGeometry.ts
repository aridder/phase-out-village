/**
 * Turns the 3.4 MB raw field polygon GeoJSON from Sokkeldirektoratet into
 * two small, purpose-built artefacts:
 *
 *  1. `src/generated/fieldGeometry.ts` — one record per *aggregate* game
 *     field with its centre point, its extent, its sea area, what it
 *     produces, when it was found and who operates it. This is what the
 *     new map draws: readable bubbles at real positions, not sub-pixel
 *     polygon slivers.
 *
 *  2. `public/geojson/fields-simplified.geojson` — the same polygons, but
 *     only for fields that are in the game, Douglas–Peucker simplified and
 *     rounded to 4 decimals (~11 m precision). Used as a quiet underlay so
 *     the shelf still looks like the shelf when you zoom in.
 *
 * Run with `npm run data:geometry`.
 */

import fs from "fs";
import { aggregateOilFields } from "../src/generated/aggregateOilFields";
import { gameData, OilfieldName } from "../src/data/gameData";

type Position = [number, number];
type Ring = Position[];

type Feature = {
  type: "Feature";
  properties: Record<string, string>;
  geometry:
    | { type: "Polygon"; coordinates: Ring[] }
    | { type: "MultiPolygon"; coordinates: Ring[][] };
};

/**
 * The raw source lives OUTSIDE public/ on purpose: Vite copies public/
 * verbatim into dist, so keeping the 3.4 MB original there shipped it to
 * every visitor even though nothing fetches it any more.
 */
const SOURCE = "data/oilfields.geojson";
const SIMPLIFIED_OUT = "public/geojson/fields-simplified.geojson";
const TS_OUT = "src/generated/fieldGeometry.ts";

/** Douglas–Peucker tolerance in degrees (~500 m at Norwegian latitudes). */
const TOLERANCE = 0.005;
/** Coordinate decimals kept in the simplified file (~11 m). */
const DECIMALS = 4;

const raw = JSON.parse(fs.readFileSync(SOURCE, "utf-8")) as {
  features: Feature[];
};

/* ---------------------------------------------------------------- geometry */

/** Perpendicular distance from `p` to the segment `a`–`b`, in degrees. */
function segmentDistance(p: Position, a: Position, b: Position): number {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/** Classic Douglas–Peucker, iterative so deep rings cannot blow the stack. */
function simplifyRing(ring: Ring, tolerance: number): Ring {
  if (ring.length <= 4) return ring;
  const squared = tolerance * tolerance;
  const keep = new Array(ring.length).fill(false);
  keep[0] = keep[ring.length - 1] = true;

  const stack: [number, number][] = [[0, ring.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let index = -1;
    let maxDistance = squared;
    for (let i = first + 1; i < last; i++) {
      const distance = segmentDistance(ring[i], ring[first], ring[last]);
      if (distance > maxDistance) {
        index = i;
        maxDistance = distance;
      }
    }
    if (index > 0) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }

  const result = ring.filter((_, i) => keep[i]);
  // A ring needs at least 4 positions (first === last) to stay a ring
  return result.length >= 4 ? result : ring;
}

function round(value: number): number {
  const factor = 10 ** DECIMALS;
  return Math.round(value * factor) / factor;
}

/** Signed area of a ring in square degrees — sign tells winding order. */
function ringArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return sum / 2;
}

/** Area-weighted centroid of a ring, in degrees. */
function ringCentroid(ring: Ring): { point: Position; area: number } {
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    x += (ring[j][0] + ring[i][0]) * cross;
    y += (ring[j][1] + ring[i][1]) * cross;
  }
  area /= 2;
  if (area === 0) return { point: ring[0], area: 0 };
  return { point: [x / (6 * area), y / (6 * area)], area: Math.abs(area) };
}

/** Every outer ring of a feature, ignoring holes. */
function outerRings(feature: Feature): Ring[] {
  return feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates[0]]
    : feature.geometry.coordinates.map((polygon) => polygon[0]);
}

/* ------------------------------------------------------------- aggregation */

/**
 * One square degree of longitude shrinks with latitude, so raw degree² area
 * badly understates northern fields. Correcting by cos(lat) gives a figure
 * we can honestly call km².
 */
const KM_PER_DEGREE = 111.32;

function areaKm2(area: number, latitude: number): number {
  return (
    area * KM_PER_DEGREE * KM_PER_DEGREE * Math.cos((latitude * Math.PI) / 180)
  );
}

type Accumulator = {
  weightedX: number;
  weightedY: number;
  area: number;
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
  parts: number;
  mainArea: string;
  hcTypes: Set<string>;
  discovered: number[];
  operators: Set<string>;
};

const accumulators = new Map<string, Accumulator>();
const simplifiedFeatures: unknown[] = [];

for (const feature of raw.features) {
  const rawName = feature.properties.fldName;
  const field = aggregateOilFields[rawName];
  if (!field) continue; // shut-down or non-game field: dropped entirely

  const accumulator: Accumulator = accumulators.get(field) ?? {
    weightedX: 0,
    weightedY: 0,
    area: 0,
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
    parts: 0,
    mainArea: feature.properties.fldMainArea,
    hcTypes: new Set(),
    discovered: [],
    operators: new Set(),
  };
  accumulators.set(field, accumulator);

  for (const ring of outerRings(feature)) {
    const { point, area } = ringCentroid(ring);
    accumulator.weightedX += point[0] * area;
    accumulator.weightedY += point[1] * area;
    accumulator.area += area;
    accumulator.parts += 1;
    for (const [lon, lat] of ring) {
      accumulator.minLon = Math.min(accumulator.minLon, lon);
      accumulator.maxLon = Math.max(accumulator.maxLon, lon);
      accumulator.minLat = Math.min(accumulator.minLat, lat);
      accumulator.maxLat = Math.max(accumulator.maxLat, lat);
    }
  }

  if (feature.properties.fldHcType)
    accumulator.hcTypes.add(feature.properties.fldHcType);
  // The source writes numbers with non-breaking spaces: "1 972"
  const year = parseInt(feature.properties.fldDiscoveryYear.replace(/\D/g, ""));
  if (year) accumulator.discovered.push(year);
  if (feature.properties.cmpLongName)
    accumulator.operators.add(feature.properties.cmpLongName);

  // Simplified geometry for the map underlay
  const coordinates =
    feature.geometry.type === "Polygon"
      ? [
          feature.geometry.coordinates.map((ring) =>
            simplifyRing(ring, TOLERANCE).map(
              ([lon, lat]) => [round(lon), round(lat)] as Position,
            ),
          ),
        ]
      : feature.geometry.coordinates.map((polygon) =>
          polygon.map((ring) =>
            simplifyRing(ring, TOLERANCE).map(
              ([lon, lat]) => [round(lon), round(lat)] as Position,
            ),
          ),
        );

  simplifiedFeatures.push({
    type: "Feature",
    // Only what the map actually reads — the other 20 properties were dead weight
    properties: { field },
    geometry: { type: "MultiPolygon", coordinates },
  });
}

/* ------------------------------------------------------- Dorling relaxation

   Real centroids put Valhall and Eldfisk one pixel apart, and Balder and
   Grane two, when the whole shelf is on screen. No bubble size makes that
   readable, and neither is separately clickable.

   So we solve the packing once, here, at build time: push overlapping
   bubbles apart until they only touch, at a reference zoom where the whole
   shelf is visible. The map then interpolates between these relaxed
   positions (zoomed out, where the cluster is the problem) and the true
   centroids (zoomed in, where there is room), and draws a leader line
   whenever a bubble has been moved off its real position.
   -------------------------------------------------------------------------- */

/** Web Mercator radius — relaxation happens in the projection the map draws in. */
const MERCATOR_R = 6378137;
/** The zoom the packing is solved for: the whole shelf in one view. */
const REFERENCE_ZOOM = 5;
/** Web Mercator units per pixel at {@link REFERENCE_ZOOM}. */
const UNITS_PER_PIXEL = 156543.03392804097 / 2 ** REFERENCE_ZOOM;

function toMercator([lon, lat]: Position): Position {
  return [
    (lon * Math.PI * MERCATOR_R) / 180,
    MERCATOR_R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
  ];
}

function fromMercator([x, y]: Position): Position {
  return [
    (x * 180) / (Math.PI * MERCATOR_R),
    (360 * Math.atan(Math.exp(y / MERCATOR_R))) / Math.PI - 90,
  ];
}

/**
 * Bubble radius in pixels for a production volume. Area — not radius —
 * is proportional to production, so the eye compares the right quantity.
 * The floor keeps the smallest fields tappable; the UI legend says so.
 *
 * Must stay in sync with `bubbleRadius()` in the map layer.
 */
function radiusPx(production: number): number {
  return Math.min(26, Math.max(5, 3.9 * Math.sqrt(production)));
}

/** The production each bubble is sized by: the first game year. */
function productionOf(field: OilfieldName): number {
  const years = gameData.gameYears;
  for (const year of years) {
    const value = gameData.data[field]?.[year]?.totalProduction?.value;
    if (value) return value;
  }
  return 0;
}

type Node = { field: string; x: number; y: number; r: number };

function relax(nodes: Node[]): void {
  const PADDING = 2 * UNITS_PER_PIXEL; // 2 px of daylight between bubbles
  for (let iteration = 0; iteration < 400; iteration++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const wanted = a.r + b.r + PADDING;
        let distance = Math.hypot(dx, dy);
        // Exactly coincident centres have no direction to push along
        if (distance === 0) {
          a.x -= wanted / 2;
          b.x += wanted / 2;
          continue;
        }
        if (distance >= wanted) continue;
        const shift = (wanted - distance) / 2;
        const ux = dx / distance;
        const uy = dy / distance;
        a.x -= ux * shift;
        a.y -= uy * shift;
        b.x += ux * shift;
        b.y += uy * shift;
      }
    }
  }
}

const nodes: Node[] = entriesSource();

function entriesSource(): Node[] {
  return [...accumulators.entries()].map(([field, a]) => {
    const [x, y] = toMercator([a.weightedX / a.area, a.weightedY / a.area]);
    return {
      field,
      x,
      y,
      r: radiusPx(productionOf(field as OilfieldName)) * UNITS_PER_PIXEL,
    };
  });
}

relax(nodes);
const relaxed = new Map(
  nodes.map((n) => {
    const [lon, lat] = fromMercator([n.x, n.y]);
    return [
      n.field,
      [Math.round(lon * 10000) / 10000, Math.round(lat * 10000) / 10000],
    ];
  }),
);

/* ----------------------------------------------------------------- writing */

/** Sokkeldirektoratet's English area names, in Norwegian. */
const AREA_NAMES: Record<string, string> = {
  "North sea": "Nordsjøen",
  "Norwegian sea": "Norskehavet",
  "Barents sea": "Barentshavet",
};

/** Their hydrocarbon-type codes, collapsed to something a player reads. */
function productType(types: Set<string>): "olje" | "gass" | "olje og gass" {
  const list = [...types].join(" ");
  const oil = /OIL/.test(list);
  const gas = /GAS/.test(list);
  if (oil && gas) return "olje og gass";
  return gas ? "gass" : "olje";
}

const entries = [...accumulators.entries()]
  .map(([field, a]) => {
    const latitude = a.weightedY / a.area;
    return {
      field,
      lon: Math.round((a.weightedX / a.area) * 10000) / 10000,
      lat: Math.round(latitude * 10000) / 10000,
      spread: relaxed.get(field)!,
      areaKm2: Math.round(areaKm2(a.area, latitude)),
      extent: [a.minLon, a.minLat, a.maxLon, a.maxLat].map(
        (v) => Math.round(v * 10000) / 10000,
      ),
      parts: a.parts,
      sea: AREA_NAMES[a.mainArea] ?? a.mainArea,
      produces: productType(a.hcTypes),
      discovered: Math.min(...a.discovered),
      operator: [...a.operators][0] ?? "",
    };
  })
  .sort((a, b) => a.field.localeCompare(b.field, "nb"));

const ts = `import { OilfieldName } from "../data/gameData";

/**
 * Generated by build/generateFieldGeometry.ts — do not edit by hand.
 * Run \`npm run data:geometry\` to regenerate from
 * public/geojson/oilfields.geojson.
 *
 * Where each field actually is, how big it is, and the facts about it that
 * do not change from year to year. The map draws bubbles from \`lon\`/\`lat\`
 * and \`areaKm2\`; the field profile shows \`sea\`, \`produces\`,
 * \`discovered\` and \`operator\`.
 */
export type FieldGeometry = {
  /** Area-weighted centre of every part of the field @unit degrees */
  lon: number;
  lat: number;
  /**
   * The same point, nudged so that no two bubbles overlap when the whole
   * shelf is in view. The map uses this when zoomed out and the true
   * centre when zoomed in, drawing a leader line in between.
   */
  spread: [number, number];
  /** Bounding box [minLon, minLat, maxLon, maxLat] of the whole field */
  extent: [number, number, number, number];
  /** Combined licence area of all parts @unit km² */
  areaKm2: number;
  /** How many separate polygons the field is made of */
  parts: number;
  /** Havområde: Nordsjøen, Norskehavet or Barentshavet */
  sea: string;
  /** What the field mainly delivers */
  produces: "olje" | "gass" | "olje og gass";
  /** Year the first part of the field was discovered */
  discovered: number;
  /** Operator of the largest part */
  operator: string;
};

export const fieldGeometry: Record<OilfieldName, FieldGeometry> = {
${entries
  .map(
    (e) =>
      `  ${JSON.stringify(e.field)}: {\n` +
      `    lon: ${e.lon},\n` +
      `    lat: ${e.lat},\n` +
      `    spread: [${e.spread.join(", ")}],\n` +
      `    extent: [${e.extent.join(", ")}],\n` +
      `    areaKm2: ${e.areaKm2},\n` +
      `    parts: ${e.parts},\n` +
      `    sea: ${JSON.stringify(e.sea)},\n` +
      `    produces: ${JSON.stringify(e.produces)},\n` +
      `    discovered: ${e.discovered},\n` +
      `    operator: ${JSON.stringify(e.operator)},\n` +
      `  },`,
  )
  .join("\n")}
};

/** The three sea areas, north to south, for grouping fields in the UI. */
export const seaAreas = ["Barentshavet", "Norskehavet", "Nordsjøen"] as const;
`;

fs.writeFileSync(TS_OUT, ts);
fs.writeFileSync(
  SIMPLIFIED_OUT,
  JSON.stringify({ type: "FeatureCollection", features: simplifiedFeatures }),
);

const before = fs.statSync(SOURCE).size;
const after = fs.statSync(SIMPLIFIED_OUT).size;
console.error(
  `${entries.length} fields · geojson ${(before / 1e6).toFixed(1)} MB → ${(
    after / 1e3
  ).toFixed(0)} kB (${Math.round((1 - after / before) * 100)} % smaller)`,
);
