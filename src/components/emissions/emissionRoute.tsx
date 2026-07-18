import React, { useContext } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { EmissionForAllFieldsPage } from "./emissionsForAllFieldsPage";
import { EmissionIntensityPage } from "./emissionIntensityPage";
import { EmissionStackedBarRoute } from "./emissionStackedBarRoute";
import { EmissionSummaryPage } from "./emissionSummaryPage";
import { ApplicationContext } from "../../applicationContext";
import { SourcesNote } from "../ui/sourcesNote";
import "./emissions.css";

/**
 * The emissions landing page: a heading and a one-line explanation before
 * the charts, plus the sub-navigation to the detail views — the bare
 * chart grid gave no clue what the numbers meant or where to go next.
 */
function EmissionsHome() {
  const { phaseOut } = useContext(ApplicationContext);
  const fieldsClosed = Object.keys(phaseOut).length;
  return (
    <div className="emissions-home">
      <h2>🏭 Utslipp</h2>
      <p className="page-lead">
        Så mye CO₂ slipper sokkelen ut hvert år frem mot 2040 –{" "}
        {fieldsClosed > 0
          ? "det skraverte er utslippene planen din fjerner."
          : "velg felter i planen din for å se kutt her."}
      </p>
      <nav className="emission-nav">
        <NavLink end to={"/emissions/line"}>
          Per felt
        </NavLink>
        <NavLink to={"/emissions/bar"}>År for år</NavLink>
        <NavLink to={"/emissions/intensity"}>Utslipp per fat</NavLink>
      </nav>
      <EmissionSummaryPage phaseOut={phaseOut} />
      <SourcesNote />
    </div>
  );
}

/** Defines the routes for emissions visualization pages. */
export function EmissionRoute() {
  const { phaseOut } = useContext(ApplicationContext);
  return (
    <div className="emission-chart-container">
      <Routes>
        <Route path="/" element={<EmissionsHome />} />
        <Route
          path="line"
          element={<EmissionForAllFieldsPage phaseOut={phaseOut} />}
        />
        <Route
          path="bar"
          element={<EmissionStackedBarRoute phaseOut={phaseOut} />}
        />
        <Route path="intensity" element={<EmissionIntensityPage />} />
      </Routes>
    </div>
  );
}
