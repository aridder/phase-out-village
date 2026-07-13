import { DataField, Year } from "../../data/types";

import React, { FormEvent, useContext, useMemo, useState } from "react";
import { ApplicationContext } from "../../applicationContext";
import { useNavigate } from "react-router-dom";
import "./phaseOut.css";
import { mdgPlan } from "../../generated/dataMdg";
import { fromEntries } from "../../data/fromEntries";
import {
  DatasetForAllFields,
  gameData,
  OilfieldName,
  periodLabel,
} from "../../data/gameData";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";

/** Keys that can be used to sort oil fields in PhaseOutDialog. */
type SortKey =
  | "recommended"
  | "alphabetical"
  | "totalProduction"
  | "emission"
  | "emissionIntensity";

/**
 * Sums values of a given data field for a set of oil fields in a given year.
 *
 * @param data - The dataset containing all fields and years
 * @param fields - List of oil fields to sum
 * @param year - Year for which to sum values
 * @param dataField - The type of data to sum (productionOil, productionGas, or emission)
 * @returns Total value rounded to 2 decimals
 */
function sumFieldValues(
  data: DatasetForAllFields,
  fields: OilfieldName[],
  year: Year,
  dataField: DataField,
) {
  const value = fields
    .map((field) => data[field]?.[year]?.[dataField]?.value ?? 0)
    .reduce((sum, value) => sum + value, 0);
  return Math.round(value * 100) / 100; // Round to two decimals
}

/**
 * Dialog for selecting which oil fields to phase out in the current 4-year period.
 *
 * Features:
 * - Sort oil fields by alphabetical order, total production, emissions, or emission intensity
 * - Select/deselect fields to add them to the draft phase-out plan
 * - View charts for the most recently selected field
 * - Display totals for oil/gas production reduction and emission reduction
 *
 * @param close - Function to close the dialog
 * @param from - Path to navigate back to after closing
 */
