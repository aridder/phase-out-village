import React, { useContext, useMemo } from "react";
import { ApplicationContext } from "../../applicationContext";
import { gameData } from "../../data/gameData";
import { periodForRound, periods } from "../../data/periods";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { scheduledShare } from "../../analysis/periodAnalysis";
import "./statusBar.css";

/**
 * The game's status strip: where you are in the four periods, and what the
 * plan has done so far.
 *
 * It deliberately does NOT show a pass mark. The old bar measured the
 * player against one party's phase-out plan every second of the game,
 * which made the whole thing read as an argument with a right answer.
 * These are the player's own figures; the comparison against other plans
 * belongs in Act 3, once they have made their own choices.
 */
export function StatusBar() {
  const { year, phaseOut, getCurrentRound } = useContext(ApplicationContext);

  const round = getCurrentRound();
  const finished = year === "2040";
  const period = periodForRound(round);

  const fieldsScheduled = Object.keys(phaseOut).length;
  const fieldsTotal = gameData.allFields.length;

  const avoidedMt = useMemo(
    () => (cumulativeEmissions({}) - cumulativeEmissions(phaseOut)) / 1_000_000,
    [phaseOut],
  );
  const share = useMemo(() => scheduledShare(phaseOut), [phaseOut]);

  // NB: no role="status" on the bar itself. It made every change
  // re-announce the period name and all three figures; only the figures are
  // live, and they are polite rather than remounted on each change.
  return (
    <div
      className="status-bar"
      style={{ ["--period-accent" as string]: period.accent }}
    >
      <div className="status-top">
        <span className="status-period">
          {finished ? (
            <>2040 – perioden er over</>
          ) : (
            <>
              <span className="status-glyph">{period.glyph}</span>
              {period.name} · {period.label}
            </>
          )}
        </span>

        <span className="status-stats" role="status" aria-live="polite">
          <span title="Felt som har fått en vedtatt sluttdato">
            <strong>
              {fieldsScheduled}/{fieldsTotal}
            </strong>{" "}
            felt
          </span>
          <span title="Andel av 2025-produksjonen som har fått sluttdato">
            <strong>{Math.round(share * 100)} %</strong> av produksjonen
          </span>
          <span title="Samlede utslipp 2025–2040 unngått med planen din">
            <strong>
              {avoidedMt.toLocaleString("nb-NO", { maximumFractionDigits: 0 })}{" "}
              Mt
            </strong>{" "}
            CO₂ spart
          </span>
        </span>
      </div>

      <div className="status-timeline" aria-label={`Periode ${round} av 4`}>
        {periods.map((p) => {
          const state = finished
            ? "done"
            : p.round < round
              ? "done"
              : p.round === round
                ? "current"
                : "future";
          return (
            <div
              key={p.round}
              className={`status-segment ${state}`}
              style={{ ["--segment" as string]: p.accent }}
              title={`${p.label} – ${p.name}`}
            >
              <div className="fill" />
              <span className="segment-label">{p.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
