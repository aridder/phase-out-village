import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { periodForRound, periods } from "../../data/periods";
import {
  availableFields,
  costOfWaiting,
  scheduledShare,
} from "../../analysis/periodAnalysis";
import { gameData, totalProduction } from "../../data/gameData";
import "./period.css";

/**
 * The opening of each period in Act 2.
 *
 * The old game dropped the player straight back into an identical field
 * list four times over, with nothing to mark that a new period had begun.
 * This screen is the marker: it names the period, gives it its own colour,
 * states the situation, and — most importantly — says what THIS period
 * measures, which is different every time.
 *
 * It also states the constraint up front. Knowing you can close five fields
 * and not fifty is what turns the choice into a priority.
 */
export function PeriodBriefRoute() {
  const { phaseOut, getCurrentRound, year } = useContext(ApplicationContext);
  const navigate = useNavigate();

  const round = getCurrentRound();
  const period = periodForRound(round);
  const previous = round > 1 ? periodForRound(round - 1) : undefined;

  const available = useMemo(
    () => availableFields(phaseOut, period),
    [phaseOut, period],
  );

  /** What the shelf looks like right now, so the brief is never generic. */
  const state = useMemo(() => {
    const first = gameData.gameYears[0];
    const nowProduction =
      totalProduction(phaseOut, [year])[year]?.totalProduction?.value ?? 0;
    const startProduction =
      totalProduction({}, [first])[first]?.totalProduction?.value ?? 0;
    const nowEmission =
      totalProduction(phaseOut, [year])[year]?.emission?.value ?? 0;
    return {
      running: available.length,
      closed: Object.keys(phaseOut).length,
      productionShare:
        startProduction > 0 ? nowProduction / startProduction : 0,
      emissionMt: nowEmission / 1_000_000,
      scheduled: scheduledShare(phaseOut),
    };
  }, [phaseOut, year, available]);

  const waiting = useMemo(
    () => costOfWaiting(phaseOut, period),
    [phaseOut, period],
  );

  return (
    <article
      className="period-brief"
      style={{ ["--period-accent" as string]: period.accent }}
    >
      <header className="brief-head">
        <div className="brief-chapter">
          <span className="brief-glyph">{period.glyph}</span>
          <div>
            <div className="kicker">
              {period.kicker} · {period.label}
            </div>
            <h1>{period.name}</h1>
          </div>
        </div>
        <ol className="brief-progress" aria-label="Perioder">
          {periods.map((p) => (
            <li
              key={p.round}
              className={
                p.round < round ? "done" : p.round === round ? "current" : ""
              }
              style={{ ["--dot" as string]: p.accent }}
            >
              <span className="dot" aria-hidden="true" />
              <span className="brief-progress-label">{p.label}</span>
            </li>
          ))}
        </ol>
      </header>

      <section className="brief-body">
        {period.brief.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      {/* What changed since last time — only from period 2 onward, because
          in period 1 there is nothing to have changed */}
      {previous && (
        <section className="brief-changed">
          <h2>Slik står det nå</h2>
          <div className="changed-row">
            <div>
              <div className="changed-value">
                {Math.round(state.productionShare * 100)} %
              </div>
              <div className="changed-label">av 2025-produksjonen er igjen</div>
            </div>
            <div>
              <div className="changed-value">{state.closed}</div>
              <div className="changed-label">felt har fått sluttdato</div>
            </div>
            <div>
              <div className="changed-value">
                {state.emissionMt.toLocaleString("nb-NO", {
                  maximumFractionDigits: 1,
                })}
              </div>
              <div className="changed-label">
                mill. tonn CO₂ i året fra sokkelen
              </div>
            </div>
            <div>
              <div className="changed-value">{state.running}</div>
              <div className="changed-label">felt kan fortsatt stenges</div>
            </div>
          </div>
        </section>
      )}

      {/* Tre definisjoner er bokstavelig talt en definisjonsliste — det var
          tre kort før, med hver sin ramme rundt to linjer tekst */}
      <dl className="defs brief-rules">
        <div>
          <dt>Kapasitet denne perioden</dt>
          <dd className="defs-value">
            {period.capacity >= available.length
              ? "Ingen grense"
              : `${period.capacity} felt`}
          </dd>
          <dd className="defs-note">{period.capacityReason}</dd>
        </div>
        <div>
          <dt>Det du får se</dt>
          <dd className="defs-value">{period.lensLabel}</dd>
          <dd className="defs-note">{period.lensExplainer}</dd>
        </div>
        <div>
          <dt>Det du måles på</dt>
          <dd className="defs-value">{period.measure.name}</dd>
          <dd className="defs-note">{period.measure.explainer}</dd>
        </div>
      </dl>

      <section className="brief-world">
        <h2>Dette skjer i {period.label}</h2>
        <ul>
          {period.events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </section>

      {waiting > 0 && (
        <p className="brief-stake">
          Feltene som går videre gjennom {period.label} slipper til sammen ut{" "}
          <strong>
            {Math.round(waiting / 1_000_000).toLocaleString("nb-NO")} millioner
            tonn CO₂
          </strong>{" "}
          i løpet av disse fire årene. Det er det denne perioden handler om.
        </p>
      )}

      <div className="brief-actions">
        <button className="primary" onClick={() => navigate("/phaseout")}>
          Velg felt for {period.label} →
        </button>
        <button onClick={() => navigate("/map")}>Se kartet først</button>
      </div>
    </article>
  );
}
