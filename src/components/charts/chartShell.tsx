import React, { ReactNode, RefObject } from "react";
import { ElementSize } from "./useElementSize";
import "./charts.css";

export type LegendItem = {
  label: string;
  color: string;
  /** Renders the swatch as diagonal stripes instead of a solid fill */
  striped?: boolean;
  hidden?: boolean;
};

export type TooltipLine = {
  text: string;
  /** Swatch color; omit for lines without a series identity */
  color?: string;
};

export type TooltipState = {
  /** Anchor position in plot-area pixels */
  anchorX: number;
  anchorY: number;
  title?: string;
  lines: TooltipLine[];
};

function Swatch({ color, striped }: { color: string; striped?: boolean }) {
  return (
    <span
      className="svg-chart-swatch"
      style={
        striped
          ? {
              backgroundImage: `repeating-linear-gradient(45deg, transparent 0 3px, ${color} 3px 5px)`,
              border: `1px solid ${color}`,
            }
          : { backgroundColor: color }
      }
    />
  );
}

/**
 * The shared chrome around every chart: title, clickable legend, the
 * measured plot area and the tooltip. The chart components render their SVG
 * as children and drive the tooltip through state.
 */
export function ChartShell({
  title,
  legend,
  onLegendClick,
  tooltip,
  plotRef,
  size,
  children,
}: {
  title?: string;
  legend?: LegendItem[];
  onLegendClick?: (label: string) => void;
  tooltip?: TooltipState | null;
  plotRef: RefObject<HTMLDivElement | null>;
  size: ElementSize;
  children: ReactNode;
}) {
  // Keep the tooltip inside the plot: flip to the left of the anchor on the
  // right half, and never let the anchor leave the measured area
  const tooltipStyle = tooltip && {
    left: Math.max(0, Math.min(tooltip.anchorX, size.width)),
    top: Math.max(24, Math.min(tooltip.anchorY, size.height - 16)),
    transform:
      tooltip.anchorX > size.width * 0.55
        ? "translate(calc(-100% - 12px), -50%)"
        : "translate(12px, -50%)",
  };

  return (
    <div className="svg-chart">
      {title && <div className="svg-chart-title">{title}</div>}
      {legend && legend.length > 0 && (
        <div className="svg-chart-legend">
          {legend.map((item) => (
            <button
              key={item.label}
              type="button"
              className={item.hidden ? "hidden" : undefined}
              aria-pressed={!item.hidden}
              onClick={() => onLegendClick?.(item.label)}
            >
              <Swatch color={item.color} striped={item.striped} />
              {item.label}
            </button>
          ))}
        </div>
      )}
      <div className="svg-chart-plot" ref={plotRef}>
        {children}
        {tooltip && tooltip.lines.length > 0 && (
          <div className="svg-chart-tooltip" style={tooltipStyle!}>
            {tooltip.title && (
              <div className="tooltip-title">{tooltip.title}</div>
            )}
            {tooltip.lines.map((line, index) => (
              <div key={index} className="tooltip-line">
                {line.color && <Swatch color={line.color} />}
                {line.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Default value formatting for ticks and tooltips: Norwegian grouping. */
export function formatNumberNb(value: number): string {
  return value.toLocaleString("nb-NO", { maximumFractionDigits: 1 });
}
