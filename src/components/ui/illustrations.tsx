import React from "react";

/**
 * The domain illustrations.
 *
 * Seven concepts that no icon library ships correctly — an oil platform, a
 * gas turbine, a subsea tieback, an ageing field, offshore wind, a hydro
 * reservoir and the grid. Everything else in the app uses a Lucide icon or
 * nothing at all.
 *
 * They are components rather than image files on purpose: drawn with
 * `currentColor`, they follow the text colour into dark mode, which an
 * `<img>` cannot do.
 *
 * House rules, so drawings added later still belong to the same family:
 *
 *  - 48×48 viewBox, geometry snapped to a 4-unit grid, 4 units of safe area.
 *  - `stroke: currentColor`, width 2, round caps and joins, `fill: none`.
 *  - Exactly one permitted fill: water, as `currentColor` at 12 % — never
 *    a second colour.
 *  - Every drawing shares a horizon at y = 36, so a platform, a turbine and
 *    a reservoir placed side by side read as one landscape.
 *  - No perspective, no shading, no detail that disappears below 32 px.
 */

export type IllustrationKey =
  | "plattform"
  | "gassturbin"
  | "kraftnett"
  | "havbunnTilLand"
  | "modentFelt"
  | "havvind"
  | "vannmagasin";

const WATER_OPACITY = 0.12;

function Frame({
  children,
  size,
  label,
}: {
  children: React.ReactNode;
  size: number;
  label?: string;
}) {
  return (
    <svg
      className="illu"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** The sea: a filled band below the shared horizon, plus the surface line. */
function Sea() {
  return (
    <>
      <path
        d="M3 36h42v8H3z"
        fill="currentColor"
        opacity={WATER_OPACITY}
        stroke="none"
      />
      <path d="M3 36h42" />
    </>
  );
}

const drawings: Record<IllustrationKey, React.ReactNode> = {
  /** A fixed platform: jacket legs in the water, deck, derrick. */
  plattform: (
    <>
      <Sea />
      <path d="M11 23h26" />
      <path d="M15 23l-2 18M33 23l2 18" />
      <path d="M14 32h20" />
      <path d="M20 23l4-13 4 13" />
      <path d="M21.5 17h5" />
    </>
  ),

  /** Burning gas offshore to make the platform's own electricity. */
  gassturbin: (
    <>
      <path d="M3 36h42" />
      <path d="M9 26h18v10H9z" />
      <path d="M14 31h8" />
      <path d="M33 36V18h6v18" />
      <path d="M34 13c0-3 4-3 4-6" />
      <path d="M40 13c0-2 3-2 3-5" />
    </>
  ),

  /** Pylon and cables — power from shore, and power sold to Europe. */
  kraftnett: (
    <>
      <path d="M3 36h42" />
      <path d="M18 36l3-24M30 36l-3-24" />
      <path d="M21 12h6" />
      <path d="M13 20h22M15 27h18" />
      <path d="M3 24q7 5 10 0M45 24q-7 5-10 0" />
    </>
  ),

  /** A subsea tieback: wellhead on the seabed, pipeline to a plant on land. */
  havbunnTilLand: (
    <>
      <path
        d="M3 20h27v16H3z"
        fill="currentColor"
        opacity={WATER_OPACITY}
        stroke="none"
      />
      <path d="M3 20q3-2 6 0t6 0 6 0 6 0" />
      <path d="M3 36h27" />
      <path d="M8 36v-6h6v6" />
      <path d="M11 30v-4" />
      <path d="M14 33h13l8-11h4" />
      <path d="M30 36l6-12h9" />
      <path d="M39 22v-5h6v5" />
    </>
  ),

  /** An ageing field: falling production, rising energy spent per barrel. */
  modentFelt: (
    <>
      <path d="M8 8v28h32" />
      <path d="M12 14c9 1 12 15 26 17" />
      <path d="M34 29l4 2-2 4" />
    </>
  ),

  /** Offshore wind: monopile in the water, nacelle, three blades. */
  havvind: (
    <>
      <Sea />
      <path d="M24 36V17" />
      <path d="M24 17V5M24 17l10 6M24 17l-10 6" />
      <circle cx="24" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),

  /** A hydro reservoir behind a dam wall — Europe's battery. */
  vannmagasin: (
    <>
      <path
        d="M3 25h26v11H3z"
        fill="currentColor"
        opacity={WATER_OPACITY}
        stroke="none"
      />
      <path d="M3 21l8-10 7 10" />
      <path d="M3 25h26" />
      <path d="M29 17l4 19" />
      <path d="M29 17h4" />
      <path d="M3 36h42" />
      <path d="M34 27q3 5 3 9" />
    </>
  ),
};

/**
 * Renders one domain illustration.
 *
 * Sizes: 32 inline beside a paragraph, 40 as a section marker. Anything
 * smaller loses the line work; anything larger turns a supporting drawing
 * into the subject of the page.
 */
export function Illustration({
  name,
  size = 32,
  label,
}: {
  name: IllustrationKey;
  size?: number;
  label?: string;
}) {
  const drawing = drawings[name];
  if (!drawing) return null;
  return (
    <Frame size={size} label={label}>
      {drawing}
    </Frame>
  );
}
