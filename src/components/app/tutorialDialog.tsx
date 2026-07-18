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
        <h3>🎯 Oppdraget</h3>
        <ul>
          <li>
            Du er energiminister. Gi oljefeltene en <b>sluttdato</b> og kutt
            utslippene minst <b>{goalCutPercent()} %</b> innen 2040.
          </li>
        </ul>

        <h3>🕹️ Slik spiller du</h3>
        <ul>
          <li>
            Historien har <b>fire kapitler</b> – ett per stortingsperiode. I
            hvert kapittel: trykk <b>«Velg felter»</b>, huk av feltene som skal
            stenges, og trykk <b>«Avvikle»</b>.
          </li>
          <li>
            Mellom kapitlene får du vite <b>hvordan det går</b> – og hva som
            skjer i verden. I 2040 kommer dommen.
          </li>
        </ul>

        <h3>💡 Trenger du hjelp?</h3>
        <ul>
          <li>
            De verste feltene ligger øverst i feltvelgeren. <b>Rådgiveren</b>{" "}
            gir deg en dom underveis, og alle tallene ligger i{" "}
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
