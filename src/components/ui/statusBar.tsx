import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { gameData, sumOverYears, totalProduction } from "../../data/gameData";
import { goalCutPercent } from "../../data/gameGoal";
import "./statusBar.css";

/**
 * The game's status strip: a journey rather than a percentage.
 *
 * Shows the four parliamentary-term periods 2025–2040 as a segmented
 * timeline with a finish flag, the player's accumulated impact (fields
 * retired, emission cut), and a narrative line that changes with the phase
 * of the game. Replaces the old year chip + "Runde 1/5" + grey progress bar.
 */
export function StatusBar() {
  const { year, phaseOut, getCurrentRound } = useContext(ApplicationContext);
  const navigate = useNavigate();

  const round = getCurrentRound(); // 1–4 during play, 5 when finished
  const periods = gameData.gamePeriods;
  const finished = year === "2040";

  const fieldsClosed = Object.keys(phaseOut).length;
  const fieldsTotal = gameData.allFields.length;

  const cutPercent = useMemo(() => {
    const baseline = sumOverYears(totalProduction({}), "emission");
    const current = sumOverYears(totalProduction(phaseOut), "emission");
    return Math.round(((baseline - current) / baseline) * 100);
  }, [phaseOut]);

  const periodLabel = finished
    ? "🏁 2040 – reisen er fullført"
    : `${periods[round - 1].years[0]}–${periods[round - 1].years[periods[round - 1].years.length - 1]} · ${round}. stortingsperiode av ${periods.length}`;

  const goal = goalCutPercent();
  const story = finished
    ? `Planen din avviklet ${fieldsClosed} felter og kuttet utslippene mot 2040 med ${cutPercent} %.`
    : fieldsClosed === 0
      ? `Klarer du å kutte minst ${goal} % innen 2040 – like mye som MDG-planen?`
      : `${fieldsClosed} felter har fått sluttdato – utslippene mot 2040 er kuttet ${cutPercent} % av målet på ${goal} %.`;

  return (
    <div className="status-bar" role="status">
      <div className="status-top">
        <span className="status-period">{periodLabel}</span>
        <span className="status-story">{story}</span>
        {finished ? (
          <span className="status-cta">
            <button onClick={() => navigate("/summary")}>
              🏆 Se resultatet
            </button>
          </span>
        ) : (
          <span
            className="status-stats"
            /* key: nytt vedtak → elementet remountes → puls-animasjonen
               spilles én gang, så spranget i tallene får et blink */
            key={`${fieldsClosed}-${cutPercent}`}
          >
            <span title="Felter med vedtatt sluttdato">
              🛢️{" "}
              <strong>
                {fieldsClosed}/{fieldsTotal}
              </strong>{" "}
              felter
            </span>
            <span
              title={`Kutt i samlede utslipp 2025–2040 med planen din. Målet er minst ${goal} % – like mye som MDG-planen.`}
            >
              🌍 <strong>{cutPercent > 0 ? `−${cutPercent}` : "0"} %</strong>
              <span className="status-goal"> av 🎯 −{goal} %</span>
            </span>
          </span>
        )}
      </div>

      <div className="status-timeline" aria-label={periodLabel}>
        {periods.map((period, index) => {
          const state = finished
            ? "done"
            : index + 1 < round
              ? "done"
              : index + 1 === round
                ? "current"
                : "future";
          return (
            <div
              key={period.years[0]}
              className={`status-segment ${state}`}
              title={`${period.years[0]}–${period.years[period.years.length - 1]}`}
            >
              <div className="fill" />
            </div>
          );
        })}
        <span className={`status-flag ${finished ? "reached" : ""}`}>🏁</span>
      </div>

      <div className="status-years">
        {periods.map((period) => (
          <span key={period.years[0]}>{period.years[0]}</span>
        ))}
        <span>2040</span>
      </div>
    </div>
  );
}
