import React, { useId, useMemo, useState } from "react";
import { Axes, buildValueAxis, CaptureArea } from "./axes";
import { curvePath, monotoneSegments, segmentToPath } from "./curve";
import { yearTicks } from "./scale";
import { ChartShell, formatNumberNb, TooltipState } from "./chartShell";
import { useElementSize } from "./useElementSize";
import { useHiddenLabels } from "./useHiddenLabels";

export type LinePoint = {
  /** Numeric x value (a year in every current chart) */
  x: number;
  /** y value; undefined creates a gap (or is skipped with spanGaps) */
  y: number | undefined;
  /** Estimated points get dashed line segments and star markers */
  estimated?: boolean;
};

export type LineSeries = {
  label: string;
  /** Line color; any CSS color, including var(--chart-…) references */
  color: string;
  /** Area fill color under the line; omit for no fill */
  fill?: string;
  fillOpacity?: number;
  /** Dash the whole series (reference lines) */
  dashed?: boolean;
  /** Skip undefined values instead of breaking the line */
  spanGaps?: boolean;
  /** Hide the point markers (dense series) */
  showPoints?: boolean;
  /** Controlled visibility; only honored together with onLegendClick */
  hidden?: boolean;
  points: LinePoint[];
};

type DefinedPoint = { x: number; y: number; estimated?: boolean };

type HoverState = {
  tooltip: TooltipState;
  guideX?: number;
  markers: { px: number; py: number; color: string }[];
};

