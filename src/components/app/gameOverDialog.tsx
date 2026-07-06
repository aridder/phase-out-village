import React, { useContext, useMemo } from "react";
import { Dialog } from "../ui/dialog";
import { ProductionReductionChart } from "../production/productionReductionChart";
import { ApplicationContext } from "../../applicationContext";
import { mdgPlan } from "../../generated/dataMdg";
import { EmissionStackedBarChart } from "../emissions/emissionStackedBarChart";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import { gameData } from "../../data/gameData";
import { cumulativeEmissions } from "../../ai/fieldStats";
import { economySummary } from "../../data/petroleumEconomy";
import { transitionSummary } from "../../data/energyTransition";
import { emissionEquivalents } from "../../ai/emissionEquivalents";
import "../transition/transition.css";
import "./gameOver.css";

/**
 * The end-of-game result: a verdict on the player's plan rather than a wall
 * of charts.
 *
 * Leads with what the plan achieved (fields retired, CO₂ avoided, energy
 * phased out) and what it cost (state revenue in national budgets), compares
 * the emission cut against MDG's plan, translates the cut into relatable
 * equivalents, and keeps the detail charts at the bottom for those who want
 * them.
 */
export function GameOverDialog() {
  const { phaseOut, restart } = useContext(ApplicationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isSmall = useIsSmallScreen();
  const from = location.state?.from?.pathname || "/map";

  const fieldsClosed = Object.keys(phaseOut).length;
  const fieldsTotal = gameData.allFields.length;

  const result = useMemo(() => {
    const baseline = cumulativeEmissions({});
    const avoidedTonnes = baseline - cumulativeEmissions(phaseOut);
    const mdgAvoidedTonnes = baseline - cumulativeEmissions(mdgPlan);
    return {
      avoidedTonnes,
      avoidedMt: Math.round(avoidedTonnes / 1_000_000),
      cutPercent: Math.round((avoidedTonnes / baseline) * 100),
      mdgCutPercent: Math.round((mdgAvoidedTonnes / baseline) * 100),
    };
  }, [phaseOut]);

  const economy = useMemo(() => economySummary(phaseOut), [phaseOut]);
  const energy = useMemo(() => transitionSummary(phaseOut), [phaseOut]);
  const equivalents = useMemo(
    () => emissionEquivalents(result.avoidedTonnes),
    [result.avoidedTonnes],
  );

  const verdict =
    fieldsClosed === 0
      ? "Ingen felter fikk sluttdato, så alle kutt du ser kommer fra naturlig nedgang. Prøv igjen og se hvor mye mer en plan får til."
      : result.cutPercent >= result.mdgCutPercent
        ? `Planen din er minst like ambisiøs som MDG-planen – du avviklet ${fieldsClosed} av ${fieldsTotal} felter og kuttet de samlede utslippene frem mot 2040 med ${result.cutPercent} %.`
        : `Du avviklet ${fieldsClosed} av ${fieldsTotal} felter og kuttet de samlede utslippene frem mot 2040 med ${result.cutPercent} %. MDG-planen når ${result.mdgCutPercent} % – se hvilke felter som gjenstår.`;

  const compareMax = Math.max(result.cutPercent, result.mdgCutPercent, 1);

  return (
    <Dialog open={true} onClose={() => navigate(from)}>
      <div className={"game-over"}>
        <div
          style={{
            display: isSmall ? "block" : "none",
            position: "fixed",
            top: "0.5rem",
            right: "0.5rem",
            zIndex: "3",
          }}
        >
          <button
            onClick={() => navigate("/map", { state: { from: location } })}
            title="Tilbake"
          >
            X
          </button>
        </div>

        <h2 style={{ marginBottom: "0.25rem" }}>🏁 2040 – slik gikk det</h2>
        <p className="verdict">{verdict}</p>

        <div className="transition-stats">
          <div className="transition-stat highlight">
            <div className="emoji">🌍</div>
            <div className="value">−{result.cutPercent} %</div>
            <div>
              utslipp 2025–2040 – {result.avoidedMt.toLocaleString("nb-NO")}{" "}
              millioner tonn CO₂ unngått
            </div>
          </div>
          <div className="transition-stat">
            <div className="emoji">🛢️</div>
            <div className="value">
              {fieldsClosed} av {fieldsTotal}
            </div>
            <div>felter fikk en sluttdato i planen din</div>
          </div>
          <div className="transition-stat">
            <div className="emoji">⚡</div>
            <div className="value">{energy.phasedOutTwh} TWh</div>
            <div>
              fossil energi borte i 2040 – nytten erstattes av ~
              {energy.replacementTwh} TWh ren strøm
            </div>
          </div>
          <div className="transition-stat">
            <div className="emoji">💰</div>
            <div className="value">
              ~{economy.cumulativeLostStateRevenueBnNok.toLocaleString("nb-NO")}{" "}
              mrd kr
            </div>
            <div>
              tapte statsinntekter over hele perioden ≈{" "}
              {economy.stateBudgetMultiple.toLocaleString("nb-NO")}{" "}
              statsbudsjett
            </div>
          </div>
        </div>

        <h3 style={{ marginBottom: "0.25rem", marginTop: "1rem" }}>
          Din plan mot MDG-planen
        </h3>
        <div className="result-compare">
          <div className="row mine">
            <span>Din plan</span>
            <div className="bar">
              <div
                className="fill"
                style={{ width: `${(result.cutPercent / compareMax) * 100}%` }}
              />
            </div>
            <span className="value">−{result.cutPercent} %</span>
          </div>
          <div className="row">
            <span>MDG-planen</span>
            <div className="bar">
              <div
                className="fill"
                style={{
                  width: `${(result.mdgCutPercent / compareMax) * 100}%`,
                }}
              />
            </div>
            <span className="value">−{result.mdgCutPercent} %</span>
          </div>
        </div>

        {equivalents.length > 0 && (
          <>
            <h3 style={{ marginBottom: "0.25rem" }}>Kuttet ditt tilsvarer</h3>
            <ul className="result-equivalents">
              {equivalents.map((eq) => (
                <li key={eq.label}>
                  {eq.emoji} <strong>{eq.amount}</strong> {eq.label}
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 style={{ marginBottom: "0.5rem" }}>Detaljene bak tallene</h3>
        <div className={"charts"}>
          <div>
            <ProductionReductionChart phaseOut={phaseOut} />
          </div>
          <div>
            <EmissionStackedBarChart phaseOut={phaseOut} />
          </div>
        </div>

        <div
          className="button-row"
          style={{ marginBottom: "0.5rem", marginTop: "1rem" }}
        >
          <div>
            <button
              onClick={() => navigate("/advisor")}
              style={{ fontSize: "1.25em" }}
            >
              💡 Få rådgiverens dom
            </button>
          </div>
          <div>
            <button
              onClick={() => navigate("/map")}
              style={{ fontSize: "1.25em" }}
            >
              🔍 Se planen på kartet
            </button>
          </div>
          <div>
            <button
              onClick={() => navigate("/transition")}
              style={{ fontSize: "1.25em" }}
            >
              🔋 Se hva som erstatter oljen
            </button>
          </div>
          <div>
            <button onClick={restart} style={{ fontSize: "1.25em" }}>
              ↺ Prøv på nytt
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
