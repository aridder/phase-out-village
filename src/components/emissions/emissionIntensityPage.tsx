import React, { useContext } from "react";
import { ApplicationContext } from "../../applicationContext";
import { NavLink } from "react-router-dom";
import { EmissionIntensityChart } from "./emissionIntensityChart";
import "./emissions.css";

/** Page showing the emission intensity chart and navigation links. */
export function EmissionIntensityPage() {
  const { phaseOut, year } = useContext(ApplicationContext);
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
        <EmissionIntensityChart year={year} phaseOut={phaseOut} />
      </div>
    </>
  );
}