/** Splits a series into runs of consecutive defined points. */
function definedRuns(series: LineSeries): DefinedPoint[][] {
  if (series.spanGaps) {
    const run = series.points.filter((p): p is DefinedPoint => p.y != null);
    return run.length > 0 ? [run] : [];
  }
  const runs: DefinedPoint[][] = [];
  let current: DefinedPoint[] = [];
  for (const point of series.points) {
    if (point.y == null) {
      if (current.length > 0) runs.push(current);
      current = [];
    } else {
      current.push(point as DefinedPoint);
    }
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/** Eight-spoke star marker for estimated values. */
function Star({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const r = 4.5;
  const d = r * Math.SQRT1_2;
  return (
    <g style={{ stroke: color }} strokeWidth={1.5}>
      <line x1={cx - r} x2={cx + r} y1={cy} y2={cy} />
      <line x1={cx} x2={cx} y1={cy - r} y2={cy + r} />
      <line x1={cx - d} x2={cx + d} y1={cy - d} y2={cy + d} />
      <line x1={cx - d} x2={cx + d} y1={cy + d} y2={cy - d} />
    </g>
  );
}

/**
 * Line/area chart on a numeric (year) x axis. Covers what the app needs:
 * smooth monotone curves, area fills, gaps, dashed estimated segments, a
 * clickable legend and an index- or point-mode tooltip.
 */
export function LineChart({
  title,
  series,
  xLabel,
  yLabel,
  xMin,
  xMax,
  yMax,
  formatX = (x) => String(x),
  formatY = formatNumberNb,
  tooltipLabel,
  tooltipMode = "index",
  legend,
  onLegendClick,
}: {
  title?: string;
  series: LineSeries[];
  xLabel?: string;
  yLabel?: string;
  xMin?: number;
  xMax?: number;
  yMax?: number;
  /** X tick/tooltip-title format (years: no digit grouping) */
  formatX?: (x: number) => string;
  /** Y axis tick format; tooltips fall back to full nb-NO numbers */
  formatY?: (y: number) => string;
  /** One tooltip line per series point */
  tooltipLabel?: (series: LineSeries, point: DefinedPoint) => string;
  /** "index": all series at nearest x. "point": nearest single point. */
  tooltipMode?: "index" | "point";
  /** Defaults to visible for two or more series */
  legend?: boolean;
  /** Makes legend clicks controlled (used for the focus behavior) */
  onLegendClick?: (label: string) => void;
}) {
  const [plotRef, size] = useElementSize();
  const clipId = useId();
  const { hidden: hiddenLabels, toggle } = useHiddenLabels();
  const [hover, setHover] = useState<HoverState | null>(null);

  const isHidden = (s: LineSeries) =>
    onLegendClick ? !!s.hidden : hiddenLabels.has(s.label);
  const visibleSeries = series.filter((s) => !isHidden(s));

  const geometry = useMemo(() => {
    if (size.width < 60 || size.height < 60) return null;

    const runsBySeries = visibleSeries.map(definedRuns);
    const definedPoints = runsBySeries.flat(2);

    // Fall back to a unit domain when everything is hidden or empty
    const xLow =
      xMin ??
      (definedPoints.length ? Math.min(...definedPoints.map((p) => p.x)) : 0);
    const xHigh =
      xMax ??
      (definedPoints.length ? Math.max(...definedPoints.map((p) => p.x)) : 1);
    const yHigh = yMax ?? Math.max(0, ...definedPoints.map((p) => p.y));

    const { plot, yScale } = buildValueAxis(size, yHigh, formatY, {
      xLabel,
      yLabel,
    });
    const xSpan = Math.max(1e-9, xHigh - xLow);
    const xToPx = (x: number) => plot.left + ((x - xLow) / xSpan) * plot.width;
    const xTicks = yearTicks(xLow, xHigh, Math.floor(plot.width / 55)).map(
      (year) => ({ px: xToPx(year), label: formatX(year) }),
    );

    return { plot, yScale, xToPx, xTicks, runsBySeries };
  }, [
    size.width,
    size.height,
    series,
    hiddenLabels,
    xMin,
    xMax,
    yMax,
    formatX,
    formatY,
    xLabel,
    yLabel,
  ]);

  function defaultLabel(s: LineSeries, point: DefinedPoint) {
    return `${s.label}: ${formatNumberNb(point.y)}`;
  }

  function handlePointer(px: number, py: number) {
    if (!geometry) return;

    if (tooltipMode === "point") {
      let best: { s: LineSeries; p: DefinedPoint; d: number } | null = null;
      for (const s of visibleSeries) {
        for (const run of definedRuns(s)) {
          for (const p of run) {
            const dx = geometry.xToPx(p.x) - px;
            const dy = geometry.yScale.toPx(p.y) - py;
            const d = dx * dx + dy * dy;
            if (d < (best?.d ?? 26 * 26)) best = { s, p, d };
          }
        }
      }
      if (!best) {
        setHover(null);
        return;
      }
      const bx = geometry.xToPx(best.p.x);
      const by = geometry.yScale.toPx(best.p.y);
      setHover({
        tooltip: {
          anchorX: bx,
          anchorY: by,
          lines: [
            {
              color: best.s.color,
              text: (tooltipLabel ?? defaultLabel)(best.s, best.p),
            },
          ],
        },
        markers: [{ px: bx, py: by, color: best.s.color }],
      });
      return;
    }

    // Index mode: snap to the nearest x that has data in any visible series
    const allX = [
      ...new Set(
        visibleSeries.flatMap((s) =>
          s.points.filter((p) => p.y != null).map((p) => p.x),
        ),
      ),
    ].sort((a, b) => a - b);
    if (allX.length === 0) {
      setHover(null);
      return;
    }
    const xValue = allX.reduce((a, b) =>
      Math.abs(geometry.xToPx(b) - px) < Math.abs(geometry.xToPx(a) - px)
        ? b
        : a,
    );
    const entries = visibleSeries.flatMap((s) => {
      const p = s.points.find(
        (point): point is DefinedPoint => point.x === xValue && point.y != null,
      );
      return p ? [{ s, p }] : [];
    });
    setHover({
      tooltip: {
        anchorX: geometry.xToPx(xValue),
        anchorY: py,
        title: formatX(xValue),
        lines: entries.map(({ s, p }) => ({
          color: s.color,
          text: (tooltipLabel ?? defaultLabel)(s, p),
        })),
      },
      guideX: geometry.xToPx(xValue),
      markers: entries.map(({ s, p }) => ({
        px: geometry.xToPx(p.x),
        py: geometry.yScale.toPx(p.y),
        color: s.color,
      })),
    });
  }

  const showLegend = legend ?? series.length > 1;
  return (
    <ChartShell
      title={title}
      legend={
        showLegend
          ? series.map((s) => ({
              label: s.label,
              color: s.color,
              hidden: isHidden(s),
            }))
          : undefined
      }
      onLegendClick={onLegendClick ?? toggle}
      tooltip={hover?.tooltip}
      plotRef={plotRef}
      size={size}
    >
      {geometry && (
        <svg role="img" aria-label={title}>
          <defs>
            <clipPath id={clipId}>
              <rect
                x={geometry.plot.left}
                y={geometry.plot.top - 5}
                width={geometry.plot.width}
                height={geometry.plot.height + 5}
              />
            </clipPath>
          </defs>
          <Axes
            plot={geometry.plot}
            yScale={geometry.yScale}
            formatY={formatY}
            xTicks={geometry.xTicks}
            xLabel={xLabel}
            yLabel={yLabel}
            xGrid
          />
          <g clipPath={`url(#${clipId})`}>
            {visibleSeries.map((s, seriesIndex) => {
              const runs = geometry.runsBySeries[seriesIndex];
              const baseline = geometry.yScale.toPx(
                Math.max(0, geometry.yScale.min),
              );
              return (
                <g key={s.label}>
                  {runs.map((run, runIndex) => {
                    const pixels = run.map((p) => ({
                      x: geometry.xToPx(p.x),
                      y: geometry.yScale.toPx(p.y),
                    }));
                    // One bezier per segment so estimated stretches can be
                    // dashed independently of the measured ones
                    const segments = monotoneSegments(pixels);
                    let solid = "";
                    let dashed = "";
                    segments.forEach((segment, i) => {
                      const isDashed = s.dashed || run[i + 1].estimated;
                      const part = `M${segment.p0.x.toFixed(2)},${segment.p0.y.toFixed(2)}${segmentToPath(segment)}`;
                      if (isDashed) dashed += part;
                      else solid += part;
                    });
                    const area =
                      s.fill && pixels.length > 1
                        ? `${curvePath(pixels)}L${pixels[pixels.length - 1].x.toFixed(2)},${baseline}L${pixels[0].x.toFixed(2)},${baseline}Z`
                        : undefined;
                    return (
                      <g key={runIndex}>
                        {area && (
                          <path
                            d={area}
                            style={{ fill: s.fill }}
                            fillOpacity={s.fillOpacity ?? 0.2}
                          />
                        )}
                        {solid && (
                          <path
                            d={solid}
                            fill="none"
                            style={{ stroke: s.color }}
                            strokeWidth={2}
                            strokeLinecap="round"
                          />
                        )}
                        {dashed && (
                          <path
                            d={dashed}
                            fill="none"
                            style={{ stroke: s.color }}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            strokeLinecap="round"
                          />
                        )}
                        {run.map(
                          (p, i) =>
                            (s.showPoints !== false || run.length === 1) &&
                            (p.estimated ? (
                              <Star
                                key={i}
                                cx={pixels[i].x}
                                cy={pixels[i].y}
                                color={s.color}
                              />
                            ) : (
                              <circle
                                key={i}
                                cx={pixels[i].x}
                                cy={pixels[i].y}
                                r={3}
                                style={{ fill: s.color }}
                              />
                            )),
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {hover?.guideX != null && (
              <line
                x1={hover.guideX}
                x2={hover.guideX}
                y1={geometry.plot.top}
                y2={geometry.plot.top + geometry.plot.height}
                stroke="currentColor"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            )}
            {hover?.markers.map((marker, i) => (
              <circle
                key={i}
                cx={marker.px}
                cy={marker.py}
                r={4.5}
                style={{ fill: marker.color }}
                stroke="white"
                strokeWidth={1.5}
              />
            ))}
          </g>
          <CaptureArea
            plot={geometry.plot}
            onMove={handlePointer}
            onLeave={() => setHover(null)}
          />
        </svg>
      )}
    </ChartShell>
  );
}
