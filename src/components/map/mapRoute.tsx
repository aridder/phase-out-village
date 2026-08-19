import React, { useContext, useMemo, useState } from "react";
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

  // The map shows committed decisions AND the draft for this period, so a
  // field you just ticked is visibly part of the plan before you commit
  const schedule = useMemo(
    () => ({ ...phaseOut, ...phaseOutDraft }),
    [phaseOut, phaseOutDraft],
  );

  const data = useMemo(() => fieldMapData(schedule, year), [schedule, year]);
  const selectedDatum = data.find((d) => d.field === selected);
  const period = periodForRound(getCurrentRound());

  const retired = data.filter((d) => d.state === "retired").length;
  const scheduled = data.filter((d) => d.state === "scheduled").length;

  function select(field: OilfieldName | undefined) {
    navigate(field ? `/map/${slugify(field)}` : "/map");
  }

  return (
    <div className="shelf-page">
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
                <strong>{scheduled}</strong> med sluttdato
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
            <div className="shelf-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={panel === "list"}
                className={panel === "list" ? "active" : ""}
                onClick={() => setPanel("list")}
              >
                Feltene
              </button>
              <button
                role="tab"
                aria-selected={panel === "legend"}
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
