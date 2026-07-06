import React from "react";
import { Outlet } from "react-router-dom";
import { FaLightbulb, FaPlay, FaWind } from "react-icons/fa";
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
        <div
          style={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            rowGap: "0.25rem",
            padding: "0.2rem 0.75rem",
          }}
        >
          <Brand />
          <div
            style={{
              display: "flex",
              flex: 1,
              flexWrap: "wrap",
              justifyContent: "end",
              alignItems: "center",
              gap: "0.5rem",
              rowGap: "0.25rem",
            }}
          >
            <MainButton
              icon={<FaWind />}
              label={"Omstilling"}
              labelSmall={"Grønt"}
              title="Se hva som erstatter oljen"
              to="/transition"
              hideLabelOnSmall={false}
              hideIconOnSmall={false}
            />
            <MainButton
              icon={<FaLightbulb />}
              label={"Rådgiver"}
              labelSmall={"Råd"}
              title="Få analyse av og forslag til planen din"
              to="/advisor"
              hideLabelOnSmall={false}
              hideIconOnSmall={false}
            />
            <MainButton
              icon={<FaPlay />}
              label={"Spill Oljespillet"}
              labelSmall={"Spill"}
              title="Lag din egen utfasingsplan"
              to="/map"
              defaultColor="#a5e34d"
              hideLabelOnSmall={false}
              hideIconOnSmall={false}
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
