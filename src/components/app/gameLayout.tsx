import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import { FaLightbulb, FaMap, FaRecycle, FaRedo, FaWind } from "react-icons/fa";
import { MdEdit, MdHelp } from "react-icons/md";
import { BiSolidBarChartAlt2 } from "react-icons/bi";
import { RxReset } from "react-icons/rx";
import { FcViewDetails } from "react-icons/fc";
import { ApplicationContext } from "../../applicationContext";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import { MainButton } from "../ui/mainButton";
import { StatusBar } from "../ui/statusBar";
import { Brand } from "./brand";

/**
 * Layout for the game itself: map, field selection, plan, emissions,
 * production, data and the final summary.
 *
 * Owns the full cockpit — game navigation, the journey StatusBar and the
 * guided next-step footer. The site pages never see any of this, and this
 * file can be reshaped freely without touching the site chrome.
 */
export function GameLayout() {
  return (
    <>
      <GameHeader />
      <main>
        <Outlet />
      </main>
      <GameFooter />
    </>
  );
}

function GameHeader() {
  const { year, restart } = useContext(ApplicationContext);
  const gameEnded = year === "2040";

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
        {/* flexWrap keeps the button row from forcing horizontal page
            scroll on narrow screens — buttons flow to a second line */}
        <div
          style={{
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
                margin: "0 0.5rem",
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

        <StatusBar />
      </div>
    </header>
  );
}

/**
 * The guided action footer: always spells out the ONE next step in the
 * game loop —
 *
 *   1. no fields selected  → "velg feltene som skal stenges i <period>"
 *   2. fields in the draft → confirm: "avvikle og gå til neste periode"
 *   3. game finished       → "se resultatet"
 */
function GameFooter() {
  const {
    year,
    commitDraft,
    phaseOutDraft,
    setPhaseOutDraft,
    getCurrentRound,
    getTotalRounds,
    getEndOfTermYear,
  } = useContext(ApplicationContext);
  const isSmall = useIsSmallScreen();
  const gameEnded = year === "2040";
  const draftCount = Object.keys(phaseOutDraft).length;
  const draftNames = Object.keys(phaseOutDraft);

  if (gameEnded)
    return (
      <footer>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "0.75rem",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "1.05em" }}>
            🏁 Alle periodene er spilt – planen din er komplett.
          </div>
          <MainButton
            icon={<FcViewDetails />}
            label={"Se resultatet"}
            labelSmall={"Resultat"}
            to="/summary"
            defaultColor="#a5e34d"
            hideLabelOnSmall={false}
            hideIconOnSmall={false}
          />
        </div>
      </footer>
    );

  if (draftCount === 0)
    return (
      <footer>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: "0.75rem",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "1.05em", minWidth: 0 }}>
            <strong>
              Neste steg
              {isSmall
                ? ""
                : ` (${getCurrentRound()} av ${getTotalRounds() - 1})`}
              :
            </strong>{" "}
            velg feltene som skal stenges i {year}–{getEndOfTermYear()}
          </div>
          <MainButton
            icon={<MdEdit />}
            label={`Velg felter for ${year}–${getEndOfTermYear()}`}
            labelSmall={"Velg"}
            title="Velg felter for avvikling"
            to={"/phaseout"}
            defaultColor="#a5e34d"
            hideLabelOnSmall={false}
            hideIconOnSmall={false}
          />
        </div>
      </footer>
    );

  return (
    <footer>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <div
          style={{ flex: 1, minWidth: 0, maxHeight: "64px", overflowY: "auto" }}
        >
          <strong>
            {draftCount} {draftCount === 1 ? "felt" : "felter"} klare for
            avvikling
          </strong>
          {!isSmall && (
            <div style={{ opacity: 0.9, fontSize: "0.9em" }}>
              {draftNames.join(", ")}
            </div>
          )}
        </div>

        <MainButton
          icon={<MdEdit />}
          label={"Endre"}
          labelSmall={"Endre"}
          title="Endre utvalget"
          to={"/phaseout"}
          hideLabelOnSmall={false}
          hideIconOnSmall={false}
        />

        <MainButton
          icon={<RxReset />}
          label={"Tøm"}
          labelSmall={"Tøm"}
          title="Tilbakestill valgte oljefelt"
          onClick={() => setPhaseOutDraft({})}
          hideLabelOnSmall={false}
          hideIconOnSmall={false}
        />

        <MainButton
          icon={<FaRecycle />}
          label={"Avvikle og gå videre ➜"}
          labelSmall={"Avvikle"}
          title={`Avvikle ${draftCount} felter og gå til neste periode`}
          count={draftCount}
          onClick={commitDraft}
          defaultColor="#a5e34d"
          hideLabelOnSmall={false}
          hideIconOnSmall={false}
        />
      </div>
    </footer>
  );
}
