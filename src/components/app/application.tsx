import React, { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { ApplicationContext, PeriodDecision } from "../../applicationContext";
import { PeriodReportRoute } from "../report/periodReportRoute";
import { FrontPage } from "./frontPage";
import { PhaseOutRoute } from "../phaseout/phaseOutRoute";
import { useSessionState } from "../../hooks/useSessionState";
import { VerdictRoute } from "../verdict/verdictRoute";
import { SiteLayout } from "./siteLayout";
import { GameLayout } from "./gameLayout";
import { Year } from "../../data/types";
import { PhaseOutSchedule } from "../../data/gameData";
import { TodayRoute } from "../today/todayRoute";
import { PeriodBriefRoute } from "../period/periodBriefRoute";

/**
 * Routes that are not on the path a first-time player takes.
 *
 * Everything used to arrive in one 1.07 MB script, which a phone on a train
 * has to download and parse before the front page draws a single word. The
 * split below is by WHEN a page is needed, not by how big it is:
 *
 *  - The map carries OpenLayers, by far the heaviest dependency, and is the
 *    second screen rather than the first. Splitting it alone takes roughly
 *    half the JavaScript off the initial load. `warmMap()` fetches it while
 *    the player reads the front page, so the click still feels instant.
 *  - The chart and table pages (`/plan`, `/emissions`, `/production`,
 *    `/data`, `/kostnad`) and the two side rooms (`/advisor`,
 *    `/transition`) are reached from a menu, deliberately, and a great many
 *    players never open them at all.
 *
 * The three acts themselves — front page, Norge i dag, the period brief, the
 * selector, the report, the reckoning — stay in the main bundle. They are
 * the game, and a loading pause between acts would be felt.
 */
const MapRoute = lazy(() =>
  import("../map/mapRoute").then((m) => ({ default: m.MapRoute })),
);
const CostPage = lazy(() =>
  import("../cost/costPage").then((m) => ({ default: m.CostPage })),
);
const ProductionRoute = lazy(() =>
  import("../production/productionRoute").then((m) => ({
    default: m.ProductionRoute,
  })),
);
const EmissionRoute = lazy(() =>
  import("../emissions/emissionRoute").then((m) => ({
    default: m.EmissionRoute,
  })),
);
const PlanRoute = lazy(() =>
  import("../plan/planRoute").then((m) => ({ default: m.PlanRoute })),
);
const DataViewRoute = lazy(() =>
  import("../dataView/dataViewRoute").then((m) => ({
    default: m.DataViewRoute,
  })),
);
const TutorialRoute = lazy(() =>
  import("./tutorialRoute").then((m) => ({ default: m.TutorialRoute })),
);
const AdvisorRoute = lazy(() =>
  import("../advisor/advisorRoute").then((m) => ({ default: m.AdvisorRoute })),
);
const TransitionRoute = lazy(() =>
  import("../transition/transitionRoute").then((m) => ({
    default: m.TransitionRoute,
  })),
);

/** Starts the map download early, before the player asks for it. */
function warmMap() {
  void import("../map/mapRoute");
}

/**
 * All routes, organized as two layout routes that each own their chrome:
 *
 * - SiteLayout: the answer-first pages (front page, transition, advisor,
 *   tutorial) with a slim brand header and no game UI
 * - GameLayout: the game itself, with the full cockpit (game navigation,
 *   journey StatusBar and the guided next-step footer)
 *
 * Moving a page between the worlds — or giving one page its own frame —
 * is a one-line change here, with no hidden route lists anywhere else.
 */
/**
 * Resets the main scroll position on navigation: #app main is the app's
 * single scroller and never remounts, so without this the scroll position
 * leaks between pages and users land mid-page.
 */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelector("#app main")?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Shown while a split-out route's script arrives.
 *
 * Deliberately quiet: a spinner that appears for 80 ms on a fast connection
 * reads as jank. `role="status"` so a screen reader is told something is
 * happening rather than landing in an empty main element.
 */
function RouteLoading() {
  return (
    <div className="route-loading" role="status">
      Laster …
    </div>
  );
}

function ApplicationRoutes() {
  // The map is the screen after the front page for nearly every player, so
  // its chunk is fetched while they are still reading
  useEffect(warmMap, []);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path={"/"} element={<FrontPage />} />
            {/* Akt 1 — orienteringen, før noe valg tas */}
            <Route path={"/norge"} element={<TodayRoute />} />
            <Route path={"/kostnad"} element={<CostPage />} />
            <Route path={"/tutorial"} element={<TutorialRoute />} />
            <Route path={"*"} element={<h2>Not Found</h2>} />
          </Route>
          <Route element={<GameLayout />}>
            {/* Råd og Grønt nås fra spillnavigasjonen midt i en runde —
            spillerne skal beholde statuslinjen og neste-steg-footeren */}
            <Route path={"/transition"} element={<TransitionRoute />} />
            <Route path={"/advisor"} element={<AdvisorRoute />} />
            {/* ONE route with an optional param, not two routes rendering the
              same element: two separate <Route>s made React remount MapRoute
              when a field was opened, which reset the ref holding the row to
              return keyboard focus to. */}
            <Route path={"/map/:slug?"} element={<MapRoute />} />
            {/* Akt 2 — hver periode åpner med sin egen brief */}
            <Route path={"/periode"} element={<PeriodBriefRoute />} />
            <Route path={"/phaseout"} element={<PhaseOutRoute />} />
            <Route path={"/plan/*"} element={<PlanRoute />} />
            <Route path={"/emissions/*"} element={<EmissionRoute />} />
            <Route path={"/production/*"} element={<ProductionRoute />} />
            <Route path={"/data/*"} element={<DataViewRoute />} />
            <Route path={"/report"} element={<PeriodReportRoute />} />
            {/* Akt 3 — oppgjøret */}
            <Route path={"/summary"} element={<VerdictRoute />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

/**
 * The root component for the entire application.
 *
 * It manages global state such as the current year and phase-out schedule
 * using sessionStorage (via useSessionState), and provides these values
 * through ApplicationContext to all child components.
 *
 * This component also defines logic for progressing through the game/simulation timeline
 * and restarting the simulation entirely.
 *
 * Structure:
 * - <ApplicationRoutes /> → layout routes rendering their own
 *   header/main/footer chrome (SiteLayout or GameLayout)
 */
export function Application() {
  // Constants for start year and end year, and steps
  const startYear = 2025;
  const endYear = 2040;
  const yearStep = 4;

  // Persist the current year across sessions (initially "2025")
  const [year, setYear] = useSessionState<Year>(
    "year",
    startYear.toString() as Year,
  );
  // Persist the current phase-out schedule (initially empty)
  const [phaseOut, setPhaseOut] = useSessionState<PhaseOutSchedule>(
    "phaseOutSchedule",
    {},
  );
  // Persist the current phase-out draft selection
  const [phaseOutDraft, setPhaseOutDraft] = useSessionState<PhaseOutSchedule>(
    "phaseOutDraftSchedule",
    {},
  );
  // Persist the most recently committed decision, for the period report
  const [lastDecision, setLastDecision] =
    useSessionState<PeriodDecision | null>("lastDecision", null);
  const navigate = useNavigate();

  /**
   * Advances the simulation to the next 4-year period.
   *
   * Example: 2025 → 2028 → 2032 → ... → 2040.
   *
   * When 2040 is reached, the app navigates to the "/summary" route.
   */
  function proceed() {
    setYear((y) => {
      const year = parseInt(y);
      // Move forward to the next multiple of 4, capped at 2040
      // const nextYear = Math.min(year + yearStep - (year % yearStep), endYear);
      const nextYear = Math.min(getEndOfTermYear(), endYear);
      if (nextYear === endYear) navigate("/summary");
      return nextYear.toString() as Year; // Return as string type Year
    });
  }

  /**
   * Commits the current draft: retires the drafted fields, records the
   * decision for the period report, advances to the next period, and
   * navigates to the report — or straight to the summary after the final
   * round. Both "avvikle" buttons (footer and field selector) go through
   * here, so the report step can never be skipped by accident.
   */
  function commitDraft() {
    const toYear = getEndOfTermYear();
    setLastDecision({
      round: getCurrentRound(),
      fromYear: year,
      toYear,
      fields: Object.keys(phaseOutDraft),
    });
    setPhaseOut((phaseOut) => ({ ...phaseOut, ...phaseOutDraft }));
    setPhaseOutDraft({});
    setYear(toYear.toString() as Year);
    navigate(toYear >= endYear ? "/summary" : "/report");
  }

  /**
   * Resets the entire simulation back to its starting state:
   * - Year is reset to 2025
   * - All phase-out data is cleared
   * - User is navigated back to the root ("/")
   */
  function restart() {
    setYear(startYear.toString() as Year);
    setPhaseOut({});
    setPhaseOutDraft({});
    setLastDecision(null);

    navigate("/");
  }

  /** Returns the current simulation round number based on the year (1–5). */
  function getCurrentRound(): number {
    return Math.round((parseInt(year) - startYear) / yearStep) + 1;
  }

  /** Returns the total number of rounds (fixed at 5). */
  function getTotalRounds(): number {
    return Math.round((endYear - startYear) / yearStep) + 1;
  }

  /**
   * Returns the final year of the current term.
   *
   * Each term normally lasts `yearStep` years (e.g., 4),
   * but if the current year does not align with a multiple of `yearStep`,
   * it adjusts so that the *end of term* lands on the next multiple of `yearStep`.
   *
   * Examples (yearStep = 4):
   * - 2025 → 2028  (since 2028 is the next multiple of 4 after 2025)
   * - 2028 → 2032
   * - 2032 → 2036
   * - 2036 → 2040
   */
  function getEndOfTermYear(): number {
    const y = parseInt(year);
    const remainder = y % yearStep;
    const nextStep = remainder === 0 ? yearStep : yearStep - remainder;
    return Math.min(y + nextStep, endYear);
  }

  return (
    // Context provider: makes the app state and control functions available to children
    <ApplicationContext
      value={{
        year,
        proceed,
        commitDraft,
        restart,
        phaseOut,
        setPhaseOut,
        phaseOutDraft,
        setPhaseOutDraft,
        lastDecision,
        getCurrentRound,
        getTotalRounds,
        startYear,
        endYear,
        yearStep,
        getEndOfTermYear,
      }}
    >
      <ApplicationRoutes />
    </ApplicationContext>
  );
}
