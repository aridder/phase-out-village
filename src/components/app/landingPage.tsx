import React from "react";
import { Link, useNavigate } from "react-router-dom";
import arildHermstad from "./arild-hermstad.png";
import "./landingPage.css";

const OLJEPLAN_LINK = "https://mdg.no/oljeplan";
const SSB_LINK =
  "https://www.ssb.no/natur-og-miljo/forurensning-og-klima/statistikk/utslipp-til-luft";

/**
 * The landing page, in the spirit of the original Oljespillet welcome: plain
 * prose that tells you what this is and who made it, one clear way in, and
 * no dashboard furniture. This fork's additions are presented as questions
 * the original made people ask.
 */
export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="welcome landing">
      <h1>Chill, baby! Chill!</h1>

      <p>
        Dette er en videreutvikling av{" "}
        <a href={OLJEPLAN_LINK}>MDGs «Oljespillet»</a> – spillet der du tar
        jobben som energiminister og lager en utfasingsplan for norsk sokkel.
        Grunnhistorien er den samme som i originalen: olje- og gassproduksjonen
        står for{" "}
        <a href={SSB_LINK}>rundt en fjerdedel av Norges klimagassutslipp</a>,
        feltene tømmes uansett, og Klimautvalget 2050 har anbefalt en strategi
        for sluttfasen av norsk petroleumsvirksomhet. MDG vil fase ut feltene
        innen 2040 – verstingene først.
      </p>

      <p>
        <img
          src={arildHermstad}
          alt="MDG-leder Arild Hermstad peker på deg: Norge trenger en utfasingsplan"
        />
        Jeg syntes ideen var for god til å stoppe der. Hver gang jeg viste noen
        spillet, kom de samme spørsmålene: <em>Hva koster det, egentlig?</em>{" "}
        <em>Hva skjer med all energien?</em>{" "}
        <em>Og hva skal Norge leve av etterpå?</em> Så jeg ville utforske om
        jeg kunne berike originalen med svar – ekte tall for kroner, energi og
        utslipp – slik at det blir enklere å forstå hva det faktisk betyr å
        stenge et oljefelt.
      </p>

      <p>
        Derfor kan du her, i tillegg til å spille energiminister, se{" "}
        <Link to="/kostnad">hva utfasing koster</Link> målt i ting man kan
        forholde seg til (statsbudsjett, kroner per innbygger – og hvor mye som
        forsvinner av seg selv), hva som{" "}
        <Link to="/transition">erstatter energien fra sokkelen</Link>, og du
        får en <Link to="/advisor">rådgiver</Link> som analyserer planen din.
        Tallene hentes automatisk fra åpne kilder hos SSB og Norsk Petroleum.
      </p>

      <p>
        Men spillet er fortsatt kjernen: fire stortingsperioder frem til 2040,
        34 felter, og ett mål – klarer du å kutte like mye som MDG-planen?
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
