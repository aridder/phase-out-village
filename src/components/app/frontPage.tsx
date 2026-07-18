import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { goalCutPercent } from "../../data/gameGoal";
import { storyIntro } from "../../data/story";
import arildHermstad from "./arild-hermstad.png";

/**
 * The cover page as a real title screen: the story opening told as one
 * scene — game name, the player's role, the mission as three cards and a
 * single big call to action. No dialog chrome; the story IS the page.
 * The full economic argument lives on /kostnad where it can be explored.
 */
export function FrontPage() {
  const navigate = useNavigate();

  return (
    <div className="hero">
      <div className="hero-kicker">🛢️ Oljespillet</div>
      <h1 className="hero-title">Chill, baby! Chill!</h1>
      <div className="hero-tagline">
        Spillet om å styre Norge ut av oljealderen
      </div>

      <div className="hero-story">
        <img
          src={arildHermstad}
          alt={"MDG-leder Arild Hermstad"}
          title={"Arild Hermstad, leder i MDG"}
        />
        <p>
          <strong>{storyIntro.heading}.</strong> {storyIntro.scene.join(" ")}
        </p>
      </div>

      <div className="hero-mission">
        <div className="mission-card">
          <div className="mission-emoji">🛢️</div>
          <div className="mission-label">Oppdraget</div>
          <div className="mission-text">
            Velg hvilke oljefelter som skal stenges – felt for felt
          </div>
        </div>
        <div className="mission-card">
          <div className="mission-emoji">🗳️</div>
          <div className="mission-label">Tiden</div>
          <div className="mission-text">
            Fire stortingsperioder, fra 2025 til 2040
          </div>
        </div>
        <div className="mission-card">
          <div className="mission-emoji">🎯</div>
          <div className="mission-label">Målet</div>
          <div className="mission-text">
            Kutt utslippene minst {goalCutPercent()} % – like mye som MDGs
            oljeplan
          </div>
        </div>
      </div>

      <button className="hero-cta" onClick={() => navigate("/map")}>
        🛢️ Start i 2025
      </button>

      <p className="hero-more">
        Lurer du på hva det koster?{" "}
        <Link to="/kostnad">Se hele regnestykket</Link> · Ny her?{" "}
        <Link to="/tutorial">Slik spiller du</Link>
      </p>
    </div>
  );
}
