import React, { useId, useMemo, useState } from "react";
import { Axes, buildValueAxis, CaptureArea } from "./axes";
import { ChartShell, formatNumberNb, TooltipState } from "./chartShell";
import { useElementSize } from "./useElementSize";
import { useHiddenLabels } from "./useHiddenLabels";

export type BarSeries = {
  label: string;
  /** Fill color (or stripe color when striped); var(--chart-…) works */
  color: string;
  /** Diagonal stripes on transparent background (the reduction bars) */
  striped?: boolean;
  /** Optional outline around the segments */
  stroke?: string;
  fillOpacity?: number;
  /** One value per category, aligned with the categories prop */
  values: (number | undefined)[];
};

/**
 * Stacked bar chart over a category axis (years, in every current chart).
 * All series stack into a single column per category; the tooltip works in
 * index mode like the rest of the app's charts.
 */
export function BarChart({
  title,
  categories,
  series,
  xLabel,
  yLabel,
  formatY = formatNumberNb,
  tooltipLabel,
  legend,
}: {
  title?: string;
  categories: (string | number)[];
  series: BarSeries[];
  xLabel?: string;
  yLabel?: string;
  formatY?: (y: number) => string;
  /** One tooltip line per stack segment */
  tooltipLabel?: (series: BarSeries, value: number) => string;
  /** Defaults to visible for two or more series */
  legend?: boolean;
}) {
  const [plotRef, size] = useElementSize();
  const patternIdBase = useId();
  const { hidden: hiddenLabels, toggle } = useHiddenLabels();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState(0);

  const visibleSeries = series.filter((s) => !hiddenLabels.has(s.label));

  const geometry = useMemo(() => {
    if (size.width < 60 || size.height < 60) return null;

    const stackTotals = categories.map((_, i) =>
      visibleSeries.reduce((sum, s) => sum + Math.max(0, s.values[i] ?? 0), 0),
    );
    const { plot, yScale } = buildValueAxis(
      size,
      Math.max(...stackTotals, 0),
      formatY,
      { xLabel, yLabel },
    );

    const band = plot.width / Math.max(1, categories.length);
    const barWidth = Math.max(2, band * 0.72);
    const barX = (i: number) => plot.left + i * band + (band - barWidth) / 2;

    // Show every n-th category label so they never collide
    const labelStep = Math.ceil(
      categories.length / Math.max(1, Math.floor(plot.width / 48)),
    );
    const xTicks = categories
      .map((category, i) => ({
        px: plot.left + (i + 0.5) * band,
        label: String(category),
        index: i,
      }))
      .filter(({ index }) => index % labelStep === 0);

    return { plot, yScale, band, barWidth, barX, xTicks };
  }, [
    size.width,
    size.height,
    categories,
    series,
    hiddenLabels,
    formatY,
    xLabel,
    yLabel,
  ]);

  function handlePointer(px: number, py: number) {
    if (!geometry) return;
    const index = Math.min(
      categories.length - 1,
      Math.max(0, Math.floor((px - geometry.plot.left) / geometry.band)),
    );
    setHoverIndex(index);
    setHoverY(py);
  }

  const tooltip: TooltipState | null =
    geometry && hoverIndex != null
      ? {
          anchorX: geometry.plot.left + (hoverIndex + 0.5) * geometry.band,
          anchorY: hoverY,
          title: String(categories[hoverIndex]),
          lines: visibleSeries.flatMap((s) => {
            const value = s.values[hoverIndex];
            // Reduction segments at zero (historical years, empty plans)
            // are noise in the tooltip — skip them
            if (value == null || (value === 0 && s.striped)) return [];
            return [
              {
                color: s.color,
                striped: s.striped,
                text: tooltipLabel
                  ? tooltipLabel(s, value)
                  : `${s.label}: ${formatNumberNb(value)}`,
              },
            ];
          }),
        }
      : null;

  const showLegend = legend ?? series.length > 1;
  return (
    <ChartShell
      title={title}
      legend={
        showLegend
          ? series.map((s) => ({
              label: s.label,
              color: s.color,
              striped: s.striped,
              hidden: hiddenLabels.has(s.label),
            }))
          : undefined
      }
      onLegendClick={toggle}
      tooltip={tooltip}
      plotRef={plotRef}
      size={size}
    >
      {geometry && (
        <svg role="img" aria-label={title}>
          <defs>
            {series.map(
              (s, i) =>
                s.striped && (
                  <pattern
                    key={s.label}
                    id={`${patternIdBase}-${i}`}
                    patternUnits="userSpaceOnUse"
                    width={8}
                    height={8}
                  >
                    <path
                      d="M-2,2 L2,-2 M0,8 L8,0 M6,10 L10,6"
                      style={{ stroke: s.color }}
                      strokeWidth={2}
                    />
                  </pattern>
                ),
            )}
          </defs>
          <Axes
            plot={geometry.plot}
            yScale={geometry.yScale}
            formatY={formatY}
            xTicks={geometry.xTicks}
            xLabel={xLabel}
            yLabel={yLabel}
          />
          {hoverIndex != null && (
            <rect
              x={geometry.plot.left + hoverIndex * geometry.band}
              y={geometry.plot.top}
              width={geometry.band}
              height={geometry.plot.height}
              fill="currentColor"
              fillOpacity={0.07}
            />
          )}
          {categories.map((_, categoryIndex) => {
            let stackTop = geometry.yScale.toPx(0);
            return (
              <g key={categoryIndex}>
                {series.map((s, seriesIndex) => {
                  if (hiddenLabels.has(s.label)) return null;
                  const value = Math.max(0, s.values[categoryIndex] ?? 0);
                  const zeroY = geometry.yScale.toPx(0);
                  const height = zeroY - geometry.yScale.toPx(value);
                  if (height <= 0) return null;
                  const y = stackTop - height;
                  stackTop = y;
                  // A hairline of surface between stacked segments, and softly
                  // rounded corners — reads cleaner than hard-butted blocks
                  const gap = 1.5;
                  const drawnHeight = Math.max(1, height - gap);
                  // Colors go through style so var(--chart-…) references work;
                  // striped series fill from the SVG pattern instead
                  const style: React.CSSProperties = {};
                  if (!s.striped) style.fill = s.color;
                  if (s.stroke) style.stroke = s.stroke;
                  return (
                    <rect
                      key={s.label}
                      x={geometry.barX(categoryIndex)}
                      y={y}
                      width={geometry.barWidth}
                      height={drawnHeight}
                      rx={2}
                      ry={2}
                      fill={
                        s.striped
                          ? `url(#${patternIdBase}-${seriesIndex})`
                          : undefined
                      }
                      fillOpacity={s.fillOpacity}
                      strokeWidth={s.stroke ? 1 : undefined}
                      style={style}
                    />
                  );
                })}
              </g>
            );
          })}
          <CaptureArea
            plot={geometry.plot}
            onMove={handlePointer}
            onLeave={() => setHoverIndex(null)}
          />
        </svg>
      )}
    </ChartShell>
  );
}
