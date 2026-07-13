import React from "react";
import { Outlet } from "react-router-dom";
import { FaCoins, FaLightbulb, FaPlay, FaWind } from "react-icons/fa";
import { MainButton } from "../ui/mainButton";
import { Brand } from "./brand";

/**
 * Layout for everything OUTSIDE the game: the front page calculator, the
 * transition page, the advisor and the tutorial.
 *
 * A slim brand header with one highlighted entry point into the game —
 * no status timeline, no game navigation, no action footer. This layout
 * owns its chrome entirely; changing it never touches the game's cockpit.
 */
export function SiteLayout() {
  return (
    <>
      <header>
        <div className="header-bar">
          <Brand />
          <div className="header-nav">
            <MainButton
              icon={<FaCoins />}
              label={"Hva koster det?"}
              labelSmall={"Kostnad"}
              title="Se hva utfasing koster – og hva vi får igjen"
              to="/kostnad"
            />
            <MainButton
              icon={<FaWind />}
              label={"Omstilling"}
              labelSmall={"Grønt"}
              title="Se hva som erstatter oljen"
              to="/transition"
            />
            <MainButton
              icon={<FaLightbulb />}
              label={"Rådgiver"}
              labelSmall={"Råd"}
              title="Få analyse av og forslag til planen din"
              to="/advisor"
            />
            <MainButton
              icon={<FaPlay />}
              label={"Spill Oljespillet"}
              labelSmall={"Spill"}
              title="Lag din egen utfasingsplan"
              to="/map"
              primary
            />
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
