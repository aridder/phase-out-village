import React, { useMemo, useState } from "react";
import { OilfieldName } from "../../data/gameData";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";
import { FieldMapDatum, fieldColor, intensityClassFor } from "./fieldScales";

type SortKey = "production" | "intensity" | "emission" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "production", label: "Produksjon" },
  { key: "intensity", label: "Utslipp per fat" },
  { key: "emission", label: "Utslipp i alt" },
  { key: "name", label: "Navn" },
];

/**
 * The field list beside the map.
 *
 * The map answers *where*; this answers *which*. Twenty-two of the
 * thirty-three producing fields sit in the North Sea, several of them
 * within a couple of pixels of each other at country zoom — no map
 * treatment makes that a good way to find a particular field. The list
 * makes the crowding stop mattering: hovering a row lights its bubble and
 * hovering a bubble lights its row, so the two views teach each other.
 */
export function FieldList({
  data,
  selected,
  onSelect,
  hovered,
  onHover,
}: {
  data: FieldMapDatum[];
  selected?: OilfieldName;
  onSelect: (field: OilfieldName) => void;
  hovered?: OilfieldName;
  onHover: (field: OilfieldName | undefined) => void;
}) {
  const dark = usePrefersDarkMode();
  const [sort, setSort] = useState<SortKey>("production");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const matching = query
      ? data.filter((d) =>
          d.field.toLowerCase().includes(query.toLowerCase().trim()),
        )
      : data;
    return [...matching].sort((a, b) => {
      switch (sort) {
        case "intensity":
          return b.intensity - a.intensity;
        case "emission":
          return b.emission - a.emission;
        case "name":
          return a.field.localeCompare(b.field, "nb");
        default:
          return b.production - a.production;
      }
    });
  }, [data, sort, query]);

  const maxProduction = Math.max(1, ...data.map((d) => d.production));

  return (
    <div className="field-list">
      <div className="field-list-tools">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Finn felt …"
          aria-label="Søk etter felt"
        />
        <label>
          Sorter:{" "}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="field-rows" onMouseLeave={() => onHover(undefined)}>
        {rows.map((row) => {
          const intensityClass = intensityClassFor(row.intensity);
          return (
            <li key={row.field}>
              <button
                type="button"
                className={[
                  "field-row",
                  row.field === selected ? "selected" : "",
                  row.field === hovered ? "hovered" : "",
                  `state-${row.state}`,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(row.field)}
                onMouseEnter={() => onHover(row.field)}
                onFocus={() => onHover(row.field)}
              >
                <span
                  className="row-swatch"
                  style={{
                    backgroundColor: fieldColor(
                      row.intensity,
                      row.hasEmissionData,
                      row.state,
                      dark,
                    ),
                  }}
                  aria-hidden="true"
                />
                <span className="row-name">
                  {row.field}
                  {row.state === "scheduled" && (
                    <span className="row-chip">stenges {row.endYear}</span>
                  )}
                  {row.state === "retired" && (
                    <span className="row-chip retired">avviklet</span>
                  )}
                </span>
                <span className="row-bar" aria-hidden="true">
                  <span
                    className="fill"
                    style={{
                      width: `${(row.production / maxProduction) * 100}%`,
                    }}
                  />
                </span>
                <span className="row-figures">
                  <span title="Produksjon i år">
                    {row.production.toLocaleString("nb-NO", {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                  <span
                    className="row-intensity"
                    title={
                      row.hasEmissionData
                        ? `${intensityClass.label}: ${row.intensity} kg CO₂ per fat`
                        : "Feltet rapporterer ingen utslipp offshore"
                    }
                  >
                    {row.hasEmissionData
                      ? `${row.intensity.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} kg/fat`
                      : "—"}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="field-empty">Ingen felt matcher «{query}».</li>
        )}
      </ul>
    </div>
  );
}
