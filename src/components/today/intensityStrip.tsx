import React, { useMemo, useState } from "react";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { FieldToday, shelfToday } from "../../data/norwayToday";
import { intensityClassFor } from "../map/fieldScales";

/**
 * Every producing field on one axis: how much CO₂ it costs to produce a
 * barrel there.
 *
 * This is the chart the briefing exists for. "The fields differ" is an
 * abstraction; a row where Johan Sverdrup sits at 0.2 and Brage at 61 —
 * with Johan Sverdrup's circle thirteen times the area — is not.
 *
 * The axis is square-root scaled. Two thirds of the fields sit below
 * 10 kg/fat, so a linear axis crushes them into the left margin and a log
 * axis exaggerates differences among the cleanest ones that are not the
 * point. Square root keeps the crowded low end readable while still
 * showing the outliers as outliers.
 */
export function IntensityStrip() {
  const dark = usePrefersDarkMode();
  const [active, setActive] = useState<string | undefined>();
  const shelf = shelfToday();

  const width = 100; // percentage-based; the SVG scales with its container
  const height = 190;
  const padding = { top: 26, right: 12, bottom: 38, left: 12 };

  const fields = useMemo(
    () => shelf.fields.filter((f) => !f.noEmissionData),
    [shelf],
  );

  const maxIntensity = Math.max(...fields.map((f) => f.intensity));
  const ticks = [0, 1, 5, 10, 20, 40, 60].filter(
    (t) => t <= maxIntensity * 1.05,
  );

  /** Square-root position on the axis, as a percentage of the plot width. */
  function x(intensity: number): number {
    return (Math.sqrt(intensity) / Math.sqrt(maxIntensity)) * 100;
  }

  /**
   * Beeswarm packing: fields with similar intensity are stacked vertically
   * instead of drawn on top of each other.
   */
  const placed = useMemo(() => {
    const rows: { field: FieldToday; cx: number; cy: number; r: number }[] = [];
    const baseline = height - padding.bottom;
    for (const field of [...fields].sort(
      (a, b) => b.production - a.production,
    )) {
      const r = Math.max(3.5, Math.min(17, 2.6 * Math.sqrt(field.production)));
      const cx = x(field.intensity);
      let cy = baseline - r;
      // Walk upwards until this circle clears everything already placed
      for (let guard = 0; guard < 60; guard++) {
        const clash = rows.find((other) => {
          // Horizontal distance is in percent, vertical in px — convert the
          // percentage to px with a nominal 720 px plot width so the packing
          // matches what a reader sees at the size this chart is drawn
          const dx = ((other.cx - cx) / 100) * 720;
          const dy = other.cy - cy;
          return Math.hypot(dx, dy) < other.r + r + 1.5;
        });
        if (!clash) break;
        cy -= 2;
      }
      rows.push({ field, cx, cy, r });
    }
    return rows;
  }, [fields, maxIntensity]);

  const averageX = x(shelf.averageIntensity);

  return (
    <figure className="intensity-strip">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Utslipp per fat for ${fields.length} felt, fra ${shelf.cleanest.intensity} til ${shelf.dirtiest.intensity} kg CO₂ per fat`}
      >
        {/* Baseline */}
        <line
          x1={0}
          x2={100}
          y1={height - padding.bottom}
          y2={height - padding.bottom}
          className="axis"
          vectorEffect="non-scaling-stroke"
        />

        {/* Shelf average */}
        <line
          x1={averageX}
          x2={averageX}
          y1={padding.top - 12}
          y2={height - padding.bottom}
          className="average"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* The circles and every label live in HTML, not SVG: the SVG is
          stretched by preserveAspectRatio="none" and would distort them */}
      <div className="strip-plot">
        <div
          className="strip-average-label"
          style={{ left: `${averageX}%` }}
          aria-hidden="true"
        >
          Snitt {shelf.averageIntensity.toLocaleString("nb-NO")}
        </div>

        {placed.map(({ field, cx, cy, r }) => {
          const cls = intensityClassFor(field.intensity);
          return (
            <button
              type="button"
              key={field.field}
              className={`strip-dot ${active === field.field ? "active" : ""}`}
              style={{
                left: `${cx}%`,
                top: `${cy}px`,
                width: r * 2,
                height: r * 2,
                backgroundColor: dark ? cls.dark : cls.light,
              }}
              onMouseEnter={() => setActive(field.field)}
              onMouseLeave={() => setActive(undefined)}
              onFocus={() => setActive(field.field)}
              onBlur={() => setActive(undefined)}
              onClick={() => setActive(field.field)}
              aria-label={`${field.field}: ${field.intensity} kg CO₂ per fat, ${field.production} mill. Sm³ o.e. i året`}
            />
          );
        })}

        {/* The two ends of the range are always named — they are the point */}
        {[shelf.cleanest, shelf.dirtiest].map((field) => (
          <div
            key={field.field}
            className={`strip-anchor ${field === shelf.cleanest ? "left" : "right"}`}
            style={{ left: `${x(field.intensity)}%` }}
          >
            <span className="anchor-name">{field.field}</span>
            <span className="anchor-value">
              {field.intensity.toLocaleString("nb-NO")} kg/fat
            </span>
          </div>
        ))}

        {active && (
          <FieldTooltip
            field={fields.find((f) => f.field === active)!}
            x={x(fields.find((f) => f.field === active)!.intensity)}
          />
        )}
      </div>

      <div className="strip-axis">
        {ticks.map((tick) => (
          <span key={tick} style={{ left: `${x(tick)}%` }}>
            {tick}
          </span>
        ))}
        <span className="strip-unit">kg CO₂ per fat</span>
      </div>

      <figcaption>
        Hver sirkel er ett felt. Størrelsen er hvor mye det produserer, og
        plasseringen er hvor mye CO₂ det koster å produsere ett fat der. De to
        største sirklene ligger helt til venstre – det er ikke de store feltene
        som slipper ut mest per fat.
      </figcaption>
    </figure>
  );
}

function FieldTooltip({ field, x }: { field: FieldToday; x: number }) {
  return (
    <div className="strip-tooltip" style={{ left: `${x}%` }} role="status">
      <strong>{field.field}</strong>
      <span>
        {field.intensity.toLocaleString("nb-NO")} kg CO₂ per fat ·{" "}
        {field.production.toLocaleString("nb-NO")} mill. Sm³ o.e./år
      </span>
      <span className="tooltip-meta">
        {field.sea} · {field.produces} · funnet {field.discovered}
      </span>
    </div>
  );
}
