import React from "react";
import { Link } from "react-router-dom";
import { goalCutPercent } from "../../data/gameGoal";
import "./tutorial.css";

/**
 * The help card: one scannable screen instead of the old six-step wizard —
 * twelve sentences never needed five "Neste" clicks. The in-game footer and
 * period reports teach the loop while playing; this card only has to get a
 * new player started.
 */
export function TutorialDialog({ onClose }: { onClose?: () => void }) {
  return (
    <div className="tutorial-steps">
      <div className="top-bar">
        <h2>Slik spiller du</h2>
        <button onClick={onClose} className="close-button" title="Lukk">
          ✕
        </button>
      </div>

      <div className="tutorial-card">
        <h3>🎯 Målet</h3>
        <ul>
          <li>
            Lag en plan som <b>faser ut olje- og gassfelter</b> frem mot 2040.
          </li>
          <li>
            Kutt utslippene minst <b>{goalCutPercent()} %</b> – like mye som
            MDG-planen.
          </li>
        </ul>

        <h3>🕹️ Spillet</h3>
        <ul>
          <li>
            Du styrer <b>fire stortingsperioder</b> (2025–2040). Trykk
            <b> «Velg felter»</b> nede til høyre, huk av feltene som skal
            stenges, og trykk <b>«Avvikle»</b> for å vedta.
          </li>
          <li>
            Etter hver periode får du en <b>perioderapport</b>: ligger du foran
            eller bak skjema?
          </li>
          <li>
            Følg med i <b>statuslinjen øverst</b> – og spør <b>Rådgiveren</b>{" "}
            når du vil ha en dom underveis.
          </li>
        </ul>

        <h3>📏 Tallene</h3>
        <ul>
          <li>
            Produksjon måles i mill. Sm³, utslipp i tonn CO₂e og intensitet i kg
            CO₂e per fat. Alle tallene per felt ligger i{" "}
            <Link to="/data">dataoversikten</Link>.
          </li>
        </ul>
      </div>

      <div className="button-row">
        <button className="primary" onClick={onClose}>
          Jeg er klar 🛢️
        </button>
      </div>
    </div>
  );
}
