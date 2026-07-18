import React, { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { goalCutPercent } from "../../data/gameGoal";
import { storyIntro } from "../../data/story";
import arildHermstad from "./arild-hermstad.png";

/**
 * The cover page: the story opening, told in three short beats from
 * story.ts, and one start button. The full economic argument lives on
 * /kostnad where it can be explored — not in four paragraphs in front of
 * the play button.
 */
export function FrontPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <>
      <h1 className="front-title">Chill, baby! Chill!</h1>
      <div className="welcome">
        <Dialog open={open} onClose={() => navigate("/map")}>
          <div className="front-kicker">🛢️ Oljespillet</div>
          <h1>{storyIntro.heading}</h1>

          <p>
            <img
              src={arildHermstad}
              alt={"MDG-leder Arild Hermstad"}
              title={"Arild Hermstad, leder i MDG"}
            />
            {storyIntro.scene.join(" ")}
          </p>

          <ul className="mission">
            <li>
              🛢️ Velg hvilke felter som skal stenges – i{" "}
              <strong>fire stortingsperioder</strong> frem til 2040.
            </li>
            <li>
              🎯 Kutt utslippene minst <strong>{goalCutPercent()} %</strong>.
              Klarer du det, har du slått MDGs egen oljeplan.
            </li>
          </ul>

          <p>
            <button
              className="primary front-cta"
              onClick={() => setOpen(false)}
            >
              🛢️ Start i 2025
            </button>
          </p>

          <p className="front-more">
            Lurer du på hva det koster?{" "}
            <Link to="/kostnad">Se hele regnestykket</Link>.
          </p>
        </Dialog>
      </div>
    </>
  );
}
