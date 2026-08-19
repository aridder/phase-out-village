import { Icon } from "../ui/icons";
import React from "react";
import { Link } from "react-router-dom";
import { periods } from "../../data/periods";
import "./tutorial.css";

/**
 * The help card: one scannable screen.
 *
 * It now describes the three acts and, crucially, says that the four
 * periods ask four different questions — the single thing players most
 * often missed about the old version, where every round looked the same.
 */
export function TutorialDialog({ onClose }: { onClose?: () => void }) {
  return (
    <div className="tutorial-steps">
      <div className="top-bar">
        <h2>Slik spiller du</h2>
        <button onClick={onClose} className="close-button" title="Lukk">
          <Icon name="lukk" size={16} />
        </button>
      </div>

      <div className="tutorial-card">
        <h3>Oppdraget</h3>
        <ul>
          <li>
            Du er energiminister fra 2025 til 2040. Sokkelen tømmes uansett –
            jobben din er å bestemme <b>hvilke felt som går først</b>.
          </li>
          <li>
            Det finnes ingen fasit her. Du får se hva hvert valg kutter og hva
            det koster, og til slutt settes planen din opp mot tre andre.
          </li>
        </ul>

        <h3>Tre deler</h3>
        <ul>
          <li>
            <b>Del 1 – Norge i dag:</b> tallene før du bestemmer noe.
          </li>
          <li>
            <b>Del 2 – fire stortingsperioder:</b> hver periode åpner med en
            brief, så velger du felt, så får du en rapport.
          </li>
          <li>
            <b>Del 3 – oppgjøret:</b> hva planen din gjorde, hva den kostet, og
            hva som kan erstatte energien.
          </li>
        </ul>

        <h3>Periodene er ikke like</h3>
        <ul>
          <li>
            Hver periode har sin egen <b>kapasitet</b> (hvor mange felt du
            rekker), sitt eget <b>tall å vurdere</b> og sitt eget{" "}
            <b>mål å måles på</b>:
          </li>
          {periods.map((period) => (
            <li key={period.round}>
              <b>
                {period.label} {period.name}:
              </b>{" "}
              inntil{" "}
              {period.capacity >= 34
                ? "fritt antall"
                : `${period.capacity} felt`}
              , vurdert på {period.lensLabel.toLowerCase()}, målt på{" "}
              {period.measure.name.toLowerCase()}.
            </li>
          ))}
        </ul>

        <h3>Trenger du hjelp?</h3>
        <ul>
          <li>
            På <b>kartet</b> er hver boble et felt: størrelsen er produksjonen,
            fargen er utslipp per fat. <b>Rådgiveren</b> analyserer planen din
            underveis, og alle tallene ligger i{" "}
            <Link to="/data">dataoversikten</Link>.
          </li>
        </ul>
      </div>

      <div className="button-row">
        <button className="primary" onClick={onClose}>
          Jeg er klar
        </button>
      </div>
    </div>
  );
}
