import { OilFieldMap } from "./oilFieldMap";
import { Route, Routes, useParams } from "react-router-dom";
import React from "react";
import { MapIntro } from "./mapIntro";
import { OilfieldDetails } from "./oilfieldDetails";
import { Slugify } from "../../data/slugify";
import { OilfieldName } from "../../data/gameData";
import "./map.css";

/**
 * Main route for the oil field map.
 *
 * Content first, map second: the guide/details panel leads and the map is
 * the supporting visual below (mobile) or to the right (desktop).
 * - Default path ("") shows the play guide with the map of all fields.
 * - Path with a slug (":slug") shows a specific oil field and its details.
 */
export function MapRoute() {
  return (
    <Routes>
      {/* Default route: play guide first, map of all oil fields after */}
      <Route
        path={""}
        element={
          <div className="oilfield-map">
            <div className="details">
              <MapIntro />
            </div>
            <OilFieldMap /> {/* Interactive oil field map */}
          </div>
        }
      />
      <Route path={":slug"} element={<SlugWrapper />} />{" "}
      {/* Route for a specific oil field based on slug */}
    </Routes>
  );
}

/** Wrapper component for displaying a specific oil field based on URL slug. */
const SlugWrapper = () => {
  const { slug } = useParams();
  return (
    <div className="oilfield-map">
      <div className="details">
        {" "}
        {/* Key figures for this specific oil field */}
        <OilfieldDetails slug={slug as Slugify<OilfieldName>} />
      </div>
      <OilFieldMap slug={slug as Slugify<OilfieldName>} />{" "}
      {/* Map focused on a specific oil field */}
    </div>
  );
};
