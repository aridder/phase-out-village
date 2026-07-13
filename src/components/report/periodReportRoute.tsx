import React, { useContext, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, periodLabel } from "../../data/gameData";
import {
  currentCutPercent,
  goalCutPercent,
  paceVerdict,
} from "../../data/gameGoal";
import { storyForRound } from "../../data/periodStories";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { emissionEquivalents } from "../../analysis/emissionEquivalents";
import { SourcesNote } from "../ui/sourcesNote";
import "./periodReport.css";

/**
 * The beat between rounds: after each "avvikle", the player lands here
 * instead of silently starting an identical new round.
 *
 * Shows what the decision just did (fields retired, yearly emissions and
 * production removed), whether the plan is ahead of or behind schedule
 * toward the game's goal (beat MDG's cut by 2040), and what happens in the
 * world during the period they are about to steer.
 */
export function PeriodReportRoute() {
  const { year, phaseOut, lastDecision, getCurrentRound, getEndOfTermYear } =
    useContext(ApplicationContext);
  const navigate = useNavigate();

  // Hooks must run unconditionally on every render, so they come before the
  // redirect guard below (fields/fromYear fall back to empty values)
  const round = lastDecision?.round ?? 1;
  const fromYear = lastDecision?.fromYear ?? year;
  const toYear = lastDecision?.toYear ?? year;
  const fields = lastDecision?.fields ?? [];

  const decision = useMemo(() => {
    const emissionKt = Math.round(
      fields.reduce(
        (sum, f) => sum + (gameData.data[f]?.[fromYear]?.emission?.value ?? 0),
        0,
      ) / 1000,
    );
    const productionMillSm3 =
      Math.round(
        fields.reduce(
          (sum, f) =>
            sum + (gameData.data[f]?.[fromYear]?.totalProduction?.value ?? 0),
          0,
        ) * 10,
      ) / 10;
    return { emissionKt, productionMillSm3 };
  }, [fields, fromYear]);

  const carEquivalent = useMemo(() => {
    const avoided = cumulativeEmissions({}) - cumulativeEmissions(phaseOut);
    return emissionEquivalents(avoided)[0];
  }, [phaseOut]);

  // No decision recorded (deep link or restart) — nothing to report on
  if (!lastDecision || year === "2040") return <Navigate to="/map" replace />;

  const goal = goalCutPercent();
  const cut = currentCutPercent(phaseOut);
  const pace = paceVerdict(cut, round, 4);

  const paceText =
    pace === "ahead"
      ? `Du ligger foran skjema! Fortsetter du sånn, slår du målet på −${goal} % med god margin.`
      : pace === "onTrack"
        ? `Du følger skjema mot målet på −${goal} %. Hold trykket oppe i neste periode.`
        : `Du ligger bak skjema mot målet på −${goal} %. De største og mest forurensende feltene gir mest – de ligger øverst i feltvelgeren.`;

  const paceEmoji = pace === "ahead" ? "🚀" : pace === "onTrack" ? "👍" : "⚠️";

  const story = storyForRound(getCurrentRound());

  return (
    <div className="period-report">
      <h1>📋 Perioderapport {periodLabel(round)}</h1>

      <div>
        {fields.length === 0 ? (
          <>
            Stortinget vedtok <strong>ingen avviklinger</strong> denne perioden.
            Feltene produserer videre – og slipper ut videre.
          </>
        ) : (
          <>
            Stortinget vedtok å avvikle <strong>{fields.length}</strong>{" "}
            {fields.length === 1 ? "felt" : "felter"}. Det fjerner{" "}
            <strong>
              ~{decision.emissionKt.toLocaleString("nb-NO")} kt CO₂
            </strong>{" "}
            og{" "}
            <strong>
              {decision.productionMillSm3.toLocaleString("nb-NO")} mill. Sm³
            </strong>{" "}
            produksjon per år.
            <ul className="decided-fields">
              {fields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="pace">
        <div className="verdict-line">
          {paceEmoji} {paceText}
        </div>
        {/* Meter spans 0 → 110 % of the larger of goal and current cut, so
            the goal mark stays visible and the fill can pass it */}
        <div
          className="goal-meter"
          title={`Ditt kutt: ${cut} % · Mål: ${goal} %`}
        >
          <div
            className="fill"
            style={{
              width: `${(cut / (Math.max(goal, cut, 1) * 1.1)) * 100}%`,
            }}
          />
          <div
            className="goal-mark"
            style={{
              left: `${(goal / (Math.max(goal, cut, 1) * 1.1)) * 100}%`,
            }}
          />
        </div>
        <div className="goal-labels">
          <span>
            Ditt kutt: <strong>−{cut} %</strong>
            {carEquivalent &&
              ` · som ${carEquivalent.amount} ${carEquivalent.label}`}
          </span>
          <span>🎯 Mål: −{goal} %</span>
        </div>
      </div>

      {story && (
        <div className="world">
          <h2>🌍 Mens du styrer {story.period} …</h2>
          <div className="world-headline">{story.headline}</div>
          <ul>
            {story.events.map((event) => (
              <li key={event.text}>
                {event.emoji} {event.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="cta-row">
        <button className="primary" onClick={() => navigate("/phaseout")}>
          ✏️ Velg felter for {periodLabel(getCurrentRound())} (
          {getCurrentRound()}. periode)
        </button>
        <button onClick={() => navigate("/map")}>🗺️ Se kartet først</button>
      </div>

      <SourcesNote />
    </div>
  );
}
