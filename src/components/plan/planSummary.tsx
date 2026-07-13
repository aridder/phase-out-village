import React, { useContext, useMemo, useState } from "react";
import { ApplicationContext } from "../../applicationContext";
import { EmissionSummaryPage } from "../emissions/emissionSummaryPage";
import { ProductionSummaryPage } from "../production/productionSummaryPage";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { decodePlan, planShareUrl } from "../../data/planShare";
import {
  gameData,
  oilEquivalentToBarrel,
  sumOverYears,
  totalProduction,
} from "../../data/gameData";
import { PlanProgressionBar } from "../ui/planProgressionBar";
import "./plan.css";

/**
 * Displays a summary of the user's plan, including charts for
 * production reduction and emission over time based on the phase-out schedule.
 */
export function PlanSummary() {
  const {
    year,
    phaseOut: ownPlan,
    setPhaseOut,
  } = useContext(ApplicationContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [copied, setCopied] = useState(false);

  // A plan shared via link ("?delt=...") is shown instead of the player's own
  const sharedParam = searchParams.get("delt");
  const sharedPlan = useMemo(
    () => (sharedParam ? decodePlan(sharedParam) : undefined),
    [sharedParam],
  );
  const isSharedView = !!sharedPlan && Object.keys(sharedPlan).length > 0;
  const phaseOut = isSharedView ? sharedPlan! : ownPlan;

  /** Copies a share link for the player's own plan to the clipboard. */
  async function sharePlan() {
    await navigator.clipboard.writeText(planShareUrl(ownPlan));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  /** Adopts the shared plan as the player's own and leaves the shared view. */
  function adoptSharedPlan() {
    setPhaseOut(sharedPlan!);
    navigate("/plan");
  }

  // Emission summary data
  const years = gameData.gameYears;
  const baselineEm = sumOverYears(totalProduction({}, years), "emission");
  const baselineEmRounded = Math.round(baselineEm / 1_000_000); // In millions of tons
  const currentEm = sumOverYears(totalProduction(phaseOut, years), "emission");
  const preventedEmRounded = Math.round((baselineEm - currentEm) / 1_000_000);
  const reductionEmPositive = Math.round(
    ((baselineEm - currentEm) / baselineEm) * 100,
  );

  // Production summary data
  const baselinePr = sumOverYears(
    totalProduction({}, gameData.gameYears),
    "totalProduction",
  );
  const baselinePrCalc = baselinePr * oilEquivalentToBarrel;
  const baselinePrRounded = Math.round((baselinePrCalc / 1_000) * 10) / 10;
  const currentPr = sumOverYears(
    totalProduction(phaseOut, gameData.gameYears),
    "totalProduction",
  );
  const currentPrCalc = currentPr * oilEquivalentToBarrel;
  const preventedPrRounded =
    Math.round(((baselinePrCalc - currentPrCalc) / 1_000) * 10) / 10;
  const reductionPrPositive = Math.round(
    ((baselinePrCalc - currentPrCalc) / baselinePrCalc) * 100,
  );

  return (
    <div className="plan-summary">
      <div className="close-corner">
        <button
          onClick={() => navigate("/map", { state: { from: location } })}
          title="Tilbake"
        >
          X
        </button>
      </div>

      <h2>{isSharedView ? "Delt plan" : "Din plan"}</h2>

      {isSharedView ? (
        <div className="shared-banner">
          <div className="message">
            📬 Noen har delt en utfasingsplan med deg! Den avvikler{" "}
            <strong>{Object.keys(sharedPlan!).length} felter</strong>. Du kan
            gjøre den til din egen plan, eller fortsette med din egen.
          </div>
          <button onClick={adoptSharedPlan}>Bruk som min plan</button>
          <button onClick={() => navigate("/plan")}>Vis min egen plan</button>
        </div>
      ) : (
        Object.keys(ownPlan).length > 0 && (
          <div>
            <button
              onClick={sharePlan}
              title="Kopier en delbar lenke til planen din"
            >
              {copied ? "✅ Lenke kopiert!" : "📤 Del planen din"}
            </button>
          </div>
        )
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <div>
            <div className="card-title">Utslippsreduksjon</div>
            <div className="card-lead">
              Uten inngrep vil oljefeltene produsere{" "}
              <strong>{baselineEmRounded} millioner tonn CO₂</strong> innen{" "}
              {gameData.allYears[gameData.allYears.length - 1]}.
            </div>
            <div className="card-result">
              {isSharedView ? "Denne planen" : "Din plan"} har så langt redusert
              utslipp med{" "}
              <strong>
                {preventedEmRounded} millioner tonn CO₂ ({reductionEmPositive}%)
              </strong>
              {parseInt(year) > 2025 ? "!" : "."}
            </div>
            <div className="card-meter">
              <PlanProgressionBar
                current={currentEm}
                baseline={baselineEm}
                mode="emission"
                includeDecimal={true}
                metricLabel={`millioner tonn CO₂`}
                size="medium"
                barColor="var(--gran)"
                endColor="var(--eple)"
                showMiddlePercentage={true}
                rightLabelType="prevented"
              />
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div>
            <div className="card-title">Produksjonsreduksjon</div>
            <div className="card-lead">
              Uten inngrep vil oljefeltene produsere{" "}
              <strong>
                {baselinePrRounded.toLocaleString("nb-NO")} milliarder fat olje
              </strong>{" "}
              innen {gameData.allYears[gameData.allYears.length - 1]}.
            </div>
            <div className="card-result">
              {isSharedView ? "Denne planen" : "Din plan"} har så langt redusert
              produksjonen med{" "}
              <strong>
                {preventedPrRounded.toLocaleString("nb-NO")} milliarder fat olje
                ({reductionPrPositive}
                %)
              </strong>
              {parseInt(year) > 2025 ? "!" : "."}
            </div>
            <div className="card-meter">
              <PlanProgressionBar
                current={currentPrCalc}
                baseline={baselinePrCalc}
                mode="production"
                includeDecimal={true}
                metricLabel={`milliarder fat olje`}
                size="medium"
                barColor="var(--gran)"
                endColor="var(--eple)"
                showMiddlePercentage={true}
                rightLabelType="prevented"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Utslipps- og produksjonsseksjonene viser fire ulike diagrammer;
          tidligere lå to av dem duplisert i en egen blokk over her */}
      <div className="charts-block">
        <h2>Utslipp</h2>
        <div>
          <EmissionSummaryPage phaseOut={phaseOut} />
        </div>
        <div className="divider"></div>
        <h2>Produksjon</h2>
        <div>
          <ProductionSummaryPage />
        </div>
      </div>
    </div>
  );
}
