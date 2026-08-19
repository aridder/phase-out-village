import React from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { slugify } from "../../data/slugify";
import { OilFieldTable } from "../map/oilFieldTable";
import { DataFieldTable } from "./dataFieldTable";
import { allDataToCsv } from "./exportData";
import { downloadCsv } from "./downloadCsv";
import { gameData } from "../../data/gameData";
import "./dataView.css";

/** Table showing oil production for all fields */
function OilProductionTable() {
  return (
    <>
      <h1>Oversikt over olje/væskeproduksjon</h1>
      <DataFieldTable dataField={"productionOil"} />
    </>
  );
}

/** Table showing gas production for all fields */
function GasProductionTable() {
  return (
    <>
      <h1>Oversikt over gasseksport</h1>
      <DataFieldTable dataField={"productionGas"} />
    </>
  );
}

/** Table showing emissions for all fields */
function EmissionTable() {
  return (
    <>
      <h1>Utslipp</h1>
      <DataFieldTable dataField={"emission"} />
    </>
  );
}

/** Wrapper for displaying a single field's table */
function FieldTableWrapper() {
  const { oilFieldSlug } = useParams();
  const field = gameData.allFields.find((s) => slugify(s) === oilFieldSlug);
  if (!field) return <h1>Fant ikke {oilFieldSlug}</h1>;

  return (
    <>
      <h1>{field}</h1>
      <p>
        <Link to={"/data"}>Tilbake</Link>
      </p>
      <OilFieldTable field={field} />
    </>
  );
}

/** Overview page for all data tables and export options */
function FieldOverview() {
  /**
   * The whole dataset as one file.
   *
   * This was two buttons — a three-sheet workbook and a thirty-four-sheet
   * workbook — holding the same numbers in two different shapes. One long
   * table says it once and pivots into either shape.
   */
  function handleDownloadAll() {
    downloadCsv("oljespillet-alle-data.csv", allDataToCsv());
  }

  return (
    <>
      <h1>Dataoversikt</h1>
      <p className="page-lead">
        Alle tallene bak spillet: produksjon og utslipp per felt og per år,
        hentet fra Norsk Petroleum og Offshore Norge. Utforsk dem her, eller
        last dem ned som CSV (semikolon som skilletegn og komma som desimaltegn,
        så fila åpner rett i norsk Excel).
      </p>
      <button onClick={handleDownloadAll}>Last ned alle tallene (CSV)</button>
      <ul>
        <li>
          <Link to={"/data/oil"}>Produksjonsoversikt (olje)</Link>
        </li>
        <li>
          <Link to={"/data/gas"}>Produksjonsoversikt (gass)</Link>
        </li>
        <li>
          <Link to={"/data/emission"}>Utslippsoversikt</Link>
        </li>
      </ul>
      <h2>Oljefelt</h2>
      <ul>
        {Object.keys(gameData.data).map((oilField) => (
          <li key={slugify(oilField)}>
            <Link to={`/data/${slugify(oilField)}`}>{oilField}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Main route for all data-related views */
export function DataViewRoute() {
  return (
    <div className={"data"}>
      <Routes>
        <Route path={"/"} element={<FieldOverview />} />
        <Route path={"/oil"} element={<OilProductionTable />} />
        <Route path={"/gas"} element={<GasProductionTable />} />
        <Route path={"/emission"} element={<EmissionTable />} />
        {/* Route for a single oil field, using the slug from the URL */}
        <Route path={"/:oilFieldSlug"} element={<FieldTableWrapper />} />
      </Routes>
    </div>
  );
}
