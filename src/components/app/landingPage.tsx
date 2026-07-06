import React from "react";
import { Link, useNavigate } from "react-router-dom";
import arildHermstad from "./arild-hermstad.png";
import "./landingPage.css";

const OLJEPLAN_LINK = "https://mdg.no/oljeplan";
const ORIGINAL_REPO_LINK = "https://github.com/degronne/phase-out-village";

/**
 * The landing page, in the spirit of the original Oljespillet welcome: plain
 * prose that says who made this and what it explores, one clear way in, and
 * no dashboard furniture.
 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="welcome landing">
      <h1>Chill, baby! Chill!</h1>

      <p>
        <img
          src={arildHermstad}
          alt="MDG-leder Arild Hermstad peker på deg: Norge trenger en utfasingsplan"
        />
        Hei! Jeg heter <strong>Asbjørn Riddervold</strong>, og dette er min
        videreutvikling av{" "}
        <a href={ORIGINAL_REPO_LINK}>Oljespillet</a>, laget for{" "}
        <a href={OLJEPLAN_LINK}>MDGs oljeplan</a>: spillet der du blir
        energiminister og lager en utfasingsplan for norsk sokkel.
      </p>

      <p>
        Jeg syntes ideen var for god til å stoppe der, og ville utforske om
        den kunne berikes med ekte tall for kroner, energi og utslipp – slik
        at det blir enklere å forstå hva det faktisk betyr å stenge et
        oljefelt. Så her kan du også se{" "}
        <Link to="/kostnad">hva utfasing koster</Link>, hva som{" "}
        <Link to="/transition">erstatter energien</Link>, og få en{" "}
        <Link to="/advisor">rådgivers dom</Link> over planen din. Tallene
        hentes automatisk fra SSB og Norsk Petroleum.
      </p>

      <p>
        Men spillet er kjernen: fire stortingsperioder, 34 felter, ett mål –
        klarer du å kutte like mye som MDG-planen innen 2040?
      </p>

      <p className="landing-cta">
        <button onClick={() => navigate("/map")}>
          Jeg er klar – gjør meg til energiminister
        </button>
      </p>

      <p className="landing-links">
        Eller ta en snarvei: <Link to="/kostnad">Hva koster det?</Link>
        {" · "}
        <Link to="/transition">Hva erstatter oljen?</Link>
        {" · "}
        <Link to="/advisor">Rådgiveren</Link>
      </p>
    </div>
  );
}
