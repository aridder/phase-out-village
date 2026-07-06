import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { planForEndYear } from "../../data/simplePlan";
import {
  economySummary,
  STATE_BUDGET_BN_NOK,
} from "../../data/petroleumEconomy";
import { transitionSummary } from "../../data/energyTransition";
import { cumulativeEmissions } from "../../ai/fieldStats";
import { energyData } from "../../generated/energyData";
import {
  MAINLAND_EXPORT_BN_NOK,
  OIL_FUND_BN_NOK,
  RESERVOIR_CAPACITY_TWH,
} from "../../data/norwayFacts";
import "../transition/transition.css";
import "./frontPage.css";

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
 * The answer-first front page.
 *
 * Instead of dropping the visitor into a map of oil fields, it answers the
 * question people actually have — "what would phasing out the oil cost, and
 * what do we get?" — from two simple controls, with MDG's plan as the
 * default. The game and the full calculations are one click deeper.
 */
export function FrontPage() {
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
              <span style={{ fontSize: "1.2em" }}>{endYear}</span>
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
            <div>kroner totalt i redusert sparing</div>
          </div>
          <div>
            <div className="value">
              ~{perCapitaMonthly.toLocaleString("nb-NO")} kr
            </div>
            <div>per innbygger per måned i 2040</div>
          </div>
          <div>
            <div className="value">0 kr</div>
            <div>kuttes fra dagens velferd – det er sparingen som bremses</div>
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
      <div className="transition-stats">
        <div className="transition-stat highlight">
          <div className="emoji">🌍</div>
          <div className="value">{avoidedMt.toLocaleString("nb-NO")} Mt</div>
          <div>
            CO₂ unngås frem mot 2040 – som å ta{" "}
            {Math.round(avoidedMt / 2).toLocaleString("nb-NO")} millioner
            bensinbiler av veien i ett år
          </div>
        </div>
        <div className="transition-stat">
          <div className="emoji">⚡</div>
          <div className="value">
            {energyData.electricity.oilGasConsumptionTwh} TWh
          </div>
          <div>
            strøm frigjøres fra oljeplattformene – nesten like mye som all norsk
            vindkraft i dag
          </div>
        </div>
        <div className="transition-stat">
          <div className="emoji">🌬️</div>
          <div className="value">
            {energy.replacementTwh.toLocaleString("nb-NO")} TWh
          </div>
          <div>
            fornybar strøm gir samme nytte som hele oljeeksporten – bare 35 % av
            energimengden, fordi spillvarmen forsvinner
          </div>
        </div>
        <div className="transition-stat">
          <div className="emoji">🏭</div>
          <div className="value">Ny eksport</div>
          <div>
            kraften og kompetansen fra sokkelen gjenbrukes i havvind, hydrogen
            og grønn industri
          </div>
        </div>
      </div>

      <h3>Og Norge står støtt uansett</h3>
      <div className="transition-steps">
        <div className="transition-step">
          <div className="step-emoji">🏦</div>
          <h4>Verdens største buffer</h4>
          <div>
            Oljefondet er verdt rundt{" "}
            <strong>
              {OIL_FUND_BN_NOK.toLocaleString("nb-NO")} milliarder
            </strong>{" "}
            – omtrent 30 år med dagens oljeinntekter er allerede i banken. Det
            er dette fondet er til.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🔋</div>
          <h4>Europas batteribank</h4>
          <div>
            Vannmagasinene våre kan lagre{" "}
            <strong>{RESERVOIR_CAPACITY_TWH} TWh</strong> – omtrent halvparten
            av all magasinkapasitet i Europa. Vi kan kjøpe billig vindkraft når
            det blåser, og selge vannkraft dyrt når det er stille.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">💧</div>
          <h4>Ren kraft og overskudd</h4>
          <div>
            <strong>98 %</strong> av strømmen vår er allerede fornybar, og vi
            produserer mer enn vi bruker (
            {energyData.electricity.productionTwh.toLocaleString("nb-NO")} mot{" "}
            {energyData.electricity.consumptionTwh.toLocaleString("nb-NO")}{" "}
            TWh). Få land er bedre rustet for et elektrisk århundre.
          </div>
        </div>
        <div className="transition-step">
          <div className="step-emoji">🐟</div>
          <h4>Mer enn olje</h4>
          <div>
            Fastlandet eksporterer allerede for rundt{" "}
            <strong>
              {MAINLAND_EXPORT_BN_NOK.toLocaleString("nb-NO")} milliarder
            </strong>{" "}
            i året – sjømat, industri, kraft og teknologi. Omstillingen bygger
            videre på noe som finnes.
          </div>
        </div>
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
        fordelt frem til året du velger. Kroner er regnet med dagens priser og
        verdi per produsert enhet (statens netto kontantstrøm ~661 mrd, Norsk
        Petroleum 2024; eksportverdier fra SSB). Statsbudsjettets utgifter ~
        {STATE_BUDGET_BN_NOK.toLocaleString("nb-NO")} mrd (2025). Magasin- og
        fondstall: NVE og NBIM. Alt er forenklede anslag for å vise
        størrelsesorden.
      </div>
    </div>
  );
}
