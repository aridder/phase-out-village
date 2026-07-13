import React, { useContext, useEffect, useMemo, useState } from "react";
import { FaLightbulb } from "react-icons/fa";
import { ApplicationContext } from "../../applicationContext";
import { analyzePlan } from "../../analysis/advisorEngine";
import { optimizePlan, OptimizerStrategy } from "../../analysis/planOptimizer";
import { Year } from "../../data/types";
import { EmissionStackedBarChart } from "../emissions/emissionStackedBarChart";
import { ProductionReductionChart } from "../production/productionReductionChart";
import "./advisor.css";

/**
 * Reveals a text with a typewriter effect, character by character.
 * Returns the currently visible portion and whether the animation is done.
 */
function useTypewriter(text: string, speedMs: number = 12) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    setLength(0);
    const interval = setInterval(() => {
      setLength((l) => {
        if (l >= text.length) {
          clearInterval(interval);
          return l;
        }
        return l + 2;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);
  return { visible: text.slice(0, length), done: length >= text.length };
}

/** Short "analysis in progress" indicator shown before the report appears. */
function ThinkingIndicator() {
  return (
    <div className="advisor-thinking">
      <FaLightbulb className="bulb" />
      <span>
        Analyserer planen din<span className="dot">.</span>
        <span className="dot">.</span>
        <span className="dot">.</span>
      </span>
    </div>
  );
}

/**
 * The climate advisor page.
 *
 * Analyzes the player's committed phase-out plan and presents:
 * - a grade and a generated natural language summary
 * - concrete insights and recommendations based on the game dataset
 * - the avoided emissions translated into relatable equivalents
 * - an interactive plan optimizer that generates a phase-out schedule
 *   for a chosen emission target
 *
 * All analysis runs locally in the browser on the game's open dataset —
 * no data leaves the page.
 */
export function AdvisorRoute() {
  const { year, phaseOut } = useContext(ApplicationContext);
  const [thinking, setThinking] = useState(true);

  // A short artificial delay before revealing the analysis makes it easier
  // to see that a new analysis has been generated after each round.
  useEffect(() => {
    setThinking(true);
    const timeout = setTimeout(() => setThinking(false), 900);
    return () => clearTimeout(timeout);
  }, [phaseOut, year]);

  const report = useMemo(() => analyzePlan(phaseOut, year), [phaseOut, year]);
  const summary = useTypewriter(thinking ? "" : report.summary);
  const [skipped, setSkipped] = useState(false);
  const summaryDone = summary.done || skipped;

  return (
    <div className="advisor-page">
      <h2 className="advisor-title">
        <FaLightbulb /> Klimarådgiveren
      </h2>

      {thinking ? (
        <ThinkingIndicator />
      ) : (
        <>
          <div className="advisor-hero">
            <div className="advisor-grade-card" data-grade={report.grade}>
              <div className="advisor-grade">{report.grade}</div>
              <div className="advisor-grade-label">Klimakarakter</div>
            </div>
            {/* Tap-to-skip: skrivemaskinen skal aldri holde innholdet
                gissel for den utålmodige */}
            <div
              className="advisor-summary"
              onClick={() => setSkipped(true)}
              title={summaryDone ? undefined : "Trykk for å vise alt"}
            >
              {skipped ? report.summary : summary.visible}
              {!summaryDone && <span className="cursor">▋</span>}
            </div>
          </div>

          {report.insights.length > 0 && (
            <>
              <h3>Innsikt fra rådgiveren</h3>
              <div className="advisor-insights">
                {report.insights.map((insight) => (
                  <div
                    key={insight.title}
                    className={`advisor-insight kind-${insight.kind}`}
                  >
                    <h4>
                      {insight.emoji} {insight.title}
                    </h4>
                    <div>{insight.text}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <PlanOptimizer />

          <div className="advisor-disclaimer">
            Analysen genereres automatisk fra spillets åpne datasett
            (produksjonsdata fra Norsk Petroleum og utslippsdata fra Offshore
            Norge) og kjører i sin helhet i nettleseren din. Tallene er
            estimater ment for å utforske scenarioer – ikke offisielle
            fremskrivninger.
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Interactive optimizer: the player picks an emission reduction target and a
 * strategy, and the optimizer generates the phase-out plan that reaches the
 * target with the smallest possible production loss.
 */
function PlanOptimizer() {
  const { year, phaseOut, setPhaseOutDraft } = useContext(ApplicationContext);
  const [target, setTarget] = useState(60);
  const [strategy, setStrategy] = useState<OptimizerStrategy>("intensity");
  const [applied, setApplied] = useState(false);

  const plan = useMemo(
    () => optimizePlan(target, year, strategy),
    [target, year, strategy],
  );

  const sortedSchedule = Object.entries(plan.schedule).sort(
    (a, b) => parseInt(a[1] as Year) - parseInt(b[1] as Year),
  );

  function applyToDraft() {
    // Only the fields the optimizer phases out in the current period can be
    // selected in this round — queue them up as the player's draft. Fields
    // the player has already phased out are left untouched.
    const currentPeriodFields = Object.fromEntries(
      sortedSchedule.filter(
        ([field, y]) => y === year && !phaseOut[field as keyof typeof phaseOut],
      ),
    );
    setPhaseOutDraft((draft) => ({ ...draft, ...currentPeriodFields }));
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  }

  return (
    <div className="advisor-optimizer">
      <h3>🎯 Få forslag til en plan</h3>
      <div>
        Velg et klimamål, så finner optimalisereren utfasingsplanen som når
        målet med minst mulig produksjonstap.
      </div>

      <div className="advisor-optimizer-controls">
        <div>
          <label htmlFor="advisor-target">
            Mål: kutt <strong>{target} %</strong> av utslippene innen 2040
          </label>
          <input
            id="advisor-target"
            type="range"
            min={10}
            max={90}
            step={5}
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="advisor-strategy">Strategi</label>
          <select
            id="advisor-strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as OptimizerStrategy)}
          >
            <option value="intensity">
              Best klimaeffekt per fat (verstingene først)
            </option>
            <option value="volume">
              Færrest mulig felt (størst utslipp først)
            </option>
          </select>
        </div>
      </div>

      <div className="advisor-optimizer-result">
        <div className="advisor-optimizer-stat">
          <div className="value">{plan.fieldCount}</div>
          <div>felter fases ut</div>
        </div>
        <div className="advisor-optimizer-stat">
          <div className="value">
            {Math.round(plan.avoidedEmission / 1_000_000)} Mt
          </div>
          <div>CO₂ unngås ({plan.reductionPercent} %)</div>
        </div>
        <div className="advisor-optimizer-stat">
          <div className="value">{plan.productionLossPercent} %</div>
          <div>av produksjonen bortfaller</div>
        </div>
      </div>

      {!plan.targetReached && (
        <div>
          ⚠️ Målet på {target} % er ikke mulig å nå fra {year} – selv full
          utfasing gir {plan.reductionPercent} %. Jo tidligere man starter, jo
          mer er mulig.
        </div>
      )}

      {plan.fieldCount > 0 && (
        <>
          <div className="charts">
            <div>
              <EmissionStackedBarChart phaseOut={plan.schedule} />
            </div>
            <div>
              <ProductionReductionChart phaseOut={plan.schedule} />
            </div>
          </div>

          <details>
            <summary>
              Se hele den foreslåtte planen ({plan.fieldCount} felter)
            </summary>
            <table className="advisor-plan-table">
              <thead>
                <tr>
                  <th>Felt</th>
                  <th>Fases ut</th>
                </tr>
              </thead>
              <tbody>
                {sortedSchedule.map(([field, phaseOutYear]) => (
                  <tr key={field}>
                    <td className="field-name">{field}</td>
                    <td>{phaseOutYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <div>
            <button className="apply-button" onClick={applyToDraft}>
              {applied
                ? "✅ Lagt til i utvalget ditt!"
                : `Bruk forslaget for perioden ${year}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
