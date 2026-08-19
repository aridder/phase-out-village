import React, { useContext } from "react";
import { Outlet, useLocation } from "react-router-dom";
/* Ett ikonsett. Headeren blandet tidligere fa, md, bi, rx og fc — inkludert
   ett fullfarget ikon (FcViewDetails) som ikke fulgte tekstfargen i det hele
   tatt. Lucide har én strektykkelse og ingen fyll. */
import {
  LuChartNoAxesColumn,
  LuCircleHelp,
  LuLightbulb,
  LuMap,
  LuPencil,
  LuRotateCcw,
  LuScrollText,
  LuTrendingDown,
  LuWind,
  LuX,
} from "react-icons/lu";
import { ApplicationContext } from "../../applicationContext";
import { MainButton } from "../ui/mainButton";
import { StatusBar } from "../ui/statusBar";
import { periodForRound } from "../../data/periods";
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
              icon={<LuMap />}
              label={"Kart"}
              labelSmall={"Kart"}
              to="/map"
            />
            <MainButton
              icon={<LuChartNoAxesColumn />}
              label={"Plan"}
              labelSmall={"Plan"}
              to="/plan"
            />
            {/* Akt 1 skal være tilgjengelig midt i spillet — spørsmålet
                «hvor stort var dette feltet igjen?» kommer underveis */}
            <MainButton
              icon={<LuTrendingDown />}
              label={"Norge i dag"}
              labelSmall={"Fakta"}
              title="Tallene for sokkelen slik den står i dag"
              to="/norge"
            />
            <MainButton
              icon={<LuLightbulb />}
              label={"Rådgiver"}
              labelSmall={"Råd"}
              title="Få analyse av og forslag til planen din"
              to="/advisor"
            />
            <MainButton
              icon={<LuWind />}
              label={"Omstilling"}
              labelSmall={"Grønt"}
              title="Se hva som erstatter oljen"
              to="/transition"
            />
            {gameEnded || (
              <MainButton
                icon={<LuCircleHelp />}
                label={"Hjelp"}
                labelSmall={"Hjelp"}
                title="Hjelp"
                to="/tutorial"
              />
            )}
            <div className="nav-divider"></div>
            <MainButton
              icon={<LuRotateCcw />}
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
