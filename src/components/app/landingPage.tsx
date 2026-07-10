import React from "react";
import { Link, useNavigate } from "react-router-dom";
import arildHermstad from "./arild-hermstad.png";
import "./landingPage.css";

const OLJEPLAN_LINK = "https://mdg.no/oljeplan";
const SSB_LINK =
  "https://www.ssb.no/natur-og-miljo/forurensning-og-klima/statistikk/utslipp-til-luft";

/**
 * The landing page: the original Oljespillet welcome text and picture,
 * rendered inline instead of in a modal, with quiet shortcuts to the
 * cost, transition and advisor pages.
 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="welcome landing">
      <h1>Chill, baby! Chill!</h1>
      <h2>Regjeringen trenger din hjelp!</h2>

      <p>
        Norge sliter med å nå sine klimamål, og en av årsakene er høye
        utslipp fra norsk sokkel – faktisk står produksjon av olje og gass for{" "}
        <a href={SSB_LINK}>en fjerdedel av Norges utslipp av klimagasser</a>!
        Til tross for at det planlegges å bruke 17 TWh med kraft årlig til
        elektrifisering, vil oljenæringen slippe ut 170 millioner tonn CO2 de
        neste 15 årene. Og da regner vi ikke med utslippene når oljen og
        gassen brennes i utlandet, som er cirka 50 ganger så høye!
      </p>

      <p>
        <img
          src={arildHermstad}
          alt={"MDG partileder Arild Hermstad"}
          className="landing-illustration"
        />
        Samtidig er sokkelen i ferd med å tømmes for reserver, og norsk
        næringsliv trenger flere ben å stå på. Klimautvalget 2050 har anbefalt
        Norge å lage en «strategi for sluttfasen av norsk
        petroleumsvirksomhet», og{" "}
        <a href={OLJEPLAN_LINK}>MDG har laget en slik plan</a>. Vi vil fase ut
        feltene på norsk sokkel innen 2040, og ønsker å starte med de feltene
        med høyest utslipp og lavest produksjon.
      </p>

      <p>
        Sittende og tidligere regjeringer har vist liten vilje til å diskutere
        hvordan utfasing av olje- og gassproduksjon kan skje på en måte som
        balanserer utslippskutt og produksjon på norsk sokkel. Vi utfordrer
        derfor deg til å ta på deg jobben som energiminister for en dag, og
        gir deg 15 års tidshorisont (til 2040).
      </p>

      <p>Har du det som skal til for å lage utfasingsplanen Norge trenger?</p>

      <p className="landing-cta">
        <button onClick={() => navigate("/map")}>Jeg er klar</button>
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
