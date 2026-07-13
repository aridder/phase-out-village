import React from "react";
import { NavLink } from "react-router-dom";
import { EmissionForAllFieldsChart } from "./emissionsForAllFieldsChart";

import { PhaseOutSchedule } from "../../data/gameData";
import "./emissions.css";

/**
 * Page showing line chart for total annual emissions.
 *
 * @param props.phaseOut - Object describing phased-out fields.
 */
export function EmissionForAllFieldsPage({
  phaseOut,
}: {
  phaseOut: PhaseOutSchedule;
}) {
  return (
    <>
      <nav className="emission-nav">
        <NavLink end to={"/emissions/line"}>
          Linjediagram
        </NavLink>
        <NavLink to={"/emissions/bar"}>Søylediagram</NavLink>
        <NavLink to={"/emissions/intensity"}>Utslippsintensitet</NavLink>
      </nav>
      <div className="emission-chart">
        <EmissionForAllFieldsChart phaseOut={phaseOut} />
      </div>
    </>
  );
}
