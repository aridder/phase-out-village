import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData } from "../../data/gameData";
import { goalCutPercent } from "../../data/gameGoal";

/**
 * The panel next to the map: instead of a bare list of 34 field names, it
 * explains what the player is looking at and what to do next, with the
 * running tally of retired fields.
 */
export function MapIntro() {
  const { year, phaseOut, getCurrentRound, getEndOfTermYear } =
    useContext(ApplicationContext);
  const navigate = useNavigate();
  const gameEnded = year === "2040";
  const retired = Object.keys(phaseOut).length;
  const total = gameData.allFields.length;

  return (
    <div
      style={{
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.9rem",
      }}
    >
      <h2 style={{ margin: 0 }}>Norsk sokkel – {total} felter</h2>

      <div
        style={{
          border: "1px solid currentColor",
          borderRadius: "0.5rem",
          padding: "0.5rem 0.75rem",
        }}
      >
        🎯 <strong>Målet ditt:</strong> kutt de samlede utslippene med minst{" "}
        {goalCutPercent()} % innen 2040 – like mye som MDG-planen.
      </div>

      <div style={{ fontSize: "1.05em" }}>
        <strong>{retired}</strong> av {total} felter har fått sluttdato i planen
        din.
      </div>

      {gameEnded ? (
        <>
          <div>
            🏁 Reisen er fullført. Kartet viser sluttresultatet – grå felter er
            avviklet.
          </div>
          <div>
            <button
              style={{ fontSize: "1.1em" }}
              onClick={() => navigate("/summary")}
            >
              🏆 Se resultatet
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
          >
            <div>
              <strong>1. Se sokkelen.</strong> Hvert navn på kartet er et olje-
              og gassfelt: <span style={{ color: "#c0392b" }}>rødt</span> er i
              drift, grått er avviklet. Trykk på et felt for nøkkeltall.
            </div>
            <div>
              <strong>2. Velg hvem som skal stenges.</strong> I feltvelgeren
              ligger de største og mest forurensende feltene øverst – det er der
              utfasing monner mest.
            </div>
            <div>
              <strong>3. Avvikle og gå videre.</strong> Du styrer fire
              stortingsperioder frem til 2040. Følg utslippskuttet ditt i
              statuslinjen øverst.
            </div>
          </div>

          <div>
            <button
              style={{ fontSize: "1.1em", backgroundColor: "#a5e34d" }}
              onClick={() => navigate("/phaseout")}
            >
              ✏️ Velg felter for {year}–{getEndOfTermYear()} (
              {getCurrentRound()}. periode)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
