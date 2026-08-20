import React from "react";

/**
 * Says what the italic red numbers in the data tables mean.
 *
 * The tables have always marked projected years differently from measured
 * ones, but nothing said so — the reader had to infer it. That made the
 * styling both unexplained and, since the only cue was colour and slant, a
 * problem for anyone who cannot separate the two (WCAG 1.4.1). Naming it
 * fixes the accessibility point and the comprehension one at once.
 */
export function DataLegend() {
  return (
    <p className="data-legend">
      <span className="sample">Kursiv</span>
      <span>
        markerer anslåtte tall. Alt annet er rapporterte tall fra Norsk
        Petroleum og Offshore Norge.
      </span>
    </p>
  );
}
