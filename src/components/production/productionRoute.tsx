import React, { useContext } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { ProductionPerFieldPage } from "./productionPerFieldPage";
import { YearlyTotalProductionChart } from "./yearlyTotalProductionChart";
import { ProductionSummaryPage } from "./productionSummaryPage";
import { ApplicationContext } from "../../applicationContext";
import { SourcesNote } from "../ui/sourcesNote";
import "./production.css";

/** Shared sub-navigation for the production views. */
function ProductionNav() {
  return (
    <nav className="production-nav">
      <NavLink end to={"/production/"}>
        Din plan
      </NavLink>
      <NavLink to={"/production/composition"}>Olje og gass</NavLink>
      <NavLink to={"/production/oilPerField"}>Per felt</NavLink>
    </nav>
  );
}

/**
 * The production landing page: a heading and a one-line explanation before
 * the charts, plus sub-navigation — the bare chart grid gave no clue what
 * the numbers meant or where to go next.
 */
function ProductionHome() {
  const { phaseOut } = useContext(ApplicationContext);
  const fieldsClosed = Object.keys(phaseOut).length;
  return (
    <div className="production-home">
      <h2>🛢️ Produksjon</h2>
      <p className="page-lead">
        Så mye olje og gass produserer feltene hvert år frem mot 2040 –{" "}
        {fieldsClosed > 0
          ? "det skraverte er produksjonen planen din avvikler."
          : "feltene tømmes av seg selv, og planen din bestemmer resten."}
      </p>
      <ProductionNav />
      <ProductionSummaryPage />
      <SourcesNote />
    </div>
  );
}

/**
 * Defines the routing for the production section of the app.
 * - "/" -> Production summary page
 * - "/composition" -> Yearly total production chart with navigation links
 * - "/oilPerField" -> Production per field page
 */
export function ProductionRoute() {
  return (
    <div>
      <Routes>
        <Route path={"/"} element={<ProductionHome />} />
        <Route
          path={"/composition"}
          element={
            <div className="production-chart">
              <ProductionNav />
              <YearlyTotalProductionChart />
            </div>
          }
        />
        <Route path={"/oilPerField"} element={<ProductionPerFieldPage />} />
      </Routes>
    </div>
  );
}
