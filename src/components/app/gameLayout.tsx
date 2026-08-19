import React, { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LuPencil, LuScrollText, LuX } from "react-icons/lu";
import { ApplicationContext } from "../../applicationContext";
import { MainButton } from "../ui/mainButton";
import { StatusBar } from "../ui/statusBar";
import { AppNav } from "./appNav";
import { periodForRound } from "../../data/periods";

/**
 * Layout for the game itself: map, period brief, field selection, report
 * and the final reckoning.
 *
 * It adds exactly two things to the shared chrome — the journey StatusBar
 * and the guided next-step footer. The navigation is the same one the rest
 * of the app uses, so moving between a site page and a game page no longer
 * reshuffles the header.
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
  return (
    <header>
      <div>
        {/* Samme navigasjon som resten av appen. Spillet legger bare
            statuslinjen under — headeren skifter aldri form. */}
        <AppNav />
        <StatusBar />
      </div>
    </header>
  );
}

/**
 * The guided action footer: always spells out the ONE next step.
 *
 * The step now follows the act structure — open the period, choose the
 * fields, commit the decision — and the commit button says what it will
 * actually do rather than just "avvikle".
 */
function GameFooter() {
  const {
    year,
    commitDraft,
    phaseOutDraft,
    setPhaseOutDraft,
    getCurrentRound,
  } = useContext(ApplicationContext);
  const location = useLocation();
  const gameEnded = year === "2040";
  const draftNames = Object.keys(phaseOutDraft);
  const draftCount = draftNames.length;
  const period = periodForRound(getCurrentRound());

  // Oppgjørssiden har sine egne knapper nederst. En footer som tilbyr «Se
  // oppgjøret» mens du står på oppgjøret, gjør ingenting når man trykker.
  if (location.pathname === "/summary") return null;

  if (gameEnded)
    return (
      <footer>
        <div className="footer-row spread">
          <div className="footer-note">
            2040. Planen din er ferdig – nå gjøres regnskapet opp.
          </div>
          <MainButton
            icon={<LuScrollText />}
            label={"Se oppgjøret"}
            labelSmall={"Oppgjør"}
            to="/summary"
            primary
          />
        </div>
      </footer>
    );

  // The selector owns its own sticky action bar and states the period's
  // rule at the top of the page. A footer here would repeat both and, on a
  // phone, push the field list down to a single visible row.
  if (location.pathname === "/phaseout") return null;

  if (draftCount === 0)
    return (
      <footer>
        <div className="footer-row spread">
          <div className="footer-note">
            <strong>
              Neste steg
              <span className="hide-small">
                {` (periode ${getCurrentRound()} av 4)`}
              </span>
              :
            </strong>{" "}
            {period.name}, {period.label}
          </div>
          <MainButton
            icon={<LuPencil />}
            label={`Åpne ${period.label}`}
            labelSmall={"Åpne"}
            title="Gå til periodens brief"
            to={"/periode"}
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
            {draftCount} av {period.capacity} felt valgt
          </strong>
          <div className="draft-names hide-small">{draftNames.join(", ")}</div>
        </div>

        <MainButton
          icon={<LuPencil />}
          label={"Endre"}
          labelSmall={"Endre"}
          title="Endre utvalget"
          to={"/phaseout"}
        />

        <MainButton
          icon={<LuX />}
          label={"Tøm"}
          labelSmall={"Tøm"}
          title="Tilbakestill valgte felt"
          onClick={() => setPhaseOutDraft({})}
        />

        <MainButton
          icon={<LuScrollText />}
          label={"Vedta og gå videre"}
          labelSmall={"Vedta"}
          title={`Vedta sluttdato for ${draftCount} felt og gå til neste periode`}
          count={draftCount}
          onClick={commitDraft}
          primary
        />
      </div>
    </footer>
  );
}
