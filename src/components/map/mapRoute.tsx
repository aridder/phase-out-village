import { OilFieldMap } from "./oilFieldMap";
import { Route, Routes, useParams } from "react-router-dom";
import React, { ReactNode, useState } from "react";
import { MapIntro } from "./mapIntro";
import { OilfieldDetails } from "./oilfieldDetails";
import { slugify, Slugify } from "../../data/slugify";
import { gameData, OilfieldName } from "../../data/gameData";
import "./map.css";

/**
 * Main route for the oil field map.
 *
 * On desktop the content panel and the map sit side by side. On mobile the
 * map owns the screen and the panel becomes a bottom sheet (DetailsSheet):
 * the overview starts peeked (the mission already lives in the status bar
 * and footer), while field details start open — the player just asked for
 * them by tapping a field.
 */
export function MapRoute() {
  return (
    <Routes>
      <Route
        path={""}
        element={
          <div className="oilfield-map">
            <DetailsSheet
              title={`Norsk sokkel – ${gameData.allFields.length} felter`}
            >
              <MapIntro />
            </DetailsSheet>
            <OilFieldMap /> {/* Interactive oil field map */}
          </div>
        }
      />
      <Route path={":slug"} element={<SlugWrapper />} />
    </Routes>
  );
}

/**
 * The content panel: a plain column on desktop, a bottom sheet over the map
 * on mobile. The handle (grip pill + title + chevron) is one big button
 * that toggles between peek and expanded; the body scrolls internally when
 * expanded. All the sheet styling lives in map.css behind a ≤600px query —
 * on desktop the handle hides itself and this renders as before.
 */
function DetailsSheet({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={open ? "details sheet-open" : "details"}>
      <button
        type="button"
        className="sheet-handle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="grip" aria-hidden="true" />
        <span>
          {title} <span aria-hidden="true">{open ? "▴" : "▾"}</span>
        </span>
      </button>
      <div className="sheet-body">{children}</div>
    </div>
  );
}

/** Wrapper component for displaying a specific oil field based on URL slug. */
const SlugWrapper = () => {
  const { slug } = useParams();
  const name = gameData.allFields.find(
    (field) => slugify(field) === (slug as Slugify<OilfieldName>),
  );
  return (
    <div className="oilfield-map">
      <DetailsSheet title={name ?? "Oljefelt"} defaultOpen>
        {/* Key figures for this specific oil field */}
        <OilfieldDetails slug={slug as Slugify<OilfieldName>} />
      </DetailsSheet>
      <OilFieldMap slug={slug as Slugify<OilfieldName>} />
    </div>
  );
};
