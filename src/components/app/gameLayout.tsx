import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import { FaLightbulb, FaMap, FaRecycle, FaRedo, FaWind } from "react-icons/fa";
import { MdEdit, MdHelp } from "react-icons/md";
import { BiSolidBarChartAlt2 } from "react-icons/bi";
import { RxReset } from "react-icons/rx";
import { FcViewDetails } from "react-icons/fc";
import { ApplicationContext } from "../../applicationContext";
import { MainButton } from "../ui/mainButton";
import { StatusBar } from "../ui/statusBar";
import { periodLabel } from "../../data/gameData";
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
      <div>
        <div className="header-bar">
          <Brand />
          <div className="header-nav">
            <MainButton
              icon={<FaMap />}
              label={"Kart"}
              labelSmall={"Kart"}
              to="/map"
            />
            <MainButton
              icon={<BiSolidBarChartAlt2 />}
              label={"Plan"}
              labelSmall={"Plan"}
              to="/plan"
            />
            <MainButton
              icon={<FaLightbulb />}
              label={"Rådgiver"}
              labelSmall={"Råd"}
              title="Få analyse av og forslag til planen din"
              to="/advisor"
            />
            <MainButton
              icon={<FaWind />}
              label={"Omstilling"}
              labelSmall={"Grønt"}
              title="Se hva som erstatter oljen"
              to="/transition"
            />
            {gameEnded || (
              <MainButton
                icon={<MdHelp />}
                label={"Hjelp"}
                labelSmall={"Hjelp"}
                title="Hjelp"
                to="/tutorial"
              />
            )}
            <div className="nav-divider"></div>
            <MainButton
              icon={<FaRedo />}
              label={"Restart"}
              labelSmall={"Ny"}
              title="Start på nytt"
              onClick={restart}
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
  } = useContext(ApplicationContext);
  const gameEnded = year === "2040";
  const draftCount = Object.keys(phaseOutDraft).length;
  const draftNames = Object.keys(phaseOutDraft);

  if (gameEnded)
    return (
      <footer>
        <div className="footer-row spread">
          <div className="footer-note">
            🏁 Historien er ferdig – planen din er komplett.
          </div>
          <MainButton
            icon={<FcViewDetails />}
            label={"Se resultatet"}
            labelSmall={"Resultat"}
            to="/summary"
            primary
          />
        </div>
      </footer>
    );

  if (draftCount === 0)
    return (
      <footer>
        <div className="footer-row spread">
          <div className="footer-note">
            <strong>
              Neste steg
              <span className="hide-small">
                {` (${getCurrentRound()} av ${getTotalRounds() - 1})`}
              </span>
              :
            </strong>{" "}
            velg feltene som skal stenges i {periodLabel(getCurrentRound())}
          </div>
          <MainButton
            icon={<MdEdit />}
            label={`Velg felter for ${periodLabel(getCurrentRound())}`}
            labelSmall={"Velg"}
            title="Velg felter for avvikling"
            to={"/phaseout"}
            primary
          />
        </div>
      </footer>
    );

  return (
    <footer>
      <div className="footer-row">
        <div className="footer-draft">
          <strong>
            {draftCount} {draftCount === 1 ? "felt" : "felter"} klare for
            avvikling
          </strong>
          <div className="draft-names hide-small">{draftNames.join(", ")}</div>
        </div>

        <MainButton
          icon={<MdEdit />}
          label={"Endre"}
          labelSmall={"Endre"}
          title="Endre utvalget"
          to={"/phaseout"}
        />

        <MainButton
          icon={<RxReset />}
          label={"Tøm"}
          labelSmall={"Tøm"}
          title="Tilbakestill valgte oljefelt"
          onClick={() => setPhaseOutDraft({})}
        />

        <MainButton
          icon={<FaRecycle />}
          label={"Avvikle og gå videre ➜"}
          labelSmall={"Avvikle"}
          title={`Avvikle ${draftCount} felter og gå til neste periode`}
          count={draftCount}
          onClick={commitDraft}
          primary
        />
      </div>
    </footer>
  );
}
