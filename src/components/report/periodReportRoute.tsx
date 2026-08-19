import React, { useContext, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApplicationContext } from "../../applicationContext";
import { OilfieldName } from "../../data/gameData";
import { periodForRound, periods } from "../../data/periods";
import {
  bestAvailable,
  costOfWaiting,
  fieldOutlook,
  scoreDecision,
} from "../../analysis/periodAnalysis";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { SourcesNote } from "../ui/sourcesNote";
import "../period/period.css";

/**
 * The chapter break between periods.
 *
 * Two things changed from the old report. First, the verdict is the
 * period's OWN measure — cut per forgone barrel in period 1, cut per
 * forgone krone in period 2, and so on — not the same running percentage
 * four times. Second, the result is placed next to the best that was
 * actually reachable under the same capacity limit, so the player can tell
 * a good round from a lucky one and has something to carry into the next.
 *
 * There is no praise and no scolding here. The numbers are stated, the
 * comparison is stated, and what it cost to leave the rest running is
 * stated. What to make of that is the player's business.
 */
export function PeriodReportRoute() {
  const { year, phaseOut, lastDecision, getCurrentRound } =
    useContext(ApplicationContext);
  const navigate = useNavigate();

  const decidedRound = lastDecision?.round ?? 1;
  const period = periodForRound(decidedRound);
  const nextPeriod =
    decidedRound < periods.length
      ? periodForRound(decidedRound + 1)
      : undefined;
  const fields = (lastDecision?.fields ?? []) as OilfieldName[];

  const outlooks = useMemo(
    () => fields.map((f) => fieldOutlook(f, period.fromYear, period.toYear)),
    [fields, period],
  );

  const score = useMemo(
    () => scoreDecision(outlooks, period),
    [outlooks, period],
  );

  /**
   * The benchmark: the same NUMBER of closures the player made, chosen the
   * way this period measures. Comparing against a full-capacity plan would
   * punish a deliberate decision to close fewer fields, which is a
   * legitimate choice rather than a mistake.
   */
  const best = useMemo(() => {
    // Measured before this decision, so the player and the benchmark chose
    // from the same set of available fields
    const before = { ...phaseOut };
    for (const field of fields) delete before[field];
    return bestAvailable(before, period, fields.length);
  }, [phaseOut, fields, period]);

  const waiting = useMemo(
    () => (nextPeriod ? costOfWaiting(phaseOut, nextPeriod) : 0),
    [phaseOut, nextPeriod],
  );

  const avoidedMt = useMemo(
    () => (cumulativeEmissions({}) - cumulativeEmissions(phaseOut)) / 1_000_000,
    [phaseOut],
  );

  if (!lastDecision || year === "2040") return <Navigate to="/map" replace />;

  /**
   * The fields the benchmark picked and the player did not. Naming the
   * overlap would be useless advice — "you should have chosen the fields
   * you chose" — so only the difference is shown.
   */
  const missed = best.outlooks
    .filter((o) => !fields.includes(o.field))
    .slice(0, 3)
    .map((o) => o.field);

  const emissionKt = Math.round(
    outlooks.reduce((s, o) => s + o.emissionThisPeriod, 0) / 1000,
  );
  const scale = Math.max(score.value, best.score.value, 0.0001);
  const reachedBest = score.value >= best.score.value * 0.98;

  return (
    <article
      className="period-report"
      style={{ ["--period-accent" as string]: period.accent }}
    >
      <header className="report-head">
        <span className="brief-glyph">{period.glyph}</span>
        <div>
          <div className="brief-kicker">
            {period.label} · {period.name}
          </div>
          <h1>Slik gikk perioden</h1>
        </div>
      </header>

      <section className="report-decision">
        {fields.length === 0 ? (
          <>
            Stortinget vedtok <strong>ingen avviklinger</strong> i{" "}
            {period.label}. Alle felt produserer videre.
          </>
        ) : (
          <>
            Stortinget vedtok sluttdato for <strong>{fields.length}</strong>{" "}
            {fields.length === 1 ? "felt" : "felt"}. Det fjerner{" "}
            <strong>~{emissionKt.toLocaleString("nb-NO")} kt CO₂</strong> i
            løpet av denne perioden, og{" "}
            <strong>
              {Math.round(
                outlooks.reduce((s, o) => s + o.avoidedEmission, 0) / 1_000_000,
              ).toLocaleString("nb-NO")}{" "}
              mill. tonn
            </strong>{" "}
            fram mot 2040.
            <ul className="decided-fields">
              {fields.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {fields.length > 0 && (
        <section className="report-measure">
          <div className="measure-head">
            <span className="measure-name">{period.measure.name}</span>
            <span className="measure-value">
              {score.display} {score.unit}
            </span>
          </div>
          <div className="measure-explainer">{period.measure.explainer}</div>

          <div className="measure-bars">
            <div className="measure-bar">
              <span>Din beslutning</span>
              <span className="track">
                <span
                  className="fill"
                  style={{ width: `${(score.value / scale) * 100}%` }}
                />
              </span>
              <span className="measure-value">{score.display}</span>
            </div>
            <div className="measure-bar best">
              <span>Best mulig</span>
              <span className="track">
                <span
                  className="fill"
                  style={{ width: `${(best.score.value / scale) * 100}%` }}
                />
              </span>
              <span className="measure-value">{best.score.display}</span>
            </div>
          </div>

          <div className="measure-verdict">
            {reachedBest ? (
              <>
                Ingen andre {fields.length} felt ville gitt et bedre resultat på
                dette målet denne perioden.
              </>
            ) : (
              <>
                Med {fields.length} andre felt var{" "}
                <strong>
                  {best.score.display} {best.score.unit}
                </strong>{" "}
                mulig
                {missed.length > 0 && (
                  <>
                    {" "}
                    – forskjellen ligger i {formatList(missed)}, som du lot gå
                    videre
                  </>
                )}
                .
              </>
            )}
          </div>
        </section>
      )}

      {/* .stats, ikke .report-figures: den klassen forsvant da kortene ble
          fjernet, så tallene mistet rutenettet og stablet seg loddrett */}
      <section className="stats">
        <div>
          <p className="num">{Object.keys(phaseOut).length}</p>
          <p className="label">felt har sluttdato i planen din</p>
        </div>
        <div>
          <p className="num">
            {avoidedMt.toLocaleString("nb-NO", { maximumFractionDigits: 1 })}{" "}
            <small className="unit">mill. tonn</small>
          </p>
          <p className="label">CO₂ unngått 2025–2040 så langt</p>
        </div>
        {nextPeriod && (
          <div>
            <p className="num">
              {Math.round(waiting / 1_000_000).toLocaleString("nb-NO")}{" "}
              <small className="unit">mill. tonn</small>
            </p>
            <p className="label">
              CO₂ slipper feltene som står igjen ut i {nextPeriod.label}
            </p>
          </div>
        )}
      </section>

      {nextPeriod && (
        <section className="report-next">
          <strong>
            Neste: {nextPeriod.name}, {nextPeriod.label}.
          </strong>{" "}
          {nextPeriod.brief[0]} Denne gangen måles du på{" "}
          <strong>{nextPeriod.measure.name.toLowerCase()}</strong>.
        </section>
      )}

      <div className="report-actions">
        <button className="primary" onClick={() => navigate("/periode")}>
          Videre til {nextPeriod?.label ?? "oppgjøret"} →
        </button>
        <button onClick={() => navigate("/map")}>Se planen på kartet</button>
      </div>

      <SourcesNote />
    </article>
  );
}

/** "Brage, Ula og Statfjord" — Norwegian list separator, not a comma. */
function formatList(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} og ${names[names.length - 1]}`;
}
