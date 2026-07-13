import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { planForEndYear } from "../../data/simplePlan";
import {
  economySummary,
  STATE_BUDGET_BN_NOK,
} from "../../data/petroleumEconomy";
import { transitionSummary } from "../../data/energyTransition";
import { cumulativeEmissions } from "../../analysis/fieldStats";
import { energyData } from "../../generated/energyData";
import {
  MAINLAND_EXPORT_BN_NOK,
  OIL_FUND_BN_NOK,
  RESERVOIR_CAPACITY_TWH,
} from "../../data/norwayFacts";
import { SourcesNote } from "../ui/sourcesNote";
import "../transition/transition.css";
import "./costPage.css";

/** Oil price assumption, scaling all kroner figures */
const PRICE_LEVELS = [
  { key: "low", label: "Lav (−30 %)", factor: 0.7 },
  { key: "today", label: "Dagens", factor: 1 },
  { key: "high", label: "Høy (+30 %)", factor: 1.3 },
] as const;

const PRESETS = [
  { endYear: 2035, label: "Raskt: alt stengt 2035" },
  { endYear: 2040, label: "MDG-planen: alt stengt 2040" },
] as const;

/**
 * The cost calculator page.
 *
 * Answers the question people actually have — "what would phasing out the
 * oil cost, and what do we get?" — from two simple controls, with MDG's
 * plan as the default. The game and the full calculations are one click
 * deeper. The gains and the reassurance are written as prose, not tiles.
 */
