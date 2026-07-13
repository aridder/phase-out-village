import React from "react";
import { EmissionStackedBarChart } from "./emissionStackedBarChart";
import { NavLink } from "react-router-dom";
import { PhaseOutSchedule } from "../../data/gameData";
import "./emissions.css";

/**
 * Page showing the stacked bar chart for total annual emissions.
 *
 * @param props.phaseOut - Object describing phased-out fields.
 */
export function EmissionStackedBarRoute({
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
        <EmissionStackedBarChart phaseOut={phaseOut} />
      </div>
    </>
  );
}
