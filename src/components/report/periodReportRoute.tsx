import React, { useContext, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, periodLabel } from "../../data/gameData";
import {
  currentCutPercent,
  goalCutPercent,
  paceVerdict,
} from "../../data/gameGoal";
import { chapterForRound } from "../../data/story";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { emissionEquivalents } from "../../analysis/emissionEquivalents";
import { SourcesNote } from "../ui/sourcesNote";
import "./periodReport.css";

/**
 * The chapter break between rounds: after each "avvikle", the player lands
 * here instead of silently starting an identical new round.
 *
 * Shows what the decision just did (fields retired, yearly emissions and
 * production removed), whether the plan is on schedule toward the goal, and
 * the next chapter of the story — what happens in the world during the
 * period they are about to steer.
 */
export function PeriodReportRoute() {
  const { year, phaseOut, lastDecision, getCurrentRound } =
    useContext(ApplicationContext);

  // Hooks must run unconditionally on every render, so they come before the
  // redirect guard below (fields/fromYear fall back to empty values)
  const round = lastDecision?.round ?? 1;
  const fromYear = lastDecision?.fromYear ?? year;
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
      ? `Du ligger foran skjema! Fortsetter du sånn, når du målet på −${goal} % med god margin.`
      : pace === "onTrack"
        ? `Du følger skjema mot målet på −${goal} %. Hold trykket oppe.`
        : `Du ligger bak skjema mot målet på −${goal} %. Tips: de verste feltene ligger øverst i feltvelgeren.`;

  const paceEmoji = pace === "ahead" ? "🚀" : pace === "onTrack" ? "👍" : "⚠️";

  const chapter = chapterForRound(getCurrentRound());

  return (
    <div className="period-report">
      <h1>📋 Slik gikk det i {periodLabel(round)}</h1>

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

      {chapter && (
        <div className="world">
          <h2>
            📖 Kapittel {chapter.round} av 4: {chapter.name}
          </h2>
          <div className="world-headline">
            Dette skjer i verden i {chapter.period}:
          </div>
          <ul>
            {chapter.events.map((event) => (
              <li key={event.text}>
                {event.emoji} {event.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA-raden er kuttet: footeren har «Neste steg … Velg» og
          nav-en har Kart — rapporten skal være ett pusterom, én skjerm */}
      <SourcesNote />
    </div>
  );
}