export function CostPage() {
  const navigate = useNavigate();
  const [endYear, setEndYear] = useState(2040);
  const [price, setPrice] = useState<(typeof PRICE_LEVELS)[number]>(
    PRICE_LEVELS[1],
  );

  const plan = useMemo(() => planForEndYear(endYear), [endYear]);
  const economy = useMemo(() => economySummary(plan), [plan]);
  const energy = useMemo(() => transitionSummary(plan), [plan]);
  const avoidedMt = useMemo(
    () =>
      Math.round(
        (cumulativeEmissions({}) - cumulativeEmissions(plan)) / 1_000_000,
      ),
    [plan],
  );

  const factor = price.factor;
  const cumulative = Math.round(
    economy.cumulativeLostStateRevenueBnNok * factor,
  );
  const budgets = Math.round((cumulative / STATE_BUDGET_BN_NOK) * 10) / 10;
  const perCapitaMonthly =
    Math.round((economy.perCapitaKr * factor) / 12 / 10) * 10;
  const naturalPercent = Math.round(economy.naturalDeclineShare * 100);

  return (
    <div className="front-page">
      <div className="front-hero">
        <h1>Hva koster det egentlig å fase ut oljen?</h1>
        <div className="subtitle">
          Mindre enn du tror. Velg tempo og se regnestykket – bygget på åpne
          tall fra SSB og Norsk Petroleum.
        </div>
      </div>

      <div className="front-controls">
        <div className="control-row">
          <div>
            <label htmlFor="front-endyear">
              <strong>Når stenges det siste feltet?</strong>{" "}
              <span className="endyear-value">{endYear}</span>
            </label>
            <input
              id="front-endyear"
              type="range"
              min={2030}
              max={2040}
              step={1}
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value))}
            />
            <div className="chips">
              {PRESETS.map((preset) => (
                <button
                  key={preset.endYear}
                  className={endYear === preset.endYear ? "active" : ""}
                  onClick={() => setEndYear(preset.endYear)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <strong>Oljepris fremover</strong>
            <div className="chips">
              {PRICE_LEVELS.map((level) => (
                <button
                  key={level.key}
                  className={price.key === level.key ? "active" : ""}
                  onClick={() => setPrice(level)}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="front-answer">
        <div>Hele regningen for staten, 2025–2040:</div>
        <div className="big-number">
          {budgets.toLocaleString("nb-NO")} statsbudsjett
        </div>
        <div className="big-label">
          fordelt over 15 år. Det er overkommelig.
        </div>
        <div className="sub-numbers">
          <div>
            <div className="value">
              {cumulative.toLocaleString("nb-NO")} mrd
            </div>
            <div>kroner mindre spart i Oljefondet over hele perioden</div>
          </div>
          <div>
            <div className="value">
              ~{perCapitaMonthly.toLocaleString("nb-NO")} kr
            </div>
            <div>per innbygger per måned i 2040</div>
          </div>
          <div>
            <div className="value">0 kr</div>
            <div>
              kuttes fra dagens velferd – oljeinntektene går til sparing i
              Oljefondet, så det er sparingen som bremses, ikke forbruket
            </div>
          </div>
        </div>
      </div>

      <div className="front-note">
        Det viktigste tallet er et annet: <strong>{naturalPercent} %</strong> av
        dagens produksjon forsvinner uansett innen 2040, fordi feltene tømmes.
        Regningen over er bare forskjellen planen utgjør. Spørsmålet er ikke{" "}
        <em>om</em> inntektene skal erstattes – men om vi begynner å bygge
        erstatningen nå.
      </div>

      <h3>Dette får vi igjen</h3>
      <div className="front-prose">
        <p>
          Det viktigste først: klimaet. Planen unngår{" "}
          <strong>
            {avoidedMt.toLocaleString("nb-NO")} millioner tonn CO₂
          </strong>{" "}
          frem mot 2040 – som å ta{" "}
          {Math.round(avoidedMt / 2).toLocaleString("nb-NO")} millioner
          bensinbiler av veien i et helt år.
        </p>
        <p>
          Så energien. Plattformene bruker i dag{" "}
          <strong>
            {energyData.electricity.oilGasConsumptionTwh} TWh strøm
          </strong>{" "}
          – mot {energyData.electricity.windProductionTwh} TWh fra all norsk
          vindkraft – og den frigjøres når feltene stenges. Og å erstatte selve
          oljen krever mindre enn man skulle tro:{" "}
          <strong>
            {energy.replacementTwh.toLocaleString("nb-NO")} TWh ren strøm
          </strong>{" "}
          gir samme nytte som all energien sokkelen ellers ville levert i 2040,
          fordi to tredjedeler av fossil energi uansett går tapt som varme i
          eksos og kraftverk. Kraften og kompetansen fra sokkelen kan i stedet
          bygge ny eksport: havvind, hydrogen og grønn industri.
        </p>
      </div>

      <h3>Og Norge står støtt uansett</h3>
      <div className="front-prose">
        <p>
          Oljefondet er verdt rundt{" "}
          <strong>{OIL_FUND_BN_NOK.toLocaleString("nb-NO")} milliarder</strong>{" "}
          – over 30 år med dagens oljeinntekter står allerede i banken, og det
          er akkurat denne overgangen fondet er til for. Vannmagasinene våre kan
          lagre <strong>{RESERVOIR_CAPACITY_TWH} TWh</strong>, omtrent
          halvparten av all magasinkapasitet i Europa – vi kan kjøpe billig
          vindkraft når det blåser og selge vannkraft dyrt når det er stille.
        </p>
        <p>
          <strong>98 %</strong> av strømmen vår er allerede fornybar, og vi
          produserer mer enn vi bruker (
          {energyData.electricity.productionTwh.toLocaleString("nb-NO")} mot{" "}
          {energyData.electricity.consumptionTwh.toLocaleString("nb-NO")} TWh).
          Og fastlandet eksporterte varer for{" "}
          <strong>
            {MAINLAND_EXPORT_BN_NOK.toLocaleString("nb-NO")} milliarder
          </strong>{" "}
          i 2025 – sjømat, industri, kraft og teknologi, uten å regne med
          tjenestene. Omstillingen bygger videre på noe som finnes. Få land er
          bedre rustet.
        </p>
      </div>

      <div className="front-cta">
        <button className="primary" onClick={() => navigate("/transition")}>
          Se hele regnestykket
        </button>
        <button onClick={() => navigate("/map")}>
          Lag din egen plan – spill Oljespillet
        </button>
      </div>

      <div className="front-disclaimer">
        Planen bak tallene stenger de mest forurensende feltene først, jevnt
        fordelt frem til året du velger.
      </div>
      <SourcesNote />
    </div>
  );
}
