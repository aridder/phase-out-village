import React from "react";
import { LinearScale, linearScale } from "./scale";
import { ElementSize } from "./useElementSize";

/** Pixel rectangle of the data area inside the SVG. */
export type PlotArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const TICK_FONT = 11;
export const AXIS_TITLE_FONT = 12;

/**
 * Computes the plot area from the outer size and the labels that need room:
 * the left margin fits the widest y tick label, the bottom fits x labels and
 * an optional axis title. Character-width estimation is deliberately simple;
 * the margins are padded enough that a couple of pixels of font variation
 * across platforms doesn't clip anything.
 */
export function computePlotArea(
  width: number,
  height: number,
  yTickLabels: string[],
  options: { xLabel?: string; yLabel?: string },
): PlotArea {
  const maxTickChars = Math.max(0, ...yTickLabels.map((label) => label.length));
  const left =
    (options.yLabel ? AXIS_TITLE_FONT + 8 : 0) +
    maxTickChars * (TICK_FONT * 0.62) +
    10;
  const bottom = TICK_FONT + 12 + (options.xLabel ? AXIS_TITLE_FONT + 8 : 0);
  const top = 6;
  // Room for the right half of the last x label (years are 4 characters)
  const right = 16;
  return {
    left,
    top,
    width: Math.max(10, width - left - right),
    height: Math.max(10, height - top - bottom),
  };
}

/**
 * Builds the value (y) axis every chart shares. The plot area can't be known
 * until the y tick labels are, and the labels can't be known without a scale —
 * so a provisional scale learns the labels, the plot area is measured from
 * them, and the real scale is built to fit. All three charts need exactly this
 * dance; keeping it in one place stops them from drifting apart.
 *
 * @param yMax - Top of the value domain (0 is always the bottom).
 */
export function buildValueAxis(
  size: ElementSize,
  yMax: number,
  formatY: (value: number) => string,
  options: { xLabel?: string; yLabel?: string },
): { plot: PlotArea; yScale: LinearScale } {
  const maxYTicks = Math.min(8, Math.max(3, Math.floor(size.height / 55)));
  const provisional = linearScale(0, yMax, [0, 1], maxYTicks);
  const plot = computePlotArea(
    size.width,
    size.height,
    provisional.ticks.map(formatY),
    options,
  );
  const yScale = linearScale(
    0,
    yMax,
    [plot.top + plot.height, plot.top],
    maxYTicks,
  );
  return { plot, yScale };
}

/**
 * The transparent rectangle over the plot area that captures pointer events.
 * Translates screen coordinates into the SVG's own coordinate space (the SVG
 * has no viewBox, so one user unit is one CSS pixel) and hands back local
 * (x, y). Identical in all three charts, so it lives here.
 */
export function CaptureArea({
  plot,
  onMove,
  onLeave,
}: {
  plot: PlotArea;
  onMove: (x: number, y: number) => void;
  onLeave: () => void;
}) {
  function handle(event: React.PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    onMove(event.clientX - rect.left, event.clientY - rect.top);
  }
  return (
    <rect
      x={plot.left}
      y={plot.top}
      width={plot.width}
      height={plot.height}
      fill="transparent"
      onPointerMove={handle}
      onPointerDown={handle}
      onPointerLeave={onLeave}
    />
  );
}

/**
 * Grid lines, tick labels and axis titles. Rendered inside the chart's SVG.
 * Colors ride on currentColor so light/dark theme is pure CSS.
 */
export function Axes({
  plot,
  yScale,
  formatY,
  xTicks,
  xLabel,
  yLabel,
  xGrid = false,
}: {
  plot: PlotArea;
  yScale: LinearScale;
  formatY: (value: number) => string;
  xTicks: { px: number; label: string }[];
  xLabel?: string;
  yLabel?: string;
  /** Vertical grid lines (used by line/scatter, skipped for bars) */
  xGrid?: boolean;
}) {
  const right = plot.left + plot.width;
  const bottom = plot.top + plot.height;
  const gridOpacity = 0.14;

  return (
    <g fontSize={TICK_FONT} fill="currentColor">
      {yScale.ticks.map((tick) => {
        const y = yScale.toPx(tick);
        return (
          <g key={tick}>
            <line
              x1={plot.left}
              x2={right}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity={gridOpacity}
            />
            <text x={plot.left - 6} y={y + TICK_FONT / 3} textAnchor="end">
              {formatY(tick)}
            </text>
          </g>
        );
      })}
      {xTicks.map(({ px, label }) => (
        <g key={`${px}-${label}`}>
          {xGrid && (
            <line
              x1={px}
              x2={px}
              y1={plot.top}
              y2={bottom}
              stroke="currentColor"
              strokeOpacity={gridOpacity}
            />
          )}
          <text x={px} y={bottom + TICK_FONT + 4} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <line
        x1={plot.left}
        x2={right}
        y1={bottom}
        y2={bottom}
        stroke="currentColor"
        strokeOpacity={0.35}
      />
      {xLabel && (
        <text
          x={plot.left + plot.width / 2}
          y={bottom + TICK_FONT + AXIS_TITLE_FONT + 10}
          textAnchor="middle"
          fontSize={AXIS_TITLE_FONT}
        >
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text
          transform={`translate(${AXIS_TITLE_FONT}, ${plot.top + plot.height / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={AXIS_TITLE_FONT}
          // Squeeze long titles into the plot height instead of clipping
          // them at the SVG edge (the emission intensity chart in a 250px
          // container is the worst case)
          {...(yLabel.length * AXIS_TITLE_FONT * 0.62 > plot.height
            ? {
                textLength: plot.height,
                lengthAdjust: "spacingAndGlyphs" as const,
              }
            : {})}
        >
          {yLabel}
        </text>
      )}
    </g>
  );
}
