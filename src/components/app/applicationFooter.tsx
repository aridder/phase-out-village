import React, { useContext } from "react";
import { FaRecycle } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { MdEdit } from "react-icons/md";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import { RxReset } from "react-icons/rx";
import { MainButton } from "../ui/mainButton";
import { FcViewDetails } from "react-icons/fc";

/** Routes where the game loop is active and the action footer belongs */
const GAME_ROUTES = [
  "/map",
  "/phaseout",
  "/plan",
  "/emissions",
  "/production",
  "/data",
];

/**
 * The guided action footer: instead of three context-free buttons on every
 * page, it always spells out the ONE next step in the game loop —
 *
 *   1. no fields selected  → "velg feltene som skal stenges i <period>"
 *   2. fields in the draft → confirm: "avvikle og gå til neste periode"
 *   3. game finished       → "se resultatet"
 *
 * — and only appears on the routes where the game is actually played. The
 * front page, transition and advisor pages have their own calls to action.
 */
export function ApplicationFooter() {
  const {
    year,
    proceed,
    setPhaseOut,
    phaseOutDraft,
    setPhaseOutDraft,
    getCurrentRound,
    getTotalRounds,
    getEndOfTermYear,
  } = useContext(ApplicationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isSmall = useIsSmallScreen();
  const gameEnded = year === "2040";
  const draftCount = Object.keys(phaseOutDraft).length;
  const draftNames = Object.keys(phaseOutDraft);

  // The footer belongs to the game — stay out of the way everywhere else
  if (!GAME_ROUTES.some((route) => location.pathname.startsWith(route)))
    return null;

  function runPhaseOut() {
    const finalRound = getEndOfTermYear() >= 2040;
    setPhaseOut((phaseOut) => ({ ...phaseOut, ...phaseOutDraft }));
    setPhaseOutDraft({});
    proceed(); // navigates to /summary on the final round
    if (!finalRound) navigate("/map");
  }

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
          onClick={runPhaseOut}
          defaultColor="#a5e34d"
          hideLabelOnSmall={false}
          hideIconOnSmall={false}
        />
      </div>
    </footer>
  );
}
