import React, { useState } from "react";
import "./tutorial.css";

/**
 * Steps for the tutorial dialog. Each step has:
 * - title: heading of the tutorial step
 * - body: JSX content for the step
 */
const steps = [
  {
    title: "Målet",
    body: (
      <>
        <ul>
          <li>
            Lag en plan for å <b>fase ut olje- og gassfelter</b> fram mot 2040.
          </li>
          <li>
            Du velger hvilke felt som avvikles i hver 4-årsperiode, og ser
            effekten på utslipp og produksjon.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Kart og feltliste",
    body: (
      <>
        <ul>
          <li>
            Gå til <strong>«Kart»</strong> for å utforske feltene.
          </li>
          <li>
            Klikk på et felt i kartet eller i listen for å se detaljer om
            produksjon, utslipp og intensitet.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Måleenheter",
    body: (
      <>
        <ul>
          <li>
            <a
              href={`https://no.wikipedia.org/wiki/Standardkubikkmeter`}
              target="_blank"
            >
              MSm³
            </a>{" "}
            (standardkubikkmeter) for volum av gass/olje.
          </li>
          <li>
            Utslipp måles i tonn{" "}
            <a
              href={`https://no.wikipedia.org/wiki/CO2-ekvivalent`}
              target="_blank"
            >
              CO₂e
            </a>{" "}
            (CO₂-ekvivalenter).
          </li>
          <li>
            Utslippsintensitet måles i kg CO₂e per{" "}
            <a
              href="https://en.wikipedia.org/wiki/Barrel_of_oil_equivalent"
              target="_blank"
            >
              fat olje
            </a>{" "}
            – hvor «skitten» produksjonen på et felt er.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Velg felter for avvikling",
    body: (
      <>
        <ul>
          <li>
            Trykk <strong>«Velg felter»</strong>-knappen nede til høyre.
          </li>
          <li>
            Huk av feltene du vil stenge, og trykk <strong>«Avvikle»</strong>{" "}
            for å vedta og gå til neste stortingsperiode.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Se konsekvensene",
    body: (
      <>
        <ul>
          <li>
            Under <strong>«Plan»</strong> i toppmenyen ser du utslipps- og
            produksjonsgrafer som oppdateres med planen din.
          </li>
          <li>
            Etter hver periode får du en <b>perioderapport</b> som viser om du
            ligger foran eller bak skjema mot målet.
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "Fullfør og start på nytt",
    body: (
      <>
        <ul>
          <li>
            Når du når <b>2040</b> vises en oppsummering.
          </li>
          <li>Du kan når som helst starte på nytt fra toppmenyen.</li>
        </ul>
      </>
    ),
  },
];

/**
 * TutorialDialog component renders a modal dialog showing tutorial steps.
 *
 * Props:
 * - onClose: optional callback when the tutorial is finished or closed.
 *
 * Handles navigation through steps with "Tilbake" and "Neste" buttons.
 * Disables navigation buttons at start/end.
 */
export function TutorialDialog({ onClose }: { onClose?: () => void }) {
  const [index, setIndex] = useState(0);
  const last = index === steps.length - 1;

  return (
    <div className="tutorial-steps">
      <div className="top-bar">
        <h2 className="title-desktop">{steps[index].title}</h2>
        <button onClick={onClose} className="close-button" title={`Lukk`}>
          ✖
        </button>
      </div>

      <div>
        <h2 className="title-mobile">{steps[index].title}</h2>
        <div className="step-body">{steps[index].body}</div>
      </div>

      <div className="button-row">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Tilbake
        </button>
        <span className="step-counter">
          Steg: {index + 1} / {steps.length}
        </span>
        {last ? (
          <button onClick={onClose}>Ferdig</button>
        ) : (
          <button
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={index >= steps.length - 1}
          >
            Neste
          </button>
        )}
      </div>
    </div>
  );
}
