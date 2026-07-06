import { DataField, Year } from "../../data/types";

import React, { FormEvent, useContext, useMemo, useState } from "react";
import { ApplicationContext } from "../../applicationContext";
import { EmissionIntensityBarChart } from "../charts/emissionIntensityBarChart";
import { useNavigate } from "react-router-dom";
import "./phaseOut.css";
import { mdgPlan } from "../../generated/dataMdg";
import { fromEntries } from "../../data/fromEntries";
import {
  DatasetForAllFields,
  gameData,
  OilfieldName,
  PhaseOutSchedule,
} from "../../data/gameData";
import { InfoTag } from "../ui/InfoTag";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import { usePrefersDarkMode } from "../../hooks/usePrefersDarkMode";

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
    getEndOfTermYear,
  } = useContext(ApplicationContext);

  // Draft selection state for the current period
  // const [draft, setDraft] = useState<PhaseOutSchedule>({});
  const draft = phaseOutDraft;
  const setDraft = setPhaseOutDraft;
  const [, setSelectedOrder] = useState<OilfieldName[]>([]);
  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();
  const isDarkMode = usePrefersDarkMode();

  const [sortKey, setSortKey] = useState<SortKey>("recommended");

  // Latest selected field for displaying charts
  const [latestSelectedField, setLatestSelectedField] =
    useState<OilfieldName>();

  // const [latestSelectedField, setLatestSelectedField] =
  //   useState<OilfieldName|undefined>(Object.keys(phaseOutDraft).length > 0 ? phaseOutDraft[0] : undefined);

  // Memoized data for the chart of the latest selected field
  const fieldForChart = useMemo(
    () =>
      latestSelectedField
        ? gameData.data[latestSelectedField][year]
        : undefined,
    [latestSelectedField],
  );

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
    setLatestSelectedField(worst[worst.length - 1]?.field);
  }

  // Removes a field from the draft plan
  function removeField(field: OilfieldName) {
    setDraft((d) =>
      fromEntries(Object.entries(d).filter(([f]) => f !== field)),
    );

    setSelectedOrder((prev) => {
      const updated = prev.filter((f) => f !== field);
      setLatestSelectedField(updated[updated.length - 1] ?? null);
      return updated;
    });
  }

  // Adds a field to the draft plan
  function addField(field: OilfieldName) {
    setDraft((d) => ({ ...d, [field]: year }));
    setSelectedOrder((prev) => [...prev.filter((f) => f !== field), field]);
    setLatestSelectedField(field);
  }

  // Toggles a field on/off in the draft plan
  function toggle(field: OilfieldName, checked: boolean) {
    if (checked) {
      addField(field);
    } else {
      removeField(field);
    }
  }

  // // Sort oil fields based on sort key and whether already phased out
  // const sortedFields = Object.keys(gameData.data)
  //   .sort((a, b) => {
  //     const aIsDisabled = a in phaseOut;
  //     const bIsDisabled = b in phaseOut;

  //     if (aIsDisabled && !bIsDisabled) return 1;
  //     if (!aIsDisabled && bIsDisabled) return -1;
  //     if (sortKey === "alphabetical") {
  //       return a.localeCompare(b);
  //     }

  //     const aData = gameData.data[a]?.[year];
  //     const bData = gameData.data[b]?.[year];

  //     return (
  //       // (aData?.[sortKey]?.value ?? -Infinity) -
  //       // (bData?.[sortKey]?.value ?? -Infinity)
  //       (bData?.[sortKey]?.value ?? -Infinity) -
  //       (aData?.[sortKey]?.value ?? -Infinity)
  //     );
  //   });

  // const sortedFields = Object.keys(gameData.data)
  //   .filter((k) => !(k in phaseOut))  // only enabled keys
  //   .sort((a, b) => {
  //     const aData = gameData.data[a]?.[year];
  //     const bData = gameData.data[b]?.[year];

  //     if (sortKey === "alphabetical") return a.localeCompare(b);

  //     return (bData?.[sortKey]?.value ?? -Infinity) - (aData?.[sortKey]?.value ?? -Infinity); // descending
  //   });

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
      isWorst: r.intensity > shelfAvgIntensity * 1.5,
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
    <form
      className=""
      onSubmit={handleSubmit}
      style={{ width: "100%", all: "unset" }}
    >
      <div
        style={{
          width: "100%",
          minWidth: isSmall ? "" : "612px",
          maxWidth: "1024px",
          paddingTop: "1rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          backgroundColor: isDarkMode ? "#133600" : "#e0ffb2",
          color: isDarkMode ? "inherit" : "black",
          // color: "#e0ffb2",
        }}
      >
        <div
          className={``}
          style={{
            display: isSmall ? "block" : "none",
            position: isSmall ? "fixed" : "sticky",
            top: "1rem",
            right: "1rem",
            zIndex: "3",
          }}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(from);
            }}
            title="Tilbake"
          >
            X
          </button>
        </div>

        <div className="phaseout-dialog-header" style={{ paddingLeft: "1rem" }}>
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

          <div
            style={{
              display: isSmall ? "none" : "block",
              position: isSmall ? "fixed" : "sticky",
              top: "0.25rem",
              right: "0.25rem",
              zIndex: "3",
            }}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(from);
              }}
              title="Tilbake"
            >
              X
            </button>
          </div>
        </div>

        <div
          className="phaseout-checkboxes"
          style={{ marginTop: "1.5rem", paddingLeft: "1rem" }}
        >
          <h3 className="phaseout-header" style={{ marginBottom: "1.5rem" }}>
            Velg felter for avvikling {year}-{getEndOfTermYear()}
          </h3>
          <ul style={{ marginTop: "0.5rem", marginLeft: 0, padding: 0 }}>
            {sortedRows.map((row) => (
              <li
                key={row.field}
                className="phaseout-row"
                style={{ borderBottom: "1px solid #cccccc2e" }}
              >
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
                        🌫️{" "}
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

        {/* <div className="dialog-information-container">

          {latestSelectedField && fieldForChart && (
            <div className="phaseout-latest-oilfield">
              <h3>Sist valgt oljefelt: {latestSelectedField}</h3>
              <p>
                Olje/væskeproduksjon i {year}:{" "}
                {fieldForChart.productionOil?.value ?? "0"} GSm3 olje{" "}
                <InfoTag title="GSm3 = standard kubikkmeter ved standard trykk/temperatur. Brukes for å sammenligne volum.">
                  ?
                </InfoTag>
              </p>
              <p>
                Gasseksport i {year}: {fieldForChart.productionGas?.value ?? "0"}{" "}
                GSm3 gass{" "}
                <InfoTag title="GSm3 = standard kubikkmeter ved standard trykk/temperatur.">
                  ?
                </InfoTag>
              </p>
              <p>
                Utslipp i {year}:{" "}
                {Math.round((fieldForChart.emission?.value ?? 0) / 1000)} tusen
                tonn Co2{" "}
                <InfoTag title="CO2e = CO2-ekvivalenter (inkluderer andre klimagasser omregnet til CO2). ‘Tusen tonn’ betyr at tallet er delt på 1000.">
                  ?
                </InfoTag>
              </p>
              <div className="phaseout-emission-chart">
                {fieldForChart && (
                  <EmissionIntensityBarChart
                    year={year}
                    field={latestSelectedField}
                    emissionIntensity={fieldForChart.emissionIntensity?.value}
                  />
                )}
              </div>
            </div>
          )}

        </div> */}

        <div
          style={{
            position: "sticky",
            height: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0px",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "1rem",
            marginTop: "0.5rem",
            // backgroundColor: "#133600",
            borderTop: "1px solid #e0ffb2",
            backgroundColor: isDarkMode ? "#133600" : "#e0ffb2",
            color: isDarkMode ? "inherit" : "black",
          }}
        >
          {Object.keys(draft).length > 0 && (
            <div style={{ marginBottom: "0.5rem", fontSize: "0.95em" }}>
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
          <div
            className={"button-row"}
            style={{ width: "100%", flex: 1, marginTop: "0rem" }}
          >
            <button
              onClick={() => setPhaseOutDraft({})}
              disabled={Object.keys(phaseOutDraft).length < 1}
            >
              Tøm
            </button>
            <button onClick={handleWorstClick} title="Legg til de fem feltene med størst utslipp og dårligst effektivitet">
              {isSmall ? `⚡ 5 verste` : `⚡ Velg de 5 verste`}
            </button>
            <button onClick={handleMdgPlanClick}>
              {isSmall ? `Velg MDGs felter` : `Velg felter fra MDGs plan`}
            </button>
            <button
              type="submit"
              disabled={year === "2040"}
              style={{ flex: 1 }}
            >
              ♻ Avvikle {" " + Object.keys(phaseOutDraft).length + " "}{" "}
              {isSmall ? `felt` : `oljefelt`}
            </button>
          </div>

          {/* <div style={{ height: "128px"}}>
            <h4 style={{ marginBottom: "0.5rem" }}>Felter som avvikles innen {getEndOfTermYear()}:</h4>
            <div style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              overflowY: "auto",
              overflowX: "hidden",
            }}>
              {Object.keys(draft).map((navn) => (
                <div
                  key={navn}
                  style={{ border: "1px solid #e0ffb2", padding: "0.25rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", borderRadius: "0.5rem" }}
                >
                  {navn}
                </div>
              ))}
            </div>
          </div> */}

          {/* <div className={"button-row"} style={{ marginTop: "0rem", }}>
            <button type="submit" disabled={year === "2040"}>
              Fase ut valgte felter i {year}
            </button>
            <button onClick={handleMdgPlanClick}>Velg felter fra MDGs plan</button>
          </div> */}
        </div>
      </div>
    </form>

    // <form className="phaseout-dialog" onSubmit={handleSubmit}>

    //   <div style={{ width: "100%", backgroundColor: "#313131ff" }}>

    //     <div className={``} style={{
    //       display: isSmall ? "block" : "none",
    //       position: isSmall ? "fixed" : "sticky",
    //       top: "1rem",
    //       right: "1rem",
    //       zIndex: "3"
    //     }}>
    //       <button
    //         onClick={(e) => {
    //           e.preventDefault();
    //           e.stopPropagation();
    //           navigate(from)
    //         }}
    //         title="Tilbake"
    //       >
    //         X
    //       </button>
    //     </div>

    //     <div className="phaseout-dialog-header">
    //       <div className="phaseout-sort-wrapper">
    //         <label className="phaseout-sort-dropdown">
    //           Sorter etter:{" "}
    //           <select
    //             value={sortKey}
    //             onClick={(e) => e.stopPropagation()}
    //             onChange={(e) => setSortKey(e.target.value as SortKey)}
    //           >
    //             <option value="alphabetical">Alfabetisk</option>
    //             <option value="totalProduction">Total produksjon</option>
    //             <option value="emission">Utslipp</option>
    //             <option value="emissionIntensity">Utslippsintensitet</option>
    //           </select>
    //         </label>
    //       </div>

    //       <div style={{ display: isSmall ? "none" : "block", position: isSmall ? "fixed" : "sticky", top: "0.25rem", right: "0.25rem", zIndex: "3" }}>
    //         <button
    //           onClick={(e) => {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             navigate(from)
    //           }}
    //           title="Tilbake"
    //         >
    //           X
    //         </button>
    //       </div>

    //     </div>

    //     <div className="phaseout-checkboxes">
    //       <h3 className="phaseout-header">
    //         Velg felter for avvikling {year}-{getEndOfTermYear()}
    //       </h3>
    //       <ul>
    //         {sortedFields.map((k) => {
    //           const isDisabled = k in phaseOut;
    //           return (
    //             <li
    //               key={k}
    //               className={isDisabled ? "grayed-out-oilfield-checklist" : ""}
    //             >
    //               <label>
    //                 <input
    //                   disabled={isDisabled}
    //                   type="checkbox"
    //                   onChange={(e) => {
    //                     toggle(k, e.target.checked);
    //                   }}
    //                   checked={!!draft[k]}
    //                 />
    //                 {` `}{k}
    //               </label>
    //             </li>
    //           );
    //         })}
    //       </ul>
    //     </div>

    //     <div className="dialog-information-container">

    //       {Object.keys(draft).length > 0 && (
    //         <div
    //           className="phaseout-fieldnames-selected"
    //           style={{ marginBottom: "2rem" }}
    //         >

    //           <h4 style={{ marginBottom: "0.5rem" }}>Felter som avvikles innen {getEndOfTermYear()}:</h4>
    //           <div style={{ width: "100%", display: "flex", flex: 0, flexWrap: "wrap", alignItems: "center", gap: "0.5rem", }}>
    //             {Object.keys(draft).map((navn) => (
    //               <div
    //                 key={navn}
    //                 style={{ border: "1px solid #e0ffb2", padding: "0.25rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", borderRadius: "0.5rem" }}
    //               >
    //                 {navn}
    //               </div>
    //             ))}
    //           </div>
    //           {/* <ul>
    //           {Object.keys(draft).map((k) => (
    //             <li key={k}>
    //               <label>{k}</label>
    //             </li>
    //           ))}
    //         </ul> */}
    //         </div>
    //       )}

    //       {latestSelectedField && fieldForChart && (
    //         <div className="phaseout-latest-oilfield">
    //           <h3>Sist valgt oljefelt: {latestSelectedField}</h3>
    //           <p>
    //             Olje/væskeproduksjon i {year}:{" "}
    //             {fieldForChart.productionOil?.value ?? "0"} GSm3 olje{" "}
    //             <InfoTag title="GSm3 = standard kubikkmeter ved standard trykk/temperatur. Brukes for å sammenligne volum.">
    //               ?
    //             </InfoTag>
    //           </p>
    //           <p>
    //             Gasseksport i {year}: {fieldForChart.productionGas?.value ?? "0"}{" "}
    //             GSm3 gass{" "}
    //             <InfoTag title="GSm3 = standard kubikkmeter ved standard trykk/temperatur.">
    //               ?
    //             </InfoTag>
    //           </p>
    //           <p>
    //             Utslipp i {year}:{" "}
    //             {Math.round((fieldForChart.emission?.value ?? 0) / 1000)} tusen
    //             tonn Co2{" "}
    //             <InfoTag title="CO2e = CO2-ekvivalenter (inkluderer andre klimagasser omregnet til CO2). ‘Tusen tonn’ betyr at tallet er delt på 1000.">
    //               ?
    //             </InfoTag>
    //           </p>
    //           <div className="phaseout-emission-chart">
    //             {fieldForChart && (
    //               <EmissionIntensityBarChart
    //                 year={year}
    //                 field={latestSelectedField}
    //                 emissionIntensity={fieldForChart.emissionIntensity?.value}
    //               />
    //             )}
    //           </div>
    //         </div>
    //       )}

    //       {/* {Object.keys(draft).length > 0 && (
    //       <div className="phaseout-total-production">
    //         <strong>Produksjon som reduseres innen {periodEnd}:</strong>
    //         <p>
    //           {totalOilProduction} GSm3 olje{" "}
    //           <InfoTag title="GSm3 = standard kubikkmeter. Viser volum ved standard forhold.">
    //             ?
    //           </InfoTag>
    //         </p>
    //         <p>
    //           {totalGasProduction} GSm3 gass{" "}
    //           <InfoTag title="GSm3 = standard kubikkmeter. Viser volum ved standard forhold.">
    //             ?
    //           </InfoTag>
    //         </p>
    //         <strong>Utslipp som reduseres innen {periodEnd}:</strong>{" "}
    //         <p>
    //           {Math.round(totalEmission / 1_000)} tusen tonn CO2e{" "}
    //           <InfoTag title="CO2e = CO2-ekvivalenter. ‘Tusen tonn’ = delt på 1000.">
    //             ?
    //           </InfoTag>
    //         </p>
    //       </div>
    //     )} */}

    //     </div>

    //     <div className={"button-row"}>
    //       <button type="submit" disabled={year === "2040"}>
    //         Fase ut valgte felter i {year}
    //       </button>
    //       <button onClick={handleMdgPlanClick}>Velg felter fra MDGs plan</button>
    //     </div>

    //   </div>

    // </form>
  );
}
