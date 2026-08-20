import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { shelfToday } from "../../data/norwayToday";
import arildHermstad from "./arild-hermstad.png";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

/**
 * The title screen.
 *
 * It sets up the question the whole thing asks — the shelf is emptying
 * anyway, so the real decision is about ORDER — and it names the three
 * acts, so a player knows they are getting an orientation before they are
 * asked to decide anything.
 *
 * What it no longer does is state a pass mark. The old cover said the goal
 * was to cut at least as much as one party's plan; that turned every screen
 * after it into an argument with a known right answer, and a player who
 * disagrees with the premise has no reason to keep playing.
 */
export function FrontPage() {
  useDocumentTitle("Chill, baby! Chill!");
  const navigate = useNavigate();
  const shelf = shelfToday();
  const declinePercent = Math.round((1 - shelf.remainingIn2040) * 100);

  return (
    <div className="hero">
      <div className="hero-kicker">Oljespillet</div>
      <h1 className="hero-title">Chill, baby! Chill!</h1>
      <div className="hero-tagline">
        Sokkelen tømmes uansett. Spørsmålet er hvem som bestemmer rekkefølgen.
      </div>

      <div className="hero-story">
        <img
          src={arildHermstad}
          alt={"MDG-leder Arild Hermstad"}
          title={"Arild Hermstad, leder i MDG"}
        />
        <p>
          <strong>Du er Norges energiminister fra 2025 til 2040.</strong> Norsk
          sokkel gir staten {shelf.stateRevenueBnNok} milliarder kroner i året
          og står for rundt en fjerdedel av Norges utslipp. Og {declinePercent}{" "}
          % av dagens produksjon er borte innen 2040 uansett hva du gjør –
          feltene tømmes. Du bestemmer hvilke som går først.
        </p>
      </div>

      {/* Tre bokser på en tittelskjerm er tre bokser for mye — en nummerert
          liste sier det samme og lar typografien gjøre jobben */}
      <ol className="hero-mission">
        <li>
          <span className="kicker">Del 1</span>
          Norge i dag – feltene, pengene og forskjellene mellom dem
        </li>
        <li>
          <span className="kicker">Del 2</span>
          Fire stortingsperioder. Fire ulike spørsmål å svare på
        </li>
        <li>
          <span className="kicker">Del 3</span>
          Oppgjøret – planen din mot alternativene, i klima og i kroner
        </li>
      </ol>

      <button className="hero-cta" onClick={() => navigate("/norge")}>
        Start med Norge i dag →
      </button>

      <p className="hero-more">
        Spillet argumenterer ikke for én konklusjon. Alle tall er hentet fra
        åpne kilder, og forutsetningene kan du endre underveis.{" "}
        <Link to="/kostnad">Se regnestykket</Link> ·{" "}
        <Link to="/tutorial">Slik spiller du</Link>
      </p>
    </div>
  );
}
