/**
 * Linear scale with "nice" tick values, the numeric backbone of the SVG
 * charts. No dependencies — the 1/2/5-step algorithm is the same one every
 * charting library uses.
 */
export type LinearScale = {
  /** Domain minimum (snapped to a tick boundary) */
  min: number;
  /** Domain maximum (snapped to a tick boundary) */
  max: number;
  /** Tick values from min to max inclusive */
  ticks: number[];
  /** Maps a domain value to a pixel position */
  toPx: (value: number) => number;
};

/**
 * Picks a "nice" step (1, 2 or 5 times a power of ten) so that the span is
 * divided into at most `maxTicks` intervals.
 */
function niceStep(span: number, maxTicks: number): number {
  const rough = span / Math.max(1, maxTicks);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  for (const multiplier of [1, 2, 5, 10]) {
    if (magnitude * multiplier >= rough) return magnitude * multiplier;
  }
  return magnitude * 10;
}

/**
 * Builds a linear scale covering [min, max], extended outwards to tick
 * boundaries. Handles degenerate domains (empty data, min === max) by
 * falling back to a 0–1 span so charts never divide by zero.
 *
 * @param min - Smallest domain value (use 0 for beginAtZero behavior).
 * @param max - Largest domain value.
 * @param pxRange - [pixel at min, pixel at max]; invert for the y axis.
 * @param maxTicks - Upper bound on the number of tick intervals.
 */
export function linearScale(
  min: number,
  max: number,
  pxRange: [number, number],
  maxTicks: number,
): LinearScale {
  if (!Number.isFinite(min)) min = 0;
  if (!Number.isFinite(max) || max <= min) max = min + 1;

  const step = niceStep(max - min, maxTicks);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  // Multiply from integer counts instead of accumulating floats, so ticks
  // like 0.3 don't drift into 0.30000000000000004
  for (let i = 0; niceMin + i * step <= niceMax + step / 2; i++) {
    ticks.push(niceMin + i * step);
  }

  const [px0, px1] = pxRange;
  const span = niceMax - niceMin;
  return {
    min: niceMin,
    max: niceMax,
    ticks,
    toPx: (value) => px0 + ((value - niceMin) / span) * (px1 - px0),
  };
}

/**
 * Integer ticks for a year axis: picks a step from whole-year candidates so
 * the labels fit, and keeps the domain exactly [min, max] (years should not
 * be extended outwards the way value axes are).
 */
export function yearTicks(
  min: number,
  max: number,
  maxTicks: number,
): number[] {
  const span = max - min;
  const step =
    [1, 2, 5, 10, 20, 50].find((s) => span / s <= Math.max(1, maxTicks)) ?? 50;
  const ticks: number[] = [];
  for (let year = Math.ceil(min / step) * step; year <= max; year += step) {
    ticks.push(year);
  }
  return ticks;
}
