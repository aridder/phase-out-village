import React from "react";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { intensityClasses, NO_DATA_COLOR, RETIRED_COLOR } from "./fieldScales";

/**
 * The map legend.
 *
 * It reads its colours from the same module the map draws with, so it can
 * never describe a colour the map no longer uses — which is exactly what
 * the old prose legend ("rødt = i drift, blått = valgt") had drifted into.
 */
export function MapLegend() {
  const dark = usePrefersDarkMode();
  const theme = dark ? "dark" : "light";

  return (
    <div className="map-legend">
      <div className="legend-block">
        <div className="legend-title">Størrelse = produksjon</div>
        <div className="legend-sizes">
          {[
            { r: 26, label: "44" },
            { r: 14, label: "13" },
            { r: 7, label: "3" },
          ].map((size) => (
            <span key={size.label} className="legend-size">
              <span
                className="dot"
                style={{ width: size.r, height: size.r }}
                aria-hidden="true"
              />
              <span>{size.label}</span>
            </span>
          ))}
          <span className="legend-unit">mill. Sm³ o.e./år</span>
        </div>
      </div>

      <div className="legend-block">
        <div className="legend-title">Farge = utslipp per fat</div>
        <div className="legend-swatches">
          {intensityClasses.map((c) => (
            <span key={c.label} className="legend-swatch">
              <span
                className="chip"
                style={{ backgroundColor: c[theme] }}
                aria-hidden="true"
              />
              <span>
                {c.to === Infinity ? `over ${c.from}` : `${c.from}–${c.to}`}
              </span>
            </span>
          ))}
          <span className="legend-unit">kg CO₂ per fat</span>
        </div>
      </div>

      <div className="legend-block">
        <div className="legend-title">Status</div>
        <div className="legend-states">
          <span className="legend-state">
            <span className="chip ring-solid" aria-hidden="true" />
            <span>I drift</span>
          </span>
          <span className="legend-state">
            <span className="chip ring-dashed" aria-hidden="true" />
            <span>Sluttdato satt</span>
          </span>
          <span className="legend-state">
            <span
              className="chip small"
              style={{ backgroundColor: RETIRED_COLOR[theme] }}
              aria-hidden="true"
            />
            <span>Avviklet</span>
          </span>
          <span className="legend-state">
            <span
              className="chip"
              style={{ backgroundColor: NO_DATA_COLOR[theme] }}
              aria-hidden="true"
            />
            <span>Ingen utslippstall</span>
          </span>
        </div>
      </div>

      <div className="legend-note">
        De minste feltene tegnes med en minstestørrelse, så de er mulige å
        treffe. Når hele sokkelen er i bildet skyves boblene fra hverandre for å
        unngå overlapp – streken viser hvor feltet egentlig ligger.
      </div>
    </div>
  );
}
