import React, { useState } from "react";
import { Dialog } from "../ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { goalCutPercent } from "../../data/gameGoal";
import arildHermstad from "./arild-hermstad.png";

const SSB_LINK =
  "https://www.ssb.no/natur-og-miljo/forurensning-og-klima/statistikk/utslipp-til-luft";

const OLJEPLAN_LINK = "https://mdg.no/oljeplan";

/**
 * The cover page: one hook, the mission brief, and the start button — the
 * full economic argument lives on /kostnad where it can be explored, not in
 * four paragraphs in front of the play button.
 */
export function FrontPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <>
      <h1 className="front-title">Chill, baby! Chill!</h1>
      <div className="welcome">
        <Dialog open={open} onClose={() => navigate("/map")}>
          <h1>Regjeringen trenger din hjelp!</h1>

          <p>
            <img
              src={arildHermstad}
              alt={"MDG-leder Arild Hermstad"}
              title={"Arild Hermstad, leder i MDG"}
            />
            Produksjon av olje og gass står for{" "}
            <a href={SSB_LINK}>en fjerdedel av Norges klimagassutslipp</a> – og
            sokkelen tømmes uansett. Klimautvalget 2050 har bedt om en strategi
            for sluttfasen, og{" "}
            <a href={OLJEPLAN_LINK}>MDG har laget en slik plan</a>. Nå er det
            din tur.
          </p>

          <ul className="mission">
            <li>
              🛢️ <strong>Du er energiminister</strong> med 15 års horisont
              (2025–2040).
            </li>
            <li>
              🗳️ Velg felter som avvikles i <strong>fire</strong>{" "}
              <strong>stortingsperioder</strong>.
            </li>
            <li>
              🎯 Klarer du å kutte minst <strong>{goalCutPercent()} %</strong> –
              like mye som MDG-planen?
            </li>
          </ul>

          <p>
            <button
              className="primary front-cta"
              onClick={() => setOpen(false)}
            >
              🛢️ Jeg er klar – start spillet
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