export function PhaseOutDialog({
  close,
  from,
}: {
  close: () => void;
  from: string;
}) {
  const {
    year,
    commitDraft,
    phaseOut,
    phaseOutDraft,
    setPhaseOutDraft,
    getCurrentRound,
  } = useContext(ApplicationContext);

  // Draft selection state for the current period
  const draft = phaseOutDraft;
  const setDraft = setPhaseOutDraft;
  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();

  const [sortKey, setSortKey] = useState<SortKey>("recommended");

  // Handles submission: commitDraft() retires the fields, records the
  // decision and navigates to the period report (or the final summary).
  // Deliberately does NOT call close(): closing the native dialog fires its
  // "close" event asynchronously, and the route's onClose would navigate
  // back and override commitDraft's navigation. Navigating away unmounts
  // the dialog without firing the event.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    commitDraft();
  }

  const periodEnd = (parseInt(year) + 3).toString();

  // Fills draft selection with fields according to MDG plan
  function handleMdgPlanClick(e: FormEvent) {
    e.preventDefault();
    const period = [
      year,
      (parseInt(year) + 1).toString(),
      (parseInt(year) + 2).toString(),
      periodEnd,
    ];

    const fields = fromEntries(
      Object.entries(mdgPlan).filter(
        ([_, year]) => year && period.includes(year),
      ),
    );
    setDraft(fields);
  }

  // Quick pick: adds the five worst remaining fields (size + inefficiency
  // combined — the same score behind the recommended sort) to the draft
  function handleWorstClick(e: FormEvent) {
    e.preventDefault();
    const worst = [...fieldRows]
      .sort((a, b) => b.score - a.score)
      .filter((r) => !draft[r.field])
      .slice(0, 5);
    setDraft((d) => ({
      ...d,
      ...fromEntries(worst.map((r) => [r.field, year])),
    }));
  }

  // Removes a field from the draft plan
  function removeField(field: OilfieldName) {
    setDraft((d) =>
      fromEntries(Object.entries(d).filter(([f]) => f !== field)),
    );
  }

  // Adds a field to the draft plan
  function addField(field: OilfieldName) {
    setDraft((d) => ({ ...d, [field]: year }));
  }

  // Toggles a field on/off in the draft plan
  function toggle(field: OilfieldName, checked: boolean) {
    if (checked) {
      addField(field);
    } else {
      removeField(field);
    }
  }

  // Key figures per field for the current year, plus a "worst first" score
  // that combines size (emissions) and inefficiency (emissions per barrel)
  const fieldRows = useMemo(() => {
    const rows = Object.keys(gameData.data)
      .filter((k) => !(k in phaseOut))
      .map((k) => {
        const d = gameData.data[k]?.[year];
        return {
          field: k as OilfieldName,
          emission: d?.emission?.value ?? 0,
          production: d?.totalProduction?.value ?? 0,
          intensity: d?.emissionIntensity?.value ?? 0,
        };
      });
    const maxEmission = Math.max(1, ...rows.map((r) => r.emission));
    const maxIntensity = Math.max(1, ...rows.map((r) => r.intensity));
    // Shelf average intensity in kg CO2 per barrel, for the versting badge
    const totalEmissionAll = rows.reduce((sum, r) => sum + r.emission, 0);
    const totalProductionAll = rows.reduce((sum, r) => sum + r.production, 0);
    const shelfAvgIntensity =
      totalProductionAll > 0
        ? (totalEmissionAll * 1000) / (totalProductionAll * 6.2898 * 1_000_000)
        : 0;
    return rows.map((r) => ({
      ...r,
      score: r.emission / maxEmission + r.intensity / maxIntensity,
      intensityShare: r.intensity / maxIntensity,
      // 2,5× sokkel-snittet: med 1,5× fikk 13 av 34 felter merket og
      // «versting» mistet all signalverdi
      isWorst: r.intensity > shelfAvgIntensity * 2.5,
    }));
  }, [phaseOut, year]);

  const sortedRows = useMemo(() => {
    return [...fieldRows].sort((a, b) => {
      switch (sortKey) {
        case "alphabetical":
          return a.field.localeCompare(b.field);
        case "totalProduction":
          return b.production - a.production;
        case "emission":
          return b.emission - a.emission;
        case "emissionIntensity":
          return b.intensity - a.intensity;
        default:
          return b.score - a.score;
      }
    });
  }, [fieldRows, sortKey]);

  // Calculate total production/emission reductions for draft fields
  const totalOilProduction = sumFieldValues(
    gameData.data,
    Object.keys(draft),
    year,
    "productionOil",
  );
  const totalGasProduction = sumFieldValues(
    gameData.data,
    Object.keys(draft),
    year,
    "productionGas",
  );
  const totalEmission = sumFieldValues(
    gameData.data,
    Object.keys(draft),
    year,
    "emission",
  );

  function capitalizeFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getSortKeyTranslation(str: string) {
    let translation = str;
    switch (str) {
      case "alphabetical":
        translation = "Alfabetisk";
        break;
      case "totalProduction":
        translation = "Total produksjon";
        break;
      case "emission":
        translation = "Utslipp";
        break;
      case "emissionIntensity":
        translation = "Utslippsintensitet";
        break;
      default:
        break;
    }
    return translation;
  }

  function getMeasurementUnit(str: string) {
    let measurement = "";
    switch (str) {
      case "alphabetical":
        measurement = "";
        break;
      case "totalProduction":
        measurement = "Sm³";
        break;
      case "emission":
        measurement = "tonn CO₂";
        break;
      case "emissionIntensity":
        measurement = "kg CO₂e/Sm³";
        break;
      default:
        break;
    }
    return measurement;
  }

  function formatValue(value: number, key: SortKey) {
    switch (key) {
      case "totalProduction":
        return `${value.toLocaleString("no-NO")} Sm³`;
      case "emission":
        return `${value.toFixed(1)} tonn CO₂`;
      case "emissionIntensity":
        return `${value.toFixed(2)} kg CO₂e/Sm³`;
      default:
        return "";
    }
  }

  return (
    <form className="phaseout-form" onSubmit={handleSubmit}>
      <div className="phaseout-panel">
        <div className="close-corner-mobile">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(from);
            }}
            title="Tilbake"
            aria-label="Lukk feltvelgeren"
          >
            ✕
          </button>
        </div>

        <div className="phaseout-dialog-header">
          <div className="phaseout-sort-wrapper">
            <label className="phaseout-sort-dropdown">
              Sorter etter:{" "}
              <select
                value={sortKey}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="recommended">
                  Størst og mest ineffektiv først (anbefalt)
                </option>
                <option value="emission">Størst utslipp</option>
                <option value="emissionIntensity">Mest utslipp per fat</option>
                <option value="totalProduction">Størst produksjon</option>
                <option value="alphabetical">Alfabetisk</option>
              </select>
            </label>
          </div>

          <div className="close-corner-desktop">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(from);
              }}
              title="Tilbake"
              aria-label="Lukk feltvelgeren"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="phaseout-checkboxes">
          <h3 className="phaseout-header">
            Velg felter for avvikling {periodLabel(getCurrentRound())}
          </h3>
          <ul className="phaseout-list">
            {sortedRows.map((row) => (
              <li key={row.field} className="phaseout-row">
                <label className="field-row-label">
                  <input
                    type="checkbox"
                    onChange={(e) => toggle(row.field, e.target.checked)}
                    checked={!!draft[row.field]}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="field-info">
                    <div className="field-name">
                      {row.field}
                      {row.isWorst && (
                        <span
                          className="field-badge"
                          title="Utslipp per fat langt over sokkel-snittet"
                        >
                          🔥 versting
                        </span>
                      )}
                    </div>
                    <div className="field-stats">
                      <span title={`Utslipp i ${year}`}>
                        🏭{" "}
                        {Math.round(row.emission / 1000).toLocaleString(
                          "nb-NO",
                        )}{" "}
                        kt CO₂/år
                      </span>
                      <span title={`Produksjon i ${year}`}>
                        🛢️ {row.production.toLocaleString("nb-NO")} mill. Sm³/år
                      </span>
                      <span
                        className="field-intensity"
                        title="Utslipp per fat, målt mot det verste feltet"
                      >
                        <span className="intensity-bar">
                          <span
                            className="fill"
                            style={{
                              width: `${Math.max(3, Math.round(row.intensityShare * 100))}%`,
                            }}
                          />
                        </span>
                        {Math.round(row.intensity).toLocaleString("nb-NO")}{" "}
                        kg/fat
                      </span>
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div className="phaseout-actions">
          {Object.keys(draft).length > 0 && (
            <div className="selection-impact">
              Valget fjerner{" "}
              <strong>
                ~{Math.round(totalEmission / 1000).toLocaleString("nb-NO")} kt
                CO₂
              </strong>{" "}
              og{" "}
              <strong>
                {(
                  Math.round((totalOilProduction + totalGasProduction) * 10) /
                  10
                ).toLocaleString("nb-NO")}{" "}
                mill. Sm³
              </strong>{" "}
              produksjon per år.
            </div>
          )}
          <div className="button-row">
            {/* type="button" er viktig: uten den er knappene submit-knapper
                i skjemaet, og «Tøm» ville tømt utvalget OG avsluttet
                perioden i samme klikk */}
            <button
              type="button"
              onClick={() => setPhaseOutDraft({})}
              disabled={Object.keys(phaseOutDraft).length < 1}
            >
              Tøm
            </button>
            <button
              type="button"
              onClick={handleWorstClick}
              title="Legg til de fem feltene med størst utslipp og dårligst effektivitet"
            >
              {isSmall ? `⚡ 5 verste` : `⚡ Velg de 5 verste`}
            </button>
            <button type="button" onClick={handleMdgPlanClick}>
              {isSmall ? `📋 Velg MDGs felter` : `📋 Velg felter fra MDGs plan`}
            </button>
            <button type="submit" disabled={year === "2040"}>
              {/* Null valgte felter betyr i praksis «hopp over perioden» —
                  si det, så én feiltapp ikke ser ut som en avvikling */}
              {Object.keys(phaseOutDraft).length === 0
                ? "⏭ Hopp over perioden"
                : `♻ Avvikle ${Object.keys(phaseOutDraft).length} ${isSmall ? "felt" : "oljefelt"}`}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
