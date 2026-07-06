import React, { useContext, useState } from "react";
import { ApplicationContext } from "../../applicationContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { EmissionSummaryCard } from "../emissions/emissionSummaryCard";
import { ProductionSummaryCard } from "../production/productionSummaryCard";
import {
  FaPlay,
  FaInfoCircle,
  FaRedo,
  FaRecycle,
  FaMap,
  FaLightbulb,
  FaWind,
} from "react-icons/fa";
import { MdBarChart, MdHelp, MdInfo, MdOutlineBarChart } from "react-icons/md";
import logo from "./MDG_Logo_2025.png";
import { BiSolidBarChartAlt2 } from "react-icons/bi";
import { StatusBar } from "../ui/statusBar";
import { FcViewDetails } from "react-icons/fc";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import { MainButton } from "../ui/mainButton";

/**
 * ApplicationHeader component renders the top section of the app.
 * Includes:
 * - StatusBar with the journey timeline and accumulated impact
 * - Summary of fields phased out (from phaseOut schedule)
 * - EmissionSummaryCard and ProductionSummaryCard
 *
 * Uses ApplicationContext to get `phaseOut` data.
 */
export function ApplicationHeader() {
  const { year, restart, phaseOut, phaseOutDraft } =
    useContext(ApplicationContext);
  const location = useLocation();
  const gameEnded = year === "2040";
  const navigate = useNavigate();
  const isSmall = useIsSmallScreen();

  return (
    <header>
      <div
        style={{
          width: "100%",
          display: "flex",
          flex: 1,
          flexDirection: "column",
        }}
      >
        {/* flexWrap keeps the button row from forcing horizontal page scroll
            on narrow screens — buttons flow to a second line instead */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            rowGap: "0.25rem",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
            paddingTop: "0.20rem",
            paddingBottom: "0.20rem",
          }}
        >
          {isSmall ? null : (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <a href="https://mdg.no/politikk/utfasing" target="_blank">
                <img
                  style={{ maxWidth: "196px" }}
                  src={
                    "https://d1nizz91i54auc.cloudfront.net/_service/505811/display/img_version/8880781/t/1750686348/img_name/68683_505811_ba2eeb201a.png.webp"
                  }
                  alt={"MDG - det ER mulig"}
                />
              </a>

              <div
                style={{
                  height: "50%",
                  width: "1px",
                  backgroundColor: "white",
                  marginRight: "1.5rem",
                }}
              ></div>
              <div>
                <a href="https://mdg.no/politikk/utfasing" target="_blank">
                  Oljespillet
                </a>
              </div>
            </div>
          )}

          <div style={{ minWidth: 0 }}>
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
                icon={<FaMap />}
                label={"Kart"}
                labelSmall={"Kart"}
                to="/map"
                hideLabelOnSmall={false}
                hideIconOnSmall={false}
              />

              <MainButton
                icon={<BiSolidBarChartAlt2 />}
                label={"Plan"}
                labelSmall={"Plan"}
                to="/plan"
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
                icon={<FaWind />}
                label={"Omstilling"}
                labelSmall={"Grønt"}
                title="Se hva som erstatter oljen"
                to="/transition"
                hideLabelOnSmall={false}
                hideIconOnSmall={false}
              />

              {gameEnded || (
                <MainButton
                  icon={<MdHelp />}
                  label={"Hjelp"}
                  labelSmall={"Hjelp"}
                  title="Hjelp"
                  to="/tutorial"
                  hideLabelOnSmall={false}
                  hideIconOnSmall={false}
                />
              )}

              <div
                style={{
                  height: "75%",
                  width: "0.125rem",
                  backgroundColor: "grey",
                  opacity: "0.25",
                  marginLeft: "0.5rem",
                  marginRight: "0.5rem",
                }}
              ></div>

              <MainButton
                icon={<FaRedo />}
                label={"Restart"}
                labelSmall={"Ny"}
                title="Start på nytt"
                onClick={restart}
                hideLabelOnSmall={false}
                hideIconOnSmall={false}
              />
            </div>
          </div>
        </div>

        <StatusBar />
      </div>
    </header>
  );
}
