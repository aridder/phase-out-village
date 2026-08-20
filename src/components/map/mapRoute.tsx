import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, OilfieldName } from "../../data/gameData";
import { slugify } from "../../data/slugify";
import { periodForRound } from "../../data/periods";
import { ShelfMap } from "./shelfMap";
import { FieldList } from "./fieldList";
import { MapLegend } from "./mapLegend";
import { FieldProfile } from "./fieldProfile";
import { fieldMapData } from "./fieldScales";
import "./map.css";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/**
 * Which field's row should get focus back when the profile closes.
 *
 * Module scope, not a ref: the row lives in a list that is unmounted while
 * the profile is open, and the surrounding component is itself remounted by
 * the router on the way in and out — a ref does not survive that, and the
 * focus restore silently did nothing.
 */
let returnFocusTo: OilfieldName | undefined;

/**
 * The shelf page: the map, the field list and the field profile as one
 * view.
 *
 * The map and the list are two readings of the same data and are kept in
 * lockstep — hovering either highlights both, selecting either opens the
 * profile. The URL still carries the selection (`/map/:slug`), so a field
 * can be linked to.
 */
export function MapRoute() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { phaseOut, phaseOutDraft, year, getCurrentRound } =
    useContext(ApplicationContext);
  const [hovered, setHovered] = useState<OilfieldName | undefined>();
  const [panel, setPanel] = useState<"list" | "legend">("list");

  const selected = useMemo(
    () => gameData.allFields.find((f) => slugify(f) === slug),
    [slug],
  );

  // The draft is passed separately, not merged: a field you have ticked but
  // not yet voted through is drawn as decided-but-still-running, which is a
  // different thing from one that has actually closed
  const data = useMemo(
    () => fieldMapData(phaseOut, phaseOutDraft, year),
    [phaseOut, phaseOutDraft, year],
  );
  const selectedDatum = data.find((d) => d.field === selected);
  const period = periodForRound(getCurrentRound());

  useDocumentTitle(selected ?? `Kartet ${year}`);

  const retired = data.filter((d) => d.state === "retired").length;
  const scheduled = data.filter((d) => d.state === "scheduled").length;

  function select(field: OilfieldName | undefined) {
    if (field) returnFocusTo = field;
    navigate(field ? `/map/${slugify(field)}` : "/map");
  }

  /**
   * Put keyboard focus back on the row the profile was opened from.
   *
   * This has to run from an effect, after React has committed the list back
   * into the DOM. Doing it inline in the close handler focused a node that
   * the very next commit replaced, so focus ended up on <body> anyway.
   */
  useEffect(() => {
    if (selected || !returnFocusTo) return;
    const field = returnFocusTo;
    returnFocusTo = undefined;
    const row = document.querySelector<HTMLButtonElement>(
      `[data-field="${CSS.escape(field)}"]`,
    );
    row?.focus();
    row?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div className="shelf-page">
      {/* Kartsiden har ingen synlig overskrift — årstallet og feltlisten
          forteller en seende bruker hvor de er. Dokumentet trenger den
          likevel, ellers starter sidens struktur på nivå to. */}
      <h1 className="visually-hidden">
        Norsk sokkel – kart over feltene i {year}
      </h1>
      <div className="shelf-map-pane">
        <ShelfMap
          data={data}
          selected={selected}
          onSelect={select}
          hovered={hovered}
          onHover={setHovered}
        />
        <div className="shelf-overlay">
          <div className="shelf-year" style={{ borderColor: period.accent }}>
            <span className="shelf-year-value">{year}</span>
            <span className="shelf-year-label">{period.name}</span>
          </div>
          <div className="shelf-tally">
            <span>
              <strong>{data.length - retired}</strong> i drift
            </span>
            {scheduled > 0 && (
              <span>
                <strong>{scheduled}</strong> valgt nå
              </span>
            )}
            {retired > 0 && (
              <span>
                <strong>{retired}</strong> avviklet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shelf-side">
        {selectedDatum ? (
          <FieldProfile
            datum={selectedDatum}
            onClose={() => select(undefined)}
          />
        ) : (
          <>
            {/* Ikke role="tablist". Det annonserte «fane 1 av 2» og lovet
                piltast-navigering og tabpanel-er som ikke fantes. To vanlige
                av/på-knapper med aria-pressed er ærligere og fungerer. */}
            <div className="shelf-tabs">
              <button
                type="button"
                aria-pressed={panel === "list"}
                className={panel === "list" ? "active" : ""}
                onClick={() => setPanel("list")}
              >
                Feltene
              </button>
              <button
                type="button"
                aria-pressed={panel === "legend"}
                className={panel === "legend" ? "active" : ""}
                onClick={() => setPanel("legend")}
              >
                Slik leses kartet
              </button>
            </div>
            {panel === "list" ? (
              <FieldList
                data={data}
                selected={selected}
                onSelect={select}
                hovered={hovered}
                onHover={setHovered}
              />
            ) : (
              <MapLegend />
            )}
          </>
        )}
      </div>
    </div>
  );
}
