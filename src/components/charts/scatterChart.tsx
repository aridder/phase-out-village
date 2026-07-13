import React, { useMemo, useRef, useState } from "react";
import { Axes, computePlotArea, PlotArea } from "./axes";
import { linearScale } from "./scale";
import { ChartShell, formatNumberNb, TooltipState } from "./chartShell";
import { useElementSize } from "./useElementSize";

export type ScatterPoint = {
  label: string;
  x: number;
  y: number | undefined;
  color: string;
};

export type BoxAnnotation = {
  yMin: number;
  yMax: number;
  label: string;
  fill: string;
  stroke: string;
};

/**
 * Scatter plot with fixed axes and an optional horizontal reference band
 * (the "world average" box on the emission intensity chart).
 */
export function ScatterChart({
  title,
  points,
  xLabel,
  yLabel,
  xMax,
  yMax,
  formatY = formatNumberNb,
  tooltipLabel,
  annotation,
}: {
  title?: string;
  points: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  xMax: number;
  yMax: number;
  formatY?: (y: number) => string;
  tooltipLabel?: (point: ScatterPoint & { y: number }) => string;
  annotation?: BoxAnnotation;
}) {
  const [plotRef, size] = useElementSize();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const definedPoints = points.filter(
    (p): p is ScatterPoint & { y: number } => p.y != null,
  );

  const geometry = useMemo(() => {
    if (size.width < 60 || size.height < 60) return null;
    const maxYTicks = Math.min(8, Math.max(3, Math.floor(size.height / 55)));
    const provisional = linearScale(0, yMax, [0, 1], maxYTicks);
    const plot: PlotArea = computePlotArea(
      size.width,
      size.height,
      provisional.ticks.map(formatY),
      { xLabel, yLabel },
    );
    const yScale = linearScale(
      0,
      yMax,
      [plot.top + plot.height, plot.top],
      maxYTicks,
    );
    const xScale = linearScale(
      0,
      xMax,
      [plot.left, plot.left + plot.width],
      Math.max(3, Math.floor(plot.width / 70)),
    );
    const xTicks = xScale.ticks.map((tick) => ({
      px: xScale.toPx(tick),
      label: formatNumberNb(tick),
    }));
    return { plot, xScale, yScale, xTicks };
  }, [size.width, size.height, xMax, yMax, formatY, xLabel, yLabel]);

  function handlePointer(event: React.PointerEvent<SVGRectElement>) {
    if (!geometry || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;

    let best: { point: ScatterPoint & { y: number }; d: number } | null = null;
    for (const point of definedPoints) {
      const dx = geometry.xScale.toPx(point.x) - px;
      const dy = geometry.yScale.toPx(point.y) - py;
      const d = dx * dx + dy * dy;
      if (d < (best?.d ?? 22 * 22)) best = { point, d };
    }
    if (!best) {
      setTooltip(null);
      return;
    }
    setTooltip({
      anchorX: geometry.xScale.toPx(best.point.x),
      anchorY: geometry.yScale.toPx(best.point.y),
      lines: [
        {
          color: best.point.color,
          text: tooltipLabel
            ? tooltipLabel(best.point)
            : `${best.point.label}: ${formatNumberNb(best.point.y)}`,
        },
      ],
    });
  }

  return (
    <ChartShell title={title} tooltip={tooltip} plotRef={plotRef} size={size}>
      {geometry && (
        <svg ref={svgRef} role="img" aria-label={title}>
          <Axes
            plot={geometry.plot}
            yScale={geometry.yScale}
            formatY={formatY}
            xTicks={geometry.xTicks}
            xLabel={xLabel}
            yLabel={yLabel}
            xGrid
          />
          {annotation && (
            <g>
              <rect
                x={geometry.plot.left}
                y={geometry.yScale.toPx(annotation.yMax)}
                width={geometry.plot.width}
                height={
                  geometry.yScale.toPx(annotation.yMin) -
                  geometry.yScale.toPx(annotation.yMax)
                }
                style={{ fill: annotation.fill, stroke: annotation.stroke }}
                strokeWidth={1}
              />
              <text
                x={geometry.plot.left + geometry.plot.width / 2}
                y={
                  (geometry.yScale.toPx(annotation.yMin) +
                    geometry.yScale.toPx(annotation.yMax)) /
                    2 +
                  4
                }
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill="currentColor"
              >
                {annotation.label}
              </text>
            </g>
          )}
          {definedPoints
            // Fixed axes: points outside the window are not drawn (parity
            // with the old chart, which clipped them away)
            .filter((point) => point.x <= xMax && point.y <= yMax)
            .map((point) => (
              <circle
                key={point.label}
                cx={geometry.xScale.toPx(point.x)}
                cy={geometry.yScale.toPx(point.y)}
                r={6}
                style={{ fill: point.color }}
                fillOpacity={0.85}
              />
            ))}
          <rect
            x={geometry.plot.left}
            y={geometry.plot.top}
            width={geometry.plot.width}
            height={geometry.plot.height}
            fill="transparent"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={() => setTooltip(null)}
          />
        </svg>
      )}
    </ChartShell>
  );
}
